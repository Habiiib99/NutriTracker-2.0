
import express from 'express';
import sql from 'mssql';
import { dbConfig } from '../config/database.js'; // Importér databasekonfigurationen

// importere calculateBMR funktionen
import calculateBMR from '../utils/bmrCalculator.js';

const app = express.Router();

// Endpoint til at registrere en bruger
app.post('/register', async (req, res) => {
  const { name, password, age, weight, gender, email } = req.body;
  console.log(req.body);

  try {
    const pool = await sql.connect(dbConfig);
    const user = await pool.request()
      .input('email', sql.VarChar, email)
      .query('SELECT userId FROM profiles WHERE email = @email');

    if (user.recordset.length !== 0) {
      console.log(user.recordset.length);
      return res.status(400).json({ message: 'En bruger med den email eksisterer allerede' });
    }

    // Siden userId er en IDENTITY kolonne, behøver du ikke at sætte den her.
    const result = await pool.request()
      .input('name', sql.VarChar, name)
      .input('age', sql.Int, age)
      .input('gender', sql.VarChar, gender)
      .input('weight', sql.Decimal(5, 2), weight)
      .input('email', sql.VarChar, email)
      .input('password', sql.VarChar, password)
      .input('bmr', sql.Decimal(5, 4), calculateBMR(weight, age, gender))
      .query('INSERT INTO profiles (name, age, gender, weight, email, password, bmr) OUTPUT INSERTED.userId VALUES (@name, @age, @gender, @weight, @email, @password, @bmr)');

    // Bruger OUTPUT INSERTED.userId for at få den genererede ID
    res.status(201).json({ message: 'Bruger oprettet', id: result.recordset[0].userId });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Serverfejl ved forsøg på registrering', error: error.message });
  }
});

// Endpoint til at logge ind
app.post('/login', async (req, res) => {
  const { email, password } = req.body;
  console.log(req.body)

  try {
    const pool = await sql.connect(dbConfig);
    const user = await pool.request()
      .input('email', sql.VarChar, email)
      .query('SELECT userId, name, age, gender, weight, email, password, bmr FROM profiles WHERE email = @email');

    if (user.recordset.length === 0) {
      console.log(user.recordset.length)
      return res.status(404).json({ message: 'Ugyldig email' });
    }
    console.log(user.recordset)
    if (user.recordset[0].password != password) {
      return res.status(401).json({ message: 'Ugyldigt password' });
    }

    delete user.recordset[0].password
    res.status(200).json({ message: 'Login succesfuldt', user: user.recordset[0] })

  } catch (error) {
    console.error('Error during login:', error);
    res.status(500).json({ message: 'Serverfejl ved forsøg på login', error: error.message });
  }
});

// Eksportér routeren som standard
export default app;

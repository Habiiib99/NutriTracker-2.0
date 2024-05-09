
import express from 'express';
import sql from 'mssql';
import { dbConfig } from '../config/database.js'; // Importér databasekonfigurationen

// importere calculateBMR funktionen
import calculateBMR from '../utils/bmrCalculator.js';

const app = express.Router();



// opdater brugeroplysninger
app.put('/api/users/:userId', async (req, res) => {
    const { userId } = req.params;
    const { name, age, gender, weight, email } = req.body;
  
    try {
      const pool = await sql.connect(dbConfig);
  
      // Beregn den nye BMR baseret på opdaterede vægt, alder, og køn
      const bmr = calculateBMR(weight, age, gender);
  
      const result = await pool.request()
        .input('userId', sql.Int, userId)
        .input('name', sql.VarChar, name)
        .input('age', sql.Int, age)
        .input('gender', sql.VarChar, gender)
        .input('weight', sql.Decimal(5, 2), weight)
        .input('email', sql.VarChar, email)
        .input('bmr', sql.Decimal(10, 4), bmr)  // Tilføj BMR som input parameter
        .query('UPDATE profiles SET name = @name, age = @age, gender = @gender, weight = @weight, email = @email, bmr = @bmr WHERE userId = @userId');
  
      if (result.rowsAffected[0] > 0) {
        res.status(200).json({ message: 'Bruger opdateret', bmr: bmr });
      } else {
        res.status(404).json({ message: 'Bruger ikke fundet' });
      }
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Server fejl', error: error.message });
    }
  });
  
  
  
  app.delete('/delete/:userId', async (req, res) => {
    console.log(req.params)
    const { userId } = req.params
  
    const pool = await sql.connect(dbConfig)
  
    pool.request().input('userId', sql.Int, userId)
      .query('DELETE FROM meals WHERE userId = @userId').then(() => {
  
        pool
          .request()
          .input('userId', sql.Int, userId)
          .query('DELETE FROM profiles WHERE userId = @userId').then((result) => {
            return res.status(201).json({ message: 'Bruger slettet' })
          }).catch((error) => {
            return res.status(500).json({
              message: 'Serverfejl ved forsøg på sletning af bruger', error: error,
            })
          })
      })
  });

export default app;
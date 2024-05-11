import express from 'express'; // Importér express til at oprette en router til endpoints i applikationen. 
// Express er et minimalt og fleksibelt Node.js webapplikationsframework, der giver et kraftfuldt sæt funktioner til udvikling af web- og mobilapplikationer.
// Express er designet til at hjælpe med at organisere en webapplikation i et MVC-arkitekturmønster på serveren.
// Express giver en række kraftfulde funktioner til udvikling af webapplikationer og API'er.

import sql from 'mssql'; // Importér mssql til at oprette forbindelse til databasen
import { dbConfig } from '../config/database.js'; // Importér databasekonfigurationen

// importere calculateBMR funktionen
import calculateBMR from '../utils/bmrCalculator.js';

const app = express.Router(); // Opretter en router

// Endpoint til at registrere en bruger
app.post('/register', async (req, res) => { // POST-endpoint til registrering
  const { name, password, age, weight, gender, email } = req.body; // Destrukturerer request body
  console.log(req.body); // Udskriver request body til konsollen

  // Validerer at alle felter er udfyldt
  try {
    // ** Pool er en måde at oprette forbindelse til databasen på ved at bruge dbConfig objektet fra database.js og derefter udføre forespørgsler
    const pool = await sql.connect(dbConfig); // Opretter forbindelse til databasen via dbConfig objektet fra database.js
    const user = await pool.request() // Anmoder om en forespørgsel til databasen for at tjekke om brugeren allerede eksisterer 
      .input('email', sql.VarChar, email) // Indsætter email fra request body som parameter til forespørgslen 
      .query('SELECT userId FROM profiles WHERE email = @email'); // Vælger userId fra profiles tabellen hvor email matcher email fra request body 

      // Hvis brugeren allerede eksisterer, returneres en fejlmeddelelse
    if (user.recordset.length !== 0) { // Hvis der er en bruger med den email i databasen 
      console.log(user.recordset.length); // Udskrives antal brugere med den email til konsollen
      return res.status(400).json({ message: 'En bruger med den email eksisterer allerede' }); // Returnerer en fejlmeddelelse 
    }

    // Siden userId er en IDENTITY kolonne, behøver du ikke at sætte den her.
    const result = await pool.request() // Anmoder om en forespørgsel til databasen for at indsætte en ny bruger
      .input('name', sql.VarChar, name) // Indsætter name fra request body som parameter til forespørgslen
      .input('age', sql.Int, age) // Indsætter age fra request body som parameter til forespørgslen
      .input('gender', sql.VarChar, gender) // Indsætter gender fra request body som parameter til forespørgslen
      .input('weight', sql.Decimal(5, 2), weight) // Indsætter weight fra request body som parameter til forespørgslen
      .input('email', sql.VarChar, email) // Indsætter email fra request body som parameter til forespørgslen
      .input('password', sql.VarChar, password) // Indsætter password fra request body som parameter til forespørgslen
      .input('bmr', sql.Decimal(5, 4), calculateBMR(weight, age, gender)) // Indsætter bmr fra calculateBMR funktionen som parameter til forespørgslen

      // Indsætter værdierne fra request body i profiles tabellen og returnerer userId for den nye bruger 
      .query('INSERT INTO profiles (name, age, gender, weight, email, password, bmr) OUTPUT INSERTED.userId VALUES (@name, @age, @gender, @weight, @email, @password, @bmr)'); 

    // Bruger OUTPUT INSERTED.userId for at få den genererede ID
    res.status(201).json({ message: 'Bruger oprettet', id: result.recordset[0].userId }); // Returnerer en succesmeddelelse og userId for den nye bruger

  } catch (error) { // Hvis der opstår en fejl under registreringen
    console.error(error); // Udskriver fejlmeddelelsen til konsollen
    res.status(500).json({ message: 'Serverfejl ved forsøg på registrering', error: error.message }); // Returnerer en fejlmeddelelse
  }
});

// Endpoint til at logge ind
app.post('/login', async (req, res) => { // POST-endpoint til login 
  const { email, password } = req.body; // Destrukturerer request body til email og password
  console.log(req.body) // Udskriver request body til konsollen

  // Validerer at email og password er udfyldt
  try {
    // Opretter en pool til at oprette forbindelse til databasen for at undgå at skulle oprette forbindelse hver gang 
    const pool = await sql.connect(dbConfig); // Opretter forbindelse til databasen via dbConfig objektet fra database.js
    const user = await pool.request() // Anmoder om en forespørgsel til databasen for at finde brugeren i databasen
      .input('email', sql.VarChar, email) // Indsætter email fra request body som parameter til forespørgslen
      .query('SELECT userId, name, age, gender, weight, email, password, bmr FROM profiles WHERE email = @email'); // Vælger userId fra profiles tabellen hvor email matcher email fra request body

      // Hvis brugeren ikke findes, returneres en fejlmeddelelse
    if (user.recordset.length === 0) {
      console.log(user.recordset.length)
      return res.status(404).json({ message: 'Ugyldig email' });
    }

    // Hvis password ikke matcher, returneres en fejlmeddelelse
    console.log(user.recordset)
    if (user.recordset[0].password != password) {
      return res.status(401).json({ message: 'Ugyldigt password' });
    }

    delete user.recordset[0].password // Sletter password fra brugerobjektet for at undgå at sende det tilbage til klienten
    res.status(200).json({ message: 'Login succesfuldt', user: user.recordset[0] }) // Returnerer en succesmeddelelse og brugeroplysninger

  } catch (error) { // Hvis der opstår en fejl under login
    console.error('Error during login:', error); // Udskriver fejlmeddelelsen til konsollen
    res.status(500).json({ message: 'Serverfejl ved forsøg på login', error: error.message }); // Returnerer en fejlmeddelelse
  }
});

// Eksportér routeren som standard
export default app; 

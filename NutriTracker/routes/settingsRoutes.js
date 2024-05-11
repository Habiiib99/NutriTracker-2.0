import express from 'express'; // Importér express til at oprette en router til endpoints i applikationen. 
// Express er et minimalt og fleksibelt Node.js webapplikationsframework, der giver et kraftfuldt sæt funktioner til udvikling af web- og mobilapplikationer.
// Express er designet til at hjælpe med at organisere en webapplikation i et MVC-arkitekturmønster på serveren.
// Express giver en række kraftfulde funktioner til udvikling af webapplikationer og API'er.

import sql from 'mssql'; // Importér mssql til at oprette forbindelse til databasen
import { dbConfig } from '../config/database.js'; // Importér databasekonfigurationen

// importere calculateBMR funktionen
import calculateBMR from '../utils/bmrCalculator.js';

// Opretter en router til endpoints i applikationen
const app = express.Router(); // router er en del af express, som bruges til at oprette endpoints i applikationen
// router fungere som en mini-applikation med mulighed for at definere middleware og routes
// router kan bruges til at gruppere routes og middleware, så det er nemmere at håndtere og konfigurere
// det er vigtigt at huske at eksportere routeren, så den kan bruges i andre filer


// opdater brugeroplysninger
app.put('/api/users/:userId', async (req, res) => {
    const { userId } = req.params; // BrugerId fra URL
    const { name, age, gender, weight, email } = req.body; // Brugeroplysninger fra request body
  
    // try catch blok til at håndtere fejl under opdatering af brugeroplysninger
    try {
      const pool = await sql.connect(dbConfig); // Opret forbindelse til databasen
      // pool er en god måde at forbinde til databasen på, da det er en mere effektiv måde at forbinde til databasen på, da det genbruger forbindelserne.
      // Dette forhindrer, at der oprettes en ny forbindelse til databasen hver gang en forespørgsel sendes til databasen.
  
      // Beregn den nye BMR baseret på opdaterede vægt, alder, og køn
      const bmr = calculateBMR(weight, age, gender);
  
      const result = await pool.request() // Opdater brugeroplysninger i databasen. Anmoder om en forespørgsel til databasen for at opdatere brugeroplysninger. 
        .input('userId', sql.Int, userId) // Indsætter userId fra URL som parameter til forespørgslen
        .input('name', sql.VarChar, name) // Indsætter name fra request body som parameter til forespørgslen
        .input('age', sql.Int, age) // Indsætter age fra request body som parameter til forespørgslen
        .input('gender', sql.VarChar, gender) // Indsætter gender fra request body som parameter til forespørgslen
        .input('weight', sql.Decimal(5, 2), weight) // Indsætter weight fra request body som parameter til forespørgslen
        .input('email', sql.VarChar, email) // Indsætter email fra request body som parameter til forespørgslen
        .input('bmr', sql.Decimal(10, 4), bmr)  // Tilføj BMR som input parameter
        
        // query bruges til at udføre en forespørgsel til databasen - i dette tilfælde en UPDATE forespørgsel
        // Her bruges '@' foran variabelnavnene, som bruges til at erstatte variablerne med de faktiske værdier
        .query('UPDATE profiles SET name = @name, age = @age, gender = @gender, weight = @weight, email = @email, bmr = @bmr WHERE userId = @userId');
  
        // Tjek om brugeren blev opdateret korrekt
      if (result.rowsAffected[0] > 0) {
        res.status(200).json({ message: 'Bruger opdateret', bmr: bmr }); // Returnerer en succesmeddelelse og den nye BMR-værdi
      } else { // Hvis brugeren ikke blev fundet
        res.status(404).json({ message: 'Bruger ikke fundet' }); // Returnerer en fejlmeddelelse, hvis brugeren ikke blev fundet
      }
    } catch (error) { // Hvis der opstår en fejl under opdatering af brugeroplysninger
      console.error(error); // Udskriver fejlmeddelelsen til konsollen
      res.status(500).json({ message: 'Server fejl', error: error.message }); // Returnerer en fejlmeddelelse
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

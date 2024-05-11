import express from 'express'; // Importér express til at oprette en router til endpoints i applikationen. 
// Express er et minimalt og fleksibelt Node.js webapplikationsframework, der giver et kraftfuldt sæt funktioner til udvikling af web- og mobilapplikationer.
// Express er designet til at hjælpe med at organisere en webapplikation i et MVC-arkitekturmønster på serveren.
// Express giver en række kraftfulde funktioner til udvikling af webapplikationer og API'er.

import sql from 'mssql'; // Importér mssql til at oprette forbindelse til databasen
import { dbConfig } from '../config/database.js'; // Importér databasekonfigurationen

// Opretter en router til endpoints i applikationen
const app = express.Router(); // router er en del af express, som bruges til at oprette endpoints i applikationen
// router fungere som en mini-applikation med mulighed for at definere middleware og routes
// router kan bruges til at gruppere routes og middleware, så det er nemmere at håndtere og konfigurere
// det er vigtigt at huske at eksportere routeren, så den kan bruges i andre filer


// Endpoint for at hente alle måltider
app.get('/api/meals', async (req, res) => {
    try {
      // Opret forbindelse til databasen
      const pool = await sql.connect(dbConfig); // Opret forbindelse til databasen ved hjælp af dbConfig
      // pool er en god måde at forbinde til databasen på, da det er en mere effektiv måde at forbinde til databasen på, da det genbruger forbindelserne.
      // Dette forhindrer, at der oprettes en ny forbindelse til databasen hver gang en forespørgsel sendes til databasen.
  
      // Udfør SQL-forespørgsel for at hente alle måltider
      const mealsQuery = 'SELECT mealId, mealName, userId, kcal, protein, fat, fiber FROM meals'; // SQL-forespørgsel for at hente alle måltider
      const result = await pool.request().query(mealsQuery); // Udfør SQL-forespørgslen og gem resultatet i variablen result

      // Send resultatet som JSON
      // JSON (JavaScript Object Notation) er et letvægtsdataudvekslingsformat, der er let at læse og skrive for mennesker og nemt at behandle for maskiner
      // JSON bruges til at udveksle data mellem en browser og en server
      // JSON hjælper med at overføre data mellem en server og en browser på et struktureret og organiseret måde
      res.json(result.recordset);
    } catch (error) { // Hvis der opstår en fejl
      console.error('Fejl ved hentning af måltider:', error); // Udskriv fejlen til konsollen
      res.status(500).json({ message: 'Server fejl ved hentning af måltider', error: error.message }); // Send en fejlbesked til klienten
    }
  });
  
  
  // Endpoint for at hente den samlede vægt af en måltid
  app.get('/api/meals/weight/:mealId', async (req, res) => {
    const { mealId } = req.params; // Hent mealId fra URL-parametrene
    try { // Prøv at hente vægten af måltidet
      const pool = await sql.connect(dbConfig); // Opret forbindelse til databasen
      // pool er en god måde at forbinde til databasen på, da det er en mere effektiv måde at forbinde til databasen på, da det genbruger forbindelserne.
  
      // Hent ingredienserne til måltidet
      // denne query bruges til at hente vægten af et måltid ved at summere vægten af alle ingredienserne i måltidet
      // vi bruger OPENJSON til at analysere JSON-data og hente værdierne fra JSON-objekter
      // desuden bruger vi WITH til at definere, hvordan JSON-data skal analyseres
      // vi bruger SUM til at summere vægten af alle ingredienserne i måltidet
      // vi bruger WHERE til at filtrere dataene baseret på betingelserne
      // vi bruger @mealId til at erstatte mealId med den faktiske værdi
      const query = `
        SELECT SUM(ingredient.weight) AS totalWeight
        FROM OPENJSON(
          (SELECT ingredients FROM meals WHERE mealId = @mealId)
        ) 
        WITH (
          ingredientId INT '$.ingredientId',
          weight DECIMAL(10,2) '$.weight'
        ) ingredient
      `;
      const result = await pool.request() // Udfør forespørgslen
        .input('mealId', sql.Int, mealId) // Tilføj mealId til input-parametre
        .query(query); // Udfør forespørgslen og gem resultatet i variablen result
  
      const totalWeight = result.recordset[0]?.totalWeight || 0; // Hent totalWeight fra resultatet eller sæt det til 0, hvis det ikke findes
      res.json({ mealId, totalWeight }); // Send totalWeight som JSON til klienten
    } catch (error) { // Hvis der opstår en fejl
      console.error('Fejl ved hentning af måltidets vægt:', error); // Udskriv fejlen til konsollen
      res.status(500).json({ message: 'Server fejl', error: error.message }); // Send en fejlbesked til klienten
    }
  });
  
  
  // Endpoint til at registrere et måltid i tracker-tabellen
  app.post('/api/meal-tracker/track-meal', async (req, res) => {
    // Destrukturer request body for at hente mealId, weight, userId, consumptionDate og location
    const { mealId, weight, userId, consumptionDate, location } = req.body;
  
    // Registrer måltid i tracker-tabellen
    try {
      const pool = await sql.connect(dbConfig); // Opret forbindelse til databasen ved hjælp af dbConfig
      // pool er en god måde at forbinde til databasen på, da det er en mere effektiv måde at forbinde til databasen på, da det genbruger forbindelserne.
      // Dette forhindrer, at der oprettes en ny forbindelse til databasen hver gang en forespørgsel sendes til databasen.

      // Indsæt registrering i tracker-tabellen
      // Her bruges '@' foran variabelnavnene, som bruges til at erstatte variablerne med de faktiske værdier
      // query bruges til at udføre en forespørgsel til databasen - i dette tilfælde en INSERT INTO forespørgsel
      // derudover viser values, hvilke værdier der skal indsættes i tabellen og i hvilken rækkefølge
      const query = `
        INSERT INTO dbo.tracker (mealId, weight, userId, consumptionDate, location)
        VALUES (@mealId, @weight, @userId, @consumptionDate, @location)
      `;
      await pool.request() // Udfør forespørgslen
        .input('mealId', sql.Int, mealId) // Tilføj mealId til input-parametre
        .input('weight', sql.Decimal(10, 2), weight) // Tilføj weight til input-parametre
        .input('userId', sql.Int, userId) // Tilføj userId til input-parametre
        .input('consumptionDate', sql.DateTime, new Date(consumptionDate)) // Tilføj consumptionDate til input-parametre
        .input('location', sql.VarChar(255), location) // Tilføj location til input-parametre
        .query(query); // Udfør forespørgslen
  
      res.status(201).json({ message: 'Måltid registreret i tracker-tabellen' }); // Send en succesmeddelelse til klienten
    } catch (error) { // Hvis der opstår en fejl
      console.error('Fejl ved registrering af måltid:', error); // Udskriv fejlen til konsollen
      res.status(500).json({ message: 'Serverfejl', error: error.message }); // Send en fejlbesked til klienten
    }
  });
  
  
  
  // Endpoint til at hente alle registrerede måltider fra tracker-tabellen for en given bruger
  app.get('/api/meal-tracker/intakes/:userId', async (req, res) => {
    const { userId } = req.params; // Hent userId fra URL-parametrene
    try {
      // Opret forbindelse til databasen
      const pool = await sql.connect(dbConfig); // pool er en god måde at forbinde til databasen på, da det er en mere effektiv måde at forbinde til databasen på, da det genbruger forbindelserne.
      // Dette forhindrer, at der oprettes en ny forbindelse til databasen hver gang en forespørgsel sendes til databasen.

      // Hent alle registrerede måltider fra tracker-tabellen for en given bruger
      // denne query bruges til at hente alle registrerede måltider fra tracker-tabellen for en given bruger
      // vi bruger JOIN til at kombinere data fra to tabeller baseret på en relateret kolonne mellem dem
      // vi bruger WHERE til at filtrere dataene baseret på betingelserne
      // vi bruger ORDER BY til at sortere dataene i stigende eller faldende rækkefølge
      // vi bruger @userId til at erstatte userId med den faktiske værdi
      const query = `
        SELECT t.trackerId, t.mealId, t.weight, t.consumptionDate, m.mealName, m.kcal, m.protein, m.fat, m.fiber
        FROM dbo.tracker t
        JOIN dbo.meals m ON t.mealId = m.mealId
        WHERE t.userId = @userId
        ORDER BY t.consumptionDate DESC
      `;
      // result er en variabel, der indeholder resultatet af en forespørgsel til databasen
      const result = await pool.request() // await bruges til at vente på, at et asynkront udtryk er fuldført
        .input('userId', sql.Int, userId) // Tilføj userId til input-parametre
        .query(query); // Udfør forespørgslen og gem resultatet i variablen result
  
      res.json(result.recordset); // Send resultatet som JSON til klienten
    } catch (error) { // Hvis der opstår en fejl
      console.error('Fejl ved hentning af måltider:', error); // Udskriv fejlen til konsollen
      res.status(500).json({ message: 'Serverfejl', error: error.message }); // Send en fejlbesked til klienten
    }
  });
  
  // Endpoint til at hente alle registrerede måltider fra tracker-tabellen for en given bruger
  app.get('/api/meal-tracker/intakes-ingredient/:userId', async (req, res) => {
    // Destrukturer userId fra URL-parametrene 
    const { userId } = req.params;
    // Hent alle registrerede måltider fra tracker-tabellen for en given bruger
    try {
      const pool = await sql.connect(dbConfig); // Opret forbindelse til databasen ved hjælp af dbConfig
      // pool er en god måde at forbinde til databasen på, da det er en mere effektiv måde at forbinde til databasen på, da det genbruger forbindelserne.
      // Dette forhindrer, at der oprettes en ny forbindelse til databasen hver gang en forespørgsel sendes til databasen.

      // Hent alle registrerede måltider fra tracker-tabellen for en given bruger
      // denne query bruges til at hente alle registrerede måltider fra tracker-tabellen for en given bruger
      // vi bruger JOIN til at kombinere data fra tre tabeller baseret på en relateret kolonne mellem dem
      // vi bruger WHERE til at filtrere dataene baseret på betingelserne
      // vi bruger ORDER BY til at sortere dataene i stigende eller faldende rækkefølge
      // vi bruger @userId til at erstatte userId med den faktiske værdi
      // vi bruger FROM til at vælge tabellerne, som dataene skal hentes fra
      const query = `
        SELECT t.trackerId, t.mealIngredientId, t.weight, t.consumptionDate, 
               mi.ingredientId, mi.weightOfIngredient,
               i.ingredient, i.kcal, i.protein, i.fat, i.fiber
        FROM dbo.tracker t
        JOIN dbo.meal_ingredients mi ON t.mealIngredientId = mi.mealIngredientId
        JOIN dbo.ingredients i ON mi.ingredientId = i.ingredientId
        WHERE t.userId = @userId
        ORDER BY t.consumptionDate DESC
      `;
      const result = await pool.request() // Udfør forespørgslen
        .input('userId', sql.Int, userId) // Tilføj userId til input-parametre
        .query(query); // Udfør forespørgslen og gem resultatet i variablen result
  
      res.json(result.recordset); // Send resultatet som JSON til klienten
    } catch (error) { // Hvis der opstår en fejl
      console.error('Fejl ved hentning af måltider:', error); // Udskriv fejlen til konsollen
      res.status(500).json({ message: 'Serverfejl', error: error.message }); // Send en fejlbesked til klienten
    }
  });


  // Endpoint til at slette et måltid fra tracker-tabellen
  app.delete('/api/meal-tracker/intake/:intakeId', async (req, res) => {
    const { intakeId } = req.params; // Hent intakeId fra URL-parametrene
    try {
      // Opret forbindelse til databasen
      const pool = await sql.connect(dbConfig); // pool er en god måde at forbinde til databasen på, da det er en mere effektiv måde at forbinde til databasen på, da det genbruger forbindelserne.
      // Dette forhindrer, at der oprettes en ny forbindelse til databasen hver gang en forespørgsel sendes til databasen.

      const query = 'DELETE FROM tracker WHERE trackerId = @trackerId'; // SQL-forespørgsel for at slette et måltid fra tracker-tabellen
      const result = await pool.request() // Udfør forespørgslen. Await bruges til at vente på, at et asynkront udtryk er fuldført
        .input('trackerId', sql.Int, intakeId) // Tilføj intakeId til input-parametre
        .query(query); // Udfør forespørgslen og gem resultatet i variablen result
  
      if (result.rowsAffected[0] > 0) { // Hvis der er flere end 0 rækker, der er blevet slettet
        res.json({ message: 'Måltid slettet' }); // Send en succesmeddelelse til klienten
      } else { // Hvis der ikke er blevet slettet nogen rækker
        res.status(404).json({ message: 'Måltid ikke fundet' }); // Send en fejlmeddelelse til klienten
      }
    } catch (error) { // Hvis der opstår en fejl
      console.error('Fejl ved sletning af måltid:', error); // Udskriv fejlen til konsollen
      res.status(500).json({ message: 'Serverfejl', error: error.message }); // Send en fejlbesked til klienten
    }
  });
  
  // Endpoint til at opdatere et måltid i tracker-tabellen
  app.put('/api/meal-tracker/intake/:intakeId', async (req, res) => {
    const { intakeId } = req.params; // Hent intakeId fra URL-parametrene 
    const { weight } = req.body; // Destrukturer weight fra request body
  
    // Opdater måltidet i tracker-tabellen
    try {
      const pool = await sql.connect(dbConfig); // Opret forbindelse til databasen
      // pool er en god måde at forbinde til databasen på, da det er en mere effektiv måde at forbinde til databasen på, da det genbruger forbindelserne.
      // Dette forhindrer, at der oprettes en ny forbindelse til databasen hver gang en forespørgsel sendes til databasen.

      const query = 'UPDATE tracker SET weight = @weight WHERE trackerId = @trackerId'; // SQL-forespørgsel for at opdatere et måltid i tracker-tabellen
      const result = await pool.request() // Udfør forespørgslen. Await bruges til at vente på, at et asynkront udtryk er fuldført
        .input('weight', sql.Decimal(10, 2), weight) // Tilføj weight til input-parametre
        .input('trackerId', sql.Int, intakeId) // Tilføj intakeId til input-parametre
        .query(query); // Udfør forespørgslen og gem resultatet i variablen result
  
      if (result.rowsAffected[0] > 0) { // Hvis der er flere end 0 rækker, der er blevet opdateret
        res.json({ message: 'Måltid opdateret' }); // Send en succesmeddelelse til klienten
      } else { // Hvis der ikke er blevet opdateret nogen rækker
        res.status(404).json({ message: 'Måltid ikke fundet' }); // Send en fejlmeddelelse til klienten
      } 
    } catch (error) { // Hvis der opstår en fejl
      console.error('Fejl ved opdatering af måltid:', error); // Udskriv fejlen til konsollen
      res.status(500).json({ message: 'Serverfejl', error: error.message }); // Send en fejlbesked til klienten
    }
  });

    export default app; // Eksportér app som standard

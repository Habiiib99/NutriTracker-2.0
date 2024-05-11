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

// Endpoint til ingredienser 
app.post('/meal-tracker/ingredient', async (req, res) => {
    const { ingredient, kcal, protein, fat, fiber } = req.body; // Ingredienser som et array af objekter { foodItemId }
  
    try {
      const pool = await sql.connect(dbConfig); // Opret forbindelse til databasen
      // pool er en god måde at forbinde til databasen på, da det er en mere effektiv måde at forbinde til databasen på, da det genbruger forbindelserne.
      // Dette forhindrer, at der oprettes en ny forbindelse til databasen hver gang en forespørgsel sendes til databasen.
     
      // Her bruges '@' foran variabelnavnene, som bruges til at erstatte variablerne med de faktiske værdier
      // Vi indsætter ingrediensen i ingredients-tabellen og returnerer ingredientId
      const query = `
        INSERT INTO dbo.ingredients (ingredient, kcal, protein, fat, fiber) 
        VALUES (@ingredient, @kcal, @protein, @fat, @fiber);
        SELECT SCOPE_IDENTITY() AS ingredientId;
      `;
      // query bruges til at udføre en forespørgsel til databasen - i dette tilfælde en INSERT INTO forespørgsel
      // desuden bruger vi diverse sortkeys til at spore de forskellige næringsstoffer i ingrediensen
      const result = await pool.request()
        .input('ingredient', sql.VarChar(255), ingredient) // Tilføj ingredient til input-parametre
        .input('kcal', sql.Decimal(10, 2), kcal) // Tilføj kcal til input-parametre
        .input('protein', sql.Decimal(10, 2), protein) // Tilføj protein til input-parametre
        .input('fat', sql.Decimal(10, 2), fat) // Tilføj fat til input-parametre
        .input('fiber', sql.Decimal(10, 2), fiber) // Tilføj fiber til input-parametre
        .query(query); // Udfør forespørgslen
  
      const ingredientId = result.recordset[0].ingredientId; // Hent ingredientId fra resultatet
  
      res.status(201).json({ message: 'Ingrediens tilføjet til ingredients-tabellen', ingredientId }); // Send svar til klienten
    } catch (error) { // Hvis der opstår en fejl
      console.error('Fejl ved tilføjelse af ingrediens:', error); // Udskriv fejlen til konsollen
      res.status(500).json({ message: 'Serverfejl', error: error.message }); // Send en fejlbesked til klienten
    }
  });
  
  
  // Endpoint til at tilføje ingredienser til måltider 
  // Vi indsætter ingredienser i meal_ingredients-tabellen
  app.post('/meal-tracker/meal-ingredients', async (req, res) => {
    const {ingredientId, weightOfIngredient, userId } = req.body; // Ingredienser som et array af objekter { foodItemId }
  
    // Vi indsætter ingredienser i meal_ingredients-tabellen
    try {
      const pool = await sql.connect(dbConfig); // Opret forbindelse til databasen
      // pool er en god måde at forbinde til databasen på, da det er en mere effektiv måde at forbinde til databasen på, da det genbruger forbindelserne.
      // Dette forhindrer, at der oprettes en ny forbindelse til databasen hver gang en forespørgsel sendes til databasen.

      // Her bruges '@' foran variabelnavnene, som bruges til at erstatte variablerne med de faktiske værdier
      // Vi indsætter ingredienser i meal_ingredients-tabellen og returnerer mealIngredientId
      // Desuden bruges scope_identity til at hente mealIngredientId
      const query = `
      INSERT INTO dbo.meal_ingredients (ingredientId, weightOfIngredient, userId)
      VALUES (@ingredientId, @weightOfIngredient, @userId);
      SELECT SCOPE_IDENTITY() AS mealIngredientId;
      `;
      // query bruges til at udføre en forespørgsel til databasen - i dette tilfælde en INSERT INTO forespørgsel
      const result = await pool.request() // Udfør forespørgslen
        .input('ingredientId', sql.Int, ingredientId) // Tilføj ingredientId til input-parametre
        .input('weightOfIngredient', sql.Decimal(10, 2), weightOfIngredient) // Tilføj weightOfIngredient til input-parametre
        .input('userId', sql.Int, userId)   // Tilføj userId til input-parametre
        .query(query); // Udfør forespørgslen
  
      const mealIngredientId = result.recordset[0].mealIngredientId; // Hent mealIngredientId fra resultatet
      res.status(201).json({ message: 'Ingrediens tilføjet til meal_ingredients-tabellen', mealIngredientId }); // Send svar til klienten
    } catch (error) { // Hvis der opstår en fejl
      console.error('Fejl ved tilføjelse af ingrediens til måltidsingredienser:', error); // Udskriv fejlen til konsollen
      res.status(500).json({ message: 'Serverfejl', error: error.message }); // Send en fejlbesked til klienten
    }
  });
  
  // Endpoint til at registrere ingredienser i tracker-tabellen
  app.post('/meal-tracker/track-ingredient', async (req, res) => {
    const { mealIngredientId, weight, userId, consumptionDate, location } = req.body; // Ingredienser som et array af objekter { foodItemId }
  
    try {
        // Forbind til databasen vha. pool som hjælper med at oprette forbindelse til databasen og udføre forespørgsler
        const pool = await sql.connect(dbConfig); // Opret forbindelse til databasen

        // Indsæt registrering i tracker-tabellen
        // Her bruges '@' foran variabelnavnene, som bruges til at erstatte variablerne med de faktiske værdier
        const query = `
            INSERT INTO dbo.tracker (mealIngredientId, weight, userId, consumptionDate, location)
            VALUES (@mealIngredientId, @weight, @userId, @consumptionDate, @location)
        `;
        await pool.request() // Udfør forespørgslen
            .input('mealIngredientId', sql.Int, mealIngredientId) // Tilføj mealIngredientId til input-parametre
            .input('weight', sql.Decimal(10, 2), weight) // Tilføj weight til input-parametre
            .input('userId', sql.Int, userId) // Tilføj userId til input-parametre
            .input('consumptionDate', sql.DateTime, new Date(consumptionDate)) // Tilføj consumptionDate til input-parametre
            .input('location', sql.VarChar(255), location) // Tilføj location til input-parametre
            .query(query); // Udfør forespørgslen
  
        res.status(201).json({ message: 'Ingredient registered in tracker table.' }); // Send svar til klienten
    } catch (error) { // Hvis der opstår en fejl
        console.error('Error registering ingredient:', error); // Udskriv fejlen til konsollen
        res.status(500).json({ message: 'Server error', error: error.message }); // Send en fejlbesked til klienten
    }
});


export default app; // Eksportér routeren så den kan bruges i andre filer

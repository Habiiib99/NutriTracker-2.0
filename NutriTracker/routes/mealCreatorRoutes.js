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


// Endpoint for at oprette et måltid
app.post('/meals', async (req, res) => {
    const { mealName, userId, ingredients } = req.body; // Ingredienser som et array af objekter { foodItemId }
    console.log(req.body) 
    try { // Prøv at oprette måltidet
      let totalEnergy = req.body.kcal; // Samlet energiindhold i måltidet
      let totalProtein = req.body.protein; // Samlet proteinindhold i måltidet
      let totalFat = req.body.fat; // Samlet fedtindhold i måltidet
      let totalFiber = req.body.fiber; // Samlet fiberindhold i måltidet
  
      // Bruger pool til at oprette en forbindelse til databasen - men kun til at oprette måltidet så ikke hele databasen. (Mere effektivt)
      const pool = await sql.connect(dbConfig); 
      // Pool er en god måde at forbinde til databasen på, da det er en mere effektiv måde at forbinde til databasen på, da det genbruger forbindelserne.
      // Dette forhindrer, at der oprettes en ny forbindelse til databasen hver gang en forespørgsel sendes til databasen.
      const meals = await pool.query('SELECT * FROM meals') // Hent alle måltider fra databasen
  
      const mealResult = await pool.request() // Opret måltidet i databasen
        .input('mealId', sql.Int, meals.recordset.length + 1) // Tilføj mealId til input-parametre
        .input('mealName', sql.VarChar, mealName) // Tilføj mealName til input-parametre
        .input('userId', sql.Int, userId) // Tilføj userId til input-parametre
        // query bruges til at udføre en forespørgsel til databasen - i dette tilfælde en INSERT INTO forespørgsel
        // Her bruges '@' foran variabelnavnene, som bruges til at erstatte variablerne med de faktiske værdier
        .query('INSERT INTO meals (mealId, mealName, userId) OUTPUT INSERTED.mealId VALUES (@mealId, @mealName, @userId)');
      const mealId = mealResult.recordset[0].insertId; // Hent mealId fra resultatet
  
      // For hver ingrediens i måltidet
      for (const ingredient of ingredients) {
        const ingredientDetailsResult = await pool.request() // Hent næringsdata for ingrediensen
          .input('ingredientId', sql.Int, ingredient.ingredientId) // Tilføj ingredientId til input-parametre
          // query bruges til at udføre en forespørgsel til databasen - i dette tilfælde en SELECT forespørgsel
          // Her bruges '@' foran variabelnavnene, som bruges til at erstatte variablerne med de faktiske værdier
          .query('SELECT kcal, protein, fat, fiber FROM ingredients WHERE ingredientId = @ingredientId'); 
  
        const ingredientDetails = ingredientDetailsResult.recordset; // Hent næringsdata fra resultatet
  
        // Hvis der er næringsdata for ingrediensen
        if (ingredientDetails.length > 0) {
          const { kcal, protein, fat, fiber } = ingredientDetails[0]; // Hent næringsdata fra ingrediensen
        }
  
        // Indsæt ingrediens i måltidet    
        // Vi bruger vores sortkeeys til at spore de forskellige næringsstoffer i måltidet
        const insertIngredientResult = await pool.request() 
          .input('kcal', sql.Decimal(5, 2), totalEnergy) // Tilføj kcal til input-parametre
          .input('protein', sql.Decimal(5, 2), totalProtein) // Tilføj protein til input-parametre
          .input('fat', sql.Decimal(5, 2), totalFat) // Tilføj fat til input-parametre
          .input('userId', sql.Int, userId) // Tilføj userId til input-parametre
          .input('fiber', sql.Decimal(5, 2), totalFiber) // Tilføj fiber til input-parametre
          .input('mealId', sql.Int, meals.recordset.length + 1) // Tilføj mealId til input-parametre
          .input('mealName', sql.VarChar, mealName) // Tilføj mealName til input-parametre
          .input('ingredients', sql.VarChar, JSON.stringify(ingredients)) // Tilføj ingredients til input-parametre
          // query bruges til at udføre en forespørgsel til databasen - i dette tilfælde en INSERT INTO forespørgsel
          // Her bruges '@' foran variabelnavnene, som bruges til at erstatte variablerne med de faktiske værdier
          .query('update meals set kcal = @kcal, protein = @protein, fat= @fat, fiber= @fiber, ingredients= @ingredients where mealId = @mealId')
  
      }
      // Send svar til klienten
      res.status(201).json({ mealId: meals.recordset.length + 1, mealName, userId, ingredients, totalEnergy, totalProtein, totalFat, totalFiber });
    } catch (error) { // Hvis der opstår en fejl under oprettelsen af måltidet
      console.error(error); // Udskriv fejlmeddelelsen til konsollen
      res.status(500).json({ message: 'Fejl ved oprettelse af måltid', error: error.message }); // Returner en fejlmeddelelse
    }
  });
  
  
  // Endpoint for at hente måltidet med en bestemt id
  app.get('/api/meals/:id', async (req, res) => {
    const pool = await sql.connect(dbConfig); // Opret forbindelse til databasen
    // pool hjælper med at oprette forbindelse til databasen og udføre forespørgsler
    // på den måde undgår vi at skulle oprette forbindelse til databasen hver gang vi vil udføre en forespørgsel
  
    try {
      const { id } = req.params; // Hent værdien af :id parameteren fra req.params
  
      // Hent måltidet og dets basale oplysninger
      const mealQuery = 'SELECT * FROM meals WHERE mealId = @mealId'; // SQL-forespørgsel til at hente måltidet med den specificerede id
      const mealResults = await pool.request() // Udfør forespørgslen
        .input('mealId', sql.Int, mealId) // Tilføjet input-parametrisering
        .query(mealQuery); // Udfør forespørgslen
      if (mealResults.recordset.length === 0) { // Hvis der ikke er noget måltid med den specificerede id
        return res.status(404).json({ message: 'Måltid ikke fundet' }); // Returner en fejlmeddelelse
      }
      const meal = mealResults.recordset[0]; // Hent måltidet fra resultatet
      // Hent alle ingredienser tilknyttet dette måltid fra food_items-tabellen
      const ingredientsQuery = 'SELECT fi.name, mfi.weight FROM meal_food_items mfi JOIN food_items fi ON mfi.foodItemId = fi.id WHERE mfi.mealId = @mealId';
      const ingredientsResults = await pool.request() // Udfør forespørgslen
        .input('mealId', sql.Int, id) // Brug 'id' fra req.params
        .query(ingredientsQuery); // Udfør forespørgslen
      const ingredients = ingredientsResults.recordset; // Hent ingredienserne fra resultatet
      // Sammensæt det fulde måltid med ingredienser
      res.json({ // Send resultatet som JSON. JSON er et tekstformat, der bruges til at udveksle data mellem en klient og en server
        id: meal.mealId, // Tilføj måltidets id
        name: meal.mealName, // Tilføj måltidets navn
        userId: meal.userId, // Tilføj brugerens id
        ingredients // Tilføj ingredienserne
      });
    } catch (error) { // Hvis der opstår en fejl under hentning af måltidet
      res.status(500).json({ message: 'Server fejl', error: error.message }); // Returner en fejlmeddelelse
    }
  });


  export default app; // Eksporter app routeren til brug i server.js filen

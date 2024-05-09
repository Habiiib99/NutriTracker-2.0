import express from 'express';
import sql from 'mssql';
import { dbConfig } from '../config/database.js'; // Importér databasekonfigurationen

const app = express.Router();

// Endpoint til ingredienser 
app.post('/meal-tracker/ingredient', async (req, res) => {
    const { ingredient, kcal, protein, fat, fiber } = req.body;
  
    try {
      const pool = await sql.connect(dbConfig);
      const query = `
        INSERT INTO dbo.ingredients (ingredient, kcal, protein, fat, fiber)
        VALUES (@ingredient, @kcal, @protein, @fat, @fiber);
        SELECT SCOPE_IDENTITY() AS ingredientId;
      `;
      const result = await pool.request()
        .input('ingredient', sql.VarChar(255), ingredient)
        .input('kcal', sql.Decimal(10, 2), kcal)
        .input('protein', sql.Decimal(10, 2), protein)
        .input('fat', sql.Decimal(10, 2), fat)
        .input('fiber', sql.Decimal(10, 2), fiber)
        .query(query);
  
      const ingredientId = result.recordset[0].ingredientId;
  
      res.status(201).json({ message: 'Ingrediens tilføjet til ingredients-tabellen', ingredientId });
    } catch (error) {
      console.error('Fejl ved tilføjelse af ingrediens:', error);
      res.status(500).json({ message: 'Serverfejl', error: error.message });
    }
  });
  
  
  app.post('/meal-tracker/meal-ingredients', async (req, res) => {
    const {ingredientId, weightOfIngredient, userId } = req.body;
  
    try {
      const pool = await sql.connect(dbConfig);
      const query = `
      INSERT INTO dbo.meal_ingredients (ingredientId, weightOfIngredient, userId)
      VALUES (@ingredientId, @weightOfIngredient, @userId);
      SELECT SCOPE_IDENTITY() AS mealIngredientId;
      `;
      const result = await pool.request()
        .input('ingredientId', sql.Int, ingredientId)
        .input('weightOfIngredient', sql.Decimal(10, 2), weightOfIngredient)
        .input('userId', sql.Int, userId) 
        .query(query);
  
      const mealIngredientId = result.recordset[0].mealIngredientId;
      res.status(201).json({ message: 'Ingrediens tilføjet til meal_ingredients-tabellen', mealIngredientId });
    } catch (error) {
      console.error('Fejl ved tilføjelse af ingrediens til måltidsingredienser:', error);
      res.status(500).json({ message: 'Serverfejl', error: error.message });
    }
  });
  
  
  app.post('/meal-tracker/track-ingredient', async (req, res) => {
    const { mealIngredientId, weight, userId, consumptionDate, location } = req.body;
  
    try {
        // Connect to the database
        const pool = await sql.connect(dbConfig);
        const query = `
            INSERT INTO dbo.tracker (mealIngredientId, weight, userId, consumptionDate, location)
            VALUES (@mealIngredientId, @weight, @userId, @consumptionDate, @location)
        `;
        await pool.request()
            .input('mealIngredientId', sql.Int, mealIngredientId) // Change input parameter to mealIngredientId
            .input('weight', sql.Decimal(10, 2), weight)
            .input('userId', sql.Int, userId)
            .input('consumptionDate', sql.DateTime, new Date(consumptionDate))
            .input('location', sql.VarChar(255), location)
            .query(query);
  
        res.status(201).json({ message: 'Ingredient registered in tracker table.' });
    } catch (error) {
        console.error('Error registering ingredient:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});


export default app;
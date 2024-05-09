import express from 'express';
import sql from 'mssql';
import { dbConfig } from '../config/database.js'; // Importér databasekonfigurationen

const app = express.Router();


// **MEAL TRACKER**

// Endpoint for at hente alle måltider
app.get('/api/meals', async (req, res) => {
    try {
      // Opret forbindelse til databasen
      const pool = await sql.connect(dbConfig);
  
      // Udfør SQL-forespørgsel for at hente alle måltider
      const mealsQuery = 'SELECT mealId, mealName, userId, kcal, protein, fat, fiber FROM meals';
      const result = await pool.request().query(mealsQuery);
  
      // Send resultatet som JSON
      res.json(result.recordset);
    } catch (error) {
      console.error('Fejl ved hentning af måltider:', error);
      res.status(500).json({ message: 'Server fejl ved hentning af måltider', error: error.message });
    }
  });
  
  
  // Endpoint for at hente den samlede vægt af en måltid
  app.get('/api/meals/weight/:mealId', async (req, res) => {
    const { mealId } = req.params;
    try {
      const pool = await sql.connect(dbConfig);
  
      // Hent ingredienserne til måltidet
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
      const result = await pool.request()
        .input('mealId', sql.Int, mealId)
        .query(query);
  
      const totalWeight = result.recordset[0]?.totalWeight || 0;
      res.json({ mealId, totalWeight });
    } catch (error) {
      console.error('Fejl ved hentning af måltidets vægt:', error);
      res.status(500).json({ message: 'Server fejl', error: error.message });
    }
  });
  
  
  // Endpoint til at registrere et måltid i tracker-tabellen
  app.post('/api/meal-tracker/track-meal', async (req, res) => {
    const { mealId, weight, userId, consumptionDate, location } = req.body;
  
    try {
      const pool = await sql.connect(dbConfig);
      const query = `
        INSERT INTO dbo.tracker (mealId, weight, userId, consumptionDate, location)
        VALUES (@mealId, @weight, @userId, @consumptionDate, @location)
      `;
      await pool.request()
        .input('mealId', sql.Int, mealId)
        .input('weight', sql.Decimal(10, 2), weight)
        .input('userId', sql.Int, userId)
        .input('consumptionDate', sql.DateTime, new Date(consumptionDate))
        .input('location', sql.VarChar(255), location)
        .query(query);
  
      res.status(201).json({ message: 'Måltid registreret i tracker-tabellen' });
    } catch (error) {
      console.error('Fejl ved registrering af måltid:', error);
      res.status(500).json({ message: 'Serverfejl', error: error.message });
    }
  });
  
  
  
  // Endpoint til at hente alle registrerede måltider fra tracker-tabellen for en given bruger
  app.get('/api/meal-tracker/intakes/:userId', async (req, res) => {
    const { userId } = req.params;
    try {
      const pool = await sql.connect(dbConfig);
      const query = `
        SELECT t.trackerId, t.mealId, t.weight, t.consumptionDate, m.mealName, m.kcal, m.protein, m.fat, m.fiber
        FROM dbo.tracker t
        JOIN dbo.meals m ON t.mealId = m.mealId
        WHERE t.userId = @userId
        ORDER BY t.consumptionDate DESC
      `;
      const result = await pool.request()
        .input('userId', sql.Int, userId)
        .query(query);
  
      res.json(result.recordset);
    } catch (error) {
      console.error('Fejl ved hentning af måltider:', error);
      res.status(500).json({ message: 'Serverfejl', error: error.message });
    }
  });
  
  app.get('/api/meal-tracker/intakes-ingredient/:userId', async (req, res) => {
    const { userId } = req.params;
    try {
      const pool = await sql.connect(dbConfig);
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
      const result = await pool.request()
        .input('userId', sql.Int, userId)
        .query(query);
  
      res.json(result.recordset);
    } catch (error) {
      console.error('Fejl ved hentning af måltider:', error);
      res.status(500).json({ message: 'Serverfejl', error: error.message });
    }
  });
  
  app.delete('/api/meal-tracker/intake/:intakeId', async (req, res) => {
    const { intakeId } = req.params;
    try {
      const pool = await sql.connect(dbConfig);
      const query = 'DELETE FROM tracker WHERE trackerId = @trackerId';
      const result = await pool.request()
        .input('trackerId', sql.Int, intakeId)
        .query(query);
  
      if (result.rowsAffected[0] > 0) {
        res.json({ message: 'Måltid slettet' });
      } else {
        res.status(404).json({ message: 'Måltid ikke fundet' });
      }
    } catch (error) {
      console.error('Fejl ved sletning af måltid:', error);
      res.status(500).json({ message: 'Serverfejl', error: error.message });
    }
  });
  
  app.put('/api/meal-tracker/intake/:intakeId', async (req, res) => {
    const { intakeId } = req.params;
    const { weight } = req.body;
  
    try {
      const pool = await sql.connect(dbConfig);
      const query = 'UPDATE tracker SET weight = @weight WHERE trackerId = @trackerId';
      const result = await pool.request()
        .input('weight', sql.Decimal(10, 2), weight)
        .input('trackerId', sql.Int, intakeId)
        .query(query);
  
      if (result.rowsAffected[0] > 0) {
        res.json({ message: 'Måltid opdateret' });
      } else {
        res.status(404).json({ message: 'Måltid ikke fundet' });
      }
    } catch (error) {
      console.error('Fejl ved opdatering af måltid:', error);
      res.status(500).json({ message: 'Serverfejl', error: error.message });
    }
  });

    export default app;
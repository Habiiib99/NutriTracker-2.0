
import express from 'express';
import sql from 'mssql';
import { dbConfig } from '../config/database.js'; // Importér databasekonfigurationen

const app = express.Router();

// **MEAL CREATOR**
// Endpoint for at oprette et måltid
app.post('/meals', async (req, res) => {
    const { mealName, userId, ingredients } = req.body; // Ingredienser som et array af objekter { foodItemId }
    console.log(req.body)
    try {
      let totalEnergy = req.body.kcal;
      let totalProtein = req.body.protein;
      let totalFat = req.body.fat;
      let totalFiber = req.body.fiber;
  
      // Bruger pool til at oprette en forbindelse til databasen - men kun til at oprette måltidet så ikke hele databasen. (Mere effektivt)
      const pool = await sql.connect(dbConfig);
      const meals = await pool.query('SELECT * FROM meals')
  
      const mealResult = await pool.request()
        .input('mealId', sql.Int, meals.recordset.length + 1)
        .input('mealName', sql.VarChar, mealName)
        .input('userId', sql.Int, userId)
        .query('INSERT INTO meals (mealId, mealName, userId) OUTPUT INSERTED.mealId VALUES (@mealId, @mealName, @userId)');
      const mealId = mealResult.recordset[0].insertId;
  
      for (const ingredient of ingredients) {
        const ingredientDetailsResult = await pool.request()
          .input('ingredientId', sql.Int, ingredient.ingredientId)
          .query('SELECT kcal, protein, fat, fiber FROM ingredients WHERE ingredientId = @ingredientId');
  
        const ingredientDetails = ingredientDetailsResult.recordset;
  
        if (ingredientDetails.length > 0) {
          const { kcal, protein, fat, fiber } = ingredientDetails[0];
  
          // 2c. Beregn bidrag fra hver ingrediens baseret på vægten
          /*const factor = ingredient.weight / 100; // Antager, at næringsdata er pr. 100 gram
          totalEnergy += kcal * factor;
          totalProtein += protein * factor;
          totalFat += fat * factor;
          totalFiber += fiber * factor;*/
        }
  
        // Indsæt ingrediens i måltidet    
        const insertIngredientResult = await pool.request()
          .input('kcal', sql.Decimal(5, 2), totalEnergy)
          .input('protein', sql.Decimal(5, 2), totalProtein)
          .input('fat', sql.Decimal(5, 2), totalFat)
          .input('userId', sql.Int, userId)
          .input('fiber', sql.Decimal(5, 2), totalFiber)
          .input('mealId', sql.Int, meals.recordset.length + 1)
          .input('mealName', sql.VarChar, mealName)
          .input('ingredients', sql.VarChar, JSON.stringify(ingredients))
          .query('update meals set kcal = @kcal, protein = @protein, fat= @fat, fiber= @fiber, ingredients= @ingredients where mealId = @mealId')
  
      }
      res.status(201).json({ mealId: meals.recordset.length + 1, mealName, userId, ingredients, totalEnergy, totalProtein, totalFat, totalFiber });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Fejl ved oprettelse af måltid', error: error.message });
    }
  });
  
  
  
  
  
  
  
  
  
  
  // Finde et måltid og se dens ingredienser og vægt
  // ENDPOINT VIRKER
  // Test i Insomnia ved at skrive: http://localhost:PORT/api/meals/1 - husk at ændre PORT
  app.get('/api/meals/:id', async (req, res) => {
    const pool = await sql.connect(dbConfig);
  
    try {
      const { id } = req.params; // Hent værdien af :id parameteren fra req.params
  
      // Hent måltidet og dets basale oplysninger
      const mealQuery = 'SELECT * FROM meals WHERE mealId = @mealId';
      const mealResults = await pool.request()
        .input('mealId', sql.Int, mealId) // Tilføjet input-parametrisering
        .query(mealQuery);
      if (mealResults.recordset.length === 0) {
        return res.status(404).json({ message: 'Måltid ikke fundet' });
      }
      const meal = mealResults.recordset[0];
      // Hent alle ingredienser tilknyttet dette måltid
      const ingredientsQuery = 'SELECT fi.name, mfi.weight FROM meal_food_items mfi JOIN food_items fi ON mfi.foodItemId = fi.id WHERE mfi.mealId = @mealId';
      const ingredientsResults = await pool.request()
        .input('mealId', sql.Int, id) // Brug 'id' fra req.params
        .query(ingredientsQuery);
      const ingredients = ingredientsResults.recordset;
      // Sammensæt det fulde måltid med ingredienser
      res.json({
        id: meal.mealId,
        name: meal.mealName,
        userId: meal.userId,
        ingredients
      });
    } catch (error) {
      res.status(500).json({ message: 'Server fejl', error: error.message });
    }
  });


  export default app;
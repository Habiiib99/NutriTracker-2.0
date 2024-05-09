import express from 'express';
import sql from 'mssql';
import { dbConfig } from '../config/database.js'; // Importér databasekonfigurationen
import e from 'express';


const app = express.Router();

/// **DAILY NUTRI** -- skal opdateres/ændres
app.get('/api/daily-nutri/hourly/:userId', async (req, res) => {
    const { userId } = req.params;
  
    try {
      const pool = await sql.connect(dbConfig);
  
      // Hent kalorie- og vandindtag for de seneste 24 timer
      const foodIntakeQuery = `
        SELECT DATEPART(hour, consumptionDate) AS hour, SUM(weight) AS totalWeight
        FROM tracker
        WHERE userId = @userId AND consumptionDate >= DATEADD(hour, -24, GETDATE())
        GROUP BY DATEPART(hour, consumptionDate)
      `;
      const waterIntakeQuery = `
        SELECT DATEPART(hour, dateAndTimeOfDrinking) AS hour, SUM(amountOfWater) AS totalWater
        FROM waterRegistration
        WHERE userId = @userId AND dateAndTimeOfDrinking >= DATEADD(hour, -24, GETDATE())
        GROUP BY DATEPART(hour, dateAndTimeOfDrinking)
      `;
  
      // Hent aktivitetsforbrænding
      const activityQuery = `
        SELECT DATEPART(hour, activityDate) AS hour, SUM(caloriesBurned) AS totalCaloriesBurned
        FROM activities
        WHERE userId = @userId AND activityDate >= DATEADD(hour, -24, GETDATE())
        GROUP BY DATEPART(hour, activityDate)
      `;
  
      // Basalforbrænding (BMR) for bruger fordelt på 24 timer
      const bmrQuery = `SELECT bmr FROM profiles WHERE userId = @userId`;
  
      // Udfør SQL-forespørgsler
      const foodIntake = await pool.request().input('userId', sql.Int, userId).query(foodIntakeQuery);
      const waterIntake = await pool.request().input('userId', sql.Int, userId).query(waterIntakeQuery);
      const activityBurn = await pool.request().input('userId', sql.Int, userId).query(activityQuery);
      const bmr = await pool.request().input('userId', sql.Int, userId).query(bmrQuery);
  
      // Saml og beregn data for hver time
      const hourlyData = [];
      const bmrPerHour = bmr.recordset[0].bmr / 24;
  
      for (let hour = 0; hour < 24; hour++) {
        const food = foodIntake.recordset.find((row) => row.hour === hour)?.totalWeight || 0;
        const water = waterIntake.recordset.find((row) => row.hour === hour)?.totalWater || 0;
        const activity = activityBurn.recordset.find((row) => row.hour === hour)?.totalCaloriesBurned || 0;
        const totalBurn = bmrPerHour + activity;
        const surplusDeficit = food - totalBurn;
  
        hourlyData.push({
          hour,
          energy: food,
          water: (water / 1000).toFixed(2),
          calorieBurn: totalBurn.toFixed(2),
          surplusDeficit: surplusDeficit.toFixed(2),
        });
      }
  
      res.json(hourlyData);
    } catch (error) {
      console.error('Fejl ved hentning af timebaseret data:', error);
      res.status(500).json({ message: 'Fejl ved hentning af timebaseret data', error: error.message });
    }
  });
  
  
  
  
  
  // Endpoint for at få den daglige kaloriebalance i løbet af en måned
  app.get('/api/daily-nutri/monthly/:userId', async (req, res) => {
    const { userId } = req.params;
  
    try {
      const pool = await sql.connect(dbConfig);
      const query = `
        SELECT 
          CONVERT(VARCHAR(10), consumptionDate, 120) AS day,
          SUM(kcal) AS totalEnergy,
          SUM(amountOfWater) / 1000 AS totalWater,  -- Omregn til liter
          SUM(caloriesBurned) AS totalBurned,
          (SUM(kcal) - SUM(caloriesBurned)) AS balance
        FROM dbo.tracker
        LEFT JOIN dbo.waterRegistration ON dbo.tracker.userId = dbo.waterRegistration.userId
        WHERE dbo.tracker.userId = @userId
        AND consumptionDate >= DATEADD(MONTH, -1, GETDATE())
        GROUP BY CONVERT(VARCHAR(10), consumptionDate, 120)
        ORDER BY day ASC;
      `;
      const result = await pool.request()
        .input('userId', sql.Int, userId)
        .query(query);
  
      res.json(result.recordset);
    } catch (error) {
      console.error('Fejl ved hentning af månedlige data:', error);
      res.status(500).json({ message: 'Serverfejl', error: error.message });
    }
  });

  export default app;
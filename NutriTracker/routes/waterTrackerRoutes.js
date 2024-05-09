import express from 'express';
import sql from 'mssql';
import { dbConfig } from '../config/database.js'; // Importér databasekonfigurationen

const app = express.Router();

// Endpoint til at registrere vandindtag
app.post('/api/water-tracker', async (req, res) => {
    try {
        const { userId, amountOfWater, dateAndTimeOfDrinking, location } = req.body;
  
        // Kontroller, om nødvendige felter er udfyldt
        if (!userId || !amountOfWater || !dateAndTimeOfDrinking || !location) {
            return res.status(400).json({ message: 'Udfyld venligst alle nødvendige felter: userId, amountOfWater, og dateAndTimeOfDrinking.' });
        }
  
        // Trim datoen til minutter (uden sekunder)
        const date = new Date(dateAndTimeOfDrinking);
        const dateTrimmed = date.toISOString().slice(0, 16);
  
        // Forbind til databasen
        const pool = await sql.connect(dbConfig);
  
        // Indsæt registrering i waterRegistration-tabellen
        const result = await pool.request()
        .input('userId', sql.Int, userId)
        .input('amountOfWater', sql.Int, amountOfWater)
        .input('dateAndTimeOfDrinking', sql.DateTime, new Date(dateTrimmed))
        .input('location', sql.VarChar(255), location)
        .query('INSERT INTO dbo.waterRegistration (userId, amountOfWater, dateAndTimeOfDrinking, location) OUTPUT INSERTED.waterRegId VALUES (@userId, @amountOfWater, @dateAndTimeOfDrinking, @location)');

        // Tjek om registreringen blev tilføjet korrekt
        if (result.recordset.length > 0) {
            res.status(201).json({
                waterRegId: result.recordset[0].waterRegId,
                userId,
                amountOfWater,
                dateAndTimeOfDrinking: dateTrimmed,
                location
            });
        } else {
            res.status(500).json({ message: 'Fejl ved tilføjelse af vandindtag til databasen.' });
        }
    } catch (error) {
        console.error('Fejl ved registrering af vandindtag:', error);
        res.status(500).json({ message: 'Fejl ved registrering af vandindtag.', error: error.message });
    }
  });
  
  // Endpoint til at opdatere vandindtag
  app.put('/api/water-tracker/:id', async (req, res) => {
    const { id } = req.params;  // ID fra URL
    const { amountOfWater } = req.body;  // Ny vandmængde
  
    try {
        if (!amountOfWater || isNaN(amountOfWater)) {
            return res.status(400).json({ message: 'Indtast venligst en gyldig vandmængde.' });
        }
  
        // Forbind til databasen
        const pool = await sql.connect(dbConfig);
  
        // Opdater vandmængden for det angivne ID
        const result = await pool.request()
            .input('amountOfWater', sql.Int, amountOfWater)
            .input('waterRegId', sql.Int, id)
            .query('UPDATE dbo.waterRegistration SET amountOfWater = @amountOfWater WHERE waterRegId = @waterRegId');
  
        if (result.rowsAffected[0] > 0) {
            res.json({ message: 'Vandindtag opdateret.' });
        } else {
            res.status(404).json({ message: 'Vandindtag ikke fundet.' });
        }
    } catch (error) {
        console.error('Fejl ved opdatering af vandindtag:', error);
        res.status(500).json({ message: 'Fejl ved opdatering af vandindtag.', error: error.message });
    }
  });
  
  // Endpoint til at slette vandindtag
  app.delete('/api/water-tracker/:id', async (req, res) => {
    const { id } = req.params;
  
    try {
        // Forbind til databasen
        const pool = await sql.connect(dbConfig);
  
        // Slet posten baseret på ID
        const result = await pool.request()
            .input('waterRegId', sql.Int, id)
            .query('DELETE FROM dbo.waterRegistration WHERE waterRegId = @waterRegId');
  
        if (result.rowsAffected[0] > 0) {
            res.json({ message: 'Vandindtag slettet.' });
        } else {
            res.status(404).json({ message: 'Vandindtag ikke fundet.' });
        }
    } catch (error) {
        console.error('Fejl ved sletning af vandindtag:', error);
        res.status(500).json({ message: 'Fejl ved sletning af vandindtag.', error: error.message });
    }
  });
  
  
  // Endpoint til at hente vandindtag for en bestemt bruger
  app.get('/api/water-tracker/user/:userId', async (req, res) => {
    const { userId } = req.params;
  
    try {
        // Forbind til databasen
        const pool = await sql.connect(dbConfig);
  
        // Hent vandindtagene for brugeren
        const result = await pool.request()
            .input('userId', sql.Int, userId)
            .query('SELECT waterRegId, amountOfWater, dateAndTimeOfDrinking FROM dbo.waterRegistration WHERE userId = @userId ORDER BY dateAndTimeOfDrinking DESC');
  
        res.json(result.recordset);
    } catch (error) {
        console.error('Fejl ved hentning af vandindtag:', error);
        res.status(500).json({ message: 'Fejl ved hentning af vandindtag.', error: error.message });
    }
  });

export default app;
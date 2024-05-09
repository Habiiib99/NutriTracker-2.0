import express from 'express';
import sql from 'mssql';
import { dbConfig } from '../config/database.js'; // Importér databasekonfigurationen

const app = express.Router();

//activityTracker

const almindeligeHverdagsaktiviteter = {
    "Almindelig gang": 215,
    "Gang ned af trapper": 414,
    "Gang op af trapper": 1079,
    "Slå græs med manuel græsslåmaskine": 281,
    "Lave mad og redde senge": 236,
    "Luge ukrudt": 362,
    "Rydde sne": 481,
    "Læse eller se TV": 74,
    "Stå oprejst": 89,
    "Cykling i roligt tempo": 310,
    "Tørre støv af": 163,
    "Vaske gulv": 281,
    "Pudse vinduer": 259
};

const sportsAktiviteter = {
    "Cardio": 814,
    "Hård styrketræning": 348,
    "Badminton": 318,
    "Volleyball": 318,
    "Bordtennis": 236,
    "Dans i højt tempo": 355,
    "Dans i moderat tempo": 259,
    "Fodbold": 510,
    "Rask gang": 384,
    "Golf": 244,
    "Håndbold": 466,
    "Squash": 466,
    "Jogging": 666,
    "Langrend": 405,
    "Løb i moderat tempo": 872,
    "Løb i hurtigt tempo": 1213,
    "Ridning": 414,
    "Skøjteløb": 273,
    "Svømning": 296,
    "Cykling i højt tempo": 658
};

const forskelligeTyperArbejde = {
    "Bilreparation": 259,
    "Gravearbejde": 414,
    "Landbrugsarbejde": 236,
    "Let kontorarbejde": 185,
    "Male hus": 215,
    "Murerarbejde": 207,
    "Hugge og slæbe på brænde": 1168
};


// Endpoint for at tilføje en aktivitet (OBS: ændre denne funktions dato til kun indtil minutter, ikke sekunder)
app.post('/activityTracker', async (req, res) => {
    try {
        const { userId, activityType, minutes,} = req.body;

        // Aktiviteter baseret på type
        const activities = {
            everyday: almindeligeHverdagsaktiviteter,
            sports: sportsAktiviteter,
            work: forskelligeTyperArbejde
        };

        // Hent den relevante liste af aktiviteter baseret på typen
        const activityList = activities[activityType];

        // Søg efter den specificerede aktivitet
        const activityName = req.body.activityName;
        const caloriesPerHour = activityList[activityName];

        const date = new Date().toISOString();
        const activityDate = date.slice(0, 16);

        // Beregn kalorier
        if (!activityName || isNaN(minutes) || caloriesPerHour === undefined) {
            return res.status(400).send("Indtast venligst både aktivitet og antal minutter.");
        }

        const calories = (caloriesPerHour * minutes) / 60;

        // Forbinder til databasen
        const pool = await sql.connect(dbConfig);

        // Indsæt aktivitet i databasen
        const result = await pool.request()
            .input('userId', sql.Int, userId)
            .input('activityType', sql.VarChar, activityType)
            .input('activityName', sql.VarChar, activityName)
            .input('duration', sql.Decimal(5, 2), parseFloat(minutes))
            .input('caloriesBurned', sql.Decimal(10, 2), parseFloat(calories))
            .input('activityDate', sql.DateTime, new Date(activityDate))
            .query('INSERT INTO activities (userId, activityType, activityName, duration, caloriesBurned, activityDate) OUTPUT INSERTED.userId VALUES (@userId, @activityType, @activityName, @duration, @caloriesBurned, @activityDate)');

        // Tjek om aktiviteten blev indsat succesfuldt
        if (result.recordset.length > 0) {
            res.status(201).json({
                activityId: result.recordset[0].id,
                userId,
                activityType,
                activityName,
                duration: minutes,
                caloriesBurned: calories,
                activityDate
            });
        } else {
            res.status(500).json({ message: 'Fejl ved tilføjelse af aktivitet til database.' });
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Fejl ved oprettelse af aktivitet.', error: error.message });
    }
});


export default app;
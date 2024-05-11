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

// Almindelige hverdagsktiviteter med kalorieforbrænding pr. time 
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

// Sportsaktiviteter med kalorieforbrænding pr. time
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

// Forskellige typer arbejde med kalorieforbrænding pr. time
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

    // Validering af input parametre fra request body
    try {
        const { userId, activityType, minutes,} = req.body; // Destrukturerer request body til userId, activityType, og minutes (varighed af aktivitet)

        // Opretter objekt med forskellige lister af aktiviteter
        const activities = {
            everyday: almindeligeHverdagsaktiviteter, // Almindelige hverdagsaktiviteter
            sports: sportsAktiviteter, // Sportsaktiviteter
            work: forskelligeTyperArbejde // Forskellige typer arbejde
        };

        // Hent den relevante liste af aktiviteter baseret på typen
        const activityList = activities[activityType];

        // Søg efter den specificerede aktivitet
        const activityName = req.body.activityName; // Destrukturerer request body til activityName
        const caloriesPerHour = activityList[activityName]; // Hent kalorier pr. time for den specificerede aktivitet


        const date = new Date().toISOString(); // Opretter en dato og tid for aktiviteten i ISO-format (2021-05-25T10:00:00.000Z)
        const activityDate = date.slice(0, 16); // Skærer sekunder og millisekunder fra datoen

        // Beregn kalorier
        if (!activityName || isNaN(minutes) || caloriesPerHour === undefined) { // Hvis aktivitetsnavn, minutter eller kalorier pr. time mangler
            return res.status(400).send("Indtast venligst både aktivitet og antal minutter.");
        }

        // Beregn kalorier for aktiviteten baseret på antal minutter
        const calories = (caloriesPerHour * minutes) / 60;

        // Forbinder til databasen
        const pool = await sql.connect(dbConfig); // Pool er en måde at oprette forbindelse til databasen på ved at bruge dbConfig objektet fra database.js og derefter udføre forespørgsler

        // Indsæt aktivitet i databasen
        const result = await pool.request() // Anmoder om en forespørgsel til databasen for at indsætte en ny aktivitet
            .input('userId', sql.Int, userId) // Indsætter userId fra request body som parameter til forespørgslen
            .input('activityType', sql.VarChar, activityType) // Indsætter activityType fra request body som parameter til forespørgslen
            .input('activityName', sql.VarChar, activityName) // Indsætter activityName fra request body som parameter til forespørgslen
            .input('duration', sql.Decimal(5, 2), parseFloat(minutes)) // Indsætter duration fra request body som parameter til forespørgslen
            .input('caloriesBurned', sql.Decimal(10, 2), parseFloat(calories)) // Indsætter caloriesBurned fra request body som parameter til forespørgslen
            .input('activityDate', sql.DateTime, new Date(activityDate)) // Indsætter activityDate fra request body som parameter til forespørgslen

            // Indsætter værdierne fra request body i activities tabellen og returnerer userId for den nye aktivitet
            // Her bliver '@' brugt som placeholder for variablerne, som bliver indsat i forespørgslen med input() metoden
            .query('INSERT INTO activities (userId, activityType, activityName, duration, caloriesBurned, activityDate) OUTPUT INSERTED.userId VALUES (@userId, @activityType, @activityName, @duration, @caloriesBurned, @activityDate)'); 

        // Tjek om aktiviteten blev indsat succesfuldt
        if (result.recordset.length > 0) {
            res.status(201).json({ // Returnerer en succesmeddelelse og userId for den nye aktivitet
                activityId: result.recordset[0].id, // Returnerer aktivitetens ID
                userId, // Returnerer brugerens ID
                activityType, // Returnerer aktivitetens type
                activityName, // Returnerer aktivitetens navn
                duration: minutes, // Returnerer aktivitetens varighed
                caloriesBurned: calories, // Returnerer antal forbrændte kalorier
                activityDate // Returnerer aktivitetens dato og tid
            });
        } else {
            res.status(500).json({ message: 'Fejl ved tilføjelse af aktivitet til database.' }); // Returnerer en fejlmeddelelse
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Fejl ved oprettelse af aktivitet.', error: error.message });
    }
});


export default app; // Eksporterer app routeren til brug i server.js filen

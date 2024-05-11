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

// Endpoint til at registrere vandindtag
app.post('/api/water-tracker', async (req, res) => {
    try {
        const { userId, amountOfWater, dateAndTimeOfDrinking, location } = req.body; // BrugerId, vandmængde, og tidspunkt for indtagelse af vand fra request body
  
        // Kontroller, om nødvendige felter er udfyldt
        if (!userId || !amountOfWater || !dateAndTimeOfDrinking || !location) { // Hvis ikke alle felter er udfyldt
            // Returner en fejlbesked til klienten
            return res.status(400).json({ message: 'Udfyld venligst alle nødvendige felter: userId, amountOfWater, og dateAndTimeOfDrinking.' });
        }
  
        // Trim datoen til minutter (uden sekunder)
        const date = new Date(dateAndTimeOfDrinking); // Konverter datoen til et Date-objekt
        const dateTrimmed = date.toISOString().slice(0, 16); // Trim datoen til minutter (uden sekunder)
  
        // Forbind til databasen
        const pool = await sql.connect(dbConfig);
        // pool er en god måde at forbinde til databasen på, da det er en mere effektiv måde at forbinde til databasen på, da det genbruger forbindelserne.
        // Dette forhindrer, at der oprettes en ny forbindelse til databasen hver gang en forespørgsel sendes til databasen.
  
        // Indsæt registrering i waterRegistration-tabellen
        const result = await pool.request() // Anmoder om en forespørgsel til databasen for at indsætte en ny registrering
        .input('userId', sql.Int, userId) // Indsætter userId fra request body som parameter til forespørgslen
        .input('amountOfWater', sql.Int, amountOfWater) // Indsætter amountOfWater fra request body som parameter til forespørgslen
        .input('dateAndTimeOfDrinking', sql.DateTime, new Date(dateTrimmed)) // Indsætter dateAndTimeOfDrinking fra request body som parameter til forespørgslen
        .input('location', sql.VarChar(255), location) // Indsætter location fra request body som parameter til forespørgslen

        // query bruges til at udføre en forespørgsel til databasen - i dette tilfælde en INSERT INTO forespørgsel
        // Her bruges '@' foran variabelnavnene, som bruges til at erstatte variablerne med de faktiske værdier
        // output sætter waterRegId til at blive returneret
        .query('INSERT INTO dbo.waterRegistration (userId, amountOfWater, dateAndTimeOfDrinking, location) OUTPUT INSERTED.waterRegId VALUES (@userId, @amountOfWater, @dateAndTimeOfDrinking, @location)');

        // Tjek om registreringen blev tilføjet korrekt
        if (result.recordset.length > 0) { // Hvis der er en registrering
            res.status(201).json({ // Returner en succesmeddelelse
                waterRegId: result.recordset[0].waterRegId, // Returner ID for registreringen
                userId, // Returner brugerID
                amountOfWater, // Returner vandmængde
                dateAndTimeOfDrinking: dateTrimmed, // Returner tidspunkt for indtagelse af vand
                location // Returner lokation for indtagelse af vand
            });
        } else {
            res.status(500).json({ message: 'Fejl ved tilføjelse af vandindtag til databasen.' }); // Returner en fejlbesked
        }
    } catch (error) {
        console.error('Fejl ved registrering af vandindtag:', error); // Udskriv fejlen til konsollen
        res.status(500).json({ message: 'Fejl ved registrering af vandindtag.', error: error.message }); // Returner en fejlbesked
    }
  });
  
  // Endpoint til at opdatere vandindtag
  app.put('/api/water-tracker/:id', async (req, res) => {
    const { id } = req.params;  // ID fra URL
    const { amountOfWater } = req.body;  // Ny vandmængde
  
    try {
        if (!amountOfWater || isNaN(amountOfWater)) { // Hvis vandmængden mangler eller ikke er et tal
            return res.status(400).json({ message: 'Indtast venligst en gyldig vandmængde.' }); // Returner en fejlbesked
        }
  
        // Forbind til databasen
        const pool = await sql.connect(dbConfig); 
        // pool er en god måde at forbinde til databasen på, da det er en mere effektiv måde at forbinde til databasen på, da det genbruger forbindelserne.
        // Dette forhindrer, at der oprettes en ny forbindelse til databasen hver gang en forespørgsel sendes til databasen.
  
        // Opdater vandmængden for det angivne ID
        const result = await pool.request() // Anmoder om en forespørgsel til databasen for at opdatere vandmængden
            .input('amountOfWater', sql.Int, amountOfWater) // Indsætter amountOfWater fra request body som parameter til forespørgslen
            .input('waterRegId', sql.Int, id) // Indsætter waterRegId fra URL som parameter til forespørgslen

        // query bruges til at udføre en forespørgsel til databasen - i dette tilfælde en UPDATE forespørgsel
        // Her bruges '@' foran variabelnavnene, som bruges til at erstatte variablerne med de faktiske værdier
            .query('UPDATE dbo.waterRegistration SET amountOfWater = @amountOfWater WHERE waterRegId = @waterRegId');
  
        if (result.rowsAffected[0] > 0) { // Hvis der er en registrering
            res.json({ message: 'Vandindtag opdateret.' }); // Returner en succesmeddelelse
        } else { // Hvis registreringen ikke blev fundet
            res.status(404).json({ message: 'Vandindtag ikke fundet.' }); // Returner en fejlbesked
        }
    } catch (error) { // Hvis der opstår en fejl under opdatering af vandindtag
        console.error('Fejl ved opdatering af vandindtag:', error); // Udskriv fejlen til konsollen
        res.status(500).json({ message: 'Fejl ved opdatering af vandindtag.', error: error.message }); // Returner en fejlbesked
    }
  });
  
  // Endpoint til at slette vandindtag
  app.delete('/api/water-tracker/:id', async (req, res) => {
    const { id } = req.params; // ID fra URL (vandindtagets ID)
  
    try {
        // Forbind til databasen
        const pool = await sql.connect(dbConfig);
        // pool er en god måde at forbinde til databasen på, da det er en mere effektiv måde at forbinde til databasen på, da det genbruger forbindelserne.
        // Dette forhindrer, at der oprettes en ny forbindelse til databasen hver gang en forespørgsel sendes til databasen.

        // Slet posten baseret på ID
        const result = await pool.request() // Anmoder om en forespørgsel til databasen for at slette vandindtaget
            .input('waterRegId', sql.Int, id) // Indsætter waterRegId fra URL som parameter til forespørgslen
            .query('DELETE FROM dbo.waterRegistration WHERE waterRegId = @waterRegId'); // query bruges til at udføre en forespørgsel til databasen - i dette tilfælde en DELETE forespørgsel
            // I denne query sledes vandindtaget fra waterRegistration-tabellen baseret på waterRegId

        if (result.rowsAffected[0] > 0) { // Hvis der er en registrering 
            res.json({ message: 'Vandindtag slettet.' }); // Returner en succesmeddelelse
        } else { // Hvis registreringen ikke blev fundet
            res.status(404).json({ message: 'Vandindtag ikke fundet.' }); // Returner en fejlbesked
        }
    } catch (error) { // Hvis der opstår en fejl under sletning af vandindtag
        console.error('Fejl ved sletning af vandindtag:', error); // Udskriv fejlen til konsollen
        res.status(500).json({ message: 'Fejl ved sletning af vandindtag.', error: error.message }); // Returner en fejlbesked
    }
  });
  
  
  // Endpoint til at hente vandindtag for en bestemt bruger
  app.get('/api/water-tracker/user/:userId', async (req, res) => {
    const { userId } = req.params; // BrugerId fra URL
  
    try {
        // Forbind til databasen
        const pool = await sql.connect(dbConfig);
        // pool er en god måde at forbinde til databasen på, da det er en mere effektiv måde at forbinde til databasen på, da det genbruger forbindelserne.
        // Dette forhindrer, at der oprettes en ny forbindelse til databasen hver gang en forespørgsel sendes til databasen.
  
        // Hent vandindtagene for brugeren
        const result = await pool.request() // Anmoder om en forespørgsel til databasen for at hente vandindtagene
            .input('userId', sql.Int, userId) // Indsætter userId fra URL som parameter til forespørgslen
            
        // query bruges til at udføre en forespørgsel til databasen - i dette tilfælde en SELECT forespørgsel
        // Her bruges '@' foran variabelnavnene, som bruges til at erstatte variablerne med de faktiske værdier
        // vandindtagene sorteres efter tidspunkt for indtagelse af vand
            .query('SELECT waterRegId, amountOfWater, dateAndTimeOfDrinking FROM dbo.waterRegistration WHERE userId = @userId ORDER BY dateAndTimeOfDrinking DESC');
  
        res.json(result.recordset); // Returner vandindtagene til klienten
    } catch (error) { // Hvis der opstår en fejl under hentning af vandindtag
        console.error('Fejl ved hentning af vandindtag:', error); // Udskriv fejlen til konsollen
        res.status(500).json({ message: 'Fejl ved hentning af vandindtag.', error: error.message }); // Returner en fejlbesked
    }
  });

export default app; // Eksporterer routeren så den kan bruges i andre filer

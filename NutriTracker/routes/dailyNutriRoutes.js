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


app.get('/api/daily-nutri/hourly/:userId', async (req, res) => { // Endpoint for at hente timebaseret data for en bruger
  const { userId } = req.params; // Brugerens ID fra URL-parametre

  // Forsøg at oprette forbindelse til databasen og hente data
  try {
    const pool = await sql.connect(dbConfig);

    // Hent kalorie- og vandindtag for de seneste 24 timer
    // Dette er en metode til at hente data for hvert timeinterval i de seneste 24 timer
    // Dette gøres ved at gruppere data efter time og summere kalorier og vandindtag for hvert timeinterval
    // Dette gøres for måltider, ingredienser, vandindtag og aktivitetsforbrænding
    // Basalforbrænding (BMR) for bruger hentes også for at beregne det samlede kalorieforbrug
    // Der grupperes efter time og summes for hvert timeinterval
    const mealQuery = `
      SELECT DATEPART(hour, t.consumptionDate) AS hour, 
      SUM(t.weight * m.kcal / 100) AS mealKcal
      FROM tracker t
      JOIN meals m ON t.mealId = m.mealId
      WHERE t.userId = @userId AND t.consumptionDate >= DATEADD(hour, -24, GETDATE())
      GROUP BY DATEPART(hour, t.consumptionDate)
    `;

    // Hent kalorieindtag fra ingredienser
    // Dette gøres ved at summere kalorier for ingredienser for hvert timeinterval
    // Ingredienskalorier beregnes ved at multiplicere vægten af ingrediensen med kalorier pr. 100 gram
    // Dette gøres for alle ingredienser, der er registreret i de seneste 24 timer
    // Ingredienser er knyttet til måltider, så det er nødvendigt at bruge en JOIN for at hente data
    // Når data er hentet, grupperes det efter time og summes for hvert timeinterval
    // Der grupperes efter time og summes for hvert timeinterval
    const ingredientQuery = `
    SELECT DATEPART(hour, t.consumptionDate) AS hour, 
       SUM(t.weight * i.kcal / 100) AS ingredientKcal
    FROM tracker t
    JOIN meal_ingredients mi ON t.mealIngredientId = mi.mealIngredientId
    JOIN ingredients i ON mi.ingredientId = i.ingredientId
    WHERE t.userId = @userId AND t.consumptionDate >= DATEADD(hour, -24, GETDATE())
    GROUP BY DATEPART(hour, t.consumptionDate)
`;
// Hent vandindtag for de seneste 24 timer
// Dette gøres ved at summere vandindtag for hvert timeinterval
// Dette gøres for alle vandregistreringer, der er registreret i de seneste 24 timer
// Når data er hentet, grupperes det efter time og summes for hvert timeinterval
// Der grupperes efter time og summes for hvert timeinterval
    const waterIntakeQuery = `
      SELECT DATEPART(hour, dateAndTimeOfDrinking) AS hour, SUM(amountOfWater) AS totalWater
      FROM waterRegistration
      WHERE userId = @userId AND dateAndTimeOfDrinking >= DATEADD(hour, -24, GETDATE())
      GROUP BY DATEPART(hour, dateAndTimeOfDrinking)
    `;

    // Hent aktivitetsforbrænding
    // Dette gøres ved at summere kalorier for aktiviteter for hvert timeinterval
    // Dette gøres for alle aktiviteter, der er registreret i de seneste 24 timer
    // Når data er hentet, grupperes det efter time og summes for hvert timeinterval
    const activityQuery = `
      SELECT DATEPART(hour, activityDate) AS hour, SUM(caloriesBurned) AS totalCaloriesBurned
      FROM activities
      WHERE userId = @userId AND activityDate >= DATEADD(hour, -24, GETDATE())
      GROUP BY DATEPART(hour, activityDate)
    `;

    // Basalforbrænding (BMR) for bruger fordelt på 24 timer
    const bmrQuery = `SELECT bmr FROM profiles WHERE userId = @userId`;

    // Udfør SQL-forespørgsler
    const foodIntake = await pool.request().input('userId', sql.Int, userId).query(mealQuery); // Hent data for måltider for brugeren
    const ingredientIntake = await pool.request().input('userId', sql.Int, userId).query(ingredientQuery); // Hent data for ingredienser for brugeren 
    const waterIntake = await pool.request().input('userId', sql.Int, userId).query(waterIntakeQuery); // Hent data for vandindtag for brugeren
    const activityBurn = await pool.request().input('userId', sql.Int, userId).query(activityQuery); // Hent data for aktivitetsforbrænding for brugeren
    const bmr = await pool.request().input('userId', sql.Int, userId).query(bmrQuery); // Hent data for basalforbrænding for brugeren

    

    // Saml og beregn data for hver time
    const hourlyData = []; // Opret et tomt array til at gemme data for hvert timeinterval
    // ** De 238.846 er en konverteringsfaktor fra kJ til kcal
    const bmrPerHour = bmr.recordset[0].bmr / 24 * 238.846; // Beregn basalforbrænding pr. time i kJ og konverter til kcal?

    // Gå igennem hver time i de seneste 24 timer
    for (let hour = 0; hour < 24; hour++) { // Loop gennem de sidste 24 timer
      const meals = foodIntake.recordset.find((row) => row.hour === hour)?.mealKcal || 0; // Find kalorier for måltider for den aktuelle time
      const ingredient = ingredientIntake.recordset.find((row) => row.hour === hour)?.ingredientKcal || 0; // Find kalorier for ingredienser for den aktuelle time
      const food = meals + ingredient; // Samlet kalorieindtag for den aktuelle time
      const water = waterIntake.recordset.find((row) => row.hour === hour)?.totalWater || 0; // Find vandindtag for den aktuelle time
      const activity = activityBurn.recordset.find((row) => row.hour === hour)?.totalCaloriesBurned || 0; // Find aktivitetsforbrænding for den aktuelle time
      const totalBurn = bmrPerHour + activity; // Samlet kalorieforbrug for den aktuelle time
      const surplusDeficit = food - totalBurn; // Beregn overskud eller underskud af kalorier for den aktuelle time

      // Tilføj data til det timebaserede array
      hourlyData.push({ 
        hour, // Time for den aktuelle time
        energy: food, // Kalorier for den aktuelle time
        water: (water / 1000).toFixed(2), // Konverter til liter
        calorieBurn: totalBurn.toFixed(2), // Afrund til 2 decimaler
        surplusDeficit: surplusDeficit.toFixed(2), // Konverter til liter
      });
    }

    res.json(hourlyData); // Send data som JSON-respons
  } catch (error) { // Hvis der opstår en fejl under hentning af data
    console.error('Fejl ved hentning af timebaseret data:', error); // Udskriv fejlmeddelelse til konsollen
    res.status(500).json({ message: 'Fejl ved hentning af timebaseret data', error: error.message }); // Returner en fejlmeddelelse
  }
});


// Endpoint for at hente dagsbaseret data for en bruger i de seneste 30 dage
app.get('/api/daily-nutri/monthly/:userId', async (req, res) => { 
  const { userId } = req.params; // Brugerens ID fra URL-parametre 

  // Forsøg at oprette forbindelse til databasen og hente data
  try {
    const pool = await sql.connect(dbConfig); // Opretter en pool hjælper med at oprette forbindelse til databasen og udføre forespørgsler
// pools er gode til at bruge til kortvarige opgaver samt til at oprette forbindelse til databasen

    // Hent kalorie- og vandindtag for de seneste 30 dage
    // Dette gøres ved at gruppere data efter dato og summere kalorier og vandindtag for hver dag
    // Dette gøres for måltider, ingredienser, vandindtag og aktivitetsforbrænding
    // Basalforbrænding (BMR) for bruger hentes også for at beregne det samlede kalorieforbrug
    const mealQuery = `
    SELECT CAST(t.consumptionDate AS DATE) AS date, 
           SUM(t.weight * m.kcal / 100) AS mealKcal
    FROM tracker t
    JOIN meals m ON t.mealId = m.mealId
    WHERE t.userId = @userId AND t.consumptionDate >= DATEADD(day, -30, GETDATE())
    GROUP BY CAST(t.consumptionDate AS DATE)
`;

    // Hent kalorieindtag fra ingredienser
    // Dette gøres ved at summere kalorier for ingredienser for hver dag
    // Ingredienskalorier beregnes ved at multiplicere vægten af ingrediensen med kalorier pr. 100 gram
    // Dette gøres for alle ingredienser, der er registreret i de seneste 30 dage
    // Ingredienser er knyttet til måltider, så det er nødvendigt at bruge en JOIN for at hente data
    // Når data er hentet, grupperes det efter dato og summes for hver dag
    // Der grupperes efter dato og summes for hver dag
const ingredientQuery = `
    SELECT CAST(t.consumptionDate AS DATE) AS date, 
           SUM(t.weight * i.kcal / 100) AS ingredientKcal
    FROM tracker t
    JOIN meal_ingredients mi ON t.mealIngredientId = mi.mealIngredientId
    JOIN ingredients i ON mi.ingredientId = i.ingredientId
    WHERE t.userId = @userId AND t.consumptionDate >= DATEADD(day, -30, GETDATE())
    GROUP BY CAST(t.consumptionDate AS DATE)
`;

    // Hent vandindtag for de seneste 30 dage
    // Dette gøres ved at summere vandindtag for hver dag
    // Dette gøres for alle vandregistreringer, der er registreret i de seneste 30 dage
    // Når data er hentet, grupperes det efter dato og summes for hver dag
    // Vandindtaget er i milliliter, så det er nødvendigt at konvertere til liter
    // Der grupperes efter dato og summes for hver dag
    const waterIntakeQuery = `
      SELECT CAST(dateAndTimeOfDrinking AS DATE) AS date, SUM(amountOfWater) AS totalWater
      FROM waterRegistration
      WHERE userId = @userId AND dateAndTimeOfDrinking >= DATEADD(day, -30, GETDATE())
      GROUP BY CAST(dateAndTimeOfDrinking AS DATE)
    `;

    // Hent aktivitetsforbrænding
    // Dette gøres ved at summere kalorier for aktiviteter for hver dag
    // Dette gøres for alle aktiviteter, der er registreret i de seneste 30 dage
    // Når data er hentet, grupperes det efter dato og summes for hver dag
    // Der grupperes efter dato og summes for hver dag
    const activityQuery = `
      SELECT CONVERT(date, activityDate) AS date, SUM(caloriesBurned) AS totalCaloriesBurned
      FROM activities
      WHERE userId = @userId AND activityDate >= DATEADD(day, -30, GETDATE())
      GROUP BY CONVERT(date, activityDate)
    `;

    // Basalforbrænding (BMR) for bruger fordelt på 30 dage
    const bmrQuery = `SELECT bmr FROM profiles WHERE userId = @userId`;

    // Udfør SQL-forespørgsler
    const foodIntake = await pool.request().input('userId', sql.Int, userId).query(mealQuery); // Hent data for måltider for brugeren
    const ingredientIntake = await pool.request().input('userId', sql.Int, userId).query(ingredientQuery); // Hent data for ingredienser for brugeren
    const waterIntake = await pool.request().input('userId', sql.Int, userId).query(waterIntakeQuery); // Hent data for vandindtag for brugeren
    const activityBurn = await pool.request().input('userId', sql.Int, userId).query(activityQuery); // Hent data for aktivitetsforbrænding for brugeren
    const bmr = await pool.request().input('userId', sql.Int, userId).query(bmrQuery); // Hent data for basalforbrænding for brugeren
    console.log(foodIntake.recordset, waterIntake.recordset, activityBurn.recordset, bmr.recordset); // Udskriv data til konsollen

    // Saml og beregn data for hver dag
    const dailyData = []; // Opret et tomt array til at gemme data for hvert dag
    const bmrMJ = bmr.recordset[0].bmr; // Basalforbrænding (BMR) for bruger i MJ
    const bmrPerDay = bmrMJ * 238.846; // Basalforbrænding (BMR) for bruger pr. dag i kcal. De 238.846 er en konverteringsfaktor fra kJ til kcal

    // Gå igennem hver af de sidste 30 dage
    for (let i = 0; i < 30; i++) { // Loop gennem de sidste 30 dage
      const date = new Date(); // Opret et nyt Date-objekt
      date.setDate(date.getDate() - i); // Træk i dage fra den aktuelle dato
      const dateString = date.toISOString().split('T')[0]; // Konverter datoen til en streng i formatet 'YYYY-MM-DD'

      // Find data for den aktuelle dato i resultaterne
      const meals = foodIntake.recordset.find((entry) => entry.date.toISOString().substring(0, 10) === dateString)?.mealKcal || 0; // Find kalorier for måltider for den aktuelle dato
      const ingredient = ingredientIntake.recordset.find((entry) => entry.date.toISOString().substring(0, 10) === dateString)?.ingredientKcal || 0; // Find kalorier for ingredienser for den aktuelle dato
      const food = meals + ingredient; // Samlet kalorieindtag for den aktuelle dato
      const water = waterIntake.recordset.find((entry) => entry.date.toISOString().substring(0, 10) === dateString)?.totalWater || 0; // Find vandindtag for den aktuelle dato
      const activity = activityBurn.recordset.find((entry) => entry.date.toISOString().substring(0, 10) === dateString)?.totalCaloriesBurned || 0; // Find aktivitetsforbrænding for den aktuelle dato
      const totalBurn = bmrPerDay + activity; // Samlet kalorieforbrug for den aktuelle dato

      // Tilføj data til det daglige array
      dailyData.push({ 
        date: dateString, // Dato for den aktuelle dato
        energy: food, // Kalorier for den aktuelle dato
        water: (water / 1000).toFixed(2), // Konverter til liter
        calorieBurn: totalBurn.toFixed(2), // Afrund til 2 decimaler
        surplusDeficit: (food - totalBurn).toFixed(2), // Beregn overskud eller underskud af kalorier for den aktuelle dato
      });
    }

    // Send data som JSON-respons for de sidste 30 dage
    res.json(dailyData);
  } catch (error) { // Hvis der opstår en fejl under hentning af data
    console.error('Fejl ved hentning af dagsbaseret data:', error); // Udskriv fejlmeddelelse til konsollen
    res.status(500).json({ message: 'Fejl ved hentning af dagsbaseret data', error: error.message }); // Returner en fejlmeddelelse
  }
});

  export default app; // Eksporter app routeren til brug i server.js filen

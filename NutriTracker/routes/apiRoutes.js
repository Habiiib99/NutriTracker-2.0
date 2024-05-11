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

const apiKey = '169792'; // API-nøgle til at hente data fra API'en

// Konstanter for sortKeys til næringsværdier der hentes fra API'en
const ProteinKey = 1110; // SortKey for protein
const kcalKey = 1030; // SortKey for kcal
const fatKey = 1310; // SortKey for fedt
const fiberKey = 1240; // SortKey for fiber


// Funktion til at hente foodID til en given søgestreng
async function fetchFoodID(searchString) {
    // API forventer første bogstav er stort, sikres derfor her.
    searchString = searchString.charAt(0).toUpperCase() + searchString.slice(1);
    // URL til at hente foodID'et ud fra vores search-string.
    const url = `https://nutrimonapi.azurewebsites.net/api/FoodItems/BySearch/${searchString}`;
    try {
      // GET-anmodning til at hente data fra API'et - bruger derfor API-nøglen.
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json', // Angiver at data er i JSON-format
          'X-API-Key': apiKey, // Angiver API-nøglen
        },
      });
      if (response.ok) {
        // Behandler svaret fra API'en.
        const result = await response.json(); // Konverterer svaret til JSON-format
        // Sender det første foodID, hvis GET-anmodningen lykkes. Spørgsmål. Skulle dette ikke være så man kan vælge mellem alle mulighederne?
        return result[0].foodID;
      // Hvis GET-anmodningen ikke lykkes, logges fejl til konsollen med fejlmeddelelse med response-status.
      } else {
        console.error('Failed to fetch data. Status:', response.status); // Udskriver fejlmeddelelse til konsollen
        return null;
      }
      // Hvis der sker en fejl i løbet af anmodningen, logges fejl til konsollen med fejl ved at fetche data.
    } catch (error) {
      console.error('Error fetching data:', error); // Udskriver fejlmeddelelse til konsollen
      return null;
    }
  }
  
  // Funktion til at hente næringsværdier baseret på foodID og sortKey
  async function fetchNutrientValue(foodID, sortKey) {
    // URL baseret på foodID og sortKey
    const url = `https://nutrimonapi.azurewebsites.net/api/FoodCompSpecs/ByItem/${foodID}/BySortKey/${sortKey}`;
    try {
      // GET-anmodning til at hente næringsværdierne fra API'en.
      const response = await fetch(url, { // Fetcher data fra API'en
        method: 'GET', // Anmodningstype
        headers: { // Angiver headers for anmodningen
          'Content-Type': 'application/json', // Angiver at data er i JSON-format
          'X-API-Key': apiKey, // Angiver API-nøglen
        },
      });
      // Behandler svaret fra API'en.
      if (response.ok) {
        const result = await response.json();
        // Hvis anmodning lykkes, returneres næringsværdierne for foodID'et og sortKey.
        if (result.length > 0) {
          return result[0].resVal;
        // Hvis der ikke er næringsværdier i API'en for det angivne foodID, logges fejlmeddelelse om dette.
        } else {
          console.log(`Nutrient value not found for foodID: ${foodID}`);
          return null;
        }
       // Hvis GET-anmodningen ikke lykkes, logges fejl til konsollen med fejlmeddelelse med response-status.
      } else {
        console.error('Failed to fetch nutrient value. Status:', response.status);
        return null;
      }
      // Hvis der sker en fejl i løbet af anmodningen, logges fejl til konsollen med fejl ved at fetche data.
    } catch (error) {
      console.error('Error fetching nutrient value:', error);
      return null;
    }
  }
  
  // Endpoint for at søge efter fødevarer
  app.get('/search-food/:searchString', async (req, res) => {
    try {
      const foodID = await fetchFoodID(req.params.searchString); // Henter foodID baseret på søgestrengen
      if (foodID) { // Hvis foodID findes, returneres det
        res.json({ foodID });
      } else { // Hvis foodID ikke findes, returneres en fejlmeddelelse
        res.status(404).json({ message: 'Fødevare ikke fundet' });
      }
    } catch (error) {
      res.status(500).json({ message: 'Server fejl', error });
    }
  });
  // Endpoint for at hente næringsværdier baseret på foodID og sortKey
  app.get('/nutrient-value/:foodID/:sortKey', async (req, res) => {
    try {
      const nutrientValue = await fetchNutrientValue(req.params.foodID, req.params.sortKey); // Henter næringsværdier baseret på foodID og sortKey
      if (nutrientValue) { // Hvis næringsværdier findes, returneres de
        res.json({ nutrientValue });
      } else {
        res.status(404).json({ message: 'Næringsværdi ikke fundet' }); // Hvis næringsværdier ikke findes, returneres en fejlmeddelelse
      }
    } catch (error) { // Hvis der opstår en fejl under hentning af næringsværdier
      res.status(500).json({ message: 'Server fejl', error }); // Hvis der opstår en fejl, returneres en fejlmeddelelse
    }
  });


export default app; // Eksporterer app routeren til brug i server.js filen

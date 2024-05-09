
import express from 'express';
import sql from 'mssql';
import { dbConfig } from '../config/database.js'; // Importér databasekonfigurationen


const app = express.Router();

const apiKey = '169792';

// Konstanter for sortKeys
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
          'Content-Type': 'application/json',
          'X-API-Key': apiKey,
        },
      });
      if (response.ok) {
        // Behandler svaret fra API'en.
        const result = await response.json();
        // Sender det første foodID, hvis GET-anmodningen lykkes. Spørgsmål. Skulle dette ikke være så man kan vælge mellem alle mulighederne?
        return result[0].foodID;
      // Hvis GET-anmodningen ikke lykkes, logges fejl til konsollen med fejlmeddelelse med response-status.
      } else {
        console.error('Failed to fetch data. Status:', response.status);
        return null;
      }
      // Hvis der sker en fejl i løbet af anmodningen, logges fejl til konsollen med fejl ved at fetche data.
    } catch (error) {
      console.error('Error fetching data:', error);
      return null;
    }
  }
  
  // Funktion til at hente næringsværdier baseret på foodID og sortKey
  async function fetchNutrientValue(foodID, sortKey) {
    // URL baseret på foodID og sortKey
    const url = `https://nutrimonapi.azurewebsites.net/api/FoodCompSpecs/ByItem/${foodID}/BySortKey/${sortKey}`;
    try {
      // GET-anmodning til at hente næringsværdierne fra API'en.
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': apiKey,
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
      const foodID = await fetchFoodID(req.params.searchString);
      if (foodID) {
        res.json({ foodID });
      } else {
        res.status(404).json({ message: 'Fødevare ikke fundet' });
      }
    } catch (error) {
      res.status(500).json({ message: 'Server fejl', error });
    }
  });
  // Endpoint for at hente næringsværdier baseret på foodID og sortKey
  app.get('/nutrient-value/:foodID/:sortKey', async (req, res) => {
    try {
      const nutrientValue = await fetchNutrientValue(req.params.foodID, req.params.sortKey);
      if (nutrientValue) {
        res.json({ nutrientValue });
      } else {
        res.status(404).json({ message: 'Næringsværdi ikke fundet' });
      }
    } catch (error) {
      res.status(500).json({ message: 'Server fejl', error });
    }
  });


export default app;
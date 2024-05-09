// server.js
import express from 'express';
import cors from 'cors';

const app = express();
const port = 3000;

app.use(express.json());
app.use(cors());

// Importér databasen
import { dbConfig } from './config/database.js';
import sql from 'mssql';

async function fetchUsers() {
  const pool = await connectToDb();
  const result = await pool.request().query('SELECT * FROM users');
  return result.recordset;
}

// CORS options (så den lokale server godtager den/ dette ændres?)
const corsOptions = {
  origin: 'http://127.0.0.1:5500',  // Tillad anmodninger fra denne oprindelse
  methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',  // Tilladte HTTP metoder
  allowedHeaders: 'Content-Type, Authorization',  // Tilladte headers
  credentials: true  // Tillad cookies/session across domains
};
// Anvender CORS med de specificerede indstillinger for at håndtere specifikke anmodninger.
app.use(cors(corsOptions));

app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'POST, PUT, GET, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
  next();
});

// importér routeren
import mealCreatorRouter from './routes/mealCreatorRoutes.js';
import accountRouter from './routes/accountRoutes.js';
import mealTrackerRouter from './routes/mealTrackerRoutes.js';
import waterRouter from './routes/waterTrackerRoutes.js';
import mealIngredientRouter from './routes/mealIngredientTrackerRoutes.js';
import settingsRouter from './routes/settingsRoutes.js';
import apiRouter from './routes/apiRoutes.js';
import activityRouter from './routes/activityRoutes.js';
import dailyNutriRouter from './routes/dailyNutriRoutes.js';



// Brug diverse routes
app.use('/api/account', accountRouter); // Tilføj users router til app
app.use('/api/mealcreator', mealCreatorRouter); // Tilføj meal creator router til app
app.use('/api/mealtracker', mealTrackerRouter); // Tilføj meal tracker router til app
app.use('/api/watertracker', waterRouter); // Tilføj water tracker router til app
app.use('/api/mealingredienttracker', mealIngredientRouter); // Tilføj meal ingredient tracker router til app
app.use('/api/settings', settingsRouter); // Tilføj setting router til app
app.use('/api/api', apiRouter); // Tilføj api router til app
app.use('/api/activity', activityRouter); // Tilføj activity router til app
app.use('/api/dailynutri', dailyNutriRouter); // Tilføj daily nutrition router til app


// Start serveren
app.listen(port, () => {
  console.log(`Server kører på http://localhost:${port}`);
});

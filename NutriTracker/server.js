import express from 'express'; // Importér Express biblioteket
import cors from 'cors'; // Importér CORS (Cross-Origin Resource Sharing) middleware

const app = express();  // Initialiserer en ny Express applikation
const port = process.env.PORT || 3000;  // Definerer portnummeret fra miljøvariable eller standardport 3000

// Middleware til parsing af JSON-formaterede request bodies
app.use(express.json());
// Aktiverer CORS (Cross-Origin Resource Sharing) for at tillade anmodninger fra forskellige origins
app.use(cors());

// Importér databasen
import { dbConfig } from './config/database.js'; // Importér databasekonfigurationen
import sql from 'mssql'; // Importér MSSQL driver

// Asynkron funktion til at hente brugere fra databasen
async function fetchUsers() {
  const pool = await connectToDb();  // Opretter forbindelse til databasen
  const result = await pool.request().query('SELECT * FROM users');  // Udfører SQL forespørgsel
  return result.recordset;  // Returnerer resultatet af forespørgslen
}

// CORS options (så den lokale server godtager den), definerer hvilke kilder og HTTP-metoder der er tilladt
const corsOptions = {
  origin: 'http://127.0.0.1:5500',  // Tillad anmodninger fra denne oprindelse
  methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',  // Tilladte HTTP metoder
  allowedHeaders: 'Content-Type, Authorization',  // Tilladte headers
  credentials: true  // Tillad cookies/session across domains
};
// Anvender CORS med de specificerede indstillinger for at håndtere specifikke anmodninger.
app.use(cors(corsOptions));

// Globalt middleware for at sætte generelle HTTP headers til response
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*'); // Tillad anmodninger fra alle kilder
  res.header('Access-Control-Allow-Methods', 'POST, PUT, GET, DELETE, OPTIONS'); // Tilladte HTTP metoder
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept'); // Tilladte headers
  next();  // Sender anmodningen videre til næste middleware
});

// Importerer og anvender router-moduler for de forskellige dele af applikationen
import mealCreatorRouter from './routes/mealCreatorRoutes.js'; 
import accountRouter from './routes/accountRoutes.js';
import mealTrackerRouter from './routes/mealTrackerRoutes.js';
import waterRouter from './routes/waterTrackerRoutes.js';
import mealIngredientRouter from './routes/mealIngredientTrackerRoutes.js';
import settingsRouter from './routes/settingsRoutes.js';
import apiRouter from './routes/apiRoutes.js';
import activityRouter from './routes/activityRoutes.js';
import dailyNutriRouter from './routes/dailyNutriRoutes.js';



// Tilknytter routers til specifikke URL stier
app.use('/api/account', accountRouter); // Tilføj users router til app
app.use('/api/mealcreator', mealCreatorRouter); // Tilføj meal creator router til app
app.use('/api/mealtracker', mealTrackerRouter); // Tilføj meal tracker router til app
app.use('/api/watertracker', waterRouter); // Tilføj water tracker router til app
app.use('/api/mealingredienttracker', mealIngredientRouter); // Tilføj meal ingredient tracker router til app
app.use('/api/settings', settingsRouter); // Tilføj setting router til app
app.use('/api/api', apiRouter); // Tilføj api router til app
app.use('/api/activity', activityRouter); // Tilføj activity router til app
app.use('/api/dailynutri', dailyNutriRouter); // Tilføj daily nutrition router til app


// Eksportér `app` instansen for at gøre den tilgængelig andre steder i applikationen (unitTests)
export { app };

// Start serveren kun, hvis miljøvariablen ikke er `test`
// Kondition for at undgå at serveren kører under test
// Dette forhindrer potentielle portkonflikter og uønskede sideeffekter under automatiserede tests
if (process.env.NODE_ENV !== 'test') { // Kører kun serveren, hvis miljøet ikke er test
  app.listen(port, () => { // Lytter på porten og starter serveren
    console.log(`Server kører på http://localhost:${port}`); // Besked til konsollen
  });
}










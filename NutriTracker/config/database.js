import sql from 'mssql';

// Definer databasekonfigurationen
export const dbConfig = {
  user: 'Habib',
  password: 'Dhdh2399!',
  server: 'servertesthabib.database.windows.net',
  database: 'NutriTracker1',
  options: {
    encrypt: true, // for Azure
    trustServerCertificate: false // kun nødvendigt til lokal udvikling
  }
};

// En hjælpefunktion til at oprette en databaseforbindelse
export async function connectToDb() {
  try {
    const pool = await sql.connect(dbConfig);
    console.log('Forbundet til databasen.');
    return pool; // Returnér poolen for brug i andre moduler
  } catch (err) {
    console.error('Fejl ved forbindelse til databasen:', err);
    throw err;
  }
}

//Mealtracker til ingredienser
const ingredient = document.getElementById('ingredient'); // Gemmer inputfeltet til ingrediens i en variabel
let ingredientId; // Variabel til at gemme ingrediensens ID

// Samme kode som i mealCreator.js
// Koden genbruges, da der er behov for samme funktionalitet
function populateIngredientList(results) { // Funktion til at udfylde listen med ingredienser
  const ingredientList = document.getElementById('ingredient-list'); // Gemmer listen med ingredienser i en variabel
  
  ingredientList.innerHTML = '' // Tømmer listen for eksisterende indhold

  for (const result of results) { // Itererer gennem resultaterne og opretter en option for hvert resultat
    const option = document.createElement('option') // Opretter et option-element til hver ingrediens
    option.value = result.foodName // Sætter værdien af option-elementet til ingrediensens navn
    option.text = result.foodName // Sætter teksten af option-elementet til ingrediensens navn
    option.id = result.foodID;  // Sætter id af option-elementet til ingrediensens id
    ingredientList.appendChild(option) // Tilføjer option-elementet til listen
  }

  // Eventlistener til at vælge en ingrediens fra listen
  document.getElementById('ingredient').addEventListener('input', function(event) { // Eventlistener aktiveres, når der skrives i inputfeltet
    const selectedOption = document.querySelector(`#ingredient-list option[value="${event.target.value}"]`); // Finder den valgte ingrediens i listen
    if (selectedOption) { // Hvis der er valgt en ingrediens
      ingredientId = selectedOption.id; // Gemmer ingrediensens id i en variabel
      console.log(ingredientId); // Udskriver ingrediensens id i konsollen
      document.getElementById('foodID').value = ingredientId; // Sætter ingrediensens id i inputfeltet
    }
  });
  
}

async function fetchFoodItems(input) { // Funktion til at hente ingredienser fra API
  const searchString = input.charAt(0).toUpperCase() + input.slice(1); // Konverterer input til stor forbogstav for at matche API'ets format
  const url = `https://nutrimonapi.azurewebsites.net/api/FoodItems/BySearch/${searchString}`; // URL til at hente ingredienser fra API

  try {
    let response = await fetch(url, { // Henter data fra API
      method: 'GET',
      headers: {
        'content-type': 'application/json', // Sætter header til at sende data i JSON-format. JSON er et tekstformat, der bruges til at udveksle data mellem en klient og en server
        'X-API-Key': apiKey, // Sætter API-nøgle til at identificere brugeren
      },
    });

    if (response.ok) { // Hvis respons er ok
      let result = await response.json(); // Konverterer respons til JSON-format. API'et returnerer data i JSON-format
      return result
    } else {
      console.error('Failed to fetch data. Status:', response.status); // Udskriver fejlmeddelelse til konsollen
      return null; // Returnerer null, hvis der opstår en fejl
    }
  } catch (error) { // Håndterer fejl
    console.error('Error fetching data:', error); 
    return null;
  }
}

ingredient.addEventListener('keypress', async (event) => { // Eventlistener aktiveres, når der trykkes på en tast i inputfeltet
  const results = await fetchFoodItems(event.target.value) // Henter ingredienser fra API baseret på input
  if (!results) { // Hvis der ikke er nogen resultater
    console.log('No results') // Udskriver besked i konsollen
    return
  }

  populateIngredientList(results) // Udfylder listen med ingredienser baseret på resultaterne


})
const ProteinKey = 1110; // SortKey for protein
const kcalKey = 1030; // SortKey for kcal
const fatKey = 1310; // SortKey for fedt
const fiberKey = 1240; // SortKey for fiber


async function fetchNutrientValue(foodID, sortKey, nutrientName) {
  const url = `https://nutrimonapi.azurewebsites.net/api/FoodCompSpecs/ByItem/${foodID}/BySortKey/${sortKey}`;

  try {
      let response = await fetch(url, { // Fetcher data fra API
          method: 'GET', // Sætter metode til GET
          headers: {
              'content-type': 'application/json', // Sætter header til at sende data i JSON-format. JSON er et tekstformat, der bruges til at udveksle data mellem en klient og en server
              'X-API-Key': apiKey, // Sætter API-nøgle til at identificere brugeren
          },
      });

      if (response.ok) { // Hvis respons er ok
          let result = await response.json(); // Konverterer respons til JSON-format
          if (result.length > 0) {
              return result[0].resVal; // Returnerer næringsværdi. resVal er værdien for næringsværdien og brutto er værdien for 100 gram samt findes i API'et
          } else {
              console.log(`${nutrientName} not found for foodID: ${foodID}`); // Udskriver besked i konsollen, hvis næringsværdi ikke findes
              return null;
          }
      } else {
          console.error('Failed to fetch nutrient value. Status:', response.status); // Udskriver fejlmeddelelse til konsollen
          return null; // Returnerer null, hvis der opstår en fejl
      }
  } catch (error) {
      console.error('Error fetching nutrient value:', error); // Udskriver fejlmeddelelse til konsollen
      return null; // Returnerer null, hvis der opstår en fejl
  }
}

// Funktion til at hente og validere næringsværdier
async function fetchAndValidateNutrient(foodID, sortKey, nutrientName) { // Funktion til at hente og validere næringsværdier
  const value = await fetchNutrientValue(foodID, sortKey, nutrientName); // Henter næringsværdi fra API
  const numberValue = parseFloat(value); // Konverterer næringsværdi til et tal

  if (!isNaN(numberValue)) { // Hvis næringsværdi er et tal
      return numberValue; // Returnerer næringsværdi
  } else { // Hvis næringsværdi ikke er et tal
      console.error(`Value for ${nutrientName} is not a number:`, value); // Udskriver fejlmeddelelse til konsollen
      return 0;
  }
}

// Funktion som henter næringsværdier for en ingrediens og sender dem til databasen
async function addIngredient(ingredientName) { // Funktion til at tilføje ingrediens til databasen
  const foodID = document.getElementById('foodID').value; // Henter foodID fra inputfeltet
  const kcal = await fetchAndValidateNutrient(foodID, kcalKey, 'Energy'); // Henter og validerer næringsværdi for kcal
  const protein = await fetchAndValidateNutrient(foodID, ProteinKey, 'Protein'); // Henter og validerer næringsværdi for protein
  const fat = await fetchAndValidateNutrient(foodID, fatKey, 'Fat'); // Henter og validerer næringsværdi for fedt
  const fiber = await fetchAndValidateNutrient(foodID, fiberKey, 'Fiber'); // Henter og validerer næringsværdi for fiber
  // Try-catch blok til at sende data til databasen
  try {
    // Send POST-anmodning til serveren med data om ingrediensen
    const response = await fetch('http://localhost:3000/api/mealingredienttracker/meal-tracker/ingredient', { // Data sendes først til ingredient-tabellen
      method: 'POST', // Sætter metode til POST
      headers: { 'Content-Type': 'application/json' }, // Sætter header til at sende data i JSON-format
      body: JSON.stringify({ // Konverterer data til JSON-format
        ingredient: ingredientName, // Ingrediensens navn
        kcal: kcal,  // Næringsværdi for kcal
        protein: protein, // Næringsværdi for protein
        fat: fat, // Næringsværdi for fedt
        fiber: fiber // Næringsværdi for fiber
      })
    });

    if (!response.ok) { // Hvis respons ikke er ok
      throw new Error('Fejl ved tilføjelse af ingrediens'); // Kaster en fejl, hvis der opstår en fejl
    } 

    const data = await response.json();  // Konverterer respons til JSON-format
    return data; // Returnerer data

  } catch (error) { // Håndterer fejl. Bruger catch til at fange fejlen inden for try-blokken
    console.error('Fejl ved tilføjelse af ingrediens:', error); // Udskriver fejlmeddelelse til konsollen
    throw error; // Kaster en fejl
  }}

  // Lignende funktion som ovenfor, men denne gang sendes data til meal-ingredients-tabellen
  // Dette er således, så at vi kan tracke ingredienserne
  async function addMealIngredient(ingredientId, weight) { // IngrediensId vil have en relation til ingredient-tabellen
    const userId = JSON.parse(localStorage.getItem('user')).userId; // Henter brugerens id fra localStorage
  
    // try bruges til at teste en blok af kode for fejl, mens catch bruges til at fange fejlen, hvis der opstår en fejl
    try {
    const response = await fetch('http://localhost:3000/api/mealingredienttracker/meal-tracker/meal-ingredients', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }, // Sætter header til at sende data i JSON-format
      body: JSON.stringify({ // Konverterer data til JSON-format
        ingredientId: ingredientId,
        weightOfIngredient: weight,
        userId: userId
      })
    });

    if (!response.ok) {
      throw new Error('Fejl ved tilføjelse af ingrediens til måltidsingredienser'); // Kaster en fejl, hvis der opstår en fejl
    }

    const data = await response.json();  // Konverterer respons til JSON-format
    return data;  // Returnerer data

  } catch (error) {
    console.error('Fejl ved tilføjelse af ingrediens til måltidsingredienser:', error); // Udskriver fejlmeddelelse til konsollen
    throw error; // Kaster en fejl
  }}


  // Endnu en async funktion, som denne gang tracker ingredienserne
  async function trackIngredient(mealIngredientId, weight, location) { // mealIngredientId vil have en relation til meal_ingredients-tabellen

    // try bruges til at teste en blok af kode for fejl, mens catch bruges til at fange fejlen, hvis der opstår en fejl
    try {
    const response = await fetch('http://localhost:3000/api/mealingredienttracker/meal-tracker/track-ingredient', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        mealIngredientId: mealIngredientId,
        weight: weight,
        userId: JSON.parse(localStorage.getItem('user'))?.userId, // Henter brugerens id fra localStorage
        consumptionDate: new Date().toISOString().slice(0, 16).replace('T', ' '), // .slice og .replace bruges til at formatere datoen
        location: location
      })
    });
    
    if (!response.ok) {
      throw new Error('Fejl ved tilføjelse af ingrediens til måltidsingredienser'); // Kaster en fejl, hvis der opstår en fejl
    }
  } catch (error) {
    console.error('Fejl ved tilføjelse af ingrediens til måltidsingredienser:', error); // Udskriver fejlmeddelelse til konsollen
    throw error;
  }}


  // Funktion til at hente brugerens geolocation
  async function getLocation() {
    return new Promise((resolve, reject) => { // promise bruges, da geolocation er asynkront
      // Hent brugerens geolocation
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (position) => { // Hvis geolocation er tilgængelig, hentes brugerens position og gemmes
            const location = `Latitude: ${position.coords.latitude}, Longitude: ${position.coords.longitude}`;
            resolve(location);
          },
          (error) => {
            console.warn('Geolocation ikke tilgængelig:', error.message);
            resolve('Unknown'); // Hvis geolocation ikke er tilgængelig, sættes location til 'Unknown'
          }
        );
      } else {
        resolve('Unknown'); // Hvis geolocation ikke er tilgængelig, sættes location til 'Unknown'
      }
    });
  }


  // Funktion som samler det hele og registrerer ingrediensen i alle tre tabeller
  async function registerIngredient() {
    const ingredientName = document.getElementById('ingredient').value; // Ingrediensens navn hentes fra inputfeltet
    const weight = document.getElementById('ingredient-weight').value; // Ingrediensens vægt hentes fra inputfeltet
  
    try {
      const response = await addIngredient(ingredientName); // Ingrediens tilføjes til ingredient-tabellen
      const ingredientId = response.ingredientId;
      const response1 = await addMealIngredient(ingredientId, weight);  // Ingrediens tilføjes til meal_ingredients-tabellen med ingredientId fra ingredient-tabellen
      const mealIngredientId = response1.mealIngredientId;
      
      // Hent brugerens position
      const location = await getLocation();  // getLocation bruges til at hente brugerens position
    
      await trackIngredient(mealIngredientId, weight, location); // Ingrediens trackes i track_ingredient-tabellen med mealIngredientId fra meal_ingredients-tabellen
    

      alert('Ingrediens tilføjet med succes til begge tabeller');
      updateIngredientLogDisplay() // UI opdateres
  
    } catch (error) {
      console.error('Fejl:', error);
      alert('Der opstod en fejl under registrering af ingrediens');
    }
  }
  
  // Eventlistener som kører når der klikkes på knappen
  document.getElementById('ingredient-registration-form').addEventListener('submit', function (event) {
    event.preventDefault(); // Forhindrer standardadfærd for knappen
    registerIngredient(); // Ingrediensen registreres
  });

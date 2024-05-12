// MEAL CREATOR
// Definér konstante sortKeys
const apiKey = '169972';
const ProteinKey = 1110; // SortKey for protein
const kcalKey = 1030; // SortKey for kcal
const fatKey = 1310; // SortKey for fedt
const fiberKey = 1240; // SortKey for fiber

// Klasse til fødevareelementer
class FoodItem { // Klasse til fødevareelementer
    constructor(name, foodID, kcal, protein, fat, fiber, quantity) {
        this.name = name;
        this.foodID = foodID;
        this.kcal = kcal;
        this.protein = protein;
        this.fat = fat;
        this.fiber = fiber;
        this.quantity = quantity || 0;
    }
}

// Klasse til måltider
class Meal { // Klasse til måltider
    constructor(name) { // Konstruktør til at oprette et nyt måltid
        this.name = name; // Navn på måltid
        this.ingredients = []; // Ingredienser i måltid (tomt array)
    }

    // metode til at tilføje ingredienser
    addIngredient(foodItem) { // metode til at tilføje ingredienser
        this.ingredients.push(foodItem); // Tilføjer fødevareelement til array
    }

    // metode til at beregne den samlede ernæringsmæssige værdi
    calculateTotalNutrients() { // metode til at beregne den samlede ernæringsmæssige værdi
        const total = { // variabel til at gemme den samlede ernæringsmæssige værdi
            kcal: 0,
            protein: 0,
            fat: 0,
            fiber: 0
        };
        // itererer gennem ingredienser og beregner den samlede ernæringsmæssige værdi
        this.ingredients.forEach((ingredient) => { // forEach-loop til at iterere gennem ingredienser
            const quantityInKg = (ingredient.quantity || 0) / 100; // konvertere til per 100 gram
            total.kcal += ingredient.kcal * quantityInKg; // beregner den samlede energi
            total.protein += ingredient.protein * quantityInKg; // beregner den samlede protein
            total.fat += ingredient.fat * quantityInKg; // beregner den samlede fedt
            total.fiber += ingredient.fiber * quantityInKg; // beregner den samlede fiber
        });

        return total; // returnerer den samlede ernæringsmæssige værdi
    }
}

// Funktion til at hente fødevareelementer
async function fetchFoodItems(input) { 
    const searchString = input.charAt(0).toUpperCase() + input.slice(1); // Konverterer første bogstav til stort
    const url = `https://nutrimonapi.azurewebsites.net/api/FoodItems/BySearch/${searchString}`;

    // Try catch blok er en måde at håndtere fejl på og bruges til at håndtere fetch
    try {
        let response = await fetch(url, {
            method: 'GET',
            headers: {
                'content-type': 'application/json', // Sæt header til at sende data i JSON-format. JSON er et tekstformat, der bruges til at udveksle data mellem en klient og en server
                'X-API-Key': apiKey, // Sæt API-nøgle til at identificere brugeren
            },
        });

        if (response.ok) { // Hvis respons er ok
            let result = await response.json(); // konverter respons til JSON-format
            return result
        } else {
            console.error('Failed to fetch data. Status:', response.status); // Udskriv fejlmeddelelse til konsollen
            return null;
        }
    } catch (error) { // Håndter fejl
        console.error('Error fetching data:', error); // Udskriv fejlmeddelelse til konsollen
        return null;  // returner null hvis der opstår en fejl
    }
}

// Funktion til at hente ernæringsindhold for en fødevare
async function fetchFoodItem(ingredientName) {
    // Henter fødevare baseret på foodID
    const foodID = await fetchFoodID(ingredientName);// Henter fødevare baseret på foodID
    if (!foodID) return null; // Returner null hvis foodID ikke findes

    // henter næringsindhold for fødevaren
    const kcal = await fetchAndValidateNutrient(foodID, kcalKey, 'Energy'); // Henter næringsindhold for fødevaren
    const protein = await fetchAndValidateNutrient(foodID, ProteinKey, 'Protein'); // Henter næringsindhold for fødevaren
    const fat = await fetchAndValidateNutrient(foodID, fatKey, 'Fat'); // Henter næringsindhold for fødevaren
    const fiber = await fetchAndValidateNutrient(foodID, fiberKey, 'Fiber'); // Henter næringsindhold for fødevaren

    // Returnerer fødevareelement
    return new FoodItem(ingredientName, foodID, kcal, protein, fat, fiber); // med nye værdier for næringsindhold
}

// Funktion til at hente foodID for en fødevare baseret på navn
async function fetchFoodID(searchString) {
    searchString = searchString.charAt(0).toUpperCase() + searchString.slice(1); // Konverterer første bogstav til stort
    const url = `https://nutrimonapi.azurewebsites.net/api/FoodItems/BySearch/${searchString}`; // URL til at hente fødevareelementer

    // Try-catch blok til at håndtere fetch og returnere data
    try {
        let response = await fetch(url, { // Fetch-anmodning til serveren
            method: 'GET',
            headers: {
                'content-type': 'application/json', // Sæt header til at sende data i JSON-format. JSON er et tekstformat, der bruges til at udveksle data mellem en klient og en server
                'X-API-Key': apiKey,
            },
        });

        if (response.ok) {
            let result = await response.json(); // konverter respons til JSON-format
            return result[0].foodID;
        } else {
            console.error('Failed to fetch data. Status:', response.status); // Udskriv fejlmeddelelse til konsollen
            return null;
        }
    } catch (error) {
        console.error('Error fetching data:', error); // Udskriv fejlmeddelelse til konsollen
        return null;
    }
}

// Funktion til at hente makriværdi for en fødevare
async function fetchNutrientValue(foodID, sortKey, nutrientName) { // Funktion til at hente makroværdi for en fødevare
    const url = `https://nutrimonapi.azurewebsites.net/api/FoodCompSpecs/ByItem/${foodID}/BySortKey/${sortKey}`;

    try {
        let response = await fetch(url, { // Fetch-anmodning til serveren
            method: 'GET',
            headers: {
                'content-type': 'application/json', // Sæt header til at sende data i JSON-format. JSON er et tekstformat, der bruges til at udveksle data mellem en klient og en server
                'X-API-Key': apiKey,
            },
        });

        if (response.ok) {
            let result = await response.json(); // konverter respons til JSON-format
            if (result.length > 0) {
                return result[0].resVal; // Returner værdien for første resultat
            } else {
                console.log(`${nutrientName} not found for foodID: ${foodID}`); // Udskriv fejlmeddelelse til konsollen
                return null; // Returner null hvis næringsindhold ikke findes
            }
        } else {
            console.error('Failed to fetch nutrient value. Status:', response.status); // Udskriv fejlmeddelelse til konsollen
            return null;
        }
    } catch (error) {
        console.error('Error fetching nutrient value:', error); // Udskriv fejlmeddelelse til konsollen
        return null;
    }
}


// funktion til at kalde fetchNutrientValue og validere resultat
async function fetchAndValidateNutrient(foodID, sortKey, nutrientName) { // funktion til at kalde fetchNutrientValue og validere resultat
    const value = await fetchNutrientValue(foodID, sortKey, nutrientName); // Henter næringsindhold for fødevaren
    const numberValue = parseFloat(value); // Konverterer værdi til et tal

    if (!isNaN(numberValue)) { // Hvis værdi er et tal
        return numberValue; // Returner værdi
    } else {
        console.error(`Value for ${nutrientName} is not a number:`, value); // Udskriv fejlmeddelelse til konsollen
        return 0; // Returner 0 hvis værdi ikke er et tal
    }
}


let currentMeal = new Meal('');  // Opretter et nyt måltid

// Opdaterer antallet af ingredienser
function updateIngredientCount() { 
    const count = currentMeal.ingredients.length; // Tæller antallet af ingredienser
    document.getElementById('ingredient-count').textContent = count; // Opdaterer antallet af ingredienser i HTML
}

// Funktion til at udfylde listen i HTML
function populateIngredientList(results) { // Funktion til at udfylde listen i HTML
    const ingredientList = document.getElementById('ingredient-list'); // Henter datalisten fra HTML
    // rydder listen
    ingredientList.innerHTML = '' // Rydder datalisten

    for (const result of results) { // for of loop som itererer gennem resultaterne
        const option = document.createElement('option') // opretter et option-element
        option.value = result.foodName // Sætter værdien af option-elementet til fødevarenavnet
        option.text = result.foodName // Sætter teksten af option-elementet til fødevarenavnet

        ingredientList.appendChild(option) // tilføjer hvert option-elementet til listen i HTML
    }
}

// eventlistener til DOMContentLoaded som henter elementer fra HTML
document.addEventListener('DOMContentLoaded', () => {
    const mealForm = document.getElementById('meal-creator-form'); // Henter formen fra HTML
    const addIngredientBtn = document.getElementById('add-ingredient-btn'); // Henter knappen fra HTML
    const ingredientsTableBody = document.getElementById('ingredientsTable').getElementsByTagName('tbody')[0];  // Henter tbody-elementet fra tabellen
    const mealNameInput = document.getElementById('meal-name'); // Henter inputfeltet for måltidsnavn fra HTML
    const ingredientNameInput = document.getElementById('ingredient-name'); // Henter inputfeltet for ingrediensnavn fra HTML

    // Når der skrives i inputfeltet for ingrediensnavn
    ingredientNameInput.addEventListener('keypress', async (event) => { // Eventlistener til at hente fødevareelementer
        const results = await fetchFoodItems(event.target.value) // henter fødevareelementer baseret på input
        if (!results) { // Hvis der ikke er nogen resultater
            console.log('No results') // Udskriv besked til konsollen
            return // Stop funktionen
        }

        populateIngredientList(results) // udfylder datalisten i HTML


    })


    // Funktion som køres når der klikkes på "tilføj ingrediens" knappen
    addIngredientBtn.addEventListener('click', async () => {
        const ingredientNameInput = document.getElementById('ingredient-name').value.trim(); // .trim() fjerner mellemrum foran og bagved
        const ingredientQuantityInput = parseFloat(document.getElementById('ingredient-quantity').value.trim()); // .trim() fjerner mellemrum foran og bagved

        // Hvis der er indtastet en gyldig fødevare og mængde
        if (ingredientNameInput && ingredientQuantityInput && ingredientQuantityInput > 0) {
            const foodItem = await fetchFoodItem(ingredientNameInput); // henter ernæringsindhold for fødevaren
            if (foodItem) {
                foodItem.quantity = ingredientQuantityInput; // sætter mængden for fødevaren
                currentMeal.addIngredient(foodItem);
                updateIngredientsTable();  // opdaterer tabellen med data om ingredienser
                updateNutritionalSummary(); // kalder funktion som opdaterer makroer i HTML
                updateIngredientCount();  // opdaterer antallet af ingredienser
            } else {
                alert('Fødevare blev ikke fundet.');
            }
        } else {
            alert('Indtast venligst en gyldig fødevare og mængde.');
        }
    });

    // Eventlistener til at gemme måltid
    mealForm.addEventListener('submit', (event) => { 
        event.preventDefault(); // forhindrer standardadfærd for knappen
        const mealName = mealNameInput.value.trim(); // .trim() fjerner mellemrum foran og bagved
        if (mealName && currentMeal.ingredients.length > 0) {
            currentMeal.name = mealName;
            saveMeal(currentMeal); // Funktion kaldes for at gemme måltid
            alert('Måltid oprettet!');
            resetMealCreator(); // Meal creator siden nulstilles
        } else {
            alert('Indtast venligst et måltidsnavn og tilføj mindst en ingrediens.');
        }
    });

    // Viser data om ingredienser
    function updateIngredientsTable() { // Funktion til at vise data om ingredienser
        ingredientsTableBody.innerHTML = ''; // Rydder tabellen for tidligere data
        currentMeal.ingredients.forEach((ingredient, index) => {
            const row = ingredientsTableBody.insertRow(); // Laver en ny række 
            row.innerHTML = ` 
                <td>${ingredient.name}</td> 
                <td>${ingredient.foodID}</td>
                <td>${ingredient.quantity}</td>
                <td><button onclick="deleteIngredient(${index})">Slet</button></td>
            `; // Der laves en celle for data om ingredienset og en celle med en slet-knap
        });
    }

    function updateNutritionalSummary() { // Funktion til at opdatere makroer i HTML
        const totalNutrients = currentMeal.calculateTotalNutrients(); // Beregner den samlede ernæringsmæssige værdi
        document.getElementById('total-kcal').textContent = totalNutrients.kcal.toFixed(2); // Opdaterer HTML-elementer med makroer
        document.getElementById('total-protein').textContent = totalNutrients.protein.toFixed(2); // Opdaterer HTML-elementer med makroer
        document.getElementById('total-fat').textContent = totalNutrients.fat.toFixed(2); // Opdaterer HTML-elementer med makroer
        document.getElementById('total-fiber').textContent = totalNutrients.fiber.toFixed(2); // Opdaterer HTML-elementer med makroer
    }

    // Funktion til at gemme i databasen
    async function saveMeal(meal) {
        const user = JSON.parse(localStorage.getItem('user')); // Henter brugeroplysninger fra localStorage

        // klassens metode kaldes for at beregne den samlede ernæringsmæssige værdi 
        meal.totalNutrients = meal.calculateTotalNutrients();
        let body = { // Opretter et objekt med alt data om måltidet
            mealName: meal.name, 
            userId: user.userId,
            kcal: meal.totalNutrients.kcal,
            protein: meal.totalNutrients.protein,
            fat: meal.totalNutrients.fat,
            fiber: meal.totalNutrients.fiber,
            ingredients: meal.ingredients.map(ing => ({ // .map() laver et nyt array med data om ingredienser
                ingredientId: ing.foodID,
                weight: ing.quantity
            }))
        };

        console.log('Body:', body); // Udskriver data til konsollen

        // Try-catch blok til at håndtere fetch 
        try {
            const response = await fetch('http://localhost:3000/api/mealcreator/meals', {
                method: 'POST', // Post andmodning da der skal gemmes data
                headers: { 'Content-Type': 'application/json' }, // Sæt header til at sende data i JSON-format
                body: JSON.stringify(body)  // konverterer data til JSON-format
            });
            
            
            const data = await response.json(); // konverter respons til JSON-format
            if (response.ok) {
                alert('Måltid oprettet!');
                resetMealCreator(); // Nulstiller siden 
            } else {
                throw new Error(data.message); // Kaster en fejl hvis der er en fejl
            }
        } catch (error) {
            console.error('Error:', error);
            alert('Fejl ved oprettelse af måltid.');
        }
    }
    

    // Når måltid er blevet oprettet, nulstilles 
    function resetMealCreator() {
        mealNameInput.value = ''; // HTML elementer nulstilles
        document.getElementById('ingredient-name').value = ''; // HTML elementer nulstilles
        document.getElementById('ingredient-quantity').value = ''; // HTML elementer nulstilles
        currentMeal = new Meal(''); // Variablen nulstilles
        updateIngredientsTable(); // Nulstil tabellen
        updateNutritionalSummary(); // Nulstil makroer
        updateIngredientCount(); // Nulstil antallet af ingredienser
    }

    // Når man vil fjerne en ingrediens
    window.deleteIngredient = (index) => {
        currentMeal.ingredients.splice(index, 1); // Fjerner ingrediens fra array, baseret på index
        updateIngredientsTable(); // Opdaterer tabellen
        updateNutritionalSummary(); // Opdaterer makroer
        updateIngredientCount();  // Opdaterer antallet af ingredienser
    }
})

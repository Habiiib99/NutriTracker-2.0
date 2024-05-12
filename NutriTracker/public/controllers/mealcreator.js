// MEAL CREATOR
// Definér konstante sortKeys
const apiKey = '169972';
const ProteinKey = 1110; // SortKey for protein
const kcalKey = 1030; // SortKey for kcal
const fatKey = 1310; // SortKey for fedt
const fiberKey = 1240; // SortKey for fiber

// Klasse til fødevareelementer
class FoodItem {
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
class Meal {
    constructor(name) {
        this.name = name;
        this.ingredients = [];
    }

    // metode til at tilføje ingredienser
    addIngredient(foodItem) {
        this.ingredients.push(foodItem);
    }

    // metode til at beregne den samlede ernæringsmæssige værdi
    calculateTotalNutrients() {
        const total = {
            kcal: 0,
            protein: 0,
            fat: 0,
            fiber: 0
        };
        // itererer gennem ingredienser og beregner den samlede ernæringsmæssige værdi
        this.ingredients.forEach((ingredient) => {
            const quantityInKg = (ingredient.quantity || 0) / 100; // konvertere til per 100 gram
            total.kcal += ingredient.kcal * quantityInKg;
            total.protein += ingredient.protein * quantityInKg;
            total.fat += ingredient.fat * quantityInKg;
            total.fiber += ingredient.fiber * quantityInKg;
        });

        return total;
    }
}

// Funktion til at hente fødevareelementer
async function fetchFoodItems(input) {
    const searchString = input.charAt(0).toUpperCase() + input.slice(1); // Konverterer første bogstav til stort
    const url = `https://nutrimonapi.azurewebsites.net/api/FoodItems/BySearch/${searchString}`;

    try {
        let response = await fetch(url, {
            method: 'GET',
            headers: {
                'content-type': 'application/json',
                'X-API-Key': apiKey,
            },
        });

        if (response.ok) {
            let result = await response.json();
            return result
        } else {
            console.error('Failed to fetch data. Status:', response.status);
            return null;
        }
    } catch (error) {
        console.error('Error fetching data:', error);
        return null;
    }
}

// Funktion til at hente ernæringsindhold for en fødevare
async function fetchFoodItem(ingredientName) {
    // Henter fødevare baseret på foodID
    const foodID = await fetchFoodID(ingredientName);
    if (!foodID) return null;

    // henter næringsindhold for fødevaren
    const kcal = await fetchAndValidateNutrient(foodID, kcalKey, 'Energy');
    const protein = await fetchAndValidateNutrient(foodID, ProteinKey, 'Protein');
    const fat = await fetchAndValidateNutrient(foodID, fatKey, 'Fat');
    const fiber = await fetchAndValidateNutrient(foodID, fiberKey, 'Fiber');

    // Returnerer fødevareelement
    return new FoodItem(ingredientName, foodID, kcal, protein, fat, fiber);
}

async function fetchFoodID(searchString) {
    searchString = searchString.charAt(0).toUpperCase() + searchString.slice(1);
    const url = `https://nutrimonapi.azurewebsites.net/api/FoodItems/BySearch/${searchString}`;

    try {
        let response = await fetch(url, {
            method: 'GET',
            headers: {
                'content-type': 'application/json',
                'X-API-Key': apiKey,
            },
        });

        if (response.ok) {
            let result = await response.json();
            return result[0].foodID;
        } else {
            console.error('Failed to fetch data. Status:', response.status);
            return null;
        }
    } catch (error) {
        console.error('Error fetching data:', error);
        return null;
    }
}

// Funktion til at hente makriværdi for en fødevare
async function fetchNutrientValue(foodID, sortKey, nutrientName) {
    const url = `https://nutrimonapi.azurewebsites.net/api/FoodCompSpecs/ByItem/${foodID}/BySortKey/${sortKey}`;

    try {
        let response = await fetch(url, {
            method: 'GET',
            headers: {
                'content-type': 'application/json',
                'X-API-Key': apiKey,
            },
        });

        if (response.ok) {
            let result = await response.json();
            if (result.length > 0) {
                return result[0].resVal; // Returner værdien for første resultat
            } else {
                console.log(`${nutrientName} not found for foodID: ${foodID}`);
                return null;
            }
        } else {
            console.error('Failed to fetch nutrient value. Status:', response.status);
            return null;
        }
    } catch (error) {
        console.error('Error fetching nutrient value:', error);
        return null;
    }
}


// funktion til at kalde fetchNutrientValue og validere resultat
async function fetchAndValidateNutrient(foodID, sortKey, nutrientName) {
    const value = await fetchNutrientValue(foodID, sortKey, nutrientName);
    const numberValue = parseFloat(value);

    if (!isNaN(numberValue)) {
        return numberValue;
    } else {
        console.error(`Value for ${nutrientName} is not a number:`, value);
        return 0;
    }
}


let currentMeal = new Meal(''); 

// Opdaterer antallet af ingredienser
function updateIngredientCount() {
    const count = currentMeal.ingredients.length;
    document.getElementById('ingredient-count').textContent = count;
}

// Funktion til at udfylde listen i HTML
function populateIngredientList(results) {
    const ingredientList = document.getElementById('ingredient-list');
    // rydder listen
    ingredientList.innerHTML = ''

    for (const result of results) { // for of loop som itererer gennem resultaterne
        const option = document.createElement('option') // opretter et option-element
        option.value = result.foodName
        option.text = result.foodName

        ingredientList.appendChild(option) // tilføjer hvert option-elementet til listen i HTML
    }
}

// eventlistener til DOMContentLoaded som henter elementer fra HTML
document.addEventListener('DOMContentLoaded', () => {
    const mealForm = document.getElementById('meal-creator-form');
    const addIngredientBtn = document.getElementById('add-ingredient-btn');
    const ingredientsTableBody = document.getElementById('ingredientsTable').getElementsByTagName('tbody')[0]; 
    const mealNameInput = document.getElementById('meal-name');
    const ingredientNameInput = document.getElementById('ingredient-name');

    // Når der skrives i inputfeltet for ingrediensnavn
    ingredientNameInput.addEventListener('keypress', async (event) => {
        const results = await fetchFoodItems(event.target.value) // henter fødevareelementer baseret på input
        if (!results) {
            console.log('No results')
            return
        }

        populateIngredientList(results) // udfylder datalisten i HTML


    })


    // Funktion som køres når der klikkes på "tilføj ingrediens" knappen
    addIngredientBtn.addEventListener('click', async () => {
        const ingredientNameInput = document.getElementById('ingredient-name').value.trim(); // .trim() fjerner mellemrum foran og bagved
        const ingredientQuantityInput = parseFloat(document.getElementById('ingredient-quantity').value.trim());

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
        event.preventDefault();
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
    function updateIngredientsTable() {
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
        const totalNutrients = currentMeal.calculateTotalNutrients();
        document.getElementById('total-kcal').textContent = totalNutrients.kcal.toFixed(2);
        document.getElementById('total-protein').textContent = totalNutrients.protein.toFixed(2);
        document.getElementById('total-fat').textContent = totalNutrients.fat.toFixed(2);
        document.getElementById('total-fiber').textContent = totalNutrients.fiber.toFixed(2);
    }

    // Funktion til at gemme i databasen
    async function saveMeal(meal) {
        const user = JSON.parse(localStorage.getItem('user'));

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

        console.log('Body:', body);

        // Try-catch blok til at håndtere fetch 
        try {
            const response = await fetch('http://localhost:3000/api/mealcreator/meals', {
                method: 'POST', // Post andmodning da der skal gemmes data
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body) 
            });
            
            
            const data = await response.json();
            if (response.ok) {
                alert('Måltid oprettet!');
                resetMealCreator(); // Nulstiller siden 
            } else {
                throw new Error(data.message);
            }
        } catch (error) {
            console.error('Error:', error);
            alert('Fejl ved oprettelse af måltid.');
        }
    }
    

    // Når måltid er blevet oprettet, nulstilles 
    function resetMealCreator() {
        mealNameInput.value = '';
        document.getElementById('ingredient-name').value = '';
        document.getElementById('ingredient-quantity').value = ''; // HTML elementer nulstilles
        currentMeal = new Meal(''); // Variablen nulstilles
        updateIngredientsTable(); // Nulstil tabellen
        updateNutritionalSummary(); // Nulstil makroer
        updateIngredientCount(); // Nulstil antallet af ingredienser
    }

    // Når man vil fjerne en ingrediens
    window.deleteIngredient = (index) => {
        currentMeal.ingredients.splice(index, 1); // Fjerner ingrediens fra array, baseret på index
        updateIngredientsTable();
        updateNutritionalSummary();
        updateIngredientCount(); 
    }
})

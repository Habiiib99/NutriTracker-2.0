const apiKey = '169792'

// Dropdown-menuen skal udfyldes med måltider fra databasen
function populateMealDropdown() { // Funktion til at udfylde dropdown-menuen med måltider
  
  const user = JSON.parse(localStorage.getItem('user')); // Hent brugeroplysninger fra localStorage
  const userId = user.userId; // Hent brugerens id
  fetch('http://localhost:3000/api/mealtracker/api/meals')  // Send GET-anmodning for at hente måltider fra databasen
    .then(response => response.json()) // Konverter respons til JSON-format
    .then(meals => { 
    const mealDropdown = document.getElementById('meal-select-dropdown'); // Hent dropdown-menuen
    mealDropdown.innerHTML = ''; // nullstil dropdown-menuen

    // For each bruges til at oprette en valgmulighed for hvert måltid
    meals.forEach(meal => { 
      if(meal.userId === userId){ // Hvis måltidet tilhører brugeren
      const option = document.createElement('option'); // Opret et option-element
      option.value = meal.mealId;  // Hver option får en værdi svarende til måltidets id. Dette bliver nyttigt senere
      option.textContent = meal.mealName; // Vis måltidets navn
      mealDropdown.appendChild(option); // Tilføj option-elementet til dropdown-menuen
    }});
  })
  .catch(error => {
    console.error('Error loading meals:', error); // Håndter fejl
  });
}


// Eventlistener til at opdatere vægten, hvis et nyt måltid vælges
document.getElementById('meal-select-dropdown').addEventListener('change', async function () { 
  const mealId = this.value; // Hent værdien af det valgte måltid
  if (!mealId) { // Hvis der ikke er valgt et måltid
    document.getElementById('meal-weight').value = '';  // Sæt inputfeltet for vægt til tom
    return; // Stop funktionen
  }

  // try catch blok til at håndtere fejl og undgå at stoppe programmet
  try {
    // Hent vægten fra serveren
    const response = await fetch(`http://localhost:3000/api/mealtracker/api/meals/weight/${mealId}`);
    if (response.ok) {
      const { totalWeight } = await response.json(); // Konverter respons til JSON-format
      // Opdater inputfeltet for vægten
      document.getElementById('meal-weight').value = totalWeight; // Sæt inputfeltet for vægt til den hentede vægt
    } else {
      console.error('Kunne ikke hente vægt:', await response.json()); // Håndter fejl
    }
  } catch (error) {
    console.error('Fejl ved hentning af vægt:', error); // Håndter fejl
  }
});

// Funktion til at hente den nødvendige data 
async function registerMeal() {
  const mealId = document.getElementById('meal-select-dropdown').value; // mealId kan nemt hentes pga værdien i dropdown-menuen
  const weight = document.getElementById('meal-weight').value; // Hent vægten fra inputfeltet
  const user = JSON.parse(localStorage.getItem('user')); // Hent brugeroplysninger fra localStorage
  const userId = user?.userId; // Hent brugerens id
  const consumptionDate = new Date().toISOString(); // Vi bruger den aktuelle dato og tid
  let location = 'Unknown'; // Sættes som default til Unknown

  // Kontroller, at alle nødvendige data er til stede
  if (!mealId || !weight || !userId) { // Hvis et af felterne er tomme
    alert('Sørg for at have valgt en måltid, indtastet vægt og være logget ind.'); // Vis en besked
    return; // Stop funktionen
  } 

  // Brugerens lokation hentes 
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition( 
      (position) => {
        location = `Latitude: ${position.coords.latitude}, Longitude: ${position.coords.longitude}`; // Hent lokationen via geolocation
        sendMealData(); // Funktionen kaldes med lokationen
      },
      (error) => { // Håndter fejl
        console.warn('Geolocation ikke tilgængelig:', error.message);
        sendMealData(); // Hvis lokationen er ukendt, sendes kaldes funktionen alligevel
      }
    );
  } else { // Hvis geolocation ikke er tilgængelig
    sendMealData();  // Hvis geolocation ikke er tilgængelig, sendes kaldes funktionen alligevel
  }

  // Funktion som sender data til databasen
  async function sendMealData() {
    try {
      const response = await fetch('http://localhost:3000/api/mealtracker/api/meal-tracker/track-meal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }, // Sæt header til at sende data i JSON-format
        body: JSON.stringify({ mealId, weight, userId, consumptionDate, location }) // Konverter data til JSON-format
      });

      if (response.ok) { // Hvis respons er ok
        const result = await response.json(); // Konverter respons til JSON-format
        alert(result.message); // Vis en besked
      } else { // Håndter fejl
        console.error('Fejl ved registrering:', await response.json()); // Håndter fejl
      }
    } catch (error) { // Håndter fejl
      console.error('Serverfejl ved registrering:', error); // Håndter fejl
    }
  }
}

// Tilføjer funktionalitet til knappen
document.getElementById('meal-registration-form').addEventListener('submit', function (event) {
  event.preventDefault(); // Forhindrer standardadfærd for knappen
  registerMeal(); // Kald funktionen registerMeal
});


// Funktion som henter data fra tracker tabellen og opdaterer HTML
async function updateMealLogDisplay() {
  const user = JSON.parse(localStorage.getItem('user')); // Man skal være logget ind for at se måltider
  if (!user || !user.userId) { // Hvis brugeroplysninger ikke findes
    console.error('Bruger ikke fundet.'); // Udskriv en fejlmeddelelse
    return;
  }

  try {
    const response = await fetch(`http://localhost:3000/api/mealtracker/api/meal-tracker/intakes/${user.userId}`); // Brugerens data fetches fra databasen
    const mealLog = await response.json(); // Konverter respons til JSON-format

    const mealLogContainer = document.getElementById('registered-meals'); // HTML-containeren, hvor data skal vises
    mealLogContainer.innerHTML = '';

    mealLog.forEach(entry => { // For each bruges til at oprette en div for hvert måltid
      const mealEntryDiv = document.createElement('div'); // Opret en div
      mealEntryDiv.className = 'meal-entry';  // Sæt klassenavn for div'en
      // Ift. sql injection, så er det vigtigt at bruge innerHTML til at indsætte data i HTML
      mealEntryDiv.innerHTML = ` 
          <div class="meal-details">
            <span class="meal-name">${entry.mealName}</span>  
            <span class="meal-weight">${entry.weight}g</span>
            <span class="meal-time">${new Date(entry.consumptionDate).toLocaleString()}</span>
            <span class="meal-name">Kcal ${entry.kcal*entry.weight/100}</span> 
            <span class="meal-name">Protein ${entry.protein*entry.weight/100}</span>
            <span class="meal-name">Fiber ${entry.fiber*entry.weight/100}</span>
            <span class="meal-name">Fat ${entry.fat*entry.weight/100}</span>
          </div>
          <div class="meal-actions">
            <button class="edit-meal-btn" data-id="${entry.trackerId}">Rediger</button>
            <button class="delete-meal-btn" data-id="${entry.trackerId}">Slet</button>
          </div>
        `;
        mealLogContainer.appendChild(mealEntryDiv); // appendChild bruges til at tilføje div'en til containeren
      });
    } catch (error) {
      console.error('Fejl ved hentning af måltider:', error);
    }
  }


  // Nærmest identisk funktion som fetcher for ingredienser
  async function updateIngredientLogDisplay() {
    const user = JSON.parse(localStorage.getItem('user')); // Hent brugeroplysninger fra localStorage
    if (!user || !user.userId) { // Hvis brugeroplysninger ikke findes
      console.error('Bruger ikke fundet.'); // Udskriv en fejlmeddelelse
      return; // Stop funktionen
    }

  try {
    const response = await fetch(`http://localhost:3000/api/mealtracker/api/meal-tracker/intakes-ingredient/${user.userId}`);
    const mealLog = await response.json(); // Konverter respons til JSON-format
    console.log(mealLog) // Udskriv data til konsollen

    const mealLogContainer = document.getElementById('registered-ingredients'); // HTML-containeren, hvor data skal vises
    mealLogContainer.innerHTML = ''; // Tøm containeren

    mealLog.forEach(entry => { // For each bruges til at oprette en div for hvert måltid
      const mealEntryDiv = document.createElement('div');
      mealEntryDiv.className = 'meal-entry';
      // Ift. sql injection, så er det vigtigt at bruge innerHTML til at indsætte data i HTML
      mealEntryDiv.innerHTML = `
          <div class="meal-details">
            <span class="meal-name">${entry.ingredient}</span>
            <span class="meal-weight">${entry.weight}g</span>
            <span class="meal-time">${new Date(entry.consumptionDate).toLocaleString()}</span>
            <span class="meal-name">Kcal ${entry.kcal*entry.weight/100}</span>
            <span class="meal-name">Protein ${entry.protein*entry.weight/100}</span>
            <span class="meal-name">Fiber ${entry.fiber*entry.weight/100}</span>
            <span class="meal-name">Fat ${entry.fat*entry.weight/100}</span>
          </div>
          <div class="meal-actions">
            <button class="edit-meal-btn" data-id="${entry.trackerId}">Rediger</button>
            <button class="delete-meal-btn" data-id="${entry.trackerId}">Slet</button>
          </div>
        `;
        mealLogContainer.appendChild(mealEntryDiv);
      });
    } catch (error) {
      console.error('Fejl ved hentning af måltider:', error);
    }
  }


// eventListener som giver funktionalitet til knapperne, der blev oprettet i updateMealLogDisplay 
document.getElementById('registered-meals').addEventListener('click', function (event) {
  const trackerId = event.target.dataset.id;
  if (event.target.classList.contains('delete-meal-btn') && trackerId) {
    deleteMeal(trackerId);
  } else if (event.target.classList.contains('edit-meal-btn') && trackerId) {
    editMeal(trackerId);
  }
});
// Funtktionalitet gives også til knapper fra updateIngredientLogDisplay
document.getElementById('registered-ingredients').addEventListener('click', function (event) {
  const trackerId = event.target.dataset.id;
  if (event.target.classList.contains('delete-meal-btn') && trackerId) {
    deleteMeal(trackerId);
  } else if (event.target.classList.contains('edit-meal-btn') && trackerId) {
    editMeal(trackerId);
  }
});

// Funktion til at slette et måltid
async function deleteMeal(trackerId) {
  try {
    const response = await fetch(`http://localhost:3000/api/mealtracker/api/meal-tracker/intake/${trackerId}`, {
      method: 'DELETE', // Delete request da vi vil slette data
      headers: { 'Content-Type': 'application/json' }
    });

    const result = await response.json();
    if (response.ok) {
      alert(result.message);
      updateMealLogDisplay(); 
      updateIngredientLogDisplay() // Opdaterer HTML så brugeren kan se ændringerne
    } else {
      console.error('Fejl ved sletning:', result);
    }
  } catch (error) {
    console.error('Fejl ved sletning af måltid:', error);
  }
}

// Funktion til at redigere et måltid (kun dato/tidspunkt)
async function editMeal(trackerId) {
  const newWeight = prompt('Indtast ny vægt');
  if (!newWeight) return;

  try {
    const response = await fetch(`http://localhost:3000/api/mealtracker/api/meal-tracker/intake/${trackerId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ weight: newWeight })
    });

    const result = await response.json();
    if (response.ok) {
      alert(result.message);
      updateMealLogDisplay(); // Opdater måltidslog
      updateIngredientLogDisplay() //Opdater ingredienser
    } else {
      console.error('Fejl ved redigering:', result);
    }
  } catch (error) {
    console.error('Fejl ved redigering af måltid:', error);
  }
}

// Data skal vises ved indlæsning af siden
document.addEventListener('DOMContentLoaded', updateMealLogDisplay());
document.addEventListener('DOMContentLoaded', updateIngredientLogDisplay());


// Når dokumentet er indlæst, skal måltidslog og dropdown udfyldes
document.addEventListener('DOMContentLoaded', () => {
  populateMealDropdown();
}); 

//const apiKey = '169792'

// Dropdown-menuen skal udfyldes med måltider fra databasen
function populateMealDropdown() {
  fetch('http://localhost:3000/api/mealtracker/api/meals')  // Send GET-anmodning for at hente måltider fra databasen
    .then(response => response.json())
    .then(meals => { 
    const mealDropdown = document.getElementById('meal-select-dropdown');
    mealDropdown.innerHTML = ''; // nullstil dropdown-menuen

    // For each bruges til at oprette en valgmulighed for hvert måltid
    meals.forEach(meal => {
      const option = document.createElement('option');
      option.value = meal.mealId;  // Hver option får en værdi svarende til måltidets id. Dette bliver nyttigt senere
      option.textContent = meal.mealName; // Vis måltidets navn
      mealDropdown.appendChild(option);
    });
  })
  .catch(error => {
    console.error('Error loading meals:', error);
  });
}


// Eventlistener til at opdatere vægten, hvis et nyt måltid vælges
document.getElementById('meal-select-dropdown').addEventListener('change', async function () {
  const mealId = this.value;
  if (!mealId) {
    document.getElementById('meal-weight').value = ''; 
    return;
  }

  try {
    // Hent vægten fra serveren
    const response = await fetch(`http://localhost:3000/api/mealtracker/api/meals/weight/${mealId}`);
    if (response.ok) {
      const { totalWeight } = await response.json();
      // Opdater inputfeltet for vægten
      document.getElementById('meal-weight').value = totalWeight;
    } else {
      console.error('Kunne ikke hente vægt:', await response.json());
    }
  } catch (error) {
    console.error('Fejl ved hentning af vægt:', error);
  }
});

// Funktion til at hente den nødvendige data 
async function registerMeal() {
  const mealId = document.getElementById('meal-select-dropdown').value; // mealId kan nemt hentes pga værdien i dropdown-menuen
  const weight = document.getElementById('meal-weight').value;
  const user = JSON.parse(localStorage.getItem('user'));
  const userId = user?.userId;
  const consumptionDate = new Date().toISOString(); // Vi bruger den aktuelle dato og tid
  let location = 'Unknown'; // Sættes som default til Unknown

  // Kontroller, at alle nødvendige data er til stede
  if (!mealId || !weight || !userId) {
    alert('Sørg for at have valgt en måltid, indtastet vægt og være logget ind.'); 
    return;
  }

  // Brugerens lokation hentes 
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition( // Hent brugerens lokation
      (position) => {
        location = `Latitude: ${position.coords.latitude}, Longitude: ${position.coords.longitude}`;
        sendMealData(); // Funktionen kaldes med lokationen
      },
      (error) => {
        console.warn('Geolocation ikke tilgængelig:', error.message);
        sendMealData(); // Hvis lokationen er ukendt, sendes kaldes funktionen alligevel
      }
    );
  } else {
    sendMealData(); 
  }

  // Funktion som sender data til databasen
  async function sendMealData() {
    try {
      const response = await fetch('http://localhost:3000/api/mealtracker/api/meal-tracker/track-meal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }, // Sæt header til at sende data i JSON-format
        body: JSON.stringify({ mealId, weight, userId, consumptionDate, location }) // Konverter data til JSON-format
      });

      if (response.ok) { // Hvis respons er ok
        const result = await response.json(); // Konverter respons til JSON-format
        alert(result.message);
      } else {
        console.error('Fejl ved registrering:', await response.json()); // Håndter fejl
      }
    } catch (error) {
      console.error('Serverfejl ved registrering:', error);
    }
  }
}

// Tilføjer funktionalitet til knappen
document.getElementById('meal-registration-form').addEventListener('submit', function (event) {
  event.preventDefault(); // Forhindrer standardadfærd for knappen
  registerMeal(); // Kald funktionen registerMeal
});


// Funktion som henter data fra tracker tabellen og opdaterer HTML
async function updateMealLogDisplay() {
  const user = JSON.parse(localStorage.getItem('user')); // Man skal være logget ind for at se måltider
  if (!user || !user.userId) { // Hvis brugeroplysninger ikke findes
    console.error('Bruger ikke fundet.'); // Udskriv en fejlmeddelelse
    return;
  }

  try {
    const response = await fetch(`http://localhost:3000/api/mealtracker/api/meal-tracker/intakes/${user.userId}`); // Brugerens data fetches fra databasen
    const mealLog = await response.json();

    const mealLogContainer = document.getElementById('registered-meals'); // HTML-containeren, hvor data skal vises
    mealLogContainer.innerHTML = '';

    mealLog.forEach(entry => { // For each bruges til at oprette en div for hvert måltid
      const mealEntryDiv = document.createElement('div');
      mealEntryDiv.className = 'meal-entry'; 
      // Ift. sql injection, så er det vigtigt at bruge innerHTML til at indsætte data i HTML
      mealEntryDiv.innerHTML = `
          <div class="meal-details">
            <span class="meal-name">${entry.mealName}</span> 
            <span class="meal-weight">${entry.weight}g</span>
            <span class="meal-time">${new Date(entry.consumptionDate).toLocaleString()}</span>
            <span class="meal-name">Kcal ${entry.kcal*entry.weight/100}</span> 
            <span class="meal-name">Protein ${entry.protein*entry.weight/100}</span>
            <span class="meal-name">Fiber ${entry.fiber*entry.weight/100}</span>
            <span class="meal-name">Fat ${entry.fat*entry.weight/100}</span>
          </div>
          <div class="meal-actions">
            <button class="edit-meal-btn" data-id="${entry.trackerId}">Rediger</button>
            <button class="delete-meal-btn" data-id="${entry.trackerId}">Slet</button>
          </div>
        `;
        mealLogContainer.appendChild(mealEntryDiv); // appendChild bruges til at tilføje div'en til containeren
      });
    } catch (error) {
      console.error('Fejl ved hentning af måltider:', error);
    }
  }


  // Nærmest identisk funktion som fetcher for ingredienser
  async function updateIngredientLogDisplay() { // Funktion til at hente data fra tracker tabellen og opdatere HTML
    const user = JSON.parse(localStorage.getItem('user')); // Hent brugeroplysninger fra localStorage
    if (!user || !user.userId) { // Hvis brugeroplysninger ikke findes
      console.error('Bruger ikke fundet.'); // Udskriv en fejlmeddelelse
      return;
    }

  try {
    const response = await fetch(`http://localhost:3000/api/mealtracker/api/meal-tracker/intakes-ingredient/${user.userId}`);
    const mealLog = await response.json(); // Konverter respons til JSON-format
    console.log(mealLog) // Udskriv data til konsollen

    const mealLogContainer = document.getElementById('registered-ingredients'); // HTML-containeren, hvor data skal vises
    mealLogContainer.innerHTML = ''; // Tøm containeren

    mealLog.forEach(entry => {
      const mealEntryDiv = document.createElement('div');
      mealEntryDiv.className = 'meal-entry';
     // hjælper med at undgå sql injection ved at bruge innerHTML til at indsætte data i HTML
      mealEntryDiv.innerHTML = `
          <div class="meal-details">
            <span class="meal-name">${entry.ingredient}</span>
            <span class="meal-weight">${entry.weight}g</span>
            <span class="meal-time">${new Date(entry.consumptionDate).toLocaleString()}</span>
            <span class="meal-name">Kcal ${entry.kcal*entry.weight/100}</span>
            <span class="meal-name">Protein ${entry.protein*entry.weight/100}</span>
            <span class="meal-name">Fiber ${entry.fiber*entry.weight/100}</span>
            <span class="meal-name">Fat ${entry.fat*entry.weight/100}</span>
          </div>
          <div class="meal-actions">
            <button class="edit-meal-btn" data-id="${entry.trackerId}">Rediger</button>
            <button class="delete-meal-btn" data-id="${entry.trackerId}">Slet</button>
          </div>
        `;
        mealLogContainer.appendChild(mealEntryDiv);
      });
    } catch (error) {
      console.error('Fejl ved hentning af måltider:', error);
    }
  }


// eventListener som giver funktionalitet til knapperne, der blev oprettet i updateMealLogDisplay 
document.getElementById('registered-meals').addEventListener('click', function (event) {
  const trackerId = event.target.dataset.id; // Hent data-id fra knappen
  if (event.target.classList.contains('delete-meal-btn') && trackerId) { // Hvis knappen er en delete-knap
    deleteMeal(trackerId);
  } else if (event.target.classList.contains('edit-meal-btn') && trackerId) {
    editMeal(trackerId);
  }
});
// Funtktionalitet gives også til knapper fra updateIngredientLogDisplay
document.getElementById('registered-ingredients').addEventListener('click', function (event) { 
  const trackerId = event.target.dataset.id; // Hent data-id fra knappen
  if (event.target.classList.contains('delete-meal-btn') && trackerId) { // Hvis knappen er en delete-knap
    deleteMeal(trackerId); // Kald funktionen deleteMeal
  } else if (event.target.classList.contains('edit-meal-btn') && trackerId) { // Hvis knappen er en edit-knap
    editMeal(trackerId);
  }
});

// Funktion til at slette et måltid
async function deleteMeal(trackerId) {
  try {
    const response = await fetch(`http://localhost:3000/api/mealtracker/api/meal-tracker/intake/${trackerId}`, {
      method: 'DELETE', // Delete request da vi vil slette data
      headers: { 'Content-Type': 'application/json' }
    });

    const result = await response.json(); // Konverter respons til JSON-format
    if (response.ok) {
      alert(result.message);
      updateMealLogDisplay(); // Opdaterer HTML så brugeren kan se ændringerne 
      updateIngredientLogDisplay() // Opdaterer HTML så brugeren kan se ændringerne
    } else {
      console.error('Fejl ved sletning:', result);
    }
  } catch (error) {
    console.error('Fejl ved sletning af måltid:', error);
  }
}

// Funktion til at redigere et måltid (kun dato/tidspunkt)
async function editMeal(trackerId) {
  const newWeight = prompt('Indtast ny vægt'); // Prompt bruges til at bede brugeren om input
  if (!newWeight) return; // Hvis brugeren ikke indtaster noget, stop funktionen

  try {
    const response = await fetch(`http://localhost:3000/api/mealtracker/api/meal-tracker/intake/${trackerId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ weight: newWeight }) // Konverter data til JSON-format
    });

    const result = await response.json();
    if (response.ok) {
      alert(result.message);
      updateMealLogDisplay(); // Opdater måltidslog
      updateIngredientLogDisplay() //Opdater ingredienser
    } else {
      console.error('Fejl ved redigering:', result);
    }
  } catch (error) {
    console.error('Fejl ved redigering af måltid:', error);
  }
}

// Data skal vises ved indlæsning af siden
document.addEventListener('DOMContentLoaded', updateMealLogDisplay()); // Kald funktionen updateMealLogDisplay
document.addEventListener('DOMContentLoaded', updateIngredientLogDisplay()); // Kald funktionen updateIngredientLogDisplay


// Når dokumentet er indlæst, skal måltidslog og dropdown udfyldes
document.addEventListener('DOMContentLoaded', () => { 
  populateMealDropdown(); // Kald funktionen populateMealDropdown
});

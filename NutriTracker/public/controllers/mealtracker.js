const apiKey = '169792'
// Opdater dropdown-listen over måltider
function populateMealDropdown() {
  fetch('http://localhost:3000/api/mealtracker/api/meals')  // Tilpas URL efter din opsætning
    .then(response => response.json())
    .then(meals => {
    const mealDropdown = document.getElementById('meal-select-dropdown');
    mealDropdown.innerHTML = ''; // Ryd tidligere indhold

    // Loop gennem måltiderne og tilføj dem som <option> i dropdown
    meals.forEach(meal => {
      const option = document.createElement('option');
      option.value = meal.mealId;  // Brug unikt ID for valgmuligheden
      option.textContent = meal.mealName; // Vis måltidets navn
      mealDropdown.appendChild(option);
    });
  })
  .catch(error => {
    console.error('Error loading meals:', error);
  });
}


// Når dropdown-menuen ændres, skal vi vise måltidets samlede vægt
document.getElementById('meal-select-dropdown').addEventListener('change', async function () {
  const mealId = this.value;
  if (!mealId) {
    document.getElementById('meal-weight').value = ''; // Ryd hvis ingen måltid er valgt
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

// Funktion til at registrere et måltid i tracker-tabellen
async function registerMeal() {
  const mealId = document.getElementById('meal-select-dropdown').value;
  const weight = document.getElementById('meal-weight').value;
  const user = JSON.parse(localStorage.getItem('user'));
  const userId = user?.userId;
  const consumptionDate = new Date().toISOString(); // Brug dato/tid fra input eller nuværende tid
  let location = 'Unknown';

  // Kontroller, at alle nødvendige data er til stede
  if (!mealId || !weight || !userId) {
    alert('Sørg for at have valgt en måltid, indtastet vægt og være logget ind.');
    return;
  }

  // Hent brugerens geolocation
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        location = `Latitude: ${position.coords.latitude}, Longitude: ${position.coords.longitude}`;
        sendMealData();
      },
      (error) => {
        console.warn('Geolocation ikke tilgængelig:', error.message);
        sendMealData(); // Send data alligevel med 'Unknown' location
      }
    );
  } else {
    sendMealData(); // Send data alligevel med 'Unknown' location
  }

  // Funktion til at sende måltidsdata til serveren
  async function sendMealData() {
    try {
      const response = await fetch('http://localhost:3000/api/mealtracker/api/meal-tracker/track-meal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mealId, weight, userId, consumptionDate, location })
      });

      if (response.ok) {
        const result = await response.json();
        alert(result.message);
      } else {
        console.error('Fejl ved registrering:', await response.json());
      }
    } catch (error) {
      console.error('Serverfejl ved registrering:', error);
    }
  }
}

// Tilføj event listener til 'Registrér måltid'-knappen
document.getElementById('meal-registration-form').addEventListener('submit', function (event) {
  event.preventDefault();
  registerMeal();
});


// Funktion til at hente og vise gemte måltider
async function updateMealLogDisplay() {
  const user = JSON.parse(localStorage.getItem('user'));
  if (!user || !user.userId) {
    console.error('Bruger ikke fundet.');
    return;
  }

  try {
    const response = await fetch(`http://localhost:3000/api/mealtracker/api/meal-tracker/intakes/${user.userId}`);
    const mealLog = await response.json();
    console.log(mealLog)

    const mealLogContainer = document.getElementById('registered-meals');
    mealLogContainer.innerHTML = '';

    mealLog.forEach(entry => {
      const mealEntryDiv = document.createElement('div');
      mealEntryDiv.className = 'meal-entry';
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
        mealLogContainer.appendChild(mealEntryDiv);
      });
    } catch (error) {
      console.error('Fejl ved hentning af måltider:', error);
    }
  }

  async function updateIngredientLogDisplay() {
    const user = JSON.parse(localStorage.getItem('user'));
    if (!user || !user.userId) {
      console.error('Bruger ikke fundet.');
      return;
    }

  try {
    const response = await fetch(`http://localhost:3000/api/mealtracker/api/meal-tracker/intakes-ingredient/${user.userId}`);
    const mealLog = await response.json();
    console.log(mealLog)

    const mealLogContainer = document.getElementById('registered-ingredients');
    mealLogContainer.innerHTML = '';

    mealLog.forEach(entry => {
      const mealEntryDiv = document.createElement('div');
      mealEntryDiv.className = 'meal-entry';
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


// Tilføj event listener til at håndtere redigering og sletning af måltider
document.getElementById('registered-meals').addEventListener('click', function (event) {
  const trackerId = event.target.dataset.id;
  if (event.target.classList.contains('delete-meal-btn') && trackerId) {
    deleteMeal(trackerId);
  } else if (event.target.classList.contains('edit-meal-btn') && trackerId) {
    editMeal(trackerId);
  }
});
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
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' }
    });

    const result = await response.json();
    if (response.ok) {
      alert(result.message);
      updateMealLogDisplay(); // Opdater måltider
      updateIngredientLogDisplay //Opdater ingredienser
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
      updateIngredientLogDisplay //Opdater ingredienser
    } else {
      console.error('Fejl ved redigering:', result);
    }
  } catch (error) {
    console.error('Fejl ved redigering af måltid:', error);
  }
}

// Når dokumentet er indlæst, skal du opdatere måltidsloggen
document.addEventListener('DOMContentLoaded', updateMealLogDisplay);
document.addEventListener('DOMContentLoaded', updateIngredientLogDisplay);


// Når dokumentet er indlæst, skal du opdatere måltidslog og dropdown
document.addEventListener('DOMContentLoaded', () => {
  populateMealDropdown();
});





















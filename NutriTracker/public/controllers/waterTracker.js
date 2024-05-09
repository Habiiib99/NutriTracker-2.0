// Funktion til at registrere vandindtag
async function registerWaterIntake() {
    const waterAmount = document.getElementById('water-amount').value; // Vandmængde i ml
    const user = JSON.parse(localStorage.getItem('user')); // Hent brugeroplysninger fra localStorage
    if (!user || !user.userId) {
        alert('Bruger ikke fundet. Sørg for, at du er logget ind.');
        return;
    }
    const userId = user.userId;
    const consumptionDate = new Date().toISOString(); // Automatisk aktuelt tidspunkt
    let location = 'Unknown';
  
    // Kontroller, at alle nødvendige data er til stede
    if (!waterAmount || !userId) {
        alert('Sørg for at være logget ind og indtaste mængden af vand.');
        return;
    }
  
    // Hent geolocation, hvis det er tilgængeligt
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(
        (position) => {
            location = `Latitude: ${position.coords.latitude}, Longitude: ${position.coords.longitude}`;
            sendWaterData(); // Send data, når lokationen er fundet
        },
        (error) => {
            console.warn('Geolocation ikke tilgængelig:', error.message);
            sendWaterData(); // Send data med 'Unknown' lokation
        }
    );
} else {
    sendWaterData(); // Send data med 'Unknown' lokation
}
  
    // Funktion til at sende vandindtagsdata til serveren
    async function sendWaterData() {
        try {
            const response = await fetch('http://localhost:3000/api/watertracker/api/water-tracker', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId, amountOfWater: waterAmount, dateAndTimeOfDrinking: consumptionDate, location })
            });
  
            if (response.ok) {
                const result = await response.json();
                alert('Vandet er blevet registreret.');
            } else {
                const error = await response.json();
                console.error('Fejl ved registrering:', error);
            }
        } catch (error) {
            console.error('Serverfejl ved registrering:', error);
        }
    }
  }
  
  // Rediger vandindtag
  async function editWaterIntake(id) {
    const newAmount = prompt('Indtast ny vandmængde (ml):');
    if (!newAmount || isNaN(newAmount)) {
        alert('Indtast venligst en gyldig vandmængde.');
        return;
    }
  
    try {
        const response = await fetch(`http://localhost:3000/api/watertracker/api/water-tracker/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ amountOfWater: newAmount })
        });
  
        const result = await response.json();
        if (response.ok) {
            alert('Vandet er blevet registreret');
            // Opdater visningen af vandindtag
            updateWaterLogDisplay();
        } else {
            console.error('Fejl ved redigering:', result);
        }
    } catch (error) {
        console.error('Fejl ved redigering af vandindtag:', error);
    }
  }
  
  // Slet vandindtag
  async function deleteWaterIntake(id) {
    try {
        const response = await fetch(`http://localhost:3000/api/watertracker/api/water-tracker/${id}`, {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' }
        });
  
        const result = await response.json();
        if (response.ok) {
            alert('Vandet er blevet registreret');
            // Opdater visningen af vandindtag
            updateWaterLogDisplay();
        } else {
            console.error('Fejl ved sletning:', result);
        }
    } catch (error) {
        console.error('Fejl ved sletning af vandindtag:', error);
    }
  }
  
  
  
  async function updateWaterLogDisplay() {
    const user = JSON.parse(localStorage.getItem('user')); // Hent brugerens ID fra localStorage
    if (!user || !user.userId) {
        console.error('Bruger ikke fundet.');
        return;
    }
  
    try {
        // Send GET-anmodning til backend for at hente vandindtagene
        const response = await fetch(`http://localhost:3000/api/watertracker/api/water-tracker/user/${user.userId}`);
        const waterLog = await response.json();
  
        // Reference til HTML-elementet, hvor loggen vises
        const waterLogContainer = document.getElementById('registered-water');
        waterLogContainer.innerHTML = '';
  
        // Gennemgå vandindtagsdataene og generer HTML for hver post
        waterLog.forEach(entry => {
            const waterEntryDiv = document.createElement('div');
            waterEntryDiv.className = 'water-entry';
            waterEntryDiv.innerHTML = `
                <div class="water-details">
                    <span class="water-amount">${entry.amountOfWater} ml</span>
                    <span class="water-time">${new Date(entry.dateAndTimeOfDrinking).toLocaleString()}</span>
                </div>
                <div class="water-actions">
                    <button class="edit-water-btn" data-id="${entry.waterRegId}">Rediger</button>
                    <button class="delete-water-btn" data-id="${entry.waterRegId}">Slet</button>
                </div>
            `;
            waterLogContainer.appendChild(waterEntryDiv);
        });
    } catch (error) {
        console.error('Fejl ved hentning af vandindtag:', error);
    }
  }
  
  
  
  // Opdater visningen af vandindtag efter registrering
  document.getElementById('water-registration-form').addEventListener('submit', function (event) {
    event.preventDefault();
    registerWaterIntake().then(updateWaterLogDisplay);
  });
  
  // Håndter klik på rediger/slet-knapperne
  document.getElementById('registered-water').addEventListener('click', function (event) {
    const waterRegId = event.target.dataset.id;
    if (event.target.classList.contains('delete-water-btn') && waterRegId) {
        deleteWaterIntake(waterRegId).then(updateWaterLogDisplay);
    } else if (event.target.classList.contains('edit-water-btn') && waterRegId) {
        editWaterIntake(waterRegId).then(updateWaterLogDisplay);
    }
  });
  
  
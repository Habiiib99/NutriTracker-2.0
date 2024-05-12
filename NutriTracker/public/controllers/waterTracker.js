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
  
    // Den nødvendige data skal være til stede
    if (!waterAmount || !userId) {
        alert('Sørg for at være logget ind og indtaste mængden af vand.');
        return;
    }
  
    // Lokation hentes, hvis det er muligt
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(
        (position) => {
            location = `Latitude: ${position.coords.latitude}, Longitude: ${position.coords.longitude}`;
            sendWaterData(); // Send data med lokation
        },
        (error) => {
            console.warn('Geolocation ikke tilgængelig:', error.message);
            sendWaterData(); // Send data med ukendt lokation
        }
    );
} else {
    sendWaterData(); // Send data med ukendt lokation
}
  
    // Funktion som sender data fra før til databasen
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
                updateWaterLogDisplay(); // UI opdateres efter registrering
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
  async function editWaterIntake(id) { // Der tages imod et id som parameter for at identificere det vandindtag, der skal redigeres
    const newAmount = prompt('Indtast ny vandmængde (ml):');
    if (!newAmount || isNaN(newAmount)) { // Der sørges for at mængden er gyldig
        alert('Indtast venligst en gyldig vandmængde.');
        return;
    }
  
    try {
        const response = await fetch(`http://localhost:3000/api/watertracker/api/water-tracker/${id}`, {
            method: 'PUT', // Vi bruger PUT da vi opdaterer data
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ amountOfWater: newAmount })
        });
  
        const result = await response.json();
        if (response.ok) {
            alert('Vandet er blevet registreret');

            updateWaterLogDisplay(); // Opdater brugeren UI
        } else {
            console.error('Fejl ved redigering:', result);
        }
    } catch (error) {
        console.error('Fejl ved redigering af vandindtag:', error);
    }
  }
  
  // Slet vandindtag
  async function deleteWaterIntake(id) { // På samme måde som ved redigering, tages et id som parameter for at identificere det vandindtag, der skal slettes
    try {
        const response = await fetch(`http://localhost:3000/api/watertracker/api/water-tracker/${id}`, {
            method: 'DELETE', // Vi bruger DELETE da vi sletter data
            headers: { 'Content-Type': 'application/json' }
        });
  
        const result = await response.json();
        if (response.ok) {
            alert('Vandet er blevet registreret');
        
            updateWaterLogDisplay(); // UI opdateres efter sletning
        } else {
            console.error('Fejl ved sletning:', result);
        }
    } catch (error) {
        console.error('Fejl ved sletning af vandindtag:', error);
    }
  }
  
  
  // Funktion til at opdatere HTML med vandindtag
  async function updateWaterLogDisplay() {
    const user = JSON.parse(localStorage.getItem('user')); // Henter brugerens oplysninger fra localStorage 
    if (!user || !user.userId) {
        console.error('Bruger ikke fundet.');
        return;
    }
  
    try {
        // Send GET-anmodning til backend for at hente vandindtagene
        const response = await fetch(`http://localhost:3000/api/watertracker/api/water-tracker/user/${user.userId}`);
        const waterLog = await response.json();
  
        // Container til at vise vandindtag hentes fra HTML
        const waterLogContainer = document.getElementById('registered-water');
        waterLogContainer.innerHTML = '';
  
        // Gennemgå vandindtagsregistreringer og generer HTML for hver post
        waterLog.forEach(entry => { // forEach-loop til at gennemgå vandindtagene
            const waterEntryDiv = document.createElement('div');
            waterEntryDiv.className = 'water-entry'; // Hver div og span får en class så de nemt kan styles senere
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
            waterLogContainer.appendChild(waterEntryDiv); // Hver div indsættes i containeren
        });
    } catch (error) {
        console.error('Fejl ved hentning af vandindtag:', error);
    }
  }
  
  
  
  // eventListener til at registrere vandindtag og opdatere UI
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
  
  

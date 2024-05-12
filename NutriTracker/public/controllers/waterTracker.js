// Funktion til at registrere vandindtag
async function registerWaterIntake() {
    const waterAmount = document.getElementById('water-amount').value; // Vandmængde i ml
    const user = JSON.parse(localStorage.getItem('user')); // Hent brugeroplysninger fra localStorage
    if (!user || !user.userId) { // Tjek om brugeroplysninger findes
        alert('Bruger ikke fundet. Sørg for, at du er logget ind.'); // Hvis brugeroplysninger ikke findes, vis en besked
        return; // Stop funktionen
    }
    const userId = user.userId; // Brugerens id
    const consumptionDate = new Date().toISOString(); // Automatisk aktuelt tidspunkt
    let location = 'Unknown'; // Standardlokation, hvis ikke tilgængelig
  
    // Den nødvendige data skal være til stede
    if (!waterAmount || !userId) { // Hvis vandmængde eller bruger-id ikke er til stede
        alert('Sørg for at være logget ind og indtaste mængden af vand.'); // Vis en besked
        return; // Stop funktionen
    }
  
    // Lokation hentes, hvis det er muligt
  if (navigator.geolocation) { // Hvis geolocation er tilgængelig
    navigator.geolocation.getCurrentPosition( // Hent brugerens aktuelle position
        (position) => { // Hvis positionen findes
            location = `Latitude: ${position.coords.latitude}, Longitude: ${position.coords.longitude}`; // Gem lokationen
            sendWaterData(); // Send data med lokation
        },
        (error) => { // Håndter fejl
            console.warn('Geolocation ikke tilgængelig:', error.message); // Udskriv fejlmeddelelse til konsollen
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
                headers: { 'Content-Type': 'application/json' }, // Sæt header til at sende data i JSON-format
                // Konverter data til JSON-format og send til serveren
                body: JSON.stringify({ userId, amountOfWater: waterAmount, dateAndTimeOfDrinking: consumptionDate, location })
            });
  
            if (response.ok) { // Hvis respons er ok
                const result = await response.json(); // Konverter respons til JSON-format
                alert('Vandet er blevet registreret.'); // Vis en besked
                updateWaterLogDisplay(); // UI opdateres efter registrering
            } else { // Håndter fejl
                const error = await response.json(); // Konverter respons til JSON-format
                console.error('Fejl ved registrering:', error); // Udskriv fejlmeddelelse til konsollen
            }
        } catch (error) { // Håndter fejl
            console.error('Serverfejl ved registrering:', error); // Udskriv fejlmeddelelse til konsollen
        }
    }
  }
  
  // Rediger vandindtag
  async function editWaterIntake(id) { // Der tages imod et id som parameter for at identificere det vandindtag, der skal redigeres
    const newAmount = prompt('Indtast ny vandmængde (ml):');
    if (!newAmount || isNaN(newAmount)) { // Der sørges for at mængden er gyldig
        alert('Indtast venligst en gyldig vandmængde.');
        return; // Stop funktionen, hvis mængden ikke er gyldig
    }
  
    try {
        const response = await fetch(`http://localhost:3000/api/watertracker/api/water-tracker/${id}`, {
            method: 'PUT', // Vi bruger PUT da vi opdaterer data
            headers: { 'Content-Type': 'application/json' }, // Sæt header til at sende data i JSON-format
            body: JSON.stringify({ amountOfWater: newAmount }) // Konverter data til JSON-format og send til serveren
        });
  
        const result = await response.json(); // Konverter respons til JSON-format. Await bruges til at vente på at responsen er klar
        if (response.ok) {
            alert('Vandet er blevet registreret'); // Vis en besked

            updateWaterLogDisplay(); // Opdater brugeren UI
        } else {
            console.error('Fejl ved redigering:', result); // Udskriv fejlmeddelelse til konsollen
        }
    } catch (error) { // Håndter fejl
        console.error('Fejl ved redigering af vandindtag:', error); // Udskriv fejlmeddelelse til konsollen
    } 
  }
  
  // Slet vandindtag
  async function deleteWaterIntake(id) { // På samme måde som ved redigering, tages et id som parameter for at identificere det vandindtag, der skal slettes
    try {
        const response = await fetch(`http://localhost:3000/api/watertracker/api/water-tracker/${id}`, {
            method: 'DELETE', // Vi bruger DELETE da vi sletter data
            headers: { 'Content-Type': 'application/json' } // Sæt header til at sende data i JSON-format
        });
  
        const result = await response.json(); // Konverter respons til JSON-format
        if (response.ok) { // Hvis respons er ok
            alert('Vandet er blevet registreret'); // Vis en besked
        
            updateWaterLogDisplay(); // UI opdateres efter sletning
        } else {
            console.error('Fejl ved sletning:', result); // Udskriv fejlmeddelelse til konsollen
        }
    } catch (error) { // Håndter fejl
        console.error('Fejl ved sletning af vandindtag:', error); // Udskriv fejlmeddelelse til konsollen
    }
  }
  
  
  // Funktion til at opdatere HTML med vandindtag
  async function updateWaterLogDisplay() { // Funktionen henter vandindtagene fra databasen og opdaterer HTML
    const user = JSON.parse(localStorage.getItem('user')); // Henter brugerens oplysninger fra localStorage 
    if (!user || !user.userId) { // Tjek om brugeroplysninger findes
        console.error('Bruger ikke fundet.'); // Udskriv fejlmeddelelse til konsollen
        return; // Stop funktionen
    }
  
    try {
        // Send GET-anmodning til backend for at hente vandindtagene
        const response = await fetch(`http://localhost:3000/api/watertracker/api/water-tracker/user/${user.userId}`);
        const waterLog = await response.json(); // Konverter respons til JSON-format
  
        // Container til at vise vandindtag hentes fra HTML
        const waterLogContainer = document.getElementById('registered-water'); // Henter containeren til vandindtag fra HTML
        waterLogContainer.innerHTML = ''; // Tøm containeren for eksisterende data
  
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
    event.preventDefault(); // Forhindrer standardadfærd for formular
    registerWaterIntake().then(updateWaterLogDisplay); // Kald funktionen til at registrere vandindtag og opdater UI
  });
  
  // Håndter klik på rediger/slet-knapperne
  document.getElementById('registered-water').addEventListener('click', function (event) { // eventListener til at redigere og slette vandindtag
    const waterRegId = event.target.dataset.id; // Hent id fra data-id attributten på knappen
    if (event.target.classList.contains('delete-water-btn') && waterRegId) { // Hvis der klikkes på slet-knappen
        deleteWaterIntake(waterRegId).then(updateWaterLogDisplay); // Kald funktionen til at slette vandindtag og opdater UI
    } else if (event.target.classList.contains('edit-water-btn') && waterRegId) { // Hvis der klikkes på rediger-knappen
        editWaterIntake(waterRegId).then(updateWaterLogDisplay); // Kald funktionen til at redigere vandindtag og opdater UI
    }
  });
  
  

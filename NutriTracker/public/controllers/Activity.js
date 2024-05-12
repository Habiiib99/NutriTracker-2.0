// her defineres objekterne til de forskellige aktiviteter, som brugeren kan vælge imellem.
const almindeligeHverdagsaktiviteter = {
    "Almindelig gang": 215,
    "Gang ned af trapper": 414,
    "Gang op af trapper": 1079,
    "Slå græs med manuel græsslåmaskine": 281,
    "Lave mad og redde senge": 236,
    "Luge ukrudt": 362,
    "Rydde sne": 481,
    "Læse eller se TV": 74,
    "Stå oprejst": 89,
    "Cykling i roligt tempo": 310,
    "Tørre støv af": 163,
    "Vaske gulv": 281,
    "Pudse vinduer": 259
};

const sportsAktiviteter = {
    "Cardio": 814,
    "Hård styrketræning": 348,
    "Badminton": 318,
    "Volleyball": 318,
    "Bordtennis": 236,
    "Dans i højt tempo": 355,
    "Dans i moderat tempo": 259,
    "Fodbold": 510,
    "Rask gang": 384,
    "Golf": 244,
    "Håndbold": 466,
    "Squash": 466,
    "Jogging": 666,
    "Langrend": 405,
    "Løb i moderat tempo": 872,
    "Løb i hurtigt tempo": 1213,
    "Ridning": 414,
    "Skøjteløb": 273,
    "Svømning": 296,
    "Cykling i højt tempo": 658
};

const forskelligeTyperArbejde = {
    "Bilreparation": 259,
    "Gravearbejde": 414,
    "Landbrugsarbejde": 236,
    "Let kontorarbejde": 185,
    "Male hus": 215,
    "Murerarbejde": 207,
    "Hugge og slæbe på brænde": 1168
};

// Definerer variabler til de forskellige elementer i HTML-dokumentet
const activityTypeSelect = document.getElementById("activityType");
const activityNameSelect = document.getElementById("activityName");
const minutesInput = document.getElementById("minutes");

// eventlistener til at ændre aktivitetsdropdown-menuen baseret på valgt aktivitetstype
activityTypeSelect.addEventListener("change", function () { // eventlistener aktiveres, når der sker en ændring i dropdown-menuen
    const selectedType = this.value;
    let activities;
    if (selectedType === "everyday") {
        activities = almindeligeHverdagsaktiviteter;
    } else if (selectedType === "sports") {
        activities = sportsAktiviteter;
    } else if (selectedType === "work") {
        activities = forskelligeTyperArbejde;
    }
    populateActivityDropdown(activities);
});

// Funktion til at udfylde aktivitetsdropdown-menuen
function populateActivityDropdown(activities) {
    activityNameSelect.innerHTML = "";
    for (const activity in activities) { // for-in loop til at iterere gennem objektet med aktiviteter
        const option = document.createElement("option");
        option.value = activity;
        option.textContent = activity;
        activityNameSelect.appendChild(option);
    }
}

const gemKnap = document.getElementById("save");

gemKnap.addEventListener("click", async function saveActivity() { // eventlistener aktiveres, når der klikkes på gem-knappen
        alert('Aktivitet gemt!'); 
    try {
        // Hent brugeroplysninger fra localStorage
        const user = JSON.parse(localStorage.getItem('user'));
        if (!user || !user.userId) {
            throw new Error('Brugeroplysninger ikke fundet i localStorage.');
        }
        const userId = user.userId;

        // Hent data fra inputfelterne
        const activityType = document.getElementById('activityType').value;
        const activityName = document.getElementById('activityName').value;
        const minutes = document.getElementById('minutes').value;

        // Send POST-anmodning til serveren
        const response = await fetch('http://localhost:3000/api/activity/activityTracker', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                userId,
                activityType,
                activityName,
                minutes,
            })
        });
        const data = await response.json();
        
        if (response.ok) {
            return data;
        // Håndter fejl fra serveren
        } else {
            throw new Error(data.message);
        }
    } catch (error) {
        console.error('Fejl:', error);
        throw new Error('Fejl ved oprettelse af aktivitet: ' + error.message);
    }
});

//loader den første valgmulighed som default
document.addEventListener('DOMContentLoaded', () => {
    const activities = almindeligeHverdagsaktiviteter;
    populateActivityDropdown(activities);
});

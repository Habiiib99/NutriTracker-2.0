// her defineres objekterne til de forskellige aktiviteter, som brugeren kan vælge imellem.
const almindeligeHverdagsaktiviteter = { // objekt med almindelige hverdagsaktiviteter og deres kalorieforbrug pr. time
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

const sportsAktiviteter = { // objekt med sportsaktiviteter og deres kalorieforbrug pr. time
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

const forskelligeTyperArbejde = { // objekt med forskellige typer arbejde og deres kalorieforbrug pr. time
    "Bilreparation": 259,
    "Gravearbejde": 414,
    "Landbrugsarbejde": 236,
    "Let kontorarbejde": 185,
    "Male hus": 215,
    "Murerarbejde": 207,
    "Hugge og slæbe på brænde": 1168
};

// Definerer variabler til de forskellige elementer i HTML-dokumentet
const activityTypeSelect = document.getElementById("activityType"); // variabel til at vælge aktivitetstype
const activityNameSelect = document.getElementById("activityName"); // variabel til at vælge aktivitet
const minutesInput = document.getElementById("minutes"); // variabel til at indtaste antal minutter

// eventlistener til at ændre aktivitetsdropdown-menuen baseret på valgt aktivitetstype
activityTypeSelect.addEventListener("change", function () { // eventlistener aktiveres, når der sker en ændring i dropdown-menuen
    const selectedType = this.value; // variabel til at gemme valgt aktivitetstype
    let activities; // variabel til at gemme aktiviteter baseret på valgt aktivitetstype
    if (selectedType === "everyday") { // if-else statement til at vælge aktiviteter baseret på valgt aktivitetstype
        activities = almindeligeHverdagsaktiviteter; // hvis valgt aktivitetstype er "everyday", vælg almindelige hverdagsaktiviteter
    } else if (selectedType === "sports") { // hvis valgt aktivitetstype er "sports", vælg sportsaktiviteter
        activities = sportsAktiviteter; 
    } else if (selectedType === "work") {
        activities = forskelligeTyperArbejde;
    }
    populateActivityDropdown(activities); // kald funktionen populateActivityDropdown med valgte aktiviteter
});

// Funktion til at udfylde aktivitetsdropdown-menuen
function populateActivityDropdown(activities) {
    activityNameSelect.innerHTML = ""; // tøm dropdown-menuen for aktiviteter
    for (const activity in activities) { // for-in loop til at iterere gennem objektet med aktiviteter
        const option = document.createElement("option"); // opretter et option-element til hver aktivitet
        option.value = activity; // sætter værdien af option-elementet til aktiviteten
        option.textContent = activity; // sætter teksten af option-elementet til aktiviteten
        activityNameSelect.appendChild(option); // tilføjer option-elementet til dropdown-menuen
    }
}

const gemKnap = document.getElementById("save"); // variabel til at gemme knappen til at gemme aktiviteten

gemKnap.addEventListener("click", async function saveActivity() { // eventlistener aktiveres, når der klikkes på gem-knappen
        alert('Aktivitet gemt!'); 
    try {
        // Hent brugeroplysninger fra localStorage
        const user = JSON.parse(localStorage.getItem('user')); // hent brugeroplysninger fra localStorage
        if (!user || !user.userId) { // if-else statement til at tjekke om brugeroplysninger findes eller ej
            throw new Error('Brugeroplysninger ikke fundet i localStorage.'); // hvis brugeroplysninger ikke findes, kast en fejl
        }
        const userId = user.userId; // gem brugerens id i en variabel

        // Hent data fra inputfelterne
        const activityType = document.getElementById('activityType').value; // gem valgt aktivitetstype i en variabel
        const activityName = document.getElementById('activityName').value; // gem valgt aktivitet i en variabel
        const minutes = document.getElementById('minutes').value; // gem antal minutter i en variabel

        // Send POST-anmodning til serveren
        const response = await fetch('http://localhost:3000/api/activity/activityTracker', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' }, // sæt header til at sende data i JSON-format
            body: JSON.stringify({ // konverter data til JSON-format. JSON er et tekstformat, der bruges til at udveksle data mellem en klient og en server
                userId,
                activityType,
                activityName,
                minutes,
            })
        });
        const data = await response.json(); // konverter respons til JSON-format
        
        if (response.ok) {
            return data;
        // Håndter fejl fra serveren
        } else {
            throw new Error(data.message); // kast en fejl, hvis der opstår en fejl
        }
    } catch (error) {
        console.error('Fejl:', error);
        throw new Error('Fejl ved oprettelse af aktivitet: ' + error.message); // kast en fejl, hvis der opstår en fejl
    }
});

//loader den første valgmulighed som default
document.addEventListener('DOMContentLoaded', () => { 
    const activities = almindeligeHverdagsaktiviteter; // vælg almindelige hverdagsaktiviteter som default
    populateActivityDropdown(activities); // kald funktionen populateActivityDropdown med valgte aktiviteter
});

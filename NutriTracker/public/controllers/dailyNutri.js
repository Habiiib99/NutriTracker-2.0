document.addEventListener('DOMContentLoaded', async () => { // eventlistener aktiveres, når DOM er indlæst. 
  const user = JSON.parse(localStorage.getItem('user'));  // hent brugeroplysninger fra localStorage
  if (!user || !user.userId) { // if-else statement til at tjekke om brugeroplysninger findes eller ej
    alert('Brugeroplysninger ikke fundet. Log venligst ind igen.'); // hvis brugeroplysninger ikke findes, vis en besked
    window.location.href = 'login.html'; // omdirigerer til login-siden
    return; // stop funktionen
  }

  // Funktion til at hente data fra serveren og opdatere tabellen
  async function fetchAndUpdateTable(userId, viewMode) { // viewMode er en parameter, der angiver visningstilstand
    try {
      let url = '';  // variabel til at gemme URL til GET-anmodning

      // Sæt den passende URL baseret på visningstilstand
      if (viewMode === 'daily') { // hvis visningstilstand er daglig
        url = `http://localhost:3000/api/dailynutri/api/daily-nutri/hourly/${userId}`; // URL til at hente data for daglig visning
      } else if (viewMode === 'monthly') { // hvis visningstilstand er månedlig
        url = `http://localhost:3000/api/dailynutri/api/daily-nutri/monthly/${userId}`; // URL til at hente data for månedlig visning
      } else {
        console.error('Ugyldig visningstilstand.'); // hvis visningstilstand er ugyldig, udskriv en fejlmeddelelse
        return; // stop funktionen
      }

      // Send GET-anmodning til serveren
      const response = await fetch(url); // send GET-anmodning til serveren
      const data = await response.json(); // konverter respons til JSON-format

      // Håndter fejl 
      if (!response.ok) { // hvis respons ikke er ok
        throw new Error(data.message || 'Fejl ved hentning af data.'); // kast en fejl, hvis der opstår en fejl
      }

      // opdater tabellen med data
      updateNutriTable(data); // kald funktionen updateNutriTable med data
    } catch (error) { // Håndter fejl
      console.error('Fejl ved hentning af data:', error); // udskriv fejlmeddelelse til konsollen
      alert('Der opstod en fejl ved hentning af data. Prøv venligst igen senere.'); // vis en besked til brugeren
    }
  }

  // Funktion til at opdatere tabellen
  function updateNutriTable(entries) { // entries er en parameter, der indeholder data til at opdatere tabellen
    const tableBody = document.querySelector('.nutri-entries'); // gemmer tabellens tbody-element i en variabel
    tableBody.innerHTML = ''; // tømmer tabellen for eksisterende data

    // Iterér gennem data og opret html-rækker til tabellen
    entries.forEach(entry => {
      let timeLabel = entry.hour !== undefined ? `${entry.hour}:00` : entry.date;  // variabel til at gemme tidspunktet for data
      if (entry.hour === 0) { // hvis time er 0
        timeLabel = '00:00';  // sæt tidspunktet til midnat
      }

      // Opret html-række og indsæt data
      const row = `
        <tr>
          <td>${timeLabel}</td> 
          <td>${entry.energy} kcal</td>
          <td>${entry.water} L</td>
          <td>${entry.calorieBurn} kcal</td>
          <td>${entry.surplusDeficit} kcal</td>
        </tr>
      `;
      tableBody.insertAdjacentHTML('beforeend', row); // Indsæt html-række i tabellen
    });
  }

  // Hent og opdater tabellen med brugerens data baseret på standard visningstilstand
  fetchAndUpdateTable(user.userId, 'daily');

  // Eventlistener til at ændre visningstilstand
  document.getElementById('view-mode').addEventListener('change', function () { // eventlistener aktiveres, når der skiftes visningstilstand
    const viewMode = this.value; // gem valgt visningstilstand i en variabel
    fetchAndUpdateTable(user.userId, viewMode);  // kald funktionen fetchAndUpdateTable med brugerens id og valgt visningstilstand
  });
});

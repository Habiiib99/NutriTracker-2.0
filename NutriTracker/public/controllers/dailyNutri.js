document.addEventListener('DOMContentLoaded', async () => { // eventlistener aktiveres, når DOM er indlæst
  const user = JSON.parse(localStorage.getItem('user'));
  if (!user || !user.userId) {
    alert('Brugeroplysninger ikke fundet. Log venligst ind igen.');
    window.location.href = 'login.html'; // omdirigerer til login-siden
    return;
  }

  // Funktion til at hente data fra serveren og opdatere tabellen
  async function fetchAndUpdateTable(userId, viewMode) {
    try {
      let url = '';

      // Sæt den passende URL baseret på visningstilstand
      if (viewMode === 'daily') { // hvis visningstilstand er daglig
        url = `http://localhost:3000/api/dailynutri/api/daily-nutri/hourly/${userId}`;
      } else if (viewMode === 'monthly') { // hvis visningstilstand er månedlig
        url = `http://localhost:3000/api/dailynutri/api/daily-nutri/monthly/${userId}`;
      } else {
        console.error('Ugyldig visningstilstand.');
        return;
      }

      // Send GET-anmodning til serveren
      const response = await fetch(url);
      const data = await response.json();

      // Håndter fejl 
      if (!response.ok) {
        throw new Error(data.message || 'Fejl ved hentning af data.');
      }

      // opdater tabellen med data
      updateNutriTable(data);
    } catch (error) {
      console.error('Fejl ved hentning af data:', error);
      alert('Der opstod en fejl ved hentning af data. Prøv venligst igen senere.');
    }
  }

  // Funktion til at opdatere tabellen
  function updateNutriTable(entries) {
    const tableBody = document.querySelector('.nutri-entries');
    tableBody.innerHTML = '';

    // Iterér gennem data og opret html-rækker til tabellen
    entries.forEach(entry => {
      let timeLabel = entry.hour !== undefined ? `${entry.hour}:00` : entry.date; 
      if (entry.hour === 0) {
        timeLabel = '00:00'; 
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
  document.getElementById('view-mode').addEventListener('change', function () {
    const viewMode = this.value;
    fetchAndUpdateTable(user.userId, viewMode); 
  });
});

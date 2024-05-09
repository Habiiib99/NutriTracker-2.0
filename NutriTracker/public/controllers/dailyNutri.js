document.addEventListener('DOMContentLoaded', async () => {
  const user = JSON.parse(localStorage.getItem('user'));
  if (!user || !user.userId) {
    alert('Brugeroplysninger ikke fundet. Log venligst ind igen.');
    window.location.href = 'login.html';
    return;
  }

  // Funktion til at hente data fra API'et og opdatere tabellen
  async function fetchAndUpdateTable(userId, viewMode) {
    try {
      let url = '';

      // Sæt den passende URL baseret på visningstilstand
      if (viewMode === 'daily') {
        url = `http://localhost:2220/api/daily-nutri/hourly/${userId}`;
      } else if (viewMode === 'monthly') {
        url = `http://localhost:2220/api/daily-nutri/monthly/${userId}`;
      } else {
        console.error('Ugyldig visningstilstand.');
        return;
      }

      // Hent data fra serveren
      const response = await fetch(url);
      const data = await response.json();
console.log(data);
      // Håndter fejl fra serveren
      if (!response.ok) {
        throw new Error(data.message || 'Fejl ved hentning af data.');
      }

      // Opdater tabellen med de modtagne data
      updateNutriTable(data);
    } catch (error) {
      console.error('Fejl ved hentning af data:', error);
      alert('Der opstod en fejl ved hentning af data. Prøv venligst igen senere.');
    }
  }

  // Funktion til at opdatere tabellen baseret på modtagne data og visningstilstand
  function updateNutriTable(entries) {
    const tableBody = document.querySelector('.nutri-entries');
    tableBody.innerHTML = '';

    // Iterer gennem data og opret rækker til tabellen
    entries.forEach(entry => {
      let timeLabel = entry.hour !== undefined ? `${entry.hour}:00` : entry.date;
      if (entry.hour === 0) {
        timeLabel = '24:00';
      }

      const row = `
        <tr>
          <td>${timeLabel}</td>
          <td>${entry.energy} kcal</td>
          <td>${entry.water} L</td>
          <td>${entry.calorieBurn} kcal</td>
          <td>${entry.surplusDeficit} kcal</td>
        </tr>
      `;
      tableBody.insertAdjacentHTML('beforeend', row);
    });
  }

  // Hent og opdater tabellen med brugerens data baseret på standard visningstilstand
  fetchAndUpdateTable(user.userId, 'daily');

  // Tilføj en eventlistener til dropdown-menuen for at håndtere ændringer i visningstilstand
  document.getElementById('view-mode').addEventListener('change', function () {
    const viewMode = this.value;
    fetchAndUpdateTable(user.userId, viewMode);  // Kald funktionen med det valgte visningstilstand
  });
});

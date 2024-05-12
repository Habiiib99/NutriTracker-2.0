document.addEventListener('DOMContentLoaded', function () { // Ved DOMContentLoaded hentes og vises brugeroplysninger
  const user = JSON.parse(localStorage.getItem('user')) || {}; // Brugeren hentes fra localStorage

  document.getElementById('name').value = user.name; // Brugerens navn vises i inputfeltet
  document.getElementById('email').textContent = user.email; // Brugerens email vises i inputfeltet
  document.getElementById('weight').value = user.weight; // Brugerens vægt vises i inputfeltet
  document.getElementById('age').value = user.age; // Brugerens alder vises i inputfeltet
  document.getElementById('gender').value = user.gender; // Brugerens køn vises i inputfeltet
  document.getElementById('bmr').value = user.bmr;   // Brugerens BMR vises i inputfeltet
})

document.getElementById('logout-button').addEventListener('click', function () { // eventListener til at logge ud
  localStorage.removeItem('user'); // Brugeroplysningerne fjernes fra localStorage
  window.location.href = 'login.html'; // Brugeren sendes til login-siden
}) 

// Funktion med put request som tillader at opdatere brugeroplysninger
document.getElementById('update-button').addEventListener('click', function () { 
  const userId = JSON.parse(localStorage.getItem('user')).userId; // Brugeren hentes fra localStorage
  const name = document.getElementById('name').value; // Brugerens navn hentes fra inputfeltet
  const email = document.getElementById('email').textContent; // Brugerens email hentes fra inputfeltet
  const weight = document.getElementById('weight').value; // Brugerens vægt hentes fra inputfeltet
  const age = document.getElementById('age').value; // Brugerens alder hentes fra inputfeltet
  const gender = document.getElementById('gender').value; // Brugerens køn hentes fra inputfeltet
 
  // Data hentes fra inputfelterne og gemmes i et objekt
  const data = {
    name, email, weight, age, gender 
  };

  // Vi bruger en PUT-request til at opdatere brugeroplysningerne
  fetch(`http://localhost:3000/api/settings/api/users/${userId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' }, // Sæt header til at sende data i JSON-format
    body: JSON.stringify(data) // Konverter data til JSON-format
  })
  .then(response => response.json()) // Konverter respons til JSON-format
  .then(data => { 
    if (data.message) { // Hvis der er en besked
      alert(data.message);
      document.getElementById('bmr').value = data.bmr;  // Den nye BMR vises
    }
  })
  .catch(error => console.error('Error:', error));
});

// Funktionalitet som tillader at slette en bruger
document.getElementById('delete-button').addEventListener('click', function () {
  const user = JSON.parse(localStorage.getItem('user')); // Brugeren hentes fra localStorage

  // Vi bruger en DELETE-request 
  fetch(`http://localhost:3000/api/settings/delete/${user.userId}`, {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
  })
  .then(response => response.json()) // Konverter respons til JSON-format
  .then(data => { // Håndter data fra respons vha. if statement som viser en besked og sender brugeren til login-siden
    if (data.message) {
      alert(data.message);
      localStorage.removeItem('user'); // Vi bruger removeItem som fjerner brugeroplysningerne fra localStorage
      window.location.href = 'login.html'; // Brugeren sendes til login-siden
    }
  })
  .catch(error => console.error('Error:', error)); // Håndter fejl
});

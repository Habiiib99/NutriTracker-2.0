document.addEventListener('DOMContentLoaded', function () { // Ved DOMContentLoaded hentes og vises brugeroplysninger
    const user = JSON.parse(localStorage.getItem('user'))
  
    document.getElementById('name').value = user.name;
    document.getElementById('email').textContent = user.email;
    document.getElementById('weight').value = user.weight;
    document.getElementById('age').value = user.age;
    document.getElementById('gender').value = user.gender;
    document.getElementById('bmr').value = user.bmr;  
  })
  
  document.getElementById('logout-button').addEventListener('click', function () { // eventListener til at logge ud
    localStorage.removeItem('user');
    window.location.href = 'login.html'; // Brugeren sendes til login-siden
  }) 
  
  // Funktion med put request som tillader at opdatere brugeroplysninger
  document.getElementById('update-button').addEventListener('click', function () {
    const userId = JSON.parse(localStorage.getItem('user')).userId;
    const name = document.getElementById('name').value;
    const email = document.getElementById('email').textContent;
    const weight = document.getElementById('weight').value;
    const age = document.getElementById('age').value;
    const gender = document.getElementById('gender').value;
   
    // Data hentes fra inputfelterne og gemmes i et objekt
    const data = {
      name, email, weight, age, gender
    };
  
    // Vi bruger en PUT-request til at opdatere brugeroplysningerne
    fetch(`http://localhost:3000/api/settings/api/users/${userId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    })
    .then(response => response.json())
    .then(data => { 
      if (data.message) {
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
    .then(response => response.json())
    .then(data => {
      if (data.message) {
        alert(data.message);
        localStorage.removeItem('user'); // Vi bruger removeItem som fjerner brugeroplysningerne fra localStorage
        window.location.href = 'login.html'; // Brugeren sendes til login-siden
      }
    })
    .catch(error => console.error('Error:', error));
  });

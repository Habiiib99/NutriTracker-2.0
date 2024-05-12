document.getElementById('redirect-to-login-button').addEventListener('click', function () { // eventlistener aktiveres, når der klikkes på knappen
  window.location.href = 'login.html' // Det er muligt for brugeren at logge ind frem for at registrere sig
})

document.getElementById('register-button').addEventListener('click', function () {
  event.preventDefault() // forhindrer standardadfærd for knappen
  submitRegistration() // eventListener som kalder nedstående funktion
})

// Registrerer en bruger i databasen
function submitRegistration() {
  const email = document.getElementById('email').value // gemmer email i en variabel
  const password = document.getElementById('password').value // gemmer password i en variabel
  const gender = document.getElementById('gender').value // gemmer køn i en variabel
  const age = document.getElementById('age').value // gemmer alder i en variabel
  const weight = document.getElementById('weight').value // gemmer vægt i en variabel
  const name = document.getElementById('name').value // gemmer navn i en variabel

  // Data hentes fra inputfelterne og gemmes i et objekt
  const data = {
    email,
    password,
    gender,
    age,
    weight,
    name
  }

  console.log('Submitting data', data) // Udskriver data til konsollen

  // Post request til at sende data
  fetch('http://localhost:3000/api/account/register', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json' // Sæt header til at sende data i JSON-format. JSON er et tekstformat, der bruges til at udveksle data mellem en klient og en server
    },
    body: JSON.stringify(data) // Konverter data til JSON-format
})
.then(response => response.json()) // Konverter respons til JSON-format
.then(data => {
  if (data.success) { // Hvis registreringen er succesfuld
    alert('Register success'); // vis en besked
  } else { // Hvis registreringen mislykkes
    alert('Register failed: ' + data.message); // vis en besked, hvis registreringen mislykkes
  }
})
.catch(error => { // Håndter fejl
  console.error('Error during registration:', error); // Udskriv fejlmeddelelse til konsollen
  alert('Register failed: ' + error.message); // vis en besked, hvis registreringen mislykkes
});
}

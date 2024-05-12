document.getElementById('redirect-to-register-button').addEventListener('click', function () { // eventlistener aktiveres, når der klikkes på knappen
  window.location.href = 'register.html' // omdirigerer til registreringssiden. Window.location.href bruges til at omdirigere til en anden side
})

// Eventlistener til login-knappen (når der klikkes på knappen
document.getElementById('login-button').addEventListener('click', function () { // eventlistener aktiveres, når der klikkes på knappen
  event.preventDefault()  // forhindrer standardadfærd for knappen
  
  // Hent email og password fra inputfelterne
  const email = document.getElementById('email').value // gemmer email i en variabel
  const password = document.getElementById('password').value // gemmer password i en variabel

  const data = { // gemmer email og password i et objekt
    email: email,
    password: password
  }
  // Send POST-anmodning til backend
  fetch('http://localhost:3000/api/account/login', {
    method: 'POST', // sæt metode til POST
    headers: {
      'Content-Type': 'application/json' // sæt header til at sende data i JSON-format. JSON er et tekstformat, der bruges til at udveksle data mellem en klient og en server
    },
    body: JSON.stringify(data) // konverterer data til JSON-streng
  }).then(function (response) { //.then() bruges til at håndtere promise
    if (response.status !== 200) {
      return alert('Invalid credentials') // hvis responsstatus er forskellig fra 200, vis en besked
    } 
    return response.json()  // konverter respons til JSON-format
  }).then(function (data) {  // håndter data fra respons
    console.log(data) // udskriv data til konsollen
    localStorage.setItem('user', JSON.stringify(data.user)) // gemmer brugeroplysninger i localStorage
    window.location.href = 'mealtracker.html' // omdirigerer til mealtracker-siden
  })
})

document.getElementById('redirect-to-register-button').addEventListener('click', function () { // eventlistener aktiveres, når der klikkes på knappen
    window.location.href = 'register.html' // omdirigerer til registreringssiden
  })
  
  // Eventlistener til login-knappen (når der klikkes på knappen
  document.getElementById('login-button').addEventListener('click', function () {
    event.preventDefault() 
    
    // Hent email og password fra inputfelterne
    const email = document.getElementById('email').value
    const password = document.getElementById('password').value
  
    const data = {
      email: email,
      password: password
    }
    // Send POST-anmodning til backend
    fetch('http://localhost:3000/api/account/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(data) // konverterer data til JSON-streng
    }).then(function (response) { //.then() bruges til at håndtere promise
      if (response.status !== 200) {
        return alert('Invalid credentials')
      }
      return response.json() 
    }).then(function (data) { 
      console.log(data)
      localStorage.setItem('user', JSON.stringify(data.user)) // gemmer brugeroplysninger i localStorage
      window.location.href = 'mealtracker.html' // omdirigerer til mealtracker-siden
    })
  })

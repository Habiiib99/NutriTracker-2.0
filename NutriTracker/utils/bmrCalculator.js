// Funktion til bmr
function calculateBMR(weight, age, gender) {
    let bmr = 0;  // Basalstofskifte i MJ/dag
  
    // Konverter alder til et tal for at kunne anvende i logik
    age = parseInt(age, 10);
  
    if (gender === 'male') {
      if (age <= 3) {
        bmr = 0.249 * weight - 0.13;
      } else if (age <= 10) {
        bmr = 0.095 * weight + 2.11;
      } else if (age <= 18) {
        bmr = 0.074 * weight + 2.75;
      } else if (age <= 30) {
        bmr = 0.064 * weight + 2.84;
      } else if (age <= 60) {
        bmr = 0.0485 * weight + 3.67;
      } else if (age <= 75) {
        bmr = 0.0499 * weight + 2.93;
      } else {
        bmr = 0.035 * weight + 3.43;
      }
    } else if (gender === 'female') { // female
      if (age <= 3) {
        bmr = 0.244 * weight - 0.13;
      } else if (age <= 10) {
        bmr = 0.085 * weight + 2.03;
      } else if (age <= 18) {
        bmr = 0.056 * weight + 2.90;
      } else if (age <= 30) {
        bmr = 0.0615 * weight + 2.08;
      } else if (age <= 60) {
        bmr = 0.0364 * weight + 3.47;
      } else if (age <= 75) {
        bmr = 0.0386 * weight + 2.88;
      } else {
        bmr = 0.0410 * weight + 2.61;
      }
    }
  
    return bmr
}

export default calculateBMR;
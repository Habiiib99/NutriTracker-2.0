import { use, expect } from 'chai'; // Importér Chai for forventningsstyring
import chaiHttp from 'chai-http'; // Importér chai-http for HTTP-anmodninger
const chai = use(chaiHttp);   // Aktiverer chai-http funktionalitet

// Importér server-appen til test
import { app } from '../server.js';

describe('Kalorieberegning', () => {
  // Test for at tilføje en aktivitet og verificere korrekt kalorieberegning
  it('Skal returnere korrekte oplysninger om kalorieberegning for jogging', (done) => {
    // Inputdata til test
    const newActivity = {
      userId: 1, // Antag en bruger-ID findes
      activityType: 'sports', 
      activityName: 'Jogging',
      minutes: 30
    };

    // Forventede kalorier brændt (Jogging-forbrænding = 666 kalorier pr. time)
    const expectedCalories = (666 * 30) / 60;

    // Exercise: Udfører HTTP POST-anmodning til aktivitets-API'et
    chai
      .request(app) // Anvender chai-http til at sende anmodningen
      .post('/api/activity/activityTracker') // Angiver endpoint for aktivitets-API
      .send(newActivity) // Sender testdata med anmodningen
      .end((err, res) => { // Afslutningsfunktion for at håndtere respons

         // Verify: Forventer at modtage statuskode 201 for succesfuld oprettelse
        expect(res).to.have.status(201);
        expect(res.body).to.be.an('object');
        // Verificerer, at response body indeholder de forventede værdier
        expect(res.body).to.have.property('userId').equal(newActivity.userId); // Forventer samme bruger-ID
        expect(res.body).to.have.property('activityType').equal(newActivity.activityType); // Forventer samme aktivitetstype
        expect(res.body).to.have.property('activityName').equal(newActivity.activityName); // Forventer samme aktivitetsnavn
        expect(res.body).to.have.property('duration').equal(newActivity.minutes); // Forventer samme varighed
        expect(res.body).to.have.property('caloriesBurned').equal(expectedCalories); // Forventer korrekt kalorieforbrænding
        done(); // Afslutter test
      });
  });

  // Test for en arbejdsaktivitet ("Hugge og slæbe på brænde")
  it('skal returnere korrekte oplysninger om kalorieberegning for hugge og slæbe på brænde', (done) => {
    // Setup: Opret testdata for en arbejdsaktivitet
    const workActivity = {
      userId: 1, // Antag denen bruger-ID findes
      activityType: 'work',
      activityName: 'Hugge og slæbe på brænde',
      minutes: 45
    };

    // Forventede kalorier brændt (1168 kalorier pr. time)
    const expectedCalories = (1168 * 45) / 60;

    // Exercise: Udfører HTTP POST-anmodning med testdata
    chai
      .request(app)
      .post('/api/activity/activityTracker')
      .send(workActivity)
      .end((err, res) => {
        // Verify: Tjekker responsen for at sikre korrekt håndtering og dataretur
        expect(res).to.have.status(201);

        expect(res.body).to.be.an('object'); // Forventer et objekt som respons
        expect(res.body).to.have.property('userId').equal(workActivity.userId); // Forventer samme bruger-ID
        expect(res.body).to.have.property('activityType').equal(workActivity.activityType); // Forventer samme aktivitetstype
        expect(res.body).to.have.property('activityName').equal(workActivity.activityName); // Forventer samme aktivitetsnavn
        expect(res.body).to.have.property('duration').equal(workActivity.minutes); // Forventer samme varighed
        expect(res.body).to.have.property('caloriesBurned').equal(expectedCalories); // Forventer korrekt kalorieforbrænding
        done(); // Afslutter test
      });
  });

  // Test for et ugyldigt aktivitetsnavn eller manglende input
  it('skal returnere en fejl, når der mangler inputdata', (done) => {
    // Setup: Definér ufuldstændige inputdata for at simulere en fejl
    const incompleteActivity = {
      userId: 1, // Antag denne bruger-ID findes
      activityType: 'sports',
      minutes: 30
    };

    // Exercise: Send anmodning med mangelfulde data
    chai
      .request(app) // Anvender chai-http til at sende anmodningen
      .post('/api/activity/activityTracker') // Angiver endpoint for aktivitets-API
      .send(incompleteActivity) // Sender testdata med anmodningen
      .end((err, res) => {
        // Verify: Forventer fejlrespons på grund af manglende data
        expect(res).to.have.status(400); 
        expect(res.text).to.equal('Indtast venligst både aktivitet og antal minutter.'); // Forventer fejlmeddelelse
        done(); // Afslutter test
      });
  });
});


describe('Dataopbevaring', () => {
  // Test for korrekt oprettelse af en aktivitet og sikring af dataopbevaring
  it('skal tilføje en aktivitet og sikre korrekt dataopbevaring', (done) => {
    const newActivity = {
      userId: 1, // Forudsat eksisterende bruger
      activityType: 'sports',
      activityName: 'Jogging',
      minutes: 30
    };

    // Forventede kalorier brændt (Jogging-forbrænding = 666 kalorier pr. time)
    const expectedCalories = (666 * 30) / 60;

    // Exercise: Udfører HTTP POST-anmodning til aktivitets-API'et
    chai
      .request(app)
      .post('/api/activity/activityTracker')
      .send(newActivity) // Sender testdata med anmodningen
      .end((err, res) => { // Afslutningsfunktion for at håndtere respons
        expect(res).to.have.status(201);// Forventer statuskode 201 for succesfuld oprettelse
        expect(res.body).to.be.an('object'); // Forventer respons som et objekt
        expect(res.body).to.have.property('userId').equal(newActivity.userId); // Forventer samme bruger-ID
        expect(res.body).to.have.property('activityType').equal(newActivity.activityType); // Forventer samme aktivitetstype
        expect(res.body).to.have.property('activityName').equal(newActivity.activityName); // Forventer samme aktivitetsnavn
        expect(res.body).to.have.property('duration').equal(newActivity.minutes); // Forventer samme varighed
        expect(res.body).to.have.property('caloriesBurned').equal(expectedCalories); // Forventer korrekt kalorieforbrænding
        done(); // Afslutter test
      });
  });
});






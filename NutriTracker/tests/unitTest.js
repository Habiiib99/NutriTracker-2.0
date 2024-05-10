// ./tests/unitTest.js
import * as chai from 'chai'
import chaiHttp from 'chai-http';
import { app } from '../server.js';

chai.use(chaiHttp); // Tilføj chai-http som plugin
const { expect, request } = chai; // Brug `request` og `expect` fra `chai`

describe('Activity Tracker API', () => {
  // Test for at tilføje en aktivitet og verificere korrekt kalorieberegning
  it('skal tilføje en aktivitet og returnere korrekte oplysninger om kalorieberegning', (done) => {
    // Inputdata til test
    const newActivity = {
      userId: 1, // Antag en bruger-ID findes
      activityType: 'sports',
      activityName: 'Jogging',
      minutes: 30
    };

    // Forventede kalorier brændt (Jogging-forbrænding = 666 kalorier per time)
    const expectedCalories = (666 * 30) / 60;

    request(app) // Brug `request` fra `chai-http`
      .post('/api/activity/activityTracker')
      .send(newActivity)
      .end((err, res) => {
        expect(res).to.have.status(201);
        expect(res.body).to.be.an('object');
        expect(res.body).to.have.property('userId').equal(newActivity.userId);
        expect(res.body).to.have.property('activityType').equal(newActivity.activityType);
        expect(res.body).to.have.property('activityName').equal(newActivity.activityName);
        expect(res.body).to.have.property('duration').equal(newActivity.minutes);
        expect(res.body).to.have.property('caloriesBurned').equal(expectedCalories);
        done();
      });
  });

  // Test for et ugyldigt aktivitetsnavn eller manglende input
  it('skal returnere en fejl, når der mangler inputdata', (done) => {
    const incompleteActivity = {
      userId: 1, // Antag en bruger-ID findes
      activityType: 'sports',
      minutes: 30
    };

    request(app) // Brug `request` fra `chai-http`
      .post('/api/activity/activityTracker')
      .send(incompleteActivity)
      .end((err, res) => {
        expect(res).to.have.status(400);
        expect(res.text).to.equal('Indtast venligst både aktivitet og antal minutter.');
        done();
      });
  });
});

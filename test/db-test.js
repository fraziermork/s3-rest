'use strict';

let dbUser = require(__dirname + '/../models/users.js');
let dbFile = require(__dirname + '/../models/files.js');
let s3Manager = require(__dirname + '/../lib/aws/s3-manager.js');
let superagent = require('superagent');
var chai = require('chai');
var chaiHttp = require('chai-http');
chai.use(chaiHttp);
var expect = chai.expect;
var request = chai.request;

require(__dirname + '/../server.js');

function clearAllAndRepopulate(done){
  dbUser.find().remove().exec()
    .then(() => {
      return dbFile.find().remove().exec();
    })
    .then(() => { //neglecting err, data inputs  
      let washington = new dbUser({
        username: 'quarter',
        password: 'myTeethHurt'
      });
      let fdr = new dbUser({
        username: 'dime',
        password: 'letsMakeANewDeal'
      });
      let abe = new dbUser({
        username: 'penny',
        password: 'honestAbe'
      });
      return Promise.all([fdr.save(), washington.save(), abe.save()]); //save the three new users
    })
    .then(() => { //if there are internet problems, this will break all tests
      return s3Manager.deleteAllFromBucket(); //delete everything from S3
    })
    .then(() => {
      console.log('Finished before block');
      done();
    })
    .catch((err) => {
      console.log('Error saving users: ', err);
      done();
    });
}

describe('/users', ()=>{
  
  describe('/users', ()=> {
    before(clearAllAndRepopulate);
    describe('it should let you GET all users', ()=> {
      it('should have users inside the db', (done) => {
        dbUser.find({}, (err, users) => {
          expect(err).to.equal(null);
          // console.log('users from db are');
          // console.log(users);
          expect(users.length).to.equal(3);
          done();
        });
      });
      it('making GET Request to /users', (done) => {
        request('localhost:3000').get('/users').end((err, response) => {
          expect(err).to.equal(null);
          expect(response.status).to.equal(200);
          // console.log('response.body is');
          // console.dir(response.body);
          expect(response.body.length).to.equal(3);//three users in db at this time
          done();
        });
      });
    });
    
    describe('it should let you POST a user', ()=> {
      it('making POST Request to /users', (done) => {
        request('localhost:3000').post('/users').send({
          username: 'nickel',
          password: 'lifeLibertyHappiness'
        }).end((err, response) => {
          expect(err).to.equal(null);
          expect(response.status).to.equal(200);
          // console.log('response.body');
          // console.dir(response.body);
          expect(response.body.username).to.equal('nickel');
          // expect(response.body.password).to.equal('lifeLibertyHappiness');
          expect(response.body).to.have.property('accountCreationDate');
          done();
        });
      });
      it('should check that it saved a new user', (done) => {
        dbUser.findOne({username: 'nickel'}, (err, user) => {
          expect(err).to.equal(null);
          // console.log('user from db is');
          // console.log(user);
          expect(user.username).to.equal('nickel');
          // expect(user.password).to.equal('lifeLibertyHappiness');
          expect(user).to.have.property('accountCreationDate');
          done();
        });
      });
    });
    
  });//end /users describe
  
  describe('/users/:user', () => {
    before(clearAllAndRepopulate);
    
    describe('it should let you GET a user', ()=> {
      it('should have that user inside the db beforehand', (done) => {
        dbUser.findOne({username: 'dime'}, (err, user) => {
          expect(err).to.equal(null);
          // console.log('user from db are');
          // console.log(user);
          expect(user.username).to.equal('dime');
          done();
        });
      });
      it('making GET Request to /users/:user', (done) => {
        request('localhost:3000').get('/users/dime').end((err, response) => {
          expect(err).to.equal(null);
          expect(response.status).to.equal(200);
          // console.log('response.body is');
          // console.dir(response.body);
          expect(response.body.username).to.equal('dime');
          expect(response.body).to.have.property('files');
          done();
        });
      });
    });
    
    describe('it should let you PUT to update a user', () => {
      it('should have that user inside the db beforehand', (done) => {
        dbUser.findOne({username: 'quarter'}, (err, user) => {
          expect(err).to.equal(null);
          // console.log('user from db are');
          // console.log(user);
          expect(user.username).to.equal('quarter');
          done();
        });
      });
      it('should let you make the PUT request', (done) => {
        request('localhost:3000').put('/users/quarter')
        .send({
          newUsername: 'dollaBill',
          newPassword: 'cherryTree'
        })
        .end((err, response) => {
          expect(err).to.equal(null);
          expect(response.status).to.equal(200);
          // console.log('response.body is');
          // console.log(response.body);
          expect(response.body.username).to.equal('dollaBill');
          expect(response.body).to.have.property('files');
          done();
        });
      });
      it('should have changed that user inside the database afterwards', (done) => {
        dbUser.findOne({username: 'dollaBill'}, (err, user) => {
          expect(err).to.equal(null);
          expect(user.username).to.equal('dollaBill');
          done();
        });
      });
    });
    
    describe('it should let you DELETE a user', () => {
      it('should have that user inside the db beforehand', (done) => {
        dbUser.find({username: 'penny'}, (err, user) => {
          expect(err).to.equal(null);
          // console.log('user from db are');
          // console.log(user);
          expect(user[0].username).to.equal('penny');
          expect(user.length).to.equal(1);
          done();
        });
      });
      it('should let you make the DELETE request', (done) => {
        request('localhost:3000').delete('/users/penny')
        .end((err, response) => {
          expect(err).to.equal(null);
          expect(response.status).to.equal(200);
          // console.log('response.body is');
          // console.log(response.body);
          expect(response.body.username).to.equal('penny');
          expect(response.body).to.have.property('files');
          done();
        });
      });
      it('should have deleted that user inside the database', (done) => {
        dbUser.find({username: 'penny'}, (err, user) => {
          expect(err).to.equal(null);
          // console.log('Found user in db after delete is');
          // console.log(user);
          expect(user.length).to.equal(0);
          done();
        });
      });  
    });
    
    
  });//end /users/:user describe
  
  describe('/users/:user/files', () => {
    before(clearAllAndRepopulate);
    var newFileId;
    describe('should let you POST a file', () => {
      it('should not have any files listed for the user before the post', (done) => {
        dbUser.findOne({username: 'penny'}, (err, user) => {
          expect(err).to.equal(null);
          // console.log('Found user in db before post is');
          // console.log(user);
          expect(user.files.length).to.equal(0);
          done();
        });
      });
      it('should let you post a file', (done) => {
        request('localhost:3000').post('/users/penny/files')
        .send({
          filename: 'GettysburgAddress',
          content: 'Four score and seven years ago...'
        })
        .end((err, response) => {
          expect(err).to.equal(null);
          expect(response.status).to.equal(200);
          // console.log('response.body is');
          // console.log(response.body);
          let fileUpdateInfo = response.body[0];
          let userUpdateInfo = response.body[1];
          expect(fileUpdateInfo.owner).to.equal('penny');
          expect(userUpdateInfo.files.length).to.equal(1);
          done();
        });
      });
      it('should have saved a new file', (done) => {
        dbFile.findOne({filename: 'GettysburgAddress'}, (err, savedFile) => {
          expect(err).to.equal(null);
          newFileId = savedFile._id.toString();
          // console.log('savedFile is');
          // console.log(savedFile);
          expect(savedFile.filename).to.equal('GettysburgAddress');
          expect(savedFile).to.have.property('s3Url');
          done();
        });
      });
      it('should have updated the user in the db', (done) => {
        dbUser.findOne({username: 'penny'}, (err, user) => {
          expect(err).to.equal(null);
          expect(user.files.length).to.equal(1);
          done();
        });
      });
      it('should have posted that file to S3', (done) => {
        s3Manager.findAllInBucket()
          .then((bucketContents) => {
            let savedFile = bucketContents.contents
            .filter((current) => {
              return current.Key === newFileId;
            })[0];
            // console.log('savedFile to s3 is');
            // console.dir(savedFile);
            expect(savedFile.length).to.equal(1);
            done();
          })
          .catch((err) => {
            new Error(err);
            done();
          });
      });
      
    });
    describe('should let you GET all files for a user', () => {
      it('should return an array of populated files for that user', (done) => {
        request('localhost:3000').get('/users/penny/files').end((err, response) => {
          expect(err).to.equal(null);
          expect(response.status).to.equal(200);
          // console.log('response.body is');
          // console.log(response.body[0]);
          expect(response.body[0].filename).to.equal('GettysburgAddress');
          expect(response.body[0].s3Url.length).to.be.gt(0);
          done();
        });
      });
    });
    
  }); //end of /users/:user/files describe
  
  describe('/users/:user/files/:file', () => {
    // before(clearAllAndRepopulate);
    // before((done) => {
    //   superagent.post('https://localhost:3000/users/penny/files')
    //   .send({
    //     filename: 'GettysburgAddress',
    //     content: 'Four score and seven years ago...'
    //   })
    //   .set('Content-Type', 'application/json')
    //   .end((err) => { //neglecting response input to callback
    //     if(err){
    //       console.log('Error posting file: ', err);
    //     }
    //     done();
    //   });
    // });
    // it('should pass this experimental test', () => {
    //   expect(true).to.equal(true);
    // });
    
    describe('should let you GET an individual file', () => {
      it('should have a file present before I make any requests', (done) => {
        dbFile.findOne({filename: 'GettysburgAddress'}, (err, savedFile) => {
          expect(err).to.equal(null);
          // console.log('savedFile is');
          // console.log(savedFile);
          expect(savedFile.filename).to.equal('GettysburgAddress');
          expect(savedFile).to.have.property('s3Url');
          done();
        });
      });
      it('should let you make a GET request', (done) => {
        request('localhost:3000').get('/users/penny/files/GettysburgAddress').end((err, response) => {
          expect(err).to.equal(null);
          expect(response.status).to.equal(200);
          // console.log('response.body is');
          // console.log(response.body);
          expect(response.body.filename).to.equal('GettysburgAddress');
          done();
        });
      });
    });
    
    describe('should let you PUT to replace a file', () => {
      it('should let me make the put request', (done) => {
        request('localhost:3000').put('/users/penny/files/GettysburgAddress')
        .send({
          newContent: 'Four score and seven years ago our fathers brought forth on this continent, a new nation, conceived in Liberty, and dedicated to the proposition that all men are created equal.'
        }).end((err, response) => {
          expect(err).to.equal(null);
          expect(response.status).to.equal(200);
          // console.log('response.body is');
          // console.log(response.body);
          expect(response.body).to.have.property('ETag');
          done();
        });
      });
      
    });
    describe('should let you DELETE a file', () => {
      it('should let you make a delete request', (done) => {
        request('localhost:3000').delete('/users/penny/files/GettysburgAddress')
        .send({
          newContent: 'Four score and seven years ago our fathers brought forth on this continent, a new nation, conceived in Liberty, and dedicated to the proposition that all men are created equal.'
        }).end((err, response) => {
          expect(err).to.equal(null);
          expect(response.status).to.equal(200);
          // console.log('response.body is');
          // console.log(response.body);
          done();
        });
      });
    });    
  });
});


describe('/files', () => {
  before(clearAllAndRepopulate);
  describe('should let you GET an individual file', () => {
    it('should let you post a file', (done) => {
      request('localhost:3000').post('/users/penny/files')
      .send({
        filename: 'GettysburgAddress',
        content: 'Four score and seven years ago...'
      })
      .end((err, response) => {
        expect(err).to.equal(null);
        expect(response.status).to.equal(200);
        // console.log('response.body is');
        // console.log(response.body);
        let fileUpdateInfo = response.body[0];
        let userUpdateInfo = response.body[1];
        expect(fileUpdateInfo.owner).to.equal('penny');
        expect(userUpdateInfo.files.length).to.equal(1);
        done();
      });
    });
    it('should have a file present before I make any requests', (done) => {
      dbFile.findOne({filename: 'GettysburgAddress'}, (err, savedFile) => {
        expect(err).to.equal(null);
        // console.log('savedFile is');
        // console.log(savedFile);
        expect(savedFile.filename).to.equal('GettysburgAddress');
        expect(savedFile).to.have.property('s3Url');
        done();
      });
    });
    it('should let you make a GET request', (done) => {
      request('localhost:3000').get('/files/GettysburgAddress')
      .set('X-username', 'penny').end((err, response) => {
        expect(err).to.equal(null);
        expect(response.status).to.equal(200);
        // console.log('response.body is');
        // console.log(response.body);
        expect(response.body.filename).to.equal('GettysburgAddress');
        done();
      });
    });
  });
  // describe('should let you PUT to replace a file', () => {
  //   it('should let me make the put request', (done) => {
  //     request('localhost:3000').put('/files/GettysburgAddress')
  //     .set('X-username', 'penny').send({
  //       newContent: 'Four score and seven years ago our fathers brought forth on this continent, a new nation, conceived in Liberty, and dedicated to the proposition that all men are created equal.'
  //     }).end((err, response) => {
  //       expect(err).to.equal(null);
  //       expect(response.status).to.equal(200);
  //       // console.log('response.body is');
  //       // console.log(response.body);
  //       expect(response.body).to.have.property('ETag');
  //       done();
  //     });
  //   });
  //   
  // });
  // describe('should let you DELETE a file', () => {
  //   it('should let you make a delete request', (done) => {
  //     request('localhost:3000').delete('/files/GettysburgAddress')
  //     .set('X-username', 'penny').send({
  //       newContent: 'Four score and seven years ago our fathers brought forth on this continent, a new nation, conceived in Liberty, and dedicated to the proposition that all men are created equal.'
  //     }).end((err, response) => {
  //       expect(err).to.equal(null);
  //       expect(response.status).to.equal(200);
  //       // console.log('response.body is');
  //       // console.log(response.body);
  //       done();
  //     });
  //   });
  // }); 
});

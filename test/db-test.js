'use strict';
let superagent = require('superagent');
var mockgoose = require('mockgoose');
var mongoose = require('mongoose');
mockgoose(mongoose);

var chai = require('chai');
var chaiHttp = require('chai-http');
chai.use(chaiHttp);
var expect = chai.expect;
var request = chai.request;

require(__dirname + '/../server.js');
let File = require(__dirname + '/models/files.js');
let User = require(__dirname + '/models.users.js');

describe('/users', () => {
  beforeEach((done) => {
    console.log('mongoose.isMocked() returns ' + mongoose.isMocked());
    mockgoose.reset(() => {
      let fdr = new User({
        username: 'dime',
        password: 'letsMakeANewDeal'
      });
      let washington = new User({
        username: 'quarter',
        password: 'myTeethHurt'
      });
      let abe = new User({
        username: 'penny',
        password: 'honestAbe'
      });
      Promise.all([fdr.save.exec(), washington.save.exec(), abe.save.exec()])
      .then(() => {
        done();
      })
      .catch((err) => {
        console.log('Error saving users: ', err);
      });
    });
  });
  describe('/', () => {
    describe('GET to /users', () => {
      it('should let you see all users', (done) => {
        request('localhost:3000').get('/users').end((err, response) => {
          expect(err).to.equal(null);
          expect(response.status).to.equal(200);
          console.log(response.body);
          // expect(response.body).
          done();
        });
      });
    });
    describe('POST to /users', () => {
      it('should let you post a new user', (done) => {
        request('localhost:3000').post('/users').send({
          username: 'nickel',
          password: 'lifeLibertyHappiness'
        }).end((err, response) => {
          expect(err).to.equal(null);
          expect(response.status).to.equal(200);
          expect(response.body.username).to.equal('nickel');
          expect(response.body.password).to.equal('lifeLibertyHappiness');
          done();
        });
      });
      it('should have saved a new user', (done) => {
        User.findOne({username: 'nickel'}, (err, user) => {
          expect(err).to.equal(null);
          expect(user.password).to.equal('lifeLibertyHappiness');
          done();
        });
      });
    });
  });
  
  describe('/users/:user', () => {
    describe('GET to /users/:user', () => {
      it('should let you request a particular user', (done) => {
        request('localhost:3000').get('/users/dime').end((err, response) => {
          expect(err).to.equal(null);
          expect(response.status).to.equal(200);
          expect(response.body.username).to.equal('penny');
          expect(response.body.password).to.equal('honestAbe');
          expect(response.body.accountCreationDate instanceof Date).to.equal(true);
          done();
        });
      });
    });
    describe('PUT to /users/:user', () => {
      it('should let you make changes to a user', (done) => {
        request('localhost:3000').put('/users/quarter').send({
          username: 'dollaBill',
          password: 'cherryTree'
        }).end((err, response) => {
          expect(err).to.equal(null);
          expect(response.status).to.equal(200);
          console.log('response.body is');
          console.dir(response.body);
          // expect(response.body.username)
          done();
        });
      });
      it('should have successfully updated a user', (done) => {
        User.findOne({username: 'dollaBill'}, (err, user) => {
          expect(err).to.equal(null);
          expect(user.password).to.equal('cherryTree');
          done();
        });
      });
    });
    describe('DELETE to /users/:user', () => {
      it('should let you delete a user', (done) => {
        request('localhost:3000').delete('/users/penny').end((err, response) => {
          expect(err).to.equal(null);
          expect(response.status).to.equal(200);
          done();
        });
      });
      it('should have deleted that user', (done) => {
        User.find({username: 'dollaBill'}, (err, user) => {
          expect(err).to.equal(null);
          expect(user.length).to.equal(0);
          done();
        });
      });
    });
  });
  
  describe('/users/:user/files', () => {
    describe('POST to /users/:user/files', () => {
      var newFileId, fileOwnerName;
      it('should let you post a file to a user', (done) => {
        request('localhost:3000').post('/users/penny/files').send({
          filename: 'GettysburgAddress',
          content: 'Four score and seven years ago...'
        }).end((err, response) => {
          expect(err).to.equal(null);
          expect(response.status).to.equal(200);
          done();
        });
      });
      it('should have saved a new file', (done) => {
        File.findOne({filename: 'GettysburgAddress'}, (err, searchedFile) => {
          expect(err).to.equal(null);
          expect(searchedFile.s3Url.length).to.be.gt(0);
          expect(searchedFile.owner.length).to.be.gt(0);
          fileOwnerName = searchedFile.owner;
          newFileId = searchedFile._id;
          done();
        });
      });
      it('should have updated the files entry of the owner', (done) => {
        User.findOne({username: fileOwnerName})
        .populate('files').exec((err, fileOwner) => {
          expect(err).to.equal(null);
          expect(fileOwner.files.length).to.be.gt(0);
          expect(fileOwner.files[0]._id).to.equal(newFileId);
          done();
        });
      });
    });
    describe('GET to /users/:user/files', () => {
      it('should populate correctly and let you grab the files belonging to a user', (done) => {
        request('localhost:3000').get('/users/penny/files').end((err, response) => {
          expect(err).to.eqaul(null);
          expect(response.status).to.equal(200);
          console.log('response.body is');
          console.dir(response.body);
          expect(response.body.length).to.be.gt(0);
          done();
        });
      });
    });
  });
  
  describe('/users/:user/files/:file', () => {
    var oldDBFile;
    before((done) => {
      superagent.post('https://localhost:3000/users/penny/files')
      .set('Content-Type', 'application/json')
      .send({
        filename: 'GettysburgAddress',
        content: 'Four score and seven years ago...'
      }).end((err) => { //neglecting response input to callback
        if(err){
          console.log('Error posting file: ', err);
        }
        done();
      });
    });
    describe('GET to /users/:user/files/:file', () => {
      it('should let you see a file owned by a particular user', (done) => {
        request('localhost:3000').get('/users/penny/files/GettysburgAddress').end((err, response) => {
          expect(err).to.equal(null);
          expect(response.status).to.equal(200);
          expect(response.body.owner).to.equal('penny');
          expect(response.body.s3Url.length).to.be.gt(0);
          oldDBFile = response.body;
          done();
        });
      });
    });
    describe('PUT to /users/:user/files/:file', () => {
      var savedDBFile;
      it('should let you replace a file owned by a particular user', (done) => {
        request('localhost:3000').put('/users/penny/files/GettysburgAddress')
        .send({
          content: 'Four score and seven years ago our fathers brought forth on this continent, a new nation, conceived in Liberty, and dedicated to the proposition that all men are created equal.'
        }).end((err, response) => {
          expect(err).to.equal(null);
          expect(response.status).to.equal(200);
          expect(response.body.s3Url.length).to.be.gt(0);
          savedDBFile = response.body;
          done();
        });
      });
      it('should have changed the file that is saved', (done) => {
        File.findOne({_id: savedDBFile._id}, (err, retrievedDBFile) => {
          expect(err).to.equal(null);
          expect(retrievedDBFile.modifiedDate).to.not.eql(oldDBFile.modifiedDate);
          expect(retrievedDBFile.s3Url).to.not.eql(oldDBFile.s3Url);
          done();
        });
      });
      it('should have updated the user', (done) => {
        User.findOne({name: 'penny'}, (err, thatUser) => {
          expect(err).to.equal(null);
          expect(thatUser.files.indexOf(savedDBFile._id)).to.not.equal(-1);
          done();
        });
      });
    });
    describe('DELETE to /users/:user/files/:file', () => {
      it('should let you delete a specific file', (done) => {
        request('localhost:3000').delete('/users/penny/files/GettysburgAddress')
        .end((err, response) => {
          expect(err).to.equal(null);
          expect(response.status).to.equal(200);
          done();
        });
      });
      it('should have deleted the file from the database', (done) => {
        File.find({filename: 'GettysburgAddress'}, (err, retrievedDBFiles) => {
          expect(err).to.equal(null);
          expect(retrievedDBFiles.length).to.equal(0);
          done();
        });
      });
      it('should have deleted the file reference from the user', (done) => {
        User.findOne({name: 'penny'}, (err, thatUser) => {
          expect(err).to.equal(null);
          expect(thatUser.files.length).to.equal(0);
          done();
        });
      });
    });
  });
});

describe('/files', () => {
  var oldDBFile;
  beforeEach((done) => {
    console.log('mongoose.isMocked() returns ' + mongoose.isMocked());
    mockgoose.reset(() => {
      let fdr = new User({
        username: 'dime',
        password: 'letsMakeANewDeal'
      });
      let washington = new User({
        username: 'quarter',
        password: 'myTeethHurt'
      });
      let abe = new User({
        username: 'penny',
        password: 'honestAbe'
      });
      Promise.all([fdr.save.exec(), washington.save.exec(), abe.save.exec()])
      .then(() => {
        done();
      })
      .catch((err) => {
        console.log('Error saving users: ', err);
      });
    });
  });
  describe('GET to /files/:file', () => {
    it('should let you see a file owned by a particular user', (done) => {
      request('localhost:3000').set('X-username', 'penny').get('/files/GettysburgAddress').end((err, response) => {
        expect(err).to.equal(null);
        expect(response.status).to.equal(200);
        expect(response.body.owner).to.equal('penny');
        expect(response.body.s3Url.length).to.be.gt(0);
        oldDBFile = response.body;
        done();
      });
    });
  });
  describe('PUT to /files/:file', () => {
    var savedDBFile;
    it('should let you replace a file owned by a particular user', (done) => {
      request('localhost:3000').set('X-username', 'penny').put('/files/GettysburgAddress')
      .send({
        content: 'Four score and seven years ago our fathers brought forth on this continent, a new nation, conceived in Liberty, and dedicated to the proposition that all men are created equal.'
      }).end((err, response) => {
        expect(err).to.equal(null);
        expect(response.status).to.equal(200);
        expect(response.body.s3Url.length).to.be.gt(0);
        savedDBFile = response.body;
        done();
      });
    });
    it('should have changed the file that is saved', (done) => {
      File.findOne({_id: savedDBFile._id}, (err, retrievedDBFile) => {
        expect(err).to.equal(null);
        expect(retrievedDBFile.modifiedDate).to.not.eql(oldDBFile.modifiedDate);
        expect(retrievedDBFile.s3Url).to.not.eql(oldDBFile.s3Url);
        done();
      });
    });
    it('should have updated the user', (done) => {
      User.findOne({name: 'penny'}, (err, thatUser) => {
        expect(err).to.equal(null);
        expect(thatUser.files.indexOf(savedDBFile._id)).to.not.equal(-1);
        done();
      });
    });
  });
  describe('DELETE to /files/:file', () => {
    it('should let you delete a specific file', (done) => {
      request('localhost:3000').set('X-username', 'penny')
      .delete('/files/GettysburgAddress')
      .end((err, response) => {
        expect(err).to.equal(null);
        expect(response.status).to.equal(200);
        done();
      });
    });
    it('should have deleted the file from the database', (done) => {
      File.find({filename: 'GettysburgAddress'}, (err, retrievedDBFiles) => {
        expect(err).to.equal(null);
        expect(retrievedDBFiles.length).to.equal(0);
        done();
      });
    });
    it('should have deleted the file reference from the user', (done) => {
      User.findOne({name: 'penny'}, (err, thatUser) => {
        expect(err).to.equal(null);
        expect(thatUser.files.length).to.equal(0);
        done();
      });
    });
  });
});

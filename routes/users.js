'use strict',
let File = require(__dirname + '/../models/files.js');
let User = require(__dirname + '/../models/users.js');
// let s3Manager = require(__dirname + '/../lib/aws/s3-manager.js');

module.exports = function(router, s3Manager){
  
  router.route('/')
  .get((request, response) => {
    console.log('GET request made to /users');
    User.find({}).select('username accountCreationDate').exec()
    .then((users) => {
      response.status(200).json(users);
    })
    .catch((err) => {
      response.status(500).end('500 Error finding users: ', err);
    });
  })
  .post((request, response) => {
    console.log('POST request made to /users');
    if(request.body.password && request.body.username){
      var newUser = new User({
        username: request.body.username,
        password: request.body.password,
      });
      newUser.save().exec()
      .then((newDBUser) => {
        response.status(200).end(newDBUser.name + ' successfully created.');
      })
      .catch((err) => {
        response.status(500).end('500 Error saving user: ', err);
      });
      
    } else {
      return response.status(400).end('400 Bad request');
    }
  });
  
  router.route('/:user')
  .get((request, response) => {  //need to figure out a way to check whether that user's password was entered correctly
    console.log('GET request made to /users/:user');
    User.where({username: request.params.user}).populate('files').exec()
    .then((thatUser) => {
      console.log('thatUser is');
      console.dir(thatUser);
      response.status(200).json(thatUser);
    })
    .catch((err) => {
      console.log('Error finding user ' + request.params.user + '. Error was ', err);
      resonse.status(404).end('404 User ' + request.params.user + ' not found');
    });
  })
  .put((request, response) => {  //need to figure out a way to check whether that user's password was entered correctly
    console.log('POST request made to /users/:user');
    User.where({username: request.params.user})
    .update((function(){
      let returnObj = {
        '$set' = {},
        '$push' = {}
      };
      if(request.body.username){
        returnObj.$set.username = request.body.username;
      }
      if (request.body.password){
        returnObj.$set.password = request.body.password;
      }
      if (request.body.files){
        returnObj.$push.files = {$each: request.body.files};
      }    
      return returnObj;
    })()).exec()
    .then((thatUser) => {
      console.log('thatUser is');
      console.dir(thatUser);
      response.status(200).json(thatUser);
    })
    .catch((err) => {
      console.log('Error finding user ' + request.params.user + '. Error was ', err);
      resonse.status(404).end('404 User ' + request.params.user + ' not found.');
    });
  })
  .delete((request, response) => { //need to figure out a way to check whether that user's password was entered correctly
    console.log('DELETE request made to /users/:user');
    User.where({username: request.params.user})
    .findOneAndRemove().exec()
    .then((thatUser) => {
      console.log('thatUser was');
      console.dir(thatUser);
      console.log('Going to delete ' + thatUser.name + ' from S3.');
      return s3Manager.deleteFilesFromArray(thatUser.files);
    })
    .then((data) => {
      console.log('Successfully deleted ' + request.params.user + ' from S3.');
      response.status(200).end('Successfully deleted ' + request.params.user + ' from S3.');
    })
    .catch((err) => {
      console.log('Error finding user ' + request.params.user + ' or deleting them from S3. Error was ', err);
      resonse.status(404).end('404 User ' + request.params.user + ' not found.');
    });
  });
  
  
  
  
  
  router.route('/:user/files')
  .get((request, response) => {  //need to figure out a way to check whether that user's password was entered correctly
    console.log('GET request made to /users/:user/files');
    User.where({username: request.params.user}).select('files')
    .populate('files').exec()
    .then((files) => {
      response.status(200).json(files);
    })
    .catch((err) => {
      console.log('Error finding files for ' + request.params.user + '. Error was, ', err);
      response.status(404).end('Error finding files for ' + request.params.user + '.');
    });
  })
  .post((request, response)=>{  //need to figure out a way to check whether that user's password was entered correctly
    console.log('POST request made to /users/:user/files');
    var fileDBId;
    if(request.body.filename && request.body.content){
      let newFile = new File({
        owner: [request.params.user],
        filename: request.body.filename
      });
      newFile.save()
      .then((savedDBFile) => {
        fileDBId = savedDBFile._id;
        return s3Manager.saveContent(savedDBFile, request.body.content);
      })
      .then((generatedS3Url) => {
        let fileUpdatePromise = File.findOneAndUpdate({_id: fileDBId}, {$set: {s3Url: generatedS3Url}}).exec();
        let userUpdatePromise = User.findOneAndUpdate({username: request.body.username}, {$push: {files: fileDBId}}).exec();
        return Promise.all([fileUpdatePromise, userUpdatePromise])
      })
      .then((values) => {
        console.log('Promise.all values: ');
        console.dir(values);
        response.status(200).end()
      })
      .catch((err) => {
        console.log('Error saving file ' + request.body.filename + ', error was ', err);
        response.status(500).end('Error saving file ' + request.body.filename + '.');
      });
    } else {
      console.log('Invalid post');
      response.status(400).end('Invalid post');
    }
  });
  
  router.route('/:user/files/:file')
  .get((request, response) =>{  //need to figure out a way to check whether that user's password was entered correctly
    console.log('GET request made to /:user/files/:file');
    request.redirect('/files/' + request.params.file);
  })
  .put((request, response) => {  //need to figure out a way to check whether that user's password was entered correctly
    console.log('POST request made to /:user/files/:file');
    request.redirect('/files/' + request.params.file);
  })
  .delete((request, response) => {  //need to figure out a way to check whether that user's password was entered correctly
    console.log('DELETE request made to /:user/files/:file');
    request.redirect('/files/' + request.params.file);
  });
  
  return router;
};

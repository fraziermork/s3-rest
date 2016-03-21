'use strict',
let File = require(__dirname + '/../models/files.js');
let User = require(__dirname + '/../models/users.js');

module.exports = function(router, s3Manager){
  
  router.route('/')
  .get((request, response) => {
    console.log('GET request made to /users');
    User.find({}).select('username accountCreationDate').exec()
    .then((users) => {
      console.log('finished finder users');
      response.status(200).json(users);
    })
    .catch((err) => {
      console.log('500 Error finding users: ', err);
      response.status(500).end('500 Error finding users.');
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
        console.log('finished posting a new user');
        response.status(200).end(newDBUser.name + ' successfully created.');
      })
      .catch((err) => {
        console.log('500 Error saving user: ', err);
        response.status(500).end('500 Error saving user.');
      });
    } else {
      console.log('Request needs a password and a username');
      return response.status(400).end('400 Bad request');
    }
  });
  
  router.route('/:user')
  .get((request, response) => {  //need to figure out a way to check whether that user's password was entered correctly
    console.log('GET request made to /users/:user');
    User.where({username: request.params.user}).populate('files').exec()
    .then((thatUser) => {
      console.log('finished finding the desired user');
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
    console.log('PUT request made to /users/:user');
    User.where({username: request.params.user})
    .update((function(){
      console.log('going to update the user');
      let returnObj = {
        '$set' = {},
        '$push' = {}
      };
      if(request.body.newUsername){
        console.log('request to change the username');
        returnObj.$set.username = request.body.newUsername;
      }
      if (request.body.newPassword){
        console.log('request to change the password');
        returnObj.$set.password = request.body.newPassword;
      }
      if (request.body.files){
        console.log('request to give ownership of a file');
        returnObj.$push.files = {$each: request.body.files};
      }    
      return returnObj;
    })()).exec()
    .then((thatUser) => {
      console.log('finished updating the user');
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
      console.log('Going to delete ' + thatUser.name + ' from S3.');
      console.log('thatUser was');
      console.dir(thatUser);
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
    .then((thatDBUser) => {
      console.log('found the files for the user ' + request.params.user);
      response.status(200).json(thatDBUser.files);
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
      console.log('Request had a filename and content');
      console.log('going to save the file to mongo');
      let newFile = new File({
        owner: request.params.user,
        filename: request.body.filename
      });
      newFile.save()
      .then((savedDBFile) => {
        console.log('going to save the file to S3');
        fileDBId = savedDBFile._id;
        return s3Manager.saveContent(savedDBFile._id, request.body.content);
      })
      .then((generatedS3Url) => {
        console.log('going to update the user and file with the s3url and the fileid');
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
      console.log('Invalid post lacking filename or content');
      response.status(400).end('Invalid post');
    }
  });
  
  router.route('/:user/files/:file')
  .get((request, response) =>{  //need to figure out a way to check whether that user's password was entered correctly
    console.log('GET request made to /:user/files/:file');
    User.findOne({username: request.params.user})
    .populate('files').exec()
    .then((thatUser) => {
      console.log('going to get file ' + request.params.file);
      let desiredFile = thatUser.files.filter((current) => {
        return current.filename === request.params.file;
      })[0];
      response.status(200).json(desiredFile);
    })
    .catch((err) => {
      console.log('Error retrieving user ' + request.body.username + ': ', err);
      response.status(404).end('Error retrieving user ' + request.body.username + '.');
    });
  })
  .put((request, response) => {  //need to figure out a way to check whether that user's password was entered correctly
    console.log('POST request made to /:user/files/:file');
    var fileToChange, thatUserId;
    User.findOne({username: request.params.user})
    .populate('files').exec()
    .then((thatUser) => {//delete reference to file from user
      thatUserId = thatUser._id;
      fileToChange = thatUser.files.filter((current) => {
        return current.filename === request.params.file;
      })[0];
      console.log('Going to delete reference to file from user and delete file from S3');
      let userUpdatePromise = User.findOneAndUpdate({_id: thatUserId}, {$pull: {files: fileToChange._id }}).exec();
      let fileUpdatePromise = s3Manager.deleteFilesFromArray([fileToChange._id]); 
      return Promise.all([userUpdatePromise, fileUpdatePromise]);
    })
    .then((data) => { //create a new file reference on mongo
      console.log('going to save a new file');
      let newFile = new File({
        owner: request.params.user,
        filename: request.params.file
      });
      return newFile.save().exec();  
    })
    .then((savedDBFile) => { //upload the new file to S3
      console.log('going to save the new content to S3');
      fileToChange = savedDBFile;
      return s3Manager.saveContent(fileToChange._id, request.body.content); 
    })
    .then((updatedS3Url) => { //update the file reference in mongo with the url
      console.log('going to update the mongo file with the s3 url and update the user file with the new file id');
      let userUpdatePromise = File.findOneAndUpdate({_id: fileToChange._id}, {$set: {s3Url: updatedS3Url}}).exec();
      let fileUpdatePromise = User.findOneAndUpdate({_id: thatUserId}, {$push: {files: fileToChange._id}});
      return Promise.all([userUpdatePromise, fileUpdatePromise]);
    })
    .then(() => {
      console.log('finished updating file ' + request.params.file);
      response.status(200).json(fileToChange);
    })
    .catch((err) => {
      console.log('404 Error updating file ' + request.body.filename + ': ', err);
      response.status(404).end('404 Error updating file ' + request.body.filename);
    });
  })
  .delete((request, response) => {  //need to figure out a way to check whether that user's password was entered correctly
    console.log('DELETE request made to /:user/files/:file');
    User.findOne({username: request.get('X-username')})
    .populate('files').exec()
    .then((thatUser) => {
      console.log('going to delete file ' + request.params.file);
      let fileToDelete = thatUser.files.filter((current) => {
        return current.filename === request.params.file;
      })[0];
      return s3Manager.deleteFilesFromArray([fileToDelete._id]);
    })
    .then((data) => {
      console.log('Successfully deleted file ' + request.params.file + '.');
      response.status(200).end('Successfully deleted file ' + request.params.file + '.');
    })
    .catch((err) => {
      console.log('Error deleting file ' + request.params.file + ': ', err);
      response.status(400).end('400 Error deleting file ' + request.params.file)
    });
    
  });
  
  return router;
};

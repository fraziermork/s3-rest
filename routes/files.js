'use strict';
let File = require(__dirname + '/../models/files.js');
let User = require(__dirname + '/../models/users.js');
// let s3Manager = require(__dirname + '/../lib/aws/s3-manager.js');

module.exports = function(router, s3Manager){
  router.route('/:file')
  .get((request, response) => { //need to check to make sure that there is a valid username and password coming in
    console.log('GET request made to /files/:file');
    User.findOne({username: request.body.username})
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
  .put((request, response)=>{ //need to check to make sure that there is a valid username and password coming in
    console.log('PUT request made to /files/:file');
    var fileToChange, thatUserId;
    User.findOne({username: request.body.username})
    .populate('files').exec()
    .then((thatUser) => {//delete reference to file from user
      console.log('Going to delete reference to file from user');
      thatUserId = thatUser._id;
      fileToChange = thatUser.files.filter((current) => {
        return current.filename === request.params.file;
      })[0];
      return User.findOneAndUpdate({_id: thatUserId}, {$pull: {files: fileToChange._id }}).exec();
    }).then(() => { //delete old file from S3
      console.log('going to delete file from S3');
      return s3Manager.deleteFilesFromArray([fileToChange._id]); 
    })
    .then((data) => { //create a new file reference on mongo
      console.log('going to save a new file');
      let newFile = new File({
        owner: [request.params.user],
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
      console.log('going to update the mongo file with the s3 url');
      return File.findOneAndUpdate({_id: fileToChange._id}, {$set: {s3Url: updatedS3Url}}).exec();
    })
    .then((updatedDBFile) => {
      console.log('going to update the user file with the new file id');
      User.findOneAndUpdate({_id: thatUserId}, {$push: {files: fileToChange._id}});
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
  .delete((request, response) => { //need to check to make sure that there is a valid username and password coming in
    console.log('DELETE request made to /files/:file');
    User.findOne({username: request.body.username})
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

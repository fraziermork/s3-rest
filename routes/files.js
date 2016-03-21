'use strict',
let File = require(__dirname + '/../models/files.js');
let User = require(__dirname + '/../models/users.js');
// let s3Manager = require(__dirname + '/../lib/aws/s3-manager.js');

module.exports = function(router, s3Manager){
  router.route('/:file')
  .get((request, response) => {
    User.findOne({username: request.body.username}).populate('files').exec()
    .then((thatUser) => {
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
  .put((request, response)=>{
    User.findOne({username: request.body.username}).populate('files').exec()
    .then((thatUser) => {
      let fileToChange = thatUser.files.filter((current) => {
        return current.filename === request.params.file;
      })[0];
      
    })
    .catch((err) => {
      
    });
  })
  .delete((request, response) => {
    User.findOne({username: request.body.username}).populate('files').exec()
    .then((thatUser) => {
      let fileToDelete = thatUser.files.filter((current) => {
        return current.filename === request.params.file;
      })[0];
      return s3Manager.deleteFilesFromArray([fileToDelete._id]);
    })
    .then((data) => {
      response.status(200).end('Successfully deleted file ' + request.params.file + '.');
    })
    .catch((err) => {
      console.log('Error deleting file ' + request.params.file + ': ', err);
      response.status(400).end('400 Error deleting file ' + request.params.file)
    });
    
  });
  
  return router;
};

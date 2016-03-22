'use strict';
var dbUser = require(__dirname + '/../models/users.js');
var dbFile = require(__dirname + '/../models/files.js');
// let superagent = require('superagent');

module.exports = function(router, s3Manager){
  router.route('/:file')
  .get((request, response) => { //need to check to make sure that there is a valid username and password coming in
    console.log('GET request made to /files/:file');
    let username = request.get('X-username');

    dbUser.findOne({username: username})
    .populate('files').exec()
    .then((thatDBUser) => {
      // console.log('Successfully deleted user ' + request.params.user);
      response.status(200).json(thatDBUser.files.filter((current) => {
        return current.filename === request.params.file;
      })[0]);
    })
    .catch((err) => {
      console.log('Error returning files of user ' + username, err);
      response.status(400).end();
    });
    
    
    // superagent.get('https://localhost:3000/users/' + username + '/files/' + request.params.file).end((err, getResponse) => {
    //   if (err){
    //     return response.status(400).json(err);
    //   }
    //   response.status(200).json(getResponse);
    // });
    // // response.redirect('https://localhost:3000/users/' + username + '/files/' + request.params.file);
  })
  .put((request, response) => { //need to check to make sure that there is a valid username and password coming in
    console.log('PUT request made to /files/:file');
    let username = request.get('X-username'); 
    dbUser.findOne({username: username})
    .populate('files').exec()
    .then((thatDBUser) => {
      let s3ObjectKey = thatDBUser.files.filter((current) => {
        return current.filename === request.params.file;
      })[0]._id.toString();
      return s3Manager.updateContent(s3ObjectKey, request.body.newContent);
    })
    .then((s3UpdateData) => {
      response.status(200).json(s3UpdateData);
    })
    .catch((err) => {
      console.log('Error updating files of user ' + username, err);
      response.status(400).json(err);
    });
    
    // superagent.PUT('https://localhost:3000/users/' + username + '/files/' + request.params.file)
    // .send(request.body).end((err, getResponse) => {
    //   if (err){
    //     return response.status(400).json(err);
    //   }
    //   response.status(200).json(getResponse);
    // });
    // response.redirect('https://localhost:3000/users/' + username + '/files/' + request.params.file);
  })
  .delete((request, response) => { //need to check to make sure that there is a valid username and password coming in
    console.log('DELETE request made to /files/:file');
    let username = request.get('X-username');
    dbUser.findOne({username: username})
    .populate('files').exec()
    .then((thatDBUser) => {
      let s3ObjectKey = thatDBUser.files.filter((current) => {
        return current.filename === request.params.file;
      })[0]._id.toString();
      return s3Manager.deleteFilesFromArray([s3ObjectKey]);
    })
    .then((s3DeleteData) => {
      response.status(200).json(s3DeleteData);
    })
    .catch((err) => {
      console.log('Error updating files of user ' + username, err);
      response.status(400).end();
    });
    
    // superagent.delete('https://localhost:3000/users/' + username + '/files/' + request.params.file)
    // .end((err, getResponse) => {
    //   if (err){
    //     return response.status(400).json(err);
    //   }
    //   response.status(200).json(getResponse);
    // });
    // response.redirect('https://localhost:3000/users/' + username + '/files/' + request.params.file);
  });
  
  return router;
};

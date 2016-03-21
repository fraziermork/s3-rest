'use strict';
// let File = require(__dirname + '/../models/files.js');
// let User = require(__dirname + '/../models/users.js');
// let s3Manager = require(__dirname + '/../lib/aws/s3-manager.js');

module.exports = function(router){
  router.route('/:file')
  .get((request, response) => { //need to check to make sure that there is a valid username and password coming in
    console.log('GET request made to /files/:file');
    response.redirect('/users/' + request.get('X-username') + '/files/' + request.params.file);
  })
  .put((request, response)=>{ //need to check to make sure that there is a valid username and password coming in
    console.log('PUT request made to /files/:file');
    response.redirect('/users/' + request.get('X-username') + '/files/' + request.params.file);
  })
  .delete((request, response) => { //need to check to make sure that there is a valid username and password coming in
    console.log('DELETE request made to /files/:file');
    response.redirect('/users/' + request.get('X-username') + '/files/' + request.params.file);
  });
  
  return router;
};

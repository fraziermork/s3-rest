'use strict';

module.exports = function(router){
  router.route('/:file')
  .get((request, response) => { //need to check to make sure that there is a valid username and password coming in
    console.log('GET request made to /files/:file');
    let username = request.get('X-username');
    response.redirect('/users/' + username + '/files/' + request.params.file);
  })
  .put((request, response) => { //need to check to make sure that there is a valid username and password coming in
    console.log('PUT request made to /files/:file');
    let username = request.get('X-username');
    response.redirect('/users/' + username + '/files/' + request.params.file);
  })
  .delete((request, response) => { //need to check to make sure that there is a valid username and password coming in
    console.log('DELETE request made to /files/:file');
    let username = request.get('X-username');
    response.redirect('/users/' + username + '/files/' + request.params.file);
  });
  
  return router;
};

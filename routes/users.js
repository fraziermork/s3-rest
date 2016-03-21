'use strict',
let Users = require(__dirname + '/users.js');
let s3manager = require(__dirname + '/../lib/aws/s3-manager.js');

module.exports = function(router){
  router.route('/')
  .get((request, response) => {
    
  })
  .post((request, response)=>{
    
  });
  
  router.route('/:user')
  .get((request, response) => {
    
    
  })
  .put((request, response)=>{
    
  })
  .delete((request, response) => {
    
  });
  
  router.route('/:user/files')
  .get((request, response) => {
    
  })
  .post((request, response)=>{
    
  });
  
  return router;
};

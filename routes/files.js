'use strict',
let Users = require(__dirname + '/users.js');
let s3manager = require(__dirname + '/../lib/aws/s3-manager.js');

module.exports = function(router){
  router.route('/:file')
  .get((request, response) => {
    //to receive a particular users file
    
  })
  .put((request, response)=>{
    
  })
  .delete((request, response) => {
    
  });
  
  return router;
};

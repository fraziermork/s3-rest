'use strict';
// var mongoose = require('mongoose');
// var Users = require(__dirname + '/users.js');


module.exports = function(mongoose){
  let fileschema = new mongoose.Schema({
    filename: String,
    owner: [{type: mongoose.Schema.Types.ObjectId, ref: 'Users'}],
    s3Url: String,
    modifiedDate: {type: Date, default: Date.now}
  });
  return mongoose.model('Files', fileschema);
};

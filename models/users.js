'use strict';
// var mongoose = require('mongoose');
// var Users = require(__dirname + '/files.js');

module.exports = function(mongoose){
  let userschema = new mongoose.Schema({
    username: String,
    password: String,
    files: [{type: mongoose.Schema.Types.ObjectId, ref: 'Files'}],
    accountCreationDate: Date, 
    accountLastAccessedDate: Date
  });
  return mongoose.model('Users', userschema);
};

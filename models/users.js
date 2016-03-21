'use strict';
// var mongoose = require('mongoose');
// var Users = require(__dirname + '/files.js');

module.exports = function(mongoose){
  let userschema = new mongoose.Schema({
    username: {type: String, required: true, unique: true},
    password: {type: String, required: true},
    files: [{type: mongoose.Schema.Types.ObjectId, ref: 'Files'}],
    accountCreationDate: {type: Date, default: Date.now}
  });
  return mongoose.model('Users', userschema);
};

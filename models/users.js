'use strict';
var mongoose = require('mongoose');

let userschema = new mongoose.Schema({
  username: {type: String, required: true, unique: true},
  password: {type: String, required: true},
  files: [{type: mongoose.Schema.Types.ObjectId, ref: 'dbFile'}],
  accountCreationDate: {type: Date, default: Date.now}
});
  
module.exports = mongoose.model('dbUser', userschema);

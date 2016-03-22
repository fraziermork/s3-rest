'use strict';
var mongoose = require('mongoose');

let fileschema = new mongoose.Schema({
  filename: {type: String, required: true},
  owner: {type: String, required: true}, //[{type: mongoose.Schema.Types.ObjectId, ref: 'Users'}]
  s3Url: String,
  modifiedDate: {type: Date, default: Date.now}
});

module.exports = mongoose.model('File', fileschema);

'use strict';
var mongoose = require('mongoose');
let bodyParser = require('body-parser');
let s3Manager = require(__dirname + '/lib/aws/s3-manager.js');
let express = require('express');
let app = express();
var router = express.Router();
let filesRouter = require(__dirname + '/routes/files.js')(router, s3Manager);
let usersRouter = require(__dirname + '/routes/users.js')(router, s3Manager);


console.log('Going to try to start a mongo connection.');
let DB_PORT = process.env.MONGOLAB_URI || 'mongodb://localhost/db';
mongoose.connect(DB_PORT);

let db = mongoose.connection;
db.on('error', (err) => {
  console.log('error connecting with MongoDB, error is', err);
});
db.once('open', () => {
  console.log('Mongo connection initiated');
  app.use(bodyParser.json());
  app.use('/users', usersRouter);
  app.use('/files', filesRouter);
  app.listen(3000, ()=> {
    console.log('server started on 3000');
  });
});

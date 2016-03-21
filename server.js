'use strict';
let mongoose = require('mongoose');
let bodyParser = require('body-parser');
let express = require('express');
let app = express();
let filesRouter = require(__dirname + '/routes/files.js')(express.Router());
let usersRouter = require(__dirname +'/routes/users.js')(express.Router());

let DB_PORT = process.env.MONGOLAB_URI || 'mongodb:localhost/db';
mongoose.connect(DB_PORT);
let db = mongoose.connection;
db.on('error', (err) => {
  console.log('error connecting with MongoDB, error is', err);
});
db.once('open', () => {
  app.use(bodyParser.json());
  app.use('/users', usersRouter);
  app.use('/files', filesRouter);
  app.listen(3000, ()=> {
    console.log('server started on 3000');
  });
});

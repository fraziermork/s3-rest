'use strict';
var dbUser = require(__dirname + '/../models/users.js');
var dbFile = require(__dirname + '/../models/files.js');

module.exports = function(router, s3Manager){
  
  router.route('/')
  .get((request, response) => {
    // console.log('GET request made to /users');
    dbUser.find({}).select('username accountCreationDate').exec()
    .then((users) => {
      // console.log('Successfully retrieved all users');
      // console.dir(users); //this is messed up and doesn't show what the end actually receives
      response.status(200).json(users);
    })
    .catch((err) => {
      console.log('Error getting all users', err);
      response.status(400).end();
    });
  })
  .post((request, response) => {
    // console.log('POST request made to /users');
    let newUser = new dbUser({
      username: request.body.username,
      password: request.body.password
    });
    newUser.save().then((newDBUser) => {
      // console.log('Successfully saved new user');
      response.status(200).json(newDBUser);
    })
    .catch((err) => {
      console.log('Error saving user', err);
      response.status(400).end();
    });
  });
  
  
  router.route('/:user')
  .get((request, response) => {
    // console.log('GET request made to /users/:user');
    dbUser.findOne({username: request.params.user})
    .populate('files').exec()
    .then((thatDBUser) => {
      // console.log('Successfully found user ' + request.params.user);
      response.status(200).json(thatDBUser);
    })
    .catch((err) => {
      console.log('Error finding user ' + request.params.user, err);
      response.status(400).end();
    });
  })
  .put((request, response) => {
    // console.log('POST request made to /users/:user');
    var changesObj = {};
    if(request.body.newUsername || request.body.newPassword){
      changesObj.$set = {};
      if(request.body.newUsername){
        // console.log('request to change the username');
        changesObj.$set.username = request.body.newUsername;
      }
      if (request.body.newPassword){
        // console.log('request to change the password');
        changesObj.$set.password = request.body.newPassword;
      }
      if (request.body.files){
        // console.log('request to give ownership of a file');
        changesObj.$push = {};
        changesObj.$push.files = {$each: request.body.files};
      }
    }
    dbUser.findOneAndUpdate({username: request.params.user}, changesObj, {new: true}).exec()
    .then((newDBUser) => {
      // console.log('Successfully updated user ' + request.params.user);
      response.status(200).json(newDBUser);
    })
    .catch((err) => {
      console.log('Error updating user ' + request.params.user, err);
      response.status(400).end();
    });
  })
  .delete((request, response) => {
    // console.log('DELETE request made to /users/:user');
    dbUser.findOneAndRemove({username: request.params.user}).exec()
    .then((deletedDBUser) => {
      // console.log('Successfully deleted user ' + request.params.user);
      response.status(200).json(deletedDBUser);
    })
    .catch((err) => {
      console.log('Error deleting user ' + request.params.user, err);
      response.status(400).end();
    });
  });
  
  router.route('/:user/files')
  .get((request, response) => {
    // console.log('GET request made to /users/:user/files');
    
    // dbUser.findOne({username: request.params.user}).exec()
    // .then((thatDBUser) => {
    //   var fileSearchParams = thatDBUser.files.map((current) => {
    //     return current.toString();
    //   });
    //   // console.log('fileSearchParams are');
    //   // console.dir(fileSearchParams);
    //   return dbFile.where('_id').in(fileSearchParams).exec();
    // })
    // .then((dbFiles) => {
    //   console.log('Successfully found user ' + request.params.user);
    //   response.status(200).json(dbFiles);
    // })
    dbUser.findOne({username: request.params.user})
    .populate('files').exec()
    .then((thatDBUser) => {
      // console.log('Successfully found user ' + request.params.user);
      response.status(200).json(thatDBUser.files);
    })
    .catch((err) => {
      console.log('Error returning files of user ' + request.params.user, err);
      response.status(400).end();
    });
  })
  .post((request, response) => {
    // console.log('POST request made to /users/:user/files');
    let dbFileId;
    let newFile = new dbFile({
      owner: request.params.user,
      filename: request.body.filename
    });
    newFile.save()
    .then((savedDBFile) => {
      dbFileId = savedDBFile._id.toString();
      return s3Manager.saveContent(dbFileId, request.body.content);
    })
    .then((generatedS3Url) => {
      let fileUpdatePromise = dbFile.findOneAndUpdate({_id: dbFileId}, {$set: {s3Url: generatedS3Url}}, {new:true}).exec();
      let userUpdatePromise = dbUser.findOneAndUpdate({username: request.params.user}, {$push: {files: dbFileId}}, {new:true}).exec();
      return Promise.all([fileUpdatePromise, userUpdatePromise]);
    })
    .then((fileUserPromiseAllReturnData) => {
      response.status(200).json(fileUserPromiseAllReturnData);
    })
    .catch((err) => {
      console.log('Error posting file ' + request.body.filename, err);
      response.status(400).end();
    });
  });
  
  router.route('/:user/files/:file')
  .get((request, response) => {
    // console.log('GET request made to /users/:user/files/:file');
    dbUser.findOne({username: request.params.user})
    .populate('files').exec()
    .then((thatDBUser) => {
      // console.log('Successfully deleted user ' + request.params.user);
      response.status(200).json(thatDBUser.files.filter((current) => {
        return current.filename === request.params.file;
      })[0]);
    })
    // .then((thatDBUser) => {
    //   console.log('Successfully deleted user ' + request.params.user);
    //   return thatDBUser.files.filter((current) => {
    //     return current.filename === request.params.file;
    //   })[0]._id.toString();
    // }).then((dbFileId) => {
    //   return dbFile.findById(dbFileId).exec();
    // })
    // .then((foundDBFile) => {
    //   response.status(200).json(foundDBFile);
    // })
    .catch((err) => {
      console.log('Error returning files of user ' + request.params.user, err);
      response.status(400).end();
    });
    
  })
  .put((request, response) => {
    // console.log('POST request made to /:user/files/:file');
    dbUser.findOne({username: request.params.user})
    .populate('files').exec()
    .then((thatDBUser) => {
      let s3ObjectKey = thatDBUser.files.filter((current) => {
        return current.filename === request.params.file;
      })[0]._id.toString();
      return s3Manager.updateContent(s3ObjectKey, request.body.newContent);
    })
    .then((s3UpdateData) => {
      response.status(200).json(s3UpdateData);
    })
    .catch((err) => {
      console.log('Error updating files of user ' + request.params.user, err);
      response.status(400).json(err);
    });
  })
  .delete((request, response) => {
    dbUser.findOne({username: request.params.user})
    .populate('files').exec()
    .then((thatDBUser) => {
      let s3ObjectKey = thatDBUser.files.filter((current) => {
        return current.filename === request.params.file;
      })[0]._id.toString();
      return s3Manager.deleteFilesFromArray([s3ObjectKey]);
    })
    .then((s3DeleteData) => {
      response.status(200).json(s3DeleteData);
    })
    .catch((err) => {
      console.log('Error updating files of user ' + request.params.user, err);
      response.status(400).end();
    });
  });
  
  return router;
};

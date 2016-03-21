'use strict';
var AWS = require('aws-skd');
var s3 = new AWS.S3();

var s3Manager = module.exports = {};

s3Manager.deleteFilesFromArray = (keyArray) => {
  return Promise.all(keyArray.map((acc, currentKey)=> {
    return new Promise((resolve, reject) => {
      s3.deleteObject({
        Bucket: 'frazier-s3-rest-codefellows-401d2',
        Key: currentKey
      }, (err, data)=>{
        if (err || !data.DeleteMarker){
          reject(new Error('Error deleting ' + currentKey));
        } else {
          resolve(data);
        }
      });
    });
  }));
};

s3Manager.saveContent = (savedDBFile, fileContent) => {
  return new Promise((resolve, reject) => {
    s3.upload({
      Bucket: 'frazier-s3-rest-codefellows-401d2',
      Key: savedDBFile._id,
      Body: fileContent
    }, (err, data) => {
      if (err){
        reject(new Error('Failed to upload file' + err));
      } else {
        s3.getSignedUrl('getObject', {}, (err, s3Url) => {
          if (err){
            reject(new Error('Failed to generate valid retrieval url ' + err));
          } else {
            resolve(s3Url);
          }
        });
      }
    });
  });
};

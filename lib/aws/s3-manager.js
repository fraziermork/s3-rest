'use strict';
var AWS = require('aws-sdk');
var s3 = new AWS.S3();

var s3Manager = module.exports = {};

//build a function that will empty a bucket

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

s3Manager.saveContent = (newKey, fileContent) => {
  return new Promise((resolve, reject) => {
    s3.upload({
      Bucket: 'frazier-s3-rest-codefellows-401d2',
      Key: newKey,
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

s3Manager.deleteAllFromBucket = () => {
  console.log('s3Manager.deleteAllFromBucket called');
  return new Promise((resolve, reject) => {
    s3.listObjects({
      Bucket: 'frazier-s3-rest-codefellows-401d2'
    }, (err, bucketContents) => {
      console.log('bucketContents are');
      console.dir(bucketContents);
      if (err){
        reject(new Error(err));
      } else {
        new Promise(() => {
          if(!bucketContents.Contents.length){
            console.log('nothing in bucket to delete');
            return resolve();
          }
          let deleteParams = {};
          deleteParams.Bucket = 'frazier-s3-rest-codefellows-401d2';
          deleteParams.Delete = {};
          deleteParams.Delete.Objects = bucketContents.Contents.map((current) => {
            return {Key: current.Key};
          });
          s3.deleteObjects(deleteParams, (err, dataFromDelete)=>{
            if(err){
              console.log('error deleting objects in bucket');
              reject(new Error(err));
            } else {
              console.log('done deleting all objects in bucket');
              resolve(dataFromDelete);
            }
          });
        })
        .then(() => {
          resolve();
        })
        .catch((err) => {
          reject(new Error(err));
        });
      }
    });
  });
};

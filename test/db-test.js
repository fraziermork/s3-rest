'use strict';
var mockgoose = require('mockgoose');
var mongoose = require('mongoose');
var chai = require('chai');
var chaiHttp = require('chai-http');
chai.use(chaiHttp);
var expect = chai.expect;
var request = chai.request;

describe('/users', () => {
  describe('/', () => {
    describe('POST to /users', () => {
      
    });
    describe('GET to /users', () => {
      
    });
  });
  
  describe('/users/:user', () => {
    describe('GET to /users/:user', () => {
      
    });
    describe('PUT to /users/:user', () => {
      
    });
    describe('DELETE to /users/:user', () => {
      
    });
  });
  
  describe('/users/:user/files', () => {
    describe('GET to /users/:user/files', () => {
      
    });
    describe('POST to /users/:user/files', () => {
      
    });
  });
  
  describe('/users/:user/files/:file', () => {
    describe('GET to /users/:user/files/:file', () => {
      
    });
    describe('PUT to /users/:user/files/:file', () => {
      
    });
    describe('DELETE to /users/:user/files/:file', () => {
      
    });
  });
});

describe('/files', () => {
  describe('GET to /files/:file', () => {
    
  });
  describe('PUT to /files/:file', () => {
    
  });
  describe('DELETE to /files/:file', () => {
    
  });
  
});

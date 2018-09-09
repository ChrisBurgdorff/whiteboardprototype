//Node Modules
var express = require('express');
var bodyParser = require('body-parser');
var jwt = require('jsonwebtoken');
var MongoClient = require('mongodb').MongoClient;
var bcrypt = require('bcryptjs');
var joi = require('joi');
//Custom modules
var config = require('./config');
//Instantiate Modules
var app = express();
//Variables
var port = process.env.PORT || 3000;
var MongoUrl = config.MONGODB_CONNECT_URL;
//Start Server and connect to Mongo
var db;
MongoClient.connect(MongoUrl, (err, client) => {
  if (err) return console.log(err);
  db = client.db('whiteboarddb');
  app.listen(port, function() {
    console.log("App is listening on port 3000.")
  });
});
//Middleware:
app.use(bodyParser.json());
app.use(express.static(__dirname + "/public")); 
//Error Handling:
function errorHandler (err, req, res, next) {
  res.status(200).json({message: err.message});
}
//Routes:
app.get('/api', function (req, res){ //Demo route unprotected
  res.json({
    message: "API GET"
  });
});
app.post('/api/post', function (req, res){ //demo protected route
  res.json({
    message: "Post created"
  });
});
//Add a new user
app.post('/api/register', function(req, res, next){
  var schema = {
    firstName: joi.string().alphanum().min(1).max(50).required(),
    lastName: joi.string().alphanum().min(1).max(50).required(),
    email: joi.string().email().min(5).max(100).required(),
    password: joi.string().min(6).max(100).required()
  };
  joi.validate(req.body, schema, function(err, value){
    if (err) {
      return next(new Error('Please enter a valid email and a password between 6 and 100 characters'));
    }
    db.collection('users').findOne({email: req.body.email}, function(err, result) {
      if (err) {
        return next(err);
      } else if (result) {
        return next(new Error("Email already registered.  Please sign in."));
      } else {
        var newUser = {
          firstName: req.body.firstName,
          lastName: req.body.lastName,
          email: req.body.email,
          password: null
        };
        bcrypt.hash(req.body.password, 10, function getHash(err, hash) {
          if (err) {return next(err);}
          newUser.password = hash;
          db.collection('users').insertOne(newUser, function(err, result){
            if (err) {return next(err);}
            res.status(201).json(result.ops[0]);
          });
        });
      }
    });
  });
});
app.post('/api/login', function (req, res){ //demo login, use jwt stuff
  var user = { //replace, get user from DB
    id: 1,
    userName: "Chris",
    email: "wesborland"
  };
  jwt.sign({user: user}, config.JWT_SECRET, function (err, token){ //replace secret key with some generated key
    if (err) {
      res.sendStatus(403);
    } else {
      res.json({
        token
      });
    }
  });
});

app.get('/login', function (req, res){
  res.sendFile(__dirname + '/public/' +'login.html');
});

app.use(errorHandler);


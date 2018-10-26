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
var jwtSecret = config.JWT_SECRET;
//Helper Functions
function parseCookies (cookie) {
  var list = {},
      rc = cookie;
  rc && rc.split(';').forEach(function( cookie ) {
      var parts = cookie.split('=');
      list[parts[0].trim()] = decodeURI(parts.slice(1).join('='));
  });
  return list;
}

function parseCookie(fullCookie) {
  var cookieParts = parseCookies(fullCookie);
  var token = cookieParts.token;
  var email = cookieParts.email;
  var firstName = cookieParts.firstName;
  var lastName = cookieParts.lastName;
  return token;
}
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
console.log(__dirname + "/public");

app.use(express.static(__dirname + "/public"))
//Verify JWT:
function verifyToken(req, res, next) {
  console.log("In Verify Token");
  var token = "";
  if (req.headers.cookie) {
    token = parseCookie(req.headers.cookie);
  }
  console.log(token);
  if (!token || token == "")
    res.redirect('/start');
    //return res.status(403).send({ auth: false, message: 'No token provided.' });
  jwt.verify(token, jwtSecret, function(err, decoded) {
    console.log(decoded);
    if (err)
    res.redirect('/start');
    //return res.status(500).send({ auth: false, message: 'Failed to authenticate token.' });
    // if everything good, save to request for use in other routes
    req.userId = decoded.id;
    next();
  });
}
//Error Handling:
function errorHandler (err, req, res, next) {
  console.log(err.message);
  res.status = 200;
  res.json({message: err.message});
}
//Routes:
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
        return next(new Error('Trouble connecting to the database.'));
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
            // create a token
            //console.log(result);
            var token = jwt.sign({ id: result.ops[0]._id }, jwtSecret, {
              expiresIn: 86400 // expires in 24 hours
            });
            res.status(201).send({ auth: true, token: token, email: newUser.email, firstName: newUser.firstName, lastName: newUser.lastName });
            //res.status(201).json(result.ops[0]);
          });
        });
      }
    });
  });
});
//Sign in user
app.post('/api/login', function (req, res){ //demo login, use jwt stuff
  db.collection('users').findOne({email: req.body.email}, function(err, result, next) {
    if (err) {
      return next(new Error ('Trouble connecting to the database.'));
    } else if (!result) {
      return next(new Error('User not registered.'));
    } else if (result) {
      bcrypt.compare(req.body.password, result.password, function(err, resb) {
        if (err) {
          return next(err);
        } else {
          if (resb) {
            console.log("RESULT COMING MOTHERFUCKER");
            console.log(result);
            var token = jwt.sign({ id: result._id }, jwtSecret, {
              expiresIn: 86400 // expires in 24 hours
            });
            res.status(201).send({ auth: true, token: token, email: result.email, firstName: result.firstName, lastName: result.lastName });
            //USER SIGNED IN

            console.log("SIGNED IN");
          } else {
            //INCORRECT EMAIL OR PASSWORD
            return next(new Error('Incorrect password.'));
            console.log("WRONG PASSWORD FOOL");
          }
        }
      });
    }
  });
});
//Sign out user
app.get('/api/logout', function(req, res) {
  res.status(200).send({ auth: false, token: null });
});
//Edit user

//Main Page
app.get('/', verifyToken, function (req, res, next){
  res.sendFile(__dirname + '/public/' +'main.html');
});
//Login PAge
app.get('/login', function (req, res){
  res.sendFile(__dirname + '/public/' +'login.html');
  //res.sendFile('/login.html');
});
//Register Page
app.get('/register', function (req, res){
  res.sendFile(__dirname + '/public/' + 'register.html');
});
app.get('/start', function(req, res){
  res.sendFile(__dirname + '/public/' + 'start.html');
});

app.use(errorHandler);


//Node Modules
var express = require('express');
var bodyParser = require('body-parser');
var jwt = require('jsonwebtoken');
var mongodb = require('mongodb');
var MongoClient = require('mongodb').MongoClient;
var bcrypt = require('bcryptjs');
var joi = require('joi');
var nodemailer = require('nodemailer');
const uuidv4 = require('uuid/v4');
//Custom modules
var config = require('./config');
//Instantiate Modules
var app = express();
var server = require('http').Server(app);
var io = require('socket.io')(server);
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
  server.listen(port, function() {
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
//ADD a new user from invite, add to group
app.post('/api/registerfrominvite', function (req, res) {
  var schema = {
    firstName: joi.string().alphanum().min(1).max(50).required(),
    lastName: joi.string().alphanum().min(1).max(50).required(),
    email: joi.string().email().min(5).max(100).required(),
    password: joi.string().min(6).max(100).required(),
    group: joi.string(),
    uuid: joi.string(),
    groupid: joi.string()
  };
  joi.validate(req.body, schema, function(err, value){
    if (err) {
      return next(new Error('Please enter a valid email and a password between 6 and 100 characters'));
    }
    db.collection(group).findOne({_id: new mongodb.ObjectID(req.body.groupid)}, function (err, result, next){
      if (err) {
        return next(new Error ('Trouble connecting to the database.'));
      } else if (!result) {
        return next(new Error('Group not found.'));
      } else if (result) {
        if (! result.invitedEmails.includes(req.body.email.toLowerCase())) {
          return next(new Error('Please use the email where you recieved the invite.'));
        } else if (! result.inviteIds.includes(req.body.uuid)) {
          return next(new Error('Invite ID does not match.'));
        } else {
          //Everything matches, save user and update group!
          var newUser = {
            firstName: req.body.firstName,
            lastName: req.body.lastName,
            email: req.body.email,
            password: null,
            group: req.body.group
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
              db.collection('groups').updateOne({_id: new mongodb.ObjectID(req.body.groupid)},
                {$push: {
                  users: req.body.email
                }}, function (err2, result2) {
                  res.status(201).send({ auth: true, token: token, email: newUser.email, firstName: newUser.firstName, lastName: newUser.lastName });
              });
            });
          });              
        }
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
//Add a new Group
app.post('/api/group', verifyToken, function (req, res){
  db.collection('groups').findOne({name: req.body.name}, function(err, result) {
    if (err) {
      return next(new Error('Trouble connecting to the database.'));
    } else if (result) {
      return next(new Error("Group name already registered. Please try a different name."));
    } else {
      var newGroup = {
        name: req.body.name,
        admins: req.body.admins,
        users: req.body.users,
        projects: req.body.projects,
        teams: req.body.teams,
        invitedEmails: req.body.invitedEmails,
        inviteIds: req.body.inviteIds
      };
      db.collection('groups').insertOne(newGroup, function(err, result){
        if (err) {return next(err);}
        //res.status(201).send({ name: newGroup.name, admin: newGroup.admin });
        res.status(201).send(newGroup);
      });
    }
  });
});
//Get group by id
app.get('/api/group/:id', function(req, res, next){
  var id = req.params.id;
  db.collection('groups').findOne({_id: new mongodb.ObjectID(id)}, function (err, result, next){
    if (err) {
      return next(new Error ('Trouble conecting to the database.'))
    } else if (!result) {
      return next(new Error('Group not found.'));
    } else {
      console.log(result);
      res.json(result);
    }
  });
});
//Edit user
app.put('/api/usergroup/:id', verifyToken, function (req, res) {
  var id = req.params.id;
  console.log(id);
  console.log(req.body.group);
  db.collection('users').updateOne({_id: new mongodb.ObjectID(id)},
    {$set: {
        group: req.body.group}}, 
	function (err, doc) {
      res.json(doc);
    }
  );
});
//GET USER BY Email
app.get('/api/user/:email', verifyToken, function (req, res, next) {
  console.log(req.params.email);
  db.collection('users').findOne({email: req.params.email}, function(err, result, next) {
    if (err) {
      return next(new Error ('Trouble connecting to the database.'));
    } else if (!result) {
      return next(new Error('User not registered.'));
    } else if (result) {
      res.json(result);
    }
  });
});
//Send Invite Emails
app.post('/api/invite', verifyToken, function(req, res, next) {
  //START HERE with Nodemailer
  //Redirect to home page after is done
  var uid = uuidv4();
  var transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: 'whiteboardinvite@gmail.com',
      pass: 'BluePanWindow732!'
    }
  });
  //console.log(req.data);
  var invites = req.body.emails;
  var sendField = "";
  var href = "https://www.white-board.app/invite?compid=" + req.body.companyId + "&uuid=" + uid;
  for (var i = 0; i < invites.length; i++) {
    sendField = sendField + invites[i] + ", ";
  }
  sendField = sendField.substring(0, sendField.length - 2);
  console.log(sendField);
  var mailOptions = {
    from: 'Whiteboard Invite',
    to: 'whiteboardinvite@gmail.com',
    bcc: sendField,
    subject: 'Invitation to Join Whiteboard',
    text: 'You have been invited to join Whiteboard. Click here to join: ' + href,
    html: '<h3>You have been invited to join Whiteboard by ' + req.body.fromName 
      + '.</h3><p>Click the link below to sign up:</p><a href="' + href + '">Sign Up for Whiteboard</a>'
  };
  transporter.sendMail(mailOptions, function (error, info) {
    if (error) {
      console.log(error);
    } else {
      console.log ('email sent');
      //Update DB to save uid;
      //res.send({response: 'Sent'});
      db.collection('groups').updateOne({_id: new mongodb.ObjectID(req.body.companyId)},
        {$push: {
            inviteIds: uid,
            invitedEmails: {$each: invites}
          }}, 
        function (err, doc) {
          res.json(doc);
        }
      );
    }
  });
});
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
//Landing Page
app.get('/start', function(req, res){
  res.sendFile(__dirname + '/public/' + 'start.html');
});
//Invite Page
//TODO: FINISH THIS PAGE
app.get('/invite', function(req, res){
  res.sendFile(__dirname + '/public/' + 'invite.html');
});

app.use(errorHandler);

//SOCKET STUFF
io.on('connection', function(socket) {
  console.log('a user connected');
  socket.on('disconnect', function(){
    console.log('user disconnected')
  });
});

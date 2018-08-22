//Node Modules
var express = require('express');
var bodyParser = require('body-parser');
var jwt = require('jsonwebtoken');
//Instantiate Modules
var app = express();
//Variables
var port = process.env.PORT || 3000;
//Routes
/*
app.get('/', function (req, res){
  res.send("HELLO THERE!");
});  */
app.use(express.static(__dirname + "/public")); 
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
app.post('/api/login', function (req, res){ //demo login, use jwt stuff
  var user = { //replace, get user from DB
    id: 1,
    userName: "Chris",
    email: "wesborland"
  };
  jwt.sign({user: user}, 'secretkey', function (err, token){ //replace secret key with some generated key
    if (err) {
      res.sendStatus(403);
    } else {
      res.json({
        token
      });
    }
  });
});
//Start Server
app.listen(port, function() {
  console.log("App is listening on port 3000.")
});
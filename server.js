//Node Modules
var express = require('express');
var bodyParser = require('body-parser');
//Instantiate Modules
var app = express();
//Variables
var port = process.env.PORT || 3000;
//Routes
app.get('/', function (req, res){
  res.send("HELLO THERE!");
});
//Start Server
app.listen(port, function() {
  console.log("App is NOT FUCKING LISTENING BRO listening on port 3000.")
});
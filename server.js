//Node Modules
var express = require('express');
var bodyParser = require('body-parser');
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
//Start Server
app.listen(port, function() {
  console.log("App is listening on port 3000.")
});
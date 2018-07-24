/*
*Primary file for the API
*
*/

// Dependencies
var server = require('./lib/server');

// Declare the application
var app = {}

// Init function
app.init = function(){
  // Start the server
  server.init();
  
};

// Execute
app.init();

module.exports = app;

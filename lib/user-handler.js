/*
* Handler for managing the users
*
*/

// Dependencies
var _data = require('./data');
var helpers = require('./helpers')
var util = require('util');
var debug = util.debuglog('user-handler');
var verifyToken = require('./token-handler');


// Define the handlers
var handlers = {};

// Users
handlers.users = function(data,callback){
  var acceptableMethods = ['post','get','put','delete'];
  if(acceptableMethods.indexOf(data.method) > -1){
    handlers[data.method](data,callback);
  } else {
    callback(405);
  };
};

// Users POST // NOTE: This Creates a user
// NOTE: Required data: username, emailaddress, firstName lastName, password, streetAddress tosAgreement
// NOTE: Optional data: none

handlers.post = function(data,callback){
  // Check that all required fields are filled
  var userName = typeof(data.payload.userName) == 'string' && data.payload.userName.trim().length > 0 ? data.payload.userName.trim() : false;
  var emailAddress = typeof(data.payload.emailAddress) == 'string' && data.payload.emailAddress.trim().length > 0 ? data.payload.emailAddress.trim() : false;
  var firstName = typeof(data.payload.firstName) == 'string' && data.payload.firstName.trim().length > 0 ? data.payload.firstName.trim() : false;
  var lastName = typeof(data.payload.lastName) == 'string' && data.payload.lastName.trim().length > 0 ? data.payload.lastName.trim() : false;
  var streetAddress = typeof(data.payload.streetAddress) == 'string' && data.payload.streetAddress.trim().length > 0 ? data.payload.streetAddress.trim() : false;
  var password = typeof(data.payload.password) == 'string' && data.payload.password.trim().length > 0 ? data.payload.password.trim() : false;
  var tosAgreement = typeof(data.payload.tosAgreement) == 'boolean' && data.payload.tosAgreement == true ? true : false;

  // Do a debug log of all the data
  debug('userName: '+userName);
  debug('emailAddress: '+emailAddress);
  debug('firstName: '+firstName);
  debug('lastName: '+lastName);
  debug('streetAddress: '+streetAddress);
  debug('password: '+password);
  debug('tosAgreement: '+tosAgreement);

  if(userName && emailAddress && firstName && lastName && streetAddress && password && tosAgreement){
    // Make sure that the user doesn't already exist
    _data.read('users',userName,function(err,data){
      if(err){
        // Hash the password
        var hashedPassword = helpers.hash(password);
        var userID = helpers.hash(userName+helpers.createRandomString(5));
        // Create the user object
        if(hashedPassword){
          var userObject = {
            'userID' : userID,
            'userName' : userName,
            'emailAddress' : emailAddress,
            'streetAddress' : streetAddress,
            'firstName' : firstName,
            'lastName' : lastName,
            'hashedPassword' : hashedPassword,
            'tosAgreement' : true
          };

          // Store the user
          _data.create('users',userName,userObject,function(err){
            if(!err){
              callback(200);
            } else {
              console.log(err);
              callback(500,{'Error' : 'Could not create the new user'});
            };
          });
        } else {
          callback(500,{'Error' : 'Could not hash the password'});
        };
      } else {
        // User already exists
        callback(400,{'Error' : 'That userName already exists'});
      }
    });
  } else {
    callback(400,{'Error' : 'Missing requred fields'});
  };
};

// Users GET // NOTE: This returns the users data
// NOTE: Required data: username, token
// NOTE: Optional data: none

handlers.get = function(data,callback){
  // Check that the userName provided is valid
  var userName = typeof(data.queryStringObject.userName) == 'string' && data.queryStringObject.userName.trim().length > 0 ? data.queryStringObject.userName.trim() :false;

  // Provide debug logs of data
  debug('userName: '+userName);

  if(userName){
    // TODO: Make it need a token
    var token = typeof(data.headers.token) == 'string' ? data.headers.token : false;
    // Verify that the given token is valid for the phone number
    verifyToken.verifyToken(token,userName,function(tokenIsValid){
      if(tokenIsValid){
        //Lookup the user
        _data.read('users',userName,function(err,data){
          if(!err && data){
            // Remove the hashed password from the user object before returning it the requester
            delete data.hashedPassword;
            // Remove the userID from the user object before returning it to the requester
            delete data.userID
            callback(200,data);
          } else {
            callback(404);
          };
        });
      } else {
        callback(403,{'Error' : 'Missing required token in header, or token is invalid'});
      };
    });
  } else {
    callback(400,{'Error' : 'Missing required field'});
  };
};

// Users PUT // NOTE: This Edits a user
// NOTE: Required data: userName, token, (One of the optional data fields)
// NOTE: Optional data: emailaddress, firstName lastName, password, streetAddress

handlers.put = function(data,callback){
  // Check for the required fields
  var userName= typeof(data.payload.userName) == 'string' && data.payload.userName.trim().length > 0 ? data.payload.userName.trim() :false;

  // Check for the optional fields
  var emailAddress = typeof(data.payload.emailAddress) == 'string' && data.payload.emailAddress.trim().length > 0 ? data.payload.emailAddress.trim() : false;
  var streetAddress = typeof(data.payload.streetAddress) == 'string' && data.payload.streetAddress.trim().length > 0 ? data.payload.streetAddress.trim() : false;
  var firstName = typeof(data.payload.firstName) == 'string' && data.payload.firstName.trim().length > 0 ? data.payload.firstName.trim() : false;
  var lastName = typeof(data.payload.lastName) == 'string' && data.payload.lastName.trim().length > 0 ? data.payload.lastName.trim() : false;
  var password = typeof(data.payload.password) == 'string' && data.payload.password.trim().length > 0 ? data.payload.password.trim() : false;

  // Do a debug log of all the data
  debug('userName: '+userName);
  debug('emailAddress: '+emailAddress);
  debug('firstName: '+firstName);
  debug('lastName: '+lastName);
  debug('streetAddress: '+streetAddress);
  debug('password: '+password);

  // Error if the phone is invalid
  if(userName){
    //Error if nothing is sent to Update
    if(emailAddress || streetAddress || firstName || lastName || password) {
          // Lookup users
          _data.read('users',userName,function(err,userData){
            if(!err && userData) {
              //Get the token from the payload
              var token = typeof(data.headers.token) == 'string' ? data.headers.token : false;
              console.log(userName)
              // Verify that the given token is valid for the phone number
              verifyToken.verifyToken(token,userName,function(tokenIsValid){
                if(tokenIsValid){
              // Update the fields that are neccessary
              if(emailAddress){
                userData.emailAddress = emailAddress;
              }
              if(streetAddress){
                userData.streetAddress = streetAddress;
              }
              if(firstName){
                userData.firstName = firstName;
              }
              if(lastName){
                userData.lastName = lastName;
              }
              if(password){
                userData.hashedPassword = helpers.hash(password);
              }
              //Store the new updates
              _data.update('users',userName,userData,function(err){
                if (!err) {
                  callback(200);
                } else {
                  console.log(err);
                  callback(500,{'Error' : 'Could not update the user'});
                }
              });
              } else {
            callback(403,{'Error' : 'Missing required token in header, or token is invalid'});
      };
              });
            } else {
              callback(400,{'Error' : 'The specified user does not not exist'});
            };

          });
        } else {
          callback(400,{'Error' : 'Missing fields to update'});
        };
      } else {
        callback(400,{'Error' : 'Missing required field'});
      };
};


// Users DELETE // NOTE: This Deletes a user
// NOTE: Required data: userName, token
// NOTE: Optional data: none
handlers.delete = function(data,callback){
  // Check that userName is really a userName
  var userName = typeof(data.queryStringObject.userName) == 'string' && data.queryStringObject.userName.trim().length > 0 ? data.queryStringObject.userName.trim() :false;

  // Debug log the data
  debug('userName: '+userName);

  if(userName){
    //Get the token from the payload
    var token = typeof(data.headers.token) == 'string' ? data.headers.token : false;

    // Verify that the given token is valid for the phone number
    verifyToken.verifyToken(token,userName,function(tokenIsValid){
      if(tokenIsValid){
        //Lookup the user
          _data.read('users',userName,function(err,userData){
          if(!err && data){
            _data.delete('users',userName,function(err){
              if(!err){
                callback(200);
              } else {
                callback(500,{'Error' : 'Could not delete the specified user'});
              }
            });
          } else {
            callback(404, {'Error' : 'Could not find the specified user'});
          };
        });
        } else {
          callback(403,{'Error' : 'Missing required token in header, or token is invalid'});
        };
        });
      } else {
        callback(400,{'Error' : 'Missing required field'});
      };
    };

module.exports = handlers;

/*
* Handler for managing the tokens
*
*/

// Dependencies
var _data = require('./data');
var helpers = require('./helpers')
var util = require('util');
var debug = util.debuglog('token-handler');

// Define the handlers
var handlers = {};

// tokens
handlers.tokens = function(data,callback){
  var acceptableMethods = ['post','get','put','delete'];
  if(acceptableMethods.indexOf(data.method) > -1){
    handlers[data.method](data,callback);
  } else {
    callback(405);
  };
};

// Tokens POST // NOTE: This Creates a token
// NOTE: Required data: userName, password, hashed password
// NOTE: Optional data: none

handlers.post = function(data,callback){
  // Sanity Check the data
  var userName = typeof(data.payload.userName) == 'string' && data.payload.userName.trim().length > 0 ? data.payload.userName.trim() : false;
  var password = typeof(data.payload.password) == 'string' && data.payload.password.trim().length > 0 ? data.payload.password.trim() : false;

  // Provide debug logs
  debug('userName: '+userName);
  debug('password: '+password)

  if(userName && password){
    // Lookup the user who matches that userName number
    _data.read('users',userName,function(err,userData){
      if(!err && userData){
        // Hash the sent password and compare it to the one stored under the phone number
        var hashedPassword = helpers.hash(password);
        if(hashedPassword == userData.hashedPassword){
          // If valid create a new token with a random name. Set expiration date one hour in the future
          var expires = Date.now()+ 1000 * 60 *60;
          var privateID = helpers.hash(helpers.createRandomString(20));
          var publicID = helpers.hash(userData.userName+privateID);
          var tokenObject = {
            'tokenID' : publicID,
            'expires' : expires
          };
          // Store the token
          _data.create('tokens',publicID,tokenObject,function(err){
            if(!err) {
              callback(200,{"tokenKey" : privateID});
            } else {
              callback(500,{'Error' : 'Could not create the new token'});
            }
          });
        } else {
          callback(400,{'Error' : 'The password did not match the specified users stored password'});
        };
      } else {
        callback(400,{'Error' : 'Could not find the specified user!'});
      };
    });
  } else {
    callback(400,{'Error' : 'Missing required fields.(s)'});
  };
};


// Tokens POST // NOTE: This Creates a token
// NOTE: Required data: tokenID username
// NOTE: Optional data: none
handlers.get = function(data,callback){
  // Check that the id that they sent is valid
  var id = typeof(data.queryStringObject.id) == 'string' && data.queryStringObject.id.trim().length == 64 ? data.queryStringObject.id.trim() :false;
  var userName = typeof(data.queryStringObject.userName) == 'string' && data.queryStringObject.userName.trim().length > 0 ? data.queryStringObject.userName.trim() : false;

  // Debug log the Data
  debug('tokenID: '+id);
  debug('userName: '+userName);

  if(id && userName){
    var tokenName = helpers.hash(userName+id);
    //Lookup the token
    _data.read('tokens',tokenName,function(err,tokenData){
      if(!err && tokenData){
        callback(200,tokenData);
      } else {
        callback(404);
      }
    });
  } else {
    callback(400,{'Error' : 'Missing required field'});
  };
};

// Tokens POST // NOTE: This Creates a token
// NOTE: Required data: username, id
// NOTE: Optional data: none

handlers.put = function(data,callback){

  var id = typeof(data.payload.id) == 'string' && data.payload.id.trim().length == 64 ? data.payload.id.trim() :false;
  var userName = typeof(data.payload.userName) == 'string' && data.payload.userName.trim().length > 0 ? data.payload.userName.trim() :false;

  if(userName && id){
    // Lookup the token
    var tokenName = helpers.hash(userName+id)
    _data.read('tokens',tokenName,function(err,tokenData){
      if(!err && tokenData){
        // Check to make sure that token isn't already expired
        if(tokenData.expires > Date.now()){
          // Set the expiration an hour from now
          tokenData.expires = Date.now() +1000 * 60 * 60;

          // Store the new updates
          _data.update('tokens',tokenName,tokenData,function(err){
            if(!err){
              callback(200);
            } else {
              callback(500,{'Error' : 'Could not update the token expiration'});
            };
          });
        } else {
          callback(400,{'Error' : 'The token is already expired and cannot be extended'});
        };
      } else {
        callback(400,{'Error' : 'Specified token does not exist'});
      };
    });
  } else {
    callback(400,{'Error' : 'Missing required field(s) or fields are invalid'});
  };
};

// Tokens DELETE // NOTE: This Deletes a token
// NOTE: Required data: username, id
// NOTE: Optional data: none

 handlers.delete = function(data,callback){
   var id = typeof(data.payload.id) == 'string' && data.payload.id.trim().length == 64 ? data.payload.id.trim() :false;
   var userName = typeof(data.payload.userName) == 'string' && data.payload.userName.trim().length > 0 ? data.payload.userName.trim() :false;
   if(id && userName){
    //Lookup the token
      var tokenName = helpers.hash(userName+id);
      _data.read('tokens',tokenName,function(err,data){
      if(!err && data){
        _data.delete('tokens',tokenName,function(err){
          if(!err){
            callback(200);
          } else {
            callback(500,{'Error' : 'Could not delete the specified token'});
          }
        });
      } else {
        callback(404, {'Error' : 'Could not find the specified token'});
      };
    });
  } else {
    callback(400,{'Error' : 'Missing required field'});
  };
};

// Verify if a given token id is currently valid for a given user
handlers.verifyToken = function(key,userName,callback){
  //Loookup the tokens
  var id = typeof(id) == 'string' && id.trim().length > 0 ? id.trim() : false;
  var userName = typeof(userName) == 'string' && userName.trim().length > 0 ? userName.trim() : false;
  var tokenName = helpers.hash(userName+key)
  _data.read('tokens',tokenName,function(err,tokenData){
    if(!err && tokenData){
      //Check if the token is for the given user and has not expired
      if(tokenData.expires > Date.now()){
        callback(true);
      } else {
        callback(false);
      };
    } else {
      callback(false);
    };
  });
};

// TODO: Do something with this
// // Ping handler
// handlers.ping = function(data,callback){
//   callback(200);
// };
//
// // Not found handler
// handlers.notFound = function(data,callback){
//   callback(404);
// };


// Export all of the handlers
module.exports = handlers;

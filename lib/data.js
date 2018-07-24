/*
*  Library for storing and editing data
*
*/

// Dependencies
var fs = require('fs');
var path = require('path');
var helpers = require('./helpers');

// Container for the module to be exported
var lib = {};

// Define the base directory of the data folder
lib.baseDir = path.join(__dirname,'/../.data/');

// Write data to the file
lib.create = function(dir,file,data,callback){
  // Open the file for writhing
  fs.open(lib.baseDir+dir+'/'+file+'.json','wx',function(err,fileDescriptor){
    if(!err && fileDescriptor){
      // Convert data to stringify
      var stringData = JSON.stringify(data);

      // Write to file and close it
      fs.writeFile(fileDescriptor,stringData,function(err){
        if(!err){
          fs.close(fileDescriptor, function(err){
            if (!err){
              callback(false);
            } else {
              callback('Error closing the file');
            };
          });
        } else {
          callback('Error writing to new file');
        }
      });
    } else {
      callback('Could not create new file, and may already exist');
    };
  });
};

// Read data from a file
lib.read = function(dir,file,callback){
  fs.readFile(lib.baseDir+dir+'/'+file+'.json','utf8',function(err,data){
    if(!err && data){
      var parsedData = helpers.parseJsonToObject(data);
      callback(false,parsedData);
    } else {
      callback(err,data);
    };
  });
}

// Update data in an existing file
lib.update = function(dir,file,data,callback){

  // Open the file for writing
  fs.open(lib.baseDir+dir+'/'+file+'.json','r+',function(err,fileDescriptor){
    if(!err && fileDescriptor){

      // Convert Data to string
      stringData = JSON.stringify(data);
      // Truncate the contents of the file
      fs.truncate(fileDescriptor,function(err){
        if(!err){
          // Write to the file and close it
          fs.writeFile(fileDescriptor,stringData,function(err){
            if(!err){
              fs.close(fileDescriptor,function(err){
                if(!err){
                  callback(false);
                } else {
                  callback('Error closing existing file');
                };
              });
            } else {
              callback('Error writing to existing file')
            };
          });
        } else {
          callback('Error truncating file');
        }
      });
    } else {
      callback('Could not open the faile for updating, it may not exist yet');
    };
  });
};


// Delete a file`
lib.delete = function(dir,file,callback){
  // Unlink the file
  fs.unlink(lib.baseDir+dir+'/'+file+'.json',function(err){
    if(!err) {
      callback(false);
    } else {
      callback("Error deleting the file");
    };
  });
};

// List all the items in a directory
lib.list = function(dir,callback){
  fs.readdir(lib.baseDir+dir+'/',function(err,data){
    if(!err && data && data.length > 0){
      var trimmedFileNames = [];
      data.forEach(function(fileName){
        trimmedFileNames.push(fileName.replace('.json',''));
      });
      callback(false,trimmedFileNames);
    } else {
      callback(err,data);
    }
  });
};


// Export the module
module.exports = lib;

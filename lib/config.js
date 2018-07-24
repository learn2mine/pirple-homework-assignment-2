/*
*Create and export configuration variables
*
*/

// Container for all the environments
var environments = {};

// Staging (default) environments
environments.staging = {
  'httpPort' : 2525,
  'httpsPort' : 2526,
  'envName' : 'staging',
  'hashingSecret' : 'thisIsaSecret'
};

// Production environment
environments.production = {
  'httpPort' : 5000,
  'httpsPort' : 5001,
  'envName' : 'production',
  'hashingSecret' : 'thisIsAlsoASecret'
};

// Determine which environment should be exported out
var currentEnvironment = typeof(process.env.NODE_ENV) == 'string' ? process.env.NODE_ENV.toLowerCase() : '';

// Check that the current environment is one ot hte environment above, if not, default to Staging
var environmentToExport = typeof(environments[currentEnvironment]) == 'object' ? environments[currentEnvironment] : environments.staging;

// Export the Module
module.exports = environmentToExport;

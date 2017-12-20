var bcrypt = require('bcryptjs');
var jwt = require('jwt-simple');
var moment = require('moment');
var user = require('../dynamo/user');
var config = require('./config');
var AWS = require("aws-sdk");

var dynamodb = new AWS.DynamoDB();
var docClient = new AWS.DynamoDB.DocumentClient();

exports.login = function(auth, cb){
  user.getUser(auth.email, function(error, result){
    if(result.Item){
      var ok = bcrypt.compareSync(auth.password, result.Item.password);

      // CREATE token
      if(ok){
        var token = createToken(auth.email);
        cb(null,{"token":token});
      } else {
        var error = new Error("El usuario y la contraseña no coinciden.");
        cb(error);
      }
    } else {
      var error = new Error("El usuario no existe.");
      cb(error);
    }
  });
}

module.exports.createToken = function(email, days) {
  createToken(email, days);
};

function createToken(email, days){
  var days = days || 14;
  var payload = {
    sub: email,
    iat: moment().unix(),
    exp: moment().add(days, "days").unix(),
  };
  return jwt.encode(payload, config.TOKEN_SECRET);
}

module.exports.checkAuthentication = function(token, cb){
  var payload = jwt.decode(token, config.TOKEN_SECRET);

  if(payload.exp <= moment().unix()) {
    var error = new Error("El token ha expirado");
    cb(error);
  }
  // get user
  var auth = new Object();
  auth.domain = 1;
  auth.user = 2;
  cb(null, JSON.stringify(auth));
}

//var token = "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIxIiwidWlkIjoyLCJpc3MiOiJhb25Tb2x1dGlvbnMiLCJkbmFtZSI6InNpZy5hb25zb2x1dGlvbnMubmV0IiwiZXhwIjoxNTA2NDI2NzkxLCJkaWQiOjV9.acOvQL4OcQOFcm6Mk7Bs_aNIEE9xrUos6Et3Rqh5glg";
//authW(token);

function authW(token){
  var payload = jwt.decode(token, "aonsecret");
  if(payload.exp){
    console.log("EXPIRA");
  }
  console.log(payload);
}

var bcrypt = require('bcryptjs');
var jwt = require('jwt-simple');
var moment = require('moment');
var config = require('./config');
var user = require('../user');

exports.login = function(auth, cb){
  user.select(pool, auth, function(error, result){
    var user = result[0];
    if(user){
      // openId -> client_id  - password
      // CHECK password
      var ok = bcrypt.compareSync(password, user.password);

      // CREATE token
      if(ok){
        var token = new Object();
        token.token = createToken(user);
        cb(null, JSON.stringify(token));
      } else {
        var error = new Error("El usuario y la contraseña no coinciden.");
        cb(error);
      }
    } else {
      var error = new Error("El usuario no existe.");
      cb(error);
    }
  });
  if(auth.email){
    user = new Object();// get user with email
  } else if(auth.domain && auth.username){
    user = new Object();// get user
  }
}

module.exports.createToken = function(user, days) {
  var order = order || 14;
  var payload = {
    sub: user.id,
    iat: moment().unix(),
    exp: moment().add(days, "days").unix(),
  };
  return jwt.encode(payload, config.TOKEN_SECRET);
};


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

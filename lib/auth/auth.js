var bcrypt = require('bcryptjs');
var jwt = require('jwt-simple');
var moment = require('moment');
var user = require('../dynamo/user');
var config = require('./config');

exports.login = function(auth, cb){
  user.getUser(auth.email, function(error, result){
    if(result.Item){
      var ok = bcrypt.compareSync(auth.password, result.Item.password);

      // CREATE token
      if(ok){
        var token = createToken(auth.email);
        cb(null,{"session_id":token});
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
  // comprobar que el usuario existe!
  user.getUser(payload.sub, function(error, result){
    if(error) cb(error);
    var user = result.Item;
    delete user.password;
    cb(null, JSON.stringify(user));
  });
}

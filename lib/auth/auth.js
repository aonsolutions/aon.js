var bcrypt = require('bcryptjs');
var jwt = require('jwt-simple');
var moment = require('moment');
var user = require('../dynamo/user');
var config = require('./config');

exports.login = function(auth, cb){
  user.getUser(auth.email, function(error, result){
    if(result.Item){
      if(bcrypt.compareSync(auth.password, result.Item.password))
        cb(null,{"session_id":createToken(auth.email)});
      else cb(new Error("El usuario y la contraseña no coinciden."));
    } else cb(new Error("El usuario no existe."));
  });
};

module.exports.createToken = function(email, days) {
  createToken(email, days);
};

function createToken(email, days){
  days = days || 14;
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
};

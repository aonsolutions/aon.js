var bcrypt = require('bcryptjs');
var jwt = require('jwt-simple');
var moment = require('moment');
var config = require('./config');

exports.login = function(username, password, cb){
  // GET user
  var user =  new Object();//user.getUser(username);
  // si no existe -> error. El usuario no existe.
  //var error = new Error("El usuario no existe.");
  //cb(error, null);

  // CHECK password
  var ok = bcrypt.compareSync(password, user.password);

  // CREATE token
  if(ok){
    var token = new Object();
    token.token = createToken(user);
    cb(null, JSON.stringify(token));
  } else {
    var error = new Error("El usuario y la contraseña no coinciden.");
    cb(error, null);
  }
}

function createToken(user) {
  var payload = {
    sub: user.id,
    iat: moment().unix(),
    exp: moment().add(14, "days").unix(),
  };
  return jwt.encode(payload, config.TOKEN_SECRET);
};

exports.checkAuthentication = function(token, cb){
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

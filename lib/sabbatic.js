var https = require('https');
var querystring = require('querystring');

function login(user, password, cb){
  var optionspost = {
      host : 'api.sabbatic.es',
      port : 443,
      path : '/v1/login',
      method : 'POST',
      headers : {
          'Content-Type' : 'application/x-www-form-urlencoded',
      }
  };

  var data = querystring.stringify({
      'user' : user,
      'password': password
  });

  var post = https.request(optionspost, function(res){
    res.on('data', function(d) {
      cb(null, JSON.parse(d.toString('utf8')));
    });
  });

  post.write(data);
  post.end();
  post.on('error', function(e) {
    cb(e, null);
  });
}

function send(token, image, cb){
  var optionspost = {
      host : 'api.sabbatic.es',
      port : 443,
      path : '/v1/expenses/receipts',
      method : 'POST',
      headers : {
          'Content-Type' : 'application/x-www-form-urlencoded',
          'session_id': token
      }
  };

  var o = new Object();
  o.image_base64 = image;

  var data = querystring.stringify({
      'json' : JSON.stringify(o)
  });

  var post = https.request(optionspost, function(res){
    res.on('data', function(d) {
      cb(null, JSON.parse(d.toString('utf8')));
    });
  });

  post.write(data);
  post.end();
  post.on('error', function(e) {
    cb(e, null);
  });
}

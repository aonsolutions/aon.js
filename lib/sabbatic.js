var https = require('https');
var querystring = require('querystring');

// AUTHENTICATION / LOGIN

module.exports.login = function(user, password, cb){
  var optionspost = {
      host : 'api.sabbatic.es',
      port : 443,
      path : '/v2/login',
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

// RECEIPT UTILS

module.exports.createReceipt = function(token, image, company, cb){
  var options = getOptions('POST', token, '/v1/expenses/receipts');

  var o = {
    image_base64: image,
    //company_id_custom: company
  };

  var data = querystring.stringify({
      'json' : JSON.stringify(o)
  });

  var post = https.request(options, function(res){
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

module.exports.getReceipt = function(token, search, cb){
  var options = getOptions('GET', token, '/v2/expenses/receipts?json=' + JSON.stringify(search));

  var get = https.request(options, function(res){
    res.on('data', function(d) {
      cb(null, JSON.parse(d.toString('utf8')));
    });
  });

  get.end();
  get.on('error', function(e) {
    cb(e, null);
  });
}

// INVOICE UTILS

module.exports.createInvoice = function(token, image, company, cb){
  var options = getOptions('POST', token, '/v2/expenses/invoices');

  var o = {
    image_base64: image,
    //company_id_custom: company
  };

  var data = querystring.stringify({
      'json' : JSON.stringify(o)
  });

  var post = https.request(options, function(res){
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

module.exports.getInvoice = function(token, search, cb){
  var options = getOptions('GET', token, '/v2/expenses/invoices?json=' + JSON.stringify(search));

  var get = https.request(options, function(res){
    res.on('data', function(d) {
      cb(null, JSON.parse(d.toString('utf8')));
    });
  });

  get.end();
  get.on('error', function(e) {
    cb(e, null);
  });
}


// USER UTILS

module.exports.createUser = function(token, object, cb){
  /* CREATION USER OBJECT EXAMPLE
  {
    email:'xxx@xxx.xx',
    company_id:25468, //sabbatic company id.
    company_id_custom:2, //domain id.
    user_id_custom:12, //aon user id.
    name:'xxxxx',
    surname:'yyyyyyy',
    language:'es'
  }
  */

  var options = getOptions('POST', token, '/v2/users');

  var data = querystring.stringify({
      'json' : JSON.stringify(object)
  });

  var post = https.request(options, function(res){
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

module.exports.deleteUser = function(token, object, cb){
  var options = getOptions('DELETE', token, '/v2/users');

  var data = querystring.stringify({
      'json' : JSON.stringify(object)
  });

  var del = https.request(options, function(res){
    res.on('data', function(d) {
      cb(null, JSON.parse(d.toString('utf8')));
    });
  });

  del.write(data);
  del.end();
  del.on('error', function(e) {
    cb(e, null);
  });
}


module.exports.createCompany = function(token, object, cb){
  /* CREATION COMPANY OBJECT EXAMPLE
  {
    company_id_custom: "Id Central",
    name: "Empresa central",
    vat_id: "A36598523",
    postal_code: 28001,
    city: "MADRID",
    address: "Plaza Arroyo, Nº 31",
    province: "MADRID",
    country: "ESP"
  }
  */

  var optionspost = getOptions('POST', token, '/v2/companies');

  var data = querystring.stringify({
      'json' : JSON.stringify(object)
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

module.exports.deleteCompany = function(token, object, cb){
  var options = getOptions('DELETE', token, '/v2/companies');

  var data = querystring.stringify({
      'json' : JSON.stringify(object)
  });

  var del = https.request(options, function(res){
    res.on('data', function(d) {
      cb(null, JSON.parse(d.toString('utf8')));
    });
  });

  del.write(data);
  del.end();
  del.on('error', function(e) {
    cb(e, null);
  });
}

function getOptions(method, token, path){
  return {
      host : 'api.sabbatic.es',
      port : 443,
      path : path,
      method : method,
      headers : {
          'Content-Type' : 'application/x-www-form-urlencoded',
          'session_id': token
      }
  };
}

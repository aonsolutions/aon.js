var https = require('https');
var querystring = require('querystring');

/**
 * SABBATIC EXPORTS FUNCTIONS
 */

module.exports.sabbaticRegister = sabbaticRegister;
module.exports.sabbaticDropOut = sabbaticDropOut;
module.exports.login = login;
module.exports.createReceipt = createReceipt;
module.exports.getReceipt = getReceipt;
module.exports.createInvoice = createInvoice;
module.exports.getInvoice = getInvoice;
module.exports.createUser = createUser;
module.exports.deleteUser = deleteUser;
module.exports.createCompany = createCompany;
module.exports.deleteCompany = deleteCompany;

/**
 * SABBATIC FUNCTIONS
 */

// SABBATIC REGISTER - REGISTRO

function sabbaticRegister(data, cb){
	login(data.sbUser,data.sbPassword, function(error, result){
		var o = {
			company_id_custom: data.company.document,
			name: data.company.name,
			vat_id: data.company.document,
			postal_code: data.address.zip,
			city: data.address.city,
			address: data.address.address,
			province: data.addres.province,
			country: data.address.country
		};
		createCompany(result.session_id, o, function(err1, res1){
			// guardar en app_param - res1.company_id
			var o1 = {
				email: data.email,
				company_id: res1.company_id, //sabbatic company id.
				company_id_custom: res1.company_id_custom, //domain id.
				user_id_custom: 'aon#' + data.user.id, //aon user id.
				name: data.user.name, //sabbatic company id.
				language:'es'
			};
			createUser(result.session_id, o1, function(err2, res2){
				cb(null, res2);
			});
		});
	});
}

// SABBATIC DROP OUT - DARSE DE BAJA

function sabbaticDropOut(data, cb){
	login(data.sbUser,data.sbPassword, function(err, res){
		if(err) cb(err, null);
		var o = {
			company_id_custom: data.company.id,
		};
		deleteUser(res.session_id, o, function(err1, res1){
			if(err1) cb(err1, null);
			deleteCompany(res.session_id, o, function(err2, res2){
				if(err2) cb(err2, null);
			});
		});
	});
}

// AUTHENTICATION / LOGIN

function login(user, password, cb){
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

function createReceipt(token, image, company, cb){
  var options = getOptions('POST', token, '/v2/expenses/receipts');

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

function getReceipt(token, search, cb){
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

function createInvoice(token, image, company, cb){
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

function getInvoice(token, search, cb){
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

function createUser(token, object, cb){
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

function deleteUser(token, object, cb){
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

function createCompany(token, object, cb){
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

function deleteCompany(token, object, cb){
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

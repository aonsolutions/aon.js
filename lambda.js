
var mysql = require("mysql");

var domain = require('./lib/domain');

exports.handler = (event, context, callback) => {

	// allows for using callbacks as finish/error-handlers
	context.callbackWaitsForEmptyEventLoop = false;

	console.log("DB_HOST:" + process.env.DB_HOST);
	console.log("DB_USER:" + process.env.DB_USER);
	console.log("DB_PASSWD:" + process.env.DB_PASSWD);

	var pool  = mysql.createPool({
	  host     : process.env.DB_HOST,
	  user     : process.env.DB_USER,
	  password : process.env.DB_PASSWD,
	  database : process.env.DB_NAME
	});


	domain.all(pool, function(error, results, fields){
   	callback(null, {
			statusCode: '200',
			body: JSON.stringify(results),
			headers: {
					'Content-Type': 'application/json',
			},
		});
  });
};

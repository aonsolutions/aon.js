var sql = require("sql");
sql.setDialect("mysql");

var master = require("./master")(sql);
var database = require("./database");

var domain = master.domain;


module.exports.all = function(pool, cb) {
	var query = domain.select(domain.star()).from(domain).toQuery();
	database.query(pool, query.text,cb);
};

module.exports.get = function(pool, id, cb) {
	var query = domain
		.select(domain.star())
		.from(domain)
		.where(domain.id.equals(id))
		.toQuery();
	database.query(pool, query.text,cb);
};

// var mysql = require("mysql");
//
// var pool  = mysql.createPool({
//   host     : '127.0.0.1',
//   user     : 'aonsolutions',
//   password : '40ns0lut10ns',
//   database : 'test-aonsolutions-org'
// });
//
// module.exports.all(pool, function (error, results, fields){
// 	console.log(JSON.stringify(results));
// 	process.exit();
// });

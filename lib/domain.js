var sql = require("sql");
sql.setDialect("mysql");

var master = require("./master")(sql);
var database = require("./database");

var domain = master.domain;

var params = {
	id : domain.id,
	name : domain.name
}

module.exports.all = function(pool, cb) {
	var query = domain.select(domain.star()).from(domain).toQuery();
	database.query(pool, query.text,cb);
};

module.exports.get = function(pool, filter, cb) {
	var query = domain
		.select(domain.star())
		.from(domain)
		.where(filter(params))
		.toQuery();
	database.query(pool, query.text, query.values,cb);
};

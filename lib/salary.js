var sql = require("sql");
sql.setDialect("mysql");

var master = require("./master")(sql);
var database = require("./database");

var salary = master.salary;

var params = {
	id : salary.id
}


module.exports.get = function(pool, filter, cb) {
	var query = domain
		.select(domain.star())
		.from(domain)
		.where(filter(params))
		.toQuery();
	database.query(pool, query.text, query.values,cb);
};

var sql = require("sql");
sql.setDialect("mysql");

var master = require("../master")(sql);
var database = require("../database");

var user = master.user;

module.exports.select = function(pool, , cb) {
	var query = user
		.select(user.star())
		.from(user)
		.where(user.)
		.toQuery();
	database.query(pool, query.text, query.values, cb);
};

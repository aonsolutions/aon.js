var sql = require("sql");
sql.setDialect("mysql");

var master = require("./master")(sql);
var database = require("./database");

var registry = master.registry;

var params = {
	document : registry.document,
  domain : registry.domain
}

module.exports.select = function(pool, filter, cb) {
	var query = registry
		.select(registry.star())
		.from(registry)
		.where(filter(params))
		.toQuery();

	database.query(pool, query.text, query.values, cb);
};

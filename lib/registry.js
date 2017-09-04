var sql = require("sql");
sql.setDialect("mysql");

var master = require("./master")(sql);
var database = require("./database");

var registry = master.registry;

module.exports.select = function(pool, nif, domain, cb) {
	var query = registry
		.select(registry.star())
		.from(registry)
		.where(registry.document.equals(nif))
		.and(registry.domain.equals(domain))
		.toQuery();

	database.query(pool, query.text, query.values, cb);
};

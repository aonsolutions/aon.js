var sql = require("sql");
sql.setDialect("mysql");

var master = require("./master")(sql);
var database = require("./database");

var agreement = master.agreement;
var agreementExtra = master.agreementExtra;

var params = {
	id : agreement.id
}

module.exports.get = function(pool, filter, cb) {
	var query = agreement
		.select(agreement.star())
		.from(agreement)
		.where(filter(params))
		.toQuery();
	database.query(pool, query.text, query.values,cb);
};

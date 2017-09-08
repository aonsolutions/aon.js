var sql = require("sql");
sql.setDialect("mysql");

var master = require("../master")(sql);
var database = require("../database");

var invoiceTax = master.invoiceTax;

var params = {
	id : invoiceTax.id,
  domain : invoiceTax.domain
}

module.exports.select = function(pool, filter, cb, order) {
	var order = order || invoiceTax.id.asc;
	var query = invoiceTax
		.select(invoiceTax.star())
		.from(invoiceTax)
		.where(filter(params))
		.order(order)
		.toQuery();
	database.query(pool, query.text,cb);
};

module.exports.insert = function(pool, data, cb){
	var query = invoiceTax
		.insert(data)
		.toQuery();
	database.query(pool, query.text, query.values, cb);
}

module.exports.update = function(pool, data, cb){
	var query = invoiceTax
		.update(data)
		.where(invoiceTax.domain.equals(data.domain).and(invoiceTax.id.equals(data.id)))
		.toQuery();
	database.query(pool, query.text, query.values, cb);
}

module.exports.delete = function(pool, filter, cb){
	var query = invoiceTax
		.delete()
		.where(filter(params))
		.toQuery();
	database.query(pool, query.text, query.values, cb);
}

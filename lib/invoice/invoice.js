var sql = require("sql");
sql.setDialect("mysql");

var master = require("../master")(sql);
var database = require("../database");


var invoice = master.invoice;

var params = {
	id : invoice.id,
  domain : invoice.domain,
	registry : invoice.registry
}

module.exports.select = function(pool, filter, cb, order) {
	var order = order || invoice.id.asc;
	var query = invoice
		.select(invoice.star())
		.from(invoice)
		.where(filter(params))
		.order(order)
		.toQuery();
	database.query(pool, query.text, query.values, cb);
};

module.exports.insert = function(pool, data, cb){
	var query = invoice
		.insert(data)
		.toQuery();
	database.query(pool, query.text, query.values, cb);
}

module.exports.update = function(pool, data, cb){
	var query = invoice
		.update(data)
		.where(invoice.domain.equals(data.domain).and(invoice.id.equals(data.id)))
		.toQuery();
	database.query(pool, query.text, query.values, cb);
}

module.exports.delete = function(pool, id, cb){
	var query = invoice
		.delete()
		.where(invoice.id.equals(id))
		.toQuery();
	database.query(pool, query.text, query.values, cb);
}

exports.invoice = invoice;

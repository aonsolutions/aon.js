var sql = require("sql");
sql.setDialect("mysql");

var master = require("../master")(sql);
var database = require("../database");

var invoiceAddress = master.invoiceAddress;

var params = {
	id : invoiceAddress.id,
  domain : invoiceAddress.domain,
	invoice : invoiceAddress.invoice,
}

module.exports.select = function(pool, filter, cb, order) {
	var order = order || invoiceDetail.id.asc;
	var query = invoiceAddress
		.select(invoiceAddress.star())
		.from(invoiceAddress)
		.where(filter(params))
		.order(order)
		.toQuery();
	database.query(pool, query.text, query.values, cb);
};

module.exports.insert = function(pool, data, cb){
	var query = invoiceAddress
		.insert(data)
		.toQuery();
	database.query(pool, query.text, query.values, cb);
}

module.exports.update = function(pool, data, cb){
	var query = invoiceAddress
		.update(data)
		.where(invoiceAddress.domain.equals(data.domain).and(invoiceAddress.id.equals(data.id)))
		.toQuery();
	database.query(pool, query.text, query.values, cb);
}

module.exports.delete = function(pool, filter, cb){
	var query = invoiceAddress
		.delete()
		.where(filter(params))
		.toQuery();
	database.query(pool, query.text, query.values, cb);
}

exports.invoiceAddress = invoiceAddress;

var sql = require("sql");
sql.setDialect("mysql");

var master = require("../master")(sql);
var database = require("../database");

var invoice = master.invoice;
var invoiceDetail = master.invoiceDetail;

var params = {
	id : invoiceDetail.id,
  domain : invoiceDetail.domain,
	invoice : invoiceDetail.invoice,
	registry : invoice.registry
}

module.exports.select = function(pool, filter, cb, order) {
	var order = order || invoiceDetail.id.asc;
	var query = invoiceDetail
		.select(invoiceDetail.star())
		.from(invoiceDetail.join(invoice).on(invoiceDetail.invoice.equals(invoice.id)))
		.where(filter(params))
		.order(order)
		.toQuery();
	database.query(pool, query.text, query.values, cb);
};

module.exports.insert = function(pool, data, cb){
	var query = invoiceDetail
		.insert(data)
		.toQuery();
	database.query(pool, query.text, query.values, cb);
}

module.exports.update = function(pool, data, cb){
	var query = invoiceDetail
		.update(data)
		.where(invoiceDetail.domain.equals(data.domain).and(invoiceDetail.id.equals(data.id)))
		.toQuery();
	database.query(pool, query.text, query.values, cb);
}

module.exports.delete = function(pool, filter, cb){
	var query = invoiceDetail
		.delete()
		.where(filter(params))
		.toQuery();
	database.query(pool, query.text, query.values, cb);
}

exports.invoiceDetail = invoiceDetail;

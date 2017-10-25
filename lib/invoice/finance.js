var sql = require("sql");
sql.setDialect("mysql");

var master = require("../master")(sql);
var database = require("../database");

var finance = master.finance;

var params = {
	id : finance.id,
  domain : finance.domain,
	invoice : finance.invoice,
}

module.exports.select = function(pool, filter, cb, order) {
	var order = order || invoiceDetail.id.asc;
	var query = finance
		.select(finance.star())
		.from(finance)
		.where(filter(params))
		.order(order)
		.toQuery();
	database.query(pool, query.text, query.values, cb);
};

module.exports.insert = function(pool, data, cb){
	var query = finance
		.insert(data)
		.toQuery();
	database.query(pool, query.text, query.values, cb);
}

module.exports.update = function(pool, data, cb){
	var query = finance
		.update(data)
		.where(finance.domain.equals(data.domain).and(finance.id.equals(data.id)))
		.toQuery();
	database.query(pool, query.text, query.values, cb);
}

module.exports.delete = function(pool, filter, cb){
	var query = finance
		.delete()
		.where(filter(params))
		.toQuery();
	database.query(pool, query.text, query.values, cb);
}

exports.finance = finance;

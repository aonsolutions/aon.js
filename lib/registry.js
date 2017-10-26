var sql = require("sql");
sql.setDialect("mysql");

var master = require("./master")(sql);
var database = require("./database");

var registry = master.registry;
var creditor = master.creditor;
var supplier = master.supplier;
var customer = master.customer;

var params = {
	documento : registry.document,
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

module.exports.getCreditor = function(pool, filter, cb) {
	var query = registry
		.select(registry.star())
		.from(registry.join(creditor).on(registry.id.equals(creditor.registry)))
		.where(filter(params))
		.toQuery();

	database.query(pool, query.text, query.values, cb);
};

module.exports.getSupplier = function(pool, filter, cb) {
	var query = registry
		.select(registry.star())
		.from(registry.join(supplier).on(registry.id.equals(supplier.registry)))
		.where(filter(params))
		.toQuery();

	database.query(pool, query.text, query.values, cb);
};

module.exports.getCustomer = function(pool, filter, cb) {
	var query = registry
		.select(registry.star())
		.from(registry.join(customer).on(registry.id.equals(customer.registry)))
		.where(filter(params))
		.toQuery();

	database.query(pool, query.text, query.values, cb);
};

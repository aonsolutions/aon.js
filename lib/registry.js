var sql = require("sql");
sql.setDialect("mysql");

var master = require("./master")(sql);
var database = require("./database");

/**
 * MYSQL TABLES
 */

var registry = master.registry;
var creditor = master.creditor;
var supplier = master.supplier;
var customer = master.customer;
var company =  master.company;

/**
 *  FILTER
 */

var params = {
	documento : registry.document,
  domain : registry.domain
}

function filter(f){
	var filter;
	if(f.document) filter = registry.document.equals(f.document);
	if(f.domain) filter = filter ? filter.and(registry.domain.equals(f.domain)) : registry.domain.equals(f.domain);
	if(f.id) filter = filter ? filter.and(registry.id.equals(f.id)) : registry.id.equals(f.id);
	return filter;
}


/**
 * REGISTRY EXPORTS FUNCTIONS
 */

module.exports.getRegistry = getRegistry;
module.exports.insertRegistry = insertRegistry;
module.exports.updateRegistry = updateRegistry;
module.exports.deleteRegistry = deleteRegistry;

module.exports.getCompany = getCompany;
module.exports.insertCompany = insertCompany;
module.exports.updateCompany = updateCompany;
module.exports.deleteCompany = deleteCompany;

module.exports.getCreditor = getCreditor;
module.exports.insertCreditor = insertCreditor;
module.exports.updateCreditor = updateCreditor;
module.exports.deleteCreditor = deleteCreditor;

module.exports.getCustomer = getCustomer;
module.exports.insertCustomer = insertCustomer;
module.exports.updateCustomer = updateCustomer;
module.exports.deleteCustomer = deleteCustomer;

module.exports.getSupplier = getSupplier;
module.exports.insertSupplier = insertSupplier;
module.exports.updateSupplier = updateSupplier;
module.exports.deleteSupplier = deleteSupplier;

/**
 * REGISTRY
 */

function getRegistry(pool, f, cb) {
	var query = registry
		.select(registry.star())
		.from(registry)
		.where(filter(f))
		.toQuery();

	database.query(pool, query.text, query.values, jsonParse(cb));
}

function insertRegistry(pool, data, cb){
	var query = registry
		.insert(data)
		.toQuery();
	database.query(pool, query.text, query.values, insertJsonParse(pool, getRegistry, cb));
}

function updateRegistry(pool, data, cb){
	var query = registry
		.update(data)
		.where(registry.domain.equals(data.domain).and(registry.id.equals(data.id)))
		.toQuery();
	database.query(pool, query.text, query.values, updateJsonParse(pool, data.id, getRegistry, cb));
}

function deleteRegistry(pool, id, cb){
	getRegistry(pool, {id: id}, function(err, res){
		var query = registry
			.delete()
			.where(registry.id.equals(id))
			.toQuery();
		database.query(pool, query.text, query.values, deletejs);
	});
}

/**
 * COMPANY
 */

function getCompany(pool, f, cb) {
	var query = registry
		.select(registry.star())
		.from(registry.join(company).on(registry.id.equals(company.registry)))
		.where(filter(f))
		.toQuery();
	database.query(pool, query.text, query.values, jsonParse(cb));
}

function insertCompany(pool, data, cb){
	var query = company
		.insert(data)
		.toQuery();
	database.query(pool, query.text, query.values, insertJsonParse(pool, getCompany, cb));
}

function updateCompany(pool, data, cb){
	var query = company
		.update(data)
		.where(company.domain.equals(data.domain).and(company.registry.equals(data.registry)))
		.toQuery();
	database.query(pool, query.text, query.values, updateJsonParse(pool, data.registry, getCompany, cb));
}

function deleteCompany(pool, id, cb){
	getCompany(pool, {id:id}, function(err, res){
		var query = company
			.delete()
			.where(company.registry.equals(id))
			.toQuery();
		database.query(pool, query.text, query.values, deleteJsonParse(res, cb));
	});
}

/**
 * CREDITOR
 */

function getCreditor(pool, f, cb) {
	var query = registry
		.select(registry.star())
		.from(registry.join(creditor).on(registry.id.equals(creditor.registry)))
		.where(filter(f))
		.toQuery();
	database.query(pool, query.text, query.values, jsonParse(cb));
}

function insertCreditor(pool, data, cb){
	var query = creditor
		.insert(data)
		.toQuery();
	database.query(pool, query.text, query.values, insertJsonParse(pool, getCreditor, cb));
}

function updateCreditor(pool, data, cb){
	var query = creditor
		.update(data)
		.where(creditor.domain.equals(data.domain).and(creditor.registry.equals(data.registry)))
		.toQuery();
	database.query(pool, query.text, query.values, updateJsonParse(pool, data.registry, getCreditor, cb));
}

function deleteCreditor(pool, id, cb){
	getCreditor(pool, {id:id}, function(err, res){
		var query = creditor
			.delete()
			.where(creditor.registry.equals(id))
			.toQuery();
		database.query(pool, query.text, query.values, deleteJsonParse(res, cb));
	});
}

/**
 * SUPPLIER
 */

function getSupplier(pool, f, cb) {
	var query = registry
		.select(registry.star())
		.from(registry.join(supplier).on(registry.id.equals(supplier.registry)))
		.where(filter(f))
		.toQuery();
	database.query(pool, query.text, query.values, jsonParse(cb));
}

function insertSupplier(pool, data, cb){
	var query = supplier
		.insert(data)
		.toQuery();
	database.query(pool, query.text, query.values, insertJsonParse(pool, getSupplier, cb));
}

function updateSupplier(pool, data, cb){
	var query = supplier
		.update(data)
		.where(supplier.domain.equals(data.domain).and(supplier.registry.equals(data.registry)))
		.toQuery();
	database.query(pool, query.text, query.values, updateJsonParse(pool, data.registry, getSupplier, cb));
}

function deleteSupplier(pool, id, cb){
	getSupplier(pool, {id:id}, function(err, res){
		var query = supplier
			.delete()
			.where(supplier.registry.equals(id))
			.toQuery();
		database.query(pool, query.text, query.values, deleteJsonParse(res, cb));
	});
}

/**
 * CUSTOMER
 */

function getCustomer(pool, f, cb) {
	console.log(f);
	var query = registry
		.select(registry.star())
		.from(registry.join(customer).on(registry.id.equals(customer.registry)))
		.where(filter(f))
		.toQuery();
	database.query(pool, query.text, query.values, jsonParse(cb));
}

function insertCustomer(pool, data, cb){
	var query = customer
		.insert(data)
		.toQuery();
	database.query(pool, query.text, query.values, insertJsonParse(pool, getCustomer, cb));
}

function updateCustomer(pool, data, cb){
	var query = customer
		.update(data)
		.where(customer.domain.equals(data.domain).and(customer.registry.equals(data.registry)))
		.toQuery();
	database.query(pool, query.text, query.values, updateJsonParse(pool, data.registry, getCustomer, cb));
}

function deleteCustomer(pool, id, cb){
	getCustomer(pool, {id:id}, function(err, res){
		var query = customer
			.delete()
			.where(customer.registry.equals(id))
			.toQuery();
		database.query(pool, query.text, query.values, deleteJsonParse(res, cb));
	});
}

function jsonParse(cb){
	return function(err, res){
		cb(err, JSON.parse(JSON.stringify(res)));
	}
}

function insertJsonParse(pool, action, cb){
	return function(err, res){
		if(err) cb(err);
		else action(pool, {id: res.insertId}, cb);
	}
}

function updateJsonParse(pool, id, action, cb){
	return function(err, res){
		if(err) cb(err);
		else action(pool, {id: id}, cb);
	}
}

function deleteJsonParse(data, cb){
	return function(err, res){
		if(err) cb(err);
		else cb(null, data);
	}
}

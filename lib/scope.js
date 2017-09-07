var sql = require("sql");
sql.setDialect("mysql");

var master = require("./master")(sql);
var database = require("./database");

var scope = master.scope;
var domain = master.domain;

var params = {
	id : scope.id,
  domainId : scope.domain,
	description : scope.description
}

module.exports.select = function(pool, filter, cb) {
	var query = scope
		.select(scope.star())
		.from(scope)
		.where(filter(params))
		.toQuery();
	database.query(pool, query.text, query.values, cb);
};

module.exports.getDomainScope = function(pool, domainId, cb) {
	var query = scope
		.select(scope.star())
		.from(scope.join(domain).on(domain.id.equals(scope.domain).or(domain.parent.equals(scope.domain))))
		.where(domain.id.equals(domainId))
		.toQuery();
	database.query(pool, query.text, query.values, cb);
};


module.exports.insert = function(pool, data, cb){
	var query = scope
		.insert(data)
		.toQuery();
	database.query(pool, query.text, query.values, cb);
}

module.exports.update = function(pool, data, cb){
	var query = scope
		.update(data)
		.where(scope.domain.equals(data.domain).and(scope.id.equals(data.id)))
		.toQuery();
	database.query(pool, query.text, query.values, cb);
}

module.exports.delete = function(pool, filter, cb){
	var query = scope
		.delete()
		.where(filter(params))
		.toQuery();
	database.query(pool, query.text, query.values, cb);
}

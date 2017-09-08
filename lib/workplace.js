var sql = require("sql");
sql.setDialect("mysql");

var master = require("./master")(sql);
var database = require("./database");

var workplace = master.workplace;

var params = {
	id : workplace.id,
  domain : workplace.domain
}

module.exports.select = function(pool, filter, cb, order) {
	var order = order || workplace.id.asc;
	var query = workplace
		.select(workplace.star())
		.from(workplace)
		.where(filter(params))
		.order(order)
		.toQuery();
	database.query(pool, query.text, query.values, cb);
};

module.exports.insert = function(pool, data, cb){
	var query = workplace
		.insert(data)
		.toQuery();
	database.query(pool, query.text, query.values, cb);
}

module.exports.update = function(pool, data, cb){
	var query = workplace
		.update(data)
		.where(workplace.domain.equals(data.domain).and(workplace.id.equals(data.id)))
		.toQuery();
	database.query(pool, query.text, query.values, cb);
}

module.exports.delete = function(pool, filter, cb){
	var query = workplace
		.delete()
		.where(filter(params))
		.toQuery();
	database.query(pool, query.text, query.values, cb);
}

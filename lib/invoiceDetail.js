var sql = require("sql");
sql.setDialect("mysql");

var master = require("./master")(sql);
var database = require("./database");

var invoiceDetail = master.invoiceDetail;

module.exports.select = function(pool, id, cb) {
	var query = invoiceDetail
		.select(invoiceDetail.star())
		.from(invoiceDetail)
		.where(invoiceDetail.id.equals(id))
		.toQuery();
	database.query(pool, query.text,cb);
};

module.exports.insert = function(pool, data, cb){
		insert(pool, data, cb);
}

function insert(pool, data, cb){
	var query = invoiceDetail
		.insert(data)
		.toQuery();
	database.query(pool, query.text, query.values, cb);
}

module.exports.update = function(pool, data, cb){
	update(pool, data, cb);
}

function update(pool, data, cb){
	var query = invoiceDetail
		.update(data)
		.where(invoiceDetail.id.equals(data.id))
		.toQuery();
	database.query(pool, query.text, query.values, cb);
}

module.exports.delete = function(pool, id, cb){
	var query = invoiceDetail
		.delete()
		.where(invoiceDetail.id.equals(id))
		.toQuery();
	database.query(pool, query.text, query.values, cb);
}

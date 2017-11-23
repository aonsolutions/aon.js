var sql = require("sql");
sql.setDialect("mysql");

var master = require("./master")(sql);
var database = require("./database");

var product = master.product;
var item = master.item;


function productFilter(f){
	var filter;
	if(f.domain) filter = product.domain.equals(f.domain);
	if(f.id) filter = filter ? filter.and(product.id.equals(f.id)) : product.id.equals(f.id);
	return filter;
}

function itemFilter(f){
	var filter;
	if(f.domain || f.domain === 0) filter = item.domain.equals(f.domain);
	if(f.id) filter = filter ? filter.and(item.id.equals(f.id)) : item.id.equals(f.id);
	if(f.code) filter = filter ? filter.and(product.code.equals(f.code)) : product.code.equals(f.code);
	return filter;
}

// PRODUCT

module.exports.selectProduct = function(pool, f, cb) {
	var query = product
		.select(product.star())
		.from(product)
		.where(productFilter(f))
		.toQuery();

	database.query(pool, query.text, query.values, cb);
};

module.exports.insertProduct = function(pool, data, cb){
	var query = product
		.insert(data)
		.toQuery();

	database.query(pool, query.text, query.values, cb);
}

// ITEM

module.exports.selectItem = function(pool, f, cb) {
	var query = item
		.select(item.star())
		.from(item.join(product).on(item.product.equals(product.id)))
		.where(itemFilter(f))
		.toQuery();
		console.log(query);
	database.query(pool, query.text, query.values, cb);
};


module.exports.insertItem = function(pool, data, cb){
	var query = item
		.insert(data)
		.toQuery();
	database.query(pool, query.text, query.values, cb);
}

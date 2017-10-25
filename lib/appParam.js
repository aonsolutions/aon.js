var sql = require("sql");
sql.setDialect("mysql");

var master = require("./master")(sql);
var database = require("./database");

var appParam = master.appParam;

var SELECT = "select";
var INSERT = "insert";
var UPDATE = "update";

function filter(f){
	var filter;
	if(f.domain) filter = appParam.domain.equals(f.domain);
	if(f.id) filter = filter ? filter.and(appParam.id.equals(f.id)) : appParam.id.equals(f.id);
	if(f.name) filter = filter ? filter.and(appParam.name.equals(f.name)) : appParam.name.equals(f.name);
	if(f.value) filte = filter ? filter.and(appParam.value.equals(f.value)) : appParam.value.equals(f.value);
	return filter;
}

// SELECT

module.exports.getAppParam = function(pool, f, cb){
	getAppParam(pool, f, cb);
}

function getAppParam(pool, f, cb){
	var query = appParam
			.select(appParam.star(), appParam.star())
			.from(appParam)
			.where(filter(f))
			.toQuery();
	database.query(pool, query.text, query.values, cb);
}

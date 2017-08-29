var sql = require("sql");
var db	= require("./db");
var master = require("./master")(sql);

sql.setDialect('mysql');


module.exports.list = function(success) {
	//now let's make a simple query
	var query = master.domain.select(master.domain.star()).from(master.domain).toQuery();
	return db.query(query, function (error, results, fields) {
		if (error) throw error;
		success(results);
		console.log(results)
	});
	return true;
};

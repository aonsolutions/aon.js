var sql = require("sql");
var mysql = require("mysql");

sql.setDialect('mysql');

var connection = mysql.createConnection({
  host     : 'dbsnapshot.cdhc46h3yjvt.eu-west-1.rds.amazonaws.com',
  user     : 'snapshot',
  password : 'sn4psh0t',
  database : 'sig-grupo-esferalia'
});

connection.connect();

function query(query, callback){
  connection.query({
  	sql: query.text
  	},
	callback
  );
}

//connection.end();
exports.query = query;

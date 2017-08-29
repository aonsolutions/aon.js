var sql = require("sql");
var mysql = require("mysql");

sql.setDialect('mysql');

var connection = mysql.createConnection({
  host     : '127.0.0.1',
  user     : 'aonsolutions',
  password : '40ns0lut10ns',
  database : 'test-aonsolutions-org'
});

function query(query){
  connection.connect();
  connection.query({
  	sql: query.text
  	},
  	function (error, results, fields) {
  		if (error) throw error;
  		// connected!
  		console.log(results);
  	}
  );
  connection.end();
}

exports.query = query;

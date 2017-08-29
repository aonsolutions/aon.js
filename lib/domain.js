var sql		= require('sql');
var mysql	= require('mysql');
var master 	= require('./master')(sql);

sql.setDialect('mysql');



var connection = mysql.createConnection({
  host     : '127.0.0.1',
  user     : 'aonsolutions',
  password : '40ns0lut10ns',
  database : 'test-aonsolutions-org'
});
 
connection.connect();

//now let's make a simple query
var query = master.domain.select(master.domain.star()).from(master.domain).toQuery();

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

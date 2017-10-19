var fs = require('fs');
var mysql = require('mysql')

var pool  = mysql.createPool({
	supportBigNumbers : true,
	multipleStatements : true,

	host     : process.env.MYSQL_HOST || '127.0.0.1',
	user     : process.env.MYSQL_USER || 'root',
	password : process.env.MYSQL_PASSWD ,
	database : process.env.MYSQL_NAME || 'tedi',
});

exports.setupDB = function ( callback ) {
	fs.readFile('./sql/setup-db.sql', 'utf-8', (err, data) => {
		if (err) throw err;
		pool.query(data, (err, results, fields ) => {
			callback( err, pool);
		})
	});
}

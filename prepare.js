var fs = require('fs');
var cmd = require('commander')
var sqlGenerate = require('sql-generate');

cmd
	.version('0.0.0')
	.option('-h, --host [name]', 'Connect to host', '172.17.0.2')
	.option('-d, --database [name]', 'Datase to use', 'aon')
	.option('-u, --user [name]', 'User for login', 'root')
	.option('-p, --password [name]', 'Password to use when connecting to server', '')
	.option('-P, --port [#]', 'Port number to use for connection', '3306')
	.parse(process.argv)
	;


var stream = fs.createWriteStream("./lib/master.js");

sqlGenerate({
		camelize: true,
		modularize: true,
		dsn: 'mysql://'+cmd.user+':'+cmd.password+'@'+cmd.host+':'+cmd.port+'/'+cmd.database,
	},
	function(err, stats) {
		if (err){
			throw err;
		}

		stream.write(stats.buffer);
		stream.end();
		process.exit();
	}
);

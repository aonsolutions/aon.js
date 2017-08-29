var fs = require('fs');
var sqlGenerate = require('sql-generate');

var stream = fs.createWriteStream("./lib/master.js");

sqlGenerate({
		camelize: true,
		modularize: true,
		dsn: 'mysql://aonsolutions:40ns0lut10ns@127.0.0.1/test-aonsolutions-org',
	}, 
	function(err, stats) {
		if (err) {
			console.error(err);
		}
		
		stream.write(stats.buffer);
		stream.end();
		process.exit();
	}
);



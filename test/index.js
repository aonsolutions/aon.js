
var fs = require('fs');
var path = require('path');

var common = require('./common')

common.setupDB( (err, results, fields) => {
	if ( err ) throw err;
	var files = fs.readdirSync(__dirname);
//	for(var i = 0, file; file = files[i]; i++) {
//	  var filePath = path.join(__dirname, file);
//	  if (path.extname(file) === '.js') {
//	    require(filePath);
//	  }
//	}
	require('./domain');
});

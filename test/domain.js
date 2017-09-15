var tedi = require('..');

var common = require('./common')

tedi.domain.get(
	common.pool,
	function ( params ) {
		return params.id.equals(0);
	},
	function( error, results, fields ){
		console.log(results);
	}
);

var tedi = require('..');

module.exports = function ( pool, callback ) {

	tedi.domain.get(
		pool,
		function ( params ) {
			return params.id.equals(0);
		},
		function( error, results, fields ){
			console.log(results);
			callback();
		}
	);

};

var domain = require('../lib/domain')


module.exports = function ( pool, callback ) {
	domain.get(
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

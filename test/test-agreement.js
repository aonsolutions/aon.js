var tedi = require('..');

module.exports = function ( pool, callback ) {

	tedi.agreement.get(
		pool,
		function ( params ) {
			return params.id.equals(1156);
		},
		function(error, results, fields){
			console.log(results);
			callback();
		}
	);

};

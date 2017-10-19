var common = require('./common')

common.setupDB( (err, pool) => {
	if ( err ) throw err;
	require('./test-domain')(pool, () => {
		require('./test-settlement')(pool, () => {
			pool.end();
		});
	});
});

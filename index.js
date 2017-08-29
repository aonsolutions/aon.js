var domain = require('./lib/domain');

exports.handler = (event, context, callback) => {
	// TODO implement
	domain.list(function(results){
   		callback(null, JSON.stringify(results));
    	});
	callback(null, 'JSON.stringify(results)');
};

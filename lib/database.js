

module. exports.query = function(pool, sql, cb){
  pool.getConnection(function(err, connection) {
    connection.query(sql,function (error, results, fields){
			//And done with the connection.
			connection.release();
      cb(error, results, fields);
    });
  });
};

module. exports.query = function(pool, sql, values, cb){
  pool.getConnection(function(err, connection) {
    connection.query(sql, values, function (error, results, fields){
			//And done with the connection.
      connection.release();
      cb(error, results, fields);
    });
  });
};

module. exports.insert = function(pool, sql, cb){
  pool.getConnection(function(err, connection) {
    connection.query(sql,function (error, results, fields){
			//And done with the connection.
      connection.release();
      cb(error, results, fields);
    });
  });
};

module. exports.insert = function(pool, sql, values, cb){
  pool.getConnection(function(err, connection) {
    connection.query(sql, values, function (error, results, fields){
			//And done with the connection.
      connection.release();
      cb(error, results, fields);
    });
  });
};

module.exports.fixAgreements = function(pool){
	var sql = require('sql');
	var master = require('./master')(sql);
	pool.getConnection(function(err, connection) {
		connection.release();
	});
};

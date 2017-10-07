

module. exports.query = function(pool, sql, cb){
    pool.getConnection(function(err, connection) {
      connection.query(sql,function (error, results, fields){
        cb(error, results, fields);
        //And done with the connection.
        connection.release();
      });
    });
};

module. exports.query = function(pool, sql, values, cb){
    pool.getConnection(function(err, connection) {
      connection.query(sql, values, function (error, results, fields){
        cb(error, results, fields);
        //And done with the connection.
        connection.release();
      });
    });
};

module. exports.insert = function(pool, sql, cb){
    pool.getConnection(function(err, connection) {
      connection.query(sql,function (error, results, fields){
        cb(error, results, fields);
        //And done with the connection.
        connection.release();
      });
    });
};

module. exports.insert = function(pool, sql, values, cb){
    pool.getConnection(function(err, connection) {
      connection.query(sql, values, function (error, results, fields){
        cb(error, results, fields);
        //And done with the connection.
        connection.release();
      });
    });
};

module. exports.update = function(pool, sql, cb){
    pool.getConnection(function(err, connection) {
      connection.query(sql,function (error, results, fields){
        cb(error, results, fields);
        //And done with the connection.
        connection.release();
      });
    });
};

module. exports.update = function(pool, sql, values, cb){
    pool.getConnection(function(err, connection) {
      connection.query(sql, values, function (error, results, fields){
        cb(error, results, fields);
        //And done with the connection.
        connection.release();
      });
    });
};

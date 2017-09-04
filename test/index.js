var aon = require("..");
var mysql = require("mysql");

var pool  = mysql.createPool({
  host     : '127.0.0.1',
  user     : 'aonsolutions',
  password : '40ns0lut10ns',
  database : 'test-aonsolutions-org'
});

// aon.domain.get(pool,
//   function(params){ return params.id.equals(0)},
//   function(error, results, fields){ console.log(results) }
// );

aon.agreement.get(pool,
  function(params){ return params.id.equals(1156)},
  function(error, results, fields){ console.log(results) }
);

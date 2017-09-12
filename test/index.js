var aon = require("..");
var mysql = require("mysql");

var pool  = mysql.createPool({
  host     : '127.0.0.1',
  user     : 'root',
  password : 'r00t',
  database : 'test-aonsolutions-org'
});

// aon.domain.get(pool,
//   function(params){ return params.id.equals(0)},
//   function(error, results, fields){ console.log(results) }
// );

aon.agreement.get(pool,
  function(params){ return params.id.equals(1156)},
  function(pool, agreement){

    aon.agreement.set(pool,
      agreement,
      function(pool, agreement){
        process.exit();
      }
    );

    //process.stdout.write(JSON.stringify(agreement));
    //process.exit();
  }
);

// aon.agreement.set(pool,
//   agreement,
//   function(pool, agreement){
//     process.exit();
//   }
// );

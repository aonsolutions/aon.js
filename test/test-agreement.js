// var tedi = require('..');
//
// module.exports = function ( pool, callback ) {
//
// 	tedi.agreement.get(
// 		pool,
// 		function ( params ) { return params.id.equals(1156)},
// 		function( error, results, fields ){
// 			console.log(results);
// 			callback();
// 		}
// 	);
//
// };


var aon = require("..");
var mysql = require("mysql");

var pool  = mysql.createPool({
  host     : '127.0.0.1',
  user     : 'root',
  password : 'r00t',
  database : 'test-aonsolutions-org'
});

aon.agreement.get(pool,
  function(params){ return params.id.equals(1156)},
  function(pool, agreement){

    modificarAgreement(agreement);

    aon.agreement.set(pool,
      agreement,
      function(pool, agreement){
        aon.agreement.get(pool,
          function(params){ return params.id.equals(1156)},
          function(pool, agreement){
            process.stdout.write(JSON.stringify(agreement));
            process.exit();
          }
        );
      }
    );

    // process.stdout.write(JSON.stringify(agreement));
    // process.exit();
  }
);

modificarAgreement = function(agreement){
  //agreement.description = "CONVENIO MADRID";
  agreement.description = "CONVENIO COLECTIVO DE OFICINAS Y DESPACHOS PARA MADRID";
}

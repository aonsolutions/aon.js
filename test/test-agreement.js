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

    // modificarAgreement(agreement); //modifica description
    // modificarPayments(agreement); //modifica payments
    // modificarExtras(agreement); //modifica extras
    // modificarLevelCategory(agreement); //modifica levelCategory
    // modificarPeriods(agreement); //modifica Periods

    aon.agreement.set(pool,
      agreement,
      function(pool, agreement){
        //process.stdout.write(JSON.stringify(agreement));
        //process.exit();
      }
    );

    // process.stdout.write(JSON.stringify(agreement));
    // process.exit();
  }
);

modificarAgreement = function(agreement){
  agreement.description = "CONVENIO MADRID";
}

modificarPayments = function(agreement){
  var payments = agreement.payments;
  payments[0].irpfExpression = "Caracola";
}

modificarExtras = function(agreement){
  var extras = agreement.extras;
  extras[0].start_date = "6/7";
  extras[0].end_date = "1/12"
  extras[0].issue_date = "66/66"
  var agreePay = extras[1].agreePayment;
  agreePay.quoteExpression = "Caracola";
}

modificarLevelCategory = function(agreement){
  var levelsCategory = agreement.levelsCategory;
  levelsCategory[0].description = "001";
  var categories = levelsCategory[1].categories;
  categories[0].description = "PERSONAL TITULADO URJC";
}

modificarPeriods = function(agreement){
  var period = agreement.periods[0];
  var newDate = new Date(2010,05,13);
  period.start_date = newDate;
  var levels = period.levels;
  levels[0].datas.SALARIO_ANUAL = "66666";
  levels[11].datas.JORNADA_LABORAL = "66666";
  levels[11].datas.IMPORTE_KM = "0.66666";
}

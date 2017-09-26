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
    // insertarPayment(agreement); //insertar payments
    // borrarPayment(agreement); //borrar payments
    // insertarExtra(agreement); //insertar extra
    // borrarExtra(agreement); //borrar extra
    // //insertarAgreeLevelCat(agreement); //insertar Agreement Level Category
    // borrarAgreeLevelCat(agreement); //borrar Agreement Level Category
    //
    // aon.agreement.set(pool,
    //   agreement,
    //   function(pool, agreement){
    //     //process.stdout.write(JSON.stringify(agreement));
    //     //process.exit();
    //   }
    // );

    process.stdout.write(JSON.stringify(agreement));
    process.exit();
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

insertarPayment = function(agreement){
  var payments = agreement.payments;
  var newPay = {
    id: null,
    code: "SALARIO MIERDA",
    expression: "/*user*/SALARIO_ANUAL/**/ / NO_PAGAS * DIAS_TRABAJADOS / DIAS ",
    description: "[1]SALARIO MIERDA",
    type: "CRA 2",
    irpfExpression: "__W",
    quoteExpression: "__W"
  }
  payments.push(newPay);
}

borrarPayment = function(agreement){
  var payments = agreement.payments;
  payments.splice(0,1);
}

insertarExtra = function(agreement){
  var extras = agreement.extras;
  var newPay = {
    id: null,
    expression: "/*user*/SALARIO_ANUAL/**/ / NO_PAGAS * DIAS_TRABAJADOS / DIAS ",
    description: "[1]SALARIO MIERDA",
    type: "CRA 2",
    irpfExpression: "__W",
    quoteExpression: "__W"
  }
  var newExtra = {
    start_date: "01/01",
    end_date: "31/12",
    issue_date: "06/06",
    agreePayment: newPay
  }
  extras.push(newExtra);
}

borrarExtra = function(agreement){
  var extras = agreement.extras;
  extras.splice(0,1);
}

//ESTE METODO NO FUNCIONA AUN
insertarAgreeLevelCat = function(agreement){
  var levelsCat = agreement.levelsCategory;
  var newCategories = [];
  var newCat = {
    id: null,
    description: "PEON SUMISO"
  }
  var newCat2 = {
    id: null,
    description: "NERD"
  }
  newCategories.push(newCat);
  newCategories.push(newCat2);
  var newLevelCat = {
    id: null,
    description: "NIVEL 66",
    categories: newCategories
  }
  levelsCat.push(newLevelCat);
}

borrarAgreeLevelCat = function(agreement){
  var levelsCat = agreement.levelsCategory;
  levelsCat.splice(0,1);
}

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

//Comprueba si ambas fechas son iguales
var greaterThanEquals = function(date1, date2){
  if (date1 == date2) {
    return true;
  }
  else{
    return false;
  }
}

//Comprueba si la primera fecha es posterior o igual a la segunda
var greaterThanEquals = function(date1, date2){
  if (date1 == null) {
    return true;
  }
  else if(date1 >= date2){
    return true;
  }
  else{
    return false;
  }
}

//Comprueba si la primera fecha es anterior o igual a la segunda
var lessThanEquals = function(date1, date2){
  if (date1 == null) {
    return false;
  }
  else if (date2 == null) {
    return true;
  }
  else if(date1 <= date2){
    return true;
  }
  else{
    return false;
  }
}

aon.agreement.get(pool,
  function(params){ return params.id.equals(1156)},
  function(pool, agreement){

    modificarAgreement(agreement); //modifica description
    // modificarPayments(agreement); //modifica payments
    // modificarExtras(agreement); //modifica extras
    // modificarLevelCategory(agreement); //modifica levelCategory
    // modificarPeriods(agreement); //modifica Periods
    // insertarPayment(agreement); //insertar payments
    // borrarPayment(agreement); //borrar payments
    // insertarExtra(agreement); //insertar extra
    // borrarExtra(agreement); //borrar extra
    // insertarPeriodPayment(agreement); //insertar Period Payment
    // borrarPeriodPayment(agreement); //borrar Period Payment
    // insertarAgreeLevelCat(agreement); //insertar Agreement Level Category
    // borrarAgreeLevelCat(agreement); //borrar Agreement Level Category
    //
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
insertarPeriodPayment = function(agreement){
  var newData = {
    data_start_date : new Date(2010,05,13),
    data_end_date : null,
    data_level : 5901,
    data_name : "PAGAS",
    data_value : "14"
  }

  var newPeriod = {
    start_date : newData.data_start_date,
    end_date : newData.data_end_date
  }

  var datas = [];
  var periods = [];

  //CREATE ALL DATAS AND PERIOD INCLUDING NEWS
  datas.push(newData);
  periods.push(newPeriod);
  for(var i = 0; i < existing_periods.length; i++){
    var existing_periods = agreement.periods;
    var period = {
      start_date : existing_periods[i].start_date,
      end_date : existing_periods[i].end_date
    }
    periods.push(period);
    for(var j = 0; j < existing_periods[i].levels.length; j++){
      var level = existing_periods[i].levels[j];
      for(var data in level.datas){
        var new_data = {
          data_start_date : existing_periods[i].start_date,
          data_end_date : existing_periods[i].end_date,
          data_level : level.id,
          data_name : data,
          data_value : level.datas[data]
        }
      }
      datas.push(new_data);
    }
  }

  // CREATE AND ORDER PERIODS
  var newPeriods = crearNuevosPeriods(periods);

  var finalPeriods = [];

  for (var k = 0; k < newPeriods.length; k++){
    var p_start = newPeriods[k].start_date;
    var p_end = newPeriods[k].end_date;
    var finalPeriod = {
      start_date : p_start,
      end_date : p_end,
      levels : []
    }
    for(var z = 0; z < datas.length; z++){
      if (equals(datas[z].data_start_date, p_start)){
        insertLevelDatainPeriod(datas[z], finalPeriod.levels);
      }
    }
  }
  agreement.periods = finalPeriods;
}

insertLevelDatainPeriod = function(data, levels){
  if (levels.length == 0){
    var insertLevel = {
      id : data.data_level,
      datas : []
    }
    var insertData = {}
    insertData[data.data_name] = data.data_value;
    insertLevel.datas.push(insertData);
  }else{
    for(var i = 0; i < levels.length; i++){
      if(data.data_level == levels[i].id){
        var insertDataExistLvl = {}
        insertDataExistLvl[data.data_name] = data.data_value;
        levels[i].datas.push(insertDataExistLvl);
      }
    }
  }
}

crearNuevosPeriods = function(periods){
  var period=[];
  //Caso base para comprar la primera vez
  var p = {
    start_date: 0,
    end_date : 0
  }
  for ( var i = 0; i < periods.length; i++ ){
    var dateAux = new Date(periods[i].startDate);
    dateAux.setTime(dateAux.getTime() - 1 * (24*360*1000));
    p.end_date = greaterThanEquals(p.end_date,dateAux) ? dateAux : p.end_date;
    p = {
      start_date: parseDate(results[i].startDate),
      end_date : parseDate(results[i].endDate)
    }
    period[i] = p
  }
  return period;
}


borrarPeriodPayment = function(agreement){
  var levelsCat = agreement.levelsCategory;
  levelsCat.splice(0,1);
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

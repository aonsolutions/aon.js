var sql = require("sql");
sql.setDialect("mysql");

var master = require("./master")(sql);
var database = require("./database");

function _setCategories(agreement, callback){
	var replace = master.agreementLevelCategory;
	for ( var i = 0; i < agreement.levels.length; i++){
		for ( var j = 0; j < agreement.levels[i].categories.length; j++){
			replace = replace.replace(
        master.agreementLevelCategory.domain.value(agreement.domain)
	    	,master.agreementLevelCategory.agreementLevel.value(agreement.levels[i].id)
	    	,master.agreementLevelCategory.description.value(agreement.levels[i].categories[j])
	  	);
		}
	}
	callback(replace.toQuery(), function () {  } );
}

function _setLevels(agreement, callback){
	var replace = master.agreementLevel;
	for ( var i = 0; i < agreement.levels.length; i++){
			replace = replace.insert(
	    	master.agreementLevel.agreement.value(agreement.id)
        ,master.agreementLevel.domain.value(agreement.domain)
	    	,master.agreementLevel.id.value(agreement.levels[i].id)
	    	,master.agreementLevel.description.value(agreement.levels[i].description)
	  	);
	}
	callback(replace.toQuery(), function () { _setCategories( agreement, callback ) } );
}


function _setUpLevels(agreement, callback) {
		var query = master.agreementLevel.select(master.agreementLevel.id.max()).toQuery();
		callback( {
			text: 'SET @MAX_AGREEMENT_LEVEL_ID=('+ query.text +')',
			values : query.values
		},
		function () {
			for ( var i = 0; i < agreement.levels.length; i++){
				agreement.levels[i].id = master.agreementLevel.literal('(@MAX_AGREEMENT_LEVEL_ID + '+(i+1)+')');
			}
      for ( var i = 0; i < agreement.periods.length; i++){
        for ( var j = 0; j < agreement.periods.levels.length; j++){
  				agreement.periods[i].levels[j].id = master.agreementLevel.literal('(@MAX_AGREEMENT_LEVEL_ID + '+(j+1)+')');
  			}
			}
			_setLevels(agreement, callback);
		});
}

function _setExtra(agreement, callback){
	var replace = master.agreementExtra;
	for ( var i = 0; i < agreement.extras.length; i++){
			replace = replace.insert(
        master.agreementExtra.domain.value(agreement.domain)
        ,master.agreementExtra.agreement.value(agreement.id)
        ,master.agreementExtra.startDate.value(agreement.extras[i].startDate)
        ,master.agreementExtra.endDate.value(agreement.extras[i].endDate)
        ,master.agreementExtra.issueDate.value(agreement.extras[i].issueDate)
        ,master.agreementExtra.agreementPayment.value(agreement.extras[i].agreePayment.id)
      );
	}
  callback(replace.toQuery(), function () { _setUpLevels( agreement, callback ) } );
	//callback(replace.toQuery(), function () { _setUpLevels( agreement, callback ) } );
}

function _setPaymentExtra(agreement, callback){
	var replace = master.agreementPayment;
	for ( var i = 0; i < agreement.extras.length; i++){
			replace = replace.insert(
        master.agreementPayment.id.value(agreement.extras[i].agreePayment.id)
	    	,master.agreementPayment.agreement.value(agreement.id)
        ,master.agreementPayment.domain.value(agreement.domain)
        ,master.agreementPayment.type.value(agreement.extras[i].agreePayment.type)
        ,master.agreementPayment.expression.value(agreement.extras[i].agreePayment.expression)
        ,master.agreementPayment.description.value(agreement.extras[i].agreePayment.description)
        ,master.agreementPayment.startDate.value(agreement.extras[i].agreePayment.startDate)
        ,master.agreementPayment.descriptionDecorable.value(agreement.extras[i].agreePayment.descriptionDecorable)
        ,master.agreementPayment.irpfExpression.value(agreement.extras[i].agreePayment.irpfExpression)
        ,master.agreementPayment.quoteExpression.value(agreement.extras[i].agreePayment.quoteExpression)
	  	);
	}
  callback(replace.toQuery(), function () {  _setExtra(agreement, callback) } );
	//callback(replace.toQuery(), function () { _setUpLevels( agreement, callback ) } );
}


function _setUpPaymentExtra(agreement, callback) {
		var query = master.agreementPayment.select(master.agreementPayment.id.max()).toQuery();
		callback( {
			text: 'SET @MAX_AGREEMENT_PAYMENT_ENTRA_ID=('+ query.text +')',
			values : query.values
		},
		function () {
			for ( var i = 0; i < agreement.extras.length; i++){
				agreement.extras[i].agreePayment.id = master.agreementPayment.literal('(@MAX_AGREEMENT_LEVEL_ID + '+(i+1)+')');
			}
			_setPaymentExtra(agreement, callback);
		});
}

function _setPayments(agreement, callback){
	var replace = master.agreementPayment;
	for ( var i = 0; i < agreement.payments.length; i++){
			replace = replace.insert(
	    	master.agreementPayment.agreement.value(agreement.id)
        ,master.agreementPayment.domain.value(agreement.domain)
        ,master.agreementPayment.type.value(agreement.payments[i].type)
        ,master.agreementPayment.expression.value(agreement.payments[i].expression)
        ,master.agreementPayment.description.value(agreement.payments[i].description)
        ,master.agreementPayment.startDate.value(agreement.payments[i].startDate)
        ,master.agreementPayment.descriptionDecorable.value(agreement.payments[i].descriptionDecorable)
        ,master.agreementPayment.irpfExpression.value(agreement.payments[i].irpfExpression)
        ,master.agreementPayment.quoteExpression.value(agreement.payments[i].quoteExpression)
	  	);
	}
  callback(replace.toQuery(), function () {  _setUpPaymentExtra(agreement, callback) } );
	//callback(replace.toQuery(), function () { _setUpLevels( agreement, callback ) } );
}

function _setAgreement(agreement, callback){

  var replace = master.agreement.insert(
    master.agreement.id.value(agreement.id),
    master.agreement.domain.value(agreement.domain),
    master.agreement.description.value(agreement.description)
  ).toQuery();

  callback(replace, function() { _setPayments(agreement, callback) });
}

function _setUpAgreement(agreement, callback) {
		var query = master.agreement.select(master.agreement.id.max()).toQuery();
		callback( {
			text: 'SET @MAX_AGREEMENT_ID=('+ query.text +')',
			values : query.values
		},
		function () {
			agreement.id = master.agreement.literal('(@MAX_AGREEMENT_ID + 1)');
			_setAgreement(agreement, callback);
		});
}

function _setSql(agreement, callback){
  //console.log(agreement);
  _setUpAgreement(agreement, callback);
}

var mysql = require("mysql");

var connection  = mysql.createConnection({
	supportBigNumbers : true,
	multipleStatements : true,

	host     : process.env.MYSQL_HOST || '127.0.0.1',
  user     : 'root',
  password : 'r00t',
  database : 'test-aonsolutions-org'
});

_setSql({
  id:666,
  domain : 8776,
  description: 'CONVENIO DE SERGIO VALDEPEÑAS DEL POZO',
  payments: [
    {
      id : null,
      code : "SALARIO_BASE",
      expression : "/*user*/SALARIO_ANUAL/**/ / PAGAS * DIAS_TRABAJADOS / DIAS_MES ",
      description : "[1]SALARIO BASE",
      type : 0,
      startDate : new Date(0),
      descriptionDecorable : 0,
      irpfExpression : "__V",
      quoteExpression : "__V"
    },
    {
      id : null,
      code : "SALARIO_BASE_SERGIO",
      expression : "/*user*/SALARIO_ANUAL/**/ / PAGAS * DIAS_TRABAJADOS / DIAS_MES ",
      description : "[1]SALARIO BASE SERGIO",
      type : 1,
      startDate : new Date(0),
      descriptionDecorable : 0,
      irpfExpression : "__S",
      quoteExpression : "__S"
    }
  ],
  extras: [{
    startDate : "1/1",
    endDate : "12/12",
    issueDate : "27/6",
    agreePayment : {
      id : null,
      code : "SALARIO_BASE_SERGIO",
      expression : "/*user*/(SALARIO_BASE + ANTIGUEDAD) *  ( 1 + MAX(0,DIAS(INICIO_CONTRATO,INICIO_NOMINA))  / DIAS_TRABAJADOS) /6/**/",
      description : "[1]EXTRA SERGIO",
      type : 1,
      startDate : new Date(0),
      descriptionDecorable : 0,
      irpfExpression : "__W",
      quoteExpression : "__W"
    }
  }],
  levels: [
    {
      description: 'I',
			categories: ['Category I.a', 'Category I.b', 'Category I.c', 'Category I.d', 'Category I.e' ]
    },
    {
      description: 'II',
			categories: ['PEON AJEDREZ', 'NERD']
    },
    {
      description: 'III',
			categories: ['PERSONAL TITULADO DE GRADO SUPERIOR']
    }
  ],
  periods : [
    {
      startDate : new Date(2017,06,27);
      endDate : null;
      levels = [
        {
          datas : [ "SALARIO_ANUAL" = "15000.99", "JORNADA_LABORAL" = "1666"]
        },
        {
          datas : [ "SALARIO_ANUAL" = "25000.99", "JORNADA_LABORAL" = "1777"]
        },
        {
          datas : [ "SALARIO_ANUAL" = "35000.99", "JORNADA_LABORAL" = "1888"]
        }
      ]
    }
  ]
  },
  function (sql, next) {
    connection.query({
      sql: sql.text,
      values: sql.values
    },
    function(error, results, fields) {
      console.log(sql);
      if ( error )
        throw error;
      next();
    });
  }
)

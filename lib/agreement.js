var sql = require("sql");
sql.setDialect("mysql");

var master = require("./master")(sql);
var database = require("./database");

function _insertAgreeData(agreement, callback){
	if (agreement.periods){
		var insert = master.agreementData;
		for ( var i = 0; i < agreement.periods.length; i++){
			for ( var j = 0; j < agreement.periods[i].levels.length; j++){
				//If id exist == AgreementData
				if(agreement.periods[i].levels[j].id == 0){
					for(var data in agreement.periods[i].levels[j].datas){
						insert = insert.insert(
			        master.agreementData.domain.value(agreement.domain)
				    	,master.agreementData.name.value(data)
				    	,master.agreementData.agreement.value(agreement.id)
							,master.agreementData.expression.value(agreement.periods[i].levels[j].datas[data])
							,master.agreementData.startDate.value(agreement.periods[i].startDate)
							,master.agreementData.endDate.value(agreement.periods[i].endDate)
						);
					}
				}
			}
		}
		callback(insert.toQuery(), function () {  } );
	}
}

function _insertLevelData(agreement, callback){
	if (agreement.periods){
		var insert = master.agreementLevelData;
		for ( var i = 0; i < agreement.periods.length; i++){
			for ( var j = 0; j < agreement.periods[i].levels.length; j++){
				if(agreement.periods[i].levels[j].id != 0){ //If id not exist == AgreementLevelData
					for(var data in agreement.periods[i].levels[j].datas){
						insert = insert.insert(
			        master.agreementLevelData.domain.value(agreement.domain)
				    	,master.agreementLevelData.name.value(data)
				    	,master.agreementLevelData.agreementLevel.value(agreement.periods[i].levels[j].id)
							,master.agreementLevelData.expression.value(agreement.periods[i].levels[j].datas[data])
							,master.agreementLevelData.startDate.value(agreement.periods[i].startDate)
							,master.agreementLevelData.endDate.value(agreement.periods[i].endDate)
						);
					}
				}
			}
		}
		callback(insert.toQuery(), function () { _insertAgreeData( agreement, callback ) } );
	}
}

function _insertCategories(agreement, callback){
	if (agreement.levels){
		var insert = master.agreementLevelCategory;
		for ( var i = 0; i < agreement.levels.length; i++){
			for ( var j = 0; j < agreement.levels[i].categories.length; j++){
				insert = insert.insert(
	        master.agreementLevelCategory.domain.value(agreement.domain)
		    	,master.agreementLevelCategory.agreementLevel.value(agreement.levels[i].id)
		    	,master.agreementLevelCategory.description.value(agreement.levels[i].categories[j])
		  	);
			}
		}
		callback(insert.toQuery(), function () { _insertLevelData( agreement, callback ) } );
	}else{
		_insertLevelData( agreement, callback );
	}
}

function _insertLevels(agreement, callback){
	if (agreement.levels){
		for ( var i = 0; i < agreement.levels.length; i++){
			if(!agreement.levels[i].id){
				var description = agreement.levels[i].description;
				agreement.levels[i].id = master.agreementLevel.literal('(@MAX_AGREEMENT_LEVEL_ID + '+(i+1)+')');
				for ( var j = 0; j < agreement.periods.length; j++){
					for ( var k = 0; k < agreement.periods[j].levels.length; k++){
						if(agreement.periods[j].levels[k].description == description)
							agreement.periods[j].levels[k].id = master.agreementLevel.literal('(@MAX_AGREEMENT_LEVEL_ID + '+(i+1)+')');
					}
				}
			}
			var insert = master.agreementLevel.insert(
				master.agreementLevel.id.value(agreement.levels[i].id)
				,master.agreementLevel.agreement.value(agreement.id)
				,master.agreementLevel.domain.value(agreement.domain)
				,master.agreementLevel.description.value(agreement.levels[i].description)
			).onDuplicate({
				"description" : agreement.levels[i].description
			}).toQuery();
			callback(insert, function () { } );
		}
	}

	_insertCategories( agreement, callback );
}

function _setUpLevels(agreement, callback) {
		var query = master.agreementLevel.select(master.agreementLevel.id.max()).toQuery();
		callback( {
			text: 'SET @MAX_AGREEMENT_LEVEL_ID=('+ query.text +')',
			values : query.values
		},
		function () {
			_insertLevels(agreement, callback);
		});
}

function _insertExtra(agreement, callback){
	if (agreement.extras){
		var replace = master.agreementExtra;
		for ( var i = 0; i < agreement.extras.length; i++){
			replace = replace.insert(
        master.agreementExtra.domain.value(agreement.domain)
        ,master.agreementExtra.agreement.value(agreement.id)
        ,master.agreementExtra.startDate.value(agreement.extras[i].startDate)
        ,master.agreementExtra.endDate.value(agreement.extras[i].endDate)
        ,master.agreementExtra.issueDate.value(agreement.extras[i].issueDate)
        ,master.agreementExtra.agreementPayment.value(agreement.extras[i].agreePayment.id)
      ).toQuery();
		}
		callback(replace, function () { _setUpLevels( agreement, callback ) } );
	}else{
		_setUpLevels( agreement, callback );
	}
}

function _insertPaymentExtra(agreement, callback){
	if (agreement.extras){
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
	  	).toQuery();
		}
		callback(replace, function () {  _insertExtra(agreement, callback) } );
	}else{
		 _insertExtra(agreement, callback);
	}
}


function _setUpPaymentExtra(agreement, callback) {
		var query = master.agreementPayment.select(master.agreementPayment.id.max()).toQuery();
		callback( {
			text: 'SET @MAX_AGREEMENT_PAYMENT_EXTRA_ID=('+ query.text +')',
			values : query.values
		},
		function () {
			if (agreement.extras)
				for ( var i = 0; i < agreement.extras.length; i++){
					agreement.extras[i].agreePayment.id = master.agreementPayment.literal('(@MAX_AGREEMENT_PAYMENT_EXTRA_ID + '+(i+1)+')');
				}
			_insertPaymentExtra(agreement, callback);
		});
}

function _insertPayments(agreement, callback){
	if(agreement.payments){
		var replace = master.agreementPayment;
		for ( var i = 0; i < agreement.payments.length; i++){
			if(agreement.payments[i].code){
				replace = replace.insert(
		    	master.agreementPayment.agreement.value(agreement.id)
	        ,master.agreementPayment.domain.value(agreement.domain)
					,master.agreementPayment.paymentConcept.value(agreement.payments[i].__concept.id)
		  		,master.agreementPayment.startDate.value(agreement.payments[i].startDate)
	      );
			}else{
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
		}
		callback(replace.toQuery(), function () {  _setUpPaymentExtra(agreement, callback) } );
	}else{
		_setUpPaymentExtra(agreement, callback);
	}
}

function _insertPaymentsConcept(agreement, callback){
	if(agreement.payments){
		var replace = master.paymentConcept;
		for ( var i = 0; i < agreement.payments.length; i++){
			replace = replace.insert(
				master.paymentConcept.id.value(agreement.payments[i].__concept.id)
				,master.paymentConcept.domain.value(agreement.domain)
				,master.paymentConcept.code.value(agreement.payments[i].code)
        ,master.paymentConcept.type.value(agreement.payments[i].type)
        ,master.paymentConcept.expression.value(agreement.payments[i].expression)
        ,master.paymentConcept.description.value(agreement.payments[i].description)
        ,master.paymentConcept.descriptionDecorable.value(agreement.payments[i].descriptionDecorable)
        ,master.paymentConcept.irpfExpression.value(agreement.payments[i].irpfExpression)
        ,master.paymentConcept.quoteExpression.value(agreement.payments[i].quoteExpression)
	  	);
		}
		callback(replace.toQuery(), function () {  _insertPayments(agreement, callback) } );
	}else{
		_insertPayments(agreement, callback);
	}
}

function _setUpPaymentsConcept(agreement, callback) {
		var query = master.paymentConcept.select(master.paymentConcept.id.max()).toQuery();
		callback( {
			text: 'SET @MAX_PAYMENT_CONCEPT_ID=('+ query.text +')',
			values : query.values
		},
		function () {
			if(agreement.payments){
				for ( var i = 0; i < agreement.payments.length; i++){
					agreement.payments[i].__concept = {};
					agreement.payments[i].__concept.id = master.paymentConcept.literal('( @MAX_PAYMENT_CONCEPT_ID + '+(i+1)+')');
				}
			}
			_insertPaymentsConcept(agreement, callback);
		});
}

function _deleteLevelDatas(agreement, callback){
	var replace = master.agreementLevelData
			.delete()
			.from(master.agreementLevelData)
			.where(master.agreementLevelData.agreementLevel.in(
				master.agreementLevel
				.select(master.agreementLevel.id)
				.from(master.agreementLevel)
				.where(master.agreementLevel.agreement.equals(agreement.id))
			))
			.toQuery();

	callback(replace, function() { _insert_updateAgreement(agreement, callback) });
}

function _deleteDatas(agreement, callback){
	var replace = master.agreementData
			.delete()
			.from(master.agreementData)
			.where(master.agreementData.agreement.equals(agreement.id))
			.toQuery();

	callback(replace, function() { _deleteLevelDatas(agreement, callback) });
}

function _deletePaymentConcept(agreement, callback){
	var replace = master.paymentConcept
			.delete()
			.from(master.paymentConcept)
			.where(master.paymentConcept.domain.notEquals(0))
				.and(master.paymentConcept.id.in(
					master.agreementPayment
					.select(master.agreementPayment.paymentConcept)
					.from(master.agreementPayment)
					.where(master.agreementPayment.agreement.equals(agreement.id))
				)
			).toQuery();

	callback(replace, function() { _deleteDatas(agreement, callback) });
}

function _deletePayments(agreement, callback){
	var replace = master.agreementPayment
			.delete()
			.from(master.agreementPayment)
			.where(master.agreementPayment.domain.notEquals(0))
			.and(master.agreementPayment.agreement.equals(agreement.id))
			.toQuery();

	callback(replace, function() { _deletePaymentConcept(agreement, callback) });
}

function _deleteExtras(agreement, callback){
	var replace = master.agreementExtra
			.delete()
			.from(master.agreementExtra)
			.where(master.agreementExtra.agreement.equals(agreement.id))
			.toQuery();

	callback(replace, function() { _deletePayments(agreement, callback) });
}

function _insert_updateAgreement(agreement, callback){
	var insert = master.agreement.insert(
		master.agreement.id.value(agreement.id),
    master.agreement.domain.value(agreement.domain),
    master.agreement.description.value(agreement.description)
	).onDuplicate({
		"description" : agreement.description
	}).toQuery();

	callback(insert, function() { _setUpPaymentsConcept(agreement, callback) });
}

function _setUpAgreement(agreement, callback) {
		if(agreement.id == null){
			var query = master.agreement.select(master.agreement.id.max()).toQuery();
			callback( {
				text: 'SET @MAX_AGREEMENT_ID=('+ query.text +')',
				values : query.values
			},
			function () {
				agreement.id = master.agreement.literal('(@MAX_AGREEMENT_ID + 1)');
				_insert_updateAgreement(agreement, callback);
			});
		}else{
			_deleteExtras(agreement, callback);
		}
}

function _setSql(agreement, callback){
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

_setSql(
	createBasicAgreement(),
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

//**************************************************************************************
//**************************************************************************************
//********************************* TEST AGREEMENTS ************************************
//**************************************************************************************
//**************************************************************************************

function createBasicAgreement(){
	var newAgreement =
	{
	  id:null,
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
	      startDate : new Date(2017,06,27),
	      endDate : null,
	      levels : [
					{
						description : 'II',
	          datas : {"SALARIO_ANUAL" : "25000.99", "JORNADA_LABORAL" : "1777"}
	        },
	        {
						description : 'III',
	          datas : {"SALARIO_ANUAL" : "25000.99", "JORNADA_LABORAL" : "1777"}
	        },
	        {
						description : 'I',
	          datas : {"SALARIO_ANUAL" : "35000.99", "JORNADA_LABORAL" : "1888"}
	        },
					{
						id : 0,
						description : '0',
	          datas : {"SALARIO_ANUAL_NVL_0" : "30000.99", "JORNADA_LABORAL_NVL_0" : "1000"}
	        }
	      ]
	    }
	  ]
	}
	return newAgreement;
}

function updateDescriptionAgreement(){
	var newAgreement =
	{
	  id:1194,
	  domain : 8776,
	  description: 'CONVENIO DE JOSE LUIS VALDEPEÑAS',
	}
	return newAgreement;
}

function updateAgreementLevelCategoryAndLevel(){
	var newAgreement =
	{
	  id:1194,
	  domain : 8776,
	  description: 'CONVENIO DE SERGIO VALDEPEÑAS DEL POZO',
	  levels: [
	    {
				id : 6090,
	      description: 'I',
				categories: ['Category I.a', 'Category I.b', 'Category I.c', 'Category I.d', 'Category I.e' ]
	    },
			{
				id : 6091,
	      description: 'IV',
				categories: ['PEON AJEDREZ', 'NERD']
	    },
	    {
				id : 6092,
	      description: 'V',
				categories: ['COPIA PERSONAL TITULADO DE GRADO SUPERIOR']
	    }
	  ],
	  periods : [
	    {
	      startDate : new Date(2017,06,27),
	      endDate : null,
	      levels : [
					{
						id : 6091,
						description : 'IV',
	          datas : {"SALARIO_ANUAL" : "25000.99", "JORNADA_LABORAL" : "1777"}
	        },
	        {
						id : 6092,
						description : 'V',
	          datas : {"SALARIO_ANUAL" : "25000.99", "JORNADA_LABORAL" : "1777"}
	        },
	        {
						id : 6090,
						description : 'I',
	          datas : {"SALARIO_ANUAL" : "35000.99", "JORNADA_LABORAL" : "1888"}
	        },
					{
						id : 0,
						description : '0',
	          datas : {"SALARIO_ANUAL_NVL_0" : "30000.99", "JORNADA_LABORAL_NVL_0" : "1000"}
	        }
	      ]
	    }
	  ]
	}
	return newAgreement;
}

function updateBasicAgreement(){
	var newAgreement =
	{
	  id:1194,
	  domain : 8776,
	  description: 'COPIA CONVENIO DE SERGIO VALDEPEÑAS DEL POZO',
	  payments: [
	    {
	      id : 111,
	      code : "COPIA SALARIO_BASE",
	      expression : "/*user*/SALARIO_ANUAL/**/ / PAGAS * DIAS_TRABAJADOS / DIAS_MES ",
	      description : "[1]SALARIO BASE",
	      type : 0,
	      startDate : new Date(0),
	      descriptionDecorable : 0,
	      irpfExpression : "__V",
	      quoteExpression : "__V"
	    },
	    {
	      id : 112,
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
			id : 1104,
	    startDate : "1/1",
	    endDate : "12/12",
	    issueDate : "27/6",
	    agreePayment : {
	      id : 113,
	      code : "SALARIO_BASE_SERGIO",
	      expression : "/*user*/(SALARIO_BASE + ANTIGUEDAD) *  ( 1 + MAX(0,DIAS(INICIO_CONTRATO,INICIO_NOMINA))  / DIAS_TRABAJADOS) /6/**/",
	      description : "[1] COPIA EXTRA SERGIO",
	      type : 1,
	      startDate : new Date(0),
	      descriptionDecorable : 0,
	      irpfExpression : "__W",
	      quoteExpression : "__W"
	    }
	  }],
	  levels: [
	    {
				id : 6090,
	      description: 'I',
				categories: ['COPIA Category I.a', 'Category I.b', 'Category I.c', 'Category I.d', 'Category I.e' ]
	    },
			{
				id : 6091,
	      description: 'II',
				categories: ['COPIA PEON AJEDREZ', 'NERD']
	    },
	    {
				id : 6092,
	      description: 'III',
				categories: ['PERSONAL TITULADO DE GRADO SUPERIOR']
	    }
	  ],
	  periods : [
	    {
	      startDate : new Date(2017,06,27),
	      endDate : null,
	      levels : [
					{
						id : 6091,
						description : 'II',
	          datas : {"SALARIO_ANUAL" : "25000.99", "JORNADA_LABORAL" : "1777"}
	        },
	        {
						id : 6092,
						description : 'III',
	          datas : {"SALARIO_ANUAL" : "25000.99", "JORNADA_LABORAL" : "1777"}
	        },
	        {
						id : 6090,
						description : 'I',
	          datas : {"COPIA_SALARIO_ANUAL" : "35000.99", "JORNADA_LABORAL" : "1888"}
	        },
					{
						id : 0,
						description : '0',
	          datas : {"COPIA_SALARIO_ANUAL_NVL_0" : "30000.99", "JORNADA_LABORAL_NVL_0" : "1000"}
	        }
	      ]
	    }
	  ]
	}
	return newAgreement;
}

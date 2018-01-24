var sql = require("sql");
sql.setDialect("mysql");

var master = require("./master")(sql);
var database = require("./database");

// *****************************************************************************
// *****************************************************************************
// ******************************  DRAFT ***************************************
// *****************************************************************************
// *****************************************************************************

function finishUpDraft(agreement, callback) {
		callback( {
			text: 'SET FOREIGN_KEY_CHECKS=1;',
			values : []
		},
		function () { });
}

function draftAgreementRecord(agreement, callback){
	var query = agreementTable
			.update({
				id : agreementTable.id.multiply(-1)
			})
			.where(agreementTable.id.equals(agreement.id))
			.toQuery();

	callback(query, function() { finishUpDraft(agreement, callback) });

}

function draftAgreementPayrollWorkplace(agreement, callback){
	var query = payrollWorkplaceTable
			.update({
				agreement : payrollWorkplaceTable.agreement.multiply(-1)
			})
			.where(payrollWorkplaceTable.agreement.equals(agreement.id))
			.toQuery();

	callback(query, function() { draftAgreementRecord(agreement, callback) });

}

function draftLevels(agreement, callback){
	if(agreement.draft){
		var query = agreementLevelTable
				.update({
					id : agreementLevelTable.id.multiply(-1),
					agreement : agreementLevelTable.agreement.multiply(-1)
				})
				.where(agreementLevelTable.agreement.equals(agreement.id))
				.toQuery();

		callback(query, function() { draftAgreementPayrollWorkplace(agreement, callback) });
	}
}

function draftLevelDatas(agreement, callback){
	var query = agreementLevelDataTable
			.update({
				id : agreementLevelDataTable.id.multiply(-1),
				agreement_level : agreementLevelDataTable.agreementLevel.multiply(-1)
			})
			.where(agreementLevelDataTable.agreementLevel.in(
				agreementLevelTable.select(agreementLevelTable.id)
				.from(agreementLevelTable)
				.where(agreementLevelTable.agreement.equals(agreement.id))
			))
			.toQuery();

	callback(query, function() { draftLevels(agreement, callback) });
}

function draftLevelCategories(agreement, callback){
	var query = agreementLevelCategoryTable
			.update({
				id : agreementLevelCategoryTable.id.multiply(-1),
				agreement_level : agreementLevelCategoryTable.agreementLevel.multiply(-1)
			})
			.where(agreementLevelCategoryTable.agreementLevel.in(
				agreementLevelTable.select(agreementLevelTable.id)
				.from(agreementLevelTable)
				.where(agreementLevelTable.agreement.equals(agreement.id))
			))
			.toQuery();

	callback(query, function() { draftLevelDatas(agreement, callback) });
}

function draftContractLevels(agreement, callback){
	var query = contractTable
			.update({
				agreement_level_category : contractTable.agreementLevelCategory.multiply(-1)
			})
			.where(contractTable.agreementLevelCategory.in(
				agreementLevelCategoryTable.select(agreementLevelCategoryTable.id)
				.where(agreementLevelCategoryTable.agreementLevel.in(
					agreementLevelTable.select(agreementLevelTable.id)
					.from(agreementLevelTable)
					.where(agreementLevelTable.agreement.equals(agreement.id))
				)
			)))
			.toQuery();

	callback(query, function() { draftLevelCategories(agreement, callback) });
}

function draftDatas(agreement, callback){
	var query = agreementDataTable
			.update({
				id : agreementDataTable.id.multiply(-1),
				agreement : agreementDataTable.agreement.multiply(-1)
			})
			.where(agreementDataTable.agreement.equals(agreement.id))
			.toQuery();

	callback(query, function() { draftContractLevels(agreement, callback) });
}

function draftPaymentConcept(agreement, callback){
	var query = paymentConceptTable
			.update({
				id : paymentConceptTable.id.multiply(-1)
			})
			.where(paymentConceptTable.domain.notEquals(0))
			.and(paymentConceptTable.id.in(
				agreementPaymentTable
					.select(agreementPaymentTable.paymentConcept)
					.where(agreementPaymentTable.agreement.equals(agreement.id))
			))
			.toQuery();

	callback(query, function() { draftDatas(agreement, callback) });
}

function draftPayments(agreement, callback){
	var query = agreementPaymentTable
			.update({
				id : agreementPaymentTable.id.multiply(-1),
				agreement : agreementPaymentTable.agreement.multiply(-1)
				//payment_concept : agreementPaymentTable.paymentConcept.multiply(-1)
			})
			.where(agreementPaymentTable.domain.notEquals(0))
			.and(agreementPaymentTable.agreement.equals(agreement.id))
			.toQuery();

	callback(query, function() { draftPaymentConcept(agreement, callback) });
}

function draftPaymentsConceptOnPayments(agreement, callback){
	var query = agreementPaymentTable
			.update({
				"payment_concept" : agreementPaymentTable.paymentConcept.multiply(-1)
			})
			.where(agreementPaymentTable.agreement.equals(agreement.id))
			.and(
				agreementPaymentTable.paymentConcept.in(
					paymentConceptTable.select(paymentConceptTable.id)
					.where(paymentConceptTable.domain.notEquals(0))
				)
			).toQuery();

	callback(query, function() { draftPayments(agreement, callback) });
}

function draftExtras(agreement, callback){
	var query = agreementExtraTable
			.update({
				id : agreementExtraTable.id.multiply(-1),
				agreement : agreementExtraTable.agreement.multiply(-1),
				agreement_payment : agreementExtraTable.agreementPayment.multiply(-1)
			})
			.where(agreementExtraTable.agreement.equals(agreement.id))
			.toQuery();

	callback(query, function() { draftPaymentsConceptOnPayments(agreement, callback) });
}

function setUpDraft(agreement, callback) {
		callback( {
			text: 'SET FOREIGN_KEY_CHECKS=0;',
			values : []
		},
		function () {
			draftExtras(agreement, callback);
		});
}

// *****************************************************************************
// *****************************************************************************
// **************************  SET (INSERTs) ***********************************
// *****************************************************************************
// *****************************************************************************


function insertAgreeData(agreement, callback){
	//IF EXIST PERIODS
	console.log("ULTIMA FUNCION");
	if (agreement.periods){
		var insert = agreementDataTable;
		for ( var i = 0; i < agreement.periods.length; i++){
			for ( var j = 0; j < agreement.periods[i].levels.length; j++){
				var period = agreement.periods[i];
				var levelPeriod = agreement.periods[i].levels[j];
				//If id exist == AgreementData
				if(levelPeriod.id == 0){
					for(var data in levelPeriod.datas){
						insert = insert.insert(
			        agreementDataTable.domain.value(agreement.domain)
				    	,agreementDataTable.name.value(data)
				    	,agreementDataTable.agreement.value(agreement.id)
							,agreementDataTable.expression.value(levelPeriod.datas[data])
							,agreementDataTable.startDate.value(period.startDate)
							,agreementDataTable.endDate.value(period.endDate)
						);
					}
				}
			}
		}
		callback(insert.toQuery(), function () {  } );
	}
}

function insertLevelData(agreement, callback){
	console.log("insertLevelData");
	//IF EXIST PERIODS
	if (agreement.periods){
		var insert = agreementLevelDataTable;
		for ( var i = 0; i < agreement.periods.length; i++){
			for ( var j = 0; j < agreement.periods[i].levels.length; j++){
				var period = agreement.periods[i];
				var levelPeriod = agreement.periods[i].levels[j];
				//If id not exist == AgreementLevelData
				if(levelPeriod.id != 0){
					for(var data in levelPeriod.datas){
						insert = insert.insert(
			        agreementLevelDataTable.domain.value(agreement.domain)
				    	,agreementLevelDataTable.name.value(data)
				    	,agreementLevelDataTable.agreementLevel.value(levelPeriod.id)
							,agreementLevelDataTable.expression.value(levelPeriod.datas[data])
							,agreementLevelDataTable.startDate.value(period.startDate)
							,agreementLevelDataTable.endDate.value(period.endDate)
						);
					}
				}
			}
		}
		callback(insert.toQuery(), function () { insertAgreeData( agreement, callback ) } );
	}
}

function insertCategories(agreement, callback){
	console.log("insertCategories");
	//IF EXIST LEVELS
	if (agreement.levels){
		var insert = agreementLevelCategoryTable;
		for ( var i = 0; i < agreement.levels.length; i++){
			for ( var j = 0; j < agreement.levels[i].categories.length; j++){
				var level = agreement.levels[i];
				var categoryLevel = agreement.levels[i].categories[j];
				insert = insert.insert(
	        agreementLevelCategoryTable.domain.value(agreement.domain)
		    	,agreementLevelCategoryTable.agreementLevel.value(level.id)
		    	,agreementLevelCategoryTable.description.value(categoryLevel)
		  	);
			}
		}
		callback(insert.toQuery(), function () { insertLevelData( agreement, callback ) } );
	}else{
		insertLevelData( agreement, callback );
	}
}

function insertLevels(agreement, callback){
	console.log("insertLevels");
	//IF EXIST LEVELS
	if (agreement.levels){
		for ( var i = 0; i < agreement.levels.length; i++){
			var level = agreement.levels[i];
			if(!level.id){
				var description = level.description;
				level.id = agreementLevelTable.literal('(@MAX_AGREEMENT_LEVEL_ID + '+(i+1)+')');
				for ( var j = 0; j < agreement.periods.length; j++){
					for ( var k = 0; k < agreement.periods[j].levels.length; k++){
						var levelPeriod = agreement.periods[j].levels[k];
						if(levelPeriod.description == description)
							levelPeriod.id = agreementLevelTable.literal('(@MAX_AGREEMENT_LEVEL_ID + '+(i+1)+')');
					}
				}
			}
			var insert = agreementLevelTable.insert(
				agreementLevelTable.id.value(level.id)
				,agreementLevelTable.agreement.value(agreement.id)
				,agreementLevelTable.domain.value(agreement.domain)
				,agreementLevelTable.description.value(level.description)
			).onDuplicate({
				"description" : level.description
			}).toQuery();
			callback(insert, function () { } );
		}
	}

	insertCategories( agreement, callback );
}

function setUpLevels(agreement, callback) {
		console.log("setUpLevels");
		var query = agreementLevelTable.select(agreementLevelTable.id.max()).toQuery();
		callback( {
			text: 'SET @MAX_AGREEMENT_LEVEL_ID=('+ query.text +')',
			values : query.values
		},
		function () {
			insertLevels(agreement, callback);
		});
}

function insertExtra(agreement, callback){
	console.log("insertExtra");
	//IF EXIST EXTRAS
	if (agreement.extras){
		var insert = agreementExtraTable;
		for ( var i = 0; i < agreement.extras.length; i++){
			var extra = agreement.extras[i];
			insert = insert.insert(
        agreementExtraTable.domain.value(agreement.domain)
        ,agreementExtraTable.agreement.value(agreement.id)
        ,agreementExtraTable.startDate.value(extra.startDate)
        ,agreementExtraTable.endDate.value(extra.endDate)
        ,agreementExtraTable.issueDate.value(extra.issueDate)
        ,agreementExtraTable.agreementPayment.value(extra.agreePayment.id)
      );
		}
		callback(insert.toQuery(), function () { setUpLevels( agreement, callback ) } );
	}else{
		setUpLevels( agreement, callback );
	}
}

function insertPaymentExtra(agreement, callback){
	console.log("insertPaymentExtra");
	//IF EXIST EXTRAS
	if (agreement.extras){
		var insert = agreementPaymentTable;
		for ( var i = 0; i < agreement.extras.length; i++){
			var extra = agreement.extras[i];
			if(extra.agreePayment.code){
				insert = insert.insert(
		    	agreementPaymentTable.agreement.value(agreement.id)
	        ,agreementPaymentTable.domain.value(agreement.domain)
					,agreementPaymentTable.paymentConcept.value(extra.agreePayment.__payConcept.id)
		  		,agreementPaymentTable.startDate.value(extra.agreePayment.startDate)
	      );
			}else{
				insert = insert.insert(
		    	agreementPaymentTable.agreement.value(agreement.id)
	        ,agreementPaymentTable.domain.value(agreement.domain)
	        ,agreementPaymentTable.type.value(extra.agreePayment.type)
	        ,agreementPaymentTable.expression.value(extra.agreePayment.expression)
	        ,agreementPaymentTable.description.value(extra.agreePayment.description)
	        ,agreementPaymentTable.startDate.value(extra.agreePayment.startDate)
	        ,agreementPaymentTable.descriptionDecorable.value(extra.agreePayment.descriptionDecorable)
	        ,agreementPaymentTable.irpfExpression.value(extra.agreePayment.irpfExpression)
	        ,magreementPaymentTable.quoteExpression.value(extra.agreePayment.quoteExpression)
		  	);
			}
		}
		callback(insert.toQuery(), function () {  insertExtra(agreement, callback) } );
	}else{
		insertExtra(agreement, callback);
	}
}

function setUpPaymentExtra(agreement, callback) {
		console.log("setUpPaymentExtra");
		var query = agreementPaymentTable.select(agreementPaymentTable.id.max()).toQuery();
		callback( {
			text: 'SET @MAX_AGREEMENT_PAYMENT_EXTRA_ID=('+ query.text +')',
			values : query.values
		},
		function () {
			//IF EXIST EXTRAS
			if (agreement.extras)
				for ( var i = 0; i < agreement.extras.length; i++){
					var extra = agreement.extras[i];
					extra.agreePayment.id = agreementPaymentTable.literal('(@MAX_AGREEMENT_PAYMENT_EXTRA_ID + '+(i+1)+')');
				}
			insertPaymentExtra(agreement, callback);
		});
}

function insertPayments(agreement, callback){
	console.log("insertPayments");
	if(agreement.payments){
		var insert = agreementPaymentTable;
		for ( var i = 0; i < agreement.payments.length; i++){
			var payment = agreement.payments[i];
			//IF EXIST CONCEPT ASOCIATED TO THIS PAYMENT
			if(payment.code){
				insert = insert.insert(
		    	agreementPaymentTable.agreement.value(agreement.id)
	        ,agreementPaymentTable.domain.value(agreement.domain)
					,agreementPaymentTable.paymentConcept.value(payment.__payConcept.id)
		  		,agreementPaymentTable.startDate.value(payment.startDate)
	      );
			}else{
				insert = insert.insert(
		    	agreementPaymentTable.agreement.value(agreement.id)
	        ,agreementPaymentTable.domain.value(agreement.domain)
	        ,agreementPaymentTable.type.value(payment.type)
	        ,agreementPaymentTable.expression.value(payment.expression)
	        ,agreementPaymentTable.description.value(payment.description)
	        ,agreementPaymentTable.startDate.value(payment.startDate)
	        ,agreementPaymentTable.descriptionDecorable.value(payment.descriptionDecorable)
	        ,agreementPaymentTable.irpfExpression.value(payment.irpfExpression)
	        ,agreementPaymentTable.quoteExpression.value(payment.quoteExpression)
		  	);
			}
		}
		callback(insert.toQuery(), function () {  setUpPaymentExtra(agreement, callback) } );
	}else{
		setUpPaymentExtra(agreement, callback);
	}
}

function insertPaymentsConcept(agreement, callback){
	console.log("insertPaymentsConcept");

	//PARCHE
	var oldDescriptionDecorableProperty = paymentConceptTable.descriptionDecorable.property;
	var oldeIrpfExpression = paymentConceptTable.irpfExpression.property;
	var oldQuoteExpression = paymentConceptTable.quoteExpression.property;
	paymentConceptTable.descriptionDecorable.property = paymentConceptTable.descriptionDecorable.name;
	paymentConceptTable.irpfExpression.property = paymentConceptTable.irpfExpression.name;
	paymentConceptTable.quoteExpression.property = paymentConceptTable.quoteExpression.name;

	// IF EXIST PAYMENTS
	if(agreement.payments){
		for ( var i = 0; i < agreement.payments.length; i++){
			var payment = agreement.payments[i];
			var insert = paymentConceptTable.insert(
				paymentConceptTable.id.value(payment.__payConcept.id)
				,paymentConceptTable.domain.value(agreement.domain)
				,paymentConceptTable.code.value(payment.code)
        ,paymentConceptTable.type.value(payment.type)
        ,paymentConceptTable.expression.value(payment.expression)
        ,paymentConceptTable.description.value(payment.description)
        ,paymentConceptTable.descriptionDecorable.value(payment.descriptionDecorable)
        ,paymentConceptTable.irpfExpression.value(payment.irpfExpression)
        ,paymentConceptTable.quoteExpression.value(payment.quoteExpression)
	  	).onDuplicate({
				code : payment.code,
				type : payment.type,
				expression : payment.expression,
				description : payment.description,
				description_decorable : payment.descriptionDecorable,
				irpf_expression : payment.irpfExpression,
				quote_expression : payment.quoteExpression
			}).toQuery();
			callback(insert, function () { } );
		}
	}

	//IF EXIST EXTRAS
	if(agreement.extras){
		for ( var i = 0; i < agreement.extras.length; i++){
			var extra = agreement.extras[i];
			var insert = paymentConceptTable.insert(
				paymentConceptTable.id.value(extra.agreePayment.__payConcept.id)
				,paymentConceptTable.domain.value(agreement.domain)
				,paymentConceptTable.code.value(extra.agreePayment.code)
				,paymentConceptTable.type.value(extra.agreePayment.type)
				,paymentConceptTable.expression.value(extra.agreePayment.expression)
				,paymentConceptTable.description.value(extra.agreePayment.description)
				,paymentConceptTable.descriptionDecorable.value(extra.agreePayment.descriptionDecorable)
				,paymentConceptTable.irpfExpression.value(extra.agreePayment.irpfExpression)
				,paymentConceptTable.quoteExpression.value(extra.agreePayment.quoteExpression)
			).onDuplicate({
				code :extra.agreePayment.code,
				type : extra.agreePayment.type,
				expression : extra.agreePayment.expression,
				description : extra.agreePayment.description,
				description_decorable : extra.agreePayment.descriptionDecorable,
				irpf_expression : extra.agreePayment.irpfExpression,
				quote_expression : extra.agreePayment.quoteExpression
			}).toQuery();
			callback(insert, function () { } );
		}
	}

	//DEJARLO COMO ESTABA
	paymentConceptTable.descriptionDecorable.property = oldDescriptionDecorableProperty;
	paymentConceptTable.irpfExpression.property = oldeIrpfExpression;
	paymentConceptTable.quoteExpression.property = oldQuoteExpression;

	insertPayments(agreement, callback);
}

function setUpPaymentsConcept(agreement, callback) {
		console.log("setUpPaymentsConcept");
		var query = paymentConceptTable.select(paymentConceptTable.id.max()).toQuery();
		callback( {
			text: 'SET @MAX_PAYMENT_CONCEPT_ID=('+ query.text +')',
			values : query.values
		},
		function () {
			var cont = 0;
			//IF EXIST PAYMENTS
			if(agreement.payments){
				for ( var i = 0; i < agreement.payments.length; i++){
					var payment = agreement.payments[i];
					if(payment.__payConcept.id == undefined)
						payment.__payConcept.id = paymentConceptTable.literal('( @MAX_PAYMENT_CONCEPT_ID + '+(i+1)+')');
					cont++;
				}
			}
			//IF EXIST EXTRAS
			if(agreement.extras){
				for ( var j= 0; j < agreement.extras.length; j++){
					var extra = agreement.extras[j];
					if(extra.agreePayment.__payConcept.id == null)
						extra.agreePayment.__payConcept.id = paymentConceptTable.literal('( @MAX_PAYMENT_CONCEPT_ID + '+(cont+1)+')');
					cont++;
				}
			}
			insertPaymentsConcept(agreement, callback);
		});
}

// *****************************************************************************
// *****************************************************************************
// ******************************  DELETEs *************************************
// *****************************************************************************
// *****************************************************************************


function deleteAgreementRecord(agreement, callback){
	console.log("deleteAgreementRecord");
	var query = agreementTable.delete()
			.from(agreementTable)
			.where(agreementTable.id.equals(agreement.id))
			.toQuery();

	callback(query, function() { });

}

function deleteLevels(agreement, callback){
	console.log("deleteLevels");
	if(agreement.delete){
		var query = agreementLevelTable.delete()
				.from(agreementLevelTable)
				.where(agreementLevelTable.agreement.equals(agreement.id))
				.toQuery();

		callback(query, function() { deleteAgreementRecord(agreement, callback) });
	}else{
		insert_updateAgreement(agreement, callback);
	}
}

function deleteLevelDatas(agreement, callback){
	console.log("deleteLevelDatas");
	var query = agreementLevelDataTable.delete()
			.from(agreementLevelDataTable)
			.where(agreementLevelDataTable.agreementLevel.in(
				agreementLevelTable.select(agreementLevelTable.id)
				.from(agreementLevelTable)
				.where(agreementLevelTable.agreement.equals(agreement.id))
			))
			.toQuery();

	callback(query, function() { deleteLevels(agreement, callback) });
}

function deleteLevelCategories(agreement, callback){
	console.log("deleteLevelCategories");
	var query = agreementLevelCategoryTable.delete()
			.from(agreementLevelCategoryTable)
			.where(agreementLevelCategoryTable.agreementLevel.in(
				agreementLevelTable.select(agreementLevelTable.id)
				.from(agreementLevelTable)
				.where(agreementLevelTable.agreement.equals(agreement.id))
			))
			.toQuery();

	callback(query, function() { deleteLevelDatas(agreement, callback) });
}

function deleteDatas(agreement, callback){
	console.log("deleteDatas");
	var query = agreementDataTable.delete()
			.from(agreementDataTable)
			.where(agreementDataTable.agreement.equals(agreement.id))
			.toQuery();

	callback(query, function() { deleteLevelCategories(agreement, callback) });
}

function deletePaymentConcept(agreement, callback){
	console.log("deletePaymentConcept");
	for(var i=0; i<agreement.payments.length; i++){
		var payment = agreement.payments[i];
		if(payment.__payConcept.id && payment.__payConcept.id != null){
			var query = paymentConceptTable.delete()
					.from(paymentConceptTable)
					.where(paymentConceptTable.domain.notEquals(0))
					.and(paymentConceptTable.id.equals(payment.__payConcept.id))
					.toQuery();

			callback(query, function() { });
		}
	}

	for(var i=0; i<agreement.extras.length; i++){
		var extraPayment = agreement.extras[i].agreePayment;
		if(extraPayment.__payConcept.id && extraPayment.__payConcept.id != null){
			var query = paymentConceptTable.delete()
					.from(paymentConceptTable)
					.where(paymentConceptTable.domain.notEquals(0))
					.and(paymentConceptTable.id.equals(extraPayment.__payConcept.id))
					.toQuery();

			callback(query, function() { });
		}
	}

	deleteDatas(agreement, callback);
}

function deletePayments(agreement, callback){
	console.log("deletePayments");
	var query = agreementPaymentTable.delete()
			.from(agreementPaymentTable)
			.where(agreementPaymentTable.domain.notEquals(0))
			.and(agreementPaymentTable.agreement.equals(agreement.id))
			.toQuery();

	callback(query, function() { deletePaymentConcept(agreement, callback) });
}

function deleteExtras(agreement, callback){
	console.log("deleteExtras");
	var query = agreementExtraTable.delete()
			.from(agreementExtraTable)
			.where(agreementExtraTable.agreement.equals(agreement.id))
			.toQuery();

	callback(query, function() { deletePayments(agreement, callback) });
}

// *****************************************************************************
// *****************************************************************************
// *******************************  MAIN ***************************************
// *****************************************************************************
// *****************************************************************************


function insert_updateAgreement(agreement, callback){
	console.log("insert_updateAgreement");
	var insert = agreementTable.insert(
		agreementTable.id.value(agreement.id),
    agreementTable.domain.value(agreement.domain),
    agreementTable.description.value(agreement.description)
	).onDuplicate({
		"description" : agreement.description
	}).toQuery();

	callback(insert, function() { setUpPaymentsConcept(agreement, callback) });
}

function setUpAgreement(agreement, callback) {
		//console.log(agreement);
		if(agreement.id == undefined){
			console.log("AgreementID = "+ agreement.id + " -> INSERT EXTRAS");
			var query = agreementTable.select(agreementTable.id.max()).toQuery();
			callback( {
				text: 'SET @MAX_AGREEMENT_ID=('+ query.text +')',
				values : query.values
			},
			function () {
				agreement.id = agreementTable.literal('(@MAX_AGREEMENT_ID + 1)');
				insert_updateAgreement(agreement, callback);
			});
		}else{
			console.log("AgreementID = "+ agreement.id + " -> DELETE EXTRAS");
			deleteExtras(agreement, callback);
		}
}

// module.exports.setAgreement = function(agreement, callback){
// 	console.log("HEMOS LLEGADO HASTA AQUI");
// 	setUpAgreement(agreement, callback);
// }

function setAgreement(agreement, callback){
	setUpAgreement(agreement, callback);
}

function deleteAgreement(agreement, callback){
	deleteExtras(agreement, callback);
}

module.exports.draftAgreement = function(agreement, callback){
	setUpDraft(agreement, callback);
}

// function draftAgreement(agreement, callback){
// 	setUpDraft(agreement, callback);
// }

function unDraftAgreement(agreement, callback){
	setUpDraft(agreement, callback);
}

function deleteDraftAgreement(agreement, callback){
	deleteExtras(agreement, callback);
}

var mysql = require("mysql");

var connection  = mysql.createConnection({
	supportBigNumbers : true,
	multipleStatements : true,

	host     : process.env.MYSQL_HOST || '127.0.0.1',
  user     : 'root',
  password : 'r00t',
	//database : 'pro-aonsolutions-net'
  database : 'test-aonsolutions-org'
});

var agreementTable = master.agreement;
var agreementExtraTable = master.agreementExtra;
var agreementPaymentTable = master.agreementPayment;
var paymentConceptTable = master.paymentConcept;
var agreementDataTable = master.agreementData;
var agreementLevelTable = master.agreementLevel;
var agreementLevelCategoryTable = master.agreementLevelCategory;
var agreementLevelDataTable = master.agreementLevelData;
var contractTable = master.contract;
var payrollWorkplaceTable = master.payrollWorkplace;

module.exports.saveAgreement = function(json){
	console.log(connection);
	setAgreement(
		JSON.parse(json),
	  function (sql, next) {
	    connection.query({
	      sql: sql.text,
	      values: sql.values
	    },
	    function(error, results, fields) {
	      console.log(sql);
	      if ( error ){
					console.log(error);
					throw error;
				}
	      next();
	    });
	  }
	)
}

// setAgreement(
// 	createBasicAgreement(),
//   function (sql, next) {
//     connection.query({
//       sql: sql.text,
//       values: sql.values
//     },
//     function(error, results, fields) {
//       console.log(sql);
//       if ( error )
//         throw error;
//       next();
//     });
//   }
// )

// deleteAgreement(
// 	deleteAgreementTest(),
//   function (sql, next) {
//     connection.query({
//       sql: sql.text,
//       values: sql.values
//     },
//     function(error, results, fields) {
//       console.log(sql);
//       if ( error )
//         throw error;
//       next();
//     });
//   }
// )

// draftAgreement(
// 	draftAgreementTest(),
//   function (sql, next) {
//     connection.query({
//       sql: sql.text,
//       values: sql.values
//     },
//     function(error, results, fields) {
//       console.log(sql);
//       if ( error )
//         throw error;
//       next();
//     });
//   }
// )

// unDraftAgreement(
// 	unDraftAgreementTest(),
//   function (sql, next) {
//     connection.query({
//       sql: sql.text,
//       values: sql.values
//     },
//     function(error, results, fields) {
//       console.log(sql);
//       if ( error )
//         throw error;
//       next();
//     });
//   }
// )

// deleteDraftAgreement(
// 	deleteDraftAgreementTest(),
//   function (sql, next) {
//     connection.query({
//       sql: sql.text,
//       values: sql.values
//     },
//     function(error, results, fields) {
//       console.log(sql);
//       if ( error )
//         throw error;
//       next();
//     });
//   }
// )

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

function draftLevels(agreement, callback){
	if(agreement.draft){
		var query = agreementLevelTable
				.update({
					id : agreementLevelTable.id.multiply(-1),
					agreement : agreementLevelTable.agreement.multiply(-1)
				})
				.where(agreementLevelTable.agreement.equals(agreement.id))
				.toQuery();

		callback(query, function() { draftAgreementRecord(agreement, callback) });
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

	callback(query, function() { draftLevelDatas(agreement, callback) });
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

	callback(query, function() { draftContractLevels(agreement, callback) });
}

function draftDatas(agreement, callback){
	var query = agreementDataTable
			.update({
				id : agreementDataTable.id.multiply(-1),
				agreement : agreementDataTable.agreement.multiply(-1)
			})
			.where(agreementDataTable.agreement.equals(agreement.id))
			.toQuery();

	callback(query, function() { draftLevelCategories(agreement, callback) });
}

function draftPaymentConcept(agreement, callback){
	for(var i=0; i<agreement.payments.length; i++){
		var payment = agreement.payments[i];
		if(payment.__payConcept.id && payment.__payConcept.id != null
			&& payment.__payConcept.domain != 0){
			var query = paymentConceptTable
					.update({
						id : paymentConceptTable.id.multiply(-1)
					})
					.where(paymentConceptTable.domain.notEquals(0))
					.and(paymentConceptTable.id.equals(payment.__payConcept.id))
					.toQuery();

			callback(query, function() { });
		}
	}

	for(var i=0; i<agreement.extras.length; i++){
		var extraPayment = agreement.extras[i].agreePayment;
		if(extraPayment.__payConcept.id && extraPayment.__payConcept.id != null
			&& extraPayment.__payConcept.domain != 0){
			var query = paymentConceptTable
					.update({
						id : paymentConceptTable.id.multiply(-1)
					})
					.where(paymentConceptTable.domain.notEquals(0))
					.and(paymentConceptTable.id.equals(extraPayment.__payConcept.id))
					.toQuery();

			callback(query, function() { });
		}
	}

	draftDatas(agreement, callback);
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
					if(payment.__payConcept.id == null)
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
	var query = agreementTable.delete()
			.from(agreementTable)
			.where(agreementTable.id.equals(agreement.id))
			.toQuery();

	callback(query, function() { });

}

function deleteLevels(agreement, callback){
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
	var query = agreementDataTable.delete()
			.from(agreementDataTable)
			.where(agreementDataTable.agreement.equals(agreement.id))
			.toQuery();

	callback(query, function() { deleteLevelCategories(agreement, callback) });
}

function deletePaymentConcept(agreement, callback){
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
	var query = agreementPaymentTable.delete()
			.from(agreementPaymentTable)
			.where(agreementPaymentTable.domain.notEquals(0))
			.and(agreementPaymentTable.agreement.equals(agreement.id))
			.toQuery();

	callback(query, function() { deletePaymentConcept(agreement, callback) });
}

function deleteExtras(agreement, callback){
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
		if(agreement.id == null){
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
			deleteExtras(agreement, callback);
		}
}

function setAgreement(agreement, callback){
	setUpAgreement(agreement, callback);
}

function deleteAgreement(agreement, callback){
	deleteExtras(agreement, callback);
}

function draftAgreement(agreement, callback){
	setUpDraft(agreement, callback);
}

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

draftAgreement(
	draftAgreementTest(),
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
	      code : "PREAVISO",
	      expression : null,
	      description : "DIAS PREAVISO",
	      type : 0,
	      startDate : new Date(0),
	      descriptionDecorable : 0,
	      irpfExpression : "__P",
	      quoteExpression : "__P",
				__payConcept : {
					id : 6274,
					domain : 0,
					code : 'PREAVISO',
					description : 'DIAS PREAVISO',
					type : 1,
					descriptionDecorable : 0,
					expression : null,
					irpfExpression : "_P",
					quoteExpression : "_P"
				}
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
	      quoteExpression : "__S",
				__payConcept : {
					id : null,
					domain : 8776,
					code : 'SALARIO_BASE_SERGIO',
					description : '[1]SALARIO BASE SERGIO',
					type : 1,
					descriptionDecorable : 0,
					expression : "/*user*/SALARIO_ANUAL/**/ / PAGAS * DIAS_TRABAJADOS / DIAS_MES ",
					irpfExpression : "_S",
					quoteExpression : "_S"
				}
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
	      quoteExpression : "__W",
				__payConcept : {
					id : null,
					domain : 8776,
					code : 'SALARIO_BASE_SERGIO',
					description : '[1]EXTRA SERGIO',
					type : 1,
					descriptionDecorable : 0,
					expression : "/*user*/(SALARIO_BASE + ANTIGUEDAD) *  ( 1 + MAX(0,DIAS(INICIO_CONTRATO,INICIO_NOMINA))  / DIAS_TRABAJADOS) /6/**/",
					irpfExpression : "_W",
					quoteExpression : "_W"
				}
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

function deleteAgreementTest(){
	var newAgreement =
	{
	  id:1194,
	  domain : 8776,
		delete : 1,
	  description: 'CONVENIO DE JOSE LUIS VALDEPEÑAS',
		payments: [
	    {
	      id : null,
	      code : "PREAVISO",
	      expression : null,
	      description : "DIAS PREAVISO",
	      type : 0,
	      startDate : new Date(0),
	      descriptionDecorable : 0,
	      irpfExpression : "__P",
	      quoteExpression : "__P",
				__payConcept : {
					id : 6274,
					domain : 0,
					code : 'PREAVISO',
					description : 'DIAS PREAVISO',
					type : 1,
					descriptionDecorable : 0,
					expression : null,
					irpfExpression : "_P",
					quoteExpression : "_P"
				}
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
	      quoteExpression : "__S",
				__payConcept : {
					id : 6276,
					domain : 8776,
					code : 'SALARIO_BASE_SERGIO',
					description : '[1]SALARIO BASE SERGIO',
					type : 1,
					descriptionDecorable : 0,
					expression : "/*user*/SALARIO_ANUAL/**/ / PAGAS * DIAS_TRABAJADOS / DIAS_MES ",
					irpfExpression : "_S",
					quoteExpression : "_S"
				}
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
	      quoteExpression : "__W",
				__payConcept : {
					id : 6277,
					domain : 8776,
					code : 'SALARIO_BASE_SERGIO',
					description : '[1]EXTRA SERGIO',
					type : 1,
					descriptionDecorable : 0,
					expression : "/*user*/(SALARIO_BASE + ANTIGUEDAD) *  ( 1 + MAX(0,DIAS(INICIO_CONTRATO,INICIO_NOMINA))  / DIAS_TRABAJADOS) /6/**/",
					irpfExpression : "_W",
					quoteExpression : "_W"
				}
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

function draftAgreementTest(){
	var newAgreement =
	{
	  id:1194,
	  domain : 8776,
		draft : 1,
	  description: 'CONVENIO DE SERGIO VALDEPEÑAS DEL POZO',
		payments: [
	    {
	      id : null,
	      code : "PREAVISO",
	      expression : null,
	      description : "DIAS PREAVISO",
	      type : 0,
	      startDate : new Date(0),
	      descriptionDecorable : 0,
	      irpfExpression : "__P",
	      quoteExpression : "__P",
				__payConcept : {
					id : 6274,
					domain : 0,
					code : 'PREAVISO',
					description : 'DIAS PREAVISO',
					type : 1,
					descriptionDecorable : 0,
					expression : null,
					irpfExpression : "_P",
					quoteExpression : "_P"
				}
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
	      quoteExpression : "__S",
				__payConcept : {
					id : 6276,
					domain : 8776,
					code : 'SALARIO_BASE_SERGIO',
					description : '[1]SALARIO BASE SERGIO',
					type : 1,
					descriptionDecorable : 0,
					expression : "/*user*/SALARIO_ANUAL/**/ / PAGAS * DIAS_TRABAJADOS / DIAS_MES ",
					irpfExpression : "_S",
					quoteExpression : "_S"
				}
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
	      quoteExpression : "__W",
				__payConcept : {
					id : 6277,
					domain : 8776,
					code : 'SALARIO_BASE_SERGIO',
					description : '[1]EXTRA SERGIO',
					type : 1,
					descriptionDecorable : 0,
					expression : "/*user*/(SALARIO_BASE + ANTIGUEDAD) *  ( 1 + MAX(0,DIAS(INICIO_CONTRATO,INICIO_NOMINA))  / DIAS_TRABAJADOS) /6/**/",
					irpfExpression : "_W",
					quoteExpression : "_W"
				}
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

function unDraftAgreementTest(){
	var newAgreement =
	{
	  id:-1194,
	  domain : 8776,
		draft : 1,
	  description: 'CONVENIO DE SERGIO VALDEPEÑAS DEL POZO',
		payments: [
	    {
	      id : null,
	      code : "PREAVISO",
	      expression : null,
	      description : "DIAS PREAVISO",
	      type : 0,
	      startDate : new Date(0),
	      descriptionDecorable : 0,
	      irpfExpression : "__P",
	      quoteExpression : "__P",
				__payConcept : {
					id : 6274,
					domain : 0,
					code : 'PREAVISO',
					description : 'DIAS PREAVISO',
					type : 1,
					descriptionDecorable : 0,
					expression : null,
					irpfExpression : "_P",
					quoteExpression : "_P"
				}
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
	      quoteExpression : "__S",
				__payConcept : {
					id : -6276,
					domain : 8776,
					code : 'SALARIO_BASE_SERGIO',
					description : '[1]SALARIO BASE SERGIO',
					type : 1,
					descriptionDecorable : 0,
					expression : "/*user*/SALARIO_ANUAL/**/ / PAGAS * DIAS_TRABAJADOS / DIAS_MES ",
					irpfExpression : "_S",
					quoteExpression : "_S"
				}
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
	      quoteExpression : "__W",
				__payConcept : {
					id : -6277,
					domain : 8776,
					code : 'SALARIO_BASE_SERGIO',
					description : '[1]EXTRA SERGIO',
					type : 1,
					descriptionDecorable : 0,
					expression : "/*user*/(SALARIO_BASE + ANTIGUEDAD) *  ( 1 + MAX(0,DIAS(INICIO_CONTRATO,INICIO_NOMINA))  / DIAS_TRABAJADOS) /6/**/",
					irpfExpression : "_W",
					quoteExpression : "_W"
				}
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

function deleteDraftAgreementTest(){
	var newAgreement =
	{
	  id:-1194,
	  domain : 8776,
		delete : 1,
	  description: 'CONVENIO DE JOSE LUIS VALDEPEÑAS',
		payments: [
	    {
	      id : null,
	      code : "PREAVISO",
	      expression : null,
	      description : "DIAS PREAVISO",
	      type : 0,
	      startDate : new Date(0),
	      descriptionDecorable : 0,
	      irpfExpression : "__P",
	      quoteExpression : "__P",
				__payConcept : {
					id : 6274,
					domain : 0,
					code : 'PREAVISO',
					description : 'DIAS PREAVISO',
					type : 1,
					descriptionDecorable : 0,
					expression : null,
					irpfExpression : "_P",
					quoteExpression : "_P"
				}
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
	      quoteExpression : "__S",
				__payConcept : {
					id : -6276,
					domain : 8776,
					code : 'SALARIO_BASE_SERGIO',
					description : '[1]SALARIO BASE SERGIO',
					type : 1,
					descriptionDecorable : 0,
					expression : "/*user*/SALARIO_ANUAL/**/ / PAGAS * DIAS_TRABAJADOS / DIAS_MES ",
					irpfExpression : "_S",
					quoteExpression : "_S"
				}
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
	      quoteExpression : "__W",
				__payConcept : {
					id : -6277,
					domain : 8776,
					code : 'SALARIO_BASE_SERGIO',
					description : '[1]EXTRA SERGIO',
					type : 1,
					descriptionDecorable : 0,
					expression : "/*user*/(SALARIO_BASE + ANTIGUEDAD) *  ( 1 + MAX(0,DIAS(INICIO_CONTRATO,INICIO_NOMINA))  / DIAS_TRABAJADOS) /6/**/",
					irpfExpression : "_W",
					quoteExpression : "_W"
				}
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

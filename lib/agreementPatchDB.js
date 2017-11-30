var sql = require("sql");
sql.setDialect("mysql");

var master = require("./master")(sql);
var database = require("./database");

// *****************************************************************************
// *****************************************************************************
// ******************************  PATCH ***************************************
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
// *******************************  MAIN ***************************************
// *****************************************************************************
// *****************************************************************************

patchAgreement = function(agreement, callback){
	//setUpDraft(agreement, callback);
}

var mysql = require("mysql");

var connection  = mysql.createConnection({
	supportBigNumbers : true,
	multipleStatements : true,

	host     : process.env.MYSQL_HOST || '127.0.0.1',
  user     : 'root',
  password : 'r00t',
	database : 'pro-aonsolutions-net'
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

// patchAgreement(
// 	getAllIdsAgreement(),
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

var checkIdsAgreement = function(){
	var idsListPositive = [];
	var idsListNegative = [];
	var idsDuplicated = [];

	var sql = agreementTable
		.select(agreementTable.star())
		.from(agreementTable)
		.where(agreementTable.id.gt(0))
		.toQuery();

	connection.query(
		{sql: sql.text, values: sql.values},
		function(error, results, fields) {
			for (var i = 0; i < results.length; i++)
				idsListPositive.push(results[i].id);

			var sql = agreementTable
				.select(agreementTable.star())
				.from(agreementTable)
				.where(agreementTable.id.lt(0))
				.toQuery();

			connection.query(
				{sql: sql.text, values: sql.values},
				function(error, results, fields) {
					for (var i = 0; i < results.length; i++)
						idsListNegative.push(results[i].id);

					checkIdsDuplicates(idsDuplicated, idsListNegative, idsListPositive);
					console.log(" ******** Agreement Table *********");
					console.log(idsDuplicated);
				}
			);
		}
	);
}

var checkIdsAgreementExtra = function(){
	var idsListPositive = [];
	var idsListNegative = [];
	var idsDuplicated = [];

	var sql = agreementExtraTable
		.select(agreementExtraTable.star())
		.from(agreementExtraTable)
		.where(agreementExtraTable.id.gt(0))
		.toQuery();

	connection.query(
		{sql: sql.text, values: sql.values},
		function(error, results, fields) {
			for (var i = 0; i < results.length; i++)
				idsListPositive.push(results[i].id);

			var sql = agreementExtraTable
				.select(agreementExtraTable.star())
				.from(agreementExtraTable)
				.where(agreementExtraTable.id.lt(0))
				.toQuery();

			connection.query(
				{sql: sql.text, values: sql.values},
				function(error, results, fields) {
					for (var i = 0; i < results.length; i++)
						idsListNegative.push(results[i].id);

					checkIdsDuplicates(idsDuplicated, idsListNegative, idsListPositive);
					console.log(" ******** Agreement Extra Table *********");
					console.log(idsDuplicated);
				}
			);
		}
	);
}

var checkIdsDuplicates = function(idsDuplicated, idsListNegative, idsListPositive){
	for(var i = 0; i < idsListPositive.length; i++){
		var idPositive = idsListPositive[i];
		if(isInIdsListNegative(idPositive, idsListNegative)){
			idsDuplicated.push(idPositive);
		}
	}
}

var isInIdsListNegative = function(idPositive, idsListNegative){
	for(var i = 0; i < idsListNegative.length; i++){
		var idNegative = idsListNegative[i];
		if(idNegative == idPositive){
			return true;
		}
	}
	return false;
}

checkIdsAgreement();
checkIdsAgreementExtra();

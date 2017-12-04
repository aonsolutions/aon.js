var sql = require("sql");
sql.setDialect("mysql");

var master = require("./master")(sql);
var database = require("./database");

// *****************************************************************************
// *****************************************************************************
// ******************************  PATCH ***************************************
// *****************************************************************************
// *****************************************************************************

function finishUpUpdateIds(idsRecord, tableString, callback) {
		callback( {
			text: 'SET FOREIGN_KEY_CHECKS=1;',
			values : []
		},
		function () { });
}

function updateDatasIds(idsRecord, tableString, callback){
	var query = agreementDataTable
			.update({
				id : idsRecord.newId
			})
			.where(agreementDataTable.id.equals(idsRecord.oldId))
			.toQuery();

	callback(query, function() { finishUpUpdateIds(idsRecord, tableString, callback) });
}

function updatePaymentsIds(idsRecord, tableString, callback){
	var query = agreementPaymentTable
			.update({
				id : idsRecord.newId
			})
			.where(agreementPaymentTable.id.equals(idsRecord.oldId))
			.toQuery();

	callback(query, function() { finishUpUpdateIds(idsRecord, tableString, callback) });
}

function updateExtrasIds(idsRecord, tableString, callback){
	var query = agreementExtraTable
			.update({
				agreement_payment : idsRecord.newId
			})
			.where(agreementExtraTable.agreementPayment.equals(idsRecord.oldId))
			.toQuery();

	callback(query, function() { updatePaymentsIds(idsRecord, tableString, callback) });
}

function setUpUpdatesIds(idsRecord, tableString, callback) {
		callback( {
			text: 'SET FOREIGN_KEY_CHECKS=0;',
			values : []
		},
		function () {
			if(tableString == "Agreement Payment Table")
				updateExtrasIds(idsRecord, tableString, callback);
			else if(tableString == "Agreement Data Table")
				updateDatasIds(idsRecord, tableString, callback);
		});
}

// *****************************************************************************
// *****************************************************************************
// *******************************  MAIN ***************************************
// *****************************************************************************
// *****************************************************************************

patchAgreement = function(idsRecord, tableString, callback){
	setUpUpdatesIds(idsRecord, tableString, callback);
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

var checkIds = function(table, tableString){
	var idsListPositive = [];
	var idsListNegative = [];
	var idsDuplicated = [];
	var idsFree = [];
	var idsMapFreeDuplicated = [];

	var sql = table
		.select(table.star())
		.from(table)
		.where(table.id.gt(0))
		.toQuery();

	connection.query(
		{sql: sql.text, values: sql.values},
		function(error, results, fields) {
			for (var i = 0; i < results.length; i++)
				idsListPositive.push(results[i].id);

			var sql = table
				.select(table.star())
				.from(table)
				.where(table.id.lt(0))
				.toQuery();

			connection.query(
				{sql: sql.text, values: sql.values},
				function(error, results, fields) {
					for (var i = 0; i < results.length; i++)
						idsListNegative.push(results[i].id);

					checkIdsDuplicates(idsDuplicated, idsListNegative, idsListPositive);
					// console.log(" ******** " + tableString + " *********");
					// console.log(idsDuplicated.length);
					// console.log(idsDuplicated);
					if (idsDuplicated.length > 0){
						fieldFreeIdsList(idsFree, idsListPositive, idsListNegative);
						createIdsMapFreeDuplicate(idsMapFreeDuplicated, idsFree, idsDuplicated);
						// console.log(idsFree.length);
						// console.log(idsFree);
						// console.log(idsMapFreeDuplicated.length);
						// console.log(idsMapFreeDuplicated);
						updateIds(idsMapFreeDuplicated, tableString);
					}
				}
			);
		}
	);
}

var checkIdsExcludeDomainZero = function(table, tableString){
	var idsListPositive = [];
	var idsListNegative = [];
	var idsDuplicated = [];
	var idsFree = [];
	var idsMapFreeDuplicated = [];

	var sql = table
		.select(table.star())
		.from(table)
		.where(table.id.gt(0))
		.and(table.domain.notEquals(0))
		.toQuery();

	connection.query(
		{sql: sql.text, values: sql.values},
		function(error, results, fields) {
			for (var i = 0; i < results.length; i++)
				idsListPositive.push(results[i].id);

			var sql = table
				.select(table.star())
				.from(table)
				.where(table.id.lt(0))
				.and(table.domain.notEquals(0))
				.toQuery();

			connection.query(
				{sql: sql.text, values: sql.values},
				function(error, results, fields) {
					for (var i = 0; i < results.length; i++)
						idsListNegative.push(results[i].id);

					checkIdsDuplicates(idsDuplicated, idsListNegative, idsListPositive);
					// console.log(" ******** " + tableString + " *********");
					// console.log(idsDuplicated.length);
					// console.log(idsDuplicated);
					if (idsDuplicated.length > 0){
						fieldFreeIdsList(idsFree, idsListPositive, idsListNegative);
						createIdsMapFreeDuplicate(idsMapFreeDuplicated, idsFree, idsDuplicated);
						// console.log(idsFree.length);
						// console.log(idsFree);
						// console.log(idsMapFreeDuplicated.length);
						// console.log(idsMapFreeDuplicated);
						updateIds(idsMapFreeDuplicated, tableString);
					}
				}
			);
		}
	);
}

var checkIdsDuplicates = function(idsDuplicated, idsListNegative, idsListPositive){
	for(var i = 0; i < idsListPositive.length; i++){
		var idPositive = idsListPositive[i];
		if(isInIdsListNegative(idPositive*(-1), idsListNegative)){
			idsDuplicated.push(idPositive*(-1));
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

var fieldFreeIdsList = function(idsFree, idsListPositive, idsListNegative){
	for(var pos = 1; pos < idsListPositive[idsListPositive.length-1]; pos++){
		if(!containdsIdsListPositive(pos, idsListPositive) &&
			 !containdsIdsListNegative(pos, idsListNegative))
			idsFree.push(pos*(-1));
	}
}

var containdsIdsListPositive = function(pos, idsListPositive){
	for(var i = 0; i < idsListPositive.length; i++){
		if(pos == idsListPositive[i])
			return true;
	}
	return false;
}

var containdsIdsListNegative = function(pos, idsListNegative){
	var posNegative = pos*(-1);
	for(var i = 0; i < idsListNegative.length; i++){
		if(posNegative == idsListNegative[i])
			return true;
	}
	return false;
}

var createIdsMapFreeDuplicate = function(idsMapFreeDuplicated, idsFree, idsDuplicated){
	for (var i = 0; i < idsDuplicated.length; i++){
		var ids = {};
		ids.oldId = idsDuplicated[i];
		ids.newId = idsFree[i];
		idsMapFreeDuplicated.push(ids);
	}
}

var updateIds = function(idsMapFreeDuplicated, tableString){
	for (var i = 0; i < idsMapFreeDuplicated.length; i++){
		patchAgreement(
			idsMapFreeDuplicated[i],
			tableString,
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
		);
	}
}

var main =  function(){
	checkIds(agreementTable,"Agreement Table");
	checkIds(agreementExtraTable,"Agreement Extra Table");
	checkIdsExcludeDomainZero(paymentConceptTable, "Payment Concept Table");
	checkIdsExcludeDomainZero(agreementPaymentTable, "Agreement Payment Table");
	checkIds(agreementDataTable,"Agreement Data Table");
	checkIds(agreementLevelCategoryTable,"Agreement Level Category Table");
	checkIds(agreementLevelDataTable,"Agreement Level Data Table");
	checkIds(agreementLevelTable,"Agreement Level Table");
}

main();

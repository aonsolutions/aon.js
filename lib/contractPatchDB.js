var sql = require("sql");
sql.setDialect("mysql");

var master = require("./master")(sql);
var database = require("./database");

// *****************************************************************************
// *****************************************************************************
// ******************************  PATCH ***************************************
// *****************************************************************************
// *****************************************************************************

function finishUpContractPatch(callback) {
		callback( {
			text: 'SET FOREIGN_KEY_CHECKS=1;',
			values : []
		},
		function () { });
}

function dropAgreementLevelCategoryColumn(callback){
	callback( {
		text : 'ALTER TABLE contract DROP FOREIGN KEY `FK_CONTRACT_AGREEMENT_LEVEL_CATEGORY`; ALTER TABLE contract DROP COLUMN agreement_level_category;',
		values : []
	}, function () { finishUpContractPatch(callback) });
}

function fieldAgreementLevelColumn(callback){
	callback( {
		text : "UPDATE `contract` SET `agreement_level` = ( SELECT `agreement_level` FROM `agreement_level_category` WHERE `id` = `contract`.`agreement_level_category` )  WHERE IFNULL(`agreement_level`, '') = '';",
		values : []
	}, function () { dropAgreementLevelCategoryColumn(callback) });
}

function createAgreementLevelColumn(callback){
	callback( {
		text : 'ALTER TABLE contract ADD COLUMN agreement_level INT(4) DEFAULT NULL, ADD FOREIGN KEY `FK_CONTRACT_AGREEMEN_LEVEL`(agreement_level) REFERENCES agreement_level(id);',
		values : []
	}, function () { fieldAgreementLevelColumn(callback) });
}

function updateCategoryDescription(callback){
	callback( {
		text : "UPDATE `contract` SET `category_description` = ( SELECT `description` FROM `agreement_level_category` WHERE `id` = `contract`.`agreement_level_category` )  WHERE IFNULL(`category_description`, '') = '';",
		values : []
	}, function () { createAgreementLevelColumn(callback) });
}

function setUpContractPatch(callback) {
		callback( {
			text: 'SET FOREIGN_KEY_CHECKS=0;',
			values : []
		},
		function () {
				updateCategoryDescription(callback);
		});
}

// *****************************************************************************
// *****************************************************************************
// *******************************  MAIN ***************************************
// *****************************************************************************
// *****************************************************************************

patchContract = function(callback){
	setUpContractPatch(callback);
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

var agreementLevelTable = master.agreementLevel;
var agreementLevelCategoryTable = master.agreementLevelCategory;
var contractTable = master.contract;

patchContract(
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

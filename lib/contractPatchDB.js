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

function updateCategoryDescription(callback){
	var query = contractTable
			.update({
				category_description : agreementLevelCategoryTable.description
			})
			.from(agreementLevelCategoryTable)
			.where(contractTable.agreementLevelCategory.equals(agreementLevelCategoryTable.id))
			.and(contractTable.categoryDescription.isNull())
			.toQuery();

	callback( query, function () { finishUpContractPatch(callback) });
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

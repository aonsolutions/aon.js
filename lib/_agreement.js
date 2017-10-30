var sql = require("sql");
sql.setDialect("mysql");

var master = require("./master")(sql);
var database = require("./database");

function _setCategories(agreement, callback){
	var replace = master.agreementLevelCategory;
	for ( var i = 0; i < agreement.levels.length; i++){
		for ( var j = 0; j < agreement.levels[i].categories.length; j++){
			replace = replace.replace(
	    	master.agreementLevelCategory.agreementLevel.value(agreement.levels[i].id)
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
			_setLevels(agreement, callback);
		});
}

function _setAgreement(agreement, callback){

  var replace = master.agreement.insert(
    master.agreement.id.value(agreement.id),
    master.agreement.description.value(agreement.description)
  ).toQuery();

  callback(replace, function() { _setUpLevels(agreement, callback) });
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
  _setUpAgreement(agreement, callback);
}

var mysql = require("mysql");

var connection  = mysql.createConnection({
	supportBigNumbers : true,
	multipleStatements : true,

	host     : process.env.MYSQL_HOST || '127.0.0.1',
	user     : process.env.MYSQL_USER || 'root',
	password : process.env.MYSQL_PASSWD || '',
	database : process.env.MYSQL_NAME || 'test-aonsolutions-org',
});

_setSql({
  id:666,
  description: 'DESCRIPCION',
  levels: [
    {
      description: 'I',
			categories: ['Category I.a', 'Category I.b', 'Category I.c', 'Category I.d', 'Category I.e' ]
    },
    {
      description: 'II',
			categories: ['Category II.a', 'Category II.b', 'Category II.c', 'Category II.d', 'Category II.e' ]
    },
    {
      description: 'III',
			categories: ['Category III.a', 'Category III.b', 'Category III.c', 'Category III.d', 'Category III.e' ]
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

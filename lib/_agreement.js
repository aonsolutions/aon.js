var sql = require("sql");
sql.setDialect("mysql");

var master = require("./master")(sql);
var database = require("./database");

function _setLevel(agreement, callback, i){
  if ( i >= agreement.levels.length )
    return;

  var replace = master.agreementLevel.replace(
    master.agreementLevel.agreement.value(agreement.id)
    ,master.agreementLevel.id.value(agreement.levels[i].id)
    ,master.agreementLevel.description.value(agreement.levels[i].description)
  ).toQuery();

  callback(replace, function () { _setLevel (agreement, callback, i+1); } );
}


function _setAgreement(agreement, callback){

  var replace = master.agreement.replace(
    master.agreement.id.value(agreement.id),
    master.agreement.description.value(agreement.description)
  ).toQuery();

  callback(replace, function() { _setLevel(agreement, callback, 0); });
}

function _setSql(agreement, callback){
  _setAgreement(agreement, callback);
}

var mysql = require("mysql");

var pool  = mysql.createPool({
	supportBigNumbers : true,
	multipleStatements : true,

	host     : process.env.MYSQL_HOST || '127.0.0.1',
	user     : process.env.MYSQL_USER || 'aonsolutions',
	password : process.env.MYSQL_PASSWD || '40ns0lut10ns',
	database : process.env.MYSQL_NAME || 'test-aonsolutions-org',
});

_setSql({
  id:666,
  description: 'DESCRIPCION',
  levels: [
    {
      id:1,
      description: 'I'
    },
    {
      id:2,
      description: 'II'
    },
    {
      id:3,
      description: 'III'
    }
  ]
  },
  function (sql, next) {
    pool.query({
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

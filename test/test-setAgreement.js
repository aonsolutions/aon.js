var aon = require("..");

var sql = require("sql");
sql.setDialect("mysql");

var mysql = require("mysql");
var master = require("../lib/master")(sql);
var database = require("../lib/database");

var pool  = mysql.createPool({
	supportBigNumbers : true,
	multipleStatements : true,

	host     : process.env.MYSQL_HOST || '127.0.0.1',
  user     : 'root',
  password : 'r00t',
	database : 'pro-aonsolutions-net'
});

var connection  = mysql.createConnection({
	supportBigNumbers : true,
	multipleStatements : true,

	host     : process.env.MYSQL_HOST || '127.0.0.1',
  user     : 'root',
  password : 'r00t',
	database : 'pro-aonsolutions-net'
  //database : 'test-aonsolutions-org'
});

// var connection  = sql.createConnection({
// 	supportBigNumbers : true,
// 	multipleStatements : true,
//
// 	host     : process.env.MYSQL_HOST || '127.0.0.1',
//   user     : 'root',
//   password : 'r00t',
// 	database : 'pro-aonsolutions-net'
// });

// aon.agreement.setAgreement(
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
// );

draftAllAgreementsTest = function(){
	console.log(" ............ COGIENDO IDs ...........");

	var query = master.agreement
		.select(master.agreement.star())
		.from(master.agreement)
		.where(master.agreement.id.gt(0))
		.toQuery();

	database.query(
		pool,
		query.text,
		query.values,
		function(error, results, fields){
			for(var i = 0; i < results.length; i++){
				// console.log("Records :"+results.length);
				// console.log("id :"+ results[i].id +", domain :"+
				// 						results[i].domain +", description :"+
				// 						results[i].description);

				var newAgreement = createNewAregreement(results[i]);
				aon.agreement.draftAgreement(
					newAgreement,
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
	);
}

draftAllAgreementsTest();

// aon.agreement.draftAgreement(
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
// );

function createNewAregreement(recordAgreement){
	var draftAgreement =
	{
	  id:recordAgreement.id,
	  domain : recordAgreement.domain,
		draft : 1,
	  description: recordAgreement.description,
	}
	return draftAgreement;
}

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

function draftAgreementTest(){
	var draftAgreement =
	{
	  id:1157,
	  domain : 8776,
		draft : 1,
	  description: 'CONVENIO DE SERGIO VALDEPEÑAS DEL POZO',
	}
	return draftAgreement;
}

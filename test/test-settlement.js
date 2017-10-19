var fs = require('fs');
var settlement = require('../lib/settlement');

module.exports = function ( pool, callback ) {

	settlement.get(
		pool,
		function ( params ) {
			return params.id.gte(0);
		},
		function( error, results){
			for ( var i = 0; i < results.length; i++ ){
				var writeStream = fs.createWriteStream( undefined,
				{
					flags: 'w',
					autoClose: true,
					fd : fs.openSync('/tmp/a3Letter-'+ results[i].employee.fullname+'.pdf', 'w')
				});
				settlement.a3Letter(results[i], writeStream);
			}
			callback();
		}
	);

};


// var mysql = require('mysql')
//
// var pool  = mysql.createPool({
// 	supportBigNumbers : true,
// 	multipleStatements : true,
//
// 	host     : process.env.MYSQL_HOST || '127.0.0.1',
// 	user     : process.env.MYSQL_USER || 'root',
// 	password : process.env.MYSQL_PASSWD ,
// 	database : process.env.MYSQL_NAME || 'pro-aonsolutions-net',
// });
//
// TEDI.settlement.get(pool, (params) => { return params.id.gte(0)}, (error, settlements) => {
// 	for ( var s = 0; s < settlements.length; s++ ) {
// 		if ( ! settlements[s].payments.length )
// 			console.log("WARNING [" +settlements[s]._id + "]: " + settlements[s].employee.fullname + ", hasn't payments. Something it's wrong." )
// 		if ( settlements[s].reason )
// 			console.log("INFO ["+settlements[s]._id+"]: " + settlements[s].employee.fullname + ", " + settlements[s].reason);
// 		if ( settlements[s]._holidays )
// 			console.log("INFO ["+settlements[s]._id+"]: " + settlements[s].employee.fullname + ", " + settlements[s]._holidays);
// 		if ( settlements[s]._years )
// 			console.log("INFO ["+settlements[s]._id+"]: " + settlements[s].employee.fullname + ", " + settlements[s]._years);
//
// 		// writeStream = FS.createWriteStream( undefined,
// 		// {
// 		// 	flags: 'w',
// 		// 	autoClose: true,
// 		// 	fd : FS.openSync('/tmp/Finiquito-'+ settlements[s].employee.fullname+'.pdf', 'w')
// 		// });
// 		// SETTLEMENT.a3Letter(settlements[s], writeStream);
// 	}
// 	process.exit()
//
// });

// SETTLEMENT['a3Letter']({
// 	net: 596.71,
// 	payment: 596.71,
// 	deduction: 0.00,
// 	place: 'ÁLAVA/ARABA',
// 	date: new Date('2016-04-06'),
//	reason: 'FIN CONTRATO TEMPORAL'
// 	enterprise: {
// 		cif: 'B01487271',
// 		name : 'AON SOLUTIONS, SL',
// 		city : 'VITORIA-GASTEIZ',
// 		address: 'CALLE DEL DUQUE DE WELLINGTON, 52'
// 	},
// 	employee: {
// 		nif: '44679529MM',
// 		fullname : 'TREPIANA ZÁRATE, RAÚL',
// 		city : 'VITORIA-GASTEIZ',
// 		address: 'AVENIDA JUAN CARLOS I, 7 5ºA',
// 		category: 'PROGRAMADOR',
// 	},
// 	payments: [
// 		{
// 			amount : 596.71,
// 			description: 'INDEMNIZACIÓN POR FIN DE CONTRATO TEMPORAL'
// 		}
// 	],
// 	deductions: [
// 		{
// 			amount : 96.71,
// 			description: 'I.R.P.F'
// 		}
// 	],
// 	logo : '/home/rtrepiana/Downloads/aon-logo'
// }, process.stdout );

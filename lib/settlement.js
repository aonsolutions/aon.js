var SQL = require("sql");
SQL.setDialect("mysql");
var MASTER = require("./master")(SQL);
var DATABASE = require("./database");

var PDF = require('pdfkit');
var WRITTEN_NUMBER = require('written-number');


var PARAMS = {
	id: MASTER.salary.id
}


module.exports.get = function(pool, filter, callback) {

	var salary = MASTER.salary;
	var address = MASTER.raddress;
	var contract = MASTER.contract;
	var workplace = MASTER.workplace;
	var category = MASTER.agreementLevelCategory;

	var query = salary
	.select(salary.star(),

		address.zip.as('workplaceZip'),
		address.city.as('workplaceCity'),
		address.number.as('workplaceNumber'),
		address.address.as('workplaceAddress'),
		address.address2.as('workplaceAddress2'),
		address.address3.as('workplaceAddress3'),
		address.streetType.as('workplaceStreet'),

		category.description.as('agreementCategory'),
		contract.categoryDescription.as('contractCategory')
	)
	.from(salary
		.join(contract).on(salary.contract.equals(contract.id))
		.leftJoin(category).on(contract.agreementLevelCategory.equals(category.id))
		.join(workplace).on(contract.workplace.equals(workplace.id))
		.join(address).on(workplace.address.equals(address.id))
		// .leftJoin(address.as('employeeAddress')).on(contract.person.equals(address.registry))
	)
	.where(
		salary.type.equals(2)
		.and(filter(PARAMS))
	)
	.toQuery();


	DATABASE.query(pool,
		query.text,
		query.values,
		function ( error, results, fields ) {
			settlements = results.map( function (result) {
				return {
					_id: result.id,
					net: result.totalLiquid,
					payment: result.totalPayment,
					deduction: result.totalDeduction,
					place: result.workplaceCity,
					date: result.issueDate,
					employee: {
						nif: result.employeeDocument,
						fullname: result.employeeName,
						city: result.employeeCity,
						address: result.employeeAddress,
						category: result.contractCategory || result.agreementCategory
					},
					enterprise: {
						cif: result.enterpriseDocumen,
						name: result.enterpriseName,
						city: result.workplaceCity,
						address: (result.workplaceStreet ? result.workplaceStreet + '. ' : '')
										+ ( result.workplaceAddress ? result.workplaceAddress + ' ': '' )
										+ ( result.workplaceAddress2 ? result.workplaceAddress2 + ' ': '' )
										+ ( result.workplaceAddress3 ? result.workplaceAddress3 : '' )
										+ ( result.workplaceNumber ? ', ' +result.workplaceNumber :  '' )
										+ ( result.workplaceZip ? ', ' +result.workplaceZip :  '' )
					},
					payments: [],
					deductions:[]
				}
			}
		);
		var map = [];
		for ( var i = 0; i < settlements.length; i++ )
			map[settlements[i]._id] = settlements[i];

		var getDeductions = function () {
			var deduction = MASTER.salaryDeduction;
			var deductions = {
				0: 'CONTINGENCIAS COMUNES',
				1: 'CONTINGENCIAS PROFESIONALES',
				2: 'DESEMPLEO',
				3: 'FORMACIÓN PROFESIONAL',
				4: 'HORAS EXTRAORDINARIAS FUERZA MAYOR',
				5: 'RESTO HORAS EXTRAORDINARIAS',
				6: 'I.R.P.F',
			}
			query = deduction
				.select(deduction.star())
				.from(deduction)
				.where(deduction.salary.in(settlements.map(function (s) { return s._id; })))
				.order(deduction.salary)
				.toQuery();

			DATABASE.query(pool,
				query.text,
				query.values,
				function (error, results, fields) {
					for ( var i = 0; i < results.length; i++ ){
						map[results[i].salary].deductions.push({
							amount: results[i].amount,
							description: ((deductions[results[i].type] && /^\s*(\d+(\.\d+)?\s*%)?\s*$/.test(results[i].description)) ?
													deductions[results[i].type]  + ' ' : '')
													+ ( results[i].description || (deductions[results[i].type] || '') )
						});
					}

					callback(error, settlements);
				}
			)
		}

		var getPayments = function () {
			var payment = MASTER.salaryPayment;

			query = payment
				.select(payment.star())
				.from(payment)
				.where(payment.salary.in(settlements.map(function (s) { return s._id; })))
				.order(payment.salary)
				.toQuery();

			DATABASE.query(pool,
				query.text,
				query.values,
				function (error, results, fields) {
					for ( var i = 0; i < results.length; i++ ){
						map[results[i].salary].payments.push({
							amount: results[i].amount,
							description: results[i].description,
							units: ( results[i].type == 6 ? map[results[i].salary]._holidays :
										(results[i].type == 54 ? map[results[i].salary]._years :
										undefined ))
						});
					}
					getDeductions();
				}
			);
		}

		var getData = function () {
			var data = MASTER.salaryData;

			var reasons = {
				UNFAIR: 'DESPIDO',
				OBJECTIVE: 'DESPIDO',
				TEMP_END: 'FIN CONTRATO TEMPORAL',
				WORK_END: 'FIN CONTRATO FIJO DE OBRA',
				DEFINITIVE_END: 'FIN CONTRATO DURACIÓN DETERMINADA',
				CONDITIONS_CHANGE: 'BAJA VOLUNTARIA, MODIFICACIÓN CONDICIONES'
			}

			query = data
				.select(data.star())
				.from(data)
				.where(data.salary.in(settlements.map(function (s) { return s._id; })))
				.order(data.salary)
				.toQuery();

			DATABASE.query(pool,
				query.text,
				query.values,
				function (error, results, fields) {
					for ( var i = 0; i < results.length; i++ ) {
						if ( results[i].name && 'CAUSA_INDEMNIZACION' === results[i].name){
							map[results[i].salary].reason = reasons[results[i].expression];
						}
						else if ( results[i].name && 'AÑOS_TRABAJADOS' === results[i].name){
							map[results[i].salary]._years = results[i].expression;
						}
						else if ( results[i].name && 'DIAS_VACACIONES_NO_DISFRUTADOS' === results[i].name){
							map[results[i].salary]._holidays = results[i].expression;
						}
					}
					getPayments();
				}
			);
		}

		var getEmployeeAdress = function () {
			var salary = MASTER.salary;
			var contract = MASTER.contract;
			var raddress = MASTER.raddress;

			query = salary
				.select(salary.star(),
				raddress.zip,
				raddress.city,
				raddress.streetType,
				raddress.number,
				raddress.address,
				raddress.address2,
				raddress.address3
			)
				.from(salary
				.join(contract).on(salary.contract.equals(contract.id))
				.leftJoin(raddress).on(contract.person.equals(raddress.registry)))
				.where(salary.id.in(settlements.map(function (s) { return s._id; })))
				.order(salary.id)
				.toQuery();

			DATABASE.query(pool,
				query.text,
				query.values,
				function (error, results, fields) {
					for ( var i = 0; i < results.length; i++ ){
						map[results[i].id].employee.city = results[i].city;
						map[results[i].id].employee.address =
							(results[i].street ? results[i].street + '. ' : '')
							+ ( results[i].address ? results[i].address + ' ': '' )
							+ ( results[i].address2 ? results[i].address2 + ' ': '' )
							+ ( results[i].address3 ? results[i].address3 : '' )
							+ ( results[i].number ? ', ' +results[i].number :  '' )
							+ ( results[i].zip ? ', ' +results[i].zip :  '' )
					}
					getData();
				}
			);
		}

		getEmployeeAdress();

		}
	);
}


module.exports.a3Letter = function (settlement, stream) {
	var pdf = new PDF();
	pdf.pipe(stream);

	var pdfWidth = pdf.page.width
		- pdf.page.margins.left
		- pdf.page.margins.right
		;

	var formatText = function( text ) {
		return text ? text.toUpperCase() : ' ';
	}

	var formatAmount = function( amount ) {
		return amount ? amount.toFixed(2) : '0.00';
	}

	textSize = 8;
	textFont = 'Times-Roman';
	// textFont = 'Helvetica';
	// textFont = 'Courier';
	titleSize = 12;
	titleFont = 'Times-Bold';
	// titleFont = 'Helvetica-Bold';
	// titleFont = 'Courier-Bold';
	headingSize = 8;
	headingFont = 'Times-Bold';
	// headingFont = 'Helvetica-Bold';
	// headingFont = 'Courier-Bold';

	pdf
	  .font(titleFont)
		.fontSize(titleSize)
		.text('DOCUMENTO DE LIQUIDACIÓN Y FINIQUITO', { align: 'center'} )
		.moveDown(1);

	pdf
		.font(headingFont)
		.fontSize(headingSize)
		.text('DATOS DE LA EMPRESA')
		.moveDown(0.5);

	y = pdf.y;
	x = pdf.x;
	top = 3;
	left = 4;

	width = pdfWidth * 5/8;
	pdf
		.moveTo(x,o=y).lineTo(x+pdfWidth, y).stroke()
		.font(headingFont)
		.text('EMPRESA: ' , x + left , y + top , {continued: true})
		.font(textFont)
		.text(formatText(settlement.enterprise.name))
		.font(headingFont)
		.text('N.I.F.: ', x + width + left, y + top , {continued: true})
		.font(textFont)
		.text(formatText(settlement.enterprise.cif))
		.moveTo(x, y = pdf.y).lineTo(x+pdfWidth, y).stroke()

		.font(headingFont)
		.text('DOMICILIO: ', x + left, y + top, {continued: true})
		.font(textFont)
		.text(formatText(settlement.enterprise.address))
		.font(headingFont)
		.text('LOCALIDAD: ',x + width  + left, y + top, {continued: true})
		.font(textFont)
		.text(formatText(settlement.enterprise.city))
		.moveTo(x, y = pdf.y).lineTo(x+pdfWidth, y).stroke()

		.moveTo(x,o).lineTo(x,y).stroke()
		.moveTo(x+width,o).lineTo(x+width,y).stroke()
		.moveTo(x+pdfWidth,o).lineTo(x+pdfWidth,y).stroke()

		.moveDown(1);


	pdf
		.font(headingFont)
		.fontSize(headingSize)
		.text('DATOS DEL TRABAJADOR', x)
		.moveDown(0.5);

		y = pdf.y;

	pdf
		.moveTo(x,o=y).lineTo(x+pdfWidth, y).stroke()
		.font(headingFont)
		.text('APELLIDOS Y NOMBRE: ' , x + left , y + top , {continued: true})
		.font(textFont)
		.text(formatText(settlement.employee.fullname))
		.font(headingFont)
		.text('N.I.F.: ', x + width + left, y + top , {continued: true})
		.font(textFont)
		.text(formatText(settlement.employee.nif))
		.moveTo(x, y = pdf.y).lineTo(x+pdfWidth, y).stroke()

		.font(headingFont)
		.text('DOMICILIO: ', x + left, y + top, {continued: true})
		.font(textFont)
		.text(formatText(settlement.employee.address))
		.font(headingFont)
		.text('LOCALIDAD: ',x + width  + left, y + top, {continued: true})
		.font(textFont)
		.text(formatText(settlement.employee.city))
		.moveTo(x, y = pdf.y).lineTo(x+pdfWidth, y).stroke()

		.font(headingFont)
		.text('MOTIVO BAJA: ', x + left, y + top, {continued: true})
		.font(textFont)
		.text(formatText(settlement.reason))
		.font(headingFont)
		.text('CATEGORIA: ', x + width + left, y + top, {continued: true})
		.font(textFont)
		.text(formatText(settlement.employee.category))
		.moveTo(x, y = pdf.y).lineTo(x+pdfWidth, y).stroke()

		.moveTo(x,o).lineTo(x,y).stroke()
		.moveTo(x+width,o).lineTo(x+width,y).stroke()
		.moveTo(x+pdfWidth,o).lineTo(x+pdfWidth,y).stroke()

		.moveDown(1);

	y = pdf.y;

	pdf
		.font(textFont)
		.text('El suscrito trabajador cesa en la prestación de sus servicios por cuenta'
		+' de la empresa y recibe en este acto la liquidación de sus partes proporcionales'
		+' en la cuantía y detalle que se expresan al pie, con cuyo percibo reconoce'
		+' hallarse saldado y finiquitado por todos los conceptos con la referida empresa,'
		+' por lo que se compromete a nada más pedir ni reclamar.', x, y, {align:'justify'})
		.moveDown(1);

	y = pdf.y;

	pdf
		.font(headingFont)
		.moveTo(x,o=y).lineTo(x+pdfWidth, y).stroke()
		.text('DESGLOSE DE LA LIQUIDACIÓN', x, y + top, {align:'center'});

	y = pdf.y;

	pdf
		.moveTo(x,o).lineTo(x,y).stroke()
		.moveTo(x+pdfWidth,o).lineTo(x+pdfWidth,y).stroke()

	pdf
		.moveTo(x,o=y).lineTo(x+pdfWidth, y).stroke()
		.font(headingFont)
		.text('UNIDAD' , x + left , y + top)
		.text('CONCEPTOS' , x + width/6 + left , y + top)
		.text('DEVENGOS' , x + width + left , y + top)
		.text('DEDUCCIONES' , x + width + (pdfWidth - width)/2 + left , y + top)
		.moveTo(x, y = pdf.y).lineTo(x+pdfWidth, y).stroke()

	pdf.moveDown(1);

	amountOptions = {width: (pdfWidth - width)/2 - 2*left, align: 'right'};

	var payments = settlement.payments.filter( function ( p ) { return p.amount > 0.00;  } )

	pdf.font(textFont);
	for ( var i = 0; i <  payments.length; i++ ) {
		y = pdf.y;
		pdf
			.text( payments[i].units || ' ' , x + left, y + top )
		var yy = pdf.y
		pdf
			.text( formatText(payments[i].description) , x + width/6 + left, y + top, { width: width - width/6})
		pdf
			.text( formatAmount(payments[i].amount) , x + width + left, y + top + ( yy != pdf.y ? pdf.y - yy  :0 ), amountOptions )
		;
	}

	var deductions = settlement.deductions.filter( function ( p ) { return p.amount > 0.00; } )

	pdf.moveDown(1);

	for ( var i = 0; i <  deductions.length; i++ ) {
		y = pdf.y;
		pdf
			.text( deductions[i].units  || ' ', x + left, y + top )
			.text( formatText(deductions[i].description ), x + width/6 + left, y + top)
			.text( formatAmount(deductions[i].amount), x + width + (pdfWidth - width)/2 + left, y + top,  amountOptions)
		;
	}
	pdf.moveDown(25 - (deductions.length + payments.length) );

	y = pdf.y;

	pdf
		.moveTo(x+width/6,o).lineTo(x+width/6,y).stroke();

	pdf
		.moveTo(x, y).lineTo(x+pdfWidth, y).stroke()
		.font(headingFont)
		.text('TOTALES', x +left , y + top)
		.font(textFont)
		.text( formatAmount(settlement.payment), x + width + left, y + top,  amountOptions)
		.text( formatAmount(settlement.deduction), x + width + (pdfWidth - width)/2 + left, y + top,  amountOptions);

	y = pdf.y;

	pdf
	.moveTo(x+width,o).lineTo(x+width,y).stroke();

	pdf
		.moveTo(x, y).lineTo(x+pdfWidth, y).stroke()
		.font(headingFont)
		.text('IMPORTE LÍQUIDO A RECIBIR', x +left , y + top)
		.font(textFont)
		.text( formatAmount(settlement.net), x + width + (pdfWidth - width)/2 + left, y + top,  amountOptions);

  y = pdf.y;

	pdf
		.moveTo(x,o).lineTo(x,y).stroke()
		.moveTo(x+width + (pdfWidth - width)/2,o).lineTo(x+width + (pdfWidth - width)/2,y).stroke()
		.moveTo(x+pdfWidth,o).lineTo(x+pdfWidth,y).stroke()
		.moveTo(x,y).lineTo(x+pdfWidth,y).stroke();

	pdf.moveDown(1);

	pdf
		.text('En ' + formatText(settlement.place)
		+ ', a '
	 	+ settlement.date.toLocaleDateString('es-ES', {day: 'numeric'})
		+ ' de '
		+ settlement.date.toLocaleDateString('es-ES', {month:'long'}).toUpperCase()
		+ ' de '
		+ settlement.date.toLocaleDateString('es-ES', {year: 'numeric'})
	 , x);

	pdf.moveDown(2);

	pdf
	.text('Recibí:', x)

	pdf.moveDown(0.5)

	y = pdf.y;
  o = y

	pdf
	.text('A los efectos oportunos declaro que he firmado esta liquidación en'
	+' presencia de un representante de los trabajadores.'
	, x + left , y + top , {width: pdfWidth / 3 - 2*left , align: 'justify'})
	.text('A los efectos oportunos declaro que no he hecho uso de la posibilidad'
	+' de la presencia de un representante de los trabajadores.'
	, x + pdfWidth / 3 + left  , y + top, {width: pdfWidth / 3 - 2*left , align: 'justify'})
	.text('A los efectos oportunos declaro en la empresa no existe representante'
	+' de los trabajadores.'
	, x + 2 * pdfWidth / 3 + left  , y + top, {width: pdfWidth / 3 - 2*left , align: 'justify'})

	pdf.moveDown(3)

	y = pdf.y;

	pdf
	.font(headingFont)
	.text('FIRMADO'
	, x + left, y )
	.text('FIRMADO'
	, x + pdfWidth / 3 + left, y)
	.text('FIRMADO'
	, x + 2 * pdfWidth / 3 + left, y)

	y = pdf.y;

	pdf
	.moveTo(x,o).lineTo(x+pdfWidth,o).stroke()
	.moveTo(x,o).lineTo(x,y).stroke()
	.moveTo( x + pdfWidth / 3,o).lineTo( x + pdfWidth / 3,y).stroke()
	.moveTo( x + 2 * pdfWidth / 3,o).lineTo( x + 2 * pdfWidth / 3,y).stroke()
	.moveTo(x+pdfWidth,o).lineTo(x+pdfWidth,y).stroke()
	.moveTo(x,y).lineTo(x+pdfWidth,y).stroke()



	pdf.end();

};

module.exports.defLetter = function (settlement, stream) {

	var pdf = new PDF();
	pdf.pipe(stream);

	var width = pdf.page.width
				- pdf.page.margins.left
				- pdf.page.margins.right
				;

	var letter = {
		x : [
			pdf.page.margins.left,
			pdf.page.margins.left + width * 3.00/4
		],
		options : [
			{ width: width * 3/4 },
			{ width: width * 1/4 }
		],
		text : function (col, row, text, options)  {
			//default optios parameter
			options = options || {};
			//merge col's options & options
			for (var attr in this.options[col]){
				options[attr] = options[attr] || this.options[col][attr];
			}

			var x = this.x[col];
			var y = pdf.page.margins.top
								+ row * pdf.currentLineHeight(true);
			pdf.text(text, x, y, options);

			return this;
		},
		line : function (col, row, options)  {
			//default optios parameter
			options = options || {};
			options.top = options.top || 0;
			options.left = options.left || 0;

			var y = pdf.page.margins.top
								+ row * pdf.currentLineHeight(true)
								+ options.top
								;

			pdf
				.moveTo(this.x[col] + options.left,y )
				.lineTo(this.x[col] + this.options[col].width,y);

			if ( options.dash )
				pdf.dash(options.dash);
			else
				pdf.undash();

			pdf.stroke();

			return this;
		},
		image(col, row, image, options) {
			options = options || {};
			options.top = options.top || 0;

			var y = pdf.page.margins.top
								+ row * pdf.currentLineHeight(true)
								+ options.top;
			pdf.image(image, this.x[col], y , options);
			return this;
		}

	};


	letter.image( 0, 0,settlement.logo, {width: 100});

	var row;
	lettercd
		.text(0,row=5, '- FINIQUITO a favor del trabajador:')
		.text(0,row+=2, settlement.employee.fullname ).text(1,row, 'N.I.F.:' + settlement.employee.nif )
		.text(0,row+=2, 'que causa baja en la empresa:' )
		.text(0,row+=2, settlement.enterprise.name ).text(1,row, 'N.I.F.:' + settlement.enterprise.cif)
		.text(0,row+=2, 'con fecha: ' + settlement.date.toLocaleDateString('es-ES') )
		.text(0,row+=2,'según el siguiente desglose:')
	;

	letter
		.text(0,row+=2,'CONCEPTO',{indent:25}).text(1,row,'IMPORTE',{align:'right'})
	;

	for ( i = 0 ; i < settlement.payments.length; i++ ) {
		var payment = settlement.payments[i];
		letter.text(0, row+=1, payment.description,{indent:25}).text(1, row,payment.amount,{align:'right'});
	}

	letter
		.text(0,row+=2,'TOTAL',{indent:25}).text(1,row,settlement.payment,{align:'right'}).line(1,row, {top:-2})
		.line(0,row+=1, {left:25, dash:1})
	;

	letter
		.text(0,row+=2,'DEDUCCIONES',{indent:25}).text(1,row,'IMPORTE',{align:'right'})
	;
	for ( i = 0 ; i < settlement.deductions.length; i++ ) {
		var deduction = settlement.deductions[i];
		letter.text(0, row+=1, deduction.description,{indent:25}).text(1, row, deduction.amount,{align:'right'});
	}
	letter
		.text(0,row+=2,'TOTAL',{indent:25}).text(1,row,settlement.deduction,{align:'right'}).line(1,row, {top:-1})
		.line(0,row+=1, {left:25, dash:1})
		.text(0,row+=2,'LÍQUIDO',{indent:25}).text(1,row,settlement.net,{align:'right'}).line(1,row, {top: -1})
		.line(0,row+=1, {left:25, dash:1})
	;

	letter
		.text(0,row+=3, '--o--', { align: 'center', width: width});

	var decimal = settlement.net % 1;
	var integer = settlement.net - decimal;


	letter
		.text(0,row+=2, '- He recibido la cantidad de:')
		.text(0,row+=1, WRITTEN_NUMBER( integer, {lang: 'es'}).formatText()
				+ (decimal ? ' CON ' + WRITTEN_NUMBER( decimal * 100, {lang: 'es'}).formatText() :'' )
				+ ' euros' )
		.text(0,row+=1, 'como saldo a mi favor, segun liquidación precedente, considerandome \
totalmente remunerado hasta el día de fecha que causo baja sin tener derecho a \
ninguna reclamación posterior, y dando por finiquitado mi contrato con la citada Empresa.'
			, {  width: width})
	;

	letter
		.text(0,row+=5, 'En ' + settlement.place + ',a '
				+ settlement.date.toLocaleDateString('es-ES', {month:'long', year: 'numeric', day: 'numeric'})
			,{align: 'right', width: width})
		.text(0,row+=2, 'NO EXISTE REPRESENTACIÓN LEGAL DE LOS TRABAJADORES',{width:width})
		.text(0,row+=2, 'RECIBÍ', {align: 'center', width:width})
	;

	pdf.end();
};

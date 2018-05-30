var SQL = require("sql");
SQL.setDialect("mysql");
var MASTER = require("./master")(SQL);
var DATABASE = require("./database");

var PDF = require('pdfkit');

module.exports.spanishPayroll = function(payroll, stream){
  //Initialize pdf object
  var pdf = new(PDF);
  pdf.pipe(stream);

  //PDF Styles
  var pdfWidth = pdf.page.width
		 - pdf.page.margins.left
     - pdf.page.margins.right
	;

  pdf.page.width = pdf.page.width + 60; //Ancho para que no haya salto de linea
  pdf.page.margins = {top: 50, bottom: 0, left: 72, right: 72}; //Margenes del documento

  //Variables y constantes
	textSize = 6;
	textFont = 'Helvetica';

	titleSize = 8;
	titleFont = 'Helvetica-Bold';

	headingSize = 4;
	headingFont = 'Helvetica-Bold';

  //Metodos auxiliares
	var formatText = function( text ) {
		return text ? text.toUpperCase() : ' ';
	}

	var formatAmount = function( amount ) {
		return amount ? amount.toFixed(2) : '0.00';
	}

  var formatPercent = function( number ) {
    percent = number; //* 100
    return percent ? percent.toFixed(2) : '0.00';
	}

  var formatDate = function( date ) {
		var split = date.split('/');
    return split[0] + ' de ' + getStrMonth(split[1]) + ' de ' + split[2];
	}

  var getStrMonth = function (month){
    switch (month) {
      case '01':
          return 'enero';
      case '02':
          return 'febrero';
      case '03':
          return 'marzo';
      case '04':
          return 'abril';
      case '05':
          return 'mayo';
      case '06':
          return 'junio';
      case '07':
          return 'julio';
      case '08':
          return 'agosto';
      case '09':
          return 'septiembre';
      case '10':
          return 'octubre';
      case '11':
          return 'noviembre';
      case '12':
          return 'diciembre';
      default:
          return 'error';
    }
  }

  var numberOffset = function(number){
    var split = number.split('.');
    switch (split[0].length) {
      case 1:
          return 27;
      case 2:
          return 22;
      case 3:
          return 18;
      case 4:
          return 13;
      case 5:
          return 9;
      case 6:
          return 5;
      default:
          return 0;
    }
  }

  var newHearderTittle = function(){
    //PDF drawing position using for lines
    y = pdf.y;
  	x = pdf.x-50;
    originalX = pdf.x-50;
    originalY = pdf.y;
    ox = pdf.x
  	top = 2;
  	left = 8;
  	width = (pdfWidth-30) * 1/2;
    pdf.lineWidth(1);

    paddingTopTL = 14;  //Padding-top text / line
    paddingTop = 4;     //Padding-top line / text, text / text
    paddingLeft1 = 8;   //Padding-left first text
    paddingLeft2 = 16;  //Padding-left second text
    paddingLeft3 = 20;  //Padding-left third text
    marginTL = 2;       //Margin bettwen text / line, line / text, line / line

    //Start drawing PDF
    pdf
  	  .font(titleFont)
  		.fontSize(titleSize)
  		.text('RECIBO INDIVIDUAL JUSTIFICATIVO DEL PAGO DE SALARIO', x+155, 0)
  		.moveDown(1);
  }

  var newEnterpriseBox = function(){
    y = pdf.y-8;
    oy = y;

    rightEnterpriseX = ox + width;  //Position X for right line enterprise box
    maxRightWidth = x + pdfWidth + 100; //Position X for right line employee, salary, footer box
    sizVertivalLineEE = 10;             //Size vertical line for enterprise, employee box

    // -----------------------------------------------------------------------------------------------------------------
    // -------------------------------------------- ENTERPRISE ---------------------------------------------------------
    // -----------------------------------------------------------------------------------------------------------------
    pdf
      .moveTo(x, y).lineTo(rightEnterpriseX, y).stroke()      //Horizontal top line

      .font(headingFont)
      .text('Empresa: ', x + paddingLeft1, y + paddingTop , {continued: true})
      .text(payroll.enterprise.name)

      .text('Domicilio: ', x + paddingLeft1, y = pdf.y + paddingTop, {continued: true})
      .font(textFont)
      .text(payroll.enterprise.address)
      .text(payroll.enterprise.locality , x + paddingLeft1 + 41)

      .font(headingFont)
      .text('CIF: ' , x + paddingLeft1 , y = pdf.y + paddingTop , {continued: true})
      .font(textFont)
      .text(payroll.enterprise.cif)

      .font(headingFont)
      .text('CCC: ' , x + paddingLeft1, y = pdf.y + paddingTop, {continued: true})
      .font(textFont)
      .text(payroll.enterprise.ccc)

      .moveTo(x, oy).lineTo(x, y + sizVertivalLineEE).stroke()                                     //Vertical left line
  		.moveTo(rightEnterpriseX, oy).lineTo(rightEnterpriseX, y + sizVertivalLineEE).stroke()       //Vertical right line
      .moveTo(x, y + sizVertivalLineEE).lineTo(rightEnterpriseX, y + sizVertivalLineEE).stroke();  //Horizontal bottom line

  }

  var newEmployeeBox = function(){
    // -----------------------------------------------------------------------------------------------------------------
    // -------------------------------------------- EMPLOYEE -----------------------------------------------------------
    // -----------------------------------------------------------------------------------------------------------------
    leftEmployeeX = ox + width + left + 5 ;  //Position X for left line employee box
    employeeY = oy + top + 2;                 //Start y for employee box
    employeeTop = 12;                         //Padding-top bettwen text

    pdf
      .moveTo(leftEmployeeX - left, oy).lineTo(maxRightWidth, oy).stroke()   //Horizontal top line

      .font(headingFont)
      .text('Trabajador: ' , leftEmployeeX, employeeY, {continued: true})
      .text(payroll.employee.fullname)

      .text('NIF: ', leftEmployeeX, employeeY = employeeY + employeeTop, {continued: true})
      .font(textFont)
      .text(payroll.employee.nif)

      .font(headingFont)
      .text('Nº S.S.: ', leftEmployeeX, employeeY = employeeY + employeeTop, {continued: true})
      .font(textFont)
      .text(payroll.employee.ss)

      .font(headingFont)
      .text('Grupo profesional: ', leftEmployeeX, employeeY = employeeY + employeeTop, {continued: true})
      .font(textFont)
      .text(payroll.employee.professional_group)

      .font(headingFont)
      .text('Grupo cotización: ', leftEmployeeX, employeeY = employeeY + employeeTop, {continued: true})
      .font(textFont)
      .text(payroll.employee.quote_group)

      .font(headingFont)
      .text('Fecha antigüedad: ', leftEmployeeX + 152, employeeY , {continued: true})
      .font(textFont)
      .text(payroll.employee.seniority_date)

      .moveTo(leftEmployeeX - left, oy).lineTo(leftEmployeeX - left, y + sizVertivalLineEE).stroke()              //Vertical left line
      .moveTo(maxRightWidth, oy).lineTo(maxRightWidth, y + sizVertivalLineEE).stroke()                            //Vertical right line
      .moveTo(leftEmployeeX - left, y + sizVertivalLineEE).lineTo(maxRightWidth, y + sizVertivalLineEE).stroke()  //Horizontal bottom line
      .moveDown(1);
  }

  var newSettlementBox = function(){
    // -----------------------------------------------------------------------------------------------------------------
    // --------------------------------------------- SETTLEMENT --------------------------------------------------------
    // -----------------------------------------------------------------------------------------------------------------
    start_date = formatDate(payroll.settlement.start_date);
    end_date = formatDate(payroll.settlement.end_date);
    settlementWidth = x + pdfWidth + 100;
    settlementTop = 4;
    settlementX = ox - 50 + left;
    settlementY = y + top + 12;
    settlementYHeight = settlementY + 15;

    pdf
      .moveTo(x, settlementY).lineTo(settlementWidth, settlementY).stroke()   //Horizontal top line

      .font(headingFont)
      .text('Periodo de liquidación: ' , settlementX, settlementY + settlementTop, {continued: true})
      .font(textFont)
      .text('del '+ start_date +' al '+ end_date, {continued: true})

      .font(headingFont)
      .text('Total días: ', settlementX + 238 , settlementY + settlementTop, {continued: true})
      .font(textFont)
      .text(payroll.settlement.total_days)

      .moveTo(x, settlementY).lineTo(x, settlementYHeight).stroke()                               //Vertical left line
      .moveTo(settlementWidth, settlementY).lineTo(settlementWidth, settlementYHeight).stroke()   //Vertical right line
      .moveTo(x, settlementYHeight).lineTo(settlementWidth, settlementYHeight).stroke();          //Horizontal bottom line
  }

  var newFooterBox = function(){
    // -----------------------------------------------------------------------------------------------------------------
    // -------------------------------------------- FOOTER -------------------------------------------------------------
    // -----------------------------------------------------------------------------------------------------------------
    footer = 538;
    pdf
      .moveTo(originalX, originalY+footer).lineTo(originalX+pdfWidth+100, originalY+footer).undash().stroke()
      .font(textFont)
      .text('DETERMINACIÓN DE LAS BASES DE COTIZACIÓN A LA SEGURIDAD SOCIAL Y CONCEPTOS DE RECAUDACIÓN CONJUNTAS Y DE ' +
          'LA BASE' , originalX + left , originalY + footer + top + 2)
      .font(textFont)
      .text('SUJETA A RETENCIÓN DEL IRPF Y APORTACIÓN DE LA EMPRESA' , originalX + left , originalY + footer + top + 12)
      .font(textFont)
      .text('1. Contingencias comunes' , originalX + left + 5 , originalY + footer + top + 25, {continued: true})
      .font(textFont)
      .text('BASE', originalX + left + 280 , originalY + footer + top + 25, {continued: true})
      .font(textFont)
      .text('TIPO', originalX + left + 325 , originalY + footer + top + 25, {continued: true})
      .font(textFont)
      .text('AP. EMPRESA', originalX + left + 355 , originalY + footer + top + 25)

      .font(textFont)
      .text('Importe remuneración mensual' , originalX + left + 10 , originalY + footer + top + 39)
      .font(textFont)
      .text(formatAmount(payroll.footer_ss_quotation.common_contingency.monthly_remuneration), originalX + left + 250 + numberOffset(formatAmount(payroll.footer_ss_quotation.common_contingency.monthly_remuneration)) , originalY + footer + top + 39)
      .lineWidth(0.1)
      .moveTo(originalX + left + 10 , originalY + footer + top + 49).lineTo(originalX + left + 300 , originalY + footer + top + 49).stroke()

      .font(textFont)
      .text('Importe prorrata de pagas extraordinarias' , originalX + left + 10 , originalY + footer + top + 53)
      .font(textFont)
      .text(formatAmount(payroll.footer_ss_quotation.common_contingency.extraordinary_pay_packet), originalX + left + 250 + numberOffset(formatAmount(payroll.footer_ss_quotation.common_contingency.extraordinary_pay_packet)), originalY + footer + top + 53)
      .moveTo(originalX + left + 10 , originalY + footer + top + 63).lineTo(originalX + left + 300 , originalY + footer + top + 63).stroke()

      .font(textFont)
      .text(formatAmount(payroll.footer_ss_quotation.common_contingency.base), originalX + left + 353 + numberOffset(formatAmount(payroll.footer_ss_quotation.common_contingency.base)) , originalY + footer + top + 46)
      .font(textFont)
      .text(formatPercent(payroll.footer_ss_quotation.common_contingency.type_percent) + ' %' , originalX + left + 408 + numberOffset(formatPercent(payroll.footer_ss_quotation.common_contingency.type_percent)) , originalY + footer + top + 46)
      .font(textFont)
      .text(formatAmount(payroll.footer_ss_quotation.common_contingency.company_input) , originalX + left + 497 + numberOffset(formatAmount(payroll.footer_ss_quotation.common_contingency.company_input)), originalY + footer + top + 46)
      .moveTo(originalX + left + 310 , originalY + footer + top + 56).lineTo(originalX + left + 550 , originalY + footer + top + 56).stroke()

      .font(textFont)
      .text('2. Contingencias profesionales' , originalX + left + 5 , originalY + footer + top + 80)
      .font(textFont)
      .text('conceptos de recaudación' , originalX + left + 5 , originalY + footer + top + 90)
      .font(textFont)
      .text('conjunta' , originalX + left + 5 , originalY + footer + top + 100)

      .font(textFont)
      .text('AT Y EP' , originalX + left + 160 , originalY + footer + top + 67)
      .moveTo(originalX + left + 160 , originalY + footer + top + 77).lineTo(originalX + left + 301 , originalY + footer + top + 77).stroke()
      .font(textFont)
      .text(formatPercent(payroll.footer_ss_quotation.professional_contingency.type_percent_at) + ' %', originalX + left + 408 + numberOffset(formatPercent(payroll.footer_ss_quotation.professional_contingency.type_percent_at)), originalY + footer + top + 67)
      .font(textFont)
      .text(formatAmount(payroll.footer_ss_quotation.professional_contingency.company_input_at), originalX + left + 497 +  numberOffset(formatAmount(payroll.footer_ss_quotation.professional_contingency.company_input_at)), originalY + footer + top + 67)
      .moveTo(originalX + left + 410 , originalY + footer + top + 77).lineTo(originalX + left + 551 , originalY + footer + top + 77).stroke()

      .font(textFont)
      .text('Desempleo' , originalX + left + 160 , originalY + footer + top + 81)
      .moveTo(originalX + left + 160 , originalY + footer + top + 91).lineTo(originalX + left + 301 , originalY + footer + top + 91).stroke()
      .font(textFont)
      .text(formatPercent(payroll.footer_ss_quotation.professional_contingency.type_percent_unemployment) + ' %', originalX + left + 408 + numberOffset(formatPercent(payroll.footer_ss_quotation.professional_contingency.type_percent_unemployment)), originalY + footer + top + 81)
      .font(textFont)
      .text(formatAmount(payroll.footer_ss_quotation.professional_contingency.company_input_unemployment), originalX + left + 497 +  numberOffset(formatAmount(payroll.footer_ss_quotation.professional_contingency.company_input_unemployment)), originalY + footer + top + 81)
      .moveTo(originalX + left + 410 , originalY + footer + top + 91).lineTo(originalX + left + 551 , originalY + footer + top + 91).stroke()

      .font(textFont)
      .text(formatAmount(payroll.footer_ss_quotation.professional_contingency.base), originalX + left + 353 + numberOffset(formatAmount(payroll.footer_ss_quotation.professional_contingency.base)), originalY + footer + top + 88)
      .moveTo(originalX + left + 310 , originalY + footer + top + 98).lineTo(originalX + left + 400 , originalY + footer + top + 98).stroke()

      .font(textFont)
      .text('Fromación profesional' , originalX + left + 160 , originalY + footer + top + 95)
      .moveTo(originalX + left + 160 , originalY + footer + top + 105).lineTo(originalX + left + 301 , originalY + footer + top + 105).stroke()
      .font(textFont)
      .text(formatPercent(payroll.footer_ss_quotation.professional_contingency.type_percent_professional_formation) + ' %', originalX + left + 408 + numberOffset(formatPercent(payroll.footer_ss_quotation.professional_contingency.type_percent_professional_formation)), originalY + footer + top + 95)
      .font(textFont)
      .text(formatAmount(payroll.footer_ss_quotation.professional_contingency.company_input_professional_formation), originalX + left + 497 +  numberOffset(formatAmount(payroll.footer_ss_quotation.professional_contingency.company_input_professional_formation)), originalY + footer + top + 95)
      .moveTo(originalX + left + 410 , originalY + footer + top + 105).lineTo(originalX + left + 551 , originalY + footer + top + 105).stroke()

      .font(textFont)
      .text('Fondo de Garantía Salarial' , originalX + left + 160 , originalY + footer + top + 109)
      .moveTo(originalX + left + 160 , originalY + footer + top + 119).lineTo(originalX + left + 301 , originalY + footer + top + 119).stroke()
      .font(textFont)
      .text(formatPercent(payroll.footer_ss_quotation.professional_contingency.type_percent_salary_warranty) + ' %', originalX + left + 408 + numberOffset(formatPercent(payroll.footer_ss_quotation.professional_contingency.type_percent_salary_warranty)), originalY + footer + top + 109)
      .font(textFont)
      .text(formatAmount(payroll.footer_ss_quotation.professional_contingency.company_input_salary_warranty), originalX + left + 497 +  numberOffset(formatAmount(payroll.footer_ss_quotation.professional_contingency.company_input_salary_warranty)), originalY + footer + top + 109)
      .moveTo(originalX + left + 410 , originalY + footer + top + 119).lineTo(originalX + left + 551 , originalY + footer + top + 119).stroke()

      .font(textFont)
      .text('3. Cotización adicional por horas extraordinarias' , originalX + left + 5 , originalY + footer + top + 123)
      .font(textFont)
      .text('Fuerza mayor' , originalX + left + 160 , originalY + footer + top + 137)
      .text(formatAmount(payroll.footer_ss_quotation.aditional_quotation.base_overwhelming_force), originalX + left + 353 + numberOffset(formatAmount(payroll.footer_ss_quotation.aditional_quotation.base_overwhelming_force)), originalY + footer + top + 137)
      .text(formatAmount(payroll.footer_ss_quotation.aditional_quotation.company_input_overwhelming_force), originalX + left + 497 +  numberOffset(formatAmount(payroll.footer_ss_quotation.aditional_quotation.company_input_overwhelming_force)), originalY + footer + top + 137)
      .moveTo(originalX + left + 160 , originalY + footer + top + 147).lineTo(originalX + left + 400 , originalY + footer + top + 147).stroke()
      .moveTo(originalX + left + 410 , originalY + footer + top + 147).lineTo(originalX + left + 551 , originalY + footer + top + 147).stroke()

      .font(textFont)
      .text('No estructurales' , originalX + left + 160 , originalY + footer + top + 151)
      .text(formatAmount(payroll.footer_ss_quotation.aditional_quotation.base_non_structural), originalX + left + 353 + numberOffset(formatAmount(payroll.footer_ss_quotation.aditional_quotation.base_non_structural)), originalY + footer + top + 151)
      .text(formatAmount(payroll.footer_ss_quotation.aditional_quotation.company_input_non_structural), originalX + left + 497 +  numberOffset(formatAmount(payroll.footer_ss_quotation.aditional_quotation.company_input_non_structural)), originalY + footer + top + 151)
      .moveTo(originalX + left + 160 , originalY + footer + top + 161).lineTo(originalX + left + 400 , originalY + footer + top + 161).stroke()
      .moveTo(originalX + left + 410 , originalY + footer + top + 161).lineTo(originalX + left + 551 , originalY + footer + top + 161).stroke()

      .font(textFont)
      .text('4. Base sujeta a retención del IRPF' , originalX + left + 5 , originalY + footer + top + 165)
      .text(formatAmount(payroll.footer_ss_quotation.base_irpf), originalX + left + 353 + numberOffset(formatAmount(payroll.footer_ss_quotation.base_irpf)), originalY + footer + top + 165)
      .moveTo(originalX + left + 13 , originalY + footer + top + 175).lineTo(originalX + left + 400 , originalY + footer + top + 175).stroke()
      .lineWidth(1)
      .moveTo(originalX, originalY+footer).lineTo(originalX, originalY+footer+180).stroke()
      .moveTo(accrualWidth, originalY+footer).lineTo(accrualWidth, originalY+footer+180).stroke()
      .moveTo(originalX, originalY+footer+180).lineTo(accrualWidth, originalY+footer+180).stroke();
  }

  var newSignatureDate = function(){
    // -----------------------------------------------------------------------------------------------------------------
    // ------------------------------------------ SIGNATURE / DATE -----------------------------------------------------
    // -----------------------------------------------------------------------------------------------------------------
    signature = 488;
    paddingSignature = 15;
    paddingDate = 10;
    centerTableHeight = 509;

    pdf
      .fontSize(titleSize)
      .text('Firma y sello de la empresa' , originalX + 160 , originalY + signature)
      .image(payroll.signature_logo, originalX + 160, originalY + signature + paddingSignature, {scale: 0.06})

      .text(end_date,  originalX + 310 , originalY + signature)
      .fontSize(titleSize)
      .text('RECIBÍ' , originalX + 310 , originalY + signature + paddingDate)

      .lineWidth(1)
      .moveTo(originalXCenterTable, originalYCenterTable).lineTo(originalXCenterTable, originalYCenterTable + centerTableHeight).stroke()                //Vertical left line
      .moveTo(accrualWidth, originalYCenterTable).lineTo(accrualWidth, originalYCenterTable + centerTableHeight).stroke()                                //Vertical right line
      .moveTo(originalXCenterTable, originalYCenterTable + centerTableHeight).lineTo(accrualWidth, originalYCenterTable + centerTableHeight).stroke();   //Horizontal bottom line
  }


  newHearderTittle();
  newEnterpriseBox();
  newEmployeeBox();
  newSettlementBox();

  // -----------------------------------------------------------------------------------------------------------------
  // --------------------------------------------- ACCRUAL -----------------------------------------------------------
  // -----------------------------------------------------------------------------------------------------------------
  y = settlementY+19;
  accrualY = settlementY+10;
  accrualX = x + left;
  accrualWidth = x + pdfWidth + 100;
  originalXCenterTable = x;
  originalYCenterTable = y;
  paddingTopLine = 8;
  paddingTopTT = 11;
  paddingLeftValue = 333;
  paddingLeftTotal = 503;

  pdf
    .moveTo(x, y).lineTo(accrualWidth, y).stroke()
    .font(headingFont)
    .text('I. DEVENGOS' , accrualX , accrualY = accrualY + paddingTopTL)
    .text('TOTALES', accrualX + paddingLeftTotal, accrualY)

    .font(textFont)
    .text('1. Percepciones salariales' , accrualX + paddingLeft1 , accrualY = accrualY + paddingTopTL);

    for(var i=0; i<payroll.accruals.salary_perception.perceptions.length; i++){
      pdf
        .text(payroll.accruals.salary_perception.perceptions[i].expression , accrualX + paddingLeft2,  accrualY = accrualY + paddingTopTT)
        .text(formatAmount(payroll.accruals.salary_perception.perceptions[i].value) , accrualX + paddingLeftValue + numberOffset(formatAmount(payroll.accruals.salary_perception.perceptions[i].value)) , accrualY)
        .lineWidth(0.1)
        .moveTo(accrualX + paddingLeft2, accrualY + paddingTopLine).lineTo(accrualX + 376, accrualY + paddingTopLine).stroke();
    }

  pdf
    .text('Complementos salariales' , accrualX + paddingLeft2, accrualY = accrualY + paddingTopTL);

    for(var i=0; i<payroll.accruals.salary_perception.salary_complements.length; i++){
      pdf
        .text(payroll.accruals.salary_perception.salary_complements[i].expression ,accrualX + paddingLeft3, accrualY = accrualY + paddingTopTT)
        .text(formatAmount(payroll.accruals.salary_perception.salary_complements[i].value) , accrualX + paddingLeftValue + numberOffset(formatAmount(payroll.accruals.salary_perception.salary_complements[i].value)), accrualY)
        .moveTo(x + left + 20, accrualY + paddingTopLine).lineTo(accrualX + 376, accrualY + paddingTopLine).stroke();
    }

  pdf
    .text('Horas extraordinarias' , accrualX + paddingLeft2, accrualY = accrualY + paddingTopTL)
    .text(formatAmount(payroll.accruals.salary_perception.extra_hours) , accrualX + paddingLeftValue + numberOffset(formatAmount(payroll.accruals.salary_perception.extra_hours)), accrualY)
    .moveTo(accrualX + paddingLeft2, accrualY + paddingTopLine).lineTo(accrualX + 376, accrualY + paddingTopLine).stroke()

    .text('Gratificaciones extraordinarias' , accrualX + paddingLeft2, accrualY = accrualY + paddingTopTL)
    .text(formatAmount(payroll.accruals.salary_perception.extra_perks) , accrualX + paddingLeftValue + numberOffset(formatAmount(payroll.accruals.salary_perception.extra_perks)), accrualY)
    .moveTo(accrualX + paddingLeft2, accrualY + paddingTopLine).lineTo(accrualX + 376, accrualY + paddingTopLine).stroke()

    .text('Salario en especie' , accrualX + paddingLeft2, accrualY = accrualY + paddingTopTL)
    .text(formatAmount(payroll.accruals.salary_perception.salary_spice) , accrualX + paddingLeftValue + numberOffset(formatAmount(payroll.accruals.salary_perception.salary_spice)), accrualY)
    .moveTo(accrualX + paddingLeft2, accrualY + paddingTopLine).lineTo(accrualX + 376, accrualY + paddingTopLine).stroke()

    .text('2. Percepciones no salariales' , accrualX + paddingLeft1 , accrualY = accrualY + paddingTopTL)

    .text('Indemnizaciones o suplidos' , accrualX + paddingLeft2, accrualY = accrualY + paddingTopTT);

    for(var i=0; i<payroll.accruals.non_salary_perception.compensations.length; i++){
      pdf
        .text(payroll.accruals.non_salary_perception.compensations[i].expression , accrualX + paddingLeft3, accrualY = accrualY + paddingTopTT)
        .text(formatAmount(payroll.accruals.non_salary_perception.compensations[i].value) , accrualX + paddingLeftValue + numberOffset(formatAmount(payroll.accruals.non_salary_perception.compensations[i].value)), accrualY)
        .moveTo(accrualX + paddingLeft3, accrualY + paddingTopLine).lineTo(accrualX + 376, accrualY + paddingTopLine).stroke();
    }
    if(payroll.accruals.non_salary_perception.compensations.length == 0){
      pdf
        .moveTo(accrualX + paddingLeft2, accrualY + paddingTopLine).lineTo(accrualX + 376, accrualY + paddingTopLine).stroke();
    }

  pdf
    .text('Prestaciones e indemnizaciones a la Seguridad Social' , accrualX + paddingLeft2, accrualY = accrualY + paddingTopTL);

    for(var i=0; i<payroll.accruals.non_salary_perception.compensations_SS.length; i++){
      pdf
      .text(payroll.accruals.non_salary_perception.compensations_SS[i].expression , accrualX + paddingLeft3, accrualY = accrualY + paddingTopTT)
      .text(formatAmount(payroll.accruals.non_salary_perception.compensations_SS[i].value) , accrualX + paddingLeftValue + numberOffset(formatAmount(payroll.accruals.non_salary_perception.compensations_SS[i].value)), accrualY)
      .moveTo(accrualX + paddingLeft3, accrualY + paddingTopLine).lineTo(accrualX + 376, accrualY + paddingTopLine).stroke();
    }
    if(payroll.accruals.non_salary_perception.compensations_SS.length == 0){
      pdf
      .moveTo(accrualX + paddingLeft2, accrualY + paddingTopLine).lineTo(accrualX + 376, accrualY + paddingTopLine).stroke();
    }

  pdf
    .text('Otras percepciones no salariales' , accrualX + paddingLeft2, accrualY = accrualY + paddingTopTL);

    for(var i=0; i<payroll.accruals.non_salary_perception.other_perceptions.length; i++){
      pdf
      .text(payroll.accruals.non_salary_perception.other_perceptions[i].expression , accrualX + paddingLeft3, accrualY = accrualY + paddingTopTT)
      .text(formatAmount(payroll.accruals.non_salary_perception.other_perceptions[i].value) , accrualX + paddingLeftValue + numberOffset(formatAmount(payroll.accruals.non_salary_perception.other_perceptions[i].value)), accrualY)
      .moveTo(accrualX + paddingLeft3, accrualY + paddingTopLine).lineTo(accrualX + 376, accrualY + paddingTopLine).stroke();
    }
    if(payroll.accruals.non_salary_perception.other_perceptions.length == 0){
      pdf
      .moveTo(accrualX + paddingLeft2, accrualY + paddingTopLine).lineTo(accrualX + 376, accrualY + paddingTopLine).stroke();
    }

  pdf
    .fontSize(titleSize)
    .font(titleFont)
    .text('A. TOTAL DEVENGADO' , accrualX + 150 , accrualY = accrualY + paddingTopTL)
    .font(textFont)
    .text(formatAmount(4800.53) , accrualX + paddingLeftTotal + numberOffset(formatAmount(4800.53)), accrualY)
    .moveTo(accrualX + 150 , accrualY + paddingTopLine).lineTo(accrualX + 545 , accrualY + paddingTopLine).stroke();


  // -----------------------------------------------------------------------------------------------------------------
  // --------------------------------------------- DEDUCTION ---------------------------------------------------------
  // -----------------------------------------------------------------------------------------------------------------
  y = accrualY + 15;
  deductionY = accrualY + 15;
  deductionOY = deductionY;
  deductionX = x + left;
  paddingLeftPercent = 250;

  if(deductionOY <= 353.304){
    pdf
      .font(headingFont)
      .text('II. DEDUCCIONES', deductionX, deductionY)
      .font(textFont)
      .text('1. Aportaciones del trabajador a las cotizaciones de la Seguridad Social y conceptos de recaudación' , deductionX + paddingLeft1, deductionY = deductionY + paddingTopTL)

      .text('Contigencias comunes' , deductionX + paddingLeft2, deductionY = deductionY + paddingTopTT)
      .text(formatPercent(  payroll.deductions.employee_contributions.common_contingency.percent) + ' %' , accrualX + paddingLeftPercent + numberOffset(formatPercent(  payroll.deductions.employee_contributions.common_contingency.percent)), deductionY)
      .text(formatAmount(payroll.deductions.employee_contributions.common_contingency.value), accrualX + paddingLeftValue + numberOffset(formatAmount(payroll.deductions.employee_contributions.common_contingency.value)), deductionY)
      .moveTo(deductionX + paddingLeft2, deductionY + paddingTopLine).lineTo(deductionX + 376, deductionY + paddingTopLine).stroke()

      .text('Desempleos' , deductionX + paddingLeft2, deductionY = deductionY + paddingTopTL)
      .text(formatPercent(payroll.deductions.employee_contributions.unemployment.percent) + ' %' , accrualX + paddingLeftPercent + numberOffset(formatPercent(payroll.deductions.employee_contributions.unemployment.percent)), deductionY)
      .text(formatAmount(payroll.deductions.employee_contributions.unemployment.value), accrualX + paddingLeftValue + numberOffset(formatAmount(payroll.deductions.employee_contributions.unemployment.value)), deductionY)
      .moveTo(deductionX + paddingLeft2, deductionY + paddingTopLine).lineTo(deductionX + 376, deductionY + paddingTopLine).stroke()

      .text('Formación profsional' , deductionX + paddingLeft2, deductionY = deductionY + paddingTopTL)
      .text(formatPercent(payroll.deductions.employee_contributions.professional_training.percent) + ' %' , accrualX + paddingLeftPercent + numberOffset(formatPercent(payroll.deductions.employee_contributions.professional_training.percent)), deductionY)
      .text(formatAmount(payroll.deductions.employee_contributions.professional_training.value), accrualX + paddingLeftValue + numberOffset(formatAmount(payroll.deductions.employee_contributions.professional_training.value)), deductionY)
      .moveTo(deductionX + paddingLeft2, deductionY + paddingTopLine).lineTo(deductionX + 376, deductionY + paddingTopLine).stroke()

      .text('Horas extraordinarias' , deductionX + paddingLeft2, deductionY = deductionY + paddingTopTL)
      .text('Fuerza mayor o estructurales' , deductionX + paddingLeft3, deductionY = deductionY + paddingTopTT)
      .text(formatPercent(payroll.deductions.employee_contributions.extra_hours_e.percent) + ' %' , accrualX + paddingLeftPercent + numberOffset(formatPercent(payroll.deductions.employee_contributions.extra_hours_e.percent)), deductionY)
      .text(formatAmount(payroll.deductions.employee_contributions.extra_hours_e.value), accrualX + paddingLeftValue + numberOffset(formatAmount(payroll.deductions.employee_contributions.extra_hours_e.value)), deductionY)
      .moveTo(deductionX + paddingLeft3, deductionY + paddingTopLine).lineTo(deductionX + 376, deductionY + paddingTopLine).stroke()

      .text('No estructurales' , deductionX + paddingLeft3, deductionY = deductionY + paddingTopTL)
      .text(formatPercent(payroll.deductions.employee_contributions.extra_hours_ne.percent) + ' %' , accrualX + paddingLeftPercent + numberOffset(formatPercent(payroll.deductions.employee_contributions.extra_hours_ne.percent)), deductionY)
      .text(formatAmount(payroll.deductions.employee_contributions.extra_hours_ne.value), accrualX + paddingLeftValue + numberOffset(formatAmount(payroll.deductions.employee_contributions.extra_hours_ne.value)), deductionY)
      .moveTo(deductionX + paddingLeft3, deductionY + paddingTopLine).lineTo(deductionX + 376, deductionY + paddingTopLine).stroke()

      .text('TOTAL APORTACIONES' , deductionX + paddingLeft2, deductionY = deductionY + paddingTopTL)
      .text(formatAmount(payroll.deductions.employee_contributions.total_contributions), accrualX + paddingLeftValue + numberOffset(formatAmount(payroll.deductions.employee_contributions.total_contributions)), deductionY)
      .moveTo(deductionX + paddingLeft2, deductionY + paddingTopLine).lineTo(deductionX + 376, deductionY + paddingTopLine).stroke()

      .text('2. Impuestos sobre la renta de personas físicas' , deductionX + paddingLeft1, deductionY = deductionY + paddingTopTL)
      .text(formatPercent(payroll.deductions.taxes.percent) + ' %' , accrualX + paddingLeftPercent + numberOffset(formatPercent(payroll.deductions.taxes.percent)), deductionY)
      .text(formatAmount(payroll.deductions.taxes.value), accrualX + paddingLeftValue + numberOffset(formatAmount(payroll.deductions.taxes.value)), deductionY)
      .moveTo(deductionX + paddingLeft1, deductionY + paddingTopLine).lineTo(deductionX + 376, deductionY + paddingTopLine).stroke()

      .text('3. Anticipos' , deductionX + paddingLeft1, deductionY = deductionY + paddingTopTL)
      .text(formatAmount(payroll.deductions.advance), accrualX + paddingLeftValue + numberOffset(formatAmount(payroll.deductions.advance)), deductionY)
      .moveTo(deductionX + paddingLeft1, deductionY + paddingTopLine).lineTo(deductionX + 376, deductionY + paddingTopLine).stroke()

      .text('4. Valor de los productos recibidos en especie' , deductionX + paddingLeft1, deductionY = deductionY + paddingTopTL)
      .text(formatAmount(payroll.deductions.species), accrualX + paddingLeftValue + numberOffset(formatAmount(payroll.deductions.species)), deductionY)
      .moveTo(deductionX + paddingLeft1, deductionY + paddingTopLine).lineTo(deductionX + 376, deductionY + paddingTopLine).stroke()

      .text('5. Otras deducciones' ,  deductionX + paddingLeft1, deductionY = deductionY + paddingTopTL)
      .text(formatAmount(payroll.deductions.other_deductions), accrualX + paddingLeftValue + numberOffset(formatAmount(payroll.deductions.other_deductions)), deductionY)
      .moveTo(deductionX + paddingLeft1, deductionY + paddingTopLine).lineTo(deductionX + 376, deductionY + paddingTopLine).stroke()

      .fontSize(titleSize)
      .font(titleFont)
      .text('B. TOTAL DEDUCIR' ,  deductionX + 150, deductionY = deductionY + paddingTopTL)
      .font(textFont)
      .text(formatAmount(payroll.deductions.total_deductions) , deductionX + paddingLeftTotal + numberOffset(formatAmount(payroll.deductions.total_deductions)), deductionY)
      .moveTo(deductionX + 150 , deductionY + paddingTopLine).lineTo(deductionX + 545 , deductionY + paddingTopLine).stroke()

      .fontSize(titleSize)
      .font(titleFont)
      .text('LÍQUIDO TOTAL A PERCIBIR (A-B)' , deductionX + 150, deductionY = deductionY + paddingTopTL)
      .font(textFont)
      .text(formatAmount(payroll.liquid_perceive) , deductionX + paddingLeftTotal + numberOffset(formatAmount(payroll.liquid_perceive)), deductionY)
      .moveTo(deductionX + 150 , deductionY + paddingTopLine).lineTo(deductionX + 545 , deductionY + paddingTopLine).stroke();
  }

  newSignatureDate();
  newFooterBox();

  if(deductionOY > 353.304){
    //NEW PAGE
    pdf.addPage();
    //PDF Styles
    var pdfWidth = pdf.page.width
       - pdf.page.margins.left
       - pdf.page.margins.right
    ;

    pdf.page.width = pdf.page.width + 60; //Ancho para que no haya salto de linea
    pdf.page.margins = {top: 50, bottom: 0, left: 72, right: 72}; //Margenes del documento

    newHearderTittle();
    newEnterpriseBox();
    newEmployeeBox();
    newSettlementBox();

    y = accrualY + 15;
    deductionY = originalYCenterTable + 10;
    deductionX = x + left;
    paddingLeftPercent = 250;

    pdf
      .moveTo(x, originalYCenterTable).lineTo(accrualWidth, originalYCenterTable).stroke()
      .font(headingFont)
      .text('II. DEDUCCIONES', deductionX, deductionY)
      .font(textFont)
      .text('1. Aportaciones del trabajador a las cotizaciones de la Seguridad Social y conceptos de recaudación' , deductionX + paddingLeft1, deductionY = deductionY + paddingTopTL)

      .text('Contigencias comunes' , deductionX + paddingLeft2, deductionY = deductionY + paddingTopTT)
      .text(formatPercent(0.047) + ' %' , accrualX + paddingLeftPercent + numberOffset(formatPercent(0.047)), deductionY)
      .text(formatAmount(55.84), accrualX + paddingLeftValue + numberOffset(formatAmount(55.84)), deductionY)
      .lineWidth(0.1)
      .moveTo(deductionX + paddingLeft2, deductionY + paddingTopLine).lineTo(deductionX + 376, deductionY + paddingTopLine).stroke()


      .text('Desempleos' , deductionX + paddingLeft2, deductionY = deductionY + paddingTopTL)
      .text(formatPercent(0.016) + ' %' , accrualX + paddingLeftPercent + numberOffset(formatPercent(0.016)), deductionY)
      .text(formatAmount(19.02), accrualX + paddingLeftValue + numberOffset(formatAmount(19.02)), deductionY)
      .moveTo(deductionX + paddingLeft2, deductionY + paddingTopLine).lineTo(deductionX + 376, deductionY + paddingTopLine).stroke()

      .text('Formación profsional' , deductionX + paddingLeft2, deductionY = deductionY + paddingTopTL)
      .text(formatPercent(0.01) + ' %' , accrualX + paddingLeftPercent + numberOffset(formatPercent(0.01)), deductionY)
      .text(formatAmount(1.19), accrualX + paddingLeftValue + numberOffset(formatAmount(1.19)), deductionY)
      .moveTo(deductionX + paddingLeft2, deductionY + paddingTopLine).lineTo(deductionX + 376, deductionY + paddingTopLine).stroke()

      .text('Horas extraordinarias' , deductionX + paddingLeft2, deductionY = deductionY + paddingTopTL)
      .text('Fuerza mayor o estructurales' , deductionX + paddingLeft3, deductionY = deductionY + paddingTopTT)
      .text(formatPercent(0) + ' %' , accrualX + paddingLeftPercent + numberOffset(formatPercent(0)), deductionY)
      .text(formatAmount(0), accrualX + paddingLeftValue + numberOffset(formatAmount(0)), deductionY)
      .moveTo(deductionX + paddingLeft3, deductionY + paddingTopLine).lineTo(deductionX + 376, deductionY + paddingTopLine).stroke()

      .text('No estructurales' , deductionX + paddingLeft3, deductionY = deductionY + paddingTopTL)
      .text(formatPercent(0) + ' %' , accrualX + paddingLeftPercent + numberOffset(formatPercent(0)), deductionY)
      .text(formatAmount(0), accrualX + paddingLeftValue + numberOffset(formatAmount(0)), deductionY)
      .moveTo(deductionX + paddingLeft3, deductionY + paddingTopLine).lineTo(deductionX + 376, deductionY + paddingTopLine).stroke()

      .text('TOTAL APORTACIONES' , deductionX + paddingLeft2, deductionY = deductionY + paddingTopTL)
      .text(formatAmount(76.04), accrualX + paddingLeftValue + numberOffset(formatAmount(76.04)), deductionY)
      .moveTo(deductionX + paddingLeft2, deductionY + paddingTopLine).lineTo(deductionX + 376, deductionY + paddingTopLine).stroke()

      .text('2. Impuestos sobre la renta de personas físicas' , deductionX + paddingLeft1, deductionY = deductionY + paddingTopTL)
      .text(formatPercent(0.05) + ' %' , accrualX + paddingLeftPercent + numberOffset(formatPercent(0.05)), deductionY)
      .text(formatAmount(59.1), accrualX + paddingLeftValue + numberOffset(formatAmount(59.1)), deductionY)
      .moveTo(deductionX + paddingLeft1, deductionY + paddingTopLine).lineTo(deductionX + 376, deductionY + paddingTopLine).stroke()

      .text('3. Anticipos' , deductionX + paddingLeft1, deductionY = deductionY + paddingTopTL)
      .text(formatAmount(0), accrualX + paddingLeftValue + numberOffset(formatAmount(0)), deductionY)
      .moveTo(deductionX + paddingLeft1, deductionY + paddingTopLine).lineTo(deductionX + 376, deductionY + paddingTopLine).stroke()

      .text('4. Valor de los productos recibidos en especie' , deductionX + paddingLeft1, deductionY = deductionY + paddingTopTL)
      .text(formatAmount(0), accrualX + paddingLeftValue + numberOffset(formatAmount(0)), deductionY)
      .moveTo(deductionX + paddingLeft1, deductionY + paddingTopLine).lineTo(deductionX + 376, deductionY + paddingTopLine).stroke()

      .text('5. Otras deducciones' ,  deductionX + paddingLeft1, deductionY = deductionY + paddingTopTL)
      .text(formatAmount(0), accrualX + paddingLeftValue + numberOffset(formatAmount(0)), deductionY)
      .moveTo(deductionX + paddingLeft1, deductionY + paddingTopLine).lineTo(deductionX + 376, deductionY + paddingTopLine).stroke()

      .fontSize(titleSize)
      .font(titleFont)
      .text('B. TOTAL DEDUCIR' ,  deductionX + 150, deductionY = deductionY + paddingTopTL)
      .font(textFont)
      .text(formatAmount(135.44) , deductionX + paddingLeftTotal + numberOffset(formatAmount(135.44)), deductionY)
      .moveTo(deductionX + 150 , deductionY + paddingTopLine).lineTo(deductionX + 545 , deductionY + paddingTopLine).stroke()

      .fontSize(titleSize)
      .font(titleFont)
      .text('LÍQUIDO TOTAL A PERCIBIR (A-B)' , deductionX + 150, deductionY = deductionY + paddingTopTL)
      .font(textFont)
      .text(formatAmount(1052.65) , deductionX + paddingLeftTotal + numberOffset(formatAmount(1052.65)), deductionY)
      .moveTo(deductionX + 150 , deductionY + paddingTopLine).lineTo(deductionX + 545 , deductionY + paddingTopLine).stroke();

    newSignatureDate();
    newFooterBox();
  }

  //End PDF
  pdf.end();

}

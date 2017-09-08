var PDF = require('pdfkit');
var WRITTEN_NUMBER = require('written-number');

module.exports.a3Letter = function (settlement, stream) {
  var pdf = new PDF();
  pdf.pipe(stream);

  var pdfWidth = pdf.page.width
  - pdf.page.margins.left
  - pdf.page.margins.right
  ;

  textSize = 12;
  titleSize = 18;
  headingSize = 14;

  pdf
  .fontSize(titleSize)
  .text('DOCUMENTO DE LIQUIDACIÓN Y FINIQUITO', { align: 'center'} )
  .moveDown(1)

  pdf
  .fontSize(headingSize)
  .text('DATOS DE LA EMPRESA')
  .moveDown(1)

  y = pdf.y;
  x = pdf.x;
  top = 3;
  left = 4;

  width = pdfWidth * 4/7;
  pdf
  .moveTo(x,o=y).lineTo(x+pdfWidth, y).stroke()
  .text('EMPRESA: ' , x + left , y + top , {continued: true})
  .text(settlement.enterprise.name)
  .text('N.I.F.: ', x + width + left, y + top , {continued: true})
  .text(settlement.enterprise.cif)
  .moveTo(x, y = pdf.y).lineTo(x+pdfWidth, y).stroke()

  .text('DOMICILIO:', x + left, y + top)
  .text('LOCALIDAD:',x + width  + left, y + top)
  .moveTo(x, y = pdf.y).lineTo(x+pdfWidth, y).stroke()

  .moveTo(x,o).lineTo(x,y).stroke()
  .moveTo(x+width,o).lineTo(x+width,y).stroke()
  .moveTo(x+pdfWidth,o).lineTo(x+pdfWidth,y).stroke()

  .moveDown(1)


  pdf
  .fontSize(headingSize)
  .text('DATOS DEL TRABAJADOR', x, y = pdf.y)

  pdf.end();

}

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
        + options.top
        pdf.image(image, this.x[col], y , options);
        return this;
      }

    }


    letter.image( 0, 0,settlement.logo, {width: 100});

    var row;
    letter
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
    .text(0,row+=1, WRITTEN_NUMBER( integer, {lang: 'es'}).toUpperCase()
    + (decimal ? " CON " + WRITTEN_NUMBER( decimal * 100, {lang: 'es'}).toUpperCase() :"" )
    + " euros" )
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

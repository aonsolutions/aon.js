var SQL = require("sql");
SQL.setDialect("mysql");
var PDF = require('pdfkit');
var DATABASE = require("./database");
var MASTER = require("./master")(SQL);


module.exports.letter = function (settlement, stream) {

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
        var y =
        pdf.page.margins.top
        + row
        * pdf.currentLineHeight(true);
        options = options || {};
        for (var attr in this.options[col])
          options[attr] = this.options[col][attr];
        pdf.text(text,
          this.x[col],
          y,
          options);
        return this;
      },
      line : function (col, row, options)  {
        var y =
        pdf.page.margins.top
        + row * pdf.currentLineHeight(true);

        options = options || {indent:0};
        pdf
        .moveTo(this.x[col] + options.indent,y)
        .lineTo(this.x[col] + this.options[col].width,y)
        ;
        if ( options.dash )
          pdf.dash(options.dash);
        else
          pdf.undash();

        pdf.stroke()
        ;
        return this;
      }

    }

    letter
    .text(0,0, '- FINIQUITO a favor del trabajador:')
    .text(0,2, settlement.employee.fullname ).text(1,2, 'N.I.F:' + settlement.employee.nif )
    .text(0,4, 'que causa baja en la empresa:' )
    .text(0,6, settlement.enterprise.name ).text(1,6, 'N.I.F:' + settlement.enterprise.cif)
    .text(0,8, 'con ' + settlement.date )
    .text(0,10,'según el siguiente desglose:')
    ;

    letter
    .text(0,12,'CONCEPTO',{indent:25}).text(1,12,'IMPORTE',{align:'right'})
    ;
    var row = 12;
    for ( i = 0 ; i < settlement.payments.length; i++ ) {
      row += 1;
      var payment = settlement.payments[i];
      letter.text(0, row, payment.description,{indent:25}).text(1, row,payment.amount,{align:'right'});
    }
    row += 2;
    letter
    .text(0,row,'TOTAL',{indent:25})
    .line(0,row+1, {indent:25, dash:1}).line(1,row)
    ;

    row += 2;
    letter
    .text(0,row,'DEDUCCIONES',{indent:25}).text(1,row,'IMPORTE',{align:'right'})
    ;
    for ( i = 0 ; i < settlement.deductions.length; i++ ) {
      row +=1;
      var deduction = settlement.deductions[i];
      letter.text(0, row, deduction.description,{indent:25}).text(1, row, deduction.amount,{align:'right'});
    }
    row += 2;
    letter
    .text(0,row,'TOTAL',{indent:25})
    .line(0,row+1, {indent:25, dash:1}).line(1,row)
    ;
    row += 2;
    letter
    .text(0,row,'LÍQUIDO',{indent:25})
    .line(0,row+1, {indent:25, dash:1}).line(1,row)
    ;

    // cols[0].text('- FINIQUITO a favor del trabajador:')
    // letter
    // .text('- FINIQUITO a favor del trabajador:' ,cols[0].x(), cols[0].y(), cols[0].options())
    // .moveDown(1)
    // .text( settlement.employee.fullname, cols[0])
    // .moveDown(1)
    // .text('que causa baja en la empresa:', cols[0])
    // .moveDown(1)
    // .text( settlement.enterprise.name, cols[0])
    // .moveDown(1)
    // .text('con ' + settlement.date, cols[0])
    // .moveDown(1)
    // letter.text('según el siguiente desglose:')
    // .moveDown(1)
    // .text('CONCEPTO', cols[0])
    // ;
    //
    // for ( payment of settlement.payments ) {
    //   letter
    //   .text(payment.description, cols[0])
    // }
    // letter.moveDown(1);
    //
    // letter
    // .text('TOTAL', cols[0])
    // .moveDown(1)
    // .text('DEDUCCIONES', cols[0])
    // .moveDown(1)
    // .text('TOTAL', cols[0])
    // ;
    //
    //
    //
    // letter
    // .text('-- o --', {align:'center'})
    // .moveDown(1)
    // .text('como saldo a mi favor, segun liquidación precedente,\
    //  considerandome totalmente remunerado hasta el día de fecha que \
    //  causo baja sin tener derecho a ninguna reclamación posterior, y \
    //  dando por finiquitado mi contrato con la citada Empresa.')
    // .moveDown(1)
    // .text('NO EXISTE REPRESENTACIÓN LEGAL DE LOS TRABAJADORES')
    // .moveDown(1)
    // .text('RECIBÍ:' , {align: 'center'} );



    pdf.end();
};

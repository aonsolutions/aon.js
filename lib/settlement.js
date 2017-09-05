var SQL = require("sql");
SQL.setDialect("mysql");
var PDF = require('pdfkit');
var DATABASE = require("./database");
var MASTER = require("./master")(SQL);


module.exports.letter = function (settlement, stream) {

    var letter = new PDF();
    letter.pipe(stream);


    var  = {
      width = letter.page.width
      - letter.page.margins.left
      - letter.page.margins.right
      ;

      cols = [
        {
          x: letter.page.margins.left
        },
        {
          x: letter.page.margins.left * width * 2.00 /3
        }
      ],
      text : function ( col, text )  {
        letter.text(text, cols[0].x);
        return this;
      },
      newline : function() {
        letter.moveDown();
        return this;
      }
    }


    cols[0].text('- FINIQUITO a favor del trabajador:')

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



    letter.end();
};

var AON = require("..");

AON.settlement.letter({
  date: '04/06/2016',
  enterprise: {
    cif: 'B01487271',
    name : 'AON SOLUTIONS, SL'
  },
  employee: {
    nif: '16302727M',
    fullname : 'FERNANDEZ CORDOBA, MARTA'
  },
  payments: [
    {
      amount : 596.71,
      description: 'INDEMNIZACIÓN POR FIN DE CONTRATO TEMPORAL'
    }
  ],
  deductions: [
    
  ]
}, process.stdout );

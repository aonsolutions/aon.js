var AON = require("..");

AON.settlement.letter({
  date: '',
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
  ]
}, process.stdout );

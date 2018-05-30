var fs = require('fs');
var payroll = require('../lib/payroll');

payrollJSON = {
  enterprise : {
    name : 'PRUEBAS LABORAL',
    address : 'Calle Duque de Wellington, 52 (01010)', //Calle, numero, cp
    locality : 'Vitoria-Gasteiz',
    cif : '5859585859M',
    ccc : 0202020202020202
  },
  employee : {
    fullname : 'VALDEPEÑAS DEL POZO, SERGIO',
    nif : '47227931-F',
    ss : 011004767999,
    professional_group : 'Director',
    quote_group : '01',
    seniority_date : '01/07/2010',
  },
  settlement : {
    start_date : '01/04/2016',
    end_date : '30/04/2016',
    total_days: 30
  },
  accruals : {
    salary_perception : {
      perceptions : [
          {
            expression : "Salario base",
            value : 1233
          },
          {
            expression : "Salario base 1",
            value : 12334
          },
          {
            expression : "Salario base 2",
            value : 123345
          },
          {
            expression : "Salario base 3",
            value : 1233456
          },
          {
            expression : "Salario base 4",
            value : 1233456
          },
          {
            expression : "Salario base 5",
            value : 1233456
          },
          {
            expression : "Salario base 6",
            value : 1233456
          }
      ],
      salary_complements : [
        {
          expression : "Plus convenio",
          value : 400
        }
      ],
      extra_hours : 200,
      extra_perks : 40,
      salary_spice : 89
    },
    non_salary_perception : {
      compensations : [],
      compensations_SS : [],
      other_perceptions : [
        {
          expression : "Percepción 1",
          value : 1
        }
      ]
    },
    total_accrual : 4800.53
  },
  deductions : {
    employee_contributions : {
      common_contingency : {
        percent : 4.7,
        value : 55.84
      },
      unemployment : {
        percent : 1.6,
        value : 19.02
      },
      professional_training : {
        percent : 1,
        value : 1.19
      },
      extra_hours_e : {
        percent : 0,
        value : 0
      },
      extra_hours_ne : {
        percent : 0,
        value : 0
      },
      total_contributions : 76.04
    },
    taxes : {
      percent : 5,
      value : 59.1
    },
    advance : 0,
    species : 0,
    other_deductions : 0,
    total_deductions : 135.44
  },
  liquid_perceive : 1052.65,
  signature_logo : '/Users/sergio/Desktop/aon.png',
  footer_ss_quotation : {
    common_contingency : {
      monthly_remuneration : 1188.09,
      extraordinary_pay_packet : 408.56,
      base : 1188.09,
      type_percent : 23.6,
      company_input : 280.39
    },
    professional_contingency : {
      base : 1188.09,
      type_percent_at : 1.35,
      company_input_at : 16.04,
      type_percent_unemployment : 6.7,
      company_input_unemployment : 79.6,
      type_percent_professional_formation : 0.6,
      company_input_professional_formation : 7.13,
      type_percent_salary_warranty : 0.2,
      company_input_salary_warranty : 2.38
    },
    aditional_quotation : {
      base_overwhelming_force : 458.78,
      company_input_overwhelming_force : 0,
      base_non_structural : 58.79,
      company_input_non_structural : 0
    },
    base_irpf : 1188.06
  }
};

payroll.spanishPayroll(payrollJSON, process.stdout);

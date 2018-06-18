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
  accruals : [
    {
      accrual_name : "1. Percepciones salariales",
      types : [
        {
          type_expression : "Salario base anual",
          type_value : 295.9
        }
      ]
    },
    {
      accrual_name : "4. Pagas extraordinarias prorrateo",
      types : [
        {
          type_expression : "Paga extraordinaria Junio",
          type_value : 24.66
        },
        {
          type_expression : "Paga extraordinaria Navidad",
          type_value : 24.66
        }
      ]
    }
  ],
  total_accrual : 345.21,
  deductions : [
    {
      name : "Contingencias comunes",
      percent : 4.7,
      value : 16.77
    },
    {
      name : "Desempleo",
      percent : 1.55,
      value : 5.53
    },
    {
      name : "Formación profesional",
      percent : 0.1,
      value : 0.36
    },
    {
      name : "Fuerza mayor o estructurales (HE)",
      percent: 0,
      value : 0
    },
    {
      name : "No estructurales (HE)",
      percent : 0,
      value : 0
    },
    {
      name : "Impuesto sobre la renta de personas físicas",
      percent : 0,
      value : 0
    },
    {
      name : "Anticipos",
      percent : 0,
      value : 0
    },
    {
      name : "Valor de los productos recibidos en especie",
      percent : 0,
      value : 0
    },
    {
      name : "Otras deducciones",
      percent : 0,
      value : 0
    }
  ],
  total_contributions : 22.65,
  total_deductions : 22.65,
  liquid_perceive : 322.56,
  signature_logo : '/Users/sergio/Desktop/aon.png',
  footer_ss_quotation : {
    common_contingency : {
      monthly_remuneration : 345.21,
      extraordinary_pay_packet : 0,
      base : 356.72,
      type_percent : 23.6,
      company_input : 84.19
    },
    professional_contingency : {
      base : 356.72,
      type_percent_at : 1.35,
      company_input_at : 4.82,
      type_percent_unemployment : 5.5,
      company_input_unemployment : 19.62,
      type_percent_professional_formation : 0.6,
      company_input_professional_formation : 2.14,
      type_percent_salary_warranty : 0.2,
      company_input_salary_warranty : 0.71
    },
    aditional_quotation : {
      base_overwhelming_force : 0,
      company_input_overwhelming_force : 0,
      base_non_structural : 0,
      company_input_non_structural : 0
    },
    base_irpf : 345.21
  }
};

// payroll.standardPayroll(payrollJSON, process.stdout);
payroll.standardTwoColumnsPayroll(payrollJSON, process.stdout);
// payroll.salaryRecibeCRA(payrollJSON, process.stdout);
// payroll.salaryRecibe(payrollJSON, process.stdout);

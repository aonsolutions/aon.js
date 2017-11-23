var enumerado = require('./enum');

var DOCUMENT_TYPE = enumerado.defineEnum({
  NIF: {id: "01", name: "NIF"},
  NIF_IVA: {id: "02", name: "NIF-IVA"},
  PASSPORT: {id: "03", name: "PASAPORTE"},
  NIE: {id: "04", name: "NIE"},
  COMMUNITY_CARD: {id: "05", name: "CERTIFICADO DE RESIDENCIA"},
  OTHER: {id: "06", name: "OTRO DOCUMENTO PROBATORIO"},
  NOT_CENSUSED: {id: "07", name: "NO CENSADO"},
});
exports.DOCUMENT_TYPE = DOCUMENT_TYPE;

var INVOICE_TYPE = enumerado.defineEnum({
  F1:{value:"F1", description:"Factura"},
  F2:{value:"F2", description:"Factura Simplificada"},
  F3:{value:"F3", description:"Factura emitida en sustitución de facturas simplificadas, facturas y declaradas"},
  F4:{value:"F4", description:"Asiento resumen de facturas"},
  F5:{value:"F5", description:"Importaciones (DUA)"},
  F6:{value:"F6", description:"Justificantes contables"},
  R1:{value:"R1", description:"Factura Rectificativa (Error fundado en derecho y Art. 80 Uno Dos y Seis LIVA)"},
  R2:{value:"R2", description:"Factura Rectificativa (Art. 80.3 LIVA)"},
  R3:{value:"R3", description:"Factura Rectificativa (Art. 80.4 LIVA)"},
  R5:{value:"R5", description:"Factura Rectificativa (Resto)"},
  R4:{value:"R4", description:"Factura Rectificativa simplificada"},
});
exports.INVOICE_TYPE = INVOICE_TYPE;

var INVOICE_TRANSACTION_TYPE = enumerado.defineEnum({
  NATIONAL: {id: 0, name: "nacional"},
  INTRACOMMUNITY: {id: 1, name: "intracomunitario"},
  EXTRACOMMUNITY: {id: 2, name: "extracomunitario"},
  CAN_CEU_MEL: {id: 3, name: "CAN_CEU_MEL"},
  OTHER_ISP: {id: 4, name: "Otro ISP"}
});
exports.INVOICE_TRANSACTION_TYPE = INVOICE_TRANSACTION_TYPE;

var VAT_DEDUCTON_TYPE = enumerado.defineEnum({
  WITH_RIGHT: {id: 0, name: "con derecho a deducción"},
  WITHOUT_RIGHT: {id: 1, name: "sin derecho a deducción"},
  NON_TAXABLE: {id: 2, name: "no sujeto"},
}):
exports.VAT_DEDUCTION_TYPE = VAT_DEDUCTION_TYPE;

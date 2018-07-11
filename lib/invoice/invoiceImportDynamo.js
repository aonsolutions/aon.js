var sabbatic	= require('../sabbatic');
var invoice = require('../dynamo/invoice')
var PDFImage = require('pdf-image').PDFImage;
var fs = require('fs');

/**
 * INVOICE IMPORT DYNAMO EXPORTS FUNCTIONS
 */

module.exports.refreshSabbatic = refreshSabbatic;
module.exports.importInvoice = importInvoice;
module.exports.importOCR = importOCR;
module.exports.importSabbatic = importSabbatic;
module.exports.getInvoice = getInvoice;
module.exports.deleteInvoice = deleteInvoice;
module.exports.check = check;

/**
 * INVOICE IMPORT DYNAMO FUNCTIONS
 */

function importSabbatic(data, cb){
	sabbatic.login(data.sbUser,data.sbPassword, function(err, res){
		if(err) cb(err, null);
		var ret = false;
		for(var i = 0; i < data.files.length; i++){
			var fil = data.files[i];
			ret = i == data.files.length -1;
			if(fil.contentType.includes('image')){
				sbCreateInvoice(res.session_id, fil.base64, data.company, function(err1, res1){
					if(err1) cb(err1, null);
					else if(ret) cb(null, res1);
				});
			} else if(fil.contentType.includes('pdf')){
				pdf2img(fil.base64, function(err2, res2){
					if(err2) cb(err2, null);
					else {
						sbCreateInvoice(res.session_id, res2, data.company, function(err3, res3){
							if(err3) cb(err3, null);
							else if(ret) cb(null, res3);
						});
					}
				});
			}
		}
	});
}

function refreshSabbatic(data, cb){
	sabbatic.login(data.sbUser, data.sbPassword, function(err, res){
		invoice.getSabbaticPendingInvoices(function(err,data){
			var sbIds = [];
			for(var i = 0; i < data.Items.length; i++) {
				sbIds[i] = data.Items[i].number;
			}
			sabbatic.getReceipt(res.session_id, {expense_id: sbIds}, function(err, res){
				for(var j = 0 ; j < res.total_entities; j++){
					var r = res.entities_list[j];
					var data = {
						company: 'SABBATIC',
						number: r.expense_id,
						info: r
					}
					importInvoice(data, function(err, res){

					});
				}
			});
		})
	});
}

function importOCR(data, cb){
	if(data.files){
		for(var i = 0; i < data.files.length; i++){
			var fil = data.files[i];
			var data = {
				company: data.company,
				base64: fil.base64
			}
			createOCR(data, cb);
		}
	} else createOCR(data, cb)
}

function createOCR(data, cb){
	let key = data.company + '_' + Date.now() + makeId();
  var s3 = new AWS.S3();
  s3.client.putObject({
    Bucket: 'tedi-center-invoice-files',
    Key: key,
    Body: data.base64
  },function (resp) {

  });
	invoice.getLastNumber("OCR", function(err, ln){
		var num = ln && ln.ItemCannots && ln.Count > 0 ? ln.Items[0].number + 1 : 0;
		actualizeLastNumber("OCR", num);
		console.log("INVOICE -> " +   JSON.stringify(sbData, null, 2));
		invoice.createInvoice("OCR", num, {
			"company": data.company,
			"status": "Pendiente",
			"s3": key, 
		}, cb);
	});
}

function getInvoice(data, cb){
	if(data.company && (data.number || data.number == 0)){
		invoice.getInvoice(data, function(err, res){
			if(err) cb(err);
			cb(null, res.Item);
		});
	} else if(data.company){
		invoice.getInvoices(data, function(err, res){
			if(err) cb(err);
			cb(null, res.Items);
		});
	}
}

function deleteInvoice(data, cb){
	invoice.deleteInvoice(data, cb);
}

function importInvoice(data, cb){
	if("SABBATIC" == data.company){
		if(!isSbAccept(data.info.status.name)){
			actualizeSabbatic(data.info.company.vat_id, -1, data);
			return;
		}
		invoice.getInvoice(data, function(err,res0){
			var sb = res0;
      var sbData = sb2inv(data.info);
			if(sb && sb.Item && sb.Item.info.number){
        actualizeSabbatic(sb.Item.info.company, sb.Item.info.number, data);
        invoice.updateInvoice({company: sb.Item.info.company, number: sb.Item.info.number, info: sbData}, cb);
        return;
			}
      var company = sb && sb.Item ? sb.Item.info.company : sbData.receiver.document.document;
      invoice.getLastNumber(company, function(err, ln){
        var num = ln && ln.ItemCannots && ln.Count > 0 ? ln.Items[0].number + 1 : 0;
        actualizeSabbatic(company, num, data);
        actualizeLastNumber(company, num);
				console.log("INVOICE -> " +   JSON.stringify(sbData, null, 2));
        invoice.createInvoice(company, num, sbData, cb);
      });
		});
    return;
	}
	if(data.info){
		check(data.info, function(error, result){
			if(error) cb(error);
			else {
				if(data.number){
					invoice.updateInvoice(data, cb);
				}	else {
					invoice.getLastNumber(data.company, function(err, res){
						var num = res && res.Item ? res.Item.number + 1 : 0;
						actualizeLastNumber(data.company, num);
						invoice.createInvoice(data.company, num, data.info, cb);
					});
				}
			}
		});
	}
}

function isSbAccept(status){
	return "digitalizado" == status || "aprobado" == status || "confirmado" == status;
}

function actualizeLastNumber(company, number){
  var lastNumber = {
    company: company + '-LAST',
    number: number
  }

  if(number > 0){
    invoice.deleteLastNumber(lastNumber, function(err, res){});
  }
  invoice.createLastNumber(lastNumber, function(err, res){});
}

function actualizeSabbatic(company, number, data){
  var sb = {
    company: data.company,
    number: data.number,
    info: {
      company: company,
      number: number,
      status: data.info.status.name
    }
  }
	invoice.createInvoice(data.company, data.number, sb.info, function(err, res){});
}

function sbCreateInvoice(sbSession, base, company, cb){
	sabbatic.createReceipt(sbSession, base, company, function(error, r){
		if(error) console.log(error);
		console.log(r);
		console.log('SB CREATE INVOICE -> ' +  r.expense_id);
		invoice.createInvoice("SABBATIC", r.expense_id, {
			"company": company,
			"status": "Enviado"
		}, cb);
	});
}

// IMAGE UTILS

function encode(file){
  var bitmap = fs.readFileSync(file);
  return new Buffer(bitmap).toString('base64');
}

function decode(base, file){
  var bitmap = new Buffer(base, 'base64');
  fs.writeFileSync(file, bitmap);
}

function pdf2img(base64, callback){
  var f = "/tmp/" + makeId() + ".pdf";
  decode(base64, f);
  var pdfImage = new PDFImage(f);
  pdfImage.convertPage(0).then(function (imagePath) {
    var imgBase64 = encode(imagePath);
    fs.unlinkSync(f);
    fs.unlinkSync(imagePath);
		callback(null, imgBase64);
  });
}

function makeId() {
  var text = "";
  var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  for (var i = 0; i < 5; i++)
    text += possible.charAt(Math.floor(Math.random() * possible.length));
  return text;
}

function sb2inv(data){
  var inv = {
    "reference":  data.invoice_number,
    "sender": {
      "document":{
        "document": data.supplier.vat_id,
        "type": {
          "id": "01",
          "name": "NIF"
        },
        "country": "ES"
      },
      "name":  data.supplier.name,
      "address" : {
        "address" : data.supplier.address,
        "city":  data.supplier.city,
        "province": data.supplier.province,
        "zip": data.supplier.postal_code,
        "country": data.supplier.country
      }
    },
    "receiver": {
      "document":{
        "document": data.company.vat_id,
        "type": {
          "id": "01",
          "name": "NIF"
          },
        "country": "ES"
      },
      "name": data.company.name,
      "address" : {
        "address" : data.company.address,
        "city": data.company.city,
        "province": data.company.province,

        "zip": data.company.postal_code,
        "country": data.company.country
        }
    },
    "date": data.expense_date,
    "type":{
      "value":"F1",
      "description": "Factura",
      "type": "gasto"
    },
    "comments": data.title,
    "remarks": data.notes,
    "transaction": "NATIONAL",
    "investment": false,
    "service": false,
    "surcharge": false,
    "vat_accrual_payment": false,
		"taxable_base": data.total && data.tax_retention_import ? data.total - data.tax_retention_import : 0.0,
    "total": data.total,

		"bank_accounts": data.bank_accounts,

	  "sabbatic": {
      "id": data.expense_id,
      "status": data.status.name
    }
  };

  if(data.taxes && data.taxes.length > 0){
    var t = [];
    for (var i = 0; i < data.taxes.length; i++){
      t[i] = {
        "type": "VAT",
        "base": data.taxes[i].net_price,
        "percentage": data.taxes[i].tax_percent,
        "quota": data.taxes[i].tax_amount
      }
    }
    inv.taxes = t;
  }
  return inv;
}

function check(data, callback){
  var sender = checkRegistry(data.sender);
  var receiver = checkRegistry(data.receiver);
  var type = checkType(data.type);
  if(!data.reference) callback(new Error("No tiene referencia")); // TODO
  else if(!sender) callback(new Error("No tiene emisor")); // TODO
	else if(!receiver) callback(new Error("No tiene receptor")); // TODO
	else if(!type) callback(new Error("No tiene tipo"));
  else {
	   var inv = {
       "reference": data.reference,
       "sender": sender,
       "receiver":receiver,
       "date": data.date || new Date(),
       "type": type,
       "description": data.description || "",
       "comments": data.comments || "",
       "transaction": data.transaction || "NATIONAL",
       "investment": data.investment || false,
       "service": data.service || false,
       "surcharge": data.surcharge || false,
       "vat_accrual_payment": data.vat_accrual_payment || false,
		   "taxable_base": data.taxable_base || 0.0,
       "total": data.total,
		   "bank_accounts": data.bank_accounts
     };
     callback(null, inv);
   }
}

function checkRegistry(data){
  if(!data.document) return false;
	if(!data.document.document) return false;
	if(!data.type) data.type = {};
	var reg = {
		"document": {
			"document":data.document.document,
			"type":{
				"id": data.document.type.id || "01",
				"name":data.document.type.name || "NIF"
			},
			"country": data.document.country || "ES"
		},
		"name": data.name,
		"address": data.address
	};
	return reg;
}

function checkType(data){
	if(!data.type) return false;
	var type = {
		"value": data.value || "F1",
		"description": data.name || "Factura",
		"type": data.type
	};
	return type;
}

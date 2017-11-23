var sabbatic	= require('../sabbatic');
var enums = require('../enum/InvoiceEnums');
var auth = require('../auth/auth');
var fs = require('fs');
var PDFImage = require('pdf-image').PDFImage;

var AWS = require("aws-sdk");

var dynamodb = new AWS.DynamoDB();
var docClient = new AWS.DynamoDB.DocumentClient();

module.exports.sabbaticRegister = function(data, cb){
	sabbatic.login(data.sbUser,data.sbPassword, function(error, result){
		var o = {
			company_id_custom: data.company.document,
			name: data.company.name,
			vat_id: data.company.document,
			postal_code: data.address.zip,
			city: data.address.city,
			address: data.address.address,
			province: data.addres.province,
			country: data.address.country
		};
		sabbatic.createCompany(result.session_id, o, function(err1, res1){
			// guardar en app_param - res1.company_id
			var o1 = {
				email: data.email,
				company_id: res1.company_id, //sabbatic company id.
				company_id_custom: res1.company_id_custom, //domain id.
				user_id_custom: 'aon#' + data.user.id, //aon user id.
				name: data.user.name, //sabbatic company id.
				language:'es'
			};
			sabbatic.createUser(result.session_id, o1, function(err2, res2){
				cb(null, res2);
			});
		});
	});
}

module.exports.sabbaticDropOut = function(data, cb){
	sabbatic.login(data.sbUser,data.sbPassword, function(error, result){
		var o = {
			company_id_custom: data.company.id,
		};
		sabbatic.deleteUser(result.session_id, o, function(err1, res1){
			sabbatic.deleteCompany(result.session_id, o, function(err2, res2){});
		});
	});
}

module.exports.importSabbatic = function(data, cb){
	sabbatic.login(data.sbUser,data.sbPassword, function(error, result){
		for(var i = 0; i < data.files.length; i++){
			var fil = data.files[i];
			if(fil.contentType.includes('image')){
				sbCreateInvoice(result.session_id, data, cb);
			} else if(fil.contentType.includes('pdf')){
				pdf2img(fil.base64, function(error3, result3){
					sbCreateInvoice(result.session_id, data, cb);
				});
			}
		}
	});
}

function sbCreateInvoice(sbSession, data, cb){
	sabbatic.createInvoice(sbSession, data.files[i].base64, data.company, function(error, r){
		createInvoice("SABBATIC", r.expense_id, {
			"company": data.company,
			"status": "Enviado"
		}, cb);
	});
}

module.exports.importOCR = function(pool, data, cb){

}

module.exports.importInvoice = function(data, cb){
	if('SABBATIC'.equals(data.company)){
		getInvoice(data, function(err,res0){
      var sbData = sb2inv(data.info);
			if(res0.item && res0.item.info.number){
        actualizeSabbatic(res0.item.info.company, res0.item.info.number, data, true);
        updateInvoice({company: res0.item.info.company, number: res0.item.info.number, info: sbData}, cb);
        return;
			}

      var company = res0.item ? res0.item.info.company : sbData.receiver.document.document;
      getLastNumber(company, function(err, res1){
        var num = res1.item ? res1.item.number + 1 : 0;
        actualizeSabbatic(company, num, data, res0.item);
        actualizeLastNumber(company, num, res1.item);
        createInvoice(company, num, sbData, cb);
      });
		});
    return;
	}
  if(data.number){
		updateInvoice(data, cb);
	} else {
    getLastNumber(data.company, function(err, res){
      var num = res.item ? res.item.number + 1 : 0;
      actualizeLastNumber(company, num, res.item);
      createInvoice(data.company, num, data.info, cb);
    });
  }
}

function actualizeLastNumber(company, number, exist){
  var lastNumber = {
    company: company + '-LAST',
    number: number
  }

  if(exist){
    updateLastNumber(lastNumber, function(err, res){});
  } else {
    createLastNumber(lastNumber, function(err, res){});
  }
}

function actualizeSabbatic(company, number, data, exist){
  var sb = {
    company: data.company,
    number: data.number,
    info: {
      company: company,
      number: number,
      status: data.info.status.name
    }
  }

  if(exist){
    updateInvoice(sb, function(err, res){});
  } else {
    createInvoice(data.company, data.number, sb, function(err, res){});
  }
}

// DYNAMO UTILS

function createInvoice(companysb2inv, number, info, cb){
	var params = {
		TableName: "Invoice",
		Item:{
			"company": company,
			"number": number,
			"info": info
		}
	}
	docClient.put(params, cb);sb2inv
}

function getInvoice(data, cb){
	var params = {
	    TableName: "Invoice",
	    Key:{
	        "company": data.company,
	        "number": data.number
	    }
	};
	docClient.get(params, cb);
}

function updateInvoice(data, cb){
  var params = {
      TableName:"Invoice",
      Key:{
        "company": data.company,
        "number": data.number
      },
      UpdateExpression: "set info = :r",
      ExpressionAttributeValues:{
          ":r": data.info
      },
      ReturnValues:"UPDATED_NEW"
  };

  docClient.update(params, cb);
}

function getLastNumber(data, cb){
  var params = {
      TableName: "Invoice",
      Key:{
        "company": data.company + '-LAST',
      }
  };
  docClient.get(params, cb);
}

function updateLastNumber(data, cb){
  var params = {
      TableName:"Invoice",
      Key:{
        "company": data.company
      },
      UpdateExpression: "set number = :r",
      ExpressionAttributeValues:{
          ":r": data.number
      },
      ReturnValues:"UPDATED_NEW"
  };

  docClient.update(params, cb);
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
  var f = "f.pdf";
  decode(base64, f);
  var pdfImage = new PDFImage(f);
  pdfImage.convertPage(0).then(function (imagePath) {
    var imgBase64 = encode(imagePath);
    fs.unlinkSync(f);
    fs.unlinkSync(imagePath);
    callback(null, imgBase64);
  });
}

function sb2inv(data){
  var invoice = {
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
    "description": data.title,
    "comments": data.notes,
    "transaction": "NATIONAL",
    "investment": false,
    "service": false,
    "surcharge": false,
    "vat_accrual_payment": false,
    "taxable_base": data.total - data.tax_retention_import,
    "total": data.total,

    "sabbatic": {
      "id": data.expense_id,
      "status": data.status.name
    }
  };

  if(data.taxes.length > 0){
    var t = [];
    for (var i = 0; i < data.taxes.length; i++){
      t[i] = {
        "type": "VAT",
        "base": data.taxes[i].net_price,
        "percentage": data.taxes[i].tax_percent,
        "quota": data.taxes[i].tax_amount
      }
    }
    aonData.taxes = t;
  }
  return invoice;
}

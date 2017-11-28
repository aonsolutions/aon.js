var sabbatic	= require('../sabbatic');
var PDFImage = require('pdf-image').PDFImage;
var fs = require('fs');

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
				sbCreateInvoice(result.session_id, fil.base64, data.company, cb);
			} else if(fil.contentType.includes('pdf')){
				pdf2img(fil.base64, function(error3, result3){
					sbCreateInvoice(result.session_id, result3, data.company, cb);
				});
			}
		}
	});
}

module.exports.refreshSabbatic = function(data, cb){
	sabbatic.login(data.sbUser, data.sbPassword, function(err, res){
		var params = {
			TableName : "Invoice",
			ProjectionExpression:"#c, #n",
			FilterExpression: "#c = :cp and (#i.#s = :st1 or #i.#s = :st2)",
			ExpressionAttributeNames:{
				"#c": "company",
				"#n": "number",
				"#i": "info",
				"#s": "status"

			},
			ExpressionAttributeValues: {
				":cp":"SABBATIC",
				":st1" : "Enviado",
				":st2" : "pendiente"
			}
		};

		docClient.scan(params, function(err, data) {
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
						console.log(res);
					});
				}
			})
    });
	});
}

module.exports.importOCR = function(data, cb){

}

module.exports.importInvoice = function(data, cb){
	importInvoice(data, cb);
}

function importInvoice(data, cb){
	if("SABBATIC" == data.company){
		if(isSbAccept(data.info.status.name)){
			actualizeSabbatic(company, num, data);
			return;
		}
		getInvoice(data, function(err,res0){
			var sb = res0;
      var sbData = sb2inv(data.info);
			if(sb && sb.Item && sb.Item.info.number){
        actualizeSabbatic(sb.Item.info.company, sb.Item.info.number, data);
        updateInvoice({company: sb.Item.info.company, number: sb.Item.info.number, info: sbData}, cb);
        return;
			}
      var company = sb && sb.Item ? sb.Item.info.company : sbData.receiver.document.document;
      getLastNumber(company, function(err, ln){
        var num = ln && ln.Items && ln.Count > 0 ? ln.Items[0].number + 1 : 0;
        actualizeSabbatic(company, num, data);
        actualizeLastNumber(company, num);
        createInvoice(company, num, sbData, cb);
      });
		});
    return;
	}
  if(data.number){
		updateInvoice(data, cb);
	} else {
    getLastNumber(data.company, function(err, res){
      var num = res && res.Item ? res.Item.number + 1 : 0;
      actualizeLastNumber(company, num);
      createInvoice(data.company, num, data.info, cb);
    });
  }
}

function isSbAccept(status){
	return "digitalizado" == status || "aprobado" == status || "confirmado" = status;
}

function actualizeLastNumber(company, number){
  var lastNumber = {
    company: company + '-LAST',
    number: number
  }

  if(number > 0){
    deleteLastNumber(lastNumber, function(err, res){});
  }
  createLastNumber(lastNumber, function(err, res){});
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
	createInvoice(data.company, data.number, sb.info, function(err, res){});
}

function sbCreateInvoice(sbSession, base, company, cb){
	sabbatic.createReceipt(sbSession, base, company, function(error, r){
		if(error) console.log(error);
		createInvoice("SABBATIC", r.id, {
			"company": company,
			"status": "Enviado"
		}, cb);
	});
}

// DYNAMO UTILS

function createInvoice(company, number, info, cb){
	var params = {
		TableName: "Invoice",
		Item:{
			"company": company,
			"number": number,
			"info": info
		}
	}
	docClient.put(params, cb);
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
    TableName : "Invoice",
    KeyConditionExpression: "#c = :cp",
    ExpressionAttributeNames:{
        "#c": "company"
    },
    ExpressionAttributeValues: {
        ":cp": data + '-LAST'
    }
	};

  docClient.query(params, cb);
}

function deleteLastNumber(data, cb){
	var params = {
	    TableName:"Invoice",
	    Key:{
	      "company": data.company,
	      "number": data.number - 1
	    }
	};
	docClient.delete(params, cb);
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

function createLastNumber(data, cb){
	var params = {
		TableName: "Invoice",
		Item: data
	}
	docClient.put(params, cb);
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
  var f = "/tmp/f.pdf";
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
		"taxable_base": data.total && data.tax_retention_import ? data.total - data.tax_retention_import : 0.0,
    "total": data.total,

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
    invoice.taxes = t;
  }
  return invoice;
}

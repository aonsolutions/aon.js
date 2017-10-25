var sabbatic	= require('../sabbatic');
var domain = require('../domain');
var dataResponse = require('../dataResponse');
var registry = require('../registry');
var scope = require('../scope');
var invoice = require('./invoice');
var invoiceDetail = require('./invoiceDetail');
var invoiceTax = require('./invoiceTax');
var invoiceAddress = require('./invoiceAddress');
var finance = require('./finance');
var file = require('../file');
var user = require('../user');
var appParam = require('../appParam');
var enums = require('../enum/enums');
var auth = require('../auth/auth');
var fs = require('fs');
var PDFImage = require('pdf-image').PDFImage;

module.exports.importSabbatic = function(pool, data, cb){
	domain.get(pool,
		function(params) {
			return params.name.equals(data.domain);
		}, function( error, results, fields ){
			var domainId = results[0].id;
			generateUserToken(pool, domainId, data.email, function(error0, aonToken){
				sabbatic.login(data.sbUser,data.sbPassword, function(error, result){
					for(var i = 0; i < data.files.length; i++){
						var fil = data.files[i];
						if(fil.contentType.includes('image')){
							sabbatic.send(result.session_id, data.files[i].base64, aonToken, function(error, r){
								r.domain = domainId;
								createDataResponse(pool, r, function(error2, r2){
									var f = new Object();
									f.domain = domainId;
									f.mimeType = enums.MIMETYPE.getByValue('name', fil.contentType).id;
									f.module = "data";
									f.source = enums.DATA_ATTACH_SOURCE.DR_INVOICE.id;
									f.sourceId = r2[0].id;
									f.description = fil.name;
									f.data = new Buffer(fil.base64, 'base64');
									file.insertFile(pool, f, function(error, r){
										var a = new Object();
										a.description = "La petición esta siendo tratada."
										cb(null, a);
									});
								});
							});
						} else if(fil.contentType.includes('pdf')){
							pdf2img(fil.base64, function(error3, result3){
								sabbatic.send(result.session_id, result3, aonToken, function(error, r){
									r.domain = domainId;
									createDataResponse(pool, r, function(error2, r2){
										var f = new Object();
										f.domain = domainId;
										f.mimeType = enums.MIMETYPE.getByValue('name', fil.contentType).id;
										f.module = "data";
										f.source = enums.DATA_ATTACH_SOURCE.DR_INVOICE.id;
										f.sourceId = r2[0].id;
										f.description = fil.name;
										f.data = new Buffer(fil.base64, 'base64');

										file.insertFile(pool, f, function(error, r){
											var a = new Object();
											a.description = "La petición esta siendo tratada."
											cb(null, a);
										});
									});
								});
							});
						}
					}
				});
			});
		}
	);
}

module.exports.importOCR = function(pool, data, cb){

}

module.exports.import = function(pool, data, cb){
	if(data.company){
		var filter = {
			name : 'SABBATIC_COMPANY',
			value: data.company.toString()
		}
		appParam.getAppParam(pool, filter, function(error, result){
			data.domain = result[0].domain;
			importar(pool,data, cb);
		});
	} else importar(pool, data, cb);
}

function importar(pool,data, cb){
	if(data['registry']){
    if(data['scope']){
      insertInvoice(pool, data, cb);
    } else {
      scope.getDomainScope(pool, data.domain, function(err, scp){
        data.scope = JSON.parse(JSON.stringify(scp))[0].id;
        insertInvoice(pool, data, cb);
      });
    }
	} else {
		if(enums.INVOICE_TYPE.PURCHASE.name2.toUpperCase() === data['type'].toUpperCase()){ // data['type'] == 0){
			registry.getSupplier(pool,
	      function(params){
	        return params.document.equals(data.nif)
	  		         .and(params.domain.equals(data.domain));
	      },
	      function(err,data2){
	        data.registry = JSON.parse(JSON.stringify(data2))[0].id;
	        if(data['scope']){
			       insertInvoice(pool, data, cb);
	        } else {
	          scope.getDomainScope(pool, data.domain, function(err, scp){
	            data.scope = JSON.parse(JSON.stringify(scp))[0].id;
	            insertInvoice(pool, data, cb);
	          });
	        }
	      });
		} else if(enums.INVOICE_TYPE.SALES.name2.toUpperCase() === data['type'].toUpperCase()){ //data['type'] == 1){
			registry.getCustomer(pool,
	      function(params){
	        return params.document.equals(data.nif)
	  		         .and(params.domain.equals(data.domain));
	      },
	      function(err,data2){
	        data.registry = JSON.parse(JSON.stringify(data2))[0].id;
	        if(data['scope']){
			       insertInvoice(pool, data, cb);
	        } else {
	          scope.getDomainScope(pool, data.domain, function(err, scp){
	            data.scope = JSON.parse(JSON.stringify(scp))[0].id;
	            insertInvoice(pool, data, cb);
	          });
	        }
	      });
		} else if(enums.INVOICE_TYPE.EXPENSES.name2.toUpperCase() === data['type'].toUpperCase()){ //data['type'] == 2){
			registry.getCreditor(pool,
	      function(params){
	        return params.document.equals(data.nif)
	  		         .and(params.domain.equals(data.domain));
	      },
	      function(err,data2){
	        data.registry = JSON.parse(JSON.stringify(data2))[0].id;
	        if(data['scope']){
			       insertInvoice(pool, data, cb);
	        } else {
	          scope.getDomainScope(pool, data.domain, function(err, scp){
	            data.scope = JSON.parse(JSON.stringify(scp))[0].id;
	            insertInvoice(pool, data, cb);
	          });
	        }
	     });
		}
  }
}

function insertInvoice(pool, data, cb){
	var processData = invoiceData(data);
	invoice.insert(pool, processData, function(err, result1){
    invoiceId = result1.insertId;
		updateDataResponse(pool, data, invoiceId);
		data.invoice = invoiceId;

		if(data.finance){
			for(var i = 0; i < data.finance.length; i++){
				finance.insert(pool, invoiceFinanceData(data, i), function(error, result){});
			}
		}

		if(data.address){
			invoiceAddress.insert(pool, invoiceAddressData(data), function(error, result){});
		}

		if(data.detail){
			for(var j = 0 ; j < data.detail.length; j++){
				var dtlA = invoiceDetailData(data.detail[j]);
				dtlA.invoice = invoiceId;
				invoiceDetail.insert(pool, dtlA, function(err, result3){
   				var invoiceTax1 = invoiceTaxData(data.detail[j], result3.insertId);
					invoiceTax.insert(pool, invoiceTax1, function(err, invTax){

					});
				});
			}
		} else {
    	invoiceDetail.select(pool, function(params){
      	return params.registry.equals(data.registry)
             .and(params.domain.equals(data.domain));
    	}, function(err,result2){
      	if(result2){
        	var idtl = JSON.parse(JSON.stringify(result2))[0];
					idtl.invoice = invoiceId;
					var dtlA = invoiceDetailData(idtl, data);
					invoiceDetail.insert(pool, dtlA, function(err, result3){
			      var invoiceTax1 = invoiceTaxData(data, result3.insertId);
            invoiceTax.insert(pool, invoiceTax1, function(err, invTax){
							var a = new Object();
							a.code = 200;
							a.description = "La factura se ha importado correctamente."
							cb(err, a);
						});
          });
      	} else {
        	workplace.select(pool, function(params){
          	return params.domain.equals(data.domain);
        	}, function(err, result4){
          	var workplaceId = JSON.parse(JSON.stringify(result4))[0].id;
          	var dtl = new Object();
          	dtl.domain = data.domain;
          	dtl.invoice = invoiceId;
          	dtl.workplace = workplaceId;
          	invoiceDetail.insert(pool, dtl, function(err, result5){
            	var invoiceTax = invoiceTaxData(data, result5.insertId);
            	invoiceTax.insert(pool, invoiceTax, function(err, invTax){
								var a = new Object();
								a.code = 200;
								a.description = "La factura se ha importado correctamente."
								cb(err, a);
            	});
          	})
        	})
      	}
    	}, invoiceDetail.invoiceDetail.id.desc);
		}
	});
}

function generateUserToken(pool, domainId, email, callback){
	var f = new Object();
	f.domain = domainId;
	f.email = email;
	user.select(pool, f, function(err, r){
		if(err) callback(err);
		callback(null,auth.createToken(r[0]));
	});
}

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

function insertInvoiceFile(pool, drId, invoiceId){
	var f = {
		module: 'data',
		source: enums.DATA_ATTACH_SOURCE.DR_INVOICE.id,
		sourceId: drId
	}
	console.log(f);
	file.getFile(pool, f, function(err, res){
			if (res.length > 0){
				console.log(res[0]);
				var fil ={
					module: 'invoice',
					invoice: invoiceId,
					domain: res[0].domain,
					mimeType: res[0].mimeType,
					description: res[0].description,
					data: res[0].data,
					attach_date: Date.now(),
					driveId: res[0].driveId,
					type: 1
				}
				file.insertFile(pool, fil, function(error, r){});
			}
	});
}

function updateDataResponse(pool, data, invoiceId){
	var f = {
		source: enums.DATA_RESPONSE_SOURCE.SABBATIC.id,
		sourceId: data.number
	}

	dataResponse.getDataResponse(pool, f, function(err, res){
			if(!err && res.length > 0){
				var dr = res[0];
				var i;
				var bool = true;
				for(i = 0; i < dr.detail.length; i++){
					if(dr.detail[i].variable == 'status'){
						dr.detail[i].value = data.status;
					} else if(dr.detail[i].variable == 'invoice'){
						bool = false;
					}
				}
				if(bool){
					var det = {
						variable: 'invoice',
						value: invoiceId.toString()
					}
					dr.detail[i] = det;
				}
				dataResponse.updateDataResponse(pool, dr, function(err1, res1){
					insertInvoiceFile(pool,dr.id, invoiceId);
				});
		} else {
			var d = {
				domain: data.domain,
				code: data.reference_code,
				source: enums.DATA_RESPONSE_SOURCE.SABBATIC.id,
				sourceId: data.number,
			  date: Date.now(),
				detail:[
					{variable: 'type', value: '0'},
					{variable: 'status', value: data.status},
					{variable: 'invoice', value: invoiceId}
				]
			}
			dataResponse.insertDataResponse(pool, d, function(err,result){
				if (err) {
					console.log("ERROR : ",err);
				} else {
					console.log("result from db is : ",JSON.stringify(result, null, "\t"));
				}
			});
		}
	});
}

function createDataResponse(pool, data, callback){
  var d = new Object();
  d.domain = data.domain;
  d.code = data.title;
  d.source = enums.DATA_RESPONSE_SOURCE.SABBATIC.id;
	d.sourceId = data.id;
  d.date = Date.now();

  var array = new Array();
  var detail1 = new Object();
  detail1.variable = 'type';
  detail1.value = '0';

  var detail2 = new Object();
  detail2.variable = 'status';
  detail2.value = data.status;
  array[0] = detail1;
  array[1] = detail2;
	d.detail = array;
  dataResponse.insertDataResponse(pool, d, function(err,result){
    if (err) {
      console.log("ERROR : ",err);
			callback(err, null);
    } else {
      console.log("result from db is : ",JSON.stringify(result, null, "\t"));
      callback(null, result);
    }
  });
}

function invoiceData(data){
	return {
		type: data.type,
		total: data.total,
		comments: data.comments,
		domain: data.domain,
		series: data.series,
		number: data.number,
		reference_code: data.reference_code,
		issue_date: data.issue_date,
		tax_date: data.tax_date,
		rname: data.name,
		rdocument: data.nif,
		registry: data.registry
	}
}

function invoiceTaxData(data, invoiceDetail){
	return {
		tax_type: data.tax_type,
		percentage: data.tax_percentage,
		quota: data.tax_quota,
		surcharge_quota: data.surcharge_quota,
		surcharge: data.surcharge_percentage,
		domain: data.domain,
		invoice_detail: invoiceDetail
	}
}

function invoiceDetailData(data, dataAll){
	return {
  	domain: data.domain,
  	invoice: data.invoice,
  	investAsset: data.investAsset,
  	project: data.project,
  	line: data.line,
  	item: data.item,
  	description: data.description,
  	quantity: data.quantity,
  	price: dataAll ? (dataAll.total - dataAll.tax_quota) : data.price,
  	discountExpr: data.discountExpr,
  	source: data.source,
  	sourceId: data.sourceId,
  	taxableBase: dataAll ? (dataAll.total - dataAll.tax_quota) : data.price,
  	taxes: data.taxes,
  	prepayment: data.prepayment,
  	seller: data.seller,
  	workplace: data.workplace,
	  warehouse: data.warehouse
	}
}

function invoiceFinanceData(data, index){
	return {
		domain: data.domain,
		registry: data.registry,
		scope: data.scope,
		invoice: data.invoice,
		pay_method: data.finance[index].pay_method ? enums.getByValue('name', data.pay_method).id : enums.PAY_METHOD.CASH_BASIS.id, //
		due_date: data.finance[index].due_date || data.issue_date,
		amount: data.finance[index].amount || data.total,
		bank_account: data.finance[index].bank_account
	}
}

function invoiceAddressData(data){
	return {
		domain: data.domain,
		invoice: data.invoice,
		streetType: data.street_type,
		address: data.address,
		address2: data.address2,
		number: data.number,
		zip: data.zip,
		city: data.city,
		province: data.province
	}
}

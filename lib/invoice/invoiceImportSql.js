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
var workplace = require('../workplace');
var file = require('../file');
var user = require('../user');
var product = require('../product');
var appParam = require('../appParam');
var enums = require('../enum/enums');
var auth = require('../auth/auth');
var fs = require('fs');
var PDFImage = require('pdf-image').PDFImage;

module.exports.sabbaticRegister = function(pool, data, cb){
	sabbatic.login(data.sbUser,data.sbPassword, function(error, result){
		var o = {
			company_id_custom: 'aon#' + data.company.id,
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

module.exports.sabbaticDropOut = function(pool, data, cb){
	sabbatic.login(data.sbUser,data.sbPassword, function(error, result){
		var o = {
			company_id_custom: data.company.id,
		};
		sabbatic.deleteUser(result.session_id, o, function(err1, res1){
			sabbatic.deleteCompany(result.session_id, o, function(err2, res2){});
		});
	});
}

module.exports.importSabbatic = function(pool, data, cb){
	domain.get(pool,
		function(params) {
			return params.name.equals(data.domain);
		}, function( error, results, fields ){
			var domainId = results[0].id;
			generateUserToken(pool, domainId, data.email, function(error0, aonToken){
				console.log(aonToken);
				sabbatic.login(data.sbUser,data.sbPassword, function(error, result){
					for(var i = 0; i < data.files.length; i++){
						var fil = data.files[i];
						if(fil.contentType.includes('image')){
							sabbatic.createReceipt(result.session_id, data.files[i].base64, aonToken, domainId, function(error, r){
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
								sabbatic.createReceipt(result.session_id, result3, aonToken, domainId, function(error, r){
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

module.exports.importar = function(pool, data, cb){
		invoice.select(pool, function(params) {
				return params.domain.equals(data.domain.id)
				.and(params.series.equals(data.series))
				.and(params.number.equals(data.number));
			}, function(error, result){
					if(error) cb(error, null);
				/*	if(result.length > 0){
						cb(null, {error: 'La factura ya existe'});
					} else*/ importar(pool, data, cb);
			});
}

function importar(pool,data, cb){
	if(data['registry'].id){
    if(data['scope'].id){
      insertInvoice(pool, data, cb);
    } else {
      scope.getDomainScope(pool, data.domain, function(err, scp){
        data.scope = {
					 id: JSON.parse(JSON.stringify(scp))[0].id
				};
        insertInvoice(pool, data, cb);
      });
    }
	} else {
		var rParams = function(params){
			return params.documento.equals(data.registry.doc)
						 .and(params.domain.equals(data.domain.id));
		};
		var getRegistry = function(error, result){
			if(error) cb(error, null);
			if(result.length <= 0) return null;
			return JSON.parse(JSON.stringify(result))[0];
		};
		data.type = enums.INVOICE_TYPE.EXPENSES;
		registry.getCreditor(pool, rParams, function(error, result){
			var reg = JSON.parse(JSON.stringify(result))[0];
			if(!reg){
				data.type = enums.INVOICE_TYPE.PURCHASE;
				registry.getSupplier(pool, rParams, function(err, res){
					var reg = JSON.parse(JSON.stringify(result))[0];
					afterRegistry(pool, data, cb, reg);
				});
			} else {
				afterRegistry(pool, data, cb, reg);
			}
		});
	}
}

function afterRegistry(pool, data, cb, reg){
	if(reg){
		data.registry = {
			id: reg.id,
			name: reg.name,
			doc: reg.document,
			type: reg.documentType,
			country: reg.documentCountry
		}
		if(data['scope']){
			 insertInvoice(pool, data, cb);
		} else {
			scope.getDomainScope(pool, data.domain.id, function(err, scp){
				data.scope = {
					id: JSON.parse(JSON.stringify(scp))[0].id
				}
				insertInvoice(pool, data, cb);
			});
		}
	}
}

function insertInvoice(pool, data, cb){
	var processData = invoiceData(data);
	invoice.insert(pool, processData, function(err, result1){
		if(err) console.log(err);
    invoiceId = result1.insertId;
		updateDataResponse(pool, data, invoiceId);
		data.id = invoiceId;

		if(data.finance){
			for(var i = 0; i < data.finance.length; i++){
				finance.insert(pool, invoiceFinanceData(data, i), function(error, result){
					if(error) console.log(error);
					console.log(result);

				});
			}
		}

		if(data.address){
			invoiceAddress.insert(pool, invoiceAddressData(data), function(error, result){});
		}

		if(data.detail){
			for(var j = 0 ; j < data.detail.length; j++){
				var dtlA = invoiceDetailData(data, j);
				dtlA.invoice = invoiceId;
				invoiceDetail.insert(pool, dtlA, function(err, result3){
					if(data.detail.tax){
						for(var z = 0 ; z < data.detail.tax.length; z++){
							data.detail[j].domain = data.domain;
							var invoiceTax1 = invoiceTaxData(data.detail[j], z, result3.insertId);
							invoiceTax.insert(pool, invoiceTax1, function(err, invTax){
							});
						}
					}
				});
			}
		} else {
    	invoiceDetail.select(pool, function(params){
      	return params.registry.equals(data.registry.id)
             .and(params.domain.equals(data.domain.id));
    	}, function(err,result2){
      	if(result2.length > 0){
					var idtl = JSON.parse(JSON.stringify(result2))[0];
					console.log(idtl);
					idtl.invoice = invoiceId;
					idtl.price = data.total;
					data.id = invoiceId;
					delete idtl.id;
					delete idtl.price;
					delete idtl.source;
					delete idtl.source_id;

					for(var x = 0 ; x < data.tax.length; x++){
        		idtl.taxableBase = data.tax[x].base;
						idtl.line = x + 1;
						var indez = x;
						invoiceDetail.insert(pool, idtl, function(err, result3){
							if (err) console.log(err);
							var invoiceTax1 = invoiceTaxData(data, indez, result3.insertId);
							invoiceTax.insert(pool, invoiceTax1, function(err, invTax){
								if(err) console.log(err);
								var a = new Object();
								a.code = 200;
								a.description = "La factura se ha importado correctamente."
								cb(err, a);
							});
          	});
					}
      	} else {
        	workplace.select(pool, function(params){
          	return params.domain.equals(data.domain);
        	}, function(err, result4){
						var workplaceId = JSON.parse(JSON.stringify(result4))[0].id;

						item0(pool, data.domain, function(err6, res6){
							var dtl = new Object();
	          	dtl.domain = data.domain;
	          	dtl.invoice = invoiceId;
	          	dtl.workplace = workplaceId;
							dtl.item = res6;
							dtl.description = 'generico';

							for(var x = 0 ; x < data.tax.length; x++){
		        		dtl.taxableBase = data.tax[x].base;
								dtl.line = x + 1;
								var indez = x;

								invoiceDetail.insert(pool, dtl, function(err, result5){
									var invoiceTax2 = invoiceTaxData(data, indez, result5.insertId);
									console.log(invoiceTax2);
									invoiceTax.insert(pool, invoiceTax2, function(err, invTax){
										var a = new Object();
										a.code = 200;
										a.description = "La factura se ha importado correctamente."
										cb(err, a);
									});
								});
							}
						});
        	})
      	}
    	}, invoiceDetail.invoiceDetail.id.desc);
		}
	});
}

function item0(pool, domainId, callback){
	var filter = {
			domain: domainId,
			code: 'generico'
	}
	product.selectItem(pool, filter, function(err, res){
		console.log(res[0].id);
		if(res.length > 0){
			callback(null, res[0].id);
		} else {
			var p = {
				domain: domainId,
				name: 'generico',
				code:	'generico',
				kind: 0
			}

			product.insertProduct(pool, p, function(err, res){
				if(err) console.log(err);
				var i = {
						domain: domainId,
						product: res.insertId
				}
				console.log('crear item');
				product.insertItem(pool, i, function(err1, res1){
						callback(null, res1.insertId);
				});
			});
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
		domain: data.domain.id,
		activity: data.activity ? data.activity.id : null,
		invest_asset: data.invest_asset ? data.invest_asset : null,
		project: data.project ? data.project : null,
		series: data.series ? data.series : null,
		number: data.number,
		reference_code: data.reference_code,
		registry: data.registry.id,
		rdocument: data.registry.doc,
		rdocument_type: data.registry.type,
		rdocument_country: data.registry.country,
		rname: data.registry.name,
		raddress:  null, // data.adddress.id
		issue_date: data.issue_date,
		tax_date: data.tax_date || data.issue_date,
		security_level: data.security_level ? 1 : 0,
		status:  data.status && data.status.id ? data.status.id : 0,
		type: data.type && data.type.id ? data.type.id : 0,
		surcharge: data.surcharge ? 1 : 0,
		withholding: data.withholding ? 1 : 0,
		withholding_farmer: data.withholding_farmer ? 1 : 0,
		vat_accrual_payment:data.vat_accrual_payment ? 1 : 0,
		comments: data.comments,
		remarks: data.remarks,
		investment: data.investment ? 1 : 0,
		transaction: data.transaction ? 1 : 0,
		signed: data.signed ? 1 : 0,
		scope: data.scope.id,
		service: data.service ? 1 : 0,
		rectification_type: data.rectification_type ? data.rectification_type : 0,
		rectification_invoice: data.rectification_invoice ? data.rectification_invoice : null,
		advance: data.advance ? 1 : 0,
		pos_shift: data.pos_shift ? data.pos_shift : null,
		seller: data.seller ? data.seller : null,
		taxable_base: data.taxable_base ? data.taxable_base: 0,
		vat_quota: data.vat_quota ? data.vat_quota : 0,
		retention_quota: data.retention_quota ? data.retention_quota : 0,
		total: data.total
	}
}

function invoiceTaxData(data, index, invoiceDetail){
	return {
		base: data.tax[index].base || 0,
		tax_type: data.tax[index].tax_type || enums.TAX_TYPE.VAT.id,
		percentage: data.tax[index].percentage || 0 ,
		quota: data.tax[index].quota || 0,
		surcharge_quota: data.tax[index].surcharge_quota || 0,
		surcharge: data.tax[index].surcharge_percentage || 0,
		domain: data.domain.id,
		invoice_detail: invoiceDetail
	}
}

function invoiceDetailData(data, indez){
	var detail = data.detail[j];
	return {
  	domain: data.domain.id,
  	invoice: data.id,
  	investAsset: detail.investAsset,
  	project: detail.project,
  	line: detail.line,
  	item: detail.item,
  	description: detail.description,
  	quantity: detail.quantity,
  //	price: data.price,
  	discountExpr: data.discountExpr,
  	source: data.source,
  	sourceId: data.sourceId,
  	taxableBase: data.taxableBase,
  	taxes: data.taxes,
  	prepayment: data.prepayment,
  	seller: data.seller,
  	workplace: data.workplace,
	  warehouse: data.warehouse
	}
}

function invoiceFinanceData(data, index){
	return {
		domain: parseInt(data.domain.id),
		registry: data.registry.id,
		scope: data.scope.id,
		invoice: data.id,
		due_date: data.finance[index].due_date || data.issue_date,
		amount: data.finance[index].amount || 0.0,
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

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

module.exports.tEDi2Aon = tEDi2Aon;

function tEDi2Aon(pool, data, cb){
	var filter = {
		"document": data.company
	}
	registry.getCompany(pool, filter, function(err, res){
		var company = JSON.parse(JSON.stringify(res))[0];
		scope.getDomainScope(pool, company.domain, function(err, scp){
			var skope = JSON.parse(JSON.stringify(scp))[0].id;
			var f = {
				domain: company.domain,
				source: enums.DATA_RESPONSE_SOURCE.TEDI_INVOICE.id,
				sourceId: data.number
			}
			dataResponse.getDataResponse(pool, f, function(err, res){
				var dr = JSON.parse(JSON.stringify(res))[0];
				if(dr){
					//UPDATE
				} else{
					invoiceData(pool, company.domain, skope, data, function(err, inv){
						invoice.insertInvoice(pool, inv, function(err, res){
							if(err) cb(err)
							else {
								invoiceId = res.insertId;
								insertDataResponse(pool, company.domain, data, invoiceId);
								if(data.info.finances){
									for(var i = 0; i < data.info.finances.length; i++){
										var financeData = invoiceFinanceData(company.domain, inv.registry, skope, invoiceId, data.info.finances[i]);
										finance.insert(pool, financeData, function(error, result){
											if(error) console.log(error);
											else console.log(result);
										});
									}
								}

								if(data.info.receiver.address || data.info.sender.address){
									var address = data.info.type.type =="emitida" ? data.info.receiver.address : data.info.sender.address;
									invoiceAddress.insert(pool, invoiceAddressData(company.domain, invoiceId, address), function(error, result){});
								}
								workplace.select(pool, function(params){
			          	return params.domain.equals(company.domain);
			        	}, function(err, result4){
									if(data.info.details){
										for(var j = 0; j < data.info.details.length; j++){
											var det = data.info.details[j];
											item0(pool, company.domain, det, function(err6, res6){
												console.log(res6);
												det.item = res6;
												var aonData = {
													pool: pool,
													domain: company.domain,
													scope: skope,
													workplace: JSON.parse(JSON.stringify(result4))[0].id,
													detail: det,
													index: j,
													invoice: invoiceId,
												}
												var detail = invoiceDetailData(aonData);
											});
										}
										// TODO INSERT INVOICE DETAILS
									} else {
										for(var j = 0; j < data.info.taxes.length; j++){
											var aonData = {
												pool: pool,
												domain: company.domain,
												scope: skope,
												workplace: JSON.parse(JSON.stringify(result4))[0].id,
												tax: data.info.taxes[j],
												index: j,
												invoice: invoiceId,
											}
											invoiceDetailData2(aonData);
										}
									}
								});
							}
						});
					})
				}
			});
		});
	});
}

function insertDataResponse(pool, domain, data, invoiceId){
	var dr = {
				domain: domain,
				code: data.info.reference,
				source: enums.DATA_RESPONSE_SOURCE.TEDI_INVOICE.id,
				sourceId: data.number,
			  date: Date.now(),
				detail:[
					{variable: 'invoice', value: invoiceId}
				]
	}
	dataResponse.insertDataResponse(pool, dr, function(err,result){
		if (err) {
			console.log("ERROR : ",err);
		} else {
			console.log("result from db is : ",JSON.stringify(result, null, "\t"));
		}
	});
}

function getRegistry(pool, domain, skope, data, next){
	var action = function(){next(new Error("type incorrecto"))};
	if(data.info.type.type == "emitida") action = registry.getCustomer;
	else if(data.info.type.type == "compra") action = registry.getSupplier;
	else if(data.info.type.type == "gasto") action = registry.getCreditor;
  var filter = {
    "domain": domain,
    "document": data.info.type.type == "emitida" ? data.info.receiver.document.document : data.info.sender.document.document
  };
	console.log(filter);
  action(pool, filter, function(err, res){
    if(err) next(err);
    else if(res.length <= 0) insertRegistry(pool, domain, skope, data, next);
    else next(null, res);
  });
}

function insertRegistry(pool, domain, skope, data, next){
	var action = function(){next(new Error("type incorrecto"))};
	var type = 0;
	if(data.info.type.type == "emitida") {action = registry.insertCustomer;type=1;}
	else if(data.info.type.type == "compra") {action = registry.insertSupplier;type=0;}
	else if(data.info.type.type == "gasto") {action = registry.insertCreditor;type=2;}
  var reg = {
		"domain": domain,
		"document":  data.info.type.type == "emitida" ? data.info.receiver.document.document : data.info.sender.document.document,
		"document_type": type, //data.info.sender.document.type.type,
		"document_country":  data.info.type.type == "emitida" ? data.info.receiver.document.country : data.info.sender.document.country,
		"name":  data.info.type.type == "emitida" ? data.info.receiver.name : data.info.sender.name,
		"nationality": data.info.type.type == "emitida" ? data.info.receiver.document.country : data.info.sender.document.country
	}
	console.log(reg);
  registry.insertRegistry(pool, reg, function(err, res){
    if(err) next(err);
    else {
      var c = {
        registry: res[0].id,
        domain: domain,
        scope: skope
      };
      action(pool, c, function(err,res){
        if(err) next(err);
        else next(null, res);
      });
    }
  });
}

function item0(pool, domainId, detail, callback){
	var filter = {
			domain: domainId,
			code: detail.product,
			detail: detail.detail,
			detail2: detail.detail2,
			detail3: detail.detail3
	}
	product.selectItem(pool, filter, function(err, res){
		console.log(res);
		if(res.length > 0){
			callback(null, res[0].id);
		} else {
			var p = {
				domain: domainId,
				name: detail.description,
				code:	detail.product,
				type: 2,
				kind: 0
			}

			product.insertProduct(pool, p, function(err, res){
				if(err) console.log(err);
				var i = {
						domain: domainId,
						product: res.insertId,
						detail: detail.detail,
						detail2: detail.detail2,
						detail3: detail.detail3,
						price: detail.price,
						purchase_price: detail.purchase_price
				}
				console.log('crear item');
				product.insertItem(pool, i, function(err1, res1){
						callback(null, res1.insertId);
				});
			});
		}
	});
}

function invoiceData(pool, domain, skope, data, cb){
	getRegistry(pool, domain, skope, data, function(err, res){
		var reg = res.length > 0 ? res[0] : null;
		var inv = {
			domain: domain,
	//		activity: data.activity ? data.activity.id : null,
	//		invest_asset: data.invest_asset ? data.invest_asset : null,
	//		project: data.project ? data.project : null,
			series: "TEDI",
			number: data.number,
			reference_code: data.info.reference,
			registry:reg.id,
			rdocument: reg.document,
			rdocument_type: reg.document_type,
			rdocument_country: reg.document_country,
			rname: reg.name,
			raddress:  null, // TODO

			issue_date: data.info.date,
			tax_date: data.info.date,
			security_level: 0,
			status: 0,
			type: enums.INVOICE_TYPE.getByValue("name2", data.info.type.type).id || 0, // TODO data.info.type.type
			surcharge: data.info.surcharge ? 1 : 0,
			withholding: data.info.withholding ? 1 : 0,
			withholding_farmer: data.info.withholding_farmer ? 1 : 0,
			vat_accrual_payment:data.info.vat_accrual_payment ? 1 : 0,
			comments: data.info.comments,
			remarks: data.info.remarks,
			investment: data.info.investment ? 1 : 0,
			transaction: data.info.transaction ? data.info.transaction.id : 0,
			signed: data.info.signed ? 1 : 0,
			scope: skope,
			service: data.info.service ? 1 : 0,
			rectification_type: data.info.rectification_type ? data.info.rectification_type : 0,
			rectification_invoice: data.info.rectification_invoice ? data.info.rectification_invoice : null,
			advance: data.info.advance ? 1 : 0,
			pos_shift: data.info.pos_shift ? data.info.pos_shift : null,
			seller: data.info.seller ? data.info.seller : null,
			taxable_base: data.info.taxable_base ? data.info.taxable_base: 0,
			vat_quota: data.info.vat_quota ? data.info.vat_quota : 0,
			retention_quota: data.info.retention_quota ? data.info.retention_quota : 0,
			total: data.info.total || 0
		}
		cb(null, inv);
	});
}

function invoiceDetailData(aonData){
	var detail = {
  	domain: aonData.domain,
  	invoice: aonData.invoice,
  	line: aonData.index,
 		item: aonData.detail.item || null,
  	description: aonData.detail.description,
  	quantity: aonData.detail.quantity,
  	price: aonData.detail.price,
  	discountExpr: aonData.detail.discount,
  	taxableBase: aonData.detail.price,
  	taxes: 0.0,
  	workplace: aonData.workplace,
	}
	invoiceDetail.insert(aonData.pool, detail, function(err, res){
		aonData.invoiceDetail = res.insertId;
		invoiceTaxData(aonData);
	});
}

function invoiceTaxData(aonData){
	var tax = {
		base: aonData.detail.price,
		tax_type: enums.TAX_TYPE.VAT.id,
		percentage: aonData.detail.vat,
		quota: (aonData.detail.vat * aonData.detail.price * aonData.detail.quantity) / 100,
		surcharge_quota: 0,
		surcharge: 0,
		domain: aonData.domain,
		invoice_detail: aonData.invoiceDetail
	}
	invoiceTax.insert(aonData.pool, tax, function(err, res){

	});
}

function invoiceDetailData2(aonData){
	var detail = {
  	domain: aonData.domain,
  	invoice: aonData.invoice,
  	line: aonData.index,
  	description: "Fra. xxxxxx",
  	quantity: 1.00,
		price: aonData.tax.base,
  	discountExpr: aonData.tax.discount,
  	taxableBase: aonData.tax.base,
  	taxes: 0.00,
  	workplace: aonData.workplace,
	}
	invoiceDetail.insert(aonData.pool, detail, function(err, res){
	 	aonData.invoiceDetail = res.insertId;
		invoiceTaxData2(aonData);
	});
}

function invoiceTaxData2(aonData){
	var tax = {
		base: aonData.tax.base || 0,
		tax_type: enums.TAX_TYPE.getByValue("name", aonData.tax.tax_type).id || enums.TAX_TYPE.VAT.id,
		percentage: aonData.tax.percentage || 0 ,
		quota: aonData.tax.quota || 0,
		surcharge_quota: aonData.tax.surcharge_quota || 0,
		surcharge: aonData.tax.surcharge_percentage || 0,
		domain: aonData.domain,
		invoice_detail: aonData.invoiceDetail
	}
	invoiceTax.insert(aonData.pool, tax, function(err, res){

	});
}

function invoiceFinanceData(domain, registry, scope, invoice, finance){
	return {
		domain: domain,
		registry: registry,
		scope: scope,
		invoice: invoice,
		due_date: finance.due_date,
		amount: finance.amount || 0.0,
		bank_account: finance.bank_account
	}
}

function invoiceAddressData(domain, invoice, data){
	return {
		domain: domain,
		invoice: invoice,
		address: data.address,
		zip: data.postal_code,
		city: data.city,
		province: data.province
	}
}

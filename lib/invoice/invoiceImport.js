var sabbatic	= require('../sabbatic');
var domain = require('../domain');
var dataResponse = require('../dataResponse');
var file = require('../file');
var user = require('../user');
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
									f.source = enums.DATA_ATTACH_SOURCE.INVOICE.id;
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
									console.log(r);
									createDataResponse(pool, r, function(error2, r2){
										var f = new Object();
										f.domain = domainId;
										f.mimeType = enums.MIMETYPE.getByValue('name', fil.contentType).id;
										f.module = "data";
										f.source = enums.DATA_ATTACH_SOURCE.INVOICE.id;
										f.sourceId = r2.id;
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
	var processData = invoiceData(data);
	if(data['registry']){
    if(data['scope']){
      insertInvoice(pool, processData, cb);
    } else {
        scope.getDomainScope(pool, data.domain, function(err, scp){
          processData.scope = JSON.parse(JSON.stringify(scp))[0].id;
          insertInvoice(pool, data, processData, cb);
        });
    }
	} else {
		if(data['type'] == 0){
			registry.getSupplier(pool,
	      function(params){
	        return params.document.equals(data.nif)
	  		         .and(params.domain.equals(data.domain));
	      },
	      function(err,data2){
	        processData.registry = JSON.parse(JSON.stringify(data2))[0].id;
	        if(data['scope']){
			       insertInvoice(pool, processData, cb);
	        } else {
	          scope.getDomainScope(pool, data.domain, function(err, scp){
	            processData.scope = JSON.parse(JSON.stringify(scp))[0].id;
	            insertInvoice(pool, data, processData, cb);
	          });
	        }
	      });
		} else if(data['type'] == 1){
			registry.getCustomer(pool,
	      function(params){
	        return params.document.equals(data.nif)
	  		         .and(params.domain.equals(data.domain));
	      },
	      function(err,data2){
	        processData.registry = JSON.parse(JSON.stringify(data2))[0].id;
	        if(data['scope']){
			       insertInvoice(pool, processData, cb);
	        } else {
	          scope.getDomainScope(pool, data.domain, function(err, scp){
	            processData.scope = JSON.parse(JSON.stringify(scp))[0].id;
	            insertInvoice(pool, data, processData, cb);
	          });
	        }
	      });
		} else if(data['type'] == 2){
			registry.getCreditor(pool,
	      function(params){
	        return params.document.equals(data.nif)
	  		         .and(params.domain.equals(data.domain));
	      },
	      function(err,data2){
	        processData.registry = JSON.parse(JSON.stringify(data2))[0].id;
	        if(data['scope']){
			       insertInvoice(pool, processData, cb);
	        } else {
	          scope.getDomainScope(pool, data.domain, function(err, scp){
	            processData.scope = JSON.parse(JSON.stringify(scp))[0].id;
	            insertInvoice(pool, data, processData, cb);
	          });
	        }
	      });
		}
  }
}

function insertInvoice(pool, dataAll, data, cb){
	invoice.insert(pool, data, function(err, result1){
    invoiceId = result1.insertId;
    invoiceDetail.select(pool, function(params){
      return params.registry.equals(data.registry)
             .and(params.domain.equals(data.domain));
    }, function(err,result2){
      if(result2){
        var idtl = JSON.parse(JSON.stringify(result2))[0];
				idtl.invoice = invoiceId;
				var dtlA = invoiceDetailData(idtl, dataAll);
				invoiceDetail.insert(pool, dtlA, function(err, result3){
            var invoiceTax1 = invoiceTaxData(dataAll, result3.insertId);
            invoiceTax.insert(pool, invoiceTax1, function(err, invTax){
							var a = new Object();
							a.description = "La factura se insertado correctamente."
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
              var invoiceTax = invoiceTaxData(dataAll, result5.insertId);
              invoiceTax.insert(pool, invoiceTax, function(err, invTax){invoiceData
								var a = new Object();
								a.description = "La factura se insertado correctamente."
								cb(err, a);
              });
          })
        })
      }
    }, invoiceDetail.invoiceDetail.id.desc);
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
  detail2.value = 'enviado';
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
	var processData = new Object();
	processData.type = data.type;
	processData.total = data.total_amount;
	processData.comments = data.comments;
	processData.domain = data.domain;
	processData.series = data.series;
	processData.number = data.number;
	processData.reference_code = data.series ? (data.series + "/" + data.number) : data.number;
	processData.issue_date = data.issue_date;
	processData.tax_date = data.tax_date;
	processData.rname = data.name;
	processData.rdocument = data.nif;
	processData.registry = data.registry;
	return processData;
}

function invoiceTaxData(data, invoiceDetail){
	var processData = new Object();
	processData.tax_type = data.tax_type;
	processData.percentage = data.tax_percentage;
	processData.quota = data.tax_quota;
	processData.surcharge_quota = data.surcharge_quota;
	processData.surcharge = data.surcharge_percentage;
	processData.domain = data.domain;invoiceData
	processData.invoice_detail = invoiceDetail;

	return processData;
}

function invoiceDetailData(data, dataAll){
	var processData = new Object();
    processData.domain = data.domain;
    processData.invoice = data.invoice;
    processData.investAsset = data.investAsset;
    processData.project = data.project;
    processData.line = data.line;
    processData.item = data.item;
    processData.description = data.description;
    processData.quantity = data.quantity;
    processData.price = dataAll.total_amount - dataAll.tax_quota;
    processData.discountExpr = data.discountExpr;
    processData.source = data.source;
    processData.sourceId = data.sourceId;
    processData.taxableBase = dataAll.total_amount - dataAll.tax_quota;
    processData.taxes = data.taxes;
    processData.prepayment = data.prepayment;
    processData.seller = data.seller;
    processData.workplace = data.workplace;
    processData.warehouse = data.warehouse;

    return processData;
}

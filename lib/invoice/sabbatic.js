var invoice	= require("./invoice");
var invoiceDetail	= require("./invoiceDetail");
var invoiceTax	= require("./invoiceTax");
var registry	= require("../registry");
var workplace	= require("../workplace");
var scope	= require("../scope");
var dataResponse	= require("../dataResponse");

module.exports.sabbatic = function(pool, data, cb){
	var processData = invoiceData(data);
	if(data['registry']){
    if(data['scope']){
      insertSabbatic(pool, processData, cb);
    } else {
        scope.getDomainScope(pool, data.domain, function(err, scp){
          processData.scope = JSON.parse(JSON.stringify(scp))[0].id;
          insertSabbatic(pool, data, processData, cb);
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
			       insertSabbatic(pool, processData, cb);
	        } else {
	          scope.getDomainScope(pool, data.domain, function(err, scp){
	            processData.scope = JSON.parse(JSON.stringify(scp))[0].id;
	            insertSabbatic(pool, data, processData, cb);
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
			       insertSabbatic(pool, processData, cb);
	        } else {
	          scope.getDomainScope(pool, data.domain, function(err, scp){
	            processData.scope = JSON.parse(JSON.stringify(scp))[0].id;
	            insertSabbatic(pool, data, processData, cb);
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
			       insertSabbatic(pool, processData, cb);
	        } else {
	          scope.getDomainScope(pool, data.domain, function(err, scp){
	            processData.scope = JSON.parse(JSON.stringify(scp))[0].id;
	            insertSabbatic(pool, data, processData, cb);
	          });
	        }
	      });
		}
  }
}

function insertSabbatic(pool, dataAll, data, cb){
	invoice.insert(pool, data, function(err, result1){
    invoiceId = result1.insertId;
		updateDataResponse(pool, data.dataResponseId, invoiceId);
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
              invoiceTax.insert(pool, invoiceTax, function(err, invTax){
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

function updateDataResponse(pool, drId, invoiceId){
	var data = new Object();
	data.id = drId;
	data.sourceId = invoiceId;
	var array = new Array();
	var detail = new Object();
	detail.variable =  'status';
	detail.value =  'accepted';
	array[0] = detail;
	data.detail = array;

	dataResponse.updateDataResponse(pool, data, function(error, result){

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
	processData.domain = data.domain;
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

var sql = require("sql");
sql.setDialect("mysql");

var invoiceDetail	= require("./invoiceDetail");

var master = require("../master")(sql);
var database = require("../database");

var invoice = master.invoice;

var params = {
	id : invoice.id,
  domain : invoice.domain,
	registry : invoice.registry,
	series : invoice.series,
	number : invoice.number
}

module.exports.select = function(pool, filter, cb, order) {
	var order = order || invoice.id.asc;
	var query = invoice
		.select(invoice.star())
		.from(invoice)
		.where(filter(params))
		.order(order)
		.toQuery();
	database.query(pool, query.text, query.values, cb);
};

module.exports.insert = function(pool, data, cb){
	var query = invoice
		.insert(data)
		.toQuery();
	database.query(pool, query.text, query.values, cb);
}

module.exports.update = function(pool, data, cb){
	var query = invoice
		.update(data)
		.where(invoice.domain.equals(data.domain).and(invoice.id.equals(data.id)))
		.toQuery();
	database.query(pool, query.text, query.values, cb);
}

module.exports.delete = function(pool, id, cb){
	var query = invoice
		.delete()
		.where(invoice.id.equals(id))
		.toQuery();
	database.query(pool, query.text, query.values, cb);
}

exports.invoice = invoice;

// API FUNCTIONS

module.exports.invoice = function(pool, filter, cb){
	var query = invoice
		.select(invoice.star(), master.invoiceDetail.star())
		.from(invoice.join(master.invoiceDetail).on(master.invoiceDetail.invoice.equals(invoice.id)))
		.where(filter(params))
		.toQuery();
	database.query(pool, query.text, query.values, function(error, result){
		if(error) cb(error, null);
		var array = new Array();
		for(var i = 0; i < result.length; i++){
			console.log();
			if(array.length != 0 && array[array.length-1].id == result[i].invoice){
					array[array.length-1].detail[data.detail.length] = invoiceDetailData(result[i]);
			} else {
				var data = invoiceData(result[i]);
				data.detail = [invoiceDetailData(result[i])];
				array[array.length] = data;
			}
		}
		cb(null, array);
	});
}

function invoiceData(data){
	var o = new Object();
	o.id = data.invoice;
	o.series = data.series;
	o.number = data.number;
	o.reference_code = data.referenceCode;
	o.type = data.type;
	var registry = new Object();
	registry.id = data.registry;
	registry.name = data.rname;
	registry.document = data.rdocument;
	registry.document_type = data.rdocumentType;
	registry.document_country = data.rdocumentCountry;
	o.registry = registry;
	o.address = data.raddress; // TODO
	o.issue_date = data.issueDate;
	o.tax_date = data.taxDate;
	o.confidential = data.securityLevel == 1;
	o.status = data.status // TODO
	o.surcharge = data.surcharge == 1;
	o.withholding = data.withholding == 1;
	o.withholding_farmer = data.withholdingFarmer == 1;
	o.vat_accrual_payment = data.vatAccrualPayment == 1;
	o.investment = data.investment == 1;
	o.service = data.service == 1;
	o.advance = data.advance == 1;
	o.signed = data.signed == 1;
	o.comments = data.comments;
	o.remarks = data.remarks;
	o.transaction = data.transaction; // TODO
	o.rectification_type = data.rectificationType; // TODO
	o.rectification_invoice = data.rectificationInvoice; // TODO ¿URL?
	o.pos_shift = data.posShift;
	o.seller = data.seller; // TODO
	o.taxable_base = data.taxableBase;
	o.vat_quota = data.vatQuota;
	o.retention_quota = data.retentionQuota;
	o.total = data.total;
	o.creation_user = data.creationUser;
	o.creation_date = data.creationDate;
	o.modification_user = data.modificationUser;
	o.modification_date = data.modificationDate;
	return o;
}

function invoiceDetailData(data){
	var o = new Object();
	o.id = data.id;
	o.line = data.line;
	o.item = data.item;
	o.description = data.description;
	o.quantity = data.quantity;
	o.price = data.price;
	o.discount_expr = data.discountExpr;
	o.source = data.source;
	o.source_id = data.sourceId;
	o.taxable_base = data.taxableBase;
	o.taxes = data.taxes;
	o.prepayment = data.prepayment == 1;
	o.seller = data.seller;
	o.workplace = data.workplace;
	o.warehouse = data.warehouse;
	return o;
}

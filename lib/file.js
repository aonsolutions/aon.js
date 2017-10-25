var fs = require('fs');
var sql = require("sql");
sql.setDialect("mysql");

var master = require("./master")(sql);
var database = require("./database");

var contractAttach = master.contractAttach;
var dataAttach = master.dataAttach;
var invoiceAttach = master.invoiceAttach;
var itemAttach = master.iattach;
var offerAttach = master.offerAttach;
var payrollAttach = master.payrollBatchAttach;
var projectAttach = master.projectAttach;
var registryAttach = master.rattach;
var sepeAttach = master.sepeBatchAttach;

// ---------- FILTER

function filter(table, f){
	var filter;
	if(f.domain) filter = table.domain.equals(f.domain);
	if(f.id) filter = filter ? filter.and(table.id.equals(f.id)) : table.id.equals(f.id);
	if(f.source) filter = filter ? filter.and(table.source.equals(f.source)) : table.source.equals(f.source);
	if(f.sourceId) filter = filter ? filter.and(table.sourceId.equals(f.sourceId)) : table.sourceId.equals(f.sourceId);
  if(f.moduleId) {
    filter = filterModule(table, f, filter);
  }
	return filter;
}

function filterModule(table, f, filter){
  if("contract" == f.module) return filter ? filter.and(table.contract.equals(f.moduleId)) : table.contract.equals(f.moduleId);
  if("data" == f.module) return filter ? filter.and(table.dataResponse.equals(f.moduleId)) : table.dataResponse.equals(f.moduleId);
  if("invoice" == f.module) return filter ? filter.and(table.invoice.equals(f.moduleId)) : table.invoice.equals(f.moduleId);
  if("item" == f.module) return filter ? filter.and(table.item.equals(f.moduleId)) : table.item.equals(f.moduleId);
  if("offer" == f.module) return filter ? filter.and(table.offer.equals(f.moduleId)) : table.offer.equals(f.moduleId);
  if("project" == f.module) return filter ? filter.and(table.project.equals(f.moduleId)) : table.project.equals(f.moduleId);
  if("registry" == f.module) return filter ? filter.and(table.registry.equals(f.moduleId)) : table.registry.equals(f.moduleId);
  return filter;
}

// ---------- SELECT

module.exports.getFile = function(pool, f, cb) {
  if("contract" == f.module) selectFile(pool, contractAttach, f, cb);
  if("data" == f.module) selectFile(pool, dataAttach, f, cb);
  if("invoice" == f.module) selectFile(pool, invoiceAttach, f, cb);
  if("item" == f.module) selectFile(pool, itemAttach, f, cb);
  if("offer" == f.module) selectFile(pool, offerAttach, f, cb);
  if("payroll" == f.module) selectFile(pool, payrollAttach, f, cb);
  if("project" == f.module) selectFile(pool, projectAttach, f, cb);
  if("registry" == f.module) selectFile(pool, registryAttach, f, cb);
  if("sepe" == f.module) selectFile(pool, sepeAttach, f, cb);
}

function selectFile(pool, table, f, cb){
	var query;
	if(f.per_page && f.page){
		query = table
			.select(table.star())
			.from(table)
			.where(filter(table, f))
			.limit(f.per_page)
			.offset(f.page)
			.toQuery();
	} else {
		query = table
			.select(table.star())
			.from(table)
			.where(filter(table, f))
			.toQuery();
	}
	database.query(pool, query.text, query.values, cb);
};

// ---------- INSERT
module.exports.insertFile = function(pool, o, cb){
  if("contract" == o.module) insertFile(pool, contractAttach, o, cb);
  if("data" == o.module) insertFile(pool, dataAttach, o, cb);
  if("invoice" == o.module) insertFile(pool, invoiceAttach, o, cb);
  if("item" == o.module) insertFile(pool, itemAttach, o, cb);
  if("offer" == o.module) insertFile(pool, offerAttach, o, cb);
  if("payroll" == o.module) insertFile(pool, payrollAttach, o, cb);
  if("project" == o.module) insertFile(pool, projectAttach, o, cb);
  if("registry" == o.module) insertFile(pool, registryAttach, o, cb);
  if("sepe" == o.module) insertFile(pool, sepeAttach, o, cb);
}

function insertFile(pool, table, o, cb){
	delete o.module;
  var query = table
    .insert(o)
    .toQuery();
  database.query(pool, query.text, query.values, cb);
}

// ---------- UPDATE

module.exports.updateFile = function(pool, o, cb){
  if("contract" == f.module) updateFile(pool, contractAttach, o, cb);
  if("data" == f.module) updateFile(pool, dataAttach, o, cb);
  if("invoice" == f.module) updateFile(pool, invoiceAttach, o, cb);
  if("item" == f.module) updateFile(pool, itemAttach, o, cb);
  if("offer" == f.module) updateFile(pool, offerAttach, o, cb);
  if("payroll" == f.module) updateFile(pool, payrollAttach, o, cb);
  if("project" == f.module) updateFile(pool, projectAttach, o, cb);
  if("registry" == f.module) updateFile(pool, registryAttach, o, cb);
  if("sepe" == f.module) updateFile(pool, sepeAttach, o, cb);
}

function updateFile(pool, table, o, cb){
  var query = table
    .update(data)
    .where(table.domain.equals(o.domain).and(table.id.equals(o.id)))
    .toQuery();
  database.query(pool, query.text, query.values, cb);
}

// ---------- DELETE

module.exports.deleteFile = function(pool, id, cb){
  if("contract" == f.module) deleteFile(pool, contractAttach, id, cb);
  if("data" == f.module) deleteFile(pool, dataAttach, id, cb);
  if("invoice" == f.module) deleteFile(pool, invoiceAttach, id, cb);
  if("item" == f.module) deleteFile(pool, itemAttach, id, cb);
  if("offer" == f.module) deleteFile(pool, offerAttach, id, cb);
  if("payroll" == f.module) deleteFile(pool, payrollAttach, id, cb);
  if("project" == f.module) deleteFile(pool, projectAttach, id, cb);
  if("registry" == f.module) deleteFile(pool, registryAttach, id, cb);
  if("sepe" == f.module) deleteFile(pool, sepeAttach, id, cb);
}

function deleteFile(pool, table, id, cb){
  var query = table
		.delete()
		.where(table.id.equals(id))
		.toQuery();
  database.query(pool, query.text, query.values, cb);
}

function fileObject(obj, type){
	var o = new Object();
	if(SELECT == type){
		o.id = obj.dataResponse;
		o.domain = obj.domain;
		o.date = obj.attachDate;

    var category = new Object();
    category.id = obj.category;
    category.name = obj.categoryName;
    o.category = category;

    var mimetype = new Object();
    mimetype.id = "";
    mimetype.name = "";
    o.mimetype = mimetype;

    var type = new Object();
    type.id = "";
    type.name = "";
    o.type = type;

    var scope = new Object();
    scope.id = "";
    scope.name = "";
    o.scope = scope;

    o.confidential = obj.securityLevel == 1;

    o.drive = obj.driveId;
    o.size = obj.dparentId;

    if(obj.contract) {
      o.moduleId = obj.contract;
      o.module = "contract";
    } else if(obj.dataResponse){
      o.moduleId = obj.dataResponse;
      o.module = "data";
    } else if(obj.invoice){
       o.moduleId = obj.invoice;
       o.module = "invoice";
    } else if(obj.item){
      o.moduleId = obj.item;
      o.module = "item";
    } else if(obj.offer){
      o.moduleId = obj.offer;
      o.module = "offer";
    } else if(obj.project){
      o.moduleId = obj.project;
      o.module = "project";
    } else if(obj.registry){
      o.moduleId = obj.registry;
      o.module = "registry";
    }
	} else if(INSERT == type || UPDATE == type){
		o.domain = obj.domain;
		o.attachDate = obj.date;

  	if(obj.category) o.category = obj.category;
  	if(obj.mimeType) o.mimeType = obj.mimeType;
    o.description = obj.name;
  	o.data = "";
//  o.type = "";
//  o.scope = "";
//  o.securityLevel = "";
//  o.driveId = "";
//  O.dparentId = "";

    // MODULE

    if("contract" == f.module) o.contract = obj.moduleId;
    else if("data" == f.module) o.dataResponse = obj.moduleId;
    else if("invoice" == f.module) o.invoice = obj.moduleId;
    else if("item" == f.module) o.item = obj.moduleId;
    else if("offer" == f.module) o.offer = obj.moduleId;
    else if("project" == f.module) o.project = obj.moduleId;
    else if("registry" == f.module) o.registry = obj.moduleId;

    // AUDITORIA

  	if(INSERT == type){
			o.creation_user = '';
			o.creation_date = new Date();
		}
		o.modification_user = '';
		o.modification_date = new Date();
  }

	return o;
}

// BASE64 UTILS

function encode(file){
  var bitmap = fs.readFileSync(file);
  return new Buffer(bitmap).toString('base64');
}

function decode(base, file){
  var bitmap = new Buffer(base, 'base64');
  fs.writeFileSync(file, bitmap);
}

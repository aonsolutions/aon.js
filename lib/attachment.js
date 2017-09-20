var sql = require("sql");
sql.setDialect("mysql");

var master = require("../master")(sql);
var database = require("../database");

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
  if(f.moduleId) {
    filter = filterModule(table, f, filter));
  }
	return filter;
}

function filterModule(table, f, filter){
  if("contract".equals(f.module)) return filter ? filter.and(table.contract.equals(f.moduleId)) : table.contract.equals(f.moduleId);
  if("data".equals(f.module)) return filter ? filter.and(table.dataResponse.equals(f.moduleId)) : table.dataResponse.equals(f.moduleId);
  if("invoice".equals(f.module)) return filter ? filter.and(table.invoice.equals(f.moduleId)) : table.invoice.equals(f.moduleId);
  if("item".equals(f.module)) return filter ? filter.and(table.item.equals(f.moduleId)) : table.item.equals(f.moduleId);
  if("offer".equals(f.module)) return filter ? filter.and(table.offer.equals(f.moduleId)) : table.offer.equals(f.moduleId);
  if("project".equals(f.module)) return filter ? filter.and(table.project.equals(f.moduleId)) : table.project.equals(f.moduleId);
  if("registry".equals(f.module)) return filter ? filter.and(table.registry.equals(f.moduleId)) : table.registry.equals(f.moduleId);
  return filter;
}

// ---------- SELECT

module.exports.getAttach = function(pool, f, cb) {
  if("contract".equals(f.module)) selectAttach(pool, contractAttach, f, cb);
  if("data".equals(f.module)) selectAttach(pool, dataAttach, f, cb);
  if("invoice".equals(f.module)) selectAttach(pool, invoiceAttach, f, cb);
  if("item".equals(f.module)) selectAttach(pool, itemAttach, f, cb);
  if("offer".equals(f.module)) selectAttach(pool, offerAttach, f, cb);
  if("payroll".equals(f.module)) selectAttach(pool, payrollAttach, f, cb);
  if("project".equals(f.module)) selectAttach(pool, projectAttach, f, cb);
  if("registry".equals(f.module)) selectAttach(pool, registryAttach, f, cb);
  if("sepe".equals(f.module)) selectAttach(pool, sepeAttach, f, cb);
}

function selectAttach(pool, table, f, cb){
	var query = table
		.select(table.star())
		.from(table)
		.where(filter(f))
		.toQuery();
	database.query(pool, query.text, query.values, cb);
};

// ---------- INSERT

// ---------- UPDATE

// ---------- DELETE

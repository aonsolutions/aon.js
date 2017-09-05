var sql = require("sql");
sql.setDialect("mysql");

var master = require("./master")(sql);
var database = require("./database");
var registry	= require("./registry");

var invoice = master.invoice;

var params = {
	id : invoice.id,
  domain : invoice.domain
}

module.exports.select = function(pool, filter, cb) {
	var query = invoice
		.select(invoice.star())
		.from(invoice)
		.where(filter(params))
		.toQuery();
	database.query(pool, query.text, query.values, cb);
};

module.exports.insert = function(pool, data, cb){
	var processData = processData2(pool, data);
	console.log(data['registry']);
	console.log(data['registry'] == undefined);
	if(data['registry'] == undefined){
		registry.select(pool,
      function(params){
        return params.document.equals(data.nif)
  		         .and(params.domain.equals(data.domain));
      },
      function(err,data2){
    	   if (err) {
           console.log("ERROR : ",err);
         } else {
           processData.registry = JSON.parse(JSON.stringify(data2))[0].id;
				   insert(pool, processData, cb)
    	  }
      });
	} else {
		insert(pool, processData, cb);
	}
}

function insert(pool, data, cb){
	var query = invoice
		.insert(data)
		.toQuery();
	database.query(pool, query.text, query.values, cb);
}

module.exports.update = function(pool, data, cb){
	var query = invoice
		.update(data)
		.where(invoice.id.equals(data.id))
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

function processData2(pool, data){
	console.log(data.domain);

	var processData = new Object();
	processData.domain = data.domain;
	processData.series = data.series;
	processData.number = data.number;
	processData.reference_code = "00000"+ data.number;
	processData.issue_date = data.issue_date;
	processData.tax_date = data.tax_date;
	processData.rname = data.name;
	processData.rdocument = data.nif;
	processData.registry = data.registry;
	return processData;
}

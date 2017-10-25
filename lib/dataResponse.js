var sql = require("sql");
sql.setDialect("mysql");

var master = require("./master")(sql);
var database = require("./database");

var dataResponse = master.dataResponse;
var dataResponseDetail = master.dataResponseDetail;
var dataAttach = master.dataAttach;

var SELECT = "select";
var INSERT = "insert";
var UPDATE = "update";

function filter(f){
	var filter;
	if(f.domain) filter = dataResponse.domain.equals(f.domain);
	if(f.id) filter = filter ? filter.and(dataResponse.id.equals(f.id)) : dataResponse.id.equals(f.id);
	if(f.code) filter = filter ? filter.and(dataResponse.code.like('%'+ f.code +'%')) : dataResponse.code.like('%'+ f.code +'%');
	//if(f.date)
	if(f.source) filter = filter ? filter.and(dataResponse.source.equals(f.source)) : dataResponse.source.equals(f.source);
	if(f.sourceId) filter = filter.and(dataResponse.sourceId.equals(f.sourceId))
	var detailFilter;
	if(f.variable) detailFilter = detailFilter ? detailFilter.and(dataResponseDetail.dataVariable.equals(f.variable)) : dataResponseDetail.dataVariable.equals(f.variable);
	if(f.value)  detailFilter = detailFilter ? detailFilter.and(dataResponseDetail.dataValue.equals(f.value)) : dataResponseDetail.dataValue.equals(f.value);
	if(detailFilter)
		filter = filter.and(dataResponse.id.in(dataResponseDetail.select(dataResponseDetail.id).from(dataResponseDetail).where(detailFilter)));
	return filter;
}

// SELECT

module.exports.getDataResponse = function(pool, f, cb){
	getDataResponse(pool, f, cb);
}

function getDataResponse(pool, f, cb){
	var query;
	if(f.per_page && f.page){
		var dr = dataResponse
			.subQuery('dr')
			.select(dataResponse.id, dataResponse.domain, dataResponse.code, dataResponse.responseDate.as('responseDate'), dataResponse.source, dataResponse.sourceId.as('sourceId'))
			.from(dataResponse)
			.where(filter(f))
			.limit(f.per_page)
			.offset(f.page);

		query = dataResponseDetail
				.select(dr.id, dr.domain, dr.code, dr.source, dr.responseDate, dr.sourceId, dataResponseDetail.star())
				.from(dr.join(dataResponseDetail).on(dataResponseDetail.dataResponse.equals(dr.id)))
				.toQuery();

	} else {
		query = dataResponse
			.select(dataResponse.star(), dataResponseDetail.star())
			.from(dataResponse.join(dataResponseDetail).on(dataResponseDetail.dataResponse.equals(dataResponse.id)))
			.where(filter(f))
			.toQuery();
	}

	database.query(pool, query.text, query.values, function(error, result){
		if(error) cb(error, null);
		var array = new Array();
		for(var i = 0; i < result.length; i++){
			if(array.length != 0 && array[array.length-1].id == result[i].dataResponse){
					array[array.length-1].detail[data.detail.length] = dataResponseDetailData(result[i], SELECT);
			} else {
				var data = dataResponseData(result[i], SELECT);
				data.detail = [dataResponseDetailData(result[i], SELECT)];
				array[array.length] = data;
			}
		}
		cb(null, array);
	});
}

// INSERT

module.exports.insertDataResponse = function(pool, data, cb){
	var query1 = dataResponse
		.insert(dataResponseData(data, INSERT))
		.toQuery();
	database.query(pool, query1.text, query1.values,  function(error1, result1){
		var a = 0;
		for(var i = 0 ; i < data.detail.length ; i++){
			data.detail[i].dataResponse = result1.insertId;
			data.detail[i].domain = data.domain;
			var query2 = dataResponseDetail
		 		.insert(dataResponseDetailData(data.detail[i], INSERT))
		 		.toQuery();
		 	database.query(pool, query2.text, query2.values, function(error2, result2){
				a++;
				if(a == data.detail.length){
					var f = new Object();
					f.id = result1.insertId;
					getDataResponse(pool, f, cb)
				}
			});
		}
	});
}

// UPDATE

module.exports.updateDataResponse = function(pool, data, cb){
		var query = dataResponse
			.update(dataResponseData(data, UPDATE))
			.where(dataResponse.id.equals(data.id))
			.toQuery();
		database.query(pool, query.text, query.values, function(error1, result1){
			removeDetail(pool, data.id, function(error2, result2){
				var a = 0;
				for(var i = 0 ; i < data.detail.length ; i++){
					data.detail[i].dataResponse = data.id;
					data.detail[i].domain = data.domain;
					var query2 = dataResponseDetail
				 		.insert(dataResponseDetailData(data.detail[i], INSERT))
				 		.toQuery();
				 	database.query(pool, query2.text, query2.values, function(error3, result3){
						a++;
						if(a == data.detail.length){
							var f = new Object();
							f.id = data.id;
							getDataResponse(pool, f, cb)
						}
					});
				}
			});
		});
}

// DELETE

module.exports.removeDataResponse = function(pool, id, cb){
	remove(pool, id, cb);
}

function remove(pool, id, cb){
	deleteDataAttach(pool, id, function(error1, result1){
		deleteDetail(pool, id, function(error2, result2){
			var query = dataResponse
				.delete()
				.where(dataResponse.id.equals(id))
				.toQuery();
			database.query(pool, query.text, query.values, cb);
		});
	});
}

function removeDetail(pool, dataResponseId, cb){
	var query = dataResponseDetail
		.delete()
		.where(dataResponseDetail.dataResponse.equals(dataResponseId))
		.toQuery();
	database.query(pool, query.text, query.values, cb);
}

function removeDataAttach(pool, dataResponseId, cb){
	var query = dataAttach
		.delete()
		.where(dataAttach.dataResponse.equals(dataResponseId))
		.toQuery();
	database.query(pool, query.text, query.values, cb);
}


function dataResponseData(data, type){
	var o = new Object();
	if(SELECT == type){
		o.id = data.dataResponse;
		o.domain = data.domain;
		o.source = data.source;
		o.sourceId = data.sourceId;
		o.code = data.code;
		o.date = data.responseDate;
	} else if(INSERT == type || UPDATE == type){
		o.domain = data.domain;
		o.source = data.source;
		o.source_id = data.sourceId;
		o.code = data.code;
		o.response_date = data.date;
		if(INSERT == type){
			o.creation_user = '';
			o.creation_date = new Date();
		}
		o.modification_user = '';
		o.modification_date = new Date();
	}
	return o;
}


function dataResponseDetailData(data, type){
	var o = new Object();
	if(SELECT == type){
		o.id = data.id;
		o.variable = data.dataVariable;
		o.value = data.dataValue;
	} else if(INSERT == type || UPDATE == type){
		o.domain = data.domain;
		o.data_response = data.dataResponse;
		o.data_variable = data.variable;
		o.data_value = data.value;
		if(INSERT == type){
			o.creation_user = '';
			o.creation_date = new Date();
		}
		o.modification_user = '';
		o.modification_date = new Date();
	}
	return o;
}

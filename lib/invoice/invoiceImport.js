var sabbatic	= require("../sabbatic");
var domain = require("../domain");
var dataResponse = require("../dataResponse");
var file = require("../file");
var enums = require("../enum/enums");

module.exports.importFromFile = function(pool, data, cb){
	domain.get(pool,
		function(params) {
			return params.name.equals(data.domain);
		}, function( error, results, fields ){
			var domainId = results.id;
			sabbatic.login(data.sbUser,data.sbPassword, function(error, result){
				console.log(result.session_id);
				for(var i = 0; i < data.files.length; i++){
					if(data.files[i].contentType.contains('image'))){
						sabbatic.send(result.session_id, data.files[i].base64, function(error, r){
							console.log(r);
							r.domain = data.domain;
							createDataResponse(pool, r, function(error2, r2){
								var f = new Object();
								f.domain = data.domain;
								f.mimeType = enums.MIMETYPE.getByValue('name', data.files[i].contentType).id;
								f.module = "data";
								f.source = enums.DATA_ATTACH_SOURCE.INVOICE.id;
								f.sourceId = r2.id;
								f.description = data.files[i].name;
								f.data = data.files[i].base64;
								file.insertFile(pool, f, function(error, r){

								});
							});
						});
					} else if(data.files[i].contentType.contains('pdf')){
						// pdf 2 image
						// send image
					}
				}
			});
		}
	);
}

function createDataResponse(pool, data, callback){
  var data = new Object();
  data.domain = data.domain;
  data.code = data.title;
  data.source = enums.DATA_RESPONSE_SOURCE.SABBATIC.id;
	data.sourceId = data.id;
  data.date = Date.now();

  var array = new Array();
  var detail1 = new Object();
  detail1.variable = 'type';
  detail1.value = '0';

  var detail2 = new Object();
  detail2.variable = 'status';
  detail2.value = 'enviado';
  array[0] = detail1;
  array[1] = detail2;

  dataResponse.insertDataResponse(pool, data, function(err,result){
    if (err) {
      console.log("ERROR : ",err);
			callback(err, null);
    } else {
      console.log("result from db is : ",JSON.stringify(result, null, "\t"));
      callback(null, result);
    }
  });
}

var sabbatic	= require('../sabbatic');
var domain = require('../domain');
var dataResponse = require('../dataResponse');
var file = require('../file');
var enums = require('../enum/enums');
var fs = require('fs');
var PDFImage = require('pdf-image').PDFImage;

module.exports.importFromFile = function(pool, data, cb){
	domain.get(pool,
		function(params) {
			return params.name.equals(data.domain);
		}, function( error, results, fields ){
			var domainId = results[0].id;
			sabbatic.login(data.sbUser,data.sbPassword, function(error, result){
				console.log(result.session_id);
				for(var i = 0; i < data.files.length; i++){
					var fil = data.files[i];
					if(fil.contentType.includes('image')){
						sabbatic.send(result.session_id, data.files[i].base64, function(error, r){
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

								});
							});
						});
					} else if(fil.contentType.includes('pdf')){
							pdf2img(fil.base64, function(error3, result3){
								sabbatic.send(result.session_id, result3, function(error, r){
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

										});
									});
								});
							});
					}
				}
			});
		}
	);
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

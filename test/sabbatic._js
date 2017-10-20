var mysql = require("mysql");
var invoice	= require("../lib/invoice/invoiceImport");

/*
  var pool = mysql.createPool({
    host     : 'dbsnapshot.cdhc46h3yjvt.eu-west-1.rds.amazonaws.com',
    user     : 'snapshot',
    password : 'sn4psh0t',
    database : 'sig-grupo-esferalia'
  });
*/

var pool = mysql.createPool({
  host: "127.0.0.1",
  user: "aibanez",
  password: "aibanez",
  database: "pro-aonsolutions-net"
});


var data = new Object();

data.domain = 5355;
  //data.scope = 1;
data.tax_date = '2017-10-02';

data.type = 2;
//data.series = 'P';
data.number = 30303030;
data.issue_date = '2017-10-02';
// country
data.nif = '16283545M';
data.name = 'ANA';
data.total_amount = 10.0;
data.comments = "comentarios de la factura";

data.tax_type = 1;
data.tax_percentage = 21.0;
data.tax_quota = 2.1;
data.surcharge_percentage = 0;
data.surcharge_quota = 0;

invoice.import(pool, data, function(error, result){

})

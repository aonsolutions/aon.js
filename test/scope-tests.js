var mysql = require("mysql");
var scope	= require("../lib/scope");

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

var domain = 4555;
//var domain = 5355:

scope.getDomainScope(pool, domain, function(err, data){
  console.log(data);
});

var mysql = require("mysql");
var invoice	= require("../lib/invoice");

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

//selectAllInvoice();
//selectInvoice(140);
//insertInvoice();

function insertInvoice(){
  var data = new Object();
  data.type = 0;
  data.total = 0.0;
  data.comments = "comentarios de la factura";

  data.domain = 1;
  data.series = 'P';
  data.number = 44444;
  data.issue_date = '2017-10-02';
  data.tax_date = '2017-10-02';
//  data.registry = 20;
  data.scope = 1;
  data.nif = '16283545M';
  data.name = 'ANA';

  console.log(" INSERT INVOICE ");
  console.log(" ");
  invoice.insert(pool, data, function(err,data){
    if (err) {
      // error handling code goes here
      console.log("ERROR : ",err);
    } else {
      // code to execute on data retrieval
      console.log("result from db is : ",data);
      console.log(" ");
      //updateDomain(data.insertId);
    }
  });
}

function deleteInvoice(id){
  console.log(" DELETE INVOICE ");
  console.log(" ");
  domain.delete(pool, id, function(err,data){
    if (err) {
      // error handling code goes here
      console.log("ERROR : ",err);
    } else {
      // code to execute on data retrieval
      console.log("result from db is : ",data);
      console.log(" ");
    }
  });
}

function updateInvoice(id){
  var data2 = new Object();
  data2.name = "aibanez2222.aibanez.net"
  data2.id = id;
  console.log(" UPDATE DOMAIN ");
  console.log(" ");
  domain.update(pool, data2, function(err,data){
    if (err) {
      // error handling code goes here
      console.log("ERROR : ",err);
    } else {
      // code to execute on data retrieval
      console.log("result from db is : ",data);
      console.log(" ");
      deleteInvoice(id);
    }
  });
}

function selectInvoice(id){
  console.log(" SELECT INVOICE ");
  console.log(" ");
  invoice.select(pool, function(params){
    return params.id.equals(id);
  }, function(err,data){
    if (err) {
      // error handling code goes here
      console.log("ERROR : ",err);
    } else {
      // code to execute on data retrieval
      console.log("result from db is : ",data);
    }
  });
  console.log(" ");
}

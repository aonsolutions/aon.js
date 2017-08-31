var sql = require("sql");
var db	= require("./db");
var master = require("./master")();

sql.setDialect('mysql');

//now let's make a simple query
var query = master.invoice.select(master.invoice.id).from(master.invoice).toQuery();
db.query(query);

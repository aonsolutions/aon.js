var sql = require("sql");
sql.setDialect("mysql");

var master = require("./master")(sql);
var database = require("./database");

var user = master.user;
var mailAccount = master.mailAccount;

function filter(f){
	var filter;
	if(f.domain) filter = user.domain.equals(f.domain);
	if(f.id) filter = filter ? filter.and(user.id.equals(f.id)) : user.id.equals(f.id);
	if(f.username) filter = filter ? filter.and(user.login.equals(f.username)) : user.id.equals(f.id);
	if(f.email) filter = filter ? filter.and(mailAccount.email.equals(f.email)) : mailAccount.email.equals(f.email);
	// ...
	return filter;
}

module.exports.select = function(pool, f, cb) {
	var query = user
		.select(user.star())
		.from(user.join(mailAccount).on(mailAccount.userId.equals(user.id)))
		.where(filter(f))
		.toQuery();
	database.query(pool, query.text, query.values, cb);
};

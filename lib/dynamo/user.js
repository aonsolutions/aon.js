var bcrypt = require('bcryptjs');
var AWS = require("aws-sdk");

var dynamodb = new AWS.DynamoDB();
var docClient = new AWS.DynamoDB.DocumentClient();

exports.getUser = function(email, cb){
  var params = {
		TableName: "User",
		Key:{
			"email": email
		}
	}
	docClient.get(params, cb);
}

exports.createUser = function(data, cb){
  var salt = bcrypt.genSaltSync(10);
  var hash = bcrypt.hashSync(data.password, salt);
	var params = {
		TableName: "User",
		Item:{
			"email": data.email,
			"password": hash
		}
	}
	docClient.put(params, cb);
}

exports.deleteUser = function(email, cb){
	var params = {
	    TableName:"User",
	    Key:{
	      "email": email
	    }
	};
	docClient.delete(params, cb);
}

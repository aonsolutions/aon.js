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

exports.getUserList = function(data, cb){
  var FE;
  var EAN;
  var EAV;
  if(data.email){
    FE = "#e = :e";
    EAN = {"#e": "email"};
    EAV = {":e": data.email};
  } else if(data.company && data.group){
    FE = "contains(#cp, :cp) and contains(#gr, :gr)";
    EAN = {"#cp": "companies", "#gr": "groups"};
    EAV = {":cp": data.company, ":gr": data.group};
  } else if(data.company){
    FE = "contains(#cp, :cp)";
    EAN = {"#cp": "companies"};
    EAV = {":cp": data.company};
  } else if(data.group){
    FE = "contains(#gr, :gr)";
    EAN = {"#gr": "groups"};
    EAV = {":gr": data.group};
  }
  var params = FE ? {
    TableName: "User",
    ProjectionExpression:"email, companies, groups",
    FilterExpression: FE,
    ExpressionAttributeNames: EAN,
    ExpressionAttributeValues: EAV
  } : {TableName: "User", ProjectionExpression:"email, companies, groups"};
  docClient.scan(params, cb);
}

exports.createUser = function(data, cb){
  var salt = bcrypt.genSaltSync(10);
  var hash = bcrypt.hashSync(data.password, salt);
	var params = {
		TableName: "User",
		Item:{
			"email": data.email,
			"password": hash,
      "companies": data.companies,
      "groups": data.groups
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

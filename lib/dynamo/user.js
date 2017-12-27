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
  var filter;
  if(data.email){
    filter = "#e = :e";
  } else if(data.company && data.group){
    filter = "contains(#cp, :cp) and contains(#gr, :gr)";
  } else if(data.company){
    filter = "contains(#cp, :cp)";
  } else if(data.group){
    filter = "contains(#gr, :gr)"
  }
  var params = {
      TableName: "User",
      FilterExpression: filter,
      ExpressionAttributeNames: {
          "#e": "email",
          "#cp": "companies",
          "#gr": "groups"
      },
      ExpressionAttributeValues: {
           ":e": data.email,
           ":cp": data.company,
           ":gr": data.group
      }
  };
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

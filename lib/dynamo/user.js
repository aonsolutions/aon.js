var bcrypt = require('bcryptjs');
var AWS = require("aws-sdk");

/**
 *  AWS LOCAL CONFIGURATION
 *
AWS.config.update({
  region: "eu-west",
  endpoint: "http://localhost:8000"
});
/**************************/

var dynamodb = new AWS.DynamoDB();
var docClient = new AWS.DynamoDB.DocumentClient();

/**
 * USER EXPORTS FUNCTIONS
 */

exports.createUserTable = createUserTable;
exports.deleteUserTable = deleteUserTable;

exports.getUser = getUser;
exports.getUserList = getUsers;
exports.createUser = createUser;
exports.deleteUser = deleteUser;

/**
 * DYNAMODB USER TABLE FUNCTIONS
 */

function createUserTable(cb){
  var params = {
      TableName : "User",
      KeySchema: [
          { AttributeName: "email", KeyType: "HASH"}  //Partition key
      ],
      AttributeDefinitions: [
          { AttributeName: "email", AttributeType: "S" }
      ],
      ProvisionedThroughput: {
          ReadCapacityUnits: 5,
          WriteCapacityUnits: 5
      }
  };
  dynamodb.createTable(params, cb);
}

function getUser(email, cb){
  var params = {
		TableName: "User",
		Key:{
			"email": email
		}
	}
	docClient.get(params, cb);
}

function getUsers(data, cb){
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

function createUser(data, cb){
  if(!data.email){
    cb(new Error("Falta email"));
  } else if(!data.password){
    cb(new Error("Falta password"));
  } else {
    var salt = bcrypt.genSaltSync(10);
    var hash = bcrypt.hashSync(data.password, salt);
	  var params = {
		  TableName: "User",
		  Item:{
        "email": data.email,
			  "password": hash,
        "companies": data.companies,
        "groups": data.groups,
        "alias": data.alias
		  }
	 }
	 docClient.put(params, cb);
  }
}

function deleteUser(email, cb){
	var params = {
	    TableName:"User",
	    Key:{
	      "email": email
	    }
	};
	docClient.delete(params, cb);
}

function deleteUserTable(cb){
  var params = {
      TableName : "User"
  };

  dynamodb.deleteTable(params, cb);
}

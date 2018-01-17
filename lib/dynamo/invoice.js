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
 * INVOICE EXPORTS FUNCTIONS
 */

exports.createInvoiceTable = createInvoiceTable;
exports.deleteInvoiceTable = deleteInvoiceTable;

exports.getInvoice = getInvoice;
exports.getInvoices = getInvoices;
exports.createInvoice = createInvoice;
exports.updateInvoice = updateInvoice;
exports.deleteInvoice = deleteInvoice;

exports.getLastNumber = getLastNumber;
exports.createLastNumber = createLastNumber;
exports.updateLastNumber = updateLastNumber;
exports.deleteLastNumber = deleteLastNumber;

/**
 * DYNAMODB USER TABLE FUNCTIONS
 */

function createInvoiceTable(cb){
	var params = {
	    TableName : "Invoice",
	    KeySchema: [
	        { AttributeName: "company", KeyType: "HASH"},  //Partition key
	        { AttributeName: "number", KeyType: "RANGE" }  //Sort key
	    ],
	    AttributeDefinitions: [
	        { AttributeName: "company", AttributeType: "S" },
	        { AttributeName: "number", AttributeType: "N" }
	    ],
	    ProvisionedThroughput: {
	        ReadCapacityUnits: 5,
	        WriteCapacityUnits: 5
	    }
	};
	dynamodb.createTable(params, cb);
}

function deleteInvoiceTable(cb){
	var params = {
	    TableName : "Invoice"
	};
	dynamodb.deleteTable(params, cb);
}

function getInvoice(data, cb){
	var params = {
    TableName: "Invoice",
    Key:{
        "company": data.company,
        "number": data.number
    }
	};
	docClient.get(params, cb);
}

function getInvoices(data, cb){
	var FE = "#c = :c";
	var EAN = {"#c": "company"};
	var EAV = {":c": data.company};

	if(data.reference){
  	FE = FE + " and #ref = :ref"
  	EAN = Object.assign({}, EAN, {"#ref": "info.reference"});
  	EAV = Object.assign({}, EAV, {":ref": data.reference});
	}

	if(data.sender){
  	FE = FE + " and #s = :s"
  	EAN = Object.assign({}, EAN, {"#s": "info.sender.documento"});
  	EAV = Object.assign({}, EAV, {":s": data.sender});
	}

	if(data.receiver){
  	FE = FE + " and #r = :r"
  	EAN = Object.assign({}, EAN, {"#r": "info.receiver.documento"});
  	EAV = Object.assign({}, EAV, {":r": data.receiver});
	}

	// TODO date

	var params = {
  	TableName: "Invoice",
  	FilterExpression: FE,
  	ExpressionAttributeNames: EAN,
  	ExpressionAttributeValues: EAV
	}
	docClient.scan(params, cb);
}

function createInvoice(company, number, info, cb){
	console.log(company);
	console.log(number);
	console.log(info);
	var params = {
		TableName: "Invoice",
		Item:{
			"company": company,
			"number": number,
			"info": info
		}
	}
	docClient.put(params, cb);
}

function updateInvoice(data, cb){
	var params = {
    TableName:"Invoice",
    Key:{
      "company": data.company,
      "number": data.number
    },
    UpdateExpression: "set info = :r",
    ExpressionAttributeValues:{
        ":r": data.info
    },
    ReturnValues:"UPDATED_NEW"
	};

	docClient.update(params, cb);
}

function deleteInvoice(data, cb){
	var params = {

    TableName:"Invoice",
    Key:{
      "company": data.company,
      "number": data.number
    }
	};
	docClient.delete(params, cb);
}

function getLastNumber(data, cb){
	var params = {
  	TableName : "Invoice",
  	KeyConditionExpression: "#c = :cp",
  	ExpressionAttributeNames:{
      "#c": "company"
  	},
  	ExpressionAttributeValues: {
      ":cp": data + '-LAST'
  	}
	};
	docClient.query(params, cb);
}

function deleteLastNumber(data, cb){
	var params = {
    TableName:"Invoice",
    Key:{
      "company": data.company,
      "number": data.number - 1
    }
	};
	docClient.delete(params, cb);
}

function updateLastNumber(data, cb){
	var params = {
    TableName:"Invoice",
    Key:{
      "company": data.company
    },
    UpdateExpression: "set number = :r",
    ExpressionAttributeValues:{
        ":r": data.number
    },
    ReturnValues:"UPDATED_NEW"
	};
	docClient.update(params, cb);
}

function createLastNumber(data, cb){
	var params = {
		TableName: "Invoice",
		Item: data
	}
	docClient.put(params, cb);
}

function getSabbaticPendingInvoices(cb){
	var params = {
		TableName : "Invoice",
		ProjectionExpression:"#c, #n",
		FilterExpression: "#c = :cp and (#i.#s = :st1 or #i.#s = :st2)",
		ExpressionAttributeNames:{
			"#c": "company",
			"#n": "number",
			"#i": "info",
			"#s": "status"

		},
		ExpressionAttributeValues: {
			":cp":"SABBATIC",
			":st1" : "Enviado",
			":st2" : "pendiente"
		}
	};

	docClient.scan(params, cb);
}

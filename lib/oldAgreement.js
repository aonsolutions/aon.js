var sql = require("sql");
sql.setDialect("mysql");

var master = require("./master")(sql);
var database = require("./database");

var agreement = master.agreement;
var extra = master.agreementExtra;
var payment = master.agreementPayment;
var payment_concept = master.paymentConcept;
var data = master.agreementData;
var level = master.agreementLevel;
var level_data = master.agreementLevelData;
var level_category = master.agreementLevelCategory;

var params = {
	id : agreement.id
}

	//Funcion para parsear un fecha
	var parseDate = function(date){
		if (null != date) {
			return date.toISOString().split('T')[0];
		}else {
			return null;
		}
	}

	//Comprueba si la primera fecha es posterior o igual a la segunda
	var gte = function(date1, date2){
		if (date1 == null) {
			return true;
		}
		else if(date1 >= date2){
			return true;
		}
		else{
			return false;
		}
	}

	//Comprueba si la primera fecha es anterior o igual a la segunda
	var lte = function(date1, date2){
		if (date1 == null) {
			return false;
		}
		else if (date2 == null) {
			return true;
		}
		else if(date1 <= date2){
			return true;
		}
		else{
			return false;
		}
	}

	var getLevelsData = function(next){
		return function (connection, aagreement){
			var query1 = level
				.select(level_data.star())
				.from(level.join(level_data)
					.on(level.id.equals(level_data.agreementLevel)))
				.where(level.agreement.equals(aagreement.id))
				.toQuery();

			var query2 = data
				.select(data.id, data.domain, data.name, data.literal('0').as("agreementLevel"),
								data.expression, data.startDate, data.endDate)
				.from(data)
				.where(data.agreement.equals(aagreement.id))
				.toQuery();

			var sql = query1.text + " UNION " + query2.text;
			var values = query1.values.concat(query2.values);

			connection.query(
				{sql:sql, nestTables: false, values:values},
				function(error, results, fields){
					var levels=[];
					for ( var i = 0; i < results.length; i++ ){
						var agreeLvlDat = results[i];
						for(var j = 0; j < aagreement.periods.length; j++){
							var period = aagreement.periods[j];
							if (gte(period.end_date, agreeLvlDat.startDate)
									&& lte(period.start_date, agreeLvlDat.endDate)){
								for(var k = 0; k < period.levels.length; k++){
									var level = period.levels[k];
									if (level.id == agreeLvlDat.agreementLevel){
										level.datas[agreeLvlDat.name] = level.datas[agreeLvlDat.name] || agreeLvlDat.expression;
									}else{
										var data = {
											name: agreeLvlDat.name,
											expression: undefined
										}
									}
								}
							}
						}
					}
					next(connection, aagreement);
				}
			);
		}
	}

	var getLevelsCategory = function(next){
		return function (connection, aagreement){
			var query = level
				.select(level.star(), level_category.star())
				.from(level.join(level_category)
					.on(level.id.equals(level_category.agreementLevel)))
				.where(level.agreement.equals(aagreement.id))
				.toQuery();

			connection.query(
				{sql:query.text, nestTables: true, values:query.values},
				function(error, results, fields){
					levels=[];
					for ( var i = 0; i < results.length;){
						var agreeLvl = results[i].agreement_level;
						var level = {
							id: agreeLvl.id,
							description: agreeLvl.description,
							categories: []
						}
						levels.push(level);

						while (i < results.length) {
							var agreeLvlCat = results[i].agreement_level_category;
							if (agreeLvl.id != agreeLvlCat.agreementLevel)
								break;
							level.categories.push(agreeLvlCat.description);
							i++;
						}
					}
					aagreement.levelsCategory = levels;

					//Añadir niveles a los periodos
					for (var i=0; i < aagreement.periods.length; i++){
						var levelsPeriod=[];
						for (var j=0; j < aagreement.levelsCategory.length; j++){
							//Crear Level para periodos
							var levelPeriod = {
								id: aagreement.levelsCategory[j].id,
								description : aagreement.levelsCategory[j].description,
								//levelName: aagreement.levelsCategory[j].description,
								datas:{}
							}
							levelsPeriod.push(levelPeriod);
						}
						//Crear el nivel 0
						var levelPeriod = {
							id: 0,
							description : "0",
							//levelName: "0",
							datas:{}
						}
						levelsPeriod.push(levelPeriod);
						aagreement.periods[i].levels = levelsPeriod;
					}
					next(connection, aagreement);
				}
			);
		}
	}

	var getPeriods = function(next){
		return function (connection, aagreement ){
			var query = level_data
			.select(level_data.startDate, level_data.endDate)
			.from(level_data.join(level)
				.on(level_data.agreementLevel.equals(level.id)))
			.where(level.agreement.equals(aagreement.id))
			.group(level_data.startDate, level_data.endDate)
			.order(level_data.startDate, level_data.endDate)
			.toQuery();

			connection.query({
				sql: query.text,
				values: query.values,
				},
				function(error, results, fields){
					var period=[];
					//Caso base para comprar la primera vez
					var p = {
						start_date: 0,
						end_date : 0
					}
					for ( var i = 0; i < results.length; i++ ){
						var dateAux = new Date(results[i].startDate);
						dateAux.setTime(dateAux.getTime() - 1 * (24*360*1000));
						p.end_date = gte(p.end_date,dateAux) ? dateAux : p.end_date;
						p = {
							start_date: parseDate(results[i].startDate),
							end_date : parseDate(results[i].endDate)
						}
						period[i] = p
					}
					aagreement.periods = period;
					next(connection, aagreement);
				}
			);
		}
	}

	// var _datas = function(next){
	// 	return function (pool, aagreement ){
	// 		var query = data
	// 			.select(data.star())
	// 			.from(data)
	// 			.where(data.agreement.equals(aagreement.id))
	// 			.toQuery();
	//
	// 		database.query(pool,
	// 			query.text,
	// 			query.values,
	// 			function(error, results, fields){
	// 				datas=[];
	// 				for ( var i = 0; i < results.length; i++ ){
	// 					datas[i] = {
	// 						id: results[i].id,
	// 						expression: results[i].expression,
	// 						start_date: results[i].startDate,
	// 						end_date: results[i].endDate
	// 					}
	// 				}
	// 				aagreement.datas = datas;
	// 				next(pool, aagreement);
	// 			}
	// 		);
	// 	}
	// }

	var getExtras = function(next){
		return function (connection, aagreement ){
			var extraJoins = extra
		  .join(payment)
				.on(payment.id.equals(extra.agreementPayment))
			.join(payment_concept)
				.on(payment.id.equals(extra.agreementPayment).and(
					payment_concept.id.equals(payment.paymentConcept)
				));

			var query = extra
				.select(payment.star(), extra.star(), payment_concept.star())
				.from(extraJoins)
				.where(extra.agreement.equals(aagreement.id))
				.toQuery();

			connection.query(
				{sql:query.text, nestTables: true, values:query.values},
				function(error, results, fields){
					extras=[];
					for ( var i = 0; i < results.length; i++ ){
						var agreeExt = results[i].agreement_extra;
						var agreePay = results[i].agreement_payment;
						var payConp = results[i].payment_concept;
						var payConcept = {
							id : payConp.id,
							domain : payConp.domain,
							code : payConp.code,
							description : payConp.description,
							type : payConp.type,
							descriptionDecorable : payConp.descriptionDecorable,
							expression : payConp.expression,
							irpfExpression : payConp.irpfExpression,
							quoteExpression : payConp.quoteExpression
						};
						extras[i] = {
							id: results[i].id,
							start_date: agreeExt.startDate,
							end_date: agreeExt.endDate,
							issue_date: agreeExt.issueDate,
							agreePayment: {
								id: agreePay.id,
								code : agreePay.code,
								expression: agreePay.expression,
								description: agreePay.description,
								type: "CRA "+agreePay.type,
								startDate : new Date(0),
								descriptionDecorable : agreePay.descriptionDecorable ? agreePay.descriptionDecorable : 0,
								irpfExpression: agreePay.irpfExpression,
								quoteExpression: agreePay.quoteExpression,
								__payConcept : payConcept
							}
						}
					}
					aagreement.extras = extras;
					next(connection, aagreement);
				}
			);
		}
	}

	var getPayments = function(next){
		return function (connection, aagreement ){
			var paymentJoins = payment
		  .join(payment_concept).on(payment.paymentConcept.equals(payment_concept.id))
		  .leftJoin(extra).on(payment.id.equal(extra.agreementPayment));

			var query = payment
				.select(payment.star(), payment_concept.star())
				.from(paymentJoins)
				.where(payment.agreement.equals(aagreement.id).and(extra.id.isNull()))
				.toQuery();


			connection.query(
				{sql:query.text, nestTables: true, values:query.values},
				function(error, results, fields){
					payments=[];
					for ( var i = 0; i < results.length; i++ ){
						var agreePay = results[i].agreement_payment;
						var payConp = results[i].payment_concept;
						var payConcept = {
							id : payConp.id,
							domain : payConp.domain,
							code : payConp.code,
							description : payConp.description,
							type : payConp.type,
							descriptionDecorable : payConp.descriptionDecorable,
							expression : payConp.expression,
							irpfExpression : payConp.irpfExpression,
							quoteExpression : payConp.quoteExpression
						};
						payments[i] = {
							id: agreePay.id,
							code: payConp.code,
							expression: agreePay.expression ? agreePay.expression : payConp.expression,
							description: agreePay.description ? agreePay.description : payConp.description,
							type: agreePay.type ? "CRA "+agreePay.type : "CRA "+payConp.type,
							startDate : new Date(0),
							descriptionDecorable : agreePay.descriptionDecorable ? agreePay.descriptionDecorable : payConp.descriptionDecorable,
							irpfExpression: agreePay.irpfExpression ? agreePay.irpfExpression : payConp.irpfExpression,
							quoteExpression: agreePay.quoteExpression ? agreePay.quoteExpression : payConp.quoteExpression,
							__payConcept : payConcept
						}
					}
					aagreement.payments = payments;
					next(connection, aagreement);
				}
			);
		}
	}

	module.exports.get = function(connection, filter, cb) {
		var query = agreement
			.select(agreement.star())
			.from(agreement)
			.where(agreement.id.equals(filter))
			//.where(filter(params))
			.toQuery();

		connection.query({
			sql: query.text,
			values: query.values
		},
		function(error, results, fields){
				aagreement= {
					id: results[0].id,
					domain: results[0].domain,
					calendar: results[0].calendar,
					description: results[0].description
				};
				var levelsData = getLevelsData(cb);
				var levelsCategory = getLevelsCategory(levelsData);
				var periods = getPeriods(levelsCategory);
				var extras = getExtras(periods);
				var payments = getPayments(extras);
				payments(connection, aagreement);
			}
		);
	}


/**
-------------------------------------------------------------------------------
-------------------------------------------------------------------------------
-------------------------    	UPDATE DATABASE     -----------------------------
-------------------------------------------------------------------------------
-------------------------------------------------------------------------------
*/


	module.exports.set = function(pool, aagreement, cb) {
		// Get all the payments concepts from the domain 0
		var query = payment_concept
			.select(payment_concept.star())
			.from(payment_concept)
			.where(payment_concept.domain.equals(0))
			.toQuery();

		// If the concept is from domain 0, we create a new inner field "__concept"
		database.query(pool,
			query.text,
			query.values,
			function(error, results, fields){
				if (error) throw error;
				for(var i=0; i<results.length; i++){
					for(var j=0; j<aagreement.payments.length; j++){
						var payment_rec = aagreement.payments[j];
						if(payment_rec.code == results[i].code){
							payment_rec.__concept = {};
							payment_rec.__concept["id"] = results[i].id;
							payment_rec.__concept["code"] = results[i].code;
							payment_rec.__concept["expression"] = results[i].expression;
							payment_rec.__concept["description"] = results[i].description;
							payment_rec.__concept["type"] = results[i].type;
							payment_rec.__concept["descriptionDecorable"] = results[i].descriptionDecorable;
							payment_rec.__concept["irpfExpression"] = results[i].irpfExpression;
							payment_rec.__concept["quoteExpression"] = results[i].quoteExpression;
						}
					}
				}

				var datas = setDatas(aagreement, cb);
				var agreementLevelCategory = setAgreementLevelCategory(aagreement, cb, datas);
				var agreementLevel = setAgreementLevel(aagreement, cb, agreementLevelCategory);
				var extras = setExtras(aagreement, cb, agreementLevel);
				var paymentsExtras = setPaymentsExtras(aagreement, cb, extras);
				var payments = setPayments(aagreement, cb, paymentsExtras);
				var paymentConcept = setPaymentsConcept(aagreement, cb, payments);
				var eLevelData = eraseLevelData(aagreement, cb, paymentConcept);
				var eDatas = eraseDatas(aagreement, cb, eLevelData);
				var ePayments = erasePayments(aagreement, cb, eDatas);
				var eExtras = eraseExtras(aagreement, cb, ePayments);
				var ePaymentsConcept = erasePaymentsConcept(aagreement, cb, eExtras);
				var agreementTable = setAgreement(aagreement, cb, ePaymentsConcept);

				agreementTable(
					aagreement,
					function callback (sql,next){
						console.log(sql);
						next();
						// database.query(pool, sql, function (error, results, fields){
						// 	console.log(sql);
				    //   if ( error )
				    //     throw error;
				    //   next();
						// 	});
					}
				)

			}
		);
	}

	var setAgreement = function(aagreement, callback, next){
		return function (){
			if(aagreement.id == null){
				var setagreementid = {};
				// Get MAX Id fron payment_concept table
				setagreementid.text = "SET @AGREEMENT_ID = (SELECT MAX(id) FROM agreement);";
				setagreementid.values = [];

				var values = {};
				values[agreement.id.name] = "@AGREEMENT_ID+1";
				values[agreement.domain.name] = aagreement.domain;
				values[agreement.calendar.name] = aagreement.calendar;
				values[agreement.description.name] = aagreement.description;

				aagreement.id = "@AGREEMENT_ID+1";

				var insertAgree = agreement.insert(values);
				var insert = insertAgree.toQuery();

				//callback( insert , callback( setagreementid , next ) );
				callback( setagreementid , function() { callback( insert , next ) } );

			}else {
				var id = aagreement.id;
				var calendar = aagreement.calendar;
				var description = aagreement.description;

				var query = agreement
					.update({"calendar" : calendar,
									"description" : description})
					.where(agreement.id.equals(id))
					.toQuery();

				callback( query , next );
			}
		}
	}

	var erasePaymentsConcept = function(aagreement, callback, next){
		return function (){
			var query = payment_concept
				.delete()
				.from(payment_concept)
				.where(payment_concept.domain.notEquals(0))
				.and(payment_concept.id.in(
					payment
					.select(payment.paymentConcept)
					.from(payment)
					.where(payment.agreement.equal(aagreement.id)))
				)
				.toQuery();

			callback( query , next );
		}
	}

	var eraseExtras = function(aagreement, callback, next){
		return function (){
			var query = extra
				.delete()
				.from(extra)
				.where(extra.agreement.equals(aagreement.id))
				.toQuery();

			callback( query , next );
		}
	}

	var erasePayments = function(aagreement, callback, next){
		return function (){
			var query = payment
				.delete()
				.from(payment)
				.where(payment.domain.notEquals(0))
				.and(payment.agreement.equal(aagreement.id))
				.toQuery();

			callback( query , next );
		}
	}

	var eraseDatas = function(aagreement, callback, next){
		return function (){
			var query = data
				.delete()
				.from(data)
				.where(data.agreement.equal(aagreement.id))
				.toQuery();

			callback( query , next );
		}
	}

	var eraseLevelData = function(aagreement, callback, next){
		return function (){
			var query = level_data
				.delete()
				.from(level_data)
				.where(level_data.agreementLevel.in(
					level
					.select(level.id)
					.from(level)
					.where(level.agreement.equal(aagreement.id)))
				)
				.toQuery();

			callback( query , next );
		}
	}

	var setPaymentsConcept = function(aagreement, callback, next){
		return function (){

			var domain = aagreement.domain;
			var agreement_id = aagreement.id;

			var setconceptid = {};

			// Create statement we'll insert
			var insertPayConcept = payment_concept;

			// Get MAX Id fron payment_concept table
			setconceptid.text = "SET @CONCEPT_ID = (SELECT MAX(id) FROM payment_concept);";
			setconceptid.values = [];

			for(var i = 0; i<aagreement.payments.length; i++){
				var payment_rec = aagreement.payments[i];
				if (payment_rec.__concept == undefined){
					var payConceptCode = payment_rec.code;
					var payConceptExpression = payment_rec.expression;
					var payConceptDescription = payment_rec.description;
					var payConceptType = payment_rec.type.split(" ")[1];
					var payConceptIrpfExpression = payment_rec.irpfExpression;
					var payConceptQuoteExpression = payment_rec.quoteExpression;

					var cont = i + 1;
					var values = {};
					values[payment_concept.id.name] = "@CONCEPT_ID+"+cont;
					values[payment_concept.domain.name] = domain;
					values[payment_concept.code.name] = payConceptCode;
					values[payment_concept.type.name] = payConceptType;
					values[payment_concept.expression.name] = payConceptExpression;
					values[payment_concept.description.name] = payConceptDescription;
					values[payment_concept.irpfExpression.name] = payConceptIrpfExpression;
					values[payment_concept.quoteExpression.name] = payConceptQuoteExpression;

					// Create field "__concept" for all the concepts that aren't in the domain 0
					payment_rec.__concept = {};
					payment_rec.__concept["id"] = "@CONCEPT_ID+"+cont;
					payment_rec.__concept["code"] = payConceptCode;
					payment_rec.__concept["expression"] = payConceptExpression;
					payment_rec.__concept["description"] = payConceptDescription;
					payment_rec.__concept["type"] = payConceptType;
					payment_rec.__concept["descriptionDecorable"] = 0;
					payment_rec.__concept["irpfExpression"] = payConceptIrpfExpression;
					payment_rec.__concept["quoteExpression"] = payConceptQuoteExpression;

					insertPayConcept = insertPayConcept.insert(values);
				}
			}

			var insert = insertPayConcept.toQuery ? insertPayConcept.toQuery() : "";

			// callback( setconceptid , callback( insert , next ) );
			callback( setconceptid , function() { callback( insert , next ) } );
		}
	}

	var setPayments = function(aagreement, callback, next){
		return function (){

			var domain = aagreement.domain;
			var agreement_id = aagreement.id;

			// Create statement we'll insert
			var insertPayments = payment;

			for(var i = 0; i<aagreement.payments.length; i++){
				var payment_rec = aagreement.payments[i];

				var valuesConceptAux = payment_rec.__concept;
				var payConceptId = valuesConceptAux["id"];
				var payConceptCode = valuesConceptAux["code"];
				var payConceptExpression = valuesConceptAux["expression"];
				var payConceptDescription = valuesConceptAux["description"];
				var payConceptType = valuesConceptAux["type"];
				var payConceptDescriptionDecorable = valuesConceptAux["descriptionDecorable"];
				var payConceptIrpfExpression = valuesConceptAux["irpfExpression"];
				var payConceptQuoteExpression = valuesConceptAux["quoteExpression"];
				var startDate = new Date(0);

				/* We compare the values from payment_concept and the one's from payments,
					 if they are equal our value it's gonna be null, in the other case, each one
					 will keep their values.*/

				payConceptExpression = payment_rec.expression != payConceptExpression
																	? payment_rec.expression : null;

				payConceptDescription = payment_rec.description != payConceptDescription
																	? payment_rec.description : null;

				var payment_type = payment_rec.type.split(" ")[1];
				payConceptType = payment_type != payConceptType ? payment_type : null;

				payConceptDescriptionDecorable = 0 != payConceptDescriptionDecorable
																	? payConceptDescriptionDecorable : 0;

				payConceptIrpfExpression = payment_rec.irpfExpression != payConceptIrpfExpression
																	? payment_rec.irpfExpression : null;

				payConceptQuoteExpression = payment_rec.quoteExpression != payConceptQuoteExpression
																	? payment_rec.quoteExpression : null;


				var values = {};
				values[payment.domain.name] = domain;
				values[payment.agreement.name] = agreement_id;
				values[payment.paymentConcept.name] = payConceptId;
				values[payment.type.name] = payConceptType;
				values[payment.expression.name] = payConceptExpression;
				values[payment.description.name] = payConceptDescription;
				values[payment.startDate.name] = startDate;
				values[payment.salaryType.name] = 0;
				values[payment.descriptionDecorable.name] = payConceptDescriptionDecorable;
				values[payment.irpfExpression.name] = payConceptIrpfExpression;
				values[payment.quoteExpression.name] = payConceptQuoteExpression;

				insertPayments = insertPayments.insert(values);

			}

			var insert = insertPayments.toQuery ? insertPayments.toQuery() : "";

			callback( insert , next );
		}
	}

	var setPaymentsExtras = function(aagreement, callback, next){
		return function (){

			var domain = aagreement.domain;
			var agreement_id = aagreement.id;

			var setpayid = {};

			// Create statement we'll insert
			var insertPayExtra = payment;

			// Get MAX Id fron agreement_payment table
			setpayid.text = "SET @PAY_ID = (SELECT MAX(id) FROM agreement_payment);";
			setpayid.values = [];

			for(var i = 0; i < aagreement.extras.length; i++){
				var extra_rec = aagreement.extras[i];
				var agreePay = extra_rec.agreePayment;
				var agreepay_expression = agreePay.expression;
				var agreepay_description = agreePay.description;
				var agreepay_type = agreePay.type.split(" ")[1];
				var agreepay_irpfExpression = agreePay.irpfExpression;
				var agreepay_quoteExpression = agreePay.quoteExpression;
				var startDate = new Date(0);
				var salaryType = 0;

				var cont = i + 1;
				var values = {};
				values[payment.id.name] = "@PAY_ID+"+cont;
				values[payment.domain.name] = domain;
				values[payment.agreement.name] = agreement_id;
				values[payment.type.name] = agreepay_type;
				values[payment.expression.name] = agreepay_expression;
				values[payment.description.name] = agreepay_description;
				values[payment.startDate.name] = startDate;
				values[payment.salaryType.name] = salaryType;
				values[payment.irpfExpression.name] = agreepay_irpfExpression;
				values[payment.quoteExpression.name] = agreepay_quoteExpression;

				agreePay.__payId = "@PAY_ID+"+cont;

				insertPayExtra = insertPayExtra.insert(values);
			}

			var insert = insertPayExtra.toQuery ? insertPayExtra.toQuery() : "";

			// callback( setpayid , callback( insert , next ) );
			callback( setpayid , function() { callback( insert , next ) } );
		}
	}

	var setExtras = function(aagreement, callback, next){
		return function (){

			var domain = aagreement.domain;
			var agreement_id = aagreement.id;

			// Create statement we'll insert
			var insertExtra = extra;

			for(var i = 0; i < aagreement.extras.length; i++){
				var extra_rec = aagreement.extras[i];
				var agreePay = extra_rec.agreePayment;
				var agreepay_description = agreePay.description;
				var payId = agreePay.__payId;
				var extra_startDate = extra_rec.start_date;
				var extra_endDate = extra_rec.end_date;
				var extra_issueDate = extra_rec.issue_date;

				var values = {};
				values[extra.domain.name] = domain;
				values[extra.agreement.name] = agreement_id;
				values[extra.agreementPayment.name] = payId;
				values[extra.startDate.name] = extra_startDate;
				values[extra.endDate.name] = extra_endDate;
				values[extra.issueDate.name] = extra_issueDate;

				insertExtra = insertExtra.insert(values);
			}

			var insert = insertExtra.toQuery ? insertExtra.toQuery() : "";

			callback( insert , next );
		}
	}

	var setAgreementLevel = function(aagreement, callback, next){
		return function (){

			var domain = aagreement.domain;
			var agreement_id = aagreement.id;

			var setLevelId = {};

			// Create statements we'll insert
			var insertLevel = level;
			var updateLevel = level;

			// Get MAX Id fron agreement_level table
			setLevelId.text = "SET @LEVEL_ID = (SELECT MAX(id) FROM agreement_level);";
			setLevelId.values = [];

			for(var i = 0; i < aagreement.levelsCategory.length; i++){
				var level_rec = aagreement.levelsCategory[i];
				var level_id = level_rec.id;
				var level_description = level_rec.description;
				var categories = level_rec.categories;

				if (null == level_id){ // Create new level
					var cont = i + 1;
					var values = {};
					values[level.id.name] = "@LEVEL_ID+"+cont;
					values[level.domain.name] = domain;
					values[level.agreement.name] = agreement_id;
					values[level.description.name] = level_description;

					level_rec.id = "@LEVEL_ID+"+cont;

					insertLevel = insertLevel.insert(values);

				}else{
					var values = {};
					values[level.description.name] = level_description;
					updateLevel = updateLevel.update(values).where(level.id.equals(level_id));
				}
			}

			var insert = insertLevel.toQuery ? insertLevel.toQuery() : "";

			var update = updateLevel.toQuery ? updateLevel.toQuery() : "";

			// callback( setLevelId , callback( insert , callback( update , next ) ) );
			callback( setconceptid , function() { callback( insert , function() { callback( update , next ) } ) } );
		}
	}

	var setAgreementLevelCategory = function(aagreement, callback, next){
		return function (){

			var domain = aagreement.domain;
			var agreement_id = aagreement.id;

			// Create statements we'll insert
			var insertLevelCategory = level_category;
			var updateLevelCategory = level_category;

			for(var i = 0; i < aagreement.levelsCategory.length; i++){
				var level_rec = aagreement.levelsCategory[i];
				var level_description = level_rec.description;
				var level_id = level_rec.id;
				var categories = level_rec.categories;

				for (var j = 0; j<categories.length; j++){
					var category = categories[j];
					var category_id = category.id;
					var category_description = category.description;

					if(null == category_id){ // Create new category
						var values = {};
						values[level_category.domain.name] = domain;
						values[level_category.agreementLevel.name] = level_id;
						values[level_category.description.name] = category_description;

						insertLevelCategory = insertLevelCategory.insert(values);

					}else{
						var values = {};
						values[level_category.description.name] = category_description;

						updateLevelCategory = updateLevelCategory.update(values).where(level_category.id.equals(category_id));
					}
				}
			}

			var insert = insertLevelCategory.toQuery ? insertLevelCategory.toQuery() : "";

			var update = updateLevelCategory.toQuery ? updateLevelCategory.toQuery() : "";

			// callback( insert , callback( update , next ) );
			callback( insert , function() { callback( update , next ) } );

		}
	}

	var setDatas = function(aagreement, callback, next){
		return function (){

			var domain = aagreement.domain;
			var agreement_id = aagreement.id;

			// Create statements we'll insert
			var queryAgreeData = data;
			var queryLevelData = level_data;

			for(var i = 0; i < aagreement.periods.length; i++){
				var period = aagreement.periods[i];
				var start_date = period.start_date;
				var end_date = period.end_date;

				for(var j = 0; j < period.levels.length; j++){
					var level_rec = period.levels[j];
					var level_id = level_rec.id;

					for(var data_rec in level_rec.datas){
						var data_name = data_rec;
						var data_expression = level_rec.datas[data_rec];

						if(level_id == 0){ // Create nw entry agreemet_data (Level = 0)
							var values = {};
							values[data.domain.name] = domain;
							values[data.name.name] = data_name;
							values[data.agreement.name] = agreement_id;
							values[data.expression.name] = data_expression;
							values[data.startDate.name] = start_date;
							values[data.endDate.name] = end_date;

							queryAgreeData = queryAgreeData.insert(values);

						}else{ // Create nw entry agreemet_level_data
							var values = {};
							values[level_data.domain.name] = domain;
							values[level_data.name.name] = data_name;
							values[level_data.agreementLevel.name] = level_id;
							values[level_data.expression.name] = data_expression;
							values[level_data.startDate.name] = start_date;
							values[level_data.endDate.name] = end_date;

							queryLevelData = queryLevelData.insert(values);
						}
					}
				}
			}

			var insertAgreeData = queryAgreeData.toQuery ? queryAgreeData.toQuery() : "";

			var insertLvlData = queryLevelData.toQuery ? queryLevelData.toQuery() : "";

			// callback( insertAgreeData , callback( insertLvlData , next ) );
			callback( insertAgreeData , function() { callback( insertLvlData , next ) } );
		}
	}

// END OF THE CLASS

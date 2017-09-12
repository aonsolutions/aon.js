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

//Devuelve true en caso de que la primera fecha sea anterior a la segunda
var greaterThan = function(date1, date2){
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

var lessThan = function(date1, date2){
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

var _levelsData = function(next){
	return function (pool, aagreement){
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



			database.query(pool,
				{sql:sql, nestTables: false, values:values},
				function(error, results, fields){
					var levels=[];
					for ( var i = 0; i < results.length; i++ ){
						var agreeLvlDat = results[i];

						for(var j = 0; j < aagreement.periods.length; j++){
							var period = aagreement.periods[j];
							if (greaterThan(period.end_date, agreeLvlDat.startDate)
									&& lessThan(period.start_date, agreeLvlDat.endDate)){
								for(var k = 0; k < period.levels.length; k++){
									var level = period.levels[k];
									if (level.id == agreeLvlDat.agreementLevel){
										// var data = {
										// 	name: agreeLvlDat.name,
										// 	expression: agreeLvlDat.expression
										// }
										// level.datas.push(data);
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
				next(pool, aagreement);
			}
		);
	}
}

var _levelsCategory = function(next){
	return function (pool, aagreement){
		var query = level
			.select(level.star(), level_category.star())
			.from(level.join(level_category)
				.on(level.id.equals(level_category.agreementLevel)))
			.where(level.agreement.equals(aagreement.id))
			.toQuery();

			database.query(pool,
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
							level.categories.push({
									id: agreeLvlCat.id,
									description: agreeLvlCat.description
							})
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
								//levelName: aagreement.levelsCategory[j].description,
								datas:{}
							}
							levelsPeriod.push(levelPeriod);
						}
						var levelPeriod = {
							id: 0,
							//levelName: "0",
							datas:{}
						}
						levelsPeriod.push(levelPeriod);
						aagreement.periods[i].levels = levelsPeriod;
					}

					//console.log(aagreement.periods[0].levels);
					next(pool, aagreement);
				}
			);
	}
}

var _getPeriods = function(next){
	return function (pool, aagreement ){
		var query = level_data
		.select(level_data.startDate, level_data.endDate)
		.from(level_data.join(level)
			.on(level_data.agreementLevel.equals(level.id)))
		.where(level.agreement.equals(aagreement.id))
		.group(level_data.startDate, level_data.endDate)
		.order(level_data.startDate, level_data.endDate)
		.toQuery();

			database.query(pool,
				query.text,
				query.values,
				function(error, results, fields){
					var period=[];
					//Caso base para comprar la primera vez
					var p = {
						start_date: 0,
						end_date : 0
					}
					for ( var i = 0; i < results.length; i++ ){
						//console.log(results[i]);
						var dateAux = new Date(results[i].startDate);
						dateAux.setTime(dateAux.getTime() - 1 * (24*360*1000));
						p.end_date = greaterThan(p.end_date,dateAux) ? dateAux : p.end_date;
						p = {
							start_date: parseDate(results[i].startDate),
							end_date : parseDate(results[i].endDate)
						}
						period[i] = p
					}
					//BORRAR:
					aagreement.periods = period;
					next(pool, aagreement);
				}
			);
	}
}

var _datas = function(next){
	return function (pool, aagreement ){
		var query = data
			.select(data.star())
			.from(data)
			.where(data.agreement.equals(aagreement.id))
			.toQuery();

			database.query(pool,
				query.text,
				query.values,
				function(error, results, fields){
					datas=[];
					for ( var i = 0; i < results.length; i++ ){
						datas[i] = {
							id: results[i].id,
							expression: results[i].expression,
							start_date: results[i].startDate,
							end_date: results[i].endDate
						}
					}

					aagreement.datas = datas;
					next(pool, aagreement);

				}
			);
	}
}

var _extras = function(next){
	return function (pool, aagreement ){
		var extraJoins = extra
	  .join(payment).on(payment.id.equals(extra.agreementPayment));

		var query = extra
			.select(payment.star(), extra.star())
			.from(extraJoins)
			.where(extra.agreement.equals(aagreement.id))
			.toQuery();

		database.query(pool,
				{sql:query.text, nestTables: true, values:query.values},
				function(error, results, fields){
					extras=[];
					for ( var i = 0; i < results.length; i++ ){
						//console.log(results[i]);
						var agreeExt = results[i].agreement_extra;
						var agreePay = results[i].agreement_payment;
						extras[i] = {
							id: results[i].id,
							start_date: agreeExt.startDate,
							end_date: agreeExt.endDate,
							issue_date: agreeExt.issueDate,
							agreePayment: {
								id: agreePay.id,
								expression: agreePay.expression,
								description: agreePay.description,
								type: "CRA "+agreePay.type,
								irpfExpression: agreePay.irpfExpression,
								quoteExpression: agreePay.quoteExpression
							}
						}
					}

					aagreement.extras = extras;
					next(pool, aagreement);

				}
			);
	}
}

var _payments = function(next){
	return function (pool, aagreement ){
		var paymentJoins = payment
	  .join(payment_concept).on(payment.paymentConcept.equals(payment_concept.id))
	  .leftJoin(extra).on(payment.id.equal(extra.agreementPayment));

		var query = payment
			.select(payment.star(), payment_concept.star())
			.from(paymentJoins)
			.where(payment.agreement.equals(aagreement.id).and(extra.id.isNull()))
			.toQuery();

		database.query(pool,
				{sql:query.text, nestTables: true, values:query.values},
				function(error, results, fields){
					payments=[];
					for ( var i = 0; i < results.length; i++ ){
						var agreePay = results[i].agreement_payment;
						var payConp = results[i].payment_concept;
						payments[i] = {
							id: agreePay.id,
							code: payConp.code,
							expression: agreePay.expression ? agreePay.expression : payConp.expression,
							description: agreePay.description ? agreePay.description : payConp.description,
							type: agreePay.type ? "CRA "+agreePay.type : "CRA "+payConp.type,
							irpfExpression: agreePay.irpfExpression ? agreePay.irpfExpression : payConp.irpfExpression,
							quoteExpression: agreePay.quoteExpression ? agreePay.quoteExpression : payConp.quoteExpression
						}
					}

					aagreement.payments = payments;
					next(pool, aagreement);

				}
			);
	}
}

module.exports.get = function(pool, filter, cb) {
	var query = agreement
		.select(agreement.star())
		.from(agreement)
		.where(filter(params))
		.toQuery();

	database.query(pool,
		query.text,
		query.values,
		function(error, results, fields){
			aagreement= {
				id: results[0].id,
				calendar: results[0].calendar,
				description: results[0].description
			};
			var levelsData = _levelsData(cb);
			var levelsCategory = _levelsCategory(levelsData);
			var getPeriods = _getPeriods(levelsCategory);
			var extras = _extras(getPeriods);
			var payments = _payments(extras);
			payments(pool, aagreement);
		}
	);


/**
-------------------------------------------------------------------------------
-------------------------------------------------------------------------------
----------------------    ACTUALIZAR BASE DE DATOS     ------------------------
-------------------------------------------------------------------------------
-------------------------------------------------------------------------------
*/


	module.exports.set = function(pool, aagreement, cb) {
		var id = aagreement.id;
		var calendar = aagreement.calendar;
		var description = aagreement.description;

		var query = agreement
			.update({"calendar" : calendar,
							"description" : description})
			.where(agreement.id.equals(id))
			.toQuery();

		console.log("UPDATE AGREEMENT : "+query.text);

		database.query(pool,
			query.text,
			query.values,
			function(error, results, fields){
				if(error) throw error;
				//var setPayments = _setPayments(cb);
				var eraseLevelData = _eraseLevelData(cb);
				var eraseDatas = _eraseDatas(eraseLevelData);
				var erasePayments = _erasePayments(eraseDatas);
				var eraseExtras = _eraseExtras(erasePayments);
				var erasePaymentsConcept = _erasePaymentsConcept(eraseExtras);
				erasePaymentsConcept(pool, aagreement);
			}
		);
	}

	var _erasePaymentsConcept = function(next){
		return function (pool, aagreement){

			var query = payment_concept
				.delete()
				.from(payment_concept)
				.where(payment_concept.domain.notEquals(0))
				.and(payment_concept.id.in(
					payment
					.select(payment.paymentConcept)
					.from(payment)
					.where(payment.agreement.equal(aagreement.id))
				))
				.toQuery();

			console.log("BORRAR PAYMENTS CONCEPTS : "+query.text);

			next(pool, aagreement);

			// database.query(pool,
			// 		{sql:query.text, nestTables: true, values:query.values},
			// 		function(error, results, fields){
			// 			next(pool, aagreement);
			// 		}
			// );
		}
	}

	var _eraseExtras = function(next){
		return function (pool, aagreement){

			var query = extra
				.delete()
				.from(extra)
				.where(extra.agreement.equals(aagreement.id))
				.toQuery();

			console.log("BORAR EXTRAS : "+query.text);

			next(pool, aagreement);

			// database.query(pool,
			// 		{sql:query.text, nestTables: true, values:query.values},
			// 		function(error, results, fields){
			// 			next(pool, aagreement);
			// 		}
			// );
		}
	}

	var _erasePayments = function(next){
		return function (pool, aagreement){

			var query = payment
				.delete()
				.from(payment)
				.where(payment.domain.notEquals(0))
				.and(payment.agreement.equal(aagreement.id))
				.toQuery();

			console.log("BORAR PAYMENTS : "+query.text);

			next(pool, aagreement);

			// database.query(pool,
			// 		{sql:query.text, nestTables: true, values:query.values},
			// 		function(error, results, fields){
			// 			next(pool, aagreement);
			// 		}
			// );
		}
	}

	var _eraseDatas = function(next){
		return function (pool, aagreement){

			var query = data
				.delete()
				.from(data)
				.where(data.agreement.equal(aagreement.id))
				.toQuery();

			console.log("BORAR DATAS : "+query.text);

			next(pool, aagreement);

			// database.query(pool,
			// 		{sql:query.text, nestTables: true, values:query.values},
			// 		function(error, results, fields){
			// 			next(pool, aagreement);
			// 		}
			// );
		}
	}

	var _eraseLevelData = function(next){
		return function (pool, aagreement){

			var query = level_data
				.delete()
				.from(level_data)
				.where(level_data.agreementLevel.in(
					level
					.select(level.id)
					.from(level)
					.where(level.agreement.equal(aagreement.id))
				))
				.toQuery();

			console.log("BORAR LEVEL DATAS : "+query.text);

			next(pool, aagreement);

			// database.query(pool,
			// 		{sql:query.text, nestTables: true, values:query.values},
			// 		function(error, results, fields){
			// 			next(pool, aagreement);
			// 		}
			// );
		}
	}

	var _setPayments = function(next){
		return function (pool, aagreement){

			var query = agreement
				.select(agreement.domain)
				.from(agreement)
				.where(agreement.id.equals(aagreement.id))
				.toQuery();

			database.query(pool,
					{sql:query.text, nestTables: false, values:query.values},
					function(error, results, fields){
						var domain = results[0].domain;

						// ++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
						// ++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++

						var payments = aagreement.payments;

						for(var i = 0; i<aagreement.payments; i++){
							if (payments[i].code != null){
								var query = payment_concept
									.select(payment_concept.star())
									.from(payment_concept)
									.where(payment_concept.domain.equals(0))
									.and(payment_concept.code.equals(payments[i].code ))
									.toQuery();

								database.query(pool,
										{sql:query.text, nestTables: false, values:query.values},
										function(error, results, fields){
											if (error) throw error;
											if (!results) return;

											if (results != undefined){
												//*****************************************************
												//*****************************************************
												var payConceptId = results[0].id;
												var payConceptCode = results[0].code;
												var payConceptExpression = results[0].expression;
												var payConceptDescription = results[0].description;
												var payConceptType = results[0].type;
												var payConceptDescriptionDecorable = results[0].descriptionDecorable;
												var payConceptIrpfExpression = results[0].irpfExpression;
												var payConceptQuoteExpression = results[0].quoteExpression;
												var startDate = new Date(0);

												if(payments[i].expression != payConceptExpression){
													payConceptExpression = payments[i].expression;
												}else{
													payConceptExpression = null;
												}

												if(payments[i].description != payConceptDescription){
													payConceptDescription = payments[i].description;
												}else{
													payConceptDescription = null;
												}

												if(payments[i].type != payConceptType){
													payConceptType = payments[i].type;
												}else{
													payConceptType = null;
												}

												if(payments[i].descriptionDecorable != payConceptDescriptionDecorable){
													payConceptDescriptionDecorable = payments[i].descriptionDecorable;
												}else{
													payConceptDescriptionDecorable = null;
												}

												if(payments[i].irpfExpression != payConceptIrpfExpression){
													payConceptIrpfExpression = payments[i].irpfExpression;
												}else{
													payConceptIrpfExpression = null;
												}

												if(payments[i].quoteExpression != payConceptQuoteExpression){
													payConceptQuoteExpression = payments[i].quoteExpression;
												}else{
													payConceptQuoteExpression = null;
												}

												var query = payment
													.insertInto(payment)
													.values({"domain" : domain,
												 					 "agreement" : aagreement.id,
																 	 "payment_concept" : payConceptId,
																 	 "type" : payConceptType,
																 	 "expression" : payConceptExpression,
																   "description" : payConceptDescription,
																   "start_date" : startDate,
																 	 "salary_type" : 0,
																 	 "description_decorable" : payConceptDescriptionDecorable,
																 	 "irpf_expression" : payConceptIrpfExpression,
																 	 "quote_expression" : payConceptQuoteExpression})
													.toQuery();

												database.query(pool,
														{sql:query.text, nestTables: false, values:query.values},
														function(error, results, fields){

														}
												 );

												//*****************************************************
												//*****************************************************

											}
										}
								 );
							}else{
								var payConceptCode = payments[i].code;
								var payConceptExpression = payments[i].expression;
								var payConceptDescription = payments[i].description;
								var payConceptType = payments[i].type;
								var payConceptIrpfExpression = payments[i].irpfExpression;
								var payConceptQuoteExpression = payments[i].quoteExpression;

								var query = payment_concept
									.insertInto(payment_concept)
									.values({"domain" : domain,
													 "agreement" : aagreement.id,
													 "type" : payConceptType,
													 "expression" : payConceptExpression,
													 "description" : payConceptDescription,
													 "irpf_expression" : payConceptIrpfExpression,
													 "quote_expression" : payConceptQuoteExpression})
									.toQuery();

								database.query(pool,
										{sql:query.text, nestTables: false, values:query.values},
										function(error, results, fields){

											//var payConceptId = //COGER ULTIMO ID
											var startDate = new Date(0);

											var query = payment
												.insertInto(payment)
												.values({"domain" : domain,
																 "agreement" : aagreement.id,
																 "payment_concept" : payConceptId,
																 "start_date" : startDate,
																 "salary_type" : 0 })
												.toQuery();

											database.query(pool,
													{sql:query.text, nestTables: false, values:query.values},
													function(error, results, fields){

													}
											 );

										}
								 );
							}
						}

						// ++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
						// ++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++

						next(pool, aagreement);
					}
			);
		}
	}

};

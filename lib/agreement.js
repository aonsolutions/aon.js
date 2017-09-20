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
	var greaterThanEquals = function(date1, date2){
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
	var lessThanEquals = function(date1, date2){
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
							if (greaterThanEquals(period.end_date, agreeLvlDat.startDate)
									&& lessThanEquals(period.start_date, agreeLvlDat.endDate)){
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
						//Crear el nivel 0
						var levelPeriod = {
							id: 0,
							//levelName: "0",
							datas:{}
						}
						levelsPeriod.push(levelPeriod);
						aagreement.periods[i].levels = levelsPeriod;
					}
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
						var dateAux = new Date(results[i].startDate);
						dateAux.setTime(dateAux.getTime() - 1 * (24*360*1000));
						p.end_date = greaterThanEquals(p.end_date,dateAux) ? dateAux : p.end_date;
						p = {
							start_date: parseDate(results[i].startDate),
							end_date : parseDate(results[i].endDate)
						}
						period[i] = p
					}
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
		  .join(payment)
				.on(payment.id.equals(extra.agreementPayment));

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
	}


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
				var setDatas = _setDatas(cb);
				var setAgreementLevelAndCategory = _setAgreementLevelAndCategory(setDatas);
				var setExtras = _setExtras(setAgreementLevelAndCategory);
				var setPayments = _setPayments(setExtras);
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
					.where(payment.agreement.equal(aagreement.id)))
				)
				.toQuery();

			console.log("BORRAR PAYMENTS CONCEPTS : "+query.text);

			database.query(pool,
				{sql:query.text, nestTables: true, values:query.values},
				function(error, results, fields){
					next(pool, aagreement);
				}
			);
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

			database.query(pool,
				{sql:query.text, nestTables: true, values:query.values},
				function(error, results, fields){
					next(pool, aagreement);
				}
			);
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

			database.query(pool,
				{sql:query.text, nestTables: true, values:query.values},
				function(error, results, fields){
					next(pool, aagreement);
				}
			);
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

			database.query(pool,
				{sql:query.text, nestTables: true, values:query.values},
				function(error, results, fields){
					next(pool, aagreement);
				}
			);
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
					.where(level.agreement.equal(aagreement.id)))
				)
				.toQuery();

			console.log("BORAR LEVEL DATAS : "+query.text);

			database.query(pool,
				{sql:query.text, nestTables: true, values:query.values},
				function(error, results, fields){
					next(pool, aagreement);
				}
			);
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
					if (error) throw error;
					//Obtenemos el dominio el agreement ID
					var domain = results[0].domain;
					var agreement_id = aagreement.id;

					for(var i = 0; i<aagreement.payments; i++){
						var payment = aagreement.payments[i];
						if (payment.code != null){ //Existe un payment_concept asociado
							//Insertaremos un payment, pero comparando sus valores con los del payment_concept asociado
							analizeAsociatedPaymentConcept(pool, domain, agreement_id, payment);
						}else{ //No existe payment_concept, por lo que hay que crearlo, y tambien el payment
							insertEntryAgreementConcept(pool, domain, agreement_id, payment);
						}
					}
					next(pool, aagreement);
				}
			);
		}
	}

	analizeAsociatedPaymentConcept = function(pool, domain, agreement_id, payment){
		var query = payment_concept
			.select(payment_concept.star())
			.from(payment_concept)
			.where(payment_concept.domain.equals(0))
			.and(payment_concept.code.equals(payment.code ))
			.toQuery();

		database.query(pool,
			{sql:query.text, nestTables: false, values:query.values},
			function(error, results, fields){
				if (error) throw error;
				if (!results) return;

				if (results != undefined){
					//GUARDAMOS LOS VALORES DEL PAYMENT_CONCEPT ASOCIADO
					var payConceptId = results[0].id;
					var payConceptCode = results[0].code;
					var payConceptExpression = results[0].expression;
					var payConceptDescription = results[0].description;
					var payConceptType = results[0].type;
					var payConceptDescriptionDecorable = results[0].descriptionDecorable;
					var payConceptIrpfExpression = results[0].irpfExpression;
					var payConceptQuoteExpression = results[0].quoteExpression;
					var startDate = new Date(0);

					/*Ahora comparamos los valores del payment_concept obtenidos, con los
					  que ya existian en nuestro payment, en caso de ser iguales en payment
						valdra null, y en caso de ser distintos cada un mantendra su valor
					*/

					payConceptExpression = payment.expression != payConceptExpression
																		? payment.expression : null;

					payConceptDescription = payment.description != payConceptDescription
																		? payment.description : null;

					var payment_type = payment.type.split(" ")[1];
					payConceptType = payment_type != payConceptType ? payment_type : null;

					payConceptDescriptionDecorable = payment.descriptionDecorable != payConceptDescriptionDecorable
																		? payment.descriptionDecorable : null;

					payConceptIrpfExpression = payment.irpfExpression != payConceptIrpfExpression
																		? payment.irpfExpression : null;

					payConceptQuoteExpression = payment.quoteExpression != payConceptQuoteExpression
																		? payment.quoteExpression : null;

					//Insertamos un payment con los datos de acuerdo al payment_concept asociado
					insertEntryAgreementExistingConcept(pool, domain, agreement_id, payConceptId,
						payConceptType, payConceptExpression, payConceptDescription,
						payConceptDescriptionDecorable, payConceptIrpfExpression, payConceptQuoteExpression);
				}
			}
		);
	}

	insertEntryAgreementExistingConcept = function(){
		var query = payment
			.insertInto(payment)
			.values({"domain" : domain,
				"agreement" : agreement_id,
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
				if (error) throw error;
			}
		);
	}

	insertEntryAgreementConcept = function(pool, domain, agreement_id, payment){
		var payConceptCode = payment.code;
		var payConceptExpression = payment.expression;
		var payConceptDescription = payment.description;
		var payConceptType = payment.type;
		var payConceptIrpfExpression = payment.irpfExpression;
		var payConceptQuoteExpression = payment.quoteExpression;

		var query = payment_concept
			.insertInto(payment_concept)
			.values({"domain" : domain,
				"agreement" : agreement_id,
				"type" : payConceptType,
				"expression" : payConceptExpression,
				"description" : payConceptDescription,
				"irpf_expression" : payConceptIrpfExpression,
				"quote_expression" : payConceptQuoteExpression})
			.toQuery();

		database.query(pool,
			{sql:query.text, nestTables: false, values:query.values},
			function(error, results, fields){
				if (error) throw error;
				var payConceptId = results.insertId;
				insertEntryAgreementNotExistingConcept(pool, domain, agreement_id, payConceptId);
			}
		);
	}

	insertEntryAgreementNotExistingConcept = function(pool, domain, agreement_id, payConceptId){
		var startDate = new Date(0);
		var query = payment
			.insertInto(payment)
			.values({"domain" : domain,
				"agreement" : agreement_id,
				"payment_concept" : payConceptId,
				"start_date" : startDate,
				"salary_type" : 0 })
			.toQuery();

		database.query(pool,
			{sql:query.text, nestTables: false, values:query.values},
			function(error, results, fields){
				if (error) throw error;
			}
		);
	}


	var _setExtras = function(next){
		return function (pool, aagreement){

			var query = agreement
				.select(agreement.domain)
				.from(agreement)
				.where(agreement.id.equals(aagreement.id))
				.toQuery();

			database.query(pool,
				{sql:query.text, nestTables: true, values:query.values},
				function(error, results, fields){
					//Obtenemos el dominio el agreement ID
					var domain = results[0].domain;
					var agreement_id = aagreement.id;

					//Recorremos la lista de extras
					for(var i = 0; i < results.extras.length; i++){
						var extra = results.extras[i];
						var agreepay_expression = extra.expression;
						var agreepay_description = extra.description;
						var agreepay_type = extra.type.split(" ")[1];
						var agreepay_irpfExpression = extra.irpfExpression;
						var agreepay_quoteExpression = extra.quoteExpression;
						var startDate = new Date(0);
						var salaryType = 0;

						//Insertamos un payment y a continuacion un extra que se asocie con el
						insertEntryAgreementPayment(pool, domain, agreement_id, agreepay_type,
																				agreepay_expression, agreepay_description,
																				startDate, salaryType, agreepay_irpfExpression,
																				agreepay_quoteExpression);
					}
				}
			);
			next(pool, aagreement);
		}
	}


	insertEntryAgreementPayment = function(pool, domain, agreement_id, agreepay_type, agreepay_expression,
		agreepay_description, startDate, salaryType, agreepay_irpfExpression, agreepay_quoteExpression){

		var query = payment
			.insertInto(payment)
			.values({"domain" : domain,
				"agreement" : agreement_id,
				"type" : agreepay_type,
				"expression" : agreepay_expression,
				"description" : agreepay_description,
				"start_date" : startDate,
				"salary_type" : salaryType,
				"irpf_expression" : agreepay_irpfExpression,
				"quote_expression" : agreepay_quoteExpression})
			.toQuery();

		database.query(pool,
			{sql:query.text, nestTables: false, values:query.values},
			function(error, results, fields){
				var agree_id = results.insertId;
				var extra_startDate = extra.start_date;
				var extra_endDate = extra.end_date;
				var extra_issueDate = extra.issue_date;

				//Insertamos un extra asociandolo al payment creado anteriormente
				insertEntryAgreementExtra(pool, domain, agreement_id, agree_id, extra_startDate,
																	extra_endDate, extra_issueDate);

			}
		);
	}

	insertEntryAgreementExtra = function(pool, domain, agreement_id, agree_id, extra_startDate,
														extra_endDate, extra_issueDate){
		var query = extra
			.insertInto(extra)
			.values({"domain" : domain,
				"agreement" : agreement_id,
				"agreement_payment" : agree_id,
				"start_date" : extra_startDate,
				"end_date" : extra_endDate,
				"issue_date" : extra_issueDate})
			.toQuery();

		database.query(pool,
			{sql:query.text, nestTables: false, values:query.values},
			function(error, results, fields){

			}
		);
	}


	var _setAgreementLevelAndCategory = function(next){
		return function (pool, aagreement){

			var query = agreement
				.select(agreement.domain)
				.from(agreement)
				.where(agreement.id.equals(aagreement.id))
				.toQuery();

			database.query(pool,
				{sql:query.text, nestTables: true, values:query.values},
				function(error, results, fields){
					//Obtenemos el dominio el agreement ID
					var domain = results[0].domain;
					var agreement_id = aagreement.id;

					//Recorremos todos lo niveles que existen
					for(var i = 0; i < results.levelsCategory.length; i++){
						var level = results.levelsCategory[i];
						var level_id = level.id;
						var level_description = level.description;
						var categories = level.categories;

						if (null == level_id){ //Si es un nivel nuevo se crea
							level_id = insertEntryAgreementLevel(pool, domain, agreement_id,
																									level_description);
						}else{ //Si ya existia el nivel se hace un UPDATE
							updateEntryAgreementLevel(pool, level_description, level_id);
						}

						//Recorremos las categorias que hay dentro de un nivel
						for (var j = 0; j<categories.length; j++){
							var category = categories[j];
							var category_id = category.id;
							var category_description = category.description;

							if(null == category_id){ //Si la categoria es nueva se crea
								insertEntryAgreementLevelCategory(pool, domain, level_id,
																									category_description);
							}else{ //Si la categoria existia se actualiza con un UPDATE
								updateEntryAgreementLevelCategory(pool, category_description,
																									category_id);
							}
						}
					}
				}
			);
			next(pool, aagreement);
		}
	}

	insertEntryAgreementLevel = function(pool, domain, agreement_id, level_description){
		var query = level
			.insertInto(level)
			.values({"domain" : domain,
				"agreement" : agreement_id,
				"description" : level_description})
			.toQuery();

		database.query(pool,
			{sql:query.text, nestTables: false, values:query.values},
			function(error, results, fields){
				//RETURN ID -> level_id = newID;
				return results.insertId;
			}
		);
	}

	updateEntryAgreementLevel = function(pool, level_description, level_id){
		var query = level
			.update({"description" : level_description})
			.where(level.id.equals(level_id))
			.toQuery();

		database.query(pool,
			{sql:query.text, nestTables: false, values:query.values},
			function(error, results, fields){

			}
		);
	}

	insertEntryAgreementLevelCategory = function(pool, domain, level_id, category_description){
		var query = level_category
			.insertInto(level_category)
			.values({"domain" : domain,
				"agreement_level" : level_id,
				"description" : category_description})
			.toQuery();

		database.query(pool,
			{sql:query.text, nestTables: false, values:query.values},
			function(error, results, fields){

			}
		);
	}

	updateEntryAgreementLevelCategory = function(pool, category_description, category_id){
		var query = level_category
			.update({"description" : category_description})
			.where(level_category.id.equals(category_id))
			.toQuery();

		database.query(pool,
			{sql:query.text, nestTables: false, values:query.values},
			function(error, results, fields){

			}
		);
	}



	var _setDatas = function(next){
		return function (pool, aagreement){

			var query = agreement
				.select(agreement.domain)
				.from(agreement)
				.where(agreement.id.equals(aagreement.id))
				.toQuery();

			database.query(pool,
				{sql:query.text, nestTables: true, values:query.values},
				function(error, results, fields){
					//Obtenemos el dominio el agreement ID
					var domain = results[0].domain;
					var agreement_id = aagreement.id;

					//Recorremos los periodos que tengamos
					for(var i = 0; i < results.periods.length; i++){
						var period = results.periods[i];
						var start_date = period.start_date;
						var end_date = period.end_date;

						//Recorremos cada uno de los niveles que hay en un periodo
						for(var j = 0; j < period.levels.length; j++){
							var level = period.levels[j];
							var level_id = level.id;

							//Recorremos cada uno de los datas que hay para un nivel en un periodo
							for(var data in level.datas){
								var data_name = data;
								var data_expression = level.datas[data];

								if(level_id == 0){ //Insertar nueva entrada en agreement_data (NVL 0)
									insertEntryAgreementData(pool, domain, data_name, agreement_id, data_expression,
																				 start_date, end_date);
								}else{ //Insertar nueva entrada en agreement_level_data
										insertEntryLevelData(pool, domain, data_name, level_id, data_expression,
																				 start_date, end_date);
								}
							}
						}
					}
				}
			);
			next(pool, aagreement);
		}
	}


	insertEntryAgreementData = function(pool, domain, data_name, agreement_id, data_expression,
											 start_date, end_date){
		var query = data
			.insertInto(data)
			.values({"domain" : domain,
							 "name" : data_name,
							 "agreement" : agreement_id,
							 "expression" : data_expression,
							 "start_date" : start_date,
							 "end_date" : end_date})
			.toQuery();

		database.query(pool,
				{sql:query.text, nestTables: false, values:query.values},
				function(error, results, fields){

				}
		 );
	}


	insertEntryLevelData = function(pool, domain, data_name, level_id, data_expression,
											 start_date, end_date){
		var query = level_data
			.insertInto(level_data)
			.values({"domain" : domain,
							 "name" : data_name,
							 "agreement_level" : level_id,
							 "expression" : data_expression,
							 "start_date" : start_date,
							 "end_date" : end_date})
			.toQuery();

		database.query(pool,
			{sql:query.text, nestTables: false, values:query.values},
			function(error, results, fields){}

		);
	}


//FIN DE LA CLASE

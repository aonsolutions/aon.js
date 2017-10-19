
'use strict';

module.exports = {
<<<<<<< Updated upstream
	domain : require('./lib/domain'),
	agreement : require('./lib/agreement'),
	invoice : require ('./lib/invoice/invoice'),
	invoiceImport : require ('./lib/invoice/invoiceImport'),
	//sabbatic : require ('./lib/invoice/sabbaticOld'),
	settlement : require('./lib/settlement'),
	//auth : require ('./lib/auth/auth'),
	file : require ('./lib/file')
=======
	domain : require('./lib/domain')
	//, agreement : require('./lib/agreement')
	//, invoice : require ('./lib/invoice/invoice')
	//, sabbatic : require ('./lib/invoice/sabbatic')
	, settlement : require('./lib/settlement')
	//, auth : require ('./lib/auth/auth')
	//, file : require ('./lib/file')
>>>>>>> Stashed changes
};

var enumerado = require('./enum');

// DATA ATTACH SOURCE

var DATA_ATTACH_SOURCE = enumerado.defineEnum({
    QUALITY: {id: 0},
	  INVOICE: {id: 1},
	  FBATCH: {id: 2},
	  PRODUCTION: {id: 3},
	  DELIVERY: {id: 4},
	  SII: {id: 5},
	  SERES: {id: 6},
	  INGENET: {id: 7}
});
exports.DATA_ATTACH_SOURCE = DATA_ATTACH_SOURCE;

// DATA RESPONSE SOURCE

var DATA_RESPONSE_SOURCE = enumerado.defineEnum({
    QUALITY: {id: 0},
    PROJECT: {id: 1},
    HOTEL: {id: 2},
    SII: {id: 3},
    SII_INVOICE: {id: 4},
    SII_FINANCE: {id: 5},
    SABBATIC: {id: 6},
    SERES_DELIVERY: {id: 7},
    SERES_INVOICE: {id: 8}
});
exports.DATA_RESPONSE_SOURCE = DATA_RESPONSE_SOURCE;

// INVOICE TYPE

var INVOICE_TYPE = enumerado.defineEnum({
    PURCHASE: {id: 0, name: 'Compras'},
    SALES: {id: 1, name: 'Ventas'},
    EXPENSES: {id: 2, name: 'Gastos'},
    UNDEDUCTIBLE: {id: 3, name: 'Gt.NO Ded'}
});
exports.INVOICE_TYPE = INVOICE_TYPE;

// MIMETYPE

var MIMETYPE = enumerado.defineEnum({
    JPEG: {id: 0, name: 'image/jpeg', extension: 'jpg'},
    GIF: {id: 1, name: 'image/gif', extension: 'gif'},
    ICS: {id: 2, name: 'text/calendar', extension: 'ics'},
    TXT: {id: 3, name: 'text/plain', extension: 'txt'},
    HTML: {id: 4, name: 'text/html', extension: 'html'},
    XML: {id: 5, name: 'text/xml', extension: 'xml'},
    PNG: {id: 6, name: 'image/png', extension: 'png'},
    BMP: {id: 7, name: 'image/bmp', extension: 'bmp'},
    TIFF: {id: 8, name: 'image/tiff', extension: 'tif'},
    ICO: {id: 9, name: 'image/x-icon', extension: 'ico'},
    AVI: {id: 10, name: 'video/x-msvideo', extension: 'avi'},
    MPEG: {id: 11, name: 'video/mpeg', extension: 'mpg'},
    QUICKTIME: {id: 12, name: 'video/quicktime', extension: 'mov'},
    MP3: {id: 13, name: 'audio/mp3', extension: 'mp3'},
    WAV: {id: 14, name: 'audio/x-wav', extension: 'wav'},
    MID: {id: 15, name: 'audio/mid', extension: 'mid'},
    RTF: {id: 16, name: 'text/rtf', extension: 'rtf'},
    MS_WORD: {id: 17, name: 'application/msword', extension: 'doc'},
    MS_EXCEL: {id: 18, name: 'application/vnd.ms-excel', extension: 'xls'},
    MS_POWER_POINT: {id: 19, name: 'application/vnd.ms-powerpoint', extension: 'ppt'},
    STAR_OFFICE_TEXT: {id: 20, name: 'application/vnd.oasis.opendocument.text', extension:'odt'},
    STAR_OFFICE_SPREADSHEET: {id: 21, name: 'application/vnd.oasis.opendocument.spreadsheet', extension:'ods'},
    PDF: {id: 22, name: 'application/pdf', extension: 'pdf'},
    JAVASCRIPT: {id: 23, name: 'text/javascript', extension: 'js'},
    ZIP: {id: 24, name: 'application/zip', extension: 'zip'},
    CSS: {id: 25, name: 'text/css', extension: 'css'},
    MS_WORD_2007: {id: 26, name: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', extension: 'docx'},
    MS_EXCEL_2007: {id: 27, name: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', extension: 'xlsx'},
    MS_POWER_POINT_2007: {id: 28, name: 'application/vnd.openxmlformats-officedocument.presentationml.presentation', extension: 'pptx'},
    SIGNED_PDF: {id: 29, name: 'application/pdf', extension: 'pdf'},
    CSV: {id: 30, name: 'text/csv', extension: 'csv'},
    RSS: {id: 31, name: 'application/rss+xml', extension: 'rss'},
    OCTECT_STREAM: {id: 32, name: 'application/octet-stream', extension: ''},
    XSIG: {id: 33, name: 'text/xml', extension: 'xsig'},
    SIGNED_FACTURAE: {id: 34, name: 'text/xml', extension: 'xml'}
});
exports.MIMETYPE = MIMETYPE;
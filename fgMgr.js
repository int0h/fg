"use strict";

var tplMgr = require('fg-js/tplMgr.js');
var microJade = require('micro-jade');

/**
 * Fragment Manager. Stores all parsed fg's.
 * @constructor
 */
function FgMgr(){
	this.fgs = {};
};

/**
 * Reads fragment from object.
 * @constructor
 * @param {string} name - Name of fg.
 * @param {object} sources - Sources for fg like tpl or logic files.
 */
FgMgr.prototype.readFg = function(name, sources){
	var jadeCode = sources.tpl;
	var mjAst = microJade.parse(jadeCode);
	var tpl = tplMgr.readTpl(mjAst);
	var classFn;
	if (sources.classFn){
		var code = sources.classFn;
		classFn = new Function('fgClass', 'fgProto', code);
	};
	this.fgs[name] = {
		"tpl": tpl,
		"name": name,
		"classFn": classFn
	};
};

module.exports = FgMgr;

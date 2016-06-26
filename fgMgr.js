var tplMgr = require('fg-js/tplMgr.js');
var gaps = require('fg-js/gaps');
//var jade = require('jade');
//var p5 = require('parse5');
var allTags = require('fg-js/listOfTags.js').allTags;
var utils = require('fg-js/utils');
var serverUtils = require('fg-js/serverUtils');
var microJade = require('micro-jade');

var fgTable = {};
//window.fgTable = fgTable;

var jadeOptions = {
	"pretty": '\t',
	"compileDebug": true
};

function prepareJade(code){
	return code
		.split('\n')
		.map(function(line){
			return line.replace(/[\ \t]*$/g, '');
		})
		.join('\n');
};

function readFg(name, sources){
	if (sources.tpl){
		var jadeCode = sources.tpl;
		var mjAst = microJade.parse(jadeCode);
		var tpl = tplMgr.readTpl(mjAst);
	};
	var classFn;
	if (sources.classFn){
		var code = sources.classFn;
		classFn = new Function('fgClass', 'fgProto', code);
	};

	if (!tpl){
		return;
	};

	fgTable[name] = {
		"tpl": tpl,
		"name": name,
		"classFn": classFn
	};
};
exports.readFg = readFg;

function genClientMeta(){
	var fgArr = [];
	for (var i in fgTable){
		fgArr.push(fgTable[i]);
	};
	return '$fg.load(' + serverUtils.toJs(fgArr, {tab: '\t'}) + ')';
};
exports.genClientMeta = genClientMeta;

exports.fgTable = fgTable;
/*function genClientStructure(){
	
};*/
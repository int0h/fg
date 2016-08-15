var utils = require('fg-js/utils');
var gapTable = {};
var path = require('path');

function regGap(gapHandler){	
	gapTable[gapHandler.name] = gapHandler;
	return gapHandler;
};

function astMap(ast){
	var res = utils.simpleClone(ast);
	res.attrs = ast.attrs 
		? utils.keyValueToObj(ast.attrs, 'name', 'value')
		: ast.attrs;
	return res;
};

function parse(ast, html, parentMeta){
	/*var name = ast.nodeName;
	var gap = gapTable[name];
	if (!gap){
		return false;
	};*/
	for (var i in gapTable){
		var gap = gapTable[i];
		var meta = gap.parse(ast, html, parentMeta);
		if (meta){
			return meta;
		};
	};
	return null;
};

function render(data, meta, context){
	var gap = gapTable[meta.type];
	return gap.render(data, meta, context);
};

function genClientCode(){
	var clientCode = "var gapClassMgr = require('./gapClassMgr.js');" 
	+ "var renderTpl = require('fg-js/tplRender.js').renderTpl.bind(null, gapClassMgr);\n";
	var gapCodes = [];
	for (var i in gapTable){
		var gap = gapTable[i];
		var propCode = [
			'"render": ' + gap.render.toString(),			
			'"update": ' + gap.update.toString(),			
		].join(',\n');
		gapCodes.push('exports["' + i + '"] = {\n\t' + propCode + '\n};');
	};
	clientCode += gapCodes.join('\n\n');
	return clientCode;
};

function readGapDir(gapPath){
	var name = /\/([^\/]*)\/?$/.exec(gapPath)[1];
	//var reqPath = './' + path.relative(path.dirname(module.filename), gapPath).replace(/\\/g, '/');
	var clientPath = path.dirname(require.resolve('fg-js/client/main.js'));
	var reqPath = path.relative(clientPath, gapPath).replace(/\\/g, '/');
	var configObj = {
		"name": name,
		"path": reqPath,
		"parse": require(gapPath + '/parse.js'),
		"render": require(gapPath + '/render.js'),
		"update": require(gapPath + '/update.js')
	};
	regGap(configObj);
};


function genIncludeFile(){
	var code = "var gapClassMgr = require('fg-js/client/gapClassMgr.js');";
	utils.objFor(gapTable, function(gap){
		code += '\ngapClassMgr.regGap({\n'
			+ '\t"name": "' + gap.name + '",\n'
			+ '\t"path": "' + gap.path + '",\n'
			//+ '\t"parse": require("' + gap.path + '/parse.js"),\n'
			+ '\t"render": require("' + gap.path + '/render.js"),\n'
			+ '\t"update": require("' + gap.path + '/update.js"),\n'
			+ '});'
	});
	return code;
};

exports.genIncludeFile = genIncludeFile;
exports.readGapDir = readGapDir;
exports.regGap = regGap;
exports.parse = parse;
exports.render = render;
exports.genClientCode = genClientCode;
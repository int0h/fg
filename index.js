var fs = require('fs');
var path = require('path');
var gaps = require('fg-js/gaps');
var gapClassMgr = require('fg-js/gapClassMgr');
var browserify = require('browserify');
var fgMgr = require('fg-js/fgMgr.js');
var serverUtils = require('fg-js/serverUtils');
var fse = require('fs-extra');

function load(name, dirPath){	
	var sources = {
		"tpl": null,
		"classFn": null
	};
	var jadePath = dirPath + '/tpl.jade';
	if (serverUtils.fileExist(jadePath)){
		var jadeCode = fs.readFileSync(jadePath).toString();		
		sources.tpl = jadeCode;
	};
	var classJsPath = dirPath + '/class.js';
	if (serverUtils.fileExist(classJsPath)){
		var code = fs.readFileSync(classJsPath).toString();
		sources.classFn = code;
	};

	var subDirs = serverUtils.getSubFolders(dirPath);

	subDirs.forEach(function(subPath){
		var childName = name + '-' + subPath;
		var childPath = dirPath + '/' + subPath;
		load(childName, childPath);
	});
	
	fgMgr.readFg(name, sources);
};
exports.load = load;

function loadDir(path){
	var subDirs = serverUtils.getSubFolders(path);
	subDirs.forEach(function(subPath){
		var childName = subPath;
		var childPath = path + '/' + subPath;
		load(childName, childPath);
	});
};
exports.loadDir = loadDir;

var fgLibPath = require.resolve('fg-js').replace(/index\.js$/g, '');

function buildRuntime(destPath, cb){
	var brofy = browserify({
		debug: true
	});
	var gapsCode = gapClassMgr.genClientCode();
	fs.writeFileSync(fgLibPath + 'client/gaps.js', gapsCode);
	brofy.add(fgLibPath + 'client/main.js').bundle(function(err, code){
		if (err){
			console.error(err);
			return;
		};
		fs.writeFileSync(destPath, code);
		cb(null);
	});
};
exports.buildRuntime = buildRuntime;

var includeWrap = [
`var fgs = [];

`,
`

$fg.load(fgs);`
];

var includeFgCode = `fgs.push({
	"name": "%name%",
	"tpl": %tpl%,
	"classFn": %classFn%
});`;

exports.build = function(srcPath, destPath, cb){
	var brofy = browserify({
		debug: true
	});
	loadDir(srcPath);
	var tempPath = path.resolve(fgLibPath, './temp');	
	fse.emptyDirSync(tempPath);
	var includeCodeParts = []; 
	for (var i in fgMgr.fgTable){
		var fg = fgMgr.fgTable[i];
		var fgPath = tempPath + '/' + fg.name;
		fs.mkdirSync(fgPath);		
		if (fg.classFn){
			var classCode = 'module.exports = ' + fg.classFn.toString();
			fs.writeFileSync(fgPath + '/class.js', classCode);
		};
		var tplCode = 'module.exports = ' + serverUtils.toJs(fg.tpl);	
		fs.writeFileSync(fgPath + '/tpl.js', tplCode);
		includeCodeParts.push(includeFgCode
			.replace('%name%', fg.name)
			.replace('%tpl%', 'require("./' + fg.name + '/tpl.js")')
			.replace('%classFn%', fg.classFn 
				? 'require("./' + fg.name + '/class.js")'
				: null
				)
			);		
	};
	var includeCode = includeWrap.join(includeCodeParts.join('\n'));
	var includePath = tempPath + '/' + 'include.js';
	fs.writeFileSync(includePath, includeCode);
	brofy.add(includePath).bundle(function(err, code){
		if (err){
			return;
			console.error(err);
		};
		fs.writeFileSync(destPath, code);
		cb(null);
	});
	//fs.writeFileSync(destPath, fgMgr.genClientMeta());	
	//cb(null);
};
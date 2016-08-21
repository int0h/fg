"use strict";

//import {path} from 'path';

var fs = require('fs');
var path = require('path');
var gapClassMgr = require('./gapClassMgr.js');
var browserify = require('browserify');
var FgMgr = require('./fgMgr.js');
var serverUtils = require('./serverUtils');
var fse = require('fs-extra');

var fgLibPath = path.dirname(require.resolve('fg-js')) + '/';

function getSubDirs(srcpath) {
	return fs.readdirSync(srcpath).filter(function(file) {
		return fs.statSync(path.join(srcpath, file)).isDirectory();
	})
	.map(function(path){
		return srcpath + '/' + path;
	});
};

function readGapDirs(path){
	var dirs = getSubDirs(path);
	dirs.forEach(gapClassMgr.readGapDir.bind(gapClassMgr));
};
var gapsDir = fgLibPath + '/gaps/';
readGapDirs(gapsDir);

function load(fgMgr, name, dirPath){	
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
		load(fgMgr, childName, childPath);
	});
	
	fgMgr.readFg(name, sources);
};
exports.load = load;

function loadDir(fgMgr, path){
	var subDirs = serverUtils.getSubFolders(path);
	subDirs.forEach(function(subPath){
		var childName = subPath;
		var childPath = path + '/' + subPath;
		load(fgMgr, childName, childPath);
	});
};
exports.loadDir = loadDir;

function buildTest(cb){
	var testDir = fgLibPath + 'tests/';
	buildRuntime(testDir + '/build/runtime.js', function(err){
		if (err){
			cb(err);
			return;
		};
		build(testDir + '/fg-src/', testDir + '/build/fg.js', function(err){
			cb(err);
		});
	});
};
exports.buildTest = buildTest;

function buildRuntime(destPath, cb){
	var brofy = browserify({
		debug: true
	});
	var gapsCode = gapClassMgr.genIncludeFile();
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

function build(srcPath, destPath, cb){
	var fgMgr = new FgMgr();
	var brofy = browserify({
		debug: true
	});
	loadDir(fgMgr, srcPath);
	//var tempPath = path.resolve(fgLibPath, './temp');	
	var tempPath = path.resolve(process.cwd(), './temp');	
	fse.emptyDirSync(tempPath);
	var includeCodeParts = []; 
	for (var i in fgMgr.fgs){
		var fg = fgMgr.fgs[i];
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
			console.error(err);
			return;
		};
		fs.writeFileSync(destPath, code);
		cb(null);
	});
	//fs.writeFileSync(destPath, fgMgr.genClientMeta());	
	//cb(null);
};

exports.build = build;
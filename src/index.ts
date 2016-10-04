"use strict";

import * as fs from 'fs';
import * as fse from 'fs-extra';
import * as path from 'path';
import * as gapClassMgr from './gapServer';
import * as browserify from 'browserify';
const tsify = require('tsify');
const microJade = require('micro-jade');
import * as ts from 'typescript';
import {FgMgr, IFgDeclaration} from './fgMgr';
import * as serverUtils from './serverUtils';
import {Template, TplData} from './tplMgr';

export {Component} from './client/componentBase';

const fgLibPath = path.resolve(path.dirname(require.resolve('fg-js')) + '/', '..');

function parseTpl(code: string): TplData{
	const mjAst = microJade.parse(code);
	return Template.read(mjAst, null, []);
};

function transformTpl(code: string): string{
	const parsed = parseTpl(code);
	const json = JSON.stringify(parsed);
	let res = "const tpl = " + json + ";\n";
	res += "export default tpl;";
	return res;
};

interface FgMeta{
	path: string;
	tpl: string;
	classFn: string;
	subs: FgMeta[];
}

function transformFgDir(srcPath: string, destPath: string){
	let meta: FgMeta = {
		path: srcPath,
		tpl: null,
		classFn: null,
		subs: []
	};
	const tplPath = path.resolve(srcPath, './tpl.jade');
	if (serverUtils.fileExist(tplPath)){
		meta.tpl = fs.readFileSync(tplPath).toString();
	}else{

	};
	const isDir = fs.statSync(srcFilePath).isDirectory();
	let destFilePath = path.resolve(destPath, filename);	
	if (isDir){
		fse.ensureDirSync(destFilePath);
		const sub = transformFgDir(srcFilePath, destFilePath);
		meta.subs.push(sub);
		return;
	};
	if (filename === "tpl.jade"){
		const tplJade = fs.readFileSync(srcFilePath).toString();
		const compiled = transformTpl(tplJade);
		destFilePath = path.resolve(destPath, 'tpl.ts');
		fs.writeFileSync(destFilePath, compiled); 			
		meta.tpl = fs.readFileSync(srcFilePath).toString();
	};
	fs.readdirSync(srcPath).forEach(filename => {
		
	});
	return meta;
};

function getSubDirs(srcpath: string): string[]{
	return fs.readdirSync(srcpath).filter(function(file) {
		return fs.statSync(path.join(srcpath, file)).isDirectory();
	})
	.map(function(path){
		return srcpath + '/' + path;
	});
};
//readGapDirs(gapsDir);

export function load(fgMgr: FgMgr, name: string, dirPath: string){	
	let sources: IFgDeclaration = {} as IFgDeclaration;
	const jadePath = dirPath + '/tpl.jade';
	if (serverUtils.fileExist(jadePath)){
		const jadeCode = fs.readFileSync(jadePath).toString();		
		sources.tpl = jadeCode;
	};
	const classJsPath = dirPath + '/class.js';
	if (serverUtils.fileExist(classJsPath)){
		const code = fs.readFileSync(classJsPath).toString();
		sources.classFn = code;
	};

	const subDirs = serverUtils.getSubFolders(dirPath);

	subDirs.forEach(function(subPath: string){
		const childName = name + '-' + subPath;
		const childPath = dirPath + '/' + subPath;
		load(fgMgr, childName, childPath);
	});
	
	fgMgr.readFg(name, sources);
};

export function loadDir(fgMgr: FgMgr, path: string){
	const subDirs = serverUtils.getSubFolders(path);
	subDirs.forEach(function(subPath: string){
		const childName = subPath;
		const childPath = path + '/' + subPath;
		load(fgMgr, childName, childPath);
	});
};

export function buildTest(cb: Function){
	const testDir = fgLibPath + '/src/tests/';
	build(testDir + '/fg-src/', fgLibPath + '/build/tests/build/fg.js', function(err: Error){
			cb(err);
		});
	// buildRuntime(fgLibPath + '/build/tests/build/runtime.js', function(err: Error){
	// 	if (err){
	// 		cb(err);
	// 		return;
	// 	};
	// 	build(testDir + '/fg-src/', fgLibPath + '/build/tests/build/fg.js', function(err: Error){
	// 		cb(err);
	// 	});
	// });
};


export function buildRuntime(destPath: string, cb: Function){
	const brofy = browserify({
		debug: true
	});
	brofy
		.add(fgLibPath + '/src/client/main.ts')
		.plugin(tsify)
		.bundle(function(err: any, code: Buffer){
			if (err){
				console.error(err);
				return;
			};
			fs.writeFileSync(destPath, code);
			cb(null);
		});
};

const includeWrap = [
`var fgs = [];

`,
`

$fg.load(fgs);`
];

const includeFgCode = `fgs.push({
	"name": "%name%",
	"tpl": %tpl%,
	"classFn": %classFn%
});`;

export function build(srcPath: string, destPath: string, cb: Function){
	const fgMgr = new FgMgr();
	console.log('sadsad');
	//var tempPath = path.resolve(fgLibPath, './temp');	
	const tempPath = path.resolve(process.cwd(), './temp2');
	const meta = transformFgDir(srcPath, tempPath);
	console.log(meta);
	return;	
	// fse.emptyDirSync(tempPath);
	// let includeCodeParts: string[] = []; 
	// for (let i in fgMgr.fgs){
	// 	const fg = fgMgr.fgs[i];
	// 	const fgPath = tempPath + '/' + fg.name;
	// 	fs.mkdirSync(fgPath);		
	// 	if (fg.classFn){
	// 		const classCode = 'module.exports = ' + fg.classFn.toString();
	// 		fs.writeFileSync(fgPath + '/class.js', classCode);
	// 	};
	// 	const tplSource = '/*\n' + fg.tplSource + '\n*/\n\n';
	// 	const tplCode = tplSource + 'module.exports = ' + serverUtils.toJs(fg.tpl);	
	// 	fs.writeFileSync(fgPath + '/tpl.js', tplCode);
	// 	includeCodeParts.push(includeFgCode
	// 		.replace('%name%', fg.name) 
	// 		.replace('%tpl%', 'require("./' + fg.name + '/tpl.js")')
	// 		.replace('%classFn%', fg.classFn 
	// 			? 'require("./' + fg.name + '/class.js")'
	// 			: null
	// 			)
	// 		);		
	// };
	// const includeCode = includeWrap.join(includeCodeParts.join('\n'));
	// const includePath = tempPath + '/' + 'include.js';
	// fs.writeFileSync(includePath, includeCode);
	// const brofy = browserify({
	// 	debug: true
	// });
	// brofy
	// 	.plugin(tsify)	
	// 	.add(includePath).bundle(function(err: any, code: Buffer){
	// 		if (err){
	// 			console.error(err);
	// 			return;
	// 		};
	// 		fs.writeFileSync(destPath, code);
	// 		cb(null);
	// 	});
	// ts.transpileModule(includeCode, {
	// 	compilerOptions: {
	// 		module: ts.ModuleKind.System,
	// 		outFile: destPath,
	// 		sourceRoot: tempPath
	// 	}
	// });	

	//fs.writeFileSync(destPath, fgMgr.genClientMeta());	
	//cb(null);
};
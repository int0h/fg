"use strict";
//import {path} from 'path';
var fs = require('fs');
var fse = require('fs-extra');
var path = require('path');
var gapClassMgr = require('./gapServer');
//import * as browserify from 'browserify';
var ts = require('typescript');
var fgMgr_1 = require('./fgMgr');
var serverUtils = require('./serverUtils');
var fgLibPath = path.dirname(require.resolve('fg-js')) + '/';
function getSubDirs(srcpath) {
    return fs.readdirSync(srcpath).filter(function (file) {
        return fs.statSync(path.join(srcpath, file)).isDirectory();
    })
        .map(function (path) {
        return srcpath + '/' + path;
    });
}
;
function readGapDirs(path) {
    var dirs = getSubDirs(path);
    dirs.forEach(gapClassMgr.readGapDir.bind(gapClassMgr));
}
;
var gapsDir = fgLibPath + '/gaps/';
//readGapDirs(gapsDir);
function load(fgMgr, name, dirPath) {
    var sources = {
        "tpl": null,
        "classFn": null
    };
    var jadePath = dirPath + '/tpl.jade';
    if (serverUtils.fileExist(jadePath)) {
        var jadeCode = fs.readFileSync(jadePath).toString();
        sources.tpl = jadeCode;
    }
    ;
    var classJsPath = dirPath + '/class.js';
    if (serverUtils.fileExist(classJsPath)) {
        var code = fs.readFileSync(classJsPath).toString();
        sources.classFn = code;
    }
    ;
    var subDirs = serverUtils.getSubFolders(dirPath);
    subDirs.forEach(function (subPath) {
        var childName = name + '-' + subPath;
        var childPath = dirPath + '/' + subPath;
        load(fgMgr, childName, childPath);
    });
    fgMgr.readFg(name, sources);
}
exports.load = load;
;
function loadDir(fgMgr, path) {
    var subDirs = serverUtils.getSubFolders(path);
    subDirs.forEach(function (subPath) {
        var childName = subPath;
        var childPath = path + '/' + subPath;
        load(fgMgr, childName, childPath);
    });
}
exports.loadDir = loadDir;
;
function buildTest(cb) {
    var testDir = fgLibPath + 'tests/';
    buildRuntime(testDir + '/build/runtime.js', function (err) {
        if (err) {
            cb(err);
            return;
        }
        ;
        build(testDir + '/fg-src/', testDir + '/build/fg.js', function (err) {
            cb(err);
        });
    });
}
exports.buildTest = buildTest;
;
function buildRuntime(destPath, cb) {
    // var brofy = browserify({
    // 	debug: true
    // });
    // var a: ts.TranspileOptions;	
    // ts.transpileModule()
    var gapsCode = gapClassMgr.genIncludeFile();
    fs.writeFileSync(fgLibPath + 'client/gaps.js', gapsCode);
    var clientCode = fs.readFileSync(fgLibPath + 'client/main.ts', "utf-8");
    ts.transpileModule(clientCode, {
        compilerOptions: {
            module: ts.ModuleKind.System,
            outDir: fgLibPath + '/clientBuild/'
        }
    });
}
exports.buildRuntime = buildRuntime;
;
var includeWrap = [
    "var fgs = [];\n\n",
    "\n\n$fg.load(fgs);"
];
var includeFgCode = "fgs.push({\n\t\"name\": \"%name%\",\n\t\"tpl\": %tpl%,\n\t\"classFn\": %classFn%\n});";
function build(srcPath, destPath, cb) {
    var fgMgr = new fgMgr_1.FgMgr();
    loadDir(fgMgr, srcPath);
    //var tempPath = path.resolve(fgLibPath, './temp');	
    var tempPath = path.resolve(process.cwd(), './temp');
    fse.emptyDirSync(tempPath);
    var includeCodeParts = [];
    for (var i in fgMgr.fgs) {
        var fg = fgMgr.fgs[i];
        var fgPath = tempPath + '/' + fg.name;
        fs.mkdirSync(fgPath);
        if (fg.classFn) {
            var classCode = 'module.exports = ' + fg.classFn.toString();
            fs.writeFileSync(fgPath + '/class.js', classCode);
        }
        ;
        var tplCode = 'module.exports = ' + serverUtils.toJs(fg.tpl);
        fs.writeFileSync(fgPath + '/tpl.js', tplCode);
        includeCodeParts.push(includeFgCode
            .replace('%name%', fg.name)
            .replace('%tpl%', 'require("./' + fg.name + '/tpl.js")')
            .replace('%classFn%', fg.classFn
            ? 'require("./' + fg.name + '/class.js")'
            : null));
    }
    ;
    var includeCode = includeWrap.join(includeCodeParts.join('\n'));
    var includePath = tempPath + '/' + 'include.js';
    fs.writeFileSync(includePath, includeCode);
    ts.transpileModule(includeCode, {
        compilerOptions: {
            module: ts.ModuleKind.System,
            outFile: destPath,
            sourceRoot: tempPath
        }
    });
    //fs.writeFileSync(destPath, fgMgr.genClientMeta());	
    //cb(null);
}
exports.build = build;
;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi9zcmMvaW5kZXgudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUEsWUFBWSxDQUFDO0FBRWIsNEJBQTRCO0FBRTVCLElBQVksRUFBRSxXQUFNLElBQUksQ0FBQyxDQUFBO0FBQ3pCLElBQVksR0FBRyxXQUFNLFVBQVUsQ0FBQyxDQUFBO0FBQ2hDLElBQVksSUFBSSxXQUFNLE1BQU0sQ0FBQyxDQUFBO0FBQzdCLElBQVksV0FBVyxXQUFNLGFBQWEsQ0FBQyxDQUFBO0FBQzNDLDJDQUEyQztBQUMzQyxJQUFZLEVBQUUsV0FBTSxZQUFZLENBQUMsQ0FBQTtBQUNqQyxzQkFBb0IsU0FBUyxDQUFDLENBQUE7QUFDOUIsSUFBWSxXQUFXLFdBQU0sZUFBZSxDQUFDLENBQUE7QUFFN0MsSUFBSSxTQUFTLEdBQUcsSUFBSSxDQUFDLE9BQU8sQ0FBQyxPQUFPLENBQUMsT0FBTyxDQUFDLE9BQU8sQ0FBQyxDQUFDLEdBQUcsR0FBRyxDQUFDO0FBRTdELG9CQUFvQixPQUFlO0lBQ2xDLE1BQU0sQ0FBQyxFQUFFLENBQUMsV0FBVyxDQUFDLE9BQU8sQ0FBQyxDQUFDLE1BQU0sQ0FBQyxVQUFTLElBQUk7UUFDbEQsTUFBTSxDQUFDLEVBQUUsQ0FBQyxRQUFRLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxPQUFPLEVBQUUsSUFBSSxDQUFDLENBQUMsQ0FBQyxXQUFXLEVBQUUsQ0FBQztJQUM1RCxDQUFDLENBQUM7U0FDRCxHQUFHLENBQUMsVUFBUyxJQUFJO1FBQ2pCLE1BQU0sQ0FBQyxPQUFPLEdBQUcsR0FBRyxHQUFHLElBQUksQ0FBQztJQUM3QixDQUFDLENBQUMsQ0FBQztBQUNKLENBQUM7QUFBQSxDQUFDO0FBRUYscUJBQXFCLElBQVk7SUFDaEMsSUFBSSxJQUFJLEdBQUcsVUFBVSxDQUFDLElBQUksQ0FBQyxDQUFDO0lBQzVCLElBQUksQ0FBQyxPQUFPLENBQUMsV0FBVyxDQUFDLFVBQVUsQ0FB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
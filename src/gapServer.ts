"use strict";

import * as utils from './utils';
import * as path from 'path';
import {IAstNode} from './tplMgr';
import {Gap} from './client/gapClassMgr';
import {FgInstance} from './client/fgInstance';

var gapClassTable = {};

/**
 * Reads the given ast and returns gap tree.
 * @param {object} ast - Parsed AST of a template.
 * @param {string} html - Source code of template. [deprecated]
 * @param {object} parentMeta - Parent gap.
 * @return {gap | null}
 */
export function parse(ast: IAstNode, html: string, parentMeta: Gap){
	/*var name = ast.nodeName;
	var gap = gapTable[name];
	if (!gap){
		return false;
	};*/
	var matched = [];
	for (var i in gapClassTable){
		var gap = gapClassTable[i];
		var meta = gap.parse(ast, html, parentMeta);
		if (meta){
			matched.push({
				"gap": gap,
				"meta": meta
			});
		};
	};
	if (matched.length > 1){
		var maxPrior = Math.max.apply(Math, matched.map(function(item){
			return item.gap.priority;
		}));		
		matched = matched.filter(function(item){
			return item.gap.priority === maxPrior;
		});	
	}
	if (matched.length === 1){
		return matched[0].meta;
	};
	if (matched.length === 0){
		return null;
	};	
	if (matched.length > 1){
		throw new Error("Gap parsing conflict");
	};
	return null;
};

/**
 * Renders a gap type according to parsed meta.
 * @param {object} data - Data for gap.
 * @param {object} meta - Meta for gap.
 * @param {object} context - Fg containing the gap.
 * @return {string}
 */
export function render(data: Object, meta: Gap, context: FgInstance): string{
	var gap = gapClassTable[meta.type];
	return gap.render(data, meta, context);
};

/**
 * Generates gap info for client. [deprecated]
 * @return {string}
 */
export function genClientCode(): string{
	var clientCode = "var gapClassMgr = require('./gapClassMgr.js');" 
	+ "var renderTpl = require('fg-js/tplRender.js').renderTpl.bind(null, gapClassMgr);\n";
	var gapCodes = [];
	for (var i in gapClassTable){
		var gap = gapClassTable[i];
		var propCode = [
			'"render": ' + gap.render.toString(),			
			'"update": ' + gap.update.toString(),			
		].join(',\n');
		gapCodes.push('exports["' + i + '"] = {\n\t' + propCode + '\n};');
	};
	clientCode += gapCodes.join('\n\n');
	return clientCode;
};

/**
 * Reads gap directory and registers gaps from there.
 * @param {string} gapPath - path to the "gaps" directory.
 */
export function readGapDir(gapPath){
	// TODO: delete
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
	new Gap(configObj);
};

/**
 * Generates gap include file for the client.
 * @return {string}
 */
export function genIncludeFile(): string{
	var code = "var gapClassMgr = require('fg-js/client/gapClassMgr.js');";
	utils.objFor(gapClassTable, function(gap){
		code += '\ngapClassMgr.regGap({\n'
			+ '\t"name": "' + gap.name + '",\n'
			+ '\t"path": "' + gap.path + '",\n'
			//+ '\t"parse": require("' + gap.path + '/parse.js"),\n'
			+ '\t"render": require("' + gap.path + '/render.js"),\n'
			+ '\t"update": require("' + gap.path + '/update.js"),\n'
			+ '});';
	});
	return code;
};
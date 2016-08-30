"use strict";

import * as utils from './utils';
import * as path from 'path';
import {IAstNode} from './tplMgr';
import {Gap} from './client/gapClassMgr';
import {FgInstance} from './client/fgInstance';
import * as gaps from './gaps';

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
	for (var i in gaps){
		var gap = gaps[i];
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
	var gap = gaps[meta.type];
	return gap.render(data, meta, context);
};
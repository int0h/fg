"use strict";

import * as utils from './utils';
import * as path from 'path';
import {IAstNode} from './outerTypes';
import {Gap, IGapData, GapClass} from './client/gapClassMgr';
import {Component} from './client/componentBase';
import {default as gaps} from './gaps';

/**
 * Reads the given ast and returns gap tree.
 * @param {object} ast - Parsed AST of a template.
 * @param {string} html - Source code of template. [deprecated]
 * @param {object} parentMeta - Parent gap.
 * @return {gap | null}
 */
export interface IGapMatch{
	gap: any;
	meta: any;
};

interface IGapItem{
	name: string;
	gap: typeof Gap;
}

export function parse(ast: IAstNode, parents: IGapData[], html: string): IGapData{
	let gapList: IGapItem[] = [];
	for (let name in gaps){
		gapList.push({
			name,
			gap: gaps[name] as any as typeof Gap
		});
	};
	gapList.sort((a: IGapItem, b: IGapItem) => {
		return b.gap.priority - a.gap.priority;
	});
	for (let gapItem of gapList){
		const meta = gapItem.gap.parse(ast, parents, html);
		if (meta){
			return meta;
		};
	};
	return null;
};
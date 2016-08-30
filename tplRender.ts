"use strict";

import * as utils from './utils';
import {Tpl} from './tplMgr';
import {FgInstance} from './client/fgInstance';
import {Gap} from './client/gapClassMgr';

interface ITplContext{
	renderGap: Function;
	context: FgInstance;
};

/**
 * Renders template.
 * @param {Object[]} tpl - array of path's parts.
 * @param {Object} parent - parent for a template.
 * @param {Object} data - data object to render.
 * @param {Object} meta - meta modifier.
 * @returns {string} result code.
 */
export default function renderTpl(tpl: Tpl, parent: Gap, data: any, metaMod){
	var self: ITplContext = this;
	var parts = tpl.map(function(part, partId){
		if (typeof part === "string"){
			return part;
		};
		var partMeta = utils.simpleClone(part);
		if (metaMod){
			if (typeof metaMod === "function"){
				partMeta = metaMod(partMeta, partId);
			}else{
				partMeta = utils.extend(partMeta, metaMod || {});			
			};	
		};		
		return self.renderGap(self.context, parent, data, partMeta);
	});
	var code = parts.join('');
	return code;
};
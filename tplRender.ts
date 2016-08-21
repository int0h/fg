"use strict";

import * as utils from './utils';

/**
 * Renders template.
 * @param {Object[]} tpl - array of path's parts.
 * @param {Object} parent - parent for a template.
 * @param {Object} data - data object to render.
 * @param {Object} meta - meta modifier.
 * @returns {string} result code.
 */
export default function renderTpl(tpl, parent, data, meta){
	var self = this;
	var parts = tpl.map(function(part, partId){
		if (typeof part === "string"){
			return part;
		};
		var partMeta = utils.simpleClone(part);
		if (meta){
			if (typeof meta === "function"){
				partMeta = meta(partMeta, partId);
			}else{
				partMeta = utils.extend(partMeta, meta || {});			
			};	
		};		
		return self.gapClassMgr.render(self.context, parent, data, partMeta);
	});
	var code = parts.join('');
	return code;
};
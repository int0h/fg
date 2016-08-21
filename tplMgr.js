"use strict";

var gapClassMgr = require('fg-js/gapClassMgr.js');
var renderTpl = require('fg-js/tplRender.js').renderTpl.bind(null, gapClassMgr);
var mj = require('micro-jade');


function parseGap(node, html, parentMeta){
	var tagMeta = gapClassMgr.parse(node, html, parentMeta);
	return tagMeta;
};

function readTpl(ast, code, parentMeta){

	function iterate(children){
		var parts = [];
		children.forEach(function(node, id){
			var tagMeta = parseGap(node, code, parentMeta);
			if (tagMeta){				
				parts.push(tagMeta);				
				return; 
			};	
			if (!node.children || node.children.length == 0){
				parts.push(mj.render(node, {}));				
				return;
			};
			var wrap = mj.renderWrapper(node);
			parts.push(wrap[0]);
			parts = parts.concat(iterate(node.children));		
			if (wrap[1]){
				parts.push(wrap[1]);
			}
		});
		return parts;
	};
	return iterate(ast.children);
};

function tplToJson(tpl){ //?
	var parts = tpl.map(function(part){
		if (typeof part == "string"){
			return part;
		};
		return gapClassMgr.toJson(part);
	});
	return parts;
};

exports.readTpl = readTpl;
exports.renderTpl = renderTpl;
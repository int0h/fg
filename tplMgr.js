var gapClassMgr = require('fg-js/gapClassMgr.js');
var renderTpl = require('fg-js/tplRender.js').renderTpl.bind(null, gapClassMgr);
//var p5 = require('parse5');
var mj = require('micro-jade');

var allTags = require('fg-js/listOfTags.js').allTags;


function attrsToObj(attrs){
	var res = {};
	attrs.forEach(function(i){
		res[i.name] = i.value;
	}); 
	return res;
};


function parseGap(node, html, parentMeta){
	var tagMeta = gapClassMgr.parse(node, html, parentMeta);
	return tagMeta;
};

/*function readTpl(htmlAst, htmlCode, parentMeta){

	function iterate(children){
		children.forEach(function(node, id){
			var tagMeta = parseGap(node, htmlCode, parentMeta);
			if (!tagMeta){
				iterate(node.childNodes || []);
				return;
			};			
			var loc = node.__location;
			parts.push(htmlCode.slice(curStart, loc.startOffset));
			curStart = loc.endOffset;
			//tagMeta.parent = parentMeta;
			//tagMeta.id = id;
			parts.push(tagMeta);
		});
	};

	var curStart = 0;
	var totalEnd = htmlAst.tagName ? 0 : htmlCode.length;
	if (htmlAst.childNodes.length > 0){
		var curStart = htmlAst.childNodes[0].__location.startOffset;
		var totalEnd = htmlAst.childNodes.slice(-1)[0].__location.endOffset;
	};
	var parts = [];
	
	iterate(htmlAst.childNodes);
	parts.push(htmlCode.slice(curStart, totalEnd));
	return parts;
};*/

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

function parseTpl(html, parentMeta){
	var parsed = p5.parseFragment(html, {locationInfo: true});
	return readTpl(parsed, html, parentMeta);
};

function mixArrays(arrays){
	var id = 0;
	var maxLength = 0;
	var totalLength = 0;
	for (var i = 0; i < arguments.length; i++){
		maxLength = Math.max(arguments[i].length, maxLength);
		totalLength += arguments[i].length;
	};
	var resArr = [];
	var arrayCount = arguments.length;
	for (var id = 0; id < maxLength; id++){				
		for (var i = 0; i < arrayCount; i++){
			if (arguments[i].length > id){
				resArr.push(arguments[i][id]);
			};
		};
	};
	return resArr;
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

exports.parseTpl = parseTpl;
exports.readTpl = readTpl;
exports.renderTpl = renderTpl;
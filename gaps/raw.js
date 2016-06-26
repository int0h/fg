var gapClassMgr = require('fg-js/gapClassMgr.js');
var renderTpl = require('fg-js/tplRender.js').renderTpl.bind(null, gapClassMgr);
var tplMgr = require('fg-js/tplMgr.js');
var utils = require('fg-js/utils');
var StrTpl = require('fg-js/utils/strTpl.js');

function isScope(item){
	if (typeof item == "string"){
		return false;
	};
	return item.type == "scope";
};

var raw = gapClassMgr.regGap({
	"name": "raw",
	"parse": function (node, html, parentMeta){
		if (node.type != "tag"){
			return null;
		};
		var hasDynamicAttrs = false;
		var meta = {};
		meta.type = "raw";
		meta.isVirtual = false;
		meta.isRootNode = node.parent.type != "tag";
		meta.tagName = node.tagName;
		if ("id" in node.attrs){
			meta.eid = node.attrs.id.value;
			delete node.attrs.id;
		};
		var attrsArr = utils.objToKeyValue(node.attrs, 'name', 'value');
		attrsArr = attrsArr.map(function(attr){			
			var value = StrTpl.parse(attr.value.value);
			if (typeof value != "string"){
				hasDynamicAttrs = true;
			};
			return {
				"name": attr.name,
				"value": value
			};
		});		
		meta.attrs = utils.keyValueToObj(attrsArr, 'name', 'value');		
		if (node.value){
			meta.value = node.value.split('.');
		};
		meta.content = tplMgr.readTpl(node, html, meta);		
		if (meta.content.some(isScope)){
			meta.isScopeHolder = true;			
		};
		if (parentMeta && parentMeta.type == "scope"){
			meta.isScopeItem = true;
		};
		if (
				!hasDynamicAttrs 
				&& !meta.eid
				&& !meta.isRootNode 
				&& !meta.isScopeHolder 
				&& !meta.isScopeItem
				&& !meta.value
			){
			return null;
		};
		return meta;
	},
	"render": function(context, data){		
		var meta = this;
		var utils = require('fg-js/utils');
		if (meta.isScopeHolder){
			meta.root.currentScopeHolder = meta;		
		};
		var attrData = utils.objPath(meta.scopePath, data);
		var attrsArr = utils.objToKeyValue(meta.attrs, 'name', 'value');
		var renderedAttrs = utils.renderAttrs(meta.attrs, attrData);
		var triggers = utils
			.getAttrsPaths(meta.attrs)	
			.map(function(path){
				return utils.resolvePath(meta.scopePath, path);
			});	
		var valuePath;
		if (meta.value){
			valuePath = utils.resolvePath(meta.scopePath, meta.value);
			triggers.push(valuePath);
			meta.valuePath = valuePath;
		}; 
		/*var scopeTriggers = attrsPaths;
		if (meta.isScopeItem){
			scopeTriggers.push(meta.scopePath);
		};*/
		context.gapStorage.setTriggers(meta, triggers);		
		var inner = meta.value 
			? utils.objPath(valuePath, data)
			: context.renderTpl(meta.content, meta, data);
		return utils.renderTag({
			"name": meta.tagName,
			"attrs": renderedAttrs,
			"innerHTML": inner
		});
	},
	"update": function(context, meta, scopePath, value){
		// to do value update
		var utils = require('fg-js/utils');
		var attrData = utils.objPath(meta.scopePath, context.data);
		var renderedAttrs = utils.renderAttrs(meta.attrs, attrData);
		var dom = meta.getDom()[0];
		if (meta.value && meta.valuePath.join('-') == scopePath.join('-')){
			dom.innerHTML = value;
		};
		utils.objFor(renderedAttrs, function(value, name){
			var oldVal = dom.getAttribute(name);
			if (oldVal != value){
				dom.setAttribute(name, value);
			};
		});		
	}
});

exports.raw = raw;
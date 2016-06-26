var gapClassMgr = require('fg-js/gapClassMgr.js');
var renderTpl = require('fg-js/tplRender.js').renderTpl.bind(null, gapClassMgr);
var tplMgr = require('fg-js/tplMgr.js');
var utils = require('fg-js/utils');

var scope = gapClassMgr.regGap({
	"name": "scope",
	"parse": function (node, html){
		if (node.tagName != "scope"){
			return null;
		};
		var meta = {};
		meta.type = "scope";
		meta.isVirtual = true;
		meta.path = utils.parsePath(node);		
		meta.content = tplMgr.readTpl(node, html, meta);
		meta.eid = node.attrs.id || null;
		return meta;
	},
	"render": function(context, data){
		var meta = this;
		meta.items = [];
		var utils = require('fg-js/utils');
		meta.scopePath = utils.getScopePath(meta);		
		var scopeData = utils.objPath(meta.scopePath, data);
		context.gapStorage.setTriggers(this, [this.scopePath]);
		var placeHolderInner = ['fg', context.id, 'scope-gid', meta.gid].join('-');
		if (!scopeData){
			return '<!--' + placeHolderInner + '-->';
		};		
		var parts = utils.renderScopeContent(context, meta, scopeData, data, 0);
		parts.push('<!--' + placeHolderInner + '-->');
		return parts.join('\n');
	},
	"update": function(context, meta, scopePath, value, oldValue){		
		var utils = require('fg-js/utils');
		var gapClassMgr = require('fg-js/client/gapClassMgr.js');
		for (var i = value.length; i < oldValue.length; i++){
			context.gapStorage.removeScope(scopePath.concat([i]));
		};
		if (value.length > oldValue.length){
			var scopeHolder = utils.findScopeHolder(meta);
			var nodes = [].slice.call(scopeHolder.getDom()[0].childNodes);
			var placeHolderInner = ['fg', context.id, 'scope-gid', meta.gid].join('-');
			var found = nodes.filter(function(node){
			    if (node.nodeType != 8){
			        return false
			    };
			    if (node.textContent == placeHolderInner){
			    	return true;
			    };			    
			});
			found = found[0];
			var dataSlice = value.slice(oldValue.length);
			var newContent = utils.renderScopeContent(context, meta, dataSlice, context.data, oldValue.length).join('\n');
			utils.insertHTMLBeforeComment(found, newContent);
		};
		this;
		//context.rerender(context.data);
	}
});

exports.scope = scope;
var gapClassMgr = require('fg-js/gapClassMgr.js');
var renderTpl = require('fg-js/tplRender.js').renderTpl.bind(null, gapClassMgr);
var tplMgr = require('fg-js/tplMgr.js');
var utils = require('fg-js/utils');

// TODO: folder tree names
var content = gapClassMgr.regGap({
	"name": "content",
	"parse": function (node, html){
		if (node.tagName != "content"){
			return null;
		};
		var meta = {};
		meta.type = "content";		
		meta.isVirtual = true;
		/*meta.fgName = node.nodeName.slice(3);
		meta.path = node.attrs.class 
			? node.attrs.class.split(' ')
			: [];
		meta.eid = node.attrs.id || null;
		meta.content = tplMgr.readTpl(node, html, meta);*/
		return meta;
	},
	"render": function(context, data, meta){
		this.scopePath = context.gapMeta.scopePath;
		//var utils = require('fg/utils');			
		return context.parent.renderTpl(context.meta.content, this, context.parent.data);
	},
	"update": function(context, meta, scopePath, value){
		return;
	}
});

exports.content = content;
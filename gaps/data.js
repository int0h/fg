var gapClassMgr = require('fg-js/gapClassMgr.js');
var renderTpl = require('fg-js/tplRender.js').renderTpl.bind(null, gapClassMgr);
var tplMgr = require('fg-js/tplMgr.js');
var utils = require('fg-js/utils');

var data = gapClassMgr.regGap({
	"name": "data",
	"parse": function (node, html){
		if (node.tagName != "data"){
			return null;
		};
		var meta = {};
		meta.type = "data";		
		meta.isVirtual = false;
		meta.path = utils.parsePath(node);		
		meta.eid = node.attrs.id || null;
		return meta;
	},
	"render": function(context, data){
		var utils = require('fg-js/utils');
		context.gapStorage.setTriggers(this, [this.scopePath]);
		var value = utils.objPath(this.scopePath, data)
		return utils.renderTag({
			name: "span",
			attrs: this.attrs,
			innerHTML: value
		});
	},
	"update": function(context, meta, scopePath, value){
		var node = meta.getDom()[0];
		if (!node){
			
		};
		node.innerHTML = value;
		//highlight(node, [0xffffff, 0xffee88], 500);
	}
});

exports.data = data;
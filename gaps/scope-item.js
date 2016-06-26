var gapClassMgr = require('fg-js/gapClassMgr.js');
var renderTpl = require('fg-js/tplRender.js').renderTpl.bind(null, gapClassMgr);
var tplMgr = require('fg-js/tplMgr.js');
var utils = require('fg-js/utils');

var scopeItem = gapClassMgr.regGap({
	"name": "scope-item",
	"parse": function (node, html){
		return null;
	},
	"render": function(context, data){
		var meta = this;
		var utils = require('fg-js/utils');		
		meta.scopePath = utils.getScopePath(meta);		
		var scopeData = utils.objPath(meta.scopePath, data);
		context.gapStorage.setTriggers(this, [this.scopePath]);
		if (!scopeData){
			return '';
		};
		return context.renderTpl(meta.content, meta, data);
	},
	"update": function(context, meta, scopePath, value, oldValue){		
		return;
	}
});

exports.scopeItem = scopeItem;
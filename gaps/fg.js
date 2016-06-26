var gapClassMgr = require('fg-js/gapClassMgr.js');
var renderTpl = require('fg-js/tplRender.js').renderTpl.bind(null, gapClassMgr);
var tplMgr = require('fg-js/tplMgr.js');
var utils = require('fg-js/utils');

// TODO: folder tree names
var fg = gapClassMgr.regGap({
	"name": "fg",
	"parse": function (node, html){
		if (node.type != 'tag' || !~node.tagName.indexOf("fg-")){
			return null;
		};
		var meta = {};
		meta.type = "fg";		
		meta.isVirtual = true;
		meta.fgName = node.tagName.slice(3);
		meta.path = utils.parsePath(node);		
		meta.eid = node.attrs.id || null;
		meta.content = tplMgr.readTpl(node, html, meta);
		return meta;
	},
	"render": function(context, data, meta){
		var self = this;
		var utils = require('fg-js/utils');
		this.parentFg = context;
		//this.renderedContent = context.renderTpl(this.content, meta, data);
		var fgClass = $fg.classes[this.fgName];	
		var scopeData = utils.deepClone(utils.objPath(this.scopePath, data));			
		var fg = fgClass.render(scopeData, this, context);
		fg.on('update', function(path, val){
			context.update(self.scopePath.concat(path), val);
			//console.log(path, val);
		});
		this.fg = fg;
		fg.meta = this;
		context.childFgs.push(fg);
		context.gapStorage.setTriggers(this, [this.scopePath]);		
		return fg;
		if (true){ // client
			
		};		
		throw 'todo server render';
	},
	"update": function(context, meta, scopePath, value){
		return;
	}
});

exports.fg = fg;
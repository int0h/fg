var valueMgr = require('fg-js/valueMgr.js');
var utils = require('fg-js/utils');

function render(context, data){
	var self = this;
	this.parentFg = context;
	//this.renderedContent = context.renderTpl(this.content, meta, data);
	var fgClass = $fg.classes[this.fgName];
	var fgData = utils.deepClone(valueMgr.getValue(this, data, this.resolvedPath));	
	var fg = fgClass.render(fgData, this, context);
	fg.on('update', function(path, val){
		context.update(scopePath.concat(path), val);
		//console.log(path, val);
	});
	this.fg = fg;
	fg.meta = this;
	context.childFgs.push(fg);
	return fg;
	if (true){ // client
		
	};		
	throw 'todo server render';
};

module.exports = render;
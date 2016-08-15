function render(context, data){
	this.scopePath = context.gapMeta.scopePath;
	return context.parent.renderTpl(context.meta.content, context.gapMeta.parent, context.parent.data);
};

module.exports = render;
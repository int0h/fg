var valueMgr = require('fg-js/valueMgr');
var utils = require('fg-js/utils');

function render(context, data){
	var value = valueMgr.render(this, data, this.resolvedPath);
	return utils.renderTag({
		name: "span",
		attrs: this.attrs,
		innerHTML: value
	});
};

module.exports = render;
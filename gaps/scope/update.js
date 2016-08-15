var renderScopeContent = require('./renderScopeContent.js');

function update(context, meta, scopePath, value, oldValue){
	var utils = require('fg-js/utils');
	var gapClassMgr = require('fg-js/client/gapClassMgr.js');
	value = value || [];
	oldValue = oldValue || [];
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
		var newContent = renderScopeContent(context, meta, dataSlice, context.data, oldValue.length).join('\n');
		utils.insertHTMLBeforeComment(found, newContent);
	};
	this;
	//context.rerender(context.data);
};

module.exports = update;
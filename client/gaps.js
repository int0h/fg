var gapClassMgr = require('./gapClassMgr.js');var renderTpl = require('fg-js/tplRender.js').renderTpl.bind(null, gapClassMgr);
exports["data"] = {
	"render": function (context, data){
		var utils = require('fg-js/utils');
		context.gapStorage.setTriggers(this, [this.scopePath]);
		var value = utils.objPath(this.scopePath, data)
		return utils.renderTag({
			name: "span",
			attrs: this.attrs,
			innerHTML: value
		});
	},
"update": function (context, meta, scopePath, value){
		var node = meta.getDom()[0];
		if (!node){
			
		};
		node.innerHTML = value;
		//highlight(node, [0xffffff, 0xffee88], 500);
	}
};

exports["scope"] = {
	"render": function (context, data){
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
"update": function (context, meta, scopePath, value, oldValue){		
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
			var newContent = utils.renderScopeContent(context, meta, dataSlice, context.data, oldValue.length).join('\n');
			utils.insertHTMLBeforeComment(found, newContent);
		};
		this;
		//context.rerender(context.data);
	}
};

exports["scope-item"] = {
	"render": function (context, data){
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
"update": function (context, meta, scopePath, value, oldValue){		
		return;
	}
};

exports["fg"] = {
	"render": function (context, data, meta){
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
"update": function (context, meta, scopePath, value){
		return;
	}
};

exports["content"] = {
	"render": function (context, data, meta){
		this.scopePath = context.gapMeta.scopePath;
		//var utils = require('fg/utils');			
		return context.parent.renderTpl(context.meta.content, this, context.parent.data);
	},
"update": function (context, meta, scopePath, value){
		return;
	}
};

exports["raw"] = {
	"render": function (context, data){		
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
"update": function (context, meta, scopePath, value){
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
};
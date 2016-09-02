(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
var gapRe = /\[\!(\w+)\]/g;

function ReTpl(reTpl, parts){    
    var source = reTpl.source;
    this.map = [];
    var self = this;
    var newSource = source.replace(gapRe, function(subStr, name){
        self.map.push(name);
        return '(' + parts[name].source + ')';
    });
    var flags = reTpl.global ? 'g' : ''
        + reTpl.multiline ? 'm' : ''
        + reTpl.ignoreCase ? 'i' : '';
    this.re = new RegExp(newSource, flags);
};

ReTpl.prototype.find = function(str, offset){  
    var self = this;
    this.re.lastIndex = offset || 0;
    var res = this.re.exec(str);
    if (!res){
        return null;  
    };
    var resObj = {
        full: res[0],
        parts: {}
    };
    res.slice(1).forEach(function(part, id){
        var key = self.map[id];
        resObj.parts[key] = part || null;
    });
    return resObj;
};

ReTpl.prototype.findAll = function(str, offset){  
    var res = [];
    this.re.lastIndex = offset || 0;
    while (true){
        var found = this.find(str, this.re.lastIndex);
        if (!found){
            return res;
        };
        res.push(found);
    };
    return res; // never go there
};

module.exports = ReTpl;
},{}],2:[function(require,module,exports){
//for tests:
//window.mj = {};
//exports = mj;

exports.parse = require('./parser.js').parse;
exports.render = require('./render.js').render;
exports.renderWrapper = require('./render.js').renderWrapper;

exports.make = function(code, data){
	var parsed = exports.parse(code);
	return exports.render(parsed, data);
};
},{"./parser.js":4,"./render.js":5}],3:[function(require,module,exports){
function parseTabTree(code, opts){    

	function Node(parent, code){
		this.parent = parent;
		if (parent){
			parent.children.push(this);
		};
		this.code = code;
		this.children = [];
		this.innerCode = '';
	};

	opts = opts || {
		tabLen: 4
	};

	function repeat(str, times){
		var res = '';
		var i = times;
		while (i--){
			res += ' ';
		}
		return res;
	};

	var tabStr = repeat(' ', opts.tabLen);
	var ast = new Node(null, null);
	var stack = [{
		node: ast,
		offset: -1
	}];
	var lines = code.split('\n');

	lines.forEach(function(line, num){
		var tab = /^[\ \t]*/.exec(line)[0];        
		var offset = tab.replace(/\t/g, tabStr).length / opts.tabLen;
		stack = stack.filter(function(parent){
		   return offset > parent.offset; 
		});
		var parent = stack.slice(-1)[0];
		var node = new Node(parent.node, line.slice(tab.length));
		stack.forEach(function(parent){
			parent.node.innerCode += line + '\n';
		});
		node.num = num;
		node.offset = offset;
		stack.push({
			node: node,
			offset: offset
		});
	});

	return ast;
};

module.exports = parseTabTree;
},{}],4:[function(require,module,exports){
"use strict";

var ReTpl = require('./ReTpl.js');
var parseTabTree = require('./parseTabTree.js');

var gapRe = /\[\!(\w+)\]/g;

function makeRe(dict, re){
	var source = re.source;
	var newSource = source.replace(gapRe, function(subStr, name){
		return dict[name].source;
	});
	var flags = re.global ? 'g' : ''
        + re.multiline ? 'm' : ''
        + re.ignoreCase ? 'i' : '';
	return new RegExp(newSource, flags);  
};

// find single/double quoted Strings [http://stackoverflow.com/questions/249791/regex-for-quoted-string-with-escaping-quotes]
var qutedStrRe = /"(?:[^"\\]*(?:\\.[^"\\]*)*)"|\'(?:[^\'\\]*(?:\\.[^\'\\]*)*)\'/; 
var idfRe = /[a-zA-Z0-9_\-]+/;
var attrRe = makeRe({
		idf: idfRe,
		dqs: qutedStrRe
}, /[!idf]\!?\=?(?:[!idf]|[!dqs])?/);

var prep = makeRe.bind(null, {
	idf: idfRe,
	attr: attrRe
});

var tabRe = /\s*/;

var classIdPartRe = prep(/[\.\#]{1}[!idf]/g);
var classIdRe = makeRe({part: classIdPartRe}, /(?:[!part])+/g);

var tagLine = new ReTpl(
/^[!tag]?[!classId]?[!attrs]?[!text]?[!multiline]?[!value]?[\t\ ]*$/g, {
	tab: tabRe,
	tag: prep(/[!idf]/),
	classId: classIdRe,
	attrs: prep(/\((?:[!attr]\s*\,?\s*)*\)/),
	value: /\!?\=[^\n]*/,
	text: /\ [^\n]*/,
	multiline: /\.[\ \t]*/
});

var whitespace = new ReTpl(/^\s*$/g, {

});

var textLine = new ReTpl(/^\|[!text]$/, {
	text: /[^\n]*/
});

var commentLine = new ReTpl(/^\/\/\-?[!text]$/, {
	text: /[^\n]*/
});

function collapseToStr(ast){
	var lines = [ast.code].concat(ast.children.map(collapseToStr));
	return lines.join('\n');
};

function parseClassId(str){
	var res = {
		classes: [],
		id: null
	};
	var parts = str.match(classIdPartRe).forEach(function(part){
		if (part[0] == "#"){
			res.id = part.slice(1);
			return;
		};
		res.classes.push(part.slice(1));
	});
	return res;
};

var attrPairRe = new ReTpl(/(?:[!name][!equal]?(?:[!key]|[!strValue])?)\,?\s*/g, {
		name: idfRe,
		key: idfRe,
		strValue: qutedStrRe,
		equal: /\!?\=/
})

function parseAttrs(str){
	var attrObj = {};
	if (!str){
			return attrObj;
	};
	str = str.slice(1, -1);
	var pairs = attrPairRe.findAll(str);
	pairs.forEach(function(pair){
		var name = pair.parts.name;
		var value;
		if (pair.parts.key){
			value = {
				type: "varible",
				key: pair.parts.key,
				escaped: pair.parts.equal !== "!="
			};
		}else{
			value = {
				type: "string",
				value: pair.parts.strValue.slice(1, -1)
			};
		};
		attrObj[name] = value; 
	});
	return attrObj;
};

function repeat(str, times){
	var res = '';
	var i = times;
	while (i--){
		res += ' ';
	}
	return res;
};


var tabStr = repeat(' ', 4);
var tabSpaceRe = new RegExp(tabStr, 'g');

function removeOffset(text, offset){
	var offsetLen = offset;	
	return text
		.replace(tabSpaceRe, '\t')
		.split('\n')
		.map(function(line){
			return line.slice(offsetLen);
		})
		.join('\n');	
};

var tokens = {
	tag: {
		rule: function(str){
			if (/^\s*$/g.test(str)){
				return null;
			};
			return tagLine.find(str); 
		},
		transform: function(found, ast, parent){            
			var node = {
				type: 'tag',
				tagName: found.parts.tag || 'div',
				attrs: {},
				parent: parent
			};
			var classes = [];
			var classId = found.parts.classId;
			var id;
			if (classId){
				var parsed = parseClassId(classId);
				if (parsed.id){
					id = parsed.id
				};
				classes = classes.concat(parsed.classes);
			};
			var attrs = parseAttrs(found.parts.attrs);
			if (!attrs.id && id){
				attrs.id = id;
			};
			var classAttr = attrs["class"];
			if (classAttr){				
				if (attrs["class"].type == "string"){
					classes = classes.concat(attrs["class"].value.split(' '));
				};
			}else{
				if (classes.length > 0){
					attrs["class"] = {
						type: "string",
						value: classes.join(' ')
					};
				};	
			};            
			node.attrs = attrs;
			var text;
			if (found.parts.value){
				var equalOp = /\!?\=/.exec(found.parts.value)[0];
				node.value = {
					escaped: equalOp !== "!=",
					path: found.parts.value.replace(/^\s*\!?\=\s*/g, '')
				};
				node.children = [];
				return node;
			};
			if (found.parts.multiline){				
				node.children = [{
					type: 'text',
					text: removeOffset(ast.innerCode, ast.offset + 1)
				}];
				return node;                  
			};
			if (found.parts.text){
				node.children = [{
					type: 'text',
					text: found.parts.text.replace(/^ ?/, '')
				}];
				return node;   
			};
			node.children = ast.children.map(transformAst.bind(null, node));
			return node;
		}
	},
	text: {
		rule: textLine,
		transform: function(found, ast, parent){
			return {
				type: 'text',
				text: found.parts.text,
				parent: parent
			}
		}
	},
	whitespace: {
		rule: whitespace,
		transform: function(found, ast, parent){
			return {
				type: 'whitespace',
				parent: parent
			}
		}
	},
	comment: {
		rule: commentLine,
		transform: function(found, ast, parent){
			return {
				type: 'comment',
				text: found.parts.text,
				parent: parent
			}
		}
	}
};

function transformAst(parent, ast, meta){
		var found;
		var token;
		for (var name in tokens){
			token = tokens[name];
			var line = ast.code.replace(/\r/g, '');
			found = typeof token.rule == "function" 
				? token.rule(line)
				: token.rule.find(line);
			if (found){
				break;
			};        
		};
		if (!found){
			throw new Error('token not found (line: ' + ast.num + '): "' + ast.code + '"\n');
		};
		return token.transform(found, ast, parent);
		
};

function parse(code){
	code = code.toString();
	code = code
		.replace(/\r/g, '')
		.replace(/\n[\ \t]*\n/g, '\n');
	var ast = {
		type: "root"
	};
	var tabAst = parseTabTree(code);
	ast.children = tabAst.children.map(transformAst.bind(null, ast));  
	return ast;  

};



exports.parse = parse;
},{"./ReTpl.js":1,"./parseTabTree.js":3}],5:[function(require,module,exports){
var utils = require('./utils.js');
var StrTpl = require('./strTpl.js');

var selfClosingTags = ["area", "base", "br", "col", 
	"command", "embed", "hr", "img", 
	"input", "keygen", "link", 
	"meta", "param", "source", "track", 
	"wbr"];

var especialTags = {
	"doctype": function(tagInfo){
		var val = tagInfo.innerHTML.replace(/\n/g, '').trim();
		return '<!DOCTYPE ' + val + '>';
	}
};

function objFor(obj, fn){
	for (var i in obj){
		fn(obj[i], i, obj);
	};
};

function renderTagWrapper(tagInfo){
	var attrs = tagInfo.attrs;	
	var pairs = [];
	for (var name in attrs){
		var value = attrs[name].value;
		pairs.push(name + '="' + value + '"');
	};
	var attrCode = '';
	if (pairs.length > 0){
		attrCode = ' ' + pairs.join('');
	};
	var tagHead = tagInfo.name + attrCode;
	if (~selfClosingTags.indexOf(tagInfo.name)){
		return ["<" + tagHead + " />"];
	};
	var especial = especialTags[tagInfo.name];
	if (especial){
		return [especial(tagInfo)];
	};
	var openTag = "<" + tagHead + ">";
	var closeTag = "</" + tagInfo.name + ">";
	return [openTag, closeTag];
};
exports.renderTagWrapper = renderTagWrapper;	

function renderTag(tagInfo){
	var wrap = renderTagWrapper(tagInfo);
	var code = wrap.join(tagInfo.innerHTML || "");
	return code;	
};
exports.renderTag = renderTag;	

function renderAttrs(attrs, data){
	var resAttrs = {};
	objFor(attrs, function(value, name){
		var nameTpl = new StrTpl(name);
		var valueTpl = new StrTpl(value);
		resAttrs[nameTpl.render(data)] = valueTpl.render(data);		
	});	
	return resAttrs;
};
exports.renderAttrs = renderAttrs;

function getAttrsPaths(attrs){
	var paths = [];
	objFor(attrs, function(value, name){
		var nameTpl = new StrTpl(name);
		var valueTpl = new StrTpl(value);
		paths = paths.concat(nameTpl.getPaths(), valueTpl.getPaths());		
	});
	return paths;
};
exports.getAttrsPaths = getAttrsPaths;


function render(ast, data){
	if (ast.type == "comment"){
		return "";
	};
	if (ast.type == "text"){
		return ast.text;
	};
	if (ast.type == "root"){
		return ast.children.map(function(child){
			return render(child, data);
		}).join('');
	};
	if (ast.type != "tag"){
		return "";
	};	
	var inner;
	if (ast.value){
		var path = ast.value.split('.');
		var inner = utils.objPath(path, data);
	}else{
		inner = ast.children.map(function(child){
			return render(child, data);
		}).join('');
	};
	return renderTag({
		name: ast.tagName,
		attrs: ast.attrs,
		innerHTML: inner
	});
};
exports.render = render;

function renderWrapper(ast, data){
	if (ast.type != "tag"){
		return [];
	};
	return renderTagWrapper({
		name: ast.tagName,
		attrs: ast.attrs
	});
};
exports.renderWrapper = renderWrapper;
},{"./strTpl.js":6,"./utils.js":7}],6:[function(require,module,exports){
var utils = require('./utils.js');

function StrTpl(tpl){
	this.tpl = tpl;
};

StrTpl.parse = function(str){
	var re = /\%\@?[\w\d_\.\-]+%/g;
	var gaps = str.match(re);
	if (!gaps){
		return str;
	};
	gaps = gaps.map(function(gap){
		var pathStr = gap.slice(1, -1);
		var path = [];
		if (pathStr[0] == "@"){
			pathStr = pathStr.slice(1);
		}else{
			path = [];
		};
		var path = path.concat(pathStr.split('.'));
		return {
			"path": path
		};
	});
	var tplParts = str.split(re);
	var tpl = utils.mixArrays(tplParts, gaps);
	return tpl;
};

StrTpl.prototype.getPaths = function(){
	var paths = [];
	if (!Array.isArray(this.tpl)){
		return paths;
	};	
	this.tpl.forEach(function(part){
		if (typeof part == "string"){
			return;
		};
		return paths.push(part.path);
	});
	return paths;
};

StrTpl.prototype.render = function(data){
	if (!Array.isArray(this.tpl)){
		return this.tpl;
	};
	return this.tpl.map(function(part){
		if (typeof part == "string"){
			return part;
		};
		return utils.objPath(part.path, data);
	}).join('');	
};

module.exports = StrTpl;

},{"./utils.js":7}],7:[function(require,module,exports){
function mixArrays(arrays){
	var id = 0;
	var maxLength = 0;
	var totalLength = 0;
	for (var i = 0; i < arguments.length; i++){
		maxLength = Math.max(arguments[i].length, maxLength);
		totalLength += arguments[i].length;
	};
	var resArr = [];
	var arrayCount = arguments.length;
	for (var id = 0; id < maxLength; id++){				
		for (var i = 0; i < arrayCount; i++){
			if (arguments[i].length > id){
				resArr.push(arguments[i][id]);
			};
		};
	};
	return resArr;
};
exports.mixArrays = mixArrays;

function objPath(path, obj, newVal){
	if (path.length < 1){
		if (arguments.length > 2){
			throw 'root rewritting is not supported';
		};
		return obj;
	};
	var propName = path[0];
	if (path.length == 1){
		if (arguments.length > 2){
			obj[propName] = newVal; 
		};				
		return obj[propName];	
	};
	var subObj = obj[propName];
	if (subObj === undefined){
		//throw new Error("Cannot read " + propName + " of undefined");
		return undefined; // throw?
	};		
	if (arguments.length > 2){
		return objPath(path.slice(1), subObj, newVal);
	};
	return objPath(path.slice(1), subObj);
};
exports.objPath = objPath;

},{}],8:[function(require,module,exports){
"use strict";
/**
 * Generates an id for an acnchor.
 * @param {Object} context - Fg containing the acnchor.
 * @param {Object} gap - Gap to which the acnchor is bind to.
 * @returns {string} Id of the anchor tag.
 */
function genId(context, gap) {
    var id = ['fg', context.id, 'aid', gap.gid].join('-');
    return id;
}
;
/**
 * Generates code for an acnchor.
 * @param {Object} context - Fg containing the acnchor.
 * @param {Object} gap - Gap to which the acnchor is bind to.
 * @returns {string} Html code of the anchor.
 */
function genCode(context, gap) {
    var code = '<script type="fg-js/anchor" id="'
        + genId(context, gap)
        + '"></script>';
    return code;
}
exports.genCode = genCode;
;
/**
 * Find the anchor.
 * @param {Object} context - Fg containing the acnchor.
 * @param {Object} gap - Gap to which the acnchor is bind to.
 * @returns {Object} Dom element of the anchor.
 */
function find(context, gap) {
    var id = genId(context, gap);
    return document.getElementById(id);
}
exports.find = find;
;
/**
 * Places some Html code next to the acnchor.
 * @param {Object} anchor - The anchor DOM element.
 * @param {string} position - Defines where code be placed. "after" and "before" are used relative to anchor node.
 * @param {string} html - HTML code to be placed.
 */
function insertHTML(anchor, position, html) {
    var pos;
    switch (position) {
        case "before":
            pos = "beforebegin";
            break;
        case "after":
            pos = "afterend";
            break;
    }
    ;
    anchor.insertAdjacentHTML(pos, html);
}
exports.insertHTML = insertHTML;
;
},{}],9:[function(require,module,exports){
"use strict";
var eventEmitter_1 = require('../eventEmitter');
var globalEvents = require('./globalEvents');
var fgInstanceModule = require('./fgInstance');
exports.fgClassTable = [];
exports.fgClassDict = {};
;
var FgClass = (function () {
    function FgClass(opts) {
        this.id = exports.fgClassTable.length;
        this.instances = [];
        this.tpl = opts.tpl;
        this.name = opts.name;
        this.eventEmitter = new eventEmitter_1.default();
        exports.fgClassDict[opts.name] = this;
        exports.fgClassTable.push(this);
        function FgInstance() {
            fgInstanceModule.FgInstanceBase.apply(this, arguments);
        }
        ;
        this.createFn = FgInstance;
        this.createFn.constructor = fgInstanceModule.FgInstanceBase;
        this.createFn.prototype = Object.create(fgInstanceModule.FgInstanceBase.prototype);
        var classFn = opts.classFn;
        if (classFn) {
            classFn(this, this.createFn.prototype);
        }
        ;
    }
    ;
    FgClass.prototype.on = function (name, selector, fn) {
        if (arguments.length === 2) {
            name = name;
            fn = arguments[1];
            selector = null;
        }
        else {
            var originalFn = fn;
            fn = function (event) {
                if (match(this, event.target, selector)) {
                    originalFn.call(this, event);
                }
                ;
            };
        }
        ;
        globalEvents.listen(name);
        this.eventEmitter.on(name, fn);
    };
    ;
    FgClass.prototype.emit = function () {
        this.eventEmitter.emit.apply(this.eventEmitter, arguments);
    };
    ;
    FgClass.prototype.emitApply = function (name, thisArg, args) {
        this.eventEmitter.emitApply(name, thisArg, args);
    };
    ;
    FgClass.prototype.cookData = function (data) {
        return data;
    };
    ;
    FgClass.prototype.render = function (data, meta, parent) {
        if (data instanceof HTMLElement) {
            return this.renderIn.apply(this, arguments);
        }
        ;
        var fg = new fgInstanceModule.FgInstance(this, parent);
        fg.code = fg.getHtml(data, meta);
        return fg;
    };
    ;
    FgClass.prototype.renderIn = function (parentNode, data, meta, parent) {
        var fg = this.render(data, meta, parent);
        parentNode.innerHTML = fg.code;
        fg.assign();
        return fg;
    };
    ;
    FgClass.prototype.appendTo = function (parentNode, data) {
        var fg = this.render(data);
        var div = document.createElement('div');
        div.innerHTML = fg.code;
        [].slice.call(div.children).forEach(function (child) {
            parentNode.appendChild(child);
        });
        fg.assign();
    };
    ;
    return FgClass;
}());
exports.FgClass = FgClass;
;
function match(fg, node, selector) {
    var domElms = fg.getDom();
    while (node) {
        if (node.matches(selector)) {
            return true;
        }
        ;
        if (domElms.indexOf(node) >= 0) {
            return false;
        }
        ;
        node = node.parentElement;
    }
    ;
    return false;
}
;
},{"../eventEmitter":16,"./fgInstance":10,"./globalEvents":13}],10:[function(require,module,exports){
"use strict";
var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var tplRender_1 = require('../tplRender');
var gapClassMgr = require('./gapClassMgr');
var eventEmitter_1 = require('../eventEmitter');
var utils = require('../utils');
var GapStorage_1 = require('./GapStorage');
var globalEvents = require('./globalEvents');
var root_1 = require('../gaps/root');
var helper = require('./helper');
exports.fgInstanceTable = [];
var FgInstanceBase = (function () {
    function FgInstanceBase(fgClass, parent) {
        this.id = exports.fgInstanceTable.length;
        fgClass.instances.push(this);
        this.name = fgClass.name;
        this.fgClass = fgClass;
        this.code = null;
        this.parent = parent || null;
        this.eventEmitter = new eventEmitter_1.default(fgClass.eventEmitter);
        this.gapStorage = new GapStorage_1.default(this);
        this.childFgs = [];
        exports.fgInstanceTable.push(this);
    }
    ;
    FgInstanceBase.prototype.on = function (event, fn) {
        globalEvents.listen(event);
        this.eventEmitter.on(event, fn);
    };
    ;
    FgInstanceBase.prototype.emit = function () {
        var rest = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            rest[_i - 0] = arguments[_i];
        }
        this.eventEmitter.emit.apply(this.eventEmitter, arguments);
    };
    ;
    FgInstanceBase.prototype.emitApply = function () {
        var rest = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            rest[_i - 0] = arguments[_i];
        }
        this.eventEmitter.emit.apply(this.eventEmitter, arguments);
    };
    ;
    FgInstanceBase.prototype.toString = function () {
        return this.code;
    };
    ;
    FgInstanceBase.prototype.assign = function () {
        // this.emitApply('ready', this, []);
        // this.dom = document.getElementById('fg-iid-' + this.id);
        // this.gapStorage.assign();
        // return this.dom;
    };
    ;
    FgInstanceBase.prototype.renderTpl = function (tpl, parent, data, meta) {
        return tplRender_1.default.call({
            "renderGap": gapClassMgr.render,
            "context": this
        }, tpl, parent, data, meta);
    };
    ;
    FgInstanceBase.prototype.getHtml = function (data, meta) {
        this.data = data;
        this.gapMeta = meta;
        var rootGap = new root_1.default(this, meta);
        rootGap.type = "root";
        rootGap.isVirtual = true;
        rootGap.fg = this;
        this.meta = rootGap;
        var cookedData = this.fgClass.cookData(data);
        return this.renderTpl(this.fgClass.tpl, rootGap, cookedData, metaMap.bind(null, this));
    };
    ;
    FgInstanceBase.prototype.update = function (scopePath, newValue) {
        if (arguments.length === 0) {
            return this.update([], this.data); // todo
        }
        ;
        if (arguments.length === 1) {
            return this.update([], arguments[0]);
        }
        ;
        var value = utils.deepClone(newValue);
        var self = this;
        var oldValue = utils.objPath(scopePath, this.data);
        if (oldValue === value) {
            return this;
        }
        ;
        this.emit('update', scopePath, newValue);
        if (scopePath.length > 0) {
            utils.objPath(scopePath, this.data, value);
        }
        else {
            this.data = value;
        }
        var scope = this.gapStorage.byScope(scopePath);
        var gaps = scope.target;
        gaps.forEach(function (gap) {
            gap.update(self, gap, scopePath, value, oldValue);
        });
        scope.parents.forEach(function (parentNode) {
            parentNode.data.gaps.forEach(function (parentGap) {
                if (parentGap.type === "fg") {
                    var subPath = scopePath.slice(parentGap.scopePath.path.length);
                    //var subVal = utils.objPath(subPath, self.data);
                    parentGap.fg.update(subPath, newValue);
                }
                ;
            });
        });
        scope.subs.forEach(function (sub) {
            var subVal = utils.objPath(sub.path, self.data);
            var subPath = sub.path.slice(scopePath.length);
            var oldSubVal = utils.objPath(subPath, oldValue);
            if (subVal === oldSubVal) {
                return;
            }
            ;
            sub.gaps.forEach(function (gap) {
                if (self.gapStorage.gaps.indexOf(gap) < 0) {
                    return;
                }
                ;
                gapClassMgr.update(self, gap, sub.path, subVal, oldSubVal);
            });
        });
        return this;
    };
    ;
    FgInstanceBase.prototype.cloneData = function () {
        return utils.deepClone(this.data);
    };
    ;
    FgInstanceBase.prototype.clear = function () {
        this.childFgs.forEach(function (child) {
            child.remove(true);
        });
        this.code = '';
        this.data = null;
        this.gapStorage = null;
        this.childFgs = [];
    };
    ;
    FgInstanceBase.prototype.remove = function (virtual) {
        if (!virtual) {
            var dom = this.getDom();
            dom.forEach(function (elm) {
                elm.remove();
            });
        }
        ;
        this.clear();
        var instanceId = this.fgClass.instances.indexOf(this);
        this.fgClass.instances.splice(instanceId, 1);
        exports.fgInstanceTable[this.id] = null;
    };
    ;
    FgInstanceBase.prototype.rerender = function (data) {
        this.clear();
        this.gapStorage = new GapStorage_1.default(this);
        var dom = this.getDom()[0];
        this.code = this.getHtml(data, null);
        dom.outerHTML = this.code; // doesnt work with multi root
        this.assign();
        return this;
    };
    ;
    FgInstanceBase.prototype.getDom = function () {
        return this.meta.getDom();
    };
    ;
    FgInstanceBase.prototype.jq = function () {
        var dom = this.getDom();
        var res = helper.jq(dom);
        if (arguments.length === 0) {
            return res;
        }
        ;
        var selector = arguments[0];
        var selfSelected = res
            .parent()
            .find(selector)
            .filter(function (id, elm) {
            return dom.indexOf(elm) >= 0;
        });
        var childSelected = res.find(selector);
        return selfSelected.add(childSelected);
    };
    ;
    FgInstanceBase.prototype.gap = function (id) {
        return this.gaps(id)[0];
    };
    ;
    FgInstanceBase.prototype.gaps = function (id) {
        var gaps = this.gapStorage.byEid(id);
        if (gaps) {
            return gaps;
        }
        ;
    };
    ;
    FgInstanceBase.prototype.sub = function (id) {
        var gap = this.gap(id);
        if (!gap) {
            return null;
        }
        ;
        return gap.fg || null;
    };
    ;
    return FgInstanceBase;
}());
exports.FgInstanceBase = FgInstanceBase;
;
var FgInstance = (function (_super) {
    __extends(FgInstance, _super);
    function FgInstance(fgClass, parent) {
        if (!!false) {
            _super.call(this, fgClass, parent);
        }
        ;
        return new fgClass.createFn(fgClass, parent);
    }
    ;
    return FgInstance;
}(FgInstanceBase));
exports.FgInstance = FgInstance;
;
function getClasses(meta) {
    if (!meta || !meta.attrs || !meta.attrs.class) {
        return [];
    }
    ;
    if (Array.isArray(meta.attrs.class)) {
        return meta.attrs.class;
    }
    ;
    return meta.attrs.class.split(' ');
}
;
function metaMap(fg, metaPart) {
    var res = utils.simpleClone(metaPart);
    var classes = getClasses(res);
    var fg_cid = "fg-cid-" + fg.fgClass.id;
    res.attrs = utils.simpleClone(metaPart.attrs);
    if (Array.isArray(res.attrs.class)) {
        res.attrs.class = ['fg', ' ', fg_cid, ' '].concat(classes);
        return res;
    }
    ;
    res.attrs.class = ['fg', fg_cid].concat(classes).join(' ');
    return res;
}
;
function createScopeHelper(fg, obj, scopePath) {
    var helper = Array.isArray(obj)
        ? []
        : {};
    utils.objFor(obj, function (value, key) {
        var propScopePath = scopePath.concat([key]);
        Object.defineProperty(helper, key, {
            get: function () {
                if (typeof value === "object") {
                    return createScopeHelper(fg, obj[key], propScopePath);
                }
                ;
                return obj[key];
            },
            set: function (val) {
                fg.update(propScopePath, val);
            }
        });
    });
    return helper;
}
;
function getFgByIid(iid) {
    return exports.fgInstanceTable[iid];
}
exports.getFgByIid = getFgByIid;
;
},{"../eventEmitter":16,"../gaps/root":24,"../tplRender":29,"../utils":30,"./GapStorage":12,"./gapClassMgr":11,"./globalEvents":13,"./helper":14}],11:[function(require,module,exports){
"use strict";
var utils = require('../utils');
var valueMgr = require('../valueMgr');
var Gap = (function () {
    function Gap(context, parsedMeta, parent) {
        utils.extend(this, parsedMeta); // todo: why?
        this.children = [];
        this.parent = parent || null;
        this.root = this;
        this.context = context;
        //this.scopePath = utils.getScopePath(this);
        //this.triggers = [];
        context.gapStorage.reg(this);
        if (this.path) {
            this.resolvedPath = valueMgr.resolvePath(this, this.path);
            if (this.resolvedPath.source === "data") {
                context.gapStorage.setTriggers(this, [this.resolvedPath.path]);
            }
            ;
        }
        ;
        if (!parent) {
            return this;
        }
        ;
        this.root = parent.root;
        parent.children.push(this);
    }
    ;
    Gap.parse = function (node, html, parentMeta) {
        return null;
    };
    ;
    Gap.prototype.update = function (context, meta, scopePath, value, oldValue) {
        return;
    };
    ;
    Gap.prototype.closest = function (selector) {
        var eid = selector.slice(1);
        var gap = this.parent;
        while (gap) {
            if (gap.eid === eid) {
                return gap;
            }
            ;
            gap = gap.parent;
        }
        ;
        return null;
    };
    ;
    Gap.prototype.data = function (val) {
        if (arguments.length === 0) {
            return utils.objPath(this.scopePath.path, this.context.data);
        }
        ;
        this.context.update(this.scopePath.path, val);
    };
    ;
    Gap.prototype.findRealDown = function () {
        if (!this.isVirtual) {
            return [this];
        }
        ;
        var res = [];
        this.children.forEach(function (child) {
            res = res.concat(child.findRealDown());
        });
        return res;
    };
    ;
    Gap.prototype.getDom = function () {
        if (!this.isVirtual) {
            var id = ["fg", this.context.id, "gid", this.gid].join('-');
            return [document.getElementById(id)];
        }
        ;
        var res = [];
        this.findRealDown().forEach(function (gap) {
            res = res.concat(gap.getDom());
        });
        return res;
    };
    ;
    Gap.prototype.removeDom = function () {
        var dom = this.getDom();
        dom.forEach(function (elm) {
            if (!elm) {
                return;
            }
            ;
            elm.remove();
        });
    };
    ;
    return Gap;
}());
exports.Gap = Gap;
;
function render(context, parent, data, meta) {
    var gapClass = gaps_1.default[meta.type];
    var gap = new gapClass(context, meta, parent);
    return gap.render(context, data);
}
exports.render = render;
;
function update(context, gapMeta, scopePath, value, oldValue) {
    var gapClass = gaps_1.default[gapMeta.type];
    if (!gapClass) {
        return;
    }
    ;
    return gapClass.update(context, gapMeta, scopePath, value, oldValue);
}
exports.update = update;
;
var gaps_1 = require('../gaps');
},{"../gaps":18,"../utils":30,"../valueMgr":33}],12:[function(require,module,exports){
"use strict";
var utils = require('../utils');
var TreeHelper_1 = require('../utils/TreeHelper');
function initNodeFn() {
    return {
        gaps: []
    };
}
;
var GapStorage = (function () {
    function GapStorage(context) {
        this.context = context;
        this.gaps = [];
        this.scopeTree = TreeHelper_1.default({
            kind: 'dict',
            initTreeNode: initNodeFn
        });
        this.eidDict = {};
    }
    ;
    GapStorage.prototype.setScopeTrigger = function (gap, scopePath) {
        var scope = this.scopeTree.access(scopePath);
        scope.data.gaps.push(gap);
    };
    ;
    GapStorage.prototype.setTriggers = function (gap, scopeTriggers) {
        scopeTriggers.forEach(this.setScopeTrigger.bind(this, gap));
    };
    ;
    GapStorage.prototype.reg = function (gap) {
        var eid = gap.eid;
        if (eid) {
            this.eidDict[eid] = this.eidDict[eid] || [];
            this.eidDict[eid].push(gap);
        }
        ;
        var gid = this.getGid();
        gap.gid = gid;
        if (!gap.isVirtual) {
            gap.attrs = utils.simpleClone(gap.attrs || {});
            gap.attrs.id = ["fg", this.context.id, "gid", gid].join('-');
        }
        ;
        gap.storageId = this.gaps.length;
        this.gaps.push(gap);
    };
    ;
    GapStorage.prototype.assign = function () {
        this.gaps.forEach(function (gapMeta) {
            if (gapMeta.type !== "root" && gapMeta.fg) {
                gapMeta.fg.assign();
            }
            ;
        });
        return;
    };
    ;
    GapStorage.prototype.byScope = function (scopePath, targetOnly) {
        var scope = this.scopeTree.access(scopePath);
        var subNodes = [];
        if (scope.childCount !== 0 && !targetOnly) {
            subNodes = scope.getDeepChildArr().map(function (node) {
                return {
                    gaps: node.data.gaps,
                    path: node.path
                };
            });
        }
        ;
        var parents = scope.getParents();
        return {
            target: scope.data.gaps,
            subs: subNodes,
            parents: parents
        };
    };
    ;
    GapStorage.prototype.removeScope = function (scopePath) {
        var scope = this.byScope(scopePath);
        var removedDomGaps = scope.target;
        var removedGaps = scope.target;
        scope.subs.forEach(function (node) {
            removedGaps = removedGaps.concat(node.gaps);
        });
        this.scopeTree.remove(scopePath);
        this.gaps = this.gaps.filter(function (gap) {
            return removedGaps.indexOf(gap) < 0;
        });
        removedDomGaps.forEach(function (gap) {
            gap.removeDom();
        });
    };
    ;
    GapStorage.prototype.byEid = function (eid) {
        return this.eidDict[eid];
    };
    ;
    GapStorage.prototype.getGid = function () {
        return this.gaps.length;
    };
    ;
    return GapStorage;
}());
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = GapStorage;
;
},{"../utils":30,"../utils/TreeHelper":32}],13:[function(require,module,exports){
"use strict";
;
var events = {};
var win = window;
function handler(name, event) {
    var helper = win['$fg'];
    var elm = event.target;
    while (elm) {
        var fg = helper.byDom(elm);
        if (fg) {
            fg.emitApply(name, fg, [event]);
        }
        ;
        elm = elm.parentElement;
    }
    ;
}
exports.handler = handler;
;
function listen(name) {
    if (name in events) {
        return;
    }
    ;
    events[name] = true;
    document.addEventListener(name, handler.bind(null, name), true);
}
exports.listen = listen;
;
},{}],14:[function(require,module,exports){
"use strict";
var fgClass_1 = require('./fgClass');
var fgInstance_1 = require('./fgInstance');
;
var $fg = function (arg) {
    if (arg instanceof HTMLElement) {
        return $fg.byDom(arg);
    }
    ;
    if (typeof arg == "string") {
        return fgClass_1.fgClassDict[arg];
    }
    ;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = $fg;
$fg.load = function (fgData) {
    if (Array.isArray(fgData)) {
        return fgData.map($fg.load);
    }
    ;
    return new fgClass_1.FgClass(fgData);
};
$fg.isFg = function (domNode) {
    return domNode.classList && domNode.classList.contains('fg');
};
var iidRe = /fg\-iid\-(\d+)/g;
var idRe = /fg\-(\d+)\-gid\-(\d+)/g;
$fg.byDom = function (domNode) {
    if (!domNode || !domNode.className) {
        return null;
    }
    ;
    if (!~domNode.className.split(' ').indexOf('fg')) {
        return null;
    }
    ;
    if (!domNode.id) {
        return null;
    }
    ;
    idRe.lastIndex = 0;
    var res = idRe.exec(domNode.id);
    if (!res) {
        return null;
    }
    ;
    var iid = parseInt(res[1]);
    return fgInstance_1.getFgByIid(iid);
};
$fg.gapClosest = function (domNode) {
    while (true) {
        idRe.lastIndex = 0;
        var res = idRe.exec(domNode.id);
        if (!res) {
            domNode = domNode.parentElement;
            if (!domNode) {
                return null;
            }
            ;
            continue;
        }
        ;
        var iid = parseInt(res[1]);
        var fg = fgInstance_1.getFgByIid(iid);
        var gid = parseInt(res[2]);
        return fg.gapStorage.gaps[gid];
    }
    ;
};
$fg.classes = fgClass_1.fgClassDict;
$fg.fgs = fgInstance_1.fgInstanceTable;
var win = window;
$fg.jq = win['jQuery'];
win['$fg'] = $fg;
},{"./fgClass":9,"./fgInstance":10}],15:[function(require,module,exports){
"use strict";
var helper = require('./helper');
console.log(helper);
},{"./helper":14}],16:[function(require,module,exports){
"use strict";
var EventEmitter = (function () {
    function EventEmitter(parent) {
        this.events = {};
        this.parent = parent;
    }
    ;
    EventEmitter.prototype.on = function (name, fn) {
        var eventList = this.events[name];
        if (!eventList) {
            eventList = [];
            this.events[name] = eventList;
        }
        ;
        eventList.push(fn);
    };
    ;
    EventEmitter.prototype.emit = function (name) {
        var emitArgs = [];
        for (var _i = 1; _i < arguments.length; _i++) {
            emitArgs[_i - 1] = arguments[_i];
        }
        if (this.parent) {
            this.parent.emit.apply(this.parent, arguments);
        }
        ;
        var eventList = this.events[name];
        if (!eventList) {
            return;
        }
        ;
        eventList.forEach(function (fn) {
            fn.apply(this, emitArgs);
        });
    };
    ;
    EventEmitter.prototype.emitApply = function (name, thisArg, args) {
        if (this.parent) {
            this.parent.emitApply.apply(this.parent, arguments);
        }
        ;
        var eventList = this.events[name];
        if (!eventList) {
            return;
        }
        ;
        eventList.forEach(function (fn) {
            fn.apply(thisArg, args);
        });
    };
    ;
    return EventEmitter;
}());
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = EventEmitter;
;
},{}],17:[function(require,module,exports){
"use strict";
var gaps_1 = require('./gaps');
;
function parse(ast, html, parentMeta) {
    /*var name = ast.nodeName;
    var gap = gapTable[name];
    if (!gap){
        return false;
    };*/
    var matched = [];
    for (var i in gaps_1.default) {
        var gap = gaps_1.default[i];
        var meta = gap.parse(ast, html, parentMeta);
        if (meta) {
            matched.push({
                "gap": gap,
                "meta": meta
            });
        }
        ;
    }
    ;
    if (matched.length > 1) {
        var maxPrior_1 = Math.max.apply(Math, matched.map(function (item) {
            return item.gap.priority || 0;
        }));
        matched = matched.filter(function (item) {
            return (item.gap.priority || 0) === maxPrior_1;
        });
    }
    if (matched.length === 1) {
        return matched[0].meta;
    }
    ;
    if (matched.length === 0) {
        return null;
    }
    ;
    if (matched.length > 1) {
        throw new Error("Gap parsing conflict");
    }
    ;
    return null;
}
exports.parse = parse;
;
},{"./gaps":18}],18:[function(require,module,exports){
"use strict";
var content_1 = require('./gaps/content');
var data_1 = require('./gaps/data');
var dynamic_text_1 = require('./gaps/dynamic-text');
var fg_1 = require('./gaps/fg');
var raw_1 = require('./gaps/raw');
var scope_1 = require('./gaps/scope');
var scope_item_1 = require('./gaps/scope-item');
;
var gaps = {
    content: content_1.default,
    data: data_1.default,
    dynamicText: dynamic_text_1.default,
    fg: fg_1.default,
    raw: raw_1.default,
    scope: scope_1.default,
    scopeItem: scope_item_1.default
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = gaps;
},{"./gaps/content":19,"./gaps/data":20,"./gaps/dynamic-text":21,"./gaps/fg":22,"./gaps/raw":23,"./gaps/scope":26,"./gaps/scope-item":25}],19:[function(require,module,exports){
"use strict";
var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var gapClassMgr_1 = require('../client/gapClassMgr');
var GContent = (function (_super) {
    __extends(GContent, _super);
    function GContent() {
        _super.apply(this, arguments);
        this.type = "content";
    }
    GContent.parse = function (node) {
        if (node.tagName !== "content") {
            return null;
        }
        ;
        var meta = {};
        meta.isVirtual = true;
        meta.type = "content";
        /*meta.fgName = node.nodeName.slice(3);
        meta.path = node.attrs.class
            ? node.attrs.class.split(' ')
            : [];
        meta.eid = node.attrs.id || null;
        meta.content = tplMgr.readTpl(node, html, meta);*/
        return meta;
    };
    ;
    GContent.prototype.render = function (context, data) {
        this.scopePath = context.gapMeta.scopePath;
        return context.parent.renderTpl(context.meta.content, context.gapMeta.parent, context.parent.data);
    };
    ;
    return GContent;
}(gapClassMgr_1.Gap));
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = GContent;
;
},{"../client/gapClassMgr":11}],20:[function(require,module,exports){
"use strict";
var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var utils = require('../utils');
var valueMgr = require('../valueMgr');
var gapClassMgr_1 = require('../client/gapClassMgr');
var GData = (function (_super) {
    __extends(GData, _super);
    function GData() {
        _super.apply(this, arguments);
        this.type = "data";
    }
    GData.parse = function (node) {
        if (node.tagName != "data") {
            return null;
        }
        ;
        var meta = {};
        meta.type = "data";
        meta.isVirtual = false;
        meta.path = utils.parsePath(node);
        meta.eid = node.attrs.id || null;
        return meta;
    };
    ;
    GData.prototype.render = function (context, data) {
        var value = valueMgr.render(this, data, this.resolvedPath);
        return utils.renderTag({
            name: "span",
            attrs: this.attrs,
            innerHTML: value
        });
    };
    ;
    GData.prototype.update = function (context, meta, scopePath, value) {
        var node = meta.getDom()[0];
        if (!node) {
        }
        ;
        node.innerHTML = value;
        //highlight(node, [0xffffff, 0xffee88], 500);
    };
    ;
    return GData;
}(gapClassMgr_1.Gap));
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = GData;
;
},{"../client/gapClassMgr":11,"../utils":30,"../valueMgr":33}],21:[function(require,module,exports){
"use strict";
var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var valueMgr = require('../valueMgr');
var StrTpl_1 = require('../StrTpl');
var gapClassMgr_1 = require('../client/gapClassMgr');
var data_1 = require('./data');
var GDynamicText = (function (_super) {
    __extends(GDynamicText, _super);
    function GDynamicText() {
        _super.apply(this, arguments);
        this.type = "dynamicText";
    }
    GDynamicText.parse = function (node) {
        if (node.type !== "text") {
            return null;
        }
        ;
        var tpl = StrTpl_1.read(node.text, valueMgr.parse);
        if (typeof tpl === "string") {
            return null;
        }
        ;
        var meta = {};
        meta.type = "dynamicText";
        meta.tpl = tpl;
        return meta;
    };
    ;
    GDynamicText.prototype.render = function (context, data) {
        var meta = this;
        var tpl = new StrTpl_1.StrTpl(meta.tpl, valueMgr.parse);
        return tpl.render(function (path) {
            var dataMeta = {
                "type": "data",
                "path": path
            };
            var itemMeta = new data_1.default(context, dataMeta, meta.parent);
            return itemMeta.render(context, data);
        });
    };
    ;
    return GDynamicText;
}(gapClassMgr_1.Gap));
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = GDynamicText;
;
},{"../StrTpl":27,"../client/gapClassMgr":11,"../valueMgr":33,"./data":20}],22:[function(require,module,exports){
"use strict";
var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var utils = require('../utils');
var valueMgr = require('../valueMgr');
var gapClassMgr_1 = require('../client/gapClassMgr');
var tplMgr_1 = require('../tplMgr');
var GFg = (function (_super) {
    __extends(GFg, _super);
    function GFg() {
        _super.apply(this, arguments);
        this.type = "fg";
    }
    GFg.parse = function (node) {
        if (node.type != 'tag' || !~node.tagName.indexOf("fg-")) {
            return null;
        }
        ;
        var meta = {};
        meta.type = "fg";
        meta.isVirtual = true;
        meta.fgName = node.tagName.slice(3);
        meta.path = utils.parsePath(node);
        meta.eid = node.attrs.id || null;
        meta.content = tplMgr_1.readTpl(node, null, meta);
        return meta;
    };
    ;
    GFg.prototype.render = function (context, data) {
        var self = this;
        this.parentFg = context;
        //this.renderedContent = context.renderTpl(this.content, meta, data);
        var win = window;
        var fgClass = win['$fg'].classes[this.fgName];
        var fgData = utils.deepClone(valueMgr.getValue(this, data, this.resolvedPath));
        var fg = fgClass.render(fgData, this, context);
        fg.on('update', function (path, val) {
            //context.update(scopePath.concat(path), val);
            //console.log(path, val);
        });
        this.fg = fg;
        fg.meta = this;
        context.childFgs.push(fg);
        return fg;
    };
    ;
    GFg.prototype.update = function (context, meta, scopePath, value) {
        var node = meta.getDom()[0];
        if (!node) {
        }
        ;
        node.innerHTML = value;
        //highlight(node, [0xffffff, 0xffee88], 500);
    };
    ;
    return GFg;
}(gapClassMgr_1.Gap));
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = GFg;
;
},{"../client/gapClassMgr":11,"../tplMgr":28,"../utils":30,"../valueMgr":33}],23:[function(require,module,exports){
"use strict";
var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var utils = require('../utils');
var valueMgr = require('../valueMgr');
var StrTpl_1 = require('../StrTpl');
var gapClassMgr_1 = require('../client/gapClassMgr');
var tplMgr_1 = require('../tplMgr');
function isScope(item) {
    if (typeof item === "string") {
        return false;
    }
    ;
    return item.type === "scope";
}
;
var GRaw = (function (_super) {
    __extends(GRaw, _super);
    function GRaw() {
        _super.apply(this, arguments);
        this.type = "raw";
    }
    GRaw.parse = function (node, html, parentMeta) {
        if (node.type !== "tag") {
            return null;
        }
        ;
        var hasDynamicAttrs = false;
        var meta = {};
        meta.type = "raw";
        meta.isVirtual = false;
        meta.isRootNode = node.parent.type !== "tag";
        meta.tagName = node.tagName;
        if ("id" in node.attrs) {
            meta.eid = node.attrs.id.value;
            delete node.attrs.id;
        }
        ;
        var attrsArr = utils.objToKeyValue(node.attrs, 'name', 'value');
        attrsArr = attrsArr.map(function (attr) {
            var attrVal = attr.value.type === "string"
                ? attr.value.value
                : (attr.value.escaped ? '#' : '!') + '{' + attr.value.key + '}';
            var value = StrTpl_1.read(attrVal, valueMgr.parse);
            var name = StrTpl_1.read(attr.name, valueMgr.parse);
            if (typeof value !== "string" || typeof name !== "string") {
                hasDynamicAttrs = true;
            }
            ;
            return {
                "name": name,
                "value": value
            };
        });
        meta.attrs = utils.keyValueToObj(attrsArr, 'name', 'value');
        if (node.value) {
            meta.path = valueMgr.parse(node.value.path, {
                escaped: node.value.escaped
            });
        }
        ;
        meta.content = tplMgr_1.readTpl(node, null, meta);
        if (meta.content.some(isScope)) {
            meta.isScopeHolder = true;
        }
        ;
        if (parentMeta && parentMeta.type === "scope") {
            meta.isScopeItem = true;
        }
        ;
        if (!hasDynamicAttrs
            && !meta.eid
            && !meta.isRootNode
            && !meta.isScopeHolder
            && !meta.isScopeItem
            && !meta.path) {
            return null;
        }
        ;
        return meta;
    };
    ;
    GRaw.prototype.render = function (context, data) {
        var meta = this;
        if (meta.isScopeHolder) {
            meta.root.currentScopeHolder = meta;
        }
        ;
        var attrsArr = utils.objToKeyValue(meta.attrs, 'name', 'value');
        var attrObj = {};
        attrsArr.forEach(function (attr) {
            var name = new StrTpl_1.StrTpl(attr.name).render(valueMgr.resolveAndRender.bind(null, meta, data));
            var value = new StrTpl_1.StrTpl(attr.value).render(valueMgr.resolveAndRender.bind(null, meta, data));
            attrObj[name] = value;
        });
        var triggers = [];
        context.gapStorage.setTriggers(meta, triggers);
        var inner = meta.path
            ? valueMgr.render(meta, data, this.resolvedPath)
            : context.renderTpl(meta.content, meta, data);
        return utils.renderTag({
            "name": meta.tagName,
            "attrs": attrObj,
            "innerHTML": inner
        });
    };
    ;
    GRaw.prototype.update = function (context, meta, scopePath, value) {
        // to do value update
        /*var attrData = utils.objPath(meta.scopePath, context.data);
        var renderedAttrs = utils.renderAttrs(meta.attrs, attrData);*/
        var attrsArr = utils.objToKeyValue(meta.attrs, 'name', 'value');
        var attrObj = {};
        attrsArr.forEach(function (attr) {
            var name = new StrTpl_1.StrTpl(attr.name).render(valueMgr.render.bind(null, meta, context.data));
            var value = new StrTpl_1.StrTpl(attr.value).render(function (path) {
                var resolvedPath = valueMgr.resolvePath(meta, path);
                return valueMgr.render(meta, context.data, resolvedPath);
            });
            attrObj[name] = value;
        });
        var dom = meta.getDom()[0];
        if (meta.path && meta.path.path.join('-') === scopePath.join('-')) {
            dom.innerHTML = meta.path.escaped
                ? utils.escapeHtml(value)
                : value;
        }
        ;
        utils.objFor(attrObj, function (value, name) {
            var oldVal = dom.getAttribute(name);
            if (oldVal !== value) {
                dom.setAttribute(name, value);
            }
            ;
        });
    };
    ;
    GRaw.priority = -1;
    return GRaw;
}(gapClassMgr_1.Gap));
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = GRaw;
;
},{"../StrTpl":27,"../client/gapClassMgr":11,"../tplMgr":28,"../utils":30,"../valueMgr":33}],24:[function(require,module,exports){
"use strict";
var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var gapClassMgr_1 = require('../client/gapClassMgr');
var GRoot = (function (_super) {
    __extends(GRoot, _super);
    function GRoot() {
        _super.apply(this, arguments);
        this.type = "root";
    }
    GRoot.parse = function (node) {
        return null;
    };
    ;
    GRoot.prototype.render = function (context, data) {
        throw new Error('root gap should not be rendered');
    };
    ;
    return GRoot;
}(gapClassMgr_1.Gap));
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = GRoot;
;
},{"../client/gapClassMgr":11}],25:[function(require,module,exports){
"use strict";
var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var valueMgr = require('../valueMgr');
var gapClassMgr_1 = require('../client/gapClassMgr');
var GScopeItem = (function (_super) {
    __extends(GScopeItem, _super);
    function GScopeItem() {
        _super.apply(this, arguments);
        this.type = "scopeItem";
    }
    GScopeItem.parse = function (node) {
        return null;
    };
    ;
    GScopeItem.prototype.render = function (context, data) {
        var meta = this;
        var scopeData = valueMgr.getValue(meta, data, this.resolvedPath);
        this.scopePath = this.resolvedPath.path;
        if (!scopeData) {
            return '';
        }
        ;
        return context.renderTpl(meta.content, meta, data);
    };
    ;
    return GScopeItem;
}(gapClassMgr_1.Gap));
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = GScopeItem;
;
},{"../client/gapClassMgr":11,"../valueMgr":33}],26:[function(require,module,exports){
"use strict";
var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var utils = require('../utils');
var valueMgr = require('../valueMgr');
var gapClassMgr_1 = require('../client/gapClassMgr');
var tplMgr_1 = require('../tplMgr');
var anchorMgr = require('../anchorMgr');
var scope_item_1 = require('./scope-item');
function renderScopeContent(context, scopeMeta, scopeData, data, idOffset) {
    var isArray = Array.isArray(scopeData);
    if (!isArray) {
        scopeData = [scopeData];
    }
    ;
    var parts = scopeData.map(function (dataItem, id) {
        var itemMeta = scopeMeta;
        var path = isArray
            ? valueMgr.read([(id + idOffset).toString()])
            : valueMgr.read([]);
        var itemCfg = {
            "type": "scopeItem",
            "isVirtual": true,
            "path": path,
            "content": scopeMeta.content
        };
        if (scopeMeta.eid) {
            itemCfg.eid = scopeMeta.eid + '-item';
        }
        ;
        itemMeta = new scope_item_1.default(context, itemCfg, itemMeta);
        return itemMeta.render(context, data);
    });
    return parts;
}
;
var GScope = (function (_super) {
    __extends(GScope, _super);
    function GScope() {
        _super.apply(this, arguments);
        this.type = "scope";
    }
    GScope.parse = function (node, html) {
        if (node.tagName !== "scope") {
            return null;
        }
        ;
        var meta = {};
        meta.type = "scope";
        meta.isVirtual = true;
        meta.path = utils.parsePath(node);
        meta.content = tplMgr_1.readTpl(node, html, meta);
        meta.eid = node.attrs.id || null;
        return meta;
    };
    ;
    GScope.prototype.render = function (context, data) {
        var meta = this;
        meta.items = [];
        var scopeData = valueMgr.getValue(meta, data, this.resolvedPath);
        this.scopePath = this.resolvedPath.path;
        var anchorCode = anchorMgr.genCode(context, meta);
        var parts = renderScopeContent(context, meta, scopeData, data, 0);
        return parts.join('\n') + anchorCode;
    };
    ;
    GScope.prototype.update = function (context, meta, scopePath, value, oldValue) {
        value = value || [];
        oldValue = oldValue || [];
        for (var i = value.length; i < oldValue.length; i++) {
            context.gapStorage.removeScope(scopePath.concat([i]));
        }
        ;
        if (value.length > oldValue.length) {
            var dataSlice = value.slice(oldValue.length);
            var newContent = renderScopeContent(context, meta, dataSlice, context.data, oldValue.length).join('\n');
            var anchor = anchorMgr.find(context, meta);
            anchorMgr.insertHTML(anchor, 'before', newContent);
        }
        ;
    };
    ;
    return GScope;
}(gapClassMgr_1.Gap));
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = GScope;
;
},{"../anchorMgr":8,"../client/gapClassMgr":11,"../tplMgr":28,"../utils":30,"../valueMgr":33,"./scope-item":25}],27:[function(require,module,exports){
"use strict";
;
;
var StrTpl = (function () {
    function StrTpl(tpl, valueParseFn) {
        if (typeof tpl === "object") {
            this.src = tpl.src;
            this.gaps = tpl.gaps;
            this.parts = tpl.parts;
            return;
        }
        ;
        this.src = tpl;
        this.parts = [];
        this.gaps = [];
        return this.parse(tpl, valueParseFn);
    }
    ;
    StrTpl.prototype.parse = function (tpl, valueParseFn) {
        var gapStrArr = tpl.match(gapRe);
        if (!gapStrArr) {
            this.isString = true;
            this.parts = [tpl];
            return;
        }
        ;
        this.gaps = gapStrArr.map(function (part) {
            var partValue = part.slice(2, -1);
            var partRes = valueParseFn(partValue);
            partRes.escaped = part[0] !== "!";
            return partRes;
        });
        this.parts = tpl.split(gapRe);
        return this;
    };
    ;
    StrTpl.prototype.render = function (valueRenderFn) {
        var gaps = this.gaps.map(valueRenderFn);
        var parts = mixArrays(this.parts, gaps);
        return parts.join('');
    };
    ;
    return StrTpl;
}());
exports.StrTpl = StrTpl;
;
function read(tpl, valueParseFn) {
    var res = new StrTpl(tpl, valueParseFn);
    if (res.isString) {
        return tpl;
    }
    ;
    return res;
}
exports.read = read;
;
var gapRe = /[\$\#\!]{1}\{[^\}]*\}/gm;
function mixArrays() {
    var arrs = [];
    for (var _i = 0; _i < arguments.length; _i++) {
        arrs[_i - 0] = arguments[_i];
    }
    var maxLength = 0;
    var totalLength = 0;
    for (var i = 0; i < arrs.length; i++) {
        maxLength = Math.max(arrs[i].length, maxLength);
        totalLength += arrs[i].length;
    }
    ;
    var resArr = [];
    var arrayCount = arguments.length;
    for (var id = 0; id < maxLength; id++) {
        for (var j = 0; j < arrayCount; j++) {
            if (arguments[j].length > id) {
                resArr.push(arguments[j][id]);
            }
            ;
        }
        ;
    }
    ;
    return resArr;
}
;
},{}],28:[function(require,module,exports){
"use strict";
var gapClassMgr = require('./gapServer');
var tplRender_1 = require('./tplRender');
exports.renderTpl = tplRender_1.default.bind(null, gapClassMgr);
var mj = require('micro-jade');
;
function parseGap(node, html, parentMeta) {
    var tagMeta = gapClassMgr.parse(node, html, parentMeta);
    return tagMeta;
}
;
function readTpl(ast, code, parentMeta) {
    function iterate(children) {
        var parts = [];
        children.forEach(function (node, id) {
            var tagMeta = parseGap(node, code, parentMeta);
            if (tagMeta) {
                parts.push(tagMeta);
                return;
            }
            ;
            if (!node.children || node.children.length == 0) {
                parts.push(mj.render(node, {}));
                return;
            }
            ;
            var wrap = mj.renderWrapper(node);
            parts.push(wrap[0]);
            parts = parts.concat(iterate(node.children));
            if (wrap[1]) {
                parts.push(wrap[1]);
            }
        });
        return parts;
    }
    ;
    return iterate(ast.children);
}
exports.readTpl = readTpl;
;
},{"./gapServer":17,"./tplRender":29,"micro-jade":2}],29:[function(require,module,exports){
"use strict";
var utils = require('./utils');
;
/**
 * Renders template.
 * @param {Object[]} tpl - array of path's parts.
 * @param {Object} parent - parent for a template.
 * @param {Object} data - data object to render.
 * @param {Object} meta - meta modifier.
 * @returns {string} result code.
 */
function renderTpl(tpl, parent, data, metaMod) {
    var self = this;
    var parts = tpl.map(function (part, partId) {
        if (typeof part === "string") {
            return part;
        }
        ;
        var partMeta = utils.simpleClone(part);
        if (metaMod) {
            if (typeof metaMod === "function") {
                partMeta = metaMod(partMeta, partId);
            }
            else {
                partMeta = utils.extend(partMeta, metaMod || {});
            }
            ;
        }
        ;
        return self.renderGap(self.context, parent, data, partMeta);
    });
    var code = parts.join('');
    return code;
}
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = renderTpl;
;
},{"./utils":30}],30:[function(require,module,exports){
"use strict";
function __export(m) {
    for (var p in m) if (!exports.hasOwnProperty(p)) exports[p] = m[p];
}
var valueMgr = require('./valueMgr');
__export(require('./utils/tplUtils'));
function objFor(obj, fn) {
    for (var i in obj) {
        fn(obj[i], i, obj);
    }
    ;
}
exports.objFor = objFor;
;
function objMap(obj, fn) {
    var newObj = {};
    objFor(obj, function (item, id) {
        var newItem = fn(item, id, obj);
        newObj[id] = newItem;
    });
    return newObj;
}
exports.objMap = objMap;
;
function objPath(path, obj, newVal) {
    if (path.length < 1) {
        if (arguments.length > 2) {
            throw 'root rewritting is not supported';
        }
        ;
        return obj;
    }
    ;
    var propName = path[0];
    if (path.length === 1) {
        if (arguments.length > 2) {
            obj[propName] = newVal;
        }
        ;
        return obj[propName];
    }
    ;
    var subObj = obj[propName];
    if (subObj === undefined) {
        //throw new Error("Cannot read " + propName + " of undefined");
        return undefined; // throw?
    }
    ;
    if (arguments.length > 2) {
        return objPath(path.slice(1), subObj, newVal);
    }
    ;
    return objPath(path.slice(1), subObj);
}
exports.objPath = objPath;
;
function simpleClone(obj) {
    var res = {};
    for (var i in obj) {
        res[i] = obj[i];
    }
    ;
    return res;
}
exports.simpleClone = simpleClone;
;
function keyValueToObj(arr, keyName, valueName) {
    keyName = keyName || 'key';
    valueName = valueName || 'value';
    var res = {};
    arr.forEach(function (i) {
        res[i[keyName]] = i[valueName];
    });
    return res;
}
exports.keyValueToObj = keyValueToObj;
;
function objToKeyValue(obj, keyName, valueName) {
    keyName = keyName || 'key';
    valueName = valueName || 'value';
    var res = [];
    for (var i in obj) {
        var item = {};
        item[keyName] = i;
        item[valueName] = obj[i];
        res.push(item);
    }
    ;
    return res;
}
exports.objToKeyValue = objToKeyValue;
;
function concatObj(obj1, obj2) {
    var res = simpleClone(obj1);
    for (var i in obj2) {
        res[i] = obj2[i];
    }
    ;
    return res;
}
exports.concatObj = concatObj;
;
function extend(dest, src) {
    for (var i in src) {
        dest[i] = src[i];
    }
    ;
    return dest;
}
exports.extend = extend;
;
function parsePath(parsedNode) {
    if (parsedNode.attrs.class) {
        var parts = parsedNode.attrs.class.value.split(' ');
        var parsed = valueMgr.read(parts);
        return parsed;
    }
    ;
    return valueMgr.read([]);
}
exports.parsePath = parsePath;
;
function deepClone(obj) {
    if (typeof obj === "object") {
        var map = Array.isArray(obj)
            ? obj.map.bind(obj)
            : objMap.bind(null, obj);
        return map(deepClone);
    }
    ;
    return obj;
}
exports.deepClone = deepClone;
;
function escapeHtml(code) {
    return code
        .replace(/"/g, '&quot;')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');
}
exports.escapeHtml = escapeHtml;
;
},{"./utils/tplUtils":31,"./valueMgr":33}],31:[function(require,module,exports){
"use strict";
var utils = require('../utils');
var selfClosingTags = ["area", "base", "br", "col",
    "command", "embed", "hr", "img",
    "input", "keygen", "link",
    "meta", "param", "source", "track",
    "wbr"];
;
;
function renderTag(tagInfo) {
    var attrs = tagInfo.attrs;
    if (!Array.isArray(attrs)) {
        attrs = utils.objToKeyValue(attrs, 'name', 'value');
    }
    ;
    var attrCode = "";
    if (attrs.length > 0) {
        attrCode = " " + attrs.map(function (attr) {
            return attr.name + '="' + attr.value + '"';
        }).join(' ');
    }
    ;
    var tagHead = tagInfo.name + attrCode;
    if (~selfClosingTags.indexOf(tagInfo.name)) {
        return "<" + tagHead + " />";
    }
    ;
    var openTag = "<" + tagHead + ">";
    var closeTag = "</" + tagInfo.name + ">";
    var code = openTag + (tagInfo.innerHTML || "") + closeTag;
    return code;
}
exports.renderTag = renderTag;
;
},{"../utils":30}],32:[function(require,module,exports){
"use strict";
function TreeNode(kind, parent, data) {
    this.children = kind == 'array'
        ? []
        : {};
    this.parent = parent;
    this.data = data;
    this.childCount = 0;
}
;
TreeNode.prototype.addChild = function (name, data) {
    if (this.kind == 'array') {
        data = name;
        name = this.children.length;
    }
    ;
    data = data || this.root.initTreeNode();
    var child = new TreeNode(this.kind, this, data);
    child.id = name;
    child.path = this.path.concat([name]);
    child.root = this.root;
    this.childCount++;
    this.children[name] = child;
    return child;
};
TreeNode.prototype.getParents = function () {
    var res = [];
    var node = this;
    while (true) {
        node = node.parent;
        if (!node) {
            return res;
        }
        ;
        res.push(node);
    }
    ;
};
TreeNode.prototype.childIterate = function (fn) {
    for (var i in this.children) {
        fn.call(this, this.children[i], i);
    }
    ;
};
TreeNode.prototype.getChildArr = function () {
    if (this.kind == 'array') {
        return this.children;
    }
    ;
    var res = [];
    this.childIterate(function (child) {
        res.push(child);
    });
    return res;
};
TreeNode.prototype.getDeepChildArr = function () {
    var res = this.getChildArr();
    this.childIterate(function (child) {
        res = res.concat(child.getDeepChildArr());
    });
    return res;
};
TreeNode.prototype.remove = function (path) {
    var leafKey = path[path.length - 1];
    var branchPath = path.slice(0, -1);
    var branch = this.byPath(branchPath);
    branch.childCount--;
    var res = branch.children[leafKey];
    delete branch.children[leafKey];
    return res;
};
TreeNode.prototype.byPath = function (path) {
    if (path.length == 0) {
        return this;
    }
    ;
    var node = this;
    while (true) {
        var key = path[0];
        node = node.children[key];
        if (!node) {
            return null;
        }
        ;
        path = path.slice(1);
        if (path.length == 0) {
            return node;
        }
        ;
    }
    ;
};
TreeNode.prototype.access = function (path) {
    if (path.length == 0) {
        return this;
    }
    ;
    var node = this;
    while (true) {
        var key = path[0];
        var parent = node;
        node = node.children[key];
        if (!node) {
            var data = this.root.initTreeNode();
            node = parent.addChild(key, data);
            parent.children[key] = node;
        }
        ;
        path = path.slice(1);
        if (path.length == 0) {
            return node;
        }
        ;
    }
    ;
};
function TreeHelper(opts, rootData) {
    opts = opts || {};
    opts.kind = opts.kind || 'array';
    var initTreeNode = opts.initTreeNode || function () {
        return {};
    };
    var data = rootData || initTreeNode();
    var rootTreeNode = new TreeNode(opts.kind, null, data);
    rootTreeNode.isRoot = true;
    rootTreeNode.root = rootTreeNode;
    rootTreeNode.path = [];
    rootTreeNode.initTreeNode = initTreeNode;
    return rootTreeNode;
}
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = TreeHelper;
;
},{}],33:[function(require,module,exports){
"use strict";
var utils = require('./utils');
;
/**
 * Reads path and returns parsed path.
 * @param {string[]} parts - array of path's parts.
 * @param {Object} extraInfo - data object to be added to result.
 * @returns {Object} path object.
 */
function read(parts, extraInfo) {
    var source = "data";
    var path = parts.map(function (part) {
        // if (part[0] === '$'){
        // 	return {
        // 		op: part.slice(1)
        // 	};
        // };
        return part;
    });
    var res = {
        "source": source,
        "path": path,
        "escaped": true
    };
    if (extraInfo) {
        utils.extend(res, extraInfo);
    }
    ;
    return res;
}
exports.read = read;
;
/**
 * Parses dot path and returns parsed path.
 * @param {string} str - text of the path separated by dots.
 * @param {Object} extraInfo - data object to be added to result.
 * @returns {Object} path object.
 */
function parse(str, extraInfo) {
    var parts = str.trim().split('.');
    return read(parts, extraInfo);
}
exports.parse = parse;
;
/**
 * Finds the nearest scope and return its path.
 * @param {Object} meta - gap meta connected to the path.
 * @returns {Object} scope path object.
 */
function findScopePath(meta) {
    var parent = meta.parent;
    while (true) {
        if (!parent) {
            return [];
        }
        ;
        if (parent.scopePath) {
            return parent.scopePath;
        }
        ;
        parent = parent.parent;
    }
    ;
}
;
/**
 * Resolves the path removing all operators from path (e.g. $up).
 * @param {Object} meta - gap meta connected to the path.
 * @param {Object} path - value path object.
 * @returns {Object} resolved path object.
 */
function resolvePath(meta, path) {
    var scopePath = findScopePath(meta);
    var res = {
        path: null,
        source: "data",
        escaped: path.escaped
    };
    res.path = scopePath.slice();
    path.path.forEach(function (key) {
        if (typeof key[0] !== "$") {
            res.path.push(key);
            return;
        }
        ;
        if (key === "$root") {
            res.path = [];
        }
        else if (key === "$up") {
            res.path.pop();
        }
        ;
    });
    return res;
}
exports.resolvePath = resolvePath;
;
/**
 * Returns the value by given path.
 * @param {Object} meta - gap meta connected to the path.
 * @param {Object} data - data object rendering in fg.
 * @param {Object} valuePath - value path to be fetched.
 * @returns {any} fetched data.
 */
function getValue(meta, data, valuePath) {
    var sourceTable = {
        "data": data,
        "meta": meta
    };
    var sourceData = sourceTable[valuePath.source];
    var res = utils.objPath(valuePath.path, sourceData);
    return res;
}
exports.getValue = getValue;
;
/**
 * Returns the queried value as string.
 * @param {Object} meta - gap meta connected to the path.
 * @param {Object} data - data object rendering in fg.
 * @param {Object} resolvedPath - resolved path.
 * @returns {string} rendered string.
 */
function render(meta, data, resolvedPath) {
    var text = getValue(meta, data, resolvedPath).toString();
    if (resolvedPath.escaped) {
        text = utils.escapeHtml(text);
    }
    ;
    return text;
}
exports.render = render;
;
/**
 * Resolve path and returns the queried value as string.
 * @param {Object} meta - gap meta connected to the path.
 * @param {Object} data - data object rendering in fg.
 * @param {Object} path - unresolved path.
 * @returns {string} rendered string.
 */
function resolveAndRender(meta, data, path) {
    var resolvedPath = resolvePath(meta, path);
    return render(meta, data, resolvedPath);
}
exports.resolveAndRender = resolveAndRender;
;
},{"./utils":30}]},{},[15])
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJub2RlX21vZHVsZXMvbWljcm8tamFkZS9SZVRwbC5qcyIsIm5vZGVfbW9kdWxlcy9taWNyby1qYWRlL2luZGV4LmpzIiwibm9kZV9tb2R1bGVzL21pY3JvLWphZGUvcGFyc2VUYWJUcmVlLmpzIiwibm9kZV9tb2R1bGVzL21pY3JvLWphZGUvcGFyc2VyLmpzIiwibm9kZV9tb2R1bGVzL21pY3JvLWphZGUvcmVuZGVyLmpzIiwibm9kZV9tb2R1bGVzL21pY3JvLWphZGUvc3RyVHBsLmpzIiwibm9kZV9tb2R1bGVzL21pY3JvLWphZGUvdXRpbHMuanMiLCJzcmMvYW5jaG9yTWdyLnRzIiwic3JjL2NsaWVudC9mZ0NsYXNzLnRzIiwic3JjL2NsaWVudC9mZ0luc3RhbmNlLnRzIiwic3JjL2NsaWVudC9nYXBDbGFzc01nci50cyIsInNyY1xcY2xpZW50XFxzcmNcXGNsaWVudFxcR2FwU3RvcmFnZS50cyIsInNyYy9jbGllbnQvZ2xvYmFsRXZlbnRzLnRzIiwic3JjL2NsaWVudC9oZWxwZXIudHMiLCJzcmMvY2xpZW50L21haW4udHMiLCJzcmMvZXZlbnRFbWl0dGVyLnRzIiwic3JjL2dhcFNlcnZlci50cyIsInNyYy9nYXBzLnRzIiwic3JjL2dhcHMvY29udGVudC50cyIsInNyYy9nYXBzL2RhdGEudHMiLCJzcmMvZ2Fwcy9keW5hbWljLXRleHQudHMiLCJzcmMvZ2Fwcy9mZy50cyIsInNyYy9nYXBzL3Jhdy50cyIsInNyYy9nYXBzL3Jvb3QudHMiLCJzcmMvZ2Fwcy9zY29wZS1pdGVtLnRzIiwic3JjL2dhcHMvc2NvcGUudHMiLCJzcmNcXHNyY1xcU3RyVHBsLnRzIiwic3JjL3RwbE1nci50cyIsInNyYy90cGxSZW5kZXIudHMiLCJzcmMvdXRpbHMudHMiLCJzcmMvdXRpbHMvdHBsVXRpbHMudHMiLCJzcmNcXHV0aWxzXFxzcmNcXHV0aWxzXFxUcmVlSGVscGVyLmpzIiwic3JjL3ZhbHVlTWdyLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0FDQUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQy9DQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDWEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN2REE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ25SQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3RIQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN6REE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM5Q0EsWUFBWSxDQUFDO0FBTWI7Ozs7O0dBS0c7QUFDSCxlQUFlLE9BQW1CLEVBQUUsR0FBUTtJQUN4QyxJQUFNLEVBQUUsR0FBRyxDQUFDLElBQUksRUFBRSxPQUFPLENBQUMsRUFBRSxFQUFFLEtBQUssRUFBRSxHQUFHLENBQUMsR0FBRyxDQUFDLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxDQUFDO0lBQ3hELE1BQU0sQ0FBQyxFQUFFLENBQUM7QUFDZCxDQUFDO0FBQUEsQ0FBQztBQUVGOzs7OztHQUtHO0FBQ0gsaUJBQXdCLE9BQW1CLEVBQUUsR0FBUTtJQUNqRCxJQUFNLElBQUksR0FBRyxrQ0FBa0M7VUFDekMsS0FBSyxDQUFDLE9BQU8sRUFBRSxHQUFHLENBQUM7VUFDbkIsYUFBYSxDQUFDO0lBQ3BCLE1BQU0sQ0FBQyxJQUFJLENBQUM7QUFDaEIsQ0FBQztBQUxlLGVBQU8sVUFLdEIsQ0FBQTtBQUFBLENBQUM7QUFFRjs7Ozs7R0FLRztBQUNILGNBQXFCLE9BQW1CLEVBQUUsR0FBUTtJQUM5QyxJQUFNLEVBQUUsR0FBRyxLQUFLLENBQUMsT0FBTyxFQUFFLEdBQUcsQ0FBQyxDQUFDO0lBQy9CLE1BQU0sQ0FBQyxRQUFRLENBQUMsY0FBYyxDQUFDLEVBQUUsQ0FBQyxDQUFDO0FBQ3ZDLENBQUM7QUFIZSxZQUFJLE9BR25CLENBQUE7QUFBQSxDQUFDO0FBRUY7Ozs7O0dBS0c7QUFFSCxvQkFBMkIsTUFBYyxFQUFFLFFBQWdCLEVBQUUsSUFBWTtJQUNyRSxJQUFJLEdBQVcsQ0FBQztJQUNoQixNQUFNLENBQUMsQ0FBQyxRQUFRLENBQUMsQ0FBQSxDQUFDO1FBQ2QsS0FBSyxRQUFRO1lBQUUsR0FBRyxHQUFHLGFBQWEsQ0FBQztZQUFDLEtBQUssQ0FBQztRQUMxQyxLQUFLLE9BQU87WUFBRSxHQUFHLEdBQUcsVUFBVSxDQUFDO1lBQUMsS0FBSyxDQUFDO0lBQzFDLENBQUM7SUFBQSxDQUFDO0lBQ0YsTUFBTSxDQUFDLGtCQUFrQixDQUFDLEdBQUcsRUFBRSxJQUFJLENBQUMsQ0FBQztBQUN6QyxDQUFDO0FBUGUsa0JBQVUsYUFPekIsQ0FBQTtBQUFBLENBQUM7O0FDdkRGLFlBQVksQ0FBQztBQUViLDZCQUF5QixpQkFBaUIsQ0FBQyxDQUFBO0FBQzNDLElBQVksWUFBWSxXQUFNLGdCQUFnQixDQUFDLENBQUE7QUFDL0MsSUFBWSxnQkFBZ0IsV0FBTSxjQUFjLENBQUMsQ0FBQTtBQUtwQyxvQkFBWSxHQUFjLEVBQUUsQ0FBQztBQUM3QixtQkFBVyxHQUFRLEVBQUUsQ0FBQztBQU1sQyxDQUFDO0FBRUY7SUFRQyxpQkFBWSxJQUFrQjtRQUM3QixJQUFJLENBQUMsRUFBRSxHQUFHLG9CQUFZLENBQUMsTUFBTSxDQUFDO1FBQzlCLElBQUksQ0FBQyxTQUFTLEdBQUcsRUFBRSxDQUFDO1FBQ3BCLElBQUksQ0FBQyxHQUFHLEdBQUcsSUFBSSxDQUFDLEdBQUcsQ0FBQztRQUNwQixJQUFJLENBQUMsSUFBSSxHQUFHLElBQUksQ0FBQyxJQUFJLENBQUM7UUFDdEIsSUFBSSxDQUFDLFlBQVksR0FBRyxJQUFJLHNCQUFZLEVBQUUsQ0FBQztRQUN2QyxtQkFBVyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsR0FBRyxJQUFJLENBQUM7UUFDOUIsb0JBQVksQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUM7UUFDeEI7WUFDQyxnQkFBZ0IsQ0FBQyxjQUFjLENBQUMsS0FBSyxDQUFDLElBQUksRUFBRSxTQUFTLENBQUMsQ0FBQztRQUN4RCxDQUFDO1FBQUEsQ0FBQztRQUNGLElBQUksQ0FBQyxRQUFRLEdBQUcsVUFBVSxDQUFDO1FBQzNCLElBQUksQ0FBQyxRQUFRLENBQUMsV0FBVyxHQUFHLGdCQUFnQixDQUFDLGNBQWMsQ0FBQztRQUM1RCxJQUFJLENBQUMsUUFBUSxDQUFDLFNBQVMsR0FBRyxNQUFNLENBQUMsTUFBTSxDQUFDLGdCQUFnQixDQUFDLGNBQWMsQ0FBQyxTQUFTLENBQUMsQ0FBQztRQUNuRixJQUFNLE9BQU8sR0FBRyxJQUFJLENBQUMsT0FBTyxDQUFDO1FBQzdCLEVBQUUsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxDQUFBLENBQUM7WUFDWixPQUFPLENBQUMsSUFBSSxFQUFFLElBQUksQ0FBQyxRQUFRLENBQUMsU0FBUyxDQUFDLENBQUM7UUFDeEMsQ0FBQztRQUFBLENBQUM7SUFDSCxDQUFDOztJQUVELG9CQUFFLEdBQUYsVUFBRyxJQUFZLEVBQUUsUUFBZ0IsRUFBRSxFQUFhO1FBQy9DLEVBQUUsQ0FBQyxDQUFDLFNBQVMsQ0FBQyxNQUFNLEtBQUssQ0FBQyxDQUFDLENBQUEsQ0FBQztZQUMzQixJQUFJLEdBQUcsSUFBSSxDQUFDO1lBQ1osRUFBRSxHQUFHLFNBQVMsQ0FBQyxDQUFDLENBQUMsQ0FBQztZQUNsQixRQUFRLEdBQUcsSUFBSSxDQUFDO1FBQ2pCLENBQUM7UUFBQSxJQUFJLENBQUEsQ0FBQztZQUNMLElBQUksVUFBVSxHQUFHLEVBQUUsQ0FBQztZQUNwQixFQUFFLEdBQUcsVUFBUyxLQUFVO2dCQUN2QixFQUFFLENBQUMsQ0FBQyxLQUFLLENBQUMsSUFBSSxFQUFFLEtBQUssQ0FBQyxNQUFNLEVBQUUsUUFBUSxDQUFDLENBQUMsQ0FBQSxDQUFDO29CQUN4QyxVQUFVLENBQUMsSUFBSSxDQUFDLElBQUksRUFBRSxLQUFLLENBQUMsQ0FBQztnQkFDOUIsQ0FBQztnQkFBQSxDQUFDO1lBQ0gsQ0FBQyxDQUFDO1FBQ0gsQ0FBQztRQUFBLENBQUM7UUFDRixZQUFZLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxDQUFDO1FBQzFCLElBQUksQ0FBQyxZQUFZLENBQUMsRUFBRSxDQUFDLElBQUksRUFBRSxFQUFFLENBQUMsQ0FBQztJQUNoQyxDQUFDOztJQUVELHNCQUFJLEdBQUo7UUFDQyxJQUFJLENBQUMsWUFBWSxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsSUFBSSxDQUFDLFlBQVksRUFBRSxTQUFTLENBQUMsQ0FBQztJQUM1RCxDQUFDOztJQUVELDJCQUFTLEdBQVQsVUFBVSxJQUFZLEVBQUUsT0FBWSxFQUFFLElBQVc7UUFDaEQsSUFBSSxDQUFDLFlBQVksQ0FBQyxTQUFTLENBQUMsSUFBSSxFQUFFLE9BQU8sRUFBRSxJQUFJLENBQUMsQ0FBQztJQUNsRCxDQUFDOztJQUVELDBCQUFRLEdBQVIsVUFBUyxJQUFTO1FBQ2pCLE1BQU0sQ0FBQyxJQUFJLENBQUM7SUFDYixDQUFDOztJQUVELHdCQUFNLEdBQU4sVUFBTyxJQUFTLEVBQUUsSUFBVSxFQUFFLE1BQW1CO1FBQ2hELEVBQUUsQ0FBQyxDQUFDLElBQUksWUFBWSxXQUFXLENBQUMsQ0FBQSxDQUFDO1lBQ2hDLE1BQU0sQ0FBQyxJQUFJLENBQUMsUUFBUSxDQUFDLEtBQUssQ0FBQyxJQUFJLEVBQUUsU0FBUyxDQUFDLENBQUM7UUFDN0MsQ0FBQztRQUFBLENBQUM7UUFDRixJQUFJLEVBQUUsR0FBRyxJQUFJLGdCQUFnQixDQUFDLFVBQVUsQ0FBQyxJQUFJLEVBQUUsTUFBTSxDQUFDLENBQUM7UUFDdkQsRUFBRSxDQUFDLElBQUksR0FBRyxFQUFFLENBQUMsT0FBTyxDQUFDLElBQUksRUFBRSxJQUFJLENBQUMsQ0FBQztRQUNqQyxNQUFNLENBQUMsRUFBRSxDQUFDO0lBQ1gsQ0FBQzs7SUFFRCwwQkFBUSxHQUFSLFVBQVMsVUFBdUIsRUFBRSxJQUFTLEVBQUUsSUFBVSxFQUFFLE1BQW1CO1FBQzNFLElBQU0sRUFBRSxHQUFHLElBQUksQ0FBQyxNQUFNLENBQUMsSUFBSSxFQUFFLElBQUksRUFBRSxNQUFNLENBQUMsQ0FBQztRQUMzQyxVQUFVLENBQUMsU0FBUyxHQUFHLEVBQUUsQ0FBQyxJQUFJLENBQUM7UUFDL0IsRUFBRSxDQUFDLE1BQU0sRUFBRSxDQUFDO1FBQ1osTUFBTSxDQUFDLEVBQUUsQ0FBQztJQUNYLENBQUM7O0lBRUQsMEJBQVEsR0FBUixVQUFTLFVBQXVCLEVBQUUsSUFBUztRQUMxQyxJQUFJLEVBQUUsR0FBRyxJQUFJLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxDQUFDO1FBQzNCLElBQUksR0FBRyxHQUFHLFFBQVEsQ0FBQyxhQUFhLENBQUMsS0FBSyxDQUFDLENBQUM7UUFDeEMsR0FBRyxDQUFDLFNBQVMsR0FBRyxFQUFFLENBQUMsSUFBSSxDQUFDO1FBQ3hCLEVBQUUsQ0FBQyxLQUFLLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxRQUFRLENBQUMsQ0FBQyxPQUFPLENBQUMsVUFBUyxLQUFrQjtZQUM5RCxVQUFVLENBQUMsV0FBVyxDQUFDLEtBQUssQ0FBQyxDQUFDO1FBQy9CLENBQUMsQ0FBQyxDQUFDO1FBQ0gsRUFBRSxDQUFDLE1BQU0sRUFBRSxDQUFDO0lBQ2IsQ0FBQzs7SUFFRixjQUFDO0FBQUQsQ0FuRkEsQUFtRkMsSUFBQTtBQW5GWSxlQUFPLFVBbUZuQixDQUFBO0FBQUEsQ0FBQztBQUVGLGVBQWUsRUFBYyxFQUFFLElBQWlCLEVBQUUsUUFBZ0I7SUFDakUsSUFBSSxPQUFPLEdBQUcsRUFBRSxDQUFDLE1BQU0sRUFBRSxDQUFDO0lBQzFCLE9BQU8sSUFBSSxFQUFDLENBQUM7UUFDWixFQUFFLENBQUMsQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDLFFBQVEsQ0FBQyxDQUFDLENBQUEsQ0FBQztZQUMzQixNQUFNLENBQUMsSUFBSSxDQUFDO1FBQ2IsQ0FBQztRQUFBLENBQUM7UUFDRixFQUFFLENBQUMsQ0FBQyxPQUFPLENBQUMsT0FBTyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFBLENBQUM7WUFDL0IsTUFBTSxDQUFDLEtBQUssQ0FBQztRQUNkLENBQUM7UUFBQSxDQUFDO1FBQ0YsSUFBSSxHQUFHLElBQUksQ0FBQyxhQUFhLENBQUM7SUFDM0IsQ0FBQztJQUFBLENBQUM7SUFDRixNQUFNLENBQUMsS0FBSyxDQUFDO0FBQ2QsQ0FBQztBQUFBLENBQUM7O0FDbkhGLFlBQVksQ0FBQzs7Ozs7O0FBRWIsMEJBQXNCLGNBQWMsQ0FBQyxDQUFBO0FBQ3JDLElBQVksV0FBVyxXQUFNLGVBQWUsQ0FBQyxDQUFBO0FBQzdDLDZCQUF5QixpQkFBaUIsQ0FBQyxDQUFBO0FBSTNDLElBQVksS0FBSyxXQUFNLFVBQVUsQ0FBQyxDQUFBO0FBQ2xDLDJCQUF1QixjQUFjLENBQUMsQ0FBQTtBQUN0QyxJQUFZLFlBQVksV0FBTSxnQkFBZ0IsQ0FBQyxDQUFBO0FBQy9DLHFCQUFrQixjQUFjLENBQUMsQ0FBQTtBQUNqQyxJQUFNLE1BQU0sR0FBRyxPQUFPLENBQUMsVUFBVSxDQUFDLENBQUM7QUFFdEIsdUJBQWUsR0FBaUIsRUFBRSxDQUFDO0FBRWhEO0lBY0Msd0JBQVksT0FBZ0IsRUFBRSxNQUFrQjtRQUMvQyxJQUFJLENBQUMsRUFBRSxHQUFHLHVCQUFlLENBQUMsTUFBTSxDQUFDO1FBQ2pDLE9BQU8sQ0FBQyxTQUFTLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDO1FBQzdCLElBQUksQ0FBQyxJQUFJLEdBQUcsT0FBTyxDQUFDLElBQUksQ0FBQztRQUN6QixJQUFJLENBQUMsT0FBTyxHQUFHLE9BQU8sQ0FBQztRQUN2QixJQUFJLENBQUMsSUFBSSxHQUFHLElBQUksQ0FBQztRQUNqQixJQUFJLENBQUMsTUFBTSxHQUFHLE1BQU0sSUFBSSxJQUFJLENBQUM7UUFDN0IsSUFBSSxDQUFDLFlBQVksR0FBRyxJQUFJLHNCQUFZLENBQUMsT0FBTyxDQUFDLFlBQVksQ0FBQyxDQUFDO1FBQzNELElBQUksQ0FBQyxVQUFVLEdBQUcsSUFBSSxvQkFBVSxDQUFDLElBQUksQ0FBQyxDQUFDO1FBQ3ZDLElBQUksQ0FBQyxRQUFRLEdBQUcsRUFBRSxDQUFDO1FBQ25CLHVCQUFlLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDO0lBQzVCLENBQUM7O0lBRUQsMkJBQUUsR0FBRixVQUFHLEtBQWEsRUFBRSxFQUFZO1FBQzdCLFlBQVksQ0FBQyxNQUFNLENBQUMsS0FBSyxDQUFDLENBQUM7UUFDM0IsSUFBSSxDQUFDLFlBQVksQ0FBQyxFQUFFLENBQUMsS0FBSyxFQUFFLEVBQUUsQ0FBQyxDQUFDO0lBQ2pDLENBQUM7O0lBRUQsNkJBQUksR0FBSjtRQUFLLGNBQWM7YUFBZCxXQUFjLENBQWQsc0JBQWMsQ0FBZCxJQUFjO1lBQWQsNkJBQWM7O1FBQ2xCLElBQUksQ0FBQyxZQUFZLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxJQUFJLENBQUMsWUFBWSxFQUFFLFNBQVMsQ0FBQyxDQUFDO0lBQzVELENBQUM7O0lBRUQsa0NBQVMsR0FBVDtRQUFVLGNBQWM7YUFBZCxXQUFjLENBQWQsc0JBQWMsQ0FBZCxJQUFjO1lBQWQsNkJBQWM7O1FBQ3ZCLElBQUksQ0FBQyxZQUFZLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxJQUFJLENBQUMsWUFBWSxFQUFFLFNBQVMsQ0FBQyxDQUFDO0lBQzVELENBQUM7O0lBRUQsaUNBQVEsR0FBUjtRQUNDLE1BQU0sQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDO0lBQ2xCLENBQUM7O0lBRUQsK0JBQU0sR0FBTjtRQUNDLHFDQUFxQztRQUNyQywyREFBMkQ7UUFDM0QsNEJBQTRCO1FBQzVCLG1CQUFtQjtJQUNwQixDQUFDOztJQUVELGtDQUFTLEdBQVQsVUFBVSxHQUFRLEVBQUUsTUFBVyxFQUFFLElBQVMsRUFBRSxJQUFVO1FBQ3JELE1BQU0sQ0FBQyxtQkFBUyxDQUFDLElBQUksQ0FBQztZQUNyQixXQUFXLEVBQUUsV0FBVyxDQUFDLE1BQU07WUFDL0IsU0FBUyxFQUFFLElBQUk7U0FDZixFQUFFLEdBQUcsRUFBRSxNQUFNLEVBQUUsSUFBSSxFQUFFLElBQUksQ0FBQyxDQUFDO0lBQzdCLENBQUM7O0lBRUQsZ0NBQU8sR0FBUCxVQUFRLElBQVMsRUFBRSxJQUFVO1FBQzVCLElBQUksQ0FBQyxJQUFJLEdBQUcsSUFBSSxDQUFDO1FBQ2pCLElBQUksQ0FBQyxPQUFPLEdBQUcsSUFBSSxDQUFDO1FBQ3BCLElBQUksT0FBTyxHQUFHLElBQUksY0FBSyxDQUFDLElBQUksRUFBRSxJQUFJLENBQUMsQ0FBQztRQUNwQyxPQUFPLENBQUMsSUFBSSxHQUFHLE1BQU0sQ0FBQztRQUN0QixPQUFPLENBQUMsU0FBUyxHQUFHLElBQUksQ0FBQztRQUN6QixPQUFPLENBQUMsRUFBRSxHQUFHLElBQUksQ0FBQztRQUNsQixJQUFJLENBQUMsSUFBSSxHQUFHLE9BQWMsQ0FBQztRQUMzQixJQUFNLFVBQVUsR0FBRyxJQUFJLENBQUMsT0FBTyxDQUFDLFFBQVEsQ0FBQyxJQUFJLENBQUMsQ0FBQztRQUMvQyxNQUFNLENBQUMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDLEdBQUcsRUFBRSxPQUFjLEVBQUUsVUFBVSxFQUFFLE9BQU8sQ0FBQyxJQUFJLENBQUMsSUFBSSxFQUFFLElBQUksQ0FBQyxDQUFDLENBQUM7SUFDL0YsQ0FBQzs7SUFFRCwrQkFBTSxHQUFOLFVBQU8sU0FBbUIsRUFBRSxRQUFhO1FBQ3hDLEVBQUUsQ0FBQyxDQUFDLFNBQVMsQ0FBQyxNQUFNLEtBQUssQ0FBQyxDQUFDLENBQUEsQ0FBQztZQUMzQixNQUFNLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxFQUFFLEVBQUUsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsT0FBTztRQUMzQyxDQUFDO1FBQUEsQ0FBQztRQUNGLEVBQUUsQ0FBQyxDQUFDLFNBQVMsQ0FBQyxNQUFNLEtBQUssQ0FBQyxDQUFDLENBQUEsQ0FBQztZQUMzQixNQUFNLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxFQUFFLEVBQUUsU0FBUyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7UUFDdEMsQ0FBQztRQUFBLENBQUM7UUFDRixJQUFNLEtBQUssR0FBUSxLQUFLLENBQUMsU0FBUyxDQUFDLFFBQVEsQ0FBQyxDQUFDO1FBQzdDLElBQU0sSUFBSSxHQUFHLElBQUksQ0FBQztRQUNsQixJQUFNLFFBQVEsR0FBUSxLQUFLLENBQUMsT0FBTyxDQUFDLFNBQVMsRUFBRSxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUM7UUFDMUQsRUFBRSxDQUFDLENBQUMsUUFBUSxLQUFLLEtBQUssQ0FBQyxDQUFBLENBQUM7WUFDdkIsTUFBTSxDQUFDLElBQUksQ0FBQztRQUNiLENBQUM7UUFBQSxDQUFDO1FBQ0YsSUFBSSxDQUFDLElBQUksQ0FBQyxRQUFRLEVBQUUsU0FBUyxFQUFFLFFBQVEsQ0FBQyxDQUFDO1FBQ3pDLEVBQUUsQ0FBQyxDQUFDLFNBQVMsQ0FBQyxNQUFNLEdBQUcsQ0FBQyxDQUFDLENBQUEsQ0FBQztZQUN6QixLQUFLLENBQUMsT0FBTyxDQUFDLFNBQVMsRUFBRSxJQUFJLENBQUMsSUFBSSxFQUFFLEtBQUssQ0FBQyxDQUFDO1FBQzVDLENBQUM7UUFBQSxJQUFJLENBQUEsQ0FBQztZQUNMLElBQUksQ0FBQyxJQUFJLEdBQUcsS0FBSyxDQUFDO1FBQ25CLENBQUM7UUFDRCxJQUFNLEtBQUssR0FBRyxJQUFJLENBQUMsVUFBVSxDQUFDLE9BQU8sQ0FBQyxTQUFTLENBQUMsQ0FBQztRQUNqRCxJQUFNLElBQUksR0FBRyxLQUFLLENBQUMsTUFBTSxDQUFDO1FBQzFCLElBQUksQ0FBQyxPQUFPLENBQUMsVUFBUyxHQUFRO1lBQzdCLEdBQUcsQ0FBQyxNQUFNLENBQUMsSUFBSSxFQUFFLEdBQUcsRUFBRSxTQUFTLEVBQUUsS0FBSyxFQUFFLFFBQVEsQ0FBQyxDQUFDO1FBQ25ELENBQUMsQ0FBQyxDQUFDO1FBQ0gsS0FBSyxDQUFDLE9BQU8sQ0FBQyxPQUFPLENBQUMsVUFBUyxVQUFlO1lBQzdDLFVBQVUsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxVQUFTLFNBQWM7Z0JBQ25ELEVBQUUsQ0FBQyxDQUFDLFNBQVMsQ0FBQyxJQUFJLEtBQUssSUFBSSxDQUFDLENBQUEsQ0FBQztvQkFDNUIsSUFBTSxPQUFPLEdBQUcsU0FBUyxDQUFDLEtBQUssQ0FBQyxTQUFTLENBQUMsU0FBUyxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsQ0FBQztvQkFDakUsaURBQWlEO29CQUNqRCxTQUFTLENBQUMsRUFBRSxDQUFDLE1BQU0sQ0FBQyxPQUFPLEVBQUUsUUFBUSxDQUFDLENBQUM7Z0JBQ3hDLENBQUM7Z0JBQUEsQ0FBQztZQUNILENBQUMsQ0FBQyxDQUFDO1FBQ0osQ0FBQyxDQUFDLENBQUM7UUFDSCxLQUFLLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxVQUFTLEdBQUc7WUFDOUIsSUFBTSxNQUFNLEdBQUcsS0FBSyxDQUFDLE9BQU8sQ0FBQyxHQUFHLENBQUMsSUFBSSxFQUFFLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQztZQUNsRCxJQUFNLE9BQU8sR0FBRyxHQUFHLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxTQUFTLENBQUMsTUFBTSxDQUFDLENBQUM7WUFDakQsSUFBTSxTQUFTLEdBQUcsS0FBSyxDQUFDLE9BQU8sQ0FBQyxPQUFPLEVBQUUsUUFBUSxDQUFDLENBQUM7WUFDbkQsRUFBRSxDQUFDLENBQUMsTUFBTSxLQUFLLFNBQVMsQ0FBQyxDQUFBLENBQUM7Z0JBQ3pCLE1BQU0sQ0FBQztZQUNSLENBQUM7WUFBQSxDQUFDO1lBQ0YsR0FBRyxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsVUFBUyxHQUFRO2dCQUNqQyxFQUFFLENBQUMsQ0FBQyxJQUFJLENBQUMsVUFBVSxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsR0FBRyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUEsQ0FBQztvQkFDMUMsTUFBTSxDQUFDO2dCQUNSLENBQUM7Z0JBQUEsQ0FBQztnQkFDRixXQUFXLENBQUMsTUFBTSxDQUFDLElBQUksRUFBRSxHQUFHLEVBQUUsR0FBRyxDQUFDLElBQUksRUFBRSxNQUFNLEVBQUUsU0FBUyxDQUFDLENBQUM7WUFDNUQsQ0FBQyxDQUFDLENBQUM7UUFDSixDQUFDLENBQUMsQ0FBQztRQUNILE1BQU0sQ0FBQyxJQUFJLENBQUM7SUFDYixDQUFDOztJQUVELGtDQUFTLEdBQVQ7UUFDQyxNQUFNLENBQUMsS0FBSyxDQUFDLFNBQVMsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUM7SUFDbkMsQ0FBQzs7SUFFRCw4QkFBSyxHQUFMO1FBQ0MsSUFBSSxDQUFDLFFBQVEsQ0FBQyxPQUFPLENBQUMsVUFBUyxLQUFLO1lBQ2xDLEtBQXdCLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxDQUFDO1FBQ3hDLENBQUMsQ0FBQyxDQUFDO1FBQ0gsSUFBSSxDQUFDLElBQUksR0FBRyxFQUFFLENBQUM7UUFDZixJQUFJLENBQUMsSUFBSSxHQUFHLElBQUksQ0FBQztRQUNqQixJQUFJLENBQUMsVUFBVSxHQUFHLElBQUksQ0FBQztRQUN2QixJQUFJLENBQUMsUUFBUSxHQUFHLEVBQUUsQ0FBQztJQUNwQixDQUFDOztJQUVELCtCQUFNLEdBQU4sVUFBTyxPQUFnQjtRQUN0QixFQUFFLENBQUMsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxDQUFBLENBQUM7WUFDYixJQUFJLEdBQUcsR0FBRyxJQUFJLENBQUMsTUFBTSxFQUFFLENBQUM7WUFDeEIsR0FBRyxDQUFDLE9BQU8sQ0FBQyxVQUFTLEdBQUc7Z0JBQ3ZCLEdBQUcsQ0FBQyxNQUFNLEVBQUUsQ0FBQztZQUNkLENBQUMsQ0FBQyxDQUFDO1FBQ0osQ0FBQztRQUFBLENBQUM7UUFDRixJQUFJLENBQUMsS0FBSyxFQUFFLENBQUM7UUFDYixJQUFJLFVBQVUsR0FBRyxJQUFJLENBQUMsT0FBTyxDQUFDLFNBQVMsQ0FBQyxPQUFPLENBQUMsSUFBSSxDQUFDLENBQUM7UUFDdEQsSUFBSSxDQUFDLE9BQU8sQ0FBQyxTQUFTLENBQUMsTUFBTSxDQUFDLFVBQVUsRUFBRSxDQUFDLENBQUMsQ0FBQztRQUM3Qyx1QkFBZSxDQUFDLElBQUksQ0FBQyxFQUFFLENBQUMsR0FBRyxJQUFJLENBQUM7SUFDakMsQ0FBQzs7SUFFRCxpQ0FBUSxHQUFSLFVBQVMsSUFBUztRQUNqQixJQUFJLENBQUMsS0FBSyxFQUFFLENBQUM7UUFDYixJQUFJLENBQUMsVUFBVSxHQUFHLElBQUksb0JBQVUsQ0FBQyxJQUFJLENBQUMsQ0FBQztRQUN2QyxJQUFJLEdBQUcsR0FBRyxJQUFJLENBQUMsTUFBTSxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUM7UUFDM0IsSUFBSSxDQUFDLElBQUksR0FBRyxJQUFJLENBQUMsT0FBTyxDQUFDLElBQUksRUFBRSxJQUFJLENBQUMsQ0FBQztRQUNyQyxHQUFHLENBQUMsU0FBUyxHQUFHLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQyw4QkFBOEI7UUFDekQsSUFBSSxDQUFDLE1BQU0sRUFBRSxDQUFDO1FBQ2QsTUFBTSxDQUFDLElBQUksQ0FBQztJQUNiLENBQUM7O0lBRUQsK0JBQU0sR0FBTjtRQUNDLE1BQU0sQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLE1BQU0sRUFBRSxDQUFDO0lBQzNCLENBQUM7O0lBRUQsMkJBQUUsR0FBRjtRQUNDLElBQUksR0FBRyxHQUFHLElBQUksQ0FBQyxNQUFNLEVBQUUsQ0FBQztRQUN4QixJQUFJLEdBQUcsR0FBRyxNQUFNLENBQUMsRUFBRSxDQUFDLEdBQUcsQ0FBQyxDQUFDO1FBQ3pCLEVBQUUsQ0FBQyxDQUFDLFNBQVMsQ0FBQyxNQUFNLEtBQUssQ0FBQyxDQUFDLENBQUEsQ0FBQztZQUMzQixNQUFNLENBQUMsR0FBRyxDQUFDO1FBQ1osQ0FBQztRQUFBLENBQUM7UUFDRixJQUFJLFFBQVEsR0FBRyxTQUFTLENBQUMsQ0FBQyxDQUFDLENBQUM7UUFDNUIsSUFBSSxZQUFZLEdBQUcsR0FBRzthQUNwQixNQUFNLEVBQUU7YUFDUixJQUFJLENBQUMsUUFBUSxDQUFDO2FBQ2QsTUFBTSxDQUFDLFVBQVMsRUFBVSxFQUFFLEdBQVE7WUFDcEMsTUFBTSxDQUFDLEdBQUcsQ0FBQyxPQUFPLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxDQUFDO1FBQzlCLENBQUMsQ0FBQyxDQUFDO1FBQ0osSUFBSSxhQUFhLEdBQUcsR0FBRyxDQUFDLElBQUksQ0FBQyxRQUFRLENBQUMsQ0FBQztRQUN2QyxNQUFNLENBQUMsWUFBWSxDQUFDLEdBQUcsQ0FBQyxhQUFhLENBQUMsQ0FBQztJQUN4QyxDQUFDOztJQUVELDRCQUFHLEdBQUgsVUFBSSxFQUFVO1FBQ2IsTUFBTSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7SUFDekIsQ0FBQzs7SUFFRCw2QkFBSSxHQUFKLFVBQUssRUFBVTtRQUNkLElBQUksSUFBSSxHQUFHLElBQUksQ0FBQyxVQUFVLENBQUMsS0FBSyxDQUFDLEVBQUUsQ0FBQyxDQUFDO1FBQ3JDLEVBQUUsQ0FBQyxDQUFDLElBQUksQ0FBQyxDQUFBLENBQUM7WUFDVCxNQUFNLENBQUMsSUFBSSxDQUFDO1FBQ2IsQ0FBQztRQUFBLENBQUM7SUFDSCxDQUFDOztJQUVELDRCQUFHLEdBQUgsVUFBSSxFQUFVO1FBQ2IsSUFBSSxHQUFHLEdBQUcsSUFBSSxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsQ0FBQztRQUN2QixFQUFFLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFBLENBQUM7WUFDVCxNQUFNLENBQUMsSUFBSSxDQUFDO1FBQ2IsQ0FBQztRQUFBLENBQUM7UUFDRixNQUFNLENBQUMsR0FBRyxDQUFDLEVBQUUsSUFBSSxJQUFJLENBQUM7SUFDdkIsQ0FBQzs7SUFDRixxQkFBQztBQUFELENBcE1BLEFBb01DLElBQUE7QUFwTVksc0JBQWMsaUJBb00xQixDQUFBO0FBQUEsQ0FBQztBQUVGO0lBQWdDLDhCQUFjO0lBQzdDLG9CQUFZLE9BQVksRUFBRSxNQUFrQjtRQUMzQyxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUMsS0FBSyxDQUFDLENBQUEsQ0FBQztZQUNaLGtCQUFNLE9BQU8sRUFBRSxNQUFNLENBQUMsQ0FBQztRQUN4QixDQUFDO1FBQUEsQ0FBQztRQUNGLE1BQU0sQ0FBQyxJQUFJLE9BQU8sQ0FBQyxRQUFRLENBQUMsT0FBTyxFQUFFLE1BQU0sQ0FBQyxDQUFDO0lBQzlDLENBQUM7O0lBQ0YsaUJBQUM7QUFBRCxDQVBBLEFBT0MsQ0FQK0IsY0FBYyxHQU83QztBQVBZLGtCQUFVLGFBT3RCLENBQUE7QUFBQSxDQUFDO0FBRUYsb0JBQW9CLElBQVM7SUFDNUIsRUFBRSxDQUFDLENBQUMsQ0FBQyxJQUFJLElBQUksQ0FBQyxJQUFJLENBQUMsS0FBSyxJQUFJLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxLQUFLLENBQUMsQ0FBQSxDQUFDO1FBQzlDLE1BQU0sQ0FBQyxFQUFFLENBQUM7SUFDWCxDQUFDO0lBQUEsQ0FBQztJQUNGLEVBQUUsQ0FBQyxDQUFDLEtBQUssQ0FBQyxPQUFPLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFBLENBQUM7UUFDcEMsTUFBTSxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsS0FBSyxDQUFDO0lBQ3pCLENBQUM7SUFBQSxDQUFDO0lBQ0YsTUFBTSxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsS0FBSyxDQUFDLEtBQUssQ0FBQyxHQUFHLENBQUMsQ0FBQztBQUNwQyxDQUFDO0FBQUEsQ0FBQztBQUVGLGlCQUFpQixFQUFjLEVBQUUsUUFBYTtJQUM3QyxJQUFJLEdBQUcsR0FBUSxLQUFLLENBQUMsV0FBVyxDQUFDLFFBQVEsQ0FBQyxDQUFDO0lBQzNDLElBQUksT0FBTyxHQUFHLFVBQVUsQ0FBQyxHQUFHLENBQUMsQ0FBQztJQUM5QixJQUFJLE1BQU0sR0FBRyxTQUFTLEdBQUcsRUFBRSxDQUFDLE9BQU8sQ0FBQyxFQUFFLENBQUM7SUFDdkMsR0FBRyxDQUFDLEtBQUssR0FBRyxLQUFLLENBQUMsV0FBVyxDQUFDLFFBQVEsQ0FBQyxLQUFLLENBQUMsQ0FBQztJQUM5QyxFQUFFLENBQUMsQ0FBQyxLQUFLLENBQUMsT0FBTyxDQUFDLEdBQUcsQ0FBQyxLQUFLLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQSxDQUFDO1FBQ25DLEdBQUcsQ0FBQyxLQUFLLENBQUMsS0FBSyxHQUFHLENBQUMsSUFBSSxFQUFFLEdBQUcsRUFBRSxNQUFNLEVBQUUsR0FBRyxDQUFDLENBQUMsTUFBTSxDQUFDLE9BQU8sQ0FBQyxDQUFDO1FBQzNELE1BQU0sQ0FBQyxHQUFHLENBQUM7SUFDWixDQUFDO0lBQUEsQ0FBQztJQUNGLEdBQUcsQ0FBQyxLQUFLLENBQUMsS0FBSyxHQUFHLENBQUMsSUFBSSxFQUFFLE1BQU0sQ0FBQyxDQUFDLE1BQU0sQ0FBQyxPQUFPLENBQUMsQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLENBQUM7SUFDM0QsTUFBTSxDQUFDLEdBQUcsQ0FBQztBQUNaLENBQUM7QUFBQSxDQUFDO0FBRUYsMkJBQTJCLEVBQWMsRUFBRSxHQUFRLEVBQUUsU0FBbUI7SUFDdkUsSUFBSSxNQUFNLEdBQUcsS0FBSyxDQUFDLE9BQU8sQ0FBQyxHQUFHLENBQUM7VUFDNUIsRUFBRTtVQUNGLEVBQUUsQ0FBQztJQUNOLEtBQUssQ0FBQyxNQUFNLENBQUMsR0FBRyxFQUFFLFVBQVMsS0FBVSxFQUFFLEdBQVc7UUFDakQsSUFBSSxhQUFhLEdBQUcsU0FBUyxDQUFDLE1BQU0sQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUM7UUFDNUMsTUFBTSxDQUFDLGNBQWMsQ0FBQyxNQUFNLEVBQUUsR0FBRyxFQUFFO1lBQ2xDLEdBQUcsRUFBRTtnQkFDSixFQUFFLENBQUMsQ0FBQyxPQUFPLEtBQUssS0FBSyxRQUFRLENBQUMsQ0FBQSxDQUFDO29CQUM5QixNQUFNLENBQUMsaUJBQWlCLENBQUMsRUFBRSxFQUFFLEdBQUcsQ0FBQyxHQUFHLENBQUMsRUFBRSxhQUFhLENBQUMsQ0FBQztnQkFDdkQsQ0FBQztnQkFBQSxDQUFDO2dCQUNGLE1BQU0sQ0FBQyxHQUFHLENBQUMsR0FBRyxDQUFDLENBQUM7WUFDakIsQ0FBQztZQUNELEdBQUcsRUFBRSxVQUFTLEdBQUc7Z0JBQ2hCLEVBQUUsQ0FBQyxNQUFNLENBQUMsYUFBYSxFQUFFLEdBQUcsQ0FBQyxDQUFDO1lBQy9CLENBQUM7U0FDRCxDQUFDLENBQUM7SUFDSixDQUFDLENBQUMsQ0FBQztJQUNILE1BQU0sQ0FBQyxNQUFNLENBQUM7QUFDZixDQUFDO0FBQUEsQ0FBQztBQUdGLG9CQUEyQixHQUFXO0lBQ3JDLE1BQU0sQ0FBQyx1QkFBZSxDQUFDLEdBQUcsQ0FBQyxDQUFDO0FBQzdCLENBQUM7QUFGZSxrQkFBVSxhQUV6QixDQUFBO0FBQUEsQ0FBQzs7QUM5UUYsWUFBWSxDQUFDO0FBS2IsSUFBWSxLQUFLLFdBQU0sVUFBVSxDQUFDLENBQUE7QUFDbEMsSUFBWSxRQUFRLFdBQU0sYUFBYSxDQUFDLENBQUE7QUFHeEM7SUFrQkMsYUFBYSxPQUFtQixFQUFFLFVBQWdCLEVBQUUsTUFBWTtRQUMvRCxLQUFLLENBQUMsTUFBTSxDQUFDLElBQUksRUFBRSxVQUFVLENBQUMsQ0FBQyxDQUFDLGFBQWE7UUFDN0MsSUFBSSxDQUFDLFFBQVEsR0FBRyxFQUFFLENBQUM7UUFDbkIsSUFBSSxDQUFDLE1BQU0sR0FBRyxNQUFNLElBQUksSUFBSSxDQUFDO1FBQzdCLElBQUksQ0FBQyxJQUFJLEdBQUcsSUFBSSxDQUFDO1FBQ2pCLElBQUksQ0FBQyxPQUFPLEdBQUcsT0FBTyxDQUFDO1FBQ3ZCLDRDQUE0QztRQUM1QyxxQkFBcUI7UUFDckIsT0FBTyxDQUFDLFVBQVUsQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDLENBQUM7UUFDN0IsRUFBRSxDQUFDLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFBLENBQUM7WUFDZCxJQUFJLENBQUMsWUFBWSxHQUFHLFFBQVEsQ0FBQyxXQUFXLENBQUMsSUFBSSxFQUFFLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQztZQUMxRCxFQUFFLENBQUMsQ0FBQyxJQUFJLENBQUMsWUFBWSxDQUFDLE1BQU0sS0FBSyxNQUFNLENBQUMsQ0FBQSxDQUFDO2dCQUN4QyxPQUFPLENBQUMsVUFBVSxDQUFDLFdBQVcsQ0FBQyxJQUFJLEVBQUUsQ0FBQyxJQUFJLENBQUMsWUFBWSxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUM7WUFDaEUsQ0FBQztZQUFBLENBQUM7UUFDSCxDQUFDO1FBQUEsQ0FBQztRQUNGLEVBQUUsQ0FBQyxDQUFDLENBQUMsTUFBTSxDQUFDLENBQUEsQ0FBQztZQUNaLE1BQU0sQ0FBQyxJQUFJLENBQUM7UUFDYixDQUFDO1FBQUEsQ0FBQztRQUNGLElBQUksQ0FBQyxJQUFJLEdBQUcsTUFBTSxDQUFDLElBQUksQ0FBQztRQUN4QixNQUFNLENBQUMsUUFBUSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQztJQUM1QixDQUFDOztJQUVNLFNBQUssR0FBWixVQUFhLElBQWMsRUFBRSxJQUFhLEVBQUUsVUFBZ0I7UUFDM0QsTUFBTSxDQUFDLElBQUksQ0FBQztJQUNiLENBQUM7O0lBSUQsb0JBQU0sR0FBTixVQUFPLE9BQW1CLEVBQUUsSUFBUyxFQUFFLFNBQWMsRUFBRSxLQUFVLEVBQUUsUUFBYTtRQUMvRSxNQUFNLENBQUM7SUFDUixDQUFDOztJQUVELHFCQUFPLEdBQVAsVUFBUSxRQUFnQjtRQUN2QixJQUFNLEdBQUcsR0FBRyxRQUFRLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFDO1FBQzlCLElBQUksR0FBRyxHQUFHLElBQUksQ0FBQyxNQUFNLENBQUM7UUFDdEIsT0FBTyxHQUFHLEVBQUMsQ0FBQztZQUNYLEVBQUUsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxHQUFHLEtBQUssR0FBRyxDQUFDLENBQUEsQ0FBQztnQkFDcEIsTUFBTSxDQUFDLEdBQUcsQ0FBQztZQUNaLENBQUM7WUFBQSxDQUFDO1lBQ0YsR0FBRyxHQUFHLEdBQUcsQ0FBQyxNQUFNLENBQUM7UUFDbEIsQ0FBQztRQUFBLENBQUM7UUFDRixNQUFNLENBQUMsSUFBSSxDQUFDO0lBQ2IsQ0FBQzs7SUFFRCxrQkFBSSxHQUFKLFVBQUssR0FBUztRQUNiLEVBQUUsQ0FBQyxDQUFDLFNBQVMsQ0FBQyxNQUFNLEtBQUssQ0FBQyxDQUFDLENBQUEsQ0FBQztZQUMzQixNQUFNLENBQUMsS0FBSyxDQUFDLE9BQU8sQ0FBQyxJQUFJLENBQUMsU0FBUyxDQUFDLElBQUksRUFBRSxJQUFJLENBQUMsT0FBTyxDQUFDLElBQUksQ0FBQyxDQUFDO1FBQzlELENBQUM7UUFBQSxDQUFDO1FBQ0YsSUFBSSxDQUFDLE9BQU8sQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxJQUFJLEVBQUUsR0FBRyxDQUFDLENBQUM7SUFDL0MsQ0FBQzs7SUFFRCwwQkFBWSxHQUFaO1FBQ0MsRUFBRSxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsU0FBUyxDQUFDLENBQUEsQ0FBQztZQUNwQixNQUFNLENBQUMsQ0FBQyxJQUFJLENBQUMsQ0FBQztRQUNmLENBQUM7UUFBQSxDQUFDO1FBQ0YsSUFBSSxHQUFHLEdBQVUsRUFBRSxDQUFDO1FBQ3BCLElBQUksQ0FBQyxRQUFRLENBQUMsT0FBTyxDQUFDLFVBQVMsS0FBSztZQUNuQyxHQUFHLEdBQUcsR0FBRyxDQUFDLE1BQU0sQ0FBQyxLQUFLLENBQUMsWUFBWSxFQUFFLENBQUMsQ0FBQztRQUN4QyxDQUFDLENBQUMsQ0FBQztRQUNILE1BQU0sQ0FBQyxHQUFHLENBQUM7SUFDWixDQUFDOztJQUVELG9CQUFNLEdBQU47UUFDQyxFQUFFLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxTQUFTLENBQUMsQ0FBQSxDQUFDO1lBQ3BCLElBQUksRUFBRSxHQUFHLENBQUMsSUFBSSxFQUFFLElBQUksQ0FBQyxPQUFPLENBQUMsRUFBRSxFQUFFLEtBQUssRUFBRSxJQUFJLENBQUMsR0FBRyxDQUFDLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxDQUFDO1lBQzVELE1BQU0sQ0FBQyxDQUFDLFFBQVEsQ0FBQyxjQUFjLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQztRQUN0QyxDQUFDO1FBQUEsQ0FBQztRQUNGLElBQUksR0FBRyxHQUFrQixFQUFFLENBQUM7UUFDNUIsSUFBSSxDQUFDLFlBQVksRUFBRSxDQUFDLE9BQU8sQ0FBQyxVQUFTLEdBQUc7WUFDdkMsR0FBRyxHQUFHLEdBQUcsQ0FBQyxNQUFNLENBQUMsR0FBRyxDQUFDLE1BQU0sRUFBRSxDQUFDLENBQUM7UUFDaEMsQ0FBQyxDQUFDLENBQUM7UUFDSCxNQUFNLENBQUMsR0FBRyxDQUFDO0lBQ1osQ0FBQzs7SUFFRCx1QkFBUyxHQUFUO1FBQ0MsSUFBSSxHQUFHLEdBQUcsSUFBSSxDQUFDLE1BQU0sRUFBRSxDQUFDO1FBQ3hCLEdBQUcsQ0FBQyxPQUFPLENBQUMsVUFBUyxHQUFHO1lBQ3ZCLEVBQUUsQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUEsQ0FBQztnQkFDVCxNQUFNLENBQUM7WUFDUixDQUFDO1lBQUEsQ0FBQztZQUNGLEdBQUcsQ0FBQyxNQUFNLEVBQUUsQ0FBQztRQUNkLENBQUMsQ0FBQyxDQUFDO0lBQ0osQ0FBQzs7SUFDRixVQUFDO0FBQUQsQ0FyR0EsQUFxR0MsSUFBQTtBQXJHcUIsV0FBRyxNQXFHeEIsQ0FBQTtBQUFBLENBQUM7QUFFRixnQkFBdUIsT0FBbUIsRUFBRSxNQUFXLEVBQUUsSUFBUyxFQUFFLElBQVM7SUFDNUUsSUFBSSxRQUFRLEdBQVEsY0FBSSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQztJQUNwQyxJQUFJLEdBQUcsR0FBRyxJQUFJLFFBQVEsQ0FBQyxPQUFPLEVBQUUsSUFBSSxFQUFFLE1BQU0sQ0FBUSxDQUFDO0lBQ3JELE1BQU0sQ0FBQyxHQUFHLENBQUMsTUFBTSxDQUFDLE9BQU8sRUFBRSxJQUFJLENBQUMsQ0FBQztBQUNsQyxDQUFDO0FBSmUsY0FBTSxTQUlyQixDQUFBO0FBQUEsQ0FBQztBQUVGLGdCQUF1QixPQUFtQixFQUFFLE9BQVksRUFBRSxTQUFjLEVBQUUsS0FBVSxFQUFFLFFBQWE7SUFDbEcsSUFBSSxRQUFRLEdBQVEsY0FBSSxDQUFDLE9BQU8sQ0FBQyxJQUFJLENBQUMsQ0FBQztJQUN2QyxFQUFFLENBQUMsQ0FBQyxDQUFDLFFBQVEsQ0FBQyxDQUFBLENBQUM7UUFDZCxNQUFNLENBQUM7SUFDUixDQUFDO0lBQUEsQ0FBQztJQUNGLE1BQU0sQ0FBQyxRQUFRLENBQUMsTUFBTSxDQUFDLE9BQU8sRUFBRSxPQUFPLEVBQUUsU0FBUyxFQUFFLEtBQUssRUFBRSxRQUFRLENBQUMsQ0FBQztBQUN0RSxDQUFDO0FBTmUsY0FBTSxTQU1yQixDQUFBO0FBQUEsQ0FBQztBQUVGLHFCQUFpQixTQUFTLENBQUMsQ0FBQTs7QUM5SDNCLFlBQVksQ0FBQztBQUViLElBQVksS0FBSyxXQUFNLFVBQVUsQ0FBQyxDQUFBO0FBR2xDLDJCQUF1QixxQkFBcUIsQ0FBQyxDQUFBO0FBRTdDO0lBQ0MsTUFBTSxDQUFDO1FBQ04sSUFBSSxFQUFFLEVBQUU7S0FDUixDQUFDO0FBQ0gsQ0FBQztBQUFBLENBQUM7QUFFRjtJQU1DLG9CQUFZLE9BQW1CO1FBQzlCLElBQUksQ0FBQyxPQUFPLEdBQUcsT0FBTyxDQUFDO1FBQ3ZCLElBQUksQ0FBQyxJQUFJLEdBQUcsRUFBRSxDQUFDO1FBQ2YsSUFBSSxDQUFDLFNBQVMsR0FBSSxvQkFBdUIsQ0FBQztZQUN6QyxJQUFJLEVBQUUsTUFBTTtZQUNaLFlBQVksRUFBRSxVQUFVO1NBQ3hCLENBQUMsQ0FBQztRQUNILElBQUksQ0FBQyxPQUFPLEdBQUcsRUFBRSxDQUFDO0lBQ25CLENBQUM7O0lBRUQsb0NBQWUsR0FBZixVQUFnQixHQUFRLEVBQUUsU0FBbUI7UUFDNUMsSUFBSSxLQUFLLEdBQUcsSUFBSSxDQUFDLFNBQVMsQ0FBQyxNQUFNLENBQUMsU0FBUyxDQUFDLENBQUM7UUFDN0MsS0FBSyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxDQUFDO0lBQzNCLENBQUM7O0lBRUQsZ0NBQVcsR0FBWCxVQUFZLEdBQVEsRUFBRSxhQUF5QjtRQUM5QyxhQUFhLENBQUMsT0FBTyxDQUFDLElBQUksQ0FBQyxlQUFlLENBQUMsSUFBSSxDQUFDLElBQUksRUFBRSxHQUFHLENBQUMsQ0FBQyxDQUFDO0lBQzdELENBQUM7O0lBRUQsd0JBQUcsR0FBSCxVQUFJLEdBQVE7UUFDWCxJQUFJLEdBQUcsR0FBRyxHQUFHLENBQUMsR0FBRyxDQUFDO1FBQ2xCLEVBQUUsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFBLENBQUM7WUFDUixJQUFJLENBQUMsT0FBTyxDQUFDLEdBQUcsQ0FBQyxHQUFHLElBQUksQ0FBQyxPQUFPLENBQUMsR0FBRyxDQUFDLElBQUksRUFBRSxDQUFDO1lBQzVDLElBQUksQ0FBQyxPQUFPLENBQUMsR0FBRyxDQUFDLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxDQUFDO1FBQzdCLENBQUM7UUFBQSxDQUFDO1FBQ0YsSUFBSSxHQUFHLEdBQUcsSUFBSSxDQUFDLE1BQU0sRUFBRSxDQUFDO1FBQ3hCLEdBQUcsQ0FBQyxHQUFHLEdBQUcsR0FBRyxDQUFDO1FBQ2QsRUFBRSxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsU0FBUyxDQUFDLENBQUEsQ0FBQztZQUNuQixHQUFHLENBQUMsS0FBSyxHQUFHLEtBQUssQ0FBQyxXQUFXLENBQUMsR0FBRyxDQUFDLEtBQUssSUFBSSxFQUFFLENBQUMsQ0FBQztZQUMvQyxHQUFHLENBQUMsS0FBSyxDQUFDLEVBQUUsR0FBRyxDQUFDLElBQUksRUFBRSxJQUFJLENBQUMsT0FBTyxDQUFDLEVBQUUsRUFBRSxLQUFLLEVBQUUsR0FBRyxDQUFDLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxDQUFDO1FBQzlELENBQUM7UUFBQSxDQUFDO1FBQ0YsR0FBRyxDQUFDLFNBQVMsR0FBRyxJQUFJLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQztRQUNqQyxJQUFJLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsQ0FBQztJQUNyQixDQUFDOztJQUVELDJCQUFNLEdBQU47UUFDQyxJQUFJLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxVQUFTLE9BQU87WUFDakMsRUFBRSxDQUFDLENBQUMsT0FBTyxDQUFDLElBQUksS0FBSyxNQUFNLElBQUksT0FBTyxDQUFDLEVBQUUsQ0FBQyxDQUFBLENBQUM7Z0JBQzFDLE9BQU8sQ0FBQyxFQUFFLENBQUMsTUFBTSxFQUFFLENBQUM7WUFDckIsQ0FBQztZQUFBLENBQUM7UUFDSCxDQUFDLENBQUMsQ0FBQztRQUNILE1BQU0sQ0FBQztJQUNSLENBQUM7O0lBRUQsNEJBQU8sR0FBUCxVQUFRLFNBQW1CLEVBQUUsVUFBb0I7UUFDaEQsSUFBSSxLQUFLLEdBQUcsSUFBSSxDQUFDLFNBQVMsQ0FBQyxNQUFNLENBQUMsU0FBUyxDQUFDLENBQUM7UUFDN0MsSUFBSSxRQUFRLEdBQVUsRUFBRSxDQUFDO1FBQ3pCLEVBQUUsQ0FBQyxDQUFDLEtBQUssQ0FBQyxVQUFVLEtBQUssQ0FBQyxJQUFJLENBQUMsVUFBVSxDQUFDLENBQUEsQ0FBQztZQUMxQyxRQUFRLEdBQUcsS0FBSyxDQUFDLGVBQWUsRUFBRSxDQUFDLEdBQUcsQ0FBQyxVQUFTLElBQVM7Z0JBQ3hELE1BQU0sQ0FBQztvQkFDTixJQUFJLEVBQUUsSUFBSSxDQUFDLElBQUksQ0FBQyxJQUFJO29CQUNwQixJQUFJLEVBQUUsSUFBSSxDQUFDLElBQUk7aUJBQ2YsQ0FBQztZQUNILENBQUMsQ0FBQyxDQUFDO1FBQ0osQ0FBQztRQUFBLENBQUM7UUFDRixJQUFJLE9BQU8sR0FBRyxLQUFLLENBQUMsVUFBVSxFQUFFLENBQUM7UUFDakMsTUFBTSxDQUFDO1lBQ04sTUFBTSxFQUFFLEtBQUssQ0FBQyxJQUFJLENBQUMsSUFBSTtZQUN2QixJQUFJLEVBQUUsUUFBUTtZQUNkLE9BQU8sRUFBRSxPQUFPO1NBQ2hCLENBQUM7SUFDSCxDQUFDOztJQUNELGdDQUFXLEdBQVgsVUFBWSxTQUFtQjtRQUM5QixJQUFJLEtBQUssR0FBRyxJQUFJLENBQUMsT0FBTyxDQUFDLFNBQVMsQ0FBQyxDQUFDO1FBQ3BDLElBQUksY0FBYyxHQUFHLEtBQUssQ0FBQyxNQUFNLENBQUM7UUFDbEMsSUFBSSxXQUFXLEdBQUcsS0FBSyxDQUFDLE1BQU0sQ0FBQztRQUMvQixLQUFLLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxVQUFTLElBQUk7WUFDL0IsV0FBVyxHQUFHLFdBQVcsQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDO1FBQzdDLENBQUMsQ0FBQyxDQUFDO1FBQ0gsSUFBSSxDQUFDLFNBQVMsQ0FBQyxNQUFNLENBQUMsU0FBUyxDQUFDLENBQUM7UUFDakMsSUFBSSxDQUFDLElBQUksR0FBRyxJQUFJLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxVQUFTLEdBQUc7WUFDeEMsTUFBTSxDQUFDLFdBQVcsQ0FBQyxPQUFPLENBQUMsR0FBRyxDQUFDLEdBQUcsQ0FBQyxDQUFDO1FBQ3JDLENBQUMsQ0FBQyxDQUFDO1FBQ0gsY0FBYyxDQUFDLE9BQU8sQ0FBQyxVQUFTLEdBQVE7WUFDdkMsR0FBRyxDQUFDLFNBQVMsRUFBRSxDQUFDO1FBQ2pCLENBQUMsQ0FBQyxDQUFDO0lBQ0osQ0FBQzs7SUFDRCwwQkFBSyxHQUFMLFVBQU0sR0FBVztRQUNoQixNQUFNLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxHQUFHLENBQUMsQ0FBQztJQUMxQixDQUFDOztJQUNELDJCQUFNLEdBQU47UUFDQyxNQUFNLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUM7SUFDekIsQ0FBQzs7SUFDRixpQkFBQztBQUFELENBekZBLEFBeUZDLElBQUE7QUF6RkQ7NEJBeUZDLENBQUE7QUFBQSxDQUFDOzs7QUNsR0QsQ0FBQztBQUVGLElBQUksTUFBTSxHQUFnQixFQUFFLENBQUM7QUFFN0IsSUFBTSxHQUFHLEdBQVEsTUFBTSxDQUFDO0FBRXhCLGlCQUF3QixJQUFZLEVBQUUsS0FBVTtJQUMvQyxJQUFNLE1BQU0sR0FBUSxHQUFHLENBQUMsS0FBSyxDQUFDLENBQUM7SUFDL0IsSUFBSSxHQUFHLEdBQWdCLEtBQUssQ0FBQyxNQUFNLENBQUM7SUFDcEMsT0FBTyxHQUFHLEVBQUMsQ0FBQztRQUNYLElBQUksRUFBRSxHQUFlLE1BQU0sQ0FBQyxLQUFLLENBQUMsR0FBRyxDQUFDLENBQUM7UUFDdkMsRUFBRSxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUEsQ0FBQztZQUNQLEVBQUUsQ0FBQyxTQUFTLENBQUMsSUFBSSxFQUFFLEVBQUUsRUFBRSxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUM7UUFFakMsQ0FBQztRQUFBLENBQUM7UUFDRixHQUFHLEdBQUcsR0FBRyxDQUFDLGFBQWEsQ0FBQztJQUN6QixDQUFDO0lBQUEsQ0FBQztBQUNILENBQUM7QUFYZSxlQUFPLFVBV3RCLENBQUE7QUFBQSxDQUFDO0FBRUYsZ0JBQXVCLElBQVk7SUFDbEMsRUFBRSxDQUFDLENBQUMsSUFBSSxJQUFJLE1BQU0sQ0FBQyxDQUFBLENBQUM7UUFDbkIsTUFBTSxDQUFDO0lBQ1IsQ0FBQztJQUFBLENBQUM7SUFDRixNQUFNLENBQUMsSUFBSSxDQUFDLEdBQUcsSUFBSSxDQUFDO0lBQ3BCLFFBQVEsQ0FBQyxnQkFBZ0IsQ0FBQyxJQUFJLEVBQUUsT0FBTyxDQUFDLElBQUksQ0FBQyxJQUFJLEVBQUUsSUFBSSxDQUFDLEVBQUUsSUFBSSxDQUFDLENBQUM7QUFDakUsQ0FBQztBQU5lLGNBQU0sU0FNckIsQ0FBQTtBQUFBLENBQUM7OztBQzdCRix3QkFBbUMsV0FBVyxDQUFDLENBQUE7QUFDL0MsMkJBQXNELGNBQWMsQ0FBQyxDQUFBO0FBWXBFLENBQUM7QUFFRixJQUFNLEdBQUcsR0FBbUIsVUFBUyxHQUF5QjtJQUM3RCxFQUFFLENBQUMsQ0FBQyxHQUFHLFlBQVksV0FBVyxDQUFDLENBQUEsQ0FBQztRQUMvQixNQUFNLENBQUMsR0FBRyxDQUFDLEtBQUssQ0FBQyxHQUFHLENBQUMsQ0FBQztJQUN2QixDQUFDO0lBQUEsQ0FBQztJQUNGLEVBQUUsQ0FBQyxDQUFDLE9BQU8sR0FBRyxJQUFJLFFBQVEsQ0FBQyxDQUFBLENBQUM7UUFDM0IsTUFBTSxDQUFDLHFCQUFXLENBQUMsR0FBYSxDQUFDLENBQUM7SUFDbkMsQ0FBQztJQUFBLENBQUM7QUFDSCxDQUFDLENBQUM7QUFFRjtrQkFBZSxHQUFHLENBQUM7QUFFbkIsR0FBRyxDQUFDLElBQUksR0FBRyxVQUFTLE1BQVc7SUFDOUIsRUFBRSxDQUFDLENBQUMsS0FBSyxDQUFDLE9BQU8sQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFBLENBQUM7UUFDMUIsTUFBTSxDQUFDLE1BQU0sQ0FBQyxHQUFHLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxDQUFDO0lBQzdCLENBQUM7SUFBQSxDQUFDO0lBQ0YsTUFBTSxDQUFDLElBQUksaUJBQU8sQ0FBQyxNQUFNLENBQUMsQ0FBQztBQUM1QixDQUFDLENBQUM7QUFFRixHQUFHLENBQUMsSUFBSSxHQUFHLFVBQVMsT0FBb0I7SUFDdkMsTUFBTSxDQUFDLE9BQU8sQ0FBQyxTQUFTLElBQUksT0FBTyxDQUFDLFNBQVMsQ0FBQyxRQUFRLENBQUMsSUFBSSxDQUFDLENBQUM7QUFDOUQsQ0FBQyxDQUFDO0FBRUYsSUFBTSxLQUFLLEdBQUcsaUJBQWlCLENBQUM7QUFDaEMsSUFBTSxJQUFJLEdBQUcsd0JBQXdCLENBQUM7QUFFdEMsR0FBRyxDQUFDLEtBQUssR0FBRyxVQUFTLE9BQW9CO0lBQ3hDLEVBQUUsQ0FBQyxDQUFDLENBQUMsT0FBTyxJQUFJLENBQUMsT0FBTyxDQUFDLFNBQVMsQ0FBQyxDQUFBLENBQUM7UUFDbkMsTUFBTSxDQUFDLElBQUksQ0FBQztJQUNiLENBQUM7SUFBQSxDQUFDO0lBQ0YsRUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxTQUFTLENBQUMsS0FBSyxDQUFDLEdBQUcsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFBLENBQUM7UUFDakQsTUFBTSxDQUFDLElBQUksQ0FBQztJQUNiLENBQUM7SUFBQSxDQUFDO0lBQ0YsRUFBRSxDQUFDLENBQUMsQ0FBQyxPQUFPLENBQUMsRUFBRSxDQUFDLENBQUEsQ0FBQztRQUNoQixNQUFNLENBQUMsSUFBSSxDQUFDO0lBQ2IsQ0FBQztJQUFBLENBQUM7SUFDRixJQUFJLENBQUMsU0FBUyxHQUFHLENBQUMsQ0FBQztJQUNuQixJQUFNLEdBQUcsR0FBRyxJQUFJLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxFQUFFLENBQUMsQ0FBQztJQUNsQyxFQUFFLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFBLENBQUM7UUFDVCxNQUFNLENBQUMsSUFBSSxDQUFDO0lBQ2IsQ0FBQztJQUFBLENBQUM7SUFDRixJQUFNLEdBQUcsR0FBRyxRQUFRLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7SUFDN0IsTUFBTSxDQUFDLHVCQUFVLENBQUMsR0FBRyxDQUFDLENBQUM7QUFDeEIsQ0FBQyxDQUFDO0FBRUYsR0FBRyxDQUFDLFVBQVUsR0FBRyxVQUFTLE9BQW9CO0lBQzdDLE9BQU8sSUFBSSxFQUFDLENBQUM7UUFDWixJQUFJLENBQUMsU0FBUyxHQUFHLENBQUMsQ0FBQztRQUNuQixJQUFJLEdBQUcsR0FBRyxJQUFJLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxFQUFFLENBQUMsQ0FBQztRQUNoQyxFQUFFLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFBLENBQUM7WUFDVCxPQUFPLEdBQUcsT0FBTyxDQUFDLGFBQWEsQ0FBQztZQUNoQyxFQUFFLENBQUMsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxDQUFBLENBQUM7Z0JBQ2IsTUFBTSxDQUFDLElBQUksQ0FBQztZQUNiLENBQUM7WUFBQSxDQUFDO1lBQ0YsUUFBUSxDQUFDO1FBQ1YsQ0FBQztRQUFBLENBQUM7UUFDRixJQUFNLEdBQUcsR0FBRyxRQUFRLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7UUFDN0IsSUFBTSxFQUFFLEdBQUcsdUJBQVUsQ0FBQyxHQUFHLENBQUMsQ0FBQztRQUMzQixJQUFNLEdBQUcsR0FBRyxRQUFRLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7UUFDN0IsTUFBTSxDQUFDLEVBQUUsQ0FBQyxVQUFVLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxDQUFDO0lBQ2hDLENBQUM7SUFBQSxDQUFDO0FBQ0gsQ0FBQyxDQUFDO0FBRUYsR0FBRyxDQUFDLE9BQU8sR0FBRyxxQkFBVyxDQUFDO0FBRTFCLEdBQUcsQ0FBQyxHQUFHLEdBQUcsNEJBQWUsQ0FBQztBQUUxQixJQUFNLEdBQUcsR0FBUSxNQUFNLENBQUM7QUFFeEIsR0FBRyxDQUFDLEVBQUUsR0FBRyxHQUFHLENBQUMsUUFBUSxDQUFDLENBQUM7QUFFdkIsR0FBRyxDQUFDLEtBQUssQ0FBQyxHQUFHLEdBQUcsQ0FBQzs7O0FDckZqQixJQUFPLE1BQU0sV0FBVyxVQUFVLENBQUMsQ0FBQztBQUNwQyxPQUFPLENBQUMsR0FBRyxDQUFDLE1BQU0sQ0FBQyxDQUFDOztBQ0RwQixZQUFZLENBQUM7QUFFYjtJQU1DLHNCQUFZLE1BQXFCO1FBQ2hDLElBQUksQ0FBQyxNQUFNLEdBQUcsRUFBRSxDQUFDO1FBQ2pCLElBQUksQ0FBQyxNQUFNLEdBQUcsTUFBTSxDQUFDO0lBQ3RCLENBQUM7O0lBRUQseUJBQUUsR0FBRixVQUFHLElBQVksRUFBRSxFQUFZO1FBQzVCLElBQUksU0FBUyxHQUFHLElBQUksQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLENBQUM7UUFDbEMsRUFBRSxDQUFDLENBQUMsQ0FBQyxTQUFTLENBQUMsQ0FBQSxDQUFDO1lBQ2YsU0FBUyxHQUFHLEVBQUUsQ0FBQztZQUNmLElBQUksQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLEdBQUcsU0FBUyxDQUFDO1FBQy9CLENBQUM7UUFBQSxDQUFDO1FBQ0YsU0FBUyxDQUFDLElBQUksQ0FBQyxFQUFFLENBQUMsQ0FBQztJQUNwQixDQUFDOztJQUVELDJCQUFJLEdBQUosVUFBSyxJQUFZO1FBQUUsa0JBQWtCO2FBQWxCLFdBQWtCLENBQWxCLHNCQUFrQixDQUFsQixJQUFrQjtZQUFsQixpQ0FBa0I7O1FBQ3BDLEVBQUUsQ0FBQyxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsQ0FBQSxDQUFDO1lBQ2hCLElBQUksQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxJQUFJLENBQUMsTUFBTSxFQUFFLFNBQVMsQ0FBQyxDQUFDO1FBQ2hELENBQUM7UUFBQSxDQUFDO1FBQ0YsSUFBSSxTQUFTLEdBQUcsSUFBSSxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsQ0FBQztRQUNsQyxFQUFFLENBQUMsQ0FBQyxDQUFDLFNBQVMsQ0FBQyxDQUFBLENBQUM7WUFDZixNQUFNLENBQUM7UUFDUixDQUFDO1FBQUEsQ0FBQztRQUNGLFNBQVMsQ0FBQyxPQUFPLENBQUMsVUFBUyxFQUFZO1lBQ3RDLEVBQUUsQ0FBQyxLQUFLLENBQUMsSUFBSSxFQUFFLFFBQVEsQ0FBQyxDQUFDO1FBQzFCLENBQUMsQ0FBQyxDQUFDO0lBQ0osQ0FBQzs7SUFFRCxnQ0FBUyxHQUFULFVBQVUsSUFBWSxFQUFFLE9BQVksRUFBRSxJQUFXO1FBQ2hELEVBQUUsQ0FBQyxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsQ0FBQSxDQUFDO1lBQ2hCLElBQUksQ0FBQyxNQUFNLENBQUMsU0FBUyxDQUFDLEtBQUssQ0FBQyxJQUFJLENBQUMsTUFBTSxFQUFFLFNBQVMsQ0FBQyxDQUFDO1FBQ3JELENBQUM7UUFBQSxDQUFDO1FBQ0YsSUFBSSxTQUFTLEdBQUcsSUFBSSxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsQ0FBQztRQUNsQyxFQUFFLENBQUMsQ0FBQyxDQUFDLFNBQVMsQ0FBQyxDQUFBLENBQUM7WUFDZixNQUFNLENBQUM7UUFDUixDQUFDO1FBQUEsQ0FBQztRQUNGLFNBQVMsQ0FBQyxPQUFPLENBQUMsVUFBUyxFQUFZO1lBQ3RDLEVBQUUsQ0FBQyxLQUFLLENBQUMsT0FBTyxFQUFFLElBQUksQ0FBQyxDQUFDO1FBQ3pCLENBQUMsQ0FBQyxDQUFDO0lBQ0osQ0FBQzs7SUFDRixtQkFBQztBQUFELENBN0NBLEFBNkNDLElBQUE7QUE3Q0Q7OEJBNkNDLENBQUE7QUFBQSxDQUFDOztBQy9DRixZQUFZLENBQUM7QUFPYixxQkFBOEIsUUFBUSxDQUFDLENBQUE7QUFZdEMsQ0FBQztBQUVGLGVBQXNCLEdBQWEsRUFBRSxJQUFZLEVBQUUsVUFBZTtJQUNqRTs7OztRQUlJO0lBQ0osSUFBSSxPQUFPLEdBQWdCLEVBQUUsQ0FBQztJQUM5QixHQUFHLENBQUMsQ0FBQyxJQUFJLENBQUMsSUFBSSxjQUFJLENBQUMsQ0FBQSxDQUFDO1FBQ25CLElBQU0sR0FBRyxHQUFlLGNBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQztRQUNoQyxJQUFNLElBQUksR0FBRyxHQUFHLENBQUMsS0FBSyxDQUFDLEdBQUcsRUFBRSxJQUFJLEVBQUUsVUFBVSxDQUFDLENBQUM7UUFDOUMsRUFBRSxDQUFDLENBQUMsSUFBSSxDQUFDLENBQUEsQ0FBQztZQUNULE9BQU8sQ0FBQyxJQUFJLENBQUM7Z0JBQ1osS0FBSyxFQUFFLEdBQUc7Z0JBQ1YsTUFBTSxFQUFFLElBQUk7YUFDWixDQUFDLENBQUM7UUFDSixDQUFDO1FBQUEsQ0FBQztJQUNILENBQUM7SUFBQSxDQUFDO0lBQ0YsRUFBRSxDQUFDLENBQUMsT0FBTyxDQUFDLE1BQU0sR0FBRyxDQUFDLENBQUMsQ0FBQSxDQUFDO1FBQ3ZCLElBQU0sVUFBUSxHQUFHLElBQUksQ0FBQyxHQUFHLENBQUMsS0FBSyxDQUFDLElBQUksRUFBRSxPQUFPLENBQUMsR0FBRyxDQUFDLFVBQVMsSUFBSTtZQUM5RCxNQUFNLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxRQUFRLElBQUksQ0FBQyxDQUFDO1FBQy9CLENBQUMsQ0FBQyxDQUFDLENBQUM7UUFDSixPQUFPLEdBQUcsT0FBTyxDQUFDLE1BQU0sQ0FBQyxVQUFTLElBQUk7WUFDckMsTUFBTSxDQUFDLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxRQUFRLElBQUksQ0FBQyxDQUFDLEtBQUssVUFBUSxDQUFDO1FBQzlDLENBQUMsQ0FBQyxDQUFDO0lBQ0osQ0FBQztJQUNELEVBQUUsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxNQUFNLEtBQUssQ0FBQyxDQUFDLENBQUEsQ0FBQztRQUN6QixNQUFNLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQztJQUN4QixDQUFDO0lBQUEsQ0FBQztJQUNGLEVBQUUsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxNQUFNLEtBQUssQ0FBQyxDQUFDLENBQUEsQ0FBQztRQUN6QixNQUFNLENBQUMsSUFBSSxDQUFDO0lBQ2IsQ0FBQztJQUFBLENBQUM7SUFDRixFQUFFLENBQUMsQ0FBQyxPQUFPLENBQUMsTUFBTSxHQUFHLENBQUMsQ0FBQyxDQUFBLENBQUM7UUFDdkIsTUFBTSxJQUFJLEtBQUssQ0FBQyxzQkFBc0IsQ0FBQyxDQUFDO0lBQ3pDLENBQUM7SUFBQSxDQUFDO0lBQ0YsTUFBTSxDQUFDLElBQUksQ0FBQztBQUNiLENBQUM7QUFuQ2UsYUFBSyxRQW1DcEIsQ0FBQTtBQUFBLENBQUM7O0FDeERGLFlBQVksQ0FBQztBQUliLHdCQUFpQyxnQkFBZ0IsQ0FBQyxDQUFBO0FBQ2xELHFCQUE4QixhQUFhLENBQUMsQ0FBQTtBQUM1Qyw2QkFBcUMscUJBQXFCLENBQUMsQ0FBQTtBQUMzRCxtQkFBNEIsV0FBVyxDQUFDLENBQUE7QUFDeEMsb0JBQTZCLFlBQVksQ0FBQyxDQUFBO0FBQzFDLHNCQUErQixjQUFjLENBQUMsQ0FBQTtBQUM5QywyQkFBbUMsbUJBQW1CLENBQUMsQ0FBQTtBQUl0RCxDQUFDO0FBRUYsSUFBTSxJQUFJLEdBQVU7SUFDaEIsU0FBQSxpQkFBTztJQUNQLE1BQUEsY0FBSTtJQUNKLGFBQUEsc0JBQVc7SUFDWCxJQUFBLFlBQUU7SUFDRixLQUFBLGFBQUc7SUFDSCxPQUFBLGVBQUs7SUFDTCxXQUFBLG9CQUFTO0NBQ1osQ0FBQztBQUVGO2tCQUFlLElBQUksQ0FBQzs7QUMxQnBCLFlBQVksQ0FBQzs7Ozs7O0FBSWIsNEJBQWtCLHVCQUF1QixDQUFDLENBQUE7QUFJMUM7SUFBc0MsNEJBQUc7SUFBekM7UUFBc0MsOEJBQUc7UUFFeEMsU0FBSSxHQUFXLFNBQVMsQ0FBQztJQXVCMUIsQ0FBQztJQXJCTyxjQUFLLEdBQVosVUFBYSxJQUFjO1FBQzFCLEVBQUUsQ0FBQyxDQUFDLElBQUksQ0FBQyxPQUFPLEtBQUssU0FBUyxDQUFDLENBQUEsQ0FBQztZQUMvQixNQUFNLENBQUMsSUFBSSxDQUFDO1FBQ2IsQ0FBQztRQUFBLENBQUM7UUFDRixJQUFJLElBQUksR0FBYSxFQUFjLENBQUM7UUFDcEMsSUFBSSxDQUFDLFNBQVMsR0FBRyxJQUFJLENBQUM7UUFDdEIsSUFBSSxDQUFDLElBQUksR0FBRyxTQUFTLENBQUM7UUFDdEI7Ozs7OzBEQUtrRDtRQUNsRCxNQUFNLENBQUMsSUFBSSxDQUFDO0lBQ2IsQ0FBQzs7SUFFRCx5QkFBTSxHQUFOLFVBQU8sT0FBbUIsRUFBRSxJQUFTO1FBQ3BDLElBQUksQ0FBQyxTQUFTLEdBQUcsT0FBTyxDQUFDLE9BQU8sQ0FBQyxTQUFTLENBQUM7UUFDM0MsTUFBTSxDQUFDLE9BQU8sQ0FBQyxNQUFNLENBQUMsU0FBUyxDQUFDLE9BQU8sQ0FBQyxJQUFJLENBQUMsT0FBTyxFQUFFLE9BQU8sQ0FBQyxPQUFPLENBQUMsTUFBTSxFQUFFLE9BQU8sQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLENBQUM7SUFDcEcsQ0FBQzs7SUFFRixlQUFDO0FBQUQsQ0F6QkEsQUF5QkMsQ0F6QnFDLGlCQUFHLEdBeUJ4QztBQXpCRDswQkF5QkMsQ0FBQTtBQUFBLENBQUM7O0FDakNGLFlBQVksQ0FBQzs7Ozs7O0FBRWIsSUFBWSxLQUFLLFdBQU0sVUFBVSxDQUFDLENBQUE7QUFDbEMsSUFBWSxRQUFRLFdBQU0sYUFBYSxDQUFDLENBQUE7QUFDeEMsNEJBQWtCLHVCQUF1QixDQUFDLENBQUE7QUFJMUM7SUFBbUMseUJBQUc7SUFBdEM7UUFBbUMsOEJBQUc7UUFFckMsU0FBSSxHQUFXLE1BQU0sQ0FBQztJQWdDdkIsQ0FBQztJQTlCTyxXQUFLLEdBQVosVUFBYSxJQUFjO1FBQzFCLEVBQUUsQ0FBQyxDQUFDLElBQUksQ0FBQyxPQUFPLElBQUksTUFBTSxDQUFDLENBQUEsQ0FBQztZQUMzQixNQUFNLENBQUMsSUFBSSxDQUFDO1FBQ2IsQ0FBQztRQUFBLENBQUM7UUFDRixJQUFJLElBQUksR0FBVSxFQUFXLENBQUM7UUFDOUIsSUFBSSxDQUFDLElBQUksR0FBRyxNQUFNLENBQUM7UUFDbkIsSUFBSSxDQUFDLFNBQVMsR0FBRyxLQUFLLENBQUM7UUFDdkIsSUFBSSxDQUFDLElBQUksR0FBRyxLQUFLLENBQUMsU0FBUyxDQUFDLElBQUksQ0FBQyxDQUFDO1FBQ2xDLElBQUksQ0FBQyxHQUFHLEdBQUcsSUFBSSxDQUFDLEtBQUssQ0FBQyxFQUFFLElBQUksSUFBSSxDQUFDO1FBQ2pDLE1BQU0sQ0FBQyxJQUFJLENBQUM7SUFDYixDQUFDOztJQUVELHNCQUFNLEdBQU4sVUFBTyxPQUFtQixFQUFFLElBQVM7UUFDcEMsSUFBSSxLQUFLLEdBQUcsUUFBUSxDQUFDLE1BQU0sQ0FBQyxJQUFJLEVBQUUsSUFBSSxFQUFFLElBQUksQ0FBQyxZQUFZLENBQUMsQ0FBQztRQUMzRCxNQUFNLENBQUMsS0FBSyxDQUFDLFNBQVMsQ0FBQztZQUN0QixJQUFJLEVBQUUsTUFBTTtZQUNaLEtBQUssRUFBRSxJQUFJLENBQUMsS0FBSztZQUNqQixTQUFTLEVBQUUsS0FBSztTQUNoQixDQUFDLENBQUM7SUFDSixDQUFDOztJQUVELHNCQUFNLEdBQU4sVUFBTyxPQUFtQixFQUFFLElBQVMsRUFBRSxTQUFjLEVBQUUsS0FBVTtRQUNoRSxJQUFJLElBQUksR0FBRyxJQUFJLENBQUMsTUFBTSxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUM7UUFDNUIsRUFBRSxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsQ0FBQSxDQUFDO1FBRVgsQ0FBQztRQUFBLENBQUM7UUFDRixJQUFJLENBQUMsU0FBUyxHQUFHLEtBQUssQ0FBQztRQUN2Qiw2Q0FBNkM7SUFDOUMsQ0FBQzs7SUFFRixZQUFDO0FBQUQsQ0FsQ0EsQUFrQ0MsQ0FsQ2tDLGlCQUFHLEdBa0NyQztBQWxDRDt1QkFrQ0MsQ0FBQTtBQUFBLENBQUM7O0FDMUNGLFlBQVksQ0FBQzs7Ozs7O0FBR2IsSUFBWSxRQUFRLFdBQU0sYUFBYSxDQUFDLENBQUE7QUFDeEMsdUJBQXNDLFdBQVcsQ0FBQyxDQUFBO0FBQ2xELDRCQUEwQix1QkFBdUIsQ0FBQyxDQUFBO0FBR2xELHFCQUFrQixRQUFRLENBQUMsQ0FBQTtBQUUzQjtJQUEwQyxnQ0FBRztJQUE3QztRQUEwQyw4QkFBRztRQUc1QyxTQUFJLEdBQVcsYUFBYSxDQUFDO0lBNkI5QixDQUFDO0lBM0JPLGtCQUFLLEdBQVosVUFBYSxJQUFjO1FBQzFCLEVBQUUsQ0FBQyxDQUFDLElBQUksQ0FBQyxJQUFJLEtBQUssTUFBTSxDQUFDLENBQUEsQ0FBQztZQUN6QixNQUFNLENBQUMsSUFBSSxDQUFDO1FBQ2IsQ0FBQztRQUFBLENBQUM7UUFDRixJQUFJLEdBQUcsR0FBRyxhQUFPLENBQUMsSUFBSSxDQUFDLElBQUksRUFBRSxRQUFRLENBQUMsS0FBSyxDQUFDLENBQUM7UUFDN0MsRUFBRSxDQUFDLENBQUMsT0FBTyxHQUFHLEtBQUssUUFBUSxDQUFDLENBQUEsQ0FBQztZQUM1QixNQUFNLENBQUMsSUFBSSxDQUFDO1FBQ2IsQ0FBQztRQUFBLENBQUM7UUFDRixJQUFJLElBQUksR0FBaUIsRUFBa0IsQ0FBQztRQUM1QyxJQUFJLENBQUMsSUFBSSxHQUFHLGFBQWEsQ0FBQztRQUMxQixJQUFJLENBQUMsR0FBRyxHQUFHLEdBQUcsQ0FBQztRQUNmLE1BQU0sQ0FBQyxJQUFJLENBQUM7SUFDYixDQUFDOztJQUVELDZCQUFNLEdBQU4sVUFBTyxPQUFtQixFQUFFLElBQVM7UUFDcEMsSUFBSSxJQUFJLEdBQUcsSUFBSSxDQUFDO1FBQ2hCLElBQUksR0FBRyxHQUFHLElBQUksZUFBTSxDQUFDLElBQUksQ0FBQyxHQUFHLEVBQUUsUUFBUSxDQUFDLEtBQUssQ0FBQyxDQUFDO1FBQy9DLE1BQU0sQ0FBQyxHQUFHLENBQUMsTUFBTSxDQUFDLFVBQVMsSUFBSTtZQUM5QixJQUFJLFFBQVEsR0FBRztnQkFDZCxNQUFNLEVBQUUsTUFBTTtnQkFDZCxNQUFNLEVBQUUsSUFBSTthQUNaLENBQUM7WUFDRixJQUFJLFFBQVEsR0FBRyxJQUFJLGNBQUssQ0FBQyxPQUFPLEVBQUUsUUFBUSxFQUFFLElBQUksQ0FBQyxNQUFNLENBQUMsQ0FBQztZQUN6RCxNQUFNLENBQUMsUUFBUSxDQUFDLE1BQU0sQ0FBQyxPQUFPLEVBQUUsSUFBSSxDQUFDLENBQUM7UUFDdkMsQ0FBQyxDQUFDLENBQUM7SUFDSixDQUFDOztJQUVGLG1CQUFDO0FBQUQsQ0FoQ0EsQUFnQ0MsQ0FoQ3lDLGlCQUFHLEdBZ0M1QztBQWhDRDs4QkFnQ0MsQ0FBQTtBQUFBLENBQUM7O0FDMUNGLFlBQVksQ0FBQzs7Ozs7O0FBRWIsSUFBWSxLQUFLLFdBQU0sVUFBVSxDQUFDLENBQUE7QUFDbEMsSUFBWSxRQUFRLFdBQU0sYUFBYSxDQUFDLENBQUE7QUFDeEMsNEJBQWtCLHVCQUF1QixDQUFDLENBQUE7QUFFMUMsdUJBQWdDLFdBQVcsQ0FBQyxDQUFBO0FBRTVDO0lBQWlDLHVCQUFHO0lBQXBDO1FBQWlDLDhCQUFHO1FBR25DLFNBQUksR0FBVyxJQUFJLENBQUM7SUEyQ3JCLENBQUM7SUF6Q08sU0FBSyxHQUFaLFVBQWEsSUFBYztRQUMxQixFQUFFLENBQUMsQ0FBQyxJQUFJLENBQUMsSUFBSSxJQUFJLEtBQUssSUFBSSxDQUFDLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxPQUFPLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQSxDQUFDO1lBQ3hELE1BQU0sQ0FBQyxJQUFJLENBQUM7UUFDYixDQUFDO1FBQUEsQ0FBQztRQUNGLElBQUksSUFBSSxHQUFPLEVBQVMsQ0FBQztRQUN6QixJQUFJLENBQUMsSUFBSSxHQUFHLElBQUksQ0FBQztRQUNqQixJQUFJLENBQUMsU0FBUyxHQUFHLElBQUksQ0FBQztRQUN0QixJQUFJLENBQUMsTUFBTSxHQUFHLElBQUksQ0FBQyxPQUFPLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFDO1FBQ3BDLElBQUksQ0FBQyxJQUFJLEdBQUcsS0FBSyxDQUFDLFNBQVMsQ0FBQyxJQUFJLENBQUMsQ0FBQztRQUNsQyxJQUFJLENBQUMsR0FBRyxHQUFHLElBQUksQ0FBQyxLQUFLLENBQUMsRUFBRSxJQUFJLElBQUksQ0FBQztRQUNqQyxJQUFJLENBQUMsT0FBTyxHQUFHLGdCQUFPLENBQUMsSUFBSSxFQUFFLElBQUksRUFBRSxJQUFJLENBQUMsQ0FBQztRQUN6QyxNQUFNLENBQUMsSUFBSSxDQUFDO0lBQ2IsQ0FBQzs7SUFFRCxvQkFBTSxHQUFOLFVBQU8sT0FBbUIsRUFBRSxJQUFTO1FBQ3BDLElBQUksSUFBSSxHQUFHLElBQUksQ0FBQztRQUNoQixJQUFJLENBQUMsUUFBUSxHQUFHLE9BQU8sQ0FBQztRQUN4QixxRUFBcUU7UUFDckUsSUFBTSxHQUFHLEdBQVEsTUFBTSxDQUFDO1FBQ3hCLElBQUksT0FBTyxHQUFHLEdBQUcsQ0FBQyxLQUFLLENBQUMsQ0FBQyxPQUFPLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxDQUFDO1FBQzlDLElBQUksTUFBTSxHQUFHLEtBQUssQ0FBQyxTQUFTLENBQUMsUUFBUSxDQUFDLFFBQVEsQ0FBQyxJQUFJLEVBQUUsSUFBSSxFQUFFLElBQUksQ0FBQyxZQUFZLENBQUMsQ0FBQyxDQUFDO1FBQy9FLElBQUksRUFBRSxHQUFHLE9BQU8sQ0FBQyxNQUFNLENBQUMsTUFBTSxFQUFFLElBQUksRUFBRSxPQUFPLENBQUMsQ0FBQztRQUMvQyxFQUFFLENBQUMsRUFBRSxDQUFDLFFBQVEsRUFBRSxVQUFTLElBQVMsRUFBRSxHQUFRO1lBQzNDLDhDQUE4QztZQUM5Qyx5QkFBeUI7UUFDMUIsQ0FBQyxDQUFDLENBQUM7UUFDSCxJQUFJLENBQUMsRUFBRSxHQUFHLEVBQUUsQ0FBQztRQUNiLEVBQUUsQ0FBQyxJQUFJLEdBQUcsSUFBSSxDQUFDO1FBQ2YsT0FBTyxDQUFDLFFBQVEsQ0FBQyxJQUFJLENBQUMsRUFBRSxDQUFDLENBQUM7UUFDMUIsTUFBTSxDQUFDLEVBQUUsQ0FBQztJQUNYLENBQUM7O0lBRUQsb0JBQU0sR0FBTixVQUFPLE9BQW1CLEVBQUUsSUFBUyxFQUFFLFNBQWMsRUFBRSxLQUFVO1FBQ2hFLElBQUksSUFBSSxHQUFHLElBQUksQ0FBQyxNQUFNLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQztRQUM1QixFQUFFLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxDQUFBLENBQUM7UUFFWCxDQUFDO1FBQUEsQ0FBQztRQUNGLElBQUksQ0FBQyxTQUFTLEdBQUcsS0FBSyxDQUFDO1FBQ3ZCLDZDQUE2QztJQUM5QyxDQUFDOztJQUVGLFVBQUM7QUFBRCxDQTlDQSxBQThDQyxDQTlDZ0MsaUJBQUcsR0E4Q25DO0FBOUNEO3FCQThDQyxDQUFBO0FBQUEsQ0FBQzs7QUN0REYsWUFBWSxDQUFDOzs7Ozs7QUFFYixJQUFZLEtBQUssV0FBTSxVQUFVLENBQUMsQ0FBQTtBQUNsQyxJQUFZLFFBQVEsV0FBTSxhQUFhLENBQUMsQ0FBQTtBQUN4Qyx1QkFBeUMsV0FBVyxDQUFDLENBQUE7QUFDckQsNEJBQWtCLHVCQUF1QixDQUFDLENBQUE7QUFFMUMsdUJBQWdDLFdBQVcsQ0FBQyxDQUFBO0FBRTVDLGlCQUFpQixJQUFTO0lBQ3pCLEVBQUUsQ0FBQyxDQUFDLE9BQU8sSUFBSSxLQUFLLFFBQVEsQ0FBQyxDQUFBLENBQUM7UUFDN0IsTUFBTSxDQUFDLEtBQUssQ0FBQztJQUNkLENBQUM7SUFBQSxDQUFDO0lBQ0YsTUFBTSxDQUFDLElBQUksQ0FBQyxJQUFJLEtBQUssT0FBTyxDQUFDO0FBQzlCLENBQUM7QUFBQSxDQUFDO0FBRUY7SUFBa0Msd0JBQUc7SUFBckM7UUFBa0MsOEJBQUc7UUFLcEMsU0FBSSxHQUFXLEtBQUssQ0FBQztJQThHdEIsQ0FBQztJQTNHTyxVQUFLLEdBQVosVUFBYSxJQUFjLEVBQUUsSUFBYSxFQUFFLFVBQWdCO1FBQzNELEVBQUUsQ0FBQyxDQUFDLElBQUksQ0FBQyxJQUFJLEtBQUssS0FBSyxDQUFDLENBQUEsQ0FBQztZQUN4QixNQUFNLENBQUMsSUFBSSxDQUFDO1FBQ2IsQ0FBQztRQUFBLENBQUM7UUFDRixJQUFJLGVBQWUsR0FBRyxLQUFLLENBQUM7UUFDNUIsSUFBTSxJQUFJLEdBQVMsRUFBVSxDQUFDO1FBQzlCLElBQUksQ0FBQyxJQUFJLEdBQUcsS0FBSyxDQUFDO1FBQ2xCLElBQUksQ0FBQyxTQUFTLEdBQUcsS0FBSyxDQUFDO1FBQ3ZCLElBQUksQ0FBQyxVQUFVLEdBQUcsSUFBSSxDQUFDLE1BQU0sQ0FBQyxJQUFJLEtBQUssS0FBSyxDQUFDO1FBQzdDLElBQUksQ0FBQyxPQUFPLEdBQUcsSUFBSSxDQUFDLE9BQU8sQ0FBQztRQUM1QixFQUFFLENBQUMsQ0FBQyxJQUFJLElBQUksSUFBSSxDQUFDLEtBQUssQ0FBQyxDQUFBLENBQUM7WUFDdkIsSUFBSSxDQUFDLEdBQUcsR0FBRyxJQUFJLENBQUMsS0FBSyxDQUFDLEVBQUUsQ0FBQyxLQUFLLENBQUM7WUFDL0IsT0FBTyxJQUFJLENBQUMsS0FBSyxDQUFDLEVBQUUsQ0FBQztRQUN0QixDQUFDO1FBQUEsQ0FBQztRQUNGLElBQUksUUFBUSxHQUFHLEtBQUssQ0FBQyxhQUFhLENBQUMsSUFBSSxDQUFDLEtBQUssRUFBRSxNQUFNLEVBQUUsT0FBTyxDQUFDLENBQUM7UUFDaEUsUUFBUSxHQUFHLFFBQVEsQ0FBQyxHQUFHLENBQUMsVUFBUyxJQUFJO1lBQ3BDLElBQU0sT0FBTyxHQUFHLElBQUksQ0FBQyxLQUFLLENBQUMsSUFBSSxLQUFLLFFBQVE7a0JBQ3pDLElBQUksQ0FBQyxLQUFLLENBQUMsS0FBSztrQkFDaEIsQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLE9BQU8sR0FBRyxHQUFHLEdBQUcsR0FBRyxDQUFDLEdBQUcsR0FBRyxHQUFHLElBQUksQ0FBQyxLQUFLLENBQUMsR0FBRyxHQUFHLEdBQUcsQ0FBQztZQUNqRSxJQUFNLEtBQUssR0FBRyxhQUFVLENBQUMsT0FBTyxFQUFFLFFBQVEsQ0FBQyxLQUFLLENBQUMsQ0FBQztZQUNsRCxJQUFNLElBQUksR0FBRyxhQUFVLENBQUMsSUFBSSxDQUFDLElBQUksRUFBRSxRQUFRLENBQUMsS0FBSyxDQUFDLENBQUM7WUFDbkQsRUFBRSxDQUFDLENBQUMsT0FBTyxLQUFLLEtBQUssUUFBUSxJQUFJLE9BQU8sSUFBSSxLQUFLLFFBQVEsQ0FBQyxDQUFBLENBQUM7Z0JBQzFELGVBQWUsR0FBRyxJQUFJLENBQUM7WUFDeEIsQ0FBQztZQUFBLENBQUM7WUFDRixNQUFNLENBQUM7Z0JBQ04sTUFBTSxFQUFFLElBQUk7Z0JBQ1osT0FBTyxFQUFFLEtBQUs7YUFDZCxDQUFDO1FBQ0gsQ0FBQyxDQUFDLENBQUM7UUFDSCxJQUFJLENBQUMsS0FBSyxHQUFHLEtBQUssQ0FBQyxhQUFhLENBQUMsUUFBUSxFQUFFLE1BQU0sRUFBRSxPQUFPLENBQUMsQ0FBQztRQUM1RCxFQUFFLENBQUMsQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLENBQUEsQ0FBQztZQUNmLElBQUksQ0FBQyxJQUFJLEdBQUcsUUFBUSxDQUFDLEtBQUssQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLElBQUksRUFBRTtnQkFDM0MsT0FBTyxFQUFFLElBQUksQ0FBQyxLQUFLLENBQUMsT0FBTzthQUMzQixDQUFDLENBQUM7UUFDSixDQUFDO1FBQUEsQ0FBQztRQUNGLElBQUksQ0FBQyxPQUFPLEdBQUcsZ0JBQU8sQ0FBQyxJQUFJLEVBQUUsSUFBSSxFQUFFLElBQUksQ0FBQyxDQUFDO1FBQ3pDLEVBQUUsQ0FBQyxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUEsQ0FBQztZQUMvQixJQUFJLENBQUMsYUFBYSxHQUFHLElBQUksQ0FBQztRQUMzQixDQUFDO1FBQUEsQ0FBQztRQUNGLEVBQUUsQ0FBQyxDQUFDLFVBQVUsSUFBSSxVQUFVLENBQUMsSUFBSSxLQUFLLE9BQU8sQ0FBQyxDQUFBLENBQUM7WUFDOUMsSUFBSSxDQUFDLFdBQVcsR0FBRyxJQUFJLENBQUM7UUFDekIsQ0FBQztRQUFBLENBQUM7UUFDRixFQUFFLENBQUMsQ0FDRCxDQUFDLGVBQWU7ZUFDYixDQUFDLElBQUksQ0FBQyxHQUFHO2VBQ1QsQ0FBQyxJQUFJLENBQUMsVUFBVTtlQUNoQixDQUFDLElBQUksQ0FBQyxhQUFhO2VBQ25CLENBQUMsSUFBSSxDQUFDLFdBQVc7ZUFDakIsQ0FBQyxJQUFJLENBQUMsSUFDVixDQUFDLENBQUEsQ0FBQztZQUNGLE1BQU0sQ0FBQyxJQUFJLENBQUM7UUFDYixDQUFDO1FBQUEsQ0FBQztRQUNGLE1BQU0sQ0FBQyxJQUFJLENBQUM7SUFDYixDQUFDOztJQUVELHFCQUFNLEdBQU4sVUFBTyxPQUFtQixFQUFFLElBQVM7UUFDcEMsSUFBTSxJQUFJLEdBQUcsSUFBSSxDQUFDO1FBQ2xCLEVBQUUsQ0FBQyxDQUFDLElBQUksQ0FBQyxhQUFhLENBQUMsQ0FBQSxDQUFDO1lBQ3ZCLElBQUksQ0FBQyxJQUFJLENBQUMsa0JBQWtCLEdBQUcsSUFBSSxDQUFDO1FBQ3JDLENBQUM7UUFBQSxDQUFDO1FBQ0YsSUFBTSxRQUFRLEdBQUcsS0FBSyxDQUFDLGFBQWEsQ0FBQyxJQUFJLENBQUMsS0FBSyxFQUFFLE1BQU0sRUFBRSxPQUFPLENBQUMsQ0FBQztRQUNsRSxJQUFJLE9BQU8sR0FBUSxFQUFFLENBQUM7UUFDdEIsUUFBUSxDQUFDLE9BQU8sQ0FBQyxVQUFTLElBQUk7WUFDN0IsSUFBTSxJQUFJLEdBQUcsSUFBSSxlQUFNLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDLE1BQU0sQ0FBQyxRQUFRLENBQUMsZ0JBQWdCLENBQUMsSUFBSSxDQUFDLElBQUksRUFBRSxJQUFJLEVBQUUsSUFBSSxDQUFDLENBQUMsQ0FBQztZQUM1RixJQUFNLEtBQUssR0FBRyxJQUFJLGVBQU0sQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLENBQUMsTUFBTSxDQUFDLFFBQVEsQ0FBQyxnQkFBZ0IsQ0FBQyxJQUFJLENBQUMsSUFBSSxFQUFFLElBQUksRUFBRSxJQUFJLENBQUMsQ0FBQyxDQUFDO1lBQzlGLE9BQU8sQ0FBQyxJQUFJLENBQUMsR0FBRyxLQUFLLENBQUM7UUFDdkIsQ0FBQyxDQUFDLENBQUM7UUFDSCxJQUFJLFFBQVEsR0FBZSxFQUFFLENBQUM7UUFDOUIsT0FBTyxDQUFDLFVBQVUsQ0FBQyxXQUFXLENBQUMsSUFBSSxFQUFFLFFBQVEsQ0FBQyxDQUFDO1FBQy9DLElBQU0sS0FBSyxHQUFHLElBQUksQ0FBQyxJQUFJO2NBQ3BCLFFBQVEsQ0FBQyxNQUFNLENBQUMsSUFBSSxFQUFFLElBQUksRUFBRSxJQUFJLENBQUMsWUFBWSxDQUFDO2NBQzlDLE9BQU8sQ0FBQyxTQUFTLENBQUMsSUFBSSxDQUFDLE9BQU8sRUFBRSxJQUFJLEVBQUUsSUFBSSxDQUFDLENBQUM7UUFDL0MsTUFBTSxDQUFDLEtBQUssQ0FBQyxTQUFTLENBQUM7WUFDdEIsTUFBTSxFQUFFLElBQUksQ0FBQyxPQUFPO1lBQ3BCLE9BQU8sRUFBRSxPQUFPO1lBQ2hCLFdBQVcsRUFBRSxLQUFLO1NBQ2xCLENBQUMsQ0FBQztJQUNKLENBQUM7O0lBRUQscUJBQU0sR0FBTixVQUFPLE9BQW1CLEVBQUUsSUFBUyxFQUFFLFNBQWMsRUFBRSxLQUFVO1FBQ2hFLHFCQUFxQjtRQUNyQjtzRUFDOEQ7UUFDOUQsSUFBTSxRQUFRLEdBQUcsS0FBSyxDQUFDLGFBQWEsQ0FBQyxJQUFJLENBQUMsS0FBSyxFQUFFLE1BQU0sRUFBRSxPQUFPLENBQUMsQ0FBQztRQUNsRSxJQUFJLE9BQU8sR0FBUSxFQUFFLENBQUM7UUFDdEIsUUFBUSxDQUFDLE9BQU8sQ0FBQyxVQUFTLElBQUk7WUFDN0IsSUFBTSxJQUFJLEdBQUcsSUFBSSxlQUFNLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDLE1BQU0sQ0FBQyxRQUFRLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxJQUFJLEVBQUUsSUFBSSxFQUFFLE9BQU8sQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDO1lBQzFGLElBQU0sS0FBSyxHQUFHLElBQUksZUFBTSxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsQ0FBQyxNQUFNLENBQUMsVUFBUyxJQUFJO2dCQUN4RCxJQUFNLFlBQVksR0FBRyxRQUFRLENBQUMsV0FBVyxDQUFDLElBQUksRUFBRSxJQUFJLENBQUMsQ0FBQztnQkFDdEQsTUFBTSxDQUFDLFFBQVEsQ0FBQyxNQUFNLENBQUMsSUFBSSxFQUFFLE9BQU8sQ0FBQyxJQUFJLEVBQUUsWUFBWSxDQUFDLENBQUM7WUFDMUQsQ0FBQyxDQUFDLENBQUM7WUFDSCxPQUFPLENBQUMsSUFBSSxDQUFDLEdBQUcsS0FBSyxDQUFDO1FBQ3ZCLENBQUMsQ0FBQyxDQUFDO1FBQ0gsSUFBTSxHQUFHLEdBQUcsSUFBSSxDQUFDLE1BQU0sRUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFDO1FBQzdCLEVBQUUsQ0FBQyxDQUFDLElBQUksQ0FBQyxJQUFJLElBQUksSUFBSSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxLQUFLLFNBQVMsQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQSxDQUFDO1lBQ2xFLEdBQUcsQ0FBQyxTQUFTLEdBQUcsSUFBSSxDQUFDLElBQUksQ0FBQyxPQUFPO2tCQUM5QixLQUFLLENBQUMsVUFBVSxDQUFDLEtBQUssQ0FBQztrQkFDdkIsS0FBSyxDQUFDO1FBQ1YsQ0FBQztRQUFBLENBQUM7UUFDRixLQUFLLENBQUMsTUFBTSxDQUFDLE9BQU8sRUFBRSxVQUFTLEtBQWEsRUFBRSxJQUFZO1lBQ3pELElBQU0sTUFBTSxHQUFHLEdBQUcsQ0FBQyxZQUFZLENBQUMsSUFBSSxDQUFDLENBQUM7WUFDdEMsRUFBRSxDQUFDLENBQUMsTUFBTSxLQUFLLEtBQUssQ0FBQyxDQUFBLENBQUM7Z0JBQ3JCLEdBQUcsQ0FBQyxZQUFZLENBQUMsSUFBSSxFQUFFLEtBQUssQ0FBQyxDQUFDO1lBQy9CLENBQUM7WUFBQSxDQUFDO1FBQ0gsQ0FBQyxDQUFDLENBQUM7SUFDSixDQUFDOztJQTNHTSxhQUFRLEdBQVcsQ0FBQyxDQUFDLENBQUM7SUE2RzlCLFdBQUM7QUFBRCxDQW5IQSxBQW1IQyxDQW5IaUMsaUJBQUcsR0FtSHBDO0FBbkhEO3NCQW1IQyxDQUFBO0FBQUEsQ0FBQzs7QUNuSUYsWUFBWSxDQUFDOzs7Ozs7QUFJYiw0QkFBa0IsdUJBQXVCLENBQUMsQ0FBQTtBQUkxQztJQUFtQyx5QkFBRztJQUF0QztRQUFtQyw4QkFBRztRQUVyQyxTQUFJLEdBQVcsTUFBTSxDQUFDO0lBVXZCLENBQUM7SUFSTyxXQUFLLEdBQVosVUFBYSxJQUFjO1FBQzFCLE1BQU0sQ0FBQyxJQUFJLENBQUM7SUFDYixDQUFDOztJQUVELHNCQUFNLEdBQU4sVUFBTyxPQUFtQixFQUFFLElBQVM7UUFDcEMsTUFBTSxJQUFJLEtBQUssQ0FBQyxpQ0FBaUMsQ0FBQyxDQUFDO0lBQ3BELENBQUM7O0lBRUYsWUFBQztBQUFELENBWkEsQUFZQyxDQVprQyxpQkFBRyxHQVlyQztBQVpEO3VCQVlDLENBQUE7QUFBQSxDQUFDOztBQ3BCRixZQUFZLENBQUM7Ozs7OztBQUdiLElBQVksUUFBUSxXQUFNLGFBQWEsQ0FBQyxDQUFBO0FBQ3hDLDRCQUFrQix1QkFBdUIsQ0FBQyxDQUFBO0FBSTFDO0lBQXdDLDhCQUFHO0lBQTNDO1FBQXdDLDhCQUFHO1FBRTFDLFNBQUksR0FBVyxXQUFXLENBQUM7SUFnQjVCLENBQUM7SUFkTyxnQkFBSyxHQUFaLFVBQWEsSUFBYztRQUMxQixNQUFNLENBQUMsSUFBSSxDQUFDO0lBQ2IsQ0FBQzs7SUFFRCwyQkFBTSxHQUFOLFVBQU8sT0FBbUIsRUFBRSxJQUFTO1FBQ3BDLElBQU0sSUFBSSxHQUFHLElBQUksQ0FBQztRQUNsQixJQUFNLFNBQVMsR0FBRyxRQUFRLENBQUMsUUFBUSxDQUFDLElBQUksRUFBRSxJQUFJLEVBQUUsSUFBSSxDQUFDLFlBQVksQ0FBQyxDQUFDO1FBQ25FLElBQUksQ0FBQyxTQUFTLEdBQUcsSUFBSSxDQUFDLFlBQVksQ0FBQyxJQUFJLENBQUM7UUFDeEMsRUFBRSxDQUFDLENBQUMsQ0FBQyxTQUFTLENBQUMsQ0FBQSxDQUFDO1lBQ2YsTUFBTSxDQUFDLEVBQUUsQ0FBQztRQUNYLENBQUM7UUFBQSxDQUFDO1FBQ0YsTUFBTSxDQUFDLE9BQU8sQ0FBQyxTQUFTLENBQUMsSUFBSSxDQUFDLE9BQU8sRUFBRSxJQUFJLEVBQUUsSUFBSSxDQUFDLENBQUM7SUFDcEQsQ0FBQzs7SUFFRixpQkFBQztBQUFELENBbEJBLEFBa0JDLENBbEJ1QyxpQkFBRyxHQWtCMUM7QUFsQkQ7NEJBa0JDLENBQUE7QUFBQSxDQUFDOztBQzFCRixZQUFZLENBQUM7Ozs7OztBQUViLElBQVksS0FBSyxXQUFNLFVBQVUsQ0FBQyxDQUFBO0FBQ2xDLElBQVksUUFBUSxXQUFNLGFBQWEsQ0FBQyxDQUFBO0FBQ3hDLDRCQUEwQix1QkFBdUIsQ0FBQyxDQUFBO0FBRWxELHVCQUFnQyxXQUFXLENBQUMsQ0FBQTtBQUM1QyxJQUFZLFNBQVMsV0FBTSxjQUFjLENBQUMsQ0FBQTtBQUMxQywyQkFBdUIsY0FBYyxDQUFDLENBQUE7QUFFdEMsNEJBQTRCLE9BQW1CLEVBQUUsU0FBYyxFQUFFLFNBQWMsRUFBRSxJQUFTLEVBQUUsUUFBZ0I7SUFDM0csSUFBTSxPQUFPLEdBQUcsS0FBSyxDQUFDLE9BQU8sQ0FBQyxTQUFTLENBQUMsQ0FBQztJQUN6QyxFQUFFLENBQUMsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxDQUFBLENBQUM7UUFDYixTQUFTLEdBQUcsQ0FBQyxTQUFTLENBQUMsQ0FBQztJQUN6QixDQUFDO0lBQUEsQ0FBQztJQUNGLElBQU0sS0FBSyxHQUFHLFNBQVMsQ0FBQyxHQUFHLENBQUMsVUFBUyxRQUFhLEVBQUUsRUFBVTtRQUM3RCxJQUFJLFFBQVEsR0FBRyxTQUFTLENBQUM7UUFDekIsSUFBTSxJQUFJLEdBQUcsT0FBTztjQUNqQixRQUFRLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxFQUFFLEdBQUcsUUFBUSxDQUFDLENBQUMsUUFBUSxFQUFFLENBQUMsQ0FBQztjQUMzQyxRQUFRLENBQUMsSUFBSSxDQUFDLEVBQUUsQ0FBQyxDQUFDO1FBQ3JCLElBQUksT0FBTyxHQUFRO1lBQ2xCLE1BQU0sRUFBRSxXQUFXO1lBQ25CLFdBQVcsRUFBRSxJQUFJO1lBQ2pCLE1BQU0sRUFBRSxJQUFJO1lBQ1osU0FBUyxFQUFFLFNBQVMsQ0FBQyxPQUFPO1NBQzVCLENBQUM7UUFDRixFQUFFLENBQUMsQ0FBQyxTQUFTLENBQUMsR0FBRyxDQUFDLENBQUEsQ0FBQztZQUNsQixPQUFPLENBQUMsR0FBRyxHQUFHLFNBQVMsQ0FBQyxHQUFHLEdBQUcsT0FBTyxDQUFDO1FBQ3ZDLENBQUM7UUFBQSxDQUFDO1FBQ0YsUUFBUSxHQUFHLElBQUksb0JBQVUsQ0FBQyxPQUFPLEVBQUUsT0FBTyxFQUFFLFFBQVEsQ0FBQyxDQUFDO1FBQ3RELE1BQU0sQ0FBQyxRQUFRLENBQUMsTUFBTSxDQUFDLE9BQU8sRUFBRSxJQUFJLENBQUMsQ0FBQztJQUN2QyxDQUFDLENBQUMsQ0FBQztJQUNILE1BQU0sQ0FBQyxLQUFLLENBQUM7QUFDZCxDQUFDO0FBQUEsQ0FBQztBQUVGO0lBQW9DLDBCQUFHO0lBQXZDO1FBQW9DLDhCQUFHO1FBR3RDLFNBQUksR0FBVyxPQUFPLENBQUM7SUF1Q3hCLENBQUM7SUFyQ08sWUFBSyxHQUFaLFVBQWEsSUFBYyxFQUFFLElBQVk7UUFDeEMsRUFBRSxDQUFDLENBQUMsSUFBSSxDQUFDLE9BQU8sS0FBSyxPQUFPLENBQUMsQ0FBQSxDQUFDO1lBQzdCLE1BQU0sQ0FBQyxJQUFJLENBQUM7UUFDYixDQUFDO1FBQUEsQ0FBQztRQUNGLElBQU0sSUFBSSxHQUFXLEVBQVksQ0FBQztRQUNsQyxJQUFJLENBQUMsSUFBSSxHQUFHLE9BQU8sQ0FBQztRQUNwQixJQUFJLENBQUMsU0FBUyxHQUFHLElBQUksQ0FBQztRQUN0QixJQUFJLENBQUMsSUFBSSxHQUFHLEtBQUssQ0FBQyxTQUFTLENBQUMsSUFBSSxDQUFDLENBQUM7UUFDbEMsSUFBSSxDQUFDLE9BQU8sR0FBRyxnQkFBTyxDQUFDLElBQUksRUFBRSxJQUFJLEVBQUUsSUFBSSxDQUFDLENBQUM7UUFDekMsSUFBSSxDQUFDLEdBQUcsR0FBRyxJQUFJLENBQUMsS0FBSyxDQUFDLEVBQUUsSUFBSSxJQUFJLENBQUM7UUFDakMsTUFBTSxDQUFDLElBQUksQ0FBQztJQUNiLENBQUM7O0lBRUQsdUJBQU0sR0FBTixVQUFPLE9BQW1CLEVBQUUsSUFBUztRQUNwQyxJQUFNLElBQUksR0FBRyxJQUFJLENBQUM7UUFDbEIsSUFBSSxDQUFDLEtBQUssR0FBRyxFQUFFLENBQUM7UUFDaEIsSUFBTSxTQUFTLEdBQUcsUUFBUSxDQUFDLFFBQVEsQ0FBQyxJQUFJLEVBQUUsSUFBSSxFQUFFLElBQUksQ0FBQyxZQUFZLENBQUMsQ0FBQztRQUNuRSxJQUFJLENBQUMsU0FBUyxHQUFHLElBQUksQ0FBQyxZQUFZLENBQUMsSUFBSSxDQUFDO1FBQ3hDLElBQU0sVUFBVSxHQUFHLFNBQVMsQ0FBQyxPQUFPLENBQUMsT0FBTyxFQUFFLElBQUksQ0FBQyxDQUFDO1FBQ3BELElBQU0sS0FBSyxHQUFHLGtCQUFrQixDQUFDLE9BQU8sRUFBRSxJQUFJLEVBQUUsU0FBUyxFQUFFLElBQUksRUFBRSxDQUFDLENBQUMsQ0FBQztRQUNwRSxNQUFNLENBQUMsS0FBSyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsR0FBRyxVQUFVLENBQUM7SUFDdEMsQ0FBQzs7SUFFRCx1QkFBTSxHQUFOLFVBQU8sT0FBbUIsRUFBRSxJQUFTLEVBQUUsU0FBYyxFQUFFLEtBQVUsRUFBRSxRQUFhO1FBQy9FLEtBQUssR0FBRyxLQUFLLElBQUksRUFBRSxDQUFDO1FBQ3BCLFFBQVEsR0FBRyxRQUFRLElBQUksRUFBRSxDQUFDO1FBQzFCLEdBQUcsQ0FBQyxDQUFDLElBQUksQ0FBQyxHQUFHLEtBQUssQ0FBQyxNQUFNLEVBQUUsQ0FBQyxHQUFHLFFBQVEsQ0FBQyxNQUFNLEVBQUUsQ0FBQyxFQUFFLEVBQUMsQ0FBQztZQUNwRCxPQUFPLENBQUMsVUFBVSxDQUFDLFdBQVcsQ0FBQyxTQUFTLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO1FBQ3ZELENBQUM7UUFBQSxDQUFDO1FBQ0YsRUFBRSxDQUFDLENBQUMsS0FBSyxDQUFDLE1BQU0sR0FBRyxRQUFRLENBQUMsTUFBTSxDQUFDLENBQUEsQ0FBQztZQUNuQyxJQUFNLFNBQVMsR0FBRyxLQUFLLENBQUMsS0FBSyxDQUFDLFFBQVEsQ0FBQyxNQUFNLENBQUMsQ0FBQztZQUMvQyxJQUFNLFVBQVUsR0FBRyxrQkFBa0IsQ0FBQyxPQUFPLEVBQUUsSUFBSSxFQUFFLFNBQVMsRUFBRSxPQUFPLENBQUMsSUFBSSxFQUFFLFFBQVEsQ0FBQyxNQUFNLENBQUMsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUM7WUFDMUcsSUFBTSxNQUFNLEdBQUcsU0FBUyxDQUFDLElBQUksQ0FBQyxPQUFPLEVBQUUsSUFBSSxDQUFDLENBQUM7WUFDN0MsU0FBUyxDQUFDLFVBQVUsQ0FBQyxNQUFNLEVBQUUsUUFBUSxFQUFFLFVBQVUsQ0FBQyxDQUFDO1FBQ3BELENBQUM7UUFBQSxDQUFDO0lBQ0gsQ0FBQzs7SUFFRixhQUFDO0FBQUQsQ0ExQ0EsQUEwQ0MsQ0ExQ21DLGlCQUFHLEdBMEN0QztBQTFDRDt3QkEwQ0MsQ0FBQTtBQUFBLENBQUM7O0FDN0VGLFlBQVksQ0FBQztBQUlaLENBQUM7QUFJRCxDQUFDO0FBRUY7SUFNQyxnQkFBYSxHQUFvQixFQUFFLFlBQTJCO1FBQzdELEVBQUUsQ0FBQyxDQUFDLE9BQU8sR0FBRyxLQUFLLFFBQVEsQ0FBQyxDQUFBLENBQUM7WUFDNUIsSUFBSSxDQUFDLEdBQUcsR0FBRyxHQUFHLENBQUMsR0FBRyxDQUFDO1lBQ25CLElBQUksQ0FBQyxJQUFJLEdBQUcsR0FBRyxDQUFDLElBQUksQ0FBQztZQUNyQixJQUFJLENBQUMsS0FBSyxHQUFHLEdBQUcsQ0FBQyxLQUFLLENBQUM7WUFDdkIsTUFBTSxDQUFDO1FBQ1IsQ0FBQztRQUFBLENBQUM7UUFDRixJQUFJLENBQUMsR0FBRyxHQUFHLEdBQWEsQ0FBQztRQUN6QixJQUFJLENBQUMsS0FBSyxHQUFHLEVBQUUsQ0FBQztRQUNoQixJQUFJLENBQUMsSUFBSSxHQUFHLEVBQUUsQ0FBQztRQUNmLE1BQU0sQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLEdBQWEsRUFBRSxZQUFZLENBQUMsQ0FBQztJQUNoRCxDQUFDOztJQUVELHNCQUFLLEdBQUwsVUFBTSxHQUFXLEVBQUUsWUFBMEI7UUFDNUMsSUFBTSxTQUFTLEdBQUcsR0FBRyxDQUFDLEtBQUssQ0FBQyxLQUFLLENBQUMsQ0FBQztRQUNuQyxFQUFFLENBQUMsQ0FBQyxDQUFDLFNBQVMsQ0FBQyxDQUFBLENBQUM7WUFDZixJQUFJLENBQUMsUUFBUSxHQUFHLElBQUksQ0FBQztZQUNyQixJQUFJLENBQUMsS0FBSyxHQUFHLENBQUMsR0FBRyxDQUFDLENBQUM7WUFDbkIsTUFBTSxDQUFDO1FBQ1IsQ0FBQztRQUFBLENBQUM7UUFDRixJQUFJLENBQUMsSUFBSSxHQUFHLFNBQVMsQ0FBQyxHQUFHLENBQUMsVUFBUyxJQUFJO1lBQ3RDLElBQU0sU0FBUyxHQUFXLElBQUksQ0FBQyxLQUFLLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUM7WUFDNUMsSUFBTSxPQUFPLEdBQVEsWUFBWSxDQUFDLFNBQVMsQ0FBQyxDQUFDO1lBQzdDLE9BQU8sQ0FBQyxPQUFPLEdBQUcsSUFBSSxDQUFDLENBQUMsQ0FBQyxLQUFLLEdBQUcsQ0FBQztZQUNsQyxNQUFNLENBQUMsT0FBTyxDQUFDO1FBQ2hCLENBQUMsQ0FBQyxDQUFDO1FBQ0gsSUFBSSxDQUFDLEtBQUssR0FBRyxHQUFHLENBQUMsS0FBSyxDQUFDLEtBQUssQ0FBQyxDQUFDO1FBQzlCLE1BQU0sQ0FBQyxJQUFJLENBQUM7SUFDYixDQUFDOztJQUVELHVCQUFNLEdBQU4sVUFBTyxhQUE0QjtRQUNsQyxJQUFNLElBQUksR0FBRyxJQUFJLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxhQUFhLENBQUMsQ0FBQztRQUMxQyxJQUFNLEtBQUssR0FBRyxTQUFTLENBQUMsSUFBSSxDQUFDLEtBQUssRUFBRSxJQUFJLENBQUMsQ0FBQztRQUMxQyxNQUFNLENBQUMsS0FBSyxDQUFDLElBQUksQ0FBQyxFQUFFLENBQUMsQ0FBQztJQUN2QixDQUFDOztJQUVGLGFBQUM7QUFBRCxDQTFDQSxBQTBDQyxJQUFBO0FBMUNZLGNBQU0sU0EwQ2xCLENBQUE7QUFBQSxDQUFDO0FBRUYsY0FBcUIsR0FBb0IsRUFBRSxZQUEwQjtJQUNwRSxJQUFJLEdBQUcsR0FBVyxJQUFJLE1BQU0sQ0FBQyxHQUFHLEVBQUUsWUFBWSxDQUFDLENBQUM7SUFDaEQsRUFBRSxDQUFDLENBQUMsR0FBRyxDQUFDLFFBQVEsQ0FBQyxDQUFBLENBQUM7UUFDakIsTUFBTSxDQUFDLEdBQUcsQ0FBQztJQUNaLENBQUM7SUFBQSxDQUFDO0lBQ0YsTUFBTSxDQUFDLEdBQUcsQ0FBQztBQUNaLENBQUM7QUFOZSxZQUFJLE9BTW5CLENBQUE7QUFBQSxDQUFDO0FBRUYsSUFBSSxLQUFLLEdBQUcseUJBQXlCLENBQUM7QUFFdEM7SUFBbUIsY0FBZ0I7U0FBaEIsV0FBZ0IsQ0FBaEIsc0JBQWdCLENBQWhCLElBQWdCO1FBQWhCLDZCQUFnQjs7SUFDbEMsSUFBSSxTQUFTLEdBQUcsQ0FBQyxDQUFDO0lBQ2xCLElBQUksV0FBVyxHQUFHLENBQUMsQ0FBQztJQUNwQixHQUFHLENBQUMsQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxHQUFHLElBQUksQ0FBQyxNQUFNLEVBQUUsQ0FBQyxFQUFFLEVBQUMsQ0FBQztRQUNyQyxTQUFTLEdBQUcsSUFBSSxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsTUFBTSxFQUFFLFNBQVMsQ0FBQyxDQUFDO1FBQ2hELFdBQVcsSUFBSSxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsTUFBTSxDQUFDO0lBQy9CLENBQUM7SUFBQSxDQUFDO0lBQ0YsSUFBSSxNQUFNLEdBQVUsRUFBRSxDQUFDO0lBQ3ZCLElBQU0sVUFBVSxHQUFHLFNBQVMsQ0FBQyxNQUFNLENBQUM7SUFDcEMsR0FBRyxDQUFDLENBQUMsSUFBSSxFQUFFLEdBQUcsQ0FBQyxFQUFFLEVBQUUsR0FBRyxTQUFTLEVBQUUsRUFBRSxFQUFFLEVBQUMsQ0FBQztRQUN0QyxHQUFHLENBQUMsQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxHQUFHLFVBQVUsRUFBRSxDQUFDLEVBQUUsRUFBQyxDQUFDO1lBQ3BDLEVBQUUsQ0FBQyxDQUFDLFNBQVMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxNQUFNLEdBQUcsRUFBRSxDQUFDLENBQUEsQ0FBQztnQkFDN0IsTUFBTSxDQUFDLElBQUksQ0FBQyxTQUFTLENBQUMsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQztZQUMvQixDQUFDO1lBQUEsQ0FBQztRQUNILENBQUM7UUFBQSxDQUFDO0lBQ0gsQ0FBQztJQUFBLENBQUM7SUFDRixNQUFNLENBQUMsTUFBTSxDQUFDO0FBQ2YsQ0FBQztBQUFBLENBQUM7O0FDakZGLFlBQVksQ0FBQztBQUViLElBQVksV0FBVyxXQUFNLGFBQWEsQ0FBQyxDQUFBO0FBRTNDLDBCQUE2QixhQUFhLENBQUMsQ0FBQTtBQUNoQyxpQkFBUyxHQUFHLG1CQUFnQixDQUFDLElBQUksQ0FBQyxJQUFJLEVBQUUsV0FBVyxDQUFDLENBQUM7QUFDaEUsSUFBSSxFQUFFLEdBQUcsT0FBTyxDQUFDLFlBQVksQ0FBQyxDQUFDO0FBYTlCLENBQUM7QUFNRixrQkFBa0IsSUFBYyxFQUFFLElBQVksRUFBRSxVQUFlO0lBQzlELElBQU0sT0FBTyxHQUFHLFdBQVcsQ0FBQyxLQUFLLENBQUMsSUFBSSxFQUFFLElBQUksRUFBRSxVQUFVLENBQUMsQ0FBQztJQUMxRCxNQUFNLENBQUMsT0FBTyxDQUFDO0FBQ2hCLENBQUM7QUFBQSxDQUFDO0FBRUYsaUJBQXdCLEdBQWEsRUFBRSxJQUFhLEVBQUUsVUFBZ0I7SUFFckUsaUJBQWlCLFFBQW9CO1FBQ3BDLElBQUksS0FBSyxHQUFxQixFQUFFLENBQUM7UUFDakMsUUFBUSxDQUFDLE9BQU8sQ0FBQyxVQUFTLElBQUksRUFBRSxFQUFFO1lBQ2pDLElBQU0sT0FBTyxHQUFHLFFBQVEsQ0FBQyxJQUFJLEVBQUUsSUFBSSxFQUFFLFVBQVUsQ0FBQyxDQUFDO1lBQ2pELEVBQUUsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxDQUFBLENBQUM7Z0JBQ1osS0FBSyxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsQ0FBQztnQkFDcEIsTUFBTSxDQUFDO1lBQ1IsQ0FBQztZQUFBLENBQUM7WUFDRixFQUFFLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxRQUFRLElBQUksSUFBSSxDQUFDLFFBQVEsQ0FBQyxNQUFNLElBQUksQ0FBQyxDQUFDLENBQUEsQ0FBQztnQkFDaEQsS0FBSyxDQUFDLElBQUksQ0FBQyxFQUFFLENBQUMsTUFBTSxDQUFDLElBQUksRUFBRSxFQUFFLENBQUMsQ0FBQyxDQUFDO2dCQUNoQyxNQUFNLENBQUM7WUFDUixDQUFDO1lBQUEsQ0FBQztZQUNGLElBQU0sSUFBSSxHQUFHLEVBQUUsQ0FBQyxhQUFhLENBQUMsSUFBSSxDQUFDLENBQUM7WUFDcEMsS0FBSyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztZQUNwQixLQUFLLEdBQUcsS0FBSyxDQUFDLE1BQU0sQ0FBQyxPQUFPLENBQUMsSUFBSSxDQUFDLFFBQVEsQ0FBQyxDQUFDLENBQUM7WUFDN0MsRUFBRSxDQUFDLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUEsQ0FBQztnQkFDWixLQUFLLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO1lBQ3JCLENBQUM7UUFDRixDQUFDLENBQUMsQ0FBQztRQUNILE1BQU0sQ0FBQyxLQUFLLENBQUM7SUFDZCxDQUFDO0lBQUEsQ0FBQztJQUVGLE1BQU0sQ0FBQyxPQUFPLENBQUMsR0FBRyxDQUFDLFFBQVEsQ0FBQyxDQUFDO0FBQzlCLENBQUM7QUF6QmUsZUFBTyxVQXlCdEIsQ0FBQTtBQUFBLENBQUM7O0FDdkRGLFlBQVksQ0FBQztBQUViLElBQVksS0FBSyxXQUFNLFNBQVMsQ0FBQyxDQUFBO0FBUWhDLENBQUM7QUFFRjs7Ozs7OztHQU9HO0FBQ0gsbUJBQWtDLEdBQVEsRUFBRSxNQUFXLEVBQUUsSUFBUyxFQUFFLE9BQTBCO0lBQzdGLElBQU0sSUFBSSxHQUFnQixJQUFJLENBQUM7SUFDL0IsSUFBSSxLQUFLLEdBQUcsR0FBRyxDQUFDLEdBQUcsQ0FBQyxVQUFDLElBQUksRUFBRSxNQUFNO1FBQ2hDLEVBQUUsQ0FBQyxDQUFDLE9BQU8sSUFBSSxLQUFLLFFBQVEsQ0FBQyxDQUFBLENBQUM7WUFDN0IsTUFBTSxDQUFDLElBQUksQ0FBQztRQUNiLENBQUM7UUFBQSxDQUFDO1FBQ0YsSUFBSSxRQUFRLEdBQUcsS0FBSyxDQUFDLFdBQVcsQ0FBQyxJQUFJLENBQUMsQ0FBQztRQUN2QyxFQUFFLENBQUMsQ0FBQyxPQUFPLENBQUMsQ0FBQSxDQUFDO1lBQ1osRUFBRSxDQUFDLENBQUMsT0FBTyxPQUFPLEtBQUssVUFBVSxDQUFDLENBQUEsQ0FBQztnQkFDbEMsUUFBUSxHQUFJLE9BQW9CLENBQUMsUUFBUSxFQUFFLE1BQU0sQ0FBQyxDQUFDO1lBQ3BELENBQUM7WUFBQSxJQUFJLENBQUEsQ0FBQztnQkFDTCxRQUFRLEdBQUcsS0FBSyxDQUFDLE1BQU0sQ0FBQyxRQUFRLEVBQUUsT0FBTyxJQUFJLEVBQUUsQ0FBQyxDQUFDO1lBQ2xELENBQUM7WUFBQSxDQUFDO1FBQ0gsQ0FBQztRQUFBLENBQUM7UUFDRixNQUFNLENBQUMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxJQUFJLENBQUMsT0FBTyxFQUFFLE1BQU0sRUFBRSxJQUFJLEVBQUUsUUFBUSxDQUFDLENBQUM7SUFDN0QsQ0FBQyxDQUFDLENBQUM7SUFDSCxJQUFNLElBQUksR0FBRyxLQUFLLENBQUMsSUFBSSxDQUFDLEVBQUUsQ0FBQyxDQUFDO0lBQzVCLE1BQU0sQ0FBQyxJQUFJLENBQUM7QUFDYixDQUFDO0FBbEJEOzJCQWtCQyxDQUFBO0FBQUEsQ0FBQzs7QUN0Q0YsWUFBWSxDQUFDOzs7O0FBRWIsSUFBWSxRQUFRLFdBQU0sWUFBWSxDQUFDLENBQUE7QUFFdkMsaUJBQWMsa0JBQWtCLENBQUMsRUFBQTtBQUVqQyxnQkFBdUIsR0FBUSxFQUFFLEVBQVk7SUFDNUMsR0FBRyxDQUFDLENBQUMsSUFBSSxDQUFDLElBQUksR0FBRyxDQUFDLENBQUEsQ0FBQztRQUNsQixFQUFFLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxHQUFHLENBQUMsQ0FBQztJQUNwQixDQUFDO0lBQUEsQ0FBQztBQUNILENBQUM7QUFKZSxjQUFNLFNBSXJCLENBQUE7QUFBQSxDQUFDO0FBRUYsZ0JBQXVCLEdBQVcsRUFBRSxFQUFZO0lBQy9DLElBQUksTUFBTSxHQUFRLEVBQUUsQ0FBQztJQUNyQixNQUFNLENBQUMsR0FBRyxFQUFFLFVBQVMsSUFBUyxFQUFFLEVBQVU7UUFDekMsSUFBTSxPQUFPLEdBQUcsRUFBRSxDQUFDLElBQUksRUFBRSxFQUFFLEVBQUUsR0FBRyxDQUFDLENBQUM7UUFDbEMsTUFBTSxDQUFDLEVBQUUsQ0FBQyxHQUFHLE9BQU8sQ0FBQztJQUN0QixDQUFDLENBQUMsQ0FBQztJQUNILE1BQU0sQ0FBQyxNQUFNLENBQUM7QUFDZixDQUFDO0FBUGUsY0FBTSxTQU9yQixDQUFBO0FBQUEsQ0FBQztBQUVGLGlCQUF3QixJQUFtQixFQUFFLEdBQVEsRUFBRSxNQUFZO0lBQ2xFLEVBQUUsQ0FBQyxDQUFDLElBQUksQ0FBQyxNQUFNLEdBQUcsQ0FBQyxDQUFDLENBQUEsQ0FBQztRQUNwQixFQUFFLENBQUMsQ0FBQyxTQUFTLENBQUMsTUFBTSxHQUFHLENBQUMsQ0FBQyxDQUFBLENBQUM7WUFDekIsTUFBTSxrQ0FBa0MsQ0FBQztRQUMxQyxDQUFDO1FBQUEsQ0FBQztRQUNGLE1BQU0sQ0FBQyxHQUFHLENBQUM7SUFDWixDQUFDO0lBQUEsQ0FBQztJQUNGLElBQU0sUUFBUSxHQUFHLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQztJQUN6QixFQUFFLENBQUMsQ0FBQyxJQUFJLENBQUMsTUFBTSxLQUFLLENBQUMsQ0FBQyxDQUFBLENBQUM7UUFDdEIsRUFBRSxDQUFDLENBQUMsU0FBUyxDQUFDLE1BQU0sR0FBRyxDQUFDLENBQUMsQ0FBQSxDQUFDO1lBQ3pCLEdBQUcsQ0FBQyxRQUFRLENBQUMsR0FBRyxNQUFNLENBQUM7UUFDeEIsQ0FBQztRQUFBLENBQUM7UUFDRixNQUFNLENBQUMsR0FBRyxDQUFDLFFBQVEsQ0FBQyxDQUFDO0lBQ3RCLENBQUM7SUFBQSxDQUFDO0lBQ0YsSUFBTSxNQUFNLEdBQUcsR0FBRyxDQUFDLFFBQVEsQ0FBQyxDQUFDO0lBQzdCLEVBQUUsQ0FBQyxDQUFDLE1BQU0sS0FBSyxTQUFTLENBQUMsQ0FBQSxDQUFDO1FBQ3pCLCtEQUErRDtRQUMvRCxNQUFNLENBQUMsU0FBUyxDQUFDLENBQUMsU0FBUztJQUM1QixDQUFDO0lBQUEsQ0FBQztJQUNGLEVBQUUsQ0FBQyxDQUFDLFNBQVMsQ0FBQyxNQUFNLEdBQUcsQ0FBQyxDQUFDLENBQUEsQ0FBQztRQUN6QixNQUFNLENBQUMsT0FBTyxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLEVBQUUsTUFBTSxFQUFFLE1BQU0sQ0FBQyxDQUFDO0lBQy9DLENBQUM7SUFBQSxDQUFDO0lBQ0YsTUFBTSxDQUFDLE9BQU8sQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxFQUFFLE1BQU0sQ0FBQyxDQUFDO0FBQ3ZDLENBQUM7QUF2QmUsZUFBTyxVQXVCdEIsQ0FBQTtBQUFBLENBQUM7QUFFRixxQkFBNEIsR0FBUTtJQUNuQyxJQUFJLEdBQUcsR0FBUSxFQUFFLENBQUM7SUFDbEIsR0FBRyxDQUFDLENBQUMsSUFBSSxDQUFDLElBQUksR0FBRyxDQUFDLENBQUEsQ0FBQztRQUNsQixHQUFHLENBQUMsQ0FBQyxDQUFDLEdBQUcsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDO0lBQ2pCLENBQUM7SUFBQSxDQUFDO0lBQ0YsTUFBTSxDQUFDLEdBQUcsQ0FBQztBQUNaLENBQUM7QUFOZSxtQkFBVyxjQU0xQixDQUFBO0FBQUEsQ0FBQztBQUVGLHVCQUE4QixHQUFVLEVBQUUsT0FBZSxFQUFFLFNBQWlCO0lBQzNFLE9BQU8sR0FBRyxPQUFPLElBQUksS0FBSyxDQUFDO0lBQzNCLFNBQVMsR0FBRyxTQUFTLElBQUksT0FBTyxDQUFDO0lBQ2pDLElBQUksR0FBRyxHQUFRLEVBQUUsQ0FBQztJQUNsQixHQUFHLENBQUMsT0FBTyxDQUFDLFVBQVMsQ0FBQztRQUNyQixHQUFHLENBQUMsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLFNBQVMsQ0FBQyxDQUFDO0lBQ2hDLENBQUMsQ0FBQyxDQUFDO0lBQ0gsTUFBTSxDQUFDLEdBQUcsQ0FBQztBQUNaLENBQUM7QUFSZSxxQkFBYSxnQkFRNUIsQ0FBQTtBQUFBLENBQUM7QUFFRix1QkFBOEIsR0FBUSxFQUFFLE9BQWUsRUFBRSxTQUFpQjtJQUN6RSxPQUFPLEdBQUcsT0FBTyxJQUFJLEtBQUssQ0FBQztJQUMzQixTQUFTLEdBQUcsU0FBUyxJQUFJLE9BQU8sQ0FBQztJQUNqQyxJQUFJLEdBQUcsR0FBVSxFQUFFLENBQUM7SUFDcEIsR0FBRyxDQUFDLENBQUMsSUFBSSxDQUFDLElBQUksR0FBRyxDQUFDLENBQUEsQ0FBQztRQUNsQixJQUFJLElBQUksR0FBUSxFQUFFLENBQUM7UUFDbkIsSUFBSSxDQUFDLE9BQU8sQ0FBQyxHQUFHLENBQUMsQ0FBQztRQUNsQixJQUFJLENBQUMsU0FBUyxDQUFDLEdBQUcsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDO1FBQ3pCLEdBQUcsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUM7SUFDaEIsQ0FBQztJQUFBLENBQUM7SUFDRixNQUFNLENBQUMsR0FBRyxDQUFDO0FBQ1osQ0FBQztBQVhlLHFCQUFhLGdCQVc1QixDQUFBO0FBQUEsQ0FBQztBQUVGLG1CQUEwQixJQUFTLEVBQUUsSUFBUztJQUM3QyxJQUFJLEdBQUcsR0FBRyxXQUFXLENBQUMsSUFBSSxDQUFDLENBQUM7SUFDNUIsR0FBRyxDQUFDLENBQUMsSUFBSSxDQUFDLElBQUksSUFBSSxDQUFDLENBQUEsQ0FBQztRQUNuQixHQUFHLENBQUMsQ0FBQyxDQUFDLEdBQUcsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDO0lBQ2xCLENBQUM7SUFBQSxDQUFDO0lBQ0YsTUFBTSxDQUFDLEdBQUcsQ0FBQztBQUNaLENBQUM7QUFOZSxpQkFBUyxZQU14QixDQUFBO0FBQUEsQ0FBQztBQUVGLGdCQUF1QixJQUFTLEVBQUUsR0FBUTtJQUN6QyxHQUFHLENBQUMsQ0FBQyxJQUFJLENBQUMsSUFBSSxHQUFHLENBQUMsQ0FBQSxDQUFDO1FBQ2xCLElBQUksQ0FBQyxDQUFDLENBQUMsR0FBRyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUM7SUFDbEIsQ0FBQztJQUFBLENBQUM7SUFDRixNQUFNLENBQUMsSUFBSSxDQUFDO0FBQ2IsQ0FBQztBQUxlLGNBQU0sU0FLckIsQ0FBQTtBQUFBLENBQUM7QUFFRixtQkFBMEIsVUFBb0I7SUFDN0MsRUFBRSxDQUFDLENBQUMsVUFBVSxDQUFDLEtBQUssQ0FBQyxLQUFLLENBQUMsQ0FBQSxDQUFDO1FBQzNCLElBQU0sS0FBSyxHQUFHLFVBQVUsQ0FBQyxLQUFLLENBQUMsS0FBSyxDQUFDLEtBQUssQ0FBQyxLQUFLLENBQUMsR0FBRyxDQUFDLENBQUM7UUFDdEQsSUFBTSxNQUFNLEdBQUcsUUFBUSxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsQ0FBQztRQUNwQyxNQUFNLENBQUMsTUFBTSxDQUFDO0lBQ2YsQ0FBQztJQUFBLENBQUM7SUFDRixNQUFNLENBQUMsUUFBUSxDQUFDLElBQUksQ0FBQyxFQUFFLENBQUMsQ0FBQztBQUMxQixDQUFDO0FBUGUsaUJBQVMsWUFPeEIsQ0FBQTtBQUFBLENBQUM7QUFFRixtQkFBMEIsR0FBVztJQUNwQyxFQUFFLENBQUMsQ0FBQyxPQUFPLEdBQUcsS0FBSyxRQUFRLENBQUMsQ0FBQSxDQUFDO1FBQzVCLElBQU0sR0FBRyxHQUFHLEtBQUssQ0FBQyxPQUFPLENBQUMsR0FBRyxDQUFDO2NBQzNCLEdBQUcsQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQztjQUNqQixNQUFNLENBQUMsSUFBSSxDQUFDLElBQUksRUFBRSxHQUFHLENBQUMsQ0FBQztRQUMxQixNQUFNLENBQUMsR0FBRyxDQUFDLFNBQVMsQ0FBQyxDQUFDO0lBQ3ZCLENBQUM7SUFBQSxDQUFDO0lBQ0YsTUFBTSxDQUFDLEdBQUcsQ0FBQztBQUNaLENBQUM7QUFSZSxpQkFBUyxZQVF4QixDQUFBO0FBQUEsQ0FBQztBQUVGLG9CQUEyQixJQUFZO0lBQ3RDLE1BQU0sQ0FBQyxJQUFJO1NBQ1QsT0FBTyxDQUFDLElBQUksRUFBQyxRQUFRLENBQUM7U0FDdEIsT0FBTyxDQUFDLElBQUksRUFBQyxPQUFPLENBQUM7U0FDckIsT0FBTyxDQUFDLElBQUksRUFBQyxNQUFNLENBQUM7U0FDcEIsT0FBTyxDQUFDLElBQUksRUFBQyxNQUFNLENBQUMsQ0FBQztBQUN4QixDQUFDO0FBTmUsa0JBQVUsYUFNekIsQ0FBQTtBQUFBLENBQUM7OztBQ3JIRixJQUFZLEtBQUssV0FBTSxVQUFVLENBQUMsQ0FBQTtBQUVsQyxJQUFJLGVBQWUsR0FBRyxDQUFDLE1BQU0sRUFBRSxNQUFNLEVBQUUsSUFBSSxFQUFFLEtBQUs7SUFDakQsU0FBUyxFQUFFLE9BQU8sRUFBRSxJQUFJLEVBQUUsS0FBSztJQUMvQixPQUFPLEVBQUUsUUFBUSxFQUFFLE1BQU07SUFDekIsTUFBTSxFQUFFLE9BQU8sRUFBRSxRQUFRLEVBQUUsT0FBTztJQUNsQyxLQUFLLENBQUMsQ0FBQztBQUtQLENBQUM7QUFNRCxDQUFDO0FBRUYsbUJBQTBCLE9BQWlCO0lBQzFDLElBQUksS0FBSyxHQUFHLE9BQU8sQ0FBQyxLQUFLLENBQUM7SUFDMUIsRUFBRSxDQUFDLENBQUMsQ0FBQyxLQUFLLENBQUMsT0FBTyxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUEsQ0FBQztRQUMxQixLQUFLLEdBQUcsS0FBSyxDQUFDLGFBQWEsQ0FBQyxLQUFLLEVBQUUsTUFBTSxFQUFFLE9BQU8sQ0FBQyxDQUFDO0lBQ3JELENBQUM7SUFBQSxDQUFDO0lBQ0YsSUFBSSxRQUFRLEdBQUcsRUFBRSxDQUFDO0lBQ2xCLEVBQUUsQ0FBQyxDQUFDLEtBQUssQ0FBQyxNQUFNLEdBQUcsQ0FBQyxDQUFDLENBQUEsQ0FBQztRQUNsQixRQUFRLEdBQUcsR0FBRyxHQUFHLEtBQUssQ0FBQyxHQUFHLENBQUMsVUFBUyxJQUFXO1lBQ2hELE1BQU0sQ0FBQyxJQUFJLENBQUMsSUFBSSxHQUFHLElBQUksR0FBRyxJQUFJLENBQUMsS0FBSyxHQUFHLEdBQUcsQ0FBQztRQUMzQyxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLENBQUM7SUFDaEIsQ0FBQztJQUFBLENBQUM7SUFDRixJQUFNLE9BQU8sR0FBRyxPQUFPLENBQUMsSUFBSSxHQUFHLFFBQVEsQ0FBQztJQUN4QyxFQUFFLENBQUMsQ0FBQyxDQUFDLGVBQWUsQ0FBQyxPQUFPLENBQUMsT0FBTyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUEsQ0FBQztRQUMzQyxNQUFNLENBQUMsR0FBRyxHQUFHLE9BQU8sR0FBRyxLQUFLLENBQUM7SUFDOUIsQ0FBQztJQUFBLENBQUM7SUFDRixJQUFNLE9BQU8sR0FBRyxHQUFHLEdBQUcsT0FBTyxHQUFHLEdBQUcsQ0FBQztJQUNwQyxJQUFNLFFBQVEsR0FBRyxJQUFJLEdBQUcsT0FBTyxDQUFDLElBQUksR0FBRyxHQUFHLENBQUM7SUFDM0MsSUFBTSxJQUFJLEdBQUcsT0FBTyxHQUFHLENBQUMsT0FBTyxDQUFDLFNBQVMsSUFBSSxFQUFFLENBQUMsR0FBRyxRQUFRLENBQUM7SUFDNUQsTUFBTSxDQUFDLElBQUksQ0FBQztBQUNiLENBQUM7QUFuQmUsaUJBQVMsWUFtQnhCLENBQUE7QUFBQSxDQUFDOzs7QUN0Q0Ysa0JBQWtCLElBQUksRUFBRSxNQUFNLEVBQUUsSUFBSTtJQUNoQyxJQUFJLENBQUMsUUFBUSxHQUFHLElBQUksSUFBSSxPQUFPO1VBQ3pCLEVBQUU7VUFDRixFQUFFLENBQUM7SUFDVCxJQUFJLENBQUMsTUFBTSxHQUFHLE1BQU0sQ0FBQztJQUNyQixJQUFJLENBQUMsSUFBSSxHQUFHLElBQUksQ0FBQztJQUNqQixJQUFJLENBQUMsVUFBVSxHQUFHLENBQUMsQ0FBQztBQUN4QixDQUFDO0FBQUEsQ0FBQztBQUVGLFFBQVEsQ0FBQyxTQUFTLENBQUMsUUFBUSxHQUFHLFVBQVMsSUFBSSxFQUFFLElBQUk7SUFDN0MsRUFBRSxDQUFDLENBQUMsSUFBSSxDQUFDLElBQUksSUFBSSxPQUFPLENBQUMsQ0FBQSxDQUFDO1FBQ3RCLElBQUksR0FBRyxJQUFJLENBQUM7UUFDWixJQUFJLEdBQUcsSUFBSSxDQUFDLFFBQVEsQ0FBQyxNQUFNLENBQUM7SUFDaEMsQ0FBQztJQUFBLENBQUM7SUFDRixJQUFJLEdBQUcsSUFBSSxJQUFJLElBQUksQ0FBQyxJQUFJLENBQUMsWUFBWSxFQUFFLENBQUM7SUFDeEMsSUFBSSxLQUFLLEdBQUcsSUFBSSxRQUFRLENBQUMsSUFBSSxDQUFDLElBQUksRUFBRSxJQUFJLEVBQUUsSUFBSSxDQUFDLENBQUM7SUFDaEQsS0FBSyxDQUFDLEVBQUUsR0FBRyxJQUFJLENBQUM7SUFDaEIsS0FBSyxDQUFDLElBQUksR0FBRyxJQUFJLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUM7SUFDdEMsS0FBSyxDQUFDLElBQUksR0FBRyxJQUFJLENBQUMsSUFBSSxDQUFDO0lBQ3ZCLElBQUksQ0FBQyxVQUFVLEVBQUUsQ0FBQztJQUNsQixJQUFJLENBQUMsUUFBUSxDQUFDLElBQUksQ0FBQyxHQUFHLEtBQUssQ0FBQztJQUM1QixNQUFNLENBQUMsS0FBSyxDQUFDO0FBQ2pCLENBQUMsQ0FBQztBQUVGLFFBQVEsQ0FBQyxTQUFTLENBQUMsVUFBVSxHQUFHO0lBQzVCLElBQUksR0FBRyxHQUFHLEVBQUUsQ0FBQztJQUNiLElBQUksSUFBSSxHQUFHLElBQUksQ0FBQztJQUNoQixPQUFPLElBQUksRUFBQyxDQUFDO1FBQ1QsSUFBSSxHQUFHLElBQUksQ0FBQyxNQUFNLENBQUM7UUFDbkIsRUFBRSxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsQ0FBQSxDQUFDO1lBQ1AsTUFBTSxDQUFDLEdBQUcsQ0FBQztRQUNmLENBQUM7UUFBQSxDQUFDO1FBQ0YsR0FBRyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQztJQUNuQixDQUFDO0lBQUEsQ0FBQztBQUNOLENBQUMsQ0FBQztBQUVGLFFBQVEsQ0FBQyxTQUFTLENBQUMsWUFBWSxHQUFHLFVBQVMsRUFBRTtJQUN6QyxHQUFHLENBQUMsQ0FBQyxJQUFJLENBQUMsSUFBSSxJQUFJLENBQUMsUUFBUSxDQUFDLENBQUEsQ0FBQztRQUN6QixFQUFFLENBQUMsSUFBSSxDQUFDLElBQUksRUFBRSxJQUFJLENBQUMsUUFBUSxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDO0lBQ3ZDLENBQUM7SUFBQSxDQUFDO0FBQ04sQ0FBQyxDQUFDO0FBRUYsUUFBUSxDQUFDLFNBQVMsQ0FBQyxXQUFXLEdBQUc7SUFDN0IsRUFBRSxDQUFDLENBQUMsSUFBSSxDQUFDLElBQUksSUFBSSxPQUFPLENBQUMsQ0FBQSxDQUFDO1FBQ3RCLE1BQU0sQ0FBQyxJQUFJLENBQUMsUUFBUSxDQUFDO0lBQ3pCLENBQUM7SUFBQSxDQUFDO0lBQ0YsSUFBSSxHQUFHLEdBQUcsRUFBRSxDQUFDO0lBQ2IsSUFBSSxDQUFDLFlBQVksQ0FBQyxVQUFTLEtBQUs7UUFDNUIsR0FBRyxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsQ0FBQztJQUNwQixDQUFDLENBQUMsQ0FBQztJQUNILE1BQU0sQ0FBQyxHQUFHLENBQUM7QUFDZixDQUFDLENBQUM7QUFFRixRQUFRLENBQUMsU0FBUyxDQUFDLGVBQWUsR0FBRztJQUNqQyxJQUFJLEdBQUcsR0FBRyxJQUFJLENBQUMsV0FBVyxFQUFFLENBQUM7SUFDN0IsSUFBSSxDQUFDLFlBQVksQ0FBQyxVQUFTLEtBQUs7UUFDN0IsR0FBRyxHQUFHLEdBQUcsQ0FBQyxNQUFNLENBQUMsS0FBSyxDQUFDLGVBQWUsRUFBRSxDQUFDLENBQUM7SUFDN0MsQ0FBQyxDQUFDLENBQUM7SUFDSCxNQUFNLENBQUMsR0FBRyxDQUFDO0FBQ2YsQ0FBQyxDQUFDO0FBRUYsUUFBUSxDQUFDLFNBQVMsQ0FBQyxNQUFNLEdBQUcsVUFBUyxJQUFJO0lBQ3JDLElBQUksT0FBTyxHQUFHLElBQUksQ0FBQyxJQUFJLENBQUMsTUFBTSxHQUFHLENBQUMsQ0FBQyxDQUFDO0lBQ3BDLElBQUksVUFBVSxHQUFHLElBQUksQ0FBQyxLQUFLLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUM7SUFDbkMsSUFBSSxNQUFNLEdBQUcsSUFBSSxDQUFDLE1BQU0sQ0FBQyxVQUFVLENBQUMsQ0FBQztJQUNyQyxNQUFNLENBQUMsVUFBVSxFQUFFLENBQUM7SUFDcEIsSUFBSSxHQUFHLEdBQUcsTUFBTSxDQUFDLFFBQVEsQ0FBQyxPQUFPLENBQUMsQ0FBQztJQUNuQyxPQUFPLE1BQU0sQ0FBQyxRQUFRLENBQUMsT0FBTyxDQUFDLENBQUM7SUFDaEMsTUFBTSxDQUFDLEdBQUcsQ0FBQztBQUNmLENBQUMsQ0FBQztBQUVGLFFBQVEsQ0FBQyxTQUFTLENBQUMsTUFBTSxHQUFHLFVBQVMsSUFBSTtJQUNyQyxFQUFFLENBQUMsQ0FBQyxJQUFJLENBQUMsTUFBTSxJQUFJLENBQUMsQ0FBQyxDQUFBLENBQUM7UUFDbEIsTUFBTSxDQUFDLElBQUksQ0FBQztJQUNoQixDQUFDO0lBQUEsQ0FBQztJQUNGLElBQUksSUFBSSxHQUFHLElBQUksQ0FBQztJQUNoQixPQUFPLElBQUksRUFBQyxDQUFDO1FBQ1QsSUFBSSxHQUFHLEdBQUcsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDO1FBQ2xCLElBQUksR0FBRyxJQUFJLENBQUMsUUFBUSxDQUFDLEdBQUcsQ0FBQyxDQUFDO1FBQzFCLEVBQUUsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLENBQUEsQ0FBQztZQUNQLE1BQU0sQ0FBQyxJQUFJLENBQUM7UUFDaEIsQ0FBQztRQUFBLENBQUM7UUFDRixJQUFJLEdBQUcsSUFBSSxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQztRQUNyQixFQUFFLENBQUMsQ0FBQyxJQUFJLENBQUMsTUFBTSxJQUFJLENBQUMsQ0FBQyxDQUFBLENBQUM7WUFDbEIsTUFBTSxDQUFDLElBQUksQ0FBQztRQUNoQixDQUFDO1FBQUEsQ0FBQztJQUNOLENBQUM7SUFBQSxDQUFDO0FBQ04sQ0FBQyxDQUFDO0FBRUYsUUFBUSxDQUFDLFNBQVMsQ0FBQyxNQUFNLEdBQUcsVUFBUyxJQUFJO0lBQ3JDLEVBQUUsQ0FBQyxDQUFDLElBQUksQ0FBQyxNQUFNLElBQUksQ0FBQyxDQUFDLENBQUEsQ0FBQztRQUNsQixNQUFNLENBQUMsSUFBSSxDQUFDO0lBQ2hCLENBQUM7SUFBQSxDQUFDO0lBQ0YsSUFBSSxJQUFJLEdBQUcsSUFBSSxDQUFDO0lBQ2hCLE9BQU8sSUFBSSxFQUFDLENBQUM7UUFDVCxJQUFJLEdBQUcsR0FBRyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUM7UUFDbEIsSUFBSSxNQUFNLEdBQUcsSUFBSSxDQUFDO1FBQ2xCLElBQUksR0FBRyxJQUFJLENBQUMsUUFBUSxDQUFDLEdBQUcsQ0FBQyxDQUFDO1FBQzFCLEVBQUUsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLENBQUEsQ0FBQztZQUNQLElBQUksSUFBSSxHQUFHLElBQUksQ0FBQyxJQUFJLENBQUMsWUFBWSxFQUFFLENBQUM7WUFDcEMsSUFBSSxHQUFHLE1BQU0sQ0FBQyxRQUFRLENBQUMsR0FBRyxFQUFFLElBQUksQ0FBQyxDQUFDO1lBQ2xDLE1BQU0sQ0FBQyxRQUFRLENBQUMsR0FBRyxDQUFDLEdBQUcsSUFBSSxDQUFDO1FBQ2hDLENBQUM7UUFBQSxDQUFDO1FBQ0YsSUFBSSxHQUFHLElBQUksQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUM7UUFDckIsRUFBRSxDQUFDLENBQUMsSUFBSSxDQUFDLE1BQU0sSUFBSSxDQUFDLENBQUMsQ0FBQSxDQUFDO1lBQ2xCLE1BQU0sQ0FBQyxJQUFJLENBQUM7UUFDaEIsQ0FBQztRQUFBLENBQUM7SUFDTixDQUFDO0lBQUEsQ0FBQztBQUNOLENBQUMsQ0FBQztBQUVGLG9CQUFtQyxJQUFJLEVBQUUsUUFBUTtJQUM3QyxJQUFJLEdBQUcsSUFBSSxJQUFJLEVBQUUsQ0FBQztJQUNsQixJQUFJLENBQUMsSUFBSSxHQUFHLElBQUksQ0FBQyxJQUFJLElBQUksT0FBTyxDQUFDO0lBQ2pDLElBQUksWUFBWSxHQUFHLElBQUksQ0FBQyxZQUFZLElBQUk7UUFDcEMsTUFBTSxDQUFDLEVBQUUsQ0FBQztJQUNkLENBQUMsQ0FBQztJQUNGLElBQUksSUFBSSxHQUFHLFFBQVEsSUFBSSxZQUFZLEVBQUUsQ0FBQztJQUN0QyxJQUFJLFlBQVksR0FBRyxJQUFJLFFBQVEsQ0FBQyxJQUFJLENBQUMsSUFBSSxFQUFFLElBQUksRUFBRSxJQUFJLENBQUMsQ0FBQztJQUN2RCxZQUFZLENBQUMsTUFBTSxHQUFHLElBQUksQ0FBQztJQUMzQixZQUFZLENBQUMsSUFBSSxHQUFHLFlBQVksQ0FBQztJQUNqQyxZQUFZLENBQUMsSUFBSSxHQUFHLEVBQUUsQ0FBQztJQUN2QixZQUFZLENBQUMsWUFBWSxHQUFHLFlBQVksQ0FBQztJQUN6QyxNQUFNLENBQUMsWUFBWSxDQUFDO0FBQ3hCLENBQUM7QUFiRDs0QkFhQyxDQUFBO0FBQUEsQ0FBQzs7QUMzSEYsWUFBWSxDQUFDO0FBRWIsSUFBWSxLQUFLLFdBQU0sU0FBUyxDQUFDLENBQUE7QUFRaEMsQ0FBQztBQUVGOzs7OztHQUtHO0FBQ0gsY0FBcUIsS0FBb0IsRUFBRSxTQUFrQjtJQUM1RCxJQUFJLE1BQU0sR0FBRyxNQUFNLENBQUM7SUFDcEIsSUFBSSxJQUFJLEdBQUcsS0FBSyxDQUFDLEdBQUcsQ0FBQyxVQUFTLElBQUk7UUFDakMsd0JBQXdCO1FBQ3hCLFlBQVk7UUFDWixzQkFBc0I7UUFDdEIsTUFBTTtRQUNOLEtBQUs7UUFDTCxNQUFNLENBQUMsSUFBSSxDQUFDO0lBQ2IsQ0FBQyxDQUFDLENBQUM7SUFDSCxJQUFNLEdBQUcsR0FBZTtRQUN2QixRQUFRLEVBQUUsTUFBTTtRQUNoQixNQUFNLEVBQUUsSUFBSTtRQUNaLFNBQVMsRUFBRSxJQUFJO0tBQ2YsQ0FBQztJQUNGLEVBQUUsQ0FBQyxDQUFDLFNBQVMsQ0FBQyxDQUFBLENBQUM7UUFDZCxLQUFLLENBQUMsTUFBTSxDQUFDLEdBQUcsRUFBRSxTQUFTLENBQUMsQ0FBQztJQUM5QixDQUFDO0lBQUEsQ0FBQztJQUNGLE1BQU0sQ0FBQyxHQUFHLENBQUM7QUFDWixDQUFDO0FBbkJlLFlBQUksT0FtQm5CLENBQUE7QUFBQSxDQUFDO0FBRUY7Ozs7O0dBS0c7QUFDSCxlQUFzQixHQUFXLEVBQUUsU0FBa0I7SUFDcEQsSUFBTSxLQUFLLEdBQUcsR0FBRyxDQUFDLElBQUksRUFBRSxDQUFDLEtBQUssQ0FBQyxHQUFHLENBQUMsQ0FBQztJQUNwQyxNQUFNLENBQUMsSUFBSSxDQUFDLEtBQUssRUFBRSxTQUFTLENBQUMsQ0FBQztBQUMvQixDQUFDO0FBSGUsYUFBSyxRQUdwQixDQUFBO0FBQUEsQ0FBQztBQUVGOzs7O0dBSUc7QUFDSCx1QkFBdUIsSUFBUztJQUMvQixJQUFJLE1BQU0sR0FBRyxJQUFJLENBQUMsTUFBTSxDQUFDO0lBQ3pCLE9BQU8sSUFBSSxFQUFDLENBQUM7UUFDWixFQUFFLENBQUMsQ0FBQyxDQUFDLE1BQU0sQ0FBQyxDQUFBLENBQUM7WUFDWixNQUFNLENBQUMsRUFBRSxDQUFDO1FBQ1gsQ0FBQztRQUFBLENBQUM7UUFDRixFQUFFLENBQUMsQ0FBQyxNQUFNLENBQUMsU0FBUyxDQUFDLENBQUEsQ0FBQztZQUNyQixNQUFNLENBQUMsTUFBTSxDQUFDLFNBQVMsQ0FBQztRQUN6QixDQUFDO1FBQUEsQ0FBQztRQUNGLE1BQU0sR0FBRyxNQUFNLENBQUMsTUFBTSxDQUFDO0lBQ3hCLENBQUM7SUFBQSxDQUFDO0FBQ0gsQ0FBQztBQUFBLENBQUM7QUFFRjs7Ozs7R0FLRztBQUNILHFCQUE0QixJQUFTLEVBQUUsSUFBZ0I7SUFDdEQsSUFBTSxTQUFTLEdBQUcsYUFBYSxDQUFDLElBQUksQ0FBQyxDQUFDO0lBQ3RDLElBQUksR0FBRyxHQUFlO1FBQ3JCLElBQUksRUFBRSxJQUFJO1FBQ1YsTUFBTSxFQUFFLE1BQU07UUFDZCxPQUFPLEVBQUUsSUFBSSxDQUFDLE9BQU87S0FDckIsQ0FBQztJQUNGLEdBQUcsQ0FBQyxJQUFJLEdBQUcsU0FBUyxDQUFDLEtBQUssRUFBRSxDQUFDO0lBQzdCLElBQUksQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDLFVBQVMsR0FBRztRQUM3QixFQUFFLENBQUMsQ0FBQyxPQUFPLEdBQUcsQ0FBQyxDQUFDLENBQUMsS0FBSyxHQUFHLENBQUMsQ0FBQSxDQUFDO1lBQzFCLEdBQUcsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxDQUFDO1lBQ25CLE1BQU0sQ0FBQztRQUNSLENBQUM7UUFBQSxDQUFDO1FBQ0YsRUFBRSxDQUFDLENBQUMsR0FBRyxLQUFLLE9BQU8sQ0FBQyxDQUFBLENBQUM7WUFDcEIsR0FBRyxDQUFDLElBQUksR0FBRyxFQUFFLENBQUM7UUFDZixDQUFDO1FBQUMsSUFBSSxDQUFDLEVBQUUsQ0FBQyxDQUFDLEdBQUcsS0FBSyxLQUFLLENBQUMsQ0FBQSxDQUFDO1lBQ3pCLEdBQUcsQ0FBQyxJQUFJLENBQUMsR0FBRyxFQUFFLENBQUM7UUFDaEIsQ0FBQztRQUFBLENBQUM7SUFDSCxDQUFDLENBQUMsQ0FBQztJQUNILE1BQU0sQ0FBQyxHQUFHLENBQUM7QUFDWixDQUFDO0FBcEJlLG1CQUFXLGNBb0IxQixDQUFBO0FBQUEsQ0FBQztBQUVGOzs7Ozs7R0FNRztBQUNILGtCQUF5QixJQUFTLEVBQUUsSUFBWSxFQUFFLFNBQXFCO0lBQ3RFLElBQU0sV0FBVyxHQUFRO1FBQ3hCLE1BQU0sRUFBRSxJQUFJO1FBQ1osTUFBTSxFQUFFLElBQUk7S0FDWixDQUFDO0lBQ0YsSUFBTSxVQUFVLEdBQVcsV0FBVyxDQUFDLFNBQVMsQ0FBQyxNQUFNLENBQUMsQ0FBQztJQUN6RCxJQUFNLEdBQUcsR0FBRyxLQUFLLENBQUMsT0FBTyxDQUFDLFNBQVMsQ0FBQyxJQUFJLEVBQUUsVUFBVSxDQUFDLENBQUM7SUFDdEQsTUFBTSxDQUFDLEdBQUcsQ0FBQztBQUNaLENBQUM7QUFSZSxnQkFBUSxXQVF2QixDQUFBO0FBQUEsQ0FBQztBQUVGOzs7Ozs7R0FNRztBQUNILGdCQUF1QixJQUFTLEVBQUUsSUFBWSxFQUFFLFlBQXdCO0lBQ3ZFLElBQUksSUFBSSxHQUFHLFFBQVEsQ0FBQyxJQUFJLEVBQUUsSUFBSSxFQUFFLFlBQVksQ0FBQyxDQUFDLFFBQVEsRUFBRSxDQUFDO0lBQ3pELEVBQUUsQ0FBQyxDQUFDLFlBQVksQ0FBQyxPQUFPLENBQUMsQ0FBQSxDQUFDO1FBQ3pCLElBQUksR0FBRyxLQUFLLENBQUMsVUFBVSxDQUFDLElBQUksQ0FBQyxDQUFDO0lBQy9CLENBQUM7SUFBQSxDQUFDO0lBQ0YsTUFBTSxDQUFDLElBQUksQ0FBQztBQUNiLENBQUM7QUFOZSxjQUFNLFNBTXJCLENBQUE7QUFBQSxDQUFDO0FBRUY7Ozs7OztHQU1HO0FBQ0gsMEJBQWlDLElBQVMsRUFBRSxJQUFZLEVBQUUsSUFBZ0I7SUFDekUsSUFBSSxZQUFZLEdBQUcsV0FBVyxDQUFDLElBQUksRUFBRSxJQUFJLENBQUMsQ0FBQztJQUMzQyxNQUFNLENBQUMsTUFBTSxDQUFDLElBQUksRUFBRSxJQUFJLEVBQUUsWUFBWSxDQUFDLENBQUM7QUFDekMsQ0FBQztBQUhlLHdCQUFnQixtQkFHL0IsQ0FBQTtBQUFBLENBQUMiLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXNDb250ZW50IjpbIihmdW5jdGlvbiBlKHQsbixyKXtmdW5jdGlvbiBzKG8sdSl7aWYoIW5bb10pe2lmKCF0W29dKXt2YXIgYT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2lmKCF1JiZhKXJldHVybiBhKG8sITApO2lmKGkpcmV0dXJuIGkobywhMCk7dmFyIGY9bmV3IEVycm9yKFwiQ2Fubm90IGZpbmQgbW9kdWxlICdcIitvK1wiJ1wiKTt0aHJvdyBmLmNvZGU9XCJNT0RVTEVfTk9UX0ZPVU5EXCIsZn12YXIgbD1uW29dPXtleHBvcnRzOnt9fTt0W29dWzBdLmNhbGwobC5leHBvcnRzLGZ1bmN0aW9uKGUpe3ZhciBuPXRbb11bMV1bZV07cmV0dXJuIHMobj9uOmUpfSxsLGwuZXhwb3J0cyxlLHQsbixyKX1yZXR1cm4gbltvXS5leHBvcnRzfXZhciBpPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7Zm9yKHZhciBvPTA7bzxyLmxlbmd0aDtvKyspcyhyW29dKTtyZXR1cm4gc30pIiwidmFyIGdhcFJlID0gL1xcW1xcIShcXHcrKVxcXS9nO1xyXG5cclxuZnVuY3Rpb24gUmVUcGwocmVUcGwsIHBhcnRzKXsgICAgXHJcbiAgICB2YXIgc291cmNlID0gcmVUcGwuc291cmNlO1xyXG4gICAgdGhpcy5tYXAgPSBbXTtcclxuICAgIHZhciBzZWxmID0gdGhpcztcclxuICAgIHZhciBuZXdTb3VyY2UgPSBzb3VyY2UucmVwbGFjZShnYXBSZSwgZnVuY3Rpb24oc3ViU3RyLCBuYW1lKXtcclxuICAgICAgICBzZWxmLm1hcC5wdXNoKG5hbWUpO1xyXG4gICAgICAgIHJldHVybiAnKCcgKyBwYXJ0c1tuYW1lXS5zb3VyY2UgKyAnKSc7XHJcbiAgICB9KTtcclxuICAgIHZhciBmbGFncyA9IHJlVHBsLmdsb2JhbCA/ICdnJyA6ICcnXHJcbiAgICAgICAgKyByZVRwbC5tdWx0aWxpbmUgPyAnbScgOiAnJ1xyXG4gICAgICAgICsgcmVUcGwuaWdub3JlQ2FzZSA/ICdpJyA6ICcnO1xyXG4gICAgdGhpcy5yZSA9IG5ldyBSZWdFeHAobmV3U291cmNlLCBmbGFncyk7XHJcbn07XHJcblxyXG5SZVRwbC5wcm90b3R5cGUuZmluZCA9IGZ1bmN0aW9uKHN0ciwgb2Zmc2V0KXsgIFxyXG4gICAgdmFyIHNlbGYgPSB0aGlzO1xyXG4gICAgdGhpcy5yZS5sYXN0SW5kZXggPSBvZmZzZXQgfHwgMDtcclxuICAgIHZhciByZXMgPSB0aGlzLnJlLmV4ZWMoc3RyKTtcclxuICAgIGlmICghcmVzKXtcclxuICAgICAgICByZXR1cm4gbnVsbDsgIFxyXG4gICAgfTtcclxuICAgIHZhciByZXNPYmogPSB7XHJcbiAgICAgICAgZnVsbDogcmVzWzBdLFxyXG4gICAgICAgIHBhcnRzOiB7fVxyXG4gICAgfTtcclxuICAgIHJlcy5zbGljZSgxKS5mb3JFYWNoKGZ1bmN0aW9uKHBhcnQsIGlkKXtcclxuICAgICAgICB2YXIga2V5ID0gc2VsZi5tYXBbaWRdO1xyXG4gICAgICAgIHJlc09iai5wYXJ0c1trZXldID0gcGFydCB8fCBudWxsO1xyXG4gICAgfSk7XHJcbiAgICByZXR1cm4gcmVzT2JqO1xyXG59O1xyXG5cclxuUmVUcGwucHJvdG90eXBlLmZpbmRBbGwgPSBmdW5jdGlvbihzdHIsIG9mZnNldCl7ICBcclxuICAgIHZhciByZXMgPSBbXTtcclxuICAgIHRoaXMucmUubGFzdEluZGV4ID0gb2Zmc2V0IHx8IDA7XHJcbiAgICB3aGlsZSAodHJ1ZSl7XHJcbiAgICAgICAgdmFyIGZvdW5kID0gdGhpcy5maW5kKHN0ciwgdGhpcy5yZS5sYXN0SW5kZXgpO1xyXG4gICAgICAgIGlmICghZm91bmQpe1xyXG4gICAgICAgICAgICByZXR1cm4gcmVzO1xyXG4gICAgICAgIH07XHJcbiAgICAgICAgcmVzLnB1c2goZm91bmQpO1xyXG4gICAgfTtcclxuICAgIHJldHVybiByZXM7IC8vIG5ldmVyIGdvIHRoZXJlXHJcbn07XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IFJlVHBsOyIsIi8vZm9yIHRlc3RzOlxyXG4vL3dpbmRvdy5taiA9IHt9O1xyXG4vL2V4cG9ydHMgPSBtajtcclxuXHJcbmV4cG9ydHMucGFyc2UgPSByZXF1aXJlKCcuL3BhcnNlci5qcycpLnBhcnNlO1xyXG5leHBvcnRzLnJlbmRlciA9IHJlcXVpcmUoJy4vcmVuZGVyLmpzJykucmVuZGVyO1xyXG5leHBvcnRzLnJlbmRlcldyYXBwZXIgPSByZXF1aXJlKCcuL3JlbmRlci5qcycpLnJlbmRlcldyYXBwZXI7XHJcblxyXG5leHBvcnRzLm1ha2UgPSBmdW5jdGlvbihjb2RlLCBkYXRhKXtcclxuXHR2YXIgcGFyc2VkID0gZXhwb3J0cy5wYXJzZShjb2RlKTtcclxuXHRyZXR1cm4gZXhwb3J0cy5yZW5kZXIocGFyc2VkLCBkYXRhKTtcclxufTsiLCJmdW5jdGlvbiBwYXJzZVRhYlRyZWUoY29kZSwgb3B0cyl7ICAgIFxyXG5cclxuXHRmdW5jdGlvbiBOb2RlKHBhcmVudCwgY29kZSl7XHJcblx0XHR0aGlzLnBhcmVudCA9IHBhcmVudDtcclxuXHRcdGlmIChwYXJlbnQpe1xyXG5cdFx0XHRwYXJlbnQuY2hpbGRyZW4ucHVzaCh0aGlzKTtcclxuXHRcdH07XHJcblx0XHR0aGlzLmNvZGUgPSBjb2RlO1xyXG5cdFx0dGhpcy5jaGlsZHJlbiA9IFtdO1xyXG5cdFx0dGhpcy5pbm5lckNvZGUgPSAnJztcclxuXHR9O1xyXG5cclxuXHRvcHRzID0gb3B0cyB8fCB7XHJcblx0XHR0YWJMZW46IDRcclxuXHR9O1xyXG5cclxuXHRmdW5jdGlvbiByZXBlYXQoc3RyLCB0aW1lcyl7XHJcblx0XHR2YXIgcmVzID0gJyc7XHJcblx0XHR2YXIgaSA9IHRpbWVzO1xyXG5cdFx0d2hpbGUgKGktLSl7XHJcblx0XHRcdHJlcyArPSAnICc7XHJcblx0XHR9XHJcblx0XHRyZXR1cm4gcmVzO1xyXG5cdH07XHJcblxyXG5cdHZhciB0YWJTdHIgPSByZXBlYXQoJyAnLCBvcHRzLnRhYkxlbik7XHJcblx0dmFyIGFzdCA9IG5ldyBOb2RlKG51bGwsIG51bGwpO1xyXG5cdHZhciBzdGFjayA9IFt7XHJcblx0XHRub2RlOiBhc3QsXHJcblx0XHRvZmZzZXQ6IC0xXHJcblx0fV07XHJcblx0dmFyIGxpbmVzID0gY29kZS5zcGxpdCgnXFxuJyk7XHJcblxyXG5cdGxpbmVzLmZvckVhY2goZnVuY3Rpb24obGluZSwgbnVtKXtcclxuXHRcdHZhciB0YWIgPSAvXltcXCBcXHRdKi8uZXhlYyhsaW5lKVswXTsgICAgICAgIFxyXG5cdFx0dmFyIG9mZnNldCA9IHRhYi5yZXBsYWNlKC9cXHQvZywgdGFiU3RyKS5sZW5ndGggLyBvcHRzLnRhYkxlbjtcclxuXHRcdHN0YWNrID0gc3RhY2suZmlsdGVyKGZ1bmN0aW9uKHBhcmVudCl7XHJcblx0XHQgICByZXR1cm4gb2Zmc2V0ID4gcGFyZW50Lm9mZnNldDsgXHJcblx0XHR9KTtcclxuXHRcdHZhciBwYXJlbnQgPSBzdGFjay5zbGljZSgtMSlbMF07XHJcblx0XHR2YXIgbm9kZSA9IG5ldyBOb2RlKHBhcmVudC5ub2RlLCBsaW5lLnNsaWNlKHRhYi5sZW5ndGgpKTtcclxuXHRcdHN0YWNrLmZvckVhY2goZnVuY3Rpb24ocGFyZW50KXtcclxuXHRcdFx0cGFyZW50Lm5vZGUuaW5uZXJDb2RlICs9IGxpbmUgKyAnXFxuJztcclxuXHRcdH0pO1xyXG5cdFx0bm9kZS5udW0gPSBudW07XHJcblx0XHRub2RlLm9mZnNldCA9IG9mZnNldDtcclxuXHRcdHN0YWNrLnB1c2goe1xyXG5cdFx0XHRub2RlOiBub2RlLFxyXG5cdFx0XHRvZmZzZXQ6IG9mZnNldFxyXG5cdFx0fSk7XHJcblx0fSk7XHJcblxyXG5cdHJldHVybiBhc3Q7XHJcbn07XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IHBhcnNlVGFiVHJlZTsiLCJcInVzZSBzdHJpY3RcIjtcclxuXHJcbnZhciBSZVRwbCA9IHJlcXVpcmUoJy4vUmVUcGwuanMnKTtcclxudmFyIHBhcnNlVGFiVHJlZSA9IHJlcXVpcmUoJy4vcGFyc2VUYWJUcmVlLmpzJyk7XHJcblxyXG52YXIgZ2FwUmUgPSAvXFxbXFwhKFxcdyspXFxdL2c7XHJcblxyXG5mdW5jdGlvbiBtYWtlUmUoZGljdCwgcmUpe1xyXG5cdHZhciBzb3VyY2UgPSByZS5zb3VyY2U7XHJcblx0dmFyIG5ld1NvdXJjZSA9IHNvdXJjZS5yZXBsYWNlKGdhcFJlLCBmdW5jdGlvbihzdWJTdHIsIG5hbWUpe1xyXG5cdFx0cmV0dXJuIGRpY3RbbmFtZV0uc291cmNlO1xyXG5cdH0pO1xyXG5cdHZhciBmbGFncyA9IHJlLmdsb2JhbCA/ICdnJyA6ICcnXHJcbiAgICAgICAgKyByZS5tdWx0aWxpbmUgPyAnbScgOiAnJ1xyXG4gICAgICAgICsgcmUuaWdub3JlQ2FzZSA/ICdpJyA6ICcnO1xyXG5cdHJldHVybiBuZXcgUmVnRXhwKG5ld1NvdXJjZSwgZmxhZ3MpOyAgXHJcbn07XHJcblxyXG4vLyBmaW5kIHNpbmdsZS9kb3VibGUgcXVvdGVkIFN0cmluZ3MgW2h0dHA6Ly9zdGFja292ZXJmbG93LmNvbS9xdWVzdGlvbnMvMjQ5NzkxL3JlZ2V4LWZvci1xdW90ZWQtc3RyaW5nLXdpdGgtZXNjYXBpbmctcXVvdGVzXVxyXG52YXIgcXV0ZWRTdHJSZSA9IC9cIig/OlteXCJcXFxcXSooPzpcXFxcLlteXCJcXFxcXSopKilcInxcXCcoPzpbXlxcJ1xcXFxdKig/OlxcXFwuW15cXCdcXFxcXSopKilcXCcvOyBcclxudmFyIGlkZlJlID0gL1thLXpBLVowLTlfXFwtXSsvO1xyXG52YXIgYXR0clJlID0gbWFrZVJlKHtcclxuXHRcdGlkZjogaWRmUmUsXHJcblx0XHRkcXM6IHF1dGVkU3RyUmVcclxufSwgL1shaWRmXVxcIT9cXD0/KD86WyFpZGZdfFshZHFzXSk/Lyk7XHJcblxyXG52YXIgcHJlcCA9IG1ha2VSZS5iaW5kKG51bGwsIHtcclxuXHRpZGY6IGlkZlJlLFxyXG5cdGF0dHI6IGF0dHJSZVxyXG59KTtcclxuXHJcbnZhciB0YWJSZSA9IC9cXHMqLztcclxuXHJcbnZhciBjbGFzc0lkUGFydFJlID0gcHJlcCgvW1xcLlxcI117MX1bIWlkZl0vZyk7XHJcbnZhciBjbGFzc0lkUmUgPSBtYWtlUmUoe3BhcnQ6IGNsYXNzSWRQYXJ0UmV9LCAvKD86WyFwYXJ0XSkrL2cpO1xyXG5cclxudmFyIHRhZ0xpbmUgPSBuZXcgUmVUcGwoXHJcbi9eWyF0YWddP1shY2xhc3NJZF0/WyFhdHRyc10/WyF0ZXh0XT9bIW11bHRpbGluZV0/WyF2YWx1ZV0/W1xcdFxcIF0qJC9nLCB7XHJcblx0dGFiOiB0YWJSZSxcclxuXHR0YWc6IHByZXAoL1shaWRmXS8pLFxyXG5cdGNsYXNzSWQ6IGNsYXNzSWRSZSxcclxuXHRhdHRyczogcHJlcCgvXFwoKD86WyFhdHRyXVxccypcXCw/XFxzKikqXFwpLyksXHJcblx0dmFsdWU6IC9cXCE/XFw9W15cXG5dKi8sXHJcblx0dGV4dDogL1xcIFteXFxuXSovLFxyXG5cdG11bHRpbGluZTogL1xcLltcXCBcXHRdKi9cclxufSk7XHJcblxyXG52YXIgd2hpdGVzcGFjZSA9IG5ldyBSZVRwbCgvXlxccyokL2csIHtcclxuXHJcbn0pO1xyXG5cclxudmFyIHRleHRMaW5lID0gbmV3IFJlVHBsKC9eXFx8WyF0ZXh0XSQvLCB7XHJcblx0dGV4dDogL1teXFxuXSovXHJcbn0pO1xyXG5cclxudmFyIGNvbW1lbnRMaW5lID0gbmV3IFJlVHBsKC9eXFwvXFwvXFwtP1shdGV4dF0kLywge1xyXG5cdHRleHQ6IC9bXlxcbl0qL1xyXG59KTtcclxuXHJcbmZ1bmN0aW9uIGNvbGxhcHNlVG9TdHIoYXN0KXtcclxuXHR2YXIgbGluZXMgPSBbYXN0LmNvZGVdLmNvbmNhdChhc3QuY2hpbGRyZW4ubWFwKGNvbGxhcHNlVG9TdHIpKTtcclxuXHRyZXR1cm4gbGluZXMuam9pbignXFxuJyk7XHJcbn07XHJcblxyXG5mdW5jdGlvbiBwYXJzZUNsYXNzSWQoc3RyKXtcclxuXHR2YXIgcmVzID0ge1xyXG5cdFx0Y2xhc3NlczogW10sXHJcblx0XHRpZDogbnVsbFxyXG5cdH07XHJcblx0dmFyIHBhcnRzID0gc3RyLm1hdGNoKGNsYXNzSWRQYXJ0UmUpLmZvckVhY2goZnVuY3Rpb24ocGFydCl7XHJcblx0XHRpZiAocGFydFswXSA9PSBcIiNcIil7XHJcblx0XHRcdHJlcy5pZCA9IHBhcnQuc2xpY2UoMSk7XHJcblx0XHRcdHJldHVybjtcclxuXHRcdH07XHJcblx0XHRyZXMuY2xhc3Nlcy5wdXNoKHBhcnQuc2xpY2UoMSkpO1xyXG5cdH0pO1xyXG5cdHJldHVybiByZXM7XHJcbn07XHJcblxyXG52YXIgYXR0clBhaXJSZSA9IG5ldyBSZVRwbCgvKD86WyFuYW1lXVshZXF1YWxdPyg/Olsha2V5XXxbIXN0clZhbHVlXSk/KVxcLD9cXHMqL2csIHtcclxuXHRcdG5hbWU6IGlkZlJlLFxyXG5cdFx0a2V5OiBpZGZSZSxcclxuXHRcdHN0clZhbHVlOiBxdXRlZFN0clJlLFxyXG5cdFx0ZXF1YWw6IC9cXCE/XFw9L1xyXG59KVxyXG5cclxuZnVuY3Rpb24gcGFyc2VBdHRycyhzdHIpe1xyXG5cdHZhciBhdHRyT2JqID0ge307XHJcblx0aWYgKCFzdHIpe1xyXG5cdFx0XHRyZXR1cm4gYXR0ck9iajtcclxuXHR9O1xyXG5cdHN0ciA9IHN0ci5zbGljZSgxLCAtMSk7XHJcblx0dmFyIHBhaXJzID0gYXR0clBhaXJSZS5maW5kQWxsKHN0cik7XHJcblx0cGFpcnMuZm9yRWFjaChmdW5jdGlvbihwYWlyKXtcclxuXHRcdHZhciBuYW1lID0gcGFpci5wYXJ0cy5uYW1lO1xyXG5cdFx0dmFyIHZhbHVlO1xyXG5cdFx0aWYgKHBhaXIucGFydHMua2V5KXtcclxuXHRcdFx0dmFsdWUgPSB7XHJcblx0XHRcdFx0dHlwZTogXCJ2YXJpYmxlXCIsXHJcblx0XHRcdFx0a2V5OiBwYWlyLnBhcnRzLmtleSxcclxuXHRcdFx0XHRlc2NhcGVkOiBwYWlyLnBhcnRzLmVxdWFsICE9PSBcIiE9XCJcclxuXHRcdFx0fTtcclxuXHRcdH1lbHNle1xyXG5cdFx0XHR2YWx1ZSA9IHtcclxuXHRcdFx0XHR0eXBlOiBcInN0cmluZ1wiLFxyXG5cdFx0XHRcdHZhbHVlOiBwYWlyLnBhcnRzLnN0clZhbHVlLnNsaWNlKDEsIC0xKVxyXG5cdFx0XHR9O1xyXG5cdFx0fTtcclxuXHRcdGF0dHJPYmpbbmFtZV0gPSB2YWx1ZTsgXHJcblx0fSk7XHJcblx0cmV0dXJuIGF0dHJPYmo7XHJcbn07XHJcblxyXG5mdW5jdGlvbiByZXBlYXQoc3RyLCB0aW1lcyl7XHJcblx0dmFyIHJlcyA9ICcnO1xyXG5cdHZhciBpID0gdGltZXM7XHJcblx0d2hpbGUgKGktLSl7XHJcblx0XHRyZXMgKz0gJyAnO1xyXG5cdH1cclxuXHRyZXR1cm4gcmVzO1xyXG59O1xyXG5cclxuXHJcbnZhciB0YWJTdHIgPSByZXBlYXQoJyAnLCA0KTtcclxudmFyIHRhYlNwYWNlUmUgPSBuZXcgUmVnRXhwKHRhYlN0ciwgJ2cnKTtcclxuXHJcbmZ1bmN0aW9uIHJlbW92ZU9mZnNldCh0ZXh0LCBvZmZzZXQpe1xyXG5cdHZhciBvZmZzZXRMZW4gPSBvZmZzZXQ7XHRcclxuXHRyZXR1cm4gdGV4dFxyXG5cdFx0LnJlcGxhY2UodGFiU3BhY2VSZSwgJ1xcdCcpXHJcblx0XHQuc3BsaXQoJ1xcbicpXHJcblx0XHQubWFwKGZ1bmN0aW9uKGxpbmUpe1xyXG5cdFx0XHRyZXR1cm4gbGluZS5zbGljZShvZmZzZXRMZW4pO1xyXG5cdFx0fSlcclxuXHRcdC5qb2luKCdcXG4nKTtcdFxyXG59O1xyXG5cclxudmFyIHRva2VucyA9IHtcclxuXHR0YWc6IHtcclxuXHRcdHJ1bGU6IGZ1bmN0aW9uKHN0cil7XHJcblx0XHRcdGlmICgvXlxccyokL2cudGVzdChzdHIpKXtcclxuXHRcdFx0XHRyZXR1cm4gbnVsbDtcclxuXHRcdFx0fTtcclxuXHRcdFx0cmV0dXJuIHRhZ0xpbmUuZmluZChzdHIpOyBcclxuXHRcdH0sXHJcblx0XHR0cmFuc2Zvcm06IGZ1bmN0aW9uKGZvdW5kLCBhc3QsIHBhcmVudCl7ICAgICAgICAgICAgXHJcblx0XHRcdHZhciBub2RlID0ge1xyXG5cdFx0XHRcdHR5cGU6ICd0YWcnLFxyXG5cdFx0XHRcdHRhZ05hbWU6IGZvdW5kLnBhcnRzLnRhZyB8fCAnZGl2JyxcclxuXHRcdFx0XHRhdHRyczoge30sXHJcblx0XHRcdFx0cGFyZW50OiBwYXJlbnRcclxuXHRcdFx0fTtcclxuXHRcdFx0dmFyIGNsYXNzZXMgPSBbXTtcclxuXHRcdFx0dmFyIGNsYXNzSWQgPSBmb3VuZC5wYXJ0cy5jbGFzc0lkO1xyXG5cdFx0XHR2YXIgaWQ7XHJcblx0XHRcdGlmIChjbGFzc0lkKXtcclxuXHRcdFx0XHR2YXIgcGFyc2VkID0gcGFyc2VDbGFzc0lkKGNsYXNzSWQpO1xyXG5cdFx0XHRcdGlmIChwYXJzZWQuaWQpe1xyXG5cdFx0XHRcdFx0aWQgPSBwYXJzZWQuaWRcclxuXHRcdFx0XHR9O1xyXG5cdFx0XHRcdGNsYXNzZXMgPSBjbGFzc2VzLmNvbmNhdChwYXJzZWQuY2xhc3Nlcyk7XHJcblx0XHRcdH07XHJcblx0XHRcdHZhciBhdHRycyA9IHBhcnNlQXR0cnMoZm91bmQucGFydHMuYXR0cnMpO1xyXG5cdFx0XHRpZiAoIWF0dHJzLmlkICYmIGlkKXtcclxuXHRcdFx0XHRhdHRycy5pZCA9IGlkO1xyXG5cdFx0XHR9O1xyXG5cdFx0XHR2YXIgY2xhc3NBdHRyID0gYXR0cnNbXCJjbGFzc1wiXTtcclxuXHRcdFx0aWYgKGNsYXNzQXR0cil7XHRcdFx0XHRcclxuXHRcdFx0XHRpZiAoYXR0cnNbXCJjbGFzc1wiXS50eXBlID09IFwic3RyaW5nXCIpe1xyXG5cdFx0XHRcdFx0Y2xhc3NlcyA9IGNsYXNzZXMuY29uY2F0KGF0dHJzW1wiY2xhc3NcIl0udmFsdWUuc3BsaXQoJyAnKSk7XHJcblx0XHRcdFx0fTtcclxuXHRcdFx0fWVsc2V7XHJcblx0XHRcdFx0aWYgKGNsYXNzZXMubGVuZ3RoID4gMCl7XHJcblx0XHRcdFx0XHRhdHRyc1tcImNsYXNzXCJdID0ge1xyXG5cdFx0XHRcdFx0XHR0eXBlOiBcInN0cmluZ1wiLFxyXG5cdFx0XHRcdFx0XHR2YWx1ZTogY2xhc3Nlcy5qb2luKCcgJylcclxuXHRcdFx0XHRcdH07XHJcblx0XHRcdFx0fTtcdFxyXG5cdFx0XHR9OyAgICAgICAgICAgIFxyXG5cdFx0XHRub2RlLmF0dHJzID0gYXR0cnM7XHJcblx0XHRcdHZhciB0ZXh0O1xyXG5cdFx0XHRpZiAoZm91bmQucGFydHMudmFsdWUpe1xyXG5cdFx0XHRcdHZhciBlcXVhbE9wID0gL1xcIT9cXD0vLmV4ZWMoZm91bmQucGFydHMudmFsdWUpWzBdO1xyXG5cdFx0XHRcdG5vZGUudmFsdWUgPSB7XHJcblx0XHRcdFx0XHRlc2NhcGVkOiBlcXVhbE9wICE9PSBcIiE9XCIsXHJcblx0XHRcdFx0XHRwYXRoOiBmb3VuZC5wYXJ0cy52YWx1ZS5yZXBsYWNlKC9eXFxzKlxcIT9cXD1cXHMqL2csICcnKVxyXG5cdFx0XHRcdH07XHJcblx0XHRcdFx0bm9kZS5jaGlsZHJlbiA9IFtdO1xyXG5cdFx0XHRcdHJldHVybiBub2RlO1xyXG5cdFx0XHR9O1xyXG5cdFx0XHRpZiAoZm91bmQucGFydHMubXVsdGlsaW5lKXtcdFx0XHRcdFxyXG5cdFx0XHRcdG5vZGUuY2hpbGRyZW4gPSBbe1xyXG5cdFx0XHRcdFx0dHlwZTogJ3RleHQnLFxyXG5cdFx0XHRcdFx0dGV4dDogcmVtb3ZlT2Zmc2V0KGFzdC5pbm5lckNvZGUsIGFzdC5vZmZzZXQgKyAxKVxyXG5cdFx0XHRcdH1dO1xyXG5cdFx0XHRcdHJldHVybiBub2RlOyAgICAgICAgICAgICAgICAgIFxyXG5cdFx0XHR9O1xyXG5cdFx0XHRpZiAoZm91bmQucGFydHMudGV4dCl7XHJcblx0XHRcdFx0bm9kZS5jaGlsZHJlbiA9IFt7XHJcblx0XHRcdFx0XHR0eXBlOiAndGV4dCcsXHJcblx0XHRcdFx0XHR0ZXh0OiBmb3VuZC5wYXJ0cy50ZXh0LnJlcGxhY2UoL14gPy8sICcnKVxyXG5cdFx0XHRcdH1dO1xyXG5cdFx0XHRcdHJldHVybiBub2RlOyAgIFxyXG5cdFx0XHR9O1xyXG5cdFx0XHRub2RlLmNoaWxkcmVuID0gYXN0LmNoaWxkcmVuLm1hcCh0cmFuc2Zvcm1Bc3QuYmluZChudWxsLCBub2RlKSk7XHJcblx0XHRcdHJldHVybiBub2RlO1xyXG5cdFx0fVxyXG5cdH0sXHJcblx0dGV4dDoge1xyXG5cdFx0cnVsZTogdGV4dExpbmUsXHJcblx0XHR0cmFuc2Zvcm06IGZ1bmN0aW9uKGZvdW5kLCBhc3QsIHBhcmVudCl7XHJcblx0XHRcdHJldHVybiB7XHJcblx0XHRcdFx0dHlwZTogJ3RleHQnLFxyXG5cdFx0XHRcdHRleHQ6IGZvdW5kLnBhcnRzLnRleHQsXHJcblx0XHRcdFx0cGFyZW50OiBwYXJlbnRcclxuXHRcdFx0fVxyXG5cdFx0fVxyXG5cdH0sXHJcblx0d2hpdGVzcGFjZToge1xyXG5cdFx0cnVsZTogd2hpdGVzcGFjZSxcclxuXHRcdHRyYW5zZm9ybTogZnVuY3Rpb24oZm91bmQsIGFzdCwgcGFyZW50KXtcclxuXHRcdFx0cmV0dXJuIHtcclxuXHRcdFx0XHR0eXBlOiAnd2hpdGVzcGFjZScsXHJcblx0XHRcdFx0cGFyZW50OiBwYXJlbnRcclxuXHRcdFx0fVxyXG5cdFx0fVxyXG5cdH0sXHJcblx0Y29tbWVudDoge1xyXG5cdFx0cnVsZTogY29tbWVudExpbmUsXHJcblx0XHR0cmFuc2Zvcm06IGZ1bmN0aW9uKGZvdW5kLCBhc3QsIHBhcmVudCl7XHJcblx0XHRcdHJldHVybiB7XHJcblx0XHRcdFx0dHlwZTogJ2NvbW1lbnQnLFxyXG5cdFx0XHRcdHRleHQ6IGZvdW5kLnBhcnRzLnRleHQsXHJcblx0XHRcdFx0cGFyZW50OiBwYXJlbnRcclxuXHRcdFx0fVxyXG5cdFx0fVxyXG5cdH1cclxufTtcclxuXHJcbmZ1bmN0aW9uIHRyYW5zZm9ybUFzdChwYXJlbnQsIGFzdCwgbWV0YSl7XHJcblx0XHR2YXIgZm91bmQ7XHJcblx0XHR2YXIgdG9rZW47XHJcblx0XHRmb3IgKHZhciBuYW1lIGluIHRva2Vucyl7XHJcblx0XHRcdHRva2VuID0gdG9rZW5zW25hbWVdO1xyXG5cdFx0XHR2YXIgbGluZSA9IGFzdC5jb2RlLnJlcGxhY2UoL1xcci9nLCAnJyk7XHJcblx0XHRcdGZvdW5kID0gdHlwZW9mIHRva2VuLnJ1bGUgPT0gXCJmdW5jdGlvblwiIFxyXG5cdFx0XHRcdD8gdG9rZW4ucnVsZShsaW5lKVxyXG5cdFx0XHRcdDogdG9rZW4ucnVsZS5maW5kKGxpbmUpO1xyXG5cdFx0XHRpZiAoZm91bmQpe1xyXG5cdFx0XHRcdGJyZWFrO1xyXG5cdFx0XHR9OyAgICAgICAgXHJcblx0XHR9O1xyXG5cdFx0aWYgKCFmb3VuZCl7XHJcblx0XHRcdHRocm93IG5ldyBFcnJvcigndG9rZW4gbm90IGZvdW5kIChsaW5lOiAnICsgYXN0Lm51bSArICcpOiBcIicgKyBhc3QuY29kZSArICdcIlxcbicpO1xyXG5cdFx0fTtcclxuXHRcdHJldHVybiB0b2tlbi50cmFuc2Zvcm0oZm91bmQsIGFzdCwgcGFyZW50KTtcclxuXHRcdFxyXG59O1xyXG5cclxuZnVuY3Rpb24gcGFyc2UoY29kZSl7XHJcblx0Y29kZSA9IGNvZGUudG9TdHJpbmcoKTtcclxuXHRjb2RlID0gY29kZVxyXG5cdFx0LnJlcGxhY2UoL1xcci9nLCAnJylcclxuXHRcdC5yZXBsYWNlKC9cXG5bXFwgXFx0XSpcXG4vZywgJ1xcbicpO1xyXG5cdHZhciBhc3QgPSB7XHJcblx0XHR0eXBlOiBcInJvb3RcIlxyXG5cdH07XHJcblx0dmFyIHRhYkFzdCA9IHBhcnNlVGFiVHJlZShjb2RlKTtcclxuXHRhc3QuY2hpbGRyZW4gPSB0YWJBc3QuY2hpbGRyZW4ubWFwKHRyYW5zZm9ybUFzdC5iaW5kKG51bGwsIGFzdCkpOyAgXHJcblx0cmV0dXJuIGFzdDsgIFxyXG5cclxufTtcclxuXHJcblxyXG5cclxuZXhwb3J0cy5wYXJzZSA9IHBhcnNlOyIsInZhciB1dGlscyA9IHJlcXVpcmUoJy4vdXRpbHMuanMnKTtcclxudmFyIFN0clRwbCA9IHJlcXVpcmUoJy4vc3RyVHBsLmpzJyk7XHJcblxyXG52YXIgc2VsZkNsb3NpbmdUYWdzID0gW1wiYXJlYVwiLCBcImJhc2VcIiwgXCJiclwiLCBcImNvbFwiLCBcclxuXHRcImNvbW1hbmRcIiwgXCJlbWJlZFwiLCBcImhyXCIsIFwiaW1nXCIsIFxyXG5cdFwiaW5wdXRcIiwgXCJrZXlnZW5cIiwgXCJsaW5rXCIsIFxyXG5cdFwibWV0YVwiLCBcInBhcmFtXCIsIFwic291cmNlXCIsIFwidHJhY2tcIiwgXHJcblx0XCJ3YnJcIl07XHJcblxyXG52YXIgZXNwZWNpYWxUYWdzID0ge1xyXG5cdFwiZG9jdHlwZVwiOiBmdW5jdGlvbih0YWdJbmZvKXtcclxuXHRcdHZhciB2YWwgPSB0YWdJbmZvLmlubmVySFRNTC5yZXBsYWNlKC9cXG4vZywgJycpLnRyaW0oKTtcclxuXHRcdHJldHVybiAnPCFET0NUWVBFICcgKyB2YWwgKyAnPic7XHJcblx0fVxyXG59O1xyXG5cclxuZnVuY3Rpb24gb2JqRm9yKG9iaiwgZm4pe1xyXG5cdGZvciAodmFyIGkgaW4gb2JqKXtcclxuXHRcdGZuKG9ialtpXSwgaSwgb2JqKTtcclxuXHR9O1xyXG59O1xyXG5cclxuZnVuY3Rpb24gcmVuZGVyVGFnV3JhcHBlcih0YWdJbmZvKXtcclxuXHR2YXIgYXR0cnMgPSB0YWdJbmZvLmF0dHJzO1x0XHJcblx0dmFyIHBhaXJzID0gW107XHJcblx0Zm9yICh2YXIgbmFtZSBpbiBhdHRycyl7XHJcblx0XHR2YXIgdmFsdWUgPSBhdHRyc1tuYW1lXS52YWx1ZTtcclxuXHRcdHBhaXJzLnB1c2gobmFtZSArICc9XCInICsgdmFsdWUgKyAnXCInKTtcclxuXHR9O1xyXG5cdHZhciBhdHRyQ29kZSA9ICcnO1xyXG5cdGlmIChwYWlycy5sZW5ndGggPiAwKXtcclxuXHRcdGF0dHJDb2RlID0gJyAnICsgcGFpcnMuam9pbignJyk7XHJcblx0fTtcclxuXHR2YXIgdGFnSGVhZCA9IHRhZ0luZm8ubmFtZSArIGF0dHJDb2RlO1xyXG5cdGlmICh+c2VsZkNsb3NpbmdUYWdzLmluZGV4T2YodGFnSW5mby5uYW1lKSl7XHJcblx0XHRyZXR1cm4gW1wiPFwiICsgdGFnSGVhZCArIFwiIC8+XCJdO1xyXG5cdH07XHJcblx0dmFyIGVzcGVjaWFsID0gZXNwZWNpYWxUYWdzW3RhZ0luZm8ubmFtZV07XHJcblx0aWYgKGVzcGVjaWFsKXtcclxuXHRcdHJldHVybiBbZXNwZWNpYWwodGFnSW5mbyldO1xyXG5cdH07XHJcblx0dmFyIG9wZW5UYWcgPSBcIjxcIiArIHRhZ0hlYWQgKyBcIj5cIjtcclxuXHR2YXIgY2xvc2VUYWcgPSBcIjwvXCIgKyB0YWdJbmZvLm5hbWUgKyBcIj5cIjtcclxuXHRyZXR1cm4gW29wZW5UYWcsIGNsb3NlVGFnXTtcclxufTtcclxuZXhwb3J0cy5yZW5kZXJUYWdXcmFwcGVyID0gcmVuZGVyVGFnV3JhcHBlcjtcdFxyXG5cclxuZnVuY3Rpb24gcmVuZGVyVGFnKHRhZ0luZm8pe1xyXG5cdHZhciB3cmFwID0gcmVuZGVyVGFnV3JhcHBlcih0YWdJbmZvKTtcclxuXHR2YXIgY29kZSA9IHdyYXAuam9pbih0YWdJbmZvLmlubmVySFRNTCB8fCBcIlwiKTtcclxuXHRyZXR1cm4gY29kZTtcdFxyXG59O1xyXG5leHBvcnRzLnJlbmRlclRhZyA9IHJlbmRlclRhZztcdFxyXG5cclxuZnVuY3Rpb24gcmVuZGVyQXR0cnMoYXR0cnMsIGRhdGEpe1xyXG5cdHZhciByZXNBdHRycyA9IHt9O1xyXG5cdG9iakZvcihhdHRycywgZnVuY3Rpb24odmFsdWUsIG5hbWUpe1xyXG5cdFx0dmFyIG5hbWVUcGwgPSBuZXcgU3RyVHBsKG5hbWUpO1xyXG5cdFx0dmFyIHZhbHVlVHBsID0gbmV3IFN0clRwbCh2YWx1ZSk7XHJcblx0XHRyZXNBdHRyc1tuYW1lVHBsLnJlbmRlcihkYXRhKV0gPSB2YWx1ZVRwbC5yZW5kZXIoZGF0YSk7XHRcdFxyXG5cdH0pO1x0XHJcblx0cmV0dXJuIHJlc0F0dHJzO1xyXG59O1xyXG5leHBvcnRzLnJlbmRlckF0dHJzID0gcmVuZGVyQXR0cnM7XHJcblxyXG5mdW5jdGlvbiBnZXRBdHRyc1BhdGhzKGF0dHJzKXtcclxuXHR2YXIgcGF0aHMgPSBbXTtcclxuXHRvYmpGb3IoYXR0cnMsIGZ1bmN0aW9uKHZhbHVlLCBuYW1lKXtcclxuXHRcdHZhciBuYW1lVHBsID0gbmV3IFN0clRwbChuYW1lKTtcclxuXHRcdHZhciB2YWx1ZVRwbCA9IG5ldyBTdHJUcGwodmFsdWUpO1xyXG5cdFx0cGF0aHMgPSBwYXRocy5jb25jYXQobmFtZVRwbC5nZXRQYXRocygpLCB2YWx1ZVRwbC5nZXRQYXRocygpKTtcdFx0XHJcblx0fSk7XHJcblx0cmV0dXJuIHBhdGhzO1xyXG59O1xyXG5leHBvcnRzLmdldEF0dHJzUGF0aHMgPSBnZXRBdHRyc1BhdGhzO1xyXG5cclxuXHJcbmZ1bmN0aW9uIHJlbmRlcihhc3QsIGRhdGEpe1xyXG5cdGlmIChhc3QudHlwZSA9PSBcImNvbW1lbnRcIil7XHJcblx0XHRyZXR1cm4gXCJcIjtcclxuXHR9O1xyXG5cdGlmIChhc3QudHlwZSA9PSBcInRleHRcIil7XHJcblx0XHRyZXR1cm4gYXN0LnRleHQ7XHJcblx0fTtcclxuXHRpZiAoYXN0LnR5cGUgPT0gXCJyb290XCIpe1xyXG5cdFx0cmV0dXJuIGFzdC5jaGlsZHJlbi5tYXAoZnVuY3Rpb24oY2hpbGQpe1xyXG5cdFx0XHRyZXR1cm4gcmVuZGVyKGNoaWxkLCBkYXRhKTtcclxuXHRcdH0pLmpvaW4oJycpO1xyXG5cdH07XHJcblx0aWYgKGFzdC50eXBlICE9IFwidGFnXCIpe1xyXG5cdFx0cmV0dXJuIFwiXCI7XHJcblx0fTtcdFxyXG5cdHZhciBpbm5lcjtcclxuXHRpZiAoYXN0LnZhbHVlKXtcclxuXHRcdHZhciBwYXRoID0gYXN0LnZhbHVlLnNwbGl0KCcuJyk7XHJcblx0XHR2YXIgaW5uZXIgPSB1dGlscy5vYmpQYXRoKHBhdGgsIGRhdGEpO1xyXG5cdH1lbHNle1xyXG5cdFx0aW5uZXIgPSBhc3QuY2hpbGRyZW4ubWFwKGZ1bmN0aW9uKGNoaWxkKXtcclxuXHRcdFx0cmV0dXJuIHJlbmRlcihjaGlsZCwgZGF0YSk7XHJcblx0XHR9KS5qb2luKCcnKTtcclxuXHR9O1xyXG5cdHJldHVybiByZW5kZXJUYWcoe1xyXG5cdFx0bmFtZTogYXN0LnRhZ05hbWUsXHJcblx0XHRhdHRyczogYXN0LmF0dHJzLFxyXG5cdFx0aW5uZXJIVE1MOiBpbm5lclxyXG5cdH0pO1xyXG59O1xyXG5leHBvcnRzLnJlbmRlciA9IHJlbmRlcjtcclxuXHJcbmZ1bmN0aW9uIHJlbmRlcldyYXBwZXIoYXN0LCBkYXRhKXtcclxuXHRpZiAoYXN0LnR5cGUgIT0gXCJ0YWdcIil7XHJcblx0XHRyZXR1cm4gW107XHJcblx0fTtcclxuXHRyZXR1cm4gcmVuZGVyVGFnV3JhcHBlcih7XHJcblx0XHRuYW1lOiBhc3QudGFnTmFtZSxcclxuXHRcdGF0dHJzOiBhc3QuYXR0cnNcclxuXHR9KTtcclxufTtcclxuZXhwb3J0cy5yZW5kZXJXcmFwcGVyID0gcmVuZGVyV3JhcHBlcjsiLCJ2YXIgdXRpbHMgPSByZXF1aXJlKCcuL3V0aWxzLmpzJyk7XHJcblxyXG5mdW5jdGlvbiBTdHJUcGwodHBsKXtcclxuXHR0aGlzLnRwbCA9IHRwbDtcclxufTtcclxuXHJcblN0clRwbC5wYXJzZSA9IGZ1bmN0aW9uKHN0cil7XHJcblx0dmFyIHJlID0gL1xcJVxcQD9bXFx3XFxkX1xcLlxcLV0rJS9nO1xyXG5cdHZhciBnYXBzID0gc3RyLm1hdGNoKHJlKTtcclxuXHRpZiAoIWdhcHMpe1xyXG5cdFx0cmV0dXJuIHN0cjtcclxuXHR9O1xyXG5cdGdhcHMgPSBnYXBzLm1hcChmdW5jdGlvbihnYXApe1xyXG5cdFx0dmFyIHBhdGhTdHIgPSBnYXAuc2xpY2UoMSwgLTEpO1xyXG5cdFx0dmFyIHBhdGggPSBbXTtcclxuXHRcdGlmIChwYXRoU3RyWzBdID09IFwiQFwiKXtcclxuXHRcdFx0cGF0aFN0ciA9IHBhdGhTdHIuc2xpY2UoMSk7XHJcblx0XHR9ZWxzZXtcclxuXHRcdFx0cGF0aCA9IFtdO1xyXG5cdFx0fTtcclxuXHRcdHZhciBwYXRoID0gcGF0aC5jb25jYXQocGF0aFN0ci5zcGxpdCgnLicpKTtcclxuXHRcdHJldHVybiB7XHJcblx0XHRcdFwicGF0aFwiOiBwYXRoXHJcblx0XHR9O1xyXG5cdH0pO1xyXG5cdHZhciB0cGxQYXJ0cyA9IHN0ci5zcGxpdChyZSk7XHJcblx0dmFyIHRwbCA9IHV0aWxzLm1peEFycmF5cyh0cGxQYXJ0cywgZ2Fwcyk7XHJcblx0cmV0dXJuIHRwbDtcclxufTtcclxuXHJcblN0clRwbC5wcm90b3R5cGUuZ2V0UGF0aHMgPSBmdW5jdGlvbigpe1xyXG5cdHZhciBwYXRocyA9IFtdO1xyXG5cdGlmICghQXJyYXkuaXNBcnJheSh0aGlzLnRwbCkpe1xyXG5cdFx0cmV0dXJuIHBhdGhzO1xyXG5cdH07XHRcclxuXHR0aGlzLnRwbC5mb3JFYWNoKGZ1bmN0aW9uKHBhcnQpe1xyXG5cdFx0aWYgKHR5cGVvZiBwYXJ0ID09IFwic3RyaW5nXCIpe1xyXG5cdFx0XHRyZXR1cm47XHJcblx0XHR9O1xyXG5cdFx0cmV0dXJuIHBhdGhzLnB1c2gocGFydC5wYXRoKTtcclxuXHR9KTtcclxuXHRyZXR1cm4gcGF0aHM7XHJcbn07XHJcblxyXG5TdHJUcGwucHJvdG90eXBlLnJlbmRlciA9IGZ1bmN0aW9uKGRhdGEpe1xyXG5cdGlmICghQXJyYXkuaXNBcnJheSh0aGlzLnRwbCkpe1xyXG5cdFx0cmV0dXJuIHRoaXMudHBsO1xyXG5cdH07XHJcblx0cmV0dXJuIHRoaXMudHBsLm1hcChmdW5jdGlvbihwYXJ0KXtcclxuXHRcdGlmICh0eXBlb2YgcGFydCA9PSBcInN0cmluZ1wiKXtcclxuXHRcdFx0cmV0dXJuIHBhcnQ7XHJcblx0XHR9O1xyXG5cdFx0cmV0dXJuIHV0aWxzLm9ialBhdGgocGFydC5wYXRoLCBkYXRhKTtcclxuXHR9KS5qb2luKCcnKTtcdFxyXG59O1xyXG5cclxubW9kdWxlLmV4cG9ydHMgPSBTdHJUcGw7XHJcbiIsImZ1bmN0aW9uIG1peEFycmF5cyhhcnJheXMpe1xyXG5cdHZhciBpZCA9IDA7XHJcblx0dmFyIG1heExlbmd0aCA9IDA7XHJcblx0dmFyIHRvdGFsTGVuZ3RoID0gMDtcclxuXHRmb3IgKHZhciBpID0gMDsgaSA8IGFyZ3VtZW50cy5sZW5ndGg7IGkrKyl7XHJcblx0XHRtYXhMZW5ndGggPSBNYXRoLm1heChhcmd1bWVudHNbaV0ubGVuZ3RoLCBtYXhMZW5ndGgpO1xyXG5cdFx0dG90YWxMZW5ndGggKz0gYXJndW1lbnRzW2ldLmxlbmd0aDtcclxuXHR9O1xyXG5cdHZhciByZXNBcnIgPSBbXTtcclxuXHR2YXIgYXJyYXlDb3VudCA9IGFyZ3VtZW50cy5sZW5ndGg7XHJcblx0Zm9yICh2YXIgaWQgPSAwOyBpZCA8IG1heExlbmd0aDsgaWQrKyl7XHRcdFx0XHRcclxuXHRcdGZvciAodmFyIGkgPSAwOyBpIDwgYXJyYXlDb3VudDsgaSsrKXtcclxuXHRcdFx0aWYgKGFyZ3VtZW50c1tpXS5sZW5ndGggPiBpZCl7XHJcblx0XHRcdFx0cmVzQXJyLnB1c2goYXJndW1lbnRzW2ldW2lkXSk7XHJcblx0XHRcdH07XHJcblx0XHR9O1xyXG5cdH07XHJcblx0cmV0dXJuIHJlc0FycjtcclxufTtcclxuZXhwb3J0cy5taXhBcnJheXMgPSBtaXhBcnJheXM7XHJcblxyXG5mdW5jdGlvbiBvYmpQYXRoKHBhdGgsIG9iaiwgbmV3VmFsKXtcclxuXHRpZiAocGF0aC5sZW5ndGggPCAxKXtcclxuXHRcdGlmIChhcmd1bWVudHMubGVuZ3RoID4gMil7XHJcblx0XHRcdHRocm93ICdyb290IHJld3JpdHRpbmcgaXMgbm90IHN1cHBvcnRlZCc7XHJcblx0XHR9O1xyXG5cdFx0cmV0dXJuIG9iajtcclxuXHR9O1xyXG5cdHZhciBwcm9wTmFtZSA9IHBhdGhbMF07XHJcblx0aWYgKHBhdGgubGVuZ3RoID09IDEpe1xyXG5cdFx0aWYgKGFyZ3VtZW50cy5sZW5ndGggPiAyKXtcclxuXHRcdFx0b2JqW3Byb3BOYW1lXSA9IG5ld1ZhbDsgXHJcblx0XHR9O1x0XHRcdFx0XHJcblx0XHRyZXR1cm4gb2JqW3Byb3BOYW1lXTtcdFxyXG5cdH07XHJcblx0dmFyIHN1Yk9iaiA9IG9ialtwcm9wTmFtZV07XHJcblx0aWYgKHN1Yk9iaiA9PT0gdW5kZWZpbmVkKXtcclxuXHRcdC8vdGhyb3cgbmV3IEVycm9yKFwiQ2Fubm90IHJlYWQgXCIgKyBwcm9wTmFtZSArIFwiIG9mIHVuZGVmaW5lZFwiKTtcclxuXHRcdHJldHVybiB1bmRlZmluZWQ7IC8vIHRocm93P1xyXG5cdH07XHRcdFxyXG5cdGlmIChhcmd1bWVudHMubGVuZ3RoID4gMil7XHJcblx0XHRyZXR1cm4gb2JqUGF0aChwYXRoLnNsaWNlKDEpLCBzdWJPYmosIG5ld1ZhbCk7XHJcblx0fTtcclxuXHRyZXR1cm4gb2JqUGF0aChwYXRoLnNsaWNlKDEpLCBzdWJPYmopO1xyXG59O1xyXG5leHBvcnRzLm9ialBhdGggPSBvYmpQYXRoO1xyXG4iLCJcInVzZSBzdHJpY3RcIjtcclxuXHJcbmltcG9ydCB7RmdJbnN0YW5jZX0gZnJvbSAnLi9jbGllbnQvZmdJbnN0YW5jZSc7XHJcbmltcG9ydCB7R2FwfSBmcm9tICcuL2NsaWVudC9nYXBDbGFzc01ncic7XHJcblxyXG5leHBvcnQgdHlwZSBBbmNob3IgPSBIVE1MRWxlbWVudDtcclxuLyoqXHJcbiAqIEdlbmVyYXRlcyBhbiBpZCBmb3IgYW4gYWNuY2hvci5cclxuICogQHBhcmFtIHtPYmplY3R9IGNvbnRleHQgLSBGZyBjb250YWluaW5nIHRoZSBhY25jaG9yLlxyXG4gKiBAcGFyYW0ge09iamVjdH0gZ2FwIC0gR2FwIHRvIHdoaWNoIHRoZSBhY25jaG9yIGlzIGJpbmQgdG8uXHJcbiAqIEByZXR1cm5zIHtzdHJpbmd9IElkIG9mIHRoZSBhbmNob3IgdGFnLlxyXG4gKi9cclxuZnVuY3Rpb24gZ2VuSWQoY29udGV4dDogRmdJbnN0YW5jZSwgZ2FwOiBHYXApOiBzdHJpbmd7XHJcbiAgIFx0Y29uc3QgaWQgPSBbJ2ZnJywgY29udGV4dC5pZCwgJ2FpZCcsIGdhcC5naWRdLmpvaW4oJy0nKTtcclxuICAgIHJldHVybiBpZDtcclxufTtcclxuXHJcbi8qKlxyXG4gKiBHZW5lcmF0ZXMgY29kZSBmb3IgYW4gYWNuY2hvci5cclxuICogQHBhcmFtIHtPYmplY3R9IGNvbnRleHQgLSBGZyBjb250YWluaW5nIHRoZSBhY25jaG9yLlxyXG4gKiBAcGFyYW0ge09iamVjdH0gZ2FwIC0gR2FwIHRvIHdoaWNoIHRoZSBhY25jaG9yIGlzIGJpbmQgdG8uXHJcbiAqIEByZXR1cm5zIHtzdHJpbmd9IEh0bWwgY29kZSBvZiB0aGUgYW5jaG9yLiBcclxuICovXHJcbmV4cG9ydCBmdW5jdGlvbiBnZW5Db2RlKGNvbnRleHQ6IEZnSW5zdGFuY2UsIGdhcDogR2FwKTogc3RyaW5ne1xyXG4gICAgY29uc3QgY29kZSA9ICc8c2NyaXB0IHR5cGU9XCJmZy1qcy9hbmNob3JcIiBpZD1cIicgXHJcbiAgICAgICAgKyBnZW5JZChjb250ZXh0LCBnYXApIFxyXG4gICAgICAgICsgJ1wiPjwvc2NyaXB0Pic7XHJcbiAgICByZXR1cm4gY29kZTtcclxufTtcclxuXHJcbi8qKlxyXG4gKiBGaW5kIHRoZSBhbmNob3IuXHJcbiAqIEBwYXJhbSB7T2JqZWN0fSBjb250ZXh0IC0gRmcgY29udGFpbmluZyB0aGUgYWNuY2hvci5cclxuICogQHBhcmFtIHtPYmplY3R9IGdhcCAtIEdhcCB0byB3aGljaCB0aGUgYWNuY2hvciBpcyBiaW5kIHRvLlxyXG4gKiBAcmV0dXJucyB7T2JqZWN0fSBEb20gZWxlbWVudCBvZiB0aGUgYW5jaG9yLlxyXG4gKi9cclxuZXhwb3J0IGZ1bmN0aW9uIGZpbmQoY29udGV4dDogRmdJbnN0YW5jZSwgZ2FwOiBHYXApOiBBbmNob3J7XHJcbiAgIFx0Y29uc3QgaWQgPSBnZW5JZChjb250ZXh0LCBnYXApOyAgICBcclxuICAgIHJldHVybiBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChpZCk7XHJcbn07XHJcblxyXG4vKipcclxuICogUGxhY2VzIHNvbWUgSHRtbCBjb2RlIG5leHQgdG8gdGhlIGFjbmNob3IuXHJcbiAqIEBwYXJhbSB7T2JqZWN0fSBhbmNob3IgLSBUaGUgYW5jaG9yIERPTSBlbGVtZW50LlxyXG4gKiBAcGFyYW0ge3N0cmluZ30gcG9zaXRpb24gLSBEZWZpbmVzIHdoZXJlIGNvZGUgYmUgcGxhY2VkLiBcImFmdGVyXCIgYW5kIFwiYmVmb3JlXCIgYXJlIHVzZWQgcmVsYXRpdmUgdG8gYW5jaG9yIG5vZGUuXHJcbiAqIEBwYXJhbSB7c3RyaW5nfSBodG1sIC0gSFRNTCBjb2RlIHRvIGJlIHBsYWNlZC5cclxuICovXHJcblxyXG5leHBvcnQgZnVuY3Rpb24gaW5zZXJ0SFRNTChhbmNob3I6IEFuY2hvciwgcG9zaXRpb246IHN0cmluZywgaHRtbDogc3RyaW5nKXsgICBcdFxyXG4gICAgbGV0IHBvczogc3RyaW5nO1xyXG4gICAgc3dpdGNoIChwb3NpdGlvbil7XHJcbiAgICAgICAgY2FzZSBcImJlZm9yZVwiOiBwb3MgPSBcImJlZm9yZWJlZ2luXCI7IGJyZWFrO1xyXG4gICAgICAgIGNhc2UgXCJhZnRlclwiOiBwb3MgPSBcImFmdGVyZW5kXCI7IGJyZWFrO1xyXG4gICAgfTtcclxuICAgIGFuY2hvci5pbnNlcnRBZGphY2VudEhUTUwocG9zLCBodG1sKTtcclxufTsiLCJcInVzZSBzdHJpY3RcIjtcclxuXHJcbmltcG9ydCBFdmVudEVtaXR0ZXIgZnJvbSAnLi4vZXZlbnRFbWl0dGVyJztcclxuaW1wb3J0ICogYXMgZ2xvYmFsRXZlbnRzIGZyb20gJy4vZ2xvYmFsRXZlbnRzJztcclxuaW1wb3J0ICogYXMgZmdJbnN0YW5jZU1vZHVsZSBmcm9tICcuL2ZnSW5zdGFuY2UnO1xyXG5pbXBvcnQge0ZnSW5zdGFuY2V9IGZyb20gJy4vZmdJbnN0YW5jZSc7XHJcbmltcG9ydCB7R2FwfSBmcm9tICcuL2dhcENsYXNzTWdyJztcclxuaW1wb3J0IHtUcGx9IGZyb20gJy4uL3RwbE1ncic7XHJcblxyXG5leHBvcnQgY29uc3QgZmdDbGFzc1RhYmxlOiBGZ0NsYXNzW10gPSBbXTtcclxuZXhwb3J0IGNvbnN0IGZnQ2xhc3NEaWN0OiBhbnkgPSB7fTtcclxuXHJcbmV4cG9ydCBpbnRlcmZhY2UgSUZnQ2xhc3NPcHRze1xyXG5cdHRwbDogVHBsO1xyXG5cdGNsYXNzRm46IEZ1bmN0aW9uO1xyXG5cdG5hbWU6IHN0cmluZztcclxufTtcclxuXHJcbmV4cG9ydCBjbGFzcyBGZ0NsYXNze1xyXG5cdGlkOiBudW1iZXI7XHJcblx0aW5zdGFuY2VzOiBmZ0luc3RhbmNlTW9kdWxlLkZnSW5zdGFuY2VbXTtcclxuXHR0cGw6IFRwbDtcclxuXHRuYW1lOiBzdHJpbmc7XHJcblx0ZXZlbnRFbWl0dGVyOiBFdmVudEVtaXR0ZXI7XHJcblx0Y3JlYXRlRm46IEZ1bmN0aW9uO1xyXG5cdFxyXG5cdGNvbnN0cnVjdG9yKG9wdHM6IElGZ0NsYXNzT3B0cyl7XHJcblx0XHR0aGlzLmlkID0gZmdDbGFzc1RhYmxlLmxlbmd0aDtcdFxyXG5cdFx0dGhpcy5pbnN0YW5jZXMgPSBbXTtcclxuXHRcdHRoaXMudHBsID0gb3B0cy50cGw7XHJcblx0XHR0aGlzLm5hbWUgPSBvcHRzLm5hbWU7XHJcblx0XHR0aGlzLmV2ZW50RW1pdHRlciA9IG5ldyBFdmVudEVtaXR0ZXIoKTtcclxuXHRcdGZnQ2xhc3NEaWN0W29wdHMubmFtZV0gPSB0aGlzO1xyXG5cdFx0ZmdDbGFzc1RhYmxlLnB1c2godGhpcyk7XHRcclxuXHRcdGZ1bmN0aW9uIEZnSW5zdGFuY2UoKXtcclxuXHRcdFx0ZmdJbnN0YW5jZU1vZHVsZS5GZ0luc3RhbmNlQmFzZS5hcHBseSh0aGlzLCBhcmd1bWVudHMpO1xyXG5cdFx0fTtcclxuXHRcdHRoaXMuY3JlYXRlRm4gPSBGZ0luc3RhbmNlO1xyXG5cdFx0dGhpcy5jcmVhdGVGbi5jb25zdHJ1Y3RvciA9IGZnSW5zdGFuY2VNb2R1bGUuRmdJbnN0YW5jZUJhc2U7XHRcclxuXHRcdHRoaXMuY3JlYXRlRm4ucHJvdG90eXBlID0gT2JqZWN0LmNyZWF0ZShmZ0luc3RhbmNlTW9kdWxlLkZnSW5zdGFuY2VCYXNlLnByb3RvdHlwZSk7XHRcclxuXHRcdGNvbnN0IGNsYXNzRm4gPSBvcHRzLmNsYXNzRm47XHJcblx0XHRpZiAoY2xhc3NGbil7XHJcblx0XHRcdGNsYXNzRm4odGhpcywgdGhpcy5jcmVhdGVGbi5wcm90b3R5cGUpO1xyXG5cdFx0fTtcclxuXHR9O1xyXG5cclxuXHRvbihuYW1lOiBzdHJpbmcsIHNlbGVjdG9yOiBzdHJpbmcsIGZuPzogRnVuY3Rpb24pe1x0XHJcblx0XHRpZiAoYXJndW1lbnRzLmxlbmd0aCA9PT0gMil7XHJcblx0XHRcdG5hbWUgPSBuYW1lO1xyXG5cdFx0XHRmbiA9IGFyZ3VtZW50c1sxXTtcclxuXHRcdFx0c2VsZWN0b3IgPSBudWxsO1xyXG5cdFx0fWVsc2V7XHJcblx0XHRcdHZhciBvcmlnaW5hbEZuID0gZm47XHJcblx0XHRcdGZuID0gZnVuY3Rpb24oZXZlbnQ6IGFueSl7XHRcdFx0XHJcblx0XHRcdFx0aWYgKG1hdGNoKHRoaXMsIGV2ZW50LnRhcmdldCwgc2VsZWN0b3IpKXtcclxuXHRcdFx0XHRcdG9yaWdpbmFsRm4uY2FsbCh0aGlzLCBldmVudCk7XHJcblx0XHRcdFx0fTtcclxuXHRcdFx0fTtcclxuXHRcdH07XHJcblx0XHRnbG9iYWxFdmVudHMubGlzdGVuKG5hbWUpO1xyXG5cdFx0dGhpcy5ldmVudEVtaXR0ZXIub24obmFtZSwgZm4pO1x0XHJcblx0fTtcclxuXHJcblx0ZW1pdCgvKm5hbWUuLi4sIHJlc3QqLyl7XHJcblx0XHR0aGlzLmV2ZW50RW1pdHRlci5lbWl0LmFwcGx5KHRoaXMuZXZlbnRFbWl0dGVyLCBhcmd1bWVudHMpO1x0XHJcblx0fTtcclxuXHJcblx0ZW1pdEFwcGx5KG5hbWU6IHN0cmluZywgdGhpc0FyZzogYW55LCBhcmdzOiBhbnlbXSl7XHJcblx0XHR0aGlzLmV2ZW50RW1pdHRlci5lbWl0QXBwbHkobmFtZSwgdGhpc0FyZywgYXJncyk7XHRcclxuXHR9O1xyXG5cclxuXHRjb29rRGF0YShkYXRhOiBhbnkpe1xyXG5cdFx0cmV0dXJuIGRhdGE7XHJcblx0fTtcclxuXHJcblx0cmVuZGVyKGRhdGE6IGFueSwgbWV0YT86IEdhcCwgcGFyZW50PzogRmdJbnN0YW5jZSl7XHJcblx0XHRpZiAoZGF0YSBpbnN0YW5jZW9mIEhUTUxFbGVtZW50KXtcclxuXHRcdFx0cmV0dXJuIHRoaXMucmVuZGVySW4uYXBwbHkodGhpcywgYXJndW1lbnRzKTtcclxuXHRcdH07XHJcblx0XHRsZXQgZmcgPSBuZXcgZmdJbnN0YW5jZU1vZHVsZS5GZ0luc3RhbmNlKHRoaXMsIHBhcmVudCk7XHJcblx0XHRmZy5jb2RlID0gZmcuZ2V0SHRtbChkYXRhLCBtZXRhKTtcclxuXHRcdHJldHVybiBmZztcclxuXHR9O1xyXG5cclxuXHRyZW5kZXJJbihwYXJlbnROb2RlOiBIVE1MRWxlbWVudCwgZGF0YTogYW55LCBtZXRhPzogR2FwLCBwYXJlbnQ/OiBGZ0luc3RhbmNlKXtcclxuXHRcdGNvbnN0IGZnID0gdGhpcy5yZW5kZXIoZGF0YSwgbWV0YSwgcGFyZW50KTtcclxuXHRcdHBhcmVudE5vZGUuaW5uZXJIVE1MID0gZmcuY29kZTtcclxuXHRcdGZnLmFzc2lnbigpO1xyXG5cdFx0cmV0dXJuIGZnO1xyXG5cdH07XHJcblxyXG5cdGFwcGVuZFRvKHBhcmVudE5vZGU6IEhUTUxFbGVtZW50LCBkYXRhOiBhbnkpe1xyXG5cdFx0bGV0IGZnID0gdGhpcy5yZW5kZXIoZGF0YSk7XHRcclxuXHRcdGxldCBkaXYgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKTtcclxuXHRcdGRpdi5pbm5lckhUTUwgPSBmZy5jb2RlO1xyXG5cdFx0W10uc2xpY2UuY2FsbChkaXYuY2hpbGRyZW4pLmZvckVhY2goZnVuY3Rpb24oY2hpbGQ6IEhUTUxFbGVtZW50KXtcclxuXHRcdFx0cGFyZW50Tm9kZS5hcHBlbmRDaGlsZChjaGlsZCk7XHJcblx0XHR9KTtcclxuXHRcdGZnLmFzc2lnbigpO1xyXG5cdH07XHJcblx0XHJcbn07XHJcblxyXG5mdW5jdGlvbiBtYXRjaChmZzogRmdJbnN0YW5jZSwgbm9kZTogSFRNTEVsZW1lbnQsIHNlbGVjdG9yOiBzdHJpbmcpe1xyXG5cdGxldCBkb21FbG1zID0gZmcuZ2V0RG9tKCk7XHJcblx0d2hpbGUgKG5vZGUpe1xyXG5cdFx0aWYgKG5vZGUubWF0Y2hlcyhzZWxlY3Rvcikpe1xyXG5cdFx0XHRyZXR1cm4gdHJ1ZTtcclxuXHRcdH07XHJcblx0XHRpZiAoZG9tRWxtcy5pbmRleE9mKG5vZGUpID49IDApe1xyXG5cdFx0XHRyZXR1cm4gZmFsc2U7XHJcblx0XHR9O1x0XHRcclxuXHRcdG5vZGUgPSBub2RlLnBhcmVudEVsZW1lbnQ7XHJcblx0fTtcclxuXHRyZXR1cm4gZmFsc2U7XHJcbn07IiwiXCJ1c2Ugc3RyaWN0XCI7XHJcblxyXG5pbXBvcnQgcmVuZGVyVHBsIGZyb20gJy4uL3RwbFJlbmRlcic7XHJcbmltcG9ydCAqIGFzIGdhcENsYXNzTWdyIGZyb20gJy4vZ2FwQ2xhc3NNZ3InO1xyXG5pbXBvcnQgRXZlbnRFbWl0dGVyIGZyb20gJy4uL2V2ZW50RW1pdHRlcic7XHJcbmltcG9ydCB7VHBsfSBmcm9tICcuLi90cGxNZ3InO1xyXG5pbXBvcnQge0dhcH0gZnJvbSAnLi9nYXBDbGFzc01ncic7XHJcbmltcG9ydCB7RmdDbGFzc30gZnJvbSAnLi9mZ0NsYXNzJztcclxuaW1wb3J0ICogYXMgdXRpbHMgZnJvbSAnLi4vdXRpbHMnO1xyXG5pbXBvcnQgR2FwU3RvcmFnZSBmcm9tICcuL0dhcFN0b3JhZ2UnO1xyXG5pbXBvcnQgKiBhcyBnbG9iYWxFdmVudHMgZnJvbSAnLi9nbG9iYWxFdmVudHMnO1xyXG5pbXBvcnQgR1Jvb3QgZnJvbSAnLi4vZ2Fwcy9yb290JztcclxuY29uc3QgaGVscGVyID0gcmVxdWlyZSgnLi9oZWxwZXInKTtcclxuXHJcbmV4cG9ydCBjb25zdCBmZ0luc3RhbmNlVGFibGU6IEZnSW5zdGFuY2VbXSA9IFtdO1xyXG5cclxuZXhwb3J0IGNsYXNzIEZnSW5zdGFuY2VCYXNleyBcclxuXHRpZDogbnVtYmVyO1xyXG5cdG5hbWU6IHN0cmluZztcclxuXHRmZ0NsYXNzOiBGZ0NsYXNzO1xyXG5cdGNvZGU6IHN0cmluZztcdFxyXG5cdGRvbTogSFRNTEVsZW1lbnRbXTtcclxuXHRkYXRhOiBhbnk7XHJcblx0bWV0YTogR2FwO1xyXG5cdGdhcE1ldGE6IEdhcDtcclxuXHRwYXJlbnQ6IEZnSW5zdGFuY2U7XHJcblx0ZXZlbnRFbWl0dGVyOiBFdmVudEVtaXR0ZXI7XHJcblx0Z2FwU3RvcmFnZTogR2FwU3RvcmFnZTtcclxuXHRjaGlsZEZnczogRmdJbnN0YW5jZVtdO1xyXG5cclxuXHRjb25zdHJ1Y3RvcihmZ0NsYXNzOiBGZ0NsYXNzLCBwYXJlbnQ6IEZnSW5zdGFuY2Upe1xyXG5cdFx0dGhpcy5pZCA9IGZnSW5zdGFuY2VUYWJsZS5sZW5ndGg7XHJcblx0XHRmZ0NsYXNzLmluc3RhbmNlcy5wdXNoKHRoaXMpO1xyXG5cdFx0dGhpcy5uYW1lID0gZmdDbGFzcy5uYW1lO1xyXG5cdFx0dGhpcy5mZ0NsYXNzID0gZmdDbGFzcztcclxuXHRcdHRoaXMuY29kZSA9IG51bGw7XHJcblx0XHR0aGlzLnBhcmVudCA9IHBhcmVudCB8fCBudWxsO1xyXG5cdFx0dGhpcy5ldmVudEVtaXR0ZXIgPSBuZXcgRXZlbnRFbWl0dGVyKGZnQ2xhc3MuZXZlbnRFbWl0dGVyKTtcclxuXHRcdHRoaXMuZ2FwU3RvcmFnZSA9IG5ldyBHYXBTdG9yYWdlKHRoaXMpO1xyXG5cdFx0dGhpcy5jaGlsZEZncyA9IFtdO1xyXG5cdFx0ZmdJbnN0YW5jZVRhYmxlLnB1c2godGhpcyk7XHRcclxuXHR9O1xyXG5cclxuXHRvbihldmVudDogc3RyaW5nLCBmbjogRnVuY3Rpb24pe1xyXG5cdFx0Z2xvYmFsRXZlbnRzLmxpc3RlbihldmVudCk7XHJcblx0XHR0aGlzLmV2ZW50RW1pdHRlci5vbihldmVudCwgZm4pO1x0XHJcblx0fTtcclxuXHJcblx0ZW1pdCguLi5yZXN0OiBhbnlbXSl7XHJcblx0XHR0aGlzLmV2ZW50RW1pdHRlci5lbWl0LmFwcGx5KHRoaXMuZXZlbnRFbWl0dGVyLCBhcmd1bWVudHMpO1x0XHRcclxuXHR9O1xyXG5cclxuXHRlbWl0QXBwbHkoLi4ucmVzdDogYW55W10pe1xyXG5cdFx0dGhpcy5ldmVudEVtaXR0ZXIuZW1pdC5hcHBseSh0aGlzLmV2ZW50RW1pdHRlciwgYXJndW1lbnRzKTtcdFx0XHJcblx0fTtcclxuXHJcblx0dG9TdHJpbmcoKXtcclxuXHRcdHJldHVybiB0aGlzLmNvZGU7XHJcblx0fTtcclxuXHJcblx0YXNzaWduKCl7XHJcblx0XHQvLyB0aGlzLmVtaXRBcHBseSgncmVhZHknLCB0aGlzLCBbXSk7XHJcblx0XHQvLyB0aGlzLmRvbSA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdmZy1paWQtJyArIHRoaXMuaWQpO1xyXG5cdFx0Ly8gdGhpcy5nYXBTdG9yYWdlLmFzc2lnbigpO1xyXG5cdFx0Ly8gcmV0dXJuIHRoaXMuZG9tO1xyXG5cdH07XHJcblxyXG5cdHJlbmRlclRwbCh0cGw6IFRwbCwgcGFyZW50OiBHYXAsIGRhdGE6IGFueSwgbWV0YT86IEdhcCl7XHJcblx0XHRyZXR1cm4gcmVuZGVyVHBsLmNhbGwoe1xyXG5cdFx0XHRcInJlbmRlckdhcFwiOiBnYXBDbGFzc01nci5yZW5kZXIsXHJcblx0XHRcdFwiY29udGV4dFwiOiB0aGlzXHJcblx0XHR9LCB0cGwsIHBhcmVudCwgZGF0YSwgbWV0YSk7XHJcblx0fTtcclxuXHJcblx0Z2V0SHRtbChkYXRhOiBhbnksIG1ldGE/OiBHYXApOiBzdHJpbmd7XHJcblx0XHR0aGlzLmRhdGEgPSBkYXRhO1xyXG5cdFx0dGhpcy5nYXBNZXRhID0gbWV0YTtcclxuXHRcdGxldCByb290R2FwID0gbmV3IEdSb290KHRoaXMsIG1ldGEpO1xyXG5cdFx0cm9vdEdhcC50eXBlID0gXCJyb290XCI7XHJcblx0XHRyb290R2FwLmlzVmlydHVhbCA9IHRydWU7XHJcblx0XHRyb290R2FwLmZnID0gdGhpcztcclxuXHRcdHRoaXMubWV0YSA9IHJvb3RHYXAgYXMgR2FwO1xyXG5cdFx0Y29uc3QgY29va2VkRGF0YSA9IHRoaXMuZmdDbGFzcy5jb29rRGF0YShkYXRhKTtcclxuXHRcdHJldHVybiB0aGlzLnJlbmRlclRwbCh0aGlzLmZnQ2xhc3MudHBsLCByb290R2FwIGFzIEdhcCwgY29va2VkRGF0YSwgbWV0YU1hcC5iaW5kKG51bGwsIHRoaXMpKTtcclxuXHR9O1xyXG5cclxuXHR1cGRhdGUoc2NvcGVQYXRoOiBzdHJpbmdbXSwgbmV3VmFsdWU6IGFueSk6IEZnSW5zdGFuY2V7XHJcblx0XHRpZiAoYXJndW1lbnRzLmxlbmd0aCA9PT0gMCl7XHJcblx0XHRcdHJldHVybiB0aGlzLnVwZGF0ZShbXSwgdGhpcy5kYXRhKTsgLy8gdG9kb1xyXG5cdFx0fTtcclxuXHRcdGlmIChhcmd1bWVudHMubGVuZ3RoID09PSAxKXtcclxuXHRcdFx0cmV0dXJuIHRoaXMudXBkYXRlKFtdLCBhcmd1bWVudHNbMF0pO1xyXG5cdFx0fTtcclxuXHRcdGNvbnN0IHZhbHVlOiBhbnkgPSB1dGlscy5kZWVwQ2xvbmUobmV3VmFsdWUpO1xyXG5cdFx0Y29uc3Qgc2VsZiA9IHRoaXM7XHJcblx0XHRjb25zdCBvbGRWYWx1ZTogYW55ID0gdXRpbHMub2JqUGF0aChzY29wZVBhdGgsIHRoaXMuZGF0YSk7XHJcblx0XHRpZiAob2xkVmFsdWUgPT09IHZhbHVlKXtcclxuXHRcdFx0cmV0dXJuIHRoaXM7XHJcblx0XHR9O1x0XHJcblx0XHR0aGlzLmVtaXQoJ3VwZGF0ZScsIHNjb3BlUGF0aCwgbmV3VmFsdWUpO1xyXG5cdFx0aWYgKHNjb3BlUGF0aC5sZW5ndGggPiAwKXtcclxuXHRcdFx0dXRpbHMub2JqUGF0aChzY29wZVBhdGgsIHRoaXMuZGF0YSwgdmFsdWUpO1xyXG5cdFx0fWVsc2V7XHJcblx0XHRcdHRoaXMuZGF0YSA9IHZhbHVlO1xyXG5cdFx0fVxyXG5cdFx0Y29uc3Qgc2NvcGUgPSB0aGlzLmdhcFN0b3JhZ2UuYnlTY29wZShzY29wZVBhdGgpO1xyXG5cdFx0Y29uc3QgZ2FwcyA9IHNjb3BlLnRhcmdldDtcclxuXHRcdGdhcHMuZm9yRWFjaChmdW5jdGlvbihnYXA6IEdhcCl7XHJcblx0XHRcdGdhcC51cGRhdGUoc2VsZiwgZ2FwLCBzY29wZVBhdGgsIHZhbHVlLCBvbGRWYWx1ZSk7XHJcblx0XHR9KTtcclxuXHRcdHNjb3BlLnBhcmVudHMuZm9yRWFjaChmdW5jdGlvbihwYXJlbnROb2RlOiBhbnkpe1xyXG5cdFx0XHRwYXJlbnROb2RlLmRhdGEuZ2Fwcy5mb3JFYWNoKGZ1bmN0aW9uKHBhcmVudEdhcDogR2FwKXtcclxuXHRcdFx0XHRpZiAocGFyZW50R2FwLnR5cGUgPT09IFwiZmdcIil7XHJcblx0XHRcdFx0XHRjb25zdCBzdWJQYXRoID0gc2NvcGVQYXRoLnNsaWNlKHBhcmVudEdhcC5zY29wZVBhdGgucGF0aC5sZW5ndGgpO1xyXG5cdFx0XHRcdFx0Ly92YXIgc3ViVmFsID0gdXRpbHMub2JqUGF0aChzdWJQYXRoLCBzZWxmLmRhdGEpO1xyXG5cdFx0XHRcdFx0cGFyZW50R2FwLmZnLnVwZGF0ZShzdWJQYXRoLCBuZXdWYWx1ZSk7XHJcblx0XHRcdFx0fTtcdFx0XHRcclxuXHRcdFx0fSk7XHJcblx0XHR9KTtcclxuXHRcdHNjb3BlLnN1YnMuZm9yRWFjaChmdW5jdGlvbihzdWIpe1xyXG5cdFx0XHRjb25zdCBzdWJWYWwgPSB1dGlscy5vYmpQYXRoKHN1Yi5wYXRoLCBzZWxmLmRhdGEpO1x0XHJcblx0XHRcdGNvbnN0IHN1YlBhdGggPSBzdWIucGF0aC5zbGljZShzY29wZVBhdGgubGVuZ3RoKTtcclxuXHRcdFx0Y29uc3Qgb2xkU3ViVmFsID0gdXRpbHMub2JqUGF0aChzdWJQYXRoLCBvbGRWYWx1ZSk7XHJcblx0XHRcdGlmIChzdWJWYWwgPT09IG9sZFN1YlZhbCl7XHJcblx0XHRcdFx0cmV0dXJuO1xyXG5cdFx0XHR9O1xyXG5cdFx0XHRzdWIuZ2Fwcy5mb3JFYWNoKGZ1bmN0aW9uKGdhcDogR2FwKXtcclxuXHRcdFx0XHRpZiAoc2VsZi5nYXBTdG9yYWdlLmdhcHMuaW5kZXhPZihnYXApIDwgMCl7XHJcblx0XHRcdFx0XHRyZXR1cm47XHJcblx0XHRcdFx0fTtcclxuXHRcdFx0XHRnYXBDbGFzc01nci51cGRhdGUoc2VsZiwgZ2FwLCBzdWIucGF0aCwgc3ViVmFsLCBvbGRTdWJWYWwpO1xyXG5cdFx0XHR9KTtcclxuXHRcdH0pO1xyXG5cdFx0cmV0dXJuIHRoaXM7XHJcblx0fTtcclxuXHJcblx0Y2xvbmVEYXRhKCl7XHJcblx0XHRyZXR1cm4gdXRpbHMuZGVlcENsb25lKHRoaXMuZGF0YSk7XHJcblx0fTtcclxuXHJcblx0Y2xlYXIoKXtcclxuXHRcdHRoaXMuY2hpbGRGZ3MuZm9yRWFjaChmdW5jdGlvbihjaGlsZCl7XHJcblx0XHRcdChjaGlsZCBhcyBGZ0luc3RhbmNlQmFzZSkucmVtb3ZlKHRydWUpO1xyXG5cdFx0fSk7XHJcblx0XHR0aGlzLmNvZGUgPSAnJztcclxuXHRcdHRoaXMuZGF0YSA9IG51bGw7XHJcblx0XHR0aGlzLmdhcFN0b3JhZ2UgPSBudWxsO1xyXG5cdFx0dGhpcy5jaGlsZEZncyA9IFtdO1xyXG5cdH07XHJcblxyXG5cdHJlbW92ZSh2aXJ0dWFsOiBib29sZWFuKXtcclxuXHRcdGlmICghdmlydHVhbCl7XHJcblx0XHRcdHZhciBkb20gPSB0aGlzLmdldERvbSgpO1xyXG5cdFx0XHRkb20uZm9yRWFjaChmdW5jdGlvbihlbG0pe1xyXG5cdFx0XHRcdGVsbS5yZW1vdmUoKTtcclxuXHRcdFx0fSk7XHJcblx0XHR9O1xyXG5cdFx0dGhpcy5jbGVhcigpO1xyXG5cdFx0dmFyIGluc3RhbmNlSWQgPSB0aGlzLmZnQ2xhc3MuaW5zdGFuY2VzLmluZGV4T2YodGhpcyk7XHRcclxuXHRcdHRoaXMuZmdDbGFzcy5pbnN0YW5jZXMuc3BsaWNlKGluc3RhbmNlSWQsIDEpO1xyXG5cdFx0ZmdJbnN0YW5jZVRhYmxlW3RoaXMuaWRdID0gbnVsbDtcclxuXHR9O1xyXG5cclxuXHRyZXJlbmRlcihkYXRhOiBhbnkpe1xyXG5cdFx0dGhpcy5jbGVhcigpO1xyXG5cdFx0dGhpcy5nYXBTdG9yYWdlID0gbmV3IEdhcFN0b3JhZ2UodGhpcyk7XHJcblx0XHR2YXIgZG9tID0gdGhpcy5nZXREb20oKVswXTtcclxuXHRcdHRoaXMuY29kZSA9IHRoaXMuZ2V0SHRtbChkYXRhLCBudWxsKTtcclxuXHRcdGRvbS5vdXRlckhUTUwgPSB0aGlzLmNvZGU7IC8vIGRvZXNudCB3b3JrIHdpdGggbXVsdGkgcm9vdFxyXG5cdFx0dGhpcy5hc3NpZ24oKTtcclxuXHRcdHJldHVybiB0aGlzO1xyXG5cdH07XHJcblxyXG5cdGdldERvbSgpe1xyXG5cdFx0cmV0dXJuIHRoaXMubWV0YS5nZXREb20oKTtcclxuXHR9O1xyXG5cclxuXHRqcSgpe1xyXG5cdFx0dmFyIGRvbSA9IHRoaXMuZ2V0RG9tKCk7XHJcblx0XHR2YXIgcmVzID0gaGVscGVyLmpxKGRvbSk7XHJcblx0XHRpZiAoYXJndW1lbnRzLmxlbmd0aCA9PT0gMCl7XHJcblx0XHRcdHJldHVybiByZXM7XHJcblx0XHR9O1xyXG5cdFx0dmFyIHNlbGVjdG9yID0gYXJndW1lbnRzWzBdO1xyXG5cdFx0dmFyIHNlbGZTZWxlY3RlZCA9IHJlc1xyXG5cdFx0XHQucGFyZW50KClcclxuXHRcdFx0LmZpbmQoc2VsZWN0b3IpXHJcblx0XHRcdC5maWx0ZXIoZnVuY3Rpb24oaWQ6IG51bWJlciwgZWxtOiBhbnkpe1xyXG5cdFx0XHRcdHJldHVybiBkb20uaW5kZXhPZihlbG0pID49IDA7XHJcblx0XHRcdH0pO1xyXG5cdFx0dmFyIGNoaWxkU2VsZWN0ZWQgPSByZXMuZmluZChzZWxlY3Rvcik7XHJcblx0XHRyZXR1cm4gc2VsZlNlbGVjdGVkLmFkZChjaGlsZFNlbGVjdGVkKTtcclxuXHR9O1xyXG5cclxuXHRnYXAoaWQ6IHN0cmluZyl7XHJcblx0XHRyZXR1cm4gdGhpcy5nYXBzKGlkKVswXTtcclxuXHR9O1xyXG5cclxuXHRnYXBzKGlkOiBzdHJpbmcpe1xyXG5cdFx0dmFyIGdhcHMgPSB0aGlzLmdhcFN0b3JhZ2UuYnlFaWQoaWQpO1xyXG5cdFx0aWYgKGdhcHMpe1xyXG5cdFx0XHRyZXR1cm4gZ2FwcztcclxuXHRcdH07XHRcclxuXHR9O1xyXG5cclxuXHRzdWIoaWQ6IHN0cmluZyl7XHJcblx0XHR2YXIgZ2FwID0gdGhpcy5nYXAoaWQpO1xyXG5cdFx0aWYgKCFnYXApe1xyXG5cdFx0XHRyZXR1cm4gbnVsbDtcclxuXHRcdH07XHJcblx0XHRyZXR1cm4gZ2FwLmZnIHx8IG51bGw7IFxyXG5cdH07XHJcbn07XHJcblxyXG5leHBvcnQgY2xhc3MgRmdJbnN0YW5jZSBleHRlbmRzIEZnSW5zdGFuY2VCYXNle1xyXG5cdGNvbnN0cnVjdG9yKGZnQ2xhc3M6IGFueSwgcGFyZW50OiBGZ0luc3RhbmNlKXtcclxuXHRcdGlmICghIWZhbHNlKXtcclxuXHRcdFx0c3VwZXIoZmdDbGFzcywgcGFyZW50KTtcclxuXHRcdH07XHJcblx0XHRyZXR1cm4gbmV3IGZnQ2xhc3MuY3JlYXRlRm4oZmdDbGFzcywgcGFyZW50KTtcdFx0XHJcblx0fTtcclxufTtcclxuXHJcbmZ1bmN0aW9uIGdldENsYXNzZXMobWV0YTogR2FwKXtcclxuXHRpZiAoIW1ldGEgfHwgIW1ldGEuYXR0cnMgfHwgIW1ldGEuYXR0cnMuY2xhc3Mpe1xyXG5cdFx0cmV0dXJuIFtdO1xyXG5cdH07XHJcblx0aWYgKEFycmF5LmlzQXJyYXkobWV0YS5hdHRycy5jbGFzcykpe1xyXG5cdFx0cmV0dXJuIG1ldGEuYXR0cnMuY2xhc3M7XHJcblx0fTtcdFx0XHJcblx0cmV0dXJuIG1ldGEuYXR0cnMuY2xhc3Muc3BsaXQoJyAnKTtcclxufTtcclxuXHJcbmZ1bmN0aW9uIG1ldGFNYXAoZmc6IEZnSW5zdGFuY2UsIG1ldGFQYXJ0OiBhbnkpe1xyXG5cdHZhciByZXM6IGFueSA9IHV0aWxzLnNpbXBsZUNsb25lKG1ldGFQYXJ0KTtcclxuXHR2YXIgY2xhc3NlcyA9IGdldENsYXNzZXMocmVzKTtcclxuXHR2YXIgZmdfY2lkID0gXCJmZy1jaWQtXCIgKyBmZy5mZ0NsYXNzLmlkO1xyXG5cdHJlcy5hdHRycyA9IHV0aWxzLnNpbXBsZUNsb25lKG1ldGFQYXJ0LmF0dHJzKTtcclxuXHRpZiAoQXJyYXkuaXNBcnJheShyZXMuYXR0cnMuY2xhc3MpKXtcclxuXHRcdHJlcy5hdHRycy5jbGFzcyA9IFsnZmcnLCAnICcsIGZnX2NpZCwgJyAnXS5jb25jYXQoY2xhc3Nlcyk7XHJcblx0XHRyZXR1cm4gcmVzO1x0XHJcblx0fTtcdFxyXG5cdHJlcy5hdHRycy5jbGFzcyA9IFsnZmcnLCBmZ19jaWRdLmNvbmNhdChjbGFzc2VzKS5qb2luKCcgJyk7XHJcblx0cmV0dXJuIHJlcztcclxufTtcclxuXHJcbmZ1bmN0aW9uIGNyZWF0ZVNjb3BlSGVscGVyKGZnOiBGZ0luc3RhbmNlLCBvYmo6IGFueSwgc2NvcGVQYXRoOiBzdHJpbmdbXSl7XHJcblx0dmFyIGhlbHBlciA9IEFycmF5LmlzQXJyYXkob2JqKSBcclxuXHRcdD8gW10gXHJcblx0XHQ6IHt9O1xyXG5cdHV0aWxzLm9iakZvcihvYmosIGZ1bmN0aW9uKHZhbHVlOiBhbnksIGtleTogc3RyaW5nKXtcclxuXHRcdHZhciBwcm9wU2NvcGVQYXRoID0gc2NvcGVQYXRoLmNvbmNhdChba2V5XSk7XHJcblx0XHRPYmplY3QuZGVmaW5lUHJvcGVydHkoaGVscGVyLCBrZXksIHtcclxuXHRcdFx0Z2V0OiBmdW5jdGlvbigpe1xyXG5cdFx0XHRcdGlmICh0eXBlb2YgdmFsdWUgPT09IFwib2JqZWN0XCIpe1xyXG5cdFx0XHRcdFx0cmV0dXJuIGNyZWF0ZVNjb3BlSGVscGVyKGZnLCBvYmpba2V5XSwgcHJvcFNjb3BlUGF0aCk7XHJcblx0XHRcdFx0fTtcclxuXHRcdFx0XHRyZXR1cm4gb2JqW2tleV07XHJcblx0XHRcdH0sXHJcblx0XHRcdHNldDogZnVuY3Rpb24odmFsKXtcclxuXHRcdFx0XHRmZy51cGRhdGUocHJvcFNjb3BlUGF0aCwgdmFsKTtcdFx0XHRcdFxyXG5cdFx0XHR9XHRcclxuXHRcdH0pO1xyXG5cdH0pO1xyXG5cdHJldHVybiBoZWxwZXI7XHJcbn07XHJcblxyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIGdldEZnQnlJaWQoaWlkOiBudW1iZXIpOiBGZ0luc3RhbmNle1xyXG5cdHJldHVybiBmZ0luc3RhbmNlVGFibGVbaWlkXTtcclxufTsiLCJcInVzZSBzdHJpY3RcIjtcclxuXHJcbmltcG9ydCB7RmdJbnN0YW5jZX0gZnJvbSAnLi9mZ0luc3RhbmNlJztcclxuaW1wb3J0IHtJVmFsdWVQYXRofSBmcm9tICcuLi92YWx1ZU1ncic7XHJcbmltcG9ydCB7VHBsfSBmcm9tICcuLi90cGxNZ3InO1xyXG5pbXBvcnQgKiBhcyB1dGlscyBmcm9tICcuLi91dGlscyc7XHJcbmltcG9ydCAqIGFzIHZhbHVlTWdyIGZyb20gJy4uL3ZhbHVlTWdyJztcclxuaW1wb3J0IHtJQXN0Tm9kZX0gZnJvbSAnLi4vdHBsTWdyJztcclxuXHJcbmV4cG9ydCBhYnN0cmFjdCBjbGFzcyBHYXB7XHJcblx0dHlwZTogc3RyaW5nO1xyXG5cdGNoaWxkcmVuOiBHYXBbXTtcclxuXHRwYXJlbnQ6IEdhcDtcclxuXHRyb290OiBHYXA7XHJcblx0Y29udGV4dDogRmdJbnN0YW5jZTtcclxuXHRwYXRoOiBJVmFsdWVQYXRoOyAgXHJcblx0cmVzb2x2ZWRQYXRoOiBJVmFsdWVQYXRoO1xyXG5cdGVpZDogc3RyaW5nO1xyXG5cdGdpZDogbnVtYmVyO1xyXG5cdHNjb3BlUGF0aDogSVZhbHVlUGF0aDtcclxuXHRpc1ZpcnR1YWw6IGJvb2xlYW47XHJcblx0Zmc6IEZnSW5zdGFuY2U7XHJcblx0c3RvcmFnZUlkOiBudW1iZXI7XHJcblx0YXR0cnM6IGFueTtcclxuXHRjb250ZW50OiBUcGw7XHJcblx0Y3VycmVudFNjb3BlSG9sZGVyOiBHYXA7XHJcblxyXG5cdGNvbnN0cnVjdG9yIChjb250ZXh0OiBGZ0luc3RhbmNlLCBwYXJzZWRNZXRhPzogYW55LCBwYXJlbnQ/OiBHYXApe1x0XHJcblx0XHR1dGlscy5leHRlbmQodGhpcywgcGFyc2VkTWV0YSk7IC8vIHRvZG86IHdoeT9cclxuXHRcdHRoaXMuY2hpbGRyZW4gPSBbXTtcdFxyXG5cdFx0dGhpcy5wYXJlbnQgPSBwYXJlbnQgfHwgbnVsbDtcclxuXHRcdHRoaXMucm9vdCA9IHRoaXM7XHJcblx0XHR0aGlzLmNvbnRleHQgPSBjb250ZXh0O1x0XHJcblx0XHQvL3RoaXMuc2NvcGVQYXRoID0gdXRpbHMuZ2V0U2NvcGVQYXRoKHRoaXMpO1xyXG5cdFx0Ly90aGlzLnRyaWdnZXJzID0gW107XHJcblx0XHRjb250ZXh0LmdhcFN0b3JhZ2UucmVnKHRoaXMpO1xyXG5cdFx0aWYgKHRoaXMucGF0aCl7XHJcblx0XHRcdHRoaXMucmVzb2x2ZWRQYXRoID0gdmFsdWVNZ3IucmVzb2x2ZVBhdGgodGhpcywgdGhpcy5wYXRoKTsgXHJcblx0XHRcdGlmICh0aGlzLnJlc29sdmVkUGF0aC5zb3VyY2UgPT09IFwiZGF0YVwiKXtcclxuXHRcdFx0XHRjb250ZXh0LmdhcFN0b3JhZ2Uuc2V0VHJpZ2dlcnModGhpcywgW3RoaXMucmVzb2x2ZWRQYXRoLnBhdGhdKTtcclxuXHRcdFx0fTtcdFxyXG5cdFx0fTtcclxuXHRcdGlmICghcGFyZW50KXtcclxuXHRcdFx0cmV0dXJuIHRoaXM7XHJcblx0XHR9O1xyXG5cdFx0dGhpcy5yb290ID0gcGFyZW50LnJvb3Q7XHJcblx0XHRwYXJlbnQuY2hpbGRyZW4ucHVzaCh0aGlzKTtcclxuXHR9O1xyXG5cclxuXHRzdGF0aWMgcGFyc2Uobm9kZTogSUFzdE5vZGUsIGh0bWw/OiBzdHJpbmcsIHBhcmVudE1ldGE/OiBHYXApOiBHYXB7XHJcblx0XHRyZXR1cm4gbnVsbDtcclxuXHR9O1xyXG5cclxuXHRhYnN0cmFjdCByZW5kZXIoY29udGV4dDogRmdJbnN0YW5jZSwgZGF0YTogYW55KTogc3RyaW5nO1xyXG5cclxuXHR1cGRhdGUoY29udGV4dDogRmdJbnN0YW5jZSwgbWV0YTogR2FwLCBzY29wZVBhdGg6IGFueSwgdmFsdWU6IGFueSwgb2xkVmFsdWU6IGFueSk6IHZvaWR7XHJcblx0XHRyZXR1cm47XHJcblx0fTtcclxuXHJcblx0Y2xvc2VzdChzZWxlY3Rvcjogc3RyaW5nKTogR2Fwe1xyXG5cdFx0Y29uc3QgZWlkID0gc2VsZWN0b3Iuc2xpY2UoMSk7XHJcblx0XHRsZXQgZ2FwID0gdGhpcy5wYXJlbnQ7XHJcblx0XHR3aGlsZSAoZ2FwKXtcclxuXHRcdFx0aWYgKGdhcC5laWQgPT09IGVpZCl7XHJcblx0XHRcdFx0cmV0dXJuIGdhcDtcclxuXHRcdFx0fTtcclxuXHRcdFx0Z2FwID0gZ2FwLnBhcmVudDtcclxuXHRcdH07XHJcblx0XHRyZXR1cm4gbnVsbDtcclxuXHR9O1xyXG5cclxuXHRkYXRhKHZhbD86IGFueSl7XHJcblx0XHRpZiAoYXJndW1lbnRzLmxlbmd0aCA9PT0gMCl7XHJcblx0XHRcdHJldHVybiB1dGlscy5vYmpQYXRoKHRoaXMuc2NvcGVQYXRoLnBhdGgsIHRoaXMuY29udGV4dC5kYXRhKTtcclxuXHRcdH07XHJcblx0XHR0aGlzLmNvbnRleHQudXBkYXRlKHRoaXMuc2NvcGVQYXRoLnBhdGgsIHZhbCk7XHRcclxuXHR9O1xyXG5cclxuXHRmaW5kUmVhbERvd24oKTogR2FwW117XHJcblx0XHRpZiAoIXRoaXMuaXNWaXJ0dWFsKXtcclxuXHRcdFx0cmV0dXJuIFt0aGlzXTtcclxuXHRcdH07XHJcblx0XHRsZXQgcmVzOiBHYXBbXSA9IFtdO1xyXG5cdFx0dGhpcy5jaGlsZHJlbi5mb3JFYWNoKGZ1bmN0aW9uKGNoaWxkKXtcclxuXHRcdFx0cmVzID0gcmVzLmNvbmNhdChjaGlsZC5maW5kUmVhbERvd24oKSk7XHJcblx0XHR9KTtcclxuXHRcdHJldHVybiByZXM7XHJcblx0fTtcclxuXHJcblx0Z2V0RG9tKCk6IEhUTUxFbGVtZW50W117XHJcblx0XHRpZiAoIXRoaXMuaXNWaXJ0dWFsKXtcclxuXHRcdFx0dmFyIGlkID0gW1wiZmdcIiwgdGhpcy5jb250ZXh0LmlkLCBcImdpZFwiLCB0aGlzLmdpZF0uam9pbignLScpO1xyXG5cdFx0XHRyZXR1cm4gW2RvY3VtZW50LmdldEVsZW1lbnRCeUlkKGlkKV07XHJcblx0XHR9O1xyXG5cdFx0dmFyIHJlczogSFRNTEVsZW1lbnRbXSA9IFtdO1xyXG5cdFx0dGhpcy5maW5kUmVhbERvd24oKS5mb3JFYWNoKGZ1bmN0aW9uKGdhcCl7XHJcblx0XHRcdHJlcyA9IHJlcy5jb25jYXQoZ2FwLmdldERvbSgpKTtcclxuXHRcdH0pO1xyXG5cdFx0cmV0dXJuIHJlcztcclxuXHR9O1xyXG5cclxuXHRyZW1vdmVEb20oKXtcclxuXHRcdHZhciBkb20gPSB0aGlzLmdldERvbSgpO1xyXG5cdFx0ZG9tLmZvckVhY2goZnVuY3Rpb24oZWxtKXtcclxuXHRcdFx0aWYgKCFlbG0pe1xyXG5cdFx0XHRcdHJldHVybjtcclxuXHRcdFx0fTtcclxuXHRcdFx0ZWxtLnJlbW92ZSgpO1xyXG5cdFx0fSk7XHJcblx0fTtcclxufTtcclxuXHJcbmV4cG9ydCBmdW5jdGlvbiByZW5kZXIoY29udGV4dDogRmdJbnN0YW5jZSwgcGFyZW50OiBhbnksIGRhdGE6IGFueSwgbWV0YTogYW55KXtcclxuXHR2YXIgZ2FwQ2xhc3M6IGFueSA9IGdhcHNbbWV0YS50eXBlXTtcclxuXHR2YXIgZ2FwID0gbmV3IGdhcENsYXNzKGNvbnRleHQsIG1ldGEsIHBhcmVudCkgYXMgR2FwO1xyXG5cdHJldHVybiBnYXAucmVuZGVyKGNvbnRleHQsIGRhdGEpO1xyXG59O1xyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIHVwZGF0ZShjb250ZXh0OiBGZ0luc3RhbmNlLCBnYXBNZXRhOiBhbnksIHNjb3BlUGF0aDogYW55LCB2YWx1ZTogYW55LCBvbGRWYWx1ZTogYW55KXtcclxuXHR2YXIgZ2FwQ2xhc3M6IGFueSA9IGdhcHNbZ2FwTWV0YS50eXBlXTtcclxuXHRpZiAoIWdhcENsYXNzKXtcclxuXHRcdHJldHVybjtcclxuXHR9O1xyXG5cdHJldHVybiBnYXBDbGFzcy51cGRhdGUoY29udGV4dCwgZ2FwTWV0YSwgc2NvcGVQYXRoLCB2YWx1ZSwgb2xkVmFsdWUpO1xyXG59O1xyXG5cclxuaW1wb3J0IGdhcHMgZnJvbSAnLi4vZ2Fwcyc7IiwiXCJ1c2Ugc3RyaWN0XCI7XHJcblxyXG5pbXBvcnQgKiBhcyB1dGlscyBmcm9tICcuLi91dGlscyc7XHJcbmltcG9ydCB7RmdJbnN0YW5jZX0gZnJvbSAnLi9mZ0luc3RhbmNlJztcclxuaW1wb3J0IHtHYXB9IGZyb20gJy4vZ2FwQ2xhc3NNZ3InO1xyXG5pbXBvcnQgVHJlZUhlbHBlciBmcm9tICcuLi91dGlscy9UcmVlSGVscGVyJztcclxuXHJcbmZ1bmN0aW9uIGluaXROb2RlRm4oKTogYW55e1xyXG5cdHJldHVybiB7XHJcblx0XHRnYXBzOiBbXVxyXG5cdH07XHJcbn07XHJcblxyXG5leHBvcnQgZGVmYXVsdCBjbGFzcyBHYXBTdG9yYWdle1xyXG5cdGNvbnRleHQ6IEZnSW5zdGFuY2U7XHJcblx0Z2FwczogR2FwW107XHJcblx0c2NvcGVUcmVlOiBhbnk7XHJcblx0ZWlkRGljdDogYW55O1xyXG5cclxuXHRjb25zdHJ1Y3Rvcihjb250ZXh0OiBGZ0luc3RhbmNlKXtcclxuXHRcdHRoaXMuY29udGV4dCA9IGNvbnRleHQ7XHJcblx0XHR0aGlzLmdhcHMgPSBbXTtcclxuXHRcdHRoaXMuc2NvcGVUcmVlID0gKFRyZWVIZWxwZXIgYXMgRnVuY3Rpb24pKHtcclxuXHRcdFx0a2luZDogJ2RpY3QnLFxyXG5cdFx0XHRpbml0VHJlZU5vZGU6IGluaXROb2RlRm5cclxuXHRcdH0pO1xyXG5cdFx0dGhpcy5laWREaWN0ID0ge307XHRcclxuXHR9O1xyXG5cclxuXHRzZXRTY29wZVRyaWdnZXIoZ2FwOiBHYXAsIHNjb3BlUGF0aDogc3RyaW5nW10pe1xyXG5cdFx0dmFyIHNjb3BlID0gdGhpcy5zY29wZVRyZWUuYWNjZXNzKHNjb3BlUGF0aCk7XHRcclxuXHRcdHNjb3BlLmRhdGEuZ2Fwcy5wdXNoKGdhcCk7XHJcblx0fTtcclxuXHJcblx0c2V0VHJpZ2dlcnMoZ2FwOiBHYXAsIHNjb3BlVHJpZ2dlcnM6IHN0cmluZ1tdW10pe1x0XHJcblx0XHRzY29wZVRyaWdnZXJzLmZvckVhY2godGhpcy5zZXRTY29wZVRyaWdnZXIuYmluZCh0aGlzLCBnYXApKTtcclxuXHR9O1xyXG5cclxuXHRyZWcoZ2FwOiBHYXApe1xyXG5cdFx0dmFyIGVpZCA9IGdhcC5laWQ7XHJcblx0XHRpZiAoZWlkKXtcdFx0XHJcblx0XHRcdHRoaXMuZWlkRGljdFtlaWRdID0gdGhpcy5laWREaWN0W2VpZF0gfHwgW107XHJcblx0XHRcdHRoaXMuZWlkRGljdFtlaWRdLnB1c2goZ2FwKTtcclxuXHRcdH07XHJcblx0XHR2YXIgZ2lkID0gdGhpcy5nZXRHaWQoKTtcclxuXHRcdGdhcC5naWQgPSBnaWQ7XHJcblx0XHRpZiAoIWdhcC5pc1ZpcnR1YWwpe1xyXG5cdFx0XHRnYXAuYXR0cnMgPSB1dGlscy5zaW1wbGVDbG9uZShnYXAuYXR0cnMgfHwge30pO1x0XHRcclxuXHRcdFx0Z2FwLmF0dHJzLmlkID0gW1wiZmdcIiwgdGhpcy5jb250ZXh0LmlkLCBcImdpZFwiLCBnaWRdLmpvaW4oJy0nKTtcclxuXHRcdH07XHJcblx0XHRnYXAuc3RvcmFnZUlkID0gdGhpcy5nYXBzLmxlbmd0aDtcclxuXHRcdHRoaXMuZ2Fwcy5wdXNoKGdhcCk7XHRcdFxyXG5cdH07XHJcblxyXG5cdGFzc2lnbigpe1xyXG5cdFx0dGhpcy5nYXBzLmZvckVhY2goZnVuY3Rpb24oZ2FwTWV0YSl7XHJcblx0XHRcdGlmIChnYXBNZXRhLnR5cGUgIT09IFwicm9vdFwiICYmIGdhcE1ldGEuZmcpe1xyXG5cdFx0XHRcdGdhcE1ldGEuZmcuYXNzaWduKCk7XHJcblx0XHRcdH07XHJcblx0XHR9KTtcclxuXHRcdHJldHVybjtcclxuXHR9O1xyXG5cclxuXHRieVNjb3BlKHNjb3BlUGF0aDogc3RyaW5nW10sIHRhcmdldE9ubHk/OiBib29sZWFuKXtcclxuXHRcdHZhciBzY29wZSA9IHRoaXMuc2NvcGVUcmVlLmFjY2VzcyhzY29wZVBhdGgpO1x0XHRcclxuXHRcdHZhciBzdWJOb2RlczogYW55W10gPSBbXTtcclxuXHRcdGlmIChzY29wZS5jaGlsZENvdW50ICE9PSAwICYmICF0YXJnZXRPbmx5KXtcclxuXHRcdFx0c3ViTm9kZXMgPSBzY29wZS5nZXREZWVwQ2hpbGRBcnIoKS5tYXAoZnVuY3Rpb24obm9kZTogYW55KXtcclxuXHRcdFx0XHRyZXR1cm4ge1xyXG5cdFx0XHRcdFx0Z2Fwczogbm9kZS5kYXRhLmdhcHMsXHJcblx0XHRcdFx0XHRwYXRoOiBub2RlLnBhdGhcdFxyXG5cdFx0XHRcdH07XHRcdFx0XHJcblx0XHRcdH0pO1xyXG5cdFx0fTtcclxuXHRcdHZhciBwYXJlbnRzID0gc2NvcGUuZ2V0UGFyZW50cygpO1xyXG5cdFx0cmV0dXJuIHtcclxuXHRcdFx0dGFyZ2V0OiBzY29wZS5kYXRhLmdhcHMsXHJcblx0XHRcdHN1YnM6IHN1Yk5vZGVzLFxyXG5cdFx0XHRwYXJlbnRzOiBwYXJlbnRzXHJcblx0XHR9O1xyXG5cdH07XHJcblx0cmVtb3ZlU2NvcGUoc2NvcGVQYXRoOiBzdHJpbmdbXSl7XHJcblx0XHR2YXIgc2NvcGUgPSB0aGlzLmJ5U2NvcGUoc2NvcGVQYXRoKTtcdFxyXG5cdFx0dmFyIHJlbW92ZWREb21HYXBzID0gc2NvcGUudGFyZ2V0O1xyXG5cdFx0dmFyIHJlbW92ZWRHYXBzID0gc2NvcGUudGFyZ2V0O1xyXG5cdFx0c2NvcGUuc3Vicy5mb3JFYWNoKGZ1bmN0aW9uKG5vZGUpe1xyXG5cdFx0XHRyZW1vdmVkR2FwcyA9IHJlbW92ZWRHYXBzLmNvbmNhdChub2RlLmdhcHMpO1xyXG5cdFx0fSk7XHJcblx0XHR0aGlzLnNjb3BlVHJlZS5yZW1vdmUoc2NvcGVQYXRoKTtcclxuXHRcdHRoaXMuZ2FwcyA9IHRoaXMuZ2Fwcy5maWx0ZXIoZnVuY3Rpb24oZ2FwKXtcclxuXHRcdFx0cmV0dXJuIHJlbW92ZWRHYXBzLmluZGV4T2YoZ2FwKSA8IDA7XHJcblx0XHR9KTtcclxuXHRcdHJlbW92ZWREb21HYXBzLmZvckVhY2goZnVuY3Rpb24oZ2FwOiBHYXApe1xyXG5cdFx0XHRnYXAucmVtb3ZlRG9tKCk7XHJcblx0XHR9KTtcclxuXHR9O1xyXG5cdGJ5RWlkKGVpZDogc3RyaW5nKXtcclxuXHRcdHJldHVybiB0aGlzLmVpZERpY3RbZWlkXTtcclxuXHR9O1xyXG5cdGdldEdpZCgpe1xyXG5cdFx0cmV0dXJuIHRoaXMuZ2Fwcy5sZW5ndGg7XHJcblx0fTtcclxufTsiLCJpbXBvcnQge0ZnSW5zdGFuY2V9IGZyb20gJy4vZmdJbnN0YW5jZSc7XHJcblxyXG5pbnRlcmZhY2UgSUV2ZW50VGFibGV7XHJcblx0W2tleTogc3RyaW5nXTogYm9vbGVhbjtcclxufTtcclxuXHJcbnZhciBldmVudHM6IElFdmVudFRhYmxlID0ge307XHJcblxyXG5jb25zdCB3aW46IGFueSA9IHdpbmRvdztcclxuXHJcbmV4cG9ydCBmdW5jdGlvbiBoYW5kbGVyKG5hbWU6IHN0cmluZywgZXZlbnQ6IGFueSl7XHJcblx0Y29uc3QgaGVscGVyOiBhbnkgPSB3aW5bJyRmZyddO1xyXG5cdGxldCBlbG06IEhUTUxFbGVtZW50ID0gZXZlbnQudGFyZ2V0O1xyXG5cdHdoaWxlIChlbG0pe1xyXG5cdFx0bGV0IGZnOiBGZ0luc3RhbmNlID0gaGVscGVyLmJ5RG9tKGVsbSk7XHJcblx0XHRpZiAoZmcpe1xyXG5cdFx0XHRmZy5lbWl0QXBwbHkobmFtZSwgZmcsIFtldmVudF0pO1xyXG5cdFx0XHQvL3JldHVybjtcclxuXHRcdH07XHJcblx0XHRlbG0gPSBlbG0ucGFyZW50RWxlbWVudDtcclxuXHR9O1xyXG59O1xyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIGxpc3RlbihuYW1lOiBzdHJpbmcpe1xyXG5cdGlmIChuYW1lIGluIGV2ZW50cyl7XHJcblx0XHRyZXR1cm47XHJcblx0fTtcdFxyXG5cdGV2ZW50c1tuYW1lXSA9IHRydWU7XHJcblx0ZG9jdW1lbnQuYWRkRXZlbnRMaXN0ZW5lcihuYW1lLCBoYW5kbGVyLmJpbmQobnVsbCwgbmFtZSksIHRydWUpO1xyXG59OyIsImltcG9ydCB7RmdDbGFzcywgZmdDbGFzc0RpY3R9IGZyb20gJy4vZmdDbGFzcyc7IFxyXG5pbXBvcnQge2dldEZnQnlJaWQsIEZnSW5zdGFuY2UsIGZnSW5zdGFuY2VUYWJsZX0gZnJvbSAnLi9mZ0luc3RhbmNlJzsgXHJcbmltcG9ydCB7R2FwfSBmcm9tICcuL2dhcENsYXNzTWdyJzsgXHJcblxyXG5leHBvcnQgaW50ZXJmYWNlIEhlbHBlciB7XHJcblx0KGFyZzogc3RyaW5nIHwgSFRNTEVsZW1lbnQpOiBhbnk7IFxyXG5cdGJ5RG9tKGRvbTogSFRNTEVsZW1lbnQpOiBGZ0luc3RhbmNlO1xyXG5cdGxvYWQoZmdEYXRhOiBhbnkpOiBGZ0NsYXNzIHwgRmdDbGFzc1tdO1xyXG5cdGlzRmcoZG9tTm9kZTogSFRNTEVsZW1lbnQpOiBib29sZWFuO1xyXG5cdGdhcENsb3Nlc3QoZG9tTm9kZTogSFRNTEVsZW1lbnQpOiBHYXA7XHJcblx0ZmdzOiBGZ0luc3RhbmNlW107XHJcblx0Y2xhc3NlczogRmdDbGFzc1tdO1xyXG5cdGpxOiBhbnk7XHJcbn07XHJcblxyXG5jb25zdCAkZmc6IEhlbHBlciA9IDxIZWxwZXI+ZnVuY3Rpb24oYXJnOiBzdHJpbmcgfCBIVE1MRWxlbWVudCl7XHJcblx0aWYgKGFyZyBpbnN0YW5jZW9mIEhUTUxFbGVtZW50KXtcclxuXHRcdHJldHVybiAkZmcuYnlEb20oYXJnKTtcclxuXHR9O1xyXG5cdGlmICh0eXBlb2YgYXJnID09IFwic3RyaW5nXCIpe1xyXG5cdFx0cmV0dXJuIGZnQ2xhc3NEaWN0W2FyZyBhcyBzdHJpbmddO1xyXG5cdH07XHJcbn07XHJcblxyXG5leHBvcnQgZGVmYXVsdCAkZmc7XHJcblxyXG4kZmcubG9hZCA9IGZ1bmN0aW9uKGZnRGF0YTogYW55KTogRmdDbGFzcyB8IEZnQ2xhc3NbXXtcclxuXHRpZiAoQXJyYXkuaXNBcnJheShmZ0RhdGEpKXtcdFx0XHJcblx0XHRyZXR1cm4gZmdEYXRhLm1hcCgkZmcubG9hZCk7XHJcblx0fTtcclxuXHRyZXR1cm4gbmV3IEZnQ2xhc3MoZmdEYXRhKTtcclxufTtcclxuXHJcbiRmZy5pc0ZnID0gZnVuY3Rpb24oZG9tTm9kZTogSFRNTEVsZW1lbnQpOiBib29sZWFue1xyXG5cdHJldHVybiBkb21Ob2RlLmNsYXNzTGlzdCAmJiBkb21Ob2RlLmNsYXNzTGlzdC5jb250YWlucygnZmcnKTtcclxufTtcclxuXHJcbmNvbnN0IGlpZFJlID0gL2ZnXFwtaWlkXFwtKFxcZCspL2c7XHJcbmNvbnN0IGlkUmUgPSAvZmdcXC0oXFxkKylcXC1naWRcXC0oXFxkKykvZztcclxuXHJcbiRmZy5ieURvbSA9IGZ1bmN0aW9uKGRvbU5vZGU6IEhUTUxFbGVtZW50KTogRmdJbnN0YW5jZXtcdFxyXG5cdGlmICghZG9tTm9kZSB8fCAhZG9tTm9kZS5jbGFzc05hbWUpe1xyXG5cdFx0cmV0dXJuIG51bGw7XHJcblx0fTtcclxuXHRpZiAoIX5kb21Ob2RlLmNsYXNzTmFtZS5zcGxpdCgnICcpLmluZGV4T2YoJ2ZnJykpe1xyXG5cdFx0cmV0dXJuIG51bGw7XHJcblx0fTtcclxuXHRpZiAoIWRvbU5vZGUuaWQpe1xyXG5cdFx0cmV0dXJuIG51bGw7XHJcblx0fTtcclxuXHRpZFJlLmxhc3RJbmRleCA9IDA7XHJcblx0Y29uc3QgcmVzID0gaWRSZS5leGVjKGRvbU5vZGUuaWQpO1xyXG5cdGlmICghcmVzKXtcclxuXHRcdHJldHVybiBudWxsO1xyXG5cdH07XHJcblx0Y29uc3QgaWlkID0gcGFyc2VJbnQocmVzWzFdKTtcclxuXHRyZXR1cm4gZ2V0RmdCeUlpZChpaWQpO1x0XHJcbn07XHJcblxyXG4kZmcuZ2FwQ2xvc2VzdCA9IGZ1bmN0aW9uKGRvbU5vZGU6IEhUTUxFbGVtZW50KTogR2Fwe1xyXG5cdHdoaWxlICh0cnVlKXtcclxuXHRcdGlkUmUubGFzdEluZGV4ID0gMDtcclxuXHRcdGxldCByZXMgPSBpZFJlLmV4ZWMoZG9tTm9kZS5pZCk7XHJcblx0XHRpZiAoIXJlcyl7XHJcblx0XHRcdGRvbU5vZGUgPSBkb21Ob2RlLnBhcmVudEVsZW1lbnQ7XHJcblx0XHRcdGlmICghZG9tTm9kZSl7XHJcblx0XHRcdFx0cmV0dXJuIG51bGw7XHJcblx0XHRcdH07XHJcblx0XHRcdGNvbnRpbnVlO1xyXG5cdFx0fTtcclxuXHRcdGNvbnN0IGlpZCA9IHBhcnNlSW50KHJlc1sxXSk7XHJcblx0XHRjb25zdCBmZyA9IGdldEZnQnlJaWQoaWlkKTtcclxuXHRcdGNvbnN0IGdpZCA9IHBhcnNlSW50KHJlc1syXSk7XHJcblx0XHRyZXR1cm4gZmcuZ2FwU3RvcmFnZS5nYXBzW2dpZF07XHJcblx0fTtcclxufTtcclxuXHJcbiRmZy5jbGFzc2VzID0gZmdDbGFzc0RpY3Q7XHJcblxyXG4kZmcuZmdzID0gZmdJbnN0YW5jZVRhYmxlO1xyXG5cclxuY29uc3Qgd2luOiBhbnkgPSB3aW5kb3c7XHJcblxyXG4kZmcuanEgPSB3aW5bJ2pRdWVyeSddO1xyXG5cclxud2luWyckZmcnXSA9ICRmZzsiLCJpbXBvcnQgaGVscGVyID0gcmVxdWlyZSgnLi9oZWxwZXInKTtcclxuY29uc29sZS5sb2coaGVscGVyKTsiLCJcInVzZSBzdHJpY3RcIjtcclxuXHJcbmV4cG9ydCBkZWZhdWx0IGNsYXNzIEV2ZW50RW1pdHRlcntcclxuXHRldmVudHM6IHtcclxuXHRcdFtrZXk6IHN0cmluZ106IGFueTtcclxuXHR9O1xyXG5cdHBhcmVudDogRXZlbnRFbWl0dGVyO1xyXG5cclxuXHRjb25zdHJ1Y3RvcihwYXJlbnQ/OiBFdmVudEVtaXR0ZXIpe1xyXG5cdFx0dGhpcy5ldmVudHMgPSB7fTtcclxuXHRcdHRoaXMucGFyZW50ID0gcGFyZW50O1xyXG5cdH07XHJcblxyXG5cdG9uKG5hbWU6IHN0cmluZywgZm46IEZ1bmN0aW9uKXtcclxuXHRcdHZhciBldmVudExpc3QgPSB0aGlzLmV2ZW50c1tuYW1lXTtcclxuXHRcdGlmICghZXZlbnRMaXN0KXtcclxuXHRcdFx0ZXZlbnRMaXN0ID0gW107XHJcblx0XHRcdHRoaXMuZXZlbnRzW25hbWVdID0gZXZlbnRMaXN0O1xyXG5cdFx0fTtcclxuXHRcdGV2ZW50TGlzdC5wdXNoKGZuKTtcclxuXHR9O1xyXG5cclxuXHRlbWl0KG5hbWU6IHN0cmluZywgLi4uZW1pdEFyZ3M6IGFueVtdKXtcclxuXHRcdGlmICh0aGlzLnBhcmVudCl7XHJcblx0XHRcdHRoaXMucGFyZW50LmVtaXQuYXBwbHkodGhpcy5wYXJlbnQsIGFyZ3VtZW50cyk7XHJcblx0XHR9O1xyXG5cdFx0dmFyIGV2ZW50TGlzdCA9IHRoaXMuZXZlbnRzW25hbWVdO1xyXG5cdFx0aWYgKCFldmVudExpc3Qpe1xyXG5cdFx0XHRyZXR1cm47XHJcblx0XHR9O1xyXG5cdFx0ZXZlbnRMaXN0LmZvckVhY2goZnVuY3Rpb24oZm46IEZ1bmN0aW9uKXtcclxuXHRcdFx0Zm4uYXBwbHkodGhpcywgZW1pdEFyZ3MpO1xyXG5cdFx0fSk7XHJcblx0fTtcclxuXHJcblx0ZW1pdEFwcGx5KG5hbWU6IHN0cmluZywgdGhpc0FyZzogYW55LCBhcmdzOiBhbnlbXSl7XHJcblx0XHRpZiAodGhpcy5wYXJlbnQpe1xyXG5cdFx0XHR0aGlzLnBhcmVudC5lbWl0QXBwbHkuYXBwbHkodGhpcy5wYXJlbnQsIGFyZ3VtZW50cyk7XHJcblx0XHR9O1xyXG5cdFx0dmFyIGV2ZW50TGlzdCA9IHRoaXMuZXZlbnRzW25hbWVdO1xyXG5cdFx0aWYgKCFldmVudExpc3Qpe1xyXG5cdFx0XHRyZXR1cm47XHJcblx0XHR9O1xyXG5cdFx0ZXZlbnRMaXN0LmZvckVhY2goZnVuY3Rpb24oZm46IEZ1bmN0aW9uKXtcclxuXHRcdFx0Zm4uYXBwbHkodGhpc0FyZywgYXJncyk7XHJcblx0XHR9KTtcclxuXHR9O1xyXG59OyIsIlwidXNlIHN0cmljdFwiO1xyXG5cclxuaW1wb3J0ICogYXMgdXRpbHMgZnJvbSAnLi91dGlscyc7XHJcbmltcG9ydCAqIGFzIHBhdGggZnJvbSAncGF0aCc7XHJcbmltcG9ydCB7SUFzdE5vZGV9IGZyb20gJy4vdHBsTWdyJztcclxuaW1wb3J0IHtHYXB9IGZyb20gJy4vY2xpZW50L2dhcENsYXNzTWdyJztcclxuaW1wb3J0IHtGZ0luc3RhbmNlfSBmcm9tICcuL2NsaWVudC9mZ0luc3RhbmNlJztcclxuaW1wb3J0IHtkZWZhdWx0IGFzIGdhcHN9IGZyb20gJy4vZ2Fwcyc7XHJcblxyXG4vKipcclxuICogUmVhZHMgdGhlIGdpdmVuIGFzdCBhbmQgcmV0dXJucyBnYXAgdHJlZS5cclxuICogQHBhcmFtIHtvYmplY3R9IGFzdCAtIFBhcnNlZCBBU1Qgb2YgYSB0ZW1wbGF0ZS5cclxuICogQHBhcmFtIHtzdHJpbmd9IGh0bWwgLSBTb3VyY2UgY29kZSBvZiB0ZW1wbGF0ZS4gW2RlcHJlY2F0ZWRdXHJcbiAqIEBwYXJhbSB7b2JqZWN0fSBwYXJlbnRNZXRhIC0gUGFyZW50IGdhcC5cclxuICogQHJldHVybiB7Z2FwIHwgbnVsbH1cclxuICovXHJcbmV4cG9ydCBpbnRlcmZhY2UgSUdhcE1hdGNoe1xyXG5cdGdhcDogYW55O1xyXG5cdG1ldGE6IGFueTtcclxufTtcclxuXHJcbmV4cG9ydCBmdW5jdGlvbiBwYXJzZShhc3Q6IElBc3ROb2RlLCBodG1sOiBzdHJpbmcsIHBhcmVudE1ldGE6IEdhcCl7XHJcblx0Lyp2YXIgbmFtZSA9IGFzdC5ub2RlTmFtZTtcclxuXHR2YXIgZ2FwID0gZ2FwVGFibGVbbmFtZV07XHJcblx0aWYgKCFnYXApe1xyXG5cdFx0cmV0dXJuIGZhbHNlO1xyXG5cdH07Ki9cclxuXHRsZXQgbWF0Y2hlZDogSUdhcE1hdGNoW10gPSBbXTtcclxuXHRmb3IgKGxldCBpIGluIGdhcHMpe1xyXG5cdFx0Y29uc3QgZ2FwOiB0eXBlb2YgR2FwID0gZ2Fwc1tpXTtcclxuXHRcdGNvbnN0IG1ldGEgPSBnYXAucGFyc2UoYXN0LCBodG1sLCBwYXJlbnRNZXRhKTtcclxuXHRcdGlmIChtZXRhKXtcclxuXHRcdFx0bWF0Y2hlZC5wdXNoKHtcclxuXHRcdFx0XHRcImdhcFwiOiBnYXAsXHJcblx0XHRcdFx0XCJtZXRhXCI6IG1ldGFcclxuXHRcdFx0fSk7XHJcblx0XHR9O1xyXG5cdH07XHJcblx0aWYgKG1hdGNoZWQubGVuZ3RoID4gMSl7XHJcblx0XHRjb25zdCBtYXhQcmlvciA9IE1hdGgubWF4LmFwcGx5KE1hdGgsIG1hdGNoZWQubWFwKGZ1bmN0aW9uKGl0ZW0pe1xyXG5cdFx0XHRyZXR1cm4gaXRlbS5nYXAucHJpb3JpdHkgfHwgMDtcclxuXHRcdH0pKTtcdFx0XHJcblx0XHRtYXRjaGVkID0gbWF0Y2hlZC5maWx0ZXIoZnVuY3Rpb24oaXRlbSl7XHJcblx0XHRcdHJldHVybiAoaXRlbS5nYXAucHJpb3JpdHkgfHwgMCkgPT09IG1heFByaW9yO1xyXG5cdFx0fSk7XHRcclxuXHR9XHJcblx0aWYgKG1hdGNoZWQubGVuZ3RoID09PSAxKXtcclxuXHRcdHJldHVybiBtYXRjaGVkWzBdLm1ldGE7XHJcblx0fTtcclxuXHRpZiAobWF0Y2hlZC5sZW5ndGggPT09IDApe1xyXG5cdFx0cmV0dXJuIG51bGw7XHJcblx0fTtcdFxyXG5cdGlmIChtYXRjaGVkLmxlbmd0aCA+IDEpe1xyXG5cdFx0dGhyb3cgbmV3IEVycm9yKFwiR2FwIHBhcnNpbmcgY29uZmxpY3RcIik7XHJcblx0fTtcclxuXHRyZXR1cm4gbnVsbDtcclxufTsiLCJcInVzZSBzdHJpY3RcIjtcclxuXHJcbmltcG9ydCB7R2FwfSBmcm9tICcuL2NsaWVudC9nYXBDbGFzc01ncic7XHJcblxyXG5pbXBvcnQge2RlZmF1bHQgYXMgY29udGVudH0gZnJvbSAnLi9nYXBzL2NvbnRlbnQnO1xyXG5pbXBvcnQge2RlZmF1bHQgYXMgZGF0YX0gZnJvbSAnLi9nYXBzL2RhdGEnO1xyXG5pbXBvcnQge2RlZmF1bHQgYXMgZHluYW1pY1RleHR9IGZyb20gJy4vZ2Fwcy9keW5hbWljLXRleHQnO1xyXG5pbXBvcnQge2RlZmF1bHQgYXMgZmd9IGZyb20gJy4vZ2Fwcy9mZyc7XHJcbmltcG9ydCB7ZGVmYXVsdCBhcyByYXd9IGZyb20gJy4vZ2Fwcy9yYXcnO1xyXG5pbXBvcnQge2RlZmF1bHQgYXMgc2NvcGV9IGZyb20gJy4vZ2Fwcy9zY29wZSc7XHJcbmltcG9ydCB7ZGVmYXVsdCBhcyBzY29wZUl0ZW19IGZyb20gJy4vZ2Fwcy9zY29wZS1pdGVtJztcclxuXHJcbmV4cG9ydCBpbnRlcmZhY2UgSUdhcHN7XHJcbiAgICBba2V5OiBzdHJpbmddOiB0eXBlb2YgR2FwO1xyXG59O1xyXG5cclxuY29uc3QgZ2FwczogSUdhcHMgPSB7XHJcbiAgICBjb250ZW50LFxyXG4gICAgZGF0YSxcclxuICAgIGR5bmFtaWNUZXh0LFxyXG4gICAgZmcsXHJcbiAgICByYXcsXHJcbiAgICBzY29wZSxcclxuICAgIHNjb3BlSXRlbVxyXG59O1xyXG5cclxuZXhwb3J0IGRlZmF1bHQgZ2FwczsgXHJcblxyXG4iLCJcInVzZSBzdHJpY3RcIjtcclxuXHJcbmltcG9ydCAqIGFzIHV0aWxzIGZyb20gJy4uL3V0aWxzJzsgIFxyXG5pbXBvcnQgKiBhcyB2YWx1ZU1nciBmcm9tICcuLi92YWx1ZU1ncic7ICBcclxuaW1wb3J0IHtHYXB9IGZyb20gJy4uL2NsaWVudC9nYXBDbGFzc01ncic7ICBcclxuaW1wb3J0IHtGZ0luc3RhbmNlfSBmcm9tICcuLi9jbGllbnQvZmdJbnN0YW5jZSc7ICBcclxuaW1wb3J0IHtJQXN0Tm9kZX0gZnJvbSAnLi4vdHBsTWdyJztcclxuXHJcbmV4cG9ydCBkZWZhdWx0IGNsYXNzIEdDb250ZW50IGV4dGVuZHMgR2Fwe1xyXG5cclxuXHR0eXBlOiBzdHJpbmcgPSBcImNvbnRlbnRcIjtcclxuXHJcblx0c3RhdGljIHBhcnNlKG5vZGU6IElBc3ROb2RlKXtcclxuXHRcdGlmIChub2RlLnRhZ05hbWUgIT09IFwiY29udGVudFwiKXtcclxuXHRcdFx0cmV0dXJuIG51bGw7XHJcblx0XHR9O1xyXG5cdFx0bGV0IG1ldGE6IEdDb250ZW50ID0ge30gYXMgR0NvbnRlbnQ7XHJcblx0XHRtZXRhLmlzVmlydHVhbCA9IHRydWU7XHJcblx0XHRtZXRhLnR5cGUgPSBcImNvbnRlbnRcIjtcclxuXHRcdC8qbWV0YS5mZ05hbWUgPSBub2RlLm5vZGVOYW1lLnNsaWNlKDMpO1xyXG5cdFx0bWV0YS5wYXRoID0gbm9kZS5hdHRycy5jbGFzcyBcclxuXHRcdFx0PyBub2RlLmF0dHJzLmNsYXNzLnNwbGl0KCcgJylcclxuXHRcdFx0OiBbXTtcclxuXHRcdG1ldGEuZWlkID0gbm9kZS5hdHRycy5pZCB8fCBudWxsO1xyXG5cdFx0bWV0YS5jb250ZW50ID0gdHBsTWdyLnJlYWRUcGwobm9kZSwgaHRtbCwgbWV0YSk7Ki9cclxuXHRcdHJldHVybiBtZXRhO1xyXG5cdH07XHJcblxyXG5cdHJlbmRlcihjb250ZXh0OiBGZ0luc3RhbmNlLCBkYXRhOiBhbnkpe1xyXG5cdFx0dGhpcy5zY29wZVBhdGggPSBjb250ZXh0LmdhcE1ldGEuc2NvcGVQYXRoO1xyXG5cdFx0cmV0dXJuIGNvbnRleHQucGFyZW50LnJlbmRlclRwbChjb250ZXh0Lm1ldGEuY29udGVudCwgY29udGV4dC5nYXBNZXRhLnBhcmVudCwgY29udGV4dC5wYXJlbnQuZGF0YSk7XHJcblx0fTtcclxuXHJcbn07IiwiXCJ1c2Ugc3RyaWN0XCI7XHJcblxyXG5pbXBvcnQgKiBhcyB1dGlscyBmcm9tICcuLi91dGlscyc7ICBcclxuaW1wb3J0ICogYXMgdmFsdWVNZ3IgZnJvbSAnLi4vdmFsdWVNZ3InOyAgXHJcbmltcG9ydCB7R2FwfSBmcm9tICcuLi9jbGllbnQvZ2FwQ2xhc3NNZ3InOyAgXHJcbmltcG9ydCB7RmdJbnN0YW5jZX0gZnJvbSAnLi4vY2xpZW50L2ZnSW5zdGFuY2UnOyAgXHJcbmltcG9ydCB7SUFzdE5vZGV9IGZyb20gJy4uL3RwbE1ncic7XHJcblxyXG5leHBvcnQgZGVmYXVsdCBjbGFzcyBHRGF0YSBleHRlbmRzIEdhcHtcclxuXHJcblx0dHlwZTogc3RyaW5nID0gXCJkYXRhXCI7XHJcblxyXG5cdHN0YXRpYyBwYXJzZShub2RlOiBJQXN0Tm9kZSl7XHJcblx0XHRpZiAobm9kZS50YWdOYW1lICE9IFwiZGF0YVwiKXtcclxuXHRcdFx0cmV0dXJuIG51bGw7XHJcblx0XHR9O1xyXG5cdFx0dmFyIG1ldGE6IEdEYXRhID0ge30gYXMgR0RhdGE7XHJcblx0XHRtZXRhLnR5cGUgPSBcImRhdGFcIjtcclxuXHRcdG1ldGEuaXNWaXJ0dWFsID0gZmFsc2U7XHJcblx0XHRtZXRhLnBhdGggPSB1dGlscy5wYXJzZVBhdGgobm9kZSk7XHRcdFxyXG5cdFx0bWV0YS5laWQgPSBub2RlLmF0dHJzLmlkIHx8IG51bGw7XHJcblx0XHRyZXR1cm4gbWV0YTtcclxuXHR9O1xyXG5cclxuXHRyZW5kZXIoY29udGV4dDogRmdJbnN0YW5jZSwgZGF0YTogYW55KXtcclxuXHRcdHZhciB2YWx1ZSA9IHZhbHVlTWdyLnJlbmRlcih0aGlzLCBkYXRhLCB0aGlzLnJlc29sdmVkUGF0aCk7XHJcblx0XHRyZXR1cm4gdXRpbHMucmVuZGVyVGFnKHtcclxuXHRcdFx0bmFtZTogXCJzcGFuXCIsXHJcblx0XHRcdGF0dHJzOiB0aGlzLmF0dHJzLFxyXG5cdFx0XHRpbm5lckhUTUw6IHZhbHVlXHJcblx0XHR9KTtcclxuXHR9O1xyXG5cclxuXHR1cGRhdGUoY29udGV4dDogRmdJbnN0YW5jZSwgbWV0YTogR2FwLCBzY29wZVBhdGg6IGFueSwgdmFsdWU6IGFueSl7XHJcblx0XHR2YXIgbm9kZSA9IG1ldGEuZ2V0RG9tKClbMF07XHJcblx0XHRpZiAoIW5vZGUpe1xyXG5cdFx0XHRcclxuXHRcdH07XHJcblx0XHRub2RlLmlubmVySFRNTCA9IHZhbHVlO1xyXG5cdFx0Ly9oaWdobGlnaHQobm9kZSwgWzB4ZmZmZmZmLCAweGZmZWU4OF0sIDUwMCk7XHJcblx0fTtcclxuXHJcbn07IiwiXCJ1c2Ugc3RyaWN0XCI7XHJcblxyXG5pbXBvcnQgKiBhcyB1dGlscyBmcm9tICcuLi91dGlscyc7ICBcclxuaW1wb3J0ICogYXMgdmFsdWVNZ3IgZnJvbSAnLi4vdmFsdWVNZ3InOyAgXHJcbmltcG9ydCB7U3RyVHBsLCByZWFkIGFzIHJlYWRUcGx9IGZyb20gJy4uL1N0clRwbCc7ICBcclxuaW1wb3J0IHtHYXAsIHJlbmRlcn0gZnJvbSAnLi4vY2xpZW50L2dhcENsYXNzTWdyJzsgIFxyXG5pbXBvcnQge0ZnSW5zdGFuY2V9IGZyb20gJy4uL2NsaWVudC9mZ0luc3RhbmNlJzsgIFxyXG5pbXBvcnQge0lBc3ROb2RlfSBmcm9tICcuLi90cGxNZ3InO1xyXG5pbXBvcnQgR0RhdGEgZnJvbSAnLi9kYXRhJztcclxuXHJcbmV4cG9ydCBkZWZhdWx0IGNsYXNzIEdEeW5hbWljVGV4dCBleHRlbmRzIEdhcHtcclxuXHJcblx0dHBsOiBhbnk7XHJcblx0dHlwZTogc3RyaW5nID0gXCJkeW5hbWljVGV4dFwiO1xyXG5cclxuXHRzdGF0aWMgcGFyc2Uobm9kZTogSUFzdE5vZGUpe1xyXG5cdFx0aWYgKG5vZGUudHlwZSAhPT0gXCJ0ZXh0XCIpe1xyXG5cdFx0XHRyZXR1cm4gbnVsbDtcclxuXHRcdH07XHJcblx0XHR2YXIgdHBsID0gcmVhZFRwbChub2RlLnRleHQsIHZhbHVlTWdyLnBhcnNlKTtcclxuXHRcdGlmICh0eXBlb2YgdHBsID09PSBcInN0cmluZ1wiKXtcclxuXHRcdFx0cmV0dXJuIG51bGw7XHJcblx0XHR9O1xyXG5cdFx0dmFyIG1ldGE6IEdEeW5hbWljVGV4dCA9IHt9IGFzIEdEeW5hbWljVGV4dDtcclxuXHRcdG1ldGEudHlwZSA9IFwiZHluYW1pY1RleHRcIjtcclxuXHRcdG1ldGEudHBsID0gdHBsOyBcclxuXHRcdHJldHVybiBtZXRhO1xyXG5cdH07XHJcblxyXG5cdHJlbmRlcihjb250ZXh0OiBGZ0luc3RhbmNlLCBkYXRhOiBhbnkpe1xyXG5cdFx0dmFyIG1ldGEgPSB0aGlzO1xyXG5cdFx0dmFyIHRwbCA9IG5ldyBTdHJUcGwobWV0YS50cGwsIHZhbHVlTWdyLnBhcnNlKTtcclxuXHRcdHJldHVybiB0cGwucmVuZGVyKGZ1bmN0aW9uKHBhdGgpe1xyXG5cdFx0XHR2YXIgZGF0YU1ldGEgPSB7XHJcblx0XHRcdFx0XCJ0eXBlXCI6IFwiZGF0YVwiLFxyXG5cdFx0XHRcdFwicGF0aFwiOiBwYXRoXHRcdFx0XHJcblx0XHRcdH07XHJcblx0XHRcdHZhciBpdGVtTWV0YSA9IG5ldyBHRGF0YShjb250ZXh0LCBkYXRhTWV0YSwgbWV0YS5wYXJlbnQpO1xyXG5cdFx0XHRyZXR1cm4gaXRlbU1ldGEucmVuZGVyKGNvbnRleHQsIGRhdGEpO1xyXG5cdFx0fSk7XHJcblx0fTtcclxuXHJcbn07IiwiXCJ1c2Ugc3RyaWN0XCI7XHJcblxyXG5pbXBvcnQgKiBhcyB1dGlscyBmcm9tICcuLi91dGlscyc7ICBcclxuaW1wb3J0ICogYXMgdmFsdWVNZ3IgZnJvbSAnLi4vdmFsdWVNZ3InOyAgXHJcbmltcG9ydCB7R2FwfSBmcm9tICcuLi9jbGllbnQvZ2FwQ2xhc3NNZ3InOyAgXHJcbmltcG9ydCB7RmdJbnN0YW5jZX0gZnJvbSAnLi4vY2xpZW50L2ZnSW5zdGFuY2UnOyAgXHJcbmltcG9ydCB7SUFzdE5vZGUsIHJlYWRUcGx9IGZyb20gJy4uL3RwbE1ncic7XHJcblxyXG5leHBvcnQgZGVmYXVsdCBjbGFzcyBHRmcgZXh0ZW5kcyBHYXB7XHJcblx0cGFyZW50Rmc6IEZnSW5zdGFuY2U7XHJcblx0ZmdOYW1lOiBzdHJpbmc7XHJcblx0dHlwZTogc3RyaW5nID0gXCJmZ1wiO1xyXG5cclxuXHRzdGF0aWMgcGFyc2Uobm9kZTogSUFzdE5vZGUpe1xyXG5cdFx0aWYgKG5vZGUudHlwZSAhPSAndGFnJyB8fCAhfm5vZGUudGFnTmFtZS5pbmRleE9mKFwiZmctXCIpKXtcclxuXHRcdFx0cmV0dXJuIG51bGw7XHJcblx0XHR9O1xyXG5cdFx0dmFyIG1ldGE6R0ZnID0ge30gYXMgR0ZnO1xyXG5cdFx0bWV0YS50eXBlID0gXCJmZ1wiO1xyXG5cdFx0bWV0YS5pc1ZpcnR1YWwgPSB0cnVlO1xyXG5cdFx0bWV0YS5mZ05hbWUgPSBub2RlLnRhZ05hbWUuc2xpY2UoMyk7XHJcblx0XHRtZXRhLnBhdGggPSB1dGlscy5wYXJzZVBhdGgobm9kZSk7XHRcdFxyXG5cdFx0bWV0YS5laWQgPSBub2RlLmF0dHJzLmlkIHx8IG51bGw7XHJcblx0XHRtZXRhLmNvbnRlbnQgPSByZWFkVHBsKG5vZGUsIG51bGwsIG1ldGEpO1xyXG5cdFx0cmV0dXJuIG1ldGE7XHJcblx0fTtcclxuXHJcblx0cmVuZGVyKGNvbnRleHQ6IEZnSW5zdGFuY2UsIGRhdGE6IGFueSl7XHJcblx0XHR2YXIgc2VsZiA9IHRoaXM7XHJcblx0XHR0aGlzLnBhcmVudEZnID0gY29udGV4dDtcclxuXHRcdC8vdGhpcy5yZW5kZXJlZENvbnRlbnQgPSBjb250ZXh0LnJlbmRlclRwbCh0aGlzLmNvbnRlbnQsIG1ldGEsIGRhdGEpO1xyXG5cdFx0Y29uc3Qgd2luOiBhbnkgPSB3aW5kb3c7XHJcblx0XHR2YXIgZmdDbGFzcyA9IHdpblsnJGZnJ10uY2xhc3Nlc1t0aGlzLmZnTmFtZV07XHJcblx0XHR2YXIgZmdEYXRhID0gdXRpbHMuZGVlcENsb25lKHZhbHVlTWdyLmdldFZhbHVlKHRoaXMsIGRhdGEsIHRoaXMucmVzb2x2ZWRQYXRoKSk7XHRcclxuXHRcdHZhciBmZyA9IGZnQ2xhc3MucmVuZGVyKGZnRGF0YSwgdGhpcywgY29udGV4dCk7XHJcblx0XHRmZy5vbigndXBkYXRlJywgZnVuY3Rpb24ocGF0aDogYW55LCB2YWw6IGFueSl7XHJcblx0XHRcdC8vY29udGV4dC51cGRhdGUoc2NvcGVQYXRoLmNvbmNhdChwYXRoKSwgdmFsKTtcclxuXHRcdFx0Ly9jb25zb2xlLmxvZyhwYXRoLCB2YWwpO1xyXG5cdFx0fSk7XHJcblx0XHR0aGlzLmZnID0gZmc7XHJcblx0XHRmZy5tZXRhID0gdGhpcztcclxuXHRcdGNvbnRleHQuY2hpbGRGZ3MucHVzaChmZyk7XHJcblx0XHRyZXR1cm4gZmc7XHJcblx0fTtcclxuXHJcblx0dXBkYXRlKGNvbnRleHQ6IEZnSW5zdGFuY2UsIG1ldGE6IEdhcCwgc2NvcGVQYXRoOiBhbnksIHZhbHVlOiBhbnkpe1xyXG5cdFx0dmFyIG5vZGUgPSBtZXRhLmdldERvbSgpWzBdO1xyXG5cdFx0aWYgKCFub2RlKXtcclxuXHRcdFx0XHJcblx0XHR9O1xyXG5cdFx0bm9kZS5pbm5lckhUTUwgPSB2YWx1ZTtcclxuXHRcdC8vaGlnaGxpZ2h0KG5vZGUsIFsweGZmZmZmZiwgMHhmZmVlODhdLCA1MDApO1xyXG5cdH07XHJcblxyXG59OyIsIlwidXNlIHN0cmljdFwiO1xyXG5cclxuaW1wb3J0ICogYXMgdXRpbHMgZnJvbSAnLi4vdXRpbHMnOyAgXHJcbmltcG9ydCAqIGFzIHZhbHVlTWdyIGZyb20gJy4uL3ZhbHVlTWdyJzsgIFxyXG5pbXBvcnQge1N0clRwbCwgcmVhZCBhcyByZWFkU3RyVHBsfSBmcm9tICcuLi9TdHJUcGwnOyAgXHJcbmltcG9ydCB7R2FwfSBmcm9tICcuLi9jbGllbnQvZ2FwQ2xhc3NNZ3InOyAgXHJcbmltcG9ydCB7RmdJbnN0YW5jZX0gZnJvbSAnLi4vY2xpZW50L2ZnSW5zdGFuY2UnOyAgXHJcbmltcG9ydCB7SUFzdE5vZGUsIHJlYWRUcGx9IGZyb20gJy4uL3RwbE1ncic7XHJcblxyXG5mdW5jdGlvbiBpc1Njb3BlKGl0ZW06IEdhcCl7XHJcblx0aWYgKHR5cGVvZiBpdGVtID09PSBcInN0cmluZ1wiKXtcclxuXHRcdHJldHVybiBmYWxzZTtcclxuXHR9O1xyXG5cdHJldHVybiBpdGVtLnR5cGUgPT09IFwic2NvcGVcIjtcclxufTtcclxuXHJcbmV4cG9ydCBkZWZhdWx0IGNsYXNzIEdSYXcgZXh0ZW5kcyBHYXB7XHJcblx0aXNSb290Tm9kZTogYm9vbGVhbjtcclxuXHRpc1Njb3BlSXRlbTogYm9vbGVhbjtcclxuXHRpc1Njb3BlSG9sZGVyOiBib29sZWFuO1xyXG5cdHRhZ05hbWU6IHN0cmluZztcclxuXHR0eXBlOiBzdHJpbmcgPSBcInJhd1wiO1xyXG5cdHN0YXRpYyBwcmlvcml0eTogbnVtYmVyID0gLTE7XHJcblxyXG5cdHN0YXRpYyBwYXJzZShub2RlOiBJQXN0Tm9kZSwgaHRtbD86IHN0cmluZywgcGFyZW50TWV0YT86IEdhcCl7XHJcblx0XHRpZiAobm9kZS50eXBlICE9PSBcInRhZ1wiKXtcclxuXHRcdFx0cmV0dXJuIG51bGw7XHJcblx0XHR9O1xyXG5cdFx0bGV0IGhhc0R5bmFtaWNBdHRycyA9IGZhbHNlO1xyXG5cdFx0Y29uc3QgbWV0YTogR1JhdyA9IHt9IGFzIEdSYXc7XHJcblx0XHRtZXRhLnR5cGUgPSBcInJhd1wiO1xyXG5cdFx0bWV0YS5pc1ZpcnR1YWwgPSBmYWxzZTtcclxuXHRcdG1ldGEuaXNSb290Tm9kZSA9IG5vZGUucGFyZW50LnR5cGUgIT09IFwidGFnXCI7XHJcblx0XHRtZXRhLnRhZ05hbWUgPSBub2RlLnRhZ05hbWU7XHJcblx0XHRpZiAoXCJpZFwiIGluIG5vZGUuYXR0cnMpe1xyXG5cdFx0XHRtZXRhLmVpZCA9IG5vZGUuYXR0cnMuaWQudmFsdWU7XHJcblx0XHRcdGRlbGV0ZSBub2RlLmF0dHJzLmlkO1xyXG5cdFx0fTtcclxuXHRcdGxldCBhdHRyc0FyciA9IHV0aWxzLm9ialRvS2V5VmFsdWUobm9kZS5hdHRycywgJ25hbWUnLCAndmFsdWUnKTtcclxuXHRcdGF0dHJzQXJyID0gYXR0cnNBcnIubWFwKGZ1bmN0aW9uKGF0dHIpe1x0XHJcblx0XHRcdGNvbnN0IGF0dHJWYWwgPSBhdHRyLnZhbHVlLnR5cGUgPT09IFwic3RyaW5nXCJcclxuXHRcdFx0XHQ/IGF0dHIudmFsdWUudmFsdWVcclxuXHRcdFx0XHQ6IChhdHRyLnZhbHVlLmVzY2FwZWQgPyAnIycgOiAnIScpICsgJ3snICsgYXR0ci52YWx1ZS5rZXkgKyAnfSc7XHRcdFxyXG5cdFx0XHRjb25zdCB2YWx1ZSA9IHJlYWRTdHJUcGwoYXR0clZhbCwgdmFsdWVNZ3IucGFyc2UpO1xyXG5cdFx0XHRjb25zdCBuYW1lID0gcmVhZFN0clRwbChhdHRyLm5hbWUsIHZhbHVlTWdyLnBhcnNlKTtcclxuXHRcdFx0aWYgKHR5cGVvZiB2YWx1ZSAhPT0gXCJzdHJpbmdcIiB8fCB0eXBlb2YgbmFtZSAhPT0gXCJzdHJpbmdcIil7XHJcblx0XHRcdFx0aGFzRHluYW1pY0F0dHJzID0gdHJ1ZTtcclxuXHRcdFx0fTtcclxuXHRcdFx0cmV0dXJuIHtcclxuXHRcdFx0XHRcIm5hbWVcIjogbmFtZSxcclxuXHRcdFx0XHRcInZhbHVlXCI6IHZhbHVlXHJcblx0XHRcdH07XHJcblx0XHR9KTtcdFx0XHJcblx0XHRtZXRhLmF0dHJzID0gdXRpbHMua2V5VmFsdWVUb09iaihhdHRyc0FyciwgJ25hbWUnLCAndmFsdWUnKTtcclxuXHRcdGlmIChub2RlLnZhbHVlKXtcclxuXHRcdFx0bWV0YS5wYXRoID0gdmFsdWVNZ3IucGFyc2Uobm9kZS52YWx1ZS5wYXRoLCB7XHJcblx0XHRcdFx0ZXNjYXBlZDogbm9kZS52YWx1ZS5lc2NhcGVkXHJcblx0XHRcdH0pO1xyXG5cdFx0fTtcclxuXHRcdG1ldGEuY29udGVudCA9IHJlYWRUcGwobm9kZSwgbnVsbCwgbWV0YSk7XHRcdFxyXG5cdFx0aWYgKG1ldGEuY29udGVudC5zb21lKGlzU2NvcGUpKXtcclxuXHRcdFx0bWV0YS5pc1Njb3BlSG9sZGVyID0gdHJ1ZTtcdFx0XHRcclxuXHRcdH07XHJcblx0XHRpZiAocGFyZW50TWV0YSAmJiBwYXJlbnRNZXRhLnR5cGUgPT09IFwic2NvcGVcIil7XHJcblx0XHRcdG1ldGEuaXNTY29wZUl0ZW0gPSB0cnVlO1xyXG5cdFx0fTtcclxuXHRcdGlmIChcclxuXHRcdFx0XHQhaGFzRHluYW1pY0F0dHJzIFxyXG5cdFx0XHRcdCYmICFtZXRhLmVpZFxyXG5cdFx0XHRcdCYmICFtZXRhLmlzUm9vdE5vZGUgXHJcblx0XHRcdFx0JiYgIW1ldGEuaXNTY29wZUhvbGRlciBcclxuXHRcdFx0XHQmJiAhbWV0YS5pc1Njb3BlSXRlbVxyXG5cdFx0XHRcdCYmICFtZXRhLnBhdGhcclxuXHRcdFx0KXtcclxuXHRcdFx0cmV0dXJuIG51bGw7XHJcblx0XHR9O1xyXG5cdFx0cmV0dXJuIG1ldGE7XHJcblx0fTtcclxuXHJcblx0cmVuZGVyKGNvbnRleHQ6IEZnSW5zdGFuY2UsIGRhdGE6IGFueSk6IHN0cmluZ3tcclxuXHRcdGNvbnN0IG1ldGEgPSB0aGlzO1xyXG5cdFx0aWYgKG1ldGEuaXNTY29wZUhvbGRlcil7XHJcblx0XHRcdG1ldGEucm9vdC5jdXJyZW50U2NvcGVIb2xkZXIgPSBtZXRhO1x0XHRcclxuXHRcdH07XHJcblx0XHRjb25zdCBhdHRyc0FyciA9IHV0aWxzLm9ialRvS2V5VmFsdWUobWV0YS5hdHRycywgJ25hbWUnLCAndmFsdWUnKTtcclxuXHRcdGxldCBhdHRyT2JqOiBhbnkgPSB7fTtcclxuXHRcdGF0dHJzQXJyLmZvckVhY2goZnVuY3Rpb24oYXR0cil7XHJcblx0XHRcdGNvbnN0IG5hbWUgPSBuZXcgU3RyVHBsKGF0dHIubmFtZSkucmVuZGVyKHZhbHVlTWdyLnJlc29sdmVBbmRSZW5kZXIuYmluZChudWxsLCBtZXRhLCBkYXRhKSk7XHJcblx0XHRcdGNvbnN0IHZhbHVlID0gbmV3IFN0clRwbChhdHRyLnZhbHVlKS5yZW5kZXIodmFsdWVNZ3IucmVzb2x2ZUFuZFJlbmRlci5iaW5kKG51bGwsIG1ldGEsIGRhdGEpKTtcclxuXHRcdFx0YXR0ck9ialtuYW1lXSA9IHZhbHVlO1xyXG5cdFx0fSk7XHJcblx0XHRsZXQgdHJpZ2dlcnM6IHN0cmluZ1tdW10gPSBbXTtcclxuXHRcdGNvbnRleHQuZ2FwU3RvcmFnZS5zZXRUcmlnZ2VycyhtZXRhLCB0cmlnZ2Vycyk7XHJcblx0XHRjb25zdCBpbm5lciA9IG1ldGEucGF0aCBcclxuXHRcdFx0PyB2YWx1ZU1nci5yZW5kZXIobWV0YSwgZGF0YSwgdGhpcy5yZXNvbHZlZFBhdGgpXHJcblx0XHRcdDogY29udGV4dC5yZW5kZXJUcGwobWV0YS5jb250ZW50LCBtZXRhLCBkYXRhKTtcclxuXHRcdHJldHVybiB1dGlscy5yZW5kZXJUYWcoe1xyXG5cdFx0XHRcIm5hbWVcIjogbWV0YS50YWdOYW1lLFxyXG5cdFx0XHRcImF0dHJzXCI6IGF0dHJPYmosXHJcblx0XHRcdFwiaW5uZXJIVE1MXCI6IGlubmVyXHJcblx0XHR9KTtcclxuXHR9O1xyXG5cclxuXHR1cGRhdGUoY29udGV4dDogRmdJbnN0YW5jZSwgbWV0YTogR2FwLCBzY29wZVBhdGg6IGFueSwgdmFsdWU6IGFueSl7XHJcblx0XHQvLyB0byBkbyB2YWx1ZSB1cGRhdGVcclxuXHRcdC8qdmFyIGF0dHJEYXRhID0gdXRpbHMub2JqUGF0aChtZXRhLnNjb3BlUGF0aCwgY29udGV4dC5kYXRhKTtcclxuXHRcdHZhciByZW5kZXJlZEF0dHJzID0gdXRpbHMucmVuZGVyQXR0cnMobWV0YS5hdHRycywgYXR0ckRhdGEpOyovXHJcblx0XHRjb25zdCBhdHRyc0FyciA9IHV0aWxzLm9ialRvS2V5VmFsdWUobWV0YS5hdHRycywgJ25hbWUnLCAndmFsdWUnKTtcclxuXHRcdGxldCBhdHRyT2JqOiBhbnkgPSB7fTtcclxuXHRcdGF0dHJzQXJyLmZvckVhY2goZnVuY3Rpb24oYXR0cil7XHJcblx0XHRcdGNvbnN0IG5hbWUgPSBuZXcgU3RyVHBsKGF0dHIubmFtZSkucmVuZGVyKHZhbHVlTWdyLnJlbmRlci5iaW5kKG51bGwsIG1ldGEsIGNvbnRleHQuZGF0YSkpO1xyXG5cdFx0XHRjb25zdCB2YWx1ZSA9IG5ldyBTdHJUcGwoYXR0ci52YWx1ZSkucmVuZGVyKGZ1bmN0aW9uKHBhdGgpe1xyXG5cdFx0XHRcdGNvbnN0IHJlc29sdmVkUGF0aCA9IHZhbHVlTWdyLnJlc29sdmVQYXRoKG1ldGEsIHBhdGgpO1x0XHRcclxuXHRcdFx0XHRyZXR1cm4gdmFsdWVNZ3IucmVuZGVyKG1ldGEsIGNvbnRleHQuZGF0YSwgcmVzb2x2ZWRQYXRoKTtcclxuXHRcdFx0fSk7XHJcblx0XHRcdGF0dHJPYmpbbmFtZV0gPSB2YWx1ZTtcclxuXHRcdH0pO1xyXG5cdFx0Y29uc3QgZG9tID0gbWV0YS5nZXREb20oKVswXTtcclxuXHRcdGlmIChtZXRhLnBhdGggJiYgbWV0YS5wYXRoLnBhdGguam9pbignLScpID09PSBzY29wZVBhdGguam9pbignLScpKXtcclxuXHRcdFx0ZG9tLmlubmVySFRNTCA9IG1ldGEucGF0aC5lc2NhcGVkIFxyXG5cdFx0XHRcdD8gdXRpbHMuZXNjYXBlSHRtbCh2YWx1ZSlcclxuXHRcdFx0XHQ6IHZhbHVlO1xyXG5cdFx0fTtcclxuXHRcdHV0aWxzLm9iakZvcihhdHRyT2JqLCBmdW5jdGlvbih2YWx1ZTogc3RyaW5nLCBuYW1lOiBzdHJpbmcpe1xyXG5cdFx0XHRjb25zdCBvbGRWYWwgPSBkb20uZ2V0QXR0cmlidXRlKG5hbWUpO1xyXG5cdFx0XHRpZiAob2xkVmFsICE9PSB2YWx1ZSl7XHJcblx0XHRcdFx0ZG9tLnNldEF0dHJpYnV0ZShuYW1lLCB2YWx1ZSk7XHJcblx0XHRcdH07XHJcblx0XHR9KTtcdFx0XHJcblx0fTtcclxuXHJcbn07IiwiXCJ1c2Ugc3RyaWN0XCI7XHJcblxyXG5pbXBvcnQgKiBhcyB1dGlscyBmcm9tICcuLi91dGlscyc7ICBcclxuaW1wb3J0ICogYXMgdmFsdWVNZ3IgZnJvbSAnLi4vdmFsdWVNZ3InOyAgXHJcbmltcG9ydCB7R2FwfSBmcm9tICcuLi9jbGllbnQvZ2FwQ2xhc3NNZ3InOyAgXHJcbmltcG9ydCB7RmdJbnN0YW5jZX0gZnJvbSAnLi4vY2xpZW50L2ZnSW5zdGFuY2UnOyAgXHJcbmltcG9ydCB7SUFzdE5vZGV9IGZyb20gJy4uL3RwbE1ncic7XHJcblxyXG5leHBvcnQgZGVmYXVsdCBjbGFzcyBHUm9vdCBleHRlbmRzIEdhcHtcclxuXHRzY29wZVBhdGg6IGFueTtcclxuXHR0eXBlOiBzdHJpbmcgPSBcInJvb3RcIjtcclxuXHJcblx0c3RhdGljIHBhcnNlKG5vZGU6IElBc3ROb2RlKTogR2Fwe1xyXG5cdFx0cmV0dXJuIG51bGw7XHJcblx0fTtcclxuXHJcblx0cmVuZGVyKGNvbnRleHQ6IEZnSW5zdGFuY2UsIGRhdGE6IGFueSk6IHN0cmluZ3tcclxuXHRcdHRocm93IG5ldyBFcnJvcigncm9vdCBnYXAgc2hvdWxkIG5vdCBiZSByZW5kZXJlZCcpO1xyXG5cdH07XHJcblxyXG59OyIsIlwidXNlIHN0cmljdFwiO1xyXG5cclxuaW1wb3J0ICogYXMgdXRpbHMgZnJvbSAnLi4vdXRpbHMnOyAgXHJcbmltcG9ydCAqIGFzIHZhbHVlTWdyIGZyb20gJy4uL3ZhbHVlTWdyJzsgIFxyXG5pbXBvcnQge0dhcH0gZnJvbSAnLi4vY2xpZW50L2dhcENsYXNzTWdyJzsgIFxyXG5pbXBvcnQge0ZnSW5zdGFuY2V9IGZyb20gJy4uL2NsaWVudC9mZ0luc3RhbmNlJzsgIFxyXG5pbXBvcnQge0lBc3ROb2RlfSBmcm9tICcuLi90cGxNZ3InO1xyXG5cclxuZXhwb3J0IGRlZmF1bHQgY2xhc3MgR1Njb3BlSXRlbSBleHRlbmRzIEdhcHtcclxuXHRzY29wZVBhdGg6IGFueTtcclxuXHR0eXBlOiBzdHJpbmcgPSBcInNjb3BlSXRlbVwiO1xyXG5cclxuXHRzdGF0aWMgcGFyc2Uobm9kZTogSUFzdE5vZGUpOiBHYXB7XHJcblx0XHRyZXR1cm4gbnVsbDtcclxuXHR9O1xyXG5cclxuXHRyZW5kZXIoY29udGV4dDogRmdJbnN0YW5jZSwgZGF0YTogYW55KTogc3RyaW5ne1xyXG5cdFx0Y29uc3QgbWV0YSA9IHRoaXM7XHJcblx0XHRjb25zdCBzY29wZURhdGEgPSB2YWx1ZU1nci5nZXRWYWx1ZShtZXRhLCBkYXRhLCB0aGlzLnJlc29sdmVkUGF0aCk7XHJcblx0XHR0aGlzLnNjb3BlUGF0aCA9IHRoaXMucmVzb2x2ZWRQYXRoLnBhdGg7XHJcblx0XHRpZiAoIXNjb3BlRGF0YSl7XHJcblx0XHRcdHJldHVybiAnJztcclxuXHRcdH07XHJcblx0XHRyZXR1cm4gY29udGV4dC5yZW5kZXJUcGwobWV0YS5jb250ZW50LCBtZXRhLCBkYXRhKTtcclxuXHR9O1xyXG5cclxufTsiLCJcInVzZSBzdHJpY3RcIjtcclxuXHJcbmltcG9ydCAqIGFzIHV0aWxzIGZyb20gJy4uL3V0aWxzJzsgIFxyXG5pbXBvcnQgKiBhcyB2YWx1ZU1nciBmcm9tICcuLi92YWx1ZU1ncic7ICBcclxuaW1wb3J0IHtHYXAsIHJlbmRlcn0gZnJvbSAnLi4vY2xpZW50L2dhcENsYXNzTWdyJzsgIFxyXG5pbXBvcnQge0ZnSW5zdGFuY2V9IGZyb20gJy4uL2NsaWVudC9mZ0luc3RhbmNlJzsgIFxyXG5pbXBvcnQge0lBc3ROb2RlLCByZWFkVHBsfSBmcm9tICcuLi90cGxNZ3InO1xyXG5pbXBvcnQgKiBhcyBhbmNob3JNZ3IgZnJvbSAnLi4vYW5jaG9yTWdyJztcclxuaW1wb3J0IEdTY29wZUl0ZW0gZnJvbSAnLi9zY29wZS1pdGVtJztcclxuXHJcbmZ1bmN0aW9uIHJlbmRlclNjb3BlQ29udGVudChjb250ZXh0OiBGZ0luc3RhbmNlLCBzY29wZU1ldGE6IEdhcCwgc2NvcGVEYXRhOiBhbnksIGRhdGE6IGFueSwgaWRPZmZzZXQ6IG51bWJlcil7XHJcblx0Y29uc3QgaXNBcnJheSA9IEFycmF5LmlzQXJyYXkoc2NvcGVEYXRhKTtcclxuXHRpZiAoIWlzQXJyYXkpe1xyXG5cdFx0c2NvcGVEYXRhID0gW3Njb3BlRGF0YV07XHJcblx0fTtcclxuXHRjb25zdCBwYXJ0cyA9IHNjb3BlRGF0YS5tYXAoZnVuY3Rpb24oZGF0YUl0ZW06IGFueSwgaWQ6IG51bWJlcil7XHJcblx0XHRsZXQgaXRlbU1ldGEgPSBzY29wZU1ldGE7XHJcblx0XHRjb25zdCBwYXRoID0gaXNBcnJheVxyXG5cdFx0XHQ/IHZhbHVlTWdyLnJlYWQoWyhpZCArIGlkT2Zmc2V0KS50b1N0cmluZygpXSlcclxuXHRcdFx0OiB2YWx1ZU1nci5yZWFkKFtdKTtcclxuXHRcdGxldCBpdGVtQ2ZnOiBhbnkgPSB7XHJcblx0XHRcdFwidHlwZVwiOiBcInNjb3BlSXRlbVwiLFxyXG5cdFx0XHRcImlzVmlydHVhbFwiOiB0cnVlLFxyXG5cdFx0XHRcInBhdGhcIjogcGF0aCxcclxuXHRcdFx0XCJjb250ZW50XCI6IHNjb3BlTWV0YS5jb250ZW50XHJcblx0XHR9O1xyXG5cdFx0aWYgKHNjb3BlTWV0YS5laWQpe1xyXG5cdFx0XHRpdGVtQ2ZnLmVpZCA9IHNjb3BlTWV0YS5laWQgKyAnLWl0ZW0nO1xyXG5cdFx0fTtcclxuXHRcdGl0ZW1NZXRhID0gbmV3IEdTY29wZUl0ZW0oY29udGV4dCwgaXRlbUNmZywgaXRlbU1ldGEpO1x0XHRcclxuXHRcdHJldHVybiBpdGVtTWV0YS5yZW5kZXIoY29udGV4dCwgZGF0YSk7XHJcblx0fSk7XHJcblx0cmV0dXJuIHBhcnRzO1xyXG59O1xyXG5cclxuZXhwb3J0IGRlZmF1bHQgY2xhc3MgR1Njb3BlIGV4dGVuZHMgR2Fwe1xyXG5cdGl0ZW1zOiBHYXBbXTtcclxuXHRzY29wZVBhdGg6IGFueTtcclxuXHR0eXBlOiBzdHJpbmcgPSBcInNjb3BlXCI7XHJcblxyXG5cdHN0YXRpYyBwYXJzZShub2RlOiBJQXN0Tm9kZSwgaHRtbDogc3RyaW5nKTogR2Fwe1xyXG5cdFx0aWYgKG5vZGUudGFnTmFtZSAhPT0gXCJzY29wZVwiKXtcclxuXHRcdFx0cmV0dXJuIG51bGw7XHJcblx0XHR9O1xyXG5cdFx0Y29uc3QgbWV0YTogR1Njb3BlID0ge30gYXMgR1Njb3BlO1xyXG5cdFx0bWV0YS50eXBlID0gXCJzY29wZVwiO1xyXG5cdFx0bWV0YS5pc1ZpcnR1YWwgPSB0cnVlO1xyXG5cdFx0bWV0YS5wYXRoID0gdXRpbHMucGFyc2VQYXRoKG5vZGUpO1x0XHRcclxuXHRcdG1ldGEuY29udGVudCA9IHJlYWRUcGwobm9kZSwgaHRtbCwgbWV0YSk7XHJcblx0XHRtZXRhLmVpZCA9IG5vZGUuYXR0cnMuaWQgfHwgbnVsbDtcclxuXHRcdHJldHVybiBtZXRhO1xyXG5cdH07XHJcblxyXG5cdHJlbmRlcihjb250ZXh0OiBGZ0luc3RhbmNlLCBkYXRhOiBhbnkpOiBzdHJpbmd7XHJcblx0XHRjb25zdCBtZXRhID0gdGhpcztcclxuXHRcdG1ldGEuaXRlbXMgPSBbXTtcclxuXHRcdGNvbnN0IHNjb3BlRGF0YSA9IHZhbHVlTWdyLmdldFZhbHVlKG1ldGEsIGRhdGEsIHRoaXMucmVzb2x2ZWRQYXRoKTtcclxuXHRcdHRoaXMuc2NvcGVQYXRoID0gdGhpcy5yZXNvbHZlZFBhdGgucGF0aDtcclxuXHRcdGNvbnN0IGFuY2hvckNvZGUgPSBhbmNob3JNZ3IuZ2VuQ29kZShjb250ZXh0LCBtZXRhKTtcdFx0XHJcblx0XHRjb25zdCBwYXJ0cyA9IHJlbmRlclNjb3BlQ29udGVudChjb250ZXh0LCBtZXRhLCBzY29wZURhdGEsIGRhdGEsIDApO1x0XHJcblx0XHRyZXR1cm4gcGFydHMuam9pbignXFxuJykgKyBhbmNob3JDb2RlO1xyXG5cdH07XHJcblxyXG5cdHVwZGF0ZShjb250ZXh0OiBGZ0luc3RhbmNlLCBtZXRhOiBHYXAsIHNjb3BlUGF0aDogYW55LCB2YWx1ZTogYW55LCBvbGRWYWx1ZTogYW55KXtcclxuXHRcdHZhbHVlID0gdmFsdWUgfHwgW107XHJcblx0XHRvbGRWYWx1ZSA9IG9sZFZhbHVlIHx8IFtdO1xyXG5cdFx0Zm9yIChsZXQgaSA9IHZhbHVlLmxlbmd0aDsgaSA8IG9sZFZhbHVlLmxlbmd0aDsgaSsrKXtcclxuXHRcdFx0Y29udGV4dC5nYXBTdG9yYWdlLnJlbW92ZVNjb3BlKHNjb3BlUGF0aC5jb25jYXQoW2ldKSk7XHJcblx0XHR9O1xyXG5cdFx0aWYgKHZhbHVlLmxlbmd0aCA+IG9sZFZhbHVlLmxlbmd0aCl7XHJcblx0XHRcdGNvbnN0IGRhdGFTbGljZSA9IHZhbHVlLnNsaWNlKG9sZFZhbHVlLmxlbmd0aCk7XHJcblx0XHRcdGNvbnN0IG5ld0NvbnRlbnQgPSByZW5kZXJTY29wZUNvbnRlbnQoY29udGV4dCwgbWV0YSwgZGF0YVNsaWNlLCBjb250ZXh0LmRhdGEsIG9sZFZhbHVlLmxlbmd0aCkuam9pbignXFxuJyk7XHJcblx0XHRcdGNvbnN0IGFuY2hvciA9IGFuY2hvck1nci5maW5kKGNvbnRleHQsIG1ldGEpO1x0XHRcclxuXHRcdFx0YW5jaG9yTWdyLmluc2VydEhUTUwoYW5jaG9yLCAnYmVmb3JlJywgbmV3Q29udGVudCk7XHJcblx0XHR9O1xyXG5cdH07XHJcblxyXG59OyIsIlwidXNlIHN0cmljdFwiO1xyXG5cclxuZXhwb3J0IGludGVyZmFjZSBWYWx1ZVBhcnNlRm57XHJcblx0KHN0cjogc3RyaW5nKTogYW55O1xyXG59O1xyXG5cclxuZXhwb3J0IGludGVyZmFjZSBWYWx1ZVJlbmRlckZue1xyXG5cdChwYXJzZWQ6IGFueSk6IHN0cmluZztcclxufTtcclxuXHJcbmV4cG9ydCBjbGFzcyBTdHJUcGx7XHJcblx0c3JjOiBzdHJpbmc7XHJcblx0Z2FwczogYW55O1xyXG5cdHBhcnRzOiBhbnk7XHJcblx0aXNTdHJpbmc6IGJvb2xlYW47XHJcblxyXG5cdGNvbnN0cnVjdG9yICh0cGw6IFN0clRwbCB8IHN0cmluZywgdmFsdWVQYXJzZUZuPzogVmFsdWVQYXJzZUZuKXtcclxuXHRcdGlmICh0eXBlb2YgdHBsID09PSBcIm9iamVjdFwiKXtcclxuXHRcdFx0dGhpcy5zcmMgPSB0cGwuc3JjO1xyXG5cdFx0XHR0aGlzLmdhcHMgPSB0cGwuZ2FwcztcclxuXHRcdFx0dGhpcy5wYXJ0cyA9IHRwbC5wYXJ0cztcclxuXHRcdFx0cmV0dXJuO1xyXG5cdFx0fTtcclxuXHRcdHRoaXMuc3JjID0gdHBsIGFzIHN0cmluZztcclxuXHRcdHRoaXMucGFydHMgPSBbXTtcclxuXHRcdHRoaXMuZ2FwcyA9IFtdO1xyXG5cdFx0cmV0dXJuIHRoaXMucGFyc2UodHBsIGFzIHN0cmluZywgdmFsdWVQYXJzZUZuKTtcclxuXHR9O1xyXG5cclxuXHRwYXJzZSh0cGw6IHN0cmluZywgdmFsdWVQYXJzZUZuOiBWYWx1ZVBhcnNlRm4pe1xyXG5cdFx0Y29uc3QgZ2FwU3RyQXJyID0gdHBsLm1hdGNoKGdhcFJlKTtcclxuXHRcdGlmICghZ2FwU3RyQXJyKXtcclxuXHRcdFx0dGhpcy5pc1N0cmluZyA9IHRydWU7XHJcblx0XHRcdHRoaXMucGFydHMgPSBbdHBsXTtcclxuXHRcdFx0cmV0dXJuO1xyXG5cdFx0fTtcclxuXHRcdHRoaXMuZ2FwcyA9IGdhcFN0ckFyci5tYXAoZnVuY3Rpb24ocGFydCl7XHJcblx0XHRcdGNvbnN0IHBhcnRWYWx1ZTogc3RyaW5nID0gcGFydC5zbGljZSgyLCAtMSk7XHJcblx0XHRcdGNvbnN0IHBhcnRSZXM6IGFueSA9IHZhbHVlUGFyc2VGbihwYXJ0VmFsdWUpO1xyXG5cdFx0XHRwYXJ0UmVzLmVzY2FwZWQgPSBwYXJ0WzBdICE9PSBcIiFcIjtcclxuXHRcdFx0cmV0dXJuIHBhcnRSZXM7XHJcblx0XHR9KTtcdFx0XHJcblx0XHR0aGlzLnBhcnRzID0gdHBsLnNwbGl0KGdhcFJlKTtcclxuXHRcdHJldHVybiB0aGlzO1xyXG5cdH07XHJcblxyXG5cdHJlbmRlcih2YWx1ZVJlbmRlckZuOiBWYWx1ZVJlbmRlckZuKXtcclxuXHRcdGNvbnN0IGdhcHMgPSB0aGlzLmdhcHMubWFwKHZhbHVlUmVuZGVyRm4pO1xyXG5cdFx0Y29uc3QgcGFydHMgPSBtaXhBcnJheXModGhpcy5wYXJ0cywgZ2Fwcyk7XHJcblx0XHRyZXR1cm4gcGFydHMuam9pbignJyk7XHRcclxuXHR9O1xyXG5cdFxyXG59O1xyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIHJlYWQodHBsOiBzdHJpbmcgfCBTdHJUcGwsIHZhbHVlUGFyc2VGbjogVmFsdWVQYXJzZUZuKTogc3RyaW5nIHwgU3RyVHBse1xyXG5cdGxldCByZXM6IFN0clRwbCA9IG5ldyBTdHJUcGwodHBsLCB2YWx1ZVBhcnNlRm4pO1xyXG5cdGlmIChyZXMuaXNTdHJpbmcpe1xyXG5cdFx0cmV0dXJuIHRwbDtcclxuXHR9O1xyXG5cdHJldHVybiByZXM7XHJcbn07XHJcblxyXG52YXIgZ2FwUmUgPSAvW1xcJFxcI1xcIV17MX1cXHtbXlxcfV0qXFx9L2dtO1xyXG5cclxuZnVuY3Rpb24gbWl4QXJyYXlzKC4uLmFycnM6IGFueVtdW10pOiBhbnlbXXtcclxuXHRsZXQgbWF4TGVuZ3RoID0gMDtcclxuXHRsZXQgdG90YWxMZW5ndGggPSAwO1xyXG5cdGZvciAobGV0IGkgPSAwOyBpIDwgYXJycy5sZW5ndGg7IGkrKyl7XHJcblx0XHRtYXhMZW5ndGggPSBNYXRoLm1heChhcnJzW2ldLmxlbmd0aCwgbWF4TGVuZ3RoKTtcclxuXHRcdHRvdGFsTGVuZ3RoICs9IGFycnNbaV0ubGVuZ3RoO1xyXG5cdH07XHJcblx0bGV0IHJlc0FycjogYW55W10gPSBbXTtcclxuXHRjb25zdCBhcnJheUNvdW50ID0gYXJndW1lbnRzLmxlbmd0aDtcclxuXHRmb3IgKGxldCBpZCA9IDA7IGlkIDwgbWF4TGVuZ3RoOyBpZCsrKXtcdFx0XHRcdFxyXG5cdFx0Zm9yIChsZXQgaiA9IDA7IGogPCBhcnJheUNvdW50OyBqKyspe1xyXG5cdFx0XHRpZiAoYXJndW1lbnRzW2pdLmxlbmd0aCA+IGlkKXtcclxuXHRcdFx0XHRyZXNBcnIucHVzaChhcmd1bWVudHNbal1baWRdKTtcclxuXHRcdFx0fTtcclxuXHRcdH07XHJcblx0fTtcclxuXHRyZXR1cm4gcmVzQXJyO1xyXG59OyIsIlwidXNlIHN0cmljdFwiO1xyXG5cclxuaW1wb3J0ICogYXMgZ2FwQ2xhc3NNZ3IgZnJvbSAnLi9nYXBTZXJ2ZXInO1xyXG5pbXBvcnQge0dhcH0gZnJvbSAnLi9jbGllbnQvZ2FwQ2xhc3NNZ3InO1xyXG5pbXBvcnQgcmVuZGVyVHBsVW5ib3VuZCBmcm9tICcuL3RwbFJlbmRlcic7XHJcbmV4cG9ydCB2YXIgcmVuZGVyVHBsID0gcmVuZGVyVHBsVW5ib3VuZC5iaW5kKG51bGwsIGdhcENsYXNzTWdyKTtcclxudmFyIG1qID0gcmVxdWlyZSgnbWljcm8tamFkZScpO1xyXG5cclxuZXhwb3J0IGludGVyZmFjZSBJQXN0Tm9kZSB7XHJcbiAgICB0eXBlOiBzdHJpbmc7XHJcblx0Y2hpbGRyZW46IElBc3ROb2RlW107XHJcblx0dGFnTmFtZT86IHN0cmluZztcclxuXHRhdHRyczogYW55O1xyXG5cdHRleHQ6IHN0cmluZztcclxuXHRwYXJlbnQ6IElBc3ROb2RlO1xyXG5cdHZhbHVlPzoge1xyXG5cdFx0cGF0aDogc3RyaW5nLFxyXG5cdFx0ZXNjYXBlZDogYm9vbGVhblxyXG5cdH07XHJcbn07XHJcblxyXG5leHBvcnQgdHlwZSBJVHBsUGFydCA9IHN0cmluZyB8IEdhcDtcclxuXHJcbmV4cG9ydCB0eXBlIFRwbCA9IElUcGxQYXJ0W107XHJcblxyXG5mdW5jdGlvbiBwYXJzZUdhcChub2RlOiBJQXN0Tm9kZSwgaHRtbDogc3RyaW5nLCBwYXJlbnRNZXRhOiBHYXApOiBHYXB7XHJcblx0Y29uc3QgdGFnTWV0YSA9IGdhcENsYXNzTWdyLnBhcnNlKG5vZGUsIGh0bWwsIHBhcmVudE1ldGEpO1xyXG5cdHJldHVybiB0YWdNZXRhO1xyXG59O1xyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIHJlYWRUcGwoYXN0OiBJQXN0Tm9kZSwgY29kZT86IHN0cmluZywgcGFyZW50TWV0YT86IEdhcCk6IFRwbHtcclxuXHJcblx0ZnVuY3Rpb24gaXRlcmF0ZShjaGlsZHJlbjogSUFzdE5vZGVbXSk6IFRwbHtcclxuXHRcdGxldCBwYXJ0czogKHN0cmluZyB8IEdhcClbXSA9IFtdO1xyXG5cdFx0Y2hpbGRyZW4uZm9yRWFjaChmdW5jdGlvbihub2RlLCBpZCl7XHJcblx0XHRcdGNvbnN0IHRhZ01ldGEgPSBwYXJzZUdhcChub2RlLCBjb2RlLCBwYXJlbnRNZXRhKTtcclxuXHRcdFx0aWYgKHRhZ01ldGEpe1x0XHRcdFx0XHJcblx0XHRcdFx0cGFydHMucHVzaCh0YWdNZXRhKTtcdFx0XHRcdFxyXG5cdFx0XHRcdHJldHVybjsgXHJcblx0XHRcdH07XHRcclxuXHRcdFx0aWYgKCFub2RlLmNoaWxkcmVuIHx8IG5vZGUuY2hpbGRyZW4ubGVuZ3RoID09IDApe1xyXG5cdFx0XHRcdHBhcnRzLnB1c2gobWoucmVuZGVyKG5vZGUsIHt9KSk7XHRcdFx0XHRcclxuXHRcdFx0XHRyZXR1cm47XHJcblx0XHRcdH07XHJcblx0XHRcdGNvbnN0IHdyYXAgPSBtai5yZW5kZXJXcmFwcGVyKG5vZGUpO1xyXG5cdFx0XHRwYXJ0cy5wdXNoKHdyYXBbMF0pO1xyXG5cdFx0XHRwYXJ0cyA9IHBhcnRzLmNvbmNhdChpdGVyYXRlKG5vZGUuY2hpbGRyZW4pKTtcdFx0XHJcblx0XHRcdGlmICh3cmFwWzFdKXtcclxuXHRcdFx0XHRwYXJ0cy5wdXNoKHdyYXBbMV0pO1xyXG5cdFx0XHR9XHJcblx0XHR9KTtcclxuXHRcdHJldHVybiBwYXJ0cztcclxuXHR9O1xyXG5cclxuXHRyZXR1cm4gaXRlcmF0ZShhc3QuY2hpbGRyZW4pO1xyXG59O1xyXG4iLCJcInVzZSBzdHJpY3RcIjtcclxuXHJcbmltcG9ydCAqIGFzIHV0aWxzIGZyb20gJy4vdXRpbHMnO1xyXG5pbXBvcnQge1RwbH0gZnJvbSAnLi90cGxNZ3InO1xyXG5pbXBvcnQge0ZnSW5zdGFuY2V9IGZyb20gJy4vY2xpZW50L2ZnSW5zdGFuY2UnO1xyXG5pbXBvcnQge0dhcH0gZnJvbSAnLi9jbGllbnQvZ2FwQ2xhc3NNZ3InO1xyXG5cclxuaW50ZXJmYWNlIElUcGxDb250ZXh0e1xyXG5cdHJlbmRlckdhcDogRnVuY3Rpb247XHJcblx0Y29udGV4dDogRmdJbnN0YW5jZTtcclxufTtcclxuXHJcbi8qKlxyXG4gKiBSZW5kZXJzIHRlbXBsYXRlLlxyXG4gKiBAcGFyYW0ge09iamVjdFtdfSB0cGwgLSBhcnJheSBvZiBwYXRoJ3MgcGFydHMuXHJcbiAqIEBwYXJhbSB7T2JqZWN0fSBwYXJlbnQgLSBwYXJlbnQgZm9yIGEgdGVtcGxhdGUuXHJcbiAqIEBwYXJhbSB7T2JqZWN0fSBkYXRhIC0gZGF0YSBvYmplY3QgdG8gcmVuZGVyLlxyXG4gKiBAcGFyYW0ge09iamVjdH0gbWV0YSAtIG1ldGEgbW9kaWZpZXIuXHJcbiAqIEByZXR1cm5zIHtzdHJpbmd9IHJlc3VsdCBjb2RlLlxyXG4gKi9cclxuZXhwb3J0IGRlZmF1bHQgZnVuY3Rpb24gcmVuZGVyVHBsKHRwbDogVHBsLCBwYXJlbnQ6IEdhcCwgZGF0YTogYW55LCBtZXRhTW9kOiBGdW5jdGlvbiB8IE9iamVjdCl7XHJcblx0Y29uc3Qgc2VsZjogSVRwbENvbnRleHQgPSB0aGlzO1xyXG5cdGxldCBwYXJ0cyA9IHRwbC5tYXAoKHBhcnQsIHBhcnRJZCk9PntcclxuXHRcdGlmICh0eXBlb2YgcGFydCA9PT0gXCJzdHJpbmdcIil7XHJcblx0XHRcdHJldHVybiBwYXJ0O1xyXG5cdFx0fTtcclxuXHRcdGxldCBwYXJ0TWV0YSA9IHV0aWxzLnNpbXBsZUNsb25lKHBhcnQpO1xyXG5cdFx0aWYgKG1ldGFNb2Qpe1xyXG5cdFx0XHRpZiAodHlwZW9mIG1ldGFNb2QgPT09IFwiZnVuY3Rpb25cIil7XHJcblx0XHRcdFx0cGFydE1ldGEgPSAobWV0YU1vZCBhcyBGdW5jdGlvbikocGFydE1ldGEsIHBhcnRJZCk7XHJcblx0XHRcdH1lbHNle1xyXG5cdFx0XHRcdHBhcnRNZXRhID0gdXRpbHMuZXh0ZW5kKHBhcnRNZXRhLCBtZXRhTW9kIHx8IHt9KTtcdFx0XHRcclxuXHRcdFx0fTtcdFxyXG5cdFx0fTtcdFx0XHJcblx0XHRyZXR1cm4gc2VsZi5yZW5kZXJHYXAoc2VsZi5jb250ZXh0LCBwYXJlbnQsIGRhdGEsIHBhcnRNZXRhKTtcclxuXHR9KTtcclxuXHRjb25zdCBjb2RlID0gcGFydHMuam9pbignJyk7XHJcblx0cmV0dXJuIGNvZGU7XHJcbn07IiwiXCJ1c2Ugc3RyaWN0XCI7XHJcblxyXG5pbXBvcnQgKiBhcyB2YWx1ZU1nciBmcm9tICcuL3ZhbHVlTWdyJztcclxuaW1wb3J0IHtJQXN0Tm9kZX0gZnJvbSAnLi90cGxNZ3InO1xyXG5leHBvcnQgKiBmcm9tICcuL3V0aWxzL3RwbFV0aWxzJztcclxuXHJcbmV4cG9ydCBmdW5jdGlvbiBvYmpGb3Iob2JqOiBhbnksIGZuOiBGdW5jdGlvbil7XHJcblx0Zm9yICh2YXIgaSBpbiBvYmope1xyXG5cdFx0Zm4ob2JqW2ldLCBpLCBvYmopO1xyXG5cdH07XHJcbn07XHJcblxyXG5leHBvcnQgZnVuY3Rpb24gb2JqTWFwKG9iajogT2JqZWN0LCBmbjogRnVuY3Rpb24pOiBhbnl7XHJcblx0bGV0IG5ld09iajogYW55ID0ge307XHJcblx0b2JqRm9yKG9iaiwgZnVuY3Rpb24oaXRlbTogYW55LCBpZDogc3RyaW5nKXtcclxuXHRcdGNvbnN0IG5ld0l0ZW0gPSBmbihpdGVtLCBpZCwgb2JqKTtcclxuXHRcdG5ld09ialtpZF0gPSBuZXdJdGVtO1xyXG5cdH0pO1xyXG5cdHJldHVybiBuZXdPYmo7XHJcbn07XHJcblxyXG5leHBvcnQgZnVuY3Rpb24gb2JqUGF0aChwYXRoOiBBcnJheTxzdHJpbmc+LCBvYmo6IGFueSwgbmV3VmFsPzogYW55KTogYW55e1xyXG5cdGlmIChwYXRoLmxlbmd0aCA8IDEpe1xyXG5cdFx0aWYgKGFyZ3VtZW50cy5sZW5ndGggPiAyKXtcclxuXHRcdFx0dGhyb3cgJ3Jvb3QgcmV3cml0dGluZyBpcyBub3Qgc3VwcG9ydGVkJztcclxuXHRcdH07XHJcblx0XHRyZXR1cm4gb2JqO1xyXG5cdH07XHJcblx0Y29uc3QgcHJvcE5hbWUgPSBwYXRoWzBdO1xyXG5cdGlmIChwYXRoLmxlbmd0aCA9PT0gMSl7XHJcblx0XHRpZiAoYXJndW1lbnRzLmxlbmd0aCA+IDIpe1xyXG5cdFx0XHRvYmpbcHJvcE5hbWVdID0gbmV3VmFsOyBcclxuXHRcdH07XHRcdFx0XHRcclxuXHRcdHJldHVybiBvYmpbcHJvcE5hbWVdO1x0XHJcblx0fTtcclxuXHRjb25zdCBzdWJPYmogPSBvYmpbcHJvcE5hbWVdO1xyXG5cdGlmIChzdWJPYmogPT09IHVuZGVmaW5lZCl7XHJcblx0XHQvL3Rocm93IG5ldyBFcnJvcihcIkNhbm5vdCByZWFkIFwiICsgcHJvcE5hbWUgKyBcIiBvZiB1bmRlZmluZWRcIik7XHJcblx0XHRyZXR1cm4gdW5kZWZpbmVkOyAvLyB0aHJvdz9cclxuXHR9O1x0XHRcclxuXHRpZiAoYXJndW1lbnRzLmxlbmd0aCA+IDIpe1xyXG5cdFx0cmV0dXJuIG9ialBhdGgocGF0aC5zbGljZSgxKSwgc3ViT2JqLCBuZXdWYWwpO1xyXG5cdH07XHJcblx0cmV0dXJuIG9ialBhdGgocGF0aC5zbGljZSgxKSwgc3ViT2JqKTtcclxufTtcclxuXHJcbmV4cG9ydCBmdW5jdGlvbiBzaW1wbGVDbG9uZShvYmo6IGFueSk6IGFueXtcclxuXHRsZXQgcmVzOiBhbnkgPSB7fTtcclxuXHRmb3IgKHZhciBpIGluIG9iail7XHJcblx0XHRyZXNbaV0gPSBvYmpbaV07XHJcblx0fTtcclxuXHRyZXR1cm4gcmVzO1xyXG59O1xyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIGtleVZhbHVlVG9PYmooYXJyOiBhbnlbXSwga2V5TmFtZTogc3RyaW5nLCB2YWx1ZU5hbWU6IHN0cmluZyk6IGFueXtcclxuXHRrZXlOYW1lID0ga2V5TmFtZSB8fCAna2V5JztcclxuXHR2YWx1ZU5hbWUgPSB2YWx1ZU5hbWUgfHwgJ3ZhbHVlJztcclxuXHRsZXQgcmVzOiBhbnkgPSB7fTtcclxuXHRhcnIuZm9yRWFjaChmdW5jdGlvbihpKXtcclxuXHRcdHJlc1tpW2tleU5hbWVdXSA9IGlbdmFsdWVOYW1lXTtcclxuXHR9KTsgXHJcblx0cmV0dXJuIHJlcztcclxufTtcclxuXHJcbmV4cG9ydCBmdW5jdGlvbiBvYmpUb0tleVZhbHVlKG9iajogYW55LCBrZXlOYW1lOiBzdHJpbmcsIHZhbHVlTmFtZTogc3RyaW5nKTogYW55W117XHJcblx0a2V5TmFtZSA9IGtleU5hbWUgfHwgJ2tleSc7XHJcblx0dmFsdWVOYW1lID0gdmFsdWVOYW1lIHx8ICd2YWx1ZSc7XHJcblx0bGV0IHJlczogYW55W10gPSBbXTtcclxuXHRmb3IgKHZhciBpIGluIG9iail7XHJcblx0XHRsZXQgaXRlbTogYW55ID0ge307XHJcblx0XHRpdGVtW2tleU5hbWVdID0gaTtcclxuXHRcdGl0ZW1bdmFsdWVOYW1lXSA9IG9ialtpXTtcclxuXHRcdHJlcy5wdXNoKGl0ZW0pO1xyXG5cdH07XHJcblx0cmV0dXJuIHJlcztcclxufTtcclxuXHJcbmV4cG9ydCBmdW5jdGlvbiBjb25jYXRPYmoob2JqMTogYW55LCBvYmoyOiBhbnkpOiBhbnl7XHJcblx0bGV0IHJlcyA9IHNpbXBsZUNsb25lKG9iajEpO1xyXG5cdGZvciAobGV0IGkgaW4gb2JqMil7XHJcblx0XHRyZXNbaV0gPSBvYmoyW2ldO1xyXG5cdH07XHJcblx0cmV0dXJuIHJlcztcclxufTtcclxuXHJcbmV4cG9ydCBmdW5jdGlvbiBleHRlbmQoZGVzdDogYW55LCBzcmM6IGFueSk6IGFueXtcdFxyXG5cdGZvciAobGV0IGkgaW4gc3JjKXtcclxuXHRcdGRlc3RbaV0gPSBzcmNbaV07XHJcblx0fTtcclxuXHRyZXR1cm4gZGVzdDtcclxufTtcclxuXHJcbmV4cG9ydCBmdW5jdGlvbiBwYXJzZVBhdGgocGFyc2VkTm9kZTogSUFzdE5vZGUpOiB2YWx1ZU1nci5JVmFsdWVQYXRoe1xyXG5cdGlmIChwYXJzZWROb2RlLmF0dHJzLmNsYXNzKXtcclxuXHRcdGNvbnN0IHBhcnRzID0gcGFyc2VkTm9kZS5hdHRycy5jbGFzcy52YWx1ZS5zcGxpdCgnICcpO1xyXG5cdFx0Y29uc3QgcGFyc2VkID0gdmFsdWVNZ3IucmVhZChwYXJ0cyk7XHJcblx0XHRyZXR1cm4gcGFyc2VkO1xyXG5cdH07XHJcblx0cmV0dXJuIHZhbHVlTWdyLnJlYWQoW10pO1xyXG59O1xyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIGRlZXBDbG9uZShvYmo6IE9iamVjdCk6IE9iamVjdHtcclxuXHRpZiAodHlwZW9mIG9iaiA9PT0gXCJvYmplY3RcIil7XHJcblx0XHRjb25zdCBtYXAgPSBBcnJheS5pc0FycmF5KG9iailcclxuXHRcdFx0PyBvYmoubWFwLmJpbmQob2JqKVxyXG5cdFx0XHQ6IG9iak1hcC5iaW5kKG51bGwsIG9iaik7XHJcblx0XHRyZXR1cm4gbWFwKGRlZXBDbG9uZSk7XHJcblx0fTtcclxuXHRyZXR1cm4gb2JqO1xyXG59O1xyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIGVzY2FwZUh0bWwoY29kZTogc3RyaW5nKTogc3RyaW5ne1xyXG5cdHJldHVybiBjb2RlXHJcblx0XHQucmVwbGFjZSgvXCIvZywnJnF1b3Q7JylcclxuXHRcdC5yZXBsYWNlKC8mL2csJyZhbXA7JylcclxuXHRcdC5yZXBsYWNlKC88L2csJyZsdDsnKVxyXG5cdFx0LnJlcGxhY2UoLz4vZywnJmd0OycpO1xyXG59OyIsImltcG9ydCAqIGFzIHV0aWxzIGZyb20gJy4uL3V0aWxzJztcclxuXHJcbnZhciBzZWxmQ2xvc2luZ1RhZ3MgPSBbXCJhcmVhXCIsIFwiYmFzZVwiLCBcImJyXCIsIFwiY29sXCIsIFxyXG5cdFwiY29tbWFuZFwiLCBcImVtYmVkXCIsIFwiaHJcIiwgXCJpbWdcIiwgXHJcblx0XCJpbnB1dFwiLCBcImtleWdlblwiLCBcImxpbmtcIiwgXHJcblx0XCJtZXRhXCIsIFwicGFyYW1cIiwgXCJzb3VyY2VcIiwgXCJ0cmFja1wiLCBcclxuXHRcIndiclwiXTtcclxuXHJcbmludGVyZmFjZSBJQXR0cntcclxuXHRuYW1lOiBzdHJpbmc7XHJcblx0dmFsdWU6IHN0cmluZztcclxufTtcclxuXHJcbmV4cG9ydCBpbnRlcmZhY2UgSVRhZ09wdHN7XHJcblx0YXR0cnM6IGFueTtcclxuXHRuYW1lOiBzdHJpbmc7XHJcblx0aW5uZXJIVE1MOiBzdHJpbmc7XHJcbn07XHJcblxyXG5leHBvcnQgZnVuY3Rpb24gcmVuZGVyVGFnKHRhZ0luZm86IElUYWdPcHRzKTogc3RyaW5ne1xyXG5cdGxldCBhdHRycyA9IHRhZ0luZm8uYXR0cnM7XHJcblx0aWYgKCFBcnJheS5pc0FycmF5KGF0dHJzKSl7XHJcblx0XHRhdHRycyA9IHV0aWxzLm9ialRvS2V5VmFsdWUoYXR0cnMsICduYW1lJywgJ3ZhbHVlJyk7XHJcblx0fTtcclxuXHRsZXQgYXR0ckNvZGUgPSBcIlwiO1xyXG5cdGlmIChhdHRycy5sZW5ndGggPiAwKXtcclxuXHQgICAgYXR0ckNvZGUgPSBcIiBcIiArIGF0dHJzLm1hcChmdW5jdGlvbihhdHRyOiBJQXR0cil7XHJcblx0XHQgIHJldHVybiBhdHRyLm5hbWUgKyAnPVwiJyArIGF0dHIudmFsdWUgKyAnXCInO1xyXG5cdCAgIH0pLmpvaW4oJyAnKTtcclxuXHR9O1xyXG5cdGNvbnN0IHRhZ0hlYWQgPSB0YWdJbmZvLm5hbWUgKyBhdHRyQ29kZTtcclxuXHRpZiAofnNlbGZDbG9zaW5nVGFncy5pbmRleE9mKHRhZ0luZm8ubmFtZSkpe1xyXG5cdFx0cmV0dXJuIFwiPFwiICsgdGFnSGVhZCArIFwiIC8+XCI7XHJcblx0fTtcclxuXHRjb25zdCBvcGVuVGFnID0gXCI8XCIgKyB0YWdIZWFkICsgXCI+XCI7XHJcblx0Y29uc3QgY2xvc2VUYWcgPSBcIjwvXCIgKyB0YWdJbmZvLm5hbWUgKyBcIj5cIjtcclxuXHRjb25zdCBjb2RlID0gb3BlblRhZyArICh0YWdJbmZvLmlubmVySFRNTCB8fCBcIlwiKSArIGNsb3NlVGFnO1xyXG5cdHJldHVybiBjb2RlO1xyXG59O1xyXG5cclxuIiwiZnVuY3Rpb24gVHJlZU5vZGUoa2luZCwgcGFyZW50LCBkYXRhKXtcclxuICAgIHRoaXMuY2hpbGRyZW4gPSBraW5kID09ICdhcnJheSdcclxuICAgICAgICA/IFtdXHJcbiAgICAgICAgOiB7fTsgICBcclxuICAgIHRoaXMucGFyZW50ID0gcGFyZW50O1xyXG4gICAgdGhpcy5kYXRhID0gZGF0YTtcclxuICAgIHRoaXMuY2hpbGRDb3VudCA9IDA7XHJcbn07XHJcblxyXG5UcmVlTm9kZS5wcm90b3R5cGUuYWRkQ2hpbGQgPSBmdW5jdGlvbihuYW1lLCBkYXRhKXtcclxuICAgIGlmICh0aGlzLmtpbmQgPT0gJ2FycmF5Jyl7XHJcbiAgICAgICAgZGF0YSA9IG5hbWU7XHJcbiAgICAgICAgbmFtZSA9IHRoaXMuY2hpbGRyZW4ubGVuZ3RoO1xyXG4gICAgfTtcclxuICAgIGRhdGEgPSBkYXRhIHx8IHRoaXMucm9vdC5pbml0VHJlZU5vZGUoKTtcclxuICAgIHZhciBjaGlsZCA9IG5ldyBUcmVlTm9kZSh0aGlzLmtpbmQsIHRoaXMsIGRhdGEpO1xyXG4gICAgY2hpbGQuaWQgPSBuYW1lO1xyXG4gICAgY2hpbGQucGF0aCA9IHRoaXMucGF0aC5jb25jYXQoW25hbWVdKTtcclxuICAgIGNoaWxkLnJvb3QgPSB0aGlzLnJvb3Q7XHJcbiAgICB0aGlzLmNoaWxkQ291bnQrKztcclxuICAgIHRoaXMuY2hpbGRyZW5bbmFtZV0gPSBjaGlsZDtcclxuICAgIHJldHVybiBjaGlsZDtcclxufTtcclxuXHJcblRyZWVOb2RlLnByb3RvdHlwZS5nZXRQYXJlbnRzID0gZnVuY3Rpb24oKXtcclxuICAgIHZhciByZXMgPSBbXTsgICAgXHJcbiAgICB2YXIgbm9kZSA9IHRoaXM7XHJcbiAgICB3aGlsZSAodHJ1ZSl7XHJcbiAgICAgICAgbm9kZSA9IG5vZGUucGFyZW50O1xyXG4gICAgICAgIGlmICghbm9kZSl7XHJcbiAgICAgICAgICAgIHJldHVybiByZXM7XHJcbiAgICAgICAgfTtcclxuICAgICAgICByZXMucHVzaChub2RlKTtcclxuICAgIH07ICBcclxufTtcclxuXHJcblRyZWVOb2RlLnByb3RvdHlwZS5jaGlsZEl0ZXJhdGUgPSBmdW5jdGlvbihmbil7XHJcbiAgICBmb3IgKHZhciBpIGluIHRoaXMuY2hpbGRyZW4pe1xyXG4gICAgICAgIGZuLmNhbGwodGhpcywgdGhpcy5jaGlsZHJlbltpXSwgaSk7ICBcclxuICAgIH07XHJcbn07XHJcblxyXG5UcmVlTm9kZS5wcm90b3R5cGUuZ2V0Q2hpbGRBcnIgPSBmdW5jdGlvbigpe1xyXG4gICAgaWYgKHRoaXMua2luZCA9PSAnYXJyYXknKXtcclxuICAgICAgICByZXR1cm4gdGhpcy5jaGlsZHJlbjtcclxuICAgIH07XHJcbiAgICB2YXIgcmVzID0gW107XHJcbiAgICB0aGlzLmNoaWxkSXRlcmF0ZShmdW5jdGlvbihjaGlsZCl7XHJcbiAgICAgICAgcmVzLnB1c2goY2hpbGQpO1xyXG4gICAgfSk7ICAgICAgICAgICAgXHJcbiAgICByZXR1cm4gcmVzO1xyXG59O1xyXG5cclxuVHJlZU5vZGUucHJvdG90eXBlLmdldERlZXBDaGlsZEFyciA9IGZ1bmN0aW9uKCl7XHJcbiAgICB2YXIgcmVzID0gdGhpcy5nZXRDaGlsZEFycigpO1xyXG4gICAgdGhpcy5jaGlsZEl0ZXJhdGUoZnVuY3Rpb24oY2hpbGQpe1xyXG4gICAgICAgcmVzID0gcmVzLmNvbmNhdChjaGlsZC5nZXREZWVwQ2hpbGRBcnIoKSk7XHJcbiAgICB9KTtcclxuICAgIHJldHVybiByZXM7XHJcbn07XHJcblxyXG5UcmVlTm9kZS5wcm90b3R5cGUucmVtb3ZlID0gZnVuY3Rpb24ocGF0aCl7XHJcbiAgICB2YXIgbGVhZktleSA9IHBhdGhbcGF0aC5sZW5ndGggLSAxXTtcclxuICAgIHZhciBicmFuY2hQYXRoID0gcGF0aC5zbGljZSgwLCAtMSk7XHJcbiAgICB2YXIgYnJhbmNoID0gdGhpcy5ieVBhdGgoYnJhbmNoUGF0aCk7XHJcbiAgICBicmFuY2guY2hpbGRDb3VudC0tO1xyXG4gICAgdmFyIHJlcyA9IGJyYW5jaC5jaGlsZHJlbltsZWFmS2V5XTtcclxuICAgIGRlbGV0ZSBicmFuY2guY2hpbGRyZW5bbGVhZktleV07ICAgXHJcbiAgICByZXR1cm4gcmVzOyBcclxufTtcclxuXHJcblRyZWVOb2RlLnByb3RvdHlwZS5ieVBhdGggPSBmdW5jdGlvbihwYXRoKXsgICAgXHJcbiAgICBpZiAocGF0aC5sZW5ndGggPT0gMCl7XHJcbiAgICAgICAgcmV0dXJuIHRoaXM7XHJcbiAgICB9O1xyXG4gICAgdmFyIG5vZGUgPSB0aGlzO1xyXG4gICAgd2hpbGUgKHRydWUpe1xyXG4gICAgICAgIHZhciBrZXkgPSBwYXRoWzBdO1xyXG4gICAgICAgIG5vZGUgPSBub2RlLmNoaWxkcmVuW2tleV07XHJcbiAgICAgICAgaWYgKCFub2RlKXtcclxuICAgICAgICAgICAgcmV0dXJuIG51bGw7XHJcbiAgICAgICAgfTtcclxuICAgICAgICBwYXRoID0gcGF0aC5zbGljZSgxKTtcclxuICAgICAgICBpZiAocGF0aC5sZW5ndGggPT0gMCl7XHJcbiAgICAgICAgICAgIHJldHVybiBub2RlOyAgXHJcbiAgICAgICAgfTtcclxuICAgIH07XHJcbn07XHJcblxyXG5UcmVlTm9kZS5wcm90b3R5cGUuYWNjZXNzID0gZnVuY3Rpb24ocGF0aCl7XHJcbiAgICBpZiAocGF0aC5sZW5ndGggPT0gMCl7XHJcbiAgICAgICAgcmV0dXJuIHRoaXM7XHJcbiAgICB9O1xyXG4gICAgdmFyIG5vZGUgPSB0aGlzO1xyXG4gICAgd2hpbGUgKHRydWUpe1xyXG4gICAgICAgIHZhciBrZXkgPSBwYXRoWzBdO1xyXG4gICAgICAgIHZhciBwYXJlbnQgPSBub2RlO1xyXG4gICAgICAgIG5vZGUgPSBub2RlLmNoaWxkcmVuW2tleV07XHJcbiAgICAgICAgaWYgKCFub2RlKXtcclxuICAgICAgICAgICAgdmFyIGRhdGEgPSB0aGlzLnJvb3QuaW5pdFRyZWVOb2RlKCk7ICAgICAgICAgICAgICAgIFxyXG4gICAgICAgICAgICBub2RlID0gcGFyZW50LmFkZENoaWxkKGtleSwgZGF0YSk7XHJcbiAgICAgICAgICAgIHBhcmVudC5jaGlsZHJlbltrZXldID0gbm9kZTtcclxuICAgICAgICB9O1xyXG4gICAgICAgIHBhdGggPSBwYXRoLnNsaWNlKDEpO1xyXG4gICAgICAgIGlmIChwYXRoLmxlbmd0aCA9PSAwKXtcclxuICAgICAgICAgICAgcmV0dXJuIG5vZGU7ICBcclxuICAgICAgICB9O1xyXG4gICAgfTsgXHJcbn07XHJcblxyXG5leHBvcnQgZGVmYXVsdCBmdW5jdGlvbiBUcmVlSGVscGVyKG9wdHMsIHJvb3REYXRhKXtcclxuICAgIG9wdHMgPSBvcHRzIHx8IHt9O1xyXG4gICAgb3B0cy5raW5kID0gb3B0cy5raW5kIHx8ICdhcnJheSc7XHJcbiAgICB2YXIgaW5pdFRyZWVOb2RlID0gb3B0cy5pbml0VHJlZU5vZGUgfHwgZnVuY3Rpb24oKXtcclxuICAgICAgICByZXR1cm4ge307XHJcbiAgICB9O1xyXG4gICAgdmFyIGRhdGEgPSByb290RGF0YSB8fCBpbml0VHJlZU5vZGUoKTtcclxuICAgIHZhciByb290VHJlZU5vZGUgPSBuZXcgVHJlZU5vZGUob3B0cy5raW5kLCBudWxsLCBkYXRhKTtcclxuICAgIHJvb3RUcmVlTm9kZS5pc1Jvb3QgPSB0cnVlO1xyXG4gICAgcm9vdFRyZWVOb2RlLnJvb3QgPSByb290VHJlZU5vZGU7XHJcbiAgICByb290VHJlZU5vZGUucGF0aCA9IFtdO1xyXG4gICAgcm9vdFRyZWVOb2RlLmluaXRUcmVlTm9kZSA9IGluaXRUcmVlTm9kZTtcclxuICAgIHJldHVybiByb290VHJlZU5vZGU7XHJcbn07IiwiXCJ1c2Ugc3RyaWN0XCI7XHJcblxyXG5pbXBvcnQgKiBhcyB1dGlscyBmcm9tICcuL3V0aWxzJztcclxuXHJcbmV4cG9ydCB0eXBlIElWYWx1ZVBhdGhJdGVtID0gc3RyaW5nO1xyXG5cclxuZXhwb3J0IGludGVyZmFjZSBJVmFsdWVQYXRoIHtcclxuICAgIHBhdGg6IEFycmF5PElWYWx1ZVBhdGhJdGVtPjtcclxuXHRzb3VyY2U6IHN0cmluZztcclxuXHRlc2NhcGVkOiBib29sZWFuO1xyXG59O1xyXG5cclxuLyoqXHJcbiAqIFJlYWRzIHBhdGggYW5kIHJldHVybnMgcGFyc2VkIHBhdGguXHJcbiAqIEBwYXJhbSB7c3RyaW5nW119IHBhcnRzIC0gYXJyYXkgb2YgcGF0aCdzIHBhcnRzLlxyXG4gKiBAcGFyYW0ge09iamVjdH0gZXh0cmFJbmZvIC0gZGF0YSBvYmplY3QgdG8gYmUgYWRkZWQgdG8gcmVzdWx0LlxyXG4gKiBAcmV0dXJucyB7T2JqZWN0fSBwYXRoIG9iamVjdC5cclxuICovXHJcbmV4cG9ydCBmdW5jdGlvbiByZWFkKHBhcnRzOiBBcnJheTxzdHJpbmc+LCBleHRyYUluZm8/OiBPYmplY3QpOiBJVmFsdWVQYXRoe1xyXG5cdGxldCBzb3VyY2UgPSBcImRhdGFcIjtcclxuXHRsZXQgcGF0aCA9IHBhcnRzLm1hcChmdW5jdGlvbihwYXJ0KXtcdFx0XHJcblx0XHQvLyBpZiAocGFydFswXSA9PT0gJyQnKXtcclxuXHRcdC8vIFx0cmV0dXJuIHtcclxuXHRcdC8vIFx0XHRvcDogcGFydC5zbGljZSgxKVxyXG5cdFx0Ly8gXHR9O1xyXG5cdFx0Ly8gfTtcclxuXHRcdHJldHVybiBwYXJ0OyBcclxuXHR9KTtcclxuXHRjb25zdCByZXM6IElWYWx1ZVBhdGggPSB7XHJcblx0XHRcInNvdXJjZVwiOiBzb3VyY2UsXHJcblx0XHRcInBhdGhcIjogcGF0aCxcclxuXHRcdFwiZXNjYXBlZFwiOiB0cnVlXHJcblx0fTtcclxuXHRpZiAoZXh0cmFJbmZvKXtcclxuXHRcdHV0aWxzLmV4dGVuZChyZXMsIGV4dHJhSW5mbyk7XHJcblx0fTtcclxuXHRyZXR1cm4gcmVzO1xyXG59O1xyXG5cclxuLyoqXHJcbiAqIFBhcnNlcyBkb3QgcGF0aCBhbmQgcmV0dXJucyBwYXJzZWQgcGF0aC5cclxuICogQHBhcmFtIHtzdHJpbmd9IHN0ciAtIHRleHQgb2YgdGhlIHBhdGggc2VwYXJhdGVkIGJ5IGRvdHMuXHJcbiAqIEBwYXJhbSB7T2JqZWN0fSBleHRyYUluZm8gLSBkYXRhIG9iamVjdCB0byBiZSBhZGRlZCB0byByZXN1bHQuXHJcbiAqIEByZXR1cm5zIHtPYmplY3R9IHBhdGggb2JqZWN0LlxyXG4gKi9cclxuZXhwb3J0IGZ1bmN0aW9uIHBhcnNlKHN0cjogc3RyaW5nLCBleHRyYUluZm8/OiBPYmplY3QpOiBJVmFsdWVQYXRoe1xyXG5cdGNvbnN0IHBhcnRzID0gc3RyLnRyaW0oKS5zcGxpdCgnLicpO1xyXG5cdHJldHVybiByZWFkKHBhcnRzLCBleHRyYUluZm8pO1xyXG59O1xyXG5cclxuLyoqXHJcbiAqIEZpbmRzIHRoZSBuZWFyZXN0IHNjb3BlIGFuZCByZXR1cm4gaXRzIHBhdGguXHJcbiAqIEBwYXJhbSB7T2JqZWN0fSBtZXRhIC0gZ2FwIG1ldGEgY29ubmVjdGVkIHRvIHRoZSBwYXRoLlxyXG4gKiBAcmV0dXJucyB7T2JqZWN0fSBzY29wZSBwYXRoIG9iamVjdC5cclxuICovXHJcbmZ1bmN0aW9uIGZpbmRTY29wZVBhdGgobWV0YTogYW55KXtcclxuXHRsZXQgcGFyZW50ID0gbWV0YS5wYXJlbnQ7XHJcblx0d2hpbGUgKHRydWUpe1x0XHRcclxuXHRcdGlmICghcGFyZW50KXtcclxuXHRcdFx0cmV0dXJuIFtdO1xyXG5cdFx0fTtcclxuXHRcdGlmIChwYXJlbnQuc2NvcGVQYXRoKXtcclxuXHRcdFx0cmV0dXJuIHBhcmVudC5zY29wZVBhdGg7XHJcblx0XHR9O1xyXG5cdFx0cGFyZW50ID0gcGFyZW50LnBhcmVudDtcclxuXHR9O1xyXG59O1xyXG5cclxuLyoqXHJcbiAqIFJlc29sdmVzIHRoZSBwYXRoIHJlbW92aW5nIGFsbCBvcGVyYXRvcnMgZnJvbSBwYXRoIChlLmcuICR1cCkuXHJcbiAqIEBwYXJhbSB7T2JqZWN0fSBtZXRhIC0gZ2FwIG1ldGEgY29ubmVjdGVkIHRvIHRoZSBwYXRoLlxyXG4gKiBAcGFyYW0ge09iamVjdH0gcGF0aCAtIHZhbHVlIHBhdGggb2JqZWN0LlxyXG4gKiBAcmV0dXJucyB7T2JqZWN0fSByZXNvbHZlZCBwYXRoIG9iamVjdC5cclxuICovXHJcbmV4cG9ydCBmdW5jdGlvbiByZXNvbHZlUGF0aChtZXRhOiBhbnksIHBhdGg6IElWYWx1ZVBhdGgpOiBJVmFsdWVQYXRoe1xyXG5cdGNvbnN0IHNjb3BlUGF0aCA9IGZpbmRTY29wZVBhdGgobWV0YSk7XHJcblx0bGV0IHJlczogSVZhbHVlUGF0aCA9IHtcclxuXHRcdHBhdGg6IG51bGwsXHJcblx0XHRzb3VyY2U6IFwiZGF0YVwiLFxyXG5cdFx0ZXNjYXBlZDogcGF0aC5lc2NhcGVkXHJcblx0fTtcclxuXHRyZXMucGF0aCA9IHNjb3BlUGF0aC5zbGljZSgpO1xyXG5cdHBhdGgucGF0aC5mb3JFYWNoKGZ1bmN0aW9uKGtleSl7XHJcblx0XHRpZiAodHlwZW9mIGtleVswXSAhPT0gXCIkXCIpe1xyXG5cdFx0XHRyZXMucGF0aC5wdXNoKGtleSk7XHRcdFx0XHJcblx0XHRcdHJldHVybjtcclxuXHRcdH07XHJcblx0XHRpZiAoa2V5ID09PSBcIiRyb290XCIpe1xyXG5cdFx0XHRyZXMucGF0aCA9IFtdO1xyXG5cdFx0fSBlbHNlIGlmIChrZXkgPT09IFwiJHVwXCIpe1xyXG5cdFx0XHRyZXMucGF0aC5wb3AoKTtcclxuXHRcdH07XHJcblx0fSk7XHJcblx0cmV0dXJuIHJlcztcclxufTtcclxuXHJcbi8qKlxyXG4gKiBSZXR1cm5zIHRoZSB2YWx1ZSBieSBnaXZlbiBwYXRoLlxyXG4gKiBAcGFyYW0ge09iamVjdH0gbWV0YSAtIGdhcCBtZXRhIGNvbm5lY3RlZCB0byB0aGUgcGF0aC5cclxuICogQHBhcmFtIHtPYmplY3R9IGRhdGEgLSBkYXRhIG9iamVjdCByZW5kZXJpbmcgaW4gZmcuXHJcbiAqIEBwYXJhbSB7T2JqZWN0fSB2YWx1ZVBhdGggLSB2YWx1ZSBwYXRoIHRvIGJlIGZldGNoZWQuXHJcbiAqIEByZXR1cm5zIHthbnl9IGZldGNoZWQgZGF0YS5cclxuICovXHJcbmV4cG9ydCBmdW5jdGlvbiBnZXRWYWx1ZShtZXRhOiBhbnksIGRhdGE6IE9iamVjdCwgdmFsdWVQYXRoOiBJVmFsdWVQYXRoKTogYW55e1xyXG5cdGNvbnN0IHNvdXJjZVRhYmxlOiBhbnkgPSB7XHJcblx0XHRcImRhdGFcIjogZGF0YSxcclxuXHRcdFwibWV0YVwiOiBtZXRhXHJcblx0fTtcclxuXHRjb25zdCBzb3VyY2VEYXRhOiBzdHJpbmcgPSBzb3VyY2VUYWJsZVt2YWx1ZVBhdGguc291cmNlXTtcclxuXHRjb25zdCByZXMgPSB1dGlscy5vYmpQYXRoKHZhbHVlUGF0aC5wYXRoLCBzb3VyY2VEYXRhKTtcclxuXHRyZXR1cm4gcmVzO1xyXG59O1xyXG5cclxuLyoqXHJcbiAqIFJldHVybnMgdGhlIHF1ZXJpZWQgdmFsdWUgYXMgc3RyaW5nLlxyXG4gKiBAcGFyYW0ge09iamVjdH0gbWV0YSAtIGdhcCBtZXRhIGNvbm5lY3RlZCB0byB0aGUgcGF0aC5cclxuICogQHBhcmFtIHtPYmplY3R9IGRhdGEgLSBkYXRhIG9iamVjdCByZW5kZXJpbmcgaW4gZmcuXHJcbiAqIEBwYXJhbSB7T2JqZWN0fSByZXNvbHZlZFBhdGggLSByZXNvbHZlZCBwYXRoLlxyXG4gKiBAcmV0dXJucyB7c3RyaW5nfSByZW5kZXJlZCBzdHJpbmcuXHJcbiAqL1xyXG5leHBvcnQgZnVuY3Rpb24gcmVuZGVyKG1ldGE6IGFueSwgZGF0YTogT2JqZWN0LCByZXNvbHZlZFBhdGg6IElWYWx1ZVBhdGgpOiBzdHJpbmd7XHJcblx0dmFyIHRleHQgPSBnZXRWYWx1ZShtZXRhLCBkYXRhLCByZXNvbHZlZFBhdGgpLnRvU3RyaW5nKCk7IFxyXG5cdGlmIChyZXNvbHZlZFBhdGguZXNjYXBlZCl7XHJcblx0XHR0ZXh0ID0gdXRpbHMuZXNjYXBlSHRtbCh0ZXh0KTtcdFx0XHJcblx0fTtcclxuXHRyZXR1cm4gdGV4dDtcclxufTtcclxuXHJcbi8qKlxyXG4gKiBSZXNvbHZlIHBhdGggYW5kIHJldHVybnMgdGhlIHF1ZXJpZWQgdmFsdWUgYXMgc3RyaW5nLlxyXG4gKiBAcGFyYW0ge09iamVjdH0gbWV0YSAtIGdhcCBtZXRhIGNvbm5lY3RlZCB0byB0aGUgcGF0aC5cclxuICogQHBhcmFtIHtPYmplY3R9IGRhdGEgLSBkYXRhIG9iamVjdCByZW5kZXJpbmcgaW4gZmcuXHJcbiAqIEBwYXJhbSB7T2JqZWN0fSBwYXRoIC0gdW5yZXNvbHZlZCBwYXRoLlxyXG4gKiBAcmV0dXJucyB7c3RyaW5nfSByZW5kZXJlZCBzdHJpbmcuXHJcbiAqL1xyXG5leHBvcnQgZnVuY3Rpb24gcmVzb2x2ZUFuZFJlbmRlcihtZXRhOiBhbnksIGRhdGE6IE9iamVjdCwgcGF0aDogSVZhbHVlUGF0aCl7XHJcblx0dmFyIHJlc29sdmVkUGF0aCA9IHJlc29sdmVQYXRoKG1ldGEsIHBhdGgpO1xyXG5cdHJldHVybiByZW5kZXIobWV0YSwgZGF0YSwgcmVzb2x2ZWRQYXRoKTtcclxufTsiXX0=

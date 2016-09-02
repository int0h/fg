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
    var posTable = {
        "before": "beforebegin",
        "after": "afterend"
    };
    var pos = posTable[position];
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
var gapClassMgr_1 = require('./gapClassMgr');
var utils = require('../utils');
var GapStorage_1 = require('./GapStorage');
var globalEvents = require('./globalEvents');
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
        var rootGap = new gapClassMgr_1.Gap(this, meta);
        rootGap.type = "root";
        rootGap.isVirtual = true;
        rootGap.fg = this;
        rootGap.scopePath.path = [];
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
            gapClassMgr.update(self, gap, scopePath, value, oldValue);
        });
        scope.parents.forEach(function (parentNode) {
            parentNode.data.gaps.forEach(function (parentGap) {
                if (parentGap.type === "fg") {
                    var subPath = scopePath.slice(parentGap.scopePath.length);
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
},{"../eventEmitter":16,"../tplRender":28,"../utils":29,"./GapStorage":12,"./gapClassMgr":11,"./globalEvents":13,"./helper":14}],11:[function(require,module,exports){
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
        this.context.update(this.scopePath, val);
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
    var gap = new Gap(context, meta, parent);
    var gapClass = gaps[meta.type];
    return gapClass.render.call(gap, context, data);
}
exports.render = render;
;
function update(context, gapMeta, scopePath, value, oldValue) {
    var gapClass = gaps[gapMeta.type];
    if (!gapClass) {
        return;
    }
    ;
    return gapClass.update(context, gapMeta, scopePath, value, oldValue);
}
exports.update = update;
;
var gaps = require('../gaps');
},{"../gaps":18,"../utils":29,"../valueMgr":32}],12:[function(require,module,exports){
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
            initNode: initNodeFn
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
},{"../utils":29,"../utils/TreeHelper":31}],13:[function(require,module,exports){
"use strict";
var events = {};
function handler(name, event) {
    var elm = event.target;
    while (elm) {
        var fg = window['$fg'].byDom(elm);
        if (fg) {
            fg.emitApply(name, fg, [event]);
        }
        ;
        elm = elm.parentNode;
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
var fgClassModule = require('./fgClass');
var fgInstanceModule = require('./fgInstance');
;
var $fg = function (arg) {
    if (arg instanceof HTMLElement) {
        return $fg.byDom(arg);
    }
    ;
    if (typeof arg == "string") {
        return fgClassModule.fgClassDict[arg];
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
    return new fgClassModule.FgClass(fgData);
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
    return fgInstanceModule.getFgByIid(iid);
};
$fg.gapClosest = function (domNode) {
    while (true) {
        idRe.lastIndex = 0;
        var res = idRe.exec(domNode.id);
        if (!res) {
            domNode = domNode.parentNode;
            if (!domNode) {
                return null;
            }
            ;
            continue;
        }
        ;
        var iid = parseInt(res[1]);
        var fg = fgInstanceModule.getFgByIid(iid);
        var gid = parseInt(res[2]);
        return fg.gapStorage.gaps[gid];
    }
    ;
};
$fg.classes = fgClassModule.fgClassDict;
$fg.fgs = fgInstanceModule.fgInstanceTable;
$fg.jq = window['jQuery'];
window['$fg'] = $fg;
},{"./fgClass":9,"./fgInstance":10}],15:[function(require,module,exports){
"use strict";
var helper = require('./helper');
console.log(helper);
},{"./helper":14}],16:[function(require,module,exports){
"use strict";
;
function EventEmitter(parent) {
    this.events = {};
    this.parent = parent;
}
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = EventEmitter;
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
EventEmitter.prototype.emit = function (name) {
    var rest = [];
    for (var _i = 1; _i < arguments.length; _i++) {
        rest[_i - 1] = arguments[_i];
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
    var emitArgs = [].slice.call(arguments, 1);
    eventList.forEach(function (fn) {
        fn.apply(this, emitArgs);
    });
};
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
},{}],17:[function(require,module,exports){
"use strict";
var gaps = require('./gaps');
/**
 * Reads the given ast and returns gap tree.
 * @param {object} ast - Parsed AST of a template.
 * @param {string} html - Source code of template. [deprecated]
 * @param {object} parentMeta - Parent gap.
 * @return {gap | null}
 */
function parse(ast, html, parentMeta) {
    /*var name = ast.nodeName;
    var gap = gapTable[name];
    if (!gap){
        return false;
    };*/
    var matched = [];
    for (var i in gaps) {
        var gap = gaps[i];
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
        var maxPrior = Math.max.apply(Math, matched.map(function (item) {
            return item.gap.priority;
        }));
        matched = matched.filter(function (item) {
            return item.gap.priority === maxPrior;
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
/**
 * Renders a gap type according to parsed meta.
 * @param {object} data - Data for gap.
 * @param {object} meta - Meta for gap.
 * @param {object} context - Fg containing the gap.
 * @return {string}
 */
function render(data, meta, context) {
    var gap = gaps[meta.type];
    return gap.render(data, meta, context);
}
exports.render = render;
;
},{"./gaps":18}],18:[function(require,module,exports){
"use strict";
var content_1 = require('./gaps/content');
exports.content = content_1.default;
var data_1 = require('./gaps/data');
exports.data = data_1.default;
var dynamic_text_1 = require('./gaps/dynamic-text');
exports.dynamicText = dynamic_text_1.default;
var fg_1 = require('./gaps/fg');
exports.fg = fg_1.default;
var raw_1 = require('./gaps/raw');
exports.raw = raw_1.default;
var scope_1 = require('./gaps/scope');
exports.scope = scope_1.default;
var scope_item_1 = require('./gaps/scope-item');
exports.scopeItem = scope_item_1.default;
},{"./gaps/content":19,"./gaps/data":20,"./gaps/dynamic-text":21,"./gaps/fg":22,"./gaps/raw":23,"./gaps/scope":25,"./gaps/scope-item":24}],19:[function(require,module,exports){
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
    }
    GContent.parse = function (node) {
        if (node.tagName !== "content") {
            return null;
        }
        ;
        var meta;
        meta.type = "content";
        meta.isVirtual = true;
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
    }
    GData.parse = function (node) {
        if (node.tagName != "data") {
            return null;
        }
        ;
        var meta;
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
},{"../client/gapClassMgr":11,"../utils":29,"../valueMgr":32}],21:[function(require,module,exports){
"use strict";
var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var valueMgr = require('../valueMgr');
var StrTpl_1 = require('../StrTpl');
var gapClassMgr_1 = require('../client/gapClassMgr');
var GDynamicText = (function (_super) {
    __extends(GDynamicText, _super);
    function GDynamicText() {
        _super.apply(this, arguments);
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
        var meta;
        meta.type = "dynamic-text";
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
            var itemMeta = new gapClassMgr_1.Gap(context, dataMeta, meta.parent);
            return gapClassMgr_1.render(context, meta.parent, data, itemMeta);
        });
    };
    ;
    return GDynamicText;
}(gapClassMgr_1.Gap));
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = GDynamicText;
;
},{"../StrTpl":26,"../client/gapClassMgr":11,"../valueMgr":32}],22:[function(require,module,exports){
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
    }
    GFg.parse = function (node) {
        if (node.type != 'tag' || !~node.tagName.indexOf("fg-")) {
            return null;
        }
        ;
        var meta;
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
        var fgClass = window['$fg'].classes[this.fgName];
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
},{"../client/gapClassMgr":11,"../tplMgr":27,"../utils":29,"../valueMgr":32}],23:[function(require,module,exports){
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
    }
    GRaw.parse = function (node, html, parentMeta) {
        if (node.type !== "tag") {
            return null;
        }
        ;
        var hasDynamicAttrs = false;
        var meta;
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
            ? valueMgr.getValue(meta, data, this.resolvedPath)
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
    return GRaw;
}(gapClassMgr_1.Gap));
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = GRaw;
;
},{"../StrTpl":26,"../client/gapClassMgr":11,"../tplMgr":27,"../utils":29,"../valueMgr":32}],24:[function(require,module,exports){
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
},{"../client/gapClassMgr":11,"../valueMgr":32}],25:[function(require,module,exports){
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
            "type": "scope-item",
            "isVirtual": true,
            "path": path,
            "content": scopeMeta.content
        };
        if (scopeMeta.eid) {
            itemCfg.eid = scopeMeta.eid + '-item';
        }
        ;
        itemMeta = new gapClassMgr_1.Gap(context, itemCfg, itemMeta);
        return gapClassMgr_1.render(context, scopeMeta, data, itemMeta);
    });
    return parts;
}
;
var GScope = (function (_super) {
    __extends(GScope, _super);
    function GScope() {
        _super.apply(this, arguments);
    }
    GScope.parse = function (node, html) {
        if (node.tagName !== "scope") {
            return null;
        }
        ;
        var meta;
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
},{"../anchorMgr":8,"../client/gapClassMgr":11,"../tplMgr":27,"../utils":29,"../valueMgr":32}],26:[function(require,module,exports){
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
        res = tpl;
    }
    ;
    return res;
}
exports.read = read;
;
var gapRe = /[\$\#\!]{1}\{[^\}]*\}/gm;
function mixArrays() {
    var rest = []; /*arrays*/
    for (var _i = 0; _i < arguments.length; _i++) {
        rest[_i - 0] = arguments[_i];
    }
    var maxLength = 0;
    var totalLength = 0;
    for (var i = 0; i < arguments.length; i++) {
        maxLength = Math.max(arguments[i].length, maxLength);
        totalLength += arguments[i].length;
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
},{}],27:[function(require,module,exports){
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
// function tplToJson(tpl){ //?
// 	var parts = tpl.map(function(part){
// 		if (typeof part == "string"){
// 			return part;
// 		};
// 		return gapClassMgr.toJson(part);
// 	});
// 	return parts;
// };
},{"./gapServer":17,"./tplRender":28,"micro-jade":2}],28:[function(require,module,exports){
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
},{"./utils":29}],29:[function(require,module,exports){
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
function attrsToObj(attrs) {
    var res = {};
    attrs.forEach(function (i) {
        res[i.name] = i.value;
    });
    return res;
}
exports.attrsToObj = attrsToObj;
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
function mixArrays() {
    var id = 0;
    var maxLength = 0;
    var totalLength = 0;
    for (var i = 0; i < arguments.length; i++) {
        maxLength = Math.max(arguments[i].length, maxLength);
        totalLength += arguments[i].length;
    }
    ;
    var resArr = [];
    var arrayCount = arguments.length;
    for (var id = 0; id < maxLength; id++) {
        for (var i = 0; i < arrayCount; i++) {
            if (arguments[i].length > id) {
                resArr.push(arguments[i][id]);
            }
            ;
        }
        ;
    }
    ;
    return resArr;
}
exports.mixArrays = mixArrays;
;
function resolvePath(rootPath, relPath) {
    var resPath = rootPath.slice();
    relPath = relPath || [];
    relPath.forEach(function (key) {
        if (key === "_root") {
            resPath = [];
            return;
        }
        ;
        resPath.push(key);
    });
    return resPath;
}
exports.resolvePath = resolvePath;
;
function getScopePath(meta) {
    var parentPath = [];
    if (meta.parent) {
        parentPath = meta.parent.scopePath;
        if (!parentPath) {
            throw new Error("Parent elm must have scopePath");
        }
        ;
    }
    ;
    return resolvePath(parentPath, meta.path);
}
exports.getScopePath = getScopePath;
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
function clone(obj) {
    return Object.create(obj);
}
exports.clone = clone;
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
function findScopeHolder(meta) {
    var node = meta.parent;
    while (node) {
        if (!node.isScopeHolder) {
            return node;
        }
        ;
        node = node.parent;
    }
    ;
    throw new Error('cannot find scope holder');
}
exports.findScopeHolder = findScopeHolder;
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
},{"./utils/tplUtils":30,"./valueMgr":32}],30:[function(require,module,exports){
"use strict";
var utils = require('../utils');
var selfClosingTags = ["area", "base", "br", "col",
    "command", "embed", "hr", "img",
    "input", "keygen", "link",
    "meta", "param", "source", "track",
    "wbr"];
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
},{"../utils":29}],31:[function(require,module,exports){
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
},{}],32:[function(require,module,exports){
"use strict";
var utils = require('./utils');
;
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
        if (part[0] === '$') {
            return {
                op: part.slice(1)
            };
        }
        ;
        return part;
    });
    var res = {
        "source": source,
        "path": null,
        "rawPath": path,
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
        rawPath: path.rawPath,
        source: "data",
        escaped: path.escaped
    };
    res.path = scopePath.slice();
    path.rawPath.forEach(function (key) {
        if (typeof key === "string") {
            res.path.push(key);
            return;
        }
        ;
        if (key.op === "root") {
            res.path = [];
        }
        else if (key.op === "up") {
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
    if (valuePath.escaped) {
        res = utils.escapeHtml(res);
    }
    ;
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
    return getValue(meta, data, resolvedPath).toString();
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
},{"./utils":29}]},{},[15])
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uL25vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCIuLi9ub2RlX21vZHVsZXMvbWljcm8tamFkZS9SZVRwbC5qcyIsIi4uL25vZGVfbW9kdWxlcy9taWNyby1qYWRlL2luZGV4LmpzIiwiLi4vbm9kZV9tb2R1bGVzL21pY3JvLWphZGUvcGFyc2VUYWJUcmVlLmpzIiwiLi4vbm9kZV9tb2R1bGVzL21pY3JvLWphZGUvcGFyc2VyLmpzIiwiLi4vbm9kZV9tb2R1bGVzL21pY3JvLWphZGUvcmVuZGVyLmpzIiwiLi4vbm9kZV9tb2R1bGVzL21pY3JvLWphZGUvc3RyVHBsLmpzIiwiLi4vbm9kZV9tb2R1bGVzL21pY3JvLWphZGUvdXRpbHMuanMiLCJhbmNob3JNZ3IudHMiLCJjbGllbnQvZmdDbGFzcy50cyIsImNsaWVudC9mZ0luc3RhbmNlLnRzIiwiY2xpZW50L2dhcENsYXNzTWdyLnRzIiwiY2xpZW50XFxjbGllbnRcXEdhcFN0b3JhZ2UudHMiLCJjbGllbnQvZ2xvYmFsRXZlbnRzLnRzIiwiY2xpZW50L2hlbHBlci50cyIsImNsaWVudC9tYWluLnRzIiwiZXZlbnRFbWl0dGVyLnRzIiwiZ2FwU2VydmVyLnRzIiwiZ2Fwcy50cyIsImdhcHMvY29udGVudC50cyIsImdhcHMvZGF0YS50cyIsImdhcHMvZHluYW1pYy10ZXh0LnRzIiwiZ2Fwcy9mZy50cyIsImdhcHMvcmF3LnRzIiwiZ2Fwcy9zY29wZS1pdGVtLnRzIiwiZ2Fwcy9zY29wZS50cyIsIlN0clRwbC50cyIsInRwbE1nci50cyIsInRwbFJlbmRlci50cyIsInV0aWxzLnRzIiwidXRpbHMvdHBsVXRpbHMudHMiLCJ1dGlsc1xcdXRpbHNcXFRyZWVIZWxwZXIudHMiLCJ2YWx1ZU1nci50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQ0FBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMvQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ1hBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDdkRBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNuUkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN0SEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFD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MEJBQWlDLElBQVMsRUFBRSxJQUFZLEVBQUUsSUFBZ0I7SUFDekUsSUFBSSxZQUFZLEdBQUcsV0FBVyxDQUFDLElBQUksRUFBRSxJQUFJLENBQUMsQ0FBQztJQUMzQyxNQUFNLENBQUMsTUFBTSxDQUFDLElBQUksRUFBRSxJQUFJLEVBQUUsWUFBWSxDQUFDLENBQUM7QUFDekMsQ0FBQztBQUhlLHdCQUFnQixtQkFHL0IsQ0FBQTtBQUFBLENBQUMiLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXNDb250ZW50IjpbIihmdW5jdGlvbiBlKHQsbixyKXtmdW5jdGlvbiBzKG8sdSl7aWYoIW5bb10pe2lmKCF0W29dKXt2YXIgYT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2lmKCF1JiZhKXJldHVybiBhKG8sITApO2lmKGkpcmV0dXJuIGkobywhMCk7dmFyIGY9bmV3IEVycm9yKFwiQ2Fubm90IGZpbmQgbW9kdWxlICdcIitvK1wiJ1wiKTt0aHJvdyBmLmNvZGU9XCJNT0RVTEVfTk9UX0ZPVU5EXCIsZn12YXIgbD1uW29dPXtleHBvcnRzOnt9fTt0W29dWzBdLmNhbGwobC5leHBvcnRzLGZ1bmN0aW9uKGUpe3ZhciBuPXRbb11bMV1bZV07cmV0dXJuIHMobj9uOmUpfSxsLGwuZXhwb3J0cyxlLHQsbixyKX1yZXR1cm4gbltvXS5leHBvcnRzfXZhciBpPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7Zm9yKHZhciBvPTA7bzxyLmxlbmd0aDtvKyspcyhyW29dKTtyZXR1cm4gc30pIiwidmFyIGdhcFJlID0gL1xcW1xcIShcXHcrKVxcXS9nO1xyXG5cclxuZnVuY3Rpb24gUmVUcGwocmVUcGwsIHBhcnRzKXsgICAgXHJcbiAgICB2YXIgc291cmNlID0gcmVUcGwuc291cmNlO1xyXG4gICAgdGhpcy5tYXAgPSBbXTtcclxuICAgIHZhciBzZWxmID0gdGhpcztcclxuICAgIHZhciBuZXdTb3VyY2UgPSBzb3VyY2UucmVwbGFjZShnYXBSZSwgZnVuY3Rpb24oc3ViU3RyLCBuYW1lKXtcclxuICAgICAgICBzZWxmLm1hcC5wdXNoKG5hbWUpO1xyXG4gICAgICAgIHJldHVybiAnKCcgKyBwYXJ0c1tuYW1lXS5zb3VyY2UgKyAnKSc7XHJcbiAgICB9KTtcclxuICAgIHZhciBmbGFncyA9IHJlVHBsLmdsb2JhbCA/ICdnJyA6ICcnXHJcbiAgICAgICAgKyByZVRwbC5tdWx0aWxpbmUgPyAnbScgOiAnJ1xyXG4gICAgICAgICsgcmVUcGwuaWdub3JlQ2FzZSA/ICdpJyA6ICcnO1xyXG4gICAgdGhpcy5yZSA9IG5ldyBSZWdFeHAobmV3U291cmNlLCBmbGFncyk7XHJcbn07XHJcblxyXG5SZVRwbC5wcm90b3R5cGUuZmluZCA9IGZ1bmN0aW9uKHN0ciwgb2Zmc2V0KXsgIFxyXG4gICAgdmFyIHNlbGYgPSB0aGlzO1xyXG4gICAgdGhpcy5yZS5sYXN0SW5kZXggPSBvZmZzZXQgfHwgMDtcclxuICAgIHZhciByZXMgPSB0aGlzLnJlLmV4ZWMoc3RyKTtcclxuICAgIGlmICghcmVzKXtcclxuICAgICAgICByZXR1cm4gbnVsbDsgIFxyXG4gICAgfTtcclxuICAgIHZhciByZXNPYmogPSB7XHJcbiAgICAgICAgZnVsbDogcmVzWzBdLFxyXG4gICAgICAgIHBhcnRzOiB7fVxyXG4gICAgfTtcclxuICAgIHJlcy5zbGljZSgxKS5mb3JFYWNoKGZ1bmN0aW9uKHBhcnQsIGlkKXtcclxuICAgICAgICB2YXIga2V5ID0gc2VsZi5tYXBbaWRdO1xyXG4gICAgICAgIHJlc09iai5wYXJ0c1trZXldID0gcGFydCB8fCBudWxsO1xyXG4gICAgfSk7XHJcbiAgICByZXR1cm4gcmVzT2JqO1xyXG59O1xyXG5cclxuUmVUcGwucHJvdG90eXBlLmZpbmRBbGwgPSBmdW5jdGlvbihzdHIsIG9mZnNldCl7ICBcclxuICAgIHZhciByZXMgPSBbXTtcclxuICAgIHRoaXMucmUubGFzdEluZGV4ID0gb2Zmc2V0IHx8IDA7XHJcbiAgICB3aGlsZSAodHJ1ZSl7XHJcbiAgICAgICAgdmFyIGZvdW5kID0gdGhpcy5maW5kKHN0ciwgdGhpcy5yZS5sYXN0SW5kZXgpO1xyXG4gICAgICAgIGlmICghZm91bmQpe1xyXG4gICAgICAgICAgICByZXR1cm4gcmVzO1xyXG4gICAgICAgIH07XHJcbiAgICAgICAgcmVzLnB1c2goZm91bmQpO1xyXG4gICAgfTtcclxuICAgIHJldHVybiByZXM7IC8vIG5ldmVyIGdvIHRoZXJlXHJcbn07XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IFJlVHBsOyIsIi8vZm9yIHRlc3RzOlxyXG4vL3dpbmRvdy5taiA9IHt9O1xyXG4vL2V4cG9ydHMgPSBtajtcclxuXHJcbmV4cG9ydHMucGFyc2UgPSByZXF1aXJlKCcuL3BhcnNlci5qcycpLnBhcnNlO1xyXG5leHBvcnRzLnJlbmRlciA9IHJlcXVpcmUoJy4vcmVuZGVyLmpzJykucmVuZGVyO1xyXG5leHBvcnRzLnJlbmRlcldyYXBwZXIgPSByZXF1aXJlKCcuL3JlbmRlci5qcycpLnJlbmRlcldyYXBwZXI7XHJcblxyXG5leHBvcnRzLm1ha2UgPSBmdW5jdGlvbihjb2RlLCBkYXRhKXtcclxuXHR2YXIgcGFyc2VkID0gZXhwb3J0cy5wYXJzZShjb2RlKTtcclxuXHRyZXR1cm4gZXhwb3J0cy5yZW5kZXIocGFyc2VkLCBkYXRhKTtcclxufTsiLCJmdW5jdGlvbiBwYXJzZVRhYlRyZWUoY29kZSwgb3B0cyl7ICAgIFxyXG5cclxuXHRmdW5jdGlvbiBOb2RlKHBhcmVudCwgY29kZSl7XHJcblx0XHR0aGlzLnBhcmVudCA9IHBhcmVudDtcclxuXHRcdGlmIChwYXJlbnQpe1xyXG5cdFx0XHRwYXJlbnQuY2hpbGRyZW4ucHVzaCh0aGlzKTtcclxuXHRcdH07XHJcblx0XHR0aGlzLmNvZGUgPSBjb2RlO1xyXG5cdFx0dGhpcy5jaGlsZHJlbiA9IFtdO1xyXG5cdFx0dGhpcy5pbm5lckNvZGUgPSAnJztcclxuXHR9O1xyXG5cclxuXHRvcHRzID0gb3B0cyB8fCB7XHJcblx0XHR0YWJMZW46IDRcclxuXHR9O1xyXG5cclxuXHRmdW5jdGlvbiByZXBlYXQoc3RyLCB0aW1lcyl7XHJcblx0XHR2YXIgcmVzID0gJyc7XHJcblx0XHR2YXIgaSA9IHRpbWVzO1xyXG5cdFx0d2hpbGUgKGktLSl7XHJcblx0XHRcdHJlcyArPSAnICc7XHJcblx0XHR9XHJcblx0XHRyZXR1cm4gcmVzO1xyXG5cdH07XHJcblxyXG5cdHZhciB0YWJTdHIgPSByZXBlYXQoJyAnLCBvcHRzLnRhYkxlbik7XHJcblx0dmFyIGFzdCA9IG5ldyBOb2RlKG51bGwsIG51bGwpO1xyXG5cdHZhciBzdGFjayA9IFt7XHJcblx0XHRub2RlOiBhc3QsXHJcblx0XHRvZmZzZXQ6IC0xXHJcblx0fV07XHJcblx0dmFyIGxpbmVzID0gY29kZS5zcGxpdCgnXFxuJyk7XHJcblxyXG5cdGxpbmVzLmZvckVhY2goZnVuY3Rpb24obGluZSwgbnVtKXtcclxuXHRcdHZhciB0YWIgPSAvXltcXCBcXHRdKi8uZXhlYyhsaW5lKVswXTsgICAgICAgIFxyXG5cdFx0dmFyIG9mZnNldCA9IHRhYi5yZXBsYWNlKC9cXHQvZywgdGFiU3RyKS5sZW5ndGggLyBvcHRzLnRhYkxlbjtcclxuXHRcdHN0YWNrID0gc3RhY2suZmlsdGVyKGZ1bmN0aW9uKHBhcmVudCl7XHJcblx0XHQgICByZXR1cm4gb2Zmc2V0ID4gcGFyZW50Lm9mZnNldDsgXHJcblx0XHR9KTtcclxuXHRcdHZhciBwYXJlbnQgPSBzdGFjay5zbGljZSgtMSlbMF07XHJcblx0XHR2YXIgbm9kZSA9IG5ldyBOb2RlKHBhcmVudC5ub2RlLCBsaW5lLnNsaWNlKHRhYi5sZW5ndGgpKTtcclxuXHRcdHN0YWNrLmZvckVhY2goZnVuY3Rpb24ocGFyZW50KXtcclxuXHRcdFx0cGFyZW50Lm5vZGUuaW5uZXJDb2RlICs9IGxpbmUgKyAnXFxuJztcclxuXHRcdH0pO1xyXG5cdFx0bm9kZS5udW0gPSBudW07XHJcblx0XHRub2RlLm9mZnNldCA9IG9mZnNldDtcclxuXHRcdHN0YWNrLnB1c2goe1xyXG5cdFx0XHRub2RlOiBub2RlLFxyXG5cdFx0XHRvZmZzZXQ6IG9mZnNldFxyXG5cdFx0fSk7XHJcblx0fSk7XHJcblxyXG5cdHJldHVybiBhc3Q7XHJcbn07XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IHBhcnNlVGFiVHJlZTsiLCJcInVzZSBzdHJpY3RcIjtcclxuXHJcbnZhciBSZVRwbCA9IHJlcXVpcmUoJy4vUmVUcGwuanMnKTtcclxudmFyIHBhcnNlVGFiVHJlZSA9IHJlcXVpcmUoJy4vcGFyc2VUYWJUcmVlLmpzJyk7XHJcblxyXG52YXIgZ2FwUmUgPSAvXFxbXFwhKFxcdyspXFxdL2c7XHJcblxyXG5mdW5jdGlvbiBtYWtlUmUoZGljdCwgcmUpe1xyXG5cdHZhciBzb3VyY2UgPSByZS5zb3VyY2U7XHJcblx0dmFyIG5ld1NvdXJjZSA9IHNvdXJjZS5yZXBsYWNlKGdhcFJlLCBmdW5jdGlvbihzdWJTdHIsIG5hbWUpe1xyXG5cdFx0cmV0dXJuIGRpY3RbbmFtZV0uc291cmNlO1xyXG5cdH0pO1xyXG5cdHZhciBmbGFncyA9IHJlLmdsb2JhbCA/ICdnJyA6ICcnXHJcbiAgICAgICAgKyByZS5tdWx0aWxpbmUgPyAnbScgOiAnJ1xyXG4gICAgICAgICsgcmUuaWdub3JlQ2FzZSA/ICdpJyA6ICcnO1xyXG5cdHJldHVybiBuZXcgUmVnRXhwKG5ld1NvdXJjZSwgZmxhZ3MpOyAgXHJcbn07XHJcblxyXG4vLyBmaW5kIHNpbmdsZS9kb3VibGUgcXVvdGVkIFN0cmluZ3MgW2h0dHA6Ly9zdGFja292ZXJmbG93LmNvbS9xdWVzdGlvbnMvMjQ5NzkxL3JlZ2V4LWZvci1xdW90ZWQtc3RyaW5nLXdpdGgtZXNjYXBpbmctcXVvdGVzXVxyXG52YXIgcXV0ZWRTdHJSZSA9IC9cIig/OlteXCJcXFxcXSooPzpcXFxcLlteXCJcXFxcXSopKilcInxcXCcoPzpbXlxcJ1xcXFxdKig/OlxcXFwuW15cXCdcXFxcXSopKilcXCcvOyBcclxudmFyIGlkZlJlID0gL1thLXpBLVowLTlfXFwtXSsvO1xyXG52YXIgYXR0clJlID0gbWFrZVJlKHtcclxuXHRcdGlkZjogaWRmUmUsXHJcblx0XHRkcXM6IHF1dGVkU3RyUmVcclxufSwgL1shaWRmXVxcIT9cXD0/KD86WyFpZGZdfFshZHFzXSk/Lyk7XHJcblxyXG52YXIgcHJlcCA9IG1ha2VSZS5iaW5kKG51bGwsIHtcclxuXHRpZGY6IGlkZlJlLFxyXG5cdGF0dHI6IGF0dHJSZVxyXG59KTtcclxuXHJcbnZhciB0YWJSZSA9IC9cXHMqLztcclxuXHJcbnZhciBjbGFzc0lkUGFydFJlID0gcHJlcCgvW1xcLlxcI117MX1bIWlkZl0vZyk7XHJcbnZhciBjbGFzc0lkUmUgPSBtYWtlUmUoe3BhcnQ6IGNsYXNzSWRQYXJ0UmV9LCAvKD86WyFwYXJ0XSkrL2cpO1xyXG5cclxudmFyIHRhZ0xpbmUgPSBuZXcgUmVUcGwoXHJcbi9eWyF0YWddP1shY2xhc3NJZF0/WyFhdHRyc10/WyF0ZXh0XT9bIW11bHRpbGluZV0/WyF2YWx1ZV0/W1xcdFxcIF0qJC9nLCB7XHJcblx0dGFiOiB0YWJSZSxcclxuXHR0YWc6IHByZXAoL1shaWRmXS8pLFxyXG5cdGNsYXNzSWQ6IGNsYXNzSWRSZSxcclxuXHRhdHRyczogcHJlcCgvXFwoKD86WyFhdHRyXVxccypcXCw/XFxzKikqXFwpLyksXHJcblx0dmFsdWU6IC9cXCE/XFw9W15cXG5dKi8sXHJcblx0dGV4dDogL1xcIFteXFxuXSovLFxyXG5cdG11bHRpbGluZTogL1xcLltcXCBcXHRdKi9cclxufSk7XHJcblxyXG52YXIgd2hpdGVzcGFjZSA9IG5ldyBSZVRwbCgvXlxccyokL2csIHtcclxuXHJcbn0pO1xyXG5cclxudmFyIHRleHRMaW5lID0gbmV3IFJlVHBsKC9eXFx8WyF0ZXh0XSQvLCB7XHJcblx0dGV4dDogL1teXFxuXSovXHJcbn0pO1xyXG5cclxudmFyIGNvbW1lbnRMaW5lID0gbmV3IFJlVHBsKC9eXFwvXFwvXFwtP1shdGV4dF0kLywge1xyXG5cdHRleHQ6IC9bXlxcbl0qL1xyXG59KTtcclxuXHJcbmZ1bmN0aW9uIGNvbGxhcHNlVG9TdHIoYXN0KXtcclxuXHR2YXIgbGluZXMgPSBbYXN0LmNvZGVdLmNvbmNhdChhc3QuY2hpbGRyZW4ubWFwKGNvbGxhcHNlVG9TdHIpKTtcclxuXHRyZXR1cm4gbGluZXMuam9pbignXFxuJyk7XHJcbn07XHJcblxyXG5mdW5jdGlvbiBwYXJzZUNsYXNzSWQoc3RyKXtcclxuXHR2YXIgcmVzID0ge1xyXG5cdFx0Y2xhc3NlczogW10sXHJcblx0XHRpZDogbnVsbFxyXG5cdH07XHJcblx0dmFyIHBhcnRzID0gc3RyLm1hdGNoKGNsYXNzSWRQYXJ0UmUpLmZvckVhY2goZnVuY3Rpb24ocGFydCl7XHJcblx0XHRpZiAocGFydFswXSA9PSBcIiNcIil7XHJcblx0XHRcdHJlcy5pZCA9IHBhcnQuc2xpY2UoMSk7XHJcblx0XHRcdHJldHVybjtcclxuXHRcdH07XHJcblx0XHRyZXMuY2xhc3Nlcy5wdXNoKHBhcnQuc2xpY2UoMSkpO1xyXG5cdH0pO1xyXG5cdHJldHVybiByZXM7XHJcbn07XHJcblxyXG52YXIgYXR0clBhaXJSZSA9IG5ldyBSZVRwbCgvKD86WyFuYW1lXVshZXF1YWxdPyg/Olsha2V5XXxbIXN0clZhbHVlXSk/KVxcLD9cXHMqL2csIHtcclxuXHRcdG5hbWU6IGlkZlJlLFxyXG5cdFx0a2V5OiBpZGZSZSxcclxuXHRcdHN0clZhbHVlOiBxdXRlZFN0clJlLFxyXG5cdFx0ZXF1YWw6IC9cXCE/XFw9L1xyXG59KVxyXG5cclxuZnVuY3Rpb24gcGFyc2VBdHRycyhzdHIpe1xyXG5cdHZhciBhdHRyT2JqID0ge307XHJcblx0aWYgKCFzdHIpe1xyXG5cdFx0XHRyZXR1cm4gYXR0ck9iajtcclxuXHR9O1xyXG5cdHN0ciA9IHN0ci5zbGljZSgxLCAtMSk7XHJcblx0dmFyIHBhaXJzID0gYXR0clBhaXJSZS5maW5kQWxsKHN0cik7XHJcblx0cGFpcnMuZm9yRWFjaChmdW5jdGlvbihwYWlyKXtcclxuXHRcdHZhciBuYW1lID0gcGFpci5wYXJ0cy5uYW1lO1xyXG5cdFx0dmFyIHZhbHVlO1xyXG5cdFx0aWYgKHBhaXIucGFydHMua2V5KXtcclxuXHRcdFx0dmFsdWUgPSB7XHJcblx0XHRcdFx0dHlwZTogXCJ2YXJpYmxlXCIsXHJcblx0XHRcdFx0a2V5OiBwYWlyLnBhcnRzLmtleSxcclxuXHRcdFx0XHRlc2NhcGVkOiBwYWlyLnBhcnRzLmVxdWFsICE9PSBcIiE9XCJcclxuXHRcdFx0fTtcclxuXHRcdH1lbHNle1xyXG5cdFx0XHR2YWx1ZSA9IHtcclxuXHRcdFx0XHR0eXBlOiBcInN0cmluZ1wiLFxyXG5cdFx0XHRcdHZhbHVlOiBwYWlyLnBhcnRzLnN0clZhbHVlLnNsaWNlKDEsIC0xKVxyXG5cdFx0XHR9O1xyXG5cdFx0fTtcclxuXHRcdGF0dHJPYmpbbmFtZV0gPSB2YWx1ZTsgXHJcblx0fSk7XHJcblx0cmV0dXJuIGF0dHJPYmo7XHJcbn07XHJcblxyXG5mdW5jdGlvbiByZXBlYXQoc3RyLCB0aW1lcyl7XHJcblx0dmFyIHJlcyA9ICcnO1xyXG5cdHZhciBpID0gdGltZXM7XHJcblx0d2hpbGUgKGktLSl7XHJcblx0XHRyZXMgKz0gJyAnO1xyXG5cdH1cclxuXHRyZXR1cm4gcmVzO1xyXG59O1xyXG5cclxuXHJcbnZhciB0YWJTdHIgPSByZXBlYXQoJyAnLCA0KTtcclxudmFyIHRhYlNwYWNlUmUgPSBuZXcgUmVnRXhwKHRhYlN0ciwgJ2cnKTtcclxuXHJcbmZ1bmN0aW9uIHJlbW92ZU9mZnNldCh0ZXh0LCBvZmZzZXQpe1xyXG5cdHZhciBvZmZzZXRMZW4gPSBvZmZzZXQ7XHRcclxuXHRyZXR1cm4gdGV4dFxyXG5cdFx0LnJlcGxhY2UodGFiU3BhY2VSZSwgJ1xcdCcpXHJcblx0XHQuc3BsaXQoJ1xcbicpXHJcblx0XHQubWFwKGZ1bmN0aW9uKGxpbmUpe1xyXG5cdFx0XHRyZXR1cm4gbGluZS5zbGljZShvZmZzZXRMZW4pO1xyXG5cdFx0fSlcclxuXHRcdC5qb2luKCdcXG4nKTtcdFxyXG59O1xyXG5cclxudmFyIHRva2VucyA9IHtcclxuXHR0YWc6IHtcclxuXHRcdHJ1bGU6IGZ1bmN0aW9uKHN0cil7XHJcblx0XHRcdGlmICgvXlxccyokL2cudGVzdChzdHIpKXtcclxuXHRcdFx0XHRyZXR1cm4gbnVsbDtcclxuXHRcdFx0fTtcclxuXHRcdFx0cmV0dXJuIHRhZ0xpbmUuZmluZChzdHIpOyBcclxuXHRcdH0sXHJcblx0XHR0cmFuc2Zvcm06IGZ1bmN0aW9uKGZvdW5kLCBhc3QsIHBhcmVudCl7ICAgICAgICAgICAgXHJcblx0XHRcdHZhciBub2RlID0ge1xyXG5cdFx0XHRcdHR5cGU6ICd0YWcnLFxyXG5cdFx0XHRcdHRhZ05hbWU6IGZvdW5kLnBhcnRzLnRhZyB8fCAnZGl2JyxcclxuXHRcdFx0XHRhdHRyczoge30sXHJcblx0XHRcdFx0cGFyZW50OiBwYXJlbnRcclxuXHRcdFx0fTtcclxuXHRcdFx0dmFyIGNsYXNzZXMgPSBbXTtcclxuXHRcdFx0dmFyIGNsYXNzSWQgPSBmb3VuZC5wYXJ0cy5jbGFzc0lkO1xyXG5cdFx0XHR2YXIgaWQ7XHJcblx0XHRcdGlmIChjbGFzc0lkKXtcclxuXHRcdFx0XHR2YXIgcGFyc2VkID0gcGFyc2VDbGFzc0lkKGNsYXNzSWQpO1xyXG5cdFx0XHRcdGlmIChwYXJzZWQuaWQpe1xyXG5cdFx0XHRcdFx0aWQgPSBwYXJzZWQuaWRcclxuXHRcdFx0XHR9O1xyXG5cdFx0XHRcdGNsYXNzZXMgPSBjbGFzc2VzLmNvbmNhdChwYXJzZWQuY2xhc3Nlcyk7XHJcblx0XHRcdH07XHJcblx0XHRcdHZhciBhdHRycyA9IHBhcnNlQXR0cnMoZm91bmQucGFydHMuYXR0cnMpO1xyXG5cdFx0XHRpZiAoIWF0dHJzLmlkICYmIGlkKXtcclxuXHRcdFx0XHRhdHRycy5pZCA9IGlkO1xyXG5cdFx0XHR9O1xyXG5cdFx0XHR2YXIgY2xhc3NBdHRyID0gYXR0cnNbXCJjbGFzc1wiXTtcclxuXHRcdFx0aWYgKGNsYXNzQXR0cil7XHRcdFx0XHRcclxuXHRcdFx0XHRpZiAoYXR0cnNbXCJjbGFzc1wiXS50eXBlID09IFwic3RyaW5nXCIpe1xyXG5cdFx0XHRcdFx0Y2xhc3NlcyA9IGNsYXNzZXMuY29uY2F0KGF0dHJzW1wiY2xhc3NcIl0udmFsdWUuc3BsaXQoJyAnKSk7XHJcblx0XHRcdFx0fTtcclxuXHRcdFx0fWVsc2V7XHJcblx0XHRcdFx0aWYgKGNsYXNzZXMubGVuZ3RoID4gMCl7XHJcblx0XHRcdFx0XHRhdHRyc1tcImNsYXNzXCJdID0ge1xyXG5cdFx0XHRcdFx0XHR0eXBlOiBcInN0cmluZ1wiLFxyXG5cdFx0XHRcdFx0XHR2YWx1ZTogY2xhc3Nlcy5qb2luKCcgJylcclxuXHRcdFx0XHRcdH07XHJcblx0XHRcdFx0fTtcdFxyXG5cdFx0XHR9OyAgICAgICAgICAgIFxyXG5cdFx0XHRub2RlLmF0dHJzID0gYXR0cnM7XHJcblx0XHRcdHZhciB0ZXh0O1xyXG5cdFx0XHRpZiAoZm91bmQucGFydHMudmFsdWUpe1xyXG5cdFx0XHRcdHZhciBlcXVhbE9wID0gL1xcIT9cXD0vLmV4ZWMoZm91bmQucGFydHMudmFsdWUpWzBdO1xyXG5cdFx0XHRcdG5vZGUudmFsdWUgPSB7XHJcblx0XHRcdFx0XHRlc2NhcGVkOiBlcXVhbE9wICE9PSBcIiE9XCIsXHJcblx0XHRcdFx0XHRwYXRoOiBmb3VuZC5wYXJ0cy52YWx1ZS5yZXBsYWNlKC9eXFxzKlxcIT9cXD1cXHMqL2csICcnKVxyXG5cdFx0XHRcdH07XHJcblx0XHRcdFx0bm9kZS5jaGlsZHJlbiA9IFtdO1xyXG5cdFx0XHRcdHJldHVybiBub2RlO1xyXG5cdFx0XHR9O1xyXG5cdFx0XHRpZiAoZm91bmQucGFydHMubXVsdGlsaW5lKXtcdFx0XHRcdFxyXG5cdFx0XHRcdG5vZGUuY2hpbGRyZW4gPSBbe1xyXG5cdFx0XHRcdFx0dHlwZTogJ3RleHQnLFxyXG5cdFx0XHRcdFx0dGV4dDogcmVtb3ZlT2Zmc2V0KGFzdC5pbm5lckNvZGUsIGFzdC5vZmZzZXQgKyAxKVxyXG5cdFx0XHRcdH1dO1xyXG5cdFx0XHRcdHJldHVybiBub2RlOyAgICAgICAgICAgICAgICAgIFxyXG5cdFx0XHR9O1xyXG5cdFx0XHRpZiAoZm91bmQucGFydHMudGV4dCl7XHJcblx0XHRcdFx0bm9kZS5jaGlsZHJlbiA9IFt7XHJcblx0XHRcdFx0XHR0eXBlOiAndGV4dCcsXHJcblx0XHRcdFx0XHR0ZXh0OiBmb3VuZC5wYXJ0cy50ZXh0LnJlcGxhY2UoL14gPy8sICcnKVxyXG5cdFx0XHRcdH1dO1xyXG5cdFx0XHRcdHJldHVybiBub2RlOyAgIFxyXG5cdFx0XHR9O1xyXG5cdFx0XHRub2RlLmNoaWxkcmVuID0gYXN0LmNoaWxkcmVuLm1hcCh0cmFuc2Zvcm1Bc3QuYmluZChudWxsLCBub2RlKSk7XHJcblx0XHRcdHJldHVybiBub2RlO1xyXG5cdFx0fVxyXG5cdH0sXHJcblx0dGV4dDoge1xyXG5cdFx0cnVsZTogdGV4dExpbmUsXHJcblx0XHR0cmFuc2Zvcm06IGZ1bmN0aW9uKGZvdW5kLCBhc3QsIHBhcmVudCl7XHJcblx0XHRcdHJldHVybiB7XHJcblx0XHRcdFx0dHlwZTogJ3RleHQnLFxyXG5cdFx0XHRcdHRleHQ6IGZvdW5kLnBhcnRzLnRleHQsXHJcblx0XHRcdFx0cGFyZW50OiBwYXJlbnRcclxuXHRcdFx0fVxyXG5cdFx0fVxyXG5cdH0sXHJcblx0d2hpdGVzcGFjZToge1xyXG5cdFx0cnVsZTogd2hpdGVzcGFjZSxcclxuXHRcdHRyYW5zZm9ybTogZnVuY3Rpb24oZm91bmQsIGFzdCwgcGFyZW50KXtcclxuXHRcdFx0cmV0dXJuIHtcclxuXHRcdFx0XHR0eXBlOiAnd2hpdGVzcGFjZScsXHJcblx0XHRcdFx0cGFyZW50OiBwYXJlbnRcclxuXHRcdFx0fVxyXG5cdFx0fVxyXG5cdH0sXHJcblx0Y29tbWVudDoge1xyXG5cdFx0cnVsZTogY29tbWVudExpbmUsXHJcblx0XHR0cmFuc2Zvcm06IGZ1bmN0aW9uKGZvdW5kLCBhc3QsIHBhcmVudCl7XHJcblx0XHRcdHJldHVybiB7XHJcblx0XHRcdFx0dHlwZTogJ2NvbW1lbnQnLFxyXG5cdFx0XHRcdHRleHQ6IGZvdW5kLnBhcnRzLnRleHQsXHJcblx0XHRcdFx0cGFyZW50OiBwYXJlbnRcclxuXHRcdFx0fVxyXG5cdFx0fVxyXG5cdH1cclxufTtcclxuXHJcbmZ1bmN0aW9uIHRyYW5zZm9ybUFzdChwYXJlbnQsIGFzdCwgbWV0YSl7XHJcblx0XHR2YXIgZm91bmQ7XHJcblx0XHR2YXIgdG9rZW47XHJcblx0XHRmb3IgKHZhciBuYW1lIGluIHRva2Vucyl7XHJcblx0XHRcdHRva2VuID0gdG9rZW5zW25hbWVdO1xyXG5cdFx0XHR2YXIgbGluZSA9IGFzdC5jb2RlLnJlcGxhY2UoL1xcci9nLCAnJyk7XHJcblx0XHRcdGZvdW5kID0gdHlwZW9mIHRva2VuLnJ1bGUgPT0gXCJmdW5jdGlvblwiIFxyXG5cdFx0XHRcdD8gdG9rZW4ucnVsZShsaW5lKVxyXG5cdFx0XHRcdDogdG9rZW4ucnVsZS5maW5kKGxpbmUpO1xyXG5cdFx0XHRpZiAoZm91bmQpe1xyXG5cdFx0XHRcdGJyZWFrO1xyXG5cdFx0XHR9OyAgICAgICAgXHJcblx0XHR9O1xyXG5cdFx0aWYgKCFmb3VuZCl7XHJcblx0XHRcdHRocm93IG5ldyBFcnJvcigndG9rZW4gbm90IGZvdW5kIChsaW5lOiAnICsgYXN0Lm51bSArICcpOiBcIicgKyBhc3QuY29kZSArICdcIlxcbicpO1xyXG5cdFx0fTtcclxuXHRcdHJldHVybiB0b2tlbi50cmFuc2Zvcm0oZm91bmQsIGFzdCwgcGFyZW50KTtcclxuXHRcdFxyXG59O1xyXG5cclxuZnVuY3Rpb24gcGFyc2UoY29kZSl7XHJcblx0Y29kZSA9IGNvZGUudG9TdHJpbmcoKTtcclxuXHRjb2RlID0gY29kZVxyXG5cdFx0LnJlcGxhY2UoL1xcci9nLCAnJylcclxuXHRcdC5yZXBsYWNlKC9cXG5bXFwgXFx0XSpcXG4vZywgJ1xcbicpO1xyXG5cdHZhciBhc3QgPSB7XHJcblx0XHR0eXBlOiBcInJvb3RcIlxyXG5cdH07XHJcblx0dmFyIHRhYkFzdCA9IHBhcnNlVGFiVHJlZShjb2RlKTtcclxuXHRhc3QuY2hpbGRyZW4gPSB0YWJBc3QuY2hpbGRyZW4ubWFwKHRyYW5zZm9ybUFzdC5iaW5kKG51bGwsIGFzdCkpOyAgXHJcblx0cmV0dXJuIGFzdDsgIFxyXG5cclxufTtcclxuXHJcblxyXG5cclxuZXhwb3J0cy5wYXJzZSA9IHBhcnNlOyIsInZhciB1dGlscyA9IHJlcXVpcmUoJy4vdXRpbHMuanMnKTtcclxudmFyIFN0clRwbCA9IHJlcXVpcmUoJy4vc3RyVHBsLmpzJyk7XHJcblxyXG52YXIgc2VsZkNsb3NpbmdUYWdzID0gW1wiYXJlYVwiLCBcImJhc2VcIiwgXCJiclwiLCBcImNvbFwiLCBcclxuXHRcImNvbW1hbmRcIiwgXCJlbWJlZFwiLCBcImhyXCIsIFwiaW1nXCIsIFxyXG5cdFwiaW5wdXRcIiwgXCJrZXlnZW5cIiwgXCJsaW5rXCIsIFxyXG5cdFwibWV0YVwiLCBcInBhcmFtXCIsIFwic291cmNlXCIsIFwidHJhY2tcIiwgXHJcblx0XCJ3YnJcIl07XHJcblxyXG52YXIgZXNwZWNpYWxUYWdzID0ge1xyXG5cdFwiZG9jdHlwZVwiOiBmdW5jdGlvbih0YWdJbmZvKXtcclxuXHRcdHZhciB2YWwgPSB0YWdJbmZvLmlubmVySFRNTC5yZXBsYWNlKC9cXG4vZywgJycpLnRyaW0oKTtcclxuXHRcdHJldHVybiAnPCFET0NUWVBFICcgKyB2YWwgKyAnPic7XHJcblx0fVxyXG59O1xyXG5cclxuZnVuY3Rpb24gb2JqRm9yKG9iaiwgZm4pe1xyXG5cdGZvciAodmFyIGkgaW4gb2JqKXtcclxuXHRcdGZuKG9ialtpXSwgaSwgb2JqKTtcclxuXHR9O1xyXG59O1xyXG5cclxuZnVuY3Rpb24gcmVuZGVyVGFnV3JhcHBlcih0YWdJbmZvKXtcclxuXHR2YXIgYXR0cnMgPSB0YWdJbmZvLmF0dHJzO1x0XHJcblx0dmFyIHBhaXJzID0gW107XHJcblx0Zm9yICh2YXIgbmFtZSBpbiBhdHRycyl7XHJcblx0XHR2YXIgdmFsdWUgPSBhdHRyc1tuYW1lXS52YWx1ZTtcclxuXHRcdHBhaXJzLnB1c2gobmFtZSArICc9XCInICsgdmFsdWUgKyAnXCInKTtcclxuXHR9O1xyXG5cdHZhciBhdHRyQ29kZSA9ICcnO1xyXG5cdGlmIChwYWlycy5sZW5ndGggPiAwKXtcclxuXHRcdGF0dHJDb2RlID0gJyAnICsgcGFpcnMuam9pbignJyk7XHJcblx0fTtcclxuXHR2YXIgdGFnSGVhZCA9IHRhZ0luZm8ubmFtZSArIGF0dHJDb2RlO1xyXG5cdGlmICh+c2VsZkNsb3NpbmdUYWdzLmluZGV4T2YodGFnSW5mby5uYW1lKSl7XHJcblx0XHRyZXR1cm4gW1wiPFwiICsgdGFnSGVhZCArIFwiIC8+XCJdO1xyXG5cdH07XHJcblx0dmFyIGVzcGVjaWFsID0gZXNwZWNpYWxUYWdzW3RhZ0luZm8ubmFtZV07XHJcblx0aWYgKGVzcGVjaWFsKXtcclxuXHRcdHJldHVybiBbZXNwZWNpYWwodGFnSW5mbyldO1xyXG5cdH07XHJcblx0dmFyIG9wZW5UYWcgPSBcIjxcIiArIHRhZ0hlYWQgKyBcIj5cIjtcclxuXHR2YXIgY2xvc2VUYWcgPSBcIjwvXCIgKyB0YWdJbmZvLm5hbWUgKyBcIj5cIjtcclxuXHRyZXR1cm4gW29wZW5UYWcsIGNsb3NlVGFnXTtcclxufTtcclxuZXhwb3J0cy5yZW5kZXJUYWdXcmFwcGVyID0gcmVuZGVyVGFnV3JhcHBlcjtcdFxyXG5cclxuZnVuY3Rpb24gcmVuZGVyVGFnKHRhZ0luZm8pe1xyXG5cdHZhciB3cmFwID0gcmVuZGVyVGFnV3JhcHBlcih0YWdJbmZvKTtcclxuXHR2YXIgY29kZSA9IHdyYXAuam9pbih0YWdJbmZvLmlubmVySFRNTCB8fCBcIlwiKTtcclxuXHRyZXR1cm4gY29kZTtcdFxyXG59O1xyXG5leHBvcnRzLnJlbmRlclRhZyA9IHJlbmRlclRhZztcdFxyXG5cclxuZnVuY3Rpb24gcmVuZGVyQXR0cnMoYXR0cnMsIGRhdGEpe1xyXG5cdHZhciByZXNBdHRycyA9IHt9O1xyXG5cdG9iakZvcihhdHRycywgZnVuY3Rpb24odmFsdWUsIG5hbWUpe1xyXG5cdFx0dmFyIG5hbWVUcGwgPSBuZXcgU3RyVHBsKG5hbWUpO1xyXG5cdFx0dmFyIHZhbHVlVHBsID0gbmV3IFN0clRwbCh2YWx1ZSk7XHJcblx0XHRyZXNBdHRyc1tuYW1lVHBsLnJlbmRlcihkYXRhKV0gPSB2YWx1ZVRwbC5yZW5kZXIoZGF0YSk7XHRcdFxyXG5cdH0pO1x0XHJcblx0cmV0dXJuIHJlc0F0dHJzO1xyXG59O1xyXG5leHBvcnRzLnJlbmRlckF0dHJzID0gcmVuZGVyQXR0cnM7XHJcblxyXG5mdW5jdGlvbiBnZXRBdHRyc1BhdGhzKGF0dHJzKXtcclxuXHR2YXIgcGF0aHMgPSBbXTtcclxuXHRvYmpGb3IoYXR0cnMsIGZ1bmN0aW9uKHZhbHVlLCBuYW1lKXtcclxuXHRcdHZhciBuYW1lVHBsID0gbmV3IFN0clRwbChuYW1lKTtcclxuXHRcdHZhciB2YWx1ZVRwbCA9IG5ldyBTdHJUcGwodmFsdWUpO1xyXG5cdFx0cGF0aHMgPSBwYXRocy5jb25jYXQobmFtZVRwbC5nZXRQYXRocygpLCB2YWx1ZVRwbC5nZXRQYXRocygpKTtcdFx0XHJcblx0fSk7XHJcblx0cmV0dXJuIHBhdGhzO1xyXG59O1xyXG5leHBvcnRzLmdldEF0dHJzUGF0aHMgPSBnZXRBdHRyc1BhdGhzO1xyXG5cclxuXHJcbmZ1bmN0aW9uIHJlbmRlcihhc3QsIGRhdGEpe1xyXG5cdGlmIChhc3QudHlwZSA9PSBcImNvbW1lbnRcIil7XHJcblx0XHRyZXR1cm4gXCJcIjtcclxuXHR9O1xyXG5cdGlmIChhc3QudHlwZSA9PSBcInRleHRcIil7XHJcblx0XHRyZXR1cm4gYXN0LnRleHQ7XHJcblx0fTtcclxuXHRpZiAoYXN0LnR5cGUgPT0gXCJyb290XCIpe1xyXG5cdFx0cmV0dXJuIGFzdC5jaGlsZHJlbi5tYXAoZnVuY3Rpb24oY2hpbGQpe1xyXG5cdFx0XHRyZXR1cm4gcmVuZGVyKGNoaWxkLCBkYXRhKTtcclxuXHRcdH0pLmpvaW4oJycpO1xyXG5cdH07XHJcblx0aWYgKGFzdC50eXBlICE9IFwidGFnXCIpe1xyXG5cdFx0cmV0dXJuIFwiXCI7XHJcblx0fTtcdFxyXG5cdHZhciBpbm5lcjtcclxuXHRpZiAoYXN0LnZhbHVlKXtcclxuXHRcdHZhciBwYXRoID0gYXN0LnZhbHVlLnNwbGl0KCcuJyk7XHJcblx0XHR2YXIgaW5uZXIgPSB1dGlscy5vYmpQYXRoKHBhdGgsIGRhdGEpO1xyXG5cdH1lbHNle1xyXG5cdFx0aW5uZXIgPSBhc3QuY2hpbGRyZW4ubWFwKGZ1bmN0aW9uKGNoaWxkKXtcclxuXHRcdFx0cmV0dXJuIHJlbmRlcihjaGlsZCwgZGF0YSk7XHJcblx0XHR9KS5qb2luKCcnKTtcclxuXHR9O1xyXG5cdHJldHVybiByZW5kZXJUYWcoe1xyXG5cdFx0bmFtZTogYXN0LnRhZ05hbWUsXHJcblx0XHRhdHRyczogYXN0LmF0dHJzLFxyXG5cdFx0aW5uZXJIVE1MOiBpbm5lclxyXG5cdH0pO1xyXG59O1xyXG5leHBvcnRzLnJlbmRlciA9IHJlbmRlcjtcclxuXHJcbmZ1bmN0aW9uIHJlbmRlcldyYXBwZXIoYXN0LCBkYXRhKXtcclxuXHRpZiAoYXN0LnR5cGUgIT0gXCJ0YWdcIil7XHJcblx0XHRyZXR1cm4gW107XHJcblx0fTtcclxuXHRyZXR1cm4gcmVuZGVyVGFnV3JhcHBlcih7XHJcblx0XHRuYW1lOiBhc3QudGFnTmFtZSxcclxuXHRcdGF0dHJzOiBhc3QuYXR0cnNcclxuXHR9KTtcclxufTtcclxuZXhwb3J0cy5yZW5kZXJXcmFwcGVyID0gcmVuZGVyV3JhcHBlcjsiLCJ2YXIgdXRpbHMgPSByZXF1aXJlKCcuL3V0aWxzLmpzJyk7XHJcblxyXG5mdW5jdGlvbiBTdHJUcGwodHBsKXtcclxuXHR0aGlzLnRwbCA9IHRwbDtcclxufTtcclxuXHJcblN0clRwbC5wYXJzZSA9IGZ1bmN0aW9uKHN0cil7XHJcblx0dmFyIHJlID0gL1xcJVxcQD9bXFx3XFxkX1xcLlxcLV0rJS9nO1xyXG5cdHZhciBnYXBzID0gc3RyLm1hdGNoKHJlKTtcclxuXHRpZiAoIWdhcHMpe1xyXG5cdFx0cmV0dXJuIHN0cjtcclxuXHR9O1xyXG5cdGdhcHMgPSBnYXBzLm1hcChmdW5jdGlvbihnYXApe1xyXG5cdFx0dmFyIHBhdGhTdHIgPSBnYXAuc2xpY2UoMSwgLTEpO1xyXG5cdFx0dmFyIHBhdGggPSBbXTtcclxuXHRcdGlmIChwYXRoU3RyWzBdID09IFwiQFwiKXtcclxuXHRcdFx0cGF0aFN0ciA9IHBhdGhTdHIuc2xpY2UoMSk7XHJcblx0XHR9ZWxzZXtcclxuXHRcdFx0cGF0aCA9IFtdO1xyXG5cdFx0fTtcclxuXHRcdHZhciBwYXRoID0gcGF0aC5jb25jYXQocGF0aFN0ci5zcGxpdCgnLicpKTtcclxuXHRcdHJldHVybiB7XHJcblx0XHRcdFwicGF0aFwiOiBwYXRoXHJcblx0XHR9O1xyXG5cdH0pO1xyXG5cdHZhciB0cGxQYXJ0cyA9IHN0ci5zcGxpdChyZSk7XHJcblx0dmFyIHRwbCA9IHV0aWxzLm1peEFycmF5cyh0cGxQYXJ0cywgZ2Fwcyk7XHJcblx0cmV0dXJuIHRwbDtcclxufTtcclxuXHJcblN0clRwbC5wcm90b3R5cGUuZ2V0UGF0aHMgPSBmdW5jdGlvbigpe1xyXG5cdHZhciBwYXRocyA9IFtdO1xyXG5cdGlmICghQXJyYXkuaXNBcnJheSh0aGlzLnRwbCkpe1xyXG5cdFx0cmV0dXJuIHBhdGhzO1xyXG5cdH07XHRcclxuXHR0aGlzLnRwbC5mb3JFYWNoKGZ1bmN0aW9uKHBhcnQpe1xyXG5cdFx0aWYgKHR5cGVvZiBwYXJ0ID09IFwic3RyaW5nXCIpe1xyXG5cdFx0XHRyZXR1cm47XHJcblx0XHR9O1xyXG5cdFx0cmV0dXJuIHBhdGhzLnB1c2gocGFydC5wYXRoKTtcclxuXHR9KTtcclxuXHRyZXR1cm4gcGF0aHM7XHJcbn07XHJcblxyXG5TdHJUcGwucHJvdG90eXBlLnJlbmRlciA9IGZ1bmN0aW9uKGRhdGEpe1xyXG5cdGlmICghQXJyYXkuaXNBcnJheSh0aGlzLnRwbCkpe1xyXG5cdFx0cmV0dXJuIHRoaXMudHBsO1xyXG5cdH07XHJcblx0cmV0dXJuIHRoaXMudHBsLm1hcChmdW5jdGlvbihwYXJ0KXtcclxuXHRcdGlmICh0eXBlb2YgcGFydCA9PSBcInN0cmluZ1wiKXtcclxuXHRcdFx0cmV0dXJuIHBhcnQ7XHJcblx0XHR9O1xyXG5cdFx0cmV0dXJuIHV0aWxzLm9ialBhdGgocGFydC5wYXRoLCBkYXRhKTtcclxuXHR9KS5qb2luKCcnKTtcdFxyXG59O1xyXG5cclxubW9kdWxlLmV4cG9ydHMgPSBTdHJUcGw7XHJcbiIsImZ1bmN0aW9uIG1peEFycmF5cyhhcnJheXMpe1xyXG5cdHZhciBpZCA9IDA7XHJcblx0dmFyIG1heExlbmd0aCA9IDA7XHJcblx0dmFyIHRvdGFsTGVuZ3RoID0gMDtcclxuXHRmb3IgKHZhciBpID0gMDsgaSA8IGFyZ3VtZW50cy5sZW5ndGg7IGkrKyl7XHJcblx0XHRtYXhMZW5ndGggPSBNYXRoLm1heChhcmd1bWVudHNbaV0ubGVuZ3RoLCBtYXhMZW5ndGgpO1xyXG5cdFx0dG90YWxMZW5ndGggKz0gYXJndW1lbnRzW2ldLmxlbmd0aDtcclxuXHR9O1xyXG5cdHZhciByZXNBcnIgPSBbXTtcclxuXHR2YXIgYXJyYXlDb3VudCA9IGFyZ3VtZW50cy5sZW5ndGg7XHJcblx0Zm9yICh2YXIgaWQgPSAwOyBpZCA8IG1heExlbmd0aDsgaWQrKyl7XHRcdFx0XHRcclxuXHRcdGZvciAodmFyIGkgPSAwOyBpIDwgYXJyYXlDb3VudDsgaSsrKXtcclxuXHRcdFx0aWYgKGFyZ3VtZW50c1tpXS5sZW5ndGggPiBpZCl7XHJcblx0XHRcdFx0cmVzQXJyLnB1c2goYXJndW1lbnRzW2ldW2lkXSk7XHJcblx0XHRcdH07XHJcblx0XHR9O1xyXG5cdH07XHJcblx0cmV0dXJuIHJlc0FycjtcclxufTtcclxuZXhwb3J0cy5taXhBcnJheXMgPSBtaXhBcnJheXM7XHJcblxyXG5mdW5jdGlvbiBvYmpQYXRoKHBhdGgsIG9iaiwgbmV3VmFsKXtcclxuXHRpZiAocGF0aC5sZW5ndGggPCAxKXtcclxuXHRcdGlmIChhcmd1bWVudHMubGVuZ3RoID4gMil7XHJcblx0XHRcdHRocm93ICdyb290IHJld3JpdHRpbmcgaXMgbm90IHN1cHBvcnRlZCc7XHJcblx0XHR9O1xyXG5cdFx0cmV0dXJuIG9iajtcclxuXHR9O1xyXG5cdHZhciBwcm9wTmFtZSA9IHBhdGhbMF07XHJcblx0aWYgKHBhdGgubGVuZ3RoID09IDEpe1xyXG5cdFx0aWYgKGFyZ3VtZW50cy5sZW5ndGggPiAyKXtcclxuXHRcdFx0b2JqW3Byb3BOYW1lXSA9IG5ld1ZhbDsgXHJcblx0XHR9O1x0XHRcdFx0XHJcblx0XHRyZXR1cm4gb2JqW3Byb3BOYW1lXTtcdFxyXG5cdH07XHJcblx0dmFyIHN1Yk9iaiA9IG9ialtwcm9wTmFtZV07XHJcblx0aWYgKHN1Yk9iaiA9PT0gdW5kZWZpbmVkKXtcclxuXHRcdC8vdGhyb3cgbmV3IEVycm9yKFwiQ2Fubm90IHJlYWQgXCIgKyBwcm9wTmFtZSArIFwiIG9mIHVuZGVmaW5lZFwiKTtcclxuXHRcdHJldHVybiB1bmRlZmluZWQ7IC8vIHRocm93P1xyXG5cdH07XHRcdFxyXG5cdGlmIChhcmd1bWVudHMubGVuZ3RoID4gMil7XHJcblx0XHRyZXR1cm4gb2JqUGF0aChwYXRoLnNsaWNlKDEpLCBzdWJPYmosIG5ld1ZhbCk7XHJcblx0fTtcclxuXHRyZXR1cm4gb2JqUGF0aChwYXRoLnNsaWNlKDEpLCBzdWJPYmopO1xyXG59O1xyXG5leHBvcnRzLm9ialBhdGggPSBvYmpQYXRoO1xyXG4iLCJcInVzZSBzdHJpY3RcIjtcclxuXHJcbmltcG9ydCB7RmdJbnN0YW5jZX0gZnJvbSAnLi9jbGllbnQvZmdJbnN0YW5jZSc7XHJcbmltcG9ydCB7R2FwfSBmcm9tICcuL2NsaWVudC9nYXBDbGFzc01ncic7XHJcblxyXG5leHBvcnQgdHlwZSBBbmNob3IgPSBIVE1MRWxlbWVudDtcclxuLyoqXHJcbiAqIEdlbmVyYXRlcyBhbiBpZCBmb3IgYW4gYWNuY2hvci5cclxuICogQHBhcmFtIHtPYmplY3R9IGNvbnRleHQgLSBGZyBjb250YWluaW5nIHRoZSBhY25jaG9yLlxyXG4gKiBAcGFyYW0ge09iamVjdH0gZ2FwIC0gR2FwIHRvIHdoaWNoIHRoZSBhY25jaG9yIGlzIGJpbmQgdG8uXHJcbiAqIEByZXR1cm5zIHtzdHJpbmd9IElkIG9mIHRoZSBhbmNob3IgdGFnLlxyXG4gKi9cclxuZnVuY3Rpb24gZ2VuSWQoY29udGV4dDogRmdJbnN0YW5jZSwgZ2FwOiBHYXApOiBzdHJpbmd7XHJcbiAgIFx0dmFyIGlkID0gWydmZycsIGNvbnRleHQuaWQsICdhaWQnLCBnYXAuZ2lkXS5qb2luKCctJyk7XHJcbiAgICByZXR1cm4gaWQ7XHJcbn07XHJcblxyXG4vKipcclxuICogR2VuZXJhdGVzIGNvZGUgZm9yIGFuIGFjbmNob3IuXHJcbiAqIEBwYXJhbSB7T2JqZWN0fSBjb250ZXh0IC0gRmcgY29udGFpbmluZyB0aGUgYWNuY2hvci5cclxuICogQHBhcmFtIHtPYmplY3R9IGdhcCAtIEdhcCB0byB3aGljaCB0aGUgYWNuY2hvciBpcyBiaW5kIHRvLlxyXG4gKiBAcmV0dXJucyB7c3RyaW5nfSBIdG1sIGNvZGUgb2YgdGhlIGFuY2hvci4gXHJcbiAqL1xyXG5leHBvcnQgZnVuY3Rpb24gZ2VuQ29kZShjb250ZXh0OiBGZ0luc3RhbmNlLCBnYXA6IEdhcCk6IHN0cmluZ3tcclxuICAgIHZhciBjb2RlID0gJzxzY3JpcHQgdHlwZT1cImZnLWpzL2FuY2hvclwiIGlkPVwiJyBcclxuICAgICAgICArIGdlbklkKGNvbnRleHQsIGdhcCkgXHJcbiAgICAgICAgKyAnXCI+PC9zY3JpcHQ+JztcclxuICAgIHJldHVybiBjb2RlO1xyXG59O1xyXG5cclxuLyoqXHJcbiAqIEZpbmQgdGhlIGFuY2hvci5cclxuICogQHBhcmFtIHtPYmplY3R9IGNvbnRleHQgLSBGZyBjb250YWluaW5nIHRoZSBhY25jaG9yLlxyXG4gKiBAcGFyYW0ge09iamVjdH0gZ2FwIC0gR2FwIHRvIHdoaWNoIHRoZSBhY25jaG9yIGlzIGJpbmQgdG8uXHJcbiAqIEByZXR1cm5zIHtPYmplY3R9IERvbSBlbGVtZW50IG9mIHRoZSBhbmNob3IuXHJcbiAqL1xyXG5leHBvcnQgZnVuY3Rpb24gZmluZChjb250ZXh0OiBGZ0luc3RhbmNlLCBnYXA6IEdhcCk6IEFuY2hvcntcclxuICAgXHR2YXIgaWQgPSBnZW5JZChjb250ZXh0LCBnYXApOyAgICBcclxuICAgIHJldHVybiBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChpZCk7XHJcbn07XHJcblxyXG4vKipcclxuICogUGxhY2VzIHNvbWUgSHRtbCBjb2RlIG5leHQgdG8gdGhlIGFjbmNob3IuXHJcbiAqIEBwYXJhbSB7T2JqZWN0fSBhbmNob3IgLSBUaGUgYW5jaG9yIERPTSBlbGVtZW50LlxyXG4gKiBAcGFyYW0ge3N0cmluZ30gcG9zaXRpb24gLSBEZWZpbmVzIHdoZXJlIGNvZGUgYmUgcGxhY2VkLiBcImFmdGVyXCIgYW5kIFwiYmVmb3JlXCIgYXJlIHVzZWQgcmVsYXRpdmUgdG8gYW5jaG9yIG5vZGUuXHJcbiAqIEBwYXJhbSB7c3RyaW5nfSBodG1sIC0gSFRNTCBjb2RlIHRvIGJlIHBsYWNlZC5cclxuICovXHJcbmV4cG9ydCBmdW5jdGlvbiBpbnNlcnRIVE1MKGFuY2hvcjogQW5jaG9yLCBwb3NpdGlvbjogc3RyaW5nLCBodG1sOiBzdHJpbmcpe1xyXG4gICBcdHZhciBwb3NUYWJsZSA9IHtcclxuICAgICAgICAgICBcImJlZm9yZVwiOiBcImJlZm9yZWJlZ2luXCIsXHJcbiAgICAgICAgICAgXCJhZnRlclwiOiBcImFmdGVyZW5kXCJcclxuICAgIH07XHJcbiAgICB2YXIgcG9zID0gcG9zVGFibGVbcG9zaXRpb25dO1xyXG4gICAgYW5jaG9yLmluc2VydEFkamFjZW50SFRNTChwb3MsIGh0bWwpO1xyXG59OyIsIlwidXNlIHN0cmljdFwiO1xyXG5cclxuaW1wb3J0IEV2ZW50RW1pdHRlciBmcm9tICcuLi9ldmVudEVtaXR0ZXInO1xyXG5pbXBvcnQge0lFdmVudEVtaXR0ZXJ9IGZyb20gJy4uL2V2ZW50RW1pdHRlcic7XHJcbmltcG9ydCAqIGFzIGdsb2JhbEV2ZW50cyBmcm9tICcuL2dsb2JhbEV2ZW50cyc7XHJcbmltcG9ydCAqIGFzIGZnSW5zdGFuY2VNb2R1bGUgZnJvbSAnLi9mZ0luc3RhbmNlJztcclxuaW1wb3J0IHtGZ0luc3RhbmNlfSBmcm9tICcuL2ZnSW5zdGFuY2UnO1xyXG5pbXBvcnQge0dhcH0gZnJvbSAnLi9nYXBDbGFzc01ncic7XHJcbmltcG9ydCB7VHBsfSBmcm9tICcuLi90cGxNZ3InO1xyXG5cclxuZXhwb3J0IHZhciBmZ0NsYXNzVGFibGU6IEZnQ2xhc3NbXSA9IFtdO1xyXG5leHBvcnQgdmFyIGZnQ2xhc3NEaWN0ID0ge307XHJcblxyXG5leHBvcnQgaW50ZXJmYWNlIElGZ0NsYXNzT3B0c3tcclxuXHR0cGw6IFRwbDtcclxuXHRjbGFzc0ZuOiBGdW5jdGlvbjtcclxuXHRuYW1lOiBzdHJpbmc7XHJcbn07XHJcblxyXG5leHBvcnQgY2xhc3MgRmdDbGFzc3tcclxuXHRpZDogbnVtYmVyO1xyXG5cdGluc3RhbmNlczogZmdJbnN0YW5jZU1vZHVsZS5GZ0luc3RhbmNlW107XHJcblx0dHBsOiBUcGw7XHJcblx0bmFtZTogc3RyaW5nO1xyXG5cdGV2ZW50RW1pdHRlcjogSUV2ZW50RW1pdHRlcjtcclxuXHRjcmVhdGVGbjogRnVuY3Rpb247XHJcblx0XHJcblx0Y29uc3RydWN0b3Iob3B0czogSUZnQ2xhc3NPcHRzKXtcclxuXHRcdHRoaXMuaWQgPSBmZ0NsYXNzVGFibGUubGVuZ3RoO1x0XHJcblx0XHR0aGlzLmluc3RhbmNlcyA9IFtdO1xyXG5cdFx0dGhpcy50cGwgPSBvcHRzLnRwbDtcclxuXHRcdHRoaXMubmFtZSA9IG9wdHMubmFtZTtcclxuXHRcdHRoaXMuZXZlbnRFbWl0dGVyID0gbmV3IEV2ZW50RW1pdHRlcigpO1xyXG5cdFx0ZmdDbGFzc0RpY3Rbb3B0cy5uYW1lXSA9IHRoaXM7XHJcblx0XHRmZ0NsYXNzVGFibGUucHVzaCh0aGlzKTtcdFxyXG5cdFx0ZnVuY3Rpb24gRmdJbnN0YW5jZSgpe1xyXG5cdFx0XHRmZ0luc3RhbmNlTW9kdWxlLkZnSW5zdGFuY2VCYXNlLmFwcGx5KHRoaXMsIGFyZ3VtZW50cyk7XHJcblx0XHR9O1xyXG5cdFx0dGhpcy5jcmVhdGVGbiA9IEZnSW5zdGFuY2U7XHJcblx0XHR0aGlzLmNyZWF0ZUZuLmNvbnN0cnVjdG9yID0gZmdJbnN0YW5jZU1vZHVsZS5GZ0luc3RhbmNlQmFzZTtcdFxyXG5cdFx0dGhpcy5jcmVhdGVGbi5wcm90b3R5cGUgPSBPYmplY3QuY3JlYXRlKGZnSW5zdGFuY2VNb2R1bGUuRmdJbnN0YW5jZUJhc2UucHJvdG90eXBlKTtcdFxyXG5cdFx0dmFyIGNsYXNzRm4gPSBvcHRzLmNsYXNzRm47XHJcblx0XHRpZiAoY2xhc3NGbil7XHJcblx0XHRcdGNsYXNzRm4odGhpcywgdGhpcy5jcmVhdGVGbi5wcm90b3R5cGUpO1xyXG5cdFx0fTtcclxuXHR9O1xyXG5cclxuXHRvbihuYW1lOiBzdHJpbmcsIHNlbGVjdG9yLCBmbj8pe1x0XHJcblx0XHRpZiAoYXJndW1lbnRzLmxlbmd0aCA9PT0gMil7XHJcblx0XHRcdG5hbWUgPSBuYW1lO1xyXG5cdFx0XHRmbiA9IGFyZ3VtZW50c1sxXTtcclxuXHRcdFx0c2VsZWN0b3IgPSBudWxsO1xyXG5cdFx0fWVsc2V7XHJcblx0XHRcdHZhciBvcmlnaW5hbEZuID0gZm47XHJcblx0XHRcdGZuID0gZnVuY3Rpb24oZXZlbnQpe1x0XHRcdFxyXG5cdFx0XHRcdGlmIChtYXRjaCh0aGlzLCBldmVudC50YXJnZXQsIHNlbGVjdG9yKSl7XHJcblx0XHRcdFx0XHRvcmlnaW5hbEZuLmNhbGwodGhpcywgZXZlbnQpO1xyXG5cdFx0XHRcdH07XHJcblx0XHRcdH07XHJcblx0XHR9O1xyXG5cdFx0Z2xvYmFsRXZlbnRzLmxpc3RlbihuYW1lKTtcclxuXHRcdHRoaXMuZXZlbnRFbWl0dGVyLm9uKG5hbWUsIGZuKTtcdFxyXG5cdH07XHJcblxyXG5cdGVtaXQoLypuYW1lLi4uLCByZXN0Ki8pe1xyXG5cdFx0dGhpcy5ldmVudEVtaXR0ZXIuZW1pdC5hcHBseSh0aGlzLmV2ZW50RW1pdHRlciwgYXJndW1lbnRzKTtcdFxyXG5cdH07XHJcblxyXG5cdGVtaXRBcHBseShuYW1lOiBzdHJpbmcsIHRoaXNBcmc6IGFueSwgYXJnczogYW55W10pe1xyXG5cdFx0dGhpcy5ldmVudEVtaXR0ZXIuZW1pdEFwcGx5KG5hbWUsIHRoaXNBcmcsIGFyZ3MpO1x0XHJcblx0fTtcclxuXHJcblx0Y29va0RhdGEoZGF0YSl7XHJcblx0XHRyZXR1cm4gZGF0YTtcclxuXHR9O1xyXG5cclxuXHRyZW5kZXIoZGF0YTogYW55LCBtZXRhPzogR2FwLCBwYXJlbnQ/OiBGZ0luc3RhbmNlKXtcclxuXHRcdGlmIChkYXRhIGluc3RhbmNlb2YgSFRNTEVsZW1lbnQpe1xyXG5cdFx0XHRyZXR1cm4gdGhpcy5yZW5kZXJJbi5hcHBseSh0aGlzLCBhcmd1bWVudHMpO1xyXG5cdFx0fTtcclxuXHRcdHZhciBmZyA9IG5ldyBmZ0luc3RhbmNlTW9kdWxlLkZnSW5zdGFuY2UodGhpcywgcGFyZW50KTtcclxuXHRcdGZnLmNvZGUgPSBmZy5nZXRIdG1sKGRhdGEsIG1ldGEpO1xyXG5cdFx0cmV0dXJuIGZnO1xyXG5cdH07XHJcblxyXG5cdHJlbmRlckluKHBhcmVudE5vZGU6IEhUTUxFbGVtZW50LCBkYXRhOiBhbnksIG1ldGE/OiBHYXAsIHBhcmVudD86IEZnSW5zdGFuY2Upe1xyXG5cdFx0dmFyIGZnID0gdGhpcy5yZW5kZXIoZGF0YSwgbWV0YSwgcGFyZW50KTtcclxuXHRcdHBhcmVudE5vZGUuaW5uZXJIVE1MID0gZmcuY29kZTtcclxuXHRcdGZnLmFzc2lnbigpO1xyXG5cdFx0cmV0dXJuIGZnO1xyXG5cdH07XHJcblxyXG5cdGFwcGVuZFRvKHBhcmVudE5vZGU6IEhUTUxFbGVtZW50LCBkYXRhOiBhbnkpe1xyXG5cdFx0dmFyIGZnID0gdGhpcy5yZW5kZXIoZGF0YSk7XHRcclxuXHRcdHZhciBkaXYgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKTtcclxuXHRcdGRpdi5pbm5lckhUTUwgPSBmZy5jb2RlO1xyXG5cdFx0W10uc2xpY2UuY2FsbChkaXYuY2hpbGRyZW4pLmZvckVhY2goZnVuY3Rpb24oY2hpbGQpe1xyXG5cdFx0XHRwYXJlbnROb2RlLmFwcGVuZENoaWxkKGNoaWxkKTtcclxuXHRcdH0pO1xyXG5cdFx0ZmcuYXNzaWduKCk7XHJcblx0fTtcclxuXHRcclxufTtcclxuXHJcbmZ1bmN0aW9uIG1hdGNoKGZnOiBGZ0luc3RhbmNlLCBub2RlOiBIVE1MRWxlbWVudCwgc2VsZWN0b3I6IHN0cmluZyl7XHJcblx0dmFyIGRvbUVsbXMgPSBmZy5nZXREb20oKTtcclxuXHR3aGlsZSAobm9kZSl7XHJcblx0XHRpZiAobm9kZS5tYXRjaGVzKHNlbGVjdG9yKSl7XHJcblx0XHRcdHJldHVybiB0cnVlO1xyXG5cdFx0fTtcclxuXHRcdGlmIChkb21FbG1zLmluZGV4T2Yobm9kZSkgPj0gMCl7XHJcblx0XHRcdHJldHVybiBmYWxzZTtcclxuXHRcdH07XHRcdFxyXG5cdFx0bm9kZSA9IG5vZGUucGFyZW50RWxlbWVudDtcclxuXHR9O1xyXG5cdHJldHVybiBmYWxzZTtcclxufTsiLCJcInVzZSBzdHJpY3RcIjtcclxuXHJcbmltcG9ydCByZW5kZXJUcGwgZnJvbSAnLi4vdHBsUmVuZGVyJztcclxuaW1wb3J0ICogYXMgZ2FwQ2xhc3NNZ3IgZnJvbSAnLi9nYXBDbGFzc01ncic7XHJcbmltcG9ydCB7SUV2ZW50RW1pdHRlcn0gZnJvbSAnLi4vZXZlbnRFbWl0dGVyJztcclxuaW1wb3J0IEV2ZW50RW1pdHRlciBmcm9tICcuLi9ldmVudEVtaXR0ZXInO1xyXG5pbXBvcnQge1RwbH0gZnJvbSAnLi4vdHBsTWdyJztcclxuaW1wb3J0IHtHYXB9IGZyb20gJy4vZ2FwQ2xhc3NNZ3InO1xyXG5pbXBvcnQge0ZnQ2xhc3N9IGZyb20gJy4vZmdDbGFzcyc7XHJcbmltcG9ydCAqIGFzIHV0aWxzIGZyb20gJy4uL3V0aWxzJztcclxuaW1wb3J0IEdhcFN0b3JhZ2UgZnJvbSAnLi9HYXBTdG9yYWdlJztcclxuaW1wb3J0ICogYXMgZ2xvYmFsRXZlbnRzIGZyb20gJy4vZ2xvYmFsRXZlbnRzJztcclxudmFyIGhlbHBlciA9IHJlcXVpcmUoJy4vaGVscGVyJyk7XHJcblxyXG5leHBvcnQgdmFyIGZnSW5zdGFuY2VUYWJsZSA9IFtdO1xyXG5cclxuZXhwb3J0IGNsYXNzIEZnSW5zdGFuY2VCYXNleyBcclxuXHRpZDogbnVtYmVyO1xyXG5cdG5hbWU6IHN0cmluZztcclxuXHRmZ0NsYXNzOiBGZ0NsYXNzO1xyXG5cdGNvZGU6IHN0cmluZztcdFxyXG5cdGRvbTogSFRNTEVsZW1lbnRbXTtcclxuXHRkYXRhOiBhbnk7XHJcblx0bWV0YTogR2FwO1xyXG5cdGdhcE1ldGE6IEdhcDtcclxuXHRwYXJlbnQ6IEZnSW5zdGFuY2U7XHJcblx0ZXZlbnRFbWl0dGVyOiBJRXZlbnRFbWl0dGVyO1xyXG5cdGdhcFN0b3JhZ2U6IGFueTtcclxuXHRjaGlsZEZnczogRmdJbnN0YW5jZVtdO1xyXG5cclxuXHRjb25zdHJ1Y3RvcihmZ0NsYXNzOiBGZ0NsYXNzLCBwYXJlbnQ6IEZnSW5zdGFuY2Upe1xyXG5cdFx0dGhpcy5pZCA9IGZnSW5zdGFuY2VUYWJsZS5sZW5ndGg7XHJcblx0XHRmZ0NsYXNzLmluc3RhbmNlcy5wdXNoKHRoaXMpO1xyXG5cdFx0dGhpcy5uYW1lID0gZmdDbGFzcy5uYW1lO1xyXG5cdFx0dGhpcy5mZ0NsYXNzID0gZmdDbGFzcztcclxuXHRcdHRoaXMuY29kZSA9IG51bGw7XHJcblx0XHR0aGlzLnBhcmVudCA9IHBhcmVudCB8fCBudWxsO1xyXG5cdFx0dGhpcy5ldmVudEVtaXR0ZXIgPSBuZXcgRXZlbnRFbWl0dGVyKGZnQ2xhc3MuZXZlbnRFbWl0dGVyKTtcclxuXHRcdHRoaXMuZ2FwU3RvcmFnZSA9IG5ldyBHYXBTdG9yYWdlKHRoaXMpO1xyXG5cdFx0dGhpcy5jaGlsZEZncyA9IFtdO1xyXG5cdFx0ZmdJbnN0YW5jZVRhYmxlLnB1c2godGhpcyk7XHRcclxuXHR9O1xyXG5cclxuXHRvbihldmVudDogc3RyaW5nLCBmbjogRnVuY3Rpb24pe1xyXG5cdFx0Z2xvYmFsRXZlbnRzLmxpc3RlbihldmVudCk7XHJcblx0XHR0aGlzLmV2ZW50RW1pdHRlci5vbihldmVudCwgZm4pO1x0XHJcblx0fTtcclxuXHJcblx0ZW1pdCguLi5yZXN0KXtcclxuXHRcdHRoaXMuZXZlbnRFbWl0dGVyLmVtaXQuYXBwbHkodGhpcy5ldmVudEVtaXR0ZXIsIGFyZ3VtZW50cyk7XHRcdFxyXG5cdH07XHJcblxyXG5cdGVtaXRBcHBseSguLi5yZXN0KXtcclxuXHRcdHRoaXMuZXZlbnRFbWl0dGVyLmVtaXQuYXBwbHkodGhpcy5ldmVudEVtaXR0ZXIsIGFyZ3VtZW50cyk7XHRcdFxyXG5cdH07XHJcblxyXG5cdHRvU3RyaW5nKCl7XHJcblx0XHRyZXR1cm4gdGhpcy5jb2RlO1xyXG5cdH07XHJcblxyXG5cdGFzc2lnbigpe1xyXG5cdFx0Ly8gdGhpcy5lbWl0QXBwbHkoJ3JlYWR5JywgdGhpcywgW10pO1xyXG5cdFx0Ly8gdGhpcy5kb20gPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnZmctaWlkLScgKyB0aGlzLmlkKTtcclxuXHRcdC8vIHRoaXMuZ2FwU3RvcmFnZS5hc3NpZ24oKTtcclxuXHRcdC8vIHJldHVybiB0aGlzLmRvbTtcclxuXHR9O1xyXG5cclxuXHRyZW5kZXJUcGwodHBsOiBUcGwsIHBhcmVudDogR2FwLCBkYXRhOiBhbnksIG1ldGE/KXtcclxuXHRcdHJldHVybiByZW5kZXJUcGwuY2FsbCh7XHJcblx0XHRcdFwicmVuZGVyR2FwXCI6IGdhcENsYXNzTWdyLnJlbmRlcixcclxuXHRcdFx0XCJjb250ZXh0XCI6IHRoaXNcclxuXHRcdH0sIHRwbCwgcGFyZW50LCBkYXRhLCBtZXRhKTtcclxuXHR9O1xyXG5cclxuXHRnZXRIdG1sKGRhdGE6IGFueSwgbWV0YT8pe1xyXG5cdFx0dGhpcy5kYXRhID0gZGF0YTtcclxuXHRcdHRoaXMuZ2FwTWV0YSA9IG1ldGE7XHJcblx0XHR2YXIgcm9vdEdhcCA9IG5ldyBHYXAodGhpcywgbWV0YSk7XHJcblx0XHRyb290R2FwLnR5cGUgPSBcInJvb3RcIjtcclxuXHRcdHJvb3RHYXAuaXNWaXJ0dWFsID0gdHJ1ZTtcclxuXHRcdHJvb3RHYXAuZmcgPSB0aGlzO1xyXG5cdFx0cm9vdEdhcC5zY29wZVBhdGgucGF0aCA9IFtdO1xyXG5cdFx0dGhpcy5tZXRhID0gcm9vdEdhcDtcclxuXHRcdHZhciBjb29rZWREYXRhID0gdGhpcy5mZ0NsYXNzLmNvb2tEYXRhKGRhdGEpO1xyXG5cdFx0cmV0dXJuIHRoaXMucmVuZGVyVHBsKHRoaXMuZmdDbGFzcy50cGwsIHJvb3RHYXAsIGNvb2tlZERhdGEsIG1ldGFNYXAuYmluZChudWxsLCB0aGlzKSk7XHJcblx0fTtcclxuXHJcblx0dXBkYXRlKHNjb3BlUGF0aCwgbmV3VmFsdWUpe1xyXG5cdFx0aWYgKGFyZ3VtZW50cy5sZW5ndGggPT09IDApe1xyXG5cdFx0XHRyZXR1cm4gdGhpcy51cGRhdGUoW10sIHRoaXMuZGF0YSk7IC8vIHRvZG9cclxuXHRcdH07XHJcblx0XHRpZiAoYXJndW1lbnRzLmxlbmd0aCA9PT0gMSl7XHJcblx0XHRcdHJldHVybiB0aGlzLnVwZGF0ZShbXSwgYXJndW1lbnRzWzBdKTtcclxuXHRcdH07XHJcblx0XHR2YXIgdmFsdWUgPSB1dGlscy5kZWVwQ2xvbmUobmV3VmFsdWUpO1xyXG5cdFx0dmFyIHNlbGYgPSB0aGlzO1xyXG5cdFx0dmFyIG9sZFZhbHVlID0gdXRpbHMub2JqUGF0aChzY29wZVBhdGgsIHRoaXMuZGF0YSk7XHJcblx0XHRpZiAob2xkVmFsdWUgPT09IHZhbHVlKXtcclxuXHRcdFx0cmV0dXJuIHRoaXM7XHJcblx0XHR9O1x0XHJcblx0XHR0aGlzLmVtaXQoJ3VwZGF0ZScsIHNjb3BlUGF0aCwgbmV3VmFsdWUpO1xyXG5cdFx0aWYgKHNjb3BlUGF0aC5sZW5ndGggPiAwKXtcclxuXHRcdFx0dXRpbHMub2JqUGF0aChzY29wZVBhdGgsIHRoaXMuZGF0YSwgdmFsdWUpO1xyXG5cdFx0fWVsc2V7XHJcblx0XHRcdHRoaXMuZGF0YSA9IHZhbHVlO1xyXG5cdFx0fVxyXG5cdFx0dmFyIHNjb3BlID0gdGhpcy5nYXBTdG9yYWdlLmJ5U2NvcGUoc2NvcGVQYXRoKTtcclxuXHRcdHZhciBnYXBzID0gc2NvcGUudGFyZ2V0O1xyXG5cdFx0Z2Fwcy5mb3JFYWNoKGZ1bmN0aW9uKGdhcCl7XHJcblx0XHRcdGdhcENsYXNzTWdyLnVwZGF0ZShzZWxmLCBnYXAsIHNjb3BlUGF0aCwgdmFsdWUsIG9sZFZhbHVlKTtcclxuXHRcdH0pO1xyXG5cdFx0c2NvcGUucGFyZW50cy5mb3JFYWNoKGZ1bmN0aW9uKHBhcmVudE5vZGUpe1xyXG5cdFx0XHRwYXJlbnROb2RlLmRhdGEuZ2Fwcy5mb3JFYWNoKGZ1bmN0aW9uKHBhcmVudEdhcCl7XHJcblx0XHRcdFx0aWYgKHBhcmVudEdhcC50eXBlID09PSBcImZnXCIpe1xyXG5cdFx0XHRcdFx0dmFyIHN1YlBhdGggPSBzY29wZVBhdGguc2xpY2UocGFyZW50R2FwLnNjb3BlUGF0aC5sZW5ndGgpO1xyXG5cdFx0XHRcdFx0Ly92YXIgc3ViVmFsID0gdXRpbHMub2JqUGF0aChzdWJQYXRoLCBzZWxmLmRhdGEpO1xyXG5cdFx0XHRcdFx0cGFyZW50R2FwLmZnLnVwZGF0ZShzdWJQYXRoLCBuZXdWYWx1ZSk7XHJcblx0XHRcdFx0fTtcdFx0XHRcclxuXHRcdFx0fSk7XHJcblx0XHR9KTtcclxuXHRcdHNjb3BlLnN1YnMuZm9yRWFjaChmdW5jdGlvbihzdWIpe1xyXG5cdFx0XHR2YXIgc3ViVmFsID0gdXRpbHMub2JqUGF0aChzdWIucGF0aCwgc2VsZi5kYXRhKTtcdFxyXG5cdFx0XHR2YXIgc3ViUGF0aCA9IHN1Yi5wYXRoLnNsaWNlKHNjb3BlUGF0aC5sZW5ndGgpO1xyXG5cdFx0XHR2YXIgb2xkU3ViVmFsID0gdXRpbHMub2JqUGF0aChzdWJQYXRoLCBvbGRWYWx1ZSk7XHJcblx0XHRcdGlmIChzdWJWYWwgPT09IG9sZFN1YlZhbCl7XHJcblx0XHRcdFx0cmV0dXJuO1xyXG5cdFx0XHR9O1xyXG5cdFx0XHRzdWIuZ2Fwcy5mb3JFYWNoKGZ1bmN0aW9uKGdhcCl7XHJcblx0XHRcdFx0aWYgKHNlbGYuZ2FwU3RvcmFnZS5nYXBzLmluZGV4T2YoZ2FwKSA8IDApe1xyXG5cdFx0XHRcdFx0cmV0dXJuO1xyXG5cdFx0XHRcdH07XHJcblx0XHRcdFx0Z2FwQ2xhc3NNZ3IudXBkYXRlKHNlbGYsIGdhcCwgc3ViLnBhdGgsIHN1YlZhbCwgb2xkU3ViVmFsKTtcclxuXHRcdFx0fSk7XHJcblx0XHR9KTtcclxuXHRcdHJldHVybiB0aGlzO1xyXG5cdH07XHJcblxyXG5cdGNsb25lRGF0YSgpe1xyXG5cdFx0cmV0dXJuIHV0aWxzLmRlZXBDbG9uZSh0aGlzLmRhdGEpO1xyXG5cdH07XHJcblxyXG5cdGNsZWFyKCl7XHJcblx0XHR0aGlzLmNoaWxkRmdzLmZvckVhY2goZnVuY3Rpb24oY2hpbGQpe1xyXG5cdFx0XHQoY2hpbGQgYXMgRmdJbnN0YW5jZUJhc2UpLnJlbW92ZSh0cnVlKTtcclxuXHRcdH0pO1xyXG5cdFx0dGhpcy5jb2RlID0gJyc7XHJcblx0XHR0aGlzLmRhdGEgPSBudWxsO1xyXG5cdFx0dGhpcy5nYXBTdG9yYWdlID0gbnVsbDtcclxuXHRcdHRoaXMuY2hpbGRGZ3MgPSBbXTtcclxuXHR9O1xyXG5cclxuXHRyZW1vdmUodmlydHVhbDogYm9vbGVhbil7XHJcblx0XHRpZiAoIXZpcnR1YWwpe1xyXG5cdFx0XHR2YXIgZG9tID0gdGhpcy5nZXREb20oKTtcclxuXHRcdFx0ZG9tLmZvckVhY2goZnVuY3Rpb24oZWxtKXtcclxuXHRcdFx0XHRlbG0ucmVtb3ZlKCk7XHJcblx0XHRcdH0pO1xyXG5cdFx0fTtcclxuXHRcdHRoaXMuY2xlYXIoKTtcclxuXHRcdHZhciBpbnN0YW5jZUlkID0gdGhpcy5mZ0NsYXNzLmluc3RhbmNlcy5pbmRleE9mKHRoaXMpO1x0XHJcblx0XHR0aGlzLmZnQ2xhc3MuaW5zdGFuY2VzLnNwbGljZShpbnN0YW5jZUlkLCAxKTtcclxuXHRcdGZnSW5zdGFuY2VUYWJsZVt0aGlzLmlkXSA9IG51bGw7XHJcblx0fTtcclxuXHJcblx0cmVyZW5kZXIoZGF0YSl7XHJcblx0XHR0aGlzLmNsZWFyKCk7XHJcblx0XHR0aGlzLmdhcFN0b3JhZ2UgPSBuZXcgR2FwU3RvcmFnZSh0aGlzKTtcclxuXHRcdHZhciBkb20gPSB0aGlzLmdldERvbSgpWzBdO1xyXG5cdFx0dGhpcy5jb2RlID0gdGhpcy5nZXRIdG1sKGRhdGEsIG51bGwpO1xyXG5cdFx0ZG9tLm91dGVySFRNTCA9IHRoaXMuY29kZTsgLy8gZG9lc250IHdvcmsgd2l0aCBtdWx0aSByb290XHJcblx0XHR0aGlzLmFzc2lnbigpO1xyXG5cdFx0cmV0dXJuIHRoaXM7XHJcblx0fTtcclxuXHJcblx0Z2V0RG9tKCl7XHJcblx0XHRyZXR1cm4gdGhpcy5tZXRhLmdldERvbSgpO1xyXG5cdH07XHJcblxyXG5cdGpxKCl7XHJcblx0XHR2YXIgZG9tID0gdGhpcy5nZXREb20oKTtcclxuXHRcdHZhciByZXMgPSBoZWxwZXIuanEoZG9tKTtcclxuXHRcdGlmIChhcmd1bWVudHMubGVuZ3RoID09PSAwKXtcclxuXHRcdFx0cmV0dXJuIHJlcztcclxuXHRcdH07XHJcblx0XHR2YXIgc2VsZWN0b3IgPSBhcmd1bWVudHNbMF07XHJcblx0XHR2YXIgc2VsZlNlbGVjdGVkID0gcmVzXHJcblx0XHRcdC5wYXJlbnQoKVxyXG5cdFx0XHQuZmluZChzZWxlY3RvcilcclxuXHRcdFx0LmZpbHRlcihmdW5jdGlvbihpZCwgZWxtKXtcclxuXHRcdFx0XHRyZXR1cm4gZG9tLmluZGV4T2YoZWxtKSA+PSAwO1xyXG5cdFx0XHR9KTtcclxuXHRcdHZhciBjaGlsZFNlbGVjdGVkID0gcmVzLmZpbmQoc2VsZWN0b3IpO1xyXG5cdFx0cmV0dXJuIHNlbGZTZWxlY3RlZC5hZGQoY2hpbGRTZWxlY3RlZCk7XHJcblx0fTtcclxuXHJcblx0Z2FwKGlkKXtcclxuXHRcdHJldHVybiB0aGlzLmdhcHMoaWQpWzBdO1xyXG5cdH07XHJcblxyXG5cdGdhcHMoaWQpe1xyXG5cdFx0dmFyIGdhcHMgPSB0aGlzLmdhcFN0b3JhZ2UuYnlFaWQoaWQpO1xyXG5cdFx0aWYgKGdhcHMpe1xyXG5cdFx0XHRyZXR1cm4gZ2FwcztcclxuXHRcdH07XHRcclxuXHR9O1xyXG5cclxuXHRzdWIoaWQpe1xyXG5cdFx0dmFyIGdhcCA9IHRoaXMuZ2FwKGlkKTtcclxuXHRcdGlmICghZ2FwKXtcclxuXHRcdFx0cmV0dXJuIG51bGw7XHJcblx0XHR9O1xyXG5cdFx0cmV0dXJuIGdhcC5mZyB8fCBudWxsOyBcclxuXHR9O1xyXG59O1xyXG5cclxuZXhwb3J0IGNsYXNzIEZnSW5zdGFuY2UgZXh0ZW5kcyBGZ0luc3RhbmNlQmFzZXtcclxuXHRjb25zdHJ1Y3RvcihmZ0NsYXNzLCBwYXJlbnQpe1xyXG5cdFx0aWYgKCEhZmFsc2Upe1xyXG5cdFx0XHRzdXBlcihmZ0NsYXNzLCBwYXJlbnQpO1xyXG5cdFx0fTtcclxuXHRcdHJldHVybiBuZXcgZmdDbGFzcy5jcmVhdGVGbihmZ0NsYXNzLCBwYXJlbnQpO1x0XHRcclxuXHR9O1xyXG59O1xyXG5cclxuZnVuY3Rpb24gZ2V0Q2xhc3NlcyhtZXRhKXtcclxuXHRpZiAoIW1ldGEgfHwgIW1ldGEuYXR0cnMgfHwgIW1ldGEuYXR0cnMuY2xhc3Mpe1xyXG5cdFx0cmV0dXJuIFtdO1xyXG5cdH07XHJcblx0aWYgKEFycmF5LmlzQXJyYXkobWV0YS5hdHRycy5jbGFzcykpe1xyXG5cdFx0cmV0dXJuIG1ldGEuYXR0cnMuY2xhc3M7XHJcblx0fTtcdFx0XHJcblx0cmV0dXJuIG1ldGEuYXR0cnMuY2xhc3Muc3BsaXQoJyAnKTtcclxufTtcclxuXHJcbmZ1bmN0aW9uIG1ldGFNYXAoZmcsIG1ldGFQYXJ0KXtcclxuXHR2YXIgcmVzOiBhbnkgPSB1dGlscy5zaW1wbGVDbG9uZShtZXRhUGFydCk7XHJcblx0dmFyIGNsYXNzZXMgPSBnZXRDbGFzc2VzKHJlcyk7XHJcblx0dmFyIGZnX2NpZCA9IFwiZmctY2lkLVwiICsgZmcuZmdDbGFzcy5pZDtcclxuXHRyZXMuYXR0cnMgPSB1dGlscy5zaW1wbGVDbG9uZShtZXRhUGFydC5hdHRycyk7XHJcblx0aWYgKEFycmF5LmlzQXJyYXkocmVzLmF0dHJzLmNsYXNzKSl7XHJcblx0XHRyZXMuYXR0cnMuY2xhc3MgPSBbJ2ZnJywgJyAnLCBmZ19jaWQsICcgJ10uY29uY2F0KGNsYXNzZXMpO1xyXG5cdFx0cmV0dXJuIHJlcztcdFxyXG5cdH07XHRcclxuXHRyZXMuYXR0cnMuY2xhc3MgPSBbJ2ZnJywgZmdfY2lkXS5jb25jYXQoY2xhc3Nlcykuam9pbignICcpO1xyXG5cdHJldHVybiByZXM7XHJcbn07XHJcblxyXG5mdW5jdGlvbiBjcmVhdGVTY29wZUhlbHBlcihmZywgb2JqLCBzY29wZVBhdGgpe1xyXG5cdHZhciBoZWxwZXIgPSBBcnJheS5pc0FycmF5KG9iaikgXHJcblx0XHQ/IFtdIFxyXG5cdFx0OiB7fTtcclxuXHR1dGlscy5vYmpGb3Iob2JqLCBmdW5jdGlvbih2YWx1ZSwga2V5KXtcclxuXHRcdHZhciBwcm9wU2NvcGVQYXRoID0gc2NvcGVQYXRoLmNvbmNhdChba2V5XSk7XHJcblx0XHRPYmplY3QuZGVmaW5lUHJvcGVydHkoaGVscGVyLCBrZXksIHtcclxuXHRcdFx0Z2V0OiBmdW5jdGlvbigpe1xyXG5cdFx0XHRcdGlmICh0eXBlb2YgdmFsdWUgPT09IFwib2JqZWN0XCIpe1xyXG5cdFx0XHRcdFx0cmV0dXJuIGNyZWF0ZVNjb3BlSGVscGVyKGZnLCBvYmpba2V5XSwgcHJvcFNjb3BlUGF0aCk7XHJcblx0XHRcdFx0fTtcclxuXHRcdFx0XHRyZXR1cm4gb2JqW2tleV07XHJcblx0XHRcdH0sXHJcblx0XHRcdHNldDogZnVuY3Rpb24odmFsKXtcclxuXHRcdFx0XHRmZy51cGRhdGUocHJvcFNjb3BlUGF0aCwgdmFsKTtcdFx0XHRcdFxyXG5cdFx0XHR9XHRcclxuXHRcdH0pO1xyXG5cdH0pO1xyXG5cdHJldHVybiBoZWxwZXI7XHJcbn07XHJcblxyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIGdldEZnQnlJaWQoaWlkKXtcclxuXHRyZXR1cm4gZmdJbnN0YW5jZVRhYmxlW2lpZF07XHJcbn07IiwiXCJ1c2Ugc3RyaWN0XCI7XHJcblxyXG5pbXBvcnQge0ZnSW5zdGFuY2V9IGZyb20gJy4vZmdJbnN0YW5jZSc7XHJcbmltcG9ydCB7SVZhbHVlUGF0aH0gZnJvbSAnLi4vdmFsdWVNZ3InO1xyXG5pbXBvcnQge1RwbH0gZnJvbSAnLi4vdHBsTWdyJztcclxuaW1wb3J0ICogYXMgdXRpbHMgZnJvbSAnLi4vdXRpbHMnO1xyXG5pbXBvcnQgKiBhcyB2YWx1ZU1nciBmcm9tICcuLi92YWx1ZU1ncic7XHJcblxyXG5leHBvcnQgY2xhc3MgR2Fwe1xyXG5cdHR5cGU6IHN0cmluZztcclxuXHRjaGlsZHJlbjogR2FwW107XHJcblx0cGFyZW50OiBHYXA7XHJcblx0cm9vdDogR2FwO1xyXG5cdGNvbnRleHQ6IEZnSW5zdGFuY2U7XHJcblx0cGF0aDogSVZhbHVlUGF0aDsgIFxyXG5cdHJlc29sdmVkUGF0aDogSVZhbHVlUGF0aDtcclxuXHRlaWQ6IG51bWJlcjtcclxuXHRnaWQ6IG51bWJlcjtcclxuXHRzY29wZVBhdGg6IElWYWx1ZVBhdGg7XHJcblx0aXNWaXJ0dWFsOiBib29sZWFuO1xyXG5cdGZnOiBGZ0luc3RhbmNlO1xyXG5cdHN0b3JhZ2VJZDogbnVtYmVyO1xyXG5cdGF0dHJzOiBhbnk7XHJcblx0Y29udGVudDogVHBsO1xyXG5cdGN1cnJlbnRTY29wZUhvbGRlcjogR2FwO1xyXG5cclxuXHRjb25zdHJ1Y3RvciAoY29udGV4dCwgcGFyc2VkTWV0YT8sIHBhcmVudD8pe1x0XHJcblx0XHR1dGlscy5leHRlbmQodGhpcywgcGFyc2VkTWV0YSk7IC8vIHRvZG86IHdoeT9cclxuXHRcdHRoaXMuY2hpbGRyZW4gPSBbXTtcdFxyXG5cdFx0dGhpcy5wYXJlbnQgPSBwYXJlbnQgfHwgbnVsbDtcclxuXHRcdHRoaXMucm9vdCA9IHRoaXM7XHJcblx0XHR0aGlzLmNvbnRleHQgPSBjb250ZXh0O1x0XHJcblx0XHQvL3RoaXMuc2NvcGVQYXRoID0gdXRpbHMuZ2V0U2NvcGVQYXRoKHRoaXMpO1xyXG5cdFx0Ly90aGlzLnRyaWdnZXJzID0gW107XHJcblx0XHRjb250ZXh0LmdhcFN0b3JhZ2UucmVnKHRoaXMpO1xyXG5cdFx0aWYgKHRoaXMucGF0aCl7XHJcblx0XHRcdHRoaXMucmVzb2x2ZWRQYXRoID0gdmFsdWVNZ3IucmVzb2x2ZVBhdGgodGhpcywgdGhpcy5wYXRoKTsgXHJcblx0XHRcdGlmICh0aGlzLnJlc29sdmVkUGF0aC5zb3VyY2UgPT09IFwiZGF0YVwiKXtcclxuXHRcdFx0XHRjb250ZXh0LmdhcFN0b3JhZ2Uuc2V0VHJpZ2dlcnModGhpcywgW3RoaXMucmVzb2x2ZWRQYXRoLnBhdGhdKTtcclxuXHRcdFx0fTtcdFxyXG5cdFx0fTtcclxuXHRcdGlmICghcGFyZW50KXtcclxuXHRcdFx0cmV0dXJuIHRoaXM7XHJcblx0XHR9O1xyXG5cdFx0dGhpcy5yb290ID0gcGFyZW50LnJvb3Q7XHJcblx0XHRwYXJlbnQuY2hpbGRyZW4ucHVzaCh0aGlzKTtcclxuXHR9O1xyXG5cclxuXHRjbG9zZXN0KHNlbGVjdG9yKXtcclxuXHRcdHZhciBlaWQgPSBzZWxlY3Rvci5zbGljZSgxKTtcclxuXHRcdHZhciBnYXAgPSB0aGlzLnBhcmVudDtcclxuXHRcdHdoaWxlIChnYXApe1xyXG5cdFx0XHRpZiAoZ2FwLmVpZCA9PT0gZWlkKXtcclxuXHRcdFx0XHRyZXR1cm4gZ2FwO1xyXG5cdFx0XHR9O1xyXG5cdFx0XHRnYXAgPSBnYXAucGFyZW50O1xyXG5cdFx0fTtcclxuXHRcdHJldHVybiBudWxsO1xyXG5cdH07XHJcblxyXG5cdGRhdGEodmFsKXtcclxuXHRcdGlmIChhcmd1bWVudHMubGVuZ3RoID09PSAwKXtcclxuXHRcdFx0cmV0dXJuIHV0aWxzLm9ialBhdGgodGhpcy5zY29wZVBhdGgucGF0aCwgdGhpcy5jb250ZXh0LmRhdGEpO1xyXG5cdFx0fTtcclxuXHRcdHRoaXMuY29udGV4dC51cGRhdGUodGhpcy5zY29wZVBhdGgsIHZhbCk7XHRcclxuXHR9O1xyXG5cclxuXHRmaW5kUmVhbERvd24oKXtcclxuXHRcdGlmICghdGhpcy5pc1ZpcnR1YWwpe1xyXG5cdFx0XHRyZXR1cm4gW3RoaXNdO1xyXG5cdFx0fTtcclxuXHRcdHZhciByZXMgPSBbXTtcclxuXHRcdHRoaXMuY2hpbGRyZW4uZm9yRWFjaChmdW5jdGlvbihjaGlsZCl7XHJcblx0XHRcdHJlcyA9IHJlcy5jb25jYXQoY2hpbGQuZmluZFJlYWxEb3duKCkpO1xyXG5cdFx0fSk7XHJcblx0XHRyZXR1cm4gcmVzO1xyXG5cdH07XHJcblxyXG5cdGdldERvbSgpe1xyXG5cdFx0aWYgKCF0aGlzLmlzVmlydHVhbCl7XHJcblx0XHRcdHZhciBpZCA9IFtcImZnXCIsIHRoaXMuY29udGV4dC5pZCwgXCJnaWRcIiwgdGhpcy5naWRdLmpvaW4oJy0nKTtcclxuXHRcdFx0cmV0dXJuIFtkb2N1bWVudC5nZXRFbGVtZW50QnlJZChpZCldO1xyXG5cdFx0fTtcclxuXHRcdHZhciByZXMgPSBbXTtcclxuXHRcdHRoaXMuZmluZFJlYWxEb3duKCkuZm9yRWFjaChmdW5jdGlvbihnYXApe1xyXG5cdFx0XHRyZXMgPSByZXMuY29uY2F0KGdhcC5nZXREb20oKSk7XHJcblx0XHR9KTtcclxuXHRcdHJldHVybiByZXM7XHJcblx0fTtcclxuXHJcblx0cmVtb3ZlRG9tKCl7XHJcblx0XHR2YXIgZG9tID0gdGhpcy5nZXREb20oKTtcclxuXHRcdGRvbS5mb3JFYWNoKGZ1bmN0aW9uKGVsbSl7XHJcblx0XHRcdGlmICghZWxtKXtcclxuXHRcdFx0XHRyZXR1cm47XHJcblx0XHRcdH07XHJcblx0XHRcdGVsbS5yZW1vdmUoKTtcclxuXHRcdH0pO1xyXG5cdH07XHJcbn07XHJcblxyXG5leHBvcnQgZnVuY3Rpb24gcmVuZGVyKGNvbnRleHQsIHBhcmVudCwgZGF0YSwgbWV0YSl7XHJcblx0dmFyIGdhcCA9IG5ldyBHYXAoY29udGV4dCwgbWV0YSwgcGFyZW50KTtcclxuXHR2YXIgZ2FwQ2xhc3MgPSBnYXBzW21ldGEudHlwZV07XHJcblx0cmV0dXJuIGdhcENsYXNzLnJlbmRlci5jYWxsKGdhcCwgY29udGV4dCwgZGF0YSk7XHJcbn07XHJcblxyXG5leHBvcnQgZnVuY3Rpb24gdXBkYXRlKGNvbnRleHQsIGdhcE1ldGEsIHNjb3BlUGF0aCwgdmFsdWUsIG9sZFZhbHVlKXtcclxuXHR2YXIgZ2FwQ2xhc3MgPSBnYXBzW2dhcE1ldGEudHlwZV07XHJcblx0aWYgKCFnYXBDbGFzcyl7XHJcblx0XHRyZXR1cm47XHJcblx0fTtcclxuXHRyZXR1cm4gZ2FwQ2xhc3MudXBkYXRlKGNvbnRleHQsIGdhcE1ldGEsIHNjb3BlUGF0aCwgdmFsdWUsIG9sZFZhbHVlKTtcclxufTtcclxuXHJcbmltcG9ydCAqIGFzIGdhcHMgZnJvbSAnLi4vZ2Fwcyc7IiwiXCJ1c2Ugc3RyaWN0XCI7XHJcblxyXG5pbXBvcnQgKiBhcyB1dGlscyBmcm9tICcuLi91dGlscyc7XHJcbmltcG9ydCB7RmdJbnN0YW5jZX0gZnJvbSAnLi9mZ0luc3RhbmNlJztcclxuaW1wb3J0IHtHYXB9IGZyb20gJy4vZ2FwQ2xhc3NNZ3InO1xyXG5pbXBvcnQgVHJlZUhlbHBlciBmcm9tICcuLi91dGlscy9UcmVlSGVscGVyJztcclxuXHJcbmZ1bmN0aW9uIGluaXROb2RlRm4oKXtcclxuXHRyZXR1cm4ge1xyXG5cdFx0Z2FwczogW11cclxuXHR9O1xyXG59O1xyXG5cclxuZXhwb3J0IGRlZmF1bHQgY2xhc3MgR2FwU3RvcmFnZXtcclxuXHRjb250ZXh0OiBGZ0luc3RhbmNlO1xyXG5cdGdhcHM6IEdhcFtdO1xyXG5cdHNjb3BlVHJlZTogYW55O1xyXG5cdGVpZERpY3Q6IE9iamVjdDtcclxuXHJcblx0Y29uc3RydWN0b3IoY29udGV4dDogRmdJbnN0YW5jZSl7XHJcblx0XHR0aGlzLmNvbnRleHQgPSBjb250ZXh0O1xyXG5cdFx0dGhpcy5nYXBzID0gW107XHJcblx0XHR0aGlzLnNjb3BlVHJlZSA9IFRyZWVIZWxwZXIoe1xyXG5cdFx0XHRraW5kOiAnZGljdCcsXHJcblx0XHRcdGluaXROb2RlOiBpbml0Tm9kZUZuXHJcblx0XHR9KTtcclxuXHRcdHRoaXMuZWlkRGljdCA9IHt9O1x0XHJcblx0fTtcclxuXHJcblx0c2V0U2NvcGVUcmlnZ2VyKGdhcDogR2FwLCBzY29wZVBhdGgpe1xyXG5cdFx0dmFyIHNjb3BlID0gdGhpcy5zY29wZVRyZWUuYWNjZXNzKHNjb3BlUGF0aCk7XHRcclxuXHRcdHNjb3BlLmRhdGEuZ2Fwcy5wdXNoKGdhcCk7XHJcblx0fTtcclxuXHJcblx0c2V0VHJpZ2dlcnMoZ2FwOiBHYXAsIHNjb3BlVHJpZ2dlcnMpe1x0XHJcblx0XHRzY29wZVRyaWdnZXJzLmZvckVhY2godGhpcy5zZXRTY29wZVRyaWdnZXIuYmluZCh0aGlzLCBnYXApKTtcclxuXHR9O1xyXG5cclxuXHRyZWcoZ2FwOiBHYXApe1xyXG5cdFx0dmFyIGVpZCA9IGdhcC5laWQ7XHJcblx0XHRpZiAoZWlkKXtcdFx0XHJcblx0XHRcdHRoaXMuZWlkRGljdFtlaWRdID0gdGhpcy5laWREaWN0W2VpZF0gfHwgW107XHJcblx0XHRcdHRoaXMuZWlkRGljdFtlaWRdLnB1c2goZ2FwKTtcclxuXHRcdH07XHJcblx0XHR2YXIgZ2lkID0gdGhpcy5nZXRHaWQoKTtcclxuXHRcdGdhcC5naWQgPSBnaWQ7XHJcblx0XHRpZiAoIWdhcC5pc1ZpcnR1YWwpe1xyXG5cdFx0XHRnYXAuYXR0cnMgPSB1dGlscy5zaW1wbGVDbG9uZShnYXAuYXR0cnMgfHwge30pO1x0XHRcclxuXHRcdFx0Z2FwLmF0dHJzLmlkID0gW1wiZmdcIiwgdGhpcy5jb250ZXh0LmlkLCBcImdpZFwiLCBnaWRdLmpvaW4oJy0nKTtcclxuXHRcdH07XHJcblx0XHRnYXAuc3RvcmFnZUlkID0gdGhpcy5nYXBzLmxlbmd0aDtcclxuXHRcdHRoaXMuZ2Fwcy5wdXNoKGdhcCk7XHRcdFxyXG5cdH07XHJcblxyXG5cdGFzc2lnbigpe1xyXG5cdFx0dGhpcy5nYXBzLmZvckVhY2goZnVuY3Rpb24oZ2FwTWV0YSl7XHJcblx0XHRcdGlmIChnYXBNZXRhLnR5cGUgIT09IFwicm9vdFwiICYmIGdhcE1ldGEuZmcpe1xyXG5cdFx0XHRcdGdhcE1ldGEuZmcuYXNzaWduKCk7XHJcblx0XHRcdH07XHJcblx0XHR9KTtcclxuXHRcdHJldHVybjtcclxuXHR9O1xyXG5cclxuXHRieVNjb3BlKHNjb3BlUGF0aCwgdGFyZ2V0T25seT86IGJvb2xlYW4pe1xyXG5cdFx0dmFyIHNjb3BlID0gdGhpcy5zY29wZVRyZWUuYWNjZXNzKHNjb3BlUGF0aCk7XHRcdFxyXG5cdFx0dmFyIHN1Yk5vZGVzID0gW107XHJcblx0XHRpZiAoc2NvcGUuY2hpbGRDb3VudCAhPT0gMCAmJiAhdGFyZ2V0T25seSl7XHJcblx0XHRcdHN1Yk5vZGVzID0gc2NvcGUuZ2V0RGVlcENoaWxkQXJyKCkubWFwKGZ1bmN0aW9uKG5vZGUpe1xyXG5cdFx0XHRcdHJldHVybiB7XHJcblx0XHRcdFx0XHRnYXBzOiBub2RlLmRhdGEuZ2FwcyxcclxuXHRcdFx0XHRcdHBhdGg6IG5vZGUucGF0aFx0XHJcblx0XHRcdFx0fTtcdFx0XHRcclxuXHRcdFx0fSk7XHJcblx0XHR9O1xyXG5cdFx0dmFyIHBhcmVudHMgPSBzY29wZS5nZXRQYXJlbnRzKCk7XHJcblx0XHRyZXR1cm4ge1xyXG5cdFx0XHR0YXJnZXQ6IHNjb3BlLmRhdGEuZ2FwcyxcclxuXHRcdFx0c3Viczogc3ViTm9kZXMsXHJcblx0XHRcdHBhcmVudHM6IHBhcmVudHNcclxuXHRcdH07XHJcblx0fTtcclxuXHRyZW1vdmVTY29wZShzY29wZVBhdGgpe1xyXG5cdFx0dmFyIHNjb3BlID0gdGhpcy5ieVNjb3BlKHNjb3BlUGF0aCk7XHRcclxuXHRcdHZhciByZW1vdmVkRG9tR2FwcyA9IHNjb3BlLnRhcmdldDtcclxuXHRcdHZhciByZW1vdmVkR2FwcyA9IHNjb3BlLnRhcmdldDtcclxuXHRcdHNjb3BlLnN1YnMuZm9yRWFjaChmdW5jdGlvbihub2RlKXtcclxuXHRcdFx0cmVtb3ZlZEdhcHMgPSByZW1vdmVkR2Fwcy5jb25jYXQobm9kZS5nYXBzKTtcclxuXHRcdH0pO1xyXG5cdFx0dGhpcy5zY29wZVRyZWUucmVtb3ZlKHNjb3BlUGF0aCk7XHJcblx0XHR0aGlzLmdhcHMgPSB0aGlzLmdhcHMuZmlsdGVyKGZ1bmN0aW9uKGdhcCl7XHJcblx0XHRcdHJldHVybiByZW1vdmVkR2Fwcy5pbmRleE9mKGdhcCkgPCAwO1xyXG5cdFx0fSk7XHJcblx0XHRyZW1vdmVkRG9tR2Fwcy5mb3JFYWNoKGZ1bmN0aW9uKGdhcCl7XHJcblx0XHRcdGdhcC5yZW1vdmVEb20oKTtcclxuXHRcdH0pO1xyXG5cdH07XHJcblx0YnlFaWQoZWlkKXtcclxuXHRcdHJldHVybiB0aGlzLmVpZERpY3RbZWlkXTtcclxuXHR9O1xyXG5cdGdldEdpZCgpe1xyXG5cdFx0cmV0dXJuIHRoaXMuZ2Fwcy5sZW5ndGg7XHJcblx0fTtcclxufTsiLCJ2YXIgZXZlbnRzID0ge307XHJcblxyXG5leHBvcnQgZnVuY3Rpb24gaGFuZGxlcihuYW1lLCBldmVudCl7XHJcblx0dmFyIGVsbSA9IGV2ZW50LnRhcmdldDtcclxuXHR3aGlsZSAoZWxtKXtcclxuXHRcdHZhciBmZyA9IHdpbmRvd1snJGZnJ10uYnlEb20oZWxtKTtcclxuXHRcdGlmIChmZyl7XHJcblx0XHRcdGZnLmVtaXRBcHBseShuYW1lLCBmZywgW2V2ZW50XSk7XHJcblx0XHRcdC8vcmV0dXJuO1xyXG5cdFx0fTtcclxuXHRcdGVsbSA9IGVsbS5wYXJlbnROb2RlO1xyXG5cdH07XHJcbn07XHJcblxyXG5leHBvcnQgZnVuY3Rpb24gbGlzdGVuKG5hbWUpe1xyXG5cdGlmIChuYW1lIGluIGV2ZW50cyl7XHJcblx0XHRyZXR1cm47XHJcblx0fTtcdFxyXG5cdGV2ZW50c1tuYW1lXSA9IHRydWU7XHJcblx0ZG9jdW1lbnQuYWRkRXZlbnRMaXN0ZW5lcihuYW1lLCBoYW5kbGVyLmJpbmQobnVsbCwgbmFtZSksIHRydWUpO1xyXG59OyIsImltcG9ydCAqIGFzIGZnQ2xhc3NNb2R1bGUgZnJvbSAnLi9mZ0NsYXNzJzsgXHJcbmltcG9ydCAqIGFzIGZnSW5zdGFuY2VNb2R1bGUgZnJvbSAnLi9mZ0luc3RhbmNlJzsgXHJcblxyXG5leHBvcnQgaW50ZXJmYWNlIEhlbHBlciB7XHJcblx0KCk6IGFueTsgXHJcbn07XHJcblxyXG52YXIgJGZnID0gPEhlbHBlcj5mdW5jdGlvbiAoYXJnKXtcclxuXHRpZiAoYXJnIGluc3RhbmNlb2YgSFRNTEVsZW1lbnQpe1xyXG5cdFx0cmV0dXJuICRmZy5ieURvbShhcmcpO1xyXG5cdH07XHJcblx0aWYgKHR5cGVvZiBhcmcgPT0gXCJzdHJpbmdcIil7XHJcblx0XHRyZXR1cm4gZmdDbGFzc01vZHVsZS5mZ0NsYXNzRGljdFthcmddO1xyXG5cdH07XHJcbn07XHJcblxyXG5leHBvcnQgZGVmYXVsdCAkZmc7XHJcblxyXG4kZmcubG9hZCA9IGZ1bmN0aW9uKGZnRGF0YSl7XHJcblx0aWYgKEFycmF5LmlzQXJyYXkoZmdEYXRhKSl7XHRcdFxyXG5cdFx0cmV0dXJuIGZnRGF0YS5tYXAoJGZnLmxvYWQpO1xyXG5cdH07XHJcblx0cmV0dXJuIG5ldyBmZ0NsYXNzTW9kdWxlLkZnQ2xhc3MoZmdEYXRhKTtcclxufTtcclxuXHJcbiRmZy5pc0ZnID0gZnVuY3Rpb24oZG9tTm9kZSl7XHJcblx0cmV0dXJuIGRvbU5vZGUuY2xhc3NMaXN0ICYmIGRvbU5vZGUuY2xhc3NMaXN0LmNvbnRhaW5zKCdmZycpO1xyXG59O1xyXG5cclxudmFyIGlpZFJlID0gL2ZnXFwtaWlkXFwtKFxcZCspL2c7XHJcbnZhciBpZFJlID0gL2ZnXFwtKFxcZCspXFwtZ2lkXFwtKFxcZCspL2c7XHJcblxyXG4kZmcuYnlEb20gPSBmdW5jdGlvbihkb21Ob2RlKXtcdFxyXG5cdGlmICghZG9tTm9kZSB8fCAhZG9tTm9kZS5jbGFzc05hbWUpe1xyXG5cdFx0cmV0dXJuIG51bGw7XHJcblx0fTtcclxuXHRpZiAoIX5kb21Ob2RlLmNsYXNzTmFtZS5zcGxpdCgnICcpLmluZGV4T2YoJ2ZnJykpe1xyXG5cdFx0cmV0dXJuIG51bGw7XHJcblx0fTtcclxuXHRpZiAoIWRvbU5vZGUuaWQpe1xyXG5cdFx0cmV0dXJuIG51bGw7XHJcblx0fTtcclxuXHRpZFJlLmxhc3RJbmRleCA9IDA7XHJcblx0dmFyIHJlcyA9IGlkUmUuZXhlYyhkb21Ob2RlLmlkKTtcclxuXHRpZiAoIXJlcyl7XHJcblx0XHRyZXR1cm4gbnVsbDtcclxuXHR9O1xyXG5cdHZhciBpaWQgPSBwYXJzZUludChyZXNbMV0pO1xyXG5cdHJldHVybiBmZ0luc3RhbmNlTW9kdWxlLmdldEZnQnlJaWQoaWlkKTtcdFxyXG59O1xyXG5cclxuJGZnLmdhcENsb3Nlc3QgPSBmdW5jdGlvbihkb21Ob2RlKXtcclxuXHR3aGlsZSAodHJ1ZSl7XHJcblx0XHRpZFJlLmxhc3RJbmRleCA9IDA7XHJcblx0XHR2YXIgcmVzID0gaWRSZS5leGVjKGRvbU5vZGUuaWQpO1xyXG5cdFx0aWYgKCFyZXMpe1xyXG5cdFx0XHRkb21Ob2RlID0gZG9tTm9kZS5wYXJlbnROb2RlO1xyXG5cdFx0XHRpZiAoIWRvbU5vZGUpe1xyXG5cdFx0XHRcdHJldHVybiBudWxsO1xyXG5cdFx0XHR9O1xyXG5cdFx0XHRjb250aW51ZTtcclxuXHRcdH07XHJcblx0XHR2YXIgaWlkID0gcGFyc2VJbnQocmVzWzFdKTtcclxuXHRcdHZhciBmZyA9IGZnSW5zdGFuY2VNb2R1bGUuZ2V0RmdCeUlpZChpaWQpO1xyXG5cdFx0dmFyIGdpZCA9IHBhcnNlSW50KHJlc1syXSk7XHJcblx0XHRyZXR1cm4gZmcuZ2FwU3RvcmFnZS5nYXBzW2dpZF07XHJcblx0fTtcclxufTtcclxuXHJcbiRmZy5jbGFzc2VzID0gZmdDbGFzc01vZHVsZS5mZ0NsYXNzRGljdDtcclxuXHJcbiRmZy5mZ3MgPSBmZ0luc3RhbmNlTW9kdWxlLmZnSW5zdGFuY2VUYWJsZTtcclxuXHJcbiRmZy5qcSA9IHdpbmRvd1snalF1ZXJ5J107XHJcblxyXG53aW5kb3dbJyRmZyddID0gJGZnOyIsImltcG9ydCBoZWxwZXIgPSByZXF1aXJlKCcuL2hlbHBlcicpO1xyXG5jb25zb2xlLmxvZyhoZWxwZXIpOyIsIlwidXNlIHN0cmljdFwiO1xyXG5cclxuZXhwb3J0IGludGVyZmFjZSBJRXZlbnRFbWl0dGVye1xyXG5cdGV2ZW50czogT2JqZWN0O1xyXG5cdHBhcmVudD86IElFdmVudEVtaXR0ZXI7XHJcblx0b246IEZ1bmN0aW9uO1xyXG5cdGVtaXQ6IEZ1bmN0aW9uO1xyXG5cdGVtaXRBcHBseTogRnVuY3Rpb247XHJcbn07XHJcblxyXG5leHBvcnQgZGVmYXVsdCBmdW5jdGlvbiBFdmVudEVtaXR0ZXIocGFyZW50PzogSUV2ZW50RW1pdHRlcil7XHJcblx0dGhpcy5ldmVudHMgPSB7fTtcclxuXHR0aGlzLnBhcmVudCA9IHBhcmVudDtcclxufTtcclxuXHJcbkV2ZW50RW1pdHRlci5wcm90b3R5cGUub24gPSBmdW5jdGlvbihuYW1lOiBzdHJpbmcsIGZuOiBGdW5jdGlvbil7XHJcblx0dmFyIGV2ZW50TGlzdCA9IHRoaXMuZXZlbnRzW25hbWVdO1xyXG5cdGlmICghZXZlbnRMaXN0KXtcclxuXHRcdGV2ZW50TGlzdCA9IFtdO1xyXG5cdFx0dGhpcy5ldmVudHNbbmFtZV0gPSBldmVudExpc3Q7XHJcblx0fTtcclxuXHRldmVudExpc3QucHVzaChmbik7XHJcbn07XHJcblxyXG5FdmVudEVtaXR0ZXIucHJvdG90eXBlLmVtaXQgPSBmdW5jdGlvbihuYW1lOiBzdHJpbmcsIC4uLnJlc3Qpe1xyXG5cdGlmICh0aGlzLnBhcmVudCl7XHJcblx0XHR0aGlzLnBhcmVudC5lbWl0LmFwcGx5KHRoaXMucGFyZW50LCBhcmd1bWVudHMpO1xyXG5cdH07XHJcblx0dmFyIGV2ZW50TGlzdCA9IHRoaXMuZXZlbnRzW25hbWVdO1xyXG5cdGlmICghZXZlbnRMaXN0KXtcclxuXHRcdHJldHVybjtcclxuXHR9O1xyXG5cdHZhciBlbWl0QXJncyA9IFtdLnNsaWNlLmNhbGwoYXJndW1lbnRzLCAxKTtcdCBcclxuXHRldmVudExpc3QuZm9yRWFjaChmdW5jdGlvbihmbil7XHJcblx0XHRmbi5hcHBseSh0aGlzLCBlbWl0QXJncyk7XHJcblx0fSk7XHJcbn07XHJcblxyXG5FdmVudEVtaXR0ZXIucHJvdG90eXBlLmVtaXRBcHBseSA9IGZ1bmN0aW9uKG5hbWU6IHN0cmluZywgdGhpc0FyZywgYXJnczogYW55W10pe1xyXG5cdGlmICh0aGlzLnBhcmVudCl7XHJcblx0XHR0aGlzLnBhcmVudC5lbWl0QXBwbHkuYXBwbHkodGhpcy5wYXJlbnQsIGFyZ3VtZW50cyk7XHJcblx0fTtcclxuXHR2YXIgZXZlbnRMaXN0ID0gdGhpcy5ldmVudHNbbmFtZV07XHJcblx0aWYgKCFldmVudExpc3Qpe1xyXG5cdFx0cmV0dXJuO1xyXG5cdH07XHJcblx0ZXZlbnRMaXN0LmZvckVhY2goZnVuY3Rpb24oZm4pe1xyXG5cdFx0Zm4uYXBwbHkodGhpc0FyZywgYXJncyk7XHJcblx0fSk7XHJcbn07IiwiXCJ1c2Ugc3RyaWN0XCI7XHJcblxyXG5pbXBvcnQgKiBhcyB1dGlscyBmcm9tICcuL3V0aWxzJztcclxuaW1wb3J0ICogYXMgcGF0aCBmcm9tICdwYXRoJztcclxuaW1wb3J0IHtJQXN0Tm9kZX0gZnJvbSAnLi90cGxNZ3InO1xyXG5pbXBvcnQge0dhcH0gZnJvbSAnLi9jbGllbnQvZ2FwQ2xhc3NNZ3InO1xyXG5pbXBvcnQge0ZnSW5zdGFuY2V9IGZyb20gJy4vY2xpZW50L2ZnSW5zdGFuY2UnO1xyXG5pbXBvcnQgKiBhcyBnYXBzIGZyb20gJy4vZ2Fwcyc7XHJcblxyXG4vKipcclxuICogUmVhZHMgdGhlIGdpdmVuIGFzdCBhbmQgcmV0dXJucyBnYXAgdHJlZS5cclxuICogQHBhcmFtIHtvYmplY3R9IGFzdCAtIFBhcnNlZCBBU1Qgb2YgYSB0ZW1wbGF0ZS5cclxuICogQHBhcmFtIHtzdHJpbmd9IGh0bWwgLSBTb3VyY2UgY29kZSBvZiB0ZW1wbGF0ZS4gW2RlcHJlY2F0ZWRdXHJcbiAqIEBwYXJhbSB7b2JqZWN0fSBwYXJlbnRNZXRhIC0gUGFyZW50IGdhcC5cclxuICogQHJldHVybiB7Z2FwIHwgbnVsbH1cclxuICovXHJcbmV4cG9ydCBmdW5jdGlvbiBwYXJzZShhc3Q6IElBc3ROb2RlLCBodG1sOiBzdHJpbmcsIHBhcmVudE1ldGE6IEdhcCl7XHJcblx0Lyp2YXIgbmFtZSA9IGFzdC5ub2RlTmFtZTtcclxuXHR2YXIgZ2FwID0gZ2FwVGFibGVbbmFtZV07XHJcblx0aWYgKCFnYXApe1xyXG5cdFx0cmV0dXJuIGZhbHNlO1xyXG5cdH07Ki9cclxuXHR2YXIgbWF0Y2hlZCA9IFtdO1xyXG5cdGZvciAodmFyIGkgaW4gZ2Fwcyl7XHJcblx0XHR2YXIgZ2FwID0gZ2Fwc1tpXTtcclxuXHRcdHZhciBtZXRhID0gZ2FwLnBhcnNlKGFzdCwgaHRtbCwgcGFyZW50TWV0YSk7XHJcblx0XHRpZiAobWV0YSl7XHJcblx0XHRcdG1hdGNoZWQucHVzaCh7XHJcblx0XHRcdFx0XCJnYXBcIjogZ2FwLFxyXG5cdFx0XHRcdFwibWV0YVwiOiBtZXRhXHJcblx0XHRcdH0pO1xyXG5cdFx0fTtcclxuXHR9O1xyXG5cdGlmIChtYXRjaGVkLmxlbmd0aCA+IDEpe1xyXG5cdFx0dmFyIG1heFByaW9yID0gTWF0aC5tYXguYXBwbHkoTWF0aCwgbWF0Y2hlZC5tYXAoZnVuY3Rpb24oaXRlbSl7XHJcblx0XHRcdHJldHVybiBpdGVtLmdhcC5wcmlvcml0eTtcclxuXHRcdH0pKTtcdFx0XHJcblx0XHRtYXRjaGVkID0gbWF0Y2hlZC5maWx0ZXIoZnVuY3Rpb24oaXRlbSl7XHJcblx0XHRcdHJldHVybiBpdGVtLmdhcC5wcmlvcml0eSA9PT0gbWF4UHJpb3I7XHJcblx0XHR9KTtcdFxyXG5cdH1cclxuXHRpZiAobWF0Y2hlZC5sZW5ndGggPT09IDEpe1xyXG5cdFx0cmV0dXJuIG1hdGNoZWRbMF0ubWV0YTtcclxuXHR9O1xyXG5cdGlmIChtYXRjaGVkLmxlbmd0aCA9PT0gMCl7XHJcblx0XHRyZXR1cm4gbnVsbDtcclxuXHR9O1x0XHJcblx0aWYgKG1hdGNoZWQubGVuZ3RoID4gMSl7XHJcblx0XHR0aHJvdyBuZXcgRXJyb3IoXCJHYXAgcGFyc2luZyBjb25mbGljdFwiKTtcclxuXHR9O1xyXG5cdHJldHVybiBudWxsO1xyXG59O1xyXG5cclxuLyoqXHJcbiAqIFJlbmRlcnMgYSBnYXAgdHlwZSBhY2NvcmRpbmcgdG8gcGFyc2VkIG1ldGEuXHJcbiAqIEBwYXJhbSB7b2JqZWN0fSBkYXRhIC0gRGF0YSBmb3IgZ2FwLlxyXG4gKiBAcGFyYW0ge29iamVjdH0gbWV0YSAtIE1ldGEgZm9yIGdhcC5cclxuICogQHBhcmFtIHtvYmplY3R9IGNvbnRleHQgLSBGZyBjb250YWluaW5nIHRoZSBnYXAuXHJcbiAqIEByZXR1cm4ge3N0cmluZ31cclxuICovXHJcbmV4cG9ydCBmdW5jdGlvbiByZW5kZXIoZGF0YTogT2JqZWN0LCBtZXRhOiBHYXAsIGNvbnRleHQ6IEZnSW5zdGFuY2UpOiBzdHJpbmd7XHJcblx0dmFyIGdhcCA9IGdhcHNbbWV0YS50eXBlXTtcclxuXHRyZXR1cm4gZ2FwLnJlbmRlcihkYXRhLCBtZXRhLCBjb250ZXh0KTtcclxufTsiLCJcInVzZSBzdHJpY3RcIjtcclxuXHJcbmV4cG9ydCB7ZGVmYXVsdCBhcyBjb250ZW50fSBmcm9tICcuL2dhcHMvY29udGVudCc7XHJcbmV4cG9ydCB7ZGVmYXVsdCBhcyBkYXRhfSBmcm9tICcuL2dhcHMvZGF0YSc7XHJcbmV4cG9ydCB7ZGVmYXVsdCBhcyBkeW5hbWljVGV4dH0gZnJvbSAnLi9nYXBzL2R5bmFtaWMtdGV4dCc7XHJcbmV4cG9ydCB7ZGVmYXVsdCBhcyBmZ30gZnJvbSAnLi9nYXBzL2ZnJztcclxuZXhwb3J0IHtkZWZhdWx0IGFzIHJhd30gZnJvbSAnLi9nYXBzL3Jhdyc7XHJcbmV4cG9ydCB7ZGVmYXVsdCBhcyBzY29wZX0gZnJvbSAnLi9nYXBzL3Njb3BlJztcclxuZXhwb3J0IHtkZWZhdWx0IGFzIHNjb3BlSXRlbX0gZnJvbSAnLi9nYXBzL3Njb3BlLWl0ZW0nOyIsIlwidXNlIHN0cmljdFwiO1xyXG5cclxuaW1wb3J0ICogYXMgdXRpbHMgZnJvbSAnLi4vdXRpbHMnOyAgXHJcbmltcG9ydCAqIGFzIHZhbHVlTWdyIGZyb20gJy4uL3ZhbHVlTWdyJzsgIFxyXG5pbXBvcnQge0dhcH0gZnJvbSAnLi4vY2xpZW50L2dhcENsYXNzTWdyJzsgIFxyXG5pbXBvcnQge0ZnSW5zdGFuY2V9IGZyb20gJy4uL2NsaWVudC9mZ0luc3RhbmNlJzsgIFxyXG5pbXBvcnQge0lBc3ROb2RlfSBmcm9tICcuLi90cGxNZ3InO1xyXG5cclxuZXhwb3J0IGRlZmF1bHQgY2xhc3MgR0NvbnRlbnQgZXh0ZW5kcyBHYXB7XHJcblxyXG5cdHN0YXRpYyBwYXJzZShub2RlOiBJQXN0Tm9kZSl7XHJcblx0XHRpZiAobm9kZS50YWdOYW1lICE9PSBcImNvbnRlbnRcIil7XHJcblx0XHRcdHJldHVybiBudWxsO1xyXG5cdFx0fTtcclxuXHRcdHZhciBtZXRhOiBHQ29udGVudDtcclxuXHRcdG1ldGEudHlwZSA9IFwiY29udGVudFwiO1x0XHRcclxuXHRcdG1ldGEuaXNWaXJ0dWFsID0gdHJ1ZTtcclxuXHRcdC8qbWV0YS5mZ05hbWUgPSBub2RlLm5vZGVOYW1lLnNsaWNlKDMpO1xyXG5cdFx0bWV0YS5wYXRoID0gbm9kZS5hdHRycy5jbGFzcyBcclxuXHRcdFx0PyBub2RlLmF0dHJzLmNsYXNzLnNwbGl0KCcgJylcclxuXHRcdFx0OiBbXTtcclxuXHRcdG1ldGEuZWlkID0gbm9kZS5hdHRycy5pZCB8fCBudWxsO1xyXG5cdFx0bWV0YS5jb250ZW50ID0gdHBsTWdyLnJlYWRUcGwobm9kZSwgaHRtbCwgbWV0YSk7Ki9cclxuXHRcdHJldHVybiBtZXRhO1xyXG5cdH07XHJcblxyXG5cdHJlbmRlcihjb250ZXh0OiBGZ0luc3RhbmNlLCBkYXRhOiBhbnkpe1xyXG5cdFx0dGhpcy5zY29wZVBhdGggPSBjb250ZXh0LmdhcE1ldGEuc2NvcGVQYXRoO1xyXG5cdFx0cmV0dXJuIGNvbnRleHQucGFyZW50LnJlbmRlclRwbChjb250ZXh0Lm1ldGEuY29udGVudCwgY29udGV4dC5nYXBNZXRhLnBhcmVudCwgY29udGV4dC5wYXJlbnQuZGF0YSk7XHJcblx0fTtcclxuXHJcbn07IiwiXCJ1c2Ugc3RyaWN0XCI7XHJcblxyXG5pbXBvcnQgKiBhcyB1dGlscyBmcm9tICcuLi91dGlscyc7ICBcclxuaW1wb3J0ICogYXMgdmFsdWVNZ3IgZnJvbSAnLi4vdmFsdWVNZ3InOyAgXHJcbmltcG9ydCB7R2FwfSBmcm9tICcuLi9jbGllbnQvZ2FwQ2xhc3NNZ3InOyAgXHJcbmltcG9ydCB7RmdJbnN0YW5jZX0gZnJvbSAnLi4vY2xpZW50L2ZnSW5zdGFuY2UnOyAgXHJcbmltcG9ydCB7SUFzdE5vZGV9IGZyb20gJy4uL3RwbE1ncic7XHJcblxyXG5leHBvcnQgZGVmYXVsdCBjbGFzcyBHRGF0YSBleHRlbmRzIEdhcHtcclxuXHJcblx0c3RhdGljIHBhcnNlKG5vZGU6IElBc3ROb2RlKXtcclxuXHRcdGlmIChub2RlLnRhZ05hbWUgIT0gXCJkYXRhXCIpe1xyXG5cdFx0XHRyZXR1cm4gbnVsbDtcclxuXHRcdH07XHJcblx0XHR2YXIgbWV0YTogR0RhdGE7XHJcblx0XHRtZXRhLnR5cGUgPSBcImRhdGFcIjtcdFx0XHJcblx0XHRtZXRhLmlzVmlydHVhbCA9IGZhbHNlO1xyXG5cdFx0bWV0YS5wYXRoID0gdXRpbHMucGFyc2VQYXRoKG5vZGUpO1x0XHRcclxuXHRcdG1ldGEuZWlkID0gbm9kZS5hdHRycy5pZCB8fCBudWxsO1xyXG5cdFx0cmV0dXJuIG1ldGE7XHJcblx0fTtcclxuXHJcblx0cmVuZGVyKGNvbnRleHQ6IEZnSW5zdGFuY2UsIGRhdGE6IGFueSl7XHJcblx0XHR2YXIgdmFsdWUgPSB2YWx1ZU1nci5yZW5kZXIodGhpcywgZGF0YSwgdGhpcy5yZXNvbHZlZFBhdGgpO1xyXG5cdFx0cmV0dXJuIHV0aWxzLnJlbmRlclRhZyh7XHJcblx0XHRcdG5hbWU6IFwic3BhblwiLFxyXG5cdFx0XHRhdHRyczogdGhpcy5hdHRycyxcclxuXHRcdFx0aW5uZXJIVE1MOiB2YWx1ZVxyXG5cdFx0fSk7XHJcblx0fTtcclxuXHJcblx0dXBkYXRlKGNvbnRleHQ6IEZnSW5zdGFuY2UsIG1ldGE6IEdhcCwgc2NvcGVQYXRoOiBhbnksIHZhbHVlOiBhbnkpe1xyXG5cdFx0dmFyIG5vZGUgPSBtZXRhLmdldERvbSgpWzBdO1xyXG5cdFx0aWYgKCFub2RlKXtcclxuXHRcdFx0XHJcblx0XHR9O1xyXG5cdFx0bm9kZS5pbm5lckhUTUwgPSB2YWx1ZTtcclxuXHRcdC8vaGlnaGxpZ2h0KG5vZGUsIFsweGZmZmZmZiwgMHhmZmVlODhdLCA1MDApO1xyXG5cdH07XHJcblxyXG59OyIsIlwidXNlIHN0cmljdFwiO1xyXG5cclxuaW1wb3J0ICogYXMgdXRpbHMgZnJvbSAnLi4vdXRpbHMnOyAgXHJcbmltcG9ydCAqIGFzIHZhbHVlTWdyIGZyb20gJy4uL3ZhbHVlTWdyJzsgIFxyXG5pbXBvcnQge1N0clRwbCwgcmVhZCBhcyByZWFkVHBsfSBmcm9tICcuLi9TdHJUcGwnOyAgXHJcbmltcG9ydCB7R2FwLCByZW5kZXJ9IGZyb20gJy4uL2NsaWVudC9nYXBDbGFzc01ncic7ICBcclxuaW1wb3J0IHtGZ0luc3RhbmNlfSBmcm9tICcuLi9jbGllbnQvZmdJbnN0YW5jZSc7ICBcclxuaW1wb3J0IHtJQXN0Tm9kZX0gZnJvbSAnLi4vdHBsTWdyJztcclxuXHJcbmV4cG9ydCBkZWZhdWx0IGNsYXNzIEdEeW5hbWljVGV4dCBleHRlbmRzIEdhcHtcclxuXHJcblx0dHBsOiBhbnk7XHJcblxyXG5cdHN0YXRpYyBwYXJzZShub2RlOiBJQXN0Tm9kZSl7XHJcblx0XHRpZiAobm9kZS50eXBlICE9PSBcInRleHRcIil7XHJcblx0XHRcdHJldHVybiBudWxsO1xyXG5cdFx0fTtcclxuXHRcdHZhciB0cGwgPSByZWFkVHBsKG5vZGUudGV4dCwgdmFsdWVNZ3IucGFyc2UpO1xyXG5cdFx0aWYgKHR5cGVvZiB0cGwgPT09IFwic3RyaW5nXCIpe1xyXG5cdFx0XHRyZXR1cm4gbnVsbDtcclxuXHRcdH07XHJcblx0XHR2YXIgbWV0YTogR0R5bmFtaWNUZXh0O1xyXG5cdFx0bWV0YS50eXBlID0gXCJkeW5hbWljLXRleHRcIjtcclxuXHRcdG1ldGEudHBsID0gdHBsOyBcclxuXHRcdHJldHVybiBtZXRhO1xyXG5cdH07XHJcblxyXG5cdHJlbmRlcihjb250ZXh0OiBGZ0luc3RhbmNlLCBkYXRhOiBhbnkpe1xyXG5cdFx0dmFyIG1ldGEgPSB0aGlzO1xyXG5cdFx0dmFyIHRwbCA9IG5ldyBTdHJUcGwobWV0YS50cGwsIHZhbHVlTWdyLnBhcnNlKTtcclxuXHRcdHJldHVybiB0cGwucmVuZGVyKGZ1bmN0aW9uKHBhdGgpe1xyXG5cdFx0XHR2YXIgZGF0YU1ldGEgPSB7XHJcblx0XHRcdFx0XCJ0eXBlXCI6IFwiZGF0YVwiLFxyXG5cdFx0XHRcdFwicGF0aFwiOiBwYXRoXHRcdFx0XHJcblx0XHRcdH07XHJcblx0XHRcdHZhciBpdGVtTWV0YSA9IG5ldyBHYXAoY29udGV4dCwgZGF0YU1ldGEsIG1ldGEucGFyZW50KTtcclxuXHRcdFx0cmV0dXJuIHJlbmRlcihjb250ZXh0LCBtZXRhLnBhcmVudCwgZGF0YSwgaXRlbU1ldGEpO1xyXG5cdFx0fSk7XHJcblx0fTtcclxuXHJcbn07IiwiXCJ1c2Ugc3RyaWN0XCI7XHJcblxyXG5pbXBvcnQgKiBhcyB1dGlscyBmcm9tICcuLi91dGlscyc7ICBcclxuaW1wb3J0ICogYXMgdmFsdWVNZ3IgZnJvbSAnLi4vdmFsdWVNZ3InOyAgXHJcbmltcG9ydCB7R2FwfSBmcm9tICcuLi9jbGllbnQvZ2FwQ2xhc3NNZ3InOyAgXHJcbmltcG9ydCB7RmdJbnN0YW5jZX0gZnJvbSAnLi4vY2xpZW50L2ZnSW5zdGFuY2UnOyAgXHJcbmltcG9ydCB7SUFzdE5vZGUsIHJlYWRUcGx9IGZyb20gJy4uL3RwbE1ncic7XHJcblxyXG5leHBvcnQgZGVmYXVsdCBjbGFzcyBHRmcgZXh0ZW5kcyBHYXB7XHJcblx0cGFyZW50Rmc6IEZnSW5zdGFuY2U7XHJcblx0ZmdOYW1lOiBzdHJpbmc7XHJcblxyXG5cdHN0YXRpYyBwYXJzZShub2RlOiBJQXN0Tm9kZSl7XHJcblx0XHRpZiAobm9kZS50eXBlICE9ICd0YWcnIHx8ICF+bm9kZS50YWdOYW1lLmluZGV4T2YoXCJmZy1cIikpe1xyXG5cdFx0XHRyZXR1cm4gbnVsbDtcclxuXHRcdH07XHJcblx0XHR2YXIgbWV0YTpHRmc7XHJcblx0XHRtZXRhLnR5cGUgPSBcImZnXCI7XHRcdFxyXG5cdFx0bWV0YS5pc1ZpcnR1YWwgPSB0cnVlO1xyXG5cdFx0bWV0YS5mZ05hbWUgPSBub2RlLnRhZ05hbWUuc2xpY2UoMyk7XHJcblx0XHRtZXRhLnBhdGggPSB1dGlscy5wYXJzZVBhdGgobm9kZSk7XHRcdFxyXG5cdFx0bWV0YS5laWQgPSBub2RlLmF0dHJzLmlkIHx8IG51bGw7XHJcblx0XHRtZXRhLmNvbnRlbnQgPSByZWFkVHBsKG5vZGUsIG51bGwsIG1ldGEpO1xyXG5cdFx0cmV0dXJuIG1ldGE7XHJcblx0fTtcclxuXHJcblx0cmVuZGVyKGNvbnRleHQ6IEZnSW5zdGFuY2UsIGRhdGE6IGFueSl7XHJcblx0XHR2YXIgc2VsZiA9IHRoaXM7XHJcblx0XHR0aGlzLnBhcmVudEZnID0gY29udGV4dDtcclxuXHRcdC8vdGhpcy5yZW5kZXJlZENvbnRlbnQgPSBjb250ZXh0LnJlbmRlclRwbCh0aGlzLmNvbnRlbnQsIG1ldGEsIGRhdGEpO1xyXG5cdFx0dmFyIGZnQ2xhc3MgPSB3aW5kb3dbJyRmZyddLmNsYXNzZXNbdGhpcy5mZ05hbWVdO1xyXG5cdFx0dmFyIGZnRGF0YSA9IHV0aWxzLmRlZXBDbG9uZSh2YWx1ZU1nci5nZXRWYWx1ZSh0aGlzLCBkYXRhLCB0aGlzLnJlc29sdmVkUGF0aCkpO1x0XHJcblx0XHR2YXIgZmcgPSBmZ0NsYXNzLnJlbmRlcihmZ0RhdGEsIHRoaXMsIGNvbnRleHQpO1xyXG5cdFx0Zmcub24oJ3VwZGF0ZScsIGZ1bmN0aW9uKHBhdGgsIHZhbCl7XHJcblx0XHRcdC8vY29udGV4dC51cGRhdGUoc2NvcGVQYXRoLmNvbmNhdChwYXRoKSwgdmFsKTtcclxuXHRcdFx0Ly9jb25zb2xlLmxvZyhwYXRoLCB2YWwpO1xyXG5cdFx0fSk7XHJcblx0XHR0aGlzLmZnID0gZmc7XHJcblx0XHRmZy5tZXRhID0gdGhpcztcclxuXHRcdGNvbnRleHQuY2hpbGRGZ3MucHVzaChmZyk7XHJcblx0XHRyZXR1cm4gZmc7XHJcblx0fTtcclxuXHJcblx0dXBkYXRlKGNvbnRleHQ6IEZnSW5zdGFuY2UsIG1ldGE6IEdhcCwgc2NvcGVQYXRoOiBhbnksIHZhbHVlOiBhbnkpe1xyXG5cdFx0dmFyIG5vZGUgPSBtZXRhLmdldERvbSgpWzBdO1xyXG5cdFx0aWYgKCFub2RlKXtcclxuXHRcdFx0XHJcblx0XHR9O1xyXG5cdFx0bm9kZS5pbm5lckhUTUwgPSB2YWx1ZTtcclxuXHRcdC8vaGlnaGxpZ2h0KG5vZGUsIFsweGZmZmZmZiwgMHhmZmVlODhdLCA1MDApO1xyXG5cdH07XHJcblxyXG59OyIsIlwidXNlIHN0cmljdFwiO1xyXG5cclxuaW1wb3J0ICogYXMgdXRpbHMgZnJvbSAnLi4vdXRpbHMnOyAgXHJcbmltcG9ydCAqIGFzIHZhbHVlTWdyIGZyb20gJy4uL3ZhbHVlTWdyJzsgIFxyXG5pbXBvcnQge1N0clRwbCwgcmVhZCBhcyByZWFkU3RyVHBsfSBmcm9tICcuLi9TdHJUcGwnOyAgXHJcbmltcG9ydCB7R2FwfSBmcm9tICcuLi9jbGllbnQvZ2FwQ2xhc3NNZ3InOyAgXHJcbmltcG9ydCB7RmdJbnN0YW5jZX0gZnJvbSAnLi4vY2xpZW50L2ZnSW5zdGFuY2UnOyAgXHJcbmltcG9ydCB7SUFzdE5vZGUsIHJlYWRUcGx9IGZyb20gJy4uL3RwbE1ncic7XHJcblxyXG5mdW5jdGlvbiBpc1Njb3BlKGl0ZW0pe1xyXG5cdGlmICh0eXBlb2YgaXRlbSA9PT0gXCJzdHJpbmdcIil7XHJcblx0XHRyZXR1cm4gZmFsc2U7XHJcblx0fTtcclxuXHRyZXR1cm4gaXRlbS50eXBlID09PSBcInNjb3BlXCI7XHJcbn07XHJcblxyXG5leHBvcnQgZGVmYXVsdCBjbGFzcyBHUmF3IGV4dGVuZHMgR2Fwe1xyXG5cdGlzUm9vdE5vZGU6IGJvb2xlYW47XHJcblx0aXNTY29wZUl0ZW06IGJvb2xlYW47XHJcblx0aXNTY29wZUhvbGRlcjogYm9vbGVhbjtcclxuXHR0YWdOYW1lOiBzdHJpbmc7XHJcblxyXG5cdHN0YXRpYyBwYXJzZShub2RlOiBJQXN0Tm9kZSwgaHRtbDogc3RyaW5nLCBwYXJlbnRNZXRhOiBHYXApe1xyXG5cdFx0aWYgKG5vZGUudHlwZSAhPT0gXCJ0YWdcIil7XHJcblx0XHRcdHJldHVybiBudWxsO1xyXG5cdFx0fTtcclxuXHRcdHZhciBoYXNEeW5hbWljQXR0cnMgPSBmYWxzZTtcclxuXHRcdHZhciBtZXRhOiBHUmF3O1xyXG5cdFx0bWV0YS50eXBlID0gXCJyYXdcIjtcclxuXHRcdG1ldGEuaXNWaXJ0dWFsID0gZmFsc2U7XHJcblx0XHRtZXRhLmlzUm9vdE5vZGUgPSBub2RlLnBhcmVudC50eXBlICE9PSBcInRhZ1wiO1xyXG5cdFx0bWV0YS50YWdOYW1lID0gbm9kZS50YWdOYW1lO1xyXG5cdFx0aWYgKFwiaWRcIiBpbiBub2RlLmF0dHJzKXtcclxuXHRcdFx0bWV0YS5laWQgPSBub2RlLmF0dHJzLmlkLnZhbHVlO1xyXG5cdFx0XHRkZWxldGUgbm9kZS5hdHRycy5pZDtcclxuXHRcdH07XHJcblx0XHR2YXIgYXR0cnNBcnIgPSB1dGlscy5vYmpUb0tleVZhbHVlKG5vZGUuYXR0cnMsICduYW1lJywgJ3ZhbHVlJyk7XHJcblx0XHRhdHRyc0FyciA9IGF0dHJzQXJyLm1hcChmdW5jdGlvbihhdHRyKXtcdFxyXG5cdFx0XHR2YXIgYXR0clZhbCA9IGF0dHIudmFsdWUudHlwZSA9PT0gXCJzdHJpbmdcIlxyXG5cdFx0XHRcdD8gYXR0ci52YWx1ZS52YWx1ZVxyXG5cdFx0XHRcdDogKGF0dHIudmFsdWUuZXNjYXBlZCA/ICcjJyA6ICchJykgKyAneycgKyBhdHRyLnZhbHVlLmtleSArICd9JztcdFx0XHJcblx0XHRcdHZhciB2YWx1ZSA9IHJlYWRTdHJUcGwoYXR0clZhbCwgdmFsdWVNZ3IucGFyc2UpO1xyXG5cdFx0XHR2YXIgbmFtZSA9IHJlYWRTdHJUcGwoYXR0ci5uYW1lLCB2YWx1ZU1nci5wYXJzZSk7XHJcblx0XHRcdGlmICh0eXBlb2YgdmFsdWUgIT09IFwic3RyaW5nXCIgfHwgdHlwZW9mIG5hbWUgIT09IFwic3RyaW5nXCIpe1xyXG5cdFx0XHRcdGhhc0R5bmFtaWNBdHRycyA9IHRydWU7XHJcblx0XHRcdH07XHJcblx0XHRcdHJldHVybiB7XHJcblx0XHRcdFx0XCJuYW1lXCI6IG5hbWUsXHJcblx0XHRcdFx0XCJ2YWx1ZVwiOiB2YWx1ZVxyXG5cdFx0XHR9O1xyXG5cdFx0fSk7XHRcdFxyXG5cdFx0bWV0YS5hdHRycyA9IHV0aWxzLmtleVZhbHVlVG9PYmooYXR0cnNBcnIsICduYW1lJywgJ3ZhbHVlJyk7XHJcblx0XHRpZiAobm9kZS52YWx1ZSl7XHJcblx0XHRcdG1ldGEucGF0aCA9IHZhbHVlTWdyLnBhcnNlKG5vZGUudmFsdWUucGF0aCwge1xyXG5cdFx0XHRcdGVzY2FwZWQ6IG5vZGUudmFsdWUuZXNjYXBlZFxyXG5cdFx0XHR9KTtcclxuXHRcdH07XHJcblx0XHRtZXRhLmNvbnRlbnQgPSByZWFkVHBsKG5vZGUsIG51bGwsIG1ldGEpO1x0XHRcclxuXHRcdGlmIChtZXRhLmNvbnRlbnQuc29tZShpc1Njb3BlKSl7XHJcblx0XHRcdG1ldGEuaXNTY29wZUhvbGRlciA9IHRydWU7XHRcdFx0XHJcblx0XHR9O1xyXG5cdFx0aWYgKHBhcmVudE1ldGEgJiYgcGFyZW50TWV0YS50eXBlID09PSBcInNjb3BlXCIpe1xyXG5cdFx0XHRtZXRhLmlzU2NvcGVJdGVtID0gdHJ1ZTtcclxuXHRcdH07XHJcblx0XHRpZiAoXHJcblx0XHRcdFx0IWhhc0R5bmFtaWNBdHRycyBcclxuXHRcdFx0XHQmJiAhbWV0YS5laWRcclxuXHRcdFx0XHQmJiAhbWV0YS5pc1Jvb3ROb2RlIFxyXG5cdFx0XHRcdCYmICFtZXRhLmlzU2NvcGVIb2xkZXIgXHJcblx0XHRcdFx0JiYgIW1ldGEuaXNTY29wZUl0ZW1cclxuXHRcdFx0XHQmJiAhbWV0YS5wYXRoXHJcblx0XHRcdCl7XHJcblx0XHRcdHJldHVybiBudWxsO1xyXG5cdFx0fTtcclxuXHRcdHJldHVybiBtZXRhO1xyXG5cdH07XHJcblxyXG5cdHJlbmRlcihjb250ZXh0OiBGZ0luc3RhbmNlLCBkYXRhOiBhbnkpe1xyXG5cdFx0dmFyIG1ldGEgPSB0aGlzO1xyXG5cdFx0aWYgKG1ldGEuaXNTY29wZUhvbGRlcil7XHJcblx0XHRcdG1ldGEucm9vdC5jdXJyZW50U2NvcGVIb2xkZXIgPSBtZXRhO1x0XHRcclxuXHRcdH07XHJcblx0XHR2YXIgYXR0cnNBcnIgPSB1dGlscy5vYmpUb0tleVZhbHVlKG1ldGEuYXR0cnMsICduYW1lJywgJ3ZhbHVlJyk7XHJcblx0XHR2YXIgYXR0ck9iaiA9IHt9O1xyXG5cdFx0YXR0cnNBcnIuZm9yRWFjaChmdW5jdGlvbihhdHRyKXtcclxuXHRcdFx0dmFyIG5hbWUgPSBuZXcgU3RyVHBsKGF0dHIubmFtZSkucmVuZGVyKHZhbHVlTWdyLnJlc29sdmVBbmRSZW5kZXIuYmluZChudWxsLCBtZXRhLCBkYXRhKSk7XHJcblx0XHRcdHZhciB2YWx1ZSA9IG5ldyBTdHJUcGwoYXR0ci52YWx1ZSkucmVuZGVyKHZhbHVlTWdyLnJlc29sdmVBbmRSZW5kZXIuYmluZChudWxsLCBtZXRhLCBkYXRhKSk7XHJcblx0XHRcdGF0dHJPYmpbbmFtZV0gPSB2YWx1ZTtcclxuXHRcdH0pO1xyXG5cdFx0dmFyIHRyaWdnZXJzID0gW107XHJcblx0XHRjb250ZXh0LmdhcFN0b3JhZ2Uuc2V0VHJpZ2dlcnMobWV0YSwgdHJpZ2dlcnMpO1xyXG5cdFx0dmFyIGlubmVyID0gbWV0YS5wYXRoIFxyXG5cdFx0XHQ/IHZhbHVlTWdyLmdldFZhbHVlKG1ldGEsIGRhdGEsIHRoaXMucmVzb2x2ZWRQYXRoKVxyXG5cdFx0XHQ6IGNvbnRleHQucmVuZGVyVHBsKG1ldGEuY29udGVudCwgbWV0YSwgZGF0YSk7XHJcblx0XHRyZXR1cm4gdXRpbHMucmVuZGVyVGFnKHtcclxuXHRcdFx0XCJuYW1lXCI6IG1ldGEudGFnTmFtZSxcclxuXHRcdFx0XCJhdHRyc1wiOiBhdHRyT2JqLFxyXG5cdFx0XHRcImlubmVySFRNTFwiOiBpbm5lclxyXG5cdFx0fSk7XHJcblx0fTtcclxuXHJcblx0dXBkYXRlKGNvbnRleHQ6IEZnSW5zdGFuY2UsIG1ldGE6IEdhcCwgc2NvcGVQYXRoOiBhbnksIHZhbHVlOiBhbnkpe1xyXG5cdFx0Ly8gdG8gZG8gdmFsdWUgdXBkYXRlXHJcblx0XHQvKnZhciBhdHRyRGF0YSA9IHV0aWxzLm9ialBhdGgobWV0YS5zY29wZVBhdGgsIGNvbnRleHQuZGF0YSk7XHJcblx0XHR2YXIgcmVuZGVyZWRBdHRycyA9IHV0aWxzLnJlbmRlckF0dHJzKG1ldGEuYXR0cnMsIGF0dHJEYXRhKTsqL1xyXG5cdFx0dmFyIGF0dHJzQXJyID0gdXRpbHMub2JqVG9LZXlWYWx1ZShtZXRhLmF0dHJzLCAnbmFtZScsICd2YWx1ZScpO1xyXG5cdFx0dmFyIGF0dHJPYmogPSB7fTtcclxuXHRcdGF0dHJzQXJyLmZvckVhY2goZnVuY3Rpb24oYXR0cil7XHJcblx0XHRcdHZhciBuYW1lID0gbmV3IFN0clRwbChhdHRyLm5hbWUpLnJlbmRlcih2YWx1ZU1nci5yZW5kZXIuYmluZChudWxsLCBtZXRhLCBjb250ZXh0LmRhdGEpKTtcclxuXHRcdFx0dmFyIHZhbHVlID0gbmV3IFN0clRwbChhdHRyLnZhbHVlKS5yZW5kZXIoZnVuY3Rpb24ocGF0aCl7XHJcblx0XHRcdFx0dmFyIHJlc29sdmVkUGF0aCA9IHZhbHVlTWdyLnJlc29sdmVQYXRoKG1ldGEsIHBhdGgpO1x0XHRcclxuXHRcdFx0XHRyZXR1cm4gdmFsdWVNZ3IucmVuZGVyKG1ldGEsIGNvbnRleHQuZGF0YSwgcmVzb2x2ZWRQYXRoKTtcclxuXHRcdFx0fSk7XHJcblx0XHRcdGF0dHJPYmpbbmFtZV0gPSB2YWx1ZTtcclxuXHRcdH0pO1xyXG5cdFx0dmFyIGRvbSA9IG1ldGEuZ2V0RG9tKClbMF07XHJcblx0XHRpZiAobWV0YS5wYXRoICYmIG1ldGEucGF0aC5wYXRoLmpvaW4oJy0nKSA9PT0gc2NvcGVQYXRoLmpvaW4oJy0nKSl7XHJcblx0XHRcdGRvbS5pbm5lckhUTUwgPSBtZXRhLnBhdGguZXNjYXBlZCBcclxuXHRcdFx0XHQ/IHV0aWxzLmVzY2FwZUh0bWwodmFsdWUpXHJcblx0XHRcdFx0OiB2YWx1ZTtcclxuXHRcdH07XHJcblx0XHR1dGlscy5vYmpGb3IoYXR0ck9iaiwgZnVuY3Rpb24odmFsdWUsIG5hbWUpe1xyXG5cdFx0XHR2YXIgb2xkVmFsID0gZG9tLmdldEF0dHJpYnV0ZShuYW1lKTtcclxuXHRcdFx0aWYgKG9sZFZhbCAhPT0gdmFsdWUpe1xyXG5cdFx0XHRcdGRvbS5zZXRBdHRyaWJ1dGUobmFtZSwgdmFsdWUpO1xyXG5cdFx0XHR9O1xyXG5cdFx0fSk7XHRcdFxyXG5cdH07XHJcblxyXG59OyIsIlwidXNlIHN0cmljdFwiO1xyXG5cclxuaW1wb3J0ICogYXMgdXRpbHMgZnJvbSAnLi4vdXRpbHMnOyAgXHJcbmltcG9ydCAqIGFzIHZhbHVlTWdyIGZyb20gJy4uL3ZhbHVlTWdyJzsgIFxyXG5pbXBvcnQge0dhcH0gZnJvbSAnLi4vY2xpZW50L2dhcENsYXNzTWdyJzsgIFxyXG5pbXBvcnQge0ZnSW5zdGFuY2V9IGZyb20gJy4uL2NsaWVudC9mZ0luc3RhbmNlJzsgIFxyXG5pbXBvcnQge0lBc3ROb2RlfSBmcm9tICcuLi90cGxNZ3InO1xyXG5cclxuZXhwb3J0IGRlZmF1bHQgY2xhc3MgR1Njb3BlSXRlbSBleHRlbmRzIEdhcHtcclxuXHRzY29wZVBhdGg6IGFueTtcclxuXHJcblx0c3RhdGljIHBhcnNlKG5vZGU6IElBc3ROb2RlKXtcclxuXHRcdHJldHVybiBudWxsO1xyXG5cdH07XHJcblxyXG5cdHJlbmRlcihjb250ZXh0OiBGZ0luc3RhbmNlLCBkYXRhOiBhbnkpe1xyXG5cdFx0dmFyIG1ldGEgPSB0aGlzO1xyXG5cdFx0dmFyIHNjb3BlRGF0YSA9IHZhbHVlTWdyLmdldFZhbHVlKG1ldGEsIGRhdGEsIHRoaXMucmVzb2x2ZWRQYXRoKTtcclxuXHRcdHRoaXMuc2NvcGVQYXRoID0gdGhpcy5yZXNvbHZlZFBhdGgucGF0aDtcclxuXHRcdGlmICghc2NvcGVEYXRhKXtcclxuXHRcdFx0cmV0dXJuICcnO1xyXG5cdFx0fTtcclxuXHRcdHJldHVybiBjb250ZXh0LnJlbmRlclRwbChtZXRhLmNvbnRlbnQsIG1ldGEsIGRhdGEpO1xyXG5cdH07XHJcblxyXG59OyIsIlwidXNlIHN0cmljdFwiO1xyXG5cclxuaW1wb3J0ICogYXMgdXRpbHMgZnJvbSAnLi4vdXRpbHMnOyAgXHJcbmltcG9ydCAqIGFzIHZhbHVlTWdyIGZyb20gJy4uL3ZhbHVlTWdyJzsgIFxyXG5pbXBvcnQge0dhcCwgcmVuZGVyfSBmcm9tICcuLi9jbGllbnQvZ2FwQ2xhc3NNZ3InOyAgXHJcbmltcG9ydCB7RmdJbnN0YW5jZX0gZnJvbSAnLi4vY2xpZW50L2ZnSW5zdGFuY2UnOyAgXHJcbmltcG9ydCB7SUFzdE5vZGUsIHJlYWRUcGx9IGZyb20gJy4uL3RwbE1ncic7XHJcbmltcG9ydCAqIGFzIGFuY2hvck1nciBmcm9tICcuLi9hbmNob3JNZ3InO1xyXG5cclxuZnVuY3Rpb24gcmVuZGVyU2NvcGVDb250ZW50KGNvbnRleHQ6IEZnSW5zdGFuY2UsIHNjb3BlTWV0YTogR2FwLCBzY29wZURhdGE6IGFueSwgZGF0YTogYW55LCBpZE9mZnNldDogbnVtYmVyKXtcclxuXHR2YXIgaXNBcnJheSA9IEFycmF5LmlzQXJyYXkoc2NvcGVEYXRhKTtcclxuXHRpZiAoIWlzQXJyYXkpe1xyXG5cdFx0c2NvcGVEYXRhID0gW3Njb3BlRGF0YV07XHJcblx0fTtcclxuXHR2YXIgcGFydHMgPSBzY29wZURhdGEubWFwKGZ1bmN0aW9uKGRhdGFJdGVtLCBpZCl7XHJcblx0XHR2YXIgaXRlbU1ldGEgPSBzY29wZU1ldGE7XHJcblx0XHR2YXIgcGF0aCA9IGlzQXJyYXlcclxuXHRcdFx0PyB2YWx1ZU1nci5yZWFkKFsoaWQgKyBpZE9mZnNldCkudG9TdHJpbmcoKV0pXHJcblx0XHRcdDogdmFsdWVNZ3IucmVhZChbXSk7XHJcblx0XHR2YXIgaXRlbUNmZzogYW55ID0ge1xyXG5cdFx0XHRcInR5cGVcIjogXCJzY29wZS1pdGVtXCIsXHJcblx0XHRcdFwiaXNWaXJ0dWFsXCI6IHRydWUsXHJcblx0XHRcdFwicGF0aFwiOiBwYXRoLFxyXG5cdFx0XHRcImNvbnRlbnRcIjogc2NvcGVNZXRhLmNvbnRlbnRcclxuXHRcdH07XHJcblx0XHRpZiAoc2NvcGVNZXRhLmVpZCl7XHJcblx0XHRcdGl0ZW1DZmcuZWlkID0gc2NvcGVNZXRhLmVpZCArICctaXRlbSc7XHJcblx0XHR9O1xyXG5cdFx0aXRlbU1ldGEgPSBuZXcgR2FwKGNvbnRleHQsIGl0ZW1DZmcsIGl0ZW1NZXRhKTtcdFx0XHJcblx0XHRyZXR1cm4gcmVuZGVyKGNvbnRleHQsIHNjb3BlTWV0YSwgZGF0YSwgaXRlbU1ldGEpO1xyXG5cdH0pO1xyXG5cdHJldHVybiBwYXJ0cztcclxufTtcclxuXHJcbmV4cG9ydCBkZWZhdWx0IGNsYXNzIEdTY29wZSBleHRlbmRzIEdhcHtcclxuXHRpdGVtczogR2FwW107XHJcblx0c2NvcGVQYXRoOiBhbnk7XHJcblxyXG5cdHN0YXRpYyBwYXJzZShub2RlOiBJQXN0Tm9kZSwgaHRtbCl7XHJcblx0XHRpZiAobm9kZS50YWdOYW1lICE9PSBcInNjb3BlXCIpe1xyXG5cdFx0XHRyZXR1cm4gbnVsbDtcclxuXHRcdH07XHJcblx0XHR2YXIgbWV0YTogR1Njb3BlO1xyXG5cdFx0bWV0YS50eXBlID0gXCJzY29wZVwiO1xyXG5cdFx0bWV0YS5pc1ZpcnR1YWwgPSB0cnVlO1xyXG5cdFx0bWV0YS5wYXRoID0gdXRpbHMucGFyc2VQYXRoKG5vZGUpO1x0XHRcclxuXHRcdG1ldGEuY29udGVudCA9IHJlYWRUcGwobm9kZSwgaHRtbCwgbWV0YSk7XHJcblx0XHRtZXRhLmVpZCA9IG5vZGUuYXR0cnMuaWQgfHwgbnVsbDtcclxuXHRcdHJldHVybiBtZXRhO1xyXG5cdH07XHJcblxyXG5cdHJlbmRlcihjb250ZXh0OiBGZ0luc3RhbmNlLCBkYXRhOiBhbnkpe1xyXG5cdFx0dmFyIG1ldGEgPSB0aGlzO1xyXG5cdFx0bWV0YS5pdGVtcyA9IFtdO1xyXG5cdFx0dmFyIHNjb3BlRGF0YSA9IHZhbHVlTWdyLmdldFZhbHVlKG1ldGEsIGRhdGEsIHRoaXMucmVzb2x2ZWRQYXRoKTtcclxuXHRcdHRoaXMuc2NvcGVQYXRoID0gdGhpcy5yZXNvbHZlZFBhdGgucGF0aDtcclxuXHRcdHZhciBhbmNob3JDb2RlID0gYW5jaG9yTWdyLmdlbkNvZGUoY29udGV4dCwgbWV0YSk7XHRcdFxyXG5cdFx0dmFyIHBhcnRzID0gcmVuZGVyU2NvcGVDb250ZW50KGNvbnRleHQsIG1ldGEsIHNjb3BlRGF0YSwgZGF0YSwgMCk7XHRcclxuXHRcdHJldHVybiBwYXJ0cy5qb2luKCdcXG4nKSArIGFuY2hvckNvZGU7XHJcblx0fTtcclxuXHJcblx0dXBkYXRlKGNvbnRleHQ6IEZnSW5zdGFuY2UsIG1ldGE6IEdhcCwgc2NvcGVQYXRoOiBhbnksIHZhbHVlOiBhbnksIG9sZFZhbHVlOiBhbnkpe1xyXG5cdFx0dmFsdWUgPSB2YWx1ZSB8fCBbXTtcclxuXHRcdG9sZFZhbHVlID0gb2xkVmFsdWUgfHwgW107XHJcblx0XHRmb3IgKHZhciBpID0gdmFsdWUubGVuZ3RoOyBpIDwgb2xkVmFsdWUubGVuZ3RoOyBpKyspe1xyXG5cdFx0XHRjb250ZXh0LmdhcFN0b3JhZ2UucmVtb3ZlU2NvcGUoc2NvcGVQYXRoLmNvbmNhdChbaV0pKTtcclxuXHRcdH07XHJcblx0XHRpZiAodmFsdWUubGVuZ3RoID4gb2xkVmFsdWUubGVuZ3RoKXtcclxuXHRcdFx0dmFyIGRhdGFTbGljZSA9IHZhbHVlLnNsaWNlKG9sZFZhbHVlLmxlbmd0aCk7XHJcblx0XHRcdHZhciBuZXdDb250ZW50ID0gcmVuZGVyU2NvcGVDb250ZW50KGNvbnRleHQsIG1ldGEsIGRhdGFTbGljZSwgY29udGV4dC5kYXRhLCBvbGRWYWx1ZS5sZW5ndGgpLmpvaW4oJ1xcbicpO1xyXG5cdFx0XHR2YXIgYW5jaG9yID0gYW5jaG9yTWdyLmZpbmQoY29udGV4dCwgbWV0YSk7XHRcdFxyXG5cdFx0XHRhbmNob3JNZ3IuaW5zZXJ0SFRNTChhbmNob3IsICdiZWZvcmUnLCBuZXdDb250ZW50KTtcclxuXHRcdH07XHJcblx0fTtcclxuXHJcbn07IiwiXCJ1c2Ugc3RyaWN0XCI7XHJcblxyXG5leHBvcnQgaW50ZXJmYWNlIFZhbHVlUGFyc2VGbntcclxuXHQoc3RyOiBzdHJpbmcpOiBhbnk7XHJcbn07XHJcblxyXG5leHBvcnQgaW50ZXJmYWNlIFZhbHVlUmVuZGVyRm57XHJcblx0KHBhcnNlZDogYW55KTogc3RyaW5nO1xyXG59O1xyXG5cclxuZXhwb3J0IGNsYXNzIFN0clRwbHtcclxuXHRzcmM6IHN0cmluZztcclxuXHRnYXBzOiBhbnk7XHJcblx0cGFydHM6IGFueTtcclxuXHRpc1N0cmluZzogYm9vbGVhbjtcclxuXHJcblx0Y29uc3RydWN0b3IgKHRwbCwgdmFsdWVQYXJzZUZuPzogVmFsdWVQYXJzZUZuKXtcclxuXHRcdGlmICh0eXBlb2YgdHBsID09PSBcIm9iamVjdFwiKXtcclxuXHRcdFx0dGhpcy5zcmMgPSB0cGwuc3JjO1xyXG5cdFx0XHR0aGlzLmdhcHMgPSB0cGwuZ2FwcztcclxuXHRcdFx0dGhpcy5wYXJ0cyA9IHRwbC5wYXJ0cztcclxuXHRcdFx0cmV0dXJuO1xyXG5cdFx0fTtcclxuXHRcdHRoaXMuc3JjID0gdHBsO1xyXG5cdFx0dGhpcy5wYXJ0cyA9IFtdO1xyXG5cdFx0dGhpcy5nYXBzID0gW107XHJcblx0XHRyZXR1cm4gdGhpcy5wYXJzZSh0cGwsIHZhbHVlUGFyc2VGbik7XHJcblx0fTtcclxuXHJcblx0cGFyc2UodHBsLCB2YWx1ZVBhcnNlRm46IFZhbHVlUGFyc2VGbil7XHJcblx0XHR2YXIgZ2FwU3RyQXJyID0gdHBsLm1hdGNoKGdhcFJlKTtcclxuXHRcdGlmICghZ2FwU3RyQXJyKXtcclxuXHRcdFx0dGhpcy5pc1N0cmluZyA9IHRydWU7XHJcblx0XHRcdHRoaXMucGFydHMgPSBbdHBsXTtcclxuXHRcdFx0cmV0dXJuO1xyXG5cdFx0fTtcclxuXHRcdHRoaXMuZ2FwcyA9IGdhcFN0ckFyci5tYXAoZnVuY3Rpb24ocGFydCl7XHJcblx0XHRcdHZhciBwYXJ0VmFsdWUgPSBwYXJ0LnNsaWNlKDIsIC0xKTtcclxuXHRcdFx0dmFyIHBhcnRSZXMgPSB2YWx1ZVBhcnNlRm4ocGFydFZhbHVlKTtcclxuXHRcdFx0cGFydFJlcy5lc2NhcGVkID0gcGFydFswXSAhPT0gXCIhXCI7XHJcblx0XHRcdHJldHVybiBwYXJ0UmVzO1xyXG5cdFx0fSk7XHRcdFxyXG5cdFx0dGhpcy5wYXJ0cyA9IHRwbC5zcGxpdChnYXBSZSk7XHJcblx0XHRyZXR1cm4gdGhpcztcclxuXHR9O1xyXG5cclxuXHRyZW5kZXIodmFsdWVSZW5kZXJGbjogVmFsdWVSZW5kZXJGbil7XHJcblx0XHR2YXIgZ2FwcyA9IHRoaXMuZ2Fwcy5tYXAodmFsdWVSZW5kZXJGbik7XHJcblx0XHR2YXIgcGFydHMgPSBtaXhBcnJheXModGhpcy5wYXJ0cywgZ2Fwcyk7XHJcblx0XHRyZXR1cm4gcGFydHMuam9pbignJyk7XHRcclxuXHR9O1xyXG5cdFxyXG59O1xyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIHJlYWQodHBsLCB2YWx1ZVBhcnNlRm46IFZhbHVlUGFyc2VGbil7XHJcblx0dmFyIHJlcyA9IG5ldyBTdHJUcGwodHBsLCB2YWx1ZVBhcnNlRm4pO1xyXG5cdGlmIChyZXMuaXNTdHJpbmcpe1xyXG5cdFx0cmVzID0gdHBsO1xyXG5cdH07XHJcblx0cmV0dXJuIHJlcztcclxufTtcclxuXHJcbnZhciBnYXBSZSA9IC9bXFwkXFwjXFwhXXsxfVxce1teXFx9XSpcXH0vZ207XHJcblxyXG5mdW5jdGlvbiBtaXhBcnJheXMoLi4ucmVzdC8qYXJyYXlzKi8pe1xyXG5cdHZhciBtYXhMZW5ndGggPSAwO1xyXG5cdHZhciB0b3RhbExlbmd0aCA9IDA7XHJcblx0Zm9yICh2YXIgaSA9IDA7IGkgPCBhcmd1bWVudHMubGVuZ3RoOyBpKyspe1xyXG5cdFx0bWF4TGVuZ3RoID0gTWF0aC5tYXgoYXJndW1lbnRzW2ldLmxlbmd0aCwgbWF4TGVuZ3RoKTtcclxuXHRcdHRvdGFsTGVuZ3RoICs9IGFyZ3VtZW50c1tpXS5sZW5ndGg7XHJcblx0fTtcclxuXHR2YXIgcmVzQXJyID0gW107XHJcblx0dmFyIGFycmF5Q291bnQgPSBhcmd1bWVudHMubGVuZ3RoO1xyXG5cdGZvciAodmFyIGlkID0gMDsgaWQgPCBtYXhMZW5ndGg7IGlkKyspe1x0XHRcdFx0XHJcblx0XHRmb3IgKHZhciBqID0gMDsgaiA8IGFycmF5Q291bnQ7IGorKyl7XHJcblx0XHRcdGlmIChhcmd1bWVudHNbal0ubGVuZ3RoID4gaWQpe1xyXG5cdFx0XHRcdHJlc0Fyci5wdXNoKGFyZ3VtZW50c1tqXVtpZF0pO1xyXG5cdFx0XHR9O1xyXG5cdFx0fTtcclxuXHR9O1xyXG5cdHJldHVybiByZXNBcnI7XHJcbn07IiwiXCJ1c2Ugc3RyaWN0XCI7XHJcblxyXG5pbXBvcnQgKiBhcyBnYXBDbGFzc01nciBmcm9tICcuL2dhcFNlcnZlcic7XHJcbmltcG9ydCB7R2FwfSBmcm9tICcuL2NsaWVudC9nYXBDbGFzc01ncic7XHJcbmltcG9ydCByZW5kZXJUcGxVbmJvdW5kIGZyb20gJy4vdHBsUmVuZGVyJztcclxuZXhwb3J0IHZhciByZW5kZXJUcGwgPSByZW5kZXJUcGxVbmJvdW5kLmJpbmQobnVsbCwgZ2FwQ2xhc3NNZ3IpO1xyXG52YXIgbWogPSByZXF1aXJlKCdtaWNyby1qYWRlJyk7XHJcblxyXG5leHBvcnQgaW50ZXJmYWNlIElBc3ROb2RlIHtcclxuICAgIHR5cGU6IHN0cmluZztcclxuXHRjaGlsZHJlbjogSUFzdE5vZGVbXTtcclxuXHR0YWdOYW1lPzogc3RyaW5nO1xyXG5cdGF0dHJzOiBhbnk7XHJcblx0dGV4dDogc3RyaW5nO1xyXG5cdHBhcmVudDogSUFzdE5vZGU7XHJcblx0dmFsdWU/OiB7XHJcblx0XHRwYXRoOiBzdHJpbmcsXHJcblx0XHRlc2NhcGVkOiBib29sZWFuXHJcblx0fTtcclxufTtcclxuXHJcbmV4cG9ydCB0eXBlIElUcGxQYXJ0ID0gc3RyaW5nIHwgR2FwO1xyXG5cclxuZXhwb3J0IHR5cGUgVHBsID0gSVRwbFBhcnRbXTtcclxuXHJcbmZ1bmN0aW9uIHBhcnNlR2FwKG5vZGU6IElBc3ROb2RlLCBodG1sOiBzdHJpbmcsIHBhcmVudE1ldGE6IEdhcCk6IEdhcHtcclxuXHR2YXIgdGFnTWV0YSA9IGdhcENsYXNzTWdyLnBhcnNlKG5vZGUsIGh0bWwsIHBhcmVudE1ldGEpO1xyXG5cdHJldHVybiB0YWdNZXRhO1xyXG59O1xyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIHJlYWRUcGwoYXN0OiBJQXN0Tm9kZSwgY29kZT86IHN0cmluZywgcGFyZW50TWV0YT86IEdhcCk6IFRwbHtcclxuXHJcblx0ZnVuY3Rpb24gaXRlcmF0ZShjaGlsZHJlbjogSUFzdE5vZGVbXSk6IFRwbHtcclxuXHRcdHZhciBwYXJ0cyA9IFtdO1xyXG5cdFx0Y2hpbGRyZW4uZm9yRWFjaChmdW5jdGlvbihub2RlLCBpZCl7XHJcblx0XHRcdHZhciB0YWdNZXRhID0gcGFyc2VHYXAobm9kZSwgY29kZSwgcGFyZW50TWV0YSk7XHJcblx0XHRcdGlmICh0YWdNZXRhKXtcdFx0XHRcdFxyXG5cdFx0XHRcdHBhcnRzLnB1c2godGFnTWV0YSk7XHRcdFx0XHRcclxuXHRcdFx0XHRyZXR1cm47IFxyXG5cdFx0XHR9O1x0XHJcblx0XHRcdGlmICghbm9kZS5jaGlsZHJlbiB8fCBub2RlLmNoaWxkcmVuLmxlbmd0aCA9PSAwKXtcclxuXHRcdFx0XHRwYXJ0cy5wdXNoKG1qLnJlbmRlcihub2RlLCB7fSkpO1x0XHRcdFx0XHJcblx0XHRcdFx0cmV0dXJuO1xyXG5cdFx0XHR9O1xyXG5cdFx0XHR2YXIgd3JhcCA9IG1qLnJlbmRlcldyYXBwZXIobm9kZSk7XHJcblx0XHRcdHBhcnRzLnB1c2god3JhcFswXSk7XHJcblx0XHRcdHBhcnRzID0gcGFydHMuY29uY2F0KGl0ZXJhdGUobm9kZS5jaGlsZHJlbikpO1x0XHRcclxuXHRcdFx0aWYgKHdyYXBbMV0pe1xyXG5cdFx0XHRcdHBhcnRzLnB1c2god3JhcFsxXSk7XHJcblx0XHRcdH1cclxuXHRcdH0pO1xyXG5cdFx0cmV0dXJuIHBhcnRzO1xyXG5cdH07XHJcblxyXG5cdHJldHVybiBpdGVyYXRlKGFzdC5jaGlsZHJlbik7XHJcbn07XHJcblxyXG4vLyBmdW5jdGlvbiB0cGxUb0pzb24odHBsKXsgLy8/XHJcbi8vIFx0dmFyIHBhcnRzID0gdHBsLm1hcChmdW5jdGlvbihwYXJ0KXtcclxuLy8gXHRcdGlmICh0eXBlb2YgcGFydCA9PSBcInN0cmluZ1wiKXtcclxuLy8gXHRcdFx0cmV0dXJuIHBhcnQ7XHJcbi8vIFx0XHR9O1xyXG4vLyBcdFx0cmV0dXJuIGdhcENsYXNzTWdyLnRvSnNvbihwYXJ0KTtcclxuLy8gXHR9KTtcclxuLy8gXHRyZXR1cm4gcGFydHM7XHJcbi8vIH07XHJcbiIsIlwidXNlIHN0cmljdFwiO1xyXG5cclxuaW1wb3J0ICogYXMgdXRpbHMgZnJvbSAnLi91dGlscyc7XHJcbmltcG9ydCB7VHBsfSBmcm9tICcuL3RwbE1ncic7XHJcbmltcG9ydCB7RmdJbnN0YW5jZX0gZnJvbSAnLi9jbGllbnQvZmdJbnN0YW5jZSc7XHJcbmltcG9ydCB7R2FwfSBmcm9tICcuL2NsaWVudC9nYXBDbGFzc01ncic7XHJcblxyXG5pbnRlcmZhY2UgSVRwbENvbnRleHR7XHJcblx0cmVuZGVyR2FwOiBGdW5jdGlvbjtcclxuXHRjb250ZXh0OiBGZ0luc3RhbmNlO1xyXG59O1xyXG5cclxuLyoqXHJcbiAqIFJlbmRlcnMgdGVtcGxhdGUuXHJcbiAqIEBwYXJhbSB7T2JqZWN0W119IHRwbCAtIGFycmF5IG9mIHBhdGgncyBwYXJ0cy5cclxuICogQHBhcmFtIHtPYmplY3R9IHBhcmVudCAtIHBhcmVudCBmb3IgYSB0ZW1wbGF0ZS5cclxuICogQHBhcmFtIHtPYmplY3R9IGRhdGEgLSBkYXRhIG9iamVjdCB0byByZW5kZXIuXHJcbiAqIEBwYXJhbSB7T2JqZWN0fSBtZXRhIC0gbWV0YSBtb2RpZmllci5cclxuICogQHJldHVybnMge3N0cmluZ30gcmVzdWx0IGNvZGUuXHJcbiAqL1xyXG5leHBvcnQgZGVmYXVsdCBmdW5jdGlvbiByZW5kZXJUcGwodHBsOiBUcGwsIHBhcmVudDogR2FwLCBkYXRhOiBhbnksIG1ldGFNb2Qpe1xyXG5cdHZhciBzZWxmOiBJVHBsQ29udGV4dCA9IHRoaXM7XHJcblx0dmFyIHBhcnRzID0gdHBsLm1hcChmdW5jdGlvbihwYXJ0LCBwYXJ0SWQpe1xyXG5cdFx0aWYgKHR5cGVvZiBwYXJ0ID09PSBcInN0cmluZ1wiKXtcclxuXHRcdFx0cmV0dXJuIHBhcnQ7XHJcblx0XHR9O1xyXG5cdFx0dmFyIHBhcnRNZXRhID0gdXRpbHMuc2ltcGxlQ2xvbmUocGFydCk7XHJcblx0XHRpZiAobWV0YU1vZCl7XHJcblx0XHRcdGlmICh0eXBlb2YgbWV0YU1vZCA9PT0gXCJmdW5jdGlvblwiKXtcclxuXHRcdFx0XHRwYXJ0TWV0YSA9IG1ldGFNb2QocGFydE1ldGEsIHBhcnRJZCk7XHJcblx0XHRcdH1lbHNle1xyXG5cdFx0XHRcdHBhcnRNZXRhID0gdXRpbHMuZXh0ZW5kKHBhcnRNZXRhLCBtZXRhTW9kIHx8IHt9KTtcdFx0XHRcclxuXHRcdFx0fTtcdFxyXG5cdFx0fTtcdFx0XHJcblx0XHRyZXR1cm4gc2VsZi5yZW5kZXJHYXAoc2VsZi5jb250ZXh0LCBwYXJlbnQsIGRhdGEsIHBhcnRNZXRhKTtcclxuXHR9KTtcclxuXHR2YXIgY29kZSA9IHBhcnRzLmpvaW4oJycpO1xyXG5cdHJldHVybiBjb2RlO1xyXG59OyIsIlwidXNlIHN0cmljdFwiO1xyXG5cclxuaW1wb3J0ICogYXMgdmFsdWVNZ3IgZnJvbSAnLi92YWx1ZU1ncic7XHJcbmV4cG9ydCAqIGZyb20gJy4vdXRpbHMvdHBsVXRpbHMnO1xyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIG9iakZvcihvYmo6IE9iamVjdCwgZm46IEZ1bmN0aW9uKXtcclxuXHRmb3IgKHZhciBpIGluIG9iail7XHJcblx0XHRmbihvYmpbaV0sIGksIG9iaik7XHJcblx0fTtcclxufTtcclxuXHJcbmV4cG9ydCBmdW5jdGlvbiBvYmpNYXAob2JqOiBPYmplY3QsIGZuOiBGdW5jdGlvbil7XHJcblx0dmFyIG5ld09iaiA9IHt9O1xyXG5cdG9iakZvcihvYmosIGZ1bmN0aW9uKGl0ZW0sIGlkKXtcclxuXHRcdHZhciBuZXdJdGVtID0gZm4oaXRlbSwgaWQsIG9iaik7XHJcblx0XHRuZXdPYmpbaWRdID0gbmV3SXRlbTtcclxuXHR9KTtcclxuXHRyZXR1cm4gbmV3T2JqO1xyXG59O1xyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIG9ialBhdGgocGF0aDogQXJyYXk8c3RyaW5nPiwgb2JqOiBPYmplY3QsIG5ld1ZhbD86IGFueSl7XHJcblx0aWYgKHBhdGgubGVuZ3RoIDwgMSl7XHJcblx0XHRpZiAoYXJndW1lbnRzLmxlbmd0aCA+IDIpe1xyXG5cdFx0XHR0aHJvdyAncm9vdCByZXdyaXR0aW5nIGlzIG5vdCBzdXBwb3J0ZWQnO1xyXG5cdFx0fTtcclxuXHRcdHJldHVybiBvYmo7XHJcblx0fTtcclxuXHR2YXIgcHJvcE5hbWUgPSBwYXRoWzBdO1xyXG5cdGlmIChwYXRoLmxlbmd0aCA9PT0gMSl7XHJcblx0XHRpZiAoYXJndW1lbnRzLmxlbmd0aCA+IDIpe1xyXG5cdFx0XHRvYmpbcHJvcE5hbWVdID0gbmV3VmFsOyBcclxuXHRcdH07XHRcdFx0XHRcclxuXHRcdHJldHVybiBvYmpbcHJvcE5hbWVdO1x0XHJcblx0fTtcclxuXHR2YXIgc3ViT2JqID0gb2JqW3Byb3BOYW1lXTtcclxuXHRpZiAoc3ViT2JqID09PSB1bmRlZmluZWQpe1xyXG5cdFx0Ly90aHJvdyBuZXcgRXJyb3IoXCJDYW5ub3QgcmVhZCBcIiArIHByb3BOYW1lICsgXCIgb2YgdW5kZWZpbmVkXCIpO1xyXG5cdFx0cmV0dXJuIHVuZGVmaW5lZDsgLy8gdGhyb3c/XHJcblx0fTtcdFx0XHJcblx0aWYgKGFyZ3VtZW50cy5sZW5ndGggPiAyKXtcclxuXHRcdHJldHVybiBvYmpQYXRoKHBhdGguc2xpY2UoMSksIHN1Yk9iaiwgbmV3VmFsKTtcclxuXHR9O1xyXG5cdHJldHVybiBvYmpQYXRoKHBhdGguc2xpY2UoMSksIHN1Yk9iaik7XHJcbn07XHJcblxyXG5leHBvcnQgZnVuY3Rpb24gYXR0cnNUb09iaihhdHRycyl7XHJcblx0dmFyIHJlcyA9IHt9O1xyXG5cdGF0dHJzLmZvckVhY2goZnVuY3Rpb24oaSl7XHJcblx0XHRyZXNbaS5uYW1lXSA9IGkudmFsdWU7XHJcblx0fSk7IFxyXG5cdHJldHVybiByZXM7XHJcbn07XHJcblxyXG5leHBvcnQgZnVuY3Rpb24gc2ltcGxlQ2xvbmUob2JqKXtcclxuXHR2YXIgcmVzID0ge307XHJcblx0Zm9yICh2YXIgaSBpbiBvYmope1xyXG5cdFx0cmVzW2ldID0gb2JqW2ldO1xyXG5cdH07XHJcblx0cmV0dXJuIHJlcztcclxufTtcclxuXHJcbmV4cG9ydCBmdW5jdGlvbiBtaXhBcnJheXMoLyphcnJheXMqLyl7XHJcblx0dmFyIGlkID0gMDtcclxuXHR2YXIgbWF4TGVuZ3RoID0gMDtcclxuXHR2YXIgdG90YWxMZW5ndGggPSAwO1xyXG5cdGZvciAodmFyIGkgPSAwOyBpIDwgYXJndW1lbnRzLmxlbmd0aDsgaSsrKXtcclxuXHRcdG1heExlbmd0aCA9IE1hdGgubWF4KGFyZ3VtZW50c1tpXS5sZW5ndGgsIG1heExlbmd0aCk7XHJcblx0XHR0b3RhbExlbmd0aCArPSBhcmd1bWVudHNbaV0ubGVuZ3RoO1xyXG5cdH07XHJcblx0dmFyIHJlc0FyciA9IFtdO1xyXG5cdHZhciBhcnJheUNvdW50ID0gYXJndW1lbnRzLmxlbmd0aDtcclxuXHRmb3IgKHZhciBpZCA9IDA7IGlkIDwgbWF4TGVuZ3RoOyBpZCsrKXtcdFx0XHRcdFxyXG5cdFx0Zm9yICh2YXIgaSA9IDA7IGkgPCBhcnJheUNvdW50OyBpKyspe1xyXG5cdFx0XHRpZiAoYXJndW1lbnRzW2ldLmxlbmd0aCA+IGlkKXtcclxuXHRcdFx0XHRyZXNBcnIucHVzaChhcmd1bWVudHNbaV1baWRdKTtcclxuXHRcdFx0fTtcclxuXHRcdH07XHJcblx0fTtcclxuXHRyZXR1cm4gcmVzQXJyO1xyXG59O1xyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIHJlc29sdmVQYXRoKHJvb3RQYXRoLCByZWxQYXRoKXtcclxuXHR2YXIgcmVzUGF0aCA9IHJvb3RQYXRoLnNsaWNlKCk7XHJcblx0cmVsUGF0aCA9IHJlbFBhdGggfHwgW107XHJcblx0cmVsUGF0aC5mb3JFYWNoKGZ1bmN0aW9uKGtleSl7XHJcblx0XHRpZiAoa2V5ID09PSBcIl9yb290XCIpe1xyXG5cdFx0XHRyZXNQYXRoID0gW107XHJcblx0XHRcdHJldHVybjtcclxuXHRcdH07XHJcblx0XHRyZXNQYXRoLnB1c2goa2V5KTtcclxuXHR9KTtcclxuXHRyZXR1cm4gcmVzUGF0aDtcclxufTtcclxuXHJcbmV4cG9ydCBmdW5jdGlvbiBnZXRTY29wZVBhdGgobWV0YSl7XHJcblx0dmFyXHRwYXJlbnRQYXRoID0gW107XHJcblx0aWYgKG1ldGEucGFyZW50KXtcclxuXHRcdHBhcmVudFBhdGggPSBtZXRhLnBhcmVudC5zY29wZVBhdGg7XHJcblx0XHRpZiAoIXBhcmVudFBhdGgpe1xyXG5cdFx0XHR0aHJvdyBuZXcgRXJyb3IoXCJQYXJlbnQgZWxtIG11c3QgaGF2ZSBzY29wZVBhdGhcIik7XHJcblx0XHR9O1xyXG5cdH07XHJcblx0cmV0dXJuIHJlc29sdmVQYXRoKHBhcmVudFBhdGgsIG1ldGEucGF0aCk7XHJcbn07XHJcblxyXG5leHBvcnQgZnVuY3Rpb24ga2V5VmFsdWVUb09iaihhcnIsIGtleU5hbWUsIHZhbHVlTmFtZSl7XHJcblx0a2V5TmFtZSA9IGtleU5hbWUgfHwgJ2tleSc7XHJcblx0dmFsdWVOYW1lID0gdmFsdWVOYW1lIHx8ICd2YWx1ZSc7XHJcblx0dmFyIHJlcyA9IHt9O1xyXG5cdGFyci5mb3JFYWNoKGZ1bmN0aW9uKGkpe1xyXG5cdFx0cmVzW2lba2V5TmFtZV1dID0gaVt2YWx1ZU5hbWVdO1xyXG5cdH0pOyBcclxuXHRyZXR1cm4gcmVzO1xyXG59O1xyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIG9ialRvS2V5VmFsdWUob2JqLCBrZXlOYW1lLCB2YWx1ZU5hbWUpe1xyXG5cdGtleU5hbWUgPSBrZXlOYW1lIHx8ICdrZXknO1xyXG5cdHZhbHVlTmFtZSA9IHZhbHVlTmFtZSB8fCAndmFsdWUnO1xyXG5cdHZhciByZXMgPSBbXTtcclxuXHRmb3IgKHZhciBpIGluIG9iail7XHJcblx0XHR2YXIgaXRlbSA9IHt9O1xyXG5cdFx0aXRlbVtrZXlOYW1lXSA9IGk7XHJcblx0XHRpdGVtW3ZhbHVlTmFtZV0gPSBvYmpbaV07XHJcblx0XHRyZXMucHVzaChpdGVtKTtcclxuXHR9O1xyXG5cdHJldHVybiByZXM7XHJcbn07XHJcblxyXG5leHBvcnQgZnVuY3Rpb24gY2xvbmUob2JqKXtcclxuXHRyZXR1cm4gT2JqZWN0LmNyZWF0ZShvYmopO1xyXG59O1xyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIGNvbmNhdE9iaihvYmoxLCBvYmoyKXtcclxuXHR2YXIgcmVzID0gc2ltcGxlQ2xvbmUob2JqMSk7XHJcblx0Zm9yICh2YXIgaSBpbiBvYmoyKXtcclxuXHRcdHJlc1tpXSA9IG9iajJbaV07XHJcblx0fTtcclxuXHRyZXR1cm4gcmVzO1xyXG59O1xyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIGV4dGVuZChkZXN0LCBzcmMpe1x0XHJcblx0Zm9yICh2YXIgaSBpbiBzcmMpe1xyXG5cdFx0ZGVzdFtpXSA9IHNyY1tpXTtcclxuXHR9O1xyXG5cdHJldHVybiBkZXN0O1xyXG59O1xyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIGZpbmRTY29wZUhvbGRlcihtZXRhKXtcclxuICAgIHZhciBub2RlID0gbWV0YS5wYXJlbnQ7XHJcbiAgICB3aGlsZSAobm9kZSl7XHJcbiAgICAgICAgaWYgKCFub2RlLmlzU2NvcGVIb2xkZXIpe1xyXG4gICAgICAgICAgICByZXR1cm4gbm9kZTtcclxuICAgICAgICB9O1xyXG4gICAgICAgIG5vZGUgPSBub2RlLnBhcmVudDsgIFxyXG4gICAgfTtcclxuICAgIHRocm93IG5ldyBFcnJvcignY2Fubm90IGZpbmQgc2NvcGUgaG9sZGVyJyk7XHJcbn07XHJcblxyXG5leHBvcnQgZnVuY3Rpb24gcGFyc2VQYXRoKHBhcnNlZE5vZGUpe1xyXG5cdGlmIChwYXJzZWROb2RlLmF0dHJzLmNsYXNzKXtcclxuXHRcdHZhciBwYXJ0cyA9IHBhcnNlZE5vZGUuYXR0cnMuY2xhc3MudmFsdWUuc3BsaXQoJyAnKTtcclxuXHRcdHZhciBwYXJzZWQgPSAgdmFsdWVNZ3IucmVhZChwYXJ0cyk7XHJcblx0XHRyZXR1cm4gcGFyc2VkO1xyXG5cdH07XHJcblx0cmV0dXJuIHZhbHVlTWdyLnJlYWQoW10pO1xyXG59O1xyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIGRlZXBDbG9uZShvYmo6IE9iamVjdCk6IE9iamVjdHtcclxuXHRpZiAodHlwZW9mIG9iaiA9PT0gXCJvYmplY3RcIil7XHJcblx0XHR2YXIgbWFwID0gQXJyYXkuaXNBcnJheShvYmopXHJcblx0XHRcdD8gb2JqLm1hcC5iaW5kKG9iailcclxuXHRcdFx0OiBvYmpNYXAuYmluZChudWxsLCBvYmopO1xyXG5cdFx0cmV0dXJuIG1hcChkZWVwQ2xvbmUpO1xyXG5cdH07XHJcblx0cmV0dXJuIG9iajtcclxufTtcclxuXHJcbmV4cG9ydCBmdW5jdGlvbiBlc2NhcGVIdG1sKGNvZGU6IHN0cmluZyk6IHN0cmluZ3tcclxuXHRyZXR1cm4gY29kZVxyXG5cdFx0LnJlcGxhY2UoL1wiL2csJyZxdW90OycpXHJcblx0XHQucmVwbGFjZSgvJi9nLCcmYW1wOycpXHJcblx0XHQucmVwbGFjZSgvPC9nLCcmbHQ7JylcclxuXHRcdC5yZXBsYWNlKC8+L2csJyZndDsnKTtcclxufTsiLCJpbXBvcnQgKiBhcyB1dGlscyBmcm9tICcuLi91dGlscyc7XHJcblxyXG52YXIgc2VsZkNsb3NpbmdUYWdzID0gW1wiYXJlYVwiLCBcImJhc2VcIiwgXCJiclwiLCBcImNvbFwiLCBcclxuXHRcImNvbW1hbmRcIiwgXCJlbWJlZFwiLCBcImhyXCIsIFwiaW1nXCIsIFxyXG5cdFwiaW5wdXRcIiwgXCJrZXlnZW5cIiwgXCJsaW5rXCIsIFxyXG5cdFwibWV0YVwiLCBcInBhcmFtXCIsIFwic291cmNlXCIsIFwidHJhY2tcIiwgXHJcblx0XCJ3YnJcIl07XHJcblxyXG5leHBvcnQgZnVuY3Rpb24gcmVuZGVyVGFnKHRhZ0luZm8pe1xyXG5cdHZhciBhdHRycyA9IHRhZ0luZm8uYXR0cnM7XHJcblx0aWYgKCFBcnJheS5pc0FycmF5KGF0dHJzKSl7XHJcblx0XHRhdHRycyA9IHV0aWxzLm9ialRvS2V5VmFsdWUoYXR0cnMsICduYW1lJywgJ3ZhbHVlJyk7XHJcblx0fTtcclxuXHR2YXIgYXR0ckNvZGUgPSBcIlwiO1xyXG5cdGlmIChhdHRycy5sZW5ndGggPiAwKXtcclxuXHQgICAgYXR0ckNvZGUgPSBcIiBcIiArIGF0dHJzLm1hcChmdW5jdGlvbihhdHRyKXtcclxuXHRcdCAgcmV0dXJuIGF0dHIubmFtZSArICc9XCInICsgYXR0ci52YWx1ZSArICdcIic7XHJcblx0ICAgfSkuam9pbignICcpO1xyXG5cdH07XHJcblx0dmFyIHRhZ0hlYWQgPSB0YWdJbmZvLm5hbWUgKyBhdHRyQ29kZTtcclxuXHRpZiAofnNlbGZDbG9zaW5nVGFncy5pbmRleE9mKHRhZ0luZm8ubmFtZSkpe1xyXG5cdFx0cmV0dXJuIFwiPFwiICsgdGFnSGVhZCArIFwiIC8+XCI7XHJcblx0fTtcclxuXHR2YXIgb3BlblRhZyA9IFwiPFwiICsgdGFnSGVhZCArIFwiPlwiO1xyXG5cdHZhciBjbG9zZVRhZyA9IFwiPC9cIiArIHRhZ0luZm8ubmFtZSArIFwiPlwiO1xyXG5cdHZhciBjb2RlID0gb3BlblRhZyArICh0YWdJbmZvLmlubmVySFRNTCB8fCBcIlwiKSArIGNsb3NlVGFnO1xyXG5cdHJldHVybiBjb2RlO1xyXG59O1xyXG5cclxuIiwiZnVuY3Rpb24gVHJlZU5vZGUoa2luZCwgcGFyZW50LCBkYXRhKXtcclxuICAgIHRoaXMuY2hpbGRyZW4gPSBraW5kID09ICdhcnJheSdcclxuICAgICAgICA/IFtdXHJcbiAgICAgICAgOiB7fTsgICBcclxuICAgIHRoaXMucGFyZW50ID0gcGFyZW50O1xyXG4gICAgdGhpcy5kYXRhID0gZGF0YTtcclxuICAgIHRoaXMuY2hpbGRDb3VudCA9IDA7XHJcbn07XHJcblxyXG5UcmVlTm9kZS5wcm90b3R5cGUuYWRkQ2hpbGQgPSBmdW5jdGlvbihuYW1lLCBkYXRhKXtcclxuICAgIGlmICh0aGlzLmtpbmQgPT0gJ2FycmF5Jyl7XHJcbiAgICAgICAgZGF0YSA9IG5hbWU7XHJcbiAgICAgICAgbmFtZSA9IHRoaXMuY2hpbGRyZW4ubGVuZ3RoO1xyXG4gICAgfTtcclxuICAgIGRhdGEgPSBkYXRhIHx8IHRoaXMucm9vdC5pbml0VHJlZU5vZGUoKTtcclxuICAgIHZhciBjaGlsZCA9IG5ldyBUcmVlTm9kZSh0aGlzLmtpbmQsIHRoaXMsIGRhdGEpO1xyXG4gICAgY2hpbGQuaWQgPSBuYW1lO1xyXG4gICAgY2hpbGQucGF0aCA9IHRoaXMucGF0aC5jb25jYXQoW25hbWVdKTtcclxuICAgIGNoaWxkLnJvb3QgPSB0aGlzLnJvb3Q7XHJcbiAgICB0aGlzLmNoaWxkQ291bnQrKztcclxuICAgIHRoaXMuY2hpbGRyZW5bbmFtZV0gPSBjaGlsZDtcclxuICAgIHJldHVybiBjaGlsZDtcclxufTtcclxuXHJcblRyZWVOb2RlLnByb3RvdHlwZS5nZXRQYXJlbnRzID0gZnVuY3Rpb24oKXtcclxuICAgIHZhciByZXMgPSBbXTsgICAgXHJcbiAgICB2YXIgbm9kZSA9IHRoaXM7XHJcbiAgICB3aGlsZSAodHJ1ZSl7XHJcbiAgICAgICAgbm9kZSA9IG5vZGUucGFyZW50O1xyXG4gICAgICAgIGlmICghbm9kZSl7XHJcbiAgICAgICAgICAgIHJldHVybiByZXM7XHJcbiAgICAgICAgfTtcclxuICAgICAgICByZXMucHVzaChub2RlKTtcclxuICAgIH07ICBcclxufTtcclxuXHJcblRyZWVOb2RlLnByb3RvdHlwZS5jaGlsZEl0ZXJhdGUgPSBmdW5jdGlvbihmbil7XHJcbiAgICBmb3IgKHZhciBpIGluIHRoaXMuY2hpbGRyZW4pe1xyXG4gICAgICAgIGZuLmNhbGwodGhpcywgdGhpcy5jaGlsZHJlbltpXSwgaSk7ICBcclxuICAgIH07XHJcbn07XHJcblxyXG5UcmVlTm9kZS5wcm90b3R5cGUuZ2V0Q2hpbGRBcnIgPSBmdW5jdGlvbigpe1xyXG4gICAgaWYgKHRoaXMua2luZCA9PSAnYXJyYXknKXtcclxuICAgICAgICByZXR1cm4gdGhpcy5jaGlsZHJlbjtcclxuICAgIH07XHJcbiAgICB2YXIgcmVzID0gW107XHJcbiAgICB0aGlzLmNoaWxkSXRlcmF0ZShmdW5jdGlvbihjaGlsZCl7XHJcbiAgICAgICAgcmVzLnB1c2goY2hpbGQpO1xyXG4gICAgfSk7ICAgICAgICAgICAgXHJcbiAgICByZXR1cm4gcmVzO1xyXG59O1xyXG5cclxuVHJlZU5vZGUucHJvdG90eXBlLmdldERlZXBDaGlsZEFyciA9IGZ1bmN0aW9uKCl7XHJcbiAgICB2YXIgcmVzID0gdGhpcy5nZXRDaGlsZEFycigpO1xyXG4gICAgdGhpcy5jaGlsZEl0ZXJhdGUoZnVuY3Rpb24oY2hpbGQpe1xyXG4gICAgICAgcmVzID0gcmVzLmNvbmNhdChjaGlsZC5nZXREZWVwQ2hpbGRBcnIoKSk7XHJcbiAgICB9KTtcclxuICAgIHJldHVybiByZXM7XHJcbn07XHJcblxyXG5UcmVlTm9kZS5wcm90b3R5cGUucmVtb3ZlID0gZnVuY3Rpb24ocGF0aCl7XHJcbiAgICB2YXIgbGVhZktleSA9IHBhdGhbcGF0aC5sZW5ndGggLSAxXTtcclxuICAgIHZhciBicmFuY2hQYXRoID0gcGF0aC5zbGljZSgwLCAtMSk7XHJcbiAgICB2YXIgYnJhbmNoID0gdGhpcy5ieVBhdGgoYnJhbmNoUGF0aCk7XHJcbiAgICBicmFuY2guY2hpbGRDb3VudC0tO1xyXG4gICAgdmFyIHJlcyA9IGJyYW5jaC5jaGlsZHJlbltsZWFmS2V5XTtcclxuICAgIGRlbGV0ZSBicmFuY2guY2hpbGRyZW5bbGVhZktleV07ICAgXHJcbiAgICByZXR1cm4gcmVzOyBcclxufTtcclxuXHJcblRyZWVOb2RlLnByb3RvdHlwZS5ieVBhdGggPSBmdW5jdGlvbihwYXRoKXsgICAgXHJcbiAgICBpZiAocGF0aC5sZW5ndGggPT0gMCl7XHJcbiAgICAgICAgcmV0dXJuIHRoaXM7XHJcbiAgICB9O1xyXG4gICAgdmFyIG5vZGUgPSB0aGlzO1xyXG4gICAgd2hpbGUgKHRydWUpe1xyXG4gICAgICAgIHZhciBrZXkgPSBwYXRoWzBdO1xyXG4gICAgICAgIG5vZGUgPSBub2RlLmNoaWxkcmVuW2tleV07XHJcbiAgICAgICAgaWYgKCFub2RlKXtcclxuICAgICAgICAgICAgcmV0dXJuIG51bGw7XHJcbiAgICAgICAgfTtcclxuICAgICAgICBwYXRoID0gcGF0aC5zbGljZSgxKTtcclxuICAgICAgICBpZiAocGF0aC5sZW5ndGggPT0gMCl7XHJcbiAgICAgICAgICAgIHJldHVybiBub2RlOyAgXHJcbiAgICAgICAgfTtcclxuICAgIH07XHJcbn07XHJcblxyXG5UcmVlTm9kZS5wcm90b3R5cGUuYWNjZXNzID0gZnVuY3Rpb24ocGF0aCl7XHJcbiAgICBpZiAocGF0aC5sZW5ndGggPT0gMCl7XHJcbiAgICAgICAgcmV0dXJuIHRoaXM7XHJcbiAgICB9O1xyXG4gICAgdmFyIG5vZGUgPSB0aGlzO1xyXG4gICAgd2hpbGUgKHRydWUpe1xyXG4gICAgICAgIHZhciBrZXkgPSBwYXRoWzBdO1xyXG4gICAgICAgIHZhciBwYXJlbnQgPSBub2RlO1xyXG4gICAgICAgIG5vZGUgPSBub2RlLmNoaWxkcmVuW2tleV07XHJcbiAgICAgICAgaWYgKCFub2RlKXtcclxuICAgICAgICAgICAgdmFyIGRhdGEgPSB0aGlzLnJvb3QuaW5pdFRyZWVOb2RlKCk7ICAgICAgICAgICAgICAgIFxyXG4gICAgICAgICAgICBub2RlID0gcGFyZW50LmFkZENoaWxkKGtleSwgZGF0YSk7XHJcbiAgICAgICAgICAgIHBhcmVudC5jaGlsZHJlbltrZXldID0gbm9kZTtcclxuICAgICAgICB9O1xyXG4gICAgICAgIHBhdGggPSBwYXRoLnNsaWNlKDEpO1xyXG4gICAgICAgIGlmIChwYXRoLmxlbmd0aCA9PSAwKXtcclxuICAgICAgICAgICAgcmV0dXJuIG5vZGU7ICBcclxuICAgICAgICB9O1xyXG4gICAgfTsgXHJcbn07XHJcblxyXG5leHBvcnQgZGVmYXVsdCBmdW5jdGlvbiBUcmVlSGVscGVyKG9wdHMsIHJvb3REYXRhPyl7XHJcbiAgICBvcHRzID0gb3B0cyB8fCB7fTtcclxuICAgIG9wdHMua2luZCA9IG9wdHMua2luZCB8fCAnYXJyYXknO1xyXG4gICAgdmFyIGluaXRUcmVlTm9kZSA9IG9wdHMuaW5pdFRyZWVOb2RlIHx8IGZ1bmN0aW9uKCl7XHJcbiAgICAgICAgcmV0dXJuIHt9O1xyXG4gICAgfTtcclxuICAgIHZhciBkYXRhID0gcm9vdERhdGEgfHwgaW5pdFRyZWVOb2RlKCk7XHJcbiAgICB2YXIgcm9vdFRyZWVOb2RlID0gbmV3IFRyZWVOb2RlKG9wdHMua2luZCwgbnVsbCwgZGF0YSk7XHJcbiAgICByb290VHJlZU5vZGUuaXNSb290ID0gdHJ1ZTtcclxuICAgIHJvb3RUcmVlTm9kZS5yb290ID0gcm9vdFRyZWVOb2RlO1xyXG4gICAgcm9vdFRyZWVOb2RlLnBhdGggPSBbXTtcclxuICAgIHJvb3RUcmVlTm9kZS5pbml0VHJlZU5vZGUgPSBpbml0VHJlZU5vZGU7XHJcbiAgICByZXR1cm4gcm9vdFRyZWVOb2RlO1xyXG59OyIsIlwidXNlIHN0cmljdFwiO1xyXG5cclxuaW1wb3J0ICogYXMgdXRpbHMgZnJvbSAnLi91dGlscyc7XHJcblxyXG5leHBvcnQgaW50ZXJmYWNlIElWYWx1ZVBhdGhJdGVtIHtcclxuICAgIG9wOiBzdHJpbmc7XHJcbn07XHJcblxyXG5leHBvcnQgaW50ZXJmYWNlIElWYWx1ZVBhdGgge1xyXG4gICAgcGF0aDogQXJyYXk8c3RyaW5nPjtcclxuXHRzb3VyY2U6IHN0cmluZztcclxuXHRlc2NhcGVkOiBib29sZWFuO1xyXG5cdHJhd1BhdGg6IEFycmF5PHN0cmluZyB8IElWYWx1ZVBhdGhJdGVtPjtcclxufTtcclxuXHJcbi8qKlxyXG4gKiBSZWFkcyBwYXRoIGFuZCByZXR1cm5zIHBhcnNlZCBwYXRoLlxyXG4gKiBAcGFyYW0ge3N0cmluZ1tdfSBwYXJ0cyAtIGFycmF5IG9mIHBhdGgncyBwYXJ0cy5cclxuICogQHBhcmFtIHtPYmplY3R9IGV4dHJhSW5mbyAtIGRhdGEgb2JqZWN0IHRvIGJlIGFkZGVkIHRvIHJlc3VsdC5cclxuICogQHJldHVybnMge09iamVjdH0gcGF0aCBvYmplY3QuXHJcbiAqL1xyXG5leHBvcnQgZnVuY3Rpb24gcmVhZChwYXJ0czogQXJyYXk8c3RyaW5nPiwgZXh0cmFJbmZvPzogT2JqZWN0KTogSVZhbHVlUGF0aHtcclxuXHR2YXIgc291cmNlID0gXCJkYXRhXCI7XHJcblx0dmFyIHBhdGggPSBwYXJ0cy5tYXAoZnVuY3Rpb24ocGFydCl7XHRcdFxyXG5cdFx0aWYgKHBhcnRbMF0gPT09ICckJyl7XHJcblx0XHRcdHJldHVybiB7XHJcblx0XHRcdFx0b3A6IHBhcnQuc2xpY2UoMSlcclxuXHRcdFx0fTtcclxuXHRcdH07XHJcblx0XHRyZXR1cm4gcGFydDsgXHJcblx0fSk7XHJcblx0dmFyIHJlcyA9IHtcclxuXHRcdFwic291cmNlXCI6IHNvdXJjZSxcclxuXHRcdFwicGF0aFwiOiBudWxsLFxyXG5cdFx0XCJyYXdQYXRoXCI6IHBhdGgsXHJcblx0XHRcImVzY2FwZWRcIjogdHJ1ZVxyXG5cdH07XHJcblx0aWYgKGV4dHJhSW5mbyl7XHJcblx0XHR1dGlscy5leHRlbmQocmVzLCBleHRyYUluZm8pO1xyXG5cdH07XHJcblx0cmV0dXJuIHJlcztcclxufTtcclxuXHJcbi8qKlxyXG4gKiBQYXJzZXMgZG90IHBhdGggYW5kIHJldHVybnMgcGFyc2VkIHBhdGguXHJcbiAqIEBwYXJhbSB7c3RyaW5nfSBzdHIgLSB0ZXh0IG9mIHRoZSBwYXRoIHNlcGFyYXRlZCBieSBkb3RzLlxyXG4gKiBAcGFyYW0ge09iamVjdH0gZXh0cmFJbmZvIC0gZGF0YSBvYmplY3QgdG8gYmUgYWRkZWQgdG8gcmVzdWx0LlxyXG4gKiBAcmV0dXJucyB7T2JqZWN0fSBwYXRoIG9iamVjdC5cclxuICovXHJcbmV4cG9ydCBmdW5jdGlvbiBwYXJzZShzdHI6IHN0cmluZywgZXh0cmFJbmZvPzogT2JqZWN0KTogSVZhbHVlUGF0aHtcclxuXHR2YXIgcGFydHMgPSBzdHIudHJpbSgpLnNwbGl0KCcuJyk7XHJcblx0cmV0dXJuIHJlYWQocGFydHMsIGV4dHJhSW5mbyk7XHJcbn07XHJcblxyXG4vKipcclxuICogRmluZHMgdGhlIG5lYXJlc3Qgc2NvcGUgYW5kIHJldHVybiBpdHMgcGF0aC5cclxuICogQHBhcmFtIHtPYmplY3R9IG1ldGEgLSBnYXAgbWV0YSBjb25uZWN0ZWQgdG8gdGhlIHBhdGguXHJcbiAqIEByZXR1cm5zIHtPYmplY3R9IHNjb3BlIHBhdGggb2JqZWN0LlxyXG4gKi9cclxuZnVuY3Rpb24gZmluZFNjb3BlUGF0aChtZXRhOiBhbnkpe1xyXG5cdHZhciBwYXJlbnQgPSBtZXRhLnBhcmVudDtcclxuXHR3aGlsZSAodHJ1ZSl7XHRcdFxyXG5cdFx0aWYgKCFwYXJlbnQpe1xyXG5cdFx0XHRyZXR1cm4gW107XHJcblx0XHR9O1xyXG5cdFx0aWYgKHBhcmVudC5zY29wZVBhdGgpe1xyXG5cdFx0XHRyZXR1cm4gcGFyZW50LnNjb3BlUGF0aDtcclxuXHRcdH07XHJcblx0XHRwYXJlbnQgPSBwYXJlbnQucGFyZW50O1xyXG5cdH07XHJcbn07XHJcblxyXG4vKipcclxuICogUmVzb2x2ZXMgdGhlIHBhdGggcmVtb3ZpbmcgYWxsIG9wZXJhdG9ycyBmcm9tIHBhdGggKGUuZy4gJHVwKS5cclxuICogQHBhcmFtIHtPYmplY3R9IG1ldGEgLSBnYXAgbWV0YSBjb25uZWN0ZWQgdG8gdGhlIHBhdGguXHJcbiAqIEBwYXJhbSB7T2JqZWN0fSBwYXRoIC0gdmFsdWUgcGF0aCBvYmplY3QuXHJcbiAqIEByZXR1cm5zIHtPYmplY3R9IHJlc29sdmVkIHBhdGggb2JqZWN0LlxyXG4gKi9cclxuZXhwb3J0IGZ1bmN0aW9uIHJlc29sdmVQYXRoKG1ldGE6IGFueSwgcGF0aDogSVZhbHVlUGF0aCk6IElWYWx1ZVBhdGh7XHJcblx0dmFyIHNjb3BlUGF0aCA9IGZpbmRTY29wZVBhdGgobWV0YSk7XHJcblx0dmFyIHJlczogSVZhbHVlUGF0aCA9IHtcclxuXHRcdHBhdGg6IG51bGwsXHJcblx0XHRyYXdQYXRoOiBwYXRoLnJhd1BhdGgsXHJcblx0XHRzb3VyY2U6IFwiZGF0YVwiLFxyXG5cdFx0ZXNjYXBlZDogcGF0aC5lc2NhcGVkXHJcblx0fTtcclxuXHRyZXMucGF0aCA9IHNjb3BlUGF0aC5zbGljZSgpO1xyXG5cdHBhdGgucmF3UGF0aC5mb3JFYWNoKGZ1bmN0aW9uKGtleSl7XHJcblx0XHRpZiAodHlwZW9mIGtleSA9PT0gXCJzdHJpbmdcIil7XHJcblx0XHRcdHJlcy5wYXRoLnB1c2goa2V5KTtcdFx0XHRcclxuXHRcdFx0cmV0dXJuO1xyXG5cdFx0fTtcclxuXHRcdGlmICgoa2V5IGFzIElWYWx1ZVBhdGhJdGVtKS5vcCA9PT0gXCJyb290XCIpe1xyXG5cdFx0XHRyZXMucGF0aCA9IFtdO1xyXG5cdFx0fSBlbHNlIGlmICgoa2V5IGFzIElWYWx1ZVBhdGhJdGVtKS5vcCA9PT0gXCJ1cFwiKXtcclxuXHRcdFx0cmVzLnBhdGgucG9wKCk7XHJcblx0XHR9O1xyXG5cdH0pO1xyXG5cdHJldHVybiByZXM7XHJcbn07XHJcblxyXG4vKipcclxuICogUmV0dXJucyB0aGUgdmFsdWUgYnkgZ2l2ZW4gcGF0aC5cclxuICogQHBhcmFtIHtPYmplY3R9IG1ldGEgLSBnYXAgbWV0YSBjb25uZWN0ZWQgdG8gdGhlIHBhdGguXHJcbiAqIEBwYXJhbSB7T2JqZWN0fSBkYXRhIC0gZGF0YSBvYmplY3QgcmVuZGVyaW5nIGluIGZnLlxyXG4gKiBAcGFyYW0ge09iamVjdH0gdmFsdWVQYXRoIC0gdmFsdWUgcGF0aCB0byBiZSBmZXRjaGVkLlxyXG4gKiBAcmV0dXJucyB7YW55fSBmZXRjaGVkIGRhdGEuXHJcbiAqL1xyXG5leHBvcnQgZnVuY3Rpb24gZ2V0VmFsdWUobWV0YTogYW55LCBkYXRhOiBPYmplY3QsIHZhbHVlUGF0aDogSVZhbHVlUGF0aCl7XHJcblx0dmFyIHNvdXJjZVRhYmxlID0ge1xyXG5cdFx0XCJkYXRhXCI6IGRhdGEsXHJcblx0XHRcIm1ldGFcIjogbWV0YVxyXG5cdH07XHJcblx0dmFyIHNvdXJjZURhdGEgPSBzb3VyY2VUYWJsZVt2YWx1ZVBhdGguc291cmNlXTtcclxuXHR2YXIgcmVzID0gdXRpbHMub2JqUGF0aCh2YWx1ZVBhdGgucGF0aCwgc291cmNlRGF0YSk7XHJcblx0aWYgKHZhbHVlUGF0aC5lc2NhcGVkKXtcclxuXHRcdHJlcyA9IHV0aWxzLmVzY2FwZUh0bWwocmVzKTtcdFx0XHJcblx0fTtcclxuXHRyZXR1cm4gcmVzO1xyXG59O1xyXG5cclxuLyoqXHJcbiAqIFJldHVybnMgdGhlIHF1ZXJpZWQgdmFsdWUgYXMgc3RyaW5nLlxyXG4gKiBAcGFyYW0ge09iamVjdH0gbWV0YSAtIGdhcCBtZXRhIGNvbm5lY3RlZCB0byB0aGUgcGF0aC5cclxuICogQHBhcmFtIHtPYmplY3R9IGRhdGEgLSBkYXRhIG9iamVjdCByZW5kZXJpbmcgaW4gZmcuXHJcbiAqIEBwYXJhbSB7T2JqZWN0fSByZXNvbHZlZFBhdGggLSByZXNvbHZlZCBwYXRoLlxyXG4gKiBAcmV0dXJucyB7c3RyaW5nfSByZW5kZXJlZCBzdHJpbmcuXHJcbiAqL1xyXG5leHBvcnQgZnVuY3Rpb24gcmVuZGVyKG1ldGE6IGFueSwgZGF0YTogT2JqZWN0LCByZXNvbHZlZFBhdGg6IElWYWx1ZVBhdGgpe1xyXG5cdHJldHVybiBnZXRWYWx1ZShtZXRhLCBkYXRhLCByZXNvbHZlZFBhdGgpLnRvU3RyaW5nKCk7XHJcbn07XHJcblxyXG4vKipcclxuICogUmVzb2x2ZSBwYXRoIGFuZCByZXR1cm5zIHRoZSBxdWVyaWVkIHZhbHVlIGFzIHN0cmluZy5cclxuICogQHBhcmFtIHtPYmplY3R9IG1ldGEgLSBnYXAgbWV0YSBjb25uZWN0ZWQgdG8gdGhlIHBhdGguXHJcbiAqIEBwYXJhbSB7T2JqZWN0fSBkYXRhIC0gZGF0YSBvYmplY3QgcmVuZGVyaW5nIGluIGZnLlxyXG4gKiBAcGFyYW0ge09iamVjdH0gcGF0aCAtIHVucmVzb2x2ZWQgcGF0aC5cclxuICogQHJldHVybnMge3N0cmluZ30gcmVuZGVyZWQgc3RyaW5nLlxyXG4gKi9cclxuZXhwb3J0IGZ1bmN0aW9uIHJlc29sdmVBbmRSZW5kZXIobWV0YTogYW55LCBkYXRhOiBPYmplY3QsIHBhdGg6IElWYWx1ZVBhdGgpe1xyXG5cdHZhciByZXNvbHZlZFBhdGggPSByZXNvbHZlUGF0aChtZXRhLCBwYXRoKTtcclxuXHRyZXR1cm4gcmVuZGVyKG1ldGEsIGRhdGEsIHJlc29sdmVkUGF0aCk7XHJcbn07Il19

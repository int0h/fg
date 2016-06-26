var tplUtils = require('fg-js/utils/tplUtils.js');
extend(exports, tplUtils);

function objFor(obj, fn){
	for (var i in obj){
		fn(obj[i], i, obj);
	};
};
exports.objFor = objFor;

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


function attrsToObj(attrs){
	var res = {};
	attrs.forEach(function(i){
		res[i.name] = i.value;
	}); 
	return res;
};
exports.attrsToObj = attrsToObj;


function simpleClone(obj){
	var res = {};
	for (var i in obj){
		res[i] = obj[i];
	};
	return res;
};
exports.simpleClone = simpleClone;


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

function resolvePath(rootPath, relPath){
	var resPath = rootPath.slice();
	relPath = relPath || [];
	relPath.forEach(function(key){
		if (key == "_root"){
			resPath = [];
			return;
		};
		resPath.push(key);
	});
	return resPath;
};
exports.resolvePath = resolvePath;


function getScopePath(meta){
	var	parentPath = [];
	if (meta.parent){
		parentPath = meta.parent.scopePath;
		if (!parentPath){
			throw new Error("Parent elm must have scopePath");
		};
	};
	return resolvePath(parentPath, meta.path)
};
exports.getScopePath = getScopePath;

function keyValueToObj(arr, keyName, valueName){
	keyName = keyName || 'key';
	valueName = valueName || 'value';
	var res = {};
	arr.forEach(function(i){
		res[i[keyName]] = i[valueName];
	}); 
	return res;
};
exports.keyValueToObj = keyValueToObj;	

function objToKeyValue(obj, keyName, valueName){
	keyName = keyName || 'key';
	valueName = valueName || 'value';
	var res = [];
	for (var i in obj){
		var item = {};
		item[keyName] = i;
		item[valueName] = obj[i];
		res.push(item);
	};
	return res;
};
exports.objToKeyValue = objToKeyValue;

function clone(obj){
	return Object.create(obj);
};
exports.clone = clone;


function concatObj(obj1, obj2){
	var res = simpleClone(obj1);
	for (var i in obj2){
		res[i] = obj2[i];
	};
	return res;
};
exports.concatObj = concatObj;

function extend(dest, src){	
	for (var i in src){
		dest[i] = src[i];
	};
	return dest;
};
exports.extend = extend;

function findScopeHolder(meta){
    var node = meta.parent;
    while (node){
        if (node.isScopeHolder){
            return node;
        };
        node = node.parent;  
    };
    throw 'cannot find scope holder';
};
exports.findScopeHolder = findScopeHolder;

function renderScopeContent(context, scopeMeta, scopeData, data, idOffset){
	var gapClassMgr = require('fg-js/client/gapClassMgr.js');
	var isArray = Array.isArray(scopeData);
	if (!isArray){
		scopeData = [scopeData];
	};
	var parts = scopeData.map(function(dataItem, id){
		var itemMeta = scopeMeta;
		if (isArray){
			var itemCfg = {
				"type": "scope-item",
				"isVirtual": true,
				"path": [id + idOffset],
				"content": scopeMeta.content
			};
			if (scopeMeta.eid){
				itemCfg.eid = scopeMeta.eid + '-item';
			};
			itemMeta = new gapClassMgr.Gap(context, itemCfg, itemMeta);
			context.gapStorage.setTriggers(itemMeta, [itemMeta.scopePath]);
		};
		return gapClassMgr.render(context, scopeMeta, data, itemMeta);
	});
	return parts;
};
exports.renderScopeContent = renderScopeContent;

function insertHTMLBeforeComment(commentElm, html){
	var prev = commentElm.previousElementSibling;
	if (prev){
		prev.insertAdjacentHTML('afterend', html);
		return;
	};
	commentElm.parentNode.insertAdjacentHTML('afterbegin', html);
};
exports.insertHTMLBeforeComment = insertHTMLBeforeComment;


function parsePath(parsedNode){
	if (parsedNode.attrs.class){
		return parsedNode.attrs.class.value.split(' ');
	};
	return [];
};
exports.parsePath = parsePath;

function objMap(obj, fn){
	var res = {};
	objFor(obj, function(val, id){
		res[id] = fn(val, id, obj);
	});
	return res;
};
exports.objMap = objMap;

function deepClone(obj){
	if (typeof obj == "object"){
		var map = Array.isArray(obj)
			? obj.map.bind(obj)
			: objMap.bind(null, obj);
		return map(deepClone);
	};
	return obj;
};
exports.deepClone = deepClone;
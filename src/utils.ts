"use strict";

import * as valueMgr from './valueMgr';
export * from './utils/tplUtils';

export function objFor(obj: Object, fn: Function){
	for (var i in obj){
		fn(obj[i], i, obj);
	};
};

export function objMap(obj: Object, fn: Function){
	var newObj = {};
	objFor(obj, function(item, id){
		var newItem = fn(item, id, obj);
		newObj[id] = newItem;
	});
	return newObj;
};

export function objPath(path: Array<string>, obj: Object, newVal?: any){
	if (path.length < 1){
		if (arguments.length > 2){
			throw 'root rewritting is not supported';
		};
		return obj;
	};
	var propName = path[0];
	if (path.length === 1){
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

export function attrsToObj(attrs){
	var res = {};
	attrs.forEach(function(i){
		res[i.name] = i.value;
	}); 
	return res;
};

export function simpleClone(obj){
	var res = {};
	for (var i in obj){
		res[i] = obj[i];
	};
	return res;
};

export function mixArrays(/*arrays*/){
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

export function resolvePath(rootPath, relPath){
	var resPath = rootPath.slice();
	relPath = relPath || [];
	relPath.forEach(function(key){
		if (key === "_root"){
			resPath = [];
			return;
		};
		resPath.push(key);
	});
	return resPath;
};

export function getScopePath(meta){
	var	parentPath = [];
	if (meta.parent){
		parentPath = meta.parent.scopePath;
		if (!parentPath){
			throw new Error("Parent elm must have scopePath");
		};
	};
	return resolvePath(parentPath, meta.path);
};

export function keyValueToObj(arr, keyName, valueName){
	keyName = keyName || 'key';
	valueName = valueName || 'value';
	var res = {};
	arr.forEach(function(i){
		res[i[keyName]] = i[valueName];
	}); 
	return res;
};

export function objToKeyValue(obj, keyName, valueName){
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

export function clone(obj){
	return Object.create(obj);
};

export function concatObj(obj1, obj2){
	var res = simpleClone(obj1);
	for (var i in obj2){
		res[i] = obj2[i];
	};
	return res;
};

export function extend(dest, src){	
	for (var i in src){
		dest[i] = src[i];
	};
	return dest;
};

export function findScopeHolder(meta){
    var node = meta.parent;
    while (node){
        if (!node.isScopeHolder){
            return node;
        };
        node = node.parent;  
    };
    throw new Error('cannot find scope holder');
};

export function parsePath(parsedNode){
	if (parsedNode.attrs.class){
		var parts = parsedNode.attrs.class.value.split(' ');
		var parsed =  valueMgr.read(parts);
		return parsed;
	};
	return valueMgr.read([]);
};

export function deepClone(obj: Object): Object{
	if (typeof obj === "object"){
		var map = Array.isArray(obj)
			? obj.map.bind(obj)
			: objMap.bind(null, obj);
		return map(deepClone);
	};
	return obj;
};

export function escapeHtml(code: string): string{
	return code
		.replace(/"/g,'&quot;')
		.replace(/&/g,'&amp;')
		.replace(/</g,'&lt;')
		.replace(/>/g,'&gt;');
};
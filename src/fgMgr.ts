"use strict";

import * as tplMgr from './tplMgr';
var microJade = require('micro-jade');

export interface IFgObject{
	name: string;
	tpl: any;
	classFn: Function;
};

export interface IFgTable{
	[key: string]: IFgObject;
};

/**
 * Fragment Manager. Stores all parsed fg's.
 * @constructor
 */
export class FgMgr{
	fgs: IFgTable;

	constructor(){
		this.fgs = {};		
	};

	/**
	 * Reads fragment from object.
	 * @constructor
	 * @param {string} name - Name of fg.
	 * @param {object} sources - Sources for fg like tpl or logic files.
	 */
	readFg(name, sources){
		var jadeCode = sources.tpl;
		var mjAst = microJade.parse(jadeCode);
		var tpl = tplMgr.readTpl(mjAst);
		var classFn;
		if (sources.classFn){
			var code = sources.classFn;
			classFn = new Function('fgClass', 'fgProto', code);
		};
		this.fgs[name] = {
			"tpl": tpl,
			"name": name,
			"classFn": classFn
		};
	};

};



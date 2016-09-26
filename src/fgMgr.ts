"use strict";

import * as tplMgr from './tplMgr';
const microJade = require('micro-jade');

export interface IFgObject{
	name: string;
	tpl: tplMgr.Tpl;
	classFn: Function;
	tplSource: string;
};

export interface IFgDeclaration{
	name: string;
	tpl: string;
	classFn: string;
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
	readFg(name: string, sources: IFgDeclaration){
		const jadeCode = sources.tpl;
		const mjAst = microJade.parse(jadeCode);
		const tpl = tplMgr.readTpl(mjAst, null, []);
		let classFn: Function;
		if (sources.classFn){
			const code = sources.classFn;
			classFn = new Function('fgClass', 'fgProto', code);
		};
		this.fgs[name] = {
			"tpl": tpl,
			"name": name,
			"classFn": classFn,
			"tplSource": sources.tpl 
		};
	};

};



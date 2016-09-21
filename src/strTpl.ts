"use strict";

export interface ValueParseFn{
	(str: string): any;
};

export interface ValueRenderFn{
	(parsed: any): string;
};

export class StrTpl{
	src: string;
	gaps: any;
	parts: any;
	isString: boolean;

	constructor (tpl: StrTpl | string, valueParseFn?: ValueParseFn){
		if (typeof tpl === "object"){
			this.src = tpl.src;
			this.gaps = tpl.gaps;
			this.parts = tpl.parts;
			return;
		};
		this.src = tpl as string;
		this.parts = [];
		this.gaps = [];
		return this.parse(tpl as string, valueParseFn);
	};

	parse(tpl: string, valueParseFn: ValueParseFn){
		const gapStrArr = tpl.match(gapRe);
		if (!gapStrArr){
			this.isString = true;
			this.parts = [tpl];
			return;
		};
		this.gaps = gapStrArr.map(function(part){
			const partValue: string = part.slice(2, -1);
			const partRes: any = valueParseFn(partValue);
			partRes.escaped = part[0] !== "!";
			return partRes;
		});		
		this.parts = tpl.split(gapRe);
		return this;
	};

	render(valueRenderFn: ValueRenderFn){
		const gaps = this.gaps.map(valueRenderFn);
		const parts = mixArrays(this.parts, gaps);
		return parts.join('');	
	};
	
};

export function read(tpl: string | StrTpl, valueParseFn: ValueParseFn): string | StrTpl{
	let res: StrTpl = new StrTpl(tpl, valueParseFn);
	if (res.isString){
		return tpl;
	};
	return res;
};

var gapRe = /[\$\#\!]{1}\{[^\}]*\}/gm;

function mixArrays(...arrs: any[][]): any[]{
	let maxLength = 0;
	let totalLength = 0;
	for (let i = 0; i < arrs.length; i++){
		maxLength = Math.max(arrs[i].length, maxLength);
		totalLength += arrs[i].length;
	};
	let resArr: any[] = [];
	const arrayCount = arguments.length;
	for (let id = 0; id < maxLength; id++){				
		for (let j = 0; j < arrayCount; j++){
			if (arguments[j].length > id){
				resArr.push(arguments[j][id]);
			};
		};
	};
	return resArr;
};
"use strict";

export interface ValueParseFn{
	(str: string): any;
};

export interface ValueRenderFn{
	(parsed: any): string;
};

export type ValueParsedType = any;

export type StrTplValue = string | ValueParsedType;

export type StrTplData = StrTplValue[];

var gapRe = /[\$\#\!]{1}\{[^\}]*\}/gm;

export function parse(tpl: string, valueParseFn: ValueParseFn): StrTplData | string{
	const gapStrArr = tpl.match(gapRe);
	if (!gapStrArr){
		return tpl;
	};	
	const gaps = gapStrArr.map(function(part){
		const partValue: string = part.slice(2, -1);
		const partRes: any = valueParseFn(partValue);
		partRes.escaped = part[0] !== "!";
		return partRes;
	});		
	const strings = tpl.split(gapRe);
	return mixArrays(strings, gaps);
};

export function render(tplData: StrTplData | string, valueRenderFn: ValueRenderFn): string{
	if (typeof tplData === "string"){
		return tplData;
	};
	const parts = tplData as StrTplData;
	const renderedParts = parts.map(part => {
		if (typeof part === "string"){
			return part;
		};
		return valueRenderFn(part);
	})
	return renderedParts.join('');	
};

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
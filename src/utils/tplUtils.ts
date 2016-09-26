import * as utils from '../utils';

var selfClosingTags = ["area", "base", "br", "col", 
	"command", "embed", "hr", "img", 
	"input", "keygen", "link", 
	"meta", "param", "source", "track", 
	"wbr"];

export interface IAttr{
	name: string;
	value: string;
};

export interface IAttrs {
	[key: string]: string
}

export interface ITagOpts{
	attrs: IAttrs | IAttr[];
	name: string;
	innerHTML: string;
};

export function renderTag(tagInfo: ITagOpts): string{
	let attrsArr: IAttr[] = tagInfo.attrs as IAttr[];
	if (!Array.isArray(attrsArr)){
		attrsArr = utils.objToKeyValue(attrsArr, 'name', 'value');
	};
	let attrCode = "";
	if (attrsArr.length > 0){
	    attrCode = " " + attrsArr.map(function(attr: IAttr){
		  return attr.name + '="' + attr.value + '"';
	   }).join(' ');
	};
	const tagHead = tagInfo.name + attrCode;
	if (~selfClosingTags.indexOf(tagInfo.name)){
		return "<" + tagHead + " />";
	};
	const openTag = "<" + tagHead + ">";
	const closeTag = "</" + tagInfo.name + ">";
	const code = openTag + (tagInfo.innerHTML || "") + closeTag;
	return code;
};


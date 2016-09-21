import * as utils from '../utils';

var selfClosingTags = ["area", "base", "br", "col", 
	"command", "embed", "hr", "img", 
	"input", "keygen", "link", 
	"meta", "param", "source", "track", 
	"wbr"];

interface IAttr{
	name: string;
	value: string;
};

export interface ITagOpts{
	attrs: any;
	name: string;
	innerHTML: string;
};

export function renderTag(tagInfo: ITagOpts): string{
	let attrs = tagInfo.attrs;
	if (!Array.isArray(attrs)){
		attrs = utils.objToKeyValue(attrs, 'name', 'value');
	};
	let attrCode = "";
	if (attrs.length > 0){
	    attrCode = " " + attrs.map(function(attr: IAttr){
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


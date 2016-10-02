import {Component, fgClassDict, fgInstanceTable, ComponentClass, getFgByIid} from './componentBase'; 
import {Gap} from './gapClassMgr'; 

export interface Helper {
	(arg: string | HTMLElement): any; 
	byDom(dom: HTMLElement): Component;
	load(fgData: any): ComponentClass | ComponentClass[];
	isFg(domNode: HTMLElement): boolean;
	gapClosest(domNode: HTMLElement): Gap;
	fgs: Component[];
	classes: ComponentClass[];
	jq: any;
};

const $fg: Helper = <Helper>function(arg: string | HTMLElement){
	if (arg instanceof HTMLElement){
		return $fg.byDom(arg);
	};
	if (typeof arg == "string"){
		return fgClassDict[arg as string];
	};
};

export default $fg;

$fg.load = function(fgData: any): ComponentClass | ComponentClass[]{
	if (Array.isArray(fgData)){		
		return fgData.map($fg.load);
	};
	//return new ComponentClass(fgData);
};

$fg.isFg = function(domNode: HTMLElement): boolean{
	return domNode.classList && domNode.classList.contains('fg');
};

const iidRe = /fg\-iid\-(\d+)/g;
const idRe = /fg\-(\d+)\-gid\-(\d+)/g;

$fg.byDom = function(domNode: HTMLElement): Component{	
	if (!domNode || !domNode.className){
		return null;
	};
	if (!~domNode.className.split(' ').indexOf('fg')){
		return null;
	};
	if (!domNode.id){
		return null;
	};
	idRe.lastIndex = 0;
	const res = idRe.exec(domNode.id);
	if (!res){
		return null;
	};
	const iid = parseInt(res[1]);
	return getFgByIid(iid);	
};

// $fg.gapClosest = function(domNode: HTMLElement): Gap{
// 	while (true){
// 		idRe.lastIndex = 0;
// 		let res = idRe.exec(domNode.id);
// 		if (!res){
// 			domNode = domNode.parentElement;
// 			if (!domNode){
// 				return null;
// 			};
// 			continue;
// 		};
// 		const iid = parseInt(res[1]);
// 		const fg = getFgByIid(iid);
// 		const gid = parseInt(res[2]);
// 		return fg.gapStorage.gaps[gid];
// 	};
// };

$fg.classes = fgClassDict;

$fg.fgs = fgInstanceTable;

const win: any = window;

$fg.jq = win['jQuery'];

win['$fg'] = $fg;
import {FgInstance} from './fgInstance';

interface IEventTable{
	[key: string]: boolean;
};

var events: IEventTable = {};

const win: any = window;

export function handler(name: string, event: any){
	const helper: any = win['$fg'];
	let elm: HTMLElement = event.target;
	while (elm){
		let fg: FgInstance = helper.byDom(elm);
		if (fg){
			fg.emitApply(name, fg, [event]);
			//return;
		};
		elm = elm.parentElement;
	};
};

export function listen(name: string){
	if (name in events){
		return;
	};	
	events[name] = true;
	document.addEventListener(name, handler.bind(null, name), true);
};
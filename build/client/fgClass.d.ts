import { IEventEmitter } from '../eventEmitter';
import * as fgInstanceModule from './fgInstance';
import { FgInstance } from './fgInstance';
import { Gap } from './gapClassMgr';
import { Tpl } from '../tplMgr';
export declare var fgClassTable: FgClass[];
export declare var fgClassDict: {};
export interface IFgClassOpts {
    tpl: Tpl;
    classFn: Function;
    name: string;
}
export declare class FgClass {
    id: number;
    instances: fgInstanceModule.FgInstance[];
    tpl: Tpl;
    name: string;
    eventEmitter: IEventEmitter;
    createFn: Function;
    constructor(opts: IFgClassOpts);
    on(name: string, selector: any, fn?: any): void;
    emit(): void;
    emitApply(name: string, thisArg: any, args: any[]): void;
    cookData(data: any): any;
    render(data: any, meta?: Gap, parent?: FgInstance): any;
    renderIn(parentNode: HTMLElement, data: any, meta?: Gap, parent?: FgInstance): any;
    appendTo(parentNode: HTMLElement, data: any): void;
}

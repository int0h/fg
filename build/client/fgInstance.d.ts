import { IEventEmitter } from '../eventEmitter';
import { Tpl } from '../tplMgr';
import { Gap } from './gapClassMgr';
import { FgClass } from './fgClass';
export declare var fgInstanceTable: any[];
export declare class FgInstanceBase {
    id: number;
    name: string;
    fgClass: FgClass;
    code: string;
    dom: HTMLElement[];
    data: any;
    meta: Gap;
    gapMeta: Gap;
    parent: FgInstance;
    eventEmitter: IEventEmitter;
    gapStorage: any;
    childFgs: FgInstance[];
    constructor(fgClass: FgClass, parent: FgInstance);
    on(event: string, fn: Function): void;
    emit(...rest: any[]): void;
    emitApply(...rest: any[]): void;
    toString(): string;
    assign(): void;
    renderTpl(tpl: Tpl, parent: Gap, data: any, meta?: any): any;
    getHtml(data: any, meta?: any): any;
    update(scopePath: any, newValue: any): any;
    cloneData(): Object;
    clear(): void;
    remove(virtual: boolean): void;
    rerender(data: any): this;
    getDom(): any[];
    jq(): any;
    gap(id: any): any;
    gaps(id: any): any;
    sub(id: any): any;
}
export declare class FgInstance extends FgInstanceBase {
    constructor(fgClass: any, parent: any);
}
export declare function getFgByIid(iid: any): any;

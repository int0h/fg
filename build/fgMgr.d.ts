import * as tplMgr from './tplMgr';
export interface IFgObject {
    name: string;
    tpl: tplMgr.Tpl;
    classFn: Function;
}
export interface IFgDeclaration {
    name: string;
    tpl: string;
    classFn: string;
}
export interface IFgTable {
    [key: string]: IFgObject;
}
/**
 * Fragment Manager. Stores all parsed fg's.
 * @constructor
 */
export declare class FgMgr {
    fgs: IFgTable;
    constructor();
    /**
     * Reads fragment from object.
     * @constructor
     * @param {string} name - Name of fg.
     * @param {object} sources - Sources for fg like tpl or logic files.
     */
    readFg(name: string, sources: IFgDeclaration): void;
}

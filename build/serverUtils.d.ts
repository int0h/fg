export interface IToJsOpts {
    tab?: string;
    n?: string;
}
export declare function toJs(obj: any, opts?: IToJsOpts, tabOffest?: number): string;
export declare function strPrefix(prefix: string, str: string): string;
export declare function prefixLines(str: string, prefix: string, triggerFn: Function): string;
export declare function fileExist(path: string): boolean;
export declare function forTree(treeObj: any, childProp: string, fn: Function): void;
export declare function getSubFolders(path: string): string[];
export declare function treeMap(treeObj: any, childProp: string, fn: Function): any;

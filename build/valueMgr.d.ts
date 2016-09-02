export declare type IValuePathItem = string;
export interface IValuePath {
    path: Array<IValuePathItem>;
    source: string;
    escaped: boolean;
}
/**
 * Reads path and returns parsed path.
 * @param {string[]} parts - array of path's parts.
 * @param {Object} extraInfo - data object to be added to result.
 * @returns {Object} path object.
 */
export declare function read(parts: Array<string>, extraInfo?: Object): IValuePath;
/**
 * Parses dot path and returns parsed path.
 * @param {string} str - text of the path separated by dots.
 * @param {Object} extraInfo - data object to be added to result.
 * @returns {Object} path object.
 */
export declare function parse(str: string, extraInfo?: Object): IValuePath;
/**
 * Resolves the path removing all operators from path (e.g. $up).
 * @param {Object} meta - gap meta connected to the path.
 * @param {Object} path - value path object.
 * @returns {Object} resolved path object.
 */
export declare function resolvePath(meta: any, path: IValuePath): IValuePath;
/**
 * Returns the value by given path.
 * @param {Object} meta - gap meta connected to the path.
 * @param {Object} data - data object rendering in fg.
 * @param {Object} valuePath - value path to be fetched.
 * @returns {any} fetched data.
 */
export declare function getValue(meta: any, data: Object, valuePath: IValuePath): any;
/**
 * Returns the queried value as string.
 * @param {Object} meta - gap meta connected to the path.
 * @param {Object} data - data object rendering in fg.
 * @param {Object} resolvedPath - resolved path.
 * @returns {string} rendered string.
 */
export declare function render(meta: any, data: Object, resolvedPath: IValuePath): string;
/**
 * Resolve path and returns the queried value as string.
 * @param {Object} meta - gap meta connected to the path.
 * @param {Object} data - data object rendering in fg.
 * @param {Object} path - unresolved path.
 * @returns {string} rendered string.
 */
export declare function resolveAndRender(meta: any, data: Object, path: IValuePath): string;

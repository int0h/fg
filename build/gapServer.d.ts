import { IAstNode } from './tplMgr';
import { Gap } from './client/gapClassMgr';
import { FgInstance } from './client/fgInstance';
export interface IParseGap {
    (node: IAstNode): Gap;
}
export interface IRenderGap {
    (context: FgInstance, data: any): string;
}
export interface IUpdateGap {
    (context: FgInstance, meta: Gap, scopePath: any, value: any, oldValue?: any): any;
}
export interface IGapOpts {
    name: string;
    path: string;
    priority?: Number;
    parse?: IParseGap;
    render?: IRenderGap;
    update?: IUpdateGap;
}
/**
 * Fragment Manager. Stores all parsed fg's.
 * @constructor
 */
export declare class GapClass {
    name: string;
    path: string;
    priority: Number;
    parse: IParseGap;
    render: IRenderGap;
    update: IUpdateGap;
    constructor(opts: IGapOpts);
}
/**
 * Reads the given ast and returns gap tree.
 * @param {object} ast - Parsed AST of a template.
 * @param {string} html - Source code of template. [deprecated]
 * @param {object} parentMeta - Parent gap.
 * @return {gap | null}
 */
export declare function parse(ast: IAstNode, html: string, parentMeta: Gap): any;
/**
 * Renders a gap type according to parsed meta.
 * @param {object} data - Data for gap.
 * @param {object} meta - Meta for gap.
 * @param {object} context - Fg containing the gap.
 * @return {string}
 */
export declare function render(data: Object, meta: Gap, context: FgInstance): string;
/**
 * Generates gap info for client. [deprecated]
 * @return {string}
 */
export declare function genClientCode(): string;
/**
 * Reads gap directory and registers gaps from there.
 * @param {string} gapPath - path to the "gaps" directory.
 */
export declare function readGapDir(gapPath: any): void;
/**
 * Generates gap include file for the client.
 * @return {string}
 */
export declare function genIncludeFile(): string;

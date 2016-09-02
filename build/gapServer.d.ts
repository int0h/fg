import { IAstNode } from './tplMgr';
import { Gap } from './client/gapClassMgr';
/**
 * Reads the given ast and returns gap tree.
 * @param {object} ast - Parsed AST of a template.
 * @param {string} html - Source code of template. [deprecated]
 * @param {object} parentMeta - Parent gap.
 * @return {gap | null}
 */
export interface IGapMatch {
    gap: any;
    meta: any;
}
export declare function parse(ast: IAstNode, html: string, parentMeta: Gap): any;

import { Gap } from './client/gapClassMgr';
export declare var renderTpl: any;
export interface IAstNode {
    type: string;
    children: IAstNode[];
    tagName?: string;
    attrs: any;
    text: string;
    parent: IAstNode;
    value?: {
        path: string;
        escaped: boolean;
    };
}
export declare type ITplPart = string | Gap;
export declare type Tpl = ITplPart[];
export declare function readTpl(ast: IAstNode, code?: string, parentMeta?: Gap): Tpl;

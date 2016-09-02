import { Gap } from '../client/gapClassMgr';
import { FgInstance } from '../client/fgInstance';
import { IAstNode } from '../tplMgr';
export default class GRaw extends Gap {
    isRootNode: boolean;
    isScopeItem: boolean;
    isScopeHolder: boolean;
    tagName: string;
    type: string;
    static priority: number;
    static parse(node: IAstNode, html?: string, parentMeta?: Gap): GRaw;
    render(context: FgInstance, data: any): any;
    update(context: FgInstance, meta: Gap, scopePath: any, value: any): void;
}

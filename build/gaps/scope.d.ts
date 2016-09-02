import { Gap } from '../client/gapClassMgr';
import { FgInstance } from '../client/fgInstance';
import { IAstNode } from '../tplMgr';
export default class GScope extends Gap {
    items: Gap[];
    scopePath: any;
    type: string;
    static parse(node: IAstNode, html: any): GScope;
    render(context: FgInstance, data: any): any;
    update(context: FgInstance, meta: Gap, scopePath: any, value: any, oldValue: any): void;
}

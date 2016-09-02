import { Gap } from '../client/gapClassMgr';
import { FgInstance } from '../client/fgInstance';
import { IAstNode } from '../tplMgr';
export default class GFg extends Gap {
    parentFg: FgInstance;
    fgName: string;
    type: string;
    static parse(node: IAstNode): GFg;
    render(context: FgInstance, data: any): any;
    update(context: FgInstance, meta: Gap, scopePath: any, value: any): void;
}

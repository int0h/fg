import { Gap } from '../client/gapClassMgr';
import { FgInstance } from '../client/fgInstance';
import { IAstNode } from '../tplMgr';
export default class GScopeItem extends Gap {
    scopePath: any;
    static parse(node: IAstNode): any;
    render(context: FgInstance, data: any): any;
}

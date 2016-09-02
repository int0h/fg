import { Gap } from '../client/gapClassMgr';
import { FgInstance } from '../client/fgInstance';
import { IAstNode } from '../tplMgr';
export default class GRoot extends Gap {
    scopePath: any;
    type: string;
    static parse(node: IAstNode): any;
    render(context: FgInstance, data: any): void;
}

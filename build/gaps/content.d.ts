import { Gap } from '../client/gapClassMgr';
import { FgInstance } from '../client/fgInstance';
import { IAstNode } from '../tplMgr';
export default class GContent extends Gap {
    type: string;
    static parse(node: IAstNode): GContent;
    render(context: FgInstance, data: any): any;
}

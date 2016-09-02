import { Gap } from '../client/gapClassMgr';
import { FgInstance } from '../client/fgInstance';
import { IAstNode } from '../tplMgr';
export default class GDynamicText extends Gap {
    tpl: any;
    type: string;
    static parse(node: IAstNode): GDynamicText;
    render(context: FgInstance, data: any): string;
}

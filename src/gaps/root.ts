"use strict";

import * as utils from '../utils';  
import * as valueMgr from '../valueMgr';  
import {Gap} from '../client/gapClassMgr';  
import {FgInstance} from '../client/fgInstance';  
import {IAstNode} from '../tplMgr';

export default class GRoot extends Gap{
	scopePath: any;
	type: string = "root";

	static parse(node: IAstNode): Gap{
		return null;
	};

	render(context: FgInstance, data: any): string{
		throw new Error('root gap should not be rendered');
	};

};
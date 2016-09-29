export interface IAstNode {
    type: string;
	children: IAstNode[];
	tagName?: string;
	attrs: any;
	text: string;
	parent: IAstNode;
	value?: {
		path: string,
		escaped: boolean
	};
};
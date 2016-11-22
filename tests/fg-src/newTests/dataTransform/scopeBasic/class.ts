import {Component} from 'fg-js/build/client/main';

declare const $fg;

const dataRef = {
	"self": [],
	"content": [
		{
			"isScope": true,
			"items": [
				[
					{
						"self": [],
						"content": null
					}
				],
				[
					{
						"self": [],
						"content": null
					}
				],
				[
					{
						"self": [],
						"content": null
					}
				]
			]
		}
	]
};

export default class TestClass extends Component{
    static test(QUnit: any){
        QUnit.test("Transform data: scope basic", (assert) => {
			const dataIn = {
				scope: [1, 2, 3]
			};
			const curData = this.transformData(dataIn);
            assert.deepEqual(curData, dataRef, 'Scope data generated properly!');
            assert.equal(curData.content[0].isScope, true, 'Scope data generated properly!');
            assert.equal(curData.content[0].items.length, 3, 'Scope data generated properly!');
        });
    };
}; 
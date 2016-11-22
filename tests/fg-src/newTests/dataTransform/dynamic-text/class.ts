import {Component} from 'fg-js/build/client/main';

declare const $fg;

const dataRef = {
	"self": [
		1,
		2,
		3
	],
	"content": null
};

export default class TestClass extends Component{
    static test(QUnit: any){
        QUnit.test("Transform data: dynamic-text", (assert) => {
			const dataIn = {
				val1: 1,
				val2: 2,
				val3: 3
			};
			const curData = this.transformData(dataIn).content[0].content[0];
            assert.deepEqual(curData, dataRef, 'Scope data generated properly!');
        });
    };
}; 
import {Component} from 'fg-js/build/client/main';

declare const $fg;

const dataRef = {
	"self": [],
	"content": [
		{
			"self": [],
			"content": null
		}
	]
};

export default class TestClass extends Component{
    static test(QUnit: any){
        QUnit.test("Transform data: no data", (assert) => {
            assert.deepEqual(this.transformData({}), dataRef, 'Ok!');
        });
    };
}; 
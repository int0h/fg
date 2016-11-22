import {Component} from 'fg-js/build/client/main';

declare const $fg;

export default class TestClass extends Component{
    static test(QUnit: any){
        QUnit.test("Testing environment", function(assert){
            assert.ok(true, 'Tests started!');
            assert.ok(!!$fg, 'Global helper exists!');
        });
    };
}; 
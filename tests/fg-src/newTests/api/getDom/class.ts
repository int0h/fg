import {Component} from 'fg-js/build/client/main';

export default class TestClass extends Component{
    static test(){
        const data = {val: 'val', scope: [1,2]};
        const code = this.render(data);
    };
}; 
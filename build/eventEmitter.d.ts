export interface IEventEmitter {
    events: Object;
    parent?: IEventEmitter;
    on: Function;
    emit: Function;
    emitApply: Function;
}
export default function EventEmitter(parent?: IEventEmitter): void;

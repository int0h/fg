"use strict";
var events = {};
function handler(name, event) {
    var elm = event.target;
    while (elm) {
        var fg = window['$fg'].byDom(elm);
        if (fg) {
            fg.emitApply(name, fg, [event]);
        }
        ;
        elm = elm.parentNode;
    }
    ;
}
exports.handler = handler;
;
function listen(name) {
    if (name in events) {
        return;
    }
    ;
    events[name] = true;
    document.addEventListener(name, handler.bind(null, name), true);
}
exports.listen = listen;
;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZ2xvYmFsRXZlbnRzLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vc3JjL2NsaWVudC9nbG9iYWxFdmVudHMudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtBQUFBLElBQUksTUFBTSxHQUFHLEVBQUUsQ0FBQztBQUVoQixpQkFBd0IsSUFBSSxFQUFFLEtBQUs7SUFDbEMsSUFBSSxHQUFHLEdBQUcsS0FBSyxDQUFDLE1BQU0sQ0FBQztJQUN2QixPQUFPLEdBQUcsRUFBQyxDQUFDO1FBQ1gsSUFBSSxFQUFFLEdBQUcsTUFBTSxDQUFDLEtBQUssQ0FBQyxDQUFDLEtBQUssQ0FBQyxHQUFHLENBQUMsQ0FBQztRQUNsQyxFQUFFLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQSxDQUFDO1lBQ1AsRUFBRSxDQUFDLFNBQVMsQ0FBQyxJQUFJLEVBQUUsRUFBRSxFQUFFLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQztRQUVqQyxDQUFDO1FBQUEsQ0FBQztRQUNGLEdBQUcsR0FBRyxHQUFHLENBQUMsVUFBVSxDQUFDO0lBQ3RCLENBQUM7SUFBQSxDQUFDO0FBQ0gsQ0FBQztBQVZlLGVBQU8sVUFVdEIsQ0FBQTtBQUFBLENBQUM7QUFFRixnQkFBdUIsSUFBSTtJQUMxQixFQUFFLENBQUMsQ0FBQyxJQUFJLElBQUksTUFBTSxDQUFDLENBQUEsQ0FBQztRQUNuQixNQUFNLENBQUM7SUFDUixDQUFDO0lBQUEsQ0FBQztJQUNGLE1BQU0sQ0FBQyxJQUFJLENBQUMsR0FBRyxJQUFJLENBQUM7SUFDcEIsUUFBUSxDQUFDLGdCQUFnQixDQUFDLElBQUksRUFBRSxPQUFPLENBQUMsSUFBSSxDQUFDLElBQUksRUFBRSxJQUFJLENBQUMsRUFBRSxJQUFJLENBQUMsQ0FBQztBQUNqRSxDQUFDO0FBTmUsY0FBTSxTQU1yQixDQUFBO0FBQUEsQ0FBQyJ9
"use strict";
var gapClassMgr = require('./gapServer');
var tplRender_1 = require('./tplRender');
exports.renderTpl = tplRender_1.default.bind(null, gapClassMgr);
var mj = require('micro-jade');
;
function parseGap(node, html, parentMeta) {
    var tagMeta = gapClassMgr.parse(node, html, parentMeta);
    return tagMeta;
}
;
function readTpl(ast, code, parentMeta) {
    function iterate(children) {
        var parts = [];
        children.forEach(function (node, id) {
            var tagMeta = parseGap(node, code, parentMeta);
            if (tagMeta) {
                parts.push(tagMeta);
                return;
            }
            ;
            if (!node.children || node.children.length == 0) {
                parts.push(mj.render(node, {}));
                return;
            }
            ;
            var wrap = mj.renderWrapper(node);
            parts.push(wrap[0]);
            parts = parts.concat(iterate(node.children));
            if (wrap[1]) {
                parts.push(wrap[1]);
            }
        });
        return parts;
    }
    ;
    return iterate(ast.children);
}
exports.readTpl = readTpl;
;
// function tplToJson(tpl){ //?
// 	var parts = tpl.map(function(part){
// 		if (typeof part == "string"){
// 			return part;
// 		};
// 		return gapClassMgr.toJson(part);
// 	});
// 	return parts;
// };
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidHBsTWdyLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vc3JjL3RwbE1nci50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQSxZQUFZLENBQUM7QUFFYixJQUFZLFdBQVcsV0FBTSxhQUFhLENBQUMsQ0FBQTtBQUUzQywwQkFBNkIsYUFBYSxDQUFDLENBQUE7QUFDaEMsaUJBQVMsR0FBRyxtQkFBZ0IsQ0FBQyxJQUFJLENBQUMsSUFBSSxFQUFFLFdBQVcsQ0FBQyxDQUFDO0FBQ2hFLElBQUksRUFBRSxHQUFHLE9BQU8sQ0FBQyxZQUFZLENBQUMsQ0FBQztBQWE5QixDQUFDO0FBTUYsa0JBQWtCLElBQWMsRUFBRSxJQUFZLEVBQUUsVUFBZTtJQUM5RCxJQUFJLE9BQU8sR0FBRyxXQUFXLENBQUMsS0FBSyxDQUFDLElBQUksRUFBRSxJQUFJLEVBQUUsVUFBVSxDQUFDLENBQUM7SUFDeEQsTUFBTSxDQUFDLE9BQU8sQ0FBQztBQUNoQixDQUFDO0FBQUEsQ0FBQztBQUVGLGlCQUF3QixHQUFhLEVBQUUsSUFBYSxFQUFFLFVBQWdCO0lBRXJFLGlCQUFpQixRQUFvQjtRQUNwQyxJQUFJLEtBQUssR0FBRyxFQUFFLENBQUM7UUFDZixRQUFRLENBQUMsT0FBTyxDQUFDLFVBQVMsSUFBSSxFQUFFLEVBQUU7WUFDakMsSUFBSSxPQUFPLEdBQUcsUUFBUSxDQUFDLElBQUksRUFBRSxJQUFJLEVBQUUsVUFBVSxDQUFDLENBQUM7WUFDL0MsRUFBRSxDQUFDLENBQUMsT0FBTyxDQUFDLENBQUEsQ0FBQztnQkFDWixLQUFLLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxDQUFDO2dCQUNwQixNQUFNLENBQUM7WUFDUixDQUFDO1lBQUEsQ0FBQztZQUNGLEVBQUUsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLFFBQVEsSUFBSSxJQUFJLENBQUMsUUFBUSxDQUFDLE1BQU0sSUFBSSxDQUFDLENBQUMsQ0FBQSxDQUFDO2dCQUNoRCxLQUFLLENBQUMsSUFBSSxDQUFDLEVBQUUsQ0FBQyxNQUFNLENBQUMsSUFBSSxFQUFFLEVBQUUsQ0FBQyxDQUFDLENBQUM7Z0JBQ2hDLE1BQU0sQ0FBQztZQUNSLENBQUM7WUFBQSxDQUFDO1lBQ0YsSUFBSSxJQUFJLEdBQUcsRUFBRSxDQUFDLGFBQWEsQ0FBQyxJQUFJLENBQUMsQ0FBQztZQUNsQyxLQUFLLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO1lBQ3BCLEtBQUssR0FBRyxLQUFLLENBQUMsTUFBTSxDQUFDLE9BQU8sQ0FBQyxJQUFJLENBQUMsUUFBUSxDQUFDLENBQUMsQ0FBQztZQUM3QyxFQUFFLENBQUMsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQSxDQUFDO2dCQUNaLEtBQUssQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7WUFDckIsQ0FBQztRQUNGLENBQUMsQ0FBQyxDQUFDO1FBQ0gsTUFBTSxDQUFDLEtBQUssQ0FBQztJQUNkLENBQUM7SUFBQSxDQUFDO0lBRUYsTUFBTSxDQUFDLE9BQU8sQ0FBQyxHQUFHLENBQUMsUUFBUSxDQUFDLENBQUM7QUFDOUIsQ0FBQztBQXpCZSxlQUFPLFVBeUJ0QixDQUFBO0FBQUEsQ0FBQztBQUVGLCtCQUErQjtBQUMvQix1Q0FBdUM7QUFDdkMsa0NBQWtDO0FBQ2xDLGtCQUFrQjtBQUNsQixPQUFPO0FBQ1AscUNBQXFDO0FBQ3JDLE9BQU87QUFDUCxpQkFBaUI7QUFDakIsS0FBSyJ9
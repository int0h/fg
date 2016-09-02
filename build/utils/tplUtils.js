"use strict";
var utils = require('../utils');
var selfClosingTags = ["area", "base", "br", "col",
    "command", "embed", "hr", "img",
    "input", "keygen", "link",
    "meta", "param", "source", "track",
    "wbr"];
function renderTag(tagInfo) {
    var attrs = tagInfo.attrs;
    if (!Array.isArray(attrs)) {
        attrs = utils.objToKeyValue(attrs, 'name', 'value');
    }
    ;
    var attrCode = "";
    if (attrs.length > 0) {
        attrCode = " " + attrs.map(function (attr) {
            return attr.name + '="' + attr.value + '"';
        }).join(' ');
    }
    ;
    var tagHead = tagInfo.name + attrCode;
    if (~selfClosingTags.indexOf(tagInfo.name)) {
        return "<" + tagHead + " />";
    }
    ;
    var openTag = "<" + tagHead + ">";
    var closeTag = "</" + tagInfo.name + ">";
    var code = openTag + (tagInfo.innerHTML || "") + closeTag;
    return code;
}
exports.renderTag = renderTag;
;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidHBsVXRpbHMuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi9zcmMvdXRpbHMvdHBsVXRpbHMudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtBQUFBLElBQVksS0FBSyxXQUFNLFVBQVUsQ0FBQyxDQUFBO0FBRWxDLElBQUksZUFBZSxHQUFHLENBQUMsTUFBTSxFQUFFLE1BQU0sRUFBRSxJQUFJLEVBQUUsS0FBSztJQUNqRCxTQUFTLEVBQUUsT0FBTyxFQUFFLElBQUksRUFBRSxLQUFLO0lBQy9CLE9BQU8sRUFBRSxRQUFRLEVBQUUsTUFBTTtJQUN6QixNQUFNLEVBQUUsT0FBTyxFQUFFLFFBQVEsRUFBRSxPQUFPO0lBQ2xDLEtBQUssQ0FBQyxDQUFDO0FBRVIsbUJBQTBCLE9BQU87SUFDaEMsSUFBSSxLQUFLLEdBQUcsT0FBTyxDQUFDLEtBQUssQ0FBQztJQUMxQixFQUFFLENBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQyxPQUFPLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQSxDQUFDO1FBQzFCLEtBQUssR0FBRyxLQUFLLENBQUMsYUFBYSxDQUFDLEtBQUssRUFBRSxNQUFNLEVBQUUsT0FBTyxDQUFDLENBQUM7SUFDckQsQ0FBQztJQUFBLENBQUM7SUFDRixJQUFJLFFBQVEsR0FBRyxFQUFFLENBQUM7SUFDbEIsRUFBRSxDQUFDLENBQUMsS0FBSyxDQUFDLE1BQU0sR0FBRyxDQUFDLENBQUMsQ0FBQSxDQUFDO1FBQ2xCLFFBQVEsR0FBRyxHQUFHLEdBQUcsS0FBSyxDQUFDLEdBQUcsQ0FBQyxVQUFTLElBQUk7WUFDekMsTUFBTSxDQUFDLElBQUksQ0FBQyxJQUFJLEdBQUcsSUFBSSxHQUFHLElBQUksQ0FBQyxLQUFLLEdBQUcsR0FBRyxDQUFDO1FBQzNDLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsQ0FBQztJQUNoQixDQUFDO0lBQUEsQ0FBQztJQUNGLElBQUksT0FBTyxHQUFHLE9BQU8sQ0FBQyxJQUFJLEdBQUcsUUFBUSxDQUFDO0lBQ3RDLEVBQUUsQ0FBQyxDQUFDLENBQUMsZUFBZSxDQUFDLE9BQU8sQ0FBQyxPQUFPLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQSxDQUFDO1FBQzNDLE1BQU0sQ0FBQyxHQUFHLEdBQUcsT0FBTyxHQUFHLEtBQUssQ0FBQztJQUM5QixDQUFDO0lBQUEsQ0FBQztJQUNGLElBQUksT0FBTyxHQUFHLEdBQUcsR0FBRyxPQUFPLEdBQUcsR0FBRyxDQUFDO0lBQ2xDLElBQUksUUFBUSxHQUFHLElBQUksR0FBRyxPQUFPLENBQUMsSUFBSSxHQUFHLEdBQUcsQ0FBQztJQUN6QyxJQUFJLElBQUksR0FBRyxPQUFPLEdBQUcsQ0FBQyxPQUFPLENBQUMsU0FBUyxJQUFJLEVBQUUsQ0FBQyxHQUFHLFFBQVEsQ0FBQztJQUMxRCxNQUFNLENBQUMsSUFBSSxDQUFDO0FBQ2IsQ0FBQztBQW5CZSxpQkFBUyxZQW1CeEIsQ0FBQTtBQUFBLENBQUMifQ==
var fgs = [];

fgs.push({
	"name": "button",
	"tpl": require("./button/tpl.js"),
	"classFn": require("./button/class.js")
});
fgs.push({
	"name": "main",
	"tpl": require("./main/tpl.js"),
	"classFn": require("./main/class.js")
});
fgs.push({
	"name": "tag",
	"tpl": require("./tag/tpl.js"),
	"classFn": null
});
fgs.push({
	"name": "test",
	"tpl": require("./test/tpl.js"),
	"classFn": null
});
fgs.push({
	"name": "testInner",
	"tpl": require("./testInner/tpl.js"),
	"classFn": require("./testInner/class.js")
});

$fg.load(fgs);
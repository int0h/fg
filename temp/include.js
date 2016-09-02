var fgs = [];

fgs.push({
	"name": "api_basic-basicFg",
	"tpl": require("./api_basic-basicFg/tpl.js"),
	"classFn": null
});
fgs.push({
	"name": "api_basic-emptyFg",
	"tpl": require("./api_basic-emptyFg/tpl.js"),
	"classFn": null
});
fgs.push({
	"name": "api_basic-multiRoot",
	"tpl": require("./api_basic-multiRoot/tpl.js"),
	"classFn": null
});
fgs.push({
	"name": "api_basic",
	"tpl": require("./api_basic/tpl.js"),
	"classFn": null
});
fgs.push({
	"name": "basic",
	"tpl": require("./basic/tpl.js"),
	"classFn": null
});
fgs.push({
	"name": "escaping",
	"tpl": require("./escaping/tpl.js"),
	"classFn": null
});
fgs.push({
	"name": "parse_basic",
	"tpl": require("./parse_basic/tpl.js"),
	"classFn": null
});
fgs.push({
	"name": "scope_test",
	"tpl": require("./scope_test/tpl.js"),
	"classFn": null
});
fgs.push({
	"name": "update_basic",
	"tpl": require("./update_basic/tpl.js"),
	"classFn": null
});
fgs.push({
	"name": "value_render",
	"tpl": require("./value_render/tpl.js"),
	"classFn": null
});

$fg.load(fgs);
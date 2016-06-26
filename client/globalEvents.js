var events = {};

function handler(name, event){
	var elm = event.target;
	while (elm){
		var fg = $fg.byDom(elm);
		if (fg){
			fg.emitApply(name, fg, [event]);
			//return;
		};
		elm = elm.parentNode;
	};
};

exports.listen = function(name){
	if (name in events){
		return;
	};	
	events[name] = true;
	document.addEventListener(name, handler.bind(null, name), {"capture": true});
};
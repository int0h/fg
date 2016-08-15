function update(context, meta, scopePath, value){
	var node = meta.getDom()[0];
	if (!node){
		
	};
	node.innerHTML = value;
	//highlight(node, [0xffffff, 0xffee88], 500);
};

module.exports = update;
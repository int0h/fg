module.exports = function anonymous(fgClass,fgProto
/**/) {
fgClass.on('ready', function(){
/*	var self = this;
	console.log('ready');
	self.data = {
		"todo": []
	};
	this.sub('helloBtn').on('click', function(){
		var data = self.cloneData();
		data.todo.push({
			"name": "nodda",
			"description": "asdsa",
			"tags": [Math.round((Math.pow(2, Math.random()*32))).toString(2), Math.round((Math.pow(2, Math.random()*32))).toString(2)]
		});
		self.update([], data);
	})*/
});

fgClass.cookData = function(data){
	data.skills = data.skills.map(function(skill){
		skill.list = skill.items.join(', ');
		skill.name += ': ';
		return skill;
	});
	return data;
}
}
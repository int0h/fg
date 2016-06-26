module.exports = function anonymous(fgClass,fgProto
/**/) {
fgClass.on('click', 'button', function(){
	console.log(this);
	this.update(['value'], this.gap('saf').getDom()[0].value)
});
}
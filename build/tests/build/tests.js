"use strict";

function parseHtml(code){
	var div = document.createElement('div');
	div.innerHTML = code;
	return div;
};

function parseTag(code){
	return parseHtml(code).children[0];	
};

QUnit.test("Basic", function(assert){
	assert.ok(!!$fg, 'Global helper exists!');
	assert.ok(!!$fg.classes.basic, 'Basic class exists!');
	var renderedTag = parseTag($fg.classes.basic.render().code);
	var classArray = [].slice.call(renderedTag.classList);
	assert.ok(classArray.indexOf("fg") >= 0, 'Fg has "fg" class');
	assert.ok(!!renderedTag.id, 'Fg has id');
	assert.ok(/^fg\-\d+\-gid\-\d+$/g.test(renderedTag.id), 'Fg\' id is formated properly');
	assert.equal(renderedTag.innerHTML, 'hello world!', 'Inner static text is rendered properly');
});

QUnit.test("Basic parsing", function(assert){
	var renderedMulti = $fg.classes.parse_basic.render().code;
	var multi = [].slice.call(parseHtml(renderedMulti).children);
	assert.equal(multi[0].innerHTML, '', 'Empty tag');
	assert.ok(multi[1].classList.contains('boo'), 'Basic class');
	assert.ok(multi[2].classList.contains('boo'), 'Attribute class');
	assert.equal(multi[3].tagName, "DIV", 'Extra small syntax');
	assert.ok(multi[4].innerHTML.match(/\n/g).length > 0, 'Parsing multi line'); 
});

QUnit.test("Value rendering", function(assert){
	var dataObj = {
		val: "world"
	};
	var renderedMulti = $fg.classes.value_render.render(dataObj).code;
	var multi = [].slice.call(parseHtml(renderedMulti).children);
	assert.equal(multi[0].textContent, 'world', 'Equal syntax');
	assert.equal(multi[1].textContent, 'world', 'Interpolation');
	assert.equal(multi[2].textContent, 'Hello world!', 'Interpolation inside string');
	assert.equal(multi[3].textContent.match(/world/g).length, 3, 'Interpolation repeated');	 
	assert.equal(multi[4].textContent.match(/world/g).length, 2, 'Multiline block Interpolation');	 
});


QUnit.test("Escaping", function(assert){
	var dataObj = {
		val: "world",
		danger: "<b>tag</b>",
		badUrl: '" onerror="console.log(\'xss\')"'
	};
	var renderedMulti = $fg.classes.escaping.render(dataObj).code;
	var multi = [].slice.call(parseHtml(renderedMulti).children);
	assert.equal(multi[0].innerHTML, 'world', 'Basic escaped');
	assert.equal(multi[1].innerHTML, 'world', 'Basic unescaped');
	assert.equal(multi[2].innerHTML, '<b>tag</b>', 'Unescaped tag');
	assert.equal(multi[3].innerHTML, '&lt;b&gt;tag&lt;/b&gt;', 'Escaped tag innerHtml changed');
	assert.equal(multi[3].textContent, '<b>tag</b>', 'Escaped tag textContent is ok');
	assert.ok(multi[4].innerHTML.indexOf('&lt;b&gt;tag&lt;/b&gt;') >= 0, 'Interpolation: Escaped tag innerHtml changed');
	assert.equal(multi[4].textContent, 'Hello <b>tag</b>!', 'Interpolation: Escaped tag textContent is ok');
	assert.ok(multi[5].innerHTML.indexOf('<b>tag</b>') >= 0, 'Interpolation: Unescaped tag');		
	assert.equal(multi[6].dataset.src, "url/&quot; onerror=&quot;console.log('xss')&quot;", 'Escaped string attribute');
	assert.ok(multi[6].onerror === null, 'Attributes string: Escaped XSS is not accessible');
	assert.equal(multi[7].dataset.src, "url/", 'Unescaped string attribute');
	assert.ok(typeof multi[7].onerror === "function", 'Attributes string: Unescaped XSS is accessible');
	assert.equal(multi[8].dataset.src, "&quot; onerror=&quot;console.log('xss')&quot;", 'Escaped attribute');
	assert.ok(multi[8].onerror === null, 'Attributes: Escaped XSS is not accessible');
	assert.equal(multi[9].dataset.src, "", 'Unescaped attribute');
	assert.ok(typeof multi[9].onerror === "function", 'Attributes: Unescaped XSS is accessible');
});

QUnit.test("Scope tests", function(assert){
	var dataObj = {
		basicScope: [1, 1, 1],
		emptyScope: [],
		person: {
			name: 'Mike',
			dob: '12.12.12'
		},
		nested: [
			{
				kind: "odd",
				values: [1, 3, 5]
			},
			{
				kind: "even",
				values: [2, 4, 6]
			}
		]
	};
	var renderedMulti = $fg.classes.scope_test.render(dataObj).code;
	var parent = parseHtml(renderedMulti);
	var multi = [].slice.call(parent.children);
	//var multi = [].slice.call(parseHtml(renderedMulti).children);
	assert.equal(parent.innerHTML.match(/repeat me 3 times/g).length, 3, 'Iteration');
	assert.equal(parent.getElementsByClassName('mustNotBeHere').length, 0, 'Not rendering empty scope');
	assert.equal(parent.getElementsByClassName('mustNotBeHere').length, 0, 'Not rendering undef scope');
	assert.ok(parent.getElementsByClassName('person')[0].innerHTML.indexOf('Mike') !== -1, 'Object scope');
	assert.ok(parent.getElementsByClassName('person')[0].innerHTML.indexOf('12.12.12') !== -1, 'Object scope');
	assert.equal(parent.getElementsByClassName('subScopeItem').length, 6, 'Object scope');
	//assert.equal
});

function createSnadbox(){
	var sb = document.createElement('div');
	sb.style.display = 'fixed';
	document.body.appendChild(sb);
	return sb;
};

var sandBox = createSnadbox();

function hasText(elm, texts){
	var elmText = elm.textContent;
	var ok = true;
	texts.forEach(function(text){
		ok = ok && elmText.indexOf(text) !== -1;
	});
	return ok;
};

QUnit.test("Basic update", function(assert){
	//assert.ok(true);
	//return;
	var dataObj = {
		val: "world",
		basicScope: ["bs-1", "bs-2"],
		emptyScope: [],
		person: {
			name: 'Mike',
			dob: '12.12.12'
		}
	};
	var fg = $fg.classes.update_basic.renderIn(sandBox, dataObj);
	//var multi = [].slice.call(parseHtml(renderedMulti).children);
	assert.equal(sandBox.children[0].innerHTML, 'world', 'Value rendered');
	fg.update(['val'], 'man');
	assert.equal(sandBox.children[0].innerHTML, 'man', 'Value updated! [data]');
	fg.update(['val'], '<a>man</a>');
	assert.equal(sandBox.children[0].innerHTML, '&lt;a&gt;man&lt;/a&gt;', 'Escaping while update [data]');
	assert.equal(sandBox.children[0].textContent, '<a>man</a>', 'Escaping while update [data]');
	assert.ok(hasText(sandBox, ["bs-1", "bs-2"]), 'Scope update');	
	fg.update(['basicScope', 1], 'bs-3');	
	assert.ok(hasText(sandBox, ["bs-1", "bs-3"]), 'Scope update');	
	fg.update(['basicScope'], ["bs-1", "bs-3", 'bs-4']);	
	assert.ok(hasText(sandBox, ["bs-4"]), 'Scope push');	
	assert.equal(sandBox.getElementsByClassName('mustNotBeHere').length, 0, 'Not rendering empty scope');
	assert.ok(sandBox.getElementsByClassName('person')[0].innerHTML.indexOf('Mike') !== -1, 'Object scope');
	assert.ok(sandBox.getElementsByClassName('person')[0].innerHTML.indexOf('12.12.12') !== -1, 'Object scope');
	fg.update(['emptyScope'], ['new in emptyScope']);
	assert.equal(sandBox.getElementsByClassName('mustNotBeHere').length, 1, 'Added into empty scope');
	//assert.equal
});

var apiSandBox = createSnadbox();

QUnit.test("API test: getDom", function(assert){
	var dataObj = {};	
	var nonEmpty = $fg.classes['api_basic-basicFg'].render(dataObj);
	apiSandBox.innerHTML = nonEmpty.code;	
	assert.equal(nonEmpty.getDom().length, 1, '1 dom elm of regular fg');
	var empty = $fg.classes['api_basic-emptyFg'].render(dataObj);
	apiSandBox.innerHTML = empty.code;	
	assert.equal(empty.getDom().length, 0, 'No dom of empty fg');
	var multiRoot = $fg.classes['api_basic-multiRoot'].render(dataObj);
	apiSandBox.innerHTML = multiRoot.code;	
	assert.equal(multiRoot.getDom().length, 2, '> 1 dom elm of multy fg');
	
});
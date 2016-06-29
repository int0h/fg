# Fg-js

Fg-js is a small library that allows to create and use components. “Fg” is a short form for “fragment”. The library is designed to:
- provide tools for jade-like templating;
- data-binding;
- develop frontend using component style;

It’s not a framework so you can integrate it into your application without any changes in exist architecture.

Visit the home page of the project where you can find the live-demo: [https://int0h.github.io/fg-site/](https://int0h.github.io/fg-site/)
## Conception
One of the goals to create fg-js was to separate logic and template. 
First of all let’s take a look at simple Jade template:
```jade
div.product
	h1=title
    p=description
    h3 available colors:
    table
    	tbody
            each variant in variants
              tr
                  td=variant.color
                  td=variant.price
```
It takes data like this:
.editor
```json
{
  	"color": "red",
	"title": "Awesome T-Shirt",
    "description": "it's the most awesome t-short!",
    "variants": [
      {
      	"color": "red",
        "price": 7200
      },
      {
      	"color": "green",
        "price": 12090
      }
    ]
}
```		
...and returns html string;

I see at least 2 problems in this approach: 
- loosing meta-information about template. Once price of 7200 put in a <td>, there is no a proper way to get <td> element by knowing to which piece of data it related;
- too many logic might be put in a template;

Fg-js suggests another way:
- the dumbest template;
- the pure JavaScript for preprocessing data to render;

Simplified idea is dividing templates into *fragments* of 3 kinds:				
- regular html;
- data blocks - which are just pieces of data converted to string;
- repeated regions - parts of the template which are repeated from any amount of times (including zero);
## How to use	
To start working with fg-js install it with npm:
```
	npm i fg-js
```
After that you need to create a *store* for your fragments of following structure:
```
	/root_folder_for_fragments
		/name_of_your_fragment
			/tpl.jade // template
			/class.js // logic of thefragment
		/another_fragment
		...
```
You need to compile the fragments for frontend then.
It can be done only ones while building your project, thus no need to rebuild it any time when a page is requested.
You can see builder example below:
```
	var fg = require('fg-js');
	
	// building your set of fragments
	fg.build('./fg', './build.js', function(err){
		if (err){
			console.error(err);
			return;
		};
		console.log('done!');
	});
```
This snippet takes fragment sources from './fg' folder and compile it to './build.js' file, that you may include in your web application.
Now you can render the fragment to your page in the following way:
```
	$fg.classes.greeter.renderIn(document.body, {data: {}});
```
Where
- greeter - is your fragment class;
- document.body - is future parent for a fragment
- {data: {}} - is data to be rendered with the template
Example of *tpl.jade* file:
```
	div.greating hello world
```
And example of *class.js* file:
```
	fgClass.on('ready', function(){
	console.log('Greater is ready');
	});
```
**Full documentation is not completed yet, but work in progress.**
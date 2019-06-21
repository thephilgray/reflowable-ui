# reflowable-ui
A Vanilla UI Library (with no dependencies) for Interactive Reflowable-layout EPUBs

This is for a README-driven development refactor.

## Setup

* Include the library in a `<script>` tag before the closing `</body>` tag
* Include your custom script after the library and before the closing `</body>` tag

```html
   <script src="./scripts/reflowable-ui.js" />
   <script src="./scripts/quiz.js" />
</body>
```

* Instantiate

```js


// single quiz
var options = {};
var quiz = new Quiz('[data-quiz]', options);

// multiple quizzes
var quizzes = document.querySelectorAll("[data-quiz]");
quizzes.forEach(function(quiz){
    new Quiz(quiz, options);
});

// named multiple quizzes
var quizContainer1 = document.querySelector('[data-quiz="quiz1"]');
var quizContainer2 = document.querySelector('[data-quiz="quiz2"]');

var quiz1 = new Quiz(quizContainer1, options);
var quiz2 = new Quiz(quizContainer2, options);

```

## HTML
* data-quiz | ???
* data-key | or auto-generate???
* data-type
* data-answer
* data-input

minimal html example

```html
<div data-quiz="true">
    <div data-type="select-many" data-answer="0,3">
        <div data-input="true">One - Correct</div>
        <div data-input="true">Two</div>
        <div data-input="true">Three</div>
        <div data-input="true">Four - Correct</div>
    </div>
</div>
```


## API

### Quiz Module
#### Options


#### Extending

* creating UI for built-in modules

```js
// ./scripts/quiz.js
function extendQuiz(quiz){
var scoreOptions = {};
var score = quiz.useScore(scoreOptions);
score.extend(function(module, context){
    // ui code
});

var storageOptions = {};
var storage = quiz.useStorage(storageOptions);
storage.extend(function(module, context){
    // ui code
});

return {
    modules: [score, storage]
}
};

quiz.extend(extendQuiz);
```

* creating UI for built-in question types

```js
// ./scripts/quiz.js
function extendQuiz(quiz){

var selectMany = quiz.useTypes('select-many');
selectMany.extend(function(module, context){
    // lifecycle hooks?
    // ui code here
});

return {
    types: [selectMany]
}
};

quiz.extend(extendQuiz);
```



#### TODO
* creating a new question type
* creating a new module

```js
// ./scripts/quiz.js
function extendQuiz(quiz){
    var moduleKey = 'new-module';
    var newModule = quiz.createModule(moduleKey);
    newModule.extend(function(module, context){
        // plugin hooks?: init
        // module code here
    });
return {
    modules: [newModule]
}
};
```

### Storage Module
#### Options

* storageKey


### Score Module
#### Options















```js
function Quiz(selector, options) {
        this.modules = {};
        this.options = options;
        this.selector = selector;
        this.types = {
            'select-many': {
					effects: {
						'TOUCHED': function(){
							console.log('touched');
						}
					},
					useEffect: function(effectKey){
						var context = this;
                        var module = context.types['select-many'];
						function setEffect(effectFn){
							module.effects[effectKey] = effectFn;
						}
						return setEffect;
					},
                    extend: function(extendFn){
						var context = this;
                        var module = context.types['select-many'];
						extendFn(module, context);
                }
            }
        }
}

Quiz.prototype.useTypes = function(typeKey){
	var type = this.types[typeKey];
    return {useEffect: type.useEffect.bind(this), extend: type.extend.bind(this)};
}

Quiz.prototype.extend = function(extendFn){
    return extendFn(this);
}

var quiz = new Quiz('test', {a: 'dog', b: 'cat'})

function extendQuiz(context){

// access question type api
var selectMany = context.useTypes('select-many');

// set effect with extend
selectMany.extend(function(module, context){
		module.effects['TOUCHED'] = function(){
		console.log('touched!!!');
		}
	});

// set effect with useEffect
var setSelectManyTouched = selectMany.useEffect('TOUCHED');
setSelectManyTouched(function(){
	console.log('touched!?!?');
});
}

quiz.extend(extendQuiz);
quiz.types['select-many'].effects['TOUCHED']();

```





extend a quiz like this

```js
var quiz = new Quiz();
function extension(quizContext){
    var types = {
        'select-many': {
            states: {
                'TOUCHED': {
                    effects: function(){
                        console.log('touched');
                    }
                }
            }
        }
    };

return {
    types: types
}
}
quiz.extend(extension);
```


extend types like this
```js

```








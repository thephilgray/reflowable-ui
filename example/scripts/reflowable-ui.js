
/* TODO: don't pollute global scope */

// constants
var INITIAL = "INITIAL",
    TOUCHED = "TOUCHED",
    VALIDATED_CORRECT = "VALIDATED_CORRECT",
    VALIDATED_INCORRECT = "VALIDATED_INCORRECT",
    VALIDATED_WITH_ANSWERS = "VALIDATED_WITH_ANSWERS",
    SHOWING_ANSWERS_ONLY = "SHOWING_ANSWERS_ONLY";

// these can be customized
var CONTROL_SELECTOR = '[data-control]',
    INPUT_SELECTOR = '[data-input]',
    PREVIEW_SELECTOR = '[data-preview]';

// data-type, data-key, data-answer rely on dataset functionality and are therefore hard-coded

// context: { before, register, update}
function Exercise(node, context) {
    this.node = node;
    this.type = node.dataset.type;
    this.key = node.dataset.key;
    this.answerKey = node.dataset.answer;
    this.state = {};
    this.eventHandlers = {};
    this.listeners = {};
    this.transitions = context.types[this.type].transitions;

    /* maybe move all this to a before or setup hook in types */
    this.init = function () {
        this.controls = this.node.querySelectorAll(CONTROL_SELECTOR);
        this.inputs = this.node.querySelectorAll(INPUT_SELECTOR);
        this.reset = function () {
            this.setState({
                name: 'INITIAL',
                responses: [],
            })
        };
        this.getResponseKey = function () {
            return this.state.responses.sort().join(",");
        }
        this.compare = function () {
            var responseKey = this.getResponseKey();
            return responseKey === this.answerKey;
        }

        // set initial state
        this.reset();
        this.registerListener('click');
        this.transitions[this.state.name].call(this);

        // context functions are a way for the parent Quiz module to access all the individual exercise instances
        context.register(this, this.key)
    }
    this.init();
}
// dynamically register listeners with event delegation
Exercise.prototype.registerListener = function (type) {
    this.listeners[type] = function (e) {
        var match = Object.keys(this.eventHandlers).filter(function (key) {
            return event.target.matches(key);
        });
        if (match.length === 0 || !this.eventHandlers[match[0]][type]) return;
        var collection = this.node.querySelectorAll(match[0]);
        var targetIndex = Array.prototype.indexOf.call(collection, e.target);
        this.eventHandlers[match[0]][type].call(this, e, targetIndex, collection);
        e.preventDefault();
    }.bind(this)

    this.node.addEventListener(type, this.listeners[type], false);
    console.log("registerd " + type + " listener.");
};

Exercise.prototype.removeListener = function (type) {
    delete this.listeners[type];
    this.node.removeEventListener(type, this.listeners[type]);
    console.log("deregisterd " + type + " listener.");
}

// TODO: provide a way to register an individual handler
// sometimes, we want to do a whole list, but sometimes, we only need to set it once for one element like the Reset button
Exercise.prototype.registerEventHandler = function (selector, type, callback) {
    this.eventHandlers[selector] = {};
    this.eventHandlers[selector][type] = callback.bind(this);
}

// warning: no deep state
Exercise.prototype.setState = function (update) {
    var prevState = Object.assign({}, this.state);
    var newState = Object.assign(prevState, update);
    this.state = newState;

    this.transitions[this.state.name].call(this);
};

function Quiz(selector, options) {
    // helpers
    this.isNode = function isNode(o) {
        return (
            typeof Node === "object" ? o instanceof Node :
                o && typeof o === "object" && typeof o.nodeType === "number" && typeof o.nodeName === "string"
        );
    }

    // setup 
    this.init = function () {
        // if the provided selector is not a node, make it one
        // this is useful for when you want to select multiple quiz elements with querySelectorAll and then instantiate them all at once inside a forEach loop 
        this.node = this.isNode(selector) ? selector : document.querySelector(selector);

        // TODO: handle if data-quiz not used or value is "true"; generate a uuid based on page title; reusue as storage key
        this.key = this.node.dataset.quiz;
        this.exerciseNodes = this.node.querySelectorAll('[data-type]');

        // instantiate exercises
        this.exerciseNodes.forEach(function (exerciseNode) {
            new Exercise(exerciseNode, this.context);
        }, this);
    }

    // TODO: is there any way to consolidate some of the operations into a set of shared helpers; there's a lot of repetition, even in this first example

    // default transitions; default: select-many
    this.transitions = {
        [INITIAL]: function () {
            this.controls[0].textContent = 'Check';
            // enable inputs
            this.inputs.forEach(function (input) {
                input.disabled = false;
                input.removeAttribute('data-toggled');
                input.removeAttribute('data-correct');
                input.removeAttribute('data-incorrect');
            });
            // disabled controls
            this.controls.forEach(function (control) {
                control.setAttribute('disabled', true);
            });

            // reset inputs
            this.inputs.forEach(function (input) {
                input.removeAttribute('data-toggled');
            });
            // register custom click handler for [data-input] selector
            this.registerEventHandler(INPUT_SELECTOR, 'click', function (e, targetIndex, collection) {
                var responses = [].concat(this.state.responses);
                // if it already exists in responses
                var matchingIndex = responses.indexOf(targetIndex);
                if (matchingIndex === -1) {
                    responses.push(targetIndex);
                }
                else {
                    responses.splice(matchingIndex, 1);
                }
                this.setState({ name: TOUCHED, responses: responses });
            });
        },
        [TOUCHED]: function () {
            console.log(this.key + " " + TOUCHED);
            // re-enable controls
            this.controls.forEach(function (control) {
                control.disabled = false;
            });
            console.log(this.state);
            // toggle all the inputs in the response set
            this.inputs.forEach(function (input, i) {
                var isToggled = this.state.responses.indexOf(i);
                if (isToggled === -1) {
                    input.removeAttribute('data-toggled');
                }
                else {
                    input.setAttribute('data-toggled', true);
                }
            }, this);

            this.registerEventHandler(CONTROL_SELECTOR, 'click', function (e, targetIndex, collection) {
                // handle check
                if (targetIndex === 0) {
                    console.log('handle check....');
                    var isCorrect = this.compare();
                    if (isCorrect) {
                        this.setState({
                            name: VALIDATED_CORRECT,
                            responses: this.state.responses,
                            attempts: (this.state.attempts || 0) + 1
                        });
                    }
                    else {
                        this.setState({
                            name: VALIDATED_INCORRECT,
                            responses: this.state.responses,
                            attempts: (this.state.attempts || 0) + 1
                        });

                    }
                }
                // handle reset
                if (targetIndex === 1) {
                    this.reset();
                }
            });

        },
        [VALIDATED_CORRECT]: function () {
            // disabled inputs
            this.inputs.forEach(function (input) {
                input.setAttribute('disabled', true);
                if (input.dataset.toggled) {
                    input.setAttribute('data-correct', true);
                }
            });
            console.log(this.state);
            this.controls[0].setAttribute('disabled', true);
            this.controls[0].textContent = 'Correct';
        },
        [VALIDATED_INCORRECT]: function () {
            // disabled inputs
            this.inputs.forEach(function (input, i) {
                input.setAttribute('disabled', true);
                var shouldBeCorrect = this.answerKey.split(',').map(Number).indexOf(i) > -1;
                var toggled = input.dataset.toggled;
                if (toggled && shouldBeCorrect) {
                    input.setAttribute('data-correct', true);
                }
                if (toggled && !shouldBeCorrect) {
                    input.setAttribute('data-incorrect', true);
                }
            }, this);
            console.log(this.state);
            this.controls[0].textContent = 'Show Answers';

            this.registerEventHandler(CONTROL_SELECTOR, 'click', function (e, targetIndex, collection) {
                // handle check
                if (targetIndex === 0) {
                    this.setState({
                        name: VALIDATED_WITH_ANSWERS
                    });
                }
                // handle reset
                if (targetIndex === 1) {
                    this.reset();
                }
            });

        },
        [VALIDATED_WITH_ANSWERS]: function () {
            this.controls[0].textContent = 'Show Only Answers';
            this.inputs.forEach(function (input, i) {
                var shouldBeCorrect = this.answerKey.split(',').map(Number).indexOf(i) > -1;
                if (shouldBeCorrect) {
                    input.setAttribute('data-toggled', true);
                }
            }, this);

            this.registerEventHandler(CONTROL_SELECTOR, 'click', function (e, targetIndex, collection) {
                // handle check
                if (targetIndex === 0) {
                    this.setState({
                        name: SHOWING_ANSWERS_ONLY
                    });
                }
                // handle reset
                if (targetIndex === 1) {
                    this.reset();
                }
            });

        },
        [SHOWING_ANSWERS_ONLY]: function () {
            this.controls[0].setAttribute('disabled', true);
            this.inputs.forEach(function (input, i) {
                var shouldBeCorrect = this.answerKey.split(',').map(Number).indexOf(i) > -1;
                if (shouldBeCorrect) {
                    input.setAttribute('data-toggled', true);
                }
                else {
                    input.removeAttribute('data-toggled');
                }

            }, this);

        }
    }

    this.types = {
        'select-many': {
            transitions: this.transitions,
            // actions: {}
        },
        'select-one': {
            transitions: this.transitions,
        },
        'match-pairs': {
            transitions: this.transitions,
        },
        'write-in': {
            transitions: this.transitions,
        },
        'word-order': {
            transitions: this.transitions,
        }
    }

    // ideally, extensions can add functionality to the context functions; for instance, storage and scoring can be managed here
    this.context = {
        register: function (exercise, key) {
            if (!this.exercises) {
                this.exercises = {};
            }
            this.exercises[key] = exercise;
            if (Object.keys(this.exercises).length === this.exerciseNodes.length) {
                console.log('registration complete....');
                // we don't need these anymore?
                delete this.exerciseNodes;
            }
            return;
        }.bind(this),
        types: this.types
        // before: fn,
        // update: fn
    };

    // initialize quiz
    this.init();

}

Quiz.prototype.extendTypes = function () {
    // this is where the developer can completely customize each question type, and even add types
    // should have access to the default types and transitions and be able to merge over these to add or override
    // this could be executed automatically for the developer if they provide the updates in an options object
}

// instantiate one quiz (with a reference)
var quiz = new Quiz('[data-quiz]');
console.log(quiz);

// instantiate multiple quizzes (without reference)
// document.querySelectorAll('[data-quiz]').forEach(function (quiz) {
//     return new Quiz(quiz);
// });

// instantiate multiple quizzes (with a reference)
// var quizzes = Array.from(document.querySelectorAll('[data-quiz]')).map(function (quiz) {
//     return new Quiz(quiz);
// });
// console.log(quizzes);

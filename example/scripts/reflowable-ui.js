var Quiz = (function () {
    // constants
    var INITIAL = "INITIAL",
        TOUCHED = "TOUCHED",
        VALIDATED_CORRECT = "VALIDATED_CORRECT",
        VALIDATED_INCORRECT = "VALIDATED_INCORRECT",
        VALIDATED_WITH_ANSWERS = "VALIDATED_WITH_ANSWERS",
        SHOWING_ANSWERS_ONLY = "SHOWING_ANSWERS_ONLY";

    // these selectors can be customized
    var INPUT_SELECTOR = '[data-input]',
        PREVIEW_SELECTOR = '[data-preview]',
        RESET_CONTROL_SELECTOR = '[data-reset-control]',
        VALIDATE_CONTROL_SELECTOR = '[data-validate-control]',
        ANSWER_SLOT_SELECTOR = '[data-answer-slot]';

    // these attributes can be customized
    var DATA_TOGGLED_ATTRIBUTE = 'data-toggled',
        DATA_CORRECT_ATTRIBUTE = 'data-correct',
        DATA_INCORRECT_ATTRIBUTE = 'data-incorrect',
        DATA_SLOT_ACTIVE_ATTRIBUTE = 'data-slot-active';

    // helpers
    function isNode(o) {
        return (
            typeof Node === "object" ? o instanceof Node :
            o && typeof o === "object" && typeof o.nodeType === "number" && typeof o.nodeName === "string"
        );
    }

    /*=============================================
    =            default options            =
    =============================================*/
    // TODO: not actually functional yet
    var defaultOptions = {
        INPUT_SELECTOR,
        PREVIEW_SELECTOR,
        RESET_CONTROL_SELECTOR,
        VALIDATE_CONTROL_SELECTOR,
        ANSWER_SLOT_SELECTOR,
        DATA_TOGGLED_ATTRIBUTE,
        DATA_CORRECT_ATTRIBUTE,
        DATA_INCORRECT_ATTRIBUTE,
        DATA_SLOT_ACTIVE_ATTRIBUTE,
        extend: function () {
            console.log('default extend....');
        }
    }

    /*=====  End of default options  ======*/

    /*=============================================
    =            UI: default type            =
    =============================================*/

    var defaultType = {
        before: function () {},
        reset: function () {
            this.setState({
                name: 'INITIAL',
                responses: [],
            })
        },
        compare: function () {
            var responseKey = this.getResponseKey();
            return responseKey === this.answerKey;
        },
        getResponseKey: function () {
            return this.state.responses.sort().join(",");
        },
        update: function () {
            console.log('update select many....')
        },
        components: {
            'validate-button': VALIDATE_CONTROL_SELECTOR,
            'reset-button': RESET_CONTROL_SELECTOR,
            'answer-inputs': INPUT_SELECTOR
        },
        transitions: {
            [INITIAL]: {
                'validate-button': {
                    effects: function (el) {
                        el.textContent = 'Check';
                        el.setAttribute('disabled', true);
                    },
                },
                'reset-button': {
                    effects: function (el) {
                        el.setAttribute('disabled', true);
                    }
                },
                'answer-inputs': {
                    effects: function (el) {
                        el.disabled = false;
                        el.removeAttribute(DATA_TOGGLED_ATTRIBUTE);
                        el.removeAttribute(DATA_CORRECT_ATTRIBUTE);
                        el.removeAttribute(DATA_INCORRECT_ATTRIBUTE);
                    },
                    handlers: {
                        click: function (e, targetIndex) {
                            var responses = [].concat(this.state.responses);
                            // if it already exists in responses
                            var matchingIndex = responses.indexOf(targetIndex);
                            if (matchingIndex === -1) {
                                responses.push(targetIndex);
                            } else {
                                responses.splice(matchingIndex, 1);
                            }
                            this.setState({
                                name: TOUCHED,
                                responses: responses
                            });
                        }
                    }
                }
            },
            [TOUCHED]: {
                'validate-button': {
                    effects: function (el) {
                        el.disabled = false;
                    },
                    handlers: {
                        click: function (e) {
                            // handle check
                            var isCorrect = this.compare();
                            if (isCorrect) {
                                this.setState({
                                    name: VALIDATED_CORRECT,
                                    responses: this.state.responses,
                                    attempts: (this.state.attempts || 0) + 1
                                });
                            } else {
                                this.setState({
                                    name: VALIDATED_INCORRECT,
                                    responses: this.state.responses,
                                    attempts: (this.state.attempts || 0) + 1
                                });
                            }

                        }
                    }
                },
                'reset-button': {
                    effects: function (el) {
                        el.disabled = false;
                    },
                    handlers: {
                        click: function (e) {
                            this.reset();
                        }
                    }
                },
                'answer-inputs': {
                    effects: function (el, i) {
                        var isToggled = this.state.responses.indexOf(i);
                        if (isToggled === -1) {
                            el.removeAttribute(DATA_TOGGLED_ATTRIBUTE);
                        } else {
                            el.setAttribute(DATA_TOGGLED_ATTRIBUTE, true);
                        }
                    },
                }
            },
            [VALIDATED_CORRECT]: {
                'answer-inputs': {
                    effects: function (el) {
                        el.setAttribute('disabled', true);
                        if (el.dataset.toggled) {
                            el.setAttribute(DATA_CORRECT_ATTRIBUTE, true);
                        }
                    }
                },
                'validate-button': {
                    effects: function (el) {
                        el.setAttribute('disabled', true);
                        el.textContent = 'Correct';
                    }
                },
                'reset-button': {
                    effects: function (el) {
                        el.removeAttribute('disabled');
                    },
                    handlers: {
                        click: function () {
                            this.reset();
                        }
                    }
                }
            },
            [VALIDATED_INCORRECT]: {
                'answer-inputs': {
                    effects: function (el, i) {
                        // disabled inputs
                        el.setAttribute('disabled', true);
                        var shouldBeCorrect = this.answerKey.split(',').map(Number).indexOf(i) > -1;
                        var toggled = el.dataset.toggled;
                        if (toggled && shouldBeCorrect) {
                            el.setAttribute(DATA_CORRECT_ATTRIBUTE, true);
                        }
                        if (toggled && !shouldBeCorrect) {
                            el.setAttribute(DATA_INCORRECT_ATTRIBUTE, true);
                        }
                    }
                },
                'validate-button': {
                    effects: function (el) {
                        el.textContent = 'Show Answers';
                    },
                    handlers: {
                        click: function (e) {
                            this.setState({
                                name: VALIDATED_WITH_ANSWERS
                            });
                        }
                    }
                },
                'reset-button': {
                    click: function () {
                        this.reset();
                    }
                }
            },
            [VALIDATED_WITH_ANSWERS]: {
                'answer-inputs': {
                    effects: function (el, i) {
                        var shouldBeCorrect = this.answerKey.split(',').map(Number).indexOf(i) > -1;
                        if (shouldBeCorrect) {
                            el.setAttribute(DATA_TOGGLED_ATTRIBUTE, true);
                        } else {
                            el.removeAttribute(DATA_TOGGLED_ATTRIBUTE);
                        }
                    }
                },
                'reset-button': {
                    handlers: {
                        click: function () {
                            this.reset();
                        }
                    }
                },
                'validate-button': {
                    effects: function (el) {
                        el.textContent = 'Show Answers Only';
                    },
                    handlers: {
                        click: function () {
                            this.setState({
                                name: SHOWING_ANSWERS_ONLY
                            });
                        }
                    }
                }
            },
            [SHOWING_ANSWERS_ONLY]: {
                'answer-inputs': {
                    effects: function (el, i) {
                        // remove validations
                        el.removeAttribute(DATA_CORRECT_ATTRIBUTE);
                        el.removeAttribute(DATA_INCORRECT_ATTRIBUTE);

                        var shouldBeCorrect = this.answerKey.split(',').map(Number).indexOf(i) > -1;
                        if (shouldBeCorrect) {
                            el.setAttribute(DATA_TOGGLED_ATTRIBUTE, true);
                        } else {
                            el.removeAttribute(DATA_TOGGLED_ATTRIBUTE);
                        }
                    }
                },
                'validate-button': {
                    effects: function (el) {
                        el.setAttribute('disabled', true);
                        el.textContent = 'Showing Answers';
                        // el.blur();
                    }
                },
                'reset-button': {
                    effects: function (el) {
                        // el.focus();
                    }
                }

            }
        }
    };

    /*=====  End of default type  ======*/

    /*=============================================
    =            UI: All Available Types            =
    =============================================*/

    var types = {
        /**
         *
         * select-many - same as the default type
         *
         */
        'select-many': _.merge({}, defaultType, {}),

        /**
         *
         * select-one, example: true or false
         *
         */
        'select-one': _.merge({}, defaultType, {
            transitions: {
                [INITIAL]: {
                    'answer-inputs': {
                        handlers: {
                            click: function (e, targetIndex) {
                                var responses = [];
                                // if it already exists in responses
                                var matchingIndex = responses.indexOf(targetIndex);
                                if (matchingIndex === -1) {
                                    responses.push(targetIndex);
                                }

                                this.setState({
                                    name: TOUCHED,
                                    responses: responses
                                });
                            }
                        }

                    }

                },
                [VALIDATED_INCORRECT]: {
                    'validate-button': {
                        effects: function (el) {
                            el.textContent = 'Show Answer';
                        },
                        handlers: {
                            click: function (e) {
                                this.setState({
                                    name: SHOWING_ANSWERS_ONLY
                                });
                            }
                        }
                    },
                }
            }
        }),

        /**
         *
         * word-order
         *
         */
        'word-order': _.merge({}, defaultType, {
            before: function () {
                this.originalSlotText = [];
                this.components['answer-slot'].nodes.forEach(function (slot) {
                    this.originalSlotText.push(slot.textContent);
                }, this);
            },
            reset: function () {
                this.setState({
                    name: 'INITIAL',
                    responses: Array(this.answerKey.split(',').length).fill(null),
                    currentSlot: 0
                })
            },
            components: {
                'validate-button': VALIDATE_CONTROL_SELECTOR,
                'reset-button': RESET_CONTROL_SELECTOR,
                'answer-inputs': INPUT_SELECTOR,
                'answer-slot': ANSWER_SLOT_SELECTOR
            },
            transitions: {
                [INITIAL]: {
                    'answer-slot': {
                        effects: function (el, i) {

                            // reset
                            el.removeAttribute(DATA_CORRECT_ATTRIBUTE);
                            el.removeAttribute(DATA_INCORRECT_ATTRIBUTE);

                            el.textContent = this.originalSlotText[i];
                            // set the first slot as active
                            if (i === this.state.currentSlot) {
                                el.setAttribute(DATA_SLOT_ACTIVE_ATTRIBUTE, true);
                            } else {
                                el.removeAttribute(DATA_SLOT_ACTIVE_ATTRIBUTE);
                            }
                        },
                        handlers: {
                            click: function (e, targetIndex) {
                                this.setState({
                                    currentSlot: targetIndex
                                });
                            }
                        }
                    },
                    'answer-inputs': {
                        effects: function (el) {
                            el.disabled = false;
                            el.removeAttribute(DATA_TOGGLED_ATTRIBUTE);
                            el.removeAttribute(DATA_CORRECT_ATTRIBUTE);
                            el.removeAttribute(DATA_INCORRECT_ATTRIBUTE);
                        },
                        handlers: {
                            click: function (e, targetIndex) {
                                var responses = [].concat(this.state.responses);
                                // if it already exists in responses
                                var matchingIndex = responses.indexOf(targetIndex);
                                if (matchingIndex === -1) {
                                    responses[this.state.currentSlot] = targetIndex
                                } else {
                                    responses.splice(matchingIndex, 1);
                                }

                                // automatically increment the currentSlot
                                var incrementedCurrentSlot = this.state.currentSlot < this.state.responses.length - 1 ? this.state.currentSlot + 1 : 0;

                                this.setState({
                                    name: TOUCHED,
                                    responses: responses,
                                    currentSlot: incrementedCurrentSlot
                                });

                            }
                        }
                    }
                },
                [TOUCHED]: {
                    'answer-slot': {
                        effects: function (el, i) {
                            if (this.state.responses[i] || this.state.responses[i] === 0) {
                                el.textContent = this.components['answer-inputs'].nodes[this.state.responses[i]].textContent;
                            }

                            if (i === this.state.currentSlot) {
                                el.setAttribute(DATA_SLOT_ACTIVE_ATTRIBUTE, true);
                            } else {
                                el.removeAttribute(DATA_SLOT_ACTIVE_ATTRIBUTE);
                            }
                        }
                    },
                    'answer-inputs': {
                        effects: function (el, i) {
                            var isToggled = this.state.responses.indexOf(i);
                            if (isToggled === -1) {
                                el.removeAttribute(DATA_TOGGLED_ATTRIBUTE);
                                el.removeAttribute('disabled');
                            } else {
                                el.setAttribute(DATA_TOGGLED_ATTRIBUTE, true);
                                el.setAttribute('disabled', true);
                            }
                        },
                    }
                },
                [VALIDATED_CORRECT]: {
                    'answer-slot': {
                        effects: function (el) {
                            el.setAttribute('disabled', true);
                            el.setAttribute(DATA_CORRECT_ATTRIBUTE, true);
                        }
                    },
                    'answer-inputs': {
                        effects: function (el) {
                            el.setAttribute('disabled', true);
                        }
                    },
                    'validate-button': {
                        effects: function (el) {
                            el.setAttribute('disabled', true);
                            el.textContent = 'Correct';
                        }
                    },
                    'reset-button': {
                        effects: function (el) {
                            el.removeAttribute('disabled');
                        },
                        handlers: {
                            click: function () {
                                this.reset();
                            }
                        }
                    }
                },
                [VALIDATED_INCORRECT]: {
                    'answer-slot': {
                        effects: function (el, i) {
                            var toggled = this.state.responses[i] || this.state.responses[i] === 0;
                            var isCorrect = this.answerKey.split(',')[i] == this.state.responses[i]
                            if (toggled && isCorrect) {
                                el.setAttribute(DATA_CORRECT_ATTRIBUTE, true);
                            }
                            if (toggled && !isCorrect) {
                                el.setAttribute(DATA_INCORRECT_ATTRIBUTE, true);
                            }
                        }
                    },
                    'answer-inputs': {
                        effects: function (el, i) {
                            // disabled inputs
                            el.setAttribute('disabled', true);
                            var shouldBeCorrect = this.answerKey.split(',').map(Number).indexOf(i) > -1;
                            var toggled = el.dataset.toggled;
                        }
                    },
                    'validate-button': {
                        effects: function (el) {
                            el.textContent = 'Show Answers';
                        },
                        handlers: {
                            click: function (e) {
                                this.setState({
                                    name: VALIDATED_WITH_ANSWERS
                                });
                            }
                        }
                    },
                    'reset-button': {
                        click: function () {
                            this.reset();
                        }
                    }
                },
                [VALIDATED_WITH_ANSWERS]: {
                    'answer-slot': {
                        effects: function (el, i) {
                            // if it's an incorrect answer
                            var correctAnswer = this.answerKey.split(',')[i];
                            var isCorrect = correctAnswer == this.state.responses[i];
                            if (!isCorrect) {
                                el.removeAttribute(DATA_INCORRECT_ATTRIBUTE);
                                el.textContent = this.components['answer-inputs'].nodes[correctAnswer].textContent;
                            }

                        }
                    },
                },
                [SHOWING_ANSWERS_ONLY]: {
                    'answer-slot': {
                        effects: function (el, i) {
                            var correctAnswer = this.answerKey.split(',')[i];
                            el.removeAttribute(DATA_INCORRECT_ATTRIBUTE);
                            el.removeAttribute(DATA_CORRECT_ATTRIBUTE);
                            el.textContent = this.components['answer-inputs'].nodes[correctAnswer].textContent;
                        }
                    }
                }
            }
        }),

        /**
         *
         * match-pairs
         *
         */
        // match-pairs is actually exactly like word-order except the compare function and before? TODO: refactor to extend word-order
        'match-pairs': _.merge({}, defaultType, {
            before: function () {
                this.originalSlotText = [];
                this.components['answer-slot'].nodes.forEach(function (slot) {
                    this.originalSlotText.push(slot.textContent);
                }, this);

                // match pairs helpers
                function chunkArray(arr, size) {
                    var chunks = [];
                    var currentChunk = [];
                    var chunkIndex = 0;
                    for (var i = 0; i < arr.length; i++) {
                        currentChunk.push(arr[i]);
                        chunkIndex++;
                        if (chunkIndex === size || arr.length - i === 1) {
                            chunks.push(currentChunk);
                            currentChunk = [];
                            chunkIndex = 0;
                        }
                    }
                    return chunks;
                }

                this.chunkArray = chunkArray;

                this.chunkSortAndFlatten = function chunkSortAndFlatten(str) {
                    return chunkArray(str.split(","), 2)
                        .map(function (arr) {
                            return arr.sort();
                        })
                        .sort()
                        .map(function (arr) {
                            return arr.join(",");
                        })
                        .join(",");
                }

                this.answerMap = this.answerKey.split(',').map(Number).reduce(function (acc, curr, i, arr) {
                    var isEven = i % 2 === 0;
                    var delta = isEven ? 1 : -1;
                    var match = arr[i + delta];
                    acc[curr] = match
                    return acc;
                }, {});

                this.getValidationMap = function () {
                    return this.state.responses.map(function (response, i, arr) {
                        var isEven = i % 2 === 0;
                        var delta = isEven ? 1 : -1;
                        var match = arr[i + delta];
                        return {
                            self: response,
                            match: this.answerMap[response],
                            isCorrect: this.answerMap[response] === match
                        }
                    }, this);
                }

            },
            reset: function () {
                this.setState({
                    name: 'INITIAL',
                    responses: Array(this.answerKey.split(',').length).fill(null),
                    currentSlot: 0
                })
            },
            compare: function () {
                var responseKey = this.getResponseKey();
                return this.chunkSortAndFlatten(responseKey) === this.chunkSortAndFlatten(this.answerKey);
            },
            getResponseKey: function () {
                return this.state.responses.join(",");
            },
            update: function () {
                console.log('update word order....')
            },
            components: {
                'validate-button': VALIDATE_CONTROL_SELECTOR,
                'reset-button': RESET_CONTROL_SELECTOR,
                'answer-inputs': INPUT_SELECTOR,
                'answer-slot': ANSWER_SLOT_SELECTOR
            },
            transitions: {
                [INITIAL]: {
                    'answer-slot': {
                        effects: function (el, i) {

                            // reset
                            this.validationMap = null;
                            this.previousMatches = null;
                            this.pair = null;

                            el.removeAttribute(DATA_CORRECT_ATTRIBUTE);
                            el.removeAttribute(DATA_INCORRECT_ATTRIBUTE);

                            el.textContent = this.originalSlotText[i];
                            // set the first slot as active
                            if (i === this.state.currentSlot) {
                                el.setAttribute(DATA_SLOT_ACTIVE_ATTRIBUTE, true);
                            } else {
                                el.removeAttribute(DATA_SLOT_ACTIVE_ATTRIBUTE);
                            }
                        },
                        handlers: {
                            click: function (e, targetIndex) {
                                this.setState({
                                    currentSlot: targetIndex
                                });
                            }
                        }
                    },
                    'answer-inputs': {
                        effects: function (el) {
                            el.disabled = false;
                            el.removeAttribute(DATA_TOGGLED_ATTRIBUTE);
                            el.removeAttribute(DATA_CORRECT_ATTRIBUTE);
                            el.removeAttribute(DATA_INCORRECT_ATTRIBUTE);
                        },
                        handlers: {
                            click: function (e, targetIndex) {
                                var responses = [].concat(this.state.responses);
                                // if it already exists in responses
                                var matchingIndex = responses.indexOf(targetIndex);
                                if (matchingIndex === -1) {
                                    responses[this.state.currentSlot] = targetIndex
                                } else {
                                    responses.splice(matchingIndex, 1);
                                }

                                // automatically increment the currentSlot
                                var incrementedCurrentSlot = this.state.currentSlot < this.state.responses.length - 1 ? this.state.currentSlot + 1 : 0;

                                this.setState({
                                    name: TOUCHED,
                                    responses: responses,
                                    currentSlot: incrementedCurrentSlot
                                });

                            }
                        }
                    }
                },
                [TOUCHED]: {
                    'answer-slot': {
                        effects: function (el, i) {
                            if (this.state.responses[i] || this.state.responses[i] === 0) {
                                el.textContent = this.components['answer-inputs'].nodes[this.state.responses[i]].textContent;
                            }

                            if (i === this.state.currentSlot) {
                                el.setAttribute(DATA_SLOT_ACTIVE_ATTRIBUTE, true);
                            } else {
                                el.removeAttribute(DATA_SLOT_ACTIVE_ATTRIBUTE);
                            }
                        }
                    },
                    'answer-inputs': {
                        effects: function (el, i) {
                            var isToggled = this.state.responses.indexOf(i);
                            if (isToggled === -1) {
                                el.removeAttribute(DATA_TOGGLED_ATTRIBUTE);
                                el.removeAttribute('disabled');
                            } else {
                                el.setAttribute(DATA_TOGGLED_ATTRIBUTE, true);
                                el.setAttribute('disabled', true);
                            }
                        },
                    }
                },
                [VALIDATED_CORRECT]: {
                    'answer-slot': {
                        effects: function (el) {
                            el.setAttribute('disabled', true);
                            el.setAttribute(DATA_CORRECT_ATTRIBUTE, true);
                        }
                    },
                    'answer-inputs': {
                        effects: function (el) {
                            el.setAttribute('disabled', true);
                        }
                    },

                },
                [VALIDATED_INCORRECT]: {
                    'answer-slot': {
                        effects: function (el, i) {
                            // set the validation map the first time
                            if (!this.validationMap) {
                                this.validationMap = this.getValidationMap();
                                // console.log(this.validationMap);
                            }
                            if (this.validationMap[i].isCorrect) {
                                el.setAttribute(DATA_CORRECT_ATTRIBUTE, true);
                            } else {
                                el.setAttribute(DATA_INCORRECT_ATTRIBUTE, true);
                            }
                        }
                    },
                    'answer-inputs': {
                        effects: function (el, i) {
                            // disable inputs
                            el.setAttribute('disabled', true);
                        }
                    },
                    'validate-button': {
                        effects: function (el) {
                            el.textContent = 'Show Answers';
                        },
                        handlers: {
                            click: function (e) {
                                this.setState({
                                    name: SHOWING_ANSWERS_ONLY
                                });
                            }
                        }
                    },
                },
                [VALIDATED_WITH_ANSWERS]: {
                    'answer-slot': {
                        // TODO: fix -- this still doesn't work; i.e., if there are blanks; skipping for now
                        effects: function (el, i) {
                            // get validation map if it doesn't already exist
                            if (!this.validationMap) {
                                this.validationMap = this.getValidationMap();
                            }
                            if (!this.previousMatches) {
                                this.previousMatches = [];
                                this.pair = [];
                            }

                            var current = this.validationMap[i];
                            var isCorrect = current.isCorrect;
                            var first = i % 2 === 0;
                            var answer;
                            if (isCorrect) {
                                this.previousMatches.push(current.self);
                            }
                            // if it's incorrect and the first of a pair
                            if (!isCorrect) {
                                el.removeAttribute(DATA_INCORRECT_ATTRIBUTE);
                                if (first) {
                                    if (this.previousMatches.indexOf(current.self) > -1) {
                                        current = this.validationMap.filter(function (response) {
                                            return this.previousMatches.indexOf(response.self) === -1 && !response.isCorrect
                                        }, this)[0];
                                    }
                                    answer = current.self
                                    this.pair.push(answer);
                                    el.textContent = this.components['answer-inputs'].nodes[answer].textContent;
                                }
                                if (!first) {
                                    answer = this.answerMap[this.pair[0]]
                                    this.pair.push(answer);
                                    el.textContent = this.components['answer-inputs'].nodes[answer].textContent;
                                    this.previousMatches = this.previousMatches.concat(this.pair);
                                    this.pair = [];
                                }

                            }

                        }
                    },
                },
                [SHOWING_ANSWERS_ONLY]: {
                    'answer-slot': {
                        effects: function (el, i) {
                            var correctAnswer = this.answerKey.split(',')[i];
                            el.removeAttribute(DATA_INCORRECT_ATTRIBUTE);
                            el.removeAttribute(DATA_CORRECT_ATTRIBUTE);
                            el.textContent = this.components['answer-inputs'].nodes[correctAnswer].textContent;
                        }
                    }
                }
            }
        }),

        /**
         *
         * write-in
         *
         */
        'write-in': _.merge({}, defaultType, {
            before: function () {

            },
            reset: function () {
                this.setState({
                    name: 'INITIAL',
                    responses: "",
                })
            },
            compare: function () {
                var responseKey = this.getResponseKey();
                return responseKey === this.answerKey.trim().toLowerCase();
            },
            getResponseKey: function () {
                return this.state.responses.trim().toLowerCase();
            },
            components: {
                'validate-button': VALIDATE_CONTROL_SELECTOR,
                'reset-button': RESET_CONTROL_SELECTOR,
                'answer-inputs': INPUT_SELECTOR
            },
            transitions: {
                [INITIAL]: {
                    'answer-inputs': {
                        effects: function (el) {
                            el.value = "";
                            el.disabled = false;
                            el.removeAttribute(DATA_TOGGLED_ATTRIBUTE);
                            el.removeAttribute(DATA_CORRECT_ATTRIBUTE);
                            el.removeAttribute(DATA_INCORRECT_ATTRIBUTE);
                        },
                        handlers: {
                            keyup: function (e, targetIndex) {
                                this.setState({
                                    name: TOUCHED
                                });
                            }
                        }
                    }
                },
                [TOUCHED]: {
                    'validate-button': {
                        handlers: {
                            click: function (e) {
                                // handle check
                                this.setState({
                                    name: TOUCHED,
                                    responses: this.components['answer-inputs'].nodes[0].value
                                })
                                var isCorrect = this.compare();
                                if (isCorrect) {
                                    this.setState({
                                        name: VALIDATED_CORRECT,
                                        responses: this.state.responses,
                                        attempts: (this.state.attempts || 0) + 1
                                    });
                                } else {
                                    this.setState({
                                        name: VALIDATED_INCORRECT,
                                        responses: this.state.responses,
                                        attempts: (this.state.attempts || 0) + 1
                                    });
                                }

                            }
                        }
                    },
                    'answer-inputs': {
                        effects: function (el, i) {
                            el.setAttribute(DATA_TOGGLED_ATTRIBUTE, true);
                        },
                    }
                },
                [VALIDATED_CORRECT]: {
                    'answer-inputs': {
                        effects: function (el) {
                            el.setAttribute('disabled', true);
                            el.setAttribute(DATA_CORRECT_ATTRIBUTE, true);
                        }
                    },
                },
                [VALIDATED_INCORRECT]: {
                    'answer-inputs': {
                        effects: function (el, i) {
                            // disabled inputs
                            el.setAttribute('disabled', true);
                            el.setAttribute(DATA_INCORRECT_ATTRIBUTE, true);
                        }
                    },
                    'validate-button': {
                        effects: function (el) {
                            el.textContent = 'Show Answer';
                        },
                        handlers: {
                            click: function (e) {
                                this.setState({
                                    name: SHOWING_ANSWERS_ONLY
                                });
                            }
                        }
                    },
                },
                [SHOWING_ANSWERS_ONLY]: {
                    'answer-inputs': {
                        effects: function (el, i) {
                            el.value = this.answerKey;
                            el.setAttribute(DATA_TOGGLED_ATTRIBUTE, true);
                            el.removeAttribute(DATA_TOGGLED_ATTRIBUTE);
                        }
                    },
                }
            }
        }),

        /**
         *
         * find-and-select
         *
         */

        // this is just an example, but the actual implementation might need by a custom type like find-pattern-compound-words, 
        // because the pattern will likely be very large and not ideal for including in the html
        // this is actually exactly the same as 'select-many', except for it's before function
        // a custom version could change the before function with a hard-coded pattern
        'find-pattern': _.merge({}, defaultType, {
            before: function () {
                // this way works too, different html setup though
                // var inputArea = this.node.querySelector('[data-input-pattern]');
                // var inputPattern = new RegExp(inputArea.dataset.inputPattern, 'gi');
                // var inputCount = 0;

                // inputArea.innerHTML = inputArea.innerHTML.replace(inputPattern, function replacer(match){
                //     inputCount += 1;
                //     return "<span data-input='true'>" + match + "</span>";
                // });

                // this.node.setAttribute('data-answer', Array(inputCount).fill(0).map(function(m, i){ return i;}).join());
                // this.answerKey = Array(inputCount).fill(0).map(function(m, i){ return i;}).join();

                // // need to register components again 
                // // this.registerComponents();
                // this.registerComponent('answer-inputs', INPUT_SELECTOR);

                // this is a little more complex, but preserves a more standard html setup; 
                // the answer is the pattern

                var inputPattern = new RegExp(this.answerKey, 'gi');
                var inputCount = 0;

                this.components['answer-inputs'].nodes[0].innerHTML = this.components['answer-inputs'].nodes[0].innerHTML.replace(inputPattern, function replacer(match) {
                    inputCount += 1;
                    return "<span data-input='true'>" + match + "</span>";
                });

                this.node.setAttribute('data-answer', Array(inputCount).fill(0).map(function (m, i) {
                    return i;
                }).join());
                this.answerKey = Array(inputCount).fill(0).map(function (m, i) {
                    return i;
                }).join();

                // remove original answer input
                this.components['answer-inputs'].nodes[0].removeAttribute('data-input');

                // need to register components again                 
                this.registerComponent('answer-inputs', INPUT_SELECTOR);
            },
        }),
    };

    /*=====  End of All Available Types  ======*/

    /*=============================================
    =   Classes - lifecycle, hooks, and higher-level functionality      =
    =============================================*/

    // data-type, data-key, data-answer rely on dataset functionality and are therefore hard-coded
    function Input(name, selector, parentNode) {
        this.name = name;
        this.selector = selector;
        var nodes = parentNode.querySelectorAll(selector);
        this.nodes = Array.prototype.slice.call(nodes);
    }

    // context: { before, register, update}
    function Exercise(node, context, options) {
        this.node = node;
        this.options = options;
        this.context = context;
        this.type = node.dataset.type;
        this.key = node.dataset.key;
        this.answerKey = node.dataset.answer;
        this.state = {};
        this.eventHandlers = {};
        this.listeners = {};
        this.components = {};
        this.transitions = context.types[this.type].transitions;

        /* maybe move all this to a before or setup hook in types */
        this.init = function () {
            this.context.beforeEach.call(this);
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
    };

    Exercise.prototype.registerEventHandler = function (selector, type, callback) {
        if (!this.listeners[type]) {
            this.registerListener(type);
        }
        this.eventHandlers[selector] = {};
        this.eventHandlers[selector][type] = callback.bind(this);
    }

    Exercise.prototype.registerComponent = function registerComponent(name, selector) {
        this.components[name] = new Input(name, selector, this.node);
    }

    // TODO: perhaps handle registration automatically, by gathering the keys from the transitions? Potential issue: there may be some transitions that are copied from the default type that aren't used in the current implementation
    Exercise.prototype.registerComponents = function registerComponents() {
        var components = this.context.types[this.type].components;

        Object.keys(components).forEach(function (component) {
            this.registerComponent(component, components[component]);
        }, this);
    }

    // warning: no deep state
    Exercise.prototype.setState = function (update) {
        // update state
        var prevState = Object.assign({}, this.state);
        var newState = Object.assign(prevState, update);
        this.state = newState;

        // handle side effects

        var tansition = this.transitions[this.state.name];
        if (tansition) {
            Object.keys(tansition).forEach(function (componentKey) {
                var effects = tansition[componentKey].effects;
                var handlers = tansition[componentKey].handlers;

                // execute effects from transitions
                if (effects) {
                    this.components[componentKey].nodes.forEach(effects, this);
                }

                // register handlers from transitions
                if (handlers) {
                    Object.keys(handlers).forEach(function (type) {
                        this.registerEventHandler(this.components[componentKey].selector, type, handlers[type]);
                    }, this);
                }
            }, this);
        }

        // call the global update ???? or local???
        // this.context.updateEach.call(this);
        // this.context.types[this.type].update.call(this);

        // call global update
        this.context.update.call(this);
    };

    function Quiz(selector, options) {
        // setup 
        this.init = function () {
            // if the provided selector is not a node, make it one
            // this is useful for when you want to select multiple quiz elements with querySelectorAll and then instantiate them all at once inside a forEach loop 
            this.node = isNode(selector) ? selector : document.querySelector(selector);

            // TODO: handle if data-quiz not used or value is "true"; generate a uuid based on page title; reusue as storage key
            this.key = this.node.dataset.quiz;

            this.options = _.merge(defaultOptions, options);

            this.exerciseNodes = this.node.querySelectorAll('[data-type]');

            // instantiate exercises
            this.exerciseNodes.forEach(function (exerciseNode) {
                new Exercise(exerciseNode, this.context, this.options);
            }, this);

            this.options.extend.call(this);
        }

        // TODO: include a way to extend other types to reduce amount of repeated code
        // maybe make the entire type object extendable and not just transitions
        this.defaultType = defaultType;
        this.types = types;

        // global api. available everywhere
        // ideally, extensions can add functionality to the context functions; for instance, storage and scoring can hook into this api
        this.context = {
            ready: false,
            types: this.types,
            register: function (exercise, key) {
                if (!this.exercises) {
                    this.exercises = {};
                }
                this.exercises[key] = exercise;
                if (Object.keys(this.exercises).length === this.exerciseNodes.length) {
                    // console.log('registration complete....');
                    // we don't need these anymore?
                    this.context.ready = true;
                    delete this.exerciseNodes;
                }
                return;
            }.bind(this),
            // lifecycle hooks
            beforeEach: function () {
                // setup
                this.getResponseKey = this.context.types[this.type].getResponseKey.bind(this);
                this.compare = this.context.types[this.type].compare.bind(this);
                this.reset = this.context.types[this.type].reset.bind(this);
                // register components first
                this.registerComponents.call(this);
                // then call before
                this.context.types[this.type].before.call(this);
                // set initial state
                this.reset();
                // maybe this is where loading from storage would kick in?
                this.transitions[this.state.name];
                // context functions are a way for the parent Quiz module to access all the individual exercise instances
                this.context.register(this, this.key)
            },
            updateEach: function () {
                this.context.types[this.type].update.call(this);
            },
            update: function () {
                if (this.context.ready) {
                    // global update here
                }
            }
        };
        // initialize quiz
        this.init();
    }

    Quiz.prototype.useStorage = function (cb, options) {
        this.store = new Storage(this, options);
        return cb.call(this.store);
    }

    // TODO: need to actually hook these in as part of initialization // maybe it could actually be part of the options object
    Quiz.prototype.extendType = function (name, newSettings) {
        // this is where the developer can completely customize each question type, and even add types
        // should have access to the default types and transitions and be able to merge over these to add or override
        // this could be executed automatically for the developer if they provide the updates in an options object
        var existing = this.types[name];
        this.types[name] = _.merge({}, existing, settings);
    }

    // TODO: need to actually hook these in as part of initialization // maybe it could actually be part of the options object
    Quiz.prototype.addType = function (name, settings, extendType) {
        extendType = extendType || this.defaultType;
        this.types[name] = _.merge({}, extendType, settings);
    }

    return Quiz;
    /*=====  End of Classes  ======*/

    /*=============================================
    =            extensions            =
    =============================================*/
    /**
     *
     * Storage plugin module (optional)
     *
     */

    function Storage(context, options) {
        this.storageKey = context.key;
        this.context = context.context;
        this.store = {
            'test-question': 42
        };
        this.save = function () {
            console.log('saving....');
            window.localStorage.setItem(this.storageKey, JSON.stringify(this.store));
        }
        this.load = function () {
            console.log('loading...');
            this.store = JSON.parse(window.localStorage.getItem(this.storageKey));
        }
        this.reset = function () {
            console.log('resetting...');
            window.localStorage.removeItem(this.storageKey);
            this.store = {};
        }
        console.log('storage ' + this.storageKey + ' created.');
    }

    /*=====  End of extensions  ======*/

})();
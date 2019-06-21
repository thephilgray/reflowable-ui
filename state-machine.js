var INTIAL = 'INTIAL',
    TOUCHED = 'TOUCHED',
    VALIDATED_CORRECT = 'VALIDATED_CORRECT',
    VALIDATED_INCORRECT = 'VALIDATED_INCORRECT',
    VALIDATED_WITH_ANSWERS = 'VALIDATED_WITH_ANSWERS',
    SHOW_ANSWERS_ONLY = 'SHOW_ANSWERS_ONLY',
    ACTIVE_PAIR_TOUCHED = 'ACTIVE_PAIR_TOUCHED',
    ACTIVE_PAIR_VALIDATED_CORRECT = 'ACTIVE_PAIR_VALIDATED_CORRECT',
    ACTIVE_PAIR_VALIDATED_INCORRECT = 'ACTIVE_PAIR_VALIDATED_INCORRECT';

var machine = {
    state: INTIAL,
    transitions: {
        [INTIAL]: {
            touch: function (state, payload) {
                console.log(payload);
                this.changeStateTo('TOUCHED');
                console.log(this.state);
                console.log('effects....');
            }
        },
        [TOUCHED]: {
            validate: function () {
                var isValid = false;
                isValid && this.changeStateTo('VALIDATED_CORRECT');
                !isValid && this.changeStateTo('VALIDATED_INCORRECT');
            },
            reset: function () {
                this.changeStateTo('INTIAL');
            }
        },
        [VALIDATED_CORRECT]: {
            effects: function () {
                console.log('Correct!');
            },
            reset: function () {
                this.changeStateTo('INTIAL');
            }
        },
        [VALIDATED_INCORRECT]: {
            effects: function () {
                console.log('Incorrect :(');
            },
            reset: function () {
                this.changeStateTo('INTIAL');
            }
        },
        [VALIDATED_WITH_ANSWERS]: {},
        [SHOW_ANSWERS_ONLY]: {},
        [ACTIVE_PAIR_TOUCHED]: {},
        [ACTIVE_PAIR_VALIDATED_CORRECT]: {},
        [ACTIVE_PAIR_VALIDATED_INCORRECT]: {},
    },
    dispatch(actionName, ...payload) {
        var actions = this.transitions[this.state];
        var action = actions[actionName];
        if (action) {
            action.apply(machine, ...payload);
        }
    },
    changeStateTo(newState) {
        this.state = newState;
    }
};

machine.dispatch('touch', { value: 2 });
machine.dispatch('validate');
machine.dispatch('effects');

// select-many
// new machine()

/**
 *
 *
 *
 */

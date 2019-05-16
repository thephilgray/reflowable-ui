var ReflowableUI = (function() {
  /**
   *
   * class helpers
   *
   */

  function extendPrototype(subClass, baseClass) {
    subClass.prototype = Object.create(baseClass.prototype);

    Object.defineProperty(subClass.prototype, "constructor", {
      value: subClass,
      enumerable: false, // so that it does not appear in 'for in' loop
      writable: true
    });
  }

  /**
   *
   * Exercise base class
   *
   */

  function Exercise(node, context) {
    this.node = node;
    this.context = context;
    this.type = node.dataset["type"];
    this.answerKey = node.dataset["answer"];
    this.state = {
      responses: [],
      showAnswers: false,
      validated: false,
      isValid: null,
      loading: false
    };
    this.LOADING_TEXT = "loading...";
    this.CORRECT_BUTTON_TEXT = "correct. reset";
    this.INCORRECT_BUTTON_TEXT = "wrong. show answer";
    this.RESET_BUTTON_TEXT = "reset";
    this.INITIAL_BUTTON_TEXT = "check";
    this.init();
  }

  Exercise.prototype.initCheckButton = function() {
    // checkButton
    this.checkButton = this.node.querySelector("[data-validate]");
    this.checkButton.addEventListener(
      "click",
      function() {
        // intial state, check answers
        var INITIAL_STATE =
          !this.state.showAnswers &&
          !this.state.validated &&
          !this.state.isValid;
        var VALIDATED_CORRECT =
          !this.state.showAnswers && this.state.validated && this.state.isValid;
        var VALIDATED_INCORRECT =
          !this.state.showAnswers &&
          this.state.validated &&
          !this.state.isValid;
        var SHOWING_ANSWERS = this.state.showAnswers && this.state.validated;

        if (INITIAL_STATE) {
          return this.validate();
        }
        // show answers if !isValid
        if (VALIDATED_INCORRECT) {
          return this.showAnswers();
        }
        // reset if isValid or showAnswers
        if (VALIDATED_CORRECT || SHOWING_ANSWERS) {
          return this.reset();
        }
      }.bind(this)
    );
  };

  Exercise.prototype.initInputs = function() {
    // inputs
    this.inputs = this.node.querySelectorAll("[data-input]");
    this.inputs.forEach(function(input, i) {
      this.addListener(input, i);
    }, this);
  };

  Exercise.prototype.initPreviewSlots = function() {
    // setup previewSlots
    this.previewSlots = this.node.querySelectorAll("[data-preview-slot]");
    if (this.previewSlots) {
      var originalSlotText = [];

      this.previewSlots.forEach(function(slot, i) {
        originalSlotText.push(slot.textContent);
      }, this);
      this.originalSlotText = originalSlotText;
    }
  };

  Exercise.prototype.init = function init() {
    // allow before init hook
    if (this.beforeInit) {
      this.beforeInit();
    }

    // event listeners and query selectors here
    this.initPreviewSlots();
    this.initInputs();
    this.initCheckButton();

    // allow after init hook
    if (this.afterInit) {
      this.afterInit();
    }

    // render for the first time
    this.render();
  };

  Exercise.prototype.compareAnswers = function() {
    return this.state.responses.sort().join(",") === this.answerKey;
  };

  Exercise.prototype.addListener = function(el, i) {
    el.addEventListener(
      "click",
      function(e) {
        var touched = el.dataset["touched"];
        if (touched) {
          this.removeResponse(i);
        } else {
          this.addResponse(i);
        }
      }.bind(this)
    );
  };

  Exercise.prototype.showAnswers = function() {
    this.setState({ validated: true, showAnswers: true });
  };

  Exercise.prototype.validate = function() {
    this.setState({ isValid: this.compareAnswers(), validated: true });
  };

  Exercise.prototype.setLoading = function(loadState) {
    this.setState({ loading: loadState });
  };

  Exercise.prototype.addResponse = function(newResponse) {
    var responses = this.state.responses.slice(0);
    responses.push(newResponse);
    this.setState({ responses: responses });
  };
  Exercise.prototype.removeResponse = function(i) {
    var responses = this.state.responses.filter(function(response) {
      return response !== i;
    });
    this.setState({ responses: responses });
  };

  Exercise.prototype.reset = function() {
    this.setState({
      responses: [],
      showAnswers: false,
      validated: false,
      isValid: null,
      loading: false
    });
  };

  // warning: no deep state
  Exercise.prototype.setState = function(update) {
    var prevState = Object.assign({}, this.state);
    var newState = Object.assign(prevState, update);
    this.state = newState;

    this.render();
  };

  Exercise.prototype.render = function() {
    // console.log(this); // for debugging

    this.renderButtons();

    // render inputs
    var inputValues = this.state.showAnswers
      ? this.answerKey
      : this.state.responses;

    this.renderInputs(inputValues);
  };

  Exercise.prototype.renderButtons = function() {
    // checkButton stuff
    // disabled if there are no responses
    if (this.state.responses.length > 0) {
      this.checkButton.removeAttribute("disabled");
    } else {
      this.checkButton.disabled = true;
    }

    var LOADING = this.state.loading;
    var INITIAL_STATE =
      !LOADING &&
      !this.state.showAnswers &&
      !this.state.validated &&
      !this.state.isValid;
    var VALIDATED_CORRECT =
      !LOADING &&
      !this.state.showAnswers &&
      this.state.validated &&
      this.state.isValid;
    var VALIDATED_INCORRECT =
      !LOADING &&
      !this.state.showAnswers &&
      this.state.validated &&
      !this.state.isValid;
    var SHOWING_ANSWERS =
      !LOADING && this.state.showAnswers && this.state.validated;

    if (LOADING) {
      this.checkButton.textContent = this.LOADING_TEXT;
      this.node.setAttribute("data-loading", true);
      return;
    }

    // set button to 'reset' if true
    if (VALIDATED_CORRECT) {
      this.checkButton.textContent = this.CORRECT_BUTTON_TEXT;
      this.node.setAttribute("data-correct", true);
      this.node.removeAttribute("data-loading");
      this.context.score && this.context.score.updateScore();
      return;
    }

    if (VALIDATED_INCORRECT) {
      this.checkButton.textContent = this.INCORRECT_BUTTON_TEXT;
      this.node.setAttribute("data-correct", false);
      this.node.removeAttribute("data-loading");
      this.context.score && this.context.score.updateScore();
      return;
    }

    if (SHOWING_ANSWERS) {
      this.checkButton.textContent = this.RESET_BUTTON_TEXT;
      this.node.setAttribute("data-correct", false);
      this.node.removeAttribute("data-loading");
      this.context.score && this.context.score.updateScore();
      return;
    }

    if (INITIAL_STATE) {
      this.checkButton.textContent = this.INITIAL_BUTTON_TEXT;
      this.node.removeAttribute("data-correct");
      this.node.removeAttribute("data-loading");
      this.context.score && this.context.score.updateScore();
    }
  };

  Exercise.prototype.renderInputs = function(inputValues) {
    this.inputs.forEach(function(input, i) {
      this.state.validated || this.state.loading
        ? (input.disabled = "true")
        : input.removeAttribute("disabled");
      if (inputValues.indexOf(i) > -1) {
        input.setAttribute("data-touched", true);
      } else {
        input.removeAttribute("data-touched");
      }
    }, this);
  };

  /**
   *
   * WriteIn subclass
   *
   */

  function WriteIn(node, context) {
    Exercise.call(this, node, context);
  }
  extendPrototype(WriteIn, Exercise);

  WriteIn.prototype.compareAnswers = function() {
    return (
      this.state.responses.trim().toLowerCase() ===
      this.answerKey.trim().toLowerCase()
    );
  };

  WriteIn.prototype.addListener = function(el, i) {
    // books disables text inputs; so we'll reneable
    function enableTextInput() {
      if (el.disabled) {
        el.removeAttribute("disabled");
      }
    }
    window.requestAnimationFrame(enableTextInput);

    el.addEventListener(
      "keyup",
      function(e) {
        this.setState({ responses: e.target.value });
        e.preventDefault();
      }.bind(this)
    );
  };

  WriteIn.prototype.renderInputs = function(inputValues) {
    return this.inputs.forEach(function(input, i) {
      this.state.validated || this.state.loading
        ? (input.disabled = "true")
        : input.removeAttribute("disabled");
      input.value = inputValues;
      if (inputValues.length > 0) {
        input.setAttribute("data-touched", true);
      } else {
        input.removeAttribute("data-touched");
      }
    }, this);
  };

  /**
   *
   * MatchPairs subclass
   *
   */

  function MatchPairs(node, context) {
    Exercise.call(this, node, context);
  }
  extendPrototype(MatchPairs, Exercise);

  MatchPairs.prototype.helpers = function() {
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

    function chunkSortAndFlatten(str) {
      return chunkArray(str.split(","), 2)
        .map(function(arr) {
          return arr.sort();
        })
        .sort()
        .map(function(arr) {
          return arr.join(",");
        })
        .join(",");
    }
    return { chunkArray: chunkArray, chunkSortAndFlatten: chunkSortAndFlatten };
  };

  MatchPairs.prototype.compareAnswers = function() {
    var helpers = this.helpers();
    return (
      helpers.chunkSortAndFlatten(this.state.responses.join(",")) ===
      helpers.chunkSortAndFlatten(this.answerKey)
    );
  };

  MatchPairs.prototype.renderInputs = function(inputValues) {
    // make sure it's always an array in this case
    if (typeof inputValues === "string") {
      inputValues = inputValues.split(",").map(Number);
    }
    this.inputs.forEach(function(input, i) {
      this.state.validated || this.state.loading
        ? (input.disabled = "true")
        : input.removeAttribute("disabled");

      if (inputValues.indexOf(i) > -1) {
        input.setAttribute("data-touched", true);
      } else {
        input.removeAttribute("data-touched");
      }
    }, this);

    if (this.previewSlots) {
      // reset previewSlots each time

      this.previewSlots.forEach(function(slot, i) {
        slot.textContent = this.inputs[inputValues[i]]
          ? this.inputs[inputValues[i]].textContent
          : this.originalSlotText[i];
      }, this);
    }
  };

  /**
   *
   * WordOrder subclass
   *
   */

  function WordOrder(node, context) {
    Exercise.call(this, node, context);
  }
  extendPrototype(WordOrder, Exercise);

  WordOrder.prototype.beforeInit = function() {};

  WordOrder.prototype.compareAnswers = function() {
    return this.state.responses.join(",") === this.answerKey;
  };

  WordOrder.prototype.renderInputs = function(inputValues) {
    // make sure it's always an array in this case
    if (typeof inputValues === "string") {
      inputValues = inputValues.split(",").map(Number);
    }
    this.inputs.forEach(function(input, i) {
      this.state.validated || this.state.loading
        ? (input.disabled = "true")
        : input.removeAttribute("disabled");

      if (inputValues.indexOf(i) > -1) {
        input.setAttribute("data-touched", true);
      } else {
        input.removeAttribute("data-touched");
      }
    }, this);

    if (this.previewSlots) {
      // reset previewSlots each time
      this.previewSlots.forEach(function(slot, i) {
        slot.textContent = this.inputs[inputValues[i]]
          ? this.inputs[inputValues[i]].textContent
          : this.originalSlotText[i];
      }, this);
    }
  };

  /**
   *
   * SelectOne subclass
   *
   */

  function SelectOne(node, context) {
    Exercise.call(this, node, context);
  }
  extendPrototype(SelectOne, Exercise);

  SelectOne.prototype.addListener = function(el, i) {
    el.addEventListener(
      "click",
      function(e) {
        this.setState({ responses: [i] }, this);
      }.bind(this)
    );
  };

  /**
   *
   * SelectMany subclass
   * note: default behavior
   *
   */

  function SelectMany(node, context) {
    Exercise.call(this, node, context);
  }
  extendPrototype(SelectMany, Exercise);

  /**
   *
   * Score plugin module (optional)
   *
   */

  function Score(context, updateCallback) {
    this.context = context;
    this.modules = context.modules;
    this.updateCallback = updateCallback;
    this.totalCorrect = 0;
    this.totalQuestions = Object.keys(this.modules).length;
    updateCallback(
      {
        totalCorrect: this.totalCorrect,
        totalQuestions: this.totalQuestions
      },
      this.context
    );
  }

  Score.prototype.getTotalCorrect = function() {
    return Object.keys(this.modules)
      .map(function(key) {
        return this.modules[key].state.isValid;
      }, this)
      .filter(function(validation) {
        return validation;
      }, this).length;
  };

  Score.prototype.updateScore = function() {
    this.updateCallback(
      {
        totalCorrect: this.getTotalCorrect(),
        totalQuestions: this.totalQuestions
      },
      this.context
    );
    return this;
  };

  /**
   *
   * Storage plugin module (optional)
   *
   */

  function Storage(context, storageKey, onReady) {
    this.context = context;
    this.modules = context.modules;
    this.store = {};
    this.storageKey = storageKey;
    this.ready(onReady);
  }

  Storage.prototype.ready = function(callback) {
    return callback(this);
  };

  Storage.prototype.readStorage = function() {
    return JSON.parse(window.localStorage.getItem(this.storageKey));
  };

  Storage.prototype.getAllStates = function() {
    var allStates = {};
    Object.keys(this.modules).forEach(function(key) {
      allStates[key] = this.modules[key].state;
    }, this);
    return allStates;
  };

  Storage.prototype.setAllStates = function() {
    Object.keys(this.modules).forEach(function(key) {
      var newState = this.store[key];
      this.modules[key].setState(newState);
    }, this);
  };

  Storage.prototype.resetAll = function() {
    console.log("removing storage");
    window.localStorage.removeItem(this.storageKey);
    this.context.resetAll();
  };

  Storage.prototype.saveAll = function() {
    console.log("saving to storage...");
    this.store = this.getAllStates();
    window.localStorage.setItem(this.storageKey, JSON.stringify(this.store));
  };

  Storage.prototype.loadAll = function() {
    this.context.setLoading(true);
    var localData = this.readStorage();
    // make sure storage for key and is not empty
    if (
      localData &&
      Object.keys(this.modules).length === Object.keys(localData).length
    ) {
      console.log("loading from storage...");
      this.store = localData;
      this.setAllStates();
    } else {
      console.log("nothing to load");
    }
    this.context.setLoading(false);

    return this;
  };

  /**
   *
   * Quiz base class
   *
   */

  function Quiz(selector) {
    this.modules = {};
    this.score = null;
    this.store = null;
    this.nodes = document.querySelectorAll(selector);

    this.nodes.forEach(function(node) {
      var type = node.dataset.type;
      var key = node.dataset.key;
      var module;
      switch (type) {
        case "write-in":
          module = new WriteIn(node, this);
          this.modules[key] = module;
          break;
        case "match-pairs":
          module = new MatchPairs(node, this);
          this.modules[key] = module;
          break;
        case "word-order":
          module = new WordOrder(node, this);
          this.modules[key] = module;
          break;
        case "select-one":
          module = new SelectOne(node, this);
          this.modules[key] = module;
          break;
        case "select-many":
          module = new SelectMany(node, this);
          this.modules[key] = module;
          break;
        default:
          console.log("not a valid question type");
      }
    }, this);
  }

  // global functions

  Quiz.prototype.resetAll = function() {
    console.log("resetting all");
    Object.keys(this.modules).forEach(function(key) {
      this.modules[key].reset();
    }, this);
  };

  Quiz.prototype.validateAll = function() {
    console.log("validating all");
    Object.keys(this.modules).forEach(function(key) {
      this.modules[key].state.responses.length > 0 &&
        this.modules[key].validate();
    }, this);
  };

  Quiz.prototype.setLoading = function(loadState) {
    console.log("set loading");
    Object.keys(this.modules).forEach(function(key) {
      this.modules[key].setLoading(loadState);
    }, this);
  };

  // plugin modules

  Quiz.prototype.useScore = function(callback) {
    if (!callback) {
      console.log("pass a callback function to Quiz.useScore");
    }
    this.score = new Score(this, callback);
    return this.score;
  };

  Quiz.prototype.useStorage = function(storageKey, onReady) {
    if (!storageKey) {
      console.log("you must pass a storageKey to Quiz.useStorage");
      return;
    }
    if (!onReady) {
      onReady = function() {
        console.log("pass an onReady callback function to Quiz.useScore");
      };
    }
    this.store = new Storage(this, storageKey, onReady);

    return this.store;
  };
  return { Quiz: Quiz };
})();

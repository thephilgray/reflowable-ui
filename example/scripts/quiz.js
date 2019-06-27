/*=============================================
=            Example            =
=============================================*/

(function () {
    // instantiate one quiz (with a reference)
    var quiz = new Quiz('[data-quiz]', {
        extend: function () {
            console.log(this);

            function customStorage() {
                console.log('inside custom storage');
                console.log(this);
                this.save();
                this.load();
                console.log(this.store);
                this.reset();
                console.log(this.store);

            }

            this.useStorage(customStorage);
        }
    });

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

})();

/*=====  End of Example  ======*/
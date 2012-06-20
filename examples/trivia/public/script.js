var session = {
  twitterHandle: undefined
  , answered: 0
  , correct: 0
  , currentQuestion: undefined
  , currentAnswer: undefined
  , questions: undefined
};

function initWelcome() {
  $('#welcome-form').submit(function() {
    var handle = $('#twitter-handle').val();
    if (handle) {
      if (handle.indexOf('@') !== 0) handle = '@' + handle;
      session.twitterHandle = handle;
      initQuestions();
    }
    return false;
  });
}

function initQuestions() {
  $('#welcome').hide();
  $('#questions').show();

  $('#session .name').text("Welcome, " + session.twitterHandle + "!");
  updateSession();

  loadQuestions();

  $('#answers .answer').click(function() {
    if (session.currentAnswer) { return false; }
    var answer = $(this).attr('id').slice(-1).toUpperCase();
    $(this).addClass('chosen');
    postAnswer(answer);
    return false;
  });

  $('#load-question-btn').click(function() {
    pickQuestion();
  })
}

function updateSession() {
  if (session.answered) {
    $('#session .score').text("Answered " + session.correct + "/" + session.answered + " correctly");  
  } else {
    $('#session .score').text("");
  }
}

function loadQuestions() {
  session.currentQuestion = undefined;
  session.currentAnswer = undefined;

  $('#loading').show().text("Loading questions...");
  dpd.questions.get(function(questions, err) {
    if (questions) {
      session.questions = questions;  
      pickQuestion();
      dpd.on('statUpdate', onStatUpdate);
    } else {
      loadQuestions();
    }
  });

}

function onStatUpdate(qId) {
  dpd.questions.get(qId, function(update) {
    session.questions.forEach(function(q) {
      if (q.id === qId) {
        q.correctPercentage = update.correctPercentage;
      }
    });

    if (session.currentQuestion && session.currentQuestion.id === qId) {
      $('#question .questionStats').text((update.correctPercentage * 100).toFixed(0) + "% get this right!");
    }
  });
  
}

function pickQuestion() {
  
  session.currentAnswer = undefined;

  var rand = Math.floor(Math.random() * session.questions.length);
  var question = session.questions[rand];

  if (question != session.currentQuestion) {
    showQuestion(question);  
  } else {
    pickQuestion();
  }
  
}

function showQuestion(question) {
  var stat = question.correctPercentage || 0;

  $('#loading').hide();

  $('#correct-answer').hide();

  $('#question').show();
  $('#question .questionId').text("Question #" + question.questionNumber);
  $('#question .questionText').text(question.text);

  $('#question .questionStats').text((stat * 100).toFixed(0) + "% get this right!");

  $('#answers').show();
  $('#answers .answer')
    .removeClass('chosen')
    .removeClass('correct')
    .removeClass('incorrect');
  $('#answer-a .answerText').text(question.answerA);
  $('#answer-b .answerText').text(question.answerB);
  $('#answer-c .answerText').text(question.answerC);
  $('#answer-d .answerText').text(question.answerD);

  session.currentQuestion = question;
}

function postAnswer(answer) {
  $('#loading').show().text("Loading answer...");
  var answer = {
      answer: answer
    , twitterHandle: session.twitterHandle
    , questionId: session.currentQuestion.id
  };
  session.currentAnswer = answer;
  dpd.responses.post(answer, function(result) {
    session.currentAnswer = result;
    showAnswer(result);
  }); 
}

function showAnswer(answer) {
  $('#loading').hide();
  highlightAnswer(answer.answer, answer.isCorrect);

  session.answered++;
  if (answer.isCorrect) session.correct++;
  updateSession();

  $('#correct-answer').show()
    .removeClass('correct').removeClass('incorrect')
    .addClass(answer.isCorrect ? "correct" : "incorrect")
    .find('.status').text(answer.isCorrect ? "Correct!" : "Incorrect!");

  session.currentAnswer = answer;
}

function highlightAnswer(answer, correct) {
  var cssClass = 'incorrect';
  if (correct) {
    cssClass = 'correct';
  }
  $('#answer-' + answer.toLowerCase())
    .removeClass('chosen')
    .removeClass('incorrect')
    .removeClass('correct')
    .addClass(cssClass);
}


$(document).ready(function() {
  initWelcome();
  // session.twitterHandle = '@dallonf';
  // initQuestions();
});
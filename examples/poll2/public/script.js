var myAnswer
  , allAnswers = {}
  , query;

dpd.on('responses:change', function(r) {
  loadAnswers();
});

function loadQuestion() {
  dpd.question.get(function(q) {
    showQuestion(q[0].title);
  });
}

function showQuestion(question) {
  $('#question').text(question);
}

function loadAnswers() {
  if (query) query.abort();
  query = dpd.answers.get(function(answers, err) {
    if (err) return;

    if (!$('#options').children().length) {
      createAnswers(answers);
    }

    allAnswers = {};
    for (var i = 0; i < answers.length; i++) {
      allAnswers[answers[i].id] = answers[i];
    };

    updateAnswers();
  });
}



function createAnswers(answers) {
  for (var i = 0; i < answers.length; i++) {
    var answer = answers[i];

    var $row = $('<tr id="answer-' + answer.id + '">');
    $row.data('answerId', answer.id);
    $row.append('<td><div class="answer"><span class="answer-value">' + answer.value +'</span><span class="count"></span><div class="bar">&nbsp;</div></div></td>');

    $('#options').append($row);
  };
}

function submitResponse(answerId) {
  highlightAnswer(answerId);

  if (!myAnswer) { 
    myAnswer = {};
  } else {
    if (allAnswers[myAnswer.answerId]) allAnswers[myAnswer.answerId].responses--;
  }

  myAnswer.answerId = answerId;
  if (allAnswers[answerId]) allAnswers[answerId].responses++;

  updateAnswers();

  if (myAnswer.id) {
    dpd.responses.put(myAnswer.id, myAnswer, function(result) {
      myAnswer = result;
    });
  } else {
    dpd.responses.post(myAnswer, function(result) {
      myAnswer = result;
    });
  }
}

function updateAnswers() {
  var responseCount = 0;
  Object.keys(allAnswers).forEach(function(k) {
    if (allAnswers[k].responses > responseCount) {
      responseCount = allAnswers[k].responses;  
    }
  });
  Object.keys(allAnswers).forEach(function(k) {
    updateAnswer(allAnswers[k], responseCount);
  });
}

function updateAnswer(answer, responseCount) {
  var $answer = $('#answer-' + answer.id + ' .answer');
  $answer.find('.count').text(answer.responses);

  var width = $answer.width();
  if (responseCount) {
    $answer.find('.bar').width((answer.responses / responseCount) * width);
  } else {
    $answer.find('.bar').width(0);
  }
}

function highlightAnswer(answerId) {
  $('#options .chosen').removeClass('chosen');
  $('#answer-' + answerId).find('td').addClass('chosen');
}

$(document).ready(function() {

  loadQuestion();
  loadAnswers();

  $('#options').on('click', 'tr', function() {
    submitResponse($(this).data('answerId'));
  });
});

import { useState, useRef, useEffect } from 'react';
import { trackContentAnalytics } from '../utils/analytics';

const Quiz = ({ quiz, onSkip, isActive = true }) => {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [showResults, setShowResults] = useState(false);
  const [quizCompleted, setQuizCompleted] = useState(false);
  const touchStartY = useRef(0);
  const startTime = useRef(null);
  const analyticsTracked = useRef(false);

  // Reset start time when quiz becomes active
  useEffect(() => {
    if (isActive) {
      startTime.current = Date.now();
      analyticsTracked.current = false;
    }
  }, [quiz.id, isActive]);

  // Debug log
  useEffect(() => {
    console.log('Quiz data:', quiz);
  }, [quiz]);

  const questions = quiz?.questions || [];
  const currentQuestion = questions[currentQuestionIndex];

  if (!quiz) {
    return <div className="quiz">Quiz data missing</div>;
  }

  if (!currentQuestion || questions.length === 0) {
    return <div className="quiz">No questions available. Questions: {questions.length}</div>;
  }

  let options = [];
  try {
    options = Array.isArray(currentQuestion.options)
      ? currentQuestion.options
      : JSON.parse(currentQuestion.options || '[]');
  } catch (e) {
    console.error('Error parsing options:', currentQuestion.options, e);
    options = [];
  }

  const handleSelectAnswer = (optionIndex) => {
    if (answers[currentQuestionIndex] !== undefined) return;

    const newAnswers = {
      ...answers,
      [currentQuestionIndex]: optionIndex,
    };
    setAnswers(newAnswers);
    setShowResults(true);

    const correctAnswer = parseInt(currentQuestion.correct_answer) || 0;
    const isCorrect = optionIndex === correctAnswer;
    analyticsTracked.current = true;

    trackContentAnalytics('quiz', quiz.id, {
      question_index: currentQuestionIndex,
      question_id: currentQuestion.id,
      answered: 1,
      correct: isCorrect ? 1 : 0,
      timestamp: new Date().toISOString(),
    }).catch((err) => console.error('Question analytics failed:', err));
  };

  const handleNextQuestion = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
      setShowResults(false);
    } else {
      completeQuiz();
    }
  };

  const handlePrevQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
      setShowResults(false);
    }
  };

  const completeQuiz = () => {
    const correctCount = Object.entries(answers).reduce((count, [index, selected]) => {
      const correctAnswer = parseInt(questions[index]?.correct_answer) || 0;
      return count + (selected === correctAnswer ? 1 : 0);
    }, 0);

    const score = Math.round((correctCount / questions.length) * 100);

    setQuizCompleted(true);

    if (!analyticsTracked.current) {
      analyticsTracked.current = true;
      trackContentAnalytics('quiz', quiz.id, {
        action: 'completed',
        score: score,
        correct_answers: correctCount,
        total_questions: questions.length,
        duration: Math.round((Date.now() - startTime.current) / 1000),
        timestamp: new Date().toISOString(),
      }).catch((err) => console.error('Quiz completion analytics failed:', err));
    }
  };

  const handleTouchStart = (e) => {
    touchStartY.current = e.touches[0].clientY;
  };

  const handleTouchEnd = (e) => {
    const touchEndY = e.changedTouches[0].clientY;
    const diff = touchStartY.current - touchEndY;
    if (diff > 50) {
      handleSkipQuiz();
    }
  };

  const handleSkipQuiz = () => {
    if (!analyticsTracked.current) {
      analyticsTracked.current = true;
      trackContentAnalytics('quiz', quiz.id, {
        action: 'skipped',
        questions_answered: Object.keys(answers).length,
        total_questions: questions.length,
        duration: Math.round((Date.now() - startTime.current) / 1000),
        timestamp: new Date().toISOString(),
      }).catch((err) => console.error('Quiz skip analytics failed:', err));
    }
    onSkip();
  };

  useEffect(() => {
    startTime.current = Date.now();
    analyticsTracked.current = false;

    return () => {
      if (!analyticsTracked.current && !quizCompleted) {
        trackContentAnalytics('quiz', quiz.id, {
          action: 'abandoned',
          questions_answered: Object.keys(answers).length,
          total_questions: questions.length,
          duration: Math.round((Date.now() - startTime.current) / 1000),
          timestamp: new Date().toISOString(),
        }).catch((err) => console.error('Quiz abandon analytics failed:', err));
      }
    };
  }, [quiz, quizCompleted, answers, questions.length]);

  if (quizCompleted) {
    const correctCount = Object.entries(answers).reduce((count, [index, selected]) => {
      const correctAnswer = parseInt(questions[index]?.correct_answer) || 0;
      return count + (selected === correctAnswer ? 1 : 0);
    }, 0);

    const score = Math.round((correctCount / questions.length) * 100);

    return (
      <div className="quiz quiz-complete" onTouchStart={handleTouchStart} onTouchEnd={handleTouchEnd}>
        <h2>{quiz.title}</h2>
        <div className="quiz-result">
          <p className="score">Score: {score}%</p>
          <p className="result-text">
            You got {correctCount} out of {questions.length} correct!
          </p>
        </div>
        <button onClick={onSkip} className="skip-button">Continue</button>
      </div>
    );
  }

  const isAnswered = answers[currentQuestionIndex] !== undefined;
  const selectedAnswer = answers[currentQuestionIndex];
  const correctAnswer = parseInt(currentQuestion?.correct_answer) || 0;
  const isCorrect = isAnswered && selectedAnswer === correctAnswer;

  return (
    <div className="quiz" onTouchStart={handleTouchStart} onTouchEnd={handleTouchEnd}>
      <div className="quiz-header">
        <h2>{quiz.title}</h2>
        <div className="quiz-progress">
          Question {currentQuestionIndex + 1} of {questions.length}
        </div>
      </div>

      <div className="quiz-progress-bar">
        <div 
          className="quiz-progress-fill" 
          style={{ width: `${((currentQuestionIndex + 1) / questions.length) * 100}%` }}
        ></div>
      </div>

      <p className="quiz-question">{currentQuestion.question}</p>

      <div className="quiz-options">
        {options && options.length > 0 ? (
          options.map((option, index) => (
            <button
              key={index}
              onClick={() => handleSelectAnswer(index)}
              disabled={isAnswered}
              className={`option-button ${
                isAnswered && index === correctAnswer ? 'correct' : ''
              } ${
                isAnswered && index === selectedAnswer && !isCorrect ? 'wrong' : ''
              }`}
            >
              {option}
            </button>
          ))
        ) : (
          <p>No options available</p>
        )}
      </div>

      {isAnswered && (
        <div className={`answer-feedback ${isCorrect ? 'correct' : 'wrong'}`}>
          {isCorrect 
            ? '✓ Correct!' 
            : `✗ Wrong! Correct answer: ${options[correctAnswer] || 'Unknown'}`
          }
        </div>
      )}

      <div className="quiz-navigation">
        <button
          onClick={handlePrevQuestion}
          disabled={currentQuestionIndex === 0}
          className="nav-button prev"
        >
          Previous
        </button>

        {isAnswered ? (
          <button
            onClick={handleNextQuestion}
            className="nav-button next"
          >
            {currentQuestionIndex === questions.length - 1 ? 'Finish' : 'Next'}
          </button>
        ) : (
          <button
            onClick={handleSkipQuiz}
            className="skip-button"
          >
            Skip Quiz
          </button>
        )}
      </div>
    </div>
  );
};

export default Quiz;
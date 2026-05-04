import { useState } from 'react';

const Quiz = ({ quiz, onSkip }) => {
  const [selected, setSelected] = useState(null);
  const [showResult, setShowResult] = useState(false);

  const options = JSON.parse(quiz.options || '[]');

  const handleSelect = (index) => {
    setSelected(index);
    setShowResult(true);
  };

  const isCorrect = selected === quiz.correct_answer;

  return (
    <div className="quiz">
      <h2>{quiz.title}</h2>
      <p>{quiz.question}</p>
      {options.map((option, index) => (
        <button
          key={index}
          onClick={() => handleSelect(index)}
          disabled={showResult}
          className={showResult && index === quiz.correct_answer ? 'correct' : showResult && index === selected ? 'wrong' : ''}
        >
          {option}
        </button>
      ))}
      {showResult && (
        <p>{isCorrect ? 'Correct!' : `Wrong! Correct answer: ${options[quiz.correct_answer]}`}</p>
      )}
      <button onClick={onSkip}>Skip</button>
    </div>
  );
};

export default Quiz;
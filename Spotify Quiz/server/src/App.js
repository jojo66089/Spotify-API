import React, { useState, useEffect } from 'react';
import axios from 'axios';

const App = () => {
    const [currentQuestion, setCurrentQuestion] = useState(null);
    const [score, setScore] = useState(0);
    const [questionsAnswered, setQuestionsAnswered] = useState(0);

    useEffect(() => {
        fetchNextQuestion();
    }, []);

    const fetchNextQuestion = async () => {
        try {
            const response = await axios.get('/api/generate-question');
            setCurrentQuestion(response.data);
        } catch (error) {
            console.error('Failed to fetch question:', error);
        }
    };

    const handleAnswer = (selectedAnswer) => {
        // Increment the count of questions answered
        setQuestionsAnswered(questionsAnswered + 1);

        // Check if the selected answer is correct
        if (selectedAnswer === currentQuestion.correctAnswer) {
            // Increment the score if the answer is correct
            setScore(score + 1);
            alert("Correct!");
        } else {
            alert("Incorrect answer.");
        }

        // Fetch the next question
        fetchNextQuestion();
    };

    return (
        <div id="quiz-container">
            <h1>Spotify Music Quiz</h1>
            {currentQuestion ? (
                <div id="question-section">
                    <p id="question-text">{currentQuestion.question}</p>
                    <div id="answers-container">
                        {currentQuestion.answers.map((answer, index) => (
                            <button key={index} onClick={() => handleAnswer(answer)}>
                                {answer}
                            </button>
                        ))}
                    </div>
                </div>
            ) : (
                <p>Loading question...</p>
            )}
            <div>
                <p>Your Score: {score}</p>
                {currentQuestion && questionsAnswered > 0 && (
                    <button id="next-question" onClick={fetchNextQuestion}>Next Question</button>
                )}
            </div>
            {questionsAnswered > 0 && !currentQuestion && (
                <p>Quiz Complete! Final Score: {score}</p>
            )}
        </div>
    );
};

export default App;

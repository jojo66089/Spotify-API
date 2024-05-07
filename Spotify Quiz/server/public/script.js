document.addEventListener('DOMContentLoaded', () => {
    fetchQuestion();
});

async function fetchQuestion() {
    try {
        const response = await fetch('/api/generate-question');
        const questionData = await response.json();

        document.getElementById('question-text').textContent = questionData.question;

        
        const answersContainer = document.getElementById('answers-container');
        answersContainer.innerHTML = ''; 

        questionData.answers.forEach((answer, index) => {
            const button = document.createElement('button');
            button.textContent = answer;
            button.onclick = () => handleAnswerSelected(answer === questionData.correctAnswer);
            answersContainer.appendChild(button);
        });

        document.getElementById('next-question').style.display = 'none'; // Hide the next question button initially
    } catch (error) {
        console.error('Failed to fetch the question:', error);
    }
}

function handleAnswerSelected(isCorrect) {
    alert(isCorrect ? "Correct!" : "Wrong answer.");
    document.getElementById('next-question').style.display = 'inline'; // Show the next question button
}


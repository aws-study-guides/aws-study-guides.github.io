let questions = []; // This will be populated with your JSON data
let scoredQuestions = []; // This will hold the 50 randomly selected questions for scoring
const totalScored = 50; // Number of questions to score

// Function to shuffle questions for randomness
function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

// Function to pick a random subset of questions
function pickRandomQuestions(questionsArray, numQuestions) {
    let selected = [];
    let usedIndices = new Set();
    while (selected.length < numQuestions) {
        let randomIndex = Math.floor(Math.random() * questionsArray.length);
        if (!usedIndices.has(randomIndex)) {
            selected.push({ question: questionsArray[randomIndex], index: randomIndex + 1 });
            usedIndices.add(randomIndex);
        }
    }
    return selected;
}

// Function to get unscored questions in order
function getUnscoredQuestions(questionsArray, scoredQuestions) {
    // Filter out scored questions
    const scoredIndices = new Set(scoredQuestions.map(q => q.index));
    let unscoredQuestions = questionsArray
        .map((q, index) => ({ question: q, index: index + 1 })) // Keep track of the original index
        .filter(q => !scoredIndices.has(q.index)); // Only unscored questions
    return unscoredQuestions;
}

// Fetch the JSON data
fetch(`/${questionSet}`) // Ensure the correct path to your JSON file
    .then(response => response.json())
    .then(data => {
        questions = shuffleArray(data); // Randomize questions on each load
        scoredQuestions = pickRandomQuestions(questions, totalScored); // Select 50 random questions for scoring

        // Get the unscored questions
        const unscoredQuestions = getUnscoredQuestions(questions, scoredQuestions);

        // Log the unscored questions and their numbers in order to the console for troubleshooting
        console.log("Unscored Questions (including question number, in order):");
        unscoredQuestions.forEach((q, i) => {
            console.log(`Question ${q.index}: ${q.question.question}`);
        });

        loadQuestions(); // Load questions once data is fetched
    })
    .catch(error => console.error('Error loading the JSON file'));


// Function to load and display all questions
function loadQuestions() {
    const form = document.getElementById('test-form');
    form.innerHTML = ''; // Clear any previous content

    questions.forEach((question, questionIndex) => {
        // Create a div to hold the question and its options
        const questionDiv = document.createElement('div');
        questionDiv.classList.add('question-container');

        // Question text
        const questionText = document.createElement('div');
        questionText.classList.add('question');
        questionText.innerText = `${questionIndex + 1}. ${question.question}`;
        questionDiv.appendChild(questionText);

        // Determine whether this is a single or multiple answer question
        const isMultipleSelect = question.options.filter(option => option.correct).length > 1;
        const inputType = isMultipleSelect ? 'checkbox' : 'radio';

        // Options
        const optionsDiv = document.createElement('div');
        optionsDiv.classList.add('options');
        
        question.options.forEach((option, optionIndex) => {
            const optionLabel = document.createElement('label');
            const optionInput = document.createElement('input');
            optionInput.type = inputType;
            optionInput.name = `question-${questionIndex}`; // Group by question
            optionInput.value = optionIndex;
            optionLabel.appendChild(optionInput);
            optionLabel.appendChild(document.createTextNode(option.text));
            optionsDiv.appendChild(optionLabel);
            optionsDiv.appendChild(document.createElement('br'));
        });

        questionDiv.appendChild(optionsDiv);

        // Explanation and domain (hidden initially)
        const explanationDiv = document.createElement('div');
        explanationDiv.classList.add('explanation');
        explanationDiv.id = `explanation-${questionIndex}`;
        explanationDiv.style.display = 'none';
        questionDiv.appendChild(explanationDiv);

        form.appendChild(questionDiv);
    });
}

function submitTest() {
    let correctAnswers = 0;
    let totalAnswered = 0;

    // Loop through all questions to handle explanations, display results, and label answers
    questions.forEach((question, questionIndex) => {
        const options = document.querySelectorAll(`input[name="question-${questionIndex}"]`);
        const explanationElement = document.getElementById(`explanation-${questionIndex}`);
        explanationElement.style.display = 'block'; // Show explanation and domain

        // Parsing the explanation text directly from JSON without adding duplicate labels
        let explanationText = question.explanation;

        // Function to convert any URL in the text to a clickable link
        function makeLinksClickable(text) {
            return text.replace(/https?:\/\/[^\s]+/g, link => `<a href="${link}" target="_blank">${link}</a>`);
        }

        // Split the text based on the labels, make links clickable, and format the explanation
        let correctOptionText = explanationText.match(/Correct option[s]?:\s*([\s\S]*?)(?=Incorrect option[s]?:|Reference[s]?:|$)/);
        let incorrectOptionText = explanationText.match(/Incorrect option[s]?:\s*([\s\S]*?)(?=Reference[s]?:|$)/);
        let referencesText = explanationText.match(/Reference[s]?:\s*([\s\S]*?)(?=Domain:|$)/);

        // Display the explanation and the domain directly from the JSON object
        explanationElement.innerHTML = `
            ${correctOptionText ? `<strong>Correct option(s):</strong><br><br>${makeLinksClickable(correctOptionText[1].trim())}<br><br>` : ''}
            ${incorrectOptionText ? `<strong>Incorrect option(s):</strong><br><br>${makeLinksClickable(incorrectOptionText[1].trim())}<br><br>` : ''}
            ${referencesText ? `<strong>Reference(s):</strong><br>${makeLinksClickable(referencesText[1].trim())}<br><br>` : ''}
            <strong>Domain:</strong><br>${question.domain}<br>
        `;

        // Label answers for both scored and unscored questions
        let isCorrect = true;
        let isAnswered = false;

        options.forEach((optionInput, optionIndex) => {
            const optionLabel = optionInput.parentElement;
            const isOptionCorrect = question.options[optionIndex].correct;

            if (optionInput.checked) {
                isAnswered = true;
                if (isOptionCorrect) {
                    optionLabel.style.color = 'green';
                    optionLabel.innerHTML += ' (Correct)';
                } else {
                    optionLabel.style.color = 'red';
                    optionLabel.innerHTML += ' (Incorrect)';
                    isCorrect = false;
                }
            }

            // Highlight the correct answers even if not selected
            if (isOptionCorrect && !optionInput.checked) {
                optionLabel.style.color = 'green';
                optionLabel.innerHTML += ' (Correct but not selected)';
            }
        });

        // Score calculation only for scored questions
        const isScored = scoredQuestions.some(scored => scored.index === questionIndex + 1);
        if (isScored && isAnswered) {
            totalAnswered++;
            if (isCorrect) {
                correctAnswers++;
            }
        }
    });

    // Calculate the scaled score based on the 50 scored questions
    const rawScore = correctAnswers; // Number of correct answers
    const totalQuestions = totalScored; // 50 questions for scoring
    const scaledScore = Math.round((rawScore / totalQuestions) * 900 + 100); // Scaled score from 100 to 1,000
    const passed = scaledScore >= 720; // Passing scaled score for AWS Associate exams is 720

    // Show the score and pass/fail result at the top of the page
    const resultElement = document.getElementById('result');
    resultElement.style.display = 'block'; // Show the result div
    resultElement.innerHTML = `
        <h3>Your Scaled Score: ${scaledScore}</h3>
        <p>${passed ? 'Congratulations, you passed!' : 'Unfortunately, you did not pass.'}</p>
        <p>You answered ${correctAnswers} out of ${totalQuestions} scored questions correctly.</p>
    `;

    // Scroll to the top of the page after test submission
    scrollToTopAfterSubmit();
}
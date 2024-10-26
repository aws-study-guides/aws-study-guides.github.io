let questions = []; // Array to hold all questions from JSON
let currentCardIndex = 0; // Tracks the current flashcard index

console.log("Question Set Path:", questionSet); // Check if questionSet is defined
// Fetch JSON data and initialize flashcards
fetch(`/${questionSet}`)
    .then(response => response.json())
    .then(data => {
        console.log("Data loaded successfully:", data); // Log the data to confirm it's loaded
        questions = data;
        displayFlashcard(currentCardIndex);
        updateProgress();
    })
    .catch(error => console.error('Error loading questions:', error));

function displayFlashcard(index) {
    const flashcardContainer = document.getElementById('flashcard');
    const questionObj = questions[index];

    flashcardContainer.innerHTML = '';

    const card = document.createElement('div');
    card.classList.add('flashcard-inner');
    card.addEventListener('click', () => card.classList.toggle('flipped'));

    const cardFront = document.createElement('div');
    cardFront.classList.add('card-front');
    const questionText = document.createElement('h3');
    questionText.textContent = `Q${index + 1}: ${questionObj.question}`;
    cardFront.appendChild(questionText);

    const optionsList = document.createElement('ul');
    questionObj.options.forEach(option => {
        const optionItem = document.createElement('li');
        optionItem.textContent = `${option.text}`;
        optionsList.appendChild(optionItem);
    });
    cardFront.appendChild(optionsList);

    const cardBack = document.createElement('div');
    cardBack.classList.add('card-back');
    const answerText = document.createElement('h3');
    answerText.textContent = 'Correct Answer(s):';
    cardBack.appendChild(answerText);

    const correctAnswers = document.createElement('ul');
    questionObj.options.filter(option => option.correct).forEach(correctOption => {
        const correctAnswerItem = document.createElement('li');
        correctAnswerItem.textContent = `${correctOption.text}`;
        correctAnswers.appendChild(correctAnswerItem);
    });
    cardBack.appendChild(correctAnswers);

    card.appendChild(cardFront);
    card.appendChild(cardBack);
    flashcardContainer.appendChild(card);

    // Ensure both sides have the same height based on the larger side
    requestAnimationFrame(() => {
        const maxHeight = Math.max(cardFront.scrollHeight, cardBack.scrollHeight);
        cardFront.style.height = `${maxHeight}px`;
        cardBack.style.height = `${maxHeight}px`;
    });
}

// Function to show the previous flashcard
function prevFlashcard() {
    if (currentCardIndex > 0) {
        currentCardIndex--;
        displayFlashcard(currentCardIndex);
        updateProgress();
    }
}

// Function to show the next flashcard
function nextFlashcard() {
    if (currentCardIndex < questions.length - 1) {
        currentCardIndex++;
        displayFlashcard(currentCardIndex);
        updateProgress();
    }
}

// Function to update the progress indicator
function updateProgress() {
    const progressIndicator = document.getElementById('progressIndicator');
    progressIndicator.textContent = `${currentCardIndex + 1} / ${questions.length}`;
}
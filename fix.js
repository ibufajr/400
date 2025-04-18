// Debug helper functions
const debug = {
    logGameState: function() {
        console.log('=== Game State Debug ===');
        console.log('Current Question:', gameState.questions[gameState.currentQuestionIndex]);
        console.log('Current Player:', gameState.players[gameState.currentPlayerIndex]);
        console.log('Difficulty:', gameState.difficulty);
        console.log('Category:', gameState.category);
        console.log('======================');
    },

    checkQuestionData: function(question) {
        console.log('=== Question Data Check ===');
        if (!question) {
            console.error('❌ Question is undefined');
            return false;
        }

        console.log('Question Text:', question.question ? '✅' : '❌');
        console.log('Options Array:', question.options ? '✅' : '❌');
        if (question.options) {
            console.log('Options Length:', question.options.length);
            console.log('Options Content:', question.options);
        }
        console.log('Correct Answer:', question.correct ? '✅' : '❌');
        console.log('======================');
        return true;
    },

    trackOptionsDisplay: function() {
        const optionsContainer = document.getElementById('optionsContainer');
        console.log('=== Options Display Debug ===');
        console.log('Options Container:', optionsContainer ? '✅' : '❌');
        if (optionsContainer) {
            console.log('Options Container Children:', optionsContainer.children.length);
            console.log('Options Container HTML:', optionsContainer.innerHTML);
        }
        console.log('======================');
    },

    init: function() {
        // Override startNewQuestion to add debugging
        const originalStartNewQuestion = window.startNewQuestion;
        window.startNewQuestion = function() {
            console.log('=== Starting New Question ===');
            debug.logGameState();
            
            const currentQuestion = gameState.questions[gameState.currentQuestionIndex];
            debug.checkQuestionData(currentQuestion);
            
            const result = originalStartNewQuestion.apply(this, arguments);
            
            setTimeout(() => {
                debug.trackOptionsDisplay();
            }, 100);
            
            return result;
        };

        // Override loadQuestions to add debugging
        const originalLoadQuestions = window.loadQuestions;
        window.loadQuestions = async function(category, difficulty) {
            console.log('=== Loading Questions ===');
            console.log('Category:', category);
            console.log('Difficulty:', difficulty);
            
            try {
                const questions = await originalLoadQuestions.apply(this, arguments);
                console.log('Questions Loaded:', questions ? '✅' : '❌');
                if (questions) {
                    console.log('Questions Count:', questions.length);
                    console.log('First Question Sample:', questions[0]);
                }
                return questions;
            } catch (error) {
                console.error('❌ Error Loading Questions:', error);
                throw error;
            }
        };

        // Add event listener for options container changes
        const optionsContainer = document.getElementById('optionsContainer');
        if (optionsContainer) {
            const observer = new MutationObserver((mutations) => {
                console.log('=== Options Container Changed ===');
                console.log('New Content:', optionsContainer.innerHTML);
                debug.trackOptionsDisplay();
            });
            
            observer.observe(optionsContainer, {
                childList: true,
                subtree: true
            });
        }
    }
};

// Initialize debugging
document.addEventListener('DOMContentLoaded', () => {
    debug.init();
    console.log('Debug helpers initialized');
}); 
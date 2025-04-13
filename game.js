// Player icons for the game
const playerIcons = ['👨‍🚀', '👩‍🎨', '🧙‍♂️', '🦸‍♂️', '🧜‍♀️', '🧝‍♂️', '🧚‍♀️', '🦹‍♂️'];

// Game state management
let gameState = {
  players: [],
  questions: [],
  currentQuestionIndex: 0,
  currentPlayerIndex: 0,
  scores: {},
  timePerQuestion: 30,
  category: '',
  difficulty: 'easy',
  answersCount: 3,
  timer: null,
  isAnswered: false
};

// Initialize game when document is ready
document.addEventListener('DOMContentLoaded', () => {
  try {
    const savedState = localStorage.getItem('gameState');
    if (savedState) {
      const parsedState = JSON.parse(savedState);
      gameState = {
        ...parsedState,
        timer: null,
        isAnswered: false
      };
      initializeGame();
    }

    // تشغيل موسيقى الخلفية عند تحميل صفحة الأسئلة
    if (window.gameSounds) {
      window.gameSounds.startBGM();
    }

    // Add event listeners
    const endGameBtn = document.getElementById('endGameBtn');
    if (endGameBtn) {
      endGameBtn.addEventListener('click', showEndGamePopup);
    }

    // Update difficulty display
    const difficultyElement = document.getElementById('difficulty');
    if (difficultyElement) {
      const difficultyText = GAME_CONFIG.difficulty[gameState.difficulty].label;
      difficultyElement.textContent = difficultyText;
    }

    // Initialize settings if no saved state
    if (!savedState) {
      initializeSettings();
    }
  } catch (error) {
    console.error('Error initializing game:', error);
    showError('❌ حدث خطأ في تهيئة اللعبة');
  }
});

// Initialize the game with current state
function initializeGame() {
  try {
    updatePlayersDisplay();
    startNewQuestion();
    initializeSettings();
  } catch (error) {
    console.error('Error in initializeGame:', error);
    showError('❌ حدث خطأ في بدء اللعبة');
  }
}

function startNewQuestion() {
  try {
    if (!gameState.questions || !gameState.questions[gameState.currentQuestionIndex]) {
      showError('❌ لا توجد أسئلة متاحة');
      return;
    }
    
    updateCurrentPlayerDisplay();
    
    const currentQuestion = gameState.questions[gameState.currentQuestionIndex];
    
    // تأكد من صحة بيانات السؤال
    if (!currentQuestion.question || !currentQuestion.options || currentQuestion.options.length === 0) {
      console.error('Invalid question data:', currentQuestion);
      showError('❌ خطأ في بيانات السؤال');
      return;
    }
    
    // عرض السؤال
    const questionElement = document.getElementById('questionText');
    if (questionElement) {
      questionElement.textContent = currentQuestion.question;
    }
    
    // عرض الخيارات
    const optionsContainer = document.getElementById('optionsContainer');
    if (optionsContainer) {
      optionsContainer.innerHTML = '';
      
      // Get all available options
      const allOptions = [...currentQuestion.options];
      
      // تأكد من وجود الإجابة الصحيحة في الخيارات
      if (!allOptions.includes(currentQuestion.correctAnswer)) {
        allOptions.push(currentQuestion.correctAnswer);
      }
      
      // Get the number of options based on difficulty
      const numOptions = Math.min(
        GAME_CONFIG.difficulty[gameState.difficulty].options,
        allOptions.length
      );
      
      // Shuffle all options
      const shuffledOptions = allOptions.sort(() => Math.random() - 0.5);
      
      // Make sure correct answer is included
      const correctAnswerIndex = shuffledOptions.indexOf(currentQuestion.correctAnswer);
      if (correctAnswerIndex >= numOptions) {
        // If correct answer would be cut off, swap it with a random position in the kept options
        const swapIndex = Math.floor(Math.random() * numOptions);
        [shuffledOptions[correctAnswerIndex], shuffledOptions[swapIndex]] = 
        [shuffledOptions[swapIndex], shuffledOptions[correctAnswerIndex]];
      }
      
      // Use only the required number of options
      const optionsToUse = shuffledOptions.slice(0, numOptions);
      
      // Create option buttons
      optionsToUse.forEach((option) => {
        const optionButton = document.createElement('button');
        optionButton.className = 'option';
        optionButton.textContent = option;
        optionButton.onclick = () => checkAnswer(option);
        optionsContainer.appendChild(optionButton);
      });
    }

    // Update category display
    const categoryElement = document.getElementById('questionCategory');
    if (categoryElement) {
      const categoryConfig = GAME_CONFIG.categories[gameState.category];
      if (categoryConfig) {
        categoryElement.textContent = `${categoryConfig.icon} ${categoryConfig.name}`;
      }
    }

    gameState.isAnswered = false;
    startTimer();
  } catch (error) {
    console.error('Error in startNewQuestion:', error);
    showError('❌ حدث خطأ في عرض السؤال');
  }
}

function startTimer() {
  if (gameState.timer) clearInterval(gameState.timer);
  
  let timeLeft = gameState.timePerQuestion;
  const timeLeftElement = document.getElementById('timeLeft');
  
  const updateTimer = () => {
    if (timeLeftElement) {
      timeLeftElement.textContent = timeLeft;
      
      if (timeLeft === 10) {
        timeLeftElement.style.color = '#f44336';
        if (!gameState.isAnswered && window.gameSounds) {
          window.gameSounds.startHeartbeat();
        }
      } else if (timeLeft > 10) {
        timeLeftElement.style.color = '#ffeb3b';
        if (window.gameSounds) {
          window.gameSounds.stopHeartbeat();
        }
      }
    }
  };

  updateTimer();
  
  gameState.timer = setInterval(() => {
    timeLeft--;
    updateTimer();
    
    if (timeLeft <= 0) {
      clearInterval(gameState.timer);
      if (window.gameSounds) {
        window.gameSounds.stopHeartbeat();
      }
      handleTimeout();
    }
  }, 1000);
}

function checkAnswer(selectedAnswer) {
  if (gameState.isAnswered) return;
  gameState.isAnswered = true;
  
  clearInterval(gameState.timer);
  if (window.gameSounds) {
    window.gameSounds.stopHeartbeat();
  }
  
  const currentQuestion = gameState.questions[gameState.currentQuestionIndex];
  const isCorrect = selectedAnswer === currentQuestion.correctAnswer;
  
  const options = document.querySelectorAll('.option');
  options.forEach(option => {
    if (option.textContent === currentQuestion.correctAnswer) {
      option.classList.add('correct');
    } else if (option.textContent === selectedAnswer && !isCorrect) {
      option.classList.add('wrong');
    }
    option.classList.add('disabled');
  });

  if (isCorrect) {
    const currentPlayer = gameState.players[gameState.currentPlayerIndex];
    gameState.scores[currentPlayer] = (gameState.scores[currentPlayer] || 0) + 1;
    
    if (window.gameSounds) {
      window.gameSounds.playCorrect();
    }
  } else {
    if (window.gameSounds) {
      window.gameSounds.playWrong();
    }
  }

  updatePlayersDisplay();
  
  setTimeout(() => {
    nextTurn();
  }, 2000);
}

function handleTimeout() {
  if (gameState.isAnswered) return;
  gameState.isAnswered = true;
  
  const currentQuestion = gameState.questions[gameState.currentQuestionIndex];
  const options = document.querySelectorAll('.option');
  
  options.forEach(option => {
    if (option.textContent === currentQuestion.correctAnswer) {
      option.classList.add('correct');
    }
    option.classList.add('disabled');
  });

  // Play wrong sound
  if (window.gameSounds) {
    window.gameSounds.stopHeartbeat();
    window.gameSounds.playWrong();
  }

  // Update scores
  const currentPlayer = gameState.players[gameState.currentPlayerIndex];
  gameState.scores[currentPlayer] = (gameState.scores[currentPlayer] || 0) - 5;
  updatePlayersDisplay();
  
  setTimeout(() => {
    nextTurn();
  }, 2000);
}

function nextTurn() {
  gameState.currentPlayerIndex = (gameState.currentPlayerIndex + 1) % gameState.players.length;
  
  if (gameState.currentPlayerIndex === 0) {
    gameState.currentQuestionIndex++;
  }
  
  if (gameState.currentQuestionIndex >= gameState.questions.length) {
    showResults();
    return;
  }
  
  startNewQuestion();
  updatePlayersDisplay();
}

function updateCurrentPlayerDisplay() {
  const currentPlayerElement = document.getElementById('currentPlayer');
  if (currentPlayerElement && gameState.players[gameState.currentPlayerIndex]) {
    const currentPlayer = gameState.players[gameState.currentPlayerIndex];
    const playerIcon = playerIcons[gameState.currentPlayerIndex % playerIcons.length];
    currentPlayerElement.innerHTML = `${playerIcon} ${currentPlayer}`;
  }
}

function updatePlayersDisplay() {
  const playersList = document.getElementById('playersList');
  if (!playersList || !gameState.players) return;

  playersList.innerHTML = '';
  gameState.players.forEach((player, index) => {
    const playerItem = document.createElement('div');
    playerItem.className = `player-item ${index === gameState.currentPlayerIndex ? 'active' : ''}`;
    
    const icon = document.createElement('div');
    icon.className = 'player-icon';
    icon.textContent = playerIcons[index % playerIcons.length];
    
    const name = document.createElement('div');
    name.className = 'player-name';
    name.textContent = player;
    
    const score = document.createElement('div');
    score.className = 'player-score';
    score.textContent = `${gameState.scores[player] || 0} نقطة`;
    
    playerItem.appendChild(icon);
    playerItem.appendChild(name);
    playerItem.appendChild(score);
    playersList.appendChild(playerItem);
  });
}

function showError(message) {
  Swal.fire({
    title: 'خطأ',
    text: message,
    icon: 'error',
    confirmButtonText: 'حسناً'
  });
}

function showEndGamePopup() {
  Swal.fire({
    title: '🏁 إنهاء اللعبة',
    text: 'هل أنت متأكد من أنك تريد إنهاء اللعبة وعرض النتائج؟',
    icon: 'question',
    showCancelButton: true,
    confirmButtonText: '✅ نعم، إنهاء اللعبة',
    cancelButtonText: '❌ لا، استمر باللعب',
    confirmButtonColor: '#4CAF50',
    cancelButtonColor: '#f44336'
  }).then((result) => {
    if (result.isConfirmed) {
      showResults();
    }
  });
}

function showResults() {
  clearInterval(gameState.timer);
  if (window.gameSounds) {
    window.gameSounds.stopBGM();
  }

  const sortedPlayers = [...gameState.players].sort((a, b) => 
    (gameState.scores[b] || 0) - (gameState.scores[a] || 0)
  );
  
  const winner = sortedPlayers[0];
  const winnerScore = gameState.scores[winner] || 0;
  
  let resultsHTML = `
    <div class="results-container">
      <div class="winner-section">
        <div class="winner-crown">👑</div>
        <div class="winner-name">${winner}</div>
        <div class="winner-score">${winnerScore} نقطة</div>
      </div>
      <div class="results-list">
  `;

  // Add all players to the list
  sortedPlayers.forEach((player, index) => {
    const playerIcon = playerIcons[gameState.players.indexOf(player) % playerIcons.length];
    const medal = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `${index + 1}`;
    resultsHTML += `
      <div class="player-result">
        <div class="player-rank">${medal}</div>
        <div class="player-icon">${playerIcon}</div>
        <div class="player-info">
          <div class="player-name">${player}</div>
          <div class="player-score">${gameState.scores[player] || 0} نقطة</div>
        </div>
      </div>
    `;
  });

  resultsHTML += `
      </div>
    </div>
  `;
  
  Swal.fire({
    title: '🏆 نتائج اللعبة',
    html: resultsHTML,
    showCancelButton: false,
    confirmButtonText: '🏠 العودة للصفحة الرئيسية',
    allowOutsideClick: false,
    customClass: {
      popup: 'results-popup',
      title: 'results-title',
      htmlContainer: 'results-container',
      confirmButton: 'results-button'
    }
  }).then(() => {
    localStorage.removeItem('gameState');
    window.location.href = 'index.html';
  });
}

function initializeSettings() {
  const settingsButton = document.getElementById('settingsButton');
  const settingsModal = document.getElementById('settingsModal');
  const closeSettings = document.getElementById('closeSettings');
  const settingsOk = document.getElementById('settingsOk');
  const bgmToggle = document.getElementById('bgmToggle');
  const sfxToggle = document.getElementById('sfxToggle');
  const bgmVolume = document.getElementById('bgmVolume');
  const sfxVolume = document.getElementById('sfxVolume');

  // Initialize toggle states and volumes
  if (window.gameSounds) {
    bgmToggle.checked = window.gameSounds.isBGMEnabled;
    sfxToggle.checked = window.gameSounds.isSFXEnabled;
    bgmVolume.value = window.gameSounds.bgmVolume * 100;
    sfxVolume.value = window.gameSounds.sfxVolume * 100;
  }

  if (settingsButton && settingsModal) {
    settingsButton.addEventListener('click', () => {
      settingsModal.classList.add('show');
      settingsModal.querySelector('.settings-content').classList.add('show');
    });
  }

  const closeModal = () => {
    settingsModal.classList.remove('show');
    settingsModal.querySelector('.settings-content').classList.remove('show');
  };

  if (closeSettings) {
    closeSettings.addEventListener('click', closeModal);
  }

  if (settingsOk) {
    settingsOk.addEventListener('click', closeModal);
  }

  if (bgmToggle) {
    bgmToggle.addEventListener('change', () => {
      if (window.gameSounds) {
        window.gameSounds.toggleBGM();
      }
    });
  }

  if (sfxToggle) {
    sfxToggle.addEventListener('change', () => {
      if (window.gameSounds) {
        window.gameSounds.toggleSFX();
      }
    });
  }

  if (bgmVolume) {
    bgmVolume.addEventListener('input', (e) => {
      if (window.gameSounds) {
        window.gameSounds.setBGMVolume(e.target.value);
      }
    });
  }

  if (sfxVolume) {
    sfxVolume.addEventListener('input', (e) => {
      if (window.gameSounds) {
        window.gameSounds.setSFXVolume(e.target.value);
      }
    });
  }

  // Close modal when clicking outside
  settingsModal.addEventListener('click', (e) => {
    if (e.target === settingsModal) {
      closeModal();
    }
  });
}

function displayResults() {
  const resultsContainer = document.getElementById('results');
  resultsContainer.innerHTML = '';
  
  // Create a container for the results
  const resultsWrapper = document.createElement('div');
  resultsWrapper.className = 'results-wrapper';
  
  // Sort players by score in descending order
  const sortedPlayers = Object.entries(gameState.scores)
    .sort(([, a], [, b]) => b - a);
  
  // Create rows of 4 players each
  for (let i = 0; i < sortedPlayers.length; i += 4) {
    const row = document.createElement('div');
    row.className = 'results-row';
    
    // Add up to 4 players in this row
    for (let j = 0; j < 4 && i + j < sortedPlayers.length; j++) {
      const [player, score] = sortedPlayers[i + j];
      const playerDiv = document.createElement('div');
      playerDiv.className = 'result-item';
      
      // Add player icon
      const icon = document.createElement('div');
      icon.className = 'player-icon';
      icon.innerHTML = gameState.playerIcons[player];
      
      // Add player name and score
      const info = document.createElement('div');
      info.className = 'player-info';
      info.innerHTML = `
        <span class="player-name">${player}</span>
        <span class="player-score">${score} نقطة</span>
      `;
      
      playerDiv.appendChild(icon);
      playerDiv.appendChild(info);
      row.appendChild(playerDiv);
    }
    
    resultsWrapper.appendChild(row);
  }
  
  resultsContainer.appendChild(resultsWrapper);
  resultsContainer.style.display = 'block';
}
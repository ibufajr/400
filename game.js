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

// Event listeners storage
const eventListeners = {
  click: null,
  keydown: null,
  touchstart: null
};

// Check browser compatibility
function checkCompatibility() {
  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  const supportsWebAudio = !!window.AudioContext || !!window.webkitAudioContext;
  
  if (!supportsWebAudio) {
    console.warn('Web Audio API not supported, falling back to HTML5 Audio');
    Howler.usingWebAudio = false;
  }
  
  if (isMobile) {
    gameState.timePerQuestion = 45; // زيادة الوقت للأجهزة المحمولة
  }
}

// Cleanup resources
function cleanupResources() {
  // Clear timers
  if (gameState.timer) {
    clearInterval(gameState.timer);
    gameState.timer = null;
  }
  
  // Stop all sounds
  if (window.gameSounds) {
    window.gameSounds.stopAllSounds();
  }
  
  // Remove event listeners
  Object.entries(eventListeners).forEach(([event, handler]) => {
    if (handler) {
      document.removeEventListener(event, handler);
      eventListeners[event] = null;
    }
  });
  
  // لا نقوم بمسح الخيارات هنا
}

// Reset game state
function resetGameState() {
  cleanupResources();
  
  gameState = {
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
  
  localStorage.removeItem('gameState');
}

// Error handling
function handleError(error, context) {
  console.error(`Error in ${context}:`, error);
  cleanupResources();
  showError(`❌ حدث خطأ في ${context}`);
  
  // Try to recover
  try {
    resetGameState();
    initializeGame();
  } catch (recoveryError) {
    console.error('Recovery failed:', recoveryError);
    showError('❌ فشل استعادة اللعبة، يرجى تحديث الصفحة');
  }
}

// Initialize game when document is ready
document.addEventListener('DOMContentLoaded', () => {
  try {
    checkCompatibility();
    
    const savedState = localStorage.getItem('gameState');
    if (savedState) {
      try {
        const parsedState = JSON.parse(savedState);
        if (parsedState && parsedState.questions && Array.isArray(parsedState.questions)) {
          gameState = {
            ...parsedState,
            timer: null,
            isAnswered: false
          };
          console.log('Loaded game state:', gameState); // للتأكد من تحميل البيانات
          initializeGame();
        } else {
          console.error('Invalid saved state format:', parsedState);
          resetGameState();
          initializeGame();
        }
      } catch (parseError) {
        console.error('Error parsing saved state:', parseError);
        resetGameState();
        initializeGame();
      }
    } else {
      console.log('No saved state found');
      resetGameState();
      initializeGame();
    }

    // Initialize sounds
    if (window.gameSounds) {
      window.gameSounds.startBGM();
    }

    // Add event listeners
    const endGameBtn = document.getElementById('endGameBtn');
    if (endGameBtn) {
      eventListeners.click = () => showEndGamePopup();
      endGameBtn.addEventListener('click', eventListeners.click);
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
    handleError(error, 'تهيئة اللعبة');
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
    console.log('Current question:', currentQuestion);
    
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
      // مسح الخيارات السابقة وإزالة الفئات
      optionsContainer.innerHTML = '';
      
      // إضافة خاصية الصعوبة
      optionsContainer.setAttribute('data-difficulty', gameState.difficulty);
      
      // Get all available options
      const allOptions = [...currentQuestion.options];
      console.log('All options:', allOptions);
      
      // تأكد من وجود الإجابة الصحيحة في الخيارات
      if (!allOptions.includes(currentQuestion.correct)) {
        allOptions.push(currentQuestion.correct);
      }
      
      // Get the number of options based on difficulty
      const numOptions = GAME_CONFIG.difficulty[gameState.difficulty].options;
      console.log('Number of options needed:', numOptions);
      
      // Shuffle all options
      const shuffledOptions = allOptions.sort(() => Math.random() - 0.5);
      console.log('Shuffled options:', shuffledOptions);
      
      // Make sure correct answer is included
      const correctAnswerIndex = shuffledOptions.indexOf(currentQuestion.correct);
      if (correctAnswerIndex >= numOptions) {
        // If correct answer would be cut off, swap it with a random position in the kept options
        const swapIndex = Math.floor(Math.random() * numOptions);
        [shuffledOptions[correctAnswerIndex], shuffledOptions[swapIndex]] = 
        [shuffledOptions[swapIndex], shuffledOptions[correctAnswerIndex]];
      }
      
      // Use only the required number of options
      const optionsToUse = shuffledOptions.slice(0, numOptions);
      console.log('Options to use:', optionsToUse);
      
      // Create option buttons
      optionsToUse.forEach(option => {
        const optionButton = document.createElement('button');
        optionButton.className = 'option';
        optionButton.textContent = option;
        optionButton.style.cssText = `
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 15px;
          margin: 0;
          border: 1px solid rgba(255,255,255,0.2);
          border-radius: 8px;
          background-color: rgba(0,0,0,0.3);
          color: #ffeb3b;
          font-size: clamp(14px, 1.8vw, 16px);
          cursor: pointer;
          transition: all 0.3s ease;
        `;
        optionButton.onclick = () => checkAnswer(option);
        optionsContainer.appendChild(optionButton);
        console.log('Added option button:', option);
      });

      // Force a reflow to ensure styles are applied
      optionsContainer.offsetHeight;
      
      console.log('Final options container content:', optionsContainer.innerHTML);
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
  cleanupResources(); // Clear any existing timer
  
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
      cleanupResources();
      handleTimeout();
    }
  }, 1000);
}

function updateScores() {
  try {
    const playersList = document.getElementById('playersList');
    if (!playersList) return;

    // مسح القائمة الحالية
    playersList.innerHTML = '';

    // إضافة اللاعبين مع نقاطهم
    gameState.players.forEach((player, index) => {
      const playerItem = document.createElement('div');
      playerItem.className = `player-item ${index === gameState.currentPlayerIndex ? 'active' : ''}`;
      
      const playerIcon = document.createElement('div');
      playerIcon.className = 'player-icon';
      playerIcon.textContent = playerIcons[index % playerIcons.length];
      
      const playerName = document.createElement('div');
      playerName.className = 'player-name';
      playerName.textContent = player;
      
      const playerScore = document.createElement('div');
      playerScore.className = 'player-score';
      playerScore.textContent = `${gameState.scores[player] || 0} نقطة`;
      
      playerItem.appendChild(playerIcon);
      playerItem.appendChild(playerName);
      playerItem.appendChild(playerScore);
      playersList.appendChild(playerItem);
    });
  } catch (error) {
    console.error('Error in updateScores:', error);
  }
}

function checkAnswer(selectedAnswer) {
  try {
    if (gameState.isAnswered) return;
    
    const currentQuestion = gameState.questions[gameState.currentQuestionIndex];
    const currentPlayer = gameState.players[gameState.currentPlayerIndex];
    
    // إيقاف المؤقت
    clearInterval(gameState.timer);
    
    // تعطيل جميع الخيارات
    const options = document.querySelectorAll('.option');
    options.forEach(option => {
      option.classList.add('disabled');
      option.disabled = true;
    });
    
    // التحقق من الإجابة
    if (selectedAnswer === currentQuestion.correct) {
      // إجابة صحيحة: +5 نقاط للاعب الحالي
      gameState.scores[currentPlayer] = (gameState.scores[currentPlayer] || 0) + 5;
      if (window.gameSounds) {
        window.gameSounds.playCorrect();
      }
    } else {
      // إجابة خاطئة: -2 نقاط للاعب الحالي
      gameState.scores[currentPlayer] = (gameState.scores[currentPlayer] || 0) - 2;
      if (window.gameSounds) {
        window.gameSounds.playWrong();
      }
    }
    
    // تحديث عرض النقاط
    updateScores();
    
    // تعليم الإجابة الصحيحة والخاطئة
    options.forEach(option => {
      if (option.textContent === currentQuestion.correct) {
        option.classList.add('correct');
      } else if (option.textContent === selectedAnswer) {
        option.classList.add('wrong');
      }
    });
    
    // عرض الشرح
    const explanationElement = document.getElementById('explanation');
    if (explanationElement) {
      explanationElement.textContent = currentQuestion.explanation;
      explanationElement.style.display = 'block';
    }
    
    gameState.isAnswered = true;
    
    // الانتقال للدور التالي بعد تأخير
    setTimeout(nextTurn, 3000);
  } catch (error) {
    console.error('Error in checkAnswer:', error);
    showError('❌ حدث خطأ في التحقق من الإجابة');
  }
}

function handleTimeout() {
  if (gameState.isAnswered) return;
  gameState.isAnswered = true;
  
  // خصم نقطة واحدة من اللاعب الحالي
  const currentPlayer = gameState.players[gameState.currentPlayerIndex];
  gameState.scores[currentPlayer] = (gameState.scores[currentPlayer] || 0) - 1;
  
  // تشغيل صوت الخطأ
  if (window.gameSounds) {
    window.gameSounds.playWrong();
  }
  
  // الانتقال إلى السؤال التالي بعد ثانيتين
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
  
  let resultsHTML = `
    <div class="results-wrapper">
      <div class="results-title">🏆 نتائج اللعبة</div>
  `;

  // عرض اللاعبين في صفوف من اثنين
  for (let i = 0; i < sortedPlayers.length; i += 2) {
    resultsHTML += `<div class="results-row">`;
    
    // اللاعب الأول في الصف
    const player1 = sortedPlayers[i];
    const player1Icon = playerIcons[gameState.players.indexOf(player1) % playerIcons.length];
    const player1Medal = i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : '';
    
    resultsHTML += `
      <div class="result-item">
        <div class="result-icon">${player1Icon}</div>
        <div class="result-info">
          <div class="result-name">${player1Medal} ${player1}</div>
          <div class="result-score">${gameState.scores[player1] || 0} نقطة</div>
        </div>
      </div>
    `;
    
    // اللاعب الثاني في الصف (إذا وجد)
    if (i + 1 < sortedPlayers.length) {
      const player2 = sortedPlayers[i + 1];
      const player2Icon = playerIcons[gameState.players.indexOf(player2) % playerIcons.length];
      const player2Medal = i + 1 === 0 ? '🥇' : i + 1 === 1 ? '🥈' : i + 1 === 2 ? '🥉' : '';
      
      resultsHTML += `
        <div class="result-item">
          <div class="result-icon">${player2Icon}</div>
          <div class="result-info">
            <div class="result-name">${player2Medal} ${player2}</div>
            <div class="result-score">${gameState.scores[player2] || 0} نقطة</div>
          </div>
        </div>
      `;
    }
    
    resultsHTML += `</div>`;
  }
  
  resultsHTML += `</div>`;
  
  Swal.fire({
    html: resultsHTML,
    showCancelButton: false,
    confirmButtonText: '🏠 العودة للصفحة الرئيسية',
    allowOutsideClick: false,
    background: 'transparent',
    backdrop: 'rgba(0, 0, 0, 0.8)',
    customClass: {
      popup: 'results-popup',
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
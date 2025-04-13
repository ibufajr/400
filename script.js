// Player icons for visual representation
const playerIcons = ['👨‍🚀', '👩‍🎨', '🧙‍♂️', '🦸‍♂️', '🧜‍♀️', '🧝‍♂️', '🧚‍♀️', '🦹‍♂️'];

// Initialize game sounds
let gameSounds = new GameSounds();

// Game initialization and utilities
let gameState = {
  players: [],
  questions: [],
  currentQuestionIndex: 0,
  currentPlayerIndex: 0,
  scores: {},
  timePerQuestion: 30,
  category: '',
  difficulty: 'easy',
  answersCount: 3
};

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
  // Clear any previous game state
  localStorage.removeItem('gameState');

  // Add event listeners
  const playerCountSelect = document.getElementById('playerCount');
  if (playerCountSelect) {
    playerCountSelect.addEventListener('change', (e) => generatePlayerInputs(e.target.value));
  }

  const timeSelect = document.getElementById('timeSelect');
  if (timeSelect) {
    timeSelect.addEventListener('change', (e) => handleTimeSelection(e.target.value));
  }

  const startButton = document.querySelector('.start-button');
  if (startButton) {
    startButton.addEventListener('click', startGame);
  }

  // تشغيل موسيقى الخلفية عند تحميل الصفحة
  if (window.gameSounds) {
    window.gameSounds.startBGM();
  }
});

function generatePlayerInputs(count) {
  const container = document.getElementById('playerNamesContainer');
  if (!container) return;

  container.innerHTML = '';
  
  for (let i = 1; i <= count; i++) {
    const playerDiv = document.createElement('div');
    playerDiv.className = 'player-input';
    
    const icon = document.createElement('span');
    icon.className = 'player-icon';
    icon.textContent = playerIcons[(i-1) % playerIcons.length];
    
    const input = document.createElement('input');
    input.type = 'text';
    input.id = `player${i}`;
    input.name = `player${i}`;
    input.placeholder = `لاعب ${i}`;
    input.className = 'player-name';
    input.required = true;
    
    playerDiv.appendChild(icon);
    playerDiv.appendChild(input);
    container.appendChild(playerDiv);
  }
}

function handleTimeSelection(value) {
  const customTimeContainer = document.getElementById('customTimeContainer');
  const customTimeInput = document.getElementById('customTime');
  
  if (customTimeContainer) {
    customTimeContainer.style.display = value === 'custom' ? 'block' : 'none';
  }
  
  if (value === 'custom' && customTimeInput) {
    customTimeInput.focus();
  }
}

async function loadQuestions(category, difficulty) {
  try {
    let questions = [];
    
    // تحويل اسم الفئة إلى اللغة الإنجليزية
    const categoryMap = {
      'إسلامي': 'Islamic',
      'أدب': 'Literature',
      'رياضة': 'Sports',
      'تاريخ': 'History',
      'جغرافيا': 'Geography',
      'علوم': 'Science',
      'تقني': 'Tech',
      'سينما': 'Cinema',
      'فنانين': 'Artists',
      'سياسي': 'Political',
      'دول': 'Countries',
      'عام': 'General'
    };
    
    const englishCategory = categoryMap[category] || category;
    
    if (category === 'random') {
      // في حالة اختيار "عشوائي"، نقرأ جميع الملفات في مجلد المستوى
      try {
        const response = await fetch(`data/questions/${difficulty}/`);
        if (!response.ok) {
          throw new Error(`فشل في تحميل الأسئلة للمستوى: ${difficulty}`);
        }
        
        // قراءة جميع الملفات في المجلد
        const files = await response.json();
        for (const file of files) {
          if (file.endsWith('.json')) {
            try {
              const fileResponse = await fetch(`data/questions/${difficulty}/${file}`);
              if (fileResponse.ok) {
                const content = await fileResponse.json();
                questions = questions.concat(parseQuestions(content));
              }
            } catch (error) {
              console.error(`خطأ في تحميل الملف ${file}:`, error);
              continue;
            }
          }
        }
      } catch (error) {
        console.error('خطأ في قراءة مجلد الأسئلة:', error);
        throw error;
      }
    } else {
      // في حالة اختيار فئة محددة
      const filePath = `data/questions/${difficulty}/${englishCategory}.json`;
      try {
        const response = await fetch(filePath);
        if (!response.ok) {
          throw new Error(`لا توجد أسئلة متوفرة للفئة: ${category} في المستوى: ${difficulty}`);
        }
        
        const content = await response.json();
        questions = parseQuestions(content);
      } catch (error) {
        console.error(`خطأ في تحميل الملف ${filePath}:`, error);
        throw error;
      }
    }
    
    // التحقق من وجود أسئلة
    if (!questions || questions.length === 0) {
      throw new Error(`لا توجد أسئلة للفئة: ${category}`);
    }
    
    // خلط الأسئلة
    return questions.sort(() => Math.random() - 0.5);
  } catch (error) {
    console.error('خطأ في تحميل الأسئلة:', error);
    throw error;
  }
}

function parseQuestions(data) {
  if (!data || !data.questions || !Array.isArray(data.questions)) {
    console.error('تنسيق البيانات غير صحيح:', data);
    return [];
  }

  return data.questions.map(q => {
    // التحقق من وجود جميع الأجزاء المطلوبة
    if (!q.question || !q.options || !q.correct || !q.explanation) {
      console.error('بيانات السؤال غير صالحة:', q);
      return null;
    }

    return {
      question: q.question,
      options: q.options,
      correctAnswer: q.correct,
      explanation: q.explanation
    };
  }).filter(q => q !== null);
}

async function startGame() {
  // تشغيل موسيقى الخلفية عند بدء اللعبة
  if (window.gameSounds) {
    window.gameSounds.startBGM();
  }

  // Get player information
  const playerCount = document.getElementById('playerCount')?.value;
  if (!playerCount) {
    Swal.fire({
      title: 'خطأ',
      text: 'الرجاء اختيار عدد اللاعبين',
      icon: 'error',
      confirmButtonText: 'حسناً'
    });
    return;
  }

  // Get player names
  const playerNames = [];
  for (let i = 1; i <= playerCount; i++) {
    const playerInput = document.getElementById(`player${i}`);
    const playerName = playerInput?.value?.trim() || `لاعب ${i}`;
    playerNames.push(playerName);
  }

  // Get game settings
  const category = document.getElementById('categorySelect')?.value;
  const difficulty = document.getElementById('difficulty')?.value;
  const timeSelect = document.getElementById('timeSelect')?.value;
  const customTime = document.getElementById('customTime')?.value;

  if (!category || !difficulty || !timeSelect) {
    Swal.fire({
      title: 'خطأ',
      text: 'الرجاء اختيار جميع إعدادات اللعبة',
      icon: 'error',
      confirmButtonText: 'حسناً'
    });
    return;
  }

  // Validate custom time if selected
  if (timeSelect === 'custom') {
    if (!customTime || customTime < 5 || customTime > 300) {
      Swal.fire({
        title: 'خطأ',
        text: 'الرجاء إدخال وقت صحيح بين 5 و 300 ثانية',
        icon: 'error',
        confirmButtonText: 'حسناً'
      });
      return;
    }
    gameState.timePerQuestion = parseInt(customTime);
  } else {
    gameState.timePerQuestion = parseInt(timeSelect);
  }

  try {
    // Show loading state
    Swal.fire({
      title: 'جاري تحميل الأسئلة...',
      allowOutsideClick: false,
      didOpen: () => {
        Swal.showLoading();
      }
    });

    // Load questions based on category and difficulty
    const questions = await loadQuestions(category, difficulty);
    
    // Initialize game state
    gameState = {
      players: playerNames,
      questions: questions,
      currentQuestionIndex: 0,
      currentPlayerIndex: 0,
      scores: {},
      timePerQuestion: gameState.timePerQuestion,
      category,
      difficulty,
      answersCount: GAME_CONFIG.difficulty[difficulty].options
    };

    // Save game state
    localStorage.setItem('gameState', JSON.stringify(gameState));

    // Redirect to game page
    window.location.href = 'game.html';
  } catch (error) {
    console.error('Error starting game:', error);
    Swal.fire({
      title: 'خطأ',
      text: 'حدث خطأ أثناء تحميل الأسئلة. الرجاء المحاولة مرة أخرى.',
      icon: 'error',
      confirmButtonText: 'حسناً'
    });
  }
}

timeSelect.addEventListener('change', function() {
  if (this.value === 'custom') {
    customTimeContainer.classList.add('show');
    this.classList.add('custom-selected');
  } else {
    customTimeContainer.classList.remove('show');
    this.classList.remove('custom-selected');
  }
});

// وظائف الصوت
function playSound(type, name) {
    if (defaultSoundSettings.muted) return;
    
    const soundPath = soundConfig[type][name];
    if (!soundPath) return;
    
    const audio = new Audio(soundPath);
    audio.volume = defaultSoundSettings.volume;
    audio.play().catch(error => console.error('Error playing sound:', error));
}

function playBackgroundMusic() {
    if (window.gameSounds) {
        window.gameSounds.startBGM();
    }
}

function stopBackgroundMusic() {
    const audio = document.querySelector('audio');
    if (audio) {
        audio.pause();
        audio.currentTime = 0;
    }
}

function updateSoundSettings(settings) {
    defaultSoundSettings = { ...defaultSoundSettings, ...settings };
    if (settings.muted !== undefined) {
        if (settings.muted) {
            stopBackgroundMusic();
        } else {
            playBackgroundMusic();
        }
    }
}

// تحديث وظائف اللعبة لاستخدام الأصوات الجديدة
function handleAnswer(isCorrect) {
    if (isCorrect) {
        playSound('correct', 'success');
    } else {
        playSound('wrong', 'error');
    }
}

function startTimer() {
    playSound('timer', 'tick');
}

function updateTimer() {
    if (gameState.timeLeft > 0) {
        gameState.timeLeft--;
        updateTimerDisplay();
    } else {
        clearInterval(gameState.timerInterval);
        handleTimeUp();
    }
}

function handleTimeUp() {
  // تشغيل صوت انتهاء الوقت
  playSound('timeout', 'timeout');
  
  // إيقاف المؤقت
  clearInterval(gameState.timerInterval);
  
  // تحديث حالة اللعبة
  gameState.currentPlayerIndex = (gameState.currentPlayerIndex + 1) % gameState.players.length;
  if (gameState.currentPlayerIndex === 0) {
    gameState.currentQuestionIndex++;
  }
  
  // التحقق من نهاية اللعبة
  if (gameState.currentQuestionIndex >= gameState.questions.length) {
    endGame();
    return;
  }
  
  // الانتقال للسؤال التالي
  loadNextQuestion();
}
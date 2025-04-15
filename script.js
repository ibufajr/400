// Player icons for visual representation
const playerIcons = ['👨‍🚀', '👩‍🎨', '🧙‍♂️', '🦸‍♂️', '🧜‍♀️', '🧝‍♂️', '🧛‍♀️', '🦹‍♂️'];

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

// إضافة متغير لتتبع الأسئلة المستخدمة
let usedQuestionIndices = [];

// Initialize player question history
const playerQuestionHistory = new Map();

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
  let questions = [];
  const categoryMap = {
    'إسلامي': 'Islamic',
    'تاريخ': 'History',
    'أدب': 'Literature',
    'جغرافيا': 'Geography',
    'علوم': 'Science',
    'رياضة': 'Sports',
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
    const files = [
      'Islamic.json',
      'General.json',
      'Political.json',
      'Artists.json',
      'Countries.json',
      'Cinema.json',
      'History.json',
      'Literature.json',
      'Geography.json',
      'Science.json',
      'Sports.json',
      'Tech.json'
    ];
    
    for (const file of files) {
      try {
        const response = await fetch(`data/questions/${difficulty}/${file}`);
        if (response.ok) {
          const content = await response.json();
          if (content && content.questions && Array.isArray(content.questions)) {
            questions = questions.concat(content.questions);
          }
        }
      } catch (error) {
        console.error(`خطأ في تحميل الملف ${file}:`, error);
        continue;
      }
    }
  } else {
    // في حالة اختيار فئة محددة
    try {
      const response = await fetch(`data/questions/${difficulty}/${englishCategory}.json`);
      if (response.ok) {
        const content = await response.json();
        if (content && content.questions && Array.isArray(content.questions)) {
          questions = content.questions;
        } else {
          throw new Error(`تنسيق الأسئلة غير صحيح في الملف`);
        }
      } else {
        throw new Error(`لا توجد أسئلة متوفرة للفئة: ${category} في المستوى: ${difficulty}`);
      }
    } catch (error) {
      console.error(`خطأ في تحميل الأسئلة:`, error);
      throw error;
    }
  }
  
  if (questions.length === 0) {
    throw new Error('لم يتم العثور على أي أسئلة صالحة');
  }
  
  return questions.map((q, index) => ({
    ...q,
    id: `${category}-${difficulty}-${q.question}-${index}`
  }));
}

function parseJSONQuestions(data) {
  if (!data || !data.questions || !Array.isArray(data.questions)) {
    console.error('تنسيق البيانات JSON غير صحيح:', data);
    return [];
  }

  return data.questions.map(q => {
    // التحقق من وجود جميع الأجزاء المطلوبة
    if (!q.question || !q.options || !q.correct || !q.explanation) {
      console.error('بيانات السؤال JSON غير صالحة:', q);
      return null;
    }

    return {
      question: q.question,
      options: q.options,
      correct: q.correct,
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
    
    if (!questions || questions.length === 0) {
      throw new Error('لم يتم العثور على أسئلة');
    }

    // Initialize game state
    const newGameState = {
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

    // Initialize scores for each player
    playerNames.forEach(player => {
      newGameState.scores[player] = 0;
    });

    // Save game state
    localStorage.setItem('gameState', JSON.stringify(newGameState));
    console.log('Saved game state:', newGameState); // للتأكد من حفظ البيانات

    // Initialize player question history
    playerQuestionHistory.clear();
    playerNames.forEach(player => {
      playerQuestionHistory.set(player, new Set());
    });

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
    // ... existing code ...
}

function startNewQuestion() {
  const currentPlayer = gameState.players[gameState.currentPlayerIndex];
  const usedQuestions = playerQuestionHistory.get(currentPlayer) || new Set();

  // فلترة الأسئلة غير المستخدمة لهذا اللاعب
  const availableQuestions = gameState.questions.filter(q => !usedQuestions.has(q.id));

  if (availableQuestions.length === 0) {
    // إذا لم يتبق أسئلة، نعيد استخدام الأسئلة لهذا اللاعب فقط
    playerQuestionHistory.set(currentPlayer, new Set());
    return startNewQuestion();
  }

  const randomIndex = Math.floor(Math.random() * availableQuestions.length);
  const question = availableQuestions[randomIndex];

  // إضافة السؤال إلى المستخدمة لهذا اللاعب
  usedQuestions.add(question.id);
  playerQuestionHistory.set(currentPlayer, usedQuestions);

  // عرض السؤال
  const questionElement = document.getElementById('currentQuestion');
  questionElement.textContent = question.question;

  // عرض الخيارات
  const answerButtons = document.querySelectorAll('.answer-button');
  answerButtons.forEach((btn, index) => {
    btn.textContent = question.options[index];
    btn.dataset.correct = index === question.correct;
  });

  // بدء المؤقت
  startTimer();
}

function endGame() {
  // إعادة تعيين الأسئلة المستخدمة عند انتهاء اللعبة
  usedQuestionIndices = [];
  // ... باقي الكود ...
}

function nextPlayer() {
  gameState.currentPlayerIndex = (gameState.currentPlayerIndex + 1) % gameState.players.length;
  startNewQuestion();
}
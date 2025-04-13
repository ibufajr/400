// Game Sound System
class GameSounds {
  constructor() {
    this.sounds = {};
    this.bgm = null;
    this.isBGMEnabled = true;
    this.isSFXEnabled = true;
    this.bgmVolume = 0.5;
    this.sfxVolume = 0.7;
    this.soundLock = false;
    this.heartbeatSound = null;
    this.heartbeatInterval = null;
    this.audioContextInitialized = false;
    this.initialized = false;
    
    // تكوين Howler.js
    Howler.html5PoolSize = 4; // تقليل حجم المجموعة بشكل كبير
    Howler.autoUnlock = true; // السماح بفتح الصوت تلقائياً
    Howler.autoSuspend = false; // منع تعليق السياق تلقائياً
    
    // إضافة مستمعي الأحداث للتفاعل
    this.initializeAudioContext = this.initializeAudioContext.bind(this);
    ['click', 'touchstart'].forEach(event => {
      document.addEventListener(event, this.initializeAudioContext, { once: true });
    });

    const soundConfig = {
      correct: {
        success: 'data/sounds/correct/success.mp3'
      },
      wrong: {
        error: 'data/sounds/wrong/error.mp3'
      },
      timer: {
        tick: 'data/sounds/timer/tick.mp3'
      },
      timeout: {
        timeout: 'data/sounds/timeout/timeout.mp3'
      }
    };
  }

  initializeAudioContext() {
    if (this.audioContextInitialized) return;
    this.audioContextInitialized = true;
    
    // تهيئة السياق الصوتي
    if (Howler.ctx && Howler.ctx.state === 'suspended') {
      Howler.ctx.resume();
    }
    
    // بدء تحميل الأصوات
    this.initializeSounds();
  }

  async initializeSounds() {
    if (this.initialized) return;
    this.initialized = true;

    try {
      // تحميل الموسيقى الخلفية أولاً
      await this.loadBackgroundMusic();
      
      // تحميل المؤثرات الصوتية بشكل متسلسل
      await this.loadSoundEffects();
      
      console.log('All sounds initialized successfully');
    } catch (error) {
      console.error('Error initializing sounds:', error);
    }
  }

  async loadBackgroundMusic() {
    return new Promise((resolve) => {
      this.bgm = new Howl({
        src: ['data/sounds/background/calm.mp3'],
        loop: true,
        volume: this.bgmVolume,
        html5: true,
        preload: true,
        onload: resolve,
        onloaderror: () => {
          console.warn('Warning: Could not load background music');
          resolve();
        }
      });
    });
  }

  async loadSoundEffects() {
    const effectsToLoad = [
      { id: 'correct', src: 'data/sounds/correct/success.mp3' },
      { id: 'wrong', src: 'data/sounds/error-4-199275.mp3' },
      { id: 'countdown', src: 'data/sounds/timer/tick_tock.mp3' },
      { id: 'win', src: 'data/sounds/error-4-199275.mp3' },
      { id: 'lose', src: 'data/sounds/error-4-199275.mp3' },
      { id: 'click', src: 'data/sounds/click/click.mp3' }
    ];

    // تحميل كل صوت على حدة مع فترة انتظار بين كل تحميل
    for (const effect of effectsToLoad) {
      await new Promise(resolve => setTimeout(resolve, 100)); // انتظار 100ms بين كل تحميل
      await this.loadSingleEffect(effect);
    }

    // تحميل صوت نبضات القلب في النهاية
    await this.loadHeartbeatSound();
  }

  async loadSingleEffect(effect) {
    return new Promise((resolve) => {
      this.sounds[effect.id] = new Howl({
        src: [effect.src],
        volume: this.sfxVolume,
        html5: true,
        preload: true,
        onload: resolve,
        onloaderror: () => {
          console.warn(`Warning: Could not load ${effect.id} sound, using fallback`);
          // محاولة تحميل الصوت الاحتياطي
          this.sounds[effect.id] = new Howl({
            src: ['data/sounds/error-4-199275.mp3'],
            volume: this.sfxVolume,
            html5: true,
            preload: true,
            onload: resolve,
            onloaderror: () => {
              console.error(`Critical: Failed to load fallback sound for ${effect.id}`);
              resolve(); // نستمر حتى لو فشل التحميل
            }
          });
        }
      });
    });
  }

  async loadHeartbeatSound() {
    return new Promise((resolve) => {
      this.heartbeatSound = new Howl({
        src: ['data/sounds/heartbeat/heartbeat.mp3'],
        volume: this.sfxVolume,
        html5: true,
        preload: true,
        onload: resolve,
        onloaderror: () => {
          console.warn('Warning: Could not load heartbeat sound, using fallback');
          this.heartbeatSound = new Howl({
            src: ['data/sounds/error-4-199275.mp3'],
            volume: this.sfxVolume,
            html5: true,
            preload: true,
            onload: resolve,
            onloaderror: () => {
              console.warn('Warning: Heartbeat sound will be disabled');
              this.heartbeatSound = null;
              resolve();
            }
          });
        }
      });
    });
  }

  resumeAudio() {
    if (this.bgm && this.isBGMEnabled) {
      this.bgm.play();
    }
  }

  async playSound(soundId) {
    if (!this.isSFXEnabled || this.soundLock) return;
    
    if (this.sounds[soundId]) {
      // Stop any currently playing sound effects except background music
      this.stopAllSounds();
      
      // Play the requested sound
      this.sounds[soundId].play();
    }
  }

  stopAllSounds() {
    // Stop all sound effects except background music
    Object.values(this.sounds).forEach(sound => {
      if (sound) sound.stop();
    });
    if (this.heartbeatSound) {
      this.heartbeatSound.stop();
      if (this.heartbeatInterval) {
        clearInterval(this.heartbeatInterval);
        this.heartbeatInterval = null;
      }
    }
  }

  async playCorrect() {
    await this.playSound('correct');
  }

  async playWrong() {
    await this.playSound('wrong');
  }

  startCountdown() {
    if (this.isSFXEnabled && !this.soundLock) {
      this.stopAllSounds();
      this.sounds.countdown.play();
    }
  }

  startBGM() {
    console.log('Starting background music...');
    if (!this.initialized) {
      this.initializeSounds();
    }
    
    if (this.bgm && this.isBGMEnabled) {
      // Check if AudioContext is in suspended state
      if (Howler.ctx && Howler.ctx.state === 'suspended') {
        console.log('AudioContext is suspended, waiting for user interaction');
        return;
      }
      
      // Try to play the background music
      try {
        if (!this.bgm.playing()) {
          this.bgm.play();
        }
      } catch (error) {
        console.error('Error playing background music:', error);
      }
    }
  }

  stopBGM() {
    this.bgm.stop();
  }

  toggleBGM() {
    this.isBGMEnabled = !this.isBGMEnabled;
    if (this.isBGMEnabled) {
      this.startBGM();
    } else {
      this.stopBGM();
    }
    return this.isBGMEnabled;
  }

  toggleSFX() {
    this.isSFXEnabled = !this.isSFXEnabled;
    if (!this.isSFXEnabled) {
      this.stopAllSounds();
    }
    return this.isSFXEnabled;
  }

  setBGMVolume(volume) {
    this.bgmVolume = Math.round((volume / 100) * 100) / 100;
    this.bgm.volume(this.bgmVolume);
  }

  setSFXVolume(volume) {
    this.sfxVolume = Math.round((volume / 100) * 100) / 100;
    Object.values(this.sounds).forEach(sound => {
      sound.volume(this.sfxVolume);
    });
  }

  startHeartbeat() {
    if (this.isSFXEnabled && !this.soundLock) {
      this.heartbeatSound.currentTime = 0;
      this.heartbeatSound.play();
      this.heartbeatInterval = setInterval(() => {
        if (this.isSFXEnabled && !this.soundLock) {
          this.heartbeatSound.currentTime = 0;
          this.heartbeatSound.play();
        }
      }, 1000); // يعيد تشغيل الصوت كل ثانية
    }
  }

  stopHeartbeat() {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
    if (this.heartbeatSound) {
      this.heartbeatSound.pause();
      this.heartbeatSound.currentTime = 0;
    }
  }
}

// Create global instance
window.gameSounds = new GameSounds();
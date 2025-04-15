// Game Sound System
class GameSounds {
  constructor() {
    this.sounds = {};
    this.bgm = null;
    this.isBGMEnabled = true;
    this.isSFXEnabled = true;
    this.bgmVolume = 0.3;
    this.sfxVolume = 0.5;
    this.soundLock = false;
    this.heartbeatSound = null;
    this.heartbeatInterval = null;
    this.audioContextInitialized = false;
    this.initialized = false;
    this.loadingPromises = [];
    
    // تكوين Howler.js
    Howler.html5PoolSize = 10;
    Howler.autoUnlock = true;
    Howler.autoSuspend = false;
    Howler.usingWebAudio = true;
    
    // إضافة مستمعي الأحداث للتفاعل
    this.initializeAudioContext = this.initializeAudioContext.bind(this);
    ['click', 'touchstart', 'keydown'].forEach(event => {
      document.addEventListener(event, this.initializeAudioContext, { once: true });
    });
  }

  initializeAudioContext() {
    if (this.audioContextInitialized) return;
    this.audioContextInitialized = true;
    
    try {
      if (Howler.ctx && Howler.ctx.state === 'suspended') {
        Howler.ctx.resume();
      }
      this.initializeSounds();
    } catch (error) {
      console.error('Error initializing audio context:', error);
      this.fallbackToHTML5();
    }
  }

  fallbackToHTML5() {
    console.warn('Falling back to HTML5 Audio');
    Howler.usingWebAudio = false;
    Howler.html5PoolSize = 5;
    this.initializeSounds();
  }

  async initializeSounds() {
    if (this.initialized) return;
    this.initialized = true;

    try {
      await Promise.all([
        this.loadBackgroundMusic(),
        this.loadSoundEffects()
      ]);
      
      console.log('All sounds initialized successfully');
    } catch (error) {
      console.error('Error initializing sounds:', error);
      this.handleSoundError();
    }
  }

  handleSoundError() {
    // محاولة إعادة التهيئة بعد فترة
    setTimeout(() => {
      this.initialized = false;
      this.initializeSounds();
    }, 5000);
  }

  async loadBackgroundMusic() {
    return new Promise((resolve) => {
      this.bgm = new Howl({
        src: ['data/sounds/background/calm.mp3'],
        loop: true,
        volume: this.bgmVolume,
        html5: false,
        preload: true,
        onload: resolve,
        onloaderror: () => {
          console.warn('Warning: Could not load background music');
          this.bgm = null;
          resolve();
        }
      });
    });
  }

  async loadSoundEffects() {
    const effectsToLoad = [
      { id: 'correct', src: 'data/sounds/correct/success.mp3' },
      { id: 'wrong', src: 'data/sounds/wrong/error.mp3' },
      { id: 'countdown', src: 'data/sounds/timer/tick_tock.mp3' },
      { id: 'win', src: 'data/sounds/error-4-199275.mp3' },
      { id: 'lose', src: 'data/sounds/error-4-199275.mp3' },
      { id: 'click', src: 'data/sounds/click/click.mp3' }
    ];

    const loadPromises = effectsToLoad.map(effect => 
      new Promise(resolve => {
        setTimeout(() => {
          this.loadSingleEffect(effect).then(resolve);
        }, 200);
      })
    );

    await Promise.all(loadPromises);
    await this.loadHeartbeatSound();
  }

  async loadSingleEffect(effect) {
    return new Promise((resolve) => {
      this.sounds[effect.id] = new Howl({
        src: [effect.src],
        volume: this.sfxVolume,
        html5: false,
        preload: true,
        onload: resolve,
        onloaderror: () => {
          console.warn(`Warning: Could not load ${effect.id} sound, using fallback`);
          this.loadFallbackSound(effect.id).then(resolve);
        }
      });
    });
  }

  async loadFallbackSound(id) {
    return new Promise((resolve) => {
      this.sounds[id] = new Howl({
        src: ['data/sounds/error-4-199275.mp3'],
        volume: this.sfxVolume,
        html5: false,
        preload: true,
        onload: resolve,
        onloaderror: () => {
          console.error(`Critical: Failed to load fallback sound for ${id}`);
          this.sounds[id] = null;
          resolve();
        }
      });
    });
  }

  async loadHeartbeatSound() {
    return new Promise((resolve) => {
      this.heartbeatSound = new Howl({
        src: ['data/sounds/heartbeat/heartbeat.mp3'],
        volume: this.sfxVolume,
        html5: false,
        preload: true,
        onload: resolve,
        onloaderror: () => {
          console.warn('Warning: Could not load heartbeat sound, using fallback');
          this.heartbeatSound = new Howl({
            src: ['data/sounds/error-4-199275.mp3'],
            volume: this.sfxVolume,
            html5: false,
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
      this.bgm.play();
    } else {
      this.bgm.pause();
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
// Game Configuration
const GAME_CONFIG = {
  categories: {
    random: { icon: '🎲', name: 'عشوائي' },
    'Islamic': { icon: '🕌', name: 'إسلامي' },
    'أدب': { icon: '📖', name: 'أدب' },
    'رياضة': { icon: '⚽', name: 'رياضة' },
    'تاريخ': { icon: '📜', name: 'تاريخ' },
    'جغرافيا': { icon: '🗺️', name: 'جغرافيا' },
    'علوم': { icon: '🔬', name: 'علوم' },
    'تقني': { icon: '💻', name: 'تقني' },
    'سينما': { icon: '🎬', name: 'سينما' },
    'فنانين': { icon: '🎨', name: 'فنانين' },
    'سياسي': { icon: '👔', name: 'سياسي' },
    'دول': { icon: '🌍', name: 'دول' },
    'عام': { icon: '📚', name: 'عام' }
  },
  
  difficulty: {
    easy: { 
      options: 2,
      points: 1,
      color: '#4CAF50',
      label: 'سهل'
    },
    medium: { 
      options: 3,
      points: 2,
      color: '#FF9800',
      label: 'متوسط'
    },
    hard: { 
      options: 4,
      points: 3,
      color: '#F44336',
      label: 'صعب'
    }
  },
  
  ui: {
    colors: {
      primary: '#2196F3',
      success: '#4CAF50',
      danger: '#F44336',
      accent: '#6a1b9a',
      background: {
        start: '#120045',
        end: '#3b0060'
      }
    },
    fonts: {
      primary: 'Tajawal',
      secondary: 'Cairo'
    }
  }
};

const defaultSoundSettings = {
  volume: 0.5,
  muted: false,
  background: 'default'
};

// Make config available globally
window.GAME_CONFIG = GAME_CONFIG;
window.defaultSoundSettings = defaultSoundSettings;
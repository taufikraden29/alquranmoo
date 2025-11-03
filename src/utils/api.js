// API utility functions for Quran API
export const quranAPI = {
  // Fetch all surahs list - /surah
  fetchAllSurahs: async () => {
    const response = await fetch('https://api.quran.gading.dev/surah');
    if (!response.ok) throw new Error('Gagal mengambil daftar surah');
    return response.json();
  },

  // Fetch specific surah details - /surah/{surah}
  fetchSurah: async (surahNumber) => {
    const response = await fetch(`https://api.quran.gading.dev/surah/${surahNumber}`);
    if (!response.ok) throw new Error('Gagal mengambil data surah');
    return response.json();
  },

  // Fetch specific ayah with requested surah - /surah/{surah}/{ayah}
  fetchAyah: async (surahNumber, ayahNumber) => {
    const response = await fetch(`https://api.quran.gading.dev/surah/${surahNumber}/${ayahNumber}`);
    if (!response.ok) throw new Error('Gagal mengambil data ayat');
    return response.json();
  },

  // Fetch specific juz with all ayah - /juz/{juz}
  fetchJuz: async (juzNumber) => {
    const response = await fetch(`https://api.quran.gading.dev/juz/${juzNumber}`);
    if (!response.ok) throw new Error('Gagal mengambil data juz');
    return response.json();
  },

  // Fetch random ayah
  fetchRandomAyah: async () => {
    const response = await fetch('https://api.quran.gading.dev/surah/random');
    if (!response.ok) throw new Error('Gagal mengambil ayat acak');
    return response.json();
  },

  // Search surah by name
  searchSurah: async (query) => {
    const response = await fetch(`https://api.quran.gading.dev/surah?q=${encodeURIComponent(query)}`);
    if (!response.ok) throw new Error('Gagal mencari surah');
    return response.json();
  }
};

// Date utility functions
export const dateUtils = {
  // Format date as YYYY-MM-DD
  formatDate: (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  },

  // Get today's date in YYYY-MM-DD format
  getToday: () => {
    return dateUtils.formatDate(new Date());
  },

  // Get time based on selected timezone
  getTimeByTimezone: (timezone = 'wib') => {
    const now = new Date();
    let timeZoneId = 'Asia/Jakarta'; // Default to WIB (UTC+7)
    
    switch (timezone.toLowerCase()) {
      case 'wita':
        timeZoneId = 'Asia/Makassar'; // WITA (UTC+8)
        break;
      case 'wit':
        timeZoneId = 'Asia/Jayapura'; // WIT (UTC+9)
        break;
      case 'wib':
      default:
        timeZoneId = 'Asia/Jakarta'; // WIB (UTC+7)
        break;
    }
    
    return now.toLocaleTimeString('id-ID', {
      timeZone: timeZoneId,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  },

  // Legacy function for backward compatibility
  getTimeInWIB: () => {
    return dateUtils.getTimeByTimezone('wib');
  }
};

// Local storage utility functions
export const storageUtils = {
  // Get item from localStorage with validation
  getItem: (key) => {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : null;
    } catch (error) {
      console.error(`Error getting item from localStorage: ${key}`, error);
      return null;
    }
  },

  // Set item to localStorage with validation
  setItem: (key, value) => {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      console.error(`Error setting item to localStorage: ${key}`, error);
    }
  },

  // Remove item from localStorage
  removeItem: (key) => {
    try {
      localStorage.removeItem(key);
    } catch (error) {
      console.error(`Error removing item from localStorage: ${key}`, error);
    }
  },

  // Get cached cities from localStorage
  getCachedCities: () => {
    const cachedCities = storageUtils.getItem('cachedCities');
    const cacheTime = storageUtils.getItem('citiesCacheTime');

    if (
      cachedCities &&
      cacheTime &&
      Date.now() - parseInt(cacheTime) < 24 * 60 * 60 * 1000
    ) {
      return cachedCities;
    }
    return null;
  },

  // Cache cities in localStorage
  cacheCities: (cities) => {
    storageUtils.setItem('cachedCities', cities);
    storageUtils.setItem('citiesCacheTime', Date.now().toString());
  },

  // Get last selected city
  getLastSelectedCity: () => {
    return storageUtils.getItem('lastSelectedCity');
  },

  // Set last selected city
  setLastSelectedCity: (city) => {
    storageUtils.setItem('lastSelectedCity', city);
  }
};

// Prayer times API functions
export const prayerAPI = {
  // Fetch all cities for prayer times
  fetchCities: async () => {
    const response = await fetch('https://api.myquran.com/v2/sholat/kota/semua');
    if (!response.ok) throw new Error('Gagal mengambil data kota');
    return response.json();
  },

  // Fetch prayer schedule for a city
  fetchPrayerSchedule: async (cityId, year, month, day) => {
    const response = await fetch(`https://api.myquran.com/v2/sholat/jadwal/${cityId}/${year}/${month}/${day}`);
    if (!response.ok) throw new Error('Gagal mengambil jadwal shalat');
    return response.json();
  },

  // Fetch random dua
  fetchRandomDua: async () => {
    const response = await fetch('https://api.myquran.com/v2/doa/acak');
    if (!response.ok) throw new Error('Gagal mengambil doa acak');
    return response.json();
  }
};
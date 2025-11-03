import { useEffect, useState, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Clock,
  Search,
  MapPin,
  Bell,
  BellOff,
  RefreshCw,
  BookOpen,
  BookText,
  Menu,
  X,
  Sun,
  Moon,
  User,
  Settings,
  Compass,
  Volume2,
  Pause,
  Play,
} from "lucide-react";
import QuranBrowser from "./components/QuranBrowser";
import Loading from "./components/Loading";
import ErrorComponent from "./components/Error";
import { quranAPI, prayerAPI, dateUtils, storageUtils } from "./utils/api";

// Konstanta untuk prayer times dengan warna modern
const PRAYER_TIMES = [
  {
    key: "imsak",
    name: "Imsak",
    emoji: "🌅",
    gradientClass: "gradient-imsak",
  },
  {
    key: "subuh",
    name: "Subuh",
    emoji: "🌄",
    gradientClass: "gradient-subuh",
  },
  {
    key: "dzuhur",
    name: "Dzuhur",
    emoji: "☀️",
    gradientClass: "gradient-dzuhur",
  },
  {
    key: "ashar",
    name: "Ashar",
    emoji: "⛅",
    gradientClass: "gradient-ashar",
  },
  {
    key: "maghrib",
    name: "Maghrib",
    emoji: "🌇",
    gradientClass: "gradient-maghrib",
  },
  {
    key: "isya",
    name: "Isya",
    emoji: "🌙",
    gradientClass: "gradient-isya",
  },
];

export default function PrayerScheduleApp() {
  const [cities, setCities] = useState([]);
  const [filteredCities, setFilteredCities] = useState([]);
  const [selectedCity, setSelectedCity] = useState(null);
  const [cityName, setCityName] = useState("");
  const [schedule, setSchedule] = useState(null);
  const [currentTime, setCurrentTime] = useState("");
  const [nextPrayer, setNextPrayer] = useState(null);
  const [countdown, setCountdown] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showCityList, setShowCityList] = useState(false);
  const [notificationPermission, setNotificationPermission] =
    useState("default");
  const [notificationEnabled, setNotificationEnabled] = useState(false);
  const [randomDua, setRandomDua] = useState(null);
  const [loadingDua, setLoadingDua] = useState(false);
  
  // New states for Quran features
  const [activeTab, setActiveTab] = useState('prayer'); // 'prayer' or 'quran'
  const [showMenu, setShowMenu] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [fontSize, setFontSize] = useState('medium');
  const [theme, setTheme] = useState('light');
  const [showSettings, setShowSettings] = useState(false);
  const [language, setLanguage] = useState('id'); // 'id' for Indonesian, 'en' for English
  const [userPreferences, setUserPreferences] = useState({
    recitationStyle: 'default',
    translationLanguage: 'indonesian',
    showTafsir: true,
    autoPlay: false,
  });
  
  // State for recent Quran reading with bookmarks
  const [recentReadings, setRecentReadings] = useState([]);
  const [bookmarkedSurahs, setBookmarkedSurahs] = useState(new Set());
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(null);
  const [notificationSettings, setNotificationSettings] = useState({
    enabled: true,
    timeBefore: [5, 15] // Minutes before prayer time
  });

  // 🚀 Register Service Worker
  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker
        .register("/sw.js")
        .then(() => console.log("Service Worker registered"))
        .catch((err) => console.error("SW registration failed:", err));
    }
  }, []);

  // 🌙 Apply theme and dark mode
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme') || 'light';
    setTheme(savedTheme);
    
    const root = document.documentElement;
    if (savedTheme === 'dark') {
      root.setAttribute('data-theme', 'dark');
      document.body.classList.add('dark');
    } else {
      root.removeAttribute('data-theme');
      document.body.classList.remove('dark');
    }
  }, []);

  const toggleTheme = useCallback(() => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);
    
    const root = document.documentElement;
    if (newTheme === 'dark') {
      root.setAttribute('data-theme', 'dark');
      document.body.classList.add('dark');
    } else {
      root.removeAttribute('data-theme');
      document.body.classList.remove('dark');
    }
  }, [theme]);
  
  // Load notification settings from localStorage
  useEffect(() => {
    const savedSettings = JSON.parse(localStorage.getItem('notificationSettings') || 'null');
    if (savedSettings) {
      setNotificationSettings(savedSettings);
    }
  }, []);
  
  // Load recent readings and bookmarks from localStorage
  useEffect(() => {
    const savedRecentReadings = JSON.parse(localStorage.getItem('recentReadings') || '[]');
    const savedBookmarks = JSON.parse(localStorage.getItem('bookmarkedSurahs') || '[]');
    setRecentReadings(savedRecentReadings);
    setBookmarkedSurahs(new Set(savedBookmarks));
  }, []);
  
  // Save recent readings to localStorage
  const saveRecentReading = useCallback((surah) => {
    const updatedReadings = [surah, ...recentReadings.filter(item => item.number !== surah.number)].slice(0, 5); // Keep only last 5 readings
    setRecentReadings(updatedReadings);
    localStorage.setItem('recentReadings', JSON.stringify(updatedReadings));
  }, [recentReadings]);
  
  // Toggle bookmark for a surah or ayat
  const toggleBookmark = useCallback((item) => {
    const updatedBookmarks = new Set(bookmarkedSurahs);
    
    // Handle both surah-level and ayat-level bookmarks
    let bookmarkKey;
    let isAyatBookmark = false;
    
    if (item.surahNumber && item.verseNumber) {
      // This is an ayat-level bookmark
      bookmarkKey = `${item.surahNumber}:${item.verseNumber}`;
      isAyatBookmark = true;
    } else {
      // This is a surah-level bookmark
      bookmarkKey = item.number;
    }
    
    if (updatedBookmarks.has(bookmarkKey)) {
      updatedBookmarks.delete(bookmarkKey);
    } else {
      updatedBookmarks.add(bookmarkKey);
      // Only save to recent readings if it's a surah-level bookmark
      if (!isAyatBookmark) {
        saveRecentReading(item);
      }
    }
    
    setBookmarkedSurahs(updatedBookmarks);
    localStorage.setItem('bookmarkedSurahs', JSON.stringify(Array.from(updatedBookmarks)));
  }, [bookmarkedSurahs, saveRecentReading]);
  
  // Check if a surah or ayat is bookmarked
  const isBookmarked = useCallback((key) => {
    return bookmarkedSurahs.has(key);
  }, [bookmarkedSurahs]);
  
  // Remove a recent reading with confirmation
  const removeRecentReading = useCallback((surahNumber) => {
    const updatedReadings = recentReadings.filter(item => item.number !== surahNumber);
    setRecentReadings(updatedReadings);
    localStorage.setItem('recentReadings', JSON.stringify(updatedReadings));
    setShowDeleteConfirmation(null);
  }, [recentReadings]);
  
  // Show delete confirmation for a recent reading
  const confirmDeleteRecent = useCallback((surahNumber, surahName) => {
    setShowDeleteConfirmation({
      surahNumber,
      surahName
    });
  }, []);
  
  // 🌐 Language settings
  useEffect(() => {
    const savedLanguage = localStorage.getItem('language') || 'id';
    setLanguage(savedLanguage);
  }, []);

  const toggleLanguage = useCallback(() => {
    const newLanguage = language === 'id' ? 'en' : 'id';
    setLanguage(newLanguage);
    localStorage.setItem('language', newLanguage);
  }, [language]);
  
  // Translation strings
  const t = (key) => {
    const translations = {
      id: {
        'Prayer Schedule': 'Jadwal Shalat',
        'Al-Quran': 'Al-Quran',
        'Jadwal Shalat': 'Jadwal Shalat',
        'Settings': 'Pengaturan',
        'Dark Mode': 'Mode Gelap',
        'Light Mode': 'Mode Terang',
        'Theme': 'Tema',
        'Language': 'Bahasa',
        'Indonesian': 'Indonesian',
        'English': 'English',
        'Size': 'Ukuran',
        'Small': 'Kecil',
        'Medium': 'Sedang',
        'Large': 'Besar',
        'Prayer Notifications': 'Notifikasi Shalat',
        'Next Prayer': 'Shalat Berikutnya',
        'Total Prayers': 'Total Shalat',
        'Nearest Mosque': 'Masjid Terdekat',
        'Daily Prayers': 'Shalat Harian',
        'Quran Browser': 'Peramban Al-Quran',
        'Surah': 'Surah',
        'Juz': 'Juz',
        'Search Surah, Juz, or Verse': 'Cari Surah, Juz, atau Ayat',
        'Random': 'Acak',
        'Search': 'Cari',
        'Prayer Schedule of the Day': 'Jadwal Shalat Hari Ini',
        'Find': 'Cari',
        'Imsak': 'Imsak',
        'Subuh': 'Subuh',
        'Dzuhur': 'Dzuhur',
        'Ashar': 'Ashar',
        'Maghrib': 'Maghrib',
        'Isya': 'Isya',
        'Daily Dua': 'Doa Harian',
        'Refresh': 'Refresh',
        'Confirm Delete': 'Konfirmasi Hapus',
        'Are you sure you want to remove': 'Apakah Anda yakin ingin menghapus',
        'from recent readings?': 'dari bacaan terbaru?',
        'Cancel': 'Batal',
        'Delete': 'Hapus',
        'min': 'menit',
      },
      en: {
        'Jadwal Shalat': 'Prayer Schedule',
        'Al-Quran': 'Al-Quran',
        'Prayer Schedule': 'Prayer Schedule',
        'Settings': 'Settings',
        'Dark Mode': 'Dark Mode',
        'Light Mode': 'Light Mode',
        'Theme': 'Theme',
        'Language': 'Language',
        'Indonesian': 'Indonesian',
        'English': 'English',
        'Size': 'Size',
        'Small': 'Small',
        'Medium': 'Medium',
        'Large': 'Large',
        'Prayer Notifications': 'Prayer Notifications',
        'Next Prayer': 'Next Prayer',
        'Total Prayers': 'Total Prayers',
        'Nearest Mosque': 'Nearest Mosque',
        'Daily Prayers': 'Daily Prayers',
        'Quran Browser': 'Quran Browser',
        'Surah': 'Surah',
        'Juz': 'Juz',
        'Search Surah, Juz, or Verse': 'Search Surah, Juz, or Verse',
        'Random': 'Random',
        'Search': 'Search',
        'Prayer Schedule of the Day': 'Prayer Schedule of the Day',
        'Find': 'Find',
        'Imsak': 'Imsak',
        'Subuh': 'Dawn',
        'Dzuhur': 'Noon',
        'Ashar': 'Afternoon',
        'Maghrib': 'Sunset',
        'Isya': 'Night',
        'Daily Dua': 'Daily Prayer',
        'Refresh': 'Refresh',
        'Confirm Delete': 'Confirm Delete',
        'Are you sure you want to remove': 'Are you sure you want to remove',
        'from recent readings?': 'from recent readings?',
        'Cancel': 'Cancel',
        'Delete': 'Delete',
        'min': 'min',
      }
    };
    
    return translations[language][key] || key;
  };

  // 🚀 Cek dan minta izin notifikasi
  useEffect(() => {
    const checkNotificationPermission = () => {
      if (!("Notification" in window)) {
        setNotificationPermission("unsupported");
        return;
      }

      const permission = Notification.permission;
      setNotificationPermission(permission);
      setNotificationEnabled(permission === "granted");

      if (permission === "default") {
        Notification.requestPermission().then((newPermission) => {
          setNotificationPermission(newPermission);
          setNotificationEnabled(newPermission === "granted");
        });
      }
    };

    checkNotificationPermission();
  }, []);

  // 🕒 Real-time Clock (WIB)
  useEffect(() => {
    const updateTime = () => {
      const timeString = dateUtils.getTimeInWIB();
      setCurrentTime(timeString);
    };

    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // 🏙️ Ambil daftar kota dengan caching
  const fetchCities = useCallback(async () => {
    try {
      // Cek cache dari utility
      const cachedCities = storageUtils.getCachedCities();
      if (cachedCities) {
        setCities(cachedCities);
        return;
      }

      const data = await prayerAPI.fetchCities();
      const citiesData = data.data || [];

      setCities(citiesData);
      // Simpan ke cache
      storageUtils.cacheCities(citiesData);
    } catch (err) {
      console.error("Error fetching cities:", err);
      setError("Gagal memuat daftar kota. Coba refresh halaman.");
    }
  }, []);

  // 📖 Ambil doa acak
  const fetchRandomDua = useCallback(async () => {
    try {
      setLoadingDua(true);
      const data = await prayerAPI.fetchRandomDua();

      if (data.status && data.data) {
        setRandomDua(data.data);
      }
    } catch (err) {
      console.error("Error fetching random dua:", err);
      // Tidak set error karena fitur doa adalah tambahan
    } finally {
      setLoadingDua(false);
    }
  }, []);

  // 🔍 Pencarian kota dengan debounce
  const handleSearch = useCallback(
    (value) => {
      if (!value.trim()) {
        setFilteredCities([]);
        setShowCityList(false);
        return;
      }

      const filtered = cities.filter((city) =>
        city.lokasi.toLowerCase().includes(value.toLowerCase())
      );
      setFilteredCities(filtered);
      setShowCityList(true);
      setCityName(value);
    },
    [cities]
  );

  // 🔹 Ambil jadwal hari ini dengan error handling yang lebih baik
  const fetchTodaySchedule = useCallback(
    async (cityId, cityName) => {
      try {
        setLoading(true);
        setError(null);

        const today = new Date();
        const year = today.getFullYear();
        const month = String(today.getMonth() + 1).padStart(2, "0");
        const day = String(today.getDate()).padStart(2, "0");

        const data = await prayerAPI.fetchPrayerSchedule(cityId, year, month, day);

        if (!data.status || !data.data) {
          throw new Error(data.message || "Jadwal tidak ditemukan");
        }

        const jadwal = data.data.jadwal;
        setSchedule(jadwal);
        setSelectedCity(cityId);
        setCityName(cityName);

        // Simpan pilihan terakhir user
        storageUtils.setLastSelectedCity({
          id: cityId,
          name: cityName,
        });

        determineNextPrayer(jadwal);

        if (notificationEnabled) {
          setupPrayerNotifications(jadwal, cityName);
        }


      } catch (err) {
        console.error("Error fetching schedule:", err);
        setError(err.message || "Gagal memuat jadwal shalat. Coba lagi.");
      } finally {
        setLoading(false);
        setShowCityList(false);
      }
    },
    [notificationEnabled]
  );



  const setupPrayerNotifications = useCallback(async (jadwal, cityName) => {
    if (!("Notification" in window) || Notification.permission !== "granted") return;

    // Hapus notifikasi lama
    const timeouts = JSON.parse(localStorage.getItem("prayerTimeouts") || "[]");
    timeouts.forEach((t) => clearTimeout(t));
    localStorage.setItem("prayerTimeouts", "[]");

    const newTimeouts = [];

    for (const { key, name, emoji } of PRAYER_TIMES) {
      const time = jadwal[key];
      if (!time) continue;

      const [hours, minutes] = time.split(":").map(Number);
      const prayerTime = new Date();
      prayerTime.setHours(hours, minutes, 0, 0);

      const triggerNotification = (title, body, tag) => {
        navigator.serviceWorker.ready.then((reg) => {
          reg.showNotification(title, {
            body,
            icon: "/favicon.ico",
            tag,
            renotify: true,
          });
        });
      };

      // Setup configurable time before notifications
      for (const minutesBefore of notificationSettings.timeBefore) {
        const notifyTime = new Date(prayerTime.getTime() - minutesBefore * 60 * 1000);
        const delay = notifyTime - new Date();

        if (delay > 0) {
          const id = setTimeout(() => {
            triggerNotification(
              `🕌 ${name} Akan Tiba`,
              `${emoji} Waktu ${name} di ${cityName} ${minutesBefore} menit lagi (${time})`,
              `prayer-${key}-${minutesBefore}min`
            );
          }, delay);
          newTimeouts.push(id);
        }
      }

      // Saat waktu shalat
      const delay0 = prayerTime - new Date();
      if (delay0 > 0) {
        const id = setTimeout(() => {
          triggerNotification(
            `🕌 Waktu ${name}`,
            `${emoji} Sudah masuk waktu ${name} di ${cityName}`,
            `prayer-${key}-now`
          );
        }, delay0);
        newTimeouts.push(id);
      }
    }

    localStorage.setItem("prayerTimeouts", JSON.stringify(newTimeouts));
  }, [notificationSettings]);


  // 🕋 Tentukan shalat berikutnya
  const determineNextPrayer = useCallback((jadwal) => {
    const now = new Date();
    let foundNextPrayer = null;

    for (const prayer of PRAYER_TIMES) {
      const time = jadwal[prayer.key];
      if (!time) continue;

      const [hours, minutes] = time.split(":").map(Number);
      const prayerTime = new Date();
      prayerTime.setHours(hours, minutes, 0, 0);

      if (now < prayerTime) {
        foundNextPrayer = { ...prayer, time };
        break;
      }
    }

    // Jika tidak ada shalat berikutnya hari ini, set ke subuh besok
    if (!foundNextPrayer) {
      foundNextPrayer = { ...PRAYER_TIMES[1], time: jadwal.subuh };
    }

    setNextPrayer(foundNextPrayer);
  }, []);

  // 🕰️ Hitung mundur real-time
  useEffect(() => {
    if (!nextPrayer || !schedule) return;

    const updateCountdown = () => {
      const now = new Date();
      const [hours, minutes] = nextPrayer.time.split(":").map(Number);
      const targetTime = new Date();
      targetTime.setHours(hours, minutes, 0, 0);

      // Jika next prayer adalah subuh besok
      if (now > targetTime) {
        targetTime.setDate(targetTime.getDate() + 1);
      }

      const diff = targetTime - now;

      if (diff <= 0) {
        setCountdown("Sudah masuk waktu shalat");
        // Refresh next prayer
        determineNextPrayer(schedule);
        return;
      }

      const hoursRemaining = Math.floor(diff / (1000 * 60 * 60));
      const minutesRemaining = Math.floor(
        (diff % (1000 * 60 * 60)) / (1000 * 60)
      );
      const secondsRemaining = Math.floor((diff % (1000 * 60)) / 1000);

      setCountdown(
        `${hoursRemaining.toString().padStart(2, "0")}:${minutesRemaining
          .toString()
          .padStart(2, "0")}:${secondsRemaining.toString().padStart(2, "0")}`
      );
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, [nextPrayer, schedule, determineNextPrayer]);

  // 📱 Load last selected city dan doa acak on mount
  useEffect(() => {
    fetchCities();
    fetchRandomDua();

    const lastSelectedCity = storageUtils.getLastSelectedCity();
    if (lastSelectedCity) {
      fetchTodaySchedule(lastSelectedCity.id, lastSelectedCity.name);
    }
  }, [fetchCities, fetchTodaySchedule, fetchRandomDua]);

  // Toggle notifikasi
  const toggleNotifications = useCallback(async () => {
    if (!("Notification" in window)) return;

    if (Notification.permission === "denied") {
      setError(
        "Izin notifikasi ditolak. Harap aktifkan di pengaturan browser."
      );
      return;
    }

    if (Notification.permission === "default") {
      const permission = await Notification.requestPermission();
      setNotificationPermission(permission);
      setNotificationEnabled(permission === "granted");
      return;
    }

    setNotificationEnabled(!notificationEnabled);
  }, [notificationEnabled]);

  // Update notification settings
  const updateNotificationSettings = useCallback((settings) => {
    setNotificationSettings(settings);
    localStorage.setItem('notificationSettings', JSON.stringify(settings));
  }, []);

  // Format prayer times untuk display
  const prayerTimesDisplay = useMemo(() => {
    if (!schedule) return [];

    return PRAYER_TIMES.map((prayer) => ({
      ...prayer,
      time: schedule[prayer.key],
    }));
  }, [schedule]);





  return (
    <main className="min-h-screen flex flex-col items-center bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-slate-900 dark:via-blue-900 dark:to-indigo-900 p-4">
      {/* Header with theme toggle and settings */}
      <div className="w-full max-w-md mb-4 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <h1 className="text-xl font-semibold text-slate-800 dark:text-slate-200">
            {t(activeTab === 'prayer' ? 'Jadwal Shalat' : 'Al-Quran')}
          </h1>
        </div>
        
        <div className="flex items-center gap-2">
          {/* Settings Button */}
          <button
            onClick={() => setShowSettings(!showSettings)}
            className="p-2 bg-white/60 dark:bg-slate-800/60 rounded-xl text-slate-700 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-700 transition-all"
          >
            <Settings size={20} />
          </button>
          
          {/* Theme Toggle */}
          <button
            onClick={toggleTheme}
            className="p-2 bg-white/60 dark:bg-slate-800/60 rounded-xl text-slate-700 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-700 transition-all"
          >
            {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
          </button>
          
          {/* Main Menu Toggle */}
          <button
            onClick={() => setShowMenu(!showMenu)}
            className="p-2 bg-white/60 dark:bg-slate-800/60 rounded-xl text-slate-700 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-700 transition-all"
          >
            {showMenu ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>
      
      {/* Settings Panel */}
      {showSettings && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-2xl shadow-sm p-4 border border-white/60 dark:border-slate-700/60 mb-4"
        >
          <h3 className="font-semibold text-slate-800 dark:text-slate-200 mb-3">{t('Settings')}</h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-slate-700 dark:text-slate-300">{t('Language')}</span>
              <select 
                value={language}
                onChange={(e) => {
                  setLanguage(e.target.value);
                  localStorage.setItem('language', e.target.value);
                }}
                className="bg-white/50 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600 rounded-lg px-2 py-1 text-slate-700 dark:text-slate-300"
              >
                <option value="id">{t('Indonesian')}</option>
                <option value="en">{t('English')}</option>
              </select>
            </div>
            
            <div className="flex justify-between items-center">
              <span className="text-slate-700 dark:text-slate-300">{t('Theme')}</span>
              <button
                onClick={toggleTheme}
                className={`w-12 h-6 rounded-full p-1 transition-colors ${theme === 'dark' ? 'bg-indigo-500' : 'bg-slate-300'}`}
              >
                <div className={`bg-white w-4 h-4 rounded-full transition-transform ${theme === 'dark' ? 'translate-x-6' : 'translate-x-0'}`}></div>
              </button>
            </div>
            
            <div className="flex justify-between items-center">
              <span className="text-slate-700 dark:text-slate-300">{t('Size')}</span>
              <select 
                value={fontSize}
                onChange={(e) => setFontSize(e.target.value)}
                className="bg-white/50 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600 rounded-lg px-2 py-1 text-slate-700 dark:text-slate-300"
              >
                <option value="small">{t('Small')}</option>
                <option value="medium">{t('Medium')}</option>
                <option value="large">{t('Large')}</option>
              </select>
            </div>
            
            <div className="flex justify-between items-center">
              <span className="text-slate-700 dark:text-slate-300">{t('Prayer Notifications')}</span>
              <div className="flex gap-2">
                <input
                  type="number"
                  min="1"
                  max="60"
                  value={notificationSettings.timeBefore[0]}
                  onChange={(e) => {
                    const newTimes = [...notificationSettings.timeBefore];
                    newTimes[0] = parseInt(e.target.value) || 5;
                    updateNotificationSettings({...notificationSettings, timeBefore: newTimes});
                  }}
                  className="w-16 bg-white/50 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600 rounded-lg px-2 py-1 text-slate-700 dark:text-slate-300 text-center"
                  placeholder="5"
                />
                <span className="text-slate-500 dark:text-slate-500">{t('min')}</span>
                <input
                  type="number"
                  min="1"
                  max="60"
                  value={notificationSettings.timeBefore[1]}
                  onChange={(e) => {
                    const newTimes = [...notificationSettings.timeBefore];
                    newTimes[1] = parseInt(e.target.value) || 15;
                    updateNotificationSettings({...notificationSettings, timeBefore: newTimes});
                  }}
                  className="w-16 bg-white/50 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600 rounded-lg px-2 py-1 text-slate-700 dark:text-slate-300 text-center"
                  placeholder="15"
                />
                <span className="text-slate-500 dark:text-slate-500">{t('min')}</span>
              </div>
            </div>
          </div>
        </motion.div>
      )}
      
      {/* Menu for switching between features */}
      {showMenu && (
        <div className="w-full max-w-md bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-2xl shadow-sm p-4 border border-white/60 dark:border-slate-700/60 mb-4">
          <div className="flex space-x-2">
            <button
              onClick={() => {
                setActiveTab('prayer');
                setShowMenu(false);
              }}
              className={`flex-1 py-2 px-3 rounded-xl text-center transition-all ${
                activeTab === 'prayer'
                  ? 'bg-gradient-to-r from-blue-500 to-indigo-500 text-white shadow-lg'
                  : 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600'
              }`}
            >
              <Clock size={20} className="mx-auto mb-1" />
              <span className="text-xs">Jadwal Shalat</span>
            </button>
            <button
              onClick={() => {
                setActiveTab('quran');
                setShowMenu(false);
              }}
              className={`flex-1 py-2 px-3 rounded-xl text-center transition-all ${
                activeTab === 'quran'
                  ? 'bg-gradient-to-r from-emerald-500 to-green-500 text-white shadow-lg'
                  : 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600'
              }`}
            >
              <BookText size={20} className="mx-auto mb-1" />
              <span className="text-xs">Al-Quran</span>
            </button>
          </div>
        </div>
      )}
      
      {/* Quran Tab Content */}
      {activeTab === 'quran' && (
        <motion.div
          key="quran"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="w-full max-w-md space-y-4"
        >

          
          <QuranBrowser 
              recentReadings={recentReadings} 
              bookmarkedSurahs={bookmarkedSurahs}
              toggleBookmark={toggleBookmark}
              isBookmarked={isBookmarked}
              saveRecentReading={saveRecentReading}
              removeRecentReading={removeRecentReading}
              confirmDeleteRecent={confirmDeleteRecent}
              showDeleteConfirmation={showDeleteConfirmation}
            />
        </motion.div>
      )}
      
      {/* Prayer Schedule Tab Content */}
      {activeTab === 'prayer' && (
        <motion.div
          key="prayer"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="w-full max-w-md bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-3xl shadow-sm p-6 space-y-6 border border-white/60 dark:border-slate-700/60"
        >
          {/* Header */}
          <div className="flex flex-col items-center text-center">
            <div className="relative">
              <div className="bg-gradient-to-br from-blue-200 to-purple-200 dark:from-blue-700 dark:to-purple-700 p-4 rounded-2xl shadow-lg">
                <Clock className="text-slate-700 dark:text-slate-200" size={40} />
              </div>
              {notificationEnabled && (
                <div className="absolute -top-1 -right-1 bg-green-100 dark:bg-green-800 rounded-full p-1 shadow-sm">
                  <Bell className="text-green-600 dark:text-green-300" size={14} />
                </div>
              )}
            </div>
            <h1 className="text-2xl font-semibold text-slate-800 dark:text-slate-200 mt-3 mb-1">
              {t('Prayer Schedule')}
            </h1>
            <p className="text-slate-600 dark:text-slate-400 flex items-center gap-2 text-sm">
              <span>🕒</span>
              {currentTime} WIB
            </p>
          </div>

          {/* City Search */}
          <div className="relative">
            <div className="relative">
              <Search
                className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 dark:text-slate-500"
                size={20}
              />
              <input
                type="text"
                placeholder="Cari kota (contoh: Jakarta, Bandung, Surabaya...)"
                value={cityName}
                onChange={(e) => {
                  setCityName(e.target.value);
                  handleSearch(e.target.value);
                }}
                onFocus={() => {
                  if (cityName && filteredCities.length > 0) {
                    setShowCityList(true);
                  }
                }}
                className="w-full pl-10 pr-4 py-3 bg-white/50 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600 rounded-2xl focus:ring-2 focus:ring-blue-200 dark:focus:ring-blue-600 focus:border-blue-300 dark:focus:border-blue-500 transition-all placeholder-slate-400 dark:placeholder-slate-500 text-slate-700 dark:text-slate-300"
              />
            </div>

            <AnimatePresence>
              {showCityList && filteredCities.length > 0 && (
                <motion.ul
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="absolute z-10 bg-white/95 dark:bg-slate-800/95 backdrop-blur-sm border border-slate-200 dark:border-slate-600 rounded-2xl mt-2 w-full max-h-64 overflow-y-auto shadow-lg"
                >
                  {filteredCities.slice(0, 10).map((city) => (
                    <li
                      key={city.id}
                      className="p-3 hover:bg-blue-50/50 dark:hover:bg-slate-700/50 cursor-pointer border-b border-slate-100 dark:border-slate-700 last:border-b-0 transition-colors"
                      onClick={() => {
                        fetchTodaySchedule(city.id, city.lokasi);
                        setShowMenu(false); // Close menu after selection
                      }}
                    >
                      <div className="flex items-center gap-2">
                        <MapPin size={16} className="text-blue-400 dark:text-blue-500" />
                        <span className="text-slate-700 dark:text-slate-300">{city.lokasi}</span>
                      </div>
                    </li>
                  ))}
                </motion.ul>
              )}
            </AnimatePresence>
          </div>

          {/* Notification Toggle */}
          <div className="flex items-center justify-between bg-slate-100/50 dark:bg-slate-700/50 rounded-2xl p-3 border border-slate-200/50 dark:border-slate-600/50">
            <span className="text-sm text-slate-700 dark:text-slate-300">{t('Prayer Notifications')}</span>
            <button
              onClick={toggleNotifications}
              className={`p-2 rounded-xl transition-all ${notificationEnabled
                ? "bg-gradient-to-r from-green-400 to-emerald-500 text-white shadow-inner"
                : "bg-slate-200 dark:bg-slate-600 text-slate-400 dark:text-slate-500"
                }`}
            >
              {notificationEnabled ? <Bell size={18} /> : <BellOff size={18} />}
            </button>
          </div>

          {/* Loading & Error States */}
          {loading && (
            <Loading message="Memuat jadwal shalat..." />
          )}

          {error && (
            <ErrorComponent 
              message={error} 
              onRetry={fetchCities}
              retryText="Muat Ulang"
            />
          )}

          {/* Prayer Schedule */}
          {schedule && !loading && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="space-y-4"
            >
              {/* City & Date Header */}
              <div className="text-center">
                <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-200 flex items-center justify-center gap-2">
                  <div className="bg-blue-100 dark:bg-blue-900/50 rounded-full p-2">
                    <MapPin size={16} className="text-blue-600 dark:text-blue-400" />
                  </div>
                  {cityName}
                </h2>
                <p className="text-slate-600 dark:text-slate-400 text-sm mt-1">{schedule.tanggal}</p>
              </div>

              {/* Next Prayer Countdown */}
              {nextPrayer && (
                <motion.div
                  initial={{ scale: 0.9 }}
                  animate={{ scale: 1 }}
                  className="bg-gradient-to-br from-blue-500/10 to-purple-500/10 dark:from-blue-700/20 dark:to-purple-700/20 border border-blue-200/50 dark:border-blue-700/50 rounded-2xl p-4 text-slate-800 dark:text-slate-200 text-center backdrop-blur-sm"
                >
                  <p className="font-medium text-slate-600 dark:text-slate-400 text-sm">
                    {t('Next Prayer')}
                  </p>
                  <p className="text-xl font-semibold my-2">
                    {nextPrayer.emoji} {t(nextPrayer.name)}
                  </p>
                  <p className="text-lg font-semibold text-slate-800 dark:text-slate-200">
                    {nextPrayer.time}
                  </p>
                  <p className="text-slate-600 dark:text-slate-400 text-sm mt-2 font-mono bg-white/50 dark:bg-slate-700/50 rounded-lg py-1">
                    {countdown}
                  </p>
                </motion.div>
              )}

              {/* Prayer Times Table */}
              <div className="bg-slate-100/30 dark:bg-slate-700/30 rounded-2xl p-4 border border-slate-200/50 dark:border-slate-600/50 backdrop-blur-sm">
                <h3 className="font-semibold text-slate-700 dark:text-slate-300 mb-3 text-center text-sm">
                  {t('Prayer Schedule of the Day')}
                </h3>
                <div className="space-y-3">
                  {prayerTimesDisplay.map((prayer, index) => (
                    <motion.div
                      key={prayer.key}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.1 * index }}
                      className={`flex items-center justify-between p-3 rounded-xl transition-all cursor-pointer ${nextPrayer?.key === prayer.key
                        ? "bg-gradient-to-r from-blue-500/10 to-purple-500/10 dark:from-blue-700/20 dark:to-purple-700/20 border border-blue-200/50 dark:border-blue-700/50 shadow-sm"
                        : "bg-white/50 dark:bg-slate-700/50 border border-slate-200/50 dark:border-slate-600/50 hover:bg-slate-50/50 dark:hover:bg-slate-600/50"
                        }`}
                      onClick={() => {
                        // When user clicks on a prayer time, set it as the next prayer
                        setNextPrayer({...prayer, time: prayer.time});
                      }}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${prayer.gradientClass}`}>
                          <span className="text-white text-sm">{prayer.emoji}</span>
                        </div>
                        <span
                          className={`font-medium ${nextPrayer?.key === prayer.key
                            ? "text-slate-800 dark:text-slate-200"
                            : "text-slate-700 dark:text-slate-300"
                            }`}
                        >
                          {t(prayer.name)}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span
                          className={`font-mono font-semibold ${nextPrayer?.key === prayer.key
                            ? "text-slate-800 dark:text-slate-200"
                            : "text-slate-600 dark:text-slate-400"
                            }`}
                        >
                          {prayer.time}
                        </span>
                        {nextPrayer?.key === prayer.key && (
                          <motion.div
                            animate={{ scale: [1, 1.2, 1] }}
                            transition={{ repeat: Infinity, duration: 1.5 }}
                            className="w-2 h-2 bg-green-500 rounded-full"
                          ></motion.div>
                        )}
                      </div>
                    </motion.div>
                  ))}
                </div>
                
                {/* Additional Prayer Info */}
                <div className="mt-4 pt-4 border-t border-slate-200/30 dark:border-slate-600/30">
                  <div className="flex flex-wrap justify-between text-xs text-slate-500 dark:text-slate-500">
                    <span>{t('Total Prayers')}: {prayerTimesDisplay.length}</span>
                    <span>{t('Nearest Mosque')}: <a href={`https://www.google.com/maps/search/masjid+near+${cityName}`} target="_blank" rel="noopener noreferrer" className="text-blue-500 dark:text-blue-400 hover:underline">{t('Find')}</a></span>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* Random Dua Card (Improved Smooth Version) */}
          <motion.div
            initial={{ opacity: 0, y: 30, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{
              type: "spring",
              stiffness: 60,
              damping: 15,
              delay: 0.3,
            }}
            whileHover={{
              scale: 1.02,
              boxShadow: "0 6px 25px rgba(16,185,129,0.25)",
            }}
            className="bg-gradient-to-br from-emerald-50 to-teal-100 dark:from-emerald-900/30 dark:to-teal-900/30 rounded-2xl p-5 border border-emerald-200/50 dark:border-emerald-700/50 shadow-sm hover:shadow-md backdrop-blur-sm transition-all duration-300"
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="bg-emerald-100 dark:bg-emerald-900/50 rounded-full p-2 shadow-inner">
                  <BookOpen size={18} className="text-emerald-600 dark:text-emerald-400" />
                </div>
                <h3 className="font-semibold text-emerald-800 dark:text-emerald-200 text-sm sm:text-base tracking-wide">
                  {t('Daily Dua')}
                </h3>
              </div>

              <button
                onClick={fetchRandomDua}
                disabled={loadingDua}
                className="p-2 bg-white/60 dark:bg-slate-700/60 rounded-xl text-emerald-700 dark:text-emerald-400 hover:bg-white dark:hover:bg-slate-600 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <RefreshCw
                  size={16}
                  className={`${loadingDua ? "animate-spin text-emerald-500 dark:text-emerald-400" : "text-emerald-600 dark:text-emerald-400"}`}
                />
              </button>
            </div>

            {/* Content */}
            {loadingDua ? (
              <Loading message="Memuat doa..." size="sm" type="spinner" />
            ) : randomDua ? (
              <AnimatePresence mode="wait">
                <motion.div
                  key={randomDua.judul}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -15 }}
                  transition={{ duration: 0.4, ease: "easeOut" }}
                  className="space-y-4"
                >
                  {/* Judul */}
                  <div className="text-center">
                    <h4 className="font-semibold text-emerald-900 dark:text-emerald-100 text-lg sm:text-xl">
                      {randomDua.judul}
                    </h4>
                    <p className="text-emerald-600 dark:text-emerald-400 text-xs sm:text-sm mt-1 italic">
                      ({randomDua.source})
                    </p>
                  </div>

                  {/* Arabic */}
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="bg-white/70 dark:bg-slate-700/70 rounded-xl p-4 border border-emerald-200/30 dark:border-emerald-700/30 shadow-inner"
                  >
                    <p
                      className="text-emerald-900 dark:text-emerald-100 text-right text-2xl leading-[3] font-amiri"
                      style={{
                        fontFamily: "'Amiri', 'Scheherazade New', 'Lateef', serif",
                        lineHeight: "2.8",
                        letterSpacing: "0.02em",
                      }}
                      dir="rtl"
                      lang="ar"
                    >
                      {randomDua.arab}
                    </p>
                  </motion.div>

                  {/* Indonesian Translation */}
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.3 }}
                    className="text-center space-y-2"
                  >
                    <p className="text-emerald-700 dark:text-emerald-300 text-sm leading-relaxed">
                      {randomDua.indo}
                    </p>
                  </motion.div>
                </motion.div>
              </AnimatePresence>
            ) : (
              <div className="text-center py-5 text-emerald-600 dark:text-emerald-400 text-sm italic">
                {t('Refresh')} {t('Daily Dua')}
              </div>
            )}
          </motion.div>


          {/* Empty State */}
          {!schedule && !loading && !error && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-8 text-slate-500"
            >
              <div className="bg-slate-100/50 rounded-2xl p-4 inline-block mb-3">
                <MapPin size={32} className="text-slate-400 mx-auto" />
              </div>
              <p className="text-slate-600">
                Pilih kota untuk melihat jadwal shalat
              </p>
            </motion.div>
          )}
        </motion.div>
      )}

      {/* Footer */}
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1 }}
        className="text-slate-500 dark:text-slate-400 text-sm mt-6 text-center w-full max-w-md"
      >
        {activeTab === 'prayer' ? (
          <>
            Data jadwal shalat dari{" "}
            <a
              href="https://myquran.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-orange-500 dark:text-orange-400 hover:text-orange-600 dark:hover:text-orange-500 transition-colors"
            >
              myQuran.com Created by R M Irsyad Taufik
            </a>
          </>
        ) : (
          <>
            Al-Quran data dari{" "}
            <a
              href="https://myquran.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-orange-500 dark:text-orange-400 hover:text-orange-600 dark:hover:text-orange-500 transition-colors"
            >
              myQuran.com
            </a>
          </>
        )}
      </motion.p>
      
      {/* Delete Confirmation Modal */}
      {showDeleteConfirmation && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-800 rounded-xl p-6 max-w-md w-full border border-slate-200 dark:border-slate-700 shadow-xl">
            <h3 className="font-semibold text-slate-800 dark:text-slate-200 mb-3">
              {t('Confirm Delete', language)}
            </h3>
            <p className="text-slate-600 dark:text-slate-400 mb-6">
              {t('Are you sure you want to remove', language)} "{showDeleteConfirmation.surahName}" {t('from recent readings?', language)}
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowDeleteConfirmation(null)}
                className="px-4 py-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
              >
                {t('Cancel', language)}
              </button>
              <button
                onClick={() => removeRecentReading(showDeleteConfirmation.surahNumber)}
                className="px-4 py-2 bg-red-500 text-white hover:bg-red-600 rounded-lg transition-colors"
              >
                {t('Delete', language)}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

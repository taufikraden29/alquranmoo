import { useEffect, useState, useCallback, useMemo } from "react";
import { createClient } from "@supabase/supabase-js";
import { motion, AnimatePresence } from "framer-motion";
import {
  Clock,
  Search,
  MapPin,
  Bell,
  BellOff,
  RefreshCw,
  BookOpen,
} from "lucide-react";

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);

// Konstanta untuk prayer times
const PRAYER_TIMES = [
  {
    key: "imsak",
    name: "Imsak",
    emoji: "🌅",
    color: "from-purple-100 to-blue-100",
  },
  {
    key: "subuh",
    name: "Subuh",
    emoji: "🌄",
    color: "from-blue-100 to-cyan-100",
  },
  {
    key: "dzuhur",
    name: "Dzuhur",
    emoji: "☀️",
    color: "from-amber-100 to-orange-100",
  },
  {
    key: "ashar",
    name: "Ashar",
    emoji: "⛅",
    color: "from-orange-100 to-red-100",
  },
  {
    key: "maghrib",
    name: "Maghrib",
    emoji: "🌇",
    color: "from-red-100 to-purple-100",
  },
  {
    key: "isya",
    name: "Isya",
    emoji: "🌙",
    color: "from-indigo-100 to-purple-100",
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
      const now = new Date();
      const timeString = now.toLocaleTimeString("id-ID", {
        timeZone: "Asia/Jakarta",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      });
      setCurrentTime(timeString);
    };

    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // 🏙️ Ambil daftar kota dengan caching
  const fetchCities = useCallback(async () => {
    try {
      // Cek cache local storage dulu
      const cachedCities = localStorage.getItem("cachedCities");
      const cacheTime = localStorage.getItem("citiesCacheTime");

      if (
        cachedCities &&
        cacheTime &&
        Date.now() - parseInt(cacheTime) < 24 * 60 * 60 * 1000
      ) {
        setCities(JSON.parse(cachedCities));
        return;
      }

      const response = await fetch(
        "https://api.myquran.com/v2/sholat/kota/semua"
      );
      if (!response.ok) throw new Error("Gagal mengambil data kota");

      const data = await response.json();
      const citiesData = data.data || [];

      setCities(citiesData);
      // Simpan ke cache
      localStorage.setItem("cachedCities", JSON.stringify(citiesData));
      localStorage.setItem("citiesCacheTime", Date.now().toString());
    } catch (err) {
      console.error("Error fetching cities:", err);
      setError("Gagal memuat daftar kota. Coba refresh halaman.");
    }
  }, []);

  // 📖 Ambil doa acak
  const fetchRandomDua = useCallback(async () => {
    try {
      setLoadingDua(true);
      const response = await fetch("https://api.myquran.com/v2/doa/acak");

      if (!response.ok) throw new Error("Gagal mengambil doa acak");

      const data = await response.json();

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

        const response = await fetch(
          `https://api.myquran.com/v2/sholat/jadwal/${cityId}/${year}/${month}/${day}`
        );

        if (!response.ok) throw new Error("Network response was not ok");

        const data = await response.json();

        if (!data.status || !data.data) {
          throw new Error(data.message || "Jadwal tidak ditemukan");
        }

        const jadwal = data.data.jadwal;
        setSchedule(jadwal);
        setSelectedCity(cityId);
        setCityName(cityName);

        // Simpan pilihan terakhir user
        localStorage.setItem(
          "lastSelectedCity",
          JSON.stringify({
            id: cityId,
            name: cityName,
          })
        );

        determineNextPrayer(jadwal);

        if (notificationEnabled) {
          setupPrayerNotifications(jadwal, cityName);
        }

        await cacheToSupabase(jadwal, cityId, cityName);
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

  // 💾 Cache jadwal ke Supabase
  const cacheToSupabase = async (jadwal, cityId, cityName) => {
    try {
      const { error } = await supabase.from("prayer_schedules").upsert({
        city_id: cityId,
        city_name: cityName,
        date: jadwal.tanggal,
        imsak: jadwal.imsak,
        subuh: jadwal.subuh,
        dzuhur: jadwal.dzuhur,
        ashar: jadwal.ashar,
        maghrib: jadwal.maghrib,
        isya: jadwal.isya,
        updated_at: new Date().toISOString(),
      });

      if (error) throw error;
    } catch (err) {
      console.error("Supabase cache error:", err);
    }
  };

  // 🔔 Setup notifikasi shalat
  const setupPrayerNotifications = useCallback((jadwal, cityName) => {
    if (!("Notification" in window) || Notification.permission !== "granted") {
      return;
    }

    // Clear existing notifications
    const existingTimeouts = JSON.parse(
      localStorage.getItem("prayerTimeouts") || "[]"
    );
    existingTimeouts.forEach((timeoutId) => clearTimeout(timeoutId));
    localStorage.setItem("prayerTimeouts", "[]");

    const newTimeouts = [];

    PRAYER_TIMES.forEach(({ key, name, emoji }) => {
      const time = jadwal[key];
      if (!time) return;

      const [hours, minutes] = time.split(":").map(Number);
      const prayerTime = new Date();
      prayerTime.setHours(hours, minutes, 0, 0);

      // Notifikasi 10 menit sebelum
      const notifyTime10 = new Date(prayerTime.getTime() - 10 * 60 * 1000);
      const delay10 = notifyTime10 - new Date();

      if (delay10 > 0) {
        const timeoutId = setTimeout(() => {
          new Notification(`🕌 ${name} Akan Tiba`, {
            body: `Waktu ${name} di ${cityName} 10 menit lagi (${time})`,
            icon: "/favicon.ico",
            tag: `prayer-${key}-10min`,
          });
        }, delay10);
        newTimeouts.push(timeoutId);
      }

      // Notifikasi saat waktu shalat
      const delay0 = prayerTime - new Date();
      if (delay0 > 0) {
        const timeoutId = setTimeout(() => {
          new Notification(`🕌 Waktu ${name}`, {
            body: `Sudah masuk waktu ${name} di ${cityName}`,
            icon: "/favicon.ico",
            tag: `prayer-${key}-now`,
          });
        }, delay0);
        newTimeouts.push(timeoutId);
      }
    });

    localStorage.setItem("prayerTimeouts", JSON.stringify(newTimeouts));
  }, []);

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

    const lastSelectedCity = localStorage.getItem("lastSelectedCity");
    if (lastSelectedCity) {
      try {
        const city = JSON.parse(lastSelectedCity);
        fetchTodaySchedule(city.id, city.name);
      } catch (err) {
        console.error("Error loading last selected city:", err);
      }
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

  // Format prayer times untuk display
  const prayerTimesDisplay = useMemo(() => {
    if (!schedule) return [];

    return PRAYER_TIMES.map((prayer) => ({
      ...prayer,
      time: schedule[prayer.key],
    }));
  }, [schedule]);

  return (
    <main className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="w-full max-w-md bg-white/80 backdrop-blur-sm rounded-3xl shadow-sm p-6 space-y-6 border border-white/60"
      >
        {/* Header */}
        <div className="flex flex-col items-center text-center">
          <div className="relative">
            <div className="bg-gradient-to-br from-blue-200 to-purple-200 p-3 rounded-2xl shadow-inner">
              <Clock className="text-slate-700" size={40} />
            </div>
            {notificationEnabled && (
              <div className="absolute -top-1 -right-1 bg-green-100 rounded-full p-1 shadow-sm">
                <Bell className="text-green-600" size={14} />
              </div>
            )}
          </div>
          <h1 className="text-2xl font-semibold text-slate-800 mt-3 mb-1">
            Jadwal Shalat
          </h1>
          <p className="text-slate-600 flex items-center gap-2 text-sm">
            <span>🕒</span>
            {currentTime} WIB
          </p>
        </div>

        {/* City Search */}
        <div className="relative">
          <div className="relative">
            <Search
              className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400"
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
              className="w-full pl-10 pr-4 py-3 bg-white/50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-200 focus:border-blue-300 transition-all placeholder-slate-400 text-slate-700"
            />
          </div>

          <AnimatePresence>
            {showCityList && filteredCities.length > 0 && (
              <motion.ul
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="absolute z-10 bg-white/95 backdrop-blur-sm border border-slate-200 rounded-2xl mt-2 w-full max-h-64 overflow-y-auto shadow-lg"
              >
                {filteredCities.slice(0, 10).map((city) => (
                  <li
                    key={city.id}
                    className="p-3 hover:bg-blue-50/50 cursor-pointer border-b border-slate-100 last:border-b-0 transition-colors"
                    onClick={() => {
                      fetchTodaySchedule(city.id, city.lokasi);
                    }}
                  >
                    <div className="flex items-center gap-2">
                      <MapPin size={16} className="text-blue-400" />
                      <span className="text-slate-700">{city.lokasi}</span>
                    </div>
                  </li>
                ))}
              </motion.ul>
            )}
          </AnimatePresence>
        </div>

        {/* Notification Toggle */}
        <div className="flex items-center justify-between bg-slate-100/50 rounded-2xl p-3 border border-slate-200/50">
          <span className="text-sm text-slate-700">Notifikasi Shalat</span>
          <button
            onClick={toggleNotifications}
            className={`p-2 rounded-xl transition-all ${
              notificationEnabled
                ? "bg-green-100 text-green-600 shadow-inner"
                : "bg-slate-200 text-slate-400"
            }`}
          >
            {notificationEnabled ? <Bell size={18} /> : <BellOff size={18} />}
          </button>
        </div>

        {/* Loading & Error States */}
        {loading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-4"
          >
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-400"></div>
            <p className="text-slate-600 mt-2 text-sm">
              Memuat jadwal shalat...
            </p>
          </motion.div>
        )}

        {error && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="bg-red-50/80 border border-red-200 rounded-2xl p-4 text-center backdrop-blur-sm"
          >
            <p className="text-red-600 text-sm">{error}</p>
          </motion.div>
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
              <h2 className="text-lg font-semibold text-slate-800 flex items-center justify-center gap-2">
                <div className="bg-blue-100 rounded-full p-2">
                  <MapPin size={16} className="text-blue-600" />
                </div>
                {cityName}
              </h2>
              <p className="text-slate-600 text-sm mt-1">{schedule.tanggal}</p>
            </div>

            {/* Next Prayer Countdown */}
            {nextPrayer && (
              <motion.div
                initial={{ scale: 0.9 }}
                animate={{ scale: 1 }}
                className="bg-gradient-to-br from-blue-500/10 to-purple-500/10 border border-blue-200/50 rounded-2xl p-4 text-slate-800 text-center backdrop-blur-sm"
              >
                <p className="font-medium text-slate-600 text-sm">
                  Shalat Berikutnya
                </p>
                <p className="text-xl font-semibold my-2">
                  {nextPrayer.emoji} {nextPrayer.name}
                </p>
                <p className="text-lg font-semibold text-slate-800">
                  {nextPrayer.time}
                </p>
                <p className="text-slate-600 text-sm mt-2 font-mono bg-white/50 rounded-lg py-1">
                  {countdown}
                </p>
              </motion.div>
            )}

            {/* Prayer Times Table */}
            <div className="bg-slate-100/30 rounded-2xl p-4 border border-slate-200/50 backdrop-blur-sm">
              <h3 className="font-semibold text-slate-700 mb-3 text-center text-sm">
                Jadwal Shalat Hari Ini
              </h3>
              <div className="space-y-3">
                {prayerTimesDisplay.map((prayer, index) => (
                  <motion.div
                    key={prayer.key}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.1 * index }}
                    className={`flex items-center justify-between p-3 rounded-xl transition-all ${
                      nextPrayer?.key === prayer.key
                        ? "bg-gradient-to-r from-blue-500/10 to-purple-500/10 border border-blue-200/50 shadow-sm"
                        : "bg-white/50 border border-slate-200/50"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-lg">{prayer.emoji}</span>
                      <span
                        className={`font-medium ${
                          nextPrayer?.key === prayer.key
                            ? "text-slate-800"
                            : "text-slate-700"
                        }`}
                      >
                        {prayer.name}
                      </span>
                    </div>
                    <span
                      className={`font-mono font-semibold ${
                        nextPrayer?.key === prayer.key
                          ? "text-slate-800"
                          : "text-slate-600"
                      }`}
                    >
                      {prayer.time}
                    </span>
                  </motion.div>
                ))}
              </div>
            </div>
          </motion.div>
        )}

        {/* Random Dua Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-gradient-to-br from-emerald-50 to-teal-100 rounded-2xl p-4 border border-emerald-200/50 backdrop-blur-sm"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="bg-emerald-100 rounded-full p-2">
                <BookOpen size={16} className="text-emerald-600" />
              </div>
              <h3 className="font-semibold text-emerald-800 text-sm">
                Doa Harian
              </h3>
            </div>
            <button
              onClick={fetchRandomDua}
              disabled={loadingDua}
              className="p-2 bg-white/50 rounded-xl text-emerald-600 hover:bg-white transition-all disabled:opacity-50"
            >
              <RefreshCw
                size={16}
                className={loadingDua ? "animate-spin" : ""}
              />
            </button>
          </div>

          {loadingDua ? (
            <div className="text-center py-4">
              <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-emerald-400"></div>
              <p className="text-emerald-600 text-sm mt-2">Memuat doa...</p>
            </div>
          ) : randomDua ? (
            <div className="space-y-3">
              <div className="text-center">
                <h4 className="font-semibold text-emerald-900 text-lg">
                  {randomDua.judul}
                </h4>
                <p className="text-emerald-700 text-sm mt-1">
                  ({randomDua.source})
                </p>
              </div>

              {/* <div className="bg-white/50 rounded-xl p-3">
                <p className="text-emerald-900 text-right text-2xl leading-loose font-amiri">
                  {randomDua.arab}
                </p>
              </div> */}
              <div className="bg-white/60 rounded-xl p-4 border border-emerald-200/30">
                <p
                  className="text-emerald-900 text-right text-2xl leading-[3] font-amiri"
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
              </div>

              <div className="space-y-2">
                {/* <p className="text-emerald-800 text-sm italic">
                  "{randomDua.latin}"
                </p> */}
                <p className="text-emerald-700 text-sm">{randomDua.indo}</p>
              </div>
            </div>
          ) : (
            <div className="text-center py-4 text-emerald-600 text-sm">
              Klik refresh untuk memuat doa
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

      {/* Footer */}
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1 }}
        className="text-slate-500 text-sm mt-6 text-center"
      >
        Data jadwal shalat dari{" "}
        <a
          href="https://myquran.com"
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-500 hover:text-blue-600 transition-colors"
        >
          myQuran.com Created by R M Irsyad Taufik
        </a>
      </motion.p>
    </main>
  );
}

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@supabase/supabase-js";
import Loader from "./components/Loader";
import PrayerCard from "./components/PrayerCard";

// Inisialisasi Supabase
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

export default function App() {
  const [cities, setCities] = useState([]);
  const [filteredCities, setFilteredCities] = useState([]);
  const [search, setSearch] = useState("");
  const [selectedCity, setSelectedCity] = useState(null);
  const [schedule, setSchedule] = useState(null);
  const [weeklySchedule, setWeeklySchedule] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // 🚀 Minta izin notifikasi sekali saat load
  useEffect(() => {
    if ("Notification" in window) {
      Notification.requestPermission().catch(() => {});
    }
  }, []);

  // 🔹 Ambil daftar kota dari API MyQuran
  const fetchCities = useCallback(async () => {
    try {
      const res = await fetch("https://api.myquran.com/v2/sholat/kota/semua");
      const data = await res.json();

      if (data.status && data.data) {
        setCities(data.data);
        setFilteredCities(data.data);
      } else {
        throw new Error("Data kota tidak ditemukan di server.");
      }
    } catch (err) {
      console.error("Fetch cities error:", err);
      setError("Gagal memuat daftar kota. Periksa koneksi internet.");
    }
  }, []);

  // 🔎 Pencarian kota
  const handleSearch = (value) => {
    setSearch(value);
    if (!value) return setFilteredCities(cities);

    const filtered = cities.filter((city) =>
      city.lokasi.toLowerCase().includes(value.toLowerCase())
    );
    setFilteredCities(filtered);
  };

  // 🔹 Ambil jadwal 7 hari ke depan (fix harian)
  const fetchWeeklySchedule = useCallback(
    async (cityId) => {
      if (!cityId) return;

      try {
        setLoading(true);
        setError(null);

        const today = new Date();
        const year = today.getFullYear();
        const month = String(today.getMonth() + 1).padStart(2, "0");

        const next7Days = [];

        // 🔁 Ambil jadwal 7 hari ke depan (per hari)
        for (let i = 0; i < 7; i++) {
          const d = new Date();
          d.setDate(today.getDate() + i);

          const day = String(d.getDate()).padStart(2, "0");
          const url = `https://api.myquran.com/v2/sholat/jadwal/${cityId}/${year}/${month}/${day}`;
          console.log("📡 Fetching:", url);

          const res = await fetch(url);
          const data = await res.json();

          if (data.status && data.data?.jadwal) {
            next7Days.push(data.data.jadwal);
          } else {
            console.warn(
              `⚠️ Gagal ambil data untuk ${day}/${month}/${year}`,
              data
            );
          }

          // Delay kecil agar tidak dianggap spam oleh API
          await new Promise((resolve) => setTimeout(resolve, 300));
        }

        if (!next7Days.length)
          throw new Error("Tidak ada jadwal ditemukan dari API.");

        setWeeklySchedule(next7Days);
        setSchedule(next7Days[0]);

        await saveWeeklyToSupabase(next7Days, cityId);
        setupPrayerNotifications(next7Days[0]); // 🔔 Set notifikasi
      } catch (err) {
        console.error("❌ Fetch jadwal error:", err);
        setError("Terjadi kesalahan saat mengambil jadwal dari API.");
      } finally {
        setLoading(false);
      }
    },
    [cities]
  );

  // 🔹 Simpan jadwal ke Supabase
  const saveWeeklyToSupabase = async (list, cityId) => {
    const cityName = cities.find((c) => c.id === cityId)?.lokasi || "unknown";
    const records = list.map((jadwal) => ({
      kota: cityName,
      tanggal: jadwal.tanggal,
      imsak: jadwal.imsak,
      subuh: jadwal.subuh,
      dzuhur: jadwal.dzuhur,
      ashar: jadwal.ashar,
      maghrib: jadwal.maghrib,
      isya: jadwal.isya,
      created_at: new Date().toISOString(),
    }));

    const { error } = await supabase.from("jadwal_shalat").upsert(records);
    if (error) console.error("Supabase error:", error);
  };

  // 🔔 Atur notifikasi shalat
  const setupPrayerNotifications = (todaySchedule) => {
    if (!("Notification" in window)) return;
    if (Notification.permission !== "granted") return;

    const times = [
      { name: "Imsak", time: todaySchedule.imsak },
      { name: "Subuh", time: todaySchedule.subuh },
      { name: "Dzuhur", time: todaySchedule.dzuhur },
      { name: "Ashar", time: todaySchedule.ashar },
      { name: "Maghrib", time: todaySchedule.maghrib },
      { name: "Isya", time: todaySchedule.isya },
    ];

    times.forEach(({ name, time }) => {
      const [hour, minute] = time.split(":").map(Number);
      const prayerTime = new Date();
      prayerTime.setHours(hour);
      prayerTime.setMinutes(minute - 5);
      prayerTime.setSeconds(0);

      const delay = prayerTime - new Date();
      if (delay > 0) {
        setTimeout(() => {
          new Notification("🕌 Pengingat Shalat", {
            body: `Waktu ${name} akan tiba dalam 5 menit.`,
            icon: "/favicon.ico",
          });
        }, delay);
      }
    });
  };

  useEffect(() => {
    fetchCities();
  }, [fetchCities]);

  useEffect(() => {
    if (selectedCity) fetchWeeklySchedule(selectedCity);
  }, [selectedCity, fetchWeeklySchedule]);

  // ================== UI ==================
  return (
    <main className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-blue-50 to-blue-100 p-6">
      <div className="w-full max-w-3xl space-y-5 relative">
        <h1 className="text-3xl font-bold text-center text-blue-600 mb-4">
          🕌 Jadwal Shalat + Notifikasi
        </h1>

        {/* Input Search Kota */}
        <div className="relative">
          <input
            type="text"
            placeholder="Cari kota (misal: Jakarta)"
            value={search}
            onChange={(e) => handleSearch(e.target.value)}
            className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-400"
          />
          {search && filteredCities.length > 0 && (
            <ul className="absolute z-10 bg-white border border-gray-200 rounded-lg mt-1 w-full max-h-56 overflow-y-auto shadow-md">
              {filteredCities.map((city) => (
                <li
                  key={city.id}
                  className="p-2 hover:bg-blue-100 cursor-pointer"
                  onClick={() => {
                    setSelectedCity(city.id);
                    setSearch(city.lokasi);
                    setFilteredCities([]);
                  }}
                >
                  {city.lokasi}
                </li>
              ))}
            </ul>
          )}
        </div>

        {loading && <Loader />}
        {error && <p className="text-red-500 text-center">{error}</p>}
        {schedule && <PrayerCard schedule={schedule} />}

        {weeklySchedule.length > 0 && (
          <div className="overflow-x-auto mt-8">
            <h2 className="text-xl font-semibold mb-2 text-center">
              Jadwal 7 Hari ke Depan
            </h2>
            <table className="min-w-full bg-white rounded-2xl shadow-md overflow-hidden">
              <thead className="bg-blue-600 text-white">
                <tr>
                  <th className="p-2">Tanggal</th>
                  <th className="p-2">Imsak</th>
                  <th className="p-2">Subuh</th>
                  <th className="p-2">Dzuhur</th>
                  <th className="p-2">Ashar</th>
                  <th className="p-2">Maghrib</th>
                  <th className="p-2">Isya</th>
                </tr>
              </thead>
              <tbody>
                {weeklySchedule.map((j) => (
                  <tr
                    key={j.tanggal}
                    className="text-center border-b hover:bg-blue-50 transition"
                  >
                    <td className="p-2">{j.tanggal}</td>
                    <td className="p-2">{j.imsak}</td>
                    <td className="p-2">{j.subuh}</td>
                    <td className="p-2">{j.dzuhur}</td>
                    <td className="p-2">{j.ashar}</td>
                    <td className="p-2">{j.maghrib}</td>
                    <td className="p-2">{j.isya}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </main>
  );
}

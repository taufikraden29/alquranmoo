import { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight, Search, BookOpen, Search as SearchIcon } from "lucide-react";

const QuranNavigator = ({ onSurahChange, onAyahChange, surahData, currentSurah, currentAyah }) => {
  const [surahNumber, setSurahNumber] = useState(currentSurah || 1);
  const [ayahNumber, setAyahNumber] = useState(currentAyah || 1);
  const [showSurahList, setShowSurahList] = useState(false);
  const [showAyahList, setShowAyahList] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [ayahSearch, setAyahSearch] = useState('');
  const [activeSearch, setActiveSearch] = useState('surah'); // 'surah' or 'ayah'

  // List of Surahs with names and translations
  const surahList = [
    { number: 1, name: "Al-Fatihah", translation: "The Opening" },
    { number: 2, name: "Al-Baqarah", translation: "The Cow" },
    { number: 3, name: "Ali 'Imran", translation: "Family of Imran" },
    { number: 4, name: "An-Nisa", translation: "The Women" },
    { number: 5, name: "Al-Ma'idah", translation: "The Table Spread" },
    { number: 6, name: "Al-An'am", translation: "The Cattle" },
    { number: 7, name: "Al-A'raf", translation: "The Heights" },
    { number: 8, name: "Al-Anfal", translation: "The Spoils of War" },
    { number: 9, name: "At-Tawbah", translation: "The Repentance" },
    { number: 10, name: "Yunus", translation: "Jonah" },
    { number: 11, name: "Hud", translation: "Hud" },
    { number: 12, name: "Yusuf", translation: "Joseph" },
    { number: 13, name: "Ar-Ra'd", translation: "The Thunder" },
    { number: 14, name: "Ibrahim", translation: "Abraham" },
    { number: 15, name: "Al-Hijr", translation: "The Rocky Tract" },
    { number: 16, name: "An-Nahl", translation: "The Bee" },
    { number: 17, name: "Al-Isra", translation: "The Night Journey" },
    { number: 18, name: "Al-Kahf", translation: "The Cave" },
    { number: 19, name: "Maryam", translation: "Mary" },
    { number: 20, name: "Ta-Ha", translation: "Ta-Ha" },
    { number: 21, name: "Al-Anbiya", translation: "The Prophets" },
    { number: 22, name: "Al-Hajj", translation: "The Pilgrimage" },
    { number: 23, name: "Al-Mu'minun", translation: "The Believers" },
    { number: 24, name: "An-Nur", translation: "The Light" },
    { number: 25, name: "Al-Furqan", translation: "The Criterion" },
    { number: 26, name: "Ash-Shu'ara", translation: "The Poets" },
    { number: 27, name: "An-Naml", translation: "The Ant" },
    { number: 28, name: "Al-Qasas", translation: "The Stories" },
    { number: 29, name: "Al-'Ankabut", translation: "The Spider" },
    { number: 30, name: "Ar-Rum", translation: "The Romans" },
    { number: 31, name: "Luqman", translation: "Luqman" },
    { number: 32, name: "As-Sajdah", translation: "The Prostration" },
    { number: 33, name: "Al-Ahzab", translation: "The Combined Forces" },
    { number: 34, name: "Saba", translation: "Sheba" },
    { number: 35, name: "Fatir", translation: "Originator" },
    { number: 36, name: "Ya-Sin", translation: "Ya Sin" },
    { number: 37, name: "As-Saffat", translation: "Those who set the Ranks" },
    { number: 38, name: "Sad", translation: "The Letter Sad" },
    { number: 39, name: "Az-Zumar", translation: "The Groups" },
    { number: 40, name: "Ghafir", translation: "The Forgiver" },
    { number: 41, name: "Fussilat", translation: "Explained in Detail" },
    { number: 42, name: "Ash-Shuraa", translation: "The Consultation" },
    { number: 43, name: "Az-Zukhruf", translation: "The Ornaments of Gold" },
    { number: 44, name: "Ad-Dukhan", translation: "The Smoke" },
    { number: 45, name: "Al-Jathiyah", translation: "The Crouching" },
    { number: 46, name: "Al-Ahqaf", translation: "The Wind-Curved Sandhills" },
    { number: 47, name: "Muhammad", translation: "Muhammad" },
    { number: 48, name: "Al-Fath", translation: "The Victory" },
    { number: 49, name: "Al-Hujurat", translation: "The Rooms" },
    { number: 50, name: "Qaf", translation: "The Letter Qaf" },
    { number: 51, name: "Adh-Dhariyat", translation: "The Winnowing Winds" },
    { number: 52, name: "At-Tur", translation: "The Mount" },
    { number: 53, name: "An-Najm", translation: "The Star" },
    { number: 54, name: "Al-Qamar", translation: "The Moon" },
    { number: 55, name: "Ar-Rahman", translation: "The Beneficent" },
    { number: 56, name: "Al-Waqi'ah", translation: "The Inevitable" },
    { number: 57, name: "Al-Hadid", translation: "The Iron" },
    { number: 58, name: "Al-Mujadila", translation: "The Pleading Woman" },
    { number: 59, name: "Al-Hashr", translation: "The Exile" },
    { number: 60, name: "Al-Mumtahanah", translation: "She that is to be examined" },
    { number: 61, name: "As-Saff", translation: "The Ranks" },
    { number: 62, name: "Al-Jumu'ah", translation: "The Congregation" },
    { number: 63, name: "Al-Munafiqun", translation: "The Hypocrites" },
    { number: 64, name: "At-Taghabun", translation: "The Mutual Disappointment" },
    { number: 65, name: "At-Talaq", translation: "The Divorce" },
    { number: 66, name: "At-Tahrim", translation: "The Prohibition" },
    { number: 67, name: "Al-Mulk", translation: "The Sovereignty" },
    { number: 68, name: "Al-Qalam", translation: "The Pen" },
    { number: 69, name: "Al-Haqqah", translation: "The Reality" },
    { number: 70, name: "Al-Ma'arij", translation: "The Ascending Stairways" },
    { number: 71, name: "Nuh", translation: "Noah" },
    { number: 72, name: "Al-Jinn", translation: "The Jinn" },
    { number: 73, name: "Al-Muzzammil", translation: "The One wrapped in Garments" },
    { number: 74, name: "Al-Muddaththir", translation: "The One Enveloped" },
    { number: 75, name: "Al-Qiyamah", translation: "The Resurrection" },
    { number: 76, name: "Al-Insan", translation: "The Man" },
    { number: 77, name: "Al-Mursalat", translation: "The Emissaries" },
    { number: 78, name: "An-Naba", translation: "The Tidings" },
    { number: 79, name: "An-Nazi'at", translation: "Those who Pull Out" },
    { number: 80, name: "'Abasa", translation: "He Frowned" },
    { number: 81, name: "At-Takwir", translation: "The Overthrowing" },
    { number: 82, name: "Al-Infitar", translation: "The Cleaving" },
    { number: 83, name: "Al-Mutaffifin", translation: "The Defrauding" },
    { number: 84, name: "Al-Inshiqaq", translation: "The Sundering" },
    { number: 85, name: "Al-Buruj", translation: "The Constellations" },
    { number: 86, name: "At-Tariq", translation: "The Nightcomer" },
    { number: 87, name: "Al-A'la", translation: "The Most High" },
    { number: 88, name: "Al-Ghashiyah", translation: "The Overwhelming" },
    { number: 89, name: "Al-Fajr", translation: "The Dawn" },
    { number: 90, name: "Al-Balad", translation: "The City" },
    { number: 91, name: "Ash-Shams", translation: "The Sun" },
    { number: 92, name: "Al-Layl", translation: "The Night" },
    { number: 93, name: "Ad-Duhaa", translation: "The Morning Hours" },
    { number: 94, name: "Ash-Sharh", translation: "The Relief" },
    { number: 95, name: "At-Tin", translation: "The Fig" },
    { number: 96, name: "Al-'Alaq", translation: "The Clot" },
    { number: 97, name: "Al-Qadr", translation: "The Power" },
    { number: 98, name: "Al-Bayyinah", translation: "The Clear Proof" },
    { number: 99, name: "Az-Zalzalah", translation: "The Earthquake" },
    { number: 100, name: "Al-'Adiyat", translation: "The Courser" },
    { number: 101, name: "Al-Qari'ah", translation: "The Calamity" },
    { number: 102, name: "At-Takathur", translation: "The Rivalry in worldly increase" },
    { number: 103, name: "Al-'Asr", translation: "The Declining Day" },
    { number: 104, name: "Al-Humazah", translation: "The Gossip-monger" },
    { number: 105, name: "Al-Fil", translation: "The Elephant" },
    { number: 106, name: "Quraysh", translation: "Quraysh" },
    { number: 107, name: "Al-Ma'un", translation: "The Small kindness" },
    { number: 108, name: "Al-Kawthar", translation: "The Abundance" },
    { number: 109, name: "Al-Kafirun", translation: "The Disbelievers" },
    { number: 110, name: "An-Nasr", translation: "The Divine Support" },
    { number: 111, name: "Al-Masad", translation: "The Palm Fiber" },
    { number: 112, name: "Al-Ikhlas", translation: "The Sincerity" },
    { number: 113, name: "Al-Falaq", translation: "The Daybreak" },
    { number: 114, name: "An-Nas", translation: "Mankind" }
  ];

  const filteredSurahs = surahList.filter(surah => 
    surah.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    surah.translation.toLowerCase().includes(searchTerm.toLowerCase()) ||
    surah.number.toString().includes(searchTerm)
  );

  // Get ayahs if surah data is available
  const ayahList = surahData?.ayat && typeof surahData.ayat === 'object' ? 
    Object.keys(surahData.ayat).map(key => ({
      number: parseInt(key),
      text: surahData.ayat[key].arab || surahData.ayat[key].teks || surahData.ayat[key].text || ''
    })) : 
    (surahData?.ayat && Array.isArray(surahData.ayat) ? 
      surahData.ayat.map(ayat => ({
        number: ayat.nomor_ayat || ayat.number || ayat.ayat,
        text: ayat.arab || ayat.teks || ayat.text || ''
      })) :
      (surahData && Array.isArray(surahData) ? 
        surahData.map(ayat => ({
          number: ayat.nomor_ayat || ayat.number || ayat.ayat,
          text: ayat.arab || ayat.teks || ayat.text || ''
        })) : 
        (surahData?.verses && Array.isArray(surahData.verses) ? 
          surahData.verses.map(v => ({
            number: v.nomor_ayat || v.nomor || v.verse_number || parseInt(v.verse_key?.split(':')[1]),
            text: v.arab || v.teks || v.text || ''
          })) : [])));

  const filteredAyahs = ayahList.filter(ayah => 
    ayah.number.toString().includes(ayahSearch) || 
    ayah.text.toLowerCase().includes(ayahSearch.toLowerCase())
  );

  const handleSurahChange = (surahNum) => {
    setSurahNumber(surahNum);
    onSurahChange(surahNum);
    setShowSurahList(false);
    setAyahNumber(1); // Reset to first ayah when changing surah
    onAyahChange(1);
    setSearchTerm(''); // Clear search term after selection
  };

  const handleAyahChange = (ayahNum) => {
    const maxAyah = surahData 
      ? (surahData.verses && Array.isArray(surahData.verses)
          ? surahData.verses.length 
          : (surahData.ayat && Array.isArray(surahData.ayat)
              ? surahData.ayat.length
              : (surahData.ayat && typeof surahData.ayat === 'object'
                  ? Object.keys(surahData.ayat).length
                  : (Array.isArray(surahData)
                      ? surahData.length
                      : 0)))) 
      : 0;
    
    if (surahData && ayahNum > 0 && ayahNum <= maxAyah) {
      setAyahNumber(ayahNum);
      onAyahChange(ayahNum);
    }
  };

  const handlePrevAyah = () => {
    if (ayahNumber > 1) {
      handleAyahChange(ayahNumber - 1);
    }
  };

  const handleNextAyah = () => {
    const maxAyah = surahData 
      ? (surahData.verses && Array.isArray(surahData.verses)
          ? surahData.verses.length 
          : (surahData.ayat && Array.isArray(surahData.ayat)
              ? surahData.ayat.length
              : (surahData.ayat && typeof surahData.ayat === 'object'
                  ? Object.keys(surahData.ayat).length
                  : (Array.isArray(surahData)
                      ? surahData.length
                      : 0)))) 
      : 0;
    
    if (maxAyah && ayahNumber < maxAyah) {
      handleAyahChange(ayahNumber + 1);
    }
  };

  const handlePrevSurah = () => {
    if (surahNumber > 1) {
      handleSurahChange(surahNumber - 1);
    }
  };

  const handleNextSurah = () => {
    if (surahNumber < 114) {
      handleSurahChange(surahNumber + 1);
    }
  };

  return (
    <div className="w-full bg-white/80 backdrop-blur-sm rounded-2xl shadow-sm p-4 border border-white/60 mb-4">
      <div className="flex flex-col md:flex-row gap-4 items-center">
        {/* Surah and Ayah Search Tabs */}
        <div className="flex border border-slate-200 rounded-xl overflow-hidden w-full md:w-auto">
          <button
            className={`px-4 py-2 text-sm font-medium ${
              activeSearch === 'surah' 
                ? 'bg-blue-500 text-white' 
                : 'bg-white text-slate-700 hover:bg-slate-50'
            }`}
            onClick={() => setActiveSearch('surah')}
          >
            Surah
          </button>
          <button
            className={`px-4 py-2 text-sm font-medium ${
              activeSearch === 'ayah' 
                ? 'bg-blue-500 text-white' 
                : 'bg-white text-slate-700 hover:bg-slate-50'
            }`}
            onClick={() => setActiveSearch('ayah')}
          >
            Ayat
          </button>
        </div>

        {/* Search Input - Conditional based on active search */}
        {activeSearch === 'surah' ? (
          <div className="relative w-full md:w-auto">
            <div className="relative">
              <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" size={18} />
              <input
                type="text"
                placeholder="Cari Surah..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onFocus={() => setShowSurahList(true)}
                className="w-full pl-10 pr-4 py-2 bg-white/50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-200 focus:border-blue-300 transition-all placeholder-slate-400 text-slate-700"
              />
            </div>

            {showSurahList && filteredSurahs.length > 0 && (
              <div className="absolute z-20 bg-white/95 backdrop-blur-sm border border-slate-200 rounded-xl mt-2 w-full max-h-64 overflow-y-auto shadow-lg">
                {filteredSurahs.map((surah) => (
                  <div
                    key={surah.number}
                    className={`p-3 hover:bg-blue-50/50 cursor-pointer border-b border-slate-100 last:border-b-0 transition-colors ${surahNumber === surah.number ? 'bg-blue-100/70' : ''}`}
                    onClick={() => {
                      handleSurahChange(surah.number);
                      setShowSurahList(false);
                    }}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-slate-700 font-medium">#{surah.number} {surah.name}</span>
                      <span className="text-slate-500 text-sm">{surah.translation}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="relative w-full md:w-auto">
            <div className="relative">
              <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" size={18} />
              <input
                type="text"
                placeholder="Cari Ayat..."
                value={ayahSearch}
                onChange={(e) => setAyahSearch(e.target.value)}
                onFocus={() => setShowAyahList(true)}
                className="w-full pl-10 pr-4 py-2 bg-white/50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-200 focus:border-blue-300 transition-all placeholder-slate-400 text-slate-700"
              />
            </div>

            {showAyahList && filteredAyahs.length > 0 && (
              <div className="absolute z-20 bg-white/95 backdrop-blur-sm border border-slate-200 rounded-xl mt-2 w-full max-h-64 overflow-y-auto shadow-lg">
                {filteredAyahs.map((ayah) => (
                  <div
                    key={ayah.number}
                    className={`p-3 hover:bg-indigo-50/50 cursor-pointer border-b border-slate-100 last:border-b-0 transition-colors ${ayahNumber === ayah.number ? 'bg-indigo-100/70' : ''}`}
                    onClick={() => {
                      handleAyahChange(ayah.number);
                      setAyahSearch('');
                      setShowAyahList(false);
                    }}
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <span className="text-slate-700 font-medium">Ayat {ayah.number}</span>
                        <p className="text-slate-500 text-sm mt-1 line-clamp-2">{ayah.text.substring(0, 60)}{ayah.text.length > 60 ? '...' : ''}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Navigation Controls */}
        <div className="flex items-center gap-2 w-full md:w-auto">
          <button 
            onClick={handlePrevSurah}
            disabled={surahNumber <= 1}
            className="p-2 bg-blue-100 text-blue-600 rounded-xl hover:bg-blue-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronLeft size={18} />
          </button>
          
          <div className="flex items-center gap-1">
            <input
              type="number"
              min="1"
              max="114"
              value={surahNumber}
              onChange={(e) => {
                const num = parseInt(e.target.value);
                if (num >= 1 && num <= 114) {
                  handleSurahChange(num);
                }
              }}
              className="w-16 text-center py-2 bg-white/50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-200 focus:border-blue-300 transition-all text-slate-700"
            />
            <span className="text-slate-500">/</span>
            <span className="px-2 py-2 bg-slate-100 rounded-xl text-slate-700">114</span>
          </div>

          <button 
            onClick={handleNextSurah}
            disabled={surahNumber >= 114}
            className="p-2 bg-blue-100 text-blue-600 rounded-xl hover:bg-blue-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronRight size={18} />
          </button>
        </div>

        {/* Ayah Navigation */}
        <div className="flex items-center gap-2 w-full md:w-auto">
          <button 
            onClick={handlePrevAyah}
            disabled={surahData && ayahNumber <= 1}
            className="p-2 bg-purple-100 text-purple-600 rounded-xl hover:bg-purple-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronLeft size={18} />
          </button>
          
          <div className="flex items-center gap-1">
            <input
              type="number"
              min="1"
              max={surahData 
                ? (surahData.verses && Array.isArray(surahData.verses)
                    ? surahData.verses.length 
                    : (surahData.ayat && Array.isArray(surahData.ayat)
                        ? surahData.ayat.length
                        : (surahData.ayat && typeof surahData.ayat === 'object'
                            ? Object.keys(surahData.ayat).length
                            : (Array.isArray(surahData)
                                ? surahData.length
                                : 1)))) 
                : 1}
              value={ayahNumber}
              onChange={(e) => {
                const num = parseInt(e.target.value);
                const maxAyah = surahData?.verses?.length || Object.keys(surahData?.ayat || {}).length || 1;
                if (surahData && num >= 1 && num <= maxAyah) {
                  handleAyahChange(num);
                }
              }}
              className="w-16 text-center py-2 bg-white/50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-200 focus:border-blue-300 transition-all text-slate-700"
            />
            <span className="text-slate-500">/</span>
            <span className="px-2 py-2 bg-slate-100 rounded-xl text-slate-700">
              {surahData 
                ? (surahData.verses && Array.isArray(surahData.verses)
                    ? surahData.verses.length 
                    : (surahData.ayat && Array.isArray(surahData.ayat)
                        ? surahData.ayat.length
                        : (surahData.ayat && typeof surahData.ayat === 'object'
                            ? Object.keys(surahData.ayat).length
                            : (Array.isArray(surahData)
                                ? surahData.length
                                : '?')))) 
                : '?'}
            </span>
          </div>

          <button 
            onClick={handleNextAyah}
            disabled={!surahData || ayahNumber >= (surahData.verses && Array.isArray(surahData.verses)
                    ? surahData.verses.length 
                    : (surahData.ayat && Array.isArray(surahData.ayat)
                        ? surahData.ayat.length
                        : (surahData.ayat && typeof surahData.ayat === 'object'
                            ? Object.keys(surahData.ayat).length
                            : (Array.isArray(surahData)
                                ? surahData.length
                                : 0))))}
            className="p-2 bg-purple-100 text-purple-600 rounded-xl hover:bg-purple-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronRight size={18} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default QuranNavigator;
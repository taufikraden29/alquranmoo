import { useState, useEffect } from "react";
import { BookText, Search, Shuffle } from "lucide-react";
import { quranAPI } from "../utils/api";

// Translation function
const t = (key, lang = 'id') => {
  const translations = {
    id: {
      'Surah': 'Surah',
      'Juz': 'Juz',
      'Search and Navigation': 'Pencarian dan Navigasi',
      'Search Surah, Juz, or Verse': 'Cari Surah, Juz, atau Ayat',
      'Search': 'Cari',
      'Random': 'Acak',
      'Total Ayat': 'Total Ayat',
      'Type': 'Tipe',
      'Ayat': 'Ayat',
      'Start from Surah': 'Mulai dari Surah',
      'End at Surah': 'Sampai Surah',
      'Recent Readings': 'Bacaan Terbaru',
      'Bookmarks': 'Penanda',
      'No Bookmarks Yet': 'Belum Ada Penanda',
      'Start reading and bookmark your favorite surahs': 'Mulai membaca dan tandai surah favorit Anda',
      'Bookmarked Surahs': 'Surah yang Ditandai',
      'Bookmarked Verses': 'Ayat yang Ditandai',
      'Start reading and bookmark your favorite surahs or verses': 'Mulai membaca dan tandai surah atau ayat favorit Anda',
    },
    en: {
      'Surah': 'Surah',
      'Juz': 'Juz',
      'Search and Navigation': 'Search and Navigation',
      'Search Surah, Juz, or Verse': 'Search Surah, Juz, or Verse',
      'Search': 'Search',
      'Random': 'Random',
      'Total Ayat': 'Total Verses',
      'Type': 'Type',
      'Ayat': 'Verse',
      'Start from Surah': 'Start from Surah',
      'End at Surah': 'End at Surah',
      'Recent Readings': 'Recent Readings',
      'Bookmarks': 'Bookmarks',
      'No Bookmarks Yet': 'No Bookmarks Yet',
      'Start reading and bookmark your favorite surahs': 'Start reading and bookmark your favorite surahs',
      'Bookmarked Surahs': 'Bookmarked Surahs',
      'Bookmarked Verses': 'Bookmarked Verses',
      'Start reading and bookmark your favorite surahs or verses': 'Start reading and bookmark your favorite surahs or verses',
    }
  };
  
  return translations[lang][key] || key;
};

const QuranBrowser = ({ 
  recentReadings = [], 
  bookmarkedSurahs = new Set(), 
  toggleBookmark, 
  isBookmarked, 
  saveRecentReading,
  removeRecentReading,
  confirmDeleteRecent,
  showDeleteConfirmation
}) => {
  const [surahs, setSurahs] = useState([]);
  const [quranData, setQuranData] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSurah, setSelectedSurah] = useState(null);
  const [selectedJuz, setSelectedJuz] = useState(null);
  const [activeTab, setActiveTab] = useState('surah'); // 'surah', 'juz', 'ayah', or 'bookmarks'
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [ayatBookmarkData, setAyatBookmarkData] = useState([]);
  const [loadingAyatBookmarks, setLoadingAyatBookmarks] = useState(false);
  
  // Fetch ayat bookmark data
  useEffect(() => {
    if (!bookmarkedSurahs || !surahs.length) return;
    
    // Convert set of bookmarks to array and filter for ayat bookmarks
    const ayatBookmarks = Array.from(bookmarkedSurahs).filter(bm => 
      typeof bm === 'string' && bm.includes(':')
    ).map(bm => {
      const [surahNum, verseNum] = bm.split(':');
      return { surahNumber: parseInt(surahNum), verseNumber: parseInt(verseNum) };
    });
    
    if (ayatBookmarks.length > 0) {
      setLoadingAyatBookmarks(true);
      const fetchAyatBookmarks = async () => {
        const results = [];
        
        for (const bookmark of ayatBookmarks) {
          try {
            const response = await quranAPI.fetchSurah(bookmark.surahNumber);
            const surahData = response.data;
            const verse = surahData.verses.find(v => 
              (v.number?.inSurah || v.number) === bookmark.verseNumber
            );
            
            if (verse) {
              results.push({
                ...verse,
                surahNumber: bookmark.surahNumber,
                surahName: surahData.name?.long || surahData.name || 'N/A',
                surahTransliteration: surahData.name?.transliteration?.en || surahData.transliteration?.en || 'N/A',
                bookmarkKey: `${bookmark.surahNumber}:${bookmark.verseNumber}`
              });
            }
          } catch (err) {
            console.error(`Error fetching ayat ${bookmark.surahNumber}:${bookmark.verseNumber}`, err);
          }
        }
        
        setAyatBookmarkData(results);
        setLoadingAyatBookmarks(false);
      };
      
      fetchAyatBookmarks();
    } else {
      setAyatBookmarkData([]);
      setLoadingAyatBookmarks(false);
    }
  }, [bookmarkedSurahs, surahs]);
  const [language, setLanguage] = useState('id');

  // Get language from localStorage
  useEffect(() => {
    const savedLanguage = localStorage.getItem('language') || 'id';
    setLanguage(savedLanguage);
  }, []);

  // Fetch all surahs on component mount and set default view
  useEffect(() => {
    const loadInitialData = async () => {
      try {
        setLoading(true);
        const data = await quranAPI.fetchAllSurahs();
        setSurahs(data.data);
        // Set initial view to show all surahs
        setQuranData({ surahs: data.data });
      } catch (err) {
        setError(err.message);
        console.error('Error fetching surahs:', err);
      } finally {
        setLoading(false);
      }
    };
    
    loadInitialData();
  }, []);

  const fetchAllSurahs = async () => {
    try {
      setLoading(true);
      const data = await quranAPI.fetchAllSurahs();
      setSurahs(data.data);
    } catch (err) {
      setError(err.message);
      console.error('Error fetching surahs:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSurahSelect = async (surahNumber) => {
    try {
      setLoading(true);
      setError(null);
      const data = await quranAPI.fetchSurah(surahNumber);
      const surahData = data.data;
      setQuranData(surahData);
      setSelectedSurah(surahNumber);
      setActiveTab('surah');
      
      // Save to recent readings if the function is provided
      if (saveRecentReading && surahData) {
        saveRecentReading({
          number: surahData.number || surahNumber,
          name: surahData.name?.long || surahData.name || 'N/A',
          transliteration: surahData.name?.transliteration?.en || surahData.transliteration?.en || 'N/A',
          translation: surahData.name?.translation?.en || surahData.translation?.en || 'N/A',
          versesCount: surahData.numberOfVerses || surahData.numberOfAyah || 0,
          revelation: surahData.revelation?.en || surahData.revelation || 'N/A',
          timestamp: new Date().toISOString()
        });
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleJuzSelect = async (juzNumber) => {
    try {
      setLoading(true);
      setError(null);
      const data = await quranAPI.fetchJuz(juzNumber);
      // The API response for juz endpoint should contain the juz data
      setQuranData(data.data || data);
      setSelectedJuz(juzNumber);
      setActiveTab('juz');
    } catch (err) {
      setError(err.message);
      console.error('Error fetching juz:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleRandomAyah = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await quranAPI.fetchRandomAyah();
      setQuranData(data.data);
      setActiveTab('ayah');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async () => {
    if (!searchTerm.trim()) return;
    
    try {
      setLoading(true);
      setError(null);
      
      // Try to parse as number to determine if it's a surah or juz number
      const num = parseInt(searchTerm);
      if (!isNaN(num)) {
        if (num >= 1 && num <= 114) {
          // Could be surah number
          const data = await quranAPI.fetchSurah(num);
          setQuranData(data.data);
          setSelectedSurah(num);
          setActiveTab('surah');
        } else if (num >= 1 && num <= 30) {
          // Could be juz number
          const data = await quranAPI.fetchJuz(num);
          setQuranData(data.data);
          setSelectedJuz(num);
          setActiveTab('juz');
        } else {
          setError('Nomor tidak valid. Masukkan nomor surah (1-114) atau juz (1-30).');
        }
      } else {
        // Text search for surah name
        const data = await quranAPI.searchSurah(searchTerm);
        setQuranData({ surahs: data.data });
        setActiveTab('surah');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const displayData = () => {
    if (!quranData) {
      return (
        <div className="text-center py-8 text-slate-500 dark:text-slate-400">
          <BookText size={48} className="mx-auto mb-4 text-slate-300 dark:text-slate-600" />
          <p>Pilih {t('Surah', language)}, {t('Juz', language)}, atau ayat untuk mulai membaca Al-Quran</p>
        </div>
      );
    }

    // If it's a juz object (has list of surahs and ayahs)
    if (quranData.surah && Array.isArray(quranData.surah)) {
      return (
        <div className="space-y-6">
          <div className="text-center bg-gradient-to-r from-blue-100 to-cyan-100 dark:from-blue-900/30 dark:to-cyan-900/30 rounded-xl p-4">
            <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-200">{t('Juz', language)} {quranData.number || quranData.juz}</h2>
            <p className="text-slate-600 dark:text-slate-400">{t('Start from Surah', language)} {quranData.start?.surah?.name?.transliteration?.en || quranData.startSurah?.name?.transliteration?.en || 'N/A'} {t('Ayat', language)} {quranData.start?.verse || quranData.startVerse || 'N/A'}</p>
            <p className="text-slate-500 dark:text-slate-500 text-sm">{t('End at Surah', language)} {quranData.end?.surah?.name?.transliteration?.en || quranData.endSurah?.name?.transliteration?.en || 'N/A'} {t('Ayat', language)} {quranData.end?.verse || quranData.endVerse || 'N/A'}</p>
          </div>
          
          {quranData.surah.map((surahInfo, surahIndex) => (
            <div key={surahIndex} className="bg-white/70 dark:bg-slate-800/70 rounded-xl p-4 border border-blue-100 dark:border-blue-800/50">
              <div className="flex justify-between items-center mb-3">
                <h3 className="text-lg font-bold text-slate-800 dark:text-slate-200">{surahInfo.surah?.name?.transliteration?.en || surahInfo.name?.transliteration?.en || 'N/A'}</h3>
                <span className="bg-blue-100 dark:bg-blue-900/50 text-blue-800 dark:text-blue-200 px-2 py-1 rounded text-sm font-medium">
                  {surahInfo.surah?.number || surahInfo.number || 'N/A'}
                </span>
              </div>
              
              {(surahInfo.verses || surahInfo.ayah).map((verse) => {
                // Check if this specific ayat is bookmarked
                const ayatKey = `${surahInfo.surah?.number || surahInfo.number || 'N/A'}:${verse.number?.inSurah || verse.number}`;
                const isAyatBookmarked = bookmarkedSurahs && 
                  Array.from(bookmarkedSurahs).some(bm => 
                    typeof bm === 'object' && 
                    bm.surahNumber === (surahInfo.surah?.number || surahInfo.number || 'N/A') && 
                    bm.verseNumber === (verse.number?.inSurah || verse.number)
                  );
                
                return (
                  <div key={verse.number?.inSurah || verse.number} className="mb-3 last:mb-0 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg p-3 border border-indigo-100 dark:border-indigo-800/50 relative">
                    <div className="flex justify-between items-start mb-2">
                      <span className="bg-indigo-200 dark:bg-indigo-800/50 text-indigo-800 dark:text-indigo-200 px-2 py-1 rounded text-xs font-medium">
                        {surahInfo.surah?.number || surahInfo.number || 'N/A'}:{verse.number?.inSurah || verse.number}
                      </span>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => {
                            if (toggleBookmark) toggleBookmark({
                              surahNumber: surahInfo.surah?.number || surahInfo.number || 'N/A',
                              verseNumber: verse.number?.inSurah || verse.number,
                              surahName: (surahInfo.surah?.name?.long || surahInfo.name || 'N/A'),
                              surahTransliteration: (surahInfo.surah?.name?.transliteration?.en || surahInfo.transliteration?.en || 'N/A'),
                              text: verse.text?.arab || verse.arab || 'N/A',
                              translation: verse.translation?.id || verse.translation || 'N/A',
                              timestamp: new Date().toISOString()
                            });
                          }}
                          className="p-1 rounded-full hover:bg-indigo-200 dark:hover:bg-indigo-700 transition-colors"
                        >
                          <svg 
                            className={`w-4 h-4 ${isAyatBookmarked ? 'text-red-500 fill-current' : 'text-slate-400'}`} 
                            viewBox="0 0 24 24" 
                            fill={isAyatBookmarked ? "currentColor" : "none"} 
                            stroke="currentColor" 
                            strokeWidth="2"
                          >
                            <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                          </svg>
                        </button>
                        <span className="text-slate-500 dark:text-slate-500 text-xs">Ayat {verse.number?.inSurah || verse.number}</span>
                      </div>
                    </div>
                    <p 
                      className="text-xl text-right leading-relaxed font-amiri text-slate-800 dark:text-slate-200 mb-2"
                      style={{
                        fontFamily: "'Amiri', 'Scheherazade New', 'Lateef', serif",
                        lineHeight: '2.8',
                        letterSpacing: '0.02em',
                      }}
                      dir="rtl"
                      lang="ar"
                    >
                      {verse.text?.arab || verse.arab || 'N/A'}
                    </p>
                    <p className="text-slate-700 dark:text-slate-300 text-sm leading-relaxed">
                      {verse.translation?.id || verse.translation || 'N/A'}
                    </p>
                    <div className="mt-2 text-xs text-slate-500 dark:text-slate-500">
                      <audio controls className="w-full">
                        <source src={verse.audio?.primary || verse.audio || ''} type="audio/mpeg" />
                      </audio>
                    </div>
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      );
    }
    // If it's a surah object (has list of verses)
    else if (quranData.verses && Array.isArray(quranData.verses)) {
      return (
        <div className="space-y-4">
          <div className="text-center bg-gradient-to-r from-indigo-100 to-purple-100 dark:from-indigo-900/30 dark:to-purple-900/30 rounded-xl p-4">
            <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-200">{quranData.name?.long || quranData.name || 'N/A'} ({quranData.name?.transliteration?.en || quranData.transliteration?.en || 'N/A'})</h2>
            <p className="text-slate-600 dark:text-slate-400">{quranData.name?.translation?.en || quranData.translation?.en || 'N/A'}</p>
            <p className="text-slate-500 dark:text-slate-500 text-sm">{t('Total Ayat', language)}: {quranData.numberOfVerses || quranData.numberOfAyah || 'N/A'} | {t('Type', language)}: {quranData.revelation?.en || quranData.revelation || 'N/A'}</p>
          </div>
          
          {quranData.verses.map((verse) => {
            // Check if this specific ayat is bookmarked
            const ayatKey = `${quranData.number || quranData.number}:${verse.number?.inSurah || verse.number}`;
            const isAyatBookmarked = bookmarkedSurahs && 
              Array.from(bookmarkedSurahs).some(bm => 
                typeof bm === 'object' && 
                bm.surahNumber === (quranData.number || quranData.number) && 
                bm.verseNumber === (verse.number?.inSurah || verse.number)
              );
            
            return (
              <div key={verse.number?.inSurah || verse.number} className="bg-white/70 dark:bg-slate-800/70 rounded-xl p-4 border border-indigo-100 dark:border-indigo-800/50 relative">
                <div className="flex justify-between items-start mb-2">
                  <span className="bg-indigo-100 dark:bg-indigo-800/50 text-indigo-800 dark:text-indigo-200 px-2 py-1 rounded text-sm font-medium">
                    {quranData.number || quranData.number}:{verse.number?.inSurah || verse.number}
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        if (toggleBookmark) toggleBookmark({
                          surahNumber: quranData.number || quranData.number,
                          verseNumber: verse.number?.inSurah || verse.number,
                          surahName: quranData.name?.long || quranData.name || 'N/A',
                          surahTransliteration: quranData.name?.transliteration?.en || quranData.transliteration?.en || 'N/A',
                          text: verse.text?.arab || verse.arab || 'N/A',
                          translation: verse.translation?.id || verse.translation || 'N/A',
                          timestamp: new Date().toISOString()
                        });
                      }}
                      className="p-1 rounded-full hover:bg-indigo-200 dark:hover:bg-indigo-700 transition-colors"
                    >
                      <svg 
                        className={`w-5 h-5 ${isAyatBookmarked ? 'text-red-500 fill-current' : 'text-slate-400'}`} 
                        viewBox="0 0 24 24" 
                        fill={isAyatBookmarked ? "currentColor" : "none"} 
                        stroke="currentColor" 
                        strokeWidth="2"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                      </svg>
                    </button>
                    <span className="text-slate-500 dark:text-slate-500 text-sm">Ayat {verse.number?.inSurah || verse.number}</span>
                  </div>
                </div>
                <p 
                  className="text-2xl text-right leading-relaxed font-amiri text-slate-800 dark:text-slate-200 mb-3"
                  style={{
                    fontFamily: "'Amiri', 'Scheherazade New', 'Lateef', serif",
                    lineHeight: '2.8',
                    letterSpacing: '0.02em',
                  }}
                  dir="rtl"
                  lang="ar"
                >
                  {verse.text?.arab || verse.arab || 'N/A'}
                </p>
                <p className="text-slate-700 dark:text-slate-300 leading-relaxed">
                  {verse.translation?.id || verse.translation || 'N/A'}
                </p>
                <div className="mt-2 text-xs text-slate-500 dark:text-slate-500">
                  <audio controls className="w-full">
                    <source src={verse.audio?.primary || verse.audio || ''} type="audio/mpeg" />
                  </audio>
                </div>
              </div>
            );
          })}
        </div>
      );
    } 
    // If it's a single verse object
    else if (quranData.verse) {
      const verse = quranData.verse;
      const surah = quranData.surah || quranData.verse?.surah;
      
      return (
        <div className="space-y-4">
          <div className="text-center bg-gradient-to-r from-green-100 to-teal-100 dark:from-green-900/30 dark:to-teal-900/30 rounded-xl p-4">
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-200">
                  {surah?.name?.long || surah?.name || 'N/A'} ({surah?.name?.transliteration?.en || surah?.transliteration?.en || 'N/A'}) - Ayat {verse.number?.inSurah || verse.number}
                </h2>
                <p className="text-slate-600 dark:text-slate-400">{surah?.name?.translation?.en || surah?.translation?.en || 'N/A'}</p>
              </div>
              <button
                onClick={() => {
                  if (toggleBookmark) toggleBookmark({
                    surahNumber: surah?.number || surah?.number || 'N/A',
                    verseNumber: verse.number?.inSurah || verse.number,
                    surahName: surah?.name?.long || surah?.name || 'N/A',
                    surahTransliteration: surah?.name?.transliteration?.en || surah?.transliteration?.en || 'N/A',
                    text: verse.text?.arab || verse.arab || 'N/A',
                    translation: verse.translation?.id || verse.translation || 'N/A',
                    timestamp: new Date().toISOString()
                  });
                }}
                className="p-2 rounded-full hover:bg-green-200 dark:hover:bg-green-700 transition-colors"
              >
                <svg 
                  className={`w-6 h-6 ${isBookmarked && isBookmarked(`${surah?.number || surah?.number}:${verse.number?.inSurah || verse.number}`) ? 'text-red-500 fill-current' : 'text-slate-400'}`} 
                  viewBox="0 0 24 24" 
                  fill={isBookmarked && isBookmarked(`${surah?.number || surah?.number}:${verse.number?.inSurah || verse.number}`) ? "currentColor" : "none"} 
                  stroke="currentColor" 
                  strokeWidth="2"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
              </button>
            </div>
          </div>
          
          <div className="bg-white/70 dark:bg-slate-800/70 rounded-xl p-4 border border-green-100 dark:border-green-800/50">
            <p 
              className="text-2xl text-right leading-relaxed font-amiri text-slate-800 dark:text-slate-200 mb-3"
              style={{
                fontFamily: "'Amiri', 'Scheherazade New', 'Lateef', serif",
                lineHeight: '2.8',
                letterSpacing: '0.02em',
              }}
              dir="rtl"
              lang="ar"
            >
              {verse.text?.arab || verse.arab || 'N/A'}
            </p>
            <p className="text-slate-700 dark:text-slate-300 leading-relaxed">
              {verse.translation?.id || verse.translation || 'N/A'}
            </p>
            <div className="mt-2 text-xs text-slate-500 dark:text-slate-500 flex justify-between">
              <span>Surah: {surah?.number || surah?.number || 'N/A'} - {surah?.name?.transliteration?.en || surah?.transliteration?.en || 'N/A'}</span>
              <audio controls className="h-6">
                <source src={verse.audio?.primary || verse.audio || ''} type="audio/mpeg" />
              </audio>
            </div>
          </div>
        </div>
      );
    }
    // If it's a list of surahs (from search or initial view)
    else if (quranData.surahs) {
      return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {quranData.surahs.map((surah) => (
            <div 
              key={surah.number || surah.number} 
              className="bg-white/70 dark:bg-slate-800/70 rounded-xl p-3 border border-slate-200 dark:border-slate-700 cursor-pointer hover:bg-indigo-50 dark:hover:bg-slate-700/50 transition-colors relative"
              onClick={() => handleSurahSelect(surah.number || surah.number)}
            >
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="font-bold text-slate-800 dark:text-slate-200">{surah.name?.long || surah.name || 'N/A'}</h3>
                  <p className="text-slate-600 dark:text-slate-400 text-sm">{surah.name?.transliteration?.en || surah.transliteration?.en || 'N/A'} - {surah.name?.translation?.en || surah.translation?.en || 'N/A'}</p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      if (toggleBookmark) toggleBookmark({
                        number: surah.number,
                        name: surah.name?.long || surah.name || 'N/A',
                        transliteration: surah.name?.transliteration?.en || surah.transliteration?.en || 'N/A',
                        translation: surah.name?.translation?.en || surah.translation?.en || 'N/A',
                        versesCount: surah.numberOfVerses || surah.numberOfAyah || 0,
                        revelation: surah.revelation?.en || surah.revelation || 'N/A',
                        timestamp: new Date().toISOString()
                      });
                    }}
                    className="p-1 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                  >
                    <svg 
                      className={`w-5 h-5 ${isBookmarked && isBookmarked(surah.number) ? 'text-red-500 fill-current' : 'text-slate-400'}`} 
                      viewBox="0 0 24 24" 
                      fill={isBookmarked && isBookmarked(surah.number) ? "currentColor" : "none"} 
                      stroke="currentColor" 
                      strokeWidth="2"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                    </svg>
                  </button>
                  <span className="bg-indigo-100 dark:bg-indigo-900/50 text-indigo-800 dark:text-indigo-200 w-8 h-8 rounded-full flex items-center justify-center font-bold">
                    {surah.number || surah.number}
                  </span>
                </div>
              </div>
              <p className="text-slate-500 dark:text-slate-500 text-xs mt-1">{surah.numberOfVerses || surah.numberOfAyah || 'N/A'} {t('Ayat', language)} • {surah.revelation?.en || surah.revelation || 'N/A'}</p>
            </div>
          ))}
        </div>
      );
    } 
    // If active tab is bookmarks, show bookmarked surahs and ayats
    else if (activeTab === 'bookmarks') {
      // Separate surah bookmarks and ayat bookmarks
      const surahBookmarks = surahs.filter(surah => 
        bookmarkedSurahs && bookmarkedSurahs.has(surah.number)
      );
      
      return (
        <div>
          {surahBookmarks.length > 0 || ayatBookmarkData.length > 0 ? (
            <div className="space-y-6">
              {/* Surah bookmarks */}
              {surahBookmarks.length > 0 && (
                <div>
                  <h3 className="font-semibold text-slate-700 dark:text-slate-300 mb-3 text-sm">{t('Bookmarked Surahs', language)}</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {surahBookmarks.map((surah) => (
                      <div 
                        key={`bookmark-${surah.number}`} 
                        className="bg-gradient-to-br from-red-50 to-pink-50 dark:from-red-900/30 dark:to-pink-900/30 rounded-xl p-3 border border-red-100 dark:border-red-800/50 cursor-pointer hover:from-red-100 hover:to-pink-100 dark:hover:from-red-800/40 dark:hover:to-pink-800/40 transition-all relative"
                        onClick={() => handleSurahSelect(surah.number)}
                      >
                        <div className="flex justify-between items-center">
                          <div>
                            <h3 className="font-bold text-slate-800 dark:text-slate-200">{surah.name?.long || surah.name || 'N/A'}</h3>
                            <p className="text-slate-600 dark:text-slate-400 text-sm">{surah.name?.transliteration?.en || surah.transliteration?.en || 'N/A'} - {surah.name?.translation?.en || surah.translation?.en || 'N/A'}</p>
                          </div>
                          <div className="flex items-center gap-2">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                if (toggleBookmark) toggleBookmark({
                                  number: surah.number,
                                  name: surah.name?.long || surah.name || 'N/A',
                                  transliteration: surah.name?.transliteration?.en || surah.transliteration?.en || 'N/A',
                                  translation: surah.name?.translation?.en || surah.translation?.en || 'N/A',
                                  versesCount: surah.numberOfVerses || surah.numberOfAyah || 0,
                                  revelation: surah.revelation?.en || surah.revelation || 'N/A',
                                  timestamp: new Date().toISOString()
                                });
                              }}
                              className="p-1 rounded-full hover:bg-red-200 dark:hover:bg-red-800 transition-colors"
                            >
                              <svg 
                                className="w-5 h-5 text-red-500 fill-current" 
                                viewBox="0 0 24 24" 
                                fill="currentColor" 
                                stroke="currentColor" 
                                strokeWidth="2"
                              >
                                <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                              </svg>
                            </button>
                            <span className="bg-red-100 dark:bg-red-900/50 text-red-800 dark:text-red-200 w-8 h-8 rounded-full flex items-center justify-center font-bold">
                              {surah.number}
                            </span>
                          </div>
                        </div>
                        <p className="text-slate-500 dark:text-slate-500 text-xs mt-1">{surah.numberOfVerses || surah.numberOfAyah || 'N/A'} {t('Ayat', language)} • {surah.revelation?.en || surah.revelation || 'N/A'}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {/* Ayat bookmarks */}
              {ayatBookmarkData.length > 0 && (
                <div>
                  <h3 className="font-semibold text-slate-700 dark:text-slate-300 mb-3 text-sm">{t('Bookmarked Verses', language)}</h3>
                  <div className="space-y-3">
                    {ayatBookmarkData.map((verse) => (
                      <div 
                        key={`ayat-bookmark-${verse.bookmarkKey}`} 
                        className="bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-900/30 dark:to-orange-900/30 rounded-xl p-4 border border-amber-100 dark:border-amber-800/50 cursor-pointer hover:from-amber-100 hover:to-orange-100 dark:hover:from-amber-800/40 dark:hover:to-orange-800/40 transition-all"
                        onClick={() => handleSurahSelect(verse.surahNumber)}
                      >
                        <div className="flex justify-between items-start mb-2">
                          <span className="bg-amber-100 dark:bg-amber-800/50 text-amber-800 dark:text-amber-200 px-2 py-1 rounded text-sm font-medium">
                            {verse.surahNumber}:{verse.number?.inSurah || verse.number}
                          </span>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              if (toggleBookmark) toggleBookmark({
                                surahNumber: verse.surahNumber,
                                verseNumber: verse.number?.inSurah || verse.number,
                                surahName: verse.surahName,
                                surahTransliteration: verse.surahTransliteration,
                                text: verse.text?.arab || verse.arab || 'N/A',
                                translation: verse.translation?.id || verse.translation || 'N/A',
                                timestamp: new Date().toISOString()
                              });
                            }}
                            className="p-1 rounded-full hover:bg-amber-200 dark:hover:bg-amber-700 transition-colors"
                          >
                            <svg 
                              className="w-5 h-5 text-red-500 fill-current" 
                              viewBox="0 0 24 24" 
                              fill="currentColor" 
                              stroke="currentColor" 
                              strokeWidth="2"
                            >
                              <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                            </svg>
                          </button>
                        </div>
                        <p 
                          className="text-xl text-right leading-relaxed font-amiri text-slate-800 dark:text-slate-200 mb-2"
                          style={{
                            fontFamily: "'Amiri', 'Scheherazade New', 'Lateef', serif",
                            lineHeight: '2.8',
                            letterSpacing: '0.02em',
                          }}
                          dir="rtl"
                          lang="ar"
                        >
                          {verse.text?.arab || verse.arab || 'N/A'}
                        </p>
                        <p className="text-slate-700 dark:text-slate-300 text-sm leading-relaxed">
                          {verse.translation?.id || verse.translation || 'N/A'}
                        </p>
                        <p className="text-xs text-slate-500 dark:text-slate-500 mt-2">
                          {verse.surahTransliteration} - Ayat {verse.number?.inSurah || verse.number}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-8">
              <div className="text-5xl mb-4">♥</div>
              <h3 className="font-semibold text-slate-700 dark:text-slate-300">{t('No Bookmarks Yet', language)}</h3>
              <p className="text-slate-500 dark:text-slate-500 text-sm mt-1">{t('Start reading and bookmark your favorite surahs or verses', language)}</p>
            </div>
          )}
        </div>
      );
    }
    else {
      // Generic display for unknown data structure
      return (
        <div className="bg-yellow-50/80 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700 rounded-2xl p-4 text-left backdrop-blur-sm text-xs">
          <details>
            <summary className="cursor-pointer text-yellow-700 dark:text-yellow-400 font-medium">Lihat Data API (Format Tidak Dikenal)</summary>
            <pre className="text-[10px] text-yellow-600 dark:text-yellow-400 mt-2 overflow-x-auto">
              {JSON.stringify(quranData, null, 2)}
            </pre>
          </details>
        </div>
      );
    }
  };

  return (
    <div className="w-full bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-2xl shadow-sm p-4 border border-white/60 dark:border-slate-700/60">
      <h2 className="text-xl font-bold text-slate-800 dark:text-slate-200 mb-4 flex items-center gap-2">
        <BookText className="text-indigo-600 dark:text-indigo-400" size={24} />
        {t('Al-Quran Browser', language)}
      </h2>
      
      {/* Recent Readings Section */}
      {recentReadings && recentReadings.length > 0 && (
        <div className="mb-6">
          <div className="flex justify-between items-center mb-3">
            <h3 className="font-semibold text-slate-700 dark:text-slate-300 text-sm flex items-center gap-2">
              <span>📖</span> {t('Recent Readings', language)}
            </h3>
          </div>
          <div className="flex gap-2 overflow-x-auto pb-2">
            {recentReadings.slice(0, 5).map((surah, index) => (
              <div 
                key={`recent-${surah.number}-${index}`}
                className="min-w-[140px] bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/30 dark:to-indigo-900/30 rounded-xl p-3 border border-blue-100 dark:border-blue-800/50 relative"
              >
                <button
                  onClick={() => confirmDeleteRecent && confirmDeleteRecent(surah.number, surah.transliteration)}
                  className="absolute top-2 right-2 p-1 rounded-full hover:bg-red-200 dark:hover:bg-red-700 transition-colors"
                >
                  <svg 
                    className="w-4 h-4 text-slate-400 hover:text-red-500" 
                    viewBox="0 0 24 24" 
                    fill="none" 
                    stroke="currentColor" 
                    strokeWidth="2"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
                
                <div 
                  className="cursor-pointer hover:opacity-90 transition-opacity"
                  onClick={() => handleSurahSelect(surah.number)}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-bold text-slate-800 dark:text-slate-200 text-sm">{surah.number}</h4>
                      <p className="text-xs text-slate-600 dark:text-slate-400 truncate">{surah.transliteration}</p>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        if (toggleBookmark) toggleBookmark(surah);
                      }}
                      className="p-1 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                    >
                      <svg 
                        className={`w-4 h-4 ${isBookmarked && isBookmarked(surah.number) ? 'text-red-500 fill-current' : 'text-slate-400'}`} 
                        viewBox="0 0 24 24" 
                        fill={isBookmarked && isBookmarked(surah.number) ? "currentColor" : "none"} 
                        stroke="currentColor" 
                        strokeWidth="2"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                      </svg>
                    </button>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-500 mt-1">{surah.versesCount} {t('Ayat', language)}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      
      {/* Tab Navigation */}
      <div className="flex border-b border-slate-200 dark:border-slate-700 mb-4">
        <button
          className={`pb-2 px-4 font-medium ${activeTab === 'surah' ? 'text-indigo-600 dark:text-indigo-400 border-b-2 border-indigo-600 dark:border-indigo-500' : 'text-slate-500 dark:text-slate-400'}`}
          onClick={async () => {
            setActiveTab('surah');
            if (surahs.length > 0) {
              setQuranData({ surahs: surahs });
            } else {
              // If surahs is empty, fetch them again
              try {
                setLoading(true);
                const data = await quranAPI.fetchAllSurahs();
                setSurahs(data.data);
                setQuranData({ surahs: data.data });
              } catch (err) {
                setError(err.message);
              } finally {
                setLoading(false);
              }
            }
          }}
        >
          {t('Surah', language)}
        </button>
        <button
          className={`pb-2 px-4 font-medium ${activeTab === 'juz' ? 'text-indigo-600 dark:text-indigo-400 border-b-2 border-indigo-600 dark:border-indigo-500' : 'text-slate-500 dark:text-slate-400'}`}
          onClick={() => setActiveTab('juz')}
        >
          {t('Juz', language)}
        </button>
        <button
          className={`pb-2 px-4 font-medium ${activeTab === 'bookmarks' ? 'text-indigo-600 dark:text-indigo-400 border-b-2 border-indigo-600 dark:border-indigo-500' : 'text-slate-500 dark:text-slate-400'}`}
          onClick={() => setActiveTab('bookmarks')}
        >
          ♥ {t('Bookmarks', language)}
        </button>
      </div>
      
      {/* Juz Selection (when Juz tab is active) */}
      {activeTab === 'juz' && (
        <div className="grid grid-cols-6 md:grid-cols-10 gap-2 mb-4">
          {Array.from({length: 30}, (_, i) => i + 1).map(juzNumber => (
            <button
              key={juzNumber}
              onClick={() => handleJuzSelect(juzNumber)}
              className="py-2 bg-indigo-100 dark:bg-indigo-900/50 text-indigo-800 dark:text-indigo-200 rounded-lg hover:bg-indigo-200 dark:hover:bg-indigo-800 transition-colors text-sm font-medium shadow-sm"
            >
              {juzNumber}
            </button>
          ))}
        </div>
      )}
      
      {/* Search and Navigation */}
      <div className="flex flex-col md:flex-row gap-3 mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 dark:text-slate-500" size={18} />
          <input
            type="text"
            placeholder={t('Search Surah, Juz, or Verse', language)}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-white/50 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-blue-200 dark:focus:ring-blue-600 focus:border-blue-300 dark:focus:border-blue-500 transition-all placeholder-slate-400 dark:placeholder-slate-500 text-slate-700 dark:text-slate-300"
          />
        </div>
        <button
          onClick={handleSearch}
          className="px-4 py-2 bg-gradient-to-r from-indigo-500 to-purple-500 text-white rounded-xl hover:from-indigo-600 hover:to-purple-600 transition-all flex items-center gap-2 shadow-md"
        >
          <Search size={18} />
          {t('Search', language)}
        </button>
        <button
          onClick={handleRandomAyah}
          className="px-4 py-2 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-xl hover:from-emerald-600 hover:to-teal-600 transition-all flex items-center gap-2 shadow-md"
        >
          <Shuffle size={18} />
          {t('Random', language)}
        </button>
      </div>
      
      {error && (
        <div className="bg-red-50/80 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-2xl p-4 text-center backdrop-blur-sm mb-4">
          <p className="text-red-600 dark:text-red-300 text-sm">{error}</p>
        </div>
      )}
      
      {loading && (
        <div className="flex justify-center py-8">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-500 dark:border-indigo-400"></div>
        </div>
      )}
      
      {!loading && displayData()}
    </div>
  );
};

export default QuranBrowser;
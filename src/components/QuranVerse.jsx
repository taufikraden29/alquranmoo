import { motion, AnimatePresence } from "framer-motion";

const QuranVerse = ({ verse, surahName, surahNumber, ayahNumber, isLoading, error }) => {
  if (isLoading) {
    return (
      <div className="w-full bg-white/80 backdrop-blur-sm rounded-2xl shadow-sm p-6 border border-white/60">
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-slate-200 rounded w-1/4"></div>
          <div className="h-8 bg-slate-200 rounded w-3/4"></div>
          <div className="h-20 bg-slate-200 rounded"></div>
          <div className="h-16 bg-slate-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full bg-red-50/80 border border-red-200 rounded-2xl p-4 text-center backdrop-blur-sm">
        <p className="text-red-600 text-sm">{error}</p>
      </div>
    );
  }

  if (!verse) {
    return (
      <div className="w-full bg-white/80 backdrop-blur-sm rounded-2xl shadow-sm p-6 border border-white/60 text-center">
        <p className="text-slate-500">Pilih surah dan ayat untuk mulai membaca Al-Quran</p>
      </div>
    );
  }

  // Find the specific ayah based on the ayah number
  // The API returns different structures, so we need to handle multiple possibilities
  let currentVerse = null;
  
  // Check different possible API response structures
  if (verse && typeof verse === 'object') {
    // Check if this is a surah object with an ayat property (object mapping)
    if (verse.ayat && typeof verse.ayat === 'object') {
      currentVerse = verse.ayat[ayahNumber];
    }
    // Check if this is a surah object with verses array
    else if (verse.verses && Array.isArray(verse.verses)) {
      currentVerse = verse.verses.find(v => {
        const ayahNum = v.verse_key ? parseInt(v.verse_key.split(':')[1]) : 
                        v.nomor_ayat || v.verse_number || v.number;
        return ayahNum === ayahNumber;
      });
    }
    // Check if this is a surah object with ayat array
    else if (verse.ayat && Array.isArray(verse.ayat)) {
      currentVerse = verse.ayat.find(a => {
        const ayahNum = a.nomor_ayat || a.ayat || a.number;
        return ayahNum === ayahNumber;
      });
    }
    // If verse itself is an array of ayat (e.g., verse.verses or just ayat)
    else if (Array.isArray(verse)) {
      currentVerse = verse.find(a => {
        const ayahNum = a.nomor_ayat || a.ayat || a.number || a.verse_number;
        return ayahNum === ayahNumber;
      });
    }
  }
  
  // If currentVerse is still null, try to use verse as the direct ayah if it matches the ayah number
  if (!currentVerse && verse && typeof verse === 'object') {
    const ayahNum = verse.nomor_ayat || verse.ayat || verse.number || verse.verse_number;
    if (ayahNum === ayahNumber) {
      currentVerse = verse;
    }
  }
  
  if (!currentVerse) {
    return (
      <div className="w-full bg-white/80 backdrop-blur-sm rounded-2xl shadow-sm p-6 border border-white/60 text-center">
        <p className="text-slate-500">Ayat {ayahNumber} tidak ditemukan dalam Surah {surahNumber}</p>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="w-full bg-white/80 backdrop-blur-sm rounded-2xl shadow-sm p-4 sm:p-6 border border-white/60"
    >
      <div className="text-center mb-4">
        <h3 className="text-lg sm:text-xl font-bold text-slate-800">
          {surahName} (Surah {surahNumber})
        </h3>
        <p className="text-slate-600 text-sm sm:text-base">Ayat {ayahNumber}</p>
      </div>

      <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-xl p-4 sm:p-6 mb-4 sm:mb-6 border border-indigo-100">
        <p 
          className="text-xl sm:text-2xl md:text-3xl text-right leading-relaxed font-amiri text-slate-800 mb-4 sm:mb-6 text-arabic"
          style={{
            fontFamily: "'Amiri', 'Scheherazade New', 'Lateef', serif",
            lineHeight: "2.8",
            letterSpacing: "0.02em",
          }}
          dir="rtl"
          lang="ar"
        >
          {currentVerse.text}
        </p>
        
        <div className="bg-white/70 rounded-xl p-3 sm:p-4 border border-indigo-100">
          <p className="text-slate-700 leading-relaxed text-sm sm:text-base">
            {currentVerse.translation}
          </p>
        </div>
      </div>

      {/* Additional details */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs sm:text-sm text-slate-600">
        <div className="flex flex-wrap gap-2">
          <span className="bg-slate-100 px-2 py-1 rounded text-xs">Juz: {currentVerse.juz || 'N/A'}</span>
          <span className="bg-slate-100 px-2 py-1 rounded text-xs">Ruku: {currentVerse.ruku || 'N/A'}</span>
          <span className="bg-slate-100 px-2 py-1 rounded text-xs">Ayat: {currentVerse.verse_number || ayahNumber}</span>
        </div>
        <div className="mt-2 sm:mt-0">
          <a 
            href={`https://quran.com/${surahNumber}/${ayahNumber}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-indigo-600 hover:text-indigo-800 transition-colors text-xs sm:text-sm"
          >
            Lihat di Quran.com →
          </a>
        </div>
      </div>
      
      {/* Ayat Info */}
      <div className="mt-3 sm:mt-4 pt-3 sm:pt-4 border-t border-slate-200/30">
        <div className="flex flex-col sm:flex-row justify-between text-xs text-slate-500 gap-1">
          <span className="text-arabic">Arab: {currentVerse.arab || currentVerse.text}</span>
          <span>Indonesia: {currentVerse.translation_id || currentVerse.translation}</span>
        </div>
      </div>
    </motion.div>
  );
};

export default QuranVerse;
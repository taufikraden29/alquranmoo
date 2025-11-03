import { useState, useRef } from "react";
import { Play, Pause, Volume2 } from "lucide-react";

const AudioPlayer = ({ audioUrl, surahName, ayahNumber, isLoading }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(0.8);
  const audioRef = useRef(null);

  const togglePlay = async () => {
    if (!audioRef.current) return;

    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      try {
        await audioRef.current.play();
        setIsPlaying(true);
      } catch (error) {
        console.error("Error playing audio:", error);
        setIsPlaying(false);
      }
    }
  };

  const handleVolumeChange = (e) => {
    const newVolume = parseFloat(e.target.value);
    setVolume(newVolume);
    if (audioRef.current) {
      audioRef.current.volume = newVolume;
    }
  };

  if (!audioUrl || isLoading) {
    return (
      <div className="w-full bg-slate-100/30 rounded-2xl p-4 border border-slate-200/50 backdrop-blur-sm">
        <div className="h-12 flex items-center justify-center">
          <p className="text-slate-500 text-sm">Audio tidak tersedia</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full bg-slate-100/30 rounded-2xl p-3 sm:p-4 border border-slate-200/50 backdrop-blur-sm">
      <div className="flex flex-col sm:flex-row items-center gap-3">
        <button
          onClick={togglePlay}
          disabled={isLoading}
          className="p-3 bg-indigo-500 text-white rounded-xl hover:bg-indigo-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors touch-target"
        >
          {isPlaying ? <Pause size={20} /> : <Play size={20} />}
        </button>
        
        <div className="flex-1 min-w-0 text-center sm:text-left">
          <p className="text-slate-800 font-medium truncate text-sm">
            {surahName} - Ayat {ayahNumber}
          </p>
          <p className="text-slate-600 text-xs">Audio Recitation</p>
        </div>
        
        <div className="flex items-center gap-2 w-full sm:w-auto justify-center sm:justify-end">
          <Volume2 size={16} className="text-slate-600" />
          <input
            type="range"
            min="0"
            max="1"
            step="0.01"
            value={volume}
            onChange={handleVolumeChange}
            className="w-16 sm:w-20 accent-indigo-500 max-w-[100px]"
          />
        </div>
      </div>
      
      <audio
        ref={audioRef}
        src={audioUrl}
        onEnded={() => setIsPlaying(false)}
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
        preload="none"
      />
    </div>
  );
};

export default AudioPlayer;
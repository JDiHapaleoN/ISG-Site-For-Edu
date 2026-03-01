"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Play, Pause, Repeat, Repeat1, Volume2, BookOpen, Loader2, Check, PlusCircle } from "lucide-react";
import { WordData } from "../reader/InteractiveReader";

export interface TranscriptSegment {
  id: string;
  start: number;
  end: number;
  text: string;
}

interface ShadowingPlayerProps {
  module: "english" | "german";
  audioUrl: string;
  transcript: TranscriptSegment[];
}

export default function ShadowingPlayer({ module, audioUrl, transcript }: ShadowingPlayerProps) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  // A/B Loop State
  const [loopA, setLoopA] = useState<number | null>(null);
  const [loopB, setLoopB] = useState<number | null>(null);
  const [isLooping, setIsLooping] = useState(false);

  // Dictionary State (Reused logic from InteractiveReader)
  const [selectedWord, setSelectedWord] = useState<WordData | null>(null);
  const [isTranslating, setIsTranslating] = useState(false);
  const [isAdding, setIsAdding] = useState(false);

  // Active Segment
  const activeSegmentIndex = transcript.findIndex(
    (s) => currentTime >= s.start && currentTime <= s.end
  );

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const updateTime = () => {
      setCurrentTime(audio.currentTime);
      // Handle A/B Loop
      if (isLooping && loopA !== null && loopB !== null) {
        if (audio.currentTime >= loopB) {
          audio.currentTime = loopA;
          audio.play();
        }
      }
    };
    const updateDuration = () => setDuration(audio.duration);
    const handleEnded = () => setIsPlaying(false);

    audio.addEventListener("timeupdate", updateTime);
    audio.addEventListener("loadedmetadata", updateDuration);
    audio.addEventListener("ended", handleEnded);

    return () => {
      audio.removeEventListener("timeupdate", updateTime);
      audio.removeEventListener("loadedmetadata", updateDuration);
      audio.removeEventListener("ended", handleEnded);
    };
  }, [isLooping, loopA, loopB]);

  const togglePlay = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
    setIsPlaying(!isPlaying);
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!audioRef.current) return;
    const time = Number(e.target.value);
    audioRef.current.currentTime = time;
    setCurrentTime(time);
  };

  const formatTime = (time: number) => {
    const mins = Math.floor(time / 60);
    const secs = Math.floor(time % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const handleSegmentClick = (segment: TranscriptSegment) => {
    if (!audioRef.current) return;
    audioRef.current.currentTime = segment.start;
    setCurrentTime(segment.start);
    if (!isPlaying) togglePlay();
  };

  const setLoopPoint = () => {
    if (!isLooping) {
      if (loopA === null) {
        setLoopA(currentTime);
      } else if (loopB === null) {
        if (currentTime > loopA) {
          setLoopB(currentTime);
          setIsLooping(true);
        } else {
          // Invalid loop B
          setLoopA(null);
        }
      }
    } else {
      // Clear loop
      setIsLooping(false);
      setLoopA(null);
      setLoopB(null);
    }
  };

  const handleWordClick = async (chunk: string, context: string, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent segment click
    const cleanWord = chunk.trim().replace(/[.,!?;()]/g, "");
    if (!cleanWord || !/[a-zA-ZÀ-ÿ]/.test(cleanWord)) return;

    setIsTranslating(true);
    // Pause audio while translating to focus
    if (isPlaying && audioRef.current) {
      audioRef.current.pause();
      setIsPlaying(false);
    }

    try {
      const res = await fetch("/api/translate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ word: cleanWord, context, module }),
      });

      if (!res.ok) throw new Error("Translation failed");
      const data = await res.json();
      setSelectedWord({ ...data, context, isAdded: false });
    } catch (err) {
      console.error(err);
    } finally {
      setIsTranslating(false);
    }
  };

  const handleAddToSRS = async () => {
    if (!selectedWord || selectedWord.isAdded || isAdding) return;
    setIsAdding(true);

    try {
      const res = await fetch("/api/srs/add", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ wordData: selectedWord, module }),
      });

      if (res.ok) {
        setSelectedWord({ ...selectedWord, isAdded: true });
      } else {
        console.error("Failed to add to SRS");
      }
    } catch (error) {
      console.error("SRS API error", error);
    } finally {
      setIsAdding(false);
    }
  };

  const renderTextWithClickableWords = (text: string, isActive: boolean) => {
    const words = text.split(/(\b[^\sa-zA-ZÀ-ÿ]+\b|\s+|\b)/).filter(Boolean);
    return words.map((chunk, i) => {
      const isWord = /[a-zA-ZÀ-ÿ]/.test(chunk);
      if (!isWord) return <span key={i}>{chunk}</span>;

      return (
        <span
          key={i}
          className={`cursor-pointer transition-colors rounded-sm px-0.5 ${isActive
            ? "hover:bg-indigo-300 dark:hover:bg-indigo-700 font-semibold"
            : "hover:bg-zinc-200 dark:hover:bg-zinc-800"
            }`}
          onClick={(e) => handleWordClick(chunk, text, e)}
        >
          {chunk}
        </span>
      );
    });
  };

  return (
    <div className="flex flex-col md:flex-row gap-6 w-full max-w-6xl mx-auto h-[calc(100vh-120px)] p-4">
      <audio ref={audioRef} src={audioUrl} preload="metadata" />

      {/* Main Player Pane */}
      <div className="flex-1 flex flex-col bg-white/50 dark:bg-zinc-900/50 backdrop-blur-xl border border-zinc-200 dark:border-zinc-800 rounded-3xl p-8 shadow-2xl transition-all h-full">
        {/* Header & Controls */}
        <div className="mb-6 pb-6 border-b border-zinc-200 dark:border-zinc-800">
          <h2 className="text-2xl font-bold mb-6 flex items-center gap-3">
            <Volume2 className="w-6 h-6 text-indigo-500" />
            Плеер для шэдоуинга ({module === "german" ? "DE" : "EN"})
          </h2>

          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-4">
              <button
                onClick={togglePlay}
                className="w-14 h-14 flex items-center justify-center rounded-full bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-500/30 transition-all"
              >
                {isPlaying ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6 ml-1" />}
              </button>

              <div className="flex-1 flex flex-col gap-2">
                <input
                  type="range"
                  min="0"
                  max={duration || 100}
                  value={currentTime}
                  onChange={handleSeek}
                  className="w-full accent-indigo-500 cursor-pointer"
                />
                <div className="flex justify-between text-xs text-zinc-500 font-medium">
                  <span>{formatTime(currentTime)}</span>
                  <span>{formatTime(duration)}</span>
                </div>
              </div>

              <div className="flex flex-col items-center">
                <button
                  onClick={setLoopPoint}
                  className={`p-3 rounded-full transition-all ${isLooping
                    ? "bg-emerald-100 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400"
                    : loopA !== null
                      ? "bg-amber-100 text-amber-600 dark:bg-amber-500/20 dark:text-amber-400 animate-pulse"
                      : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-700"
                    }`}
                  title={isLooping ? "Очистить цикл A/B" : loopA !== null ? "Установить конец цикла (B)" : "Установить начало цикла (A)"}
                >
                  {isLooping ? <Repeat1 className="w-5 h-5" /> : <Repeat className="w-5 h-5" />}
                </button>
                {loopA !== null && (
                  <span className="text-[10px] font-bold text-zinc-400 mt-1 uppercase">
                    {isLooping ? "Цикл A-B" : "Старт B"}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Transcript Area */}
        <div className="flex-1 overflow-y-auto pr-4 space-y-4 font-serif text-lg leading-loose text-zinc-500 dark:text-zinc-400">
          {transcript.map((segment, index) => {
            const isActive = index === activeSegmentIndex;
            return (
              <motion.div
                key={segment.id}
                animate={isActive ? { scale: 1.02 } : { scale: 1 }}
                className={`p-4 rounded-xl cursor-pointer transition-all ${isActive
                  ? "bg-indigo-50 dark:bg-indigo-900/30 text-indigo-900 dark:text-indigo-100 shadow-sm border border-indigo-100 dark:border-indigo-800/50"
                  : "hover:bg-zinc-50 dark:hover:bg-zinc-800/50"
                  }`}
                onClick={() => handleSegmentClick(segment)}
              >
                {renderTextWithClickableWords(segment.text, isActive)}
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Dictionary Pane (Reused Layout) */}
      <AnimatePresence>
        {(selectedWord || isTranslating) && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="w-full md:w-80 h-fit bg-white/80 dark:bg-zinc-900/80 backdrop-blur-2xl border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6 shadow-2xl flex flex-col gap-6 sticky top-4"
          >
            {isTranslating ? (
              <div className="flex flex-col items-center justify-center py-20 gap-4 text-zinc-500">
                <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
                <p className="text-sm font-medium animate-pulse">Анализ контекста...</p>
              </div>
            ) : selectedWord ? (
              <>
                <div className="flex justify-between items-start">
                  <div>
                    <div className="flex items-center gap-2">
                      {selectedWord.article && (
                        <span className="text-pink-500 font-bold text-xl">{selectedWord.article}</span>
                      )}
                      <h3 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-500 to-purple-500">
                        {selectedWord.term}
                      </h3>
                    </div>

                    <div className="flex items-center gap-2 mt-1">
                      {selectedWord.transcription && (
                        <p className="text-zinc-500 dark:text-zinc-400 font-mono text-sm">
                          [{selectedWord.transcription}]
                        </p>
                      )}
                      {selectedWord.pluralForm && (
                        <p className="text-zinc-500 dark:text-zinc-400 font-medium text-sm">
                          Pl. {selectedWord.pluralForm}
                        </p>
                      )}
                      {selectedWord.partOfSpeech && (
                        <span className="px-2 py-0.5 bg-zinc-200 dark:bg-zinc-800 rounded-full text-xs text-zinc-500 dark:text-zinc-400 font-medium uppercase">
                          {selectedWord.partOfSpeech}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div>
                  <p className="text-sm text-zinc-500 dark:text-zinc-400 uppercase tracking-wider font-semibold mb-2">
                    Перевод
                  </p>
                  <p className="text-xl font-medium dark:text-zinc-100">
                    {selectedWord.translation}
                  </p>
                </div>

                {selectedWord.mnemonic && (
                  <div className="bg-amber-50 dark:bg-amber-950/30 p-3 rounded-xl border border-amber-100 dark:border-amber-900/50">
                    <p className="text-xs text-amber-800 dark:text-amber-200 font-medium mb-1">💡 Мнемоника</p>
                    <p className="text-sm text-amber-900 dark:text-amber-100">
                      {selectedWord.mnemonic}
                    </p>
                  </div>
                )}

                {selectedWord.contextTranslation && (
                  <div className="bg-indigo-50 dark:bg-indigo-950/30 p-4 rounded-2xl border border-indigo-100 dark:border-indigo-900/50 flex flex-col gap-2">
                    <p className="text-sm text-indigo-900 dark:text-indigo-200 font-serif">
                      "{selectedWord.context}"
                    </p>
                    <div className="w-full h-px border-t border-dashed border-indigo-200 dark:border-indigo-800" />
                    <p className="text-sm text-indigo-800 dark:text-indigo-300 italic">
                      {selectedWord.contextTranslation}
                    </p>
                  </div>
                )}

                <button
                  onClick={handleAddToSRS}
                  disabled={selectedWord.isAdded || isAdding}
                  className={`mt-2 w-full py-3 px-4 rounded-2xl font-semibold flex items-center justify-center gap-2 transition-all ${selectedWord.isAdded
                    ? "bg-emerald-500 text-white"
                    : "bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-500/30 disabled:opacity-50"
                    }`}
                >
                  {isAdding ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : selectedWord.isAdded ? (
                    <>
                      <Check className="w-5 h-5" /> Добавлено в словарь
                    </>
                  ) : (
                    <>
                      <PlusCircle className="w-5 h-5" /> Добавить в словарь
                    </>
                  )}
                </button>
              </>
            ) : null}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

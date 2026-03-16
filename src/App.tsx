/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect } from 'react';
import { Play, Pause, SkipForward, SkipBack, ListMusic, Plus, Volume2, VolumeX, Music, Repeat, FolderHeart, ArrowLeft, MoreVertical, Trash2, X, Check } from 'lucide-react';

interface Track {
  id: string;
  file: File;
  url: string;
  name: string;
  artist: string;
}

interface Playlist {
  id: string;
  name: string;
  trackIds: string[];
}

type FadeCurve = 'linear' | 'equal-power' | 'quadratic';

const fadeAudio = (
  audio: HTMLAudioElement,
  type: 'in' | 'out',
  durationMs: number,
  maxVolume: number = 1,
  curve: FadeCurve = 'equal-power',
  onComplete?: () => void
) => {
  const startTime = performance.now();
  let animationFrameId: number;

  const animate = (currentTime: number) => {
    const elapsed = currentTime - startTime;
    const t = Math.min(1, elapsed / durationMs);

    let volMultiplier = 0;
    if (curve === 'linear') {
      volMultiplier = type === 'in' ? t : 1 - t;
    } else if (curve === 'quadratic') {
      volMultiplier = type === 'in' ? t * t : 1 - (t * t);
    } else {
      volMultiplier = type === 'in' ? Math.sin((t * Math.PI) / 2) : Math.cos((t * Math.PI) / 2);
    }

    audio.volume = Math.max(0, Math.min(1, volMultiplier * maxVolume));

    if (t < 1) {
      animationFrameId = requestAnimationFrame(animate);
    } else {
      audio.volume = type === 'in' ? maxVolume : 0;
      if (onComplete) onComplete();
    }
  };

  animationFrameId = requestAnimationFrame(animate);
  return () => cancelAnimationFrame(animationFrameId);
};

const formatTime = (seconds: number) => {
  if (isNaN(seconds) || !isFinite(seconds)) return "0:00";
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
};

export default function App() {
  const [tracks, setTracks] = useState<Track[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [crossfadeEnabled, setCrossfadeEnabled] = useState(true);
  const [crossfadeDuration, setCrossfadeDuration] = useState(3);
  const [fadeCurve, setFadeCurve] = useState<FadeCurve>('equal-power');
  const [volume, setVolume] = useState(1);
  const [view, setView] = useState<'player' | 'library' | 'playlist-detail'>('player');
  const [libraryTab, setLibraryTab] = useState<'tracks' | 'playlists'>('tracks');
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [activePlaylistId, setActivePlaylistId] = useState<string | null>(null);
  const [selectedPlaylistId, setSelectedPlaylistId] = useState<string | null>(null);
  const [showAddToPlaylist, setShowAddToPlaylist] = useState<string | null>(null);
  const [isCreatingPlaylist, setIsCreatingPlaylist] = useState(false);
  const [newPlaylistName, setNewPlaylistName] = useState('');
  const [isSelectingForPlaylist, setIsSelectingForPlaylist] = useState(false);

  const audio1Ref = useRef<HTMLAudioElement>(null);
  const audio2Ref = useRef<HTMLAudioElement>(null);
  const activeAudioRef = useRef<1 | 2>(1);
  const isCrossfading = useRef(false);
  const fadeIntervals = useRef<(() => void)[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const getActiveQueue = () => {
    if (activePlaylistId) {
      const pl = playlists.find(p => p.id === activePlaylistId);
      if (pl) return pl.trackIds.map(id => tracks.find(t => t.id === id)).filter(Boolean) as Track[];
    }
    return tracks;
  };

  const playTrack = (index: number, crossfade: boolean = true, forcePlay: boolean = false, playlistId: string | null = activePlaylistId) => {
    const queue = playlistId ? (playlists.find(p => p.id === playlistId)?.trackIds.map(id => tracks.find(t => t.id === id)).filter(Boolean) as Track[]) : tracks;
    const nextTrack = queue[index];
    if (!nextTrack) return;

    if (playlistId !== activePlaylistId) {
      setActivePlaylistId(playlistId);
    }

    const currentAudio = activeAudioRef.current === 1 ? audio1Ref.current : audio2Ref.current;
    const nextAudio = activeAudioRef.current === 1 ? audio2Ref.current : audio1Ref.current;

    if (!currentAudio || !nextAudio) return;

    fadeIntervals.current.forEach(clear => clear());
    fadeIntervals.current = [];

    nextAudio.src = nextTrack.url;
    const shouldPlay = isPlaying || forcePlay;

    if (crossfade && shouldPlay && currentAudio.src && !currentAudio.paused) {
      const durationMs = crossfadeDuration * 1000;
      nextAudio.volume = 0;

      const clearOut = fadeAudio(currentAudio, 'out', durationMs, currentAudio.volume, fadeCurve, () => {
        currentAudio.pause();
        
        nextAudio.play().catch(console.error);
        const clearIn = fadeAudio(nextAudio, 'in', durationMs, volume, fadeCurve);
        fadeIntervals.current = [clearIn];
      });

      fadeIntervals.current = [clearOut];
    } else {
      currentAudio.pause();
      nextAudio.volume = volume;
      if (shouldPlay) nextAudio.play().catch(console.error);
    }

    activeAudioRef.current = activeAudioRef.current === 1 ? 2 : 1;
    setCurrentIndex(index);
    if (forcePlay) setIsPlaying(true);
    isCrossfading.current = false;
  };

  const handleNext = (auto = false) => {
    const queue = getActiveQueue();
    if (queue.length === 0) return;
    const nextIndex = (currentIndex + 1) % queue.length;
    playTrack(nextIndex, crossfadeEnabled, auto ? true : false, activePlaylistId);
  };

  const handlePrev = () => {
    const queue = getActiveQueue();
    if (queue.length === 0) return;
    const currentAudio = activeAudioRef.current === 1 ? audio1Ref.current : audio2Ref.current;
    if (currentAudio && currentAudio.currentTime > 3) {
      currentAudio.currentTime = 0;
      return;
    }
    const prevIndex = (currentIndex - 1 + queue.length) % queue.length;
    playTrack(prevIndex, crossfadeEnabled, false, activePlaylistId);
  };

  const togglePlay = () => {
    const currentAudio = activeAudioRef.current === 1 ? audio1Ref.current : audio2Ref.current;
    const nextAudio = activeAudioRef.current === 1 ? audio2Ref.current : audio1Ref.current;

    if (isPlaying) {
      currentAudio?.pause();
      nextAudio?.pause();
      fadeIntervals.current.forEach(clear => clear());
      fadeIntervals.current = [];
    } else {
      if (currentAudio && !currentAudio.src && getActiveQueue().length > 0) {
         playTrack(currentIndex, false, true, activePlaylistId);
         return;
      }
      if (currentAudio) {
        currentAudio.volume = volume;
        currentAudio.play().catch(console.error);
      }
    }
    setIsPlaying(!isPlaying);
  };

  const onTimeUpdate = (audioNum: 1 | 2) => {
    if (audioNum === activeAudioRef.current) {
      const audio = audioNum === 1 ? audio1Ref.current : audio2Ref.current;
      if (!audio) return;
      setProgress(audio.currentTime);
      setDuration(audio.duration || 0);

      if (crossfadeEnabled && audio.duration && audio.currentTime >= audio.duration - crossfadeDuration) {
        if (!isCrossfading.current) {
          isCrossfading.current = true;
          handleNext(true);
        }
      }
    }
  };

  const onEnded = (audioNum: 1 | 2) => {
    if (audioNum === activeAudioRef.current && !crossfadeEnabled) {
      handleNext(true);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []) as File[];
    const flacFiles = files.filter(f => f.name.toLowerCase().endsWith('.flac') || f.type === 'audio/flac');

    if (flacFiles.length === 0) {
      alert("Please select .flac files.");
      return;
    }

    const newTracks = flacFiles.map(file => ({
      id: Math.random().toString(36).substring(7),
      file,
      url: URL.createObjectURL(file),
      name: file.name.replace(/\.flac$/i, ''),
      artist: 'Unknown Artist'
    }));

    setTracks(prev => {
      const updated = [...prev, ...newTracks];
      if (prev.length === 0 && updated.length > 0) {
        setTimeout(() => {
           setCurrentIndex(0);
           const currentAudio = activeAudioRef.current === 1 ? audio1Ref.current : audio2Ref.current;
           if (currentAudio) {
             currentAudio.src = updated[0].url;
             currentAudio.volume = volume;
           }
        }, 0);
      }
      return updated;
    });
  };

  const handleSelectTrack = (index: number, playlistId: string | null = null) => {
    if (index === currentIndex && playlistId === activePlaylistId) {
      if (!isPlaying) togglePlay();
      setView('player');
      return;
    }
    playTrack(index, crossfadeEnabled, true, playlistId);
    setView('player');
  };

  const handleCreatePlaylist = (e: React.FormEvent) => {
    e.preventDefault();
    if (newPlaylistName.trim()) {
      setPlaylists([...playlists, { id: Math.random().toString(36).substring(7), name: newPlaylistName.trim(), trackIds: [] }]);
      setNewPlaylistName('');
      setIsCreatingPlaylist(false);
    }
  };

  const deletePlaylist = (playlistId: string) => {
    setPlaylists(playlists.filter(p => p.id !== playlistId));
    if (activePlaylistId === playlistId) {
      setActivePlaylistId(null);
    }
    if (selectedPlaylistId === playlistId) {
      setLibraryTab('playlists');
      setView('library');
      setSelectedPlaylistId(null);
    }
  };

  const removeFromPlaylist = (playlistId: string, trackId: string) => {
    setPlaylists(playlists.map(p => {
      if (p.id === playlistId) {
        return { ...p, trackIds: p.trackIds.filter(id => id !== trackId) };
      }
      return p;
    }));
  };

  const addToPlaylist = (playlistId: string, trackId: string) => {
    setPlaylists(playlists.map(p => {
      if (p.id === playlistId && !p.trackIds.includes(trackId)) {
        return { ...p, trackIds: [...p.trackIds, trackId] };
      }
      return p;
    }));
    setShowAddToPlaylist(null);
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVol = Number(e.target.value);
    setVolume(newVol);
    const currentAudio = activeAudioRef.current === 1 ? audio1Ref.current : audio2Ref.current;
    if (currentAudio && fadeIntervals.current.length === 0) {
       currentAudio.volume = newVol;
    }
  };

  const currentTrack = getActiveQueue()[currentIndex];

  const renderPlayer = () => (
    <div className="flex flex-col h-full">
      {/* Player Section */}
      <div className="flex flex-col flex-[2] p-6 min-h-0 overflow-y-auto">
        {/* Top Bar */}
        <div className="flex justify-between items-center mb-4 shrink-0">
          <button onClick={() => { setLibraryTab('tracks'); setView('library'); setIsSelectingForPlaylist(false); }} className="p-2 -ml-2 text-white/70 hover:text-white transition-colors">
            <ListMusic size={24} />
          </button>
          <span className="text-xs font-semibold tracking-widest uppercase text-white/50">
            {activePlaylistId ? playlists.find(p => p.id === activePlaylistId)?.name : 'All Tracks'}
          </span>
          <button onClick={() => { setLibraryTab('playlists'); setView('library'); setIsSelectingForPlaylist(false); }} className="p-2 -mr-2 text-white/70 hover:text-white transition-colors">
            <FolderHeart size={24} />
          </button>
        </div>

        {/* Artwork */}
        <div className="flex-1 flex items-center justify-center mb-4 min-h-0 shrink">
          <div className="w-full max-w-[240px] aspect-square bg-gradient-to-br from-white/10 to-white/5 rounded-3xl shadow-2xl border border-white/10 flex items-center justify-center overflow-hidden relative">
          {currentTrack ? (
             <Music size={80} className="text-white/20" />
          ) : (
             <div className="text-center p-6">
               <Music size={48} className="mx-auto mb-4 text-white/20" />
               <p className="text-white/50 text-sm">No FLAC files loaded</p>
               <button 
                 onClick={() => { setLibraryTab('tracks'); setView('library'); setIsSelectingForPlaylist(false); }}
                 className="mt-4 px-4 py-2 bg-white/10 hover:bg-white/20 rounded-full text-sm transition-colors"
               >
                 Go to Library
               </button>
             </div>
          )}
        </div>
      </div>

        {/* Track Info */}
        <div className="mb-4 shrink-0">
          <h2 className="text-xl font-bold truncate">{currentTrack ? currentTrack.name : 'Not Playing'}</h2>
          <p className="text-base text-white/50 truncate">{currentTrack ? currentTrack.artist : '--'}</p>
        </div>

        {/* Progress */}
        <div className="mb-4 shrink-0">
        <input
          type="range"
          min={0}
          max={duration || 100}
          value={progress}
          onChange={(e) => {
            const audio = activeAudioRef.current === 1 ? audio1Ref.current : audio2Ref.current;
            if (audio) {
              audio.currentTime = Number(e.target.value);
              setProgress(Number(e.target.value));
            }
          }}
          className="w-full h-1.5 bg-white/20 rounded-full appearance-none [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:rounded-full cursor-pointer"
        />
        <div className="flex justify-between text-xs text-white/50 mt-2 font-mono">
          <span>{formatTime(progress)}</span>
          <span>-{formatTime(duration - progress)}</span>
        </div>
      </div>

        {/* Controls */}
        <div className="flex items-center justify-between mb-4 px-4 shrink-0">
          <button onClick={handlePrev} className="p-2 text-white/80 hover:text-white transition-colors">
            <SkipBack size={28} fill="currentColor" />
          </button>
          <button
            onClick={togglePlay}
            className="w-16 h-16 flex items-center justify-center bg-white text-black rounded-full hover:scale-105 active:scale-95 transition-all shadow-xl"
          >
            {isPlaying ? <Pause size={28} fill="currentColor" /> : <Play size={28} fill="currentColor" className="ml-1" />}
          </button>
          <button onClick={() => handleNext(false)} className="p-2 text-white/80 hover:text-white transition-colors">
            <SkipForward size={28} fill="currentColor" />
          </button>
        </div>

        {/* Volume Slider */}
        <div className="flex items-center gap-3 mb-4 px-2 shrink-0">
        <VolumeX size={16} className="text-white/50" />
        <input
          type="range"
          min={0}
          max={1}
          step={0.01}
          value={volume}
          onChange={handleVolumeChange}
          className="flex-1 h-1.5 bg-white/20 rounded-full appearance-none [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:rounded-full cursor-pointer"
        />
        <Volume2 size={16} className="text-white/50" />
      </div>

        {/* Bottom Bar (Crossfade Settings) */}
        <div className="mt-auto pt-4 border-t border-white/10 flex flex-col gap-3 shrink-0">
           <div className="flex items-center justify-between">
           <div className="flex items-center gap-3">
              <Repeat size={18} className={crossfadeEnabled ? "text-pink-500" : "text-white/30"} />
              <span className="text-sm text-white/70">Crossfade</span>
           </div>
           <button
             onClick={() => setCrossfadeEnabled(!crossfadeEnabled)}
             className={`w-12 h-6 rounded-full transition-colors relative ${crossfadeEnabled ? 'bg-pink-500' : 'bg-white/20'}`}
           >
             <div className={`w-5 h-5 bg-white rounded-full absolute top-0.5 transition-transform ${crossfadeEnabled ? 'translate-x-6' : 'translate-x-0.5'}`} />
           </button>
         </div>
         {crossfadeEnabled && (
           <div className="flex flex-col gap-3 px-1 mt-2">
             <div className="flex items-center gap-3">
               <span className="text-xs text-white/50 w-4">1s</span>
               <input
                 type="range"
                 min={1}
                 max={12}
                 step={1}
                 value={crossfadeDuration}
                 onChange={(e) => setCrossfadeDuration(Number(e.target.value))}
                 className="flex-1 h-1.5 bg-white/20 rounded-full appearance-none [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:rounded-full cursor-pointer"
               />
               <span className="text-xs text-white/50 w-6 text-right">{crossfadeDuration}s</span>
             </div>
             <div className="flex justify-between items-center mt-1">
               <span className="text-xs text-white/50">Curve</span>
               <div className="flex bg-white/10 rounded-lg p-0.5">
                 {(['linear', 'equal-power', 'quadratic'] as FadeCurve[]).map(c => (
                   <button
                     key={c}
                     onClick={() => setFadeCurve(c)}
                     className={`text-[10px] px-2 py-1 rounded-md uppercase tracking-wider transition-colors ${fadeCurve === c ? 'bg-white/20 text-white font-semibold' : 'text-white/50 hover:text-white/80'}`}
                   >
                     {c.replace('-', ' ')}
                   </button>
                 ))}
               </div>
             </div>
           </div>
         )}
        </div>
      </div>

      {/* Queue Section (1/3) */}
      <div className="flex-[1] flex flex-col bg-black/40 border-t border-white/10 min-h-0">
        <div className="px-4 py-3 text-xs font-semibold text-white/50 uppercase tracking-wider sticky top-0 bg-black/40 backdrop-blur-md z-10 flex justify-between items-center">
          <span>{activePlaylistId ? playlists.find(p => p.id === activePlaylistId)?.name : 'Up Next'}</span>
          <span>{getActiveQueue().length} tracks</span>
        </div>
        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {getActiveQueue().map((track, index) => (
            <button
              key={`${track.id}-${index}`}
              onClick={() => handleSelectTrack(index, activePlaylistId)}
              className={`w-full flex items-center text-left p-2 rounded-lg transition-colors ${index === currentIndex ? 'bg-white/10' : 'hover:bg-white/5'}`}
            >
              <div className="w-8 h-8 bg-white/10 rounded flex items-center justify-center mr-3 shrink-0">
                {index === currentIndex && isPlaying ? (
                  <div className="flex gap-0.5 items-end h-3">
                    <div className="w-0.5 bg-pink-500 animate-eq h-full" />
                    <div className="w-0.5 bg-pink-500 animate-eq-delay-1 h-2/3" />
                    <div className="w-0.5 bg-pink-500 animate-eq-delay-2 h-4/5" />
                  </div>
                ) : (
                  <Music size={14} className={index === currentIndex ? "text-pink-500" : "text-white/50"} />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className={`truncate text-sm font-medium ${index === currentIndex ? 'text-pink-500' : 'text-white'}`}>
                  {track.name}
                </p>
                <p className="truncate text-xs text-white/50">{track.artist}</p>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );

  const renderLibrary = () => (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-6 pb-4 border-b border-white/10 flex justify-between items-center sticky top-0 bg-black/20 backdrop-blur-md z-10">
        <h1 className="text-2xl font-bold">{isSelectingForPlaylist ? 'Add Tracks' : 'Library'}</h1>
        <div className="flex items-center gap-4">
          {!isSelectingForPlaylist && libraryTab === 'playlists' && (
            <button onClick={() => setIsCreatingPlaylist(true)} className="text-pink-500 hover:text-pink-400 transition-colors">
              <Plus size={24} />
            </button>
          )}
          <button onClick={() => {
            if (isSelectingForPlaylist) {
              setIsSelectingForPlaylist(false);
              setView('playlist-detail');
            } else {
              setView('player');
            }
          }} className="text-pink-500 font-medium hover:text-pink-400 transition-colors">
            Done
          </button>
        </div>
      </div>

      {/* Tabs */}
      {!isSelectingForPlaylist && (
        <div className="px-4 pt-4 shrink-0">
          <div className="flex p-1 bg-white/10 rounded-xl">
            <button 
              onClick={() => setLibraryTab('tracks')}
              className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${libraryTab === 'tracks' ? 'bg-white/20 text-white shadow-sm' : 'text-white/50 hover:text-white/80'}`}
            >
              Tracks
            </button>
            <button 
              onClick={() => setLibraryTab('playlists')}
              className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${libraryTab === 'playlists' ? 'bg-white/20 text-white shadow-sm' : 'text-white/50 hover:text-white/80'}`}
            >
              Playlists
            </button>
          </div>
        </div>
      )}

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-2 relative">
        {libraryTab === 'tracks' ? (
          tracks.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-white/50 space-y-4">
              <Music size={48} className="opacity-50" />
              <p>No tracks in library</p>
            </div>
          ) : (
            tracks.map((track, index) => {
              const isSelected = isSelectingForPlaylist && selectedPlaylistId && playlists.find(p => p.id === selectedPlaylistId)?.trackIds.includes(track.id);
              return (
              <div key={track.id} className="relative">
                <div className={`w-full flex items-center text-left p-3 rounded-xl transition-colors ${!isSelectingForPlaylist && index === currentIndex && activePlaylistId === null ? 'bg-white/10' : 'hover:bg-white/5'}`}>
                  <button 
                    onClick={() => {
                      if (isSelectingForPlaylist && selectedPlaylistId) {
                        if (isSelected) {
                          removeFromPlaylist(selectedPlaylistId, track.id);
                        } else {
                          addToPlaylist(selectedPlaylistId, track.id);
                        }
                      } else {
                        handleSelectTrack(index, null);
                      }
                    }} 
                    className="flex-1 flex items-center min-w-0"
                  >
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center mr-4 shrink-0 ${isSelected ? 'bg-pink-500 text-white' : 'bg-white/10 text-white/50'}`}>
                      {isSelectingForPlaylist ? (
                        isSelected ? <Check size={20} /> : <Plus size={20} />
                      ) : index === currentIndex && activePlaylistId === null && isPlaying ? (
                        <div className="flex gap-0.5 items-end h-4">
                          <div className="w-1 bg-pink-500 animate-eq h-full" />
                          <div className="w-1 bg-pink-500 animate-eq-delay-1 h-2/3" />
                          <div className="w-1 bg-pink-500 animate-eq-delay-2 h-4/5" />
                        </div>
                      ) : (
                        <Music size={20} className={isSelected ? "text-white" : "text-white/50"} />
                      )}
                    </div>
                    <div className="flex-1 min-w-0 text-left">
                      <p className={`truncate font-medium ${!isSelectingForPlaylist && index === currentIndex && activePlaylistId === null ? 'text-pink-500' : 'text-white'}`}>
                        {track.name}
                      </p>
                      <p className="truncate text-sm text-white/50">{track.artist}</p>
                    </div>
                  </button>
                  {!isSelectingForPlaylist && (
                    <button 
                      onClick={() => setShowAddToPlaylist(showAddToPlaylist === track.id ? null : track.id)}
                      className="p-2 text-white/50 hover:text-white transition-colors ml-2"
                    >
                      <MoreVertical size={20} />
                    </button>
                  )}
                </div>
                
                {showAddToPlaylist === track.id && (
                  <div className="absolute right-12 top-10 bg-zinc-900 border border-white/10 rounded-xl shadow-2xl z-20 w-48 overflow-hidden">
                    <div className="px-3 py-2 text-xs font-semibold text-white/50 border-b border-white/10 uppercase tracking-wider">
                      Add to Playlist
                    </div>
                    <div className="max-h-48 overflow-y-auto">
                      {playlists.length === 0 ? (
                        <div className="px-3 py-4 text-sm text-white/50 text-center">No playlists</div>
                      ) : (
                        playlists.map(p => (
                          <button 
                            key={p.id}
                            onClick={() => addToPlaylist(p.id, track.id)}
                            className="w-full text-left px-3 py-2 text-sm hover:bg-white/10 transition-colors truncate"
                          >
                            {p.name}
                          </button>
                        ))
                      )}
                    </div>
                    <button 
                      onClick={() => { setIsCreatingPlaylist(true); setShowAddToPlaylist(null); }}
                      className="w-full text-left px-3 py-2 text-sm text-pink-500 hover:bg-white/10 transition-colors border-t border-white/10"
                    >
                      + New Playlist
                    </button>
                  </div>
                )}
              </div>
            )})
          )
        ) : (
          playlists.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-white/50 space-y-4">
              <FolderHeart size={48} className="opacity-50" />
              <p>No playlists yet</p>
              <button onClick={() => setIsCreatingPlaylist(true)} className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-full text-sm transition-colors">
                Create Playlist
              </button>
            </div>
          ) : (
            playlists.map(playlist => (
              <div key={playlist.id} className="w-full flex items-center p-3 rounded-xl hover:bg-white/5 transition-colors group">
                <button
                  onClick={() => { setSelectedPlaylistId(playlist.id); setView('playlist-detail'); }}
                  className="flex-1 flex items-center text-left min-w-0"
                >
                  <div className="w-12 h-12 bg-white/10 rounded-lg flex items-center justify-center mr-4 shrink-0">
                    <FolderHeart size={24} className="text-white/50" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="truncate font-medium text-white">{playlist.name}</p>
                    <p className="truncate text-sm text-white/50">{playlist.trackIds.length} tracks</p>
                  </div>
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); deletePlaylist(playlist.id); }}
                  className="p-3 text-white/30 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all"
                  title="Delete Playlist"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            ))
          )
        )}
      </div>

      {/* Add Button */}
      {!isSelectingForPlaylist && libraryTab === 'tracks' && (
        <div className="p-6 border-t border-white/10 bg-black/20 backdrop-blur-md shrink-0">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileUpload}
            accept=".flac,audio/flac"
            multiple
            className="hidden"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            className="w-full py-4 bg-white/10 hover:bg-white/20 text-white rounded-xl font-semibold flex items-center justify-center gap-2 transition-colors"
          >
            <Plus size={20} />
            Add FLAC Files
          </button>
        </div>
      )}
    </div>
  );

  const renderPlaylistDetail = () => {
    const playlist = playlists.find(p => p.id === selectedPlaylistId);
    if (!playlist) return null;
    const playlistTracks = playlist.trackIds.map(id => tracks.find(t => t.id === id)).filter(Boolean) as Track[];

    return (
      <div className="flex flex-col h-full">
        <div className="p-6 pb-4 border-b border-white/10 flex justify-between items-center sticky top-0 bg-black/20 backdrop-blur-md z-10">
          <div className="flex items-center gap-3">
            <button onClick={() => { setLibraryTab('playlists'); setView('library'); }} className="text-white/70 hover:text-white transition-colors">
              <ArrowLeft size={24} />
            </button>
            <h1 className="text-2xl font-bold truncate">{playlist.name}</h1>
          </div>
          <div className="flex items-center gap-4">
            <button onClick={() => { setLibraryTab('tracks'); setView('library'); setIsSelectingForPlaylist(true); }} className="text-pink-500 hover:text-pink-400 transition-colors">
              <Plus size={24} />
            </button>
            <button onClick={() => setView('player')} className="text-pink-500 font-medium hover:text-pink-400 transition-colors">
              Done
            </button>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {playlistTracks.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-white/50 space-y-4">
              <Music size={48} className="opacity-50" />
              <p>Playlist is empty</p>
              <button onClick={() => { setLibraryTab('tracks'); setView('library'); setIsSelectingForPlaylist(true); }} className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-full text-sm transition-colors">
                Add from Library
              </button>
            </div>
          ) : (
            playlistTracks.map((track, index) => (
              <div key={`${track.id}-${index}`} className={`w-full flex items-center p-3 rounded-xl transition-colors group ${index === currentIndex && activePlaylistId === playlist.id ? 'bg-white/10' : 'hover:bg-white/5'}`}>
                <button
                  onClick={() => handleSelectTrack(index, playlist.id)}
                  className="flex-1 flex items-center text-left min-w-0"
                >
                  <div className="w-10 h-10 bg-white/10 rounded-lg flex items-center justify-center mr-4 shrink-0">
                    {index === currentIndex && activePlaylistId === playlist.id && isPlaying ? (
                      <div className="flex gap-0.5 items-end h-4">
                        <div className="w-1 bg-pink-500 animate-eq h-full" />
                        <div className="w-1 bg-pink-500 animate-eq-delay-1 h-2/3" />
                        <div className="w-1 bg-pink-500 animate-eq-delay-2 h-4/5" />
                      </div>
                    ) : (
                      <Music size={20} className="text-white/50" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`truncate font-medium ${index === currentIndex && activePlaylistId === playlist.id ? 'text-pink-500' : 'text-white'}`}>
                      {track.name}
                    </p>
                    <p className="truncate text-sm text-white/50">{track.artist}</p>
                  </div>
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); removeFromPlaylist(playlist.id, track.id); }}
                  className="p-2 text-white/30 hover:text-white opacity-0 group-hover:opacity-100 transition-all ml-2"
                  title="Remove from Playlist"
                >
                  <X size={18} />
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-black text-white font-sans selection:bg-pink-500/30 overflow-hidden">
      {/* Hidden Audio Elements */}
      <audio ref={audio1Ref} onTimeUpdate={() => onTimeUpdate(1)} onEnded={() => onEnded(1)} />
      <audio ref={audio2Ref} onTimeUpdate={() => onTimeUpdate(2)} onEnded={() => onEnded(2)} />

      {/* Background */}
      <div className="fixed inset-0 z-0 opacity-40 pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-900 via-purple-900 to-black blur-3xl" />
      </div>

      {/* Main Container */}
      <div className="relative z-10 flex flex-col h-[100dvh] max-w-md mx-auto bg-black/40 backdrop-blur-2xl sm:border-x border-white/10 shadow-2xl">
         {view === 'player' && renderPlayer()}
         {view === 'library' && renderLibrary()}
         {view === 'playlist-detail' && renderPlaylistDetail()}
      </div>

      {/* Create Playlist Modal */}
      {isCreatingPlaylist && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <form onSubmit={handleCreatePlaylist} className="bg-zinc-900 border border-white/10 p-6 rounded-2xl w-full max-w-xs shadow-2xl">
            <h3 className="text-lg font-bold mb-4">New Playlist</h3>
            <input
              type="text"
              autoFocus
              value={newPlaylistName}
              onChange={e => setNewPlaylistName(e.target.value)}
              placeholder="Playlist name"
              className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:border-pink-500 transition-colors mb-6"
            />
            <div className="flex justify-end gap-3">
              <button type="button" onClick={() => setIsCreatingPlaylist(false)} className="px-4 py-2 text-white/50 hover:text-white transition-colors">Cancel</button>
              <button type="submit" disabled={!newPlaylistName.trim()} className="px-4 py-2 bg-pink-500 text-white rounded-xl font-medium disabled:opacity-50 disabled:cursor-not-allowed">Create</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

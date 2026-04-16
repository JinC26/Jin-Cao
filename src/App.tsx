/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect } from 'react';
import { get, set, del, clear } from 'idb-keyval';
import { motion, AnimatePresence, Reorder, useDragControls } from 'motion/react';
import { Play, Pause, SkipForward, SkipBack, ListMusic, Plus, Volume2, VolumeX, Music, Repeat, FolderHeart, ArrowLeft, MoreVertical, Trash2, X, Check, Shuffle, Settings, Tag, GripVertical, Edit2 } from 'lucide-react';

interface Track {
  id: string;
  data?: ArrayBuffer; // Optional, only used during transfer
  url: string;
  name: string;
  artist: string;
  type: string;
  tags?: string[];
  startTime?: number;
  endTime?: number;
  duration?: number;
  isCorrupted?: boolean;
}

interface Playlist {
  id: string;
  name: string;
  trackIds: string[];
}

const ReorderableTrackItem = ({ 
  track, 
  index, 
  currentIndex, 
  activePlaylistId, 
  isSelectingForPlaylist, 
  selectedPlaylistId, 
  playlists, 
  isPlaying, 
  showAddToPlaylist, 
  setShowAddToPlaylist, 
  addToPlaylist, 
  removeFromPlaylist, 
  handleSelectTrack, 
  setTaggingTrackId, 
  setEditingTrackId, 
  setEditingTrackName, 
  setTrimmingTrackId, 
  setTrimStart, 
  setTrimEnd, 
  deleteTrack 
}: any) => {
  const controls = useDragControls();
  const isSelected = isSelectingForPlaylist && selectedPlaylistId && playlists.find((p: any) => p.id === selectedPlaylistId)?.trackIds.includes(track.id);

  return (
    <Reorder.Item 
      value={track} 
      className="relative"
      dragListener={false}
      dragControls={controls}
    >
      <div className={`w-full flex items-center text-left p-3 rounded-2xl transition-all duration-300 ${!isSelectingForPlaylist && index === currentIndex && activePlaylistId === null ? 'glass border-emerald-500/30' : 'hover:bg-white/5'}`}>
        {!isSelectingForPlaylist && (
          <div 
            className="p-1 mr-1 cursor-grab active:cursor-grabbing text-white/20 hover:text-emerald-400 transition-colors shrink-0 touch-none"
            onPointerDown={(e) => controls.start(e)}
          >
            <GripVertical size={16} />
          </div>
        )}
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
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center mr-4 shrink-0 transition-all duration-500 ${isSelected ? 'bg-emerald-500 text-black shadow-[0_0_20px_rgba(16,185,129,0.4)]' : 'bg-white/5 text-white/50'}`}>
            {isSelectingForPlaylist ? (
              isSelected ? <Check size={20} strokeWidth={3} /> : <Plus size={20} />
            ) : index === currentIndex && activePlaylistId === null && isPlaying ? (
              <div className="flex gap-0.5 items-end h-4">
                <div className="w-1 bg-emerald-400 animate-eq h-full" />
                <div className="w-1 bg-emerald-400 animate-eq-delay-1 h-2/3" />
                <div className="w-1 bg-emerald-400 animate-eq-delay-2 h-4/5" />
              </div>
            ) : (
              <Music size={20} className={isSelected ? "text-black" : "text-white/50"} />
            )}
          </div>
          <div className="flex-1 min-w-0 text-left">
            <p className={`truncate text-sm font-display font-semibold tracking-tight ${!isSelectingForPlaylist && index === currentIndex && activePlaylistId === null ? 'text-emerald-400' : 'text-white'}`}>
              {track.name}
              {track.isCorrupted && <span className="ml-2 text-[10px] text-rose-500 font-bold uppercase tracking-widest">! Missing Data</span>}
            </p>
            <div className="flex items-center gap-2 overflow-hidden">
              {track.artist && track.artist !== 'Unknown Artist' && (
                <p className="truncate text-[10px] uppercase tracking-widest text-white/40 font-medium shrink-0">{track.artist}</p>
              )}
              {track.tags && track.tags.length > 0 && (
                <div className="flex gap-1 overflow-hidden">
                  {track.tags.map((tag: string) => (
                    <span key={tag} className="text-[8px] px-2 py-0.5 bg-emerald-500/10 text-emerald-400/60 rounded-full whitespace-nowrap border border-emerald-500/20 font-bold uppercase tracking-tighter">
                      {tag}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        </button>
        {!isSelectingForPlaylist && (
          <button 
            onClick={(e) => { e.stopPropagation(); setShowAddToPlaylist(showAddToPlaylist === track.id ? null : track.id); }}
            className="p-2 text-white/30 hover:text-emerald-400 transition-colors ml-2 more-button"
          >
            <MoreVertical size={20} />
          </button>
        )}
      </div>
      
      {showAddToPlaylist === track.id && (
        <div className="absolute right-12 top-10 glass-dark rounded-2xl shadow-2xl z-20 w-52 overflow-hidden track-menu-container animate-in fade-in zoom-in duration-200">
          <div className="px-4 py-3 text-[10px] font-bold text-emerald-400/60 border-b border-white/5 uppercase tracking-[0.2em] font-display">
            Track Options
          </div>
          <div className="max-h-48 overflow-y-auto">
            {playlists.length === 0 ? (
              <div className="px-3 py-4 text-xs text-white/50 text-center">No playlists</div>
            ) : (
              playlists.map((p: any) => (
                <button 
                  key={p.id}
                  onClick={() => addToPlaylist(p.id, track.id)}
                  className="w-full text-left px-3 py-2 text-xs hover:bg-white/10 transition-colors truncate"
                >
                  {p.name}
                </button>
              ))
            )}
          </div>
          <button 
            onClick={() => { setTaggingTrackId(track.id); setShowAddToPlaylist(null); }}
            className="w-full text-left px-3 py-2 text-xs text-white/70 hover:bg-white/10 transition-colors border-t border-white/10 flex items-center gap-2"
          >
            <Tag size={12} />
            Manage Tags
          </button>
          <button 
            onClick={() => { setEditingTrackId(track.id); setEditingTrackName(track.name); setShowAddToPlaylist(null); }}
            className="w-full text-left px-3 py-2 text-xs text-white/70 hover:bg-white/10 transition-colors border-t border-white/10 flex items-center gap-2"
          >
            <Edit2 size={12} />
            Edit Name
          </button>
          <button 
            onClick={() => { 
              setTrimmingTrackId(track.id); 
              setTrimStart((track.startTime || 0).toString());
              setTrimEnd((track.endTime || 0).toString());
              setShowAddToPlaylist(null); 
            }}
            className="w-full text-left px-3 py-2 text-xs text-white/70 hover:bg-white/10 transition-colors border-t border-white/10 flex items-center gap-2"
          >
            <Settings size={12} />
            Set Play Range
          </button>
          <button 
            onClick={() => {
              deleteTrack(track.id);
              setShowAddToPlaylist(null);
            }}
            className="w-full text-left px-3 py-2 text-xs text-red-400 hover:bg-red-500/20 transition-colors border-t border-white/10 flex items-center gap-2"
          >
            <Trash2 size={12} />
            Delete Track
          </button>
        </div>
      )}
    </Reorder.Item>
  );
};

const ReorderablePlaylistTrackItem = ({ 
  track, 
  index, 
  currentIndex, 
  activePlaylistId, 
  playlist, 
  isPlaying, 
  showAddToPlaylist, 
  setShowAddToPlaylist, 
  handleSelectTrack, 
  setTaggingTrackId, 
  setEditingTrackId, 
  setEditingTrackName, 
  setTrimmingTrackId, 
  setTrimStart, 
  setTrimEnd, 
  removeFromPlaylist 
}: any) => {
  const controls = useDragControls();
  
  return (
    <Reorder.Item 
      value={track} 
      className={`w-full flex items-center p-3 rounded-2xl transition-all duration-300 group ${index === currentIndex && activePlaylistId === playlist.id ? 'glass border-emerald-500/30' : 'hover:bg-white/5'}`}
      dragListener={false}
      dragControls={controls}
    >
      <div 
        className="p-1 mr-1 cursor-grab active:cursor-grabbing text-white/20 hover:text-emerald-400 transition-colors shrink-0 touch-none"
        onPointerDown={(e) => controls.start(e)}
      >
        <GripVertical size={16} />
      </div>
      <button
        onClick={() => handleSelectTrack(index, playlist.id)}
        className="flex-1 flex items-center text-left min-w-0"
      >
        <div className="w-10 h-10 bg-white/5 rounded-xl flex items-center justify-center mr-4 shrink-0 transition-all duration-500">
          {index === currentIndex && activePlaylistId === playlist.id && isPlaying ? (
            <div className="flex gap-0.5 items-end h-4">
              <div className="w-1 bg-emerald-400 animate-eq h-full" />
              <div className="w-1 bg-emerald-400 animate-eq-delay-1 h-2/3" />
              <div className="w-1 bg-emerald-400 animate-eq-delay-2 h-4/5" />
            </div>
          ) : (
            <Music size={20} className="text-white/30" />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <p className={`truncate text-sm font-display font-semibold tracking-tight ${index === currentIndex && activePlaylistId === playlist.id ? 'text-emerald-400' : 'text-white'}`}>
            {track.name}
          </p>
          <div className="flex items-center gap-2 overflow-hidden">
            {track.artist && track.artist !== 'Unknown Artist' && (
              <p className="truncate text-[10px] uppercase tracking-widest text-white/40 font-medium shrink-0">{track.artist}</p>
            )}
            {track.tags && track.tags.length > 0 && (
              <div className="flex gap-1 overflow-hidden">
                {track.tags.map((tag: string) => (
                  <span key={tag} className="text-[8px] px-2 py-0.5 bg-emerald-500/10 text-emerald-400/60 rounded-full whitespace-nowrap border border-emerald-500/20 font-bold uppercase tracking-tighter">
                    {tag}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      </button>
      <div className="relative flex items-center ml-2">
        <button 
          onClick={(e) => { e.stopPropagation(); setShowAddToPlaylist(showAddToPlaylist === track.id ? null : track.id); }}
          className="p-2 text-white/30 hover:text-emerald-400 transition-colors more-button"
        >
          <MoreVertical size={18} />
        </button>
        
        {showAddToPlaylist === track.id && (
          <div className="absolute right-0 top-10 glass-dark rounded-2xl shadow-2xl z-20 w-52 overflow-hidden track-menu-container animate-in fade-in zoom-in duration-200">
            <div className="px-4 py-3 text-[10px] font-bold text-emerald-400/60 border-b border-white/5 uppercase tracking-[0.2em] font-display">
              Track Options
            </div>
            <button 
              onClick={() => { setTaggingTrackId(track.id); setShowAddToPlaylist(null); }}
              className="w-full text-left px-3 py-2 text-xs text-white/70 hover:bg-white/10 transition-colors flex items-center gap-2"
            >
              <Tag size={12} />
              Manage Tags
            </button>
            <button 
              onClick={() => { setEditingTrackId(track.id); setEditingTrackName(track.name); setShowAddToPlaylist(null); }}
              className="w-full text-left px-3 py-2 text-xs text-white/70 hover:bg-white/10 transition-colors border-t border-white/10 flex items-center gap-2"
            >
              <Edit2 size={12} />
              Edit Name
            </button>
            <button 
              onClick={() => { 
                setTrimmingTrackId(track.id); 
                setTrimStart((track.startTime || 0).toString());
                setTrimEnd((track.endTime || 0).toString());
                setShowAddToPlaylist(null); 
              }}
              className="w-full text-left px-3 py-2 text-xs text-white/70 hover:bg-white/10 transition-colors border-t border-white/10 flex items-center gap-2"
            >
              <Settings size={12} />
              Set Play Range
            </button>
            <button 
              onClick={() => { removeFromPlaylist(playlist.id, track.id); setShowAddToPlaylist(null); }}
              className="w-full text-left px-3 py-2 text-xs text-red-500 hover:bg-white/10 transition-colors border-t border-white/10 flex items-center gap-2"
            >
              <X size={12} />
              Remove from Playlist
            </button>
          </div>
        )}
      </div>
    </Reorder.Item>
  );
};

type FadeCurve = 'linear' | 'equal-power' | 'quadratic';

const fadeAudio = (
  gainNode: GainNode,
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

    gainNode.gain.value = Math.max(0, Math.min(1, volMultiplier * maxVolume));

    if (t < 1) {
      animationFrameId = requestAnimationFrame(animate);
    } else {
      gainNode.gain.value = type === 'in' ? maxVolume : 0;
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
  const [overlapDuration, setOverlapDuration] = useState(1);
  const [fadeCurve, setFadeCurve] = useState<FadeCurve>('equal-power');
  const [view, setView] = useState<'player' | 'library' | 'playlist-detail'>('library');
  const [libraryTab, setLibraryTab] = useState<'tracks' | 'playlists' | 'settings'>('tracks');
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [activePlaylistId, setActivePlaylistId] = useState<string | null>(null);
  const [selectedPlaylistId, setSelectedPlaylistId] = useState<string | null>(null);
  const [showAddToPlaylist, setShowAddToPlaylist] = useState<string | null>(null);
  const [isCreatingPlaylist, setIsCreatingPlaylist] = useState(false);
  const [newPlaylistName, setNewPlaylistName] = useState('');
  const [isSelectingForPlaylist, setIsSelectingForPlaylist] = useState(false);
  const [playMode, setPlayMode] = useState<'order' | 'random' | 'repeat'>('order');
  const [taggingTrackId, setTaggingTrackId] = useState<string | null>(null);
  const [newTag, setNewTag] = useState('');
  const [editingTrackId, setEditingTrackId] = useState<string | null>(null);
  const [editingTrackName, setEditingTrackName] = useState('');
  const [trimmingTrackId, setTrimmingTrackId] = useState<string | null>(null);
  const [trimStart, setTrimStart] = useState<string>('0');
  const [trimEnd, setTrimEnd] = useState<string>('0');
  const [hasStarted, setHasStarted] = useState(false);
  const [isSeeking, setIsSeeking] = useState(false);
  const [showPlayerMenu, setShowPlayerMenu] = useState(false);
  const [isDataLoaded, setIsDataLoaded] = useState(false);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  
  const playerTrackRef = useRef<HTMLDivElement>(null);
  const miniTrackRef = useRef<HTMLDivElement>(null);

  const audio1Ref = useRef<HTMLAudioElement>(null);
  const audio2Ref = useRef<HTMLAudioElement>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const gainNode1Ref = useRef<GainNode | null>(null);
  const gainNode2Ref = useRef<GainNode | null>(null);
  const source1Ref = useRef<MediaElementAudioSourceNode | null>(null);
  const source2Ref = useRef<MediaElementAudioSourceNode | null>(null);
  const activeAudioRef = useRef<1 | 2>(1);
  const isCrossfading = useRef(false);
  const fadeIntervals = useRef<(() => void)[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        const storedSettings = await get('settings');
        let initialIndex = 0;
        let initialPlaylistId = null;
        if (storedSettings) {
          if (storedSettings.crossfadeEnabled !== undefined) setCrossfadeEnabled(storedSettings.crossfadeEnabled);
          if (storedSettings.crossfadeDuration !== undefined) setCrossfadeDuration(storedSettings.crossfadeDuration);
          if (storedSettings.overlapDuration !== undefined) setOverlapDuration(storedSettings.overlapDuration);
          if (storedSettings.fadeCurve !== undefined) setFadeCurve(storedSettings.fadeCurve);
          if (storedSettings.playMode !== undefined) setPlayMode(storedSettings.playMode);
          if (storedSettings.currentIndex !== undefined) initialIndex = storedSettings.currentIndex;
          if (storedSettings.activePlaylistId !== undefined) initialPlaylistId = storedSettings.activePlaylistId;
        }

        const storedTracks = await get('tracks');
        let loadedTracks: Track[] = [];
        if (storedTracks && Array.isArray(storedTracks)) {
          // Process tracks sequentially to avoid memory spikes during load
          for (const t of storedTracks) {
            try {
              // Handle legacy data (File objects) or new data (ArrayBuffer)
              let fileData = t.data || t.file;
              
              // If data is missing from the metadata object, try fetching from separate storage
              if (!fileData) {
                fileData = await get(`track_data_${t.id}`);
              }
              
              if (!fileData || (fileData instanceof ArrayBuffer && fileData.byteLength === 0) || (fileData instanceof File && fileData.size === 0)) {
                loadedTracks.push({ ...t, url: '', isCorrupted: true, data: undefined });
                continue;
              }

              const blob = new Blob([fileData], { type: t.type || (t.name.toLowerCase().endsWith('.mp3') ? 'audio/mpeg' : 'audio/flac') });
              loadedTracks.push({
                ...t,
                data: undefined, // CRITICAL: Discard binary data from React state
                url: URL.createObjectURL(blob),
                isCorrupted: false
              });
            } catch (err) {
              console.error(`Failed to recreate URL for track ${t.id}`, err);
              loadedTracks.push({ ...t, url: '', isCorrupted: true, data: undefined });
            }
          }
          setTracks(loadedTracks);
        }

        const storedPlaylists = await get('playlists');
        if (storedPlaylists && Array.isArray(storedPlaylists)) {
          setPlaylists(storedPlaylists);
        }

        if (initialPlaylistId) setActivePlaylistId(initialPlaylistId);

        // Initialize track if available
        if (loadedTracks.length > 0) {
          let queue = loadedTracks;
          if (initialPlaylistId) {
            const pl = storedPlaylists?.find((p: any) => p.id === initialPlaylistId);
            if (pl) {
              queue = pl.trackIds.map((id: string) => loadedTracks.find(t => t.id === id)).filter(Boolean);
            }
          }

          const validIndex = initialIndex < queue.length ? initialIndex : 0;
          const initialTrack = queue[validIndex];
          
          setCurrentIndex(validIndex);
          
          if (initialTrack) {
            setTimeout(() => {
              const currentAudio = activeAudioRef.current === 1 ? audio1Ref.current : audio2Ref.current;
              const currentGain = activeAudioRef.current === 1 ? gainNode1Ref.current : gainNode2Ref.current;
              if (currentAudio && initialTrack.url) {
                currentAudio.dataset.startTime = (initialTrack.startTime || 0).toString();
                currentAudio.dataset.startEnforced = "false";
                currentAudio.src = initialTrack.url;
                if (currentGain) currentGain.gain.value = 1;
                currentAudio.load(); // Explicitly load to trigger metadata fetching
              }
            }, 100);
          }
        }
      } catch (e) {
        console.error("Failed to load data from IndexedDB", e);
      } finally {
        setIsDataLoaded(true);
      }
    };
    loadData();
  }, []);

  useEffect(() => {
    if (isDataLoaded) {
      set('settings', {
        crossfadeEnabled,
        crossfadeDuration,
        overlapDuration,
        fadeCurve,
        playMode,
        currentIndex,
        activePlaylistId
      });
    }
  }, [crossfadeEnabled, crossfadeDuration, overlapDuration, fadeCurve, playMode, currentIndex, activePlaylistId, isDataLoaded]);

  useEffect(() => {
    if (isDataLoaded) {
      // We save the tracks but exclude the session-specific blob URLs
      const tracksToSave = tracks.map(({ url, ...rest }) => rest);
      set('tracks', tracksToSave);
    }
  }, [tracks, isDataLoaded]);

  useEffect(() => {
    if (isDataLoaded) {
      set('playlists', playlists);
    }
  }, [playlists, isDataLoaded]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (showAddToPlaylist) {
        const target = e.target as HTMLElement;
        if (!target.closest('.track-menu-container') && !target.closest('.more-button')) {
          setShowAddToPlaylist(null);
        }
      }
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [showAddToPlaylist]);

  useEffect(() => {
    if (trimmingTrackId) {
      const track = tracks.find(t => t.id === trimmingTrackId);
      if (track && !track.duration) {
        const tempAudio = new Audio(track.url);
        tempAudio.addEventListener('loadedmetadata', () => {
          setTracks(prev => prev.map(t => t.id === trimmingTrackId ? { ...t, duration: tempAudio.duration } : t));
        });
      }
    }
  }, [trimmingTrackId, tracks]);

  const initAudioContext = () => {
    if (!audioContextRef.current) {
      const AudioContextClass = (window as any).AudioContext || (window as any).webkitAudioContext;
      audioContextRef.current = new AudioContextClass();
      
      if (audio1Ref.current && !source1Ref.current) {
        source1Ref.current = audioContextRef.current!.createMediaElementSource(audio1Ref.current);
        gainNode1Ref.current = audioContextRef.current!.createGain();
        source1Ref.current.connect(gainNode1Ref.current);
        gainNode1Ref.current.connect(audioContextRef.current!.destination);
      }
      
      if (audio2Ref.current && !source2Ref.current) {
        source2Ref.current = audioContextRef.current!.createMediaElementSource(audio2Ref.current);
        gainNode2Ref.current = audioContextRef.current!.createGain();
        source2Ref.current.connect(gainNode2Ref.current);
        gainNode2Ref.current.connect(audioContextRef.current!.destination);
      }
    }
    
    if (audioContextRef.current?.state === 'suspended') {
      audioContextRef.current.resume();
    }
  };

  const getActiveQueue = () => {
    if (activePlaylistId) {
      const pl = playlists.find(p => p.id === activePlaylistId);
      if (pl) return pl.trackIds.map(id => tracks.find(t => t.id === id)).filter(Boolean) as Track[];
    }
    return tracks;
  };

  const playTrack = (index: number, crossfade: boolean = true, forcePlay: boolean = false, playlistId: string | null = activePlaylistId) => {
    setHasStarted(true);
    initAudioContext();
    const queue = playlistId ? (playlists.find(p => p.id === playlistId)?.trackIds.map(id => tracks.find(t => t.id === id)).filter(Boolean) as Track[]) : tracks;
    const nextTrack = queue[index];
    if (!nextTrack || nextTrack.isCorrupted) return;

    if (playlistId !== activePlaylistId) {
      setActivePlaylistId(playlistId);
    }

    const currentAudio = activeAudioRef.current === 1 ? audio1Ref.current : audio2Ref.current;
    const nextAudio = activeAudioRef.current === 1 ? audio2Ref.current : audio1Ref.current;
    const currentGain = activeAudioRef.current === 1 ? gainNode1Ref.current : gainNode2Ref.current;
    const nextGain = activeAudioRef.current === 1 ? gainNode2Ref.current : gainNode1Ref.current;

    if (!currentAudio || !nextAudio || !currentGain || !nextGain) return;

    fadeIntervals.current.forEach(clear => clear());
    fadeIntervals.current = [];

    nextAudio.dataset.startTime = (nextTrack.startTime || 0).toString();
    nextAudio.dataset.startEnforced = "false";
    nextAudio.src = nextTrack.url;
    nextAudio.load();
    const shouldPlay = isPlaying || forcePlay;

    if (crossfade && shouldPlay && currentAudio.src && !currentAudio.paused) {
      const fadeMs = crossfadeDuration * 1000;
      const overlapMs = overlapDuration * 1000;
      const delayBeforeNextStart = Math.max(0, fadeMs - overlapMs);

      nextGain.gain.value = 0;
      nextAudio.dataset.startTime = (nextTrack.startTime || 0).toString();
      nextAudio.dataset.startEnforced = "false";
      nextAudio.src = nextTrack.url;
      nextAudio.load();

      // Start fading out current
      const clearOut = fadeAudio(currentGain, 'out', fadeMs, currentGain.gain.value, fadeCurve, () => {
        currentAudio.pause();
      });

      // Start fading in next after delay
      let clearIn: (() => void) | null = null;
      const timeoutId = setTimeout(() => {
        const playPromise = nextAudio.play();
        if (playPromise !== undefined) {
          playPromise.then(() => {
            // Force seek after play starts for iOS
            enforceStartTime(nextAudio);
            setTimeout(() => enforceStartTime(nextAudio), 50);
            setTimeout(() => enforceStartTime(nextAudio), 200);
            setTimeout(() => enforceStartTime(nextAudio), 500);
            setTimeout(() => enforceStartTime(nextAudio), 1000);
          }).catch(console.error);
        }
        clearIn = fadeAudio(nextGain, 'in', fadeMs, 1, fadeCurve);
        if (clearIn) fadeIntervals.current.push(clearIn);
      }, delayBeforeNextStart);

      fadeIntervals.current = [clearOut, () => clearTimeout(timeoutId)];
    } else {
      currentAudio.pause();
      nextGain.gain.value = 1;
      nextAudio.dataset.startTime = (nextTrack.startTime || 0).toString();
      nextAudio.dataset.startEnforced = "false";
      nextAudio.src = nextTrack.url;
      nextAudio.load();
      if (shouldPlay) {
        const playPromise = nextAudio.play();
        if (playPromise !== undefined) {
          playPromise.then(() => {
            // Force seek after play starts for iOS
            enforceStartTime(nextAudio);
            setTimeout(() => enforceStartTime(nextAudio), 50);
            setTimeout(() => enforceStartTime(nextAudio), 200);
            setTimeout(() => enforceStartTime(nextAudio), 500);
            setTimeout(() => enforceStartTime(nextAudio), 1000);
          }).catch(console.error);
        }
      }
    }

    activeAudioRef.current = activeAudioRef.current === 1 ? 2 : 1;
    setCurrentIndex(index);
    if (forcePlay) setIsPlaying(true);
    
    // Reset crossfading flag after a short delay to ensure the transition has stabilized
    setTimeout(() => {
      isCrossfading.current = false;
      // Final enforcement check after transition
      const audio = activeAudioRef.current === 1 ? audio1Ref.current : audio2Ref.current;
      if (audio) enforceStartTime(audio, true);
    }, 500);
    
    setShowPlayerMenu(false);
  };

  const handleNext = (auto = false) => {
    const queue = getActiveQueue();
    if (queue.length === 0) return;
    
    let nextIndex;
    if (playMode === 'repeat') {
      nextIndex = currentIndex;
    } else if (playMode === 'random') {
      nextIndex = Math.floor(Math.random() * queue.length);
      if (queue.length > 1 && nextIndex === currentIndex) {
        nextIndex = (nextIndex + 1) % queue.length;
      }
    } else {
      nextIndex = (currentIndex + 1) % queue.length;
    }
    
    playTrack(nextIndex, crossfadeEnabled, auto ? true : false, activePlaylistId);
  };

  const handlePrev = () => {
    const queue = getActiveQueue();
    if (queue.length === 0) return;

    if (playMode === 'repeat') {
      playTrack(currentIndex, crossfadeEnabled, false, activePlaylistId);
      return;
    }

    const currentAudio = activeAudioRef.current === 1 ? audio1Ref.current : audio2Ref.current;
    const currentTrack = queue[currentIndex];
    const startTime = currentTrack?.startTime || 0;

    if (currentAudio && currentAudio.currentTime > startTime + 3) {
      currentAudio.currentTime = startTime;
      return;
    }
    const prevIndex = (currentIndex - 1 + queue.length) % queue.length;
    playTrack(prevIndex, crossfadeEnabled, false, activePlaylistId);
  };

  useEffect(() => {
    const interval = setInterval(() => {
      const audio1 = audio1Ref.current;
      const audio2 = audio2Ref.current;
      if (audio1) enforceStartTime(audio1);
      if (audio2) enforceStartTime(audio2);
    }, 250);
    return () => clearInterval(interval);
  }, [isPlaying, isSeeking]);

  const togglePlay = () => {
    initAudioContext();
    const currentAudio = activeAudioRef.current === 1 ? audio1Ref.current : audio2Ref.current;
    const nextAudio = activeAudioRef.current === 1 ? audio2Ref.current : audio1Ref.current;
    const currentGain = activeAudioRef.current === 1 ? gainNode1Ref.current : gainNode2Ref.current;

    if (isPlaying) {
      currentAudio?.pause();
      nextAudio?.pause();
      fadeIntervals.current.forEach(clear => clear());
      fadeIntervals.current = [];
    } else {
      setHasStarted(true);
      if (currentAudio && !currentAudio.src && getActiveQueue().length > 0) {
         playTrack(currentIndex, false, true, activePlaylistId);
         return;
      }
      if (currentAudio && currentGain) {
        currentGain.gain.value = 1;
        currentAudio.play().then(() => {
          // Aggressive enforcement for iPad after user gesture
          enforceStartTime(currentAudio);
          // Multiple retries to fight iPad's tendency to reset playhead to 0
          setTimeout(() => enforceStartTime(currentAudio), 50);
          setTimeout(() => enforceStartTime(currentAudio), 200);
          setTimeout(() => enforceStartTime(currentAudio), 500);
          setTimeout(() => enforceStartTime(currentAudio), 1000);
        }).catch(console.error);
      }
    }
    setIsPlaying(!isPlaying);
  };

  const enforceStartTime = (audio: HTMLAudioElement, force = false) => {
    if (isSeeking) return;
    
    const startTime = parseFloat(audio.dataset.startTime || "0");
    if (startTime <= 0) {
      audio.dataset.startEnforced = "true";
      if (audio.muted && audio.dataset.manualMute !== "true") audio.muted = false;
      return;
    }

    // We need at least HAVE_METADATA (1) to know duration
    if (audio.readyState < 1) return;

    const duration = audio.duration;
    if (isNaN(duration) || duration <= 0) return;

    // Handle Infinity duration (common for some FLAC/streams)
    const targetTime = isFinite(duration) 
      ? Math.max(0, Math.min(startTime, duration - 0.05)) 
      : startTime;
      
    const current = audio.currentTime;
    const diff = Math.abs(current - targetTime);

    // If already enforced, we only re-enforce if it's a major jump back to 0 (common iPad bug)
    if (audio.dataset.startEnforced === "true" && !force) {
      if (current < targetTime - 0.5 && !audio.paused && !audio.seeking) {
        audio.dataset.startEnforced = "false";
      } else {
        // Ensure we are unmuted if we are at the target
        if (audio.muted && audio.dataset.manualMute !== "true") audio.muted = false;
        return;
      }
    }

    // If we are far from target, seek and keep muted
    if (diff > 0.1 || force) {
      // Mute the element itself to hide the "beginning" glitch
      audio.muted = true;
      
      if (!audio.seeking) {
        try {
          // On iOS/Capacitor, setting currentTime can be ignored if not in a specific state
          // We set it multiple times to ensure it sticks
          audio.currentTime = targetTime;
          
          // If force is true, we are extra aggressive
          if (force) {
            setTimeout(() => { if (audio) audio.currentTime = targetTime; }, 10);
            setTimeout(() => { if (audio) audio.currentTime = targetTime; }, 50);
          }
        } catch (e) {
          console.error("Seek failed", e);
        }
      }
    } else {
      // We are at the target!
      audio.dataset.startEnforced = "true";
      if (audio.dataset.manualMute !== "true") audio.muted = false;
    }
  };

  const onSeeked = (audio: HTMLAudioElement) => {
    enforceStartTime(audio);
  };

  const onCanPlayThrough = (audioNum: 1 | 2, audio: HTMLAudioElement) => {
    enforceStartTime(audio, true);
    setTimeout(() => enforceStartTime(audio, true), 100);
  };

  const onLoadedData = (audioNum: 1 | 2, audio: HTMLAudioElement) => {
    enforceStartTime(audio, true);
    setTimeout(() => enforceStartTime(audio, true), 100);
  };

  const onLoadedMetadata = (audioNum: 1 | 2, audio: HTMLAudioElement) => {
    enforceStartTime(audio, true);
    setTimeout(() => enforceStartTime(audio, true), 100);
  };

  const onPlaying = (audioNum: 1 | 2, audio: HTMLAudioElement) => {
    enforceStartTime(audio, true);
    setTimeout(() => enforceStartTime(audio, true), 100);
  };

  const onCanPlay = (audioNum: 1 | 2, audio: HTMLAudioElement) => {
    enforceStartTime(audio, true);
    setTimeout(() => enforceStartTime(audio, true), 100);
  };

  const onPlay = (audioNum: 1 | 2, audio: HTMLAudioElement) => {
    enforceStartTime(audio, true);
    setTimeout(() => enforceStartTime(audio, true), 100);
  };

  const onTimeUpdate = (audioNum: 1 | 2) => {
    const audio = audioNum === 1 ? audio1Ref.current : audio2Ref.current;
    if (!audio) return;

    // Always enforce start time if needed, regardless of "active" status
    // This helps during crossfades where the next audio is loading/playing
    if (!isSeeking) {
      enforceStartTime(audio);
    }

    if (audioNum === activeAudioRef.current) {
      const currentTrack = getActiveQueue()[currentIndex];
      if (!currentTrack) return;

      if (!isSeeking) {
        setProgress(audio.currentTime);
      }
      setDuration(audio.duration || 0);

      // Update track duration in state if missing
      if (audio.duration && isFinite(audio.duration) && !currentTrack.duration) {
        setTracks(prev => prev.map(t => t.id === currentTrack.id ? { ...t, duration: audio.duration } : t));
      }

      const effectiveEndTime = currentTrack.endTime || (isFinite(audio.duration) ? audio.duration : 0);
      const effectiveStartTime = currentTrack.startTime || 0;

      // Only trigger end-of-track logic if we have a valid duration
      if (audio.duration > 0 && isFinite(audio.duration) && effectiveEndTime > 0) {
        // Don't trigger if we just started (to avoid immediate crossfade on short tracks or tight ranges)
        const timeSinceStart = audio.currentTime - effectiveStartTime;
        
        if (audio.currentTime >= effectiveEndTime - 0.2) {
          if (!isCrossfading.current) {
            isCrossfading.current = true;
            handleNext(true);
          }
        } else if (crossfadeEnabled && timeSinceStart > 1 && audio.currentTime >= effectiveEndTime - crossfadeDuration) {
          if (!isCrossfading.current) {
            isCrossfading.current = true;
            handleNext(true);
          }
        }
      }
    }
  };

  const onEnded = (audioNum: 1 | 2) => {
    if (audioNum === activeAudioRef.current && !crossfadeEnabled) {
      handleNext(true);
    }
  };

  const handleSliderPointerDown = (e: React.PointerEvent) => {
    e.stopPropagation();
    setIsSeeking(true);
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handleSliderPointerMove = (e: React.PointerEvent, trackRef: React.RefObject<HTMLDivElement>) => {
    if (!isSeeking || !trackRef.current) return;
    const rect = trackRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(e.clientX - rect.left, rect.width));
    const percentage = x / rect.width;
    setProgress(percentage * duration);
  };

  const handleSliderPointerUp = (e: React.PointerEvent) => {
    if (!isSeeking) return;
    setIsSeeking(false);
    (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
    
    const audio = activeAudioRef.current === 1 ? audio1Ref.current : audio2Ref.current;
    if (audio) {
      if (audio.readyState >= 1) {
        try {
          audio.currentTime = progress;
          // Manual seek overrides initial start point enforcement
          audio.dataset.startEnforced = "true";
        } catch (e) {
          console.error("Failed to set currentTime in handleSliderPointerUp", e);
        }
      }
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []) as File[];
    const supportedFiles = files.filter(f => 
      f.name.toLowerCase().endsWith('.flac') || 
      f.name.toLowerCase().endsWith('.mp3') ||
      f.type === 'audio/flac' || 
      f.type === 'audio/x-flac' ||
      f.type === 'audio/mpeg' ||
      f.type === 'audio/mp3'
    );

    if (supportedFiles.length === 0) {
      if (files.length > 0) {
        setUploadError("Please select .flac or .mp3 files. Other formats are not supported yet.");
      }
      return;
    }

    setIsUploading(true);
    setUploadError(null);

    try {
      const newTracks: Track[] = [];
      
      for (const file of supportedFiles) {
        if (file.size === 0) continue;
        
        const buffer = await file.arrayBuffer();
        const blob = new Blob([buffer], { type: file.type || (file.name.toLowerCase().endsWith('.mp3') ? 'audio/mpeg' : 'audio/flac') });
        const id = Math.random().toString(36).substring(7);
        
        // Save binary data separately in IDB
        await set(`track_data_${id}`, buffer);
        
        newTracks.push({
          id,
          url: URL.createObjectURL(blob),
          name: file.name.replace(/\.(flac|mp3)$/i, ''),
          artist: 'Unknown Artist',
          type: file.type || (file.name.toLowerCase().endsWith('.mp3') ? 'audio/mpeg' : 'audio/flac'),
          isCorrupted: false
        });
      }

      setTracks(prev => {
        const updated = [...prev, ...newTracks];
        if (prev.length === 0 && updated.length > 0) {
          setTimeout(() => {
             setCurrentIndex(0);
             const currentAudio = activeAudioRef.current === 1 ? audio1Ref.current : audio2Ref.current;
             const currentGain = activeAudioRef.current === 1 ? gainNode1Ref.current : gainNode2Ref.current;
             if (currentAudio) {
               currentAudio.src = updated[0].url;
               if (currentGain) currentGain.gain.value = 1;
               currentAudio.load();
             }
          }, 0);
        }
        return updated;
      });
    } catch (err) {
      console.error("Upload error:", err);
      setUploadError("Failed to process some files. Please try again.");
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleSelectTrack = (index: number, playlistId: string | null = null) => {
    const queue = playlistId 
      ? playlists.find(p => p.id === playlistId)?.trackIds.map(id => tracks.find(t => t.id === id)).filter(Boolean) as Track[] 
      : tracks;
    const track = queue[index];
    
    if (track?.isCorrupted) {
      // We'll use a simple state to show an error if needed, but for now we just prevent play
      return;
    }

    setHasStarted(true);
    if (index === currentIndex && playlistId === activePlaylistId) {
      if (!isPlaying) togglePlay();
      return;
    }
    playTrack(index, crossfadeEnabled, true, playlistId);
  };

  const clearAllData = async () => {
    await clear();
    window.location.reload();
  };

  const repairLibrary = async () => {
    const repairedTracks = [];
    for (const t of tracks) {
      try {
        const fileData = await get(`track_data_${t.id}`);
        if (fileData) {
          if (t.url) URL.revokeObjectURL(t.url);
          const blob = new Blob([fileData], { type: t.type || (t.name.toLowerCase().endsWith('.mp3') ? 'audio/mpeg' : 'audio/flac') });
          repairedTracks.push({ ...t, url: URL.createObjectURL(blob), isCorrupted: false });
        } else {
          repairedTracks.push({ ...t, isCorrupted: true });
        }
      } catch (err) {
        console.error(`Repair failed for ${t.id}`, err);
        repairedTracks.push(t);
      }
    }
    setTracks(repairedTracks);
    
    // Re-initialize current track
    setTimeout(() => {
      const currentAudio = activeAudioRef.current === 1 ? audio1Ref.current : audio2Ref.current;
      const currentGain = activeAudioRef.current === 1 ? gainNode1Ref.current : gainNode2Ref.current;
      if (currentAudio && repairedTracks[currentIndex]?.url) {
        currentAudio.src = repairedTracks[currentIndex].url;
        if (currentGain) currentGain.gain.value = 1;
        currentAudio.load();
      }
    }, 100);
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
      switchView('library');
      setSelectedPlaylistId(null);
    }
  };

  const deleteTrack = async (trackId: string) => {
    // Delete binary data from IDB
    await del(`track_data_${trackId}`);
    
    setTracks(prev => {
      const trackToDelete = prev.find(t => t.id === trackId);
      if (trackToDelete) {
        URL.revokeObjectURL(trackToDelete.url);
      }
      return prev.filter(t => t.id !== trackId);
    });
    setPlaylists(prev => prev.map(p => ({
      ...p,
      trackIds: p.trackIds.filter(id => id !== trackId)
    })));
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

  const addTag = (trackId: string, tag: string) => {
    if (!tag.trim()) return;
    setTracks(prev => prev.map(t => {
      if (t.id === trackId) {
        const tags = t.tags || [];
        if (!tags.includes(tag.trim())) {
          return { ...t, tags: [...tags, tag.trim()] };
        }
      }
      return t;
    }));
    setNewTag('');
  };

  const removeTag = (trackId: string, tag: string) => {
    setTracks(prev => prev.map(t => {
      if (t.id === trackId) {
        return { ...t, tags: (t.tags || []).filter(tg => tg !== tag) };
      }
      return t;
    }));
  };

  const handleEditTrackName = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTrackId || !editingTrackName.trim()) return;
    setTracks(prev => prev.map(t => {
      if (t.id === editingTrackId) {
        return { ...t, name: editingTrackName.trim() };
      }
      return t;
    }));
    setEditingTrackId(null);
    setEditingTrackName('');
  };

  const handleTrimTrack = (e: React.FormEvent) => {
    e.preventDefault();
    if (!trimmingTrackId) return;
    const start = parseFloat(trimStart);
    const end = parseFloat(trimEnd);
    
    const track = tracks.find(t => t.id === trimmingTrackId);
    if (!track) return;

    const finalStart = !isNaN(start) && start > 0 ? start : 0;
    let finalEnd = !isNaN(end) && end > 0 ? end : 0;

    // Validation: Start must not exceed duration if duration is known
    if (track.duration && finalStart >= track.duration) {
      alert("Start point must be less than song duration.");
      return;
    }

    // Validation: End must be greater than Start
    if (finalEnd > 0 && finalEnd <= finalStart) {
      alert("End point must be greater than start point.");
      return;
    }

    // Validation: End must not exceed duration if duration is known
    if (track.duration && finalEnd > track.duration) {
      finalEnd = track.duration;
    }

    setTracks(prev => prev.map(t => {
      if (t.id === trimmingTrackId) {
        return { 
          ...t, 
          startTime: finalStart > 0 ? finalStart : undefined,
          endTime: finalEnd > 0 ? finalEnd : undefined
        };
      }
      return t;
    }));

    // Apply immediately if it's the current track
    const currentQueue = getActiveQueue();
    const currentTrack = currentQueue[currentIndex];
    if (currentTrack && currentTrack.id === trimmingTrackId) {
      const currentAudio = activeAudioRef.current === 1 ? audio1Ref.current : audio2Ref.current;
      if (currentAudio) {
        currentAudio.dataset.startTime = finalStart.toString();
        currentAudio.dataset.startEnforced = "false";
        
        // Force seek if we are outside the new range
        if (currentAudio.currentTime < finalStart || (finalEnd > 0 && currentAudio.currentTime > finalEnd)) {
          currentAudio.currentTime = finalStart;
          setProgress(finalStart);
        } else {
          // Even if we are inside, we might want to re-enforce if the start changed
          enforceStartTime(currentAudio);
        }
      }
    }

    setTrimmingTrackId(null);
  };

  const handleReorderTracks = (newTracks: Track[]) => {
    const currentTrack = tracks[currentIndex];
    setTracks(newTracks);
    if (currentTrack && activePlaylistId === null) {
      const newIndex = newTracks.findIndex(t => t.id === currentTrack.id);
      if (newIndex !== -1) {
        setCurrentIndex(newIndex);
      }
    }
  };

  const handleReorderPlaylistTracks = (newPlaylistTracks: Track[]) => {
    if (!selectedPlaylistId) return;
    const newTrackIds = newPlaylistTracks.map(t => t.id);
    setPlaylists(prev => prev.map(p => {
      if (p.id === selectedPlaylistId) {
        return { ...p, trackIds: newTrackIds };
      }
      return p;
    }));
    
    if (activePlaylistId === selectedPlaylistId) {
      const currentTrack = getActiveQueue()[currentIndex];
      if (currentTrack) {
        const newIndex = newTrackIds.indexOf(currentTrack.id);
        if (newIndex !== -1) {
          setCurrentIndex(newIndex);
        }
      }
    }
  };

  const currentTrack = getActiveQueue()[currentIndex];

  const switchView = (newView: 'player' | 'library' | 'playlist-detail') => {
    setView(newView);
    setShowPlayerMenu(false);
  };

  const renderPlayer = () => (
    <div className="flex flex-col flex-1 min-h-0 overflow-hidden pt-4 art-gradient">
      {/* Main Scrollable Area (Player + Settings) */}
      <div className="flex-[1.5] flex flex-col min-h-0 overflow-y-auto">
        <div className="p-6 flex flex-col items-center">
          {/* Artwork */}
          <div className="w-full max-w-[280px] aspect-square bg-white/5 rounded-[3rem] shadow-[0_20px_50px_rgba(0,0,0,0.3)] border border-white/10 flex items-center justify-center overflow-hidden relative mb-8 shrink-0 mt-8 group">
            <div className="absolute inset-0 bg-gradient-to-tr from-emerald-500/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
            {currentTrack ? (
              <div className="relative">
                <Music size={80} className="text-emerald-500/40" />
                <div className="absolute -inset-4 bg-emerald-500/20 blur-2xl rounded-full opacity-50" />
              </div>
            ) : (
              <div className="text-center p-6">
                <Music size={48} className="mx-auto mb-4 text-white/10" />
                <p className="text-white/30 text-[10px] uppercase tracking-[0.2em] font-bold">No tracks loaded</p>
              </div>
            )}
          </div>

          {/* Track Info */}
          <div className="mb-10 shrink-0 text-center w-full relative">
            <h2 className="text-2xl font-display font-bold tracking-tight truncate px-12 text-white">
              {currentTrack ? currentTrack.name : 'Not Playing'}
            </h2>
            {currentTrack && currentTrack.artist && currentTrack.artist !== 'Unknown Artist' && (
              <p className="text-xs font-medium uppercase tracking-[0.3em] text-emerald-500/60 truncate px-12 mt-2">
                {currentTrack.artist}
              </p>
            )}
            {currentTrack && (
              <button 
                onClick={() => setShowPlayerMenu(!showPlayerMenu)}
                className="absolute right-4 top-1/2 -translate-y-1/2 p-2 text-white/20 hover:text-emerald-400 transition-colors"
              >
                <MoreVertical size={20} />
              </button>
            )}

            {/* Player Menu Overlay */}
            {showPlayerMenu && currentTrack && (
              <>
                <div 
                  className="fixed inset-0 z-40" 
                  onClick={() => setShowPlayerMenu(false)}
                />
                <div className="absolute right-4 top-full mt-2 w-52 glass-dark rounded-2xl shadow-2xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                  <button 
                    onClick={() => {
                      setEditingTrackId(currentTrack.id);
                      setEditingTrackName(currentTrack.name);
                      setShowPlayerMenu(false);
                    }}
                    className="w-full flex items-center gap-3 px-4 py-3 text-xs font-bold uppercase tracking-widest text-white/70 hover:bg-emerald-500/10 hover:text-emerald-400 transition-colors border-b border-white/5"
                  >
                    <Edit2 size={14} />
                    <span>Rename Track</span>
                  </button>
                  <button 
                    onClick={() => {
                      setTrimmingTrackId(currentTrack.id);
                      setTrimStart((currentTrack.startTime || 0).toString());
                      setTrimEnd((currentTrack.endTime || 0).toString());
                      setShowPlayerMenu(false);
                    }}
                    className="w-full flex items-center gap-3 px-4 py-3 text-xs font-bold uppercase tracking-widest text-white/70 hover:bg-emerald-500/10 hover:text-emerald-400 transition-colors border-b border-white/5"
                  >
                    <Settings size={14} />
                    <span>Set Play Range</span>
                  </button>
                  <button 
                    onClick={() => {
                      setTaggingTrackId(currentTrack.id);
                      setShowPlayerMenu(false);
                    }}
                    className="w-full flex items-center gap-3 px-4 py-3 text-xs font-bold uppercase tracking-widest text-white/70 hover:bg-emerald-500/10 hover:text-emerald-400 transition-colors"
                  >
                    <Tag size={14} />
                    <span>Manage Tags</span>
                  </button>
                </div>
              </>
            )}
          </div>

          {/* Progress */}
          <div className="w-full mb-12 shrink-0 relative px-6">
            <div className="relative h-8 flex items-center group/progress" ref={playerTrackRef}>
              {/* Background Track */}
              <div className="absolute left-0 right-0 top-1/2 -translate-y-1/2 h-1 bg-white/5 rounded-full overflow-hidden pointer-events-none">
                <div 
                  className={`h-full bg-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.5)] ${isSeeking ? '' : 'transition-all duration-300'}`}
                  style={{ width: `${(progress / (duration || 1)) * 100}%` }}
                />
              </div>
              
              {/* Draggable Thumb */}
              <div 
                className="absolute top-1/2 z-30 cursor-grab active:cursor-grabbing"
                style={{ 
                  left: `${(progress / (duration || 1)) * 100}%`,
                  transform: 'translate(-50%, -50%)'
                }}
                onPointerDown={handleSliderPointerDown}
                onPointerMove={(e) => handleSliderPointerMove(e, playerTrackRef)}
                onPointerUp={handleSliderPointerUp}
                onPointerCancel={handleSliderPointerUp}
              >
                {/* Visual Thumb */}
                <div className={`w-6 h-6 bg-white rounded-full border-2 border-emerald-500 shadow-[0_0_20px_rgba(16,185,129,0.3)] transition-all duration-300 ${isSeeking ? 'scale-150' : 'scale-100 opacity-80 group-hover/progress:opacity-100 group-hover/progress:scale-110'}`} />
                {/* Larger hit area for the thumb */}
                <div className="absolute inset-[-16px] rounded-full" />
              </div>
            </div>
            <div className="flex justify-between text-[10px] font-bold tracking-widest text-white/30 mt-4 font-art px-1">
              <span>{formatTime(progress)}</span>
              <span>-{formatTime(duration - progress)}</span>
            </div>
          </div>

          {/* Controls */}
          <div className="w-full flex items-center justify-between px-8 shrink-0">
            <button onClick={handlePrev} className="p-3 text-white/40 hover:text-emerald-400 transition-all hover:scale-110 active:scale-90">
              <SkipBack size={32} fill="currentColor" />
            </button>
            <button
              onClick={togglePlay}
              className="w-24 h-24 flex items-center justify-center bg-white text-black rounded-[2.5rem] hover:scale-105 active:scale-95 transition-all shadow-[0_20px_40px_rgba(255,255,255,0.1)] group"
            >
              {isPlaying ? <Pause size={36} fill="currentColor" /> : <Play size={36} fill="currentColor" className="ml-2 group-hover:scale-110 transition-transform" />}
            </button>
            <button onClick={() => handleNext(false)} className="p-3 text-white/40 hover:text-emerald-400 transition-all hover:scale-110 active:scale-90">
              <SkipForward size={32} fill="currentColor" />
            </button>
          </div>
        </div>
      </div>

      {/* Queue Section (Fixed at bottom) */}
      <div className="flex-1 flex flex-col glass-dark border-t border-white/5 min-h-0 rounded-t-[3rem]">
        <div className="px-8 py-5 text-[10px] font-bold text-emerald-400/60 uppercase tracking-[0.3em] sticky top-0 bg-black/20 backdrop-blur-md z-10 flex justify-between items-center">
          <span>{activePlaylistId ? playlists.find(p => p.id === activePlaylistId)?.name : 'Up Next'}</span>
          <span className="bg-emerald-500/10 px-2 py-0.5 rounded-full text-[8px] border border-emerald-500/20">{getActiveQueue().length} tracks</span>
        </div>
        <div className="flex-1 overflow-y-auto p-4 space-y-2 pb-32">
          {getActiveQueue().map((track, index) => (
            <button
              key={`${track.id}-${index}`}
              onClick={() => handleSelectTrack(index, activePlaylistId)}
              className={`w-full flex items-center text-left p-3 rounded-2xl transition-all duration-300 ${index === currentIndex ? 'glass border-emerald-500/20' : 'hover:bg-white/5'}`}
            >
              <div className="w-10 h-10 bg-white/5 rounded-xl flex items-center justify-center mr-4 shrink-0">
                {index === currentIndex && isPlaying ? (
                  <div className="flex gap-0.5 items-end h-4">
                    <div className="w-1 bg-emerald-400 animate-eq h-full" />
                    <div className="w-1 bg-emerald-400 animate-eq-delay-1 h-2/3" />
                    <div className="w-1 bg-emerald-400 animate-eq-delay-2 h-4/5" />
                  </div>
                ) : (
                  <Music size={16} className={index === currentIndex ? "text-emerald-400" : "text-white/20"} />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className={`truncate text-sm font-display font-semibold tracking-tight ${index === currentIndex ? 'text-emerald-400' : 'text-white'}`}>
                  {track.name}
                </p>
                {track.artist && track.artist !== 'Unknown Artist' && (
                  <p className="truncate text-[10px] uppercase tracking-widest text-white/40 font-medium mt-0.5">{track.artist}</p>
                )}
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );

  const renderLibrary = () => (
    <div className="flex flex-col flex-1 min-h-0 pt-4 art-gradient">
      {/* Header (Selection mode only) */}
      {isSelectingForPlaylist && (
        <div className="p-6 pb-4 border-b border-white/5 flex justify-between items-center glass-dark backdrop-blur-md z-10">
          <h1 className="text-lg font-display font-bold tracking-tight">Add Tracks</h1>
          <button onClick={() => {
            setIsSelectingForPlaylist(false);
            switchView('playlist-detail');
          }} className="text-emerald-400 font-bold text-xs uppercase tracking-[0.2em] hover:text-emerald-300 transition-colors">
            Done
          </button>
        </div>
      )}

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-2 relative min-h-0 pb-32">
        {libraryTab === 'tracks' ? (
          tracks.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-white/20 space-y-6">
              <div className="w-24 h-24 rounded-full bg-white/5 flex items-center justify-center border border-white/5">
                <Music size={48} className="opacity-50" />
              </div>
              <p className="text-[10px] font-bold uppercase tracking-[0.3em]">No tracks in library</p>
            </div>
          ) : (
            <Reorder.Group axis="y" values={tracks} onReorder={handleReorderTracks} className="space-y-2">
              {tracks.map((track, index) => (
                <ReorderableTrackItem
                  key={track.id}
                  track={track}
                  index={index}
                  currentIndex={currentIndex}
                  activePlaylistId={activePlaylistId}
                  isSelectingForPlaylist={isSelectingForPlaylist}
                  selectedPlaylistId={selectedPlaylistId}
                  playlists={playlists}
                  isPlaying={isPlaying}
                  showAddToPlaylist={showAddToPlaylist}
                  setShowAddToPlaylist={setShowAddToPlaylist}
                  addToPlaylist={addToPlaylist}
                  removeFromPlaylist={removeFromPlaylist}
                  handleSelectTrack={handleSelectTrack}
                  setTaggingTrackId={setTaggingTrackId}
                  setEditingTrackId={setEditingTrackId}
                  setEditingTrackName={setEditingTrackName}
                  setTrimmingTrackId={setTrimmingTrackId}
                  setTrimStart={setTrimStart}
                  setTrimEnd={setTrimEnd}
                  deleteTrack={deleteTrack}
                />
              ))}
            </Reorder.Group>
          )
        ) : libraryTab === 'playlists' ? (
          playlists.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-white/20 space-y-6">
              <div className="w-24 h-24 rounded-full bg-white/5 flex items-center justify-center border border-white/5">
                <FolderHeart size={48} className="opacity-50" />
              </div>
              <p className="text-[10px] font-bold uppercase tracking-[0.3em]">No playlists yet</p>
            </div>
          ) : (
            playlists.map(playlist => (
              <div key={playlist.id} className="w-full flex items-center p-4 rounded-2xl hover:bg-white/5 transition-all group border border-transparent hover:border-white/5">
                <button
                  onClick={() => { setSelectedPlaylistId(playlist.id); switchView('playlist-detail'); }}
                  className="flex-1 flex items-center text-left min-w-0"
                >
                  <div className="w-12 h-12 bg-white/5 rounded-xl flex items-center justify-center mr-4 shrink-0 border border-white/5">
                    <FolderHeart size={24} className="text-emerald-500/40" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="truncate text-sm font-display font-bold tracking-tight text-white">{playlist.name}</p>
                    <p className="truncate text-[10px] font-bold uppercase tracking-widest text-white/30 mt-0.5">{playlist.trackIds.length} tracks</p>
                  </div>
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); deletePlaylist(playlist.id); }}
                  className="p-3 text-white/20 hover:text-rose-400 opacity-0 group-hover:opacity-100 transition-all"
                  title="Delete Playlist"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            ))
          )
        ) : (
          <div className="flex flex-col gap-6 pb-32">
            {/* Play Mode Section */}
            <div className="flex flex-col gap-6 p-6 glass-dark rounded-[2rem]">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20">
                  <Repeat size={16} className="text-emerald-400" />
                </div>
                <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/70">Play Mode</span>
              </div>
              <div className="grid grid-cols-3 gap-2 bg-black/40 p-1.5 rounded-2xl border border-white/5">
                {(['order', 'random', 'repeat'] as const).map(mode => (
                  <button
                    key={mode}
                    onClick={() => setPlayMode(mode)}
                    className={`text-[10px] py-3 rounded-xl uppercase tracking-[0.2em] transition-all font-bold ${playMode === mode ? 'bg-emerald-500 text-black shadow-[0_0_15px_rgba(16,185,129,0.3)]' : 'text-white/30 hover:text-white/60 hover:bg-white/5'}`}
                  >
                    {mode}
                  </button>
                ))}
              </div>
            </div>

            {/* Crossfade Section */}
            <div className="flex flex-col gap-6 p-6 glass-dark rounded-[2rem]">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20">
                    <Shuffle size={16} className={crossfadeEnabled ? "text-emerald-400" : "text-white/20"} />
                  </div>
                  <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/70">Crossfade</span>
                </div>
                <button
                  onClick={() => setCrossfadeEnabled(!crossfadeEnabled)}
                  className={`w-14 h-7 rounded-full transition-all duration-500 relative ${crossfadeEnabled ? 'bg-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.3)]' : 'bg-white/10'}`}
                >
                  <div className={`w-5 h-5 bg-white rounded-full absolute top-1 transition-transform duration-500 ${crossfadeEnabled ? 'translate-x-8' : 'translate-x-1'}`} />
                </button>
              </div>
              
              {crossfadeEnabled && (
                <div className="flex flex-col gap-8 animate-in fade-in slide-in-from-top-4 duration-500">
                  <div className="flex flex-col gap-4">
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] text-white/40 uppercase tracking-widest font-bold">Duration</span>
                      <span className="text-[10px] text-emerald-400 font-art font-bold bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20">{crossfadeDuration}s</span>
                    </div>
                    <div className="flex items-center gap-4 py-2">
                      <span className="text-[10px] text-white/20 font-art w-6">0s</span>
                      <input
                        type="range"
                        min={0}
                        max={10}
                        step={0.5}
                        value={crossfadeDuration}
                        onChange={(e) => {
                          const val = Number(e.target.value);
                          setCrossfadeDuration(val);
                          if (overlapDuration > val) {
                            setOverlapDuration(val);
                          }
                        }}
                        className="flex-1 h-1.5 bg-white/5 rounded-full appearance-none [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:rounded-full cursor-pointer hover:[&::-webkit-slider-thumb]:scale-110 transition-all"
                      />
                      <span className="text-[10px] text-white/20 font-art w-6 text-right">10s</span>
                    </div>
                  </div>

                  <div className="flex flex-col gap-4">
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] text-white/40 uppercase tracking-widest font-bold">Overlap</span>
                      <span className="text-[10px] text-emerald-400 font-art font-bold bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20">{overlapDuration}s</span>
                    </div>
                    <div className="flex items-center gap-4 py-2">
                      <span className="text-[10px] text-white/20 font-art w-6">0s</span>
                      <input
                        type="range"
                        min={0}
                        max={10}
                        step={0.5}
                        value={overlapDuration}
                        onChange={(e) => setOverlapDuration(Math.min(Number(e.target.value), crossfadeDuration))}
                        className="flex-1 h-1.5 bg-white/5 rounded-full appearance-none [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:rounded-full cursor-pointer hover:[&::-webkit-slider-thumb]:scale-110 transition-all"
                      />
                      <span className="text-[10px] text-white/20 font-art w-6 text-right">10s</span>
                    </div>
                  </div>

                  <div className="flex flex-col gap-4">
                    <span className="text-[10px] text-white/40 uppercase tracking-widest font-bold">Fade Curve</span>
                    <div className="grid grid-cols-3 gap-2 bg-black/40 p-1.5 rounded-2xl border border-white/5">
                      {(['linear', 'equal-power', 'quadratic'] as FadeCurve[]).map(c => (
                        <button
                          key={c}
                          onClick={() => setFadeCurve(c)}
                          className={`text-[10px] py-3 rounded-xl uppercase tracking-[0.2em] transition-all font-bold ${fadeCurve === c ? 'bg-emerald-500 text-black shadow-[0_0_15px_rgba(16,185,129,0.3)]' : 'text-white/30 hover:text-white/60 hover:bg-white/5'}`}
                        >
                          {c.replace('-', ' ')}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Maintenance Zone */}
            <div className="flex flex-col gap-6 p-6 glass-dark rounded-[2rem] border-white/5">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center border border-white/10">
                  <Settings size={16} className="text-white/40" />
                </div>
                <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/70">Maintenance</span>
              </div>
              <button
                onClick={repairLibrary}
                className="w-full py-4 bg-white/5 hover:bg-white/10 text-white rounded-2xl text-[10px] font-bold uppercase tracking-[0.2em] transition-all border border-white/10 active:scale-[0.98]"
              >
                Repair Library Connections
              </button>
            </div>

            <div className="flex flex-col gap-6 p-6 bg-rose-500/5 rounded-[2rem] border border-rose-500/10">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-rose-500/10 flex items-center justify-center border border-rose-500/20">
                  <Trash2 size={16} className="text-rose-500" />
                </div>
                <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-rose-500/70">Danger Zone</span>
              </div>
              <button
                onClick={() => setShowClearConfirm(true)}
                className="w-full py-4 bg-rose-500/10 hover:bg-rose-500/20 text-rose-500 rounded-2xl text-[10px] font-bold uppercase tracking-[0.2em] transition-all border border-rose-500/20 active:scale-[0.98]"
              >
                Clear All Library Data
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Add Button */}
      {/* Removed "Add FLAC Files" button as it's now handled by the FAB */}
    </div>
  );

  const renderPlaylistDetail = () => {
    const playlist = playlists.find(p => p.id === selectedPlaylistId);
    if (!playlist) return null;
    const playlistTracks = playlist.trackIds.map(id => tracks.find(t => t.id === id)).filter(Boolean) as Track[];

    return (
      <div className="flex flex-col flex-1 min-h-0 pt-4 art-gradient">
        <div className="px-6 py-8 flex flex-col gap-3">
          <button onClick={() => { setLibraryTab('playlists'); switchView('library'); }} className="flex items-center gap-2 text-white/30 hover:text-emerald-400 transition-all text-[10px] font-bold uppercase tracking-[0.2em] group">
            <ArrowLeft size={14} className="group-hover:-translate-x-1 transition-transform" />
            Back to Playlists
          </button>
          <h1 className="text-3xl font-display font-bold tracking-tight text-white mt-2">{playlist.name}</h1>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold uppercase tracking-widest text-emerald-500/60 bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20">
              {playlistTracks.length} Tracks
            </span>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto p-4 space-y-2 pb-32">
          {playlistTracks.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-white/20 space-y-6">
              <div className="w-24 h-24 rounded-full bg-white/5 flex items-center justify-center border border-white/5">
                <Music size={48} className="opacity-50" />
              </div>
              <p className="text-[10px] font-bold uppercase tracking-[0.3em]">Playlist is empty</p>
            </div>
          ) : (
            <Reorder.Group axis="y" values={playlistTracks} onReorder={handleReorderPlaylistTracks} className="space-y-2">
              {playlistTracks.map((track, index) => (
                <ReorderablePlaylistTrackItem
                  key={`${track.id}-${index}`}
                  track={track}
                  index={index}
                  currentIndex={currentIndex}
                  activePlaylistId={activePlaylistId}
                  playlist={playlist}
                  isPlaying={isPlaying}
                  showAddToPlaylist={showAddToPlaylist}
                  setShowAddToPlaylist={setShowAddToPlaylist}
                  handleSelectTrack={handleSelectTrack}
                  setTaggingTrackId={setTaggingTrackId}
                  setEditingTrackId={setEditingTrackId}
                  setEditingTrackName={setEditingTrackName}
                  setTrimmingTrackId={setTrimmingTrackId}
                  setTrimStart={setTrimStart}
                  setTrimEnd={setTrimEnd}
                  removeFromPlaylist={removeFromPlaylist}
                />
              ))}
            </Reorder.Group>
          )}
        </div>
      </div>
    );
  };

  const renderMiniPlayer = () => {
    const track = getActiveQueue()[currentIndex];
    if (!track) return null;

    return (
      <div 
        onClick={() => switchView('player')}
        className="h-20 glass-dark border-t border-white/5 flex items-center px-4 gap-4 cursor-pointer shrink-0 z-50 relative"
      >
        <div className="w-12 h-12 bg-white/5 rounded-xl flex items-center justify-center shrink-0 overflow-hidden border border-white/5 shadow-[0_0_15px_rgba(0,0,0,0.3)]">
          <Music size={24} className="text-emerald-500/50" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="truncate text-sm font-display font-bold tracking-tight text-white">{track.name}</p>
          {track.artist && track.artist !== 'Unknown Artist' && (
            <p className="truncate text-[10px] font-bold uppercase tracking-widest text-white/30 mt-0.5">{track.artist}</p>
          )}
        </div>
        <div className="flex items-center gap-1" onClick={e => e.stopPropagation()}>
          <button 
            onClick={togglePlay}
            className="w-10 h-10 rounded-full bg-emerald-500 text-black flex items-center justify-center shadow-[0_0_15px_rgba(16,185,129,0.3)] active:scale-90 transition-all"
          >
            {isPlaying ? <Pause size={18} fill="currentColor" /> : <Play size={18} fill="currentColor" className="ml-0.5" />}
          </button>
          <button 
            onClick={handleNext}
            className="w-10 h-10 flex items-center justify-center text-white/40 hover:text-emerald-400 transition-colors"
          >
            <SkipForward size={20} fill="currentColor" />
          </button>
        </div>
        {/* Progress bar at the very top of the mini player */}
        <div 
          className="absolute top-0 left-0 right-0 h-1 bg-transparent group/progress z-20" 
          onClick={e => e.stopPropagation()}
          ref={miniTrackRef}
        >
          <div className="absolute inset-0 bg-white/5">
            {track && (track.startTime || track.endTime) && (
              <div 
                className="absolute h-full bg-emerald-500/10"
                style={{
                  left: `${((track.startTime || 0) / (duration || 1)) * 100}%`,
                  width: `${(((track.endTime || duration) - (track.startTime || 0)) / (duration || 1)) * 100}%`
                }}
              />
            )}
            <div 
              className={`h-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)] relative ${isSeeking ? '' : 'transition-all duration-300'}`} 
              style={{ width: `${(progress / (duration || 1)) * 100}%` }}
            >
              {/* Draggable Thumb for Mini Player */}
              <div 
                className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 z-30 cursor-grab active:cursor-grabbing"
                onPointerDown={handleSliderPointerDown}
                onPointerMove={(e) => handleSliderPointerMove(e, miniTrackRef)}
                onPointerUp={handleSliderPointerUp}
                onPointerCancel={handleSliderPointerUp}
              >
                <div className={`w-4 h-4 bg-white rounded-full shadow-[0_0_10px_rgba(255,255,255,0.5)] border-2 border-emerald-500 transition-all duration-200 ${isSeeking ? 'scale-110 opacity-100' : 'scale-50 opacity-0 group-hover/progress:opacity-100 group-hover/progress:scale-100'}`} />
                <div className="absolute inset-[-10px] rounded-full" />
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  if (!isDataLoaded) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center text-white art-gradient">
        <div className="flex flex-col items-center">
          <div className="w-24 h-24 rounded-full bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20 mb-8 animate-pulse shadow-[0_0_30px_rgba(16,185,129,0.2)]">
            <Music size={48} className="text-emerald-500 opacity-50" />
          </div>
          <p className="text-white/30 text-[10px] font-bold tracking-[0.4em] uppercase animate-pulse">Loading Library</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white font-sans selection:bg-emerald-500/30 overflow-hidden">
      {/* Hidden Audio Elements */}
      <audio ref={audio1Ref} preload="auto" onTimeUpdate={() => onTimeUpdate(1)} onEnded={() => onEnded(1)} onLoadedMetadata={(e) => onLoadedMetadata(1, e.currentTarget)} onLoadedData={(e) => onLoadedData(1, e.currentTarget)} onCanPlayThrough={(e) => onCanPlayThrough(1, e.currentTarget)} onPlaying={(e) => onPlaying(1, e.currentTarget)} onCanPlay={(e) => onCanPlay(1, e.currentTarget)} onPlay={(e) => onPlay(1, e.currentTarget)} onSeeked={(e) => onSeeked(e.currentTarget)} />
      <audio ref={audio2Ref} preload="auto" onTimeUpdate={() => onTimeUpdate(2)} onEnded={() => onEnded(2)} onLoadedMetadata={(e) => onLoadedMetadata(2, e.currentTarget)} onLoadedData={(e) => onLoadedData(2, e.currentTarget)} onCanPlayThrough={(e) => onCanPlayThrough(2, e.currentTarget)} onPlaying={(e) => onPlaying(2, e.currentTarget)} onCanPlay={(e) => onCanPlay(2, e.currentTarget)} onPlay={(e) => onPlay(2, e.currentTarget)} onSeeked={(e) => onSeeked(e.currentTarget)} />
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileUpload}
        accept=".flac,.mp3,audio/flac,audio/x-flac,audio/mpeg,audio/mp3,audio/*"
        multiple
        className="hidden"
      />

      {/* Background */}
      <div className="fixed inset-0 z-0 opacity-60 pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-900/20 via-black to-black" />
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-emerald-500/10 blur-[120px] rounded-full" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-emerald-500/5 blur-[120px] rounded-full" />
      </div>

      {/* Main Container */}
      <div className="relative z-10 flex flex-col h-[100dvh] w-full bg-transparent overflow-hidden pt-8">
          <div className="flex-1 flex flex-col min-h-0">
            {view === 'player' && renderPlayer()}
            {view === 'library' && renderLibrary()}
            {view === 'playlist-detail' && renderPlaylistDetail()}
          </div>

          {view !== 'player' && hasStarted && renderMiniPlayer()}

          {/* Global Navigation (Bottom) */}
          {!isSelectingForPlaylist && (
            <nav className="shrink-0 z-30 pb-[calc(env(safe-area-inset-bottom)+2rem)] glass-dark border-t border-white/5">
              <div className="relative flex items-center justify-center px-6 h-16">
                <div className="flex gap-10 h-full">
                  {[
                    { id: 'tracks', label: 'Tracks' },
                    { id: 'playlists', label: 'Playlist' },
                    { id: 'settings', label: 'Settings' }
                  ].map(tab => {
                    const isActive = libraryTab === tab.id;
                    return (
                      <button
                        key={tab.id}
                        onClick={() => { setLibraryTab(tab.id as any); switchView('library'); setIsSelectingForPlaylist(false); }}
                        className="relative h-full flex items-center group"
                      >
                        <span className={`text-[10px] font-bold tracking-[0.25em] uppercase transition-all duration-500 ${isActive ? 'text-emerald-400' : 'text-white/20 group-hover:text-white/50'}`}>
                          {tab.label}
                        </span>
                        {isActive && (
                          <motion.div 
                            layoutId="nav-indicator"
                            className="absolute top-0 left-0 right-0 h-0.5 bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]"
                            transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                          />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            </nav>
          )}

          {/* Floating Action Button (Plus) */}
          <AnimatePresence>
            {((view === 'library' && (libraryTab === 'tracks' || libraryTab === 'playlists')) || view === 'playlist-detail') && !isSelectingForPlaylist && (
              <motion.div
                initial={{ scale: 0, opacity: 0, y: 20 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0, opacity: 0, y: 20 }}
                className={`fixed left-1/2 -translate-x-1/2 z-40 ${hasStarted && view !== 'player' ? 'bottom-52' : 'bottom-32'}`}
              >
                <button 
                  onClick={() => {
                    if (view === 'playlist-detail') {
                      setLibraryTab('tracks');
                      switchView('library');
                      setIsSelectingForPlaylist(true);
                    } else if (view === 'library' && libraryTab === 'tracks') {
                      fileInputRef.current?.click();
                    } else {
                      setIsCreatingPlaylist(true);
                    }
                  }}
                  className="w-16 h-16 rounded-full bg-emerald-500 flex items-center justify-center text-black shadow-[0_0_30px_rgba(16,185,129,0.4)] hover:scale-110 active:scale-95 transition-all duration-300 border-4 border-black"
                >
                  <Plus size={32} strokeWidth={3} />
                </button>
              </motion.div>
            )}
          </AnimatePresence>
      </div>

      {/* Create Playlist Modal */}
      {isCreatingPlaylist && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4"
          onClick={() => setIsCreatingPlaylist(false)}
        >
          <form 
            onSubmit={handleCreatePlaylist} 
            className="glass-dark border border-white/10 p-8 rounded-[2rem] w-full max-w-xs shadow-[0_0_50px_rgba(0,0,0,0.5)] animate-in zoom-in-95 duration-300"
            onClick={e => e.stopPropagation()}
          >
            <h3 className="text-lg font-display font-bold mb-6 text-white tracking-tight">New Playlist</h3>
            <input
              type="text"
              autoFocus
              value={newPlaylistName}
              onChange={e => setNewPlaylistName(e.target.value)}
              placeholder="Playlist name"
              className="w-full bg-black/40 border border-white/5 rounded-2xl px-5 py-4 text-base text-white outline-none focus:border-emerald-500/50 transition-all mb-8 placeholder:text-white/20"
            />
            <div className="flex justify-end gap-4">
              <button type="button" onClick={() => setIsCreatingPlaylist(false)} className="px-4 py-2 text-white/30 hover:text-white transition-colors text-[10px] font-bold uppercase tracking-widest">Cancel</button>
              <button type="submit" disabled={!newPlaylistName.trim()} className="px-6 py-3 bg-emerald-500 text-black rounded-xl text-[10px] font-bold uppercase tracking-widest disabled:opacity-30 disabled:cursor-not-allowed shadow-[0_0_15px_rgba(16,185,129,0.3)] active:scale-95 transition-all">Create</button>
            </div>
          </form>
        </div>
      )}

      {/* Manage Tags Modal */}
      {taggingTrackId && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4"
          onClick={() => setTaggingTrackId(null)}
        >
          <div 
            className="glass-dark border border-white/10 p-8 rounded-[2rem] w-full max-w-xs shadow-[0_0_50px_rgba(0,0,0,0.5)] animate-in zoom-in-95 duration-300"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-display font-bold text-white tracking-tight">Manage Tags</h3>
              <button onClick={() => setTaggingTrackId(null)} className="p-2 text-white/20 hover:text-white transition-colors">
                <X size={20} />
              </button>
            </div>
            
            <div className="flex flex-wrap gap-2 mb-8">
              {tracks.find(t => t.id === taggingTrackId)?.tags?.map(tag => (
                <span key={tag} className="flex items-center gap-2 px-3 py-1.5 bg-emerald-500/10 text-emerald-400 rounded-full text-[10px] font-bold border border-emerald-500/20">
                  {tag}
                  <button onClick={() => removeTag(taggingTrackId, tag)} className="hover:text-white transition-colors">
                    <X size={12} />
                  </button>
                </span>
              ))}
              {(!tracks.find(t => t.id === taggingTrackId)?.tags || tracks.find(t => t.id === taggingTrackId)?.tags?.length === 0) && (
                <p className="text-[10px] text-white/20 italic tracking-widest uppercase">No tags added yet</p>
              )}
            </div>

            <div className="flex gap-2">
              <input
                type="text"
                autoFocus
                value={newTag}
                onChange={e => setNewTag(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && addTag(taggingTrackId, newTag)}
                placeholder="Add tag..."
                className="flex-1 bg-black/40 border border-white/5 rounded-2xl px-4 py-3 text-base text-white outline-none focus:border-emerald-500/50 transition-all placeholder:text-white/20"
              />
              <button 
                onClick={() => addTag(taggingTrackId, newTag)}
                disabled={!newTag.trim()}
                className="w-12 h-12 flex items-center justify-center bg-emerald-500 text-black rounded-2xl disabled:opacity-30 disabled:cursor-not-allowed shadow-[0_0_15px_rgba(16,185,129,0.3)] active:scale-90 transition-all"
              >
                <Plus size={24} strokeWidth={3} />
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Edit Song Name Modal */}
      {editingTrackId && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4"
          onClick={() => setEditingTrackId(null)}
        >
          <form 
            onSubmit={handleEditTrackName} 
            className="glass-dark border border-white/10 p-8 rounded-[2rem] w-full max-w-xs shadow-[0_0_50px_rgba(0,0,0,0.5)] animate-in zoom-in-95 duration-300"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-display font-bold text-white tracking-tight">Edit Name</h3>
              <button type="button" onClick={() => setEditingTrackId(null)} className="p-2 text-white/20 hover:text-white transition-colors">
                <X size={20} />
              </button>
            </div>
            <input
              type="text"
              autoFocus
              value={editingTrackName}
              onChange={e => setEditingTrackName(e.target.value)}
              placeholder="Song name"
              className="w-full bg-black/40 border border-white/5 rounded-2xl px-5 py-4 text-base text-white outline-none focus:border-emerald-500/50 transition-all mb-8 placeholder:text-white/20"
            />
            <div className="flex justify-end gap-4">
              <button type="button" onClick={() => setEditingTrackId(null)} className="px-4 py-2 text-white/30 hover:text-white transition-colors text-[10px] font-bold uppercase tracking-widest">Cancel</button>
              <button type="submit" disabled={!editingTrackName.trim()} className="px-6 py-3 bg-emerald-500 text-black rounded-xl text-[10px] font-bold uppercase tracking-widest disabled:opacity-30 disabled:cursor-not-allowed shadow-[0_0_15px_rgba(16,185,129,0.3)] active:scale-95 transition-all">Save</button>
            </div>
          </form>
        </div>
      )}

      {/* Set Play Range Modal */}
      {trimmingTrackId && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4"
          onClick={() => setTrimmingTrackId(null)}
        >
          <form 
            onSubmit={handleTrimTrack} 
            className="glass-dark border border-white/10 p-8 rounded-[2rem] w-full max-w-xs shadow-[0_0_50px_rgba(0,0,0,0.5)] animate-in zoom-in-95 duration-300"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-display font-bold text-white tracking-tight">Set Play Range</h3>
              <button type="button" onClick={() => setTrimmingTrackId(null)} className="p-2 text-white/20 hover:text-white transition-colors">
                <X size={20} />
              </button>
            </div>
            <div className="text-[10px] text-white/30 mb-8 leading-relaxed font-bold uppercase tracking-widest">
              Set start and end points in seconds.
              {tracks.find(t => t.id === trimmingTrackId)?.duration ? (
                <div className="space-y-2 mt-4 p-4 bg-black/40 rounded-2xl border border-white/5">
                  <div className="flex justify-between items-center">
                    <span className="text-white/40">Duration</span>
                    <span className="text-emerald-400 font-art">
                      {formatTime(tracks.find(t => t.id === trimmingTrackId)!.duration!)}
                    </span>
                  </div>
                  {isPlaying && getActiveQueue()[currentIndex]?.id === trimmingTrackId && (
                    <div className="flex justify-between items-center">
                      <span className="text-white/40">Current</span>
                      <span className="text-white/60 font-art">
                        {progress.toFixed(2)}s
                      </span>
                    </div>
                  )}
                </div>
              ) : (
                <span className="block mt-4 text-white/20 italic">
                  Loading track duration...
                </span>
              )}
            </div>
            <div className="space-y-6 mb-10">
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <label className="text-[10px] text-white/40 uppercase tracking-widest font-bold">Start (s)</label>
                  {isPlaying && getActiveQueue()[currentIndex]?.id === trimmingTrackId && (
                    <button 
                      type="button"
                      onClick={() => setTrimStart(progress.toFixed(2))}
                      className="text-[10px] text-emerald-500 hover:text-emerald-400 font-bold uppercase tracking-widest"
                    >
                      Use Current
                    </button>
                  )}
                </div>
                <input
                  type="text"
                  inputMode="decimal"
                  value={trimStart}
                  onChange={e => {
                    const val = e.target.value;
                    if (val === '' || /^\d*\.?\d*$/.test(val)) {
                      setTrimStart(val);
                    }
                  }}
                  className={`w-full bg-black/40 border rounded-2xl px-5 py-4 text-base text-white outline-none transition-all ${tracks.find(t => t.id === trimmingTrackId)?.duration && parseFloat(trimStart) >= tracks.find(t => t.id === trimmingTrackId)!.duration! ? 'border-rose-500' : 'border-white/5 focus:border-emerald-500/50'}`}
                />
                {tracks.find(t => t.id === trimmingTrackId)?.duration && parseFloat(trimStart) >= tracks.find(t => t.id === trimmingTrackId)!.duration! && (
                  <p className="text-[9px] text-rose-500 font-bold mt-1 uppercase tracking-widest">Exceeds duration</p>
                )}
              </div>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <label className="text-[10px] text-white/40 uppercase tracking-widest font-bold">End (s)</label>
                  {isPlaying && getActiveQueue()[currentIndex]?.id === trimmingTrackId && (
                    <button 
                      type="button"
                      onClick={() => setTrimEnd(progress.toFixed(2))}
                      className="text-[10px] text-emerald-500 hover:text-emerald-400 font-bold uppercase tracking-widest"
                    >
                      Use Current
                    </button>
                  )}
                </div>
                <input
                  type="text"
                  inputMode="decimal"
                  value={trimEnd}
                  onChange={e => {
                    const val = e.target.value;
                    if (val === '' || /^\d*\.?\d*$/.test(val)) {
                      setTrimEnd(val);
                    }
                  }}
                  className={`w-full bg-black/40 border rounded-2xl px-5 py-4 text-base text-white outline-none transition-all ${(parseFloat(trimEnd) > 0 && parseFloat(trimEnd) <= parseFloat(trimStart)) || (tracks.find(t => t.id === trimmingTrackId)?.duration && parseFloat(trimEnd) > tracks.find(t => t.id === trimmingTrackId)!.duration!) ? 'border-rose-500' : 'border-white/5 focus:border-emerald-500/50'}`}
                />
                {parseFloat(trimEnd) > 0 && parseFloat(trimEnd) <= parseFloat(trimStart) && (
                  <p className="text-[9px] text-rose-500 font-bold mt-1 uppercase tracking-widest">Invalid range</p>
                )}
              </div>
            </div>
            <div className="flex justify-end gap-4">
              <button type="button" onClick={() => setTrimmingTrackId(null)} className="px-4 py-2 text-white/30 hover:text-white transition-colors text-[10px] font-bold uppercase tracking-widest">Cancel</button>
              <button 
                type="submit" 
                disabled={
                  (parseFloat(trimEnd) > 0 && parseFloat(trimEnd) <= parseFloat(trimStart)) || 
                  (tracks.find(t => t.id === trimmingTrackId)?.duration && (
                    parseFloat(trimStart) >= tracks.find(t => t.id === trimmingTrackId)!.duration! ||
                    (parseFloat(trimEnd) > tracks.find(t => t.id === trimmingTrackId)!.duration!)
                  ))
                }
                className="px-6 py-3 bg-emerald-500 text-black rounded-xl text-[10px] font-bold uppercase tracking-widest disabled:opacity-30 disabled:cursor-not-allowed shadow-[0_0_15px_rgba(16,185,129,0.3)] active:scale-95 transition-all"
              >
                Save Range
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Upload Error Modal */}
      <AnimatePresence>
        {uploadError && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-xl z-[110] flex items-center justify-center p-6"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="w-full max-w-sm glass-dark border border-white/10 rounded-[2.5rem] p-10 shadow-[0_0_50px_rgba(0,0,0,0.5)]"
            >
              <div className="w-20 h-20 bg-emerald-500/10 rounded-full flex items-center justify-center mb-8 mx-auto border border-emerald-500/20 shadow-[0_0_20px_rgba(16,185,129,0.2)]">
                <Music size={32} className="text-emerald-500" />
              </div>
              <h2 className="text-2xl font-display font-bold mb-3 text-center tracking-tight">Import Error</h2>
              <p className="text-sm text-white/40 text-center mb-10 leading-relaxed">{uploadError}</p>
              <button
                onClick={() => setUploadError(null)}
                className="w-full py-5 bg-white/5 hover:bg-white/10 text-white rounded-2xl text-[10px] font-bold uppercase tracking-[0.2em] transition-all active:scale-95"
              >
                Dismiss
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Uploading Overlay */}
      <AnimatePresence>
        {isUploading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-xl z-[120] flex flex-col items-center justify-center p-6"
          >
            <div className="flex gap-2 items-end h-12 mb-8">
              <div className="w-2 bg-emerald-500 animate-eq h-full shadow-[0_0_15px_rgba(16,185,129,0.5)]" />
              <div className="w-2 bg-emerald-500 animate-eq-delay-1 h-2/3 shadow-[0_0_15px_rgba(16,185,129,0.5)]" />
              <div className="w-2 bg-emerald-500 animate-eq-delay-2 h-4/5 shadow-[0_0_15px_rgba(16,185,129,0.5)]" />
            </div>
            <p className="text-[10px] font-bold uppercase tracking-[0.4em] text-emerald-500/70 animate-pulse">Importing Tracks</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Clear Confirmation Modal */}
      <AnimatePresence>
        {showClearConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-xl z-[100] flex items-center justify-center p-6"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="w-full max-w-sm glass-dark border border-rose-500/20 rounded-[2.5rem] p-10 shadow-[0_0_50px_rgba(0,0,0,0.5)]"
            >
              <div className="w-20 h-20 bg-rose-500/10 rounded-full flex items-center justify-center mb-8 mx-auto border border-rose-500/20 shadow-[0_0_20px_rgba(244,63,94,0.2)]">
                <Trash2 size={32} className="text-rose-500" />
              </div>
              <h2 className="text-2xl font-display font-bold mb-3 text-center tracking-tight">Clear All Data?</h2>
              <p className="text-sm text-white/40 text-center mb-10 leading-relaxed">This will permanently delete all tracks, playlists, and settings. This action cannot be undone.</p>
              <div className="flex flex-col gap-4">
                <button
                  onClick={clearAllData}
                  className="w-full py-5 bg-rose-500 text-white rounded-2xl text-[10px] font-bold uppercase tracking-[0.2em] shadow-[0_0_20px_rgba(244,63,94,0.3)] active:scale-95 transition-all"
                >
                  Yes, Clear Everything
                </button>
                <button
                  onClick={() => setShowClearConfirm(false)}
                  className="w-full py-4 text-[10px] font-bold uppercase tracking-[0.2em] text-white/30 hover:text-white transition-colors"
                >
                  Cancel
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

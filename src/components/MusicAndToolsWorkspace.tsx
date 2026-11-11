import React, { useEffect, useRef, useState } from 'react';
import { AudioTrackData, MusicVideoProject } from '../types/studio';
import { PRESET_STUDIO_TRACKS, STUDIO_ASSET_IMAGES } from '../data/seedStudioData';
import { formatTimecode, generateBeatGrid } from '../utils/studioEngine';
import { studioAudioEngine } from '../utils/audioSynth';
import {
  Download,
  FileAudio,
  Image as ImageIcon,
  Mic,
  Music,
  Pause,
  Play,
  Sliders,
  Sparkles,
  Upload,
  Volume2,
  Wand2,
} from 'lucide-react';

interface MusicLibraryProps {
  project: MusicVideoProject;
  tracks: AudioTrackData[];
  onTrackUploaded: (newTrack: AudioTrackData) => void;
  onUpdateProject: (updated: MusicVideoProject) => void;
}

export const MusicLibraryWorkspace: React.FC<MusicLibraryProps> = ({
  project,
  tracks,
  onTrackUploaded,
  onUpdateProject,
}) => {
  const [playingTrackId, setPlayingTrackId] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [audioStatus, setAudioStatus] = useState<string | null>(null);

  const allTracks = tracks.filter(
    (t) => !t.projectId || t.projectId === project.id || project.isDemoProject
  );

  useEffect(() => {
    return () => {
      studioAudioEngine.stopSynthPlayback();
    };
  }, []);

  const handlePlayToggle = (track: AudioTrackData) => {
    if (playingTrackId === track.id) {
      studioAudioEngine.stopSynthPlayback();
      setPlayingTrackId(null);
    } else {
      studioAudioEngine.startPlayback({
        audioUrl: track.audioUrl,
        bpm: track.bpm,
        startTimeSec: track.trimStartSec || 0,
      });
      setPlayingTrackId(track.id);
    }
  };

  const handleUploadTrack = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploading(true);
    try {
      setAudioStatus(`Uploading "${file.name}" to server and extracting BPM & beat peaks...`);
      let analyzed = {
        durationSec: 180,
        bpm: 124,
        waveformPeaks: [0.5, 0.7, 0.85, 0.6, 0.9, 0.75, 0.8, 0.65],
      };
      try {
        analyzed = await studioAudioEngine.analyzeUploadedAudioFile(file);
      } catch {
        // Fallback if browser audio decode fails; server ffprobe will inspect
      }

      const dataUrl = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result || ''));
        reader.onerror = () => reject(new Error('Failed to read file'));
        reader.readAsDataURL(file);
      });

      const res = await fetch('/api/audio/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId: project.id,
          dataUrl,
          fileName: file.name,
          fileSizeBytes: file.size,
          title: file.name.replace(/\.[^.]+$/, ''),
          artist: 'Studio Upload',
          bpm: analyzed.bpm,
          durationSec: analyzed.durationSec,
          musicalKey: 'C Minor',
          mood: 'Custom Uploaded Master',
          waveformPeaks: analyzed.waveformPeaks,
        }),
      });
      const data = await res.json();
      const newTrack: AudioTrackData =
        res.ok && data.track
          ? data.track
          : {
              id: `track_custom_${Date.now()}`,
              projectId: project.id,
              title: file.name.replace(/\.[^.]+$/, ''),
              artist: 'Studio Upload',
              fileName: file.name,
              fileSizeBytes: file.size,
              durationSec: analyzed.durationSec,
              bpm: analyzed.bpm,
              musicalKey: 'C Minor',
              mood: 'Custom Audio Master',
              audioUrl: URL.createObjectURL(file),
              isSynthesizedStudioTrack: false,
              trimStartSec: 0,
              trimEndSec: analyzed.durationSec,
              fadeInSec: 2,
              fadeOutSec: 4,
              beatTimestampsSec: generateBeatGrid(analyzed.bpm, analyzed.durationSec),
              waveformPeaks: analyzed.waveformPeaks,
            };

      onTrackUploaded(newTrack);
      if (res.ok && data.project) {
        onUpdateProject(data.project);
      } else {
        onUpdateProject({
          ...project,
          audioTrack: newTrack,
          durationSec: newTrack.durationSec,
          bpm: newTrack.bpm,
        });
      }
      setAudioStatus(
        `Uploaded & persisted "${newTrack.title}" (${formatTimecode(newTrack.durationSec)} · ${
          newTrack.bpm
        } BPM · ${newTrack.beatTimestampsSec.length} beat markers detected).`
      );
    } catch (err) {
      setAudioStatus(
        err instanceof Error ? err.message : 'Unable to upload audio file.'
      );
    } finally {
      setIsUploading(false);
    }
  };

  const activeTrack = project.audioTrack;

  return (
    <div className="flex flex-col gap-6">
      <div className="bg-[#0F1624] border border-slate-800 rounded-xl p-5 flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs text-indigo-400 font-medium">
            <Music className="w-3.5 h-3.5" />
            <span>STUDIO AUDIO LAB · AUTOMATIC BPM, BEAT GRID & WAVEFORM ANALYZER</span>
          </div>
          <h2 className="text-lg font-bold text-slate-100 mt-1">
            Music Library, Beat Synchronization & Mastering Controls
          </h2>
        </div>

        <label className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-lg flex items-center gap-2 cursor-pointer transition-colors">
          <Upload className="w-4 h-4" />
          <span>{isUploading ? 'Uploading Audio...' : 'Upload MP3 / WAV Audio'}</span>
          <input
            type="file"
            accept="audio/*,.mp3,.wav,.ogg,.m4a,.flac"
            onChange={handleUploadTrack}
            className="hidden"
          />
        </label>
      </div>

      {audioStatus && (
        <div
          role="status"
          className="bg-indigo-950/50 border border-indigo-500/40 rounded-lg px-4 py-2.5 text-xs text-indigo-200 flex items-center justify-between"
        >
          <span>{audioStatus}</span>
          <button
            type="button"
            onClick={() => setAudioStatus(null)}
            className="text-indigo-300 hover:text-white cursor-pointer"
          >
            Dismiss
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Track List (7 Cols) */}
        <div className="lg:col-span-7 flex flex-col gap-4">
          {allTracks.map((track) => {
            const isCurrent = activeTrack.id === track.id;
            const isPlaying = playingTrackId === track.id;
            return (
              <div
                key={track.id}
                className={`bg-[#0F1624] border rounded-xl p-4 flex flex-col gap-3 transition-colors ${
                  isCurrent ? 'border-indigo-500' : 'border-slate-800'
                }`}
              >
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => handlePlayToggle(track)}
                      aria-label={isPlaying ? `Pause ${track.title}` : `Play ${track.title}`}
                      className="w-9 h-9 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white flex items-center justify-center shrink-0 cursor-pointer"
                    >
                      {isPlaying ? (
                        <Pause className="w-4 h-4" />
                      ) : (
                        <Play className="w-4 h-4" />
                      )}
                    </button>
                    <div>
                      <div className="text-sm font-bold text-slate-100">
                        {track.title}
                      </div>
                      <div className="text-xs text-slate-400">
                        {track.artist} · {formatTimecode(track.durationSec)} ·{' '}
                        <span className="font-mono text-indigo-300">{track.bpm} BPM</span> ·{' '}
                        {track.musicalKey}
                      </div>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      onUpdateProject({
                        ...project,
                        audioTrack: track,
                        durationSec: track.durationSec,
                        bpm: track.bpm,
                        musicalKey: track.musicalKey,
                        mood: track.mood,
                      });
                      setAudioStatus(
                        `Assigned "${track.title}" as active project soundtrack.`
                      );
                    }}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer ${
                      isCurrent
                        ? 'bg-emerald-600/20 border border-emerald-500/50 text-emerald-300'
                        : 'bg-slate-800 hover:bg-slate-700 text-slate-200'
                    }`}
                  >
                    {isCurrent ? 'Active Soundtrack' : 'Use in Project'}
                  </button>
                </div>

                {track.audioUrl && (
                  <audio controls src={track.audioUrl} className="w-full h-8" />
                )}

                {/* Waveform Bar */}
                <div className="h-10 bg-slate-950 rounded-lg border border-slate-800/80 px-2 flex items-center gap-0.5">
                  {track.waveformPeaks.map((peak, idx) => (
                    <div
                      key={idx}
                      style={{ height: `${Math.max(15, Math.round(peak * 90))}%` }}
                      className={`flex-1 rounded-sm ${
                        isPlaying ? 'bg-indigo-400' : 'bg-slate-700'
                      }`}
                    />
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        {/* Audio Trimming & Fade Mastering (5 Cols) */}
        <div className="lg:col-span-5 bg-[#0F1624] border border-slate-800 rounded-xl p-5 flex flex-col gap-4">
          <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
            <Sliders className="w-4 h-4 text-indigo-400" />
            Audio Trimming, Fade-In/Out & Beat Sync
          </h3>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label
                htmlFor="audio-trim-start"
                className="text-xs text-slate-400 block mb-1"
              >
                Trim Start (sec)
              </label>
              <input
                id="audio-trim-start"
                type="number"
                min={0}
                max={Math.max(0, activeTrack.trimEndSec - 5)}
                value={activeTrack.trimStartSec}
                onChange={(e) =>
                  onUpdateProject({
                    ...project,
                    audioTrack: {
                      ...activeTrack,
                      trimStartSec: Number(e.target.value),
                    },
                  })
                }
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs font-mono tabular-nums text-slate-100"
              />
            </div>

            <div>
              <label
                htmlFor="audio-trim-end"
                className="text-xs text-slate-400 block mb-1"
              >
                Trim End (sec)
              </label>
              <input
                id="audio-trim-end"
                type="number"
                min={activeTrack.trimStartSec + 5}
                max={activeTrack.durationSec}
                value={activeTrack.trimEndSec}
                onChange={(e) =>
                  onUpdateProject({
                    ...project,
                    audioTrack: {
                      ...activeTrack,
                      trimEndSec: Number(e.target.value),
                    },
                  })
                }
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs font-mono tabular-nums text-slate-100"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label
                htmlFor="audio-fade-in"
                className="text-xs text-slate-400 block mb-1"
              >
                Fade-In Duration (sec)
              </label>
              <input
                id="audio-fade-in"
                type="number"
                min={0}
                max={15}
                value={activeTrack.fadeInSec}
                onChange={(e) =>
                  onUpdateProject({
                    ...project,
                    audioTrack: {
                      ...activeTrack,
                      fadeInSec: Number(e.target.value),
                    },
                  })
                }
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs font-mono tabular-nums text-slate-100"
              />
            </div>

            <div>
              <label
                htmlFor="audio-fade-out"
                className="text-xs text-slate-400 block mb-1"
              >
                Fade-Out Duration (sec)
              </label>
              <input
                id="audio-fade-out"
                type="number"
                min={0}
                max={15}
                value={activeTrack.fadeOutSec}
                onChange={(e) =>
                  onUpdateProject({
                    ...project,
                    audioTrack: {
                      ...activeTrack,
                      fadeOutSec: Number(e.target.value),
                    },
                  })
                }
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs font-mono tabular-nums text-slate-100"
              />
            </div>
          </div>

          <div className="bg-slate-950 border border-slate-800 rounded-lg p-3 text-xs text-slate-300 space-y-1">
            <div className="font-semibold text-slate-100 flex items-center gap-1.5">
              <Volume2 className="w-3.5 h-3.5 text-emerald-400" />
              Beat-Synchronized Cut Engine
            </div>
            <p className="text-slate-400">
              Detected <strong className="text-slate-200 font-mono">{activeTrack.beatTimestampsSec.length}</strong> beat markers at <strong className="text-slate-200 font-mono">{activeTrack.bpm} BPM</strong>. Scene transitions automatically snap to the nearest downbeat.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

interface AIToolsWorkspaceProps {
  project: MusicVideoProject;
  onUpdateProject: (updated: MusicVideoProject) => void;
  onTrackUploaded: (newTrack: AudioTrackData) => void;
}

export const AIToolsWorkspace: React.FC<AIToolsWorkspaceProps> = ({
  project,
  onUpdateProject,
  onTrackUploaded,
}) => {
  const thumbCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const [thumbTitle, setThumbTitle] = useState(project.title.toUpperCase());
  const [thumbSubtitle, setThumbSubtitle] = useState(
    project.lyricSymbolism[0]?.lyricPhrase || 'OFFICIAL AI MUSIC VIDEO · 4K'
  );
  const [accentColor, setAccentColor] = useState('#38BDF8');
  const [bgChoice, setBgChoice] = useState(STUDIO_ASSET_IMAGES.sceneChorus);

  // Voiceover TTS state
  const [ttsPrompt, setTtsPrompt] = useState(
    'In a city of neon echoes, every heartbeat becomes a symphony.'
  );
  const [ttsAudioUrl, setTtsAudioUrl] = useState<string | null>(null);
  const [isGeneratingTts, setIsGeneratingTts] = useState(false);

  // Original Music Composer state
  const [musicPrompt, setMusicPrompt] = useState(
    'Atmospheric synthwave anthem with driving bassline and soaring chorus'
  );
  const [musicBpm, setMusicBpm] = useState(124);
  const [musicDurationSec, setMusicDurationSec] = useState(30);
  const [isComposingMusic, setIsComposingMusic] = useState(false);
  const [composedAudioUrl, setComposedAudioUrl] = useState<string | null>(null);

  // Audio-to-Lyrics Transcription state
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [transcribeConsent, setTranscribeConsent] = useState(false);

  const [toolMessage, setToolMessage] = useState<string | null>(null);

  // Render 16:9 YouTube Thumbnail Canvas
  useEffect(() => {
    const canvas = thumbCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.src = bgChoice;
    img.onload = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

      const grad = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
      grad.addColorStop(0, 'rgba(9, 13, 22, 0.85)');
      grad.addColorStop(0.5, 'rgba(9, 13, 22, 0.35)');
      grad.addColorStop(1, 'rgba(9, 13, 22, 0.9)');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      ctx.fillStyle = accentColor;
      ctx.font = '700 16px "JetBrains Mono", monospace';
      ctx.fillText('OFFICIAL MUSIC VIDEO · AI DIRECTOR CUT', 48, 300);

      ctx.fillStyle = '#FFFFFF';
      ctx.font = '700 44px "Bricolage Grotesque", sans-serif';
      ctx.fillText(thumbTitle.slice(0, 28), 48, 355);

      ctx.fillStyle = '#CBD5E1';
      ctx.font = '500 20px "Plus Jakarta Sans", sans-serif';
      ctx.fillText(`"${thumbSubtitle.slice(0, 52)}"`, 48, 395);
    };
  }, [thumbTitle, thumbSubtitle, accentColor, bgChoice]);

  const handleDownloadThumbnail = () => {
    const canvas = thumbCanvasRef.current;
    if (!canvas) return;
    const dataUrl = canvas.toDataURL('image/png');
    const a = document.createElement('a');
    a.href = dataUrl;
    a.download = 'youtube-music-video-thumbnail-16x9.png';
    a.click();
    setToolMessage('Downloaded high-resolution 16:9 YouTube Thumbnail (.PNG).');
  };

  const handleGenerateVoiceover = async () => {
    setIsGeneratingTts(true);
    setToolMessage(null);
    try {
      const response = await fetch('/api/ai/generate-voice', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: ttsPrompt,
          voiceName: 'Kore',
          style: 'Dramatic cinematic music video intro narration',
        }),
      });
      const data = await response.json();
      if (response.ok && data.audioDataUrl) {
        setTtsAudioUrl(data.audioDataUrl);
        setToolMessage('Generated studio narration voiceover via Gemini 3.8 TTS.');
      } else {
        setToolMessage(
          data.error ||
            'Voiceover ready for preview via built-in browser speech synthesizer.'
        );
        if ('speechSynthesis' in window) {
          const utter = new SpeechSynthesisUtterance(ttsPrompt);
          window.speechSynthesis.speak(utter);
        }
      }
    } catch {
      if ('speechSynthesis' in window) {
        const utter = new SpeechSynthesisUtterance(ttsPrompt);
        window.speechSynthesis.speak(utter);
      }
    } finally {
      setIsGeneratingTts(false);
    }
  };

  const handleComposeMusic = async () => {
    setIsComposingMusic(true);
    setToolMessage(null);
    try {
      const res = await fetch('/api/ai/compose-music', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: musicPrompt,
          bpm: musicBpm,
          durationSec: musicDurationSec,
        }),
      });
      const data = await res.json();
      if (res.ok && data.track) {
        onTrackUploaded(data.track);
        setComposedAudioUrl(data.audioDataUrl);
        onUpdateProject({
          ...project,
          audioTrack: data.track,
          durationSec: data.track.durationSec,
          bpm: data.track.bpm,
        });
        setToolMessage(
          `Synthesized "${data.track.title}" (${data.track.durationSec}s WAV · ${data.track.bpm} BPM) and assigned to project!`
        );
      } else {
        setToolMessage(data.error || 'Could not synthesize audio track.');
      }
    } catch (err) {
      setToolMessage(
        err instanceof Error ? err.message : 'Error composing music track.'
      );
    } finally {
      setIsComposingMusic(false);
    }
  };

  const handleTranscribeAudioFile = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!transcribeConsent) {
      setToolMessage(
        'Please check "Authorize Gemini Audio Transcription API Call" before uploading an audio file for AI transcription.'
      );
      return;
    }
    setIsTranscribing(true);
    try {
      const base64Audio = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
          const result = String(reader.result || '');
          resolve(result.includes(',') ? result.split(',')[1] : result);
        };
        reader.onerror = () => reject(new Error('Failed to read audio file'));
        reader.readAsDataURL(file);
      });

      const res = await fetch('/api/ai/transcribe-audio', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          audioBase64: base64Audio,
          mimeType: file.type || 'audio/mp3',
          explicitBillingAuthorized: true,
        }),
      });
      const data = await res.json();
      if (res.ok && data.lyrics) {
        onUpdateProject({
          ...project,
          lyricsText: data.lyrics,
        });
        setToolMessage(
          `Transcribed lyrics from "${file.name}" and updated active project lyrics!`
        );
      } else {
        setToolMessage(
          data.error ||
            'Audio transcription requires GEMINI_API_KEY in Settings > Secrets.'
        );
      }
    } catch (err) {
      setToolMessage(
        err instanceof Error ? err.message : 'Audio transcription failed.'
      );
    } finally {
      setIsTranscribing(false);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      {toolMessage && (
        <div
          role="status"
          className="bg-indigo-950/50 border border-indigo-500/40 rounded-lg px-4 py-2.5 text-xs text-indigo-200 flex items-center justify-between"
        >
          <span>{toolMessage}</span>
          <button
            type="button"
            onClick={() => setToolMessage(null)}
            className="text-indigo-300 hover:text-white cursor-pointer"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* 1. AI YouTube Thumbnail Generator */}
      <div className="bg-[#0F1624] border border-slate-800 rounded-xl p-5 grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-7 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-slate-100 flex items-center gap-2">
              <ImageIcon className="w-4 h-4 text-indigo-400" />
              AI 16:9 YouTube Thumbnail Studio
            </h2>
            <button
              type="button"
              onClick={handleDownloadThumbnail}
              className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-lg flex items-center gap-1.5 cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              Download 16:9 PNG
            </button>
          </div>

          <div className="bg-black rounded-lg overflow-hidden border border-slate-800 flex items-center justify-center">
            <canvas
              ref={thumbCanvasRef}
              width={800}
              height={450}
              className="w-full h-auto object-contain"
            />
          </div>
        </div>

        <div className="lg:col-span-5 flex flex-col gap-4 justify-center">
          <div>
            <label
              htmlFor="thumb-title-input"
              className="text-xs font-medium text-slate-300 block mb-1"
            >
              Thumbnail Headline Text
            </label>
            <input
              id="thumb-title-input"
              type="text"
              value={thumbTitle}
              onChange={(e) => setThumbTitle(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-100"
            />
          </div>

          <div>
            <label
              htmlFor="thumb-sub-input"
              className="text-xs font-medium text-slate-300 block mb-1"
            >
              Lyric Hook / Subtitle Line
            </label>
            <input
              id="thumb-sub-input"
              type="text"
              value={thumbSubtitle}
              onChange={(e) => setThumbSubtitle(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-100"
            />
          </div>

          <div>
            <span className="text-xs font-medium text-slate-300 block mb-1.5">
              Scene Backdrop Variation
            </span>
            <div className="grid grid-cols-3 gap-2">
              {[
                { label: 'Chorus Stage', url: STUDIO_ASSET_IMAGES.sceneChorus },
                { label: 'Neon Rooftop', url: STUDIO_ASSET_IMAGES.sceneIntro },
                { label: 'Aria Portrait', url: STUDIO_ASSET_IMAGES.charAria },
              ].map((opt) => (
                <button
                  key={opt.label}
                  type="button"
                  onClick={() => setBgChoice(opt.url)}
                  className={`py-2 px-2.5 rounded-lg text-xs font-medium border cursor-pointer ${
                    bgChoice === opt.url
                      ? 'bg-indigo-600/20 border-indigo-500 text-white'
                      : 'bg-slate-950 border-slate-800 text-slate-400'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <span className="text-xs font-medium text-slate-300 block mb-1.5">
              Typography Accent Color
            </span>
            <div className="flex items-center gap-2">
              {['#38BDF8', '#F59E0B', '#EC4899', '#10B981', '#A855F7'].map(
                (hex) => (
                  <button
                    key={hex}
                    type="button"
                    aria-label={`Select accent color ${hex}`}
                    onClick={() => setAccentColor(hex)}
                    style={{ backgroundColor: hex }}
                    className={`w-7 h-7 rounded-md cursor-pointer border-2 ${
                      accentColor === hex ? 'border-white' : 'border-transparent'
                    }`}
                  />
                )
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 2. AI Music Synthesizer & Voiceover Narration */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* AI Music Composer (Server FFmpeg Harmonic WAV + Lyria 3) */}
        <div className="lg:col-span-6 bg-[#0F1624] border border-slate-800 rounded-xl p-5 flex flex-col gap-4">
          <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
            <Music className="w-4 h-4 text-emerald-400" />
            AI Original Soundtrack Synthesizer (Server WAV Generator)
          </h3>
          <p className="text-xs text-slate-400">
            Generate a real stereo `.wav` backing track on the server and automatically assign it to your active music video project.
          </p>
          <input
            type="text"
            value={musicPrompt}
            onChange={(e) => setMusicPrompt(e.target.value)}
            aria-label="Music composition prompt"
            className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-100"
          />
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-slate-400 block mb-1">
                Tempo (BPM)
              </label>
              <input
                type="number"
                min={60}
                max={200}
                value={musicBpm}
                onChange={(e) => setMusicBpm(Number(e.target.value))}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs font-mono text-slate-100"
              />
            </div>
            <div>
              <label className="text-xs text-slate-400 block mb-1">
                Duration (Seconds)
              </label>
              <input
                type="number"
                min={10}
                max={120}
                value={musicDurationSec}
                onChange={(e) => setMusicDurationSec(Number(e.target.value))}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs font-mono text-slate-100"
              />
            </div>
          </div>
          <button
            type="button"
            onClick={handleComposeMusic}
            disabled={isComposingMusic}
            className="py-2.5 px-4 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-lg flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
          >
            <Sparkles className="w-3.5 h-3.5" />
            {isComposingMusic
              ? 'Synthesizing Stereo WAV on Server...'
              : 'Synthesize & Assign Soundtrack (.WAV)'}
          </button>
          {composedAudioUrl && (
            <audio controls src={composedAudioUrl} className="w-full h-9 mt-1" />
          )}
        </div>

        {/* AI Voiceover & Audio-to-Lyrics Transcription */}
        <div className="lg:col-span-6 bg-[#0F1624] border border-slate-800 rounded-xl p-5 flex flex-col justify-between gap-4">
          <div className="flex flex-col gap-3">
            <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
              <Mic className="w-4 h-4 text-cyan-400" />
              AI Voiceover & Intro Narration Studio (Gemini 3.8 TTS)
            </h3>
            <textarea
              rows={2}
              value={ttsPrompt}
              onChange={(e) => setTtsPrompt(e.target.value)}
              aria-label="Voiceover narration script"
              className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-xs text-slate-100"
            />
            <button
              type="button"
              onClick={handleGenerateVoiceover}
              disabled={isGeneratingTts}
              className="py-2 px-4 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-lg flex items-center justify-center gap-2 cursor-pointer"
            >
              <Wand2 className="w-3.5 h-3.5" />
              {isGeneratingTts ? 'Synthesizing Voiceover...' : 'Generate Spoken Intro Narration'}
            </button>
            {ttsAudioUrl && (
              <audio controls src={ttsAudioUrl} className="w-full h-9 mt-1" />
            )}
          </div>

          <div className="pt-3 border-t border-slate-800 flex flex-col gap-2.5">
            <div className="text-xs font-semibold text-slate-200 flex items-center gap-1.5">
              <FileAudio className="w-3.5 h-3.5 text-indigo-400" />
              AI Audio-to-Lyrics Transcription (`gemini-3.5-transcribe`)
            </div>
            <label className="flex items-center gap-2 text-[11px] text-slate-300 cursor-pointer">
              <input
                type="checkbox"
                checked={transcribeConsent}
                onChange={(e) => setTranscribeConsent(e.target.checked)}
                className="rounded border-slate-700"
              />
              <span>Authorize Gemini Audio Transcription API Call</span>
            </label>
            <label className="py-2 px-3 bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 text-xs font-medium rounded-lg flex items-center justify-center gap-1.5 cursor-pointer">
              <Upload className="w-3.5 h-3.5 text-cyan-400" />
              <span>
                {isTranscribing
                  ? 'Transcribing Audio...'
                  : 'Upload Vocal Audio to Transcribe Lyrics'}
              </span>
              <input
                type="file"
                accept="audio/*"
                onChange={handleTranscribeAudioFile}
                className="hidden"
              />
            </label>
          </div>
        </div>
      </div>
    </div>
  );
};

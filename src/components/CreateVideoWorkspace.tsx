import React, { useEffect, useState } from 'react';
import {
  AspectRatioOption,
  AudioTrackData,
  CharacterProfileItem,
  DirectorStyle,
  FlowAndProviderSettings,
  MusicVideoProject,
  ProviderPriority,
  ResolutionOption,
  SymbolismInterpretationMode,
} from '../types/studio';
import {
  analyzeLyricsForVisualSymbolism,
  calculateGenerationCost,
  DIRECTOR_STYLE_CONFIGS,
  formatTimecode,
  injectSymbolismIntoScenePrompt,
  syncLyricsToTimeline,
} from '../utils/studioEngine';
import { studioAudioEngine } from '../utils/audioSynth';
import { DirectorsCutPanel } from './DirectorsCutModal';
import {
  Activity,
  AlertTriangle,
  Check,
  CheckCircle2,
  Clapperboard,
  FileAudio,
  FileText,
  Layers,
  Music,
  Save,
  ShieldCheck,
  Sliders,
  Sparkles,
  Upload,
  Wand2,
} from 'lucide-react';

interface CreateVideoWorkspaceProps {
  project: MusicVideoProject;
  characters: CharacterProfileItem[];
  tracks: AudioTrackData[];
  flowSettings: FlowAndProviderSettings;
  onUpdateProject: (updated: MusicVideoProject) => void;
  onTrackUploaded: (newTrack: AudioTrackData) => void;
  onUpdateFlowSettings: (updated: FlowAndProviderSettings) => void;
  onNavigateTab: (tab: 'storyboard' | 'editor') => void;
}

const DIRECTOR_STYLES = Object.keys(DIRECTOR_STYLE_CONFIGS) as DirectorStyle[];

export const CreateVideoWorkspace: React.FC<CreateVideoWorkspaceProps> = ({
  project,
  characters,
  flowSettings,
  onUpdateProject,
  onTrackUploaded,
  onUpdateFlowSettings,
  onNavigateTab,
}) => {
  const [title, setTitle] = useState(project.title);
  const [description, setDescription] = useState(project.description);
  const [lyricsText, setLyricsText] = useState(project.lyricsText);
  const [directorStyle, setDirectorStyle] = useState<DirectorStyle>(project.directorStyle);
  const [aspectRatio, setAspectRatio] = useState<AspectRatioOption>(project.aspectRatio);
  const [resolution, setResolution] = useState<ResolutionOption>(project.resolution);
  const [selectedCharIds, setSelectedCharIds] = useState<string[]>(
    project.selectedCharacterIds
  );
  const [defaultSymbolismMode, setDefaultSymbolismMode] =
    useState<SymbolismInterpretationMode>('metaphorical');
  const [isDirectorsCutOpen, setIsDirectorsCutOpen] = useState<boolean>(false);
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [analysisNotice, setAnalysisNotice] = useState<string | null>(null);
  const [explicitApiConsentChecked, setExplicitApiConsentChecked] = useState<boolean>(false);

  // Sync local form fields when switching active project
  useEffect(() => {
    setTitle(project.title);
    setDescription(project.description);
    setLyricsText(project.lyricsText);
    setDirectorStyle(project.directorStyle);
    setAspectRatio(project.aspectRatio);
    setResolution(project.resolution);
    setSelectedCharIds(project.selectedCharacterIds);
    setUploadError(null);
    setAnalysisNotice(null);
  }, [project.id]);

  // Whether the current project has an actual uploaded song (or is the isolated Dev Demo Sandbox)
  const hasUploadedSong = Boolean(
    (project.audioTrack?.audioUrl && project.audioTrack.durationSec > 0) ||
      project.isDemoProject
  );

  const costEstimate = calculateGenerationCost({
    provider: flowSettings.preferredProvider,
    sceneCount: project.scenes.length || 8,
    resolution,
    apiFallbackEnabled: flowSettings.apiFallbackEnabled,
    veoApiEnabled: flowSettings.veoApiEnabled,
  });

  // Complete 9-Step Real MP3 / WAV Upload Pipeline (BUG 2 Fixed)
  const handleAudioFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadError(null);
    setAnalysisNotice(null);

    // STEP 2: Validate file type and size
    const ext = file.name.includes('.')
      ? `.${file.name.split('.').pop()?.toLowerCase()}`
      : '';
    const allowedExts = ['.mp3', '.wav', '.ogg', '.m4a', '.aac', '.flac'];
    if (!allowedExts.includes(ext) && !file.type.startsWith('audio/')) {
      setUploadError(
        `Invalid file type "${file.name}". Please select an MP3, WAV, OGG, M4A, AAC, or FLAC audio file.`
      );
      return;
    }
    if (file.size === 0) {
      setUploadError(`Selected file "${file.name}" is empty (0 bytes).`);
      return;
    }
    if (file.size > 70 * 1024 * 1024) {
      setUploadError(`Selected file "${file.name}" exceeds 70 MB limit.`);
      return;
    }

    setUploadProgress(5);

    try {
      // Optional client WebAudio decode (server ffprobe + PCM DSP is authoritative)
      try {
        await studioAudioEngine.analyzeUploadedAudioFile(file);
      } catch {
        // Server ffprobe + ffmpeg PCM analyzer handles decoding authoritatively
      }
      setUploadProgress(20);

      // STEP 3: Read file as Base64 for persistent server upload
      const base64Data = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result || ''));
        reader.onerror = () => reject(new Error('Failed to read audio file from disk.'));
        reader.readAsDataURL(file);
      });

      setUploadProgress(40);

      // STEP 4-7: Upload to server, save to /storage/uploads, link to project.id, and run ffprobe + PCM DSP
      const responsePayload = await new Promise<{
        track: AudioTrackData;
        project?: MusicVideoProject;
      }>((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open('POST', '/api/audio/upload');
        xhr.setRequestHeader('Content-Type', 'application/json');

        xhr.upload.onprogress = (ev) => {
          if (ev.lengthComputable) {
            const pct = 40 + Math.round((ev.loaded / ev.total) * 55);
            setUploadProgress(Math.min(95, pct));
          }
        };

        xhr.onload = () => {
          try {
            const json = JSON.parse(xhr.responseText || '{}');
            if (xhr.status >= 200 && xhr.status < 300 && json.track) {
              resolve(json);
            } else {
              reject(new Error(json.error || `Upload failed with status ${xhr.status}`));
            }
          } catch {
            reject(new Error('Invalid response from audio upload server.'));
          }
        };

        xhr.onerror = () => reject(new Error('Network error while uploading audio file.'));

        xhr.send(
          JSON.stringify({
            projectId: project.id,
            ownerId: project.ownerId,
            fileName: file.name,
            base64Data,
          })
        );
      });

      setUploadProgress(100);
      const uploadedTrack = responsePayload.track;
      onTrackUploaded(uploadedTrack);

      // STEP 8: Display the uploaded song in the current project
      if (responsePayload.project) {
        onUpdateProject(responsePayload.project);
        setTitle(responsePayload.project.title);
      } else {
        onUpdateProject({
          ...project,
          title:
            project.title.startsWith('Untitled')
              ? uploadedTrack.title
              : project.title,
          audioTrack: uploadedTrack,
          durationSec: uploadedTrack.durationSec,
          bpm: uploadedTrack.bpm,
          musicalKey: uploadedTrack.musicalKey,
          mood: uploadedTrack.mood,
          status: 'audio_uploaded',
          scenes: [],
          sceneCount: 0,
          completedScenes: 0,
          updatedAtIso: new Date().toISOString(),
        });
      }

      setAnalysisNotice(
        `Uploaded & verified "${uploadedTrack.fileName || uploadedTrack.title}" (${formatTimecode(
          uploadedTrack.durationSec
        )} · ${uploadedTrack.bpm} BPM · ${uploadedTrack.sampleRate} Hz · ${
          uploadedTrack.channels
        }ch). Step 2 ("Analyze Song & Generate Storyboard") is now enabled!`
      );
      window.setTimeout(() => setUploadProgress(null), 1000);
    } catch (err) {
      setUploadProgress(null);
      setUploadError(
        err instanceof Error ? err.message : 'Could not upload or decode audio file.'
      );
    }
  };

  const handleLyricsFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const text = await file.text();
      const cleaned = text
        .replace(/^\d+\s*$/gm, '')
        .replace(/\d{2}:\d{2}:\d{2}[,.]\d{3}\s*-->\s*\d{2}:\d{2}:\d{2}[,.]\d{3}/g, '')
        .replace(/\[\d{2}:\d{2}(?:\.\d{2,3})?\]/g, '')
        .split('\n')
        .map((l) => l.trim())
        .filter(Boolean)
        .join('\n');
      setLyricsText(cleaned);
      setAnalysisNotice(`Loaded lyrics from "${file.name}" (${cleaned.split('\n').length} lines).`);
    } catch {
      setUploadError('Failed to read lyrics text file.');
    }
  };

  const handleSaveDraftExplicitly = () => {
    const dur = project.audioTrack?.durationSec || project.durationSec || 0;
    const updatedSym =
      dur > 0
        ? analyzeLyricsForVisualSymbolism(
            lyricsText,
            dur,
            directorStyle,
            defaultSymbolismMode,
            project.id
          )
        : [];
    const updatedSubs =
      dur > 0
        ? syncLyricsToTimeline(lyricsText, dur, aspectRatio, project.id)
        : [];
    onUpdateProject({
      ...project,
      title: title.trim() || project.title,
      description: description.trim(),
      lyricsText,
      directorStyle,
      aspectRatio,
      resolution,
      selectedCharacterIds: selectedCharIds,
      lyricSymbolism: updatedSym,
      subtitles: updatedSubs,
      updatedAtIso: new Date().toISOString(),
    });
    setAnalysisNotice(
      `Saved project "${title.trim() || project.title}" to persistent database at ${new Date().toLocaleTimeString()}.`
    );
  };

  const handleToggleCharacter = (charId: string) => {
    setSelectedCharIds((prev) =>
      prev.includes(charId) ? prev.filter((id) => id !== charId) : [...prev, charId]
    );
  };

  const handleSymbolismItemModeChange = (
    itemId: string,
    newMode: SymbolismInterpretationMode
  ) => {
    const selectedChars = characters.filter((c) => selectedCharIds.includes(c.id));
    const updatedSymbolism = project.lyricSymbolism.map((item) => {
      if (item.id !== itemId) return item;
      const activeVisual =
        newMode === 'literal'
          ? item.literalVisualElement
          : newMode === 'hybrid'
            ? `${item.literalVisualElement} morphing into ${item.visualElement.toLowerCase()}`
            : item.visualElement;
      return {
        ...item,
        activeMode: newMode,
        directorPromptInjection: `Symbolic Visual Cue (${newMode.toUpperCase()}): ${activeVisual} — representing "${
          item.lyricPhrase
        }"`,
      };
    });

    const targetSym = updatedSymbolism.find((s) => s.id === itemId);
    const updatedScenes = project.scenes.map((scene) => {
      if (scene.linkedSymbolismId !== itemId || !targetSym) return scene;
      const injected = injectSymbolismIntoScenePrompt(
        scene.visualPrompt,
        targetSym,
        newMode,
        directorStyle,
        selectedChars
      );
      return {
        ...scene,
        symbolismMode: newMode,
        symbolismVisualMotif: injected.activeMotif,
        visualPrompt: injected.updatedVisualPrompt,
        googleFlowPrompt: injected.updatedGoogleFlowPrompt,
      };
    });

    onUpdateProject({
      ...project,
      lyricSymbolism: updatedSymbolism,
      scenes: updatedScenes,
      updatedAtIso: new Date().toISOString(),
    });
  };

  // BUG 3 & BUG 4 FIX: Real Song Analysis & Dynamic Storyboard (Strictly matches uploaded song duration)
  const handleAnalyzeAndGenerateStoryboard = async () => {
    setUploadError(null);
    setAnalysisNotice(null);

    if (!hasUploadedSong) {
      setUploadError(
        'Please upload an MP3 or WAV audio file in Step 1 before clicking Analyze Song.'
      );
      return;
    }

    if (
      flowSettings.preferredProvider === 'google_veo_api_priority_2' &&
      !explicitApiConsentChecked
    ) {
      setUploadError(
        'Separate API Billing Safeguard: Please check the explicit API billing authorization box or switch to Priority 3 (Procedural Cinema Engine).'
      );
      return;
    }

    setIsAnalyzing(true);

    try {
      const response = await fetch('/api/ai/analyze-song', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId: project.id,
          title: title.trim() || project.audioTrack.title || project.title,
          description: description.trim(),
          lyrics: lyricsText,
          directorStyle,
          aspectRatio,
          resolution,
          selectedCharacterIds: selectedCharIds,
          symbolismMode: defaultSymbolismMode,
          providerMode: flowSettings.preferredProvider,
          explicitBillingAuthorized: explicitApiConsentChecked,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to analyze song and generate storyboard.');
      }

      if (data.project) {
        onUpdateProject(data.project as MusicVideoProject);
      }

      setAnalysisNotice(
        data.providerNotice ||
          `Generated ${data.project?.scenes?.length || 0}-scene storyboard covering exact song duration ${formatTimecode(
            data.project?.durationSec || project.durationSec
          )} and saved to database.`
      );
      setIsDirectorsCutOpen(true);
    } catch (err) {
      setUploadError(
        err instanceof Error ? err.message : 'Error analyzing song and generating storyboard.'
      );
    } finally {
      setIsAnalyzing(false);
    }
  };

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return '0 KB';
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Top Provider Status & Save Toolbar */}
      <div className="bg-[#0F1624] border border-slate-800 rounded-xl p-4 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-start gap-3">
          <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
          <div>
            <div className="flex flex-wrap items-center gap-2 text-xs font-semibold text-slate-100">
              <span>Project ID:</span>
              <span className="font-mono text-indigo-300">{project.id}</span>
              <span aria-hidden="true">·</span>
              <span>Selected Provider:</span>
              <span className="text-emerald-400">{costEstimate.providerLabel}</span>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Every project is strictly isolated in the database. Storyboard duration is locked to your uploaded song&apos;s exact duration (
              <strong className="text-slate-200 font-mono">
                {formatTimecode(project.audioTrack?.durationSec || 0)}
              </strong>
              ).
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleSaveDraftExplicitly}
            className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Save className="w-3.5 h-3.5 text-emerald-400" />
            Save Project
          </button>

          {project.scenes.length > 0 && (
            <button
              type="button"
              onClick={() => setIsDirectorsCutOpen(!isDirectorsCutOpen)}
              className={`px-3.5 py-2 text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0 cursor-pointer border ${
                isDirectorsCutOpen
                  ? 'bg-indigo-600 border-indigo-500 text-white'
                  : 'bg-slate-900 hover:bg-slate-800 border-slate-700 text-slate-200'
              }`}
            >
              <Sliders className="w-3.5 h-3.5" />
              {isDirectorsCutOpen ? "Hide Director's Cut Desk" : "Open Director's Cut Mode"}
            </button>
          )}
        </div>
      </div>

      {uploadProgress !== null && (
        <div className="bg-slate-900 border border-cyan-500/40 rounded-xl p-4 flex flex-col gap-2">
          <div className="flex items-center justify-between text-xs text-cyan-200 font-medium">
            <span>Uploading Audio to Persistent Storage & Running Server ffprobe + PCM DSP...</span>
            <span className="font-mono">{uploadProgress}%</span>
          </div>
          <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-cyan-400 transition-all duration-150"
              style={{ width: `${uploadProgress}%` }}
            />
          </div>
        </div>
      )}

      {uploadError && (
        <div
          role="alert"
          className="bg-rose-950/60 border border-rose-500/50 rounded-xl px-4 py-3 text-xs text-rose-200 flex items-center justify-between"
        >
          <span>{uploadError}</span>
          <button
            type="button"
            onClick={() => setUploadError(null)}
            className="text-rose-300 hover:text-white font-medium cursor-pointer ml-4"
          >
            Dismiss
          </button>
        </div>
      )}

      {analysisNotice && (
        <div
          role="status"
          className="bg-indigo-950/50 border border-indigo-500/40 rounded-xl px-4 py-3 text-xs text-indigo-200 flex flex-wrap items-center justify-between gap-4"
        >
          <span>{analysisNotice}</span>
          {project.scenes.length > 0 && (
            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => onNavigateTab('storyboard')}
                className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg font-semibold cursor-pointer"
              >
                Open Storyboard ({project.scenes.length} Scenes)
              </button>
              <button
                type="button"
                onClick={() => onNavigateTab('editor')}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg font-medium cursor-pointer"
              >
                Open Video Editor
              </button>
            </div>
          )}
        </div>
      )}

      {/* Director's Cut Pre-Generation Desk */}
      {isDirectorsCutOpen && project.scenes.length > 0 && (
        <DirectorsCutPanel
          scenes={project.scenes}
          directorStyle={directorStyle}
          explicitBillingAuthorized={explicitApiConsentChecked}
          onUpdateScenes={(updatedScenes) =>
            onUpdateProject({
              ...project,
              scenes: updatedScenes,
              updatedAtIso: new Date().toISOString(),
            })
          }
          onLockAndProceedToGeneration={() => onNavigateTab('storyboard')}
        />
      )}

      {/* Main 12-Col Creation Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left 7 Cols: Step 1 Song Upload, Metadata, Waveform & Lyrics */}
        <div className="lg:col-span-7 flex flex-col gap-6">
          {/* 1. Audio Source & Metadata Card */}
          <div className="bg-[#0F1624] border border-slate-800 rounded-xl p-5 flex flex-col gap-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-base font-bold text-slate-100 flex items-center gap-2">
                  <Music className="w-4 h-4 text-indigo-400" />
                  Step 01. Upload Song Audio (MP3 / WAV) & Inspect Signal Metadata
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Upload a real audio file to extract exact duration, sample rate, channels, BPM, and waveform.
                </p>
              </div>

              <label className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 rounded-lg text-xs font-semibold text-white flex items-center gap-2 cursor-pointer transition-colors shrink-0">
                <Upload className="w-4 h-4" />
                <span>Upload MP3 / WAV Song</span>
                <input
                  data-testid="upload-song-input"
                  type="file"
                  accept=".mp3,.wav,.ogg,.m4a,.aac,.flac,audio/*"
                  onChange={handleAudioFileUpload}
                  className="hidden"
                />
              </label>
            </div>

            {/* Uploaded Song Metadata & Signal Analysis Panel */}
            {hasUploadedSong ? (
              <div className="bg-slate-950 border border-emerald-500/40 rounded-xl p-4 flex flex-col gap-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2 text-xs font-semibold text-emerald-300">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>
                      Uploaded Song Linked to Project: {project.audioTrack.fileName || project.audioTrack.title}
                    </span>
                  </div>
                  <span className="font-mono text-[11px] text-slate-400">
                    Asset ID: {project.audioTrack.id}
                  </span>
                </div>

                {/* 6 Required Audio Metadata Fields + Signal Analysis */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 text-xs">
                  <div className="bg-slate-900/90 border border-slate-800 rounded-lg p-2.5">
                    <div className="text-[10px] uppercase text-slate-400">Filename</div>
                    <div className="font-mono text-slate-100 truncate mt-0.5">
                      {project.audioTrack.fileName || project.audioTrack.title}
                    </div>
                  </div>
                  <div className="bg-slate-900/90 border border-slate-800 rounded-lg p-2.5">
                    <div className="text-[10px] uppercase text-slate-400">Exact Duration</div>
                    <div
                      data-testid="uploaded-audio-duration"
                      className="font-mono font-bold text-emerald-400 mt-0.5"
                    >
                      {formatTimecode(project.audioTrack.durationSec)} ({project.audioTrack.durationSec}s)
                    </div>
                  </div>
                  <div className="bg-slate-900/90 border border-slate-800 rounded-lg p-2.5">
                    <div className="text-[10px] uppercase text-slate-400">Format / Codec</div>
                    <div className="font-mono text-slate-100 uppercase mt-0.5">
                      {project.audioTrack.format || project.audioTrack.codecName || 'AUDIO'}
                    </div>
                  </div>
                  <div className="bg-slate-900/90 border border-slate-800 rounded-lg p-2.5">
                    <div className="text-[10px] uppercase text-slate-400">File Size</div>
                    <div className="font-mono text-slate-100 mt-0.5">
                      {formatFileSize(project.audioTrack.fileSizeBytes)}
                    </div>
                  </div>
                  <div className="bg-slate-900/90 border border-slate-800 rounded-lg p-2.5">
                    <div className="text-[10px] uppercase text-slate-400">Sample Rate & Channels</div>
                    <div className="font-mono text-slate-100 mt-0.5">
                      {project.audioTrack.sampleRate || 44100} Hz ·{' '}
                      {project.audioTrack.channels || 2}ch
                    </div>
                  </div>
                  <div className="bg-slate-900/90 border border-slate-800 rounded-lg p-2.5">
                    <div className="text-[10px] uppercase text-slate-400">Measured BPM & Energy</div>
                    <div className="font-mono text-indigo-300 mt-0.5">
                      {project.audioTrack.bpm} BPM · Energy {project.audioTrack.energyScore ?? 70}/100
                    </div>
                  </div>
                </div>

                {project.audioTrack.audioUrl && (
                  <audio
                    controls
                    src={project.audioTrack.audioUrl}
                    className="w-full h-9"
                  />
                )}

                {/* 80-Bar Real Audio Waveform */}
                <div>
                  <div className="flex items-center justify-between text-[11px] text-slate-400 mb-1">
                    <span>Measured PCM Audio Waveform ({project.audioTrack.waveformPeaks.length} bars)</span>
                    <span className="font-mono">{project.audioTrack.mood}</span>
                  </div>
                  <div className="h-10 bg-slate-900/80 border border-slate-800 rounded-lg px-2 flex items-center gap-0.5">
                    {project.audioTrack.waveformPeaks.slice(0, 80).map((peak, idx) => (
                      <div
                        key={idx}
                        style={{ height: `${Math.max(15, Math.round(peak * 95))}%` }}
                        className="flex-1 bg-indigo-500/80 rounded-sm"
                      />
                    ))}
                  </div>
                </div>

                {/* Detected Structural Sections */}
                {project.audioTrack.detectedSections &&
                  project.audioTrack.detectedSections.length > 0 && (
                    <div className="pt-1">
                      <div className="text-[11px] font-medium text-slate-300 mb-1.5 flex items-center gap-1.5">
                        <Activity className="w-3.5 h-3.5 text-cyan-400" />
                        Detected Song Structure Sections (00:00 – {formatTimecode(project.audioTrack.durationSec)})
                      </div>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 text-[11px]">
                        {project.audioTrack.detectedSections.map((sec, idx) => (
                          <div
                            key={idx}
                            className="bg-slate-900 border border-slate-800 rounded px-2 py-1.5"
                          >
                            <div className="font-semibold text-slate-200 truncate">
                              {sec.section}
                            </div>
                            <div className="font-mono text-[10px] text-indigo-300">
                              {formatTimecode(sec.startTimeSec)}–{formatTimecode(sec.endTimeSec)}
                            </div>
                            <div className="text-[10px] text-slate-400 truncate">
                              {sec.energyLevel}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
              </div>
            ) : (
              <div className="bg-slate-950/90 border border-dashed border-slate-700 rounded-xl p-6 text-center flex flex-col items-center gap-2">
                <FileAudio className="w-8 h-8 text-slate-500" />
                <div className="text-sm font-semibold text-slate-200">
                  No Audio File Uploaded to This Project Yet
                </div>
                <p className="text-xs text-slate-400 max-w-md">
                  Click <strong>Upload MP3 / WAV Song</strong> above to upload your audio track. The studio will read its exact duration, sample rate, channels, BPM, and waveform before enabling Song Analysis.
                </p>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label
                  htmlFor="song-title-input"
                  className="text-xs font-medium text-slate-300 block mb-1.5"
                >
                  Song / Project Title
                </label>
                <input
                  id="song-title-input"
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Enter song title..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3.5 py-2 text-xs text-slate-100 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label
                  htmlFor="song-description-input"
                  className="text-xs font-medium text-slate-300 block mb-1.5"
                >
                  Narrative Concept & Visual Atmosphere
                </label>
                <input
                  id="song-description-input"
                  type="text"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="e.g., Rain-slicked cyberpunk skyline..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3.5 py-2 text-xs text-slate-100 focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>

            <div>
              <div className="flex flex-wrap items-center justify-between gap-2 mb-1.5">
                <label
                  htmlFor="song-lyrics-textarea"
                  className="text-xs font-medium text-slate-300"
                >
                  Song Lyrics (Optional — Analyzed Line-by-Line for Storyboard & Subtitles)
                </label>
                <div className="flex items-center gap-2">
                  <label className="px-2.5 py-1 bg-slate-900 hover:bg-slate-800 border border-slate-700 rounded text-[11px] font-medium text-slate-200 flex items-center gap-1 cursor-pointer">
                    <FileText className="w-3 h-3 text-cyan-400" />
                    <span>Upload Lyrics (.TXT / .SRT)</span>
                    <input
                      type="file"
                      accept=".txt,.lrc,.srt"
                      onChange={handleLyricsFileUpload}
                      className="hidden"
                    />
                  </label>
                  <span className="text-[11px] font-mono tabular-nums text-slate-400">
                    {lyricsText.split('\n').filter((l) => l.trim().length > 0).length} Lines
                  </span>
                </div>
              </div>
              <textarea
                id="song-lyrics-textarea"
                rows={4}
                value={lyricsText}
                onChange={(e) => setLyricsText(e.target.value)}
                placeholder="Paste song lyrics here (or leave blank for instrumental / audio-signal analysis)..."
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-xs text-slate-100 focus:outline-none focus:border-indigo-500 leading-relaxed"
              />
            </div>
          </div>

          {/* 2. Lyric Metaphor & Visual Symbolism Interactive Inspector */}
          <div className="bg-[#0F1624] border border-slate-800 rounded-xl p-5 flex flex-col gap-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-base font-bold text-slate-100 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-cyan-400" />
                  Step 02. Lyric Metaphor & Visual Symbolism Cues ({project.lyricSymbolism.length})
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Generated when you click Analyze Song. Maps each phrase or musical section to visual symbolism.
                </p>
              </div>

              {project.lyricSymbolism.length > 0 && (
                <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-lg border border-slate-800">
                  {(['metaphorical', 'literal', 'hybrid'] as SymbolismInterpretationMode[]).map(
                    (mode) => (
                      <button
                        key={mode}
                        type="button"
                        onClick={() => {
                          setDefaultSymbolismMode(mode);
                          const refreshed = analyzeLyricsForVisualSymbolism(
                            lyricsText,
                            project.durationSec || 60,
                            directorStyle,
                            mode,
                            project.id
                          );
                          onUpdateProject({
                            ...project,
                            lyricSymbolism: refreshed,
                          });
                        }}
                        className={`px-2.5 py-1 text-xs font-medium rounded-md capitalize transition-colors cursor-pointer ${
                          defaultSymbolismMode === mode
                            ? 'bg-indigo-600 text-white'
                            : 'text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        All {mode}
                      </button>
                    )
                  )}
                </div>
              )}
            </div>

            {project.lyricSymbolism.length === 0 ? (
              <div className="bg-slate-950/60 border border-slate-800 rounded-lg p-4 text-xs text-slate-400">
                No symbolism cues generated for this project yet. Upload your song in Step 01 and click <strong>Analyze Song &amp; Generate Storyboard</strong>.
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-3 max-h-[340px] overflow-y-auto pr-1">
                {project.lyricSymbolism.map((item) => (
                  <div
                    key={item.id}
                    className="bg-slate-950/80 border border-slate-800/90 rounded-lg p-3.5 flex flex-col gap-2.5"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2 text-xs">
                        <span className="font-mono tabular-nums text-indigo-400">
                          {formatTimecode(item.startTimeSec)}–{formatTimecode(item.endTimeSec)}
                        </span>
                        <span aria-hidden="true" className="text-slate-600">
                          ·
                        </span>
                        <span className="text-slate-400">{item.section}</span>
                        <span aria-hidden="true" className="text-slate-600">
                          ·
                        </span>
                        <span className="font-semibold text-slate-100">
                          &ldquo;{item.lyricPhrase}&rdquo;
                        </span>
                      </div>

                      <div className="flex items-center gap-1 bg-slate-900 p-0.5 rounded-md border border-slate-800">
                        {(
                          ['metaphorical', 'literal', 'hybrid'] as SymbolismInterpretationMode[]
                        ).map((m) => (
                          <button
                            key={m}
                            type="button"
                            onClick={() => handleSymbolismItemModeChange(item.id, m)}
                            className={`px-2 py-0.5 text-[11px] font-medium rounded capitalize cursor-pointer ${
                              item.activeMode === m
                                ? 'bg-indigo-600 text-white'
                                : 'text-slate-400 hover:text-slate-200'
                            }`}
                          >
                            {m}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
                      <div className="bg-slate-900/70 rounded p-2.5 border border-slate-800/60">
                        <div className="text-[11px] text-slate-400 font-medium mb-0.5">
                          Literal Meaning &amp; Staging
                        </div>
                        <div className="text-slate-200">{item.literalMeaning}</div>
                      </div>
                      <div className="bg-slate-900/70 rounded p-2.5 border border-slate-800/60">
                        <div className="text-[11px] text-cyan-400 font-medium mb-0.5">
                          Metaphorical Subtext &amp; Visual Motif
                        </div>
                        <div className="text-slate-200">
                          {item.metaphoricalMeaning} —{' '}
                          <strong className="text-indigo-300">{item.visualElement}</strong>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right 5 Cols: AI Music Video Director, Aspect Ratio, Cast & Provider Adapters */}
        <div className="lg:col-span-5 flex flex-col gap-6">
          {/* 3. AI Music Video Director Style Selector */}
          <div className="bg-[#0F1624] border border-slate-800 rounded-xl p-5 flex flex-col gap-4">
            <h2 className="text-base font-bold text-slate-100 flex items-center gap-2">
              <Clapperboard className="w-4 h-4 text-indigo-400" />
              Step 03. Director Style, Aspect Ratio &amp; Character Cast
            </h2>

            <div className="grid grid-cols-2 gap-2">
              {DIRECTOR_STYLES.map((style) => {
                const isSelected = directorStyle === style;
                return (
                  <button
                    key={style}
                    type="button"
                    onClick={() => setDirectorStyle(style)}
                    className={`px-3 py-2 rounded-lg text-xs font-medium text-left transition-colors cursor-pointer border truncate ${
                      isSelected
                        ? 'bg-indigo-600/20 border-indigo-500 text-white'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {style}
                  </button>
                );
              })}
            </div>

            {/* Aspect Ratio & Resolution */}
            <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-800">
              <div>
                <span className="text-xs font-medium text-slate-300 block mb-1.5">
                  Aspect Ratio
                </span>
                <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-lg border border-slate-800">
                  {(['16:9', '9:16', '1:1'] as AspectRatioOption[]).map((ratio) => (
                    <button
                      key={ratio}
                      type="button"
                      onClick={() => setAspectRatio(ratio)}
                      className={`flex-1 py-1.5 text-xs font-mono font-medium rounded-md transition-colors cursor-pointer ${
                        aspectRatio === ratio
                          ? 'bg-indigo-600 text-white'
                          : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      {ratio}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <span className="text-xs font-medium text-slate-300 block mb-1.5">
                  Target Resolution
                </span>
                <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-lg border border-slate-800">
                  {(['720p', '1080p', '4K'] as ResolutionOption[]).map((res) => (
                    <button
                      key={res}
                      type="button"
                      onClick={() => setResolution(res)}
                      className={`flex-1 py-1.5 text-xs font-mono font-medium rounded-md transition-colors cursor-pointer ${
                        resolution === res
                          ? 'bg-indigo-600 text-white'
                          : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      {res}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Character Consistency Selection */}
            <div className="pt-2 border-t border-slate-800">
              <span className="text-xs font-medium text-slate-300 block mb-2">
                Character Consistency Lock (Optional)
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {characters.map((char) => {
                  const isChecked = selectedCharIds.includes(char.id);
                  return (
                    <button
                      key={char.id}
                      type="button"
                      onClick={() => handleToggleCharacter(char.id)}
                      className={`p-2.5 rounded-lg border text-left flex items-center gap-2.5 transition-colors cursor-pointer ${
                        isChecked
                          ? 'bg-indigo-600/15 border-indigo-500 text-slate-100'
                          : 'bg-slate-950 border-slate-800 text-slate-400'
                      }`}
                    >
                      <img
                        src={char.referenceImageUrl}
                        alt={char.name}
                        referrerPolicy="no-referrer"
                        className="w-9 h-9 rounded-md object-cover shrink-0 bg-slate-800"
                      />
                      <div className="min-w-0 flex-1">
                        <div className="text-xs font-semibold truncate">{char.name}</div>
                        <div className="text-[11px] text-slate-400 truncate">{char.role}</div>
                      </div>
                      {isChecked && <Check className="w-4 h-4 text-indigo-400 shrink-0" />}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* 4. Real Video Generation Provider Adapters & Analyze Song Button */}
          <div className="bg-[#0F1624] border border-slate-800 rounded-xl p-5 flex flex-col gap-4">
            <h2 className="text-base font-bold text-slate-100 flex items-center gap-2">
              <Layers className="w-4 h-4 text-emerald-400" />
              Step 04. Video Generation Provider Adapter &amp; Song Analysis
            </h2>

            <div className="flex flex-col gap-2">
              {(
                [
                  {
                    id: 'procedural_cinema_priority_3',
                    title: 'Priority 3: Procedural Cinema Engine (Active Default)',
                    badge: 'ACTIVE · WORKING',
                    badgeClass: 'bg-emerald-950 text-emerald-300 border-emerald-500/40',
                    sub: 'Browser WebGL/Canvas + FFmpeg Audio-Reactive Motion Graphics (Not AI Video · 0 API Cost)',
                  },
                  {
                    id: 'google_veo_api_priority_2',
                    title: 'Priority 2: Official Google Veo / Omni API',
                    badge: flowSettings.veoApiEnabled ? 'ENABLED (PAID API)' : 'DISABLED BY ADMIN',
                    badgeClass: flowSettings.veoApiEnabled
                      ? 'bg-amber-950 text-amber-300 border-amber-500/40'
                      : 'bg-slate-900 text-slate-400 border-slate-700',
                    sub: 'Official server-side Veo adapter · Requires Admin enable + GEMINI_API_KEY + Cost Confirmation',
                  },
                  {
                    id: 'google_flow_priority_1',
                    title: 'Priority 1: Google AI Pro / Google Flow Subscription',
                    badge: 'NOT INTEGRATED',
                    badgeClass: 'bg-rose-950 text-rose-300 border-rose-500/40',
                    sub: 'Google exposes no public external API for consumer Flow credits. Manual prompt copy/upload only.',
                  },
                ] as {
                  id: ProviderPriority;
                  title: string;
                  badge: string;
                  badgeClass: string;
                  sub: string;
                }[]
              ).map((prov) => {
                const isSelected = flowSettings.preferredProvider === prov.id;
                return (
                  <button
                    key={prov.id}
                    type="button"
                    onClick={() =>
                      onUpdateFlowSettings({
                        ...flowSettings,
                        preferredProvider: prov.id,
                      })
                    }
                    className={`p-3 rounded-lg border text-left transition-colors cursor-pointer ${
                      isSelected
                        ? 'bg-indigo-600/20 border-indigo-500 text-slate-100'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-semibold">{prov.title}</span>
                      <span
                        className={`px-2 py-0.5 text-[10px] font-mono rounded border shrink-0 ${prov.badgeClass}`}
                      >
                        {prov.badge}
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-400 mt-1">{prov.sub}</div>
                  </button>
                );
              })}
            </div>

            {costEstimate.warningMessage && (
              <div className="bg-amber-950/40 border border-amber-500/40 rounded-lg p-3 text-xs text-amber-200 flex flex-col gap-2">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                  <span>{costEstimate.warningMessage}</span>
                </div>
                {flowSettings.preferredProvider === 'google_veo_api_priority_2' && (
                  <label className="flex items-center gap-2 pt-1 cursor-pointer text-amber-100 font-medium">
                    <input
                      type="checkbox"
                      checked={explicitApiConsentChecked}
                      onChange={(e) => setExplicitApiConsentChecked(e.target.checked)}
                      className="accent-amber-500"
                    />
                    <span>
                      I explicitly authorize using the separately billed Google Veo API for this request.
                    </span>
                  </label>
                )}
              </div>
            )}

            <button
              data-testid="analyze-song-btn"
              type="button"
              onClick={() => void handleAnalyzeAndGenerateStoryboard()}
              disabled={!hasUploadedSong || isAnalyzing}
              className="w-full py-3 px-4 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-lg flex items-center justify-center gap-2 transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <Wand2 className="w-4 h-4" />
              {!hasUploadedSong
                ? 'Upload an MP3/WAV Song in Step 01 to Enable Analysis'
                : isAnalyzing
                  ? 'Analyzing Audio Signal, Lyrics & Building Storyboard...'
                  : `Analyze Song & Generate Storyboard (${formatTimecode(
                      project.audioTrack.durationSec
                    )})`}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

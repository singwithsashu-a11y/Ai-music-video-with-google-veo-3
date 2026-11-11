import React, { useState } from 'react';
import {
  CharacterProfileItem,
  FlowAndProviderSettings,
  MusicVideoProject,
  ProviderPriority,
  StoryboardScene,
  StudioBackgroundJob,
  SymbolismInterpretationMode,
} from '../types/studio';
import {
  formatTimecode,
  injectSymbolismIntoScenePrompt,
} from '../utils/studioEngine';
import { DirectorsCutPanel } from './DirectorsCutModal';
import {
  AlertTriangle,
  Camera,
  Check,
  Clock,
  Copy,
  Download,
  ExternalLink,
  Film,
  Play,
  RefreshCw,
  ShieldCheck,
  Sliders,
  Sparkles,
  Upload,
  Video,
  XCircle,
} from 'lucide-react';

interface StoryboardWorkspaceProps {
  project: MusicVideoProject;
  characters: CharacterProfileItem[];
  flowSettings: FlowAndProviderSettings;
  jobs: StudioBackgroundJob[];
  onUpdateProject: (updated: MusicVideoProject) => void;
  onRefreshJobs: () => void;
  onNavigateEditor: () => void;
}

export const StoryboardWorkspace: React.FC<StoryboardWorkspaceProps> = ({
  project,
  characters,
  flowSettings,
  jobs,
  onUpdateProject,
  onRefreshJobs,
  onNavigateEditor,
}) => {
  const [showDirectorsCut, setShowDirectorsCut] = useState(false);
  const [copiedSceneId, setCopiedSceneId] = useState<string | null>(null);
  const [explicitVeoConsentModalScene, setExplicitVeoConsentModalScene] =
    useState<StoryboardScene | null>(null);
  const [actionStatus, setActionStatus] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [uploadingSceneId, setUploadingSceneId] = useState<string | null>(null);

  const projectChars = characters.filter((c) =>
    project.selectedCharacterIds.includes(c.id)
  );

  // Strictly filter jobs by the current project.id (BUG 1 & BUG 6)
  const projectJobs = jobs.filter((j) => j.projectId === project.id);

  const completedSceneCount = project.scenes.filter(
    (s) =>
      (s.status === 'COMPLETED' || s.status === 'completed') &&
      Boolean(s.generatedVideoUrl)
  ).length;

  const actualCompletionPct =
    project.scenes.length > 0
      ? Math.round((completedSceneCount / project.scenes.length) * 100)
      : 0;

  const handleCopyFlowPrompt = async (scene: StoryboardScene) => {
    try {
      await navigator.clipboard.writeText(scene.googleFlowPrompt);
    } catch {
      // Clipboard fallback
    }
    setCopiedSceneId(scene.id);
    setActionStatus(
      `Copied Scene ${scene.index} (${scene.section}) prompt. Ready to paste into Google Flow (labs.google/fx/tools/flow) and import the rendered clip.`
    );
    window.setTimeout(() => setCopiedSceneId(null), 2500);
  };

  const handleToggleSceneSymbolismMode = (
    scene: StoryboardScene,
    mode: SymbolismInterpretationMode
  ) => {
    const linkedSym =
      project.lyricSymbolism.find((s) => s.id === scene.linkedSymbolismId) ||
      project.lyricSymbolism[0];
    if (!linkedSym) return;

    const injected = injectSymbolismIntoScenePrompt(
      scene.visualPrompt,
      linkedSym,
      mode,
      project.directorStyle,
      projectChars
    );

    const updatedScenes = project.scenes.map((s) =>
      s.id === scene.id
        ? {
            ...s,
            symbolismMode: mode,
            symbolismVisualMotif: injected.activeMotif,
            visualPrompt: injected.updatedVisualPrompt,
            googleFlowPrompt: injected.updatedGoogleFlowPrompt,
          }
        : s
    );

    onUpdateProject({
      ...project,
      scenes: updatedScenes,
      updatedAtIso: new Date().toISOString(),
    });
  };

  const handleImportFlowClipFile = async (
    sceneId: string,
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingSceneId(sceneId);
    setActionError(null);
    try {
      const base64Data = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result || ''));
        reader.onerror = () => reject(new Error('Failed to read clip file.'));
        reader.readAsDataURL(file);
      });

      const response = await fetch('/api/scenes/upload-clip', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId: project.id,
          sceneId,
          fileName: file.name,
          mimeType: file.type || 'video/mp4',
          base64Data,
        }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to upload scene clip.');
      }
      if (data.project) {
        onUpdateProject(data.project as MusicVideoProject);
      }
      setActionStatus(
        `Uploaded "${file.name}" into Scene ${sceneId} and saved to server storage (${data.uploadedUrl}).`
      );
    } catch (err) {
      setActionError(
        err instanceof Error ? err.message : 'Failed to import Flow clip.'
      );
    } finally {
      setUploadingSceneId(null);
    }
  };

  // Trigger real background job to render individual scene video clip using selected provider
  const handleGenerateSceneVideoJob = async (
    scene: StoryboardScene,
    providerOverride?: ProviderPriority,
    explicitBillingAuthorized = false
  ) => {
    setExplicitVeoConsentModalScene(null);
    setActionError(null);
    const activeProvider = providerOverride || flowSettings.preferredProvider;

    try {
      const response = await fetch('/api/jobs/generate-scene', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId: project.id,
          sceneId: scene.id,
          provider: activeProvider,
          explicitBillingAuthorized,
        }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to queue scene generation job.');
      }
      onRefreshJobs();
      setActionStatus(
        `Queued job ${data.job?.id} for Scene 0${scene.index} (${scene.section} · ${formatTimecode(
          scene.startTimeSec
        )}–${formatTimecode(scene.endTimeSec)}) via ${activeProvider}.`
      );
    } catch (err) {
      setActionError(
        err instanceof Error ? err.message : 'Could not queue scene video job.'
      );
    }
  };

  // Trigger batch background jobs for uncompleted scenes in storyboard
  const handleGenerateAllScenesBatch = async (forceRegenerate = false) => {
    setActionError(null);
    try {
      const response = await fetch('/api/jobs/generate-all-scenes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId: project.id,
          provider: flowSettings.preferredProvider,
          forceRegenerate,
          explicitBillingAuthorized: false,
        }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to queue batch scene generation.');
      }
      onRefreshJobs();
      const count = Array.isArray(data.createdJobs) ? data.createdJobs.length : 0;
      setActionStatus(
        count > 0
          ? `Queued ${count} scene video generation job(s) using ${flowSettings.preferredProvider}. Completed scenes were preserved.`
          : data.message || 'All scenes are already COMPLETED.'
      );
    } catch (err) {
      setActionError(
        err instanceof Error ? err.message : 'Failed to start batch scene jobs.'
      );
    }
  };

  const handleRetryJob = async (jobId: string) => {
    setActionError(null);
    try {
      const response = await fetch(`/api/jobs/${encodeURIComponent(jobId)}/retry`, {
        method: 'POST',
      });
      if (response.ok) {
        onRefreshJobs();
        setActionStatus(`Retrying background job ${jobId}...`);
      }
    } catch {
      setActionError('Failed to retry job.');
    }
  };

  const handleCancelJob = async (jobId: string) => {
    try {
      const response = await fetch(`/api/jobs/${encodeURIComponent(jobId)}/cancel`, {
        method: 'POST',
      });
      if (response.ok) {
        onRefreshJobs();
        setActionStatus(`Cancelled job ${jobId}.`);
      }
    } catch {
      setActionError('Failed to cancel job.');
    }
  };

  if (project.scenes.length === 0) {
    return (
      <div className="bg-[#0F1624] border border-slate-800 rounded-xl p-8 text-center flex flex-col items-center gap-3">
        <Film className="w-10 h-10 text-indigo-400" />
        <h2 className="text-lg font-bold text-slate-100">
          No Storyboard Generated for &ldquo;{project.title}&rdquo; Yet
        </h2>
        <p className="text-xs text-slate-400 max-w-lg">
          Each project starts with a clean, isolated timeline. Go to <strong>Create Video</strong>, upload your MP3 or WAV song, and click <strong>Analyze Song &amp; Generate Storyboard</strong> to create your full-length scene plan.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Storyboard Top Header */}
      <div className="bg-[#0F1624] border border-slate-800 rounded-xl p-5 flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs text-indigo-400 font-medium">
            <Film className="w-3.5 h-3.5" />
            <span>
              PROJECT STORYBOARD ({project.id}) · {project.scenes.length} SCENES ·{' '}
              {formatTimecode(project.durationSec)} EXACT SONG DURATION
            </span>
          </div>
          <h2 className="text-lg font-bold text-slate-100 mt-1">
            {project.title} — Scene-by-Scene Visual Plan &amp; Video Generator
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Completed Clips:{' '}
            <strong className="text-emerald-400 font-mono">
              {completedSceneCount} / {project.scenes.length} ({actualCompletionPct}%)
            </strong>{' '}
            · Active Provider: <strong className="text-indigo-300">{flowSettings.preferredProvider}</strong>
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            data-testid="generate-all-scenes-btn"
            type="button"
            onClick={() => void handleGenerateAllScenesBatch(false)}
            className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Video className="w-3.5 h-3.5" />
            Generate Remaining Scene Clips ({project.scenes.length - completedSceneCount})
          </button>

          <button
            type="button"
            onClick={() => setShowDirectorsCut(!showDirectorsCut)}
            className={`px-3.5 py-2 text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer border ${
              showDirectorsCut
                ? 'bg-indigo-600 border-indigo-500 text-white'
                : 'bg-slate-900 hover:bg-slate-800 border-slate-700 text-slate-200'
            }`}
          >
            <Sliders className="w-3.5 h-3.5" />
            {showDirectorsCut ? "Close Director's Cut Mode" : "Director's Cut Mode"}
          </button>

          <button
            type="button"
            onClick={onNavigateEditor}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Play className="w-3.5 h-3.5" />
            Open Video Editor &amp; Assemble Final MP4
          </button>
        </div>
      </div>

      {/* Real Progress Bar from Completed Jobs (Never fake 100%) */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 flex flex-col gap-2">
        <div className="flex items-center justify-between text-xs">
          <span className="text-slate-300 font-medium flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            Actual Scene Clip Completion Progress ({completedSceneCount} of {project.scenes.length} scenes rendered)
          </span>
          <span className="font-mono font-bold text-emerald-400">
            {actualCompletionPct}%
          </span>
        </div>
        <div className="w-full h-2 bg-slate-950 rounded-full overflow-hidden border border-slate-800">
          <div
            className="h-full bg-emerald-500 transition-all duration-300"
            style={{ width: `${actualCompletionPct}%` }}
          />
        </div>
      </div>

      {actionError && (
        <div
          role="alert"
          className="bg-rose-950/60 border border-rose-500/50 rounded-xl px-4 py-3 text-xs text-rose-200 flex items-center justify-between"
        >
          <span>{actionError}</span>
          <button
            type="button"
            onClick={() => setActionError(null)}
            className="text-rose-300 hover:text-white ml-4 font-medium cursor-pointer"
          >
            Dismiss
          </button>
        </div>
      )}

      {actionStatus && (
        <div
          role="status"
          className="bg-indigo-950/50 border border-indigo-500/40 rounded-xl px-4 py-3 text-xs text-indigo-200 flex items-center justify-between"
        >
          <span>{actionStatus}</span>
          <button
            type="button"
            onClick={() => setActionStatus(null)}
            className="text-indigo-300 hover:text-white ml-4 font-medium cursor-pointer"
          >
            Dismiss
          </button>
        </div>
      )}

      {showDirectorsCut && (
        <DirectorsCutPanel
          scenes={project.scenes}
          directorStyle={project.directorStyle}
          explicitBillingAuthorized={flowSettings.apiFallbackEnabled}
          onUpdateScenes={(updatedScenes) =>
            onUpdateProject({
              ...project,
              scenes: updatedScenes,
              updatedAtIso: new Date().toISOString(),
            })
          }
          onLockAndProceedToGeneration={() => {
            setShowDirectorsCut(false);
            setActionStatus(
              "Director's Cut locked and saved! All scene prompts, camera movements, transitions, and timings are synchronized."
            );
          }}
        />
      )}

      {/* Adaptive Timeline Proportional Strip */}
      <div className="bg-[#0F1624] border border-slate-800 rounded-xl p-4">
        <div className="text-xs font-semibold text-slate-300 mb-2 flex items-center justify-between">
          <span>Full Song Timeline Map (00:00 – {formatTimecode(project.durationSec)})</span>
          <span className="font-mono tabular-nums text-slate-400">
            {project.bpm} BPM · {project.aspectRatio}
          </span>
        </div>
        <div className="flex w-full h-9 rounded-lg overflow-hidden border border-slate-800 gap-0.5 bg-slate-950">
          {project.scenes.map((scene) => {
            const widthPct = Math.max(
              6,
              (scene.durationSec / Math.max(1, project.durationSec)) * 100
            );
            return (
              <div
                key={scene.id}
                style={{ width: `${widthPct}%` }}
                className="bg-indigo-950/80 hover:bg-indigo-900/80 border-r border-slate-800 px-2 flex flex-col justify-center overflow-hidden transition-colors"
              >
                <div className="text-[11px] font-semibold text-slate-100 truncate">
                  {scene.section}
                </div>
                <div className="text-[10px] font-mono tabular-nums text-indigo-300 truncate">
                  {formatTimecode(scene.startTimeSec)}–{formatTimecode(scene.endTimeSec)}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Scene Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {project.scenes.map((scene) => {
          const latestJob = projectJobs.find((j) => j.sceneId === scene.id);
          const jobStatus = latestJob?.status || scene.status;
          const isJobActive =
            latestJob?.status === 'QUEUED' ||
            latestJob?.status === 'PROCESSING' ||
            latestJob?.status === 'pending' ||
            latestJob?.status === 'processing';
          const isJobFailed = jobStatus === 'FAILED' || jobStatus === 'failed';

          return (
            <article
              key={scene.id}
              data-testid={`scene-card-${scene.index}`}
              className="bg-[#0F1624] border border-slate-800 rounded-xl overflow-hidden flex flex-col justify-between"
            >
              <div>
                {/* Scene Visual / Playable Video Header */}
                <div className="relative h-52 bg-slate-950 overflow-hidden">
                  {scene.generatedVideoUrl ? (
                    <video
                      src={scene.generatedVideoUrl}
                      controls
                      preload="metadata"
                      className="w-full h-full object-cover bg-black"
                    />
                  ) : scene.backdropImageUrl ? (
                    <>
                      <img
                        src={scene.backdropImageUrl}
                        alt={scene.title}
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-[#090D16] via-[#090D16]/40 to-transparent" />
                    </>
                  ) : (
                    /* Procedural Visual Scene Blueprint Header (Zero Demo Contamination) */
                    <div className="w-full h-full bg-gradient-to-br from-slate-950 via-indigo-950/60 to-slate-900 flex flex-col items-center justify-center p-4 text-center">
                      <Sparkles className="w-6 h-6 text-indigo-400 mb-1.5" />
                      <div className="text-xs font-mono text-indigo-300 uppercase">
                        Procedural Motion Graphics Preset: {scene.animationPreset.replace(/_/g, ' ')}
                      </div>
                      <div className="text-[11px] text-slate-400 mt-1 max-w-sm line-clamp-2">
                        {scene.symbolismVisualMotif}
                      </div>
                    </div>
                  )}

                  <div className="absolute top-3 left-3 right-3 flex items-center justify-between text-xs pointer-events-none">
                    <span className="font-mono tabular-nums font-semibold text-slate-100 bg-slate-950/85 px-2.5 py-1 rounded-md border border-slate-800">
                      Scene 0{scene.index} · {scene.section} ({formatTimecode(scene.startTimeSec)}–
                      {formatTimecode(scene.endTimeSec)})
                    </span>
                    <span
                      className={`font-mono text-[11px] px-2.5 py-1 rounded-md border uppercase ${
                        isJobFailed
                          ? 'bg-rose-950/90 border-rose-500/50 text-rose-300'
                          : isJobActive
                            ? 'bg-amber-950/90 border-amber-500/50 text-amber-300'
                            : scene.generatedVideoUrl
                              ? 'bg-emerald-950/90 border-emerald-500/50 text-emerald-300'
                              : 'bg-slate-950/85 border-slate-800 text-slate-300'
                      }`}
                    >
                      {isJobFailed
                        ? 'FAILED'
                        : isJobActive
                          ? `${String(jobStatus)} (${latestJob?.progress || 0}%)`
                          : scene.generatedVideoUrl
                            ? 'COMPLETED (MP4)'
                            : `QUEUED · ${scene.durationSec}s`}
                    </span>
                  </div>

                  {!scene.generatedVideoUrl && (
                    <div className="absolute bottom-3 left-3 right-3 pointer-events-none">
                      <h3 className="text-sm font-bold text-white truncate">{scene.title}</h3>
                      <p className="text-xs text-indigo-200 truncate mt-0.5">
                        &ldquo;{scene.lyricExcerpt}&rdquo;
                      </p>
                    </div>
                  )}
                </div>

                {/* Background Job Progress or Error Strip */}
                {latestJob && (isJobActive || isJobFailed) && (
                  <div
                    className={`px-4 py-2 text-xs flex items-center justify-between gap-2 border-b ${
                      isJobFailed
                        ? 'bg-rose-950/40 border-rose-500/30 text-rose-200'
                        : 'bg-indigo-950/40 border-indigo-500/30 text-indigo-200'
                    }`}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <Clock className="w-3.5 h-3.5 shrink-0" />
                      <span className="truncate">{latestJob.stepMessage}</span>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      {isJobActive && (
                        <button
                          type="button"
                          onClick={() => void handleCancelJob(latestJob.id)}
                          className="px-2 py-0.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-[11px] rounded flex items-center gap-1 cursor-pointer"
                        >
                          <XCircle className="w-3 h-3" />
                          Cancel
                        </button>
                      )}
                      {isJobFailed && (
                        <button
                          type="button"
                          onClick={() => void handleRetryJob(latestJob.id)}
                          className="px-2.5 py-1 bg-rose-600 hover:bg-rose-500 text-white text-[11px] font-semibold rounded cursor-pointer"
                        >
                          Retry Scene
                        </button>
                      )}
                    </div>
                  </div>
                )}

                {/* Scene Body Details */}
                <div className="p-4 flex flex-col gap-3">
                  <div className="flex items-center justify-between gap-2">
                    <h3 className="text-sm font-bold text-slate-100 truncate">
                      {scene.title}
                    </h3>
                    {scene.generatedVideoUrl && (
                      <a
                        href={scene.generatedVideoUrl}
                        download={`scene-0${scene.index}-${scene.section.toLowerCase()}.mp4`}
                        className="text-[11px] font-semibold text-emerald-400 hover:text-emerald-300 flex items-center gap-1 shrink-0"
                      >
                        <Download className="w-3 h-3" />
                        Download Clip
                      </a>
                    )}
                  </div>

                  <div className="flex flex-wrap items-center gap-2 text-xs text-slate-400">
                    <Camera className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                    <span className="text-slate-200 font-medium">{scene.cameraAngle}</span>
                    <span aria-hidden="true">·</span>
                    <span>{scene.cameraMovement}</span>
                  </div>

                  {/* Lyric Symbolism Mode Switcher per Scene */}
                  <div className="bg-slate-950/80 border border-slate-800/90 rounded-lg p-3 flex flex-col gap-2">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[11px] font-semibold text-cyan-400 flex items-center gap-1">
                        <Sparkles className="w-3 h-3" />
                        Lyric Visual Symbolism ({scene.symbolismMode})
                      </span>
                      <div className="flex items-center gap-1">
                        {(
                          ['metaphorical', 'literal', 'hybrid'] as SymbolismInterpretationMode[]
                        ).map((m) => (
                          <button
                            key={m}
                            type="button"
                            onClick={() => handleToggleSceneSymbolismMode(scene, m)}
                            className={`px-2 py-0.5 text-[10px] font-medium rounded capitalize cursor-pointer ${
                              scene.symbolismMode === m
                                ? 'bg-indigo-600 text-white'
                                : 'bg-slate-900 text-slate-400 hover:text-slate-200'
                            }`}
                          >
                            {m}
                          </button>
                        ))}
                      </div>
                    </div>
                    <p className="text-xs text-slate-300 leading-relaxed">
                      {scene.symbolismVisualMotif}
                    </p>
                  </div>

                  <div className="text-xs text-slate-400 leading-relaxed line-clamp-3">
                    <strong className="text-slate-200">Scene ID:</strong>{' '}
                    <span className="font-mono text-indigo-300">{scene.id}</span> ·{' '}
                    {scene.visualPrompt}
                  </div>
                </div>
              </div>

              {/* Scene Footer Actions */}
              <div className="px-4 py-3 bg-slate-950/60 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-2">
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    data-testid={`generate-scene-btn-${scene.index}`}
                    type="button"
                    disabled={isJobActive}
                    onClick={() =>
                      void handleGenerateSceneVideoJob(
                        scene,
                        flowSettings.preferredProvider,
                        false
                      )
                    }
                    className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0 cursor-pointer disabled:opacity-50"
                  >
                    <Video className="w-3.5 h-3.5" />
                    <span>
                      {isJobActive
                        ? 'Rendering Clip...'
                        : scene.generatedVideoUrl
                          ? 'Regenerate Clip'
                          : 'Generate Scene Video'}
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => void handleCopyFlowPrompt(scene)}
                    className="px-2.5 py-1.5 bg-indigo-600/20 hover:bg-indigo-600/30 border border-indigo-500/40 text-indigo-200 text-xs font-medium rounded-lg flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                  >
                    {copiedSceneId === scene.id ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                        Copied
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        Flow Prompt
                      </>
                    )}
                  </button>

                  <label className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium rounded-lg flex items-center gap-1.5 cursor-pointer transition-colors whitespace-nowrap shrink-0">
                    <Upload className="w-3.5 h-3.5 text-cyan-400" />
                    <span>
                      {uploadingSceneId === scene.id ? 'Uploading...' : 'Import Clip'}
                    </span>
                    <input
                      type="file"
                      accept="video/*,image/*"
                      onChange={(e) => void handleImportFlowClipFile(scene.id, e)}
                      className="hidden"
                    />
                  </label>
                </div>

                <button
                  type="button"
                  onClick={() => setExplicitVeoConsentModalScene(scene)}
                  disabled={isJobActive}
                  className="px-2.5 py-1.5 bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 text-xs font-medium rounded-lg flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                >
                  <RefreshCw
                    className={`w-3.5 h-3.5 ${
                      isJobActive ? 'animate-spin text-indigo-400' : ''
                    }`}
                  />
                  <span>Veo API</span>
                </button>
              </div>
            </article>
          );
        })}
      </div>

      {/* Explicit Separate API Billing Confirmation Modal for Priority 2 Veo API */}
      {explicitVeoConsentModalScene && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="veo-consent-modal-title"
          className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4"
        >
          <div className="bg-[#0F1624] border border-amber-500/40 rounded-xl max-w-lg w-full p-5 flex flex-col gap-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
              <div>
                <h3
                  id="veo-consent-modal-title"
                  className="text-base font-bold text-slate-100"
                >
                  Separate API Billing Authorization Required
                </h3>
                <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                  You are requesting to render{' '}
                  <strong>{explicitVeoConsentModalScene.title}</strong> using{' '}
                  <strong>Priority 2: Official Google Veo / Omni API</strong> (
                  <span className="font-mono">gemini-omni-1.2-flash</span>).
                </p>
              </div>
            </div>

            <div className="bg-slate-950 border border-slate-800 rounded-lg p-3 text-xs text-slate-300 space-y-1.5">
              <div>
                • Calling the Official Google Veo API directly from this server requires Admin Enablement and uses the attached{' '}
                <span className="font-mono">GEMINI_API_KEY</span>, which incurs separate API billing.
              </div>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setExplicitVeoConsentModalScene(null)}
                className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium rounded-lg cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() =>
                  void handleGenerateSceneVideoJob(
                    explicitVeoConsentModalScene,
                    'google_veo_api_priority_2',
                    true
                  )
                }
                className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white text-xs font-semibold rounded-lg flex items-center gap-1.5 cursor-pointer"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                Authorize &amp; Queue Veo API Job
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

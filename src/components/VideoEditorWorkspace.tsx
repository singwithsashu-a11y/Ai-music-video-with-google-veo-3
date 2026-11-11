import React, { useState } from 'react';
import {
  AspectRatioOption,
  CharacterProfileItem,
  MusicVideoProject,
  ResolutionOption,
  StoryboardScene,
  StudioBackgroundJob,
  TransitionType,
} from '../types/studio';
import {
  formatTimecode,
  generateSrtContent,
  TRANSITION_PRESETS,
} from '../utils/studioEngine';
import { CanvasCinemaPlayer } from './CanvasCinemaPlayer';
import {
  ArrowDown,
  ArrowUp,
  Combine,
  Download,
  FileText,
  Film,
  Layers,
  Redo2,
  Save,
  Scissors,
  Sliders,
  Sparkles,
  Type as TypeIcon,
  Undo2,
  Volume2,
} from 'lucide-react';

interface VideoEditorWorkspaceProps {
  project: MusicVideoProject;
  characters: CharacterProfileItem[];
  jobs: StudioBackgroundJob[];
  onUpdateProject: (updated: MusicVideoProject) => void;
  onRefreshJobs: () => void;
  onSaveProjectExplicitly: (proj: MusicVideoProject) => void;
}

export const VideoEditorWorkspace: React.FC<VideoEditorWorkspaceProps> = ({
  project,
  characters,
  jobs,
  onUpdateProject,
  onRefreshJobs,
  onSaveProjectExplicitly,
}) => {
  const [currentTimeSec, setCurrentTimeSec] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [selectedSceneId, setSelectedSceneId] = useState<string>(
    project.scenes[0]?.id || 'scene_1'
  );
  const [historyStack, setHistoryStack] = useState<StoryboardScene[][]>([]);
  const [redoStack, setRedoStack] = useState<StoryboardScene[][]>([]);
  const [editorToast, setEditorToast] = useState<string | null>(null);

  const activeScene =
    project.scenes.find((s) => s.id === selectedSceneId) || project.scenes[0];

  const masterRenderJob = jobs.find(
    (j) => j.projectId === project.id && j.type === 'master_mp4_render'
  );

  const pushScenesWithUndo = (nextScenes: StoryboardScene[], notice?: string) => {
    setHistoryStack((prev) => [...prev.slice(-15), project.scenes]);
    setRedoStack([]);
    const totalDur =
      nextScenes.length > 0
        ? nextScenes[nextScenes.length - 1].endTimeSec
        : project.durationSec;
    onUpdateProject({
      ...project,
      scenes: nextScenes,
      sceneCount: nextScenes.length,
      completedScenes: nextScenes.length,
      durationSec: totalDur,
      updatedAtIso: new Date().toISOString(),
    });
    if (notice) setEditorToast(notice);
  };

  const handleUndo = () => {
    if (historyStack.length === 0) return;
    const previous = historyStack[historyStack.length - 1];
    setRedoStack((r) => [...r, project.scenes]);
    setHistoryStack((h) => h.slice(0, -1));
    onUpdateProject({
      ...project,
      scenes: previous,
      sceneCount: previous.length,
    });
    setEditorToast('Undid last timeline edit.');
  };

  const handleRedo = () => {
    if (redoStack.length === 0) return;
    const next = redoStack[redoStack.length - 1];
    setHistoryStack((h) => [...h, project.scenes]);
    setRedoStack((r) => r.slice(0, -1));
    onUpdateProject({
      ...project,
      scenes: next,
      sceneCount: next.length,
    });
    setEditorToast('Redid timeline edit.');
  };

  const handleSplitScene = () => {
    if (!activeScene || activeScene.durationSec < 6) {
      setEditorToast('Scene must be at least 6 seconds long to split.');
      return;
    }
    const splitPoint =
      currentTimeSec > activeScene.startTimeSec + 2 &&
      currentTimeSec < activeScene.endTimeSec - 2
        ? Math.round(currentTimeSec)
        : Math.round((activeScene.startTimeSec + activeScene.endTimeSec) / 2);

    const firstHalf: StoryboardScene = {
      ...activeScene,
      endTimeSec: splitPoint,
      durationSec: splitPoint - activeScene.startTimeSec,
      title: `${activeScene.title} (Part A)`,
    };
    const secondHalf: StoryboardScene = {
      ...activeScene,
      id: `scene_split_${Date.now()}`,
      startTimeSec: splitPoint,
      durationSec: activeScene.endTimeSec - splitPoint,
      title: `${activeScene.title} (Part B)`,
    };

    const nextScenes: StoryboardScene[] = [];
    project.scenes.forEach((s) => {
      if (s.id === activeScene.id) {
        nextScenes.push(firstHalf, secondHalf);
      } else {
        nextScenes.push(s);
      }
    });

    const reindexed = nextScenes.map((s, i) => ({ ...s, index: i + 1 }));
    pushScenesWithUndo(
      reindexed,
      `Split "${activeScene.title}" at ${formatTimecode(splitPoint)}.`
    );
  };

  const handleMergeWithNext = () => {
    const idx = project.scenes.findIndex((s) => s.id === activeScene?.id);
    if (idx === -1 || idx >= project.scenes.length - 1) {
      setEditorToast('Select a scene that has a following scene to merge with.');
      return;
    }
    const curr = project.scenes[idx];
    const next = project.scenes[idx + 1];
    const merged: StoryboardScene = {
      ...curr,
      endTimeSec: next.endTimeSec,
      durationSec: next.endTimeSec - curr.startTimeSec,
      title: `${curr.section} + ${next.section} Merged`,
      lyricExcerpt: `${curr.lyricExcerpt} / ${next.lyricExcerpt}`,
    };

    const nextList = [
      ...project.scenes.slice(0, idx),
      merged,
      ...project.scenes.slice(idx + 2),
    ].map((s, i) => ({ ...s, index: i + 1 }));

    pushScenesWithUndo(nextList, `Merged Scene ${idx + 1} and Scene ${idx + 2}.`);
  };

  const handleReorderScene = (direction: -1 | 1) => {
    const idx = project.scenes.findIndex((s) => s.id === activeScene?.id);
    const targetIdx = idx + direction;
    if (idx === -1 || targetIdx < 0 || targetIdx >= project.scenes.length) return;

    const swapped = [...project.scenes];
    const temp = swapped[idx];
    swapped[idx] = swapped[targetIdx];
    swapped[targetIdx] = temp;

    let cursor = 0;
    const retimed = swapped.map((s, i) => {
      const startTimeSec = cursor;
      const endTimeSec = cursor + s.durationSec;
      cursor = endTimeSec;
      return {
        ...s,
        index: i + 1,
        startTimeSec,
        endTimeSec,
      };
    });

    pushScenesWithUndo(retimed, `Reordered Scene "${activeScene.title}".`);
  };

  const handleUpdateActiveSceneAttr = (patch: Partial<StoryboardScene>) => {
    if (!activeScene) return;
    const updated = project.scenes.map((s) =>
      s.id === activeScene.id ? { ...s, ...patch } : s
    );
    onUpdateProject({
      ...project,
      scenes: updated,
      updatedAtIso: new Date().toISOString(),
    });
  };

  const handleDownloadSrt = () => {
    const srtText = generateSrtContent(project.subtitles);
    const blob = new Blob([srtText], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${project.title.toLowerCase().replace(/\s+/g, '-')}-subtitles.srt`;
    a.click();
    setEditorToast('Exported synchronized karaoke subtitles (.SRT).');
  };

  const handleDownloadProjectJson = () => {
    const jsonText = JSON.stringify(project, null, 2);
    const blob = new Blob([jsonText], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${project.title.toLowerCase().replace(/\s+/g, '-')}-project.json`;
    a.click();
    setEditorToast('Exported complete Studio Project bundle (.JSON).');
  };

  const handleSaveProjectToDb = () => {
    onSaveProjectExplicitly({
      ...project,
      updatedAtIso: new Date().toISOString(),
    });
    setEditorToast(`Saved "${project.title}" to persistent server database and Firestore.`);
  };

  const handleStartServerMp4Render = async () => {
    setEditorToast('Starting FFmpeg H.264/AAC Master MP4 render job on server...');
    try {
      // Save latest project state first so server renders latest edits
      await fetch(`/api/projects/${encodeURIComponent(project.id)}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(project),
      });
      const res = await fetch('/api/jobs/render-master-mp4', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectId: project.id }),
      });
      const data = await res.json();
      if (res.ok && data.job) {
        onRefreshJobs();
        setEditorToast(
          `Queued full-length MP4 render job (${project.resolution} · ${project.aspectRatio}). Joining scenes, synchronizing audio & burning subtitles...`
        );
      } else {
        setEditorToast(data.error || 'Failed to start MP4 render job.');
      }
    } catch (err) {
      setEditorToast(err instanceof Error ? err.message : 'Network error starting MP4 render.');
    }
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Top NLE Toolbar */}
      <div className="bg-[#0F1624] border border-slate-800 rounded-xl p-4 flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={handleUndo}
            disabled={historyStack.length === 0}
            className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-200 text-xs font-medium rounded-lg flex items-center gap-1.5 disabled:opacity-40 cursor-pointer"
          >
            <Undo2 className="w-3.5 h-3.5" />
            Undo
          </button>
          <button
            type="button"
            onClick={handleRedo}
            disabled={redoStack.length === 0}
            className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-200 text-xs font-medium rounded-lg flex items-center gap-1.5 disabled:opacity-40 cursor-pointer"
          >
            <Redo2 className="w-3.5 h-3.5" />
            Redo
          </button>

          <div className="h-4 w-px bg-slate-800 mx-1" />

          <button
            type="button"
            onClick={handleSplitScene}
            className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-200 text-xs font-medium rounded-lg flex items-center gap-1.5 cursor-pointer"
          >
            <Scissors className="w-3.5 h-3.5 text-indigo-400" />
            Split Scene Clip
          </button>

          <button
            type="button"
            onClick={handleMergeWithNext}
            className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-200 text-xs font-medium rounded-lg flex items-center gap-1.5 cursor-pointer"
          >
            <Combine className="w-3.5 h-3.5 text-cyan-400" />
            Merge Next
          </button>

          <button
            type="button"
            onClick={() => handleReorderScene(-1)}
            className="px-2.5 py-1.5 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-200 text-xs font-medium rounded-lg flex items-center gap-1 cursor-pointer"
          >
            <ArrowUp className="w-3.5 h-3.5" />
            Move Earlier
          </button>

          <button
            type="button"
            onClick={() => handleReorderScene(1)}
            className="px-2.5 py-1.5 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-200 text-xs font-medium rounded-lg flex items-center gap-1 cursor-pointer"
          >
            <ArrowDown className="w-3.5 h-3.5" />
            Move Later
          </button>
        </div>

        {/* Aspect Ratio, Resolution & Export Utilities */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-lg border border-slate-800">
            {(['16:9', '9:16', '1:1'] as AspectRatioOption[]).map((ar) => (
              <button
                key={ar}
                type="button"
                onClick={() => onUpdateProject({ ...project, aspectRatio: ar })}
                className={`px-2.5 py-1 text-xs font-mono font-medium rounded cursor-pointer ${
                  project.aspectRatio === ar
                    ? 'bg-indigo-600 text-white'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {ar}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-lg border border-slate-800">
            {(['720p', '1080p', '4K'] as ResolutionOption[]).map((res) => (
              <button
                key={res}
                type="button"
                onClick={() => onUpdateProject({ ...project, resolution: res })}
                className={`px-2.5 py-1 text-xs font-mono font-medium rounded cursor-pointer ${
                  project.resolution === res
                    ? 'bg-indigo-600 text-white'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {res}
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={handleSaveProjectToDb}
            className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 text-xs font-medium rounded-lg flex items-center gap-1.5 cursor-pointer"
          >
            <Save className="w-3.5 h-3.5 text-emerald-400" />
            Save Project
          </button>

          <button
            type="button"
            onClick={handleDownloadSrt}
            className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 text-xs font-medium rounded-lg flex items-center gap-1.5 cursor-pointer"
          >
            <FileText className="w-3.5 h-3.5 text-indigo-400" />
            Export .SRT
          </button>

          <button
            type="button"
            onClick={handleDownloadProjectJson}
            className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 text-xs font-medium rounded-lg flex items-center gap-1.5 cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-cyan-400" />
            Export JSON
          </button>
        </div>
      </div>

      {editorToast && (
        <div
          role="status"
          className="bg-indigo-950/50 border border-indigo-500/40 rounded-lg px-4 py-2.5 text-xs text-indigo-200 flex items-center justify-between"
        >
          <span>{editorToast}</span>
          <button
            type="button"
            onClick={() => setEditorToast(null)}
            className="text-indigo-300 hover:text-white cursor-pointer"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Upper Split: Master Preview Monitor (7 Cols) + Clip Color Grading & Subtitle Inspector (5 Cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-7">
          <CanvasCinemaPlayer
            projectId={project.id}
            audioUrl={project.audioTrack.audioUrl}
            renderedMasterMp4Url={project.renderedMasterMp4Url}
            renderedMasterDownloadUrl={project.renderedMasterDownloadUrl}
            masterRenderJob={masterRenderJob}
            scenes={project.scenes}
            subtitles={project.subtitles}
            lyricSymbolism={project.lyricSymbolism}
            characters={characters}
            durationSec={project.durationSec}
            bpm={project.bpm}
            aspectRatio={project.aspectRatio}
            currentTimeSec={currentTimeSec}
            isPlaying={isPlaying}
            onTimeUpdate={setCurrentTimeSec}
            onPlayStateChange={setIsPlaying}
            onStartServerMp4Render={handleStartServerMp4Render}
            exportResolution={project.resolution}
          />
        </div>

        {/* Right 5 Cols: Clip Inspector (Color Grading, Transitions & Karaoke Subtitles) */}
        <div className="lg:col-span-5 bg-[#0F1624] border border-slate-800 rounded-xl p-5 flex flex-col gap-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
              <Sliders className="w-4 h-4 text-indigo-400" />
              Scene Clip Color Grading & FX Inspector
            </h3>
            {activeScene && (
              <span className="text-xs font-mono text-indigo-300">
                Scene 0{activeScene.index} ({activeScene.section})
              </span>
            )}
          </div>

          {activeScene && (
            <div className="flex flex-col gap-3.5">
              <div>
                <div className="flex justify-between text-xs text-slate-300 mb-1">
                  <span>Brightness</span>
                  <span className="font-mono tabular-nums">{activeScene.brightness}%</span>
                </div>
                <input
                  type="range"
                  aria-label="Scene brightness"
                  min={50}
                  max={150}
                  value={activeScene.brightness}
                  onChange={(e) =>
                    handleUpdateActiveSceneAttr({ brightness: Number(e.target.value) })
                  }
                  className="w-full accent-indigo-500 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
                />
              </div>

              <div>
                <div className="flex justify-between text-xs text-slate-300 mb-1">
                  <span>Contrast</span>
                  <span className="font-mono tabular-nums">{activeScene.contrast}%</span>
                </div>
                <input
                  type="range"
                  aria-label="Scene contrast"
                  min={50}
                  max={150}
                  value={activeScene.contrast}
                  onChange={(e) =>
                    handleUpdateActiveSceneAttr({ contrast: Number(e.target.value) })
                  }
                  className="w-full accent-indigo-500 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
                />
              </div>

              <div>
                <div className="flex justify-between text-xs text-slate-300 mb-1">
                  <span>Color Saturation</span>
                  <span className="font-mono tabular-nums">{activeScene.saturation}%</span>
                </div>
                <input
                  type="range"
                  aria-label="Scene color saturation"
                  min={0}
                  max={200}
                  value={activeScene.saturation}
                  onChange={(e) =>
                    handleUpdateActiveSceneAttr({ saturation: Number(e.target.value) })
                  }
                  className="w-full accent-indigo-500 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
                />
              </div>

              <div>
                <label
                  htmlFor="editor-scene-transition"
                  className="text-xs text-slate-300 block mb-1"
                >
                  Beat-Synchronized Transition
                </label>
                <select
                  id="editor-scene-transition"
                  value={activeScene.transition}
                  onChange={(e) =>
                    handleUpdateActiveSceneAttr({
                      transition: e.target.value as TransitionType,
                    })
                  }
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-100"
                >
                  {TRANSITION_PRESETS.map((tr) => (
                    <option key={tr} value={tr}>
                      {tr}
                    </option>
                  ))}
                </select>
              </div>

              {/* Karaoke Subtitle Track Position Control */}
              <div className="pt-3 border-t border-slate-800">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold text-slate-200 flex items-center gap-1.5">
                    <TypeIcon className="w-3.5 h-3.5 text-cyan-400" />
                    Karaoke Lyric Subtitle Position
                  </span>
                </div>
                <div className="flex items-center gap-1.5 bg-slate-950 p-1 rounded-lg border border-slate-800">
                  {(['bottom', 'center', 'top'] as const).map((pos) => {
                    const currentPos = project.subtitles[0]?.position || 'bottom';
                    return (
                      <button
                        key={pos}
                        type="button"
                        onClick={() => {
                          const updatedSubs = project.subtitles.map((sub) => ({
                            ...sub,
                            position: pos,
                          }));
                          onUpdateProject({
                            ...project,
                            subtitles: updatedSubs,
                          });
                        }}
                        className={`flex-1 py-1.5 text-xs font-medium capitalize rounded cursor-pointer ${
                          currentPos === pos
                            ? 'bg-indigo-600 text-white'
                            : 'text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        {pos}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Active Scene Clip Status */}
              <div className="pt-3 border-t border-slate-800 flex items-center justify-between text-xs">
                <span className="text-slate-400 flex items-center gap-1.5">
                  <Film className="w-3.5 h-3.5 text-emerald-400" />
                  Scene Clip Source:
                </span>
                <span className="font-mono text-slate-200">
                  {activeScene.generatedVideoUrl ? (
                    <a
                      href={activeScene.generatedVideoUrl}
                      download
                      className="text-emerald-400 hover:underline"
                    >
                      MP4 Ready (Download)
                    </a>
                  ) : (
                    'Auto-compiled during Master MP4 Render'
                  )}
                </span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Multi-Track NLE Timeline Dock */}
      <div className="bg-[#0F1624] border border-slate-800 rounded-xl p-5 flex flex-col gap-3.5">
        <div className="flex items-center justify-between text-xs">
          <span className="font-bold text-slate-100 flex items-center gap-2">
            <Layers className="w-4 h-4 text-indigo-400" />
            Multi-Track Production Timeline (Video · Lyric Symbolism FX · Master Audio · Karaoke Subtitles)
          </span>
          <span className="font-mono tabular-nums text-slate-400">
            Playhead: {formatTimecode(currentTimeSec)} / {formatTimecode(project.durationSec)}
          </span>
        </div>

        {/* Track 1: Video Scenes Track */}
        <div className="flex flex-col gap-1">
          <div className="text-[11px] font-medium text-slate-400">
            Track V1 — Cinematic Storyboard Scenes (Click to Select & Inspect)
          </div>
          <div className="flex w-full h-12 rounded-lg overflow-hidden border border-slate-800 bg-slate-950 gap-0.5">
            {project.scenes.map((scene) => {
              const widthPct = Math.max(
                6,
                (scene.durationSec / Math.max(1, project.durationSec)) * 100
              );
              const isSelected = scene.id === activeScene?.id;
              return (
                <button
                  key={scene.id}
                  type="button"
                  onClick={() => {
                    setSelectedSceneId(scene.id);
                    setCurrentTimeSec(scene.startTimeSec);
                  }}
                  style={{ width: `${widthPct}%` }}
                  className={`h-full px-2 text-left flex flex-col justify-center overflow-hidden transition-colors cursor-pointer border-r border-slate-800 ${
                    isSelected
                      ? 'bg-indigo-600/35 text-white'
                      : 'bg-slate-900/90 hover:bg-slate-800 text-slate-300'
                  }`}
                >
                  <div className="text-xs font-semibold truncate">
                    0{scene.index}. {scene.section}
                  </div>
                  <div className="text-[10px] font-mono tabular-nums text-indigo-300 truncate">
                    {formatTimecode(scene.startTimeSec)}–{formatTimecode(scene.endTimeSec)}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Track 2: Lyric Metaphor & Visual Symbolism FX Track */}
        <div className="flex flex-col gap-1">
          <div className="text-[11px] font-medium text-cyan-400 flex items-center gap-1">
            <Sparkles className="w-3 h-3" />
            Track FX1 — Lyric Metaphor & Visual Symbolism Procedural Animations
          </div>
          <div className="flex w-full h-9 rounded-lg overflow-hidden border border-slate-800 bg-slate-950 gap-0.5">
            {project.lyricSymbolism.map((sym) => {
              const dur = Math.max(1, sym.endTimeSec - sym.startTimeSec);
              const widthPct = Math.max(
                6,
                (dur / Math.max(1, project.durationSec)) * 100
              );
              return (
                <button
                  key={sym.id}
                  type="button"
                  onClick={() => setCurrentTimeSec(sym.startTimeSec)}
                  style={{ width: `${widthPct}%` }}
                  className="h-full px-2 bg-cyan-950/40 hover:bg-cyan-900/50 border-r border-slate-800 text-left flex items-center overflow-hidden cursor-pointer"
                >
                  <span className="text-[11px] text-cyan-200 truncate">
                    [{sym.activeMode.slice(0, 3).toUpperCase()}] {sym.visualElement}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Track 3: Audio Waveform & Beat Peaks Track */}
        <div className="flex flex-col gap-1">
          <div className="text-[11px] font-medium text-emerald-400 flex items-center gap-1">
            <Volume2 className="w-3 h-3" />
            Track A1 — Master Audio Waveform & Beat Sync Grid ({project.audioTrack.title} · {project.bpm} BPM)
          </div>
          <div className="w-full h-11 rounded-lg border border-slate-800 bg-slate-950 px-2 flex items-center gap-0.5">
            {project.audioTrack.waveformPeaks.map((peak, idx) => {
              const peakTime = (idx / project.audioTrack.waveformPeaks.length) * project.durationSec;
              const isPlayed = peakTime <= currentTimeSec;
              return (
                <div
                  key={idx}
                  style={{ height: `${Math.max(18, Math.round(peak * 90))}%` }}
                  className={`flex-1 rounded-sm transition-colors ${
                    isPlayed ? 'bg-emerald-400' : 'bg-slate-700'
                  }`}
                />
              );
            })}
          </div>
        </div>

        {/* Track 4: Karaoke Subtitles Track */}
        <div className="flex flex-col gap-1">
          <div className="text-[11px] font-medium text-amber-300">
            Track T1 — Word-by-Word Synchronized Karaoke Subtitles
          </div>
          <div className="flex w-full h-8 rounded-lg overflow-hidden border border-slate-800 bg-slate-950 gap-0.5">
            {project.subtitles.map((cue) => {
              const dur = Math.max(1, cue.endTimeSec - cue.startTimeSec);
              const widthPct = Math.max(
                6,
                (dur / Math.max(1, project.durationSec)) * 100
              );
              return (
                <button
                  key={cue.id}
                  type="button"
                  onClick={() => setCurrentTimeSec(cue.startTimeSec)}
                  style={{ width: `${widthPct}%` }}
                  className="h-full px-2 bg-amber-950/30 hover:bg-amber-900/40 border-r border-slate-800 text-left flex items-center overflow-hidden cursor-pointer"
                >
                  <span className="text-[11px] text-amber-200 truncate">
                    {cue.text}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

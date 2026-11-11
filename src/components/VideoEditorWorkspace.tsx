import React, { useState } from 'react';
import {
  AspectRatioOption,
  AudioBitrateOption,
  CharacterProfileItem,
  ColorGradingSettings,
  ExportStudioConfig,
  FrameRateOption,
  LyricsDisplayMode,
  LyricsDisplaySettings,
  MusicVideoProject,
  ResolutionOption,
  StoryboardScene,
  StudioBackgroundJob,
  TransitionType,
} from '../types/studio';
import {
  DEFAULT_COLOR_GRADING_SETTINGS,
  DEFAULT_EXPORT_STUDIO_CONFIG,
  DEFAULT_LYRICS_DISPLAY_SETTINGS,
  formatTimecode,
  generateSrtContent,
  snapScenesToMusicalBeats,
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
  Music,
  Palette,
  Redo2,
  RefreshCw,
  Save,
  Scissors,
  Sliders,
  Sparkles,
  Type as TypeIcon,
  Undo2,
  Video,
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

type InspectorTab = 'scene' | 'lyrics' | 'color' | 'music_sync' | 'export';

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
  const [inspectorTab, setInspectorTab] = useState<InspectorTab>('scene');
  const [historyStack, setHistoryStack] = useState<StoryboardScene[][]>([]);
  const [redoStack, setRedoStack] = useState<StoryboardScene[][]>([]);
  const [editorToast, setEditorToast] = useState<string | null>(null);
  const [draggedSceneId, setDraggedSceneId] = useState<string | null>(null);
  const [isRegeneratingScene, setIsRegeneratingScene] = useState(false);

  const activeScene =
    project.scenes.find((s) => s.id === selectedSceneId) || project.scenes[0];

  const lyricsSettings: LyricsDisplaySettings =
    project.lyricsDisplaySettings || DEFAULT_LYRICS_DISPLAY_SETTINGS;
  const colorSettings: ColorGradingSettings =
    project.colorGradingSettings || DEFAULT_COLOR_GRADING_SETTINGS;
  const exportConfig: ExportStudioConfig = project.exportConfig || {
    ...DEFAULT_EXPORT_STUDIO_CONFIG,
    resolution: project.resolution,
    aspectRatio: project.aspectRatio,
    titleSequenceText: project.titleSequenceText || project.title,
    outroSequenceText: project.outroSequenceText || '',
  };

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
      completedScenes: nextScenes.filter(
        (s) => s.status === 'COMPLETED' && Boolean(s.generatedVideoUrl)
      ).length,
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
    if (!activeScene || activeScene.durationSec < 4) {
      setEditorToast('Scene must be at least 4 seconds long to split.');
      return;
    }
    const splitPoint =
      currentTimeSec > activeScene.startTimeSec + 1.5 &&
      currentTimeSec < activeScene.endTimeSec - 1.5
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
      id: `${project.id}_scene_split_${Date.now()}`,
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

  const handleDragDropScene = (targetSceneId: string) => {
    if (!draggedSceneId || draggedSceneId === targetSceneId) return;
    const fromIdx = project.scenes.findIndex((s) => s.id === draggedSceneId);
    const toIdx = project.scenes.findIndex((s) => s.id === targetSceneId);
    if (fromIdx === -1 || toIdx === -1) return;

    const list = [...project.scenes];
    const [moved] = list.splice(fromIdx, 1);
    list.splice(toIdx, 0, moved);

    let cursor = 0;
    const retimed = list.map((s, i) => {
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
    setDraggedSceneId(null);
    pushScenesWithUndo(
      retimed,
      `Moved "${moved.title}" to Scene position #${toIdx + 1}.`
    );
  };

  const handleAdjustSceneDuration = (deltaSec: number) => {
    if (!activeScene) return;
    const idx = project.scenes.findIndex((s) => s.id === activeScene.id);
    if (idx === -1) return;
    const newDur = Math.max(2, activeScene.durationSec + deltaSec);
    const cloned = project.scenes.map((s) => ({ ...s }));
    cloned[idx].durationSec = newDur;

    let cursor = 0;
    const retimed = cloned.map((s, i) => {
      const startTimeSec = cursor;
      const endTimeSec = cursor + s.durationSec;
      cursor = endTimeSec;
      return { ...s, index: i + 1, startTimeSec, endTimeSec };
    });
    pushScenesWithUndo(
      retimed,
      `Adjusted Scene #${activeScene.index} duration to ${newDur}s.`
    );
  };

  const handleRegenerateSingleScene = async () => {
    if (!activeScene) return;
    setIsRegeneratingScene(true);
    try {
      const res = await fetch('/api/jobs/generate-scene', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId: project.id,
          sceneId: activeScene.id,
          provider:
            project.providerUsed === 'google_flow_priority_1'
              ? 'procedural_cinema_priority_3'
              : project.providerUsed,
          explicitBillingAuthorized: true,
        }),
      });
      const data = await res.json();
      if (res.ok && data.job) {
        onRefreshJobs();
        setEditorToast(
          `Queued scene video regeneration for Scene #${activeScene.index} (${activeScene.section}).`
        );
      } else {
        setEditorToast(data.error || 'Could not queue scene regeneration.');
      }
    } catch {
      setEditorToast('Network error queuing scene regeneration.');
    } finally {
      setIsRegeneratingScene(false);
    }
  };

  const handleSnapToBeats = () => {
    const beats = project.audioTrack.beatTimestampsSec || [];
    if (beats.length === 0) {
      setEditorToast('No beat timestamps available to snap.');
      return;
    }
    const snapped = snapScenesToMusicalBeats(
      project.scenes,
      beats,
      project.durationSec
    );
    pushScenesWithUndo(
      snapped,
      `Snapped all ${snapped.length} scene transitions to the ${project.bpm} BPM musical beat grid.`
    );
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

  const handleUpdateLyricsSettings = (patch: Partial<LyricsDisplaySettings>) => {
    const nextLyrics: LyricsDisplaySettings = {
      ...lyricsSettings,
      ...patch,
    };
    const nextExport: ExportStudioConfig = {
      ...exportConfig,
      cleanVideoWithoutLyrics: nextLyrics.mode === 'none',
    };
    onUpdateProject({
      ...project,
      lyricsDisplaySettings: nextLyrics,
      exportConfig: nextExport,
      updatedAtIso: new Date().toISOString(),
    });
  };

  const handleUpdateColorSettings = (patch: Partial<ColorGradingSettings>) => {
    const nextColor: ColorGradingSettings = {
      ...colorSettings,
      ...patch,
    };
    onUpdateProject({
      ...project,
      colorGradingSettings: nextColor,
      updatedAtIso: new Date().toISOString(),
    });
  };

  const handleUpdateExportConfig = (patch: Partial<ExportStudioConfig>) => {
    const nextExport: ExportStudioConfig = {
      ...exportConfig,
      ...patch,
    };
    const nextLyrics: LyricsDisplaySettings =
      patch.cleanVideoWithoutLyrics !== undefined
        ? {
            ...lyricsSettings,
            mode: patch.cleanVideoWithoutLyrics ? 'none' : 'karaoke',
          }
        : lyricsSettings;

    onUpdateProject({
      ...project,
      aspectRatio: nextExport.aspectRatio,
      resolution: nextExport.resolution,
      titleSequenceText: nextExport.titleSequenceText,
      outroSequenceText: nextExport.outroSequenceText,
      exportConfig: nextExport,
      lyricsDisplaySettings: nextLyrics,
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
    setEditorToast('Exported synchronized subtitles (.SRT).');
  };

  const handleDownloadProjectJson = () => {
    const jsonText = JSON.stringify(project, null, 2);
    const blob = new Blob([jsonText], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${project.title.toLowerCase().replace(/\s+/g, '-')}-project.json`;
    a.click();
    setEditorToast('Exported complete Studio Project backup (.JSON).');
  };

  const handleSaveProjectToDb = () => {
    onSaveProjectExplicitly({
      ...project,
      updatedAtIso: new Date().toISOString(),
    });
    setEditorToast(`Saved "${project.title}" to persistent studio database.`);
  };

  const handleStartServerMp4Render = async () => {
    setEditorToast('Starting FFmpeg H.264/AAC Master MP4 render job on server...');
    try {
      await fetch(`/api/projects/${encodeURIComponent(project.id)}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(project),
      });
      const res = await fetch('/api/jobs/render-master-mp4', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId: project.id,
          exportConfig,
          lyricsDisplaySettings: lyricsSettings,
          colorGradingSettings: colorSettings,
        }),
      });
      const data = await res.json();
      if (res.ok && data.job) {
        onRefreshJobs();
        setEditorToast(
          `Queued Master MP4 Render (${exportConfig.resolution} · ${exportConfig.aspectRatio} · ${exportConfig.frameRate}fps · ${
            exportConfig.cleanVideoWithoutLyrics ? 'Clean Video Without Lyrics' : 'With Lyrics'
          }).`
        );
      } else {
        setEditorToast(data.error || 'Failed to start MP4 render job.');
      }
    } catch (err) {
      setEditorToast(
        err instanceof Error ? err.message : 'Network error starting MP4 render.'
      );
    }
  };

  return (
    <div className="flex flex-col gap-6 pb-12">
      {/* Top NLE Toolbar */}
      <div className="bg-[#0B0F19]/95 border border-slate-800/90 rounded-2xl p-4 flex flex-wrap items-center justify-between gap-3 shadow-xl">
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={handleUndo}
            disabled={historyStack.length === 0}
            className="min-h-[40px] px-3 py-1.5 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-200 text-xs font-medium rounded-xl flex items-center gap-1.5 disabled:opacity-40 cursor-pointer"
          >
            <Undo2 className="w-3.5 h-3.5" />
            Undo
          </button>
          <button
            type="button"
            onClick={handleRedo}
            disabled={redoStack.length === 0}
            className="min-h-[40px] px-3 py-1.5 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-200 text-xs font-medium rounded-xl flex items-center gap-1.5 disabled:opacity-40 cursor-pointer"
          >
            <Redo2 className="w-3.5 h-3.5" />
            Redo
          </button>

          <div className="h-4 w-px bg-slate-800 mx-1 hidden sm:block" />

          <button
            type="button"
            onClick={handleSplitScene}
            className="min-h-[40px] px-3 py-1.5 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-200 text-xs font-medium rounded-xl flex items-center gap-1.5 cursor-pointer"
          >
            <Scissors className="w-3.5 h-3.5 text-violet-400" />
            Split Scene
          </button>

          <button
            type="button"
            onClick={handleMergeWithNext}
            className="min-h-[40px] px-3 py-1.5 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-200 text-xs font-medium rounded-xl flex items-center gap-1.5 cursor-pointer"
          >
            <Combine className="w-3.5 h-3.5 text-sky-400" />
            Merge Next
          </button>

          <button
            type="button"
            onClick={() => handleReorderScene(-1)}
            className="min-h-[40px] px-2.5 py-1.5 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-200 text-xs font-medium rounded-xl flex items-center gap-1 cursor-pointer"
          >
            <ArrowUp className="w-3.5 h-3.5" />
            Earlier
          </button>

          <button
            type="button"
            onClick={() => handleReorderScene(1)}
            className="min-h-[40px] px-2.5 py-1.5 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-200 text-xs font-medium rounded-xl flex items-center gap-1 cursor-pointer"
          >
            <ArrowDown className="w-3.5 h-3.5" />
            Later
          </button>

          <button
            type="button"
            onClick={handleSnapToBeats}
            className="min-h-[40px] px-3 py-1.5 bg-violet-950/50 hover:bg-violet-900/60 border border-violet-500/40 text-violet-200 text-xs font-semibold rounded-xl flex items-center gap-1.5 cursor-pointer"
          >
            <Music className="w-3.5 h-3.5 text-violet-400" />
            Snap Cuts to Beats
          </button>
        </div>

        {/* Aspect Ratio (including 4:5), Resolution & Save */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800">
            {(['16:9', '9:16', '1:1', '4:5'] as AspectRatioOption[]).map((ar) => (
              <button
                key={ar}
                type="button"
                onClick={() => handleUpdateExportConfig({ aspectRatio: ar })}
                className={`px-2.5 py-1 text-xs font-mono font-medium rounded-lg cursor-pointer ${
                  project.aspectRatio === ar
                    ? 'bg-violet-600 text-white'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {ar}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800">
            {(['720p', '1080p', '4K'] as ResolutionOption[]).map((res) => (
              <button
                key={res}
                type="button"
                onClick={() => handleUpdateExportConfig({ resolution: res })}
                className={`px-2.5 py-1 text-xs font-mono font-medium rounded-lg cursor-pointer ${
                  project.resolution === res
                    ? 'bg-violet-600 text-white'
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
            className="min-h-[40px] px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 text-xs font-semibold rounded-xl flex items-center gap-1.5 cursor-pointer"
          >
            <Save className="w-3.5 h-3.5 text-emerald-400" />
            Save Project
          </button>
        </div>
      </div>

      {editorToast && (
        <div
          role="status"
          className="bg-violet-950/50 border border-violet-500/40 rounded-xl px-4 py-2.5 text-xs text-violet-200 flex items-center justify-between"
        >
          <span>{editorToast}</span>
          <button
            type="button"
            onClick={() => setEditorToast(null)}
            className="text-violet-300 hover:text-white cursor-pointer font-mono"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Upper Split: Master Preview Monitor (7 Cols) + Multi-Tab Studio Inspector (5 Cols) */}
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
            lyricsDisplaySettings={lyricsSettings}
            colorGradingSettings={colorSettings}
            titleSequenceText={exportConfig.titleSequenceText}
            outroSequenceText={exportConfig.outroSequenceText}
          />
        </div>

        {/* Right 5 Cols: 5-Tab Studio Inspector */}
        <div className="lg:col-span-5 bg-[#0B0F19]/95 border border-slate-800/90 rounded-2xl p-5 flex flex-col gap-4 shadow-xl">
          {/* Inspector Navigation Tabs */}
          <div className="grid grid-cols-5 gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800">
            {[
              { id: 'scene' as const, label: 'Scene', icon: Film },
              { id: 'lyrics' as const, label: 'Lyrics', icon: TypeIcon },
              { id: 'color' as const, label: 'Colour', icon: Palette },
              { id: 'music_sync' as const, label: 'Beats', icon: Music },
              { id: 'export' as const, label: 'Export', icon: Video },
            ].map((tab) => {
              const Icon = tab.icon;
              const active = inspectorTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setInspectorTab(tab.id)}
                  className={`min-h-[40px] px-2 py-1.5 rounded-lg text-[11px] font-semibold flex flex-col sm:flex-row items-center justify-center gap-1 transition cursor-pointer ${
                    active
                      ? 'bg-violet-600 text-white shadow'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5 shrink-0" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          {/* TAB 1: SCENE & TIMELINE INSPECTOR */}
          {inspectorTab === 'scene' && activeScene && (
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
                <div>
                  <span className="text-[11px] font-mono uppercase text-violet-400">
                    Active Scene #{activeScene.index} · {activeScene.section}
                  </span>
                  <h4 className="text-sm font-bold text-white">
                    {activeScene.title}
                  </h4>
                </div>
                <span className="text-xs font-mono text-sky-400">
                  {formatTimecode(activeScene.startTimeSec)}–
                  {formatTimecode(activeScene.endTimeSec)} ({activeScene.durationSec}s)
                </span>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Storytelling Narrative Beat
                </label>
                <textarea
                  rows={2}
                  value={activeScene.narrativeArcBeat || activeScene.visualPrompt}
                  onChange={(e) =>
                    handleUpdateActiveSceneAttr({
                      narrativeArcBeat: e.target.value,
                      visualPrompt: e.target.value,
                    })
                  }
                  className="w-full rounded-xl bg-slate-950 border border-slate-800 p-2.5 text-xs text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Scene Duration ({activeScene.durationSec}s)
                  </label>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => handleAdjustSceneDuration(-1)}
                      className="min-h-[38px] flex-1 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-xs font-mono text-white cursor-pointer"
                    >
                      -1s Trim
                    </button>
                    <button
                      type="button"
                      onClick={() => handleAdjustSceneDuration(1)}
                      className="min-h-[38px] flex-1 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-xs font-mono text-white cursor-pointer"
                    >
                      +1s Extend
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Scene Transition
                  </label>
                  <select
                    value={activeScene.transition}
                    onChange={(e) =>
                      handleUpdateActiveSceneAttr({
                        transition: e.target.value as TransitionType,
                      })
                    }
                    className="w-full min-h-[38px] bg-slate-950 border border-slate-800 rounded-xl px-2.5 text-xs text-white"
                  >
                    {TRANSITION_PRESETS.map((tr) => (
                      <option key={tr} value={tr}>
                        {tr}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Title & Outro Sequence Inputs */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-slate-800">
                <div>
                  <label className="block text-[11px] font-semibold uppercase text-slate-400 mb-1">
                    Opening Title Sequence Text
                  </label>
                  <input
                    type="text"
                    value={exportConfig.titleSequenceText}
                    onChange={(e) =>
                      handleUpdateExportConfig({ titleSequenceText: e.target.value })
                    }
                    placeholder="Optional opening title card..."
                    className="w-full min-h-[38px] rounded-xl bg-slate-950 border border-slate-800 px-3 text-xs text-white"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold uppercase text-slate-400 mb-1">
                    Closing Outro Sequence Text
                  </label>
                  <input
                    type="text"
                    value={exportConfig.outroSequenceText}
                    onChange={(e) =>
                      handleUpdateExportConfig({ outroSequenceText: e.target.value })
                    }
                    placeholder="Optional outro credit card..."
                    className="w-full min-h-[38px] rounded-xl bg-slate-950 border border-slate-800 px-3 text-xs text-white"
                  />
                </div>
              </div>

              <div className="pt-2 border-t border-slate-800 flex flex-wrap items-center justify-between gap-2">
                <button
                  type="button"
                  onClick={handleRegenerateSingleScene}
                  disabled={isRegeneratingScene}
                  className="min-h-[42px] px-3.5 py-2 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-xs font-semibold flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  <RefreshCw
                    className={`w-3.5 h-3.5 ${
                      isRegeneratingScene ? 'animate-spin' : ''
                    }`}
                  />
                  <span>Regenerate Individual Scene Clip</span>
                </button>

                {activeScene.generatedVideoUrl && (
                  <a
                    href={activeScene.generatedVideoUrl}
                    download
                    className="min-h-[42px] px-3 py-2 rounded-xl bg-emerald-600/20 border border-emerald-500/40 text-emerald-300 text-xs font-semibold flex items-center gap-1.5"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download Scene MP4</span>
                  </a>
                )}
              </div>
            </div>
          )}

          {/* TAB 2: LYRICS & TEXT CONTROL */}
          {inspectorTab === 'lyrics' && (
            <div className="space-y-4">
              <div className="border-b border-slate-800 pb-2.5">
                <h4 className="text-sm font-bold text-white flex items-center gap-2">
                  <TypeIcon className="w-4 h-4 text-sky-400" />
                  <span>Lyrics & Text Overlay Control</span>
                </h4>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Never force lyrics onto every scene. Choose Clean Video (no lyrics) or customize how and when lyrics appear.
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Lyrics Display Mode
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {(
                    [
                      { id: 'none', label: 'Disable Lyrics (Clean Video)' },
                      { id: 'selected', label: 'Selected Scenes Only' },
                      { id: 'karaoke', label: 'Karaoke Word-by-Word' },
                      { id: 'full', label: 'Show Full Lyrics' },
                      { id: 'subtitle', label: 'Cinema Subtitle Mode' },
                      { id: 'minimal', label: 'Minimal Captions' },
                    ] as { id: LyricsDisplayMode; label: string }[]
                  ).map((opt) => (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => handleUpdateLyricsSettings({ mode: opt.id })}
                      className={`min-h-[40px] px-3 py-2 rounded-xl border text-left text-xs font-medium transition cursor-pointer ${
                        lyricsSettings.mode === opt.id
                          ? 'border-sky-500 bg-sky-500/20 text-white'
                          : 'border-slate-800 bg-slate-900/70 text-slate-400 hover:text-white'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              {lyricsSettings.mode === 'selected' && activeScene && (
                <label className="flex items-center justify-between p-3 rounded-xl bg-slate-900 border border-slate-800 cursor-pointer">
                  <span className="text-xs font-semibold text-white">
                    Show Lyrics in Scene #{activeScene.index} ({activeScene.section})
                  </span>
                  <input
                    type="checkbox"
                    checked={Boolean(activeScene.showLyricsInScene)}
                    onChange={(e) =>
                      handleUpdateActiveSceneAttr({
                        showLyricsInScene: e.target.checked,
                      })
                    }
                    className="w-4 h-4 accent-sky-500"
                  />
                </label>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-slate-300 mb-1">
                    Font Family
                  </label>
                  <select
                    value={lyricsSettings.fontFamily}
                    onChange={(e) =>
                      handleUpdateLyricsSettings({
                        fontFamily: e.target.value as LyricsDisplaySettings['fontFamily'],
                      })
                    }
                    className="w-full min-h-[38px] rounded-xl bg-slate-950 border border-slate-800 px-2.5 text-xs text-white"
                  >
                    <option value="Bricolage Grotesque">Bricolage Grotesque</option>
                    <option value="Plus Jakarta Sans">Plus Jakarta Sans</option>
                    <option value="JetBrains Mono">JetBrains Mono</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs text-slate-300 mb-1">
                    Position ({lyricsSettings.position})
                  </label>
                  <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800">
                    {(['bottom', 'center', 'top'] as const).map((pos) => (
                      <button
                        key={pos}
                        type="button"
                        onClick={() => handleUpdateLyricsSettings({ position: pos })}
                        className={`flex-1 py-1 text-xs capitalize rounded-lg cursor-pointer ${
                          lyricsSettings.position === pos
                            ? 'bg-sky-500 text-slate-950 font-bold'
                            : 'text-slate-400'
                        }`}
                      >
                        {pos}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <div className="flex justify-between text-xs text-slate-300 mb-1">
                    <span>Font Size</span>
                    <span className="font-mono">{lyricsSettings.fontSizePx}px</span>
                  </div>
                  <input
                    type="range"
                    min={16}
                    max={42}
                    value={lyricsSettings.fontSizePx}
                    onChange={(e) =>
                      handleUpdateLyricsSettings({
                        fontSizePx: Number(e.target.value),
                      })
                    }
                    className="w-full accent-sky-500"
                  />
                </div>

                <div>
                  <div className="flex justify-between text-xs text-slate-300 mb-1">
                    <span>Animation Speed</span>
                    <span className="font-mono">{lyricsSettings.animationSpeed}x</span>
                  </div>
                  <input
                    type="range"
                    min={0.5}
                    max={2.0}
                    step={0.1}
                    value={lyricsSettings.animationSpeed}
                    onChange={(e) =>
                      handleUpdateLyricsSettings({
                        animationSpeed: Number(e.target.value),
                      })
                    }
                    className="w-full accent-sky-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2 pt-1">
                <div>
                  <label className="block text-[11px] text-slate-400 mb-1">
                    Text Colour
                  </label>
                  <input
                    type="color"
                    value={lyricsSettings.textColor}
                    onChange={(e) =>
                      handleUpdateLyricsSettings({ textColor: e.target.value })
                    }
                    className="w-full h-9 rounded-lg bg-slate-900 border border-slate-800 cursor-pointer"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-slate-400 mb-1">
                    Outline Colour
                  </label>
                  <input
                    type="color"
                    value={lyricsSettings.outlineColor}
                    onChange={(e) =>
                      handleUpdateLyricsSettings({ outlineColor: e.target.value })
                    }
                    className="w-full h-9 rounded-lg bg-slate-900 border border-slate-800 cursor-pointer"
                  />
                </div>
                <div className="flex flex-col justify-end">
                  <label className="flex items-center gap-2 text-xs text-slate-300 h-9 px-2 rounded-lg bg-slate-900 border border-slate-800 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={lyricsSettings.shadowEnabled}
                      onChange={(e) =>
                        handleUpdateLyricsSettings({
                          shadowEnabled: e.target.checked,
                        })
                      }
                    />
                    <span>Shadow</span>
                  </label>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: COLOUR GRADING & VISUAL EFFECTS */}
          {inspectorTab === 'color' && (
            <div className="space-y-3.5 max-h-[380px] overflow-y-auto pr-1">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <h4 className="text-sm font-bold text-white flex items-center gap-2">
                  <Sliders className="w-4 h-4 text-violet-400" />
                  <span>Master Colour Grading & Optical FX</span>
                </h4>
                <button
                  type="button"
                  onClick={() =>
                    handleUpdateColorSettings(DEFAULT_COLOR_GRADING_SETTINGS)
                  }
                  className="text-[11px] font-mono text-slate-400 hover:text-white cursor-pointer"
                >
                  Reset LUT
                </button>
              </div>

              {[
                {
                  key: 'temperature' as const,
                  label: 'Warm / Cool Tone',
                  min: -50,
                  max: 50,
                  unit: '',
                },
                {
                  key: 'contrast' as const,
                  label: 'Contrast',
                  min: 50,
                  max: 150,
                  unit: '%',
                },
                {
                  key: 'brightness' as const,
                  label: 'Brightness',
                  min: 50,
                  max: 150,
                  unit: '%',
                },
                {
                  key: 'saturation' as const,
                  label: 'Saturation',
                  min: 0,
                  max: 200,
                  unit: '%',
                },
                {
                  key: 'exposure' as const,
                  label: 'Exposure Offset',
                  min: -50,
                  max: 50,
                  unit: '',
                },
                {
                  key: 'filmGrain' as const,
                  label: '35mm Film Grain',
                  min: 0,
                  max: 100,
                  unit: '%',
                },
                {
                  key: 'vignette' as const,
                  label: 'Anamorphic Vignette',
                  min: 0,
                  max: 100,
                  unit: '%',
                },
                {
                  key: 'lensFlare' as const,
                  label: 'Optical Lens Flare & Glow',
                  min: 0,
                  max: 100,
                  unit: '%',
                },
                {
                  key: 'depthOfField' as const,
                  label: 'Depth-of-Field Bokeh',
                  min: 0,
                  max: 100,
                  unit: '%',
                },
              ].map((ctrl) => (
                <div key={ctrl.key}>
                  <div className="flex justify-between text-xs text-slate-300 mb-1">
                    <span>{ctrl.label}</span>
                    <span className="font-mono tabular-nums text-violet-300">
                      {colorSettings[ctrl.key]}
                      {ctrl.unit}
                    </span>
                  </div>
                  <input
                    type="range"
                    min={ctrl.min}
                    max={ctrl.max}
                    value={colorSettings[ctrl.key]}
                    onChange={(e) =>
                      handleUpdateColorSettings({
                        [ctrl.key]: Number(e.target.value),
                      })
                    }
                    className="w-full accent-violet-500 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
                  />
                </div>
              ))}
            </div>
          )}

          {/* TAB 4: MUSIC SYNCHRONIZATION */}
          {inspectorTab === 'music_sync' && (
            <div className="space-y-4">
              <div className="border-b border-slate-800 pb-2.5">
                <h4 className="text-sm font-bold text-white flex items-center gap-2">
                  <Music className="w-4 h-4 text-emerald-400" />
                  <span>Music Beat & Energy Synchronization</span>
                </h4>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Synchronize scene cuts to detected BPM beats and chorus energy peaks.
                </p>
              </div>

              <div className="grid grid-cols-3 gap-2.5 text-center">
                <div className="rounded-xl bg-slate-900 border border-slate-800 p-3">
                  <div className="text-[10px] font-mono uppercase text-slate-400">
                    Tempo
                  </div>
                  <div className="text-base font-bold font-mono text-emerald-400 mt-0.5">
                    {project.bpm} BPM
                  </div>
                </div>
                <div className="rounded-xl bg-slate-900 border border-slate-800 p-3">
                  <div className="text-[10px] font-mono uppercase text-slate-400">
                    Key
                  </div>
                  <div className="text-base font-bold font-mono text-sky-400 mt-0.5">
                    {project.musicalKey}
                  </div>
                </div>
                <div className="rounded-xl bg-slate-900 border border-slate-800 p-3">
                  <div className="text-[10px] font-mono uppercase text-slate-400">
                    Beat Markers
                  </div>
                  <div className="text-base font-bold font-mono text-violet-400 mt-0.5">
                    {project.audioTrack.beatTimestampsSec?.length || 0}
                  </div>
                </div>
              </div>

              <label className="flex items-center justify-between p-3 rounded-xl bg-slate-900 border border-slate-800 cursor-pointer">
                <div>
                  <div className="text-xs font-semibold text-white">
                    Automatic Beat-Grid Scene Timing
                  </div>
                  <div className="text-[11px] text-slate-400">
                    Align scene transitions to nearest downbeat
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={Boolean(project.autoBeatSync)}
                  onChange={(e) => {
                    const enabled = e.target.checked;
                    onUpdateProject({ ...project, autoBeatSync: enabled });
                    if (enabled) handleSnapToBeats();
                  }}
                  className="w-4 h-4 accent-emerald-500"
                />
              </label>

              <button
                type="button"
                onClick={handleSnapToBeats}
                className="w-full min-h-[42px] rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold flex items-center justify-center gap-2 cursor-pointer"
              >
                <Sparkles className="w-4 h-4" />
                <span>Snap All Scene Cuts to {project.bpm} BPM Beat Grid</span>
              </button>

              <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-800">
                <div>
                  <div className="flex justify-between text-xs text-slate-300 mb-1">
                    <span>Audio Fade-In</span>
                    <span className="font-mono">{colorSettings.fadeInSec}s</span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={5}
                    step={0.5}
                    value={colorSettings.fadeInSec}
                    onChange={(e) =>
                      handleUpdateColorSettings({
                        fadeInSec: Number(e.target.value),
                      })
                    }
                    className="w-full accent-emerald-500"
                  />
                </div>
                <div>
                  <div className="flex justify-between text-xs text-slate-300 mb-1">
                    <span>Audio Fade-Out</span>
                    <span className="font-mono">{colorSettings.fadeOutSec}s</span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={6}
                    step={0.5}
                    value={colorSettings.fadeOutSec}
                    onChange={(e) =>
                      handleUpdateColorSettings({
                        fadeOutSec: Number(e.target.value),
                      })
                    }
                    className="w-full accent-emerald-500"
                  />
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: PROFESSIONAL EXPORT STUDIO */}
          {inspectorTab === 'export' && (
            <div className="space-y-4">
              <div className="border-b border-slate-800 pb-2.5">
                <h4 className="text-sm font-bold text-white flex items-center gap-2">
                  <Video className="w-4 h-4 text-sky-400" />
                  <span>Professional Export Studio</span>
                </h4>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Configure master H.264/AAC MP4 resolution, aspect ratio, frame rate, audio bitrate, and clean lyric-free video output.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold uppercase text-slate-400 mb-1">
                    Resolution
                  </label>
                  <div className="flex gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800">
                    {(['720p', '1080p', '4K'] as ResolutionOption[]).map((res) => (
                      <button
                        key={res}
                        type="button"
                        onClick={() => handleUpdateExportConfig({ resolution: res })}
                        className={`flex-1 py-1.5 text-xs font-mono rounded-lg cursor-pointer ${
                          exportConfig.resolution === res
                            ? 'bg-violet-600 text-white font-bold'
                            : 'text-slate-400'
                        }`}
                      >
                        {res}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold uppercase text-slate-400 mb-1">
                    Frame Rate
                  </label>
                  <div className="flex gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800">
                    {([24, 30, 60] as FrameRateOption[]).map((fps) => (
                      <button
                        key={fps}
                        type="button"
                        onClick={() => handleUpdateExportConfig({ frameRate: fps })}
                        className={`flex-1 py-1.5 text-xs font-mono rounded-lg cursor-pointer ${
                          exportConfig.frameRate === fps
                            ? 'bg-sky-500 text-slate-950 font-bold'
                            : 'text-slate-400'
                        }`}
                      >
                        {fps}fps
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold uppercase text-slate-400 mb-1">
                    Aspect Ratio
                  </label>
                  <div className="grid grid-cols-4 gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800">
                    {(['16:9', '9:16', '1:1', '4:5'] as AspectRatioOption[]).map(
                      (ar) => (
                        <button
                          key={ar}
                          type="button"
                          onClick={() => handleUpdateExportConfig({ aspectRatio: ar })}
                          className={`py-1.5 text-[11px] font-mono rounded-lg cursor-pointer ${
                            exportConfig.aspectRatio === ar
                              ? 'bg-violet-600 text-white font-bold'
                              : 'text-slate-400'
                          }`}
                        >
                          {ar}
                        </button>
                      )
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold uppercase text-slate-400 mb-1">
                    Audio Bitrate
                  </label>
                  <div className="flex gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800">
                    {(['128k', '192k', '320k'] as AudioBitrateOption[]).map((br) => (
                      <button
                        key={br}
                        type="button"
                        onClick={() => handleUpdateExportConfig({ audioBitrate: br })}
                        className={`flex-1 py-1.5 text-xs font-mono rounded-lg cursor-pointer ${
                          exportConfig.audioBitrate === br
                            ? 'bg-emerald-600 text-white font-bold'
                            : 'text-slate-400'
                        }`}
                      >
                        {br}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <label className="flex items-center justify-between p-3 rounded-xl bg-slate-900 border border-slate-800 cursor-pointer">
                <div>
                  <div className="text-xs font-semibold text-white">
                    Clean Video Export Without Lyrics
                  </div>
                  <div className="text-[11px] text-slate-400">
                    Render pure cinematic story visuals without burned-in lyric text
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={exportConfig.cleanVideoWithoutLyrics}
                  onChange={(e) =>
                    handleUpdateExportConfig({
                      cleanVideoWithoutLyrics: e.target.checked,
                    })
                  }
                  className="w-4 h-4 accent-violet-500"
                />
              </label>

              <button
                type="button"
                onClick={handleStartServerMp4Render}
                className="w-full min-h-[44px] rounded-xl bg-gradient-to-r from-violet-600 to-sky-500 hover:from-violet-500 hover:to-sky-400 text-white text-xs sm:text-sm font-bold flex items-center justify-center gap-2 shadow-lg cursor-pointer"
              >
                <Video className="w-4 h-4" />
                <span>
                  Render Master MP4 ({exportConfig.resolution} ·{' '}
                  {exportConfig.aspectRatio} · {exportConfig.frameRate}fps)
                </span>
              </button>

              <div className="grid grid-cols-2 gap-2 pt-1">
                <button
                  type="button"
                  onClick={handleDownloadSrt}
                  className="min-h-[40px] px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-xs font-medium text-slate-200 flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <FileText className="w-3.5 h-3.5 text-violet-400" />
                  <span>Export .SRT</span>
                </button>
                <button
                  type="button"
                  onClick={handleDownloadProjectJson}
                  className="min-h-[40px] px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-xs font-medium text-slate-200 flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5 text-sky-400" />
                  <span>Backup .JSON</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Multi-Track NLE Timeline Dock */}
      <div className="bg-[#0B0F19]/95 border border-slate-800/90 rounded-2xl p-5 flex flex-col gap-3.5 shadow-xl">
        <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
          <span className="font-bold text-white flex items-center gap-2">
            <Layers className="w-4 h-4 text-violet-400" />
            Multi-Track Studio Timeline (Drag & Drop Scenes to Reorder)
          </span>
          <span className="font-mono tabular-nums text-slate-400">
            Playhead: {formatTimecode(currentTimeSec)} / {formatTimecode(project.durationSec)}
          </span>
        </div>

        {/* Track V1: Narrative Video Scenes Track */}
        <div className="flex flex-col gap-1">
          <div className="text-[11px] font-medium text-slate-400 flex items-center justify-between">
            <span>Track V1 — Storyboard Narrative Scenes (Click to Select · Drag to Reorder)</span>
            <span className="font-mono text-[10px] text-violet-400">
              {project.scenes.length} Scenes
            </span>
          </div>
          <div className="flex w-full h-14 rounded-xl overflow-x-auto border border-slate-800 bg-slate-950 gap-0.5">
            {project.scenes.map((scene) => {
              const widthPct = Math.max(
                8,
                (scene.durationSec / Math.max(1, project.durationSec)) * 100
              );
              const isSelected = scene.id === activeScene?.id;
              return (
                <button
                  key={scene.id}
                  type="button"
                  draggable
                  onDragStart={() => setDraggedSceneId(scene.id)}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={() => handleDragDropScene(scene.id)}
                  onClick={() => {
                    setSelectedSceneId(scene.id);
                    setCurrentTimeSec(scene.startTimeSec);
                  }}
                  style={{ width: `${widthPct}%` }}
                  className={`min-w-[96px] h-full px-2.5 text-left flex flex-col justify-center overflow-hidden transition-colors cursor-pointer border-r border-slate-800 ${
                    isSelected
                      ? 'bg-violet-600/35 text-white border-b-2 border-b-violet-400'
                      : 'bg-slate-900/90 hover:bg-slate-800 text-slate-300'
                  }`}
                >
                  <div className="text-xs font-semibold truncate">
                    S{scene.index} · {scene.section}
                  </div>
                  <div className="text-[10px] text-slate-400 truncate">
                    {scene.narrativeArcBeat || scene.title}
                  </div>
                  <div className="text-[10px] font-mono tabular-nums text-sky-400 truncate">
                    {formatTimecode(scene.startTimeSec)}–{formatTimecode(scene.endTimeSec)}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Track V2: Atmospheric Visual Overlay & B-Roll */}
        <div className="flex flex-col gap-1">
          <div className="text-[11px] font-medium text-sky-400 flex items-center gap-1">
            <Sparkles className="w-3 h-3" />
            Track V2 — Atmospheric Lighting, Bokeh & Symbolism Layer
          </div>
          <div className="flex w-full h-9 rounded-xl overflow-hidden border border-slate-800 bg-slate-950 gap-0.5">
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
                  className="h-full px-2 bg-sky-950/35 hover:bg-sky-900/45 border-r border-slate-800 text-left flex items-center overflow-hidden cursor-pointer"
                >
                  <span className="text-[11px] text-sky-200 truncate">
                    {sym.visualElement}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Track A1: Master Audio Waveform & Beat Sync Grid */}
        <div className="flex flex-col gap-1">
          <div className="text-[11px] font-medium text-emerald-400 flex items-center gap-1">
            <Volume2 className="w-3 h-3" />
            Track A1 — Master Audio Waveform & Beat Grid ({project.audioTrack.title} · {project.bpm} BPM)
          </div>
          <div className="w-full h-11 rounded-xl border border-slate-800 bg-slate-950 px-2 flex items-center gap-0.5">
            {project.audioTrack.waveformPeaks.map((peak, idx) => {
              const peakTime =
                (idx / project.audioTrack.waveformPeaks.length) * project.durationSec;
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

        {/* Track T1: Lyrics & Subtitles Track */}
        <div className="flex flex-col gap-1">
          <div className="flex items-center justify-between text-[11px]">
            <span className="font-medium text-amber-300">
              Track T1 — Lyrics & Subtitle Cues (Mode:{' '}
              {lyricsSettings.mode === 'none'
                ? 'Disabled — Clean Video Mode'
                : lyricsSettings.mode.toUpperCase()}
              )
            </span>
            <button
              type="button"
              onClick={() =>
                handleUpdateLyricsSettings({
                  mode: lyricsSettings.mode === 'none' ? 'karaoke' : 'none',
                })
              }
              className="text-[11px] font-mono text-sky-400 hover:underline cursor-pointer"
            >
              {lyricsSettings.mode === 'none'
                ? 'Enable Karaoke Lyrics'
                : 'Switch to Clean Video (Hide Lyrics)'}
            </button>
          </div>
          <div className="flex w-full h-8 rounded-xl overflow-hidden border border-slate-800 bg-slate-950 gap-0.5">
            {lyricsSettings.mode === 'none' ? (
              <div className="w-full h-full flex items-center justify-center text-[11px] font-mono text-slate-500">
                Clean Video Mode Active — Lyrics overlay disabled so story visuals remain unobstructed
              </div>
            ) : (
              project.subtitles.map((cue) => {
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
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

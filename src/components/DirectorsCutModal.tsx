import React, { useState } from 'react';
import {
  AnimationPreset,
  DirectorStyle,
  StoryboardScene,
  SymbolismInterpretationMode,
  TransitionType,
} from '../types/studio';
import {
  applyDirectorsCutEdit,
  CAMERA_ANGLE_PRESETS,
  CAMERA_MOVEMENT_PRESETS,
  formatTimecode,
  TRANSITION_PRESETS,
} from '../utils/studioEngine';
import {
  Camera,
  CheckCircle2,
  Clock,
  Film,
  Sliders,
  Sparkles,
  Wand2,
} from 'lucide-react';

interface DirectorsCutPanelProps {
  scenes: StoryboardScene[];
  directorStyle: DirectorStyle;
  explicitBillingAuthorized: boolean;
  onUpdateScenes: (updated: StoryboardScene[]) => void;
  onLockAndProceedToGeneration: () => void;
}

const ANIMATION_PRESET_LABELS: { value: AnimationPreset; label: string }[] = [
  { value: 'rain_neon_streaks', label: 'Bioluminescent Rain Streaks' },
  { value: 'shattered_prism', label: 'Shattered Prism Shards' },
  { value: 'ember_ascension', label: 'Golden Phoenix Embers' },
  { value: 'chrono_ripples', label: 'Celestial Clockwork Ripples' },
  { value: 'nebula_swirl', label: 'Cosmic Nebula Swirl' },
  { value: 'cyber_grid_flight', label: 'Perspective Cyber Grid' },
  { value: 'aurora_pulse', label: 'Harmonic Aurora Ribbons' },
  { value: 'floating_lanterns', label: 'Ascending Sky Lanterns' },
];

export const DirectorsCutPanel: React.FC<DirectorsCutPanelProps> = ({
  scenes,
  directorStyle,
  explicitBillingAuthorized,
  onUpdateScenes,
  onLockAndProceedToGeneration,
}) => {
  const [selectedSceneId, setSelectedSceneId] = useState<string>(scenes[0]?.id || 'scene_1');
  const [polishingSceneId, setPolishingSceneId] = useState<string | null>(null);
  const [statusBanner, setStatusBanner] = useState<string | null>(null);

  const activeScene = scenes.find((s) => s.id === selectedSceneId) || scenes[0];

  const handleFieldChange = (
    sceneId: string,
    patch: Parameters<typeof applyDirectorsCutEdit>[2]
  ) => {
    const updated = applyDirectorsCutEdit(scenes, sceneId, patch, directorStyle);
    onUpdateScenes(updated);
  };

  const handleGeminiPolishScene = async (scene: StoryboardScene) => {
    setPolishingSceneId(scene.id);
    setStatusBanner(null);
    try {
      const response = await fetch('/api/ai/directors-cut-polish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sceneTitle: scene.title,
          lyricExcerpt: scene.lyricExcerpt,
          currentPrompt: scene.visualPrompt,
          cameraAngle: scene.cameraAngle,
          cameraMovement: scene.cameraMovement,
          transition: scene.transition,
          durationSec: scene.durationSec,
          directorStyle,
          symbolismMotif: scene.symbolismVisualMotif,
          explicitBillingAuthorized,
        }),
      });
      const data = await response.json();
      if (response.ok && data.visualPrompt) {
        const updated = applyDirectorsCutEdit(
          scenes,
          scene.id,
          {
            visualPrompt: data.visualPrompt,
            googleFlowPrompt: data.veoDirectorPrompt || data.visualPrompt,
            lighting: data.lightingRecommendation || scene.lighting,
          },
          directorStyle
        );
        onUpdateScenes(updated);
        setStatusBanner(
          data.usedLiveGeminiApi
            ? `Scene ${scene.index} prompt polished via Gemini 3.8 Flash AI Director.`
            : `Scene ${scene.index} prompt refined via Studio Cinematography Engine (Zero API Charge).`
        );
      }
    } catch (err) {
      setStatusBanner(
        err instanceof Error ? err.message : 'Unable to polish scene prompt.'
      );
    } finally {
      setPolishingSceneId(null);
    }
  };

  if (!activeScene) return null;

  return (
    <section
      aria-label="Director's Cut Pre-Generation Studio"
      className="bg-[#0F1624] border border-indigo-500/30 rounded-xl p-5 flex flex-col gap-5"
    >
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <div className="flex items-center gap-2 text-xs text-indigo-400 font-medium">
            <Sliders className="w-3.5 h-3.5" />
            <span>DIRECTOR&apos;S CUT MODE · PRE-GENERATION CINEMATOGRAPHY & TIMING CONTROL</span>
          </div>
          <h3 className="text-lg font-bold text-slate-100 mt-1">
            Review & Lock Scene Prompts, Camera Optics, Transitions & Timings
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Fine-tune every scene&apos;s Gemini/Veo prompt, lens angle, camera movement, transition type, and ripple-synced start/end timing before video generation begins.
          </p>
        </div>

        <button
          type="button"
          onClick={onLockAndProceedToGeneration}
          className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-lg flex items-center gap-2 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
        >
          <CheckCircle2 className="w-4 h-4" />
          Approve & Lock Director&apos;s Cut for Generation
        </button>
      </div>

      {statusBanner && (
        <div className="bg-indigo-950/50 border border-indigo-500/40 rounded-lg px-4 py-2.5 text-xs text-indigo-200 flex items-center justify-between">
          <span>{statusBanner}</span>
          <button
            type="button"
            onClick={() => setStatusBanner(null)}
            className="text-indigo-300 hover:text-white text-xs font-medium ml-4 cursor-pointer"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Scene Selector Strip */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        {scenes.map((scene) => {
          const isSelected = scene.id === activeScene.id;
          return (
            <button
              key={scene.id}
              type="button"
              onClick={() => setSelectedSceneId(scene.id)}
              className={`px-3.5 py-2 rounded-lg text-xs font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer border ${
                isSelected
                  ? 'bg-indigo-600/20 border-indigo-500 text-white'
                  : 'bg-slate-900/80 border-slate-800 text-slate-400 hover:text-slate-200'
              }`}
            >
              <span className="font-mono tabular-nums text-[11px] text-indigo-400 mr-1.5">
                0{scene.index}
              </span>
              <span>{scene.section}</span>
              <span className="mx-1.5 text-slate-600">·</span>
              <span className="font-mono tabular-nums text-[11px]">
                {formatTimecode(scene.startTimeSec)}–{formatTimecode(scene.endTimeSec)}
              </span>
            </button>
          );
        })}
      </div>

      {/* Main Director's Cut Inspector Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left 7 Cols: Prompt Engineering & Lyric Metaphor Injection */}
        <div className="lg:col-span-7 flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <label
              htmlFor="directors-cut-visual-prompt"
              className="text-xs font-semibold text-slate-200 flex items-center gap-1.5"
            >
              <Film className="w-3.5 h-3.5 text-indigo-400" />
              Scene {activeScene.index} ({activeScene.section}) — AI Visual & Cinematography Prompt
            </label>
            <button
              type="button"
              onClick={() => handleGeminiPolishScene(activeScene)}
              disabled={polishingSceneId === activeScene.id}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-indigo-300 text-xs font-medium rounded-lg flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              <Wand2 className="w-3.5 h-3.5" />
              {polishingSceneId === activeScene.id
                ? 'Polishing with Gemini...'
                : 'AI Polish Scene Prompt'}
            </button>
          </div>

          <textarea
            id="directors-cut-visual-prompt"
            rows={3}
            value={activeScene.visualPrompt}
            onChange={(e) =>
              handleFieldChange(activeScene.id, { visualPrompt: e.target.value })
            }
            className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-xs text-slate-100 focus:outline-none focus:border-indigo-500 leading-relaxed"
          />

          <div>
            <label
              htmlFor="directors-cut-flow-veo-prompt"
              className="text-xs font-semibold text-slate-200 block mb-1.5"
            >
              Compiled Google Flow / Veo Master Generation Prompt
            </label>
            <textarea
              id="directors-cut-flow-veo-prompt"
              rows={3}
              value={activeScene.googleFlowPrompt}
              onChange={(e) =>
                handleFieldChange(activeScene.id, { googleFlowPrompt: e.target.value })
              }
              className="w-full bg-slate-950/90 border border-slate-800 rounded-lg p-3 text-xs font-mono text-indigo-200 focus:outline-none focus:border-indigo-500 leading-relaxed"
            />
          </div>

          {/* Lyric Symbolism Mode & Motif Override */}
          <div className="bg-slate-950/60 border border-slate-800/80 rounded-lg p-3.5 flex flex-col gap-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-200">
                <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                <span>Lyric Phrase Symbolism Integration: &ldquo;{activeScene.lyricExcerpt}&rdquo;</span>
              </div>

              <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-lg border border-slate-800">
                {(['metaphorical', 'literal', 'hybrid'] as SymbolismInterpretationMode[]).map(
                  (mode) => (
                    <button
                      key={mode}
                      type="button"
                      onClick={() =>
                        handleFieldChange(activeScene.id, { symbolismMode: mode })
                      }
                      className={`px-2.5 py-1 text-[11px] font-medium rounded-md capitalize transition-colors cursor-pointer ${
                        activeScene.symbolismMode === mode
                          ? 'bg-indigo-600 text-white'
                          : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      {mode}
                    </button>
                  )
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label
                  htmlFor="directors-cut-motif"
                  className="text-[11px] text-slate-400 block mb-1"
                >
                  Visual Symbolism Element / Motif
                </label>
                <input
                  id="directors-cut-motif"
                  type="text"
                  value={activeScene.symbolismVisualMotif}
                  onChange={(e) =>
                    handleFieldChange(activeScene.id, {
                      symbolismVisualMotif: e.target.value,
                    })
                  }
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-200"
                />
              </div>

              <div>
                <label
                  htmlFor="directors-cut-anim-preset"
                  className="text-[11px] text-slate-400 block mb-1"
                >
                  Real-Time Symbolism Animation Layer
                </label>
                <select
                  id="directors-cut-anim-preset"
                  value={activeScene.animationPreset}
                  onChange={(e) =>
                    handleFieldChange(activeScene.id, {
                      animationPreset: e.target.value as AnimationPreset,
                    })
                  }
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-200"
                >
                  {ANIMATION_PRESET_LABELS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Right 5 Cols: Camera Angle, Movement, Transition & Timing Controls */}
        <div className="lg:col-span-5 flex flex-col gap-4 bg-slate-950/50 border border-slate-800/80 rounded-lg p-4">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-200">
            <Camera className="w-3.5 h-3.5 text-indigo-400" />
            <span>Camera Optics, Motion & Transition Timing</span>
          </div>

          <div>
            <label
              htmlFor="directors-cut-camera-angle"
              className="text-xs text-slate-400 block mb-1"
            >
              Camera Lens & Angle
            </label>
            <select
              id="directors-cut-camera-angle"
              value={activeScene.cameraAngle}
              onChange={(e) =>
                handleFieldChange(activeScene.id, { cameraAngle: e.target.value })
              }
              className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-100"
            >
              {!CAMERA_ANGLE_PRESETS.includes(activeScene.cameraAngle) && (
                <option value={activeScene.cameraAngle}>{activeScene.cameraAngle}</option>
              )}
              {CAMERA_ANGLE_PRESETS.map((angle) => (
                <option key={angle} value={angle}>
                  {angle}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label
              htmlFor="directors-cut-camera-movement"
              className="text-xs text-slate-400 block mb-1"
            >
              Camera Rig Movement Instruction
            </label>
            <select
              id="directors-cut-camera-movement"
              value={activeScene.cameraMovement}
              onChange={(e) =>
                handleFieldChange(activeScene.id, { cameraMovement: e.target.value })
              }
              className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-100"
            >
              {!CAMERA_MOVEMENT_PRESETS.includes(activeScene.cameraMovement) && (
                <option value={activeScene.cameraMovement}>
                  {activeScene.cameraMovement}
                </option>
              )}
              {CAMERA_MOVEMENT_PRESETS.map((move) => (
                <option key={move} value={move}>
                  {move}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label
              htmlFor="directors-cut-transition"
              className="text-xs text-slate-400 block mb-1"
            >
              Scene Cut / Transition Type
            </label>
            <select
              id="directors-cut-transition"
              value={activeScene.transition}
              onChange={(e) =>
                handleFieldChange(activeScene.id, {
                  transition: e.target.value as TransitionType,
                })
              }
              className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-100"
            >
              {TRANSITION_PRESETS.map((tr) => (
                <option key={tr} value={tr}>
                  {tr}
                </option>
              ))}
            </select>
          </div>

          {/* Timing Controls with Automatic Ripple Sync */}
          <div className="pt-2 border-t border-slate-800/80">
            <div className="flex items-center justify-between text-xs text-slate-300 mb-2">
              <span className="flex items-center gap-1.5 font-medium">
                <Clock className="w-3.5 h-3.5 text-indigo-400" />
                Scene Timing Window (Ripple-Synced)
              </span>
              <span className="font-mono tabular-nums text-indigo-300">
                Duration: {activeScene.durationSec}s
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label
                  htmlFor="directors-cut-start-sec"
                  className="text-[11px] text-slate-400 block mb-1"
                >
                  Start Time (sec)
                </label>
                <input
                  id="directors-cut-start-sec"
                  type="number"
                  min={0}
                  max={Math.max(0, activeScene.endTimeSec - 2)}
                  step={1}
                  value={activeScene.startTimeSec}
                  onChange={(e) =>
                    handleFieldChange(activeScene.id, {
                      startTimeSec: Number(e.target.value),
                    })
                  }
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-xs font-mono tabular-nums text-slate-100"
                />
              </div>

              <div>
                <label
                  htmlFor="directors-cut-end-sec"
                  className="text-[11px] text-slate-400 block mb-1"
                >
                  End Time (sec)
                </label>
                <input
                  id="directors-cut-end-sec"
                  type="number"
                  min={activeScene.startTimeSec + 2}
                  max={1800}
                  step={1}
                  value={activeScene.endTimeSec}
                  onChange={(e) =>
                    handleFieldChange(activeScene.id, {
                      endTimeSec: Number(e.target.value),
                    })
                  }
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-xs font-mono tabular-nums text-slate-100"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

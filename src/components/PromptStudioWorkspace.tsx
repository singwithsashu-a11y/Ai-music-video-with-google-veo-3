import React, { useEffect, useMemo, useState } from 'react';
import {
  Check,
  Copy,
  Eye,
  Film,
  Heart,
  History,
  Layers,
  Plus,
  RefreshCw,
  Save,
  Sliders,
  Sparkles,
  Trash2,
  Video,
  Wand2,
} from 'lucide-react';
import {
  CharacterProfileItem,
  MusicVideoProject,
  PromptCameraControl,
  PromptEnvironmentOption,
  PromptLightingOption,
  PromptMoodOption,
  PromptStudioFields,
  PromptStudioItem,
  PromptVisualStyle,
  StoryboardScene,
} from '../types/studio';
import {
  buildPromptStudioItemForScene,
  compileMasterPromptFromStudio,
  formatTimecode,
  PROMPT_CAMERA_CONTROLS,
  PROMPT_ENVIRONMENT_OPTIONS,
  PROMPT_LIGHTING_OPTIONS,
  PROMPT_MOOD_OPTIONS,
  PROMPT_VISUAL_STYLES,
} from '../utils/studioEngine';

interface PromptStudioWorkspaceProps {
  project: MusicVideoProject;
  characters: CharacterProfileItem[];
  onUpdateProject: (updated: MusicVideoProject) => void;
  onGenerateSceneVideo?: (scene: StoryboardScene) => void;
  onOpenEditor?: () => void;
}

export const PromptStudioWorkspace: React.FC<PromptStudioWorkspaceProps> = ({
  project,
  characters,
  onUpdateProject,
  onGenerateSceneVideo,
  onOpenEditor,
}) => {
  const scenes = project.scenes || [];
  const [selectedSceneId, setSelectedSceneId] = useState<string>(
    scenes[0]?.id || ''
  );

  useEffect(() => {
    if (scenes.length > 0 && !scenes.some((s) => s.id === selectedSceneId)) {
      setSelectedSceneId(scenes[0].id);
    }
  }, [scenes, selectedSceneId]);

  const activeScene = useMemo(
    () => scenes.find((s) => s.id === selectedSceneId) || scenes[0],
    [scenes, selectedSceneId]
  );

  const initialStudioItem = useMemo(() => {
    if (!activeScene) {
      const defaultFields: PromptStudioFields = {
        mainSceneDescription:
          'Lonely person walking on a rainy street at midnight as neon signs reflect in puddles',
        characterDescription:
          characters[0]?.appearancePrompt ||
          'Expressive lead vocalist with natural screen presence',
        characterAction:
          'Walking slowly down the rain-slicked avenue, looking up toward glowing rooftop windows',
        facialExpression: 'Melancholic, introspective, emotionally vulnerable',
        clothing: characters[0]?.wardrobeLock || 'Tailored dark charcoal trench coat',
        environment: 'Rainy Street — Neon-lit metropolitan boulevard',
        cameraMovement: '35mm anamorphic tracking shot with slow gimbal push-in',
        lighting: 'Blue Hour & Neon Lighting with volumetric streetlamp haze',
        colorGrading: 'Kodak Vision3 500T teal-and-amber cinema LUT, rich shadow depth',
        visualEffects: 'Shallow depth-of-field bokeh, raindrops on lens, subtle 35mm film grain',
        sceneTransition: 'Cross Dissolve',
        negativePrompt:
          'low quality, blurry face, extra fingers, text overlay wall, watermark, jerky motion',
        additionalInstructions: 'Maintain smooth 24fps cinematic motion cadence.',
      };
      const visualStyles: PromptVisualStyle[] = ['Cinematic Realism', 'Dark Cinematic'];
      const cameraControls: PromptCameraControl[] = ['Tracking Shot', 'Slow Motion'];
      const lightingOptions: PromptLightingOption[] = ['Blue Hour', 'Neon Lighting'];
      const environments: PromptEnvironmentOption[] = ['Rainy Street'];
      const moods: PromptMoodOption[] = ['Lonely', 'Emotional'];
      return {
        id: `${project.id}_prompt_default`,
        projectId: project.id,
        title: 'Scene 1: Rainy Street Opening',
        visualStyles,
        cameraControls,
        lightingOptions,
        environments,
        moods,
        fields: defaultFields,
        compiledMasterPrompt: compileMasterPromptFromStudio(
          visualStyles,
          cameraControls,
          lightingOptions,
          environments,
          moods,
          defaultFields
        ),
        isFavorite: true,
        createdAtIso: new Date().toISOString(),
      };
    }

    if (activeScene.promptStudioItem) {
      return activeScene.promptStudioItem;
    }

    return buildPromptStudioItemForScene({
      projectId: project.id,
      scene: activeScene,
      directorStyle: project.directorStyle,
      characters,
    });
  }, [activeScene, project.id, project.directorStyle, characters]);

  const [promptTitle, setPromptTitle] = useState<string>(initialStudioItem.title);
  const [visualStyles, setVisualStyles] = useState<PromptVisualStyle[]>(
    initialStudioItem.visualStyles
  );
  const [cameraControls, setCameraControls] = useState<PromptCameraControl[]>(
    initialStudioItem.cameraControls
  );
  const [lightingOptions, setLightingOptions] = useState<PromptLightingOption[]>(
    initialStudioItem.lightingOptions
  );
  const [environments, setEnvironments] = useState<PromptEnvironmentOption[]>(
    initialStudioItem.environments
  );
  const [moods, setMoods] = useState<PromptMoodOption[]>(initialStudioItem.moods);
  const [fields, setFields] = useState<PromptStudioFields>(initialStudioItem.fields);
  const [manualMasterOverride, setManualMasterOverride] = useState<string | null>(
    null
  );
  const [isGeneratingAi, setIsGeneratingAi] = useState(false);
  const [copiedNotice, setCopiedNotice] = useState(false);
  const [savedNotice, setSavedNotice] = useState<string | null>(null);
  const [previewModalOpen, setPreviewModalOpen] = useState(false);
  const [libraryFilter, setLibraryFilter] = useState<'all' | 'favorites'>('all');

  // Sync state when activeScene changes
  useEffect(() => {
    setPromptTitle(initialStudioItem.title);
    setVisualStyles(initialStudioItem.visualStyles);
    setCameraControls(initialStudioItem.cameraControls);
    setLightingOptions(initialStudioItem.lightingOptions);
    setEnvironments(initialStudioItem.environments);
    setMoods(initialStudioItem.moods);
    setFields(initialStudioItem.fields);
    setManualMasterOverride(null);
  }, [initialStudioItem]);

  const compiledMasterPrompt = useMemo(() => {
    if (manualMasterOverride !== null) return manualMasterOverride;
    return compileMasterPromptFromStudio(
      visualStyles,
      cameraControls,
      lightingOptions,
      environments,
      moods,
      fields
    );
  }, [
    manualMasterOverride,
    visualStyles,
    cameraControls,
    lightingOptions,
    environments,
    moods,
    fields,
  ]);

  const toggleItem = <T extends string>(
    list: T[],
    setter: React.Dispatch<React.SetStateAction<T[]>>,
    value: T
  ) => {
    setManualMasterOverride(null);
    setter((prev) =>
      prev.includes(value) ? prev.filter((item) => item !== value) : [...prev, value]
    );
  };

  const updateField = (key: keyof PromptStudioFields, value: string) => {
    setManualMasterOverride(null);
    setFields((prev) => ({ ...prev, [key]: value }));
  };

  const handleAutoGeneratePromptWithAi = async () => {
    setIsGeneratingAi(true);
    setSavedNotice(null);
    try {
      const response = await fetch('/api/ai/prompt-studio-generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId: project.id,
          songTitle: project.title,
          directorStyle: project.directorStyle,
          mood: project.mood,
          section: activeScene?.section || 'Verse 1',
          lyricExcerpt: activeScene?.lyricExcerpt || '',
          visualStyles,
          cameraControls,
          lightingOptions,
          environments,
          moods,
          characters: characters.map((c) => ({
            name: c.name,
            age: c.age,
            appearancePrompt: c.appearancePrompt,
            wardrobeLock: c.wardrobeLock,
            facialExpression: c.facialExpression,
          })),
        }),
      });
      const data = await response.json();
      if (data && data.fields) {
        setFields((prev) => ({
          ...prev,
          ...data.fields,
        }));
        if (Array.isArray(data.visualStyles) && data.visualStyles.length > 0) {
          setVisualStyles(data.visualStyles);
        }
        if (Array.isArray(data.cameraControls) && data.cameraControls.length > 0) {
          setCameraControls(data.cameraControls);
        }
        if (Array.isArray(data.lightingOptions) && data.lightingOptions.length > 0) {
          setLightingOptions(data.lightingOptions);
        }
        if (Array.isArray(data.environments) && data.environments.length > 0) {
          setEnvironments(data.environments);
        }
        if (Array.isArray(data.moods) && data.moods.length > 0) {
          setMoods(data.moods);
        }
        setManualMasterOverride(null);
        setSavedNotice(
          data.source === 'live_gemini_api'
            ? 'AI Prompt Studio generated a new story-driven cinematic prompt via Gemini.'
            : 'AI Prompt Studio synthesized a story-driven cinematic prompt.'
        );
      }
    } catch {
      // Synthesize a rich story variation locally if offline
      const nextEnv =
        environments[0] ||
        PROMPT_ENVIRONMENT_OPTIONS[
          Math.floor(Math.random() * PROMPT_ENVIRONMENT_OPTIONS.length)
        ];
      const nextLight =
        lightingOptions[0] ||
        PROMPT_LIGHTING_OPTIONS[
          Math.floor(Math.random() * PROMPT_LIGHTING_OPTIONS.length)
        ];
      const nextCam =
        cameraControls[0] ||
        PROMPT_CAMERA_CONTROLS[
          Math.floor(Math.random() * PROMPT_CAMERA_CONTROLS.length)
        ];
      updateField(
        'mainSceneDescription',
        `Cinematic story sequence in ${nextEnv} under ${nextLight}: protagonist moves through atmospheric depth with expressive storytelling emotion`
      );
      updateField('cameraMovement', `${nextCam} with smooth 24fps anamorphic lens drift`);
      setSavedNotice('Generated new cinematic scene prompt variation.');
    } finally {
      setIsGeneratingAi(false);
    }
  };

  const handleApplyAndSaveToScene = (alsoSaveToLibrary = true) => {
    const newItem: PromptStudioItem = {
      id: `${project.id}_prompt_${Date.now()}`,
      projectId: project.id,
      sceneId: activeScene?.id,
      title:
        promptTitle.trim() ||
        `${activeScene?.section || 'Scene'}: ${environments[0] || 'Cinematic Shot'}`,
      visualStyles,
      cameraControls,
      lightingOptions,
      environments,
      moods,
      fields,
      compiledMasterPrompt,
      isFavorite: false,
      createdAtIso: new Date().toISOString(),
    };

    const existingLib = project.promptLibrary || [];
    const updatedLib = alsoSaveToLibrary
      ? [newItem, ...existingLib.slice(0, 29)]
      : existingLib;

    const updatedScenes = scenes.map((s) => {
      if (s.id !== activeScene?.id) return s;
      return {
        ...s,
        title: newItem.title,
        narrativeArcBeat: fields.mainSceneDescription,
        visualPrompt: compiledMasterPrompt,
        googleFlowPrompt: compiledMasterPrompt,
        cameraAngle: cameraControls.join(', ') || s.cameraAngle,
        cameraMovement: fields.cameraMovement || s.cameraMovement,
        lighting: lightingOptions.join(' & ') || fields.lighting || s.lighting,
        environment: environments.join(' / ') || fields.environment || s.environment,
        promptStudioItem: newItem,
      };
    });

    onUpdateProject({
      ...project,
      scenes: updatedScenes,
      promptLibrary: updatedLib,
      updatedAtIso: new Date().toISOString(),
    });

    setSavedNotice(
      activeScene
        ? `Saved & applied Prompt Studio configuration to Scene #${activeScene.index} (${activeScene.section}).`
        : 'Saved Prompt Studio configuration to Project Prompt Library.'
    );
  };

  const handleDuplicatePrompt = () => {
    const duplicatedItem: PromptStudioItem = {
      id: `${project.id}_prompt_copy_${Date.now()}`,
      projectId: project.id,
      sceneId: activeScene?.id,
      title: `${promptTitle} (Copy)`,
      visualStyles: [...visualStyles],
      cameraControls: [...cameraControls],
      lightingOptions: [...lightingOptions],
      environments: [...environments],
      moods: [...moods],
      fields: { ...fields },
      compiledMasterPrompt,
      isFavorite: false,
      createdAtIso: new Date().toISOString(),
    };

    const existingLib = project.promptLibrary || [];
    onUpdateProject({
      ...project,
      promptLibrary: [duplicatedItem, ...existingLib],
      updatedAtIso: new Date().toISOString(),
    });
    setPromptTitle(duplicatedItem.title);
    setSavedNotice('Duplicated prompt into your Project Prompt Library.');
  };

  const handleToggleFavoriteInLibrary = (promptId: string) => {
    const existingLib = project.promptLibrary || [];
    const updatedLib = existingLib.map((item) =>
      item.id === promptId ? { ...item, isFavorite: !item.isFavorite } : item
    );
    onUpdateProject({
      ...project,
      promptLibrary: updatedLib,
      updatedAtIso: new Date().toISOString(),
    });
  };

  const handleDeleteFromLibrary = (promptId: string) => {
    const existingLib = project.promptLibrary || [];
    onUpdateProject({
      ...project,
      promptLibrary: existingLib.filter((item) => item.id !== promptId),
      updatedAtIso: new Date().toISOString(),
    });
  };

  const handleLoadFromLibrary = (item: PromptStudioItem) => {
    setPromptTitle(item.title);
    setVisualStyles(item.visualStyles);
    setCameraControls(item.cameraControls);
    setLightingOptions(item.lightingOptions);
    setEnvironments(item.environments);
    setMoods(item.moods);
    setFields(item.fields);
    setManualMasterOverride(null);
    setSavedNotice(`Loaded "${item.title}" into the active Prompt Studio editor.`);
  };

  const handleCopyPrompt = async () => {
    try {
      await navigator.clipboard.writeText(compiledMasterPrompt);
      setCopiedNotice(true);
      setTimeout(() => setCopiedNotice(false), 2200);
    } catch {
      setCopiedNotice(true);
      setTimeout(() => setCopiedNotice(false), 2200);
    }
  };

  const promptLibrary = useMemo(() => {
    const raw = project.promptLibrary || [];
    if (raw.length > 0) return raw;
    return scenes
      .map((s) => s.promptStudioItem)
      .filter((item): item is PromptStudioItem => Boolean(item));
  }, [project.promptLibrary, scenes]);

  const filteredLibrary = useMemo(
    () =>
      libraryFilter === 'favorites'
        ? promptLibrary.filter((p) => p.isFavorite)
        : promptLibrary,
    [promptLibrary, libraryFilter]
  );

  return (
    <div className="space-y-6 pb-12">
      {/* Top Studio Header */}
      <div className="rounded-2xl border border-slate-800/90 bg-[#0B0F19]/95 p-5 sm:p-6 shadow-xl">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-violet-400">
              <Wand2 className="w-3.5 h-3.5" />
              <span>Advanced AI Prompt Studio · Story-Driven Cinema Engine</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-white font-['Bricolage_Grotesque'] mt-1">
              Scene & Visual Prompt Architecture
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-3xl">
              Craft multi-layered cinematic scenes with combinable visual styles, camera rigs, volumetric lighting, environments, moods, and all 13 director prompt parameters.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              type="button"
              onClick={handleAutoGeneratePromptWithAi}
              disabled={isGeneratingAi}
              className="min-h-[44px] px-4 py-2.5 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-semibold text-xs sm:text-sm flex items-center gap-2 shadow-lg shadow-violet-950/50 transition cursor-pointer disabled:opacity-60"
            >
              {isGeneratingAi ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <Sparkles className="w-4 h-4" />
              )}
              <span>{isGeneratingAi ? 'Synthesizing...' : 'Auto-Generate AI Prompt'}</span>
            </button>

            <button
              type="button"
              onClick={() => handleApplyAndSaveToScene(true)}
              className="min-h-[44px] px-4 py-2.5 rounded-xl bg-sky-500 hover:bg-sky-400 text-slate-950 font-semibold text-xs sm:text-sm flex items-center gap-2 transition cursor-pointer"
            >
              <Save className="w-4 h-4" />
              <span>Save & Apply to Scene</span>
            </button>

            <button
              type="button"
              onClick={() => setPreviewModalOpen(true)}
              className="min-h-[44px] px-3.5 py-2.5 rounded-xl border border-slate-700 bg-slate-900/90 hover:bg-slate-800 text-slate-200 text-xs sm:text-sm font-medium flex items-center gap-1.5 transition cursor-pointer"
            >
              <Eye className="w-4 h-4 text-sky-400" />
              <span>Preview Prompt</span>
            </button>
          </div>
        </div>

        {savedNotice && (
          <div className="mt-4 rounded-xl border border-emerald-500/30 bg-emerald-950/30 px-4 py-2.5 text-xs text-emerald-300 flex items-center justify-between gap-2">
            <span>{savedNotice}</span>
            <button
              type="button"
              onClick={() => setSavedNotice(null)}
              className="text-emerald-400 hover:text-white text-xs font-mono"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Scene Target Selector Bar */}
        {scenes.length > 0 && (
          <div className="mt-5 pt-4 border-t border-slate-800/80">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Select Target Scene ({scenes.length} Scenes in Timeline)
              </span>
              {activeScene && (
                <span className="text-xs font-mono text-sky-400">
                  Active: Scene #{activeScene.index} · {activeScene.section} (
                  {formatTimecode(activeScene.startTimeSec)}–
                  {formatTimecode(activeScene.endTimeSec)})
                </span>
              )}
            </div>
            <div className="flex items-center gap-2 overflow-x-auto pb-1.5 no-scrollbar">
              {scenes.map((scene) => {
                const isSelected = scene.id === activeScene?.id;
                return (
                  <button
                    key={scene.id}
                    type="button"
                    onClick={() => setSelectedSceneId(scene.id)}
                    className={`min-h-[44px] shrink-0 px-3.5 py-2 rounded-xl border text-left transition cursor-pointer ${
                      isSelected
                        ? 'border-violet-500 bg-violet-950/50 text-white shadow-sm'
                        : 'border-slate-800 bg-slate-900/60 text-slate-400 hover:border-slate-700 hover:text-slate-200'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] font-mono font-bold text-violet-400">
                        S{scene.index}
                      </span>
                      <span className="text-xs font-semibold truncate max-w-[150px]">
                        {scene.section}
                      </span>
                      <span className="text-[10px] font-mono text-slate-400">
                        {formatTimecode(scene.startTimeSec)}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Main Two-Column Responsive Layout */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
        {/* Left 8 Columns: Multi-Select Tag Matrix + 13 Advanced Director Fields */}
        <div className="xl:col-span-8 space-y-6">
          {/* Combinable Visual Selectors */}
          <div className="rounded-2xl border border-slate-800/90 bg-[#0B0F19]/95 p-5 sm:p-6 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-slate-800 pb-4">
              <div>
                <h2 className="text-base sm:text-lg font-bold text-white font-['Bricolage_Grotesque'] flex items-center gap-2">
                  <Layers className="w-4 h-4 text-violet-400" />
                  <span>1. Combinable Cinematic Style, Camera, Lighting, Environment & Mood</span>
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Select multiple options in any category to blend aesthetics into the master scene prompt.
                </p>
              </div>
              <input
                type="text"
                value={promptTitle}
                onChange={(e) => setPromptTitle(e.target.value)}
                placeholder="Prompt Title..."
                className="min-h-[40px] px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-700 text-xs sm:text-sm text-white focus:border-violet-500 focus:outline-none sm:w-64"
              />
            </div>

            {/* Visual Style (12 Options) */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-semibold uppercase tracking-wider text-slate-300">
                  Visual Style ({visualStyles.length} selected)
                </label>
                <span className="text-[11px] font-mono text-slate-400">Multi-select</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {PROMPT_VISUAL_STYLES.map((style) => {
                  const active = visualStyles.includes(style);
                  return (
                    <button
                      key={style}
                      type="button"
                      onClick={() => toggleItem(visualStyles, setVisualStyles, style)}
                      className={`min-h-[38px] px-3 py-1.5 rounded-xl text-xs font-medium border transition cursor-pointer ${
                        active
                          ? 'border-violet-500 bg-violet-600/25 text-white shadow-sm'
                          : 'border-slate-800 bg-slate-900/70 text-slate-400 hover:border-slate-700 hover:text-slate-200'
                      }`}
                    >
                      {style}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Camera Controls (14 Options) */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-semibold uppercase tracking-wider text-slate-300">
                  Camera Controls & Movement ({cameraControls.length} selected)
                </label>
                <span className="text-[11px] font-mono text-slate-400">Multi-select</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {PROMPT_CAMERA_CONTROLS.map((cam) => {
                  const active = cameraControls.includes(cam);
                  return (
                    <button
                      key={cam}
                      type="button"
                      onClick={() => toggleItem(cameraControls, setCameraControls, cam)}
                      className={`min-h-[38px] px-3 py-1.5 rounded-xl text-xs font-medium border transition cursor-pointer ${
                        active
                          ? 'border-sky-500 bg-sky-500/20 text-white shadow-sm'
                          : 'border-slate-800 bg-slate-900/70 text-slate-400 hover:border-slate-700 hover:text-slate-200'
                      }`}
                    >
                      {cam}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Lighting (9 Options) */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-semibold uppercase tracking-wider text-slate-300">
                  Cinematic Lighting ({lightingOptions.length} selected)
                </label>
                <span className="text-[11px] font-mono text-slate-400">Multi-select</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {PROMPT_LIGHTING_OPTIONS.map((light) => {
                  const active = lightingOptions.includes(light);
                  return (
                    <button
                      key={light}
                      type="button"
                      onClick={() => toggleItem(lightingOptions, setLightingOptions, light)}
                      className={`min-h-[38px] px-3 py-1.5 rounded-xl text-xs font-medium border transition cursor-pointer ${
                        active
                          ? 'border-amber-500 bg-amber-500/20 text-white shadow-sm'
                          : 'border-slate-800 bg-slate-900/70 text-slate-400 hover:border-slate-700 hover:text-slate-200'
                      }`}
                    >
                      {light}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Environment (12 Options) */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-semibold uppercase tracking-wider text-slate-300">
                  Environment & Location ({environments.length} selected)
                </label>
                <span className="text-[11px] font-mono text-slate-400">Multi-select</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {PROMPT_ENVIRONMENT_OPTIONS.map((env) => {
                  const active = environments.includes(env);
                  return (
                    <button
                      key={env}
                      type="button"
                      onClick={() => toggleItem(environments, setEnvironments, env)}
                      className={`min-h-[38px] px-3 py-1.5 rounded-xl text-xs font-medium border transition cursor-pointer ${
                        active
                          ? 'border-emerald-500 bg-emerald-500/20 text-white shadow-sm'
                          : 'border-slate-800 bg-slate-900/70 text-slate-400 hover:border-slate-700 hover:text-slate-200'
                      }`}
                    >
                      {env}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Mood (11 Options) */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-semibold uppercase tracking-wider text-slate-300">
                  Emotional Mood & Tone ({moods.length} selected)
                </label>
                <span className="text-[11px] font-mono text-slate-400">Multi-select</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {PROMPT_MOOD_OPTIONS.map((mood) => {
                  const active = moods.includes(mood);
                  return (
                    <button
                      key={mood}
                      type="button"
                      onClick={() => toggleItem(moods, setMoods, mood)}
                      className={`min-h-[38px] px-3 py-1.5 rounded-xl text-xs font-medium border transition cursor-pointer ${
                        active
                          ? 'border-pink-500 bg-pink-500/20 text-white shadow-sm'
                          : 'border-slate-800 bg-slate-900/70 text-slate-400 hover:border-slate-700 hover:text-slate-200'
                      }`}
                    >
                      {mood}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* 13 Advanced Prompt Fields */}
          <div className="rounded-2xl border border-slate-800/90 bg-[#0B0F19]/95 p-5 sm:p-6 space-y-5">
            <div className="border-b border-slate-800 pb-3">
              <h2 className="text-base sm:text-lg font-bold text-white font-['Bricolage_Grotesque'] flex items-center gap-2">
                <Sliders className="w-4 h-4 text-sky-400" />
                <span>2. Advanced 13-Parameter Director Prompt Controls</span>
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Fine-tune every storytelling layer — character action, wardrobe, lens motion, colour grade, visual FX, and negative constraints.
              </p>
            </div>

            {/* 1. Main Scene Description */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                1. Main Scene Description (Narrative Storytelling Beat)
              </label>
              <textarea
                rows={2}
                value={fields.mainSceneDescription}
                onChange={(e) => updateField('mainSceneDescription', e.target.value)}
                placeholder="Describe the core visual story beat (e.g. Lonely person walking on a rainy street, flashback in golden sunlight...)"
                className="w-full rounded-xl bg-slate-900/90 border border-slate-800 px-3.5 py-2.5 text-xs sm:text-sm text-white focus:border-violet-500 focus:outline-none"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* 2. Character Description */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                  2. Character Description
                </label>
                <input
                  type="text"
                  value={fields.characterDescription}
                  onChange={(e) => updateField('characterDescription', e.target.value)}
                  className="w-full min-h-[42px] rounded-xl bg-slate-900/90 border border-slate-800 px-3.5 py-2 text-xs sm:text-sm text-white focus:border-violet-500 focus:outline-none"
                />
              </div>

              {/* 3. Character Action */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                  3. Character Action & Blocking
                </label>
                <input
                  type="text"
                  value={fields.characterAction}
                  onChange={(e) => updateField('characterAction', e.target.value)}
                  className="w-full min-h-[42px] rounded-xl bg-slate-900/90 border border-slate-800 px-3.5 py-2 text-xs sm:text-sm text-white focus:border-violet-500 focus:outline-none"
                />
              </div>

              {/* 4. Facial Expression */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                  4. Facial Expression
                </label>
                <input
                  type="text"
                  value={fields.facialExpression}
                  onChange={(e) => updateField('facialExpression', e.target.value)}
                  className="w-full min-h-[42px] rounded-xl bg-slate-900/90 border border-slate-800 px-3.5 py-2 text-xs sm:text-sm text-white focus:border-violet-500 focus:outline-none"
                />
              </div>

              {/* 5. Clothing / Wardrobe */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                  5. Clothing & Wardrobe Continuity
                </label>
                <input
                  type="text"
                  value={fields.clothing}
                  onChange={(e) => updateField('clothing', e.target.value)}
                  className="w-full min-h-[42px] rounded-xl bg-slate-900/90 border border-slate-800 px-3.5 py-2 text-xs sm:text-sm text-white focus:border-violet-500 focus:outline-none"
                />
              </div>

              {/* 6. Environment */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                  6. Environment & Set Dressing
                </label>
                <input
                  type="text"
                  value={fields.environment}
                  onChange={(e) => updateField('environment', e.target.value)}
                  className="w-full min-h-[42px] rounded-xl bg-slate-900/90 border border-slate-800 px-3.5 py-2 text-xs sm:text-sm text-white focus:border-violet-500 focus:outline-none"
                />
              </div>

              {/* 7. Camera Movement */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                  7. Camera Movement & Lens Rig
                </label>
                <input
                  type="text"
                  value={fields.cameraMovement}
                  onChange={(e) => updateField('cameraMovement', e.target.value)}
                  className="w-full min-h-[42px] rounded-xl bg-slate-900/90 border border-slate-800 px-3.5 py-2 text-xs sm:text-sm text-white focus:border-violet-500 focus:outline-none"
                />
              </div>

              {/* 8. Lighting */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                  8. Lighting Setup
                </label>
                <input
                  type="text"
                  value={fields.lighting}
                  onChange={(e) => updateField('lighting', e.target.value)}
                  className="w-full min-h-[42px] rounded-xl bg-slate-900/90 border border-slate-800 px-3.5 py-2 text-xs sm:text-sm text-white focus:border-violet-500 focus:outline-none"
                />
              </div>

              {/* 9. Colour Grading */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                  9. Colour Grading & Film Stock
                </label>
                <input
                  type="text"
                  value={fields.colorGrading}
                  onChange={(e) => updateField('colorGrading', e.target.value)}
                  className="w-full min-h-[42px] rounded-xl bg-slate-900/90 border border-slate-800 px-3.5 py-2 text-xs sm:text-sm text-white focus:border-violet-500 focus:outline-none"
                />
              </div>

              {/* 10. Visual Effects */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                  10. Visual Effects & Atmosphere
                </label>
                <input
                  type="text"
                  value={fields.visualEffects}
                  onChange={(e) => updateField('visualEffects', e.target.value)}
                  className="w-full min-h-[42px] rounded-xl bg-slate-900/90 border border-slate-800 px-3.5 py-2 text-xs sm:text-sm text-white focus:border-violet-500 focus:outline-none"
                />
              </div>

              {/* 11. Scene Transition */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                  11. Scene Transition
                </label>
                <input
                  type="text"
                  value={fields.sceneTransition}
                  onChange={(e) => updateField('sceneTransition', e.target.value)}
                  className="w-full min-h-[42px] rounded-xl bg-slate-900/90 border border-slate-800 px-3.5 py-2 text-xs sm:text-sm text-white focus:border-violet-500 focus:outline-none"
                />
              </div>

              {/* 12. Negative Prompt */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-rose-300 mb-1.5">
                  12. Negative Prompt (Elements to Exclude)
                </label>
                <input
                  type="text"
                  value={fields.negativePrompt}
                  onChange={(e) => updateField('negativePrompt', e.target.value)}
                  className="w-full min-h-[42px] rounded-xl bg-slate-900/90 border border-slate-800 px-3.5 py-2 text-xs sm:text-sm text-white focus:border-rose-500 focus:outline-none"
                />
              </div>

              {/* 13. Additional Instructions */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                  13. Additional Director Instructions
                </label>
                <input
                  type="text"
                  value={fields.additionalInstructions}
                  onChange={(e) => updateField('additionalInstructions', e.target.value)}
                  className="w-full min-h-[42px] rounded-xl bg-slate-900/90 border border-slate-800 px-3.5 py-2 text-xs sm:text-sm text-white focus:border-violet-500 focus:outline-none"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Right 4 Columns: Compiled Master Prompt + Actions + Prompt Library */}
        <div className="xl:col-span-4 space-y-6">
          {/* Live Compiled Master Prompt Card */}
          <div className="rounded-2xl border border-violet-500/30 bg-[#0B0F19]/95 p-5 shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Film className="w-4 h-4 text-violet-400" />
                <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                  Compiled Master Scene Prompt
                </h3>
              </div>
              <button
                type="button"
                onClick={handleCopyPrompt}
                className="min-h-[36px] px-3 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-200 flex items-center gap-1.5 transition cursor-pointer"
              >
                {copiedNotice ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="text-emerald-300">Copied</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5 text-sky-400" />
                    <span>Copy Prompt</span>
                  </>
                )}
              </button>
            </div>

            <textarea
              rows={6}
              value={compiledMasterPrompt}
              onChange={(e) => setManualMasterOverride(e.target.value)}
              className="w-full rounded-xl bg-slate-950/90 border border-slate-800 p-3.5 text-xs font-mono text-slate-200 leading-relaxed focus:border-violet-500 focus:outline-none"
            />

            <div className="grid grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={() => handleApplyAndSaveToScene(true)}
                className="min-h-[44px] px-3 py-2 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition cursor-pointer"
              >
                <Save className="w-3.5 h-3.5" />
                <span>Save Prompt</span>
              </button>

              <button
                type="button"
                onClick={handleDuplicatePrompt}
                className="min-h-[44px] px-3 py-2 rounded-xl border border-slate-700 bg-slate-900 hover:bg-slate-800 text-slate-200 text-xs font-semibold flex items-center justify-center gap-1.5 transition cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5 text-sky-400" />
                <span>Duplicate Prompt</span>
              </button>

              <button
                type="button"
                onClick={handleAutoGeneratePromptWithAi}
                disabled={isGeneratingAi}
                className="min-h-[44px] px-3 py-2 rounded-xl border border-slate-700 bg-slate-900 hover:bg-slate-800 text-slate-200 text-xs font-semibold flex items-center justify-center gap-1.5 transition cursor-pointer disabled:opacity-50"
              >
                <RefreshCw
                  className={`w-3.5 h-3.5 text-violet-400 ${
                    isGeneratingAi ? 'animate-spin' : ''
                  }`}
                />
                <span>Regenerate</span>
              </button>

              {activeScene && onGenerateSceneVideo && (
                <button
                  type="button"
                  onClick={() => {
                    handleApplyAndSaveToScene(true);
                    onGenerateSceneVideo({
                      ...activeScene,
                      visualPrompt: compiledMasterPrompt,
                      googleFlowPrompt: compiledMasterPrompt,
                    });
                  }}
                  className="min-h-[44px] px-3 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold flex items-center justify-center gap-1.5 transition cursor-pointer"
                >
                  <Video className="w-3.5 h-3.5" />
                  <span>Render Scene Clip</span>
                </button>
              )}
            </div>

            {onOpenEditor && (
              <button
                type="button"
                onClick={onOpenEditor}
                className="w-full min-h-[42px] rounded-xl border border-sky-500/40 bg-sky-950/30 hover:bg-sky-900/40 text-sky-300 text-xs font-semibold flex items-center justify-center gap-2 transition cursor-pointer"
              >
                <span>Open Scene in Timeline Video Editor</span>
              </button>
            )}
          </div>

          {/* Prompt History & Favorites Library */}
          <div className="rounded-2xl border border-slate-800/90 bg-[#0B0F19]/95 p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <History className="w-4 h-4 text-sky-400" />
                <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                  Prompt Library & History ({promptLibrary.length})
                </h3>
              </div>

              <div className="flex items-center gap-1 rounded-lg bg-slate-900 p-1 border border-slate-800">
                <button
                  type="button"
                  onClick={() => setLibraryFilter('all')}
                  className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition cursor-pointer ${
                    libraryFilter === 'all'
                      ? 'bg-violet-600 text-white'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  All
                </button>
                <button
                  type="button"
                  onClick={() => setLibraryFilter('favorites')}
                  className={`px-2.5 py-1 rounded-md text-[11px] font-semibold flex items-center gap-1 transition cursor-pointer ${
                    libraryFilter === 'favorites'
                      ? 'bg-pink-600 text-white'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Heart className="w-3 h-3" />
                  <span>Favorites</span>
                </button>
              </div>
            </div>

            {filteredLibrary.length === 0 ? (
              <div className="rounded-xl border border-slate-800/80 bg-slate-900/40 p-6 text-center space-y-2">
                <p className="text-xs text-slate-400">
                  {libraryFilter === 'favorites'
                    ? 'No favorite prompts starred yet. Click the heart icon on any prompt in your library.'
                    : 'No saved prompts yet. Click "Save Prompt" to store scene prompts in your project library.'}
                </p>
              </div>
            ) : (
              <div className="space-y-2.5 max-h-[420px] overflow-y-auto pr-1">
                {filteredLibrary.map((item) => (
                  <div
                    key={item.id}
                    className="rounded-xl border border-slate-800 bg-slate-900/70 p-3.5 hover:border-slate-700 transition space-y-2"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="text-xs font-bold text-white">
                          {item.title}
                        </div>
                        <div className="text-[11px] text-violet-300 font-mono mt-0.5">
                          {item.visualStyles.slice(0, 2).join(' · ')} ·{' '}
                          {item.environments[0] || 'Cinematic Set'}
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => handleToggleFavoriteInLibrary(item.id)}
                          title="Toggle Favorite"
                          className="min-h-[34px] min-w-[34px] rounded-lg hover:bg-slate-800 flex items-center justify-center transition cursor-pointer"
                        >
                          <Heart
                            className={`w-3.5 h-3.5 ${
                              item.isFavorite
                                ? 'text-pink-500 fill-pink-500'
                                : 'text-slate-500'
                            }`}
                          />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteFromLibrary(item.id)}
                          title="Delete Prompt"
                          className="min-h-[34px] min-w-[34px] rounded-lg hover:bg-slate-800 flex items-center justify-center text-slate-500 hover:text-rose-400 transition cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    <p className="text-[11px] text-slate-400 line-clamp-2 font-mono">
                      {item.compiledMasterPrompt}
                    </p>

                    <div className="flex items-center justify-between pt-1">
                      <span className="text-[10px] font-mono text-slate-500">
                        {new Date(item.createdAtIso).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleLoadFromLibrary(item)}
                        className="px-2.5 py-1 rounded-lg bg-violet-600/20 hover:bg-violet-600/40 border border-violet-500/40 text-violet-200 text-[11px] font-semibold transition cursor-pointer"
                      >
                        Load into Editor
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Preview Scene Prompt Modal */}
      {previewModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-2xl rounded-2xl border border-slate-700 bg-[#0B0F19] p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <span className="text-xs font-mono uppercase tracking-wider text-violet-400">
                  Scene Prompt Inspector
                </span>
                <h3 className="text-lg font-bold text-white font-['Bricolage_Grotesque']">
                  {promptTitle}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setPreviewModalOpen(false)}
                className="min-h-[40px] px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 cursor-pointer"
              >
                Close Preview
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 text-xs">
              <div className="rounded-xl bg-slate-900/90 border border-slate-800 p-3">
                <div className="text-[10px] font-mono uppercase text-slate-400">
                  Visual Styles
                </div>
                <div className="text-white font-semibold mt-1">
                  {visualStyles.join(', ') || 'Cinematic Realism'}
                </div>
              </div>
              <div className="rounded-xl bg-slate-900/90 border border-slate-800 p-3">
                <div className="text-[10px] font-mono uppercase text-slate-400">
                  Camera Rig
                </div>
                <div className="text-sky-300 font-semibold mt-1">
                  {cameraControls.join(', ') || 'Tracking Shot'}
                </div>
              </div>
              <div className="rounded-xl bg-slate-900/90 border border-slate-800 p-3">
                <div className="text-[10px] font-mono uppercase text-slate-400">
                  Lighting & Mood
                </div>
                <div className="text-amber-300 font-semibold mt-1">
                  {lightingOptions.join(', ')} · {moods.join(', ')}
                </div>
              </div>
            </div>

            <div className="rounded-xl bg-slate-950 border border-slate-800 p-4 space-y-2">
              <div className="text-[11px] font-mono uppercase text-slate-400">
                Full Compiled Master Prompt
              </div>
              <p className="text-xs font-mono text-slate-200 leading-relaxed">
                {compiledMasterPrompt}
              </p>
            </div>

            <div className="flex justify-end gap-2.5">
              <button
                type="button"
                onClick={handleCopyPrompt}
                className="min-h-[42px] px-4 py-2 rounded-xl border border-slate-700 bg-slate-900 hover:bg-slate-800 text-xs font-semibold text-white cursor-pointer"
              >
                {copiedNotice ? 'Copied to Clipboard!' : 'Copy Master Prompt'}
              </button>
              <button
                type="button"
                onClick={() => {
                  handleApplyAndSaveToScene(true);
                  setPreviewModalOpen(false);
                }}
                className="min-h-[42px] px-4 py-2 rounded-xl bg-violet-600 hover:bg-violet-500 text-xs font-semibold text-white cursor-pointer"
              >
                Apply to Scene & Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

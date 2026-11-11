import {
  AnimationPreset,
  AspectRatioOption,
  CharacterProfileItem,
  DetectedSongSection,
  DirectorStyle,
  GenerationCostEstimate,
  LyricSymbolismItem,
  ProviderPriority,
  StoryboardScene,
  SubtitleCue,
  SymbolismInterpretationMode,
  TransitionType,
} from '../types/studio';

export const DIRECTOR_STYLE_CONFIGS: Record<
  DirectorStyle,
  {
    cameraDefault: string;
    movementDefault: string;
    lightingDefault: string;
    environmentDefault: string;
    transitionDefault: TransitionType;
    colorPaletteHex: [string, string];
  }
> = {
  'Romantic music video': {
    cameraDefault: '50mm Anamorphic Close-Up',
    movementDefault: 'Slow gimbal orbital drift',
    lightingDefault: 'Warm golden hour & tungsten bokeh rim light',
    environmentDefault: 'Rain-kissed Parisian rooftop terrace at twilight',
    transitionDefault: 'Cross Dissolve',
    colorPaletteHex: ['#F59E0B', '#EC4899'],
  },
  'Sad emotional music video': {
    cameraDefault: '35mm Shallow Depth Medium Shot',
    movementDefault: 'Slow pull-back dolly track',
    lightingDefault: 'Desaturated overcast blue & solitary window key light',
    environmentDefault: 'Misty coastal highway and empty brutalist apartment',
    transitionDefault: 'Fade to Black',
    colorPaletteHex: ['#38BDF8', '#6366F1'],
  },
  'Breakup music video': {
    cameraDefault: '85mm Split-Diopter Portrait',
    movementDefault: 'Handheld emotional breathing framing',
    lightingDefault: 'High-contrast neon sodium vapor & cold slate shadows',
    environmentDefault: 'Midnight diner booth and rain-streaked glass',
    transitionDefault: 'Cross Dissolve',
    colorPaletteHex: ['#FB7185', '#3B82F6'],
  },
  'Rap music video': {
    cameraDefault: '16mm Ultra-Wide Low Angle',
    movementDefault: 'Dynamic whip-pan & push-in zoom synchronized to bass',
    lightingDefault: 'Strobe xenon bars & industrial crimson underglow',
    environmentDefault: 'Underground concrete vault with chrome floodlights',
    transitionDefault: 'Beat Flash Cut',
    colorPaletteHex: ['#EF4444', '#F59E0B'],
  },
  'Cinematic Bollywood style': {
    cameraDefault: '40mm Panavision Wide Crane Shot',
    movementDefault: 'Sweeping technocrane arc through silk & confetti',
    lightingDefault: 'Volumetric amber festival lanterns & sapphire moonlight',
    environmentDefault: 'Grand marble courtyard reflecting thousands of diyas',
    transitionDefault: 'Anamorphic Whip Pan',
    colorPaletteHex: ['#FBBF24', '#EC4899'],
  },
  'Anime music video': {
    cameraDefault: '24mm Dynamic Anime Perspective',
    movementDefault: 'Sakuga speed-line camera tracking & sky tilt',
    lightingDefault: 'Makoto Shinkai twilight horizon glow & lens flare',
    environmentDefault: 'Shinjuku pedestrian overpass under a comet-lit sky',
    transitionDefault: 'Beat Flash Cut',
    colorPaletteHex: ['#818CF8', '#F472B6'],
  },
  '3D animated music video': {
    cameraDefault: '35mm Virtual Cinema Camera',
    movementDefault: 'Smooth spline camera crane through floating geometry',
    lightingDefault: 'Subsurface scattering rim light & global illumination',
    environmentDefault: 'Surreal kinetic sculpture garden in low gravity',
    transitionDefault: 'Dolly Zoom In',
    colorPaletteHex: ['#2DD4BF', '#8B5CF6'],
  },
  'Realistic music video': {
    cameraDefault: '35mm Arri Alexa Mini LF Natural Frame',
    movementDefault: 'Steadicam continuous following shot',
    lightingDefault: 'Naturalistic Kodak Vision3 500T practical lighting',
    environmentDefault: 'Late-night recording studio and downtown street',
    transitionDefault: 'Cross Dissolve',
    colorPaletteHex: ['#60A5FA', '#FBBF24'],
  },
  'Fantasy music video': {
    cameraDefault: '28mm Wide Anamorphic Vista',
    movementDefault: 'Ascending aerial drone spiral',
    lightingDefault: 'Bioluminescent aurora & ethereal silver mist',
    environmentDefault: 'Obsidian cliffside temple above a sea of clouds',
    transitionDefault: 'Cross Dissolve',
    colorPaletteHex: ['#A855F7', '#06B6D4'],
  },
  'Action music video': {
    cameraDefault: '18mm Russian Arm Tracking Shot',
    movementDefault: 'High-velocity pursuit tracking at 60fps',
    lightingDefault: 'Sparks, tunnel fluorescent strobes & wet asphalt glare',
    environmentDefault: 'Midnight expressway tunnel with rain spray',
    transitionDefault: 'Glitch Sync',
    colorPaletteHex: ['#F97316', '#0EA5E9'],
  },
  'Travel music video': {
    cameraDefault: '24mm VistaVision Landscape Frame',
    movementDefault: 'FPV ridge-skimming glide & golden-hour pan',
    lightingDefault: 'Crisp alpine sunrise rays breaking through valley fog',
    environmentDefault: 'Nordic fjord ridge and winding coastal cliff road',
    transitionDefault: 'Anamorphic Whip Pan',
    colorPaletteHex: ['#10B981', '#3B82F6'],
  },
  'Story-based music video': {
    cameraDefault: '40mm Anamorphic Narrative Framing',
    movementDefault: 'Motivated dolly push-in revealing character emotion',
    lightingDefault: 'Chiaroscuro neo-noir amber key with cobalt shadow fill',
    environmentDefault: 'Metropolitan rooftop & illuminated brutalist stage',
    transitionDefault: 'Cross Dissolve',
    colorPaletteHex: ['#6366F1', '#06B6D4'],
  },
};

interface MetaphorRule {
  keywords: RegExp;
  literalTemplate: (phrase: string) => string;
  metaphoricalTemplate: (phrase: string) => string;
  visualElement: string;
  literalVisualElement: string;
  animationPreset: AnimationPreset;
  primaryColorHex: string;
  secondaryColorHex: string;
  intensity: number;
}

const METAPHOR_RULES: MetaphorRule[] = [
  {
    keywords: /\b(rain|storm|tears|drown|water|ocean|wave|wet|flood|river|sea)\b/i,
    literalTemplate: (p) => `Physical rainfall and reflective wet surfaces mirroring "${p}"`,
    metaphoricalTemplate: () =>
      'Emotional catharsis, washing away past regret, and vulnerability suspended in time',
    visualElement: 'Zero-gravity bioluminescent raindrops freezing mid-air and refracting memories',
    literalVisualElement: 'Heavy midnight downpour splashing across neon-lit wet concrete',
    animationPreset: 'rain_neon_streaks',
    primaryColorHex: '#38BDF8',
    secondaryColorHex: '#818CF8',
    intensity: 0.85,
  },
  {
    keywords: /\b(fire|burn|flame|ash|ember|spark|heat|smoke|gold|sun|light|bright|shine)\b/i,
    literalTemplate: (p) => `Glowing flames and rising golden sparks illustrating "${p}"`,
    metaphoricalTemplate: () =>
      'Creative rebirth, consuming passion, and transformation from ashes into light',
    visualElement: 'Origami paper memories igniting into ascending golden phoenix embers',
    literalVisualElement: 'Flickering bonfire flames and warm tungsten stage pyrotechnics',
    animationPreset: 'ember_ascension',
    primaryColorHex: '#F59E0B',
    secondaryColorHex: '#EF4444',
    intensity: 0.92,
  },
  {
    keywords: /\b(shatter|break|broken|glass|mirror|pieces|fracture|crack|fall|split)\b/i,
    literalTemplate: (p) => `Fracturing mirror panes and falling crystalline shards for "${p}"`,
    metaphoricalTemplate: () =>
      'Fractured identity and the beauty of seeing multiple truths through broken reflections',
    visualElement: 'Floating geometric prism shards orbiting the vocalist and splitting light into rainbows',
    literalVisualElement: 'Cracked studio mirror reflecting the singer from multiple sharp angles',
    animationPreset: 'shattered_prism',
    primaryColorHex: '#EC4899',
    secondaryColorHex: '#6366F1',
    intensity: 0.9,
  },
  {
    keywords: /\b(time|clock|hour|yesterday|forever|memory|past|wait|rewind|fade|moment)\b/i,
    literalTemplate: (p) => `Ticking timepiece hands and passing shadows depicting "${p}"`,
    metaphoricalTemplate: () =>
      'The relentless passage of time and nostalgia looping in a luminous temporal echo',
    visualElement: 'Concentric celestial clockwork rings rotating in reverse around the subject',
    literalVisualElement: 'Vintage wall clock and time-lapse city traffic streaks',
    animationPreset: 'chrono_ripples',
    primaryColorHex: '#A855F7',
    secondaryColorHex: '#38BDF8',
    intensity: 0.78,
  },
  {
    keywords: /\b(night|star|sky|moon|cosmos|space|dream|void|gravity|astral|echo|horizon)\b/i,
    literalTemplate: (p) => `Starlit night sky and atmospheric nocturnal horizon for "${p}"`,
    metaphoricalTemplate: () =>
      'Transcendence beyond earthly isolation into an infinite cosmic dialogue',
    visualElement: 'Swirling violet-cyan nebula dust coalescing into a constellation silhouette',
    literalVisualElement: 'Wide-angle night sky packed with stars above the city skyline',
    animationPreset: 'nebula_swirl',
    primaryColorHex: '#6366F1',
    secondaryColorHex: '#2DD4BF',
    intensity: 0.88,
  },
  {
    keywords: /\b(city|neon|street|highway|run|drive|speed|wire|digital|pulse|cyber|beat|bass)\b/i,
    literalTemplate: (p) => `Illuminated city streets and kinetic transit motion for "${p}"`,
    metaphoricalTemplate: () =>
      'Searching for human connection inside a hyper-accelerated modern labyrinth',
    visualElement: 'Holographic perspective light-grid pulsing in sync with the bassline',
    literalVisualElement: 'Anamorphic tracking shot down a neon-lit metropolitan avenue',
    animationPreset: 'cyber_grid_flight',
    primaryColorHex: '#06B6D4',
    secondaryColorHex: '#3B82F6',
    intensity: 0.86,
  },
  {
    keywords: /\b(love|heart|touch|hold|ghost|shadow|soul|breath|voice|feel)\b/i,
    literalTemplate: (p) => `Intimate close-up of two silhouettes reaching toward light for "${p}"`,
    metaphoricalTemplate: () =>
      'Invisible emotional tether binding two souls across distance and silence',
    visualElement: 'Luminous silk aurora ribbons weaving between the performers on every heartbeat',
    literalVisualElement: 'Warm volumetric spotlight framing the vocalist at a chrome microphone',
    animationPreset: 'aurora_pulse',
    primaryColorHex: '#F472B6',
    secondaryColorHex: '#818CF8',
    intensity: 0.82,
  },
];

/**
 * Analyzes song lyrics line-by-line (or structural audio sections when instrumental)
 * and generates Literal vs Metaphorical meanings, unique visual motifs,
 * procedural animation presets, and AI Director prompt injections.
 */
export function analyzeLyricsForVisualSymbolism(
  lyricsText: string,
  durationSec: number,
  directorStyle: DirectorStyle = 'Story-based music video',
  defaultMode: SymbolismInterpretationMode = 'metaphorical',
  projectId?: string
): LyricSymbolismItem[] {
  const rawLines = (lyricsText || '')
    .split('\n')
    .map((l) => l.trim())
    .filter((l) => l.length > 0 && !/^\[.*\]$/.test(l));

  const safeDuration = Math.max(4, durationSec || 30);

  // If user provided lyrics, use them directly; if instrumental/no lyrics, generate structural rhythmic phrases
  const effectiveLines =
    rawLines.length > 0
      ? rawLines
      : [
          'Instrumental Intro — Rising harmonic overture & beat pulse',
          'Main Groove — Rhythmic bassline & melodic progression',
          'Chorus Peak — High-energy harmonic crescendo',
          'Outro Fade — Atmospheric resonance & final cadence',
        ];

  const slotDuration = Number((safeDuration / effectiveLines.length).toFixed(2));
  const styleConfig =
    DIRECTOR_STYLE_CONFIGS[directorStyle] ||
    DIRECTOR_STYLE_CONFIGS['Story-based music video'];
  const prefix = projectId ? `${projectId}_` : '';

  return effectiveLines.map((phrase, idx) => {
    const startTimeSec = Number((idx * slotDuration).toFixed(2));
    const endTimeSec =
      idx === effectiveLines.length - 1
        ? safeDuration
        : Number(Math.min(safeDuration, (idx + 1) * slotDuration).toFixed(2));
    const progress = idx / Math.max(1, effectiveLines.length);

    let section = 'Verse 1';
    if (progress < 0.14) section = 'Intro';
    else if (progress < 0.32) section = 'Verse 1';
    else if (progress < 0.5) section = 'Chorus 1';
    else if (progress < 0.66) section = 'Verse 2';
    else if (progress < 0.8) section = 'Bridge';
    else if (progress < 0.92) section = 'Final Chorus';
    else section = 'Outro';

    const matchedRule = METAPHOR_RULES.find((r) => r.keywords.test(phrase));

    const literalMeaning = matchedRule
      ? matchedRule.literalTemplate(phrase)
      : `Direct visual staging of "${phrase}" within ${styleConfig.environmentDefault.toLowerCase()}.`;

    const metaphoricalMeaning = matchedRule
      ? matchedRule.metaphoricalTemplate(phrase)
      : `Symbolic representation of emotional resonance and rhythm evoked by "${phrase}".`;

    const visualElement = matchedRule
      ? matchedRule.visualElement
      : 'Floating warm lantern orbs ascending through volumetric stage mist';

    const literalVisualElement = matchedRule
      ? matchedRule.literalVisualElement
      : `Expressive performance close-up inside ${styleConfig.environmentDefault.toLowerCase()}`;

    const animationPreset: AnimationPreset = matchedRule
      ? matchedRule.animationPreset
      : (
          [
            'nebula_swirl',
            'cyber_grid_flight',
            'aurora_pulse',
            'ember_ascension',
            'rain_neon_streaks',
            'shattered_prism',
            'chrono_ripples',
            'floating_lanterns',
          ] as AnimationPreset[]
        )[idx % 8];

    const primaryColorHex = matchedRule
      ? matchedRule.primaryColorHex
      : styleConfig.colorPaletteHex[0];
    const secondaryColorHex = matchedRule
      ? matchedRule.secondaryColorHex
      : styleConfig.colorPaletteHex[1];
    const intensity = matchedRule ? matchedRule.intensity : 0.78;

    const activeVisual =
      defaultMode === 'literal'
        ? literalVisualElement
        : defaultMode === 'hybrid'
          ? `${literalVisualElement} seamlessly morphing into ${visualElement.toLowerCase()}`
          : visualElement;

    const directorPromptInjection = `Symbolic Visual Cue (${defaultMode.toUpperCase()}): ${activeVisual} — representing "${phrase}" (${
      defaultMode === 'literal' ? literalMeaning : metaphoricalMeaning
    }).`;

    return {
      id: `${prefix}sym_${idx + 1}`,
      projectId,
      lineIndex: idx,
      startTimeSec,
      endTimeSec,
      lyricPhrase: phrase,
      section,
      literalMeaning,
      metaphoricalMeaning,
      visualElement,
      literalVisualElement,
      animationPreset,
      activeMode: defaultMode,
      primaryColorHex,
      secondaryColorHex,
      intensity,
      directorPromptInjection,
    };
  });
}

/**
 * Integrates a LyricSymbolismItem with a scene's visual and Google Flow prompts
 * when the user switches between Metaphorical, Literal, and Hybrid symbolism modes.
 */
export function injectSymbolismIntoScenePrompt(
  baseVisualPrompt: string,
  symbolism: LyricSymbolismItem,
  mode: SymbolismInterpretationMode,
  directorStyle: DirectorStyle,
  characters: CharacterProfileItem[]
): {
  updatedVisualPrompt: string;
  updatedGoogleFlowPrompt: string;
  activeMotif: string;
} {
  const activeMotif =
    mode === 'literal'
      ? symbolism.literalVisualElement
      : mode === 'hybrid'
        ? `${symbolism.literalVisualElement} + ${symbolism.visualElement}`
        : symbolism.visualElement;

  const meaningText =
    mode === 'literal'
      ? symbolism.literalMeaning
      : mode === 'hybrid'
        ? `${symbolism.literalMeaning}; metaphorically ${symbolism.metaphoricalMeaning.toLowerCase()}`
        : symbolism.metaphoricalMeaning;

  const charConsistencyBlock =
    characters.length > 0
      ? characters
          .map(
            (c) =>
              `[Character Lock: ${c.name} — ${c.appearancePrompt}, Wardrobe: ${c.wardrobeLock}, Hair: ${c.hairstyleLock}]`
          )
          .join(' ')
      : '[Character Lock: Consistent lead vocalist silhouette and wardrobe]';

  const cleanBase = baseVisualPrompt.replace(/\s*\| Lyric Symbolism.*$/i, '').trim();
  const updatedVisualPrompt = `${cleanBase} | Lyric Symbolism (${mode}): ${activeMotif} (${meaningText})`;

  const updatedGoogleFlowPrompt = `${directorStyle}. ${cleanBase}. Lyric Visual Metaphor (${mode}): ${activeMotif}. ${charConsistencyBlock}. Smooth 24fps anamorphic motion, high temporal coherence.`;

  return {
    updatedVisualPrompt,
    updatedGoogleFlowPrompt,
    activeMotif,
  };
}

export interface GeminiGeneratedSceneInput {
  section?: string;
  title?: string;
  visualPrompt?: string;
  cameraAngle?: string;
  cameraMovement?: string;
  lighting?: string;
  transition?: string;
  metaphorCue?: string;
  durationSec?: number;
}

/**
 * Builds an adaptive full-length song timeline and scene-by-scene storyboard
 * that covers the EXACT duration of the uploaded song (`00:00` to `durationSec`),
 * integrating live Gemini AI scenes and/or detected audio structural sections.
 * Never hardcodes 06:54 or 03:30, and initializes scenes to status 'QUEUED'
 * unless explicitly specified.
 */
export function generateFullLengthStoryboard(params: {
  projectId?: string;
  durationSec: number;
  directorStyle: DirectorStyle;
  lyricsText: string;
  characters: CharacterProfileItem[];
  symbolismItems: LyricSymbolismItem[];
  providerSource: ProviderPriority;
  defaultBackdropUrls: string[];
  geminiScenes?: GeminiGeneratedSceneInput[];
  detectedSections?: DetectedSongSection[];
  initialSceneStatus?: StoryboardScene['status'];
}): StoryboardScene[] {
  const {
    projectId = 'proj_isolated',
    durationSec,
    directorStyle,
    characters,
    symbolismItems,
    providerSource,
    defaultBackdropUrls,
    geminiScenes,
    detectedSections,
    initialSceneStatus = 'QUEUED',
  } = params;

  // Use the exact uploaded audio duration (minimum 4 seconds for very short audio clips)
  const totalSec = Math.max(4, Math.round(durationSec));
  const styleCfg =
    DIRECTOR_STYLE_CONFIGS[directorStyle] ||
    DIRECTOR_STYLE_CONFIGS['Story-based music video'];

  const defaultSections: StoryboardScene['section'][] =
    totalSec < 32
      ? ['Intro', 'Main Verse', 'Chorus Peak', 'Outro']
      : [
          'Intro',
          'Verse 1',
          'Chorus 1',
          'Verse 2',
          'Chorus 2',
          'Bridge',
          'Final Chorus',
          'Outro',
        ];

  // 1. If Gemini AI returned scenes, normalize their weights to cover 100% of totalSec
  if (geminiScenes && geminiScenes.length > 0) {
    const rawWeights = geminiScenes.map((g) => Math.max(2, Number(g.durationSec) || 15));
    const weightSum = rawWeights.reduce((acc, w) => acc + w, 0) || 1;
    let cursorSec = 0;

    return geminiScenes.map((gScene, idx) => {
      const isLast = idx === geminiScenes.length - 1;
      const proportionalDur = Math.max(
        1,
        Math.round((rawWeights[idx] / weightSum) * totalSec)
      );
      const startTimeSec = cursorSec;
      const endTimeSec = isLast
        ? totalSec
        : Math.min(totalSec - (geminiScenes.length - 1 - idx), cursorSec + proportionalDur);
      const actualDuration = Math.max(1, endTimeSec - startTimeSec);
      cursorSec = endTimeSec;

      const matchedSymbolism =
        symbolismItems.find(
          (s) => s.startTimeSec < endTimeSec && s.endTimeSec > startTimeSec
        ) || symbolismItems[idx % Math.max(1, symbolismItems.length)];

      const sectionLabel =
        gScene.section || defaultSections[idx % defaultSections.length];
      const cameraAngle =
        gScene.cameraAngle ||
        CAMERA_ANGLE_PRESETS[idx % CAMERA_ANGLE_PRESETS.length];
      const cameraMovement =
        gScene.cameraMovement ||
        CAMERA_MOVEMENT_PRESETS[idx % CAMERA_MOVEMENT_PRESETS.length];
      const validTransition = TRANSITION_PRESETS.includes(
        gScene.transition as TransitionType
      )
        ? (gScene.transition as TransitionType)
        : styleCfg.transitionDefault;

      const baseVisualPrompt =
        gScene.visualPrompt ||
        `${sectionLabel} (${formatTimecode(startTimeSec)}–${formatTimecode(
          endTimeSec
        )}): ${styleCfg.environmentDefault}, ${
          gScene.lighting || styleCfg.lightingDefault
        }, ${cameraAngle}, ${cameraMovement}`;

      const injected = matchedSymbolism
        ? injectSymbolismIntoScenePrompt(
            baseVisualPrompt,
            matchedSymbolism,
            matchedSymbolism.activeMode,
            directorStyle,
            characters
          )
        : {
            updatedVisualPrompt: baseVisualPrompt,
            updatedGoogleFlowPrompt: `${directorStyle}. ${baseVisualPrompt}`,
            activeMotif: gScene.metaphorCue || 'Volumetric stage atmosphere',
          };

      const backdropUrl =
        defaultBackdropUrls.length > 0
          ? defaultBackdropUrls[idx % defaultBackdropUrls.length]
          : '';

      return {
        id: `${projectId}_scene_${idx + 1}`,
        projectId,
        index: idx + 1,
        section: sectionLabel,
        title:
          gScene.title ||
          `${sectionLabel}: ${
            matchedSymbolism?.lyricPhrase.slice(0, 38) || 'Cinematic Sequence'
          }`,
        startTimeSec,
        endTimeSec,
        durationSec: actualDuration,
        lyricExcerpt:
          matchedSymbolism?.lyricPhrase ||
          `[${sectionLabel} musical passage]`,
        visualPrompt: injected.updatedVisualPrompt,
        googleFlowPrompt: injected.updatedGoogleFlowPrompt,
        cameraAngle,
        cameraMovement,
        lighting: gScene.lighting || styleCfg.lightingDefault,
        environment: styleCfg.environmentDefault,
        transition: validTransition,
        characterIds: characters.map((c) => c.id),
        linkedSymbolismId: matchedSymbolism?.id,
        symbolismMode: matchedSymbolism?.activeMode || 'metaphorical',
        symbolismVisualMotif: gScene.metaphorCue || injected.activeMotif,
        animationPreset: matchedSymbolism?.animationPreset || 'nebula_swirl',
        status: initialSceneStatus,
        backdropImageUrl: backdropUrl,
        providerSource,
        brightness: 100,
        contrast: 105,
        saturation: 110,
        filmGrain: 18,
      };
    });
  }

  // 2. Dynamic Audio-Section & Lyric-Driven Storyboard Builder
  const fullBlueprint: {
    section: StoryboardScene['section'];
    weight: number;
    defaultSuffix: string;
    cameraAngle: string;
    cameraMovement: string;
    transition: TransitionType;
  }[] = [
    {
      section: 'Intro',
      weight: 15 / 210,
      defaultSuffix: 'Atmospheric Establishing Overture',
      cameraAngle: '24mm Wide Anamorphic Establishing Shot',
      cameraMovement: 'Slow crane descent through volumetric mist',
      transition: 'Cross Dissolve',
    },
    {
      section: 'Verse 1',
      weight: 30 / 210,
      defaultSuffix: 'Intimate Narrative Awakening',
      cameraAngle: '50mm Medium Close-Up',
      cameraMovement: 'Slow dolly push-in on lead vocalist',
      transition: 'Cross Dissolve',
    },
    {
      section: 'Chorus 1',
      weight: 20 / 210,
      defaultSuffix: 'Kinetic Visual Anthem Surge',
      cameraAngle: '35mm Low-Angle Dynamic Stage Frame',
      cameraMovement: '360-degree orbital gimbal rotation',
      transition: 'Beat Flash Cut',
    },
    {
      section: 'Verse 2',
      weight: 30 / 210,
      defaultSuffix: 'Dual Perspective & Memory Echo',
      cameraAngle: '85mm Anamorphic Split-Depth Portrait',
      cameraMovement: 'Lateral tracking parallel to rainy glass',
      transition: 'Anamorphic Whip Pan',
    },
    {
      section: 'Chorus 2',
      weight: 25 / 210,
      defaultSuffix: 'Synchronized Crescendo & Light Storm',
      cameraAngle: '28mm Wide Stage & Crowd Vista',
      cameraMovement: 'Sweeping technocrane arc synchronized to snare',
      transition: 'Beat Flash Cut',
    },
    {
      section: 'Bridge',
      weight: 30 / 210,
      defaultSuffix: 'Surreal Metaphorical Suspension',
      cameraAngle: '40mm Macro-to-Wide Shift Frame',
      cameraMovement: 'Vertigo dolly-zoom time-freeze effect',
      transition: 'Dolly Zoom In',
    },
    {
      section: 'Final Chorus',
      weight: 40 / 210,
      defaultSuffix: 'Climax Catharsis & Full Visual Symphony',
      cameraAngle: '18mm Ultra-Wide Epic Stage & Sky',
      cameraMovement: 'Rapid ascending drone reveal into starlit sky',
      transition: 'Glitch Sync',
    },
    {
      section: 'Outro',
      weight: 20 / 210,
      defaultSuffix: 'Lingering Resonance & Fade',
      cameraAngle: '50mm Silhouette Long Shot',
      cameraMovement: 'Slow pull-back fade into horizon glow',
      transition: 'Fade to Black',
    },
  ];

  // For shorter audio clips (< 32s), use 4 proportional sections so each clip is at least several seconds
  const activeBlueprint =
    totalSec < 32
      ? [
          { ...fullBlueprint[0], weight: 0.2 },
          { ...fullBlueprint[1], weight: 0.3 },
          { ...fullBlueprint[2], weight: 0.3 },
          { ...fullBlueprint[7], weight: 0.2 },
        ]
      : fullBlueprint;

  let cursorSec = 0;
  return activeBlueprint.map((slot, idx) => {
    const isLast = idx === activeBlueprint.length - 1;
    const detected = detectedSections?.[idx];

    let startTimeSec = cursorSec;
    let endTimeSec: number;

    if (detected && detectedSections && detectedSections.length === activeBlueprint.length) {
      startTimeSec = detected.startTimeSec;
      endTimeSec = isLast ? totalSec : detected.endTimeSec;
      cursorSec = endTimeSec;
    } else {
      const rawDuration = Math.max(1, Math.round(totalSec * slot.weight));
      endTimeSec = isLast
        ? totalSec
        : Math.min(totalSec - (activeBlueprint.length - 1 - idx), cursorSec + rawDuration);
      cursorSec = endTimeSec;
    }

    const actualDuration = Math.max(1, endTimeSec - startTimeSec);
    const sectionName = detected?.section || slot.section;

    const matchedSymbolism =
      symbolismItems.find(
        (s) => s.startTimeSec < endTimeSec && s.endTimeSec > startTimeSec
      ) || symbolismItems[idx % Math.max(1, symbolismItems.length)];

    const dynamicHeadline = matchedSymbolism?.lyricPhrase
      ? matchedSymbolism.lyricPhrase
          .split(/\s+/)
          .slice(0, 5)
          .join(' ')
          .replace(/[^\w\s'-]/g, '')
      : slot.defaultSuffix;

    const sceneTitle = matchedSymbolism?.lyricPhrase
      ? `${sectionName}: "${dynamicHeadline}..."`
      : `${sectionName}: ${slot.defaultSuffix}`;

    const energyNote = detected?.energyLevel
      ? ` [Audio Energy: ${detected.energyLevel}]`
      : '';

    const baseVisualPrompt = `${sectionName} (${formatTimecode(
      startTimeSec
    )}–${formatTimecode(endTimeSec)})${energyNote}: Staging "${
      matchedSymbolism?.lyricPhrase || slot.defaultSuffix
    }" inside ${styleCfg.environmentDefault}, ${styleCfg.lightingDefault}, ${
      slot.cameraAngle
    }, ${slot.cameraMovement}`;

    const injected = matchedSymbolism
      ? injectSymbolismIntoScenePrompt(
          baseVisualPrompt,
          matchedSymbolism,
          matchedSymbolism.activeMode,
          directorStyle,
          characters
        )
      : {
          updatedVisualPrompt: baseVisualPrompt,
          updatedGoogleFlowPrompt: `${directorStyle}. ${baseVisualPrompt}`,
          activeMotif: 'Volumetric stage atmosphere',
        };

    const backdropUrl =
      defaultBackdropUrls.length > 0
        ? defaultBackdropUrls[idx % defaultBackdropUrls.length]
        : '';

    return {
      id: `${projectId}_scene_${idx + 1}`,
      projectId,
      index: idx + 1,
      section: sectionName,
      title: sceneTitle,
      startTimeSec,
      endTimeSec,
      durationSec: actualDuration,
      lyricExcerpt:
        matchedSymbolism?.lyricPhrase || `[${sectionName} instrumental passage]`,
      visualPrompt: injected.updatedVisualPrompt,
      googleFlowPrompt: injected.updatedGoogleFlowPrompt,
      cameraAngle: slot.cameraAngle,
      cameraMovement: slot.cameraMovement,
      lighting: styleCfg.lightingDefault,
      environment: styleCfg.environmentDefault,
      transition: slot.transition,
      characterIds: characters.map((c) => c.id),
      linkedSymbolismId: matchedSymbolism?.id,
      symbolismMode: matchedSymbolism?.activeMode || 'metaphorical',
      symbolismVisualMotif: injected.activeMotif,
      animationPreset: matchedSymbolism?.animationPreset || 'nebula_swirl',
      status: initialSceneStatus,
      backdropImageUrl: backdropUrl,
      providerSource,
      brightness: 100,
      contrast: 105,
      saturation: 110,
      filmGrain: 18,
    };
  });
}

/**
 * Enforces truthful Provider Priority and Credit Deduction rules:
 * - Priority 1 (Google AI Pro / Flow Subscription): Marked NOT_INTEGRATED for automated external API execution (Google exposes no public OAuth/REST endpoint for consumer Flow credits).
 * - Priority 2 (Official Google Veo / Omni API): Requires explicit Admin enable + user billing consent.
 * - Priority 3 (Procedural Cinema Engine): 0 app credits, 100% working WebGL/Canvas + FFmpeg audio-reactive motion graphics engine.
 */
export function calculateGenerationCost(params: {
  provider: ProviderPriority;
  sceneCount: number;
  resolution: '720p' | '1080p' | '4K';
  apiFallbackEnabled: boolean;
  veoApiEnabled?: boolean;
}): GenerationCostEstimate {
  const { provider, sceneCount, resolution, apiFallbackEnabled } = params;
  const safeScenes = Math.max(1, sceneCount);
  const resMultiplier = resolution === '4K' ? 2 : resolution === '1080p' ? 1.5 : 1;

  if (provider === 'google_flow_priority_1') {
    return {
      provider,
      providerLabel:
        'Priority 1: Google AI Pro / Google Flow (STATUS: NOT INTEGRATED — No Public Google API)',
      integrationStatus: 'NOT_INTEGRATED',
      appCreditsRequired: 0,
      flowCreditsEstimated: Math.round(safeScenes * 10 * resMultiplier),
      separateApiBilled: false,
      requiresExplicitConsent: false,
      warningMessage:
        'NOT INTEGRATED FOR DIRECT BACKEND GENERATION: Google does not provide an official third-party API to consume consumer Google Flow subscription credits externally. Select Priority 3 (Procedural Cinema Engine) for automated local video generation, or Priority 2 (Official Google Veo API) if enabled.',
    };
  }

  if (provider === 'google_veo_api_priority_2') {
    return {
      provider,
      providerLabel: 'Priority 2: Official Google Veo / Omni API (Separately Billed)',
      integrationStatus: 'REQUIRES_ADMIN_AND_KEY',
      appCreditsRequired: Math.round(safeScenes * 15 * resMultiplier),
      flowCreditsEstimated: 0,
      separateApiBilled: true,
      requiresExplicitConsent: true,
      warningMessage: apiFallbackEnabled
        ? 'SEPARATE API BILLING WARNING: Generating via Official Google Veo / Omni API incurs separate Google Cloud / Gemini API billing outside your consumer Google AI Pro subscription.'
        : 'BLOCKED BY ADMIN SAFEGUARD: Separate API generation is currently disabled in Provider Settings to prevent unintended API charges.',
    };
  }

  return {
    provider,
    providerLabel:
      'Priority 3: Procedural Cinema Engine (Active Canvas/WebGL + FFmpeg Motion Graphics — Not AI Video)',
    integrationStatus: 'READY_PROCEDURAL',
    appCreditsRequired: 0,
    flowCreditsEstimated: 0,
    separateApiBilled: false,
    requiresExplicitConsent: false,
    warningMessage: null,
  };
}

/**
 * Formats seconds as MM:SS
 */
export function formatTimecode(seconds: number): string {
  const safe = Math.max(0, Math.floor(seconds || 0));
  const mins = Math.floor(safe / 60);
  const secs = safe % 60;
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

/**
 * Formats seconds as SRT timestamp HH:MM:SS,mmm
 */
export function formatSrtTimestamp(seconds: number): string {
  const safe = Math.max(0, seconds || 0);
  const hrs = Math.floor(safe / 3600);
  const mins = Math.floor((safe % 3600) / 60);
  const secs = Math.floor(safe % 60);
  const ms = Math.round((safe - Math.floor(safe)) * 1000);
  return `${String(hrs).padStart(2, '0')}:${String(mins).padStart(2, '0')}:${String(
    secs
  ).padStart(2, '0')},${String(ms).padStart(3, '0')}`;
}

/**
 * Synchronizes raw lyrics into word-by-word karaoke SubtitleCue items across the song duration.
 */
export function syncLyricsToTimeline(
  lyricsText: string,
  durationSec: number,
  aspectRatio: AspectRatioOption = '16:9',
  projectId?: string
): SubtitleCue[] {
  const lines = (lyricsText || '')
    .split('\n')
    .map((l) => l.trim())
    .filter((l) => l.length > 0 && !/^\[.*\]$/.test(l));

  if (lines.length === 0 || durationSec <= 0) return [];

  const safeDuration = Math.max(4, durationSec);
  const lineSpan = safeDuration / lines.length;
  const prefix = projectId ? `${projectId}_` : '';

  return lines.map((line, idx) => {
    const startTimeSec = Number((idx * lineSpan).toFixed(2));
    const endTimeSec = Number(
      Math.min(safeDuration, (idx + 1) * lineSpan - 0.1).toFixed(2)
    );
    const rawWords = line.split(/\s+/).filter(Boolean);
    const wordSpan = Math.max(
      0.08,
      (endTimeSec - startTimeSec) / Math.max(1, rawWords.length)
    );

    const words = rawWords.map((word, wIdx) => ({
      word,
      startSec: Number((startTimeSec + wIdx * wordSpan).toFixed(2)),
      endSec: Number((startTimeSec + (wIdx + 1) * wordSpan).toFixed(2)),
    }));

    return {
      id: `${prefix}sub_${idx + 1}`,
      projectId,
      index: idx + 1,
      startTimeSec,
      endTimeSec,
      text: line,
      words,
      animationStyle: 'karaoke_glow',
      fontFamily: 'Bricolage Grotesque',
      primaryColor: aspectRatio === '9:16' ? '#38BDF8' : '#F8FAFC',
      position: 'bottom',
    };
  });
}

/**
 * Exports SubtitleCue list into standard SubRip (.srt) file content.
 */
export function generateSrtContent(subtitles: SubtitleCue[]): string {
  return subtitles
    .map(
      (cue, idx) =>
        `${idx + 1}\n${formatSrtTimestamp(cue.startTimeSec)} --> ${formatSrtTimestamp(
          cue.endTimeSec
        )}\n${cue.text}\n`
    )
    .join('\n');
}

/**
 * Generates deterministic beat timestamps from BPM and duration.
 */
export function generateBeatGrid(bpm: number, durationSec: number): number[] {
  if (!durationSec || durationSec <= 0) return [];
  const safeBpm = Math.min(240, Math.max(40, bpm || 120));
  const beatInterval = 60 / safeBpm;
  const beats: number[] = [];
  for (let t = 0; t <= durationSec; t += beatInterval) {
    beats.push(Number(t.toFixed(3)));
  }
  return beats;
}

export const CAMERA_ANGLE_PRESETS: string[] = [
  '16mm Ultra-Wide Low Angle',
  '24mm Wide Anamorphic Establishing Shot',
  '35mm Arri Alexa Medium Frame',
  '40mm Anamorphic Narrative Framing',
  '50mm Anamorphic Close-Up',
  '85mm Split-Diopter Portrait',
  'Overhead Bird-Eye God Shot',
  'Dutch Tilt Kinetic Frame',
];

export const CAMERA_MOVEMENT_PRESETS: string[] = [
  'Slow gimbal orbital drift',
  'Motivated dolly push-in revealing character emotion',
  'Sweeping technocrane arc synchronized to snare',
  'Vertigo dolly-zoom time-freeze effect',
  'Handheld emotional breathing framing',
  'High-velocity pursuit tracking at 60fps',
  'Slow crane descent through volumetric mist',
  'Static locked-off symmetrical tableau',
];

export const TRANSITION_PRESETS: TransitionType[] = [
  'Cross Dissolve',
  'Beat Flash Cut',
  'Anamorphic Whip Pan',
  'Dolly Zoom In',
  'Glitch Sync',
  'Fade to Black',
];

/**
 * Director's Cut Mode: Applies user edits to a scene's prompt, camera angle,
 * camera movement, lighting, transition type, and start/end timings while
 * automatically rippling adjacent scene boundaries so the timeline remains contiguous.
 */
export function applyDirectorsCutEdit(
  scenes: StoryboardScene[],
  sceneId: string,
  patch: Partial<
    Pick<
      StoryboardScene,
      | 'title'
      | 'visualPrompt'
      | 'googleFlowPrompt'
      | 'cameraAngle'
      | 'cameraMovement'
      | 'lighting'
      | 'transition'
      | 'startTimeSec'
      | 'endTimeSec'
      | 'symbolismMode'
      | 'symbolismVisualMotif'
      | 'animationPreset'
    >
  >,
  directorStyle: DirectorStyle = 'Story-based music video'
): StoryboardScene[] {
  const targetIdx = scenes.findIndex((s) => s.id === sceneId);
  if (targetIdx === -1) return scenes;

  const updated = scenes.map((s) => ({ ...s }));
  const target = updated[targetIdx];

  const newStart =
    typeof patch.startTimeSec === 'number'
      ? Math.max(0, Number(patch.startTimeSec.toFixed(1)))
      : target.startTimeSec;
  const newEnd =
    typeof patch.endTimeSec === 'number'
      ? Math.max(newStart + 2, Number(patch.endTimeSec.toFixed(1)))
      : Math.max(newStart + 2, target.endTimeSec);

  target.startTimeSec = newStart;
  target.endTimeSec = newEnd;
  target.durationSec = Number((newEnd - newStart).toFixed(1));

  if (patch.title !== undefined) target.title = patch.title;
  if (patch.cameraAngle !== undefined) target.cameraAngle = patch.cameraAngle;
  if (patch.cameraMovement !== undefined) target.cameraMovement = patch.cameraMovement;
  if (patch.lighting !== undefined) target.lighting = patch.lighting;
  if (patch.transition !== undefined) target.transition = patch.transition;
  if (patch.symbolismMode !== undefined) target.symbolismMode = patch.symbolismMode;
  if (patch.symbolismVisualMotif !== undefined)
    target.symbolismVisualMotif = patch.symbolismVisualMotif;
  if (patch.animationPreset !== undefined) target.animationPreset = patch.animationPreset;

  if (patch.visualPrompt !== undefined) {
    target.visualPrompt = patch.visualPrompt;
  } else if (
    patch.cameraAngle !== undefined ||
    patch.cameraMovement !== undefined ||
    patch.lighting !== undefined ||
    patch.transition !== undefined
  ) {
    target.visualPrompt = `${target.section} (${formatTimecode(target.startTimeSec)}–${formatTimecode(
      target.endTimeSec
    )}): ${target.environment}, ${target.lighting}, ${target.cameraAngle}, ${
      target.cameraMovement
    } | Transition: ${target.transition} | Lyric Symbolism (${target.symbolismMode}): ${
      target.symbolismVisualMotif
    }`;
  }

  if (patch.googleFlowPrompt !== undefined) {
    target.googleFlowPrompt = patch.googleFlowPrompt;
  } else {
    target.googleFlowPrompt = `${directorStyle}. ${target.visualPrompt}. Camera: ${target.cameraAngle} with ${target.cameraMovement}. Transition: ${target.transition} (${target.durationSec}s clip).`;
  }

  if (targetIdx > 0 && updated[targetIdx - 1].endTimeSec !== target.startTimeSec) {
    const prev = updated[targetIdx - 1];
    prev.endTimeSec = target.startTimeSec;
    prev.durationSec = Math.max(1, Number((prev.endTimeSec - prev.startTimeSec).toFixed(1)));
  }

  if (targetIdx < updated.length - 1 && updated[targetIdx + 1].startTimeSec !== target.endTimeSec) {
    const next = updated[targetIdx + 1];
    next.startTimeSec = target.endTimeSec;
    if (next.endTimeSec <= next.startTimeSec) {
      next.endTimeSec = next.startTimeSec + 5;
    }
    next.durationSec = Math.max(1, Number((next.endTimeSec - next.startTimeSec).toFixed(1)));
  }

  return updated;
}

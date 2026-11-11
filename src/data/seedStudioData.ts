import {
  AudioTrackData,
  CharacterProfileItem,
  FlowAndProviderSettings,
  MusicVideoProject,
} from '../types/studio';
import {
  analyzeLyricsForVisualSymbolism,
  generateBeatGrid,
  generateFullLengthStoryboard,
  syncLyricsToTimeline,
} from '../utils/studioEngine';

export const STUDIO_ASSET_IMAGES = {
  heroStudio: '/src/assets/images/studio_hero_backdrop_1794400139855.jpg',
  charAria: '/src/assets/images/char_aria_vance_1794400140159.jpg',
  charKael: '/src/assets/images/char_kael_drifter_1794400143673.jpg',
  sceneIntro: '/src/assets/images/scene_neon_rain_intro_1794400142711.jpg',
  sceneChorus: '/src/assets/images/scene_astral_chorus_1794400144757.jpg',
};

export const INITIAL_CHARACTERS: CharacterProfileItem[] = [
  {
    id: 'char_aria_vance',
    ownerId: 'system_template',
    name: 'Aria Vance',
    role: 'Lead Synth-Pop Vocalist',
    appearancePrompt:
      'Female vocalist in her mid-20s with sharp expressive eyes, high cheekbones, cinematic studio rim lighting',
    wardrobeLock: 'Tailored obsidian trench coat with brushed silver collar trim and dark knit top',
    hairstyleLock: 'Platinum silver asymmetrical bob haircut',
    referenceImageUrl: STUDIO_ASSET_IMAGES.charAria,
    frontViewNote: 'Direct eye contact, neutral expression, three-point studio key light',
    sideViewNote: 'Clean jawline silhouette with structured silver collar detail visible',
    backViewNote: 'Full-length obsidian trench coat silhouette facing metropolitan skyline',
    consistencySeed: 408129,
  },
  {
    id: 'char_kael_drifter',
    ownerId: 'system_template',
    name: 'Kael Drifter',
    role: 'Midnight Lead Guitarist',
    appearancePrompt:
      'Male indie-rock guitarist with tousled dark hair, subtle beard stubble, warm tungsten key light',
    wardrobeLock: 'Charcoal wool overcoat over vintage dark graphic tee, holding sunburst Les Paul guitar',
    hairstyleLock: 'Medium-length wavy dark brown hair',
    referenceImageUrl: STUDIO_ASSET_IMAGES.charKael,
    frontViewNote: 'Holding vintage sunburst electric guitar at 45-degree angle',
    sideViewNote: 'Profile shot strumming under warm amber streetlamp glow',
    backViewNote: 'Walking down rain-slicked alley with guitar slung over shoulder',
    consistencySeed: 892341,
  },
];

export const DEFAULT_SONG_LYRICS = `Neon rain falls across the midnight glass
We chase the echoes of a yesterday that moved too fast
A shattered mirror splits the city into golden threads
While every unspoken word burns inside our heads
Hold my shadow where the bioluminescent rivers meet
Feel the electric pulse rising underneath our feet
From the ashes of the clockwork night a new star wakes
We are the light that shines through every heart that breaks`;

export const PRESET_STUDIO_TRACKS: AudioTrackData[] = [
  {
    id: 'demo_track_midnight_neon',
    projectId: 'demo_sandbox_project',
    title: 'Midnight Neon Echoes (Demo Sandbox Track)',
    artist: 'Aria Vance feat. Kael',
    durationSec: 210,
    bpm: 124,
    musicalKey: 'C Minor',
    mood: 'Melancholic & Euphoric Synthwave',
    isSynthesizedStudioTrack: true,
    trimStartSec: 0,
    trimEndSec: 210,
    fadeInSec: 3,
    fadeOutSec: 5,
    beatTimestampsSec: generateBeatGrid(124, 210),
    waveformPeaks: Array.from({ length: 80 }, (_, i) =>
      Number((0.28 + 0.65 * Math.abs(Math.sin(i * 0.37) * Math.cos(i * 0.19))).toFixed(2))
    ),
  },
];

export const INITIAL_FLOW_SETTINGS: FlowAndProviderSettings = {
  flowConnected: false,
  connectedGoogleEmail: 'Mq5023789@gmail.com',
  flowSubscriptionStatus: 'not_integrated_no_public_api',
  flowCreditsSelfReported: 1000,
  flowCreditsConsumedSession: 0,
  preferredProvider: 'procedural_cinema_priority_3',
  veoApiEnabled: false,
  apiFallbackEnabled: false,
  separateBillingWarningEnabled: true,
  explicitApiConsentPerAction: true,
};

/**
 * Creates a 100% clean, empty production project with NO demo audio, NO demo lyrics,
 * NO demo scenes, and NO hardcoded duration.
 * Duration and storyboard are populated ONLY when the user uploads a real audio file
 * and clicks Analyze Song.
 */
export function createEmptyProductionProject(params?: {
  id?: string;
  ownerId?: string;
  title?: string;
}): MusicVideoProject {
  const uniqueId =
    params?.id ||
    `proj_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
  const ownerId = params?.ownerId || 'local_studio_user';

  const emptyAudioTrack: AudioTrackData = {
    id: '',
    projectId: uniqueId,
    ownerId,
    fileName: '',
    title: 'No Audio File Uploaded',
    artist: '',
    durationSec: 0,
    bpm: 0,
    musicalKey: 'Pending Analysis',
    mood: 'Pending Audio Upload',
    audioUrl: undefined,
    fileSizeBytes: 0,
    codecName: undefined,
    format: undefined,
    sampleRate: undefined,
    channels: undefined,
    isSynthesizedStudioTrack: false,
    trimStartSec: 0,
    trimEndSec: 0,
    fadeInSec: 2,
    fadeOutSec: 3,
    beatTimestampsSec: [],
    waveformPeaks: [],
    detectedSections: [],
  };

  return {
    id: uniqueId,
    ownerId,
    isDemoProject: false,
    title: params?.title || 'Untitled Music Video Project',
    description: '',
    directorStyle: 'Story-based music video',
    aspectRatio: '16:9',
    resolution: '1080p',
    durationSec: 0,
    bpm: 0,
    musicalKey: 'Pending Analysis',
    mood: 'Pending Audio Upload',
    lyricsText: '',
    providerUsed: 'procedural_cinema_priority_3',
    status: 'draft',
    sceneCount: 0,
    completedScenes: 0,
    scenes: [],
    lyricSymbolism: [],
    subtitles: [],
    selectedCharacterIds: [],
    audioTrack: emptyAudioTrack,
    renderedMasterMp4Url: undefined,
    renderedMasterDownloadUrl: undefined,
    exportHistory: [],
    updatedAtIso: new Date().toISOString(),
  };
}

/**
 * Isolated Development Demo Sandbox Project — only visible when Development Demo Mode
 * is explicitly toggled ON. Never mixed into production projects.
 */
export function createDemoSandboxProject(): MusicVideoProject {
  const demoId = 'demo_sandbox_project';
  const defaultTrack = PRESET_STUDIO_TRACKS[0];
  const symbolism = analyzeLyricsForVisualSymbolism(
    DEFAULT_SONG_LYRICS,
    defaultTrack.durationSec,
    'Story-based music video',
    'metaphorical',
    demoId
  );
  const scenes = generateFullLengthStoryboard({
    projectId: demoId,
    durationSec: defaultTrack.durationSec,
    directorStyle: 'Story-based music video',
    lyricsText: DEFAULT_SONG_LYRICS,
    characters: INITIAL_CHARACTERS,
    symbolismItems: symbolism,
    providerSource: 'procedural_cinema_priority_3',
    defaultBackdropUrls: [
      STUDIO_ASSET_IMAGES.sceneIntro,
      STUDIO_ASSET_IMAGES.charAria,
      STUDIO_ASSET_IMAGES.sceneChorus,
      STUDIO_ASSET_IMAGES.charKael,
    ],
    initialSceneStatus: 'QUEUED',
  });
  const subtitles = syncLyricsToTimeline(
    DEFAULT_SONG_LYRICS,
    defaultTrack.durationSec,
    '16:9',
    demoId
  );

  return {
    id: demoId,
    ownerId: 'demo_sandbox_owner',
    isDemoProject: true,
    title: '[DEV DEMO SANDBOX] Midnight Neon Echoes',
    description:
      'Isolated Development Demo Sandbox project. Completely separated from production user projects.',
    directorStyle: 'Story-based music video',
    aspectRatio: '16:9',
    resolution: '1080p',
    durationSec: defaultTrack.durationSec,
    bpm: defaultTrack.bpm,
    musicalKey: defaultTrack.musicalKey,
    mood: defaultTrack.mood,
    lyricsText: DEFAULT_SONG_LYRICS,
    providerUsed: 'procedural_cinema_priority_3',
    status: 'storyboard_ready',
    sceneCount: scenes.length,
    completedScenes: 0,
    scenes,
    lyricSymbolism: symbolism,
    subtitles,
    selectedCharacterIds: INITIAL_CHARACTERS.map((c) => c.id),
    audioTrack: defaultTrack,
    exportHistory: [],
    updatedAtIso: new Date().toISOString(),
  };
}

// Keep alias for unit test compatibility
export const createInitialStudioProject = createDemoSandboxProject;

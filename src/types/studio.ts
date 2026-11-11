export type ProviderPriority =
  | 'google_flow_priority_1'
  | 'google_veo_api_priority_2'
  | 'procedural_cinema_priority_3';

export type AspectRatioOption = '16:9' | '9:16' | '1:1' | '4:5';
export type ResolutionOption = '720p' | '1080p' | '4K';
export type FrameRateOption = 24 | 30 | 60;
export type AudioBitrateOption = '128k' | '192k' | '320k';

export type DirectorStyle =
  | 'Romantic music video'
  | 'Sad emotional music video'
  | 'Breakup music video'
  | 'Rap music video'
  | 'Cinematic Bollywood style'
  | 'Anime music video'
  | '3D animated music video'
  | 'Realistic music video'
  | 'Fantasy music video'
  | 'Action music video'
  | 'Travel music video'
  | 'Story-based music video';

export type PromptVisualStyle =
  | 'Cinematic Realism'
  | 'Photorealistic'
  | 'Bollywood Music Video'
  | 'Anime'
  | '3D Animation'
  | '2D Animation'
  | 'Dreamlike Fantasy'
  | 'Dark Cinematic'
  | 'Vintage Film'
  | 'Documentary'
  | 'Music Video Aesthetic'
  | 'Surreal Art';

export type PromptCameraControl =
  | 'Close-up'
  | 'Extreme Close-up'
  | 'Medium Shot'
  | 'Wide Shot'
  | 'Establishing Shot'
  | 'Over-the-Shoulder'
  | 'Drone Shot'
  | 'Tracking Shot'
  | 'Dolly In'
  | 'Dolly Out'
  | 'Pan Left / Right'
  | 'Tilt Up / Down'
  | 'Handheld Camera'
  | 'Slow Motion';

export type PromptLightingOption =
  | 'Golden Hour'
  | 'Blue Hour'
  | 'Moonlight'
  | 'Neon Lighting'
  | 'Soft Natural Light'
  | 'Cinematic Backlight'
  | 'Studio Lighting'
  | 'Dramatic Shadows'
  | 'Volumetric Lighting';

export type PromptEnvironmentOption =
  | 'Rooftop'
  | 'Rainy Street'
  | 'Bedroom'
  | 'Beach'
  | 'Mountains'
  | 'Forest'
  | 'City at Night'
  | 'Empty Highway'
  | 'Wedding Venue'
  | 'Cafe'
  | 'Futuristic City'
  | 'Fantasy World';

export type PromptMoodOption =
  | 'Romantic'
  | 'Sad'
  | 'Emotional'
  | 'Lonely'
  | 'Heartbroken'
  | 'Mysterious'
  | 'Hopeful'
  | 'Nostalgic'
  | 'Dark'
  | 'Energetic'
  | 'Inspirational';

export interface PromptStudioFields {
  mainSceneDescription: string;
  characterDescription: string;
  characterAction: string;
  facialExpression: string;
  clothing: string;
  environment: string;
  cameraMovement: string;
  lighting: string;
  colorGrading: string;
  visualEffects: string;
  sceneTransition: string;
  negativePrompt: string;
  additionalInstructions: string;
}

export interface PromptStudioItem {
  id: string;
  projectId: string;
  sceneId?: string;
  title: string;
  visualStyles: PromptVisualStyle[];
  cameraControls: PromptCameraControl[];
  lightingOptions: PromptLightingOption[];
  environments: PromptEnvironmentOption[];
  moods: PromptMoodOption[];
  fields: PromptStudioFields;
  compiledMasterPrompt: string;
  isFavorite: boolean;
  createdAtIso: string;
}

export type AnimationPreset =
  | 'nebula_swirl'
  | 'rain_neon_streaks'
  | 'shattered_prism'
  | 'ember_ascension'
  | 'chrono_ripples'
  | 'aurora_pulse'
  | 'cyber_grid_flight'
  | 'floating_lanterns';

export type SymbolismInterpretationMode = 'metaphorical' | 'literal' | 'hybrid';

export interface LyricSymbolismItem {
  id: string;
  projectId?: string;
  lineIndex: number;
  startTimeSec: number;
  endTimeSec: number;
  lyricPhrase: string;
  section: string;
  literalMeaning: string;
  metaphoricalMeaning: string;
  visualElement: string;
  literalVisualElement: string;
  animationPreset: AnimationPreset;
  activeMode: SymbolismInterpretationMode;
  primaryColorHex: string;
  secondaryColorHex: string;
  intensity: number; // 0.1 to 1.0
  directorPromptInjection: string;
}

export interface CharacterProfileItem {
  id: string;
  ownerId: string;
  projectId?: string;
  name: string;
  age?: string;
  role: string;
  appearancePrompt: string;
  facialExpression?: string;
  wardrobeLock: string;
  hairstyleLock: string;
  referenceImageUrl: string;
  frontViewNote: string;
  sideViewNote: string;
  backViewNote: string;
  consistencySeed: number;
  referenceSheetGenerated?: boolean;
}

export type TransitionType =
  | 'Cross Dissolve'
  | 'Beat Flash Cut'
  | 'Anamorphic Whip Pan'
  | 'Dolly Zoom In'
  | 'Glitch Sync'
  | 'Fade to Black';

export type SceneGenerationStatus =
  | 'QUEUED'
  | 'PROCESSING'
  | 'COMPLETED'
  | 'FAILED'
  | 'CANCELLED'
  | 'ready'
  | 'pending'
  | 'processing'
  | 'generating'
  | 'completed'
  | 'failed';

export interface StoryboardScene {
  id: string;
  projectId: string;
  storyboardId?: string;
  index: number;
  section:
    | 'Intro'
    | 'Verse 1'
    | 'Chorus 1'
    | 'Verse 2'
    | 'Chorus 2'
    | 'Bridge'
    | 'Final Chorus'
    | 'Outro'
    | string;
  title: string;
  narrativeArcBeat?: string;
  startTimeSec: number;
  endTimeSec: number;
  durationSec: number;
  lyricExcerpt: string;
  showLyricsInScene?: boolean;
  visualPrompt: string;
  googleFlowPrompt: string;
  cameraAngle: string;
  cameraMovement: string;
  lighting: string;
  environment: string;
  transition: TransitionType;
  characterIds: string[];
  linkedSymbolismId?: string;
  symbolismMode: SymbolismInterpretationMode;
  symbolismVisualMotif: string;
  animationPreset: AnimationPreset;
  status: SceneGenerationStatus;
  backdropImageUrl: string;
  generatedVideoUrl?: string;
  lastJobId?: string;
  errorMessage?: string;
  providerSource: ProviderPriority;
  brightness: number; // 50 to 150
  contrast: number;   // 50 to 150
  saturation: number; // 0 to 200
  filmGrain: number;  // 0 to 100
  temperature?: number; // -50 (cool) to +50 (warm)
  exposure?: number;    // -50 to +50
  vignette?: number;    // 0 to 100
  overlayTrackLabel?: string;
  promptStudioItem?: PromptStudioItem;
}

export type LyricsDisplayMode =
  | 'none'
  | 'full'
  | 'selected'
  | 'karaoke'
  | 'subtitle'
  | 'minimal';

export interface LyricsDisplaySettings {
  mode: LyricsDisplayMode;
  fontFamily: 'Bricolage Grotesque' | 'Plus Jakarta Sans' | 'JetBrains Mono';
  fontSizePx: number;
  position: 'bottom' | 'center' | 'top';
  textColor: string;
  outlineColor: string;
  shadowEnabled: boolean;
  animationStyle: 'karaoke_glow' | 'cinematic_fade' | 'kinetic_pop' | 'minimal_editorial';
  animationSpeed: number; // 0.5x to 2.0x
}

export interface ColorGradingSettings {
  temperature: number; // -50 to +50
  contrast: number;    // 50 to 150
  brightness: number;  // 50 to 150
  saturation: number;  // 0 to 200
  exposure: number;    // -50 to +50
  filmGrain: number;   // 0 to 100
  vignette: number;    // 0 to 100
  motionBlur: number;  // 0 to 100
  glow: number;        // 0 to 100
  lensFlare: number;   // 0 to 100
  depthOfField: number;// 0 to 100
  fadeInSec: number;
  fadeOutSec: number;
}

export interface ExportStudioConfig {
  resolution: ResolutionOption;
  aspectRatio: AspectRatioOption;
  frameRate: FrameRateOption;
  audioBitrate: AudioBitrateOption;
  embedSubtitles: boolean;
  cleanVideoWithoutLyrics: boolean;
  titleSequenceText: string;
  outroSequenceText: string;
}

export interface SubtitleCue {
  id: string;
  projectId?: string;
  index: number;
  startTimeSec: number;
  endTimeSec: number;
  text: string;
  words: { word: string; startSec: number; endSec: number }[];
  animationStyle: 'karaoke_glow' | 'cinematic_fade' | 'kinetic_pop' | 'minimal_editorial';
  fontFamily: 'Bricolage Grotesque' | 'Plus Jakarta Sans' | 'JetBrains Mono';
  primaryColor: string;
  position: 'bottom' | 'center' | 'top';
}

export interface DetectedSongSection {
  section: string;
  startTimeSec: number;
  endTimeSec: number;
  durationSec: number;
  energyLevel: string;
  rmsNormalized: number;
}

export interface AudioTrackData {
  id: string;
  projectId?: string;
  ownerId?: string;
  fileName?: string;
  title: string;
  artist: string;
  durationSec: number;
  bpm: number;
  musicalKey: string;
  mood: string;
  energyScore?: number;
  audioUrl?: string;
  fileSizeBytes?: number;
  codecName?: string;
  format?: string;
  sampleRate?: number;
  channels?: number;
  isSynthesizedStudioTrack: boolean;
  trimStartSec: number;
  trimEndSec: number;
  fadeInSec: number;
  fadeOutSec: number;
  beatTimestampsSec: number[];
  waveformPeaks: number[];
  detectedSections?: DetectedSongSection[];
  uploadedAtIso?: string;
}

export interface FinalExportRecord {
  id: string;
  projectId: string;
  jobId: string;
  title: string;
  resolution: ResolutionOption;
  aspectRatio: AspectRatioOption;
  frameRate?: FrameRateOption;
  audioBitrate?: AudioBitrateOption;
  cleanVideoWithoutLyrics?: boolean;
  durationSec: number;
  videoUrl: string;
  downloadUrl: string;
  fileSizeBytes?: number;
  createdAtIso: string;
}

export interface MusicVideoProject {
  id: string;
  ownerId: string;
  isDemoProject?: boolean;
  title: string;
  description: string;
  directorStyle: DirectorStyle;
  aspectRatio: AspectRatioOption;
  resolution: ResolutionOption;
  durationSec: number;
  bpm: number;
  musicalKey: string;
  mood: string;
  lyricsText: string;
  providerUsed: ProviderPriority;
  status:
    | 'draft'
    | 'audio_uploaded'
    | 'analyzing'
    | 'storyboard_ready'
    | 'generating_clips'
    | 'editing'
    | 'exported'
    | 'failed'
    | 'archived';
  sceneCount: number;
  completedScenes: number;
  scenes: StoryboardScene[];
  lyricSymbolism: LyricSymbolismItem[];
  subtitles: SubtitleCue[];
  selectedCharacterIds: string[];
  audioTrack: AudioTrackData;
  promptLibrary?: PromptStudioItem[];
  lyricsDisplaySettings?: LyricsDisplaySettings;
  colorGradingSettings?: ColorGradingSettings;
  exportConfig?: ExportStudioConfig;
  autoBeatSync?: boolean;
  titleSequenceText?: string;
  outroSequenceText?: string;
  renderedMasterMp4Url?: string;
  renderedMasterDownloadUrl?: string;
  exportHistory?: FinalExportRecord[];
  lastAnalysisEngine?: 'live_gemini_api' | 'signal_and_lyric_analyzer';
  updatedAtIso: string;
}

export interface FlowAndProviderSettings {
  flowConnected: boolean;
  connectedGoogleEmail: string;
  flowSubscriptionStatus: 'not_integrated_no_public_api' | 'active_verified_user' | 'unverified' | 'disconnected';
  flowCreditsSelfReported: number;
  flowCreditsConsumedSession: number;
  preferredProvider: ProviderPriority;
  veoApiEnabled?: boolean;
  apiFallbackEnabled: boolean;
  separateBillingWarningEnabled: boolean;
  explicitApiConsentPerAction: boolean;
}

export interface GenerationCostEstimate {
  provider: ProviderPriority;
  providerLabel: string;
  integrationStatus: 'NOT_INTEGRATED' | 'REQUIRES_ADMIN_AND_KEY' | 'READY_PROCEDURAL';
  appCreditsRequired: number;
  flowCreditsEstimated: number;
  separateApiBilled: boolean;
  requiresExplicitConsent: boolean;
  warningMessage: string | null;
}

export type StudioJobStatus =
  | 'QUEUED'
  | 'PROCESSING'
  | 'COMPLETED'
  | 'FAILED'
  | 'CANCELLED'
  | 'pending'
  | 'processing'
  | 'completed'
  | 'failed';

export interface StudioBackgroundJob {
  id: string;
  projectId: string;
  sceneId?: string;
  sceneIndex?: number;
  type: 'scene_video' | 'master_mp4_render';
  title: string;
  provider: ProviderPriority | 'ffmpeg_cinema';
  status: StudioJobStatus;
  progress: number;
  stepMessage: string;
  outputUrl?: string;
  downloadUrl?: string;
  errorMessage?: string;
  retryCount: number;
  createdAtIso: string;
  updatedAtIso: string;
}

export interface StudioUserAccount {
  uid: string;
  email: string;
  displayName: string;
  photoURL: string;
  role: 'admin' | 'user';
  plan: 'free' | 'creator' | 'pro' | 'studio';
  appCredits: number;
  flowConnected: boolean;
  lastActiveIso: string;
}

export interface AdminOverviewData {
  users: StudioUserAccount[];
  projects: MusicVideoProject[];
  jobs: StudioBackgroundJob[];
  apiTelemetry: {
    geminiCalls: number;
    veoCalls: number;
    imageCalls: number;
    ttsCalls: number;
    transcribeCalls: number;
    ffmpegSceneRenders: number;
    ffmpegMasterRenders: number;
    totalErrors: number;
  };
  storageUsage: {
    uploadsBytes: number;
    clipsBytes: number;
    rendersBytes: number;
    dbBytes: number;
    totalBytes: number;
    fileCount: number;
  };
  errorLogs: {
    id: string;
    timestamp: string;
    endpoint: string;
    message: string;
  }[];
  systemSettings: FlowAndProviderSettings & {
    announcement: string;
    maxSongDurationSec: number;
    geminiConfigured: boolean;
  };
}

export type StudioNavTab =
  | 'dashboard'
  | 'create'
  | 'prompts'
  | 'storyboard'
  | 'editor'
  | 'characters'
  | 'music'
  | 'tools'
  | 'projects'
  | 'subscription'
  | 'admin';

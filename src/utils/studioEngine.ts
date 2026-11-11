import {
  AnimationPreset,
  AspectRatioOption,
  CharacterProfileItem,
  ColorGradingSettings,
  DetectedSongSection,
  DirectorStyle,
  ExportStudioConfig,
  GenerationCostEstimate,
  LyricsDisplaySettings,
  LyricSymbolismItem,
  PromptCameraControl,
  PromptEnvironmentOption,
  PromptLightingOption,
  PromptMoodOption,
  PromptStudioFields,
  PromptStudioItem,
  PromptVisualStyle,
  ProviderPriority,
  StoryboardScene,
  SubtitleCue,
  SymbolismInterpretationMode,
  TransitionType,
} from '../types/studio';

export const PROMPT_VISUAL_STYLES: PromptVisualStyle[] = [
  'Cinematic Realism',
  'Photorealistic',
  'Bollywood Music Video',
  'Anime',
  '3D Animation',
  '2D Animation',
  'Dreamlike Fantasy',
  'Dark Cinematic',
  'Vintage Film',
  'Documentary',
  'Music Video Aesthetic',
  'Surreal Art',
];

export const PROMPT_CAMERA_CONTROLS: PromptCameraControl[] = [
  'Close-up',
  'Extreme Close-up',
  'Medium Shot',
  'Wide Shot',
  'Establishing Shot',
  'Over-the-Shoulder',
  'Drone Shot',
  'Tracking Shot',
  'Dolly In',
  'Dolly Out',
  'Pan Left / Right',
  'Tilt Up / Down',
  'Handheld Camera',
  'Slow Motion',
];

export const PROMPT_LIGHTING_OPTIONS: PromptLightingOption[] = [
  'Golden Hour',
  'Blue Hour',
  'Moonlight',
  'Neon Lighting',
  'Soft Natural Light',
  'Cinematic Backlight',
  'Studio Lighting',
  'Dramatic Shadows',
  'Volumetric Lighting',
];

export const PROMPT_ENVIRONMENT_OPTIONS: PromptEnvironmentOption[] = [
  'Rooftop',
  'Rainy Street',
  'Bedroom',
  'Beach',
  'Mountains',
  'Forest',
  'City at Night',
  'Empty Highway',
  'Wedding Venue',
  'Cafe',
  'Futuristic City',
  'Fantasy World',
];

export const PROMPT_MOOD_OPTIONS: PromptMoodOption[] = [
  'Romantic',
  'Sad',
  'Emotional',
  'Lonely',
  'Heartbroken',
  'Mysterious',
  'Hopeful',
  'Nostalgic',
  'Dark',
  'Energetic',
  'Inspirational',
];

export const DEFAULT_LYRICS_DISPLAY_SETTINGS: LyricsDisplaySettings = {
  mode: 'none',
  fontFamily: 'Bricolage Grotesque',
  fontSizePx: 26,
  position: 'bottom',
  textColor: '#F8FAFC',
  outlineColor: '#090D16',
  shadowEnabled: true,
  animationStyle: 'cinematic_fade',
  animationSpeed: 1.0,
};

export const DEFAULT_COLOR_GRADING_SETTINGS: ColorGradingSettings = {
  temperature: 0,
  contrast: 108,
  brightness: 100,
  saturation: 112,
  exposure: 0,
  filmGrain: 16,
  vignette: 28,
  motionBlur: 15,
  glow: 22,
  lensFlare: 18,
  depthOfField: 40,
  fadeInSec: 1.5,
  fadeOutSec: 2.0,
};

export const DEFAULT_EXPORT_STUDIO_CONFIG: ExportStudioConfig = {
  resolution: '1080p',
  aspectRatio: '16:9',
  frameRate: 24,
  audioBitrate: '320k',
  embedSubtitles: false,
  cleanVideoWithoutLyrics: true,
  titleSequenceText: '',
  outroSequenceText: '',
};

export const DIRECTOR_STYLE_CONFIGS: Record<
  DirectorStyle,
  {
    cameraDefault: string;
    movementDefault: string;
    lightingDefault: string;
    environmentDefault: string;
    transitionDefault: TransitionType;
    colorPaletteHex: [string, string];
    storyArcScenes: {
      narrativeBeat: string;
      actionDescription: string;
      environment: PromptEnvironmentOption;
      lighting: PromptLightingOption;
      cameraControl: PromptCameraControl;
      mood: PromptMoodOption;
    }[];
  }
> = {
  'Romantic music video': {
    cameraDefault: '50mm Anamorphic Close-Up',
    movementDefault: 'Slow gimbal orbital drift',
    lightingDefault: 'Warm golden hour & tungsten bokeh rim light',
    environmentDefault: 'Rain-kissed Parisian rooftop terrace at twilight',
    transitionDefault: 'Cross Dissolve',
    colorPaletteHex: ['#F59E0B', '#EC4899'],
    storyArcScenes: [
      {
        narrativeBeat: 'Lonely person walking on a rainy street under warm cafe reflections',
        actionDescription: 'Protagonist walks slowly along glistening cobblestones, coat collar raised as raindrops catch amber streetlights',
        environment: 'Rainy Street',
        lighting: 'Blue Hour',
        cameraControl: 'Tracking Shot',
        mood: 'Lonely',
      },
      {
        narrativeBeat: 'Romantic memory flashback in golden-hour sunlight',
        actionDescription: 'Two lovers laughing and spinning together in warm sunlit haze with shallow depth-of-field lens flare',
        environment: 'Beach',
        lighting: 'Golden Hour',
        cameraControl: 'Slow Motion',
        mood: 'Romantic',
      },
      {
        narrativeBeat: 'Close-up looking at a cherished photograph in a quiet room',
        actionDescription: 'Intimate macro-to-close-up shot of hands holding a vintage Polaroid photograph as warm candlelight flickers',
        environment: 'Bedroom',
        lighting: 'Soft Natural Light',
        cameraControl: 'Close-up',
        mood: 'Nostalgic',
      },
      {
        narrativeBeat: 'Window silhouette during midnight rainfall',
        actionDescription: 'Subject leans forehead against rain-streaked glass, city bokeh lights shimmering across their face',
        environment: 'Cafe',
        lighting: 'Neon Lighting',
        cameraControl: 'Extreme Close-up',
        mood: 'Emotional',
      },
      {
        narrativeBeat: 'Wide shot on rooftop under dramatic twilight clouds',
        actionDescription: 'Sweeping aerial crane orbit around the vocalist standing on a high metropolitan rooftop as wind moves their coat',
        environment: 'Rooftop',
        lighting: 'Volumetric Lighting',
        cameraControl: 'Drone Shot',
        mood: 'Hopeful',
      },
      {
        narrativeBeat: 'Emotional camera pullback into the glowing horizon',
        actionDescription: 'Slow dolly pullback revealing two silhouettes reuniting beneath streetlamps as rain subsides into mist',
        environment: 'City at Night',
        lighting: 'Cinematic Backlight',
        cameraControl: 'Dolly Out',
        mood: 'Romantic',
      },
    ],
  },
  'Sad emotional music video': {
    cameraDefault: '35mm Shallow Depth Medium Shot',
    movementDefault: 'Slow pull-back dolly track',
    lightingDefault: 'Desaturated overcast blue & solitary window key light',
    environmentDefault: 'Misty coastal highway and empty brutalist apartment',
    transitionDefault: 'Fade to Black',
    colorPaletteHex: ['#38BDF8', '#6366F1'],
    storyArcScenes: [
      {
        narrativeBeat: 'Lonely person walking on a rainy street at dusk',
        actionDescription: 'Solitary figure walking down a wet asphalt street, reflections of pale blue neon rippling in puddles',
        environment: 'Rainy Street',
        lighting: 'Blue Hour',
        cameraControl: 'Tracking Shot',
        mood: 'Lonely',
      },
      {
        narrativeBeat: 'Romantic memory flashback fading like a dream',
        actionDescription: 'Soft-focus flashback of a warm embrace in a sunlit room, edges dissolving into cold blue mist',
        environment: 'Bedroom',
        lighting: 'Golden Hour',
        cameraControl: 'Handheld Camera',
        mood: 'Nostalgic',
      },
      {
        narrativeBeat: 'Close-up looking at photograph on an empty table',
        actionDescription: 'Tight anamorphic close-up of eyes glistening with emotion while looking at a faded photograph',
        environment: 'Bedroom',
        lighting: 'Soft Natural Light',
        cameraControl: 'Close-up',
        mood: 'Sad',
      },
      {
        narrativeBeat: 'Window reflection during heavy rainfall',
        actionDescription: 'Raindrops racing down a tall apartment window, superimposing storm clouds over the protagonist’s face',
        environment: 'Bedroom',
        lighting: 'Dramatic Shadows',
        cameraControl: 'Extreme Close-up',
        mood: 'Heartbroken',
      },
      {
        narrativeBeat: 'Wide shot on rooftop under cloudy sky',
        actionDescription: 'Expansive wide establishing frame of the protagonist standing at the edge of a wind-swept rooftop under brooding clouds',
        environment: 'Rooftop',
        lighting: 'Volumetric Lighting',
        cameraControl: 'Wide Shot',
        mood: 'Emotional',
      },
      {
        narrativeBeat: 'Emotional camera pullback along an empty highway',
        actionDescription: 'Slow receding dolly-out shot leaving the solitary figure framed against dawn mist on an empty coastal road',
        environment: 'Empty Highway',
        lighting: 'Moonlight',
        cameraControl: 'Dolly Out',
        mood: 'Hopeful',
      },
    ],
  },
  'Breakup music video': {
    cameraDefault: '85mm Split-Diopter Portrait',
    movementDefault: 'Handheld emotional breathing framing',
    lightingDefault: 'High-contrast neon sodium vapor & cold slate shadows',
    environmentDefault: 'Midnight diner booth and rain-streaked glass',
    transitionDefault: 'Cross Dissolve',
    colorPaletteHex: ['#FB7185', '#3B82F6'],
    storyArcScenes: [
      {
        narrativeBeat: 'Unanswered call in a rain-drenched city street',
        actionDescription: 'Protagonist stands alone under a flickering streetlamp in pouring rain holding a glowing phone screen',
        environment: 'Rainy Street',
        lighting: 'Neon Lighting',
        cameraControl: 'Medium Shot',
        mood: 'Heartbroken',
      },
      {
        narrativeBeat: 'Bittersweet flashback in a warm cafe booth',
        actionDescription: 'Memory of shared coffee and quiet laughter across a wooden cafe table, shifting to an empty chair',
        environment: 'Cafe',
        lighting: 'Golden Hour',
        cameraControl: 'Over-the-Shoulder',
        mood: 'Nostalgic',
      },
      {
        narrativeBeat: 'Close-up of hands letting go of a keepsake photograph',
        actionDescription: 'Extreme close-up of trembling fingers setting down a framed photograph beside a rain-splattered window',
        environment: 'Bedroom',
        lighting: 'Dramatic Shadows',
        cameraControl: 'Extreme Close-up',
        mood: 'Sad',
      },
      {
        narrativeBeat: 'Driving alone down an empty midnight highway',
        actionDescription: 'Interior-to-exterior tracking shot of headlights cutting through fog on a deserted highway',
        environment: 'Empty Highway',
        lighting: 'Moonlight',
        cameraControl: 'Tracking Shot',
        mood: 'Lonely',
      },
      {
        narrativeBeat: 'Wide rooftop catharsis under storm clouds',
        actionDescription: 'Dramatic wide crane shot on a wet rooftop as lightning illuminates the skyline behind the singer',
        environment: 'Rooftop',
        lighting: 'Volumetric Lighting',
        cameraControl: 'Wide Shot',
        mood: 'Emotional',
      },
      {
        narrativeBeat: 'Slow camera pullback into first morning light',
        actionDescription: 'Gentle camera pullback as the protagonist walks toward the horizon under cool dawn sky',
        environment: 'City at Night',
        lighting: 'Blue Hour',
        cameraControl: 'Dolly Out',
        mood: 'Hopeful',
      },
    ],
  },
  'Rap music video': {
    cameraDefault: '16mm Ultra-Wide Low Angle',
    movementDefault: 'Dynamic whip-pan & push-in zoom synchronized to bass',
    lightingDefault: 'Strobe xenon bars & industrial crimson underglow',
    environmentDefault: 'Underground concrete vault with chrome floodlights',
    transitionDefault: 'Beat Flash Cut',
    colorPaletteHex: ['#EF4444', '#F59E0B'],
    storyArcScenes: [
      {
        narrativeBeat: 'Low-angle arrival under metropolitan neon',
        actionDescription: 'Artist steps out of a matte-black coupe onto wet asphalt surrounded by billowing steam and neon reflections',
        environment: 'City at Night',
        lighting: 'Neon Lighting',
        cameraControl: 'Establishing Shot',
        mood: 'Energetic',
      },
      {
        narrativeBeat: 'Kinetic performance in industrial strobe corridor',
        actionDescription: 'High-contrast low-angle tracking shot moving backward ahead of the performer as overhead xenon tubes pulse on beat',
        environment: 'Futuristic City',
        lighting: 'Studio Lighting',
        cameraControl: 'Tracking Shot',
        mood: 'Dark',
      },
      {
        narrativeBeat: 'Extreme close-up vocal delivery with anamorphic flare',
        actionDescription: 'Tight 16mm lens push-in capturing intense facial expression and chrome jewelry catching rim light',
        environment: 'City at Night',
        lighting: 'Cinematic Backlight',
        cameraControl: 'Extreme Close-up',
        mood: 'Energetic',
      },
      {
        narrativeBeat: 'Rooftop helipad cipher overlooking downtown skyline',
        actionDescription: '360-degree drone orbit around the artist standing on a high-rise rooftop surrounded by city lights',
        environment: 'Rooftop',
        lighting: 'Volumetric Lighting',
        cameraControl: 'Drone Shot',
        mood: 'Inspirational',
      },
      {
        narrativeBeat: 'Midnight highway pursuit convoy in slow motion',
        actionDescription: 'Russian-arm tracking shot parallel to rolling headlights through rain spray on an empty expressway',
        environment: 'Empty Highway',
        lighting: 'Dramatic Shadows',
        cameraControl: 'Slow Motion',
        mood: 'Mysterious',
      },
      {
        narrativeBeat: 'Final silhouette pullback in volumetric spotlight',
        actionDescription: 'Slow camera pullback into darkness as a single vertical beam of light silhouettes the artist',
        environment: 'Rooftop',
        lighting: 'Cinematic Backlight',
        cameraControl: 'Dolly Out',
        mood: 'Dark',
      },
    ],
  },
  'Cinematic Bollywood style': {
    cameraDefault: '40mm Panavision Wide Crane Shot',
    movementDefault: 'Sweeping technocrane arc through silk & confetti',
    lightingDefault: 'Volumetric amber festival lanterns & sapphire moonlight',
    environmentDefault: 'Grand marble courtyard reflecting thousands of diyas',
    transitionDefault: 'Anamorphic Whip Pan',
    colorPaletteHex: ['#FBBF24', '#EC4899'],
    storyArcScenes: [
      {
        narrativeBeat: 'Grand palace courtyard entrance through floating lanterns',
        actionDescription: 'Sweeping crane shot descending over marble arches and reflecting pools lit by hundreds of golden diyas',
        environment: 'Wedding Venue',
        lighting: 'Golden Hour',
        cameraControl: 'Establishing Shot',
        mood: 'Romantic',
      },
      {
        narrativeBeat: 'First glance across flowing silk drapes in slow motion',
        actionDescription: 'Slow-motion dolly push-in as crimson and gold organza curtains part in the breeze revealing the lead characters',
        environment: 'Wedding Venue',
        lighting: 'Volumetric Lighting',
        cameraControl: 'Slow Motion',
        mood: 'Emotional',
      },
      {
        narrativeBeat: 'Intimate close-up under monsoon rain and moonlight',
        actionDescription: 'Anamorphic close-up of expressive eyes and raindrops glistening on traditional jewelry under sapphire moonlight',
        environment: 'Rooftop',
        lighting: 'Moonlight',
        cameraControl: 'Close-up',
        mood: 'Romantic',
      },
      {
        narrativeBeat: 'Mountain ridge silhouette against golden sunset',
        actionDescription: 'Aerial drone orbit around the couple standing on a misty Himalayan mountain ridge at sunset',
        environment: 'Mountains',
        lighting: 'Golden Hour',
        cameraControl: 'Drone Shot',
        mood: 'Inspirational',
      },
      {
        narrativeBeat: 'Choreographed celebration amidst rising golden sparks',
        actionDescription: 'Dynamic wide tracking shot capturing synchronized movement through swirling marigold petals and warm backlights',
        environment: 'Wedding Venue',
        lighting: 'Cinematic Backlight',
        cameraControl: 'Tracking Shot',
        mood: 'Energetic',
      },
      {
        narrativeBeat: 'Epic camera pullback into starlit palace horizon',
        actionDescription: 'Majestic crane pullback revealing the illuminated palace reflected in tranquil water beneath night stars',
        environment: 'Wedding Venue',
        lighting: 'Moonlight',
        cameraControl: 'Dolly Out',
        mood: 'Hopeful',
      },
    ],
  },
  'Anime music video': {
    cameraDefault: '24mm Dynamic Anime Perspective',
    movementDefault: 'Sakuga speed-line camera tracking & sky tilt',
    lightingDefault: 'Makoto Shinkai twilight horizon glow & lens flare',
    environmentDefault: 'Shinjuku pedestrian overpass under a comet-lit sky',
    transitionDefault: 'Beat Flash Cut',
    colorPaletteHex: ['#818CF8', '#F472B6'],
    storyArcScenes: [
      {
        narrativeBeat: 'Twilight train crossing as cherry blossoms drift in wind',
        actionDescription: 'Protagonist stands at a glowing railway crossing as an express train blurs past in golden-violet twilight',
        environment: 'City at Night',
        lighting: 'Blue Hour',
        cameraControl: 'Wide Shot',
        mood: 'Nostalgic',
      },
      {
        narrativeBeat: 'Rooftop gaze toward a comet-streaked sky',
        actionDescription: 'Wind sweeps the character’s hair on a school rooftop while a luminous comet splits the purple clouds above',
        environment: 'Rooftop',
        lighting: 'Volumetric Lighting',
        cameraControl: 'Tilt Up / Down',
        mood: 'Hopeful',
      },
      {
        narrativeBeat: 'Extreme close-up of eyes reflecting starlight',
        actionDescription: 'Detailed anime macro shot of shimmering pupils reflecting falling stars and neon city lights',
        environment: 'Rooftop',
        lighting: 'Neon Lighting',
        cameraControl: 'Extreme Close-up',
        mood: 'Emotional',
      },
      {
        narrativeBeat: 'Running through rain-slicked neon alleyways',
        actionDescription: 'Dynamic sakuga tracking shot following the protagonist sprinting across glowing puddles',
        environment: 'Rainy Street',
        lighting: 'Neon Lighting',
        cameraControl: 'Tracking Shot',
        mood: 'Energetic',
      },
      {
        narrativeBeat: 'Surreal astral horizon where sea meets sky',
        actionDescription: 'Dreamlike 360-degree pan over shallow mirror-like water reflecting an infinite starry galaxy',
        environment: 'Fantasy World',
        lighting: 'Moonlight',
        cameraControl: 'Pan Left / Right',
        mood: 'Mysterious',
      },
      {
        narrativeBeat: 'Emotional pullback as two silhouettes reach across light',
        actionDescription: 'Slow camera pullback into radiant sunrise flare as two hands clasp in silhouette',
        environment: 'Beach',
        lighting: 'Golden Hour',
        cameraControl: 'Dolly Out',
        mood: 'Inspirational',
      },
    ],
  },
  '3D animated music video': {
    cameraDefault: '35mm Virtual Cinema Camera',
    movementDefault: 'Smooth spline camera crane through floating geometry',
    lightingDefault: 'Subsurface scattering rim light & global illumination',
    environmentDefault: 'Surreal kinetic sculpture garden in low gravity',
    transitionDefault: 'Dolly Zoom In',
    colorPaletteHex: ['#2DD4BF', '#8B5CF6'],
    storyArcScenes: [
      {
        narrativeBeat: 'Awakening inside a bioluminescent crystal forest',
        actionDescription: 'Stylized 3D character opens their eyes as glowing spores rise through volumetric forest rays',
        environment: 'Forest',
        lighting: 'Volumetric Lighting',
        cameraControl: 'Establishing Shot',
        mood: 'Mysterious',
      },
      {
        narrativeBeat: 'Gravity-defying walk across floating architectural fragments',
        actionDescription: 'Smooth spline camera tracking the character stepping across levitating stone stairs in a surreal sky',
        environment: 'Fantasy World',
        lighting: 'Cinematic Backlight',
        cameraControl: 'Tracking Shot',
        mood: 'Hopeful',
      },
      {
        narrativeBeat: 'Close-up interaction with a glowing holographic memory orb',
        actionDescription: 'Shallow depth-of-field close-up as warm subsurface light illuminates the character’s face',
        environment: 'Futuristic City',
        lighting: 'Neon Lighting',
        cameraControl: 'Close-up',
        mood: 'Emotional',
      },
      {
        narrativeBeat: 'High-speed flight through a neon futuristic canyon',
        actionDescription: 'Sweeping virtual drone camera diving through towering holographic skyscrapers',
        environment: 'Futuristic City',
        lighting: 'Neon Lighting',
        cameraControl: 'Drone Shot',
        mood: 'Energetic',
      },
      {
        narrativeBeat: 'Quiet reflection beside an astral mountain lake',
        actionDescription: 'Wide anamorphic frame of aurora ribbons dancing over snow-capped peaks and mirror water',
        environment: 'Mountains',
        lighting: 'Moonlight',
        cameraControl: 'Wide Shot',
        mood: 'Nostalgic',
      },
      {
        narrativeBeat: 'Grand pullback into a constellation of floating lanterns',
        actionDescription: 'Camera pulls back from the character into thousands of ascending warm lanterns',
        environment: 'Fantasy World',
        lighting: 'Golden Hour',
        cameraControl: 'Dolly Out',
        mood: 'Inspirational',
      },
    ],
  },
  'Realistic music video': {
    cameraDefault: '35mm Arri Alexa Mini LF Natural Frame',
    movementDefault: 'Steadicam continuous following shot',
    lightingDefault: 'Naturalistic Kodak Vision3 500T practical lighting',
    environmentDefault: 'Late-night recording studio and downtown street',
    transitionDefault: 'Cross Dissolve',
    colorPaletteHex: ['#60A5FA', '#FBBF24'],
    storyArcScenes: [
      {
        narrativeBeat: 'Late-night walk down a rain-misted downtown street',
        actionDescription: 'Handheld 35mm tracking shot following the musician walking past closed storefronts under sodium streetlights',
        environment: 'Rainy Street',
        lighting: 'Blue Hour',
        cameraControl: 'Handheld Camera',
        mood: 'Lonely',
      },
      {
        narrativeBeat: 'Quiet songwriting moment in a sun-drenched bedroom',
        actionDescription: 'Warm afternoon light streaming through blinds onto acoustic guitar strings and handwritten notebook pages',
        environment: 'Bedroom',
        lighting: 'Soft Natural Light',
        cameraControl: 'Medium Shot',
        mood: 'Nostalgic',
      },
      {
        narrativeBeat: 'Intimate close-up at a vintage condenser microphone',
        actionDescription: 'Shallow depth-of-field close-up capturing authentic vocal performance under warm tungsten studio key light',
        environment: 'Cafe',
        lighting: 'Studio Lighting',
        cameraControl: 'Close-up',
        mood: 'Emotional',
      },
      {
        narrativeBeat: 'Looking out a rain-streaked train window at dusk',
        actionDescription: 'Profile close-up as passing city lights blur across the glass in melancholic rhythm',
        environment: 'City at Night',
        lighting: 'Neon Lighting',
        cameraControl: 'Extreme Close-up',
        mood: 'Sad',
      },
      {
        narrativeBeat: 'Wide rooftop performance overlooking the waking city',
        actionDescription: 'Steadicam wide orbit on a concrete rooftop as golden sunrise breaks over the skyline',
        environment: 'Rooftop',
        lighting: 'Golden Hour',
        cameraControl: 'Wide Shot',
        mood: 'Hopeful',
      },
      {
        narrativeBeat: 'Slow camera pullback down a coastal highway',
        actionDescription: 'Receding dolly shot as the artist walks along a quiet coastal road bathed in warm evening light',
        environment: 'Empty Highway',
        lighting: 'Cinematic Backlight',
        cameraControl: 'Dolly Out',
        mood: 'Inspirational',
      },
    ],
  },
  'Fantasy music video': {
    cameraDefault: '28mm Wide Anamorphic Vista',
    movementDefault: 'Ascending aerial drone spiral',
    lightingDefault: 'Bioluminescent aurora & ethereal silver mist',
    environmentDefault: 'Obsidian cliffside temple above a sea of clouds',
    transitionDefault: 'Cross Dissolve',
    colorPaletteHex: ['#A855F7', '#06B6D4'],
    storyArcScenes: [
      {
        narrativeBeat: 'Solitary figure entering an ancient mist-veiled forest',
        actionDescription: 'Wide establishing shot of silver moonlight beams piercing ancient redwood trees and glowing moss',
        environment: 'Forest',
        lighting: 'Volumetric Lighting',
        cameraControl: 'Establishing Shot',
        mood: 'Mysterious',
      },
      {
        narrativeBeat: 'Ethereal memory vision beside a mirror-still ocean',
        actionDescription: 'Slow-motion shot of ripples of bioluminescent blue water illuminating the protagonist’s footsteps',
        environment: 'Beach',
        lighting: 'Moonlight',
        cameraControl: 'Slow Motion',
        mood: 'Romantic',
      },
      {
        narrativeBeat: 'Close-up holding a glowing celestial crystal artifact',
        actionDescription: 'Tight close-up as soft violet light dances across the character’s face and eyes',
        environment: 'Fantasy World',
        lighting: 'Cinematic Backlight',
        cameraControl: 'Close-up',
        mood: 'Emotional',
      },
      {
        narrativeBeat: 'Ascending a mountain summit above a sea of clouds',
        actionDescription: 'Sweeping drone shot circling jagged mountain peaks bathed in golden-violet aurora light',
        environment: 'Mountains',
        lighting: 'Golden Hour',
        cameraControl: 'Drone Shot',
        mood: 'Inspirational',
      },
      {
        narrativeBeat: 'Cosmic storm awakening over a floating citadel',
        actionDescription: 'Dramatic wide angle as ribbons of starlight swirl around ancient arches in the sky',
        environment: 'Fantasy World',
        lighting: 'Dramatic Shadows',
        cameraControl: 'Wide Shot',
        mood: 'Energetic',
      },
      {
        narrativeBeat: 'Slow camera pullback into an infinite starry horizon',
        actionDescription: 'Graceful dolly-out leaving the silhouette framed against twin moons and drifting embers',
        environment: 'Fantasy World',
        lighting: 'Moonlight',
        cameraControl: 'Dolly Out',
        mood: 'Hopeful',
      },
    ],
  },
  'Action music video': {
    cameraDefault: '18mm Russian Arm Tracking Shot',
    movementDefault: 'High-velocity pursuit tracking at 60fps',
    lightingDefault: 'Sparks, tunnel fluorescent strobes & wet asphalt glare',
    environmentDefault: 'Midnight expressway tunnel with rain spray',
    transitionDefault: 'Glitch Sync',
    colorPaletteHex: ['#F97316', '#0EA5E9'],
    storyArcScenes: [
      {
        narrativeBeat: 'Rain-soaked rooftop surveillance over a neon metropolis',
        actionDescription: 'Protagonist stands at the precipice of a skyscraper in pouring rain looking down at neon traffic below',
        environment: 'Rooftop',
        lighting: 'Neon Lighting',
        cameraControl: 'Establishing Shot',
        mood: 'Dark',
      },
      {
        narrativeBeat: 'High-speed midnight highway pursuit through tunnel strobes',
        actionDescription: 'Low-angle tracking shot inches above wet asphalt as tail lights leave crimson streaks in the rain',
        environment: 'Empty Highway',
        lighting: 'Cinematic Backlight',
        cameraControl: 'Tracking Shot',
        mood: 'Energetic',
      },
      {
        narrativeBeat: 'Extreme close-up of intense eyes in rearview mirror',
        actionDescription: 'Tight anamorphic close-up of the driver’s eyes illuminated by passing amber tunnel lights',
        environment: 'City at Night',
        lighting: 'Dramatic Shadows',
        cameraControl: 'Extreme Close-up',
        mood: 'Mysterious',
      },
      {
        narrativeBeat: 'Slow-motion sprint through rain and rising steam',
        actionDescription: '120fps slow-motion side-tracking shot as water droplets hang suspended in mid-air around the runner',
        environment: 'Rainy Street',
        lighting: 'Volumetric Lighting',
        cameraControl: 'Slow Motion',
        mood: 'Energetic',
      },
      {
        narrativeBeat: 'Aerial drone climb above a futuristic bridge at dawn',
        actionDescription: 'Sweeping drone ascent revealing suspension cables cutting through blue-hour mist',
        environment: 'Futuristic City',
        lighting: 'Blue Hour',
        cameraControl: 'Drone Shot',
        mood: 'Inspirational',
      },
      {
        narrativeBeat: 'Cinematic pullback along the desert highway at sunrise',
        actionDescription: 'Long dolly pullback as dust trails settle under warm golden-hour sunbeams',
        environment: 'Empty Highway',
        lighting: 'Golden Hour',
        cameraControl: 'Dolly Out',
        mood: 'Hopeful',
      },
    ],
  },
  'Travel music video': {
    cameraDefault: '24mm VistaVision Landscape Frame',
    movementDefault: 'FPV ridge-skimming glide & golden-hour pan',
    lightingDefault: 'Crisp alpine sunrise rays breaking through valley fog',
    environmentDefault: 'Nordic fjord ridge and winding coastal cliff road',
    transitionDefault: 'Anamorphic Whip Pan',
    colorPaletteHex: ['#10B981', '#3B82F6'],
    storyArcScenes: [
      {
        narrativeBeat: 'Dawn departure along an empty coastal highway',
        actionDescription: 'Wide tracking shot of a vintage camper van cruising beside crashing turquoise ocean waves at sunrise',
        environment: 'Empty Highway',
        lighting: 'Golden Hour',
        cameraControl: 'Tracking Shot',
        mood: 'Hopeful',
      },
      {
        narrativeBeat: 'Sunbeams piercing a misty emerald pine forest',
        actionDescription: 'Steadicam walk along a fern-lined forest trail as volumetric morning light filters through tall canopy',
        environment: 'Forest',
        lighting: 'Volumetric Lighting',
        cameraControl: 'Medium Shot',
        mood: 'Inspirational',
      },
      {
        narrativeBeat: 'Close-up looking at a weathered travel map and photographs',
        actionDescription: 'Warm natural-light close-up of hands tracing a route inside a cozy roadside cafe',
        environment: 'Cafe',
        lighting: 'Soft Natural Light',
        cameraControl: 'Close-up',
        mood: 'Nostalgic',
      },
      {
        narrativeBeat: 'Golden-hour footprints along a secluded ocean beach',
        actionDescription: 'Slow-motion low-angle shot of waves washing over footprints as sunset paints the sky amber and violet',
        environment: 'Beach',
        lighting: 'Golden Hour',
        cameraControl: 'Slow Motion',
        mood: 'Romantic',
      },
      {
        narrativeBeat: 'Epic drone reveal on a high mountain summit',
        actionDescription: '360-degree aerial drone shot of the traveler standing atop a dramatic mountain peak above clouds',
        environment: 'Mountains',
        lighting: 'Cinematic Backlight',
        cameraControl: 'Drone Shot',
        mood: 'Energetic',
      },
      {
        narrativeBeat: 'Twilight pullback under a canopy of mountain stars',
        actionDescription: 'Slow dolly pullback from a warm campfire under a crystal-clear Milky Way night sky',
        environment: 'Mountains',
        lighting: 'Moonlight',
        cameraControl: 'Dolly Out',
        mood: 'Emotional',
      },
    ],
  },
  'Story-based music video': {
    cameraDefault: '40mm Anamorphic Narrative Framing',
    movementDefault: 'Motivated dolly push-in revealing character emotion',
    lightingDefault: 'Chiaroscuro neo-noir amber key with cobalt shadow fill',
    environmentDefault: 'Metropolitan rooftop & illuminated brutalist stage',
    transitionDefault: 'Cross Dissolve',
    colorPaletteHex: ['#6366F1', '#06B6D4'],
    storyArcScenes: [
      {
        narrativeBeat: 'Lonely person walking on a rainy street at midnight',
        actionDescription: 'Cinematic tracking shot of a solitary protagonist walking down a rain-slicked avenue as neon signs shimmer in puddles',
        environment: 'Rainy Street',
        lighting: 'Neon Lighting',
        cameraControl: 'Tracking Shot',
        mood: 'Lonely',
      },
      {
        narrativeBeat: 'Romantic memory flashback bathed in golden sunlight',
        actionDescription: 'Dreamlike flashback in 24fps slow motion showing two people laughing on a sunlit beach with warm lens flare',
        environment: 'Beach',
        lighting: 'Golden Hour',
        cameraControl: 'Slow Motion',
        mood: 'Romantic',
      },
      {
        narrativeBeat: 'Close-up looking at a faded photograph in dim bedroom light',
        actionDescription: 'Intimate 50mm close-up of the protagonist holding a cherished photograph, subtle tear catching soft window light',
        environment: 'Bedroom',
        lighting: 'Soft Natural Light',
        cameraControl: 'Close-up',
        mood: 'Nostalgic',
      },
      {
        narrativeBeat: 'Window reflection during heavy midnight rainfall',
        actionDescription: 'Extreme close-up through rain-streaked glass where raindrops refract blue-hour streetlamps across the subject’s eyes',
        environment: 'Bedroom',
        lighting: 'Blue Hour',
        cameraControl: 'Extreme Close-up',
        mood: 'Sad',
      },
      {
        narrativeBeat: 'Wide shot on rooftop under dramatic cloudy sky',
        actionDescription: 'Sweeping wide crane shot of the protagonist standing on a metropolitan rooftop as volumetric light breaks through storm clouds',
        environment: 'Rooftop',
        lighting: 'Volumetric Lighting',
        cameraControl: 'Wide Shot',
        mood: 'Emotional',
      },
      {
        narrativeBeat: 'Emotional camera pullback into the dawn horizon',
        actionDescription: 'Slow, lingering dolly pullback from the rooftop silhouette as golden dawn light warms the city skyline',
        environment: 'City at Night',
        lighting: 'Cinematic Backlight',
        cameraControl: 'Dolly Out',
        mood: 'Hopeful',
      },
    ],
  },
};

/**
 * Compiles a structured PromptStudioItem into a cohesive, studio-grade master video prompt.
 */
export function compileMasterPromptFromStudio(
  visualStyles: PromptVisualStyle[],
  cameraControls: PromptCameraControl[],
  lightingOptions: PromptLightingOption[],
  environments: PromptEnvironmentOption[],
  moods: PromptMoodOption[],
  fields: PromptStudioFields
): string {
  const stylePart =
    visualStyles.length > 0 ? visualStyles.join(' + ') : 'Cinematic Realism';
  const cameraPart =
    cameraControls.length > 0
      ? cameraControls.join(', ')
      : fields.cameraMovement || 'Medium Shot, Slow Dolly In';
  const lightPart =
    lightingOptions.length > 0
      ? lightingOptions.join(' & ')
      : fields.lighting || 'Volumetric Lighting';
  const envPart =
    environments.length > 0
      ? environments.join(' / ')
      : fields.environment || 'Rainy Street';
  const moodPart = moods.length > 0 ? moods.join(', ') : 'Emotional, Cinematic';

  const segments = [
    `[Visual Style: ${stylePart} | Mood: ${moodPart}]`,
    fields.mainSceneDescription
      ? `Scene Action: ${fields.mainSceneDescription.trim()}.`
      : '',
    fields.characterDescription
      ? `Character: ${fields.characterDescription.trim()} (${fields.clothing || 'signature wardrobe'}, expression: ${fields.facialExpression || 'expressive'}).`
      : '',
    fields.characterAction
      ? `Performance / Movement: ${fields.characterAction.trim()}.`
      : '',
    `Environment: ${fields.environment || envPart}.`,
    `Camera & Lens: ${cameraPart}${fields.cameraMovement ? ` — ${fields.cameraMovement}` : ''}.`,
    `Lighting & Color: ${lightPart}${fields.colorGrading ? `, Color Grade: ${fields.colorGrading}` : ''}.`,
    fields.visualEffects ? `Atmospheric VFX: ${fields.visualEffects}.` : '',
    fields.sceneTransition ? `Transition: ${fields.sceneTransition}.` : '',
    fields.additionalInstructions ? `Director Note: ${fields.additionalInstructions}.` : '',
    fields.negativePrompt ? `Negative Prompt (Avoid): ${fields.negativePrompt}.` : '',
  ].filter(Boolean);

  return segments.join(' ');
}

/**
 * Generates a complete 13-field PromptStudioItem for any scene in the project.
 */
export function buildPromptStudioItemForScene(params: {
  projectId: string;
  scene: StoryboardScene;
  directorStyle: DirectorStyle;
  characters: CharacterProfileItem[];
}): PromptStudioItem {
  const { projectId, scene, directorStyle, characters } = params;
  const styleCfg =
    DIRECTOR_STYLE_CONFIGS[directorStyle] ||
    DIRECTOR_STYLE_CONFIGS['Story-based music video'];
  const arcBeat =
    styleCfg.storyArcScenes[(scene.index - 1) % styleCfg.storyArcScenes.length];

  const leadChar = characters[0];
  const charDesc = leadChar
    ? `${leadChar.name}${leadChar.age ? ` (${leadChar.age})` : ''} — ${leadChar.appearancePrompt}`
    : 'Expressive lead protagonist with natural cinematic screen presence';
  const clothing = leadChar?.wardrobeLock || 'Tailored dark trench coat with subtle rain sheen';
  const expression =
    leadChar?.facialExpression ||
    (arcBeat.mood === 'Sad' || arcBeat.mood === 'Heartbroken'
      ? 'Melancholic, introspective gaze with subtle emotional vulnerability'
      : arcBeat.mood === 'Romantic'
        ? 'Warm, tender eyes with soft nostalgic smile'
        : 'Focused, emotionally resonant expression');

  const visualStyles: PromptVisualStyle[] =
    directorStyle === 'Anime music video'
      ? ['Anime', 'Cinematic Realism']
      : directorStyle === '3D animated music video'
        ? ['3D Animation', 'Dreamlike Fantasy']
        : directorStyle === 'Cinematic Bollywood style'
          ? ['Bollywood Music Video', 'Cinematic Realism']
          : ['Cinematic Realism', 'Music Video Aesthetic'];

  const cameraControls: PromptCameraControl[] = [
    arcBeat.cameraControl,
    scene.cameraMovement.toLowerCase().includes('slow') ? 'Slow Motion' : 'Dolly In',
  ];

  const lightingOptions: PromptLightingOption[] = [
    arcBeat.lighting,
    'Volumetric Lighting',
  ];

  const environments: PromptEnvironmentOption[] = [arcBeat.environment];
  const moods: PromptMoodOption[] = [arcBeat.mood, 'Emotional'];

  const fields: PromptStudioFields = {
    mainSceneDescription:
      scene.narrativeArcBeat ||
      `${arcBeat.narrativeBeat} — ${arcBeat.actionDescription}`,
    characterDescription: charDesc,
    characterAction: arcBeat.actionDescription,
    facialExpression: expression,
    clothing,
    environment: `${arcBeat.environment} (${scene.environment || styleCfg.environmentDefault})`,
    cameraMovement: `${scene.cameraAngle} with ${scene.cameraMovement}`,
    lighting: `${arcBeat.lighting} — ${scene.lighting || styleCfg.lightingDefault}`,
    colorGrading: 'Kodak Vision3 500T film emulation, rich shadow contrast, halation on highlights',
    visualEffects: scene.symbolismVisualMotif || 'Anamorphic bokeh, atmospheric mist, subtle film grain',
    sceneTransition: scene.transition,
    negativePrompt: 'low resolution, blurry face, distorted hands, watermark, static text wall, jerky camera, overexposed',
    additionalInstructions: `Synchronize motion cadence to ${scene.section} (${formatTimecode(scene.startTimeSec)}–${formatTimecode(scene.endTimeSec)}).`,
  };

  const compiledMasterPrompt = compileMasterPromptFromStudio(
    visualStyles,
    cameraControls,
    lightingOptions,
    environments,
    moods,
    fields
  );

  return {
    id: `${projectId}_prompt_${scene.id}`,
    projectId,
    sceneId: scene.id,
    title: `${scene.section}: ${arcBeat.narrativeBeat}`,
    visualStyles,
    cameraControls,
    lightingOptions,
    environments,
    moods,
    fields,
    compiledMasterPrompt,
    isFavorite: scene.index <= 2,
    createdAtIso: new Date().toISOString(),
  };
}

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
  const styleConfig =
    DIRECTOR_STYLE_CONFIGS[directorStyle] ||
    DIRECTOR_STYLE_CONFIGS['Story-based music video'];

  // If user provided lyrics, use them directly; if instrumental/no lyrics, use story arc beats
  const effectiveLines =
    rawLines.length > 0
      ? rawLines
      : styleConfig.storyArcScenes.map(
          (arc) => `${arc.narrativeBeat} — ${arc.actionDescription}`
        );

  const slotDuration = Number((safeDuration / effectiveLines.length).toFixed(2));
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
      : `Symbolic representation of emotional resonance and narrative arc evoked by "${phrase}".`;

    const visualElement = matchedRule
      ? matchedRule.visualElement
      : 'Floating warm lantern orbs ascending through volumetric stage mist';

    const literalVisualElement = matchedRule
      ? matchedRule.literalVisualElement
      : `Expressive cinematic staging inside ${styleConfig.environmentDefault.toLowerCase()}`;

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
              `[Character Lock: ${c.name}${c.age ? ` (${c.age})` : ''} — ${c.appearancePrompt}, Expression: ${c.facialExpression || 'natural'}, Wardrobe: ${c.wardrobeLock}, Hair: ${c.hairstyleLock}]`
          )
          .join(' ')
      : '[Character Lock: Consistent lead protagonist appearance and wardrobe]';

  const cleanBase = baseVisualPrompt.replace(/\s*\| Lyric Symbolism.*$/i, '').trim();
  const updatedVisualPrompt = `${cleanBase} | Lyric Symbolism (${mode}): ${activeMotif} (${meaningText})`;

  const updatedGoogleFlowPrompt = `${directorStyle}. ${cleanBase}. Visual Motif (${mode}): ${activeMotif}. ${charConsistencyBlock}. Smooth 24fps anamorphic motion, high temporal coherence.`;

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
 * Builds an adaptive full-length song timeline and story-driven scene-by-scene storyboard
 * that covers the EXACT duration of the uploaded song (`00:00` to `durationSec`),
 * combining narrative visual storytelling arcs (rainy street walk, memory flashback,
 * close-up photograph, rainfall window, wide rooftop, emotional pullback) with
 * Gemini AI scenes and detected audio structural sections.
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

  // 1. If Gemini AI returned scenes, normalize their weights to cover 100% of totalSec and enrich with story arc beats
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

      const storyArc =
        styleCfg.storyArcScenes[idx % styleCfg.storyArcScenes.length];

      const matchedSymbolism =
        symbolismItems.find(
          (s) => s.startTimeSec < endTimeSec && s.endTimeSec > startTimeSec
        ) || symbolismItems[idx % Math.max(1, symbolismItems.length)];

      const sectionLabel =
        gScene.section || defaultSections[idx % defaultSections.length];
      const cameraAngle =
        gScene.cameraAngle ||
        `${storyArc.cameraControl} (${CAMERA_ANGLE_PRESETS[idx % CAMERA_ANGLE_PRESETS.length]})`;
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
        )}): ${storyArc.narrativeBeat} — ${storyArc.actionDescription}. Environment: ${storyArc.environment} (${styleCfg.environmentDefault}), Lighting: ${
          gScene.lighting || `${storyArc.lighting}, ${styleCfg.lightingDefault}`
        }, Camera: ${cameraAngle}, ${cameraMovement}`;

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
            activeMotif: gScene.metaphorCue || storyArc.narrativeBeat,
          };

      const backdropUrl =
        defaultBackdropUrls.length > 0
          ? defaultBackdropUrls[idx % defaultBackdropUrls.length]
          : '';

      const builtScene: StoryboardScene = {
        id: `${projectId}_scene_${idx + 1}`,
        projectId,
        index: idx + 1,
        section: sectionLabel,
        title: gScene.title || `${sectionLabel}: ${storyArc.narrativeBeat}`,
        narrativeArcBeat: `${storyArc.narrativeBeat} — ${storyArc.actionDescription}`,
        startTimeSec,
        endTimeSec,
        durationSec: actualDuration,
        lyricExcerpt:
          matchedSymbolism?.lyricPhrase ||
          `[${sectionLabel} — ${storyArc.narrativeBeat}]`,
        showLyricsInScene: false,
        visualPrompt: injected.updatedVisualPrompt,
        googleFlowPrompt: injected.updatedGoogleFlowPrompt,
        cameraAngle,
        cameraMovement,
        lighting: gScene.lighting || `${storyArc.lighting} (${styleCfg.lightingDefault})`,
        environment: `${storyArc.environment} — ${styleCfg.environmentDefault}`,
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
        contrast: 108,
        saturation: 112,
        filmGrain: 16,
        temperature: 0,
        exposure: 0,
        vignette: 26,
      };

      builtScene.promptStudioItem = buildPromptStudioItemForScene({
        projectId,
        scene: builtScene,
        directorStyle,
        characters,
      });

      return builtScene;
    });
  }

  // 2. Story-Driven Narrative & Audio-Section Storyboard Builder
  const fullBlueprint: {
    section: StoryboardScene['section'];
    weight: number;
    cameraAngle: string;
    cameraMovement: string;
    transition: TransitionType;
  }[] = [
    {
      section: 'Intro',
      weight: 15 / 210,
      cameraAngle: '24mm Wide Anamorphic Establishing Shot',
      cameraMovement: 'Slow tracking shot along rain-slicked street',
      transition: 'Cross Dissolve',
    },
    {
      section: 'Verse 1',
      weight: 30 / 210,
      cameraAngle: '50mm Golden-Hour Flashback Medium Shot',
      cameraMovement: 'Slow-motion gimbal drift through warm sunlight',
      transition: 'Cross Dissolve',
    },
    {
      section: 'Chorus 1',
      weight: 20 / 210,
      cameraAngle: '85mm Macro-to-Close-Up Portrait',
      cameraMovement: 'Motivated dolly push-in on photograph & expression',
      transition: 'Beat Flash Cut',
    },
    {
      section: 'Verse 2',
      weight: 30 / 210,
      cameraAngle: '50mm Rain-Streaked Window Reflection Close-Up',
      cameraMovement: 'Lateral tracking parallel to rainfall on glass',
      transition: 'Anamorphic Whip Pan',
    },
    {
      section: 'Chorus 2',
      weight: 25 / 210,
      cameraAngle: '24mm Wide Rooftop Vista Under Storm Clouds',
      cameraMovement: 'Sweeping aerial drone orbit synchronized to snare',
      transition: 'Beat Flash Cut',
    },
    {
      section: 'Bridge',
      weight: 30 / 210,
      cameraAngle: '40mm Surreal Memory Suspension Frame',
      cameraMovement: 'Vertigo dolly-zoom time-freeze effect',
      transition: 'Dolly Zoom In',
    },
    {
      section: 'Final Chorus',
      weight: 40 / 210,
      cameraAngle: '18mm Ultra-Wide Climax Stage & Skyline',
      cameraMovement: 'Ascending crane reveal into volumetric cloudbreak',
      transition: 'Glitch Sync',
    },
    {
      section: 'Outro',
      weight: 20 / 210,
      cameraAngle: '50mm Emotional Silhouette Long Shot',
      cameraMovement: 'Slow camera pullback into glowing horizon mist',
      transition: 'Fade to Black',
    },
  ];

  const activeBlueprint =
    totalSec < 32
      ? [
          { ...fullBlueprint[0], weight: 0.22 },
          { ...fullBlueprint[1], weight: 0.28 },
          { ...fullBlueprint[4], weight: 0.28 },
          { ...fullBlueprint[7], weight: 0.22 },
        ]
      : fullBlueprint;

  let cursorSec = 0;
  return activeBlueprint.map((slot, idx) => {
    const isLast = idx === activeBlueprint.length - 1;
    const detected = detectedSections?.[idx];
    const storyArc =
      styleCfg.storyArcScenes[idx % styleCfg.storyArcScenes.length];

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

    const sceneTitle = `${sectionName}: ${storyArc.narrativeBeat}`;

    const energyNote = detected?.energyLevel
      ? ` [Audio Energy: ${detected.energyLevel}]`
      : '';

    const baseVisualPrompt = `${sectionName} (${formatTimecode(
      startTimeSec
    )}–${formatTimecode(endTimeSec)})${energyNote}: ${storyArc.narrativeBeat} — ${
      storyArc.actionDescription
    }. Environment: ${storyArc.environment} (${styleCfg.environmentDefault}), Lighting: ${
      storyArc.lighting
    } (${styleCfg.lightingDefault}), Camera: ${storyArc.cameraControl} / ${
      slot.cameraAngle
    }, Movement: ${slot.cameraMovement}`;

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
          activeMotif: storyArc.narrativeBeat,
        };

    const backdropUrl =
      defaultBackdropUrls.length > 0
        ? defaultBackdropUrls[idx % defaultBackdropUrls.length]
        : '';

    const builtScene: StoryboardScene = {
      id: `${projectId}_scene_${idx + 1}`,
      projectId,
      index: idx + 1,
      section: sectionName,
      title: sceneTitle,
      narrativeArcBeat: `${storyArc.narrativeBeat} — ${storyArc.actionDescription}`,
      startTimeSec,
      endTimeSec,
      durationSec: actualDuration,
      lyricExcerpt:
        matchedSymbolism?.lyricPhrase || `[${sectionName} — ${storyArc.narrativeBeat}]`,
      showLyricsInScene: false,
      visualPrompt: injected.updatedVisualPrompt,
      googleFlowPrompt: injected.updatedGoogleFlowPrompt,
      cameraAngle: `${storyArc.cameraControl} — ${slot.cameraAngle}`,
      cameraMovement: slot.cameraMovement,
      lighting: `${storyArc.lighting} — ${styleCfg.lightingDefault}`,
      environment: `${storyArc.environment} (${styleCfg.environmentDefault})`,
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
      contrast: 108,
      saturation: 112,
      filmGrain: 16,
      temperature: 0,
      exposure: 0,
      vignette: 26,
    };

    builtScene.promptStudioItem = buildPromptStudioItemForScene({
      projectId,
      scene: builtScene,
      directorStyle,
      characters,
    });

    return builtScene;
  });
}

/**
 * Snaps internal scene boundaries to the nearest musical beat timestamp while keeping
 * scene order intact and maintaining a minimum 2-second scene duration.
 */
export function snapScenesToMusicalBeats(
  scenes: StoryboardScene[],
  beatTimestampsSec: number[],
  totalDurationSec: number
): StoryboardScene[] {
  if (!scenes.length || !beatTimestampsSec.length) return scenes;
  const cloned = scenes.map((s) => ({ ...s }));
  const safeTotal = Math.max(4, totalDurationSec);

  for (let i = 0; i < cloned.length - 1; i++) {
    const current = cloned[i];
    const next = cloned[i + 1];
    const targetBoundary = current.endTimeSec;

    // Find closest beat to targetBoundary
    let closestBeat = targetBoundary;
    let minDiff = Infinity;
    for (const beat of beatTimestampsSec) {
      const diff = Math.abs(beat - targetBoundary);
      if (diff < minDiff) {
        minDiff = diff;
        closestBeat = beat;
      }
    }

    const minAllowed = current.startTimeSec + 2;
    const maxAllowed = (i === cloned.length - 2 ? safeTotal : next.endTimeSec) - 2;
    const snapped = Number(
      Math.max(minAllowed, Math.min(maxAllowed, closestBeat)).toFixed(2)
    );

    current.endTimeSec = snapped;
    current.durationSec = Number((current.endTimeSec - current.startTimeSec).toFixed(2));
    next.startTimeSec = snapped;
    next.durationSec = Number((next.endTimeSec - next.startTimeSec).toFixed(2));
  }

  const last = cloned[cloned.length - 1];
  last.endTimeSec = safeTotal;
  last.durationSec = Math.max(1, Number((last.endTimeSec - last.startTimeSec).toFixed(2)));

  return cloned;
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
      | 'showLyricsInScene'
      | 'narrativeArcBeat'
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
  if (patch.showLyricsInScene !== undefined)
    target.showLyricsInScene = patch.showLyricsInScene;
  if (patch.narrativeArcBeat !== undefined)
    target.narrativeArcBeat = patch.narrativeArcBeat;

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
    )}): ${target.narrativeArcBeat || target.environment}, ${target.lighting}, ${target.cameraAngle}, ${
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

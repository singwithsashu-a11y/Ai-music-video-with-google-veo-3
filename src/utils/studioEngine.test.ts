import test from 'node:test';
import assert from 'node:assert/strict';
import {
  analyzeLyricsForVisualSymbolism,
  applyDirectorsCutEdit,
  calculateGenerationCost,
  formatSrtTimestamp,
  formatTimecode,
  generateBeatGrid,
  generateFullLengthStoryboard,
  generateSrtContent,
  injectSymbolismIntoScenePrompt,
  syncLyricsToTimeline,
} from './studioEngine';

test('analyzeLyricsForVisualSymbolism extracts literal and metaphorical meaning and assigns visual animation presets', () => {
  const sampleLyrics = [
    'Neon rain falls across the midnight street',
    'A shattered mirror reflects our yesterday',
    'Every golden ember rises into the stars',
  ].join('\n');

  const items = analyzeLyricsForVisualSymbolism(
    sampleLyrics,
    180,
    'Story-based music video',
    'metaphorical'
  );

  assert.equal(items.length, 3);
  assert.equal(items[0].animationPreset, 'rain_neon_streaks');
  assert.ok(items[0].metaphoricalMeaning.includes('catharsis'));
  assert.equal(items[1].animationPreset, 'shattered_prism');
  assert.equal(items[2].animationPreset, 'ember_ascension');
  assert.ok(items[0].directorPromptInjection.includes('Symbolic Visual Cue (METAPHORICAL)'));
});

test('injectSymbolismIntoScenePrompt updates scene and Google Flow prompts when switching between literal and metaphorical modes', () => {
  const [symbolism] = analyzeLyricsForVisualSymbolism(
    'We drown in the neon rain tonight',
    60,
    'Romantic music video',
    'metaphorical'
  );

  const metaphoricalResult = injectSymbolismIntoScenePrompt(
    'Intro: Rooftop in Tokyo',
    symbolism,
    'metaphorical',
    'Romantic music video',
    []
  );
  assert.ok(metaphoricalResult.updatedVisualPrompt.includes('Zero-gravity bioluminescent raindrops'));

  const literalResult = injectSymbolismIntoScenePrompt(
    'Intro: Rooftop in Tokyo',
    symbolism,
    'literal',
    'Romantic music video',
    []
  );
  assert.ok(literalResult.updatedVisualPrompt.includes('Heavy midnight downpour'));
});

test('generateFullLengthStoryboard adapts dynamically to a 3:30 (210s) song across all 8 musical sections', () => {
  const lyrics = 'Rain on the boulevard\nShattered glass in the night\nFire in our hearts\nTime stands still forever';
  const symbolismItems = analyzeLyricsForVisualSymbolism(lyrics, 210);
  const scenes = generateFullLengthStoryboard({
    durationSec: 210,
    directorStyle: 'Story-based music video',
    lyricsText: lyrics,
    characters: [],
    symbolismItems,
    providerSource: 'google_flow_priority_1',
    defaultBackdropUrls: ['/test.jpg'],
  });

  assert.equal(scenes.length, 8);
  assert.equal(scenes[0].section, 'Intro');
  assert.equal(scenes[0].startTimeSec, 0);
  assert.equal(scenes[scenes.length - 1].section, 'Outro');
  assert.equal(scenes[scenes.length - 1].endTimeSec, 210);
});

test('calculateGenerationCost enforces Priority 1 zero app credit deduction and Priority 2 explicit billing safeguard', () => {
  const flowCost = calculateGenerationCost({
    provider: 'google_flow_priority_1',
    sceneCount: 8,
    resolution: '1080p',
    apiFallbackEnabled: false,
  });
  assert.equal(flowCost.appCreditsRequired, 0);
  assert.equal(flowCost.separateApiBilled, false);
  assert.equal(flowCost.requiresExplicitConsent, false);

  const veoCost = calculateGenerationCost({
    provider: 'google_veo_api_priority_2',
    sceneCount: 8,
    resolution: '1080p',
    apiFallbackEnabled: true,
  });
  assert.ok(veoCost.appCreditsRequired > 0);
  assert.equal(veoCost.separateApiBilled, true);
  assert.equal(veoCost.requiresExplicitConsent, true);
  assert.ok(veoCost.warningMessage?.includes('SEPARATE API BILLING WARNING'));
});

test('syncLyricsToTimeline and generateSrtContent produce valid karaoke word timings and SRT output', () => {
  const cues = syncLyricsToTimeline('Hello neon world\nSecond line of song', 20);
  assert.equal(cues.length, 2);
  assert.equal(cues[0].words.length, 3);
  assert.equal(formatTimecode(210), '03:30');
  assert.equal(formatSrtTimestamp(65.5), '00:01:05,500');

  const srt = generateSrtContent(cues);
  assert.ok(srt.includes('00:00:00,000 -->'));
  assert.ok(srt.includes('Hello neon world'));
});

test('generateBeatGrid produces accurate beat intervals', () => {
  const beats = generateBeatGrid(120, 10);
  // 120 BPM = 0.5s per beat -> 0, 0.5, 1.0 ... 10.0 = 21 beats
  assert.equal(beats.length, 21);
  assert.equal(beats[1], 0.5);
});

test("applyDirectorsCutEdit updates scene camera angle, movement, transition, and ripples adjacent timing cleanly", () => {
  const symbolismItems = analyzeLyricsForVisualSymbolism('Neon rain falls\nGolden fire rises', 120);
  const scenes = generateFullLengthStoryboard({
    durationSec: 120,
    directorStyle: 'Story-based music video',
    lyricsText: 'Neon rain falls\nGolden fire rises',
    characters: [],
    symbolismItems,
    providerSource: 'google_flow_priority_1',
    defaultBackdropUrls: ['/test.jpg'],
  });

  const edited = applyDirectorsCutEdit(
    scenes,
    scenes[1].id,
    {
      cameraAngle: '85mm Split-Diopter Portrait',
      cameraMovement: 'Vertigo dolly-zoom time-freeze effect',
      transition: 'Anamorphic Whip Pan',
      endTimeSec: scenes[1].endTimeSec + 4,
    },
    'Story-based music video'
  );

  assert.equal(edited[1].cameraAngle, '85mm Split-Diopter Portrait');
  assert.equal(edited[1].cameraMovement, 'Vertigo dolly-zoom time-freeze effect');
  assert.equal(edited[1].transition, 'Anamorphic Whip Pan');
  assert.equal(edited[2].startTimeSec, edited[1].endTimeSec);
  assert.ok(edited[1].googleFlowPrompt.includes('85mm Split-Diopter Portrait'));
});


import test from 'node:test';
import assert from 'node:assert/strict';
import {
  analyzeLyricsForVisualSymbolism,
  applyDirectorsCutEdit,
  buildPromptStudioItemForScene,
  calculateGenerationCost,
  compileMasterPromptFromStudio,
  formatSrtTimestamp,
  formatTimecode,
  generateBeatGrid,
  generateFullLengthStoryboard,
  generateSrtContent,
  injectSymbolismIntoScenePrompt,
  snapScenesToMusicalBeats,
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

test('generateFullLengthStoryboard builds story-driven narrative arcs, adapts to any song duration, and attaches 13-field PromptStudioItem', () => {
  const lyrics = 'Rain on the boulevard\nShattered glass in the night\nFire in our hearts\nTime stands still forever';
  const symbolismA = analyzeLyricsForVisualSymbolism(lyrics, 205, 'Sad emotional music video', 'metaphorical', 'proj_song_a');
  const scenesA = generateFullLengthStoryboard({
    projectId: 'proj_song_a',
    durationSec: 205,
    directorStyle: 'Sad emotional music video',
    lyricsText: lyrics,
    characters: [],
    symbolismItems: symbolismA,
    providerSource: 'procedural_cinema_priority_3',
    defaultBackdropUrls: [],
  });

  assert.equal(scenesA.length, 8);
  assert.equal(scenesA[0].projectId, 'proj_song_a');
  assert.equal(scenesA[0].id, 'proj_song_a_scene_1');
  assert.equal(scenesA[0].status, 'QUEUED');
  assert.equal(scenesA[0].showLyricsInScene, false);
  assert.ok(scenesA[0].narrativeArcBeat?.includes('Lonely person walking on a rainy street'));
  assert.ok(scenesA[0].promptStudioItem?.compiledMasterPrompt.includes('Cinematic Realism'));
  assert.equal(scenesA[0].startTimeSec, 0);
  assert.equal(scenesA[scenesA.length - 1].endTimeSec, 205);

  const symbolismB = analyzeLyricsForVisualSymbolism(lyrics, 414, 'Action music video', 'metaphorical', 'proj_song_b');
  const scenesB = generateFullLengthStoryboard({
    projectId: 'proj_song_b',
    durationSec: 414,
    directorStyle: 'Action music video',
    lyricsText: lyrics,
    characters: [],
    symbolismItems: symbolismB,
    providerSource: 'procedural_cinema_priority_3',
    defaultBackdropUrls: [],
  });

  assert.equal(scenesB[0].projectId, 'proj_song_b');
  assert.equal(scenesB[0].id, 'proj_song_b_scene_1');
  assert.equal(scenesB[scenesB.length - 1].endTimeSec, 414);
  assert.notEqual(scenesA[0].id, scenesB[0].id);
});

test('compileMasterPromptFromStudio and buildPromptStudioItemForScene assemble all 13 advanced fields cleanly', () => {
  const master = compileMasterPromptFromStudio(
    ['Cinematic Realism', 'Dark Cinematic'],
    ['Tracking Shot', 'Slow Motion'],
    ['Blue Hour', 'Neon Lighting'],
    ['Rainy Street'],
    ['Lonely', 'Emotional'],
    {
      mainSceneDescription: 'Lonely person walking on a rainy street',
      characterDescription: 'Aria Vance (26) — expressive dark eyes',
      characterAction: 'Walking slowly through neon reflections',
      facialExpression: 'Melancholic gaze',
      clothing: 'Dark trench coat',
      environment: 'Rain-slicked Tokyo alley',
      cameraMovement: '35mm anamorphic tracking shot',
      lighting: 'Blue hour with neon puddles',
      colorGrading: 'Teal and amber Kodak 500T',
      visualEffects: 'Rain droplets and shallow bokeh',
      sceneTransition: 'Cross Dissolve',
      negativePrompt: 'blurry, text watermark',
      additionalInstructions: 'Keep slow motion at 24fps',
    }
  );

  assert.ok(master.includes('Cinematic Realism + Dark Cinematic'));
  assert.ok(master.includes('Lonely person walking on a rainy street'));
  assert.ok(master.includes('Aria Vance (26)'));
  assert.ok(master.includes('Negative Prompt (Avoid): blurry, text watermark'));

  const [scene] = generateFullLengthStoryboard({
    projectId: 'proj_prompt_test',
    durationSec: 60,
    directorStyle: 'Romantic music video',
    lyricsText: '',
    characters: [],
    symbolismItems: [],
    providerSource: 'procedural_cinema_priority_3',
    defaultBackdropUrls: [],
  });

  const studioItem = buildPromptStudioItemForScene({
    projectId: 'proj_prompt_test',
    scene,
    directorStyle: 'Romantic music video',
    characters: [],
  });

  assert.equal(studioItem.projectId, 'proj_prompt_test');
  assert.ok(studioItem.fields.mainSceneDescription.length > 10);
  assert.ok(studioItem.compiledMasterPrompt.length > 40);
});

test('snapScenesToMusicalBeats aligns scene cuts to beat grid without breaking total duration', () => {
  const scenes = generateFullLengthStoryboard({
    projectId: 'proj_beats',
    durationSec: 28,
    directorStyle: 'Romantic music video',
    lyricsText: '',
    characters: [],
    symbolismItems: [],
    providerSource: 'procedural_cinema_priority_3',
    defaultBackdropUrls: [],
  });
  const beats = generateBeatGrid(120, 28); // every 0.5s
  const snapped = snapScenesToMusicalBeats(scenes, beats, 28);

  assert.equal(snapped[0].startTimeSec, 0);
  assert.equal(snapped[snapped.length - 1].endTimeSec, 28);
  for (let i = 0; i < snapped.length - 1; i++) {
    assert.equal(snapped[i].endTimeSec, snapped[i + 1].startTimeSec);
    assert.equal(snapped[i].endTimeSec % 0.5, 0);
  }
});

test('calculateGenerationCost reports honest provider integration statuses for Priority 1, 2, and 3', () => {
  const flowCost = calculateGenerationCost({
    provider: 'google_flow_priority_1',
    sceneCount: 8,
    resolution: '1080p',
    apiFallbackEnabled: false,
  });
  assert.equal(flowCost.integrationStatus, 'NOT_INTEGRATED');
  assert.ok(flowCost.warningMessage?.includes('NOT INTEGRATED'));

  const procCost = calculateGenerationCost({
    provider: 'procedural_cinema_priority_3',
    sceneCount: 8,
    resolution: '1080p',
    apiFallbackEnabled: false,
  });
  assert.equal(procCost.integrationStatus, 'READY_PROCEDURAL');
  assert.equal(procCost.appCreditsRequired, 0);
  assert.equal(procCost.separateApiBilled, false);

  const veoCost = calculateGenerationCost({
    provider: 'google_veo_api_priority_2',
    sceneCount: 8,
    resolution: '1080p',
    apiFallbackEnabled: true,
    veoApiEnabled: true,
  });
  assert.equal(veoCost.integrationStatus, 'REQUIRES_ADMIN_AND_KEY');
  assert.ok(veoCost.appCreditsRequired > 0);
  assert.equal(veoCost.separateApiBilled, true);
  assert.equal(veoCost.requiresExplicitConsent, true);
  assert.ok(veoCost.warningMessage?.includes('SEPARATE API BILLING WARNING'));
});

test('syncLyricsToTimeline and generateSrtContent produce valid karaoke word timings and SRT output', () => {
  const cues = syncLyricsToTimeline('Hello neon world\nSecond line of song', 20, '16:9', 'proj_test');
  assert.equal(cues.length, 2);
  assert.equal(cues[0].projectId, 'proj_test');
  assert.equal(cues[0].words.length, 3);
  assert.equal(formatTimecode(210), '03:30');
  assert.equal(formatSrtTimestamp(65.5), '00:01:05,500');

  const srt = generateSrtContent(cues);
  assert.ok(srt.includes('00:00:00,000 -->'));
  assert.ok(srt.includes('Hello neon world'));
});

test('generateBeatGrid produces accurate beat intervals', () => {
  const beats = generateBeatGrid(120, 10);
  assert.equal(beats.length, 21);
  assert.equal(beats[1], 0.5);
});

test("applyDirectorsCutEdit updates scene camera angle, movement, transition, and ripples adjacent timing cleanly", () => {
  const symbolismItems = analyzeLyricsForVisualSymbolism('Neon rain falls\nGolden fire rises', 120, 'Story-based music video', 'metaphorical', 'proj_dc');
  const scenes = generateFullLengthStoryboard({
    projectId: 'proj_dc',
    durationSec: 120,
    directorStyle: 'Story-based music video',
    lyricsText: 'Neon rain falls\nGolden fire rises',
    characters: [],
    symbolismItems,
    providerSource: 'procedural_cinema_priority_3',
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

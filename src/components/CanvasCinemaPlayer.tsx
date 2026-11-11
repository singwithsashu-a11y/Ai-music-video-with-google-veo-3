import React, { useEffect, useRef, useState } from 'react';
import {
  AspectRatioOption,
  CharacterProfileItem,
  ColorGradingSettings,
  LyricsDisplaySettings,
  LyricSymbolismItem,
  StoryboardScene,
  StudioBackgroundJob,
  SubtitleCue,
} from '../types/studio';
import {
  DEFAULT_COLOR_GRADING_SETTINGS,
  DEFAULT_LYRICS_DISPLAY_SETTINGS,
  formatTimecode,
} from '../utils/studioEngine';
import { studioAudioEngine } from '../utils/audioSynth';
import {
  Camera,
  Download,
  Film,
  Maximize2,
  Minimize2,
  Pause,
  Play,
  RotateCcw,
  Sparkles,
  Video,
  Volume2,
  VolumeX,
} from 'lucide-react';

interface CanvasCinemaPlayerProps {
  projectId: string;
  audioUrl?: string;
  renderedMasterMp4Url?: string;
  renderedMasterDownloadUrl?: string;
  masterRenderJob?: StudioBackgroundJob;
  scenes: StoryboardScene[];
  subtitles: SubtitleCue[];
  lyricSymbolism: LyricSymbolismItem[];
  characters: CharacterProfileItem[];
  durationSec: number;
  bpm: number;
  aspectRatio: AspectRatioOption;
  currentTimeSec: number;
  isPlaying: boolean;
  onTimeUpdate: (sec: number) => void;
  onPlayStateChange: (playing: boolean) => void;
  onStartServerMp4Render: () => void;
  exportResolution?: '720p' | '1080p' | '4K';
  lyricsDisplaySettings?: LyricsDisplaySettings;
  colorGradingSettings?: ColorGradingSettings;
  titleSequenceText?: string;
  outroSequenceText?: string;
}

export const CanvasCinemaPlayer: React.FC<CanvasCinemaPlayerProps> = ({
  audioUrl,
  renderedMasterMp4Url,
  renderedMasterDownloadUrl,
  masterRenderJob,
  scenes,
  subtitles,
  lyricSymbolism,
  characters,
  durationSec,
  bpm,
  aspectRatio,
  currentTimeSec,
  isPlaying,
  onTimeUpdate,
  onPlayStateChange,
  onStartServerMp4Render,
  exportResolution = '1080p',
  lyricsDisplaySettings = DEFAULT_LYRICS_DISPLAY_SETTINGS,
  colorGradingSettings = DEFAULT_COLOR_GRADING_SETTINGS,
  titleSequenceText = '',
  outroSequenceText = '',
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const loadedImagesRef = useRef<Record<string, HTMLImageElement>>({});
  const [, setImagesLoadedCount] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [viewMode, setViewMode] = useState<'compositor' | 'mp4_player'>('compositor');
  const [isFullScreen, setIsFullScreen] = useState(false);

  const isJobRunning =
    masterRenderJob?.status === 'QUEUED' ||
    masterRenderJob?.status === 'PROCESSING' ||
    masterRenderJob?.status === 'pending' ||
    masterRenderJob?.status === 'processing';

  const finalDownloadUrl =
    masterRenderJob?.downloadUrl || renderedMasterDownloadUrl || renderedMasterMp4Url;
  const finalVideoUrl = masterRenderJob?.outputUrl || renderedMasterMp4Url;

  const stateRef = useRef({
    scenes,
    subtitles,
    lyricSymbolism,
    characters,
    durationSec,
    bpm,
    currentTimeSec,
    isPlaying,
  });
  stateRef.current = {
    scenes,
    subtitles,
    lyricSymbolism,
    characters,
    durationSec,
    bpm,
    currentTimeSec,
    isPlaying,
  };

  // Preload scene & character images
  useEffect(() => {
    const urls = new Set<string>();
    scenes.forEach((s) => {
      if (s.backdropImageUrl) urls.add(s.backdropImageUrl);
    });
    characters.forEach((c) => {
      if (c.referenceImageUrl) urls.add(c.referenceImageUrl);
    });

    urls.forEach((url) => {
      if (!loadedImagesRef.current[url]) {
        const img = new Image();
        loadedImagesRef.current[url] = img;
        img.onload = () => {
          setImagesLoadedCount((c) => c + 1);
        };
        img.src = url;
      }
    });
  }, [scenes, characters]);

  // Manage real audio file or Web Audio synth playback synced with play state
  useEffect(() => {
    if (isPlaying && !isMuted && viewMode === 'compositor') {
      studioAudioEngine.startPlayback({
        audioUrl,
        bpm,
        startTimeSec: stateRef.current.currentTimeSec,
      });
    } else {
      studioAudioEngine.stopSynthPlayback();
    }
    return () => {
      studioAudioEngine.stopSynthPlayback();
    };
  }, [isPlaying, isMuted, bpm, audioUrl, viewMode]);

  // Playback timer progression
  useEffect(() => {
    if (!isPlaying || viewMode !== 'compositor') return;
    let lastTick = performance.now();
    const timer = window.setInterval(() => {
      const now = performance.now();
      const dt = (now - lastTick) / 1000;
      lastTick = now;
      const nextTime = stateRef.current.currentTimeSec + dt;
      if (nextTime >= stateRef.current.durationSec) {
        onTimeUpdate(0);
        onPlayStateChange(false);
      } else {
        const rounded = Number(nextTime.toFixed(2));
        studioAudioEngine.syncPlayhead(rounded);
        onTimeUpdate(rounded);
      }
    }, 50);
    return () => window.clearInterval(timer);
  }, [isPlaying, viewMode, onTimeUpdate, onPlayStateChange]);

  const handleDownloadThumbnail = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dataUrl = canvas.toDataURL('image/png');
    const a = document.createElement('a');
    a.href = dataUrl;
    a.download = `cinema_thumbnail_${Math.round(currentTimeSec)}s.png`;
    a.click();
  };

  // Draw single frame onto canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;
    const t = currentTimeSec;
    const activeScene =
      scenes.find((s) => t >= s.startTimeSec && t <= s.endTimeSec) || scenes[0];
    const activeSymbolism =
      lyricSymbolism.find((l) => t >= l.startTimeSec && t <= l.endTimeSec) ||
      lyricSymbolism.find((l) => l.id === activeScene?.linkedSymbolismId);
    const activeSubtitle = subtitles.find(
      (sub) => t >= sub.startTimeSec && t <= sub.endTimeSec
    );

    ctx.save();
    ctx.clearRect(0, 0, width, height);

    // 1. Background & Camera Motion Transform + Colour Grading
    const sceneProgress = activeScene
      ? Math.max(
          0,
          Math.min(
            1,
            (t - activeScene.startTimeSec) / Math.max(1, activeScene.durationSec)
          )
        )
      : 0;

    const brightness =
      Math.round(
        ((activeScene?.brightness ?? 100) * (colorGradingSettings.brightness ?? 100)) / 100
      ) + Math.round((colorGradingSettings.exposure ?? 0) * 0.4);
    const contrast = Math.round(
      ((activeScene?.contrast ?? 105) * (colorGradingSettings.contrast ?? 108)) / 100
    );
    const saturation = Math.round(
      ((activeScene?.saturation ?? 110) * (colorGradingSettings.saturation ?? 112)) / 100
    );
    const dofBlurPx =
      (colorGradingSettings.depthOfField ?? 0) > 65
        ? ((colorGradingSettings.depthOfField - 65) / 35) * 1.5
        : 0;

    ctx.filter = `brightness(${brightness}%) contrast(${contrast}%) saturate(${saturation}%)${
      dofBlurPx > 0 ? ` blur(${dofBlurPx.toFixed(1)}px)` : ''
    }`;

    ctx.save();
    const moveLower = (activeScene?.cameraMovement || '').toLowerCase();
    let zoom = 1.04 + sceneProgress * 0.08;
    let panX = 0;
    let panY = 0;
    if (
      moveLower.includes('pull-back') ||
      moveLower.includes('pullback') ||
      moveLower.includes('dolly out') ||
      moveLower.includes('descent')
    ) {
      zoom = 1.15 - sceneProgress * 0.11;
    } else if (
      moveLower.includes('orbital') ||
      moveLower.includes('lateral') ||
      moveLower.includes('tracking')
    ) {
      panX = Math.sin(sceneProgress * Math.PI * 2) * 20;
    } else if (moveLower.includes('handheld') || moveLower.includes('pursuit')) {
      panX = Math.sin(t * 7) * 5;
      panY = Math.cos(t * 5.5) * 4;
    }

    ctx.translate(width / 2 + panX, height / 2 + panY);
    ctx.scale(zoom, zoom);
    ctx.translate(-width / 2, -height / 2);

    const bgImg = activeScene?.backdropImageUrl
      ? loadedImagesRef.current[activeScene.backdropImageUrl]
      : undefined;

    if (bgImg && bgImg.complete && bgImg.naturalWidth > 0) {
      const imgAspect = bgImg.naturalWidth / bgImg.naturalHeight;
      const canvasAspect = width / height;
      let drawW = width;
      let drawH = height;
      let offsetX = 0;
      let offsetY = 0;
      if (imgAspect > canvasAspect) {
        drawW = height * imgAspect;
        offsetX = -(drawW - width) / 2;
      } else {
        drawH = width / imgAspect;
        offsetY = -(drawH - height) / 2;
      }
      ctx.drawImage(bgImg, offsetX, offsetY, drawW, drawH);
    } else {
      // Rich procedural cinematic depth canvas when no static photo is used
      const grad = ctx.createLinearGradient(0, 0, width, height);
      grad.addColorStop(0, '#07090F');
      grad.addColorStop(0.5, '#131629');
      grad.addColorStop(1, '#090D16');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, width, height);

      // Subtle architectural horizon & volumetric depth-of-field bokeh circles
      const bokehColorA = activeSymbolism?.primaryColorHex || '#6366F1';
      const bokehColorB = activeSymbolism?.secondaryColorHex || '#38BDF8';
      for (let b = 0; b < 14; b++) {
        const bx = ((b * 97 + Math.sin(t * 0.4 + b) * 45) % width + width) % width;
        const by =
          height * 0.25 +
          (((b * 61 + Math.cos(t * 0.3 + b) * 30) % (height * 0.5)) + height * 0.5) %
            (height * 0.5);
        const br = 16 + (b % 5) * 14;
        const bGrad = ctx.createRadialGradient(bx, by, 2, bx, by, br);
        bGrad.addColorStop(0, `${b % 2 === 0 ? bokehColorA : bokehColorB}40`);
        bGrad.addColorStop(1, 'transparent');
        ctx.fillStyle = bGrad;
        ctx.beginPath();
        ctx.arc(bx, by, br, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    ctx.restore();
    ctx.filter = 'none';

    // 2. Colour Temperature & Lens Flare / Glow Layer
    const temp = colorGradingSettings.temperature ?? 0;
    if (temp !== 0) {
      ctx.save();
      ctx.fillStyle =
        temp > 0
          ? `rgba(245, 158, 11, ${Math.min(0.22, (temp / 50) * 0.18)})`
          : `rgba(56, 189, 248, ${Math.min(0.22, (Math.abs(temp) / 50) * 0.18)})`;
      ctx.fillRect(0, 0, width, height);
      ctx.restore();
    }

    if ((colorGradingSettings.lensFlare ?? 0) > 10) {
      ctx.save();
      const flareAlpha = Math.min(0.45, (colorGradingSettings.lensFlare / 100) * 0.4);
      const flareX = width * (0.25 + 0.5 * Math.sin(t * 0.35));
      const flareY = height * 0.22;
      const flareGrad = ctx.createRadialGradient(
        flareX,
        flareY,
        4,
        flareX,
        flareY,
        width * 0.38
      );
      flareGrad.addColorStop(0, `rgba(255, 255, 255, ${flareAlpha})`);
      flareGrad.addColorStop(0.3, `rgba(124, 58, 237, ${flareAlpha * 0.5})`);
      flareGrad.addColorStop(1, 'transparent');
      ctx.fillStyle = flareGrad;
      ctx.fillRect(0, 0, width, height);
      ctx.restore();
    }

    // 3. Atmospheric Visual Layer (Rain, Embers, Prism, Nebula)
    const preset =
      activeSymbolism?.animationPreset || activeScene?.animationPreset || 'nebula_swirl';
    const primaryColor = activeSymbolism?.primaryColorHex || '#6366F1';
    const secondaryColor = activeSymbolism?.secondaryColorHex || '#38BDF8';
    const beatPulse = 0.5 + 0.5 * Math.sin((t * bpm * Math.PI) / 30);

    ctx.save();
    if (preset === 'rain_neon_streaks') {
      ctx.strokeStyle = secondaryColor;
      ctx.lineWidth = 1.5;
      for (let i = 0; i < 36; i++) {
        const rx = ((i * 97 + t * 140) % (width + 100)) - 50;
        const ry = ((i * 61 + t * 420) % (height + 80)) - 40;
        ctx.globalAlpha = 0.25 + (i % 3) * 0.12;
        ctx.beginPath();
        ctx.moveTo(rx, ry);
        ctx.lineTo(rx - 12, ry + 34);
        ctx.stroke();
      }
    } else if (preset === 'shattered_prism') {
      for (let i = 0; i < 12; i++) {
        const angle = (i / 12) * Math.PI * 2 + t * 0.45;
        const radius = 90 + (i % 3) * 45 + beatPulse * 16;
        const px = width / 2 + Math.cos(angle) * radius;
        const py = height * 0.44 + Math.sin(angle) * (radius * 0.55);
        ctx.fillStyle = i % 2 === 0 ? primaryColor : secondaryColor;
        ctx.globalAlpha = 0.22;
        ctx.beginPath();
        ctx.moveTo(px, py - 18);
        ctx.lineTo(px + 16, py + 12);
        ctx.lineTo(px - 14, py + 14);
        ctx.closePath();
        ctx.fill();
      }
    } else if (preset === 'ember_ascension' || preset === 'floating_lanterns') {
      for (let i = 0; i < 24; i++) {
        const ex = (i * 73 + Math.sin(t * 1.5 + i) * 28) % width;
        const ey = height - ((i * 53 + t * 75) % (height + 40));
        const r = preset === 'floating_lanterns' ? 4 + (i % 4) * 2 : 2 + (i % 3) * 1.5;
        ctx.fillStyle = i % 2 === 0 ? '#F59E0B' : primaryColor;
        ctx.globalAlpha = 0.35 + 0.25 * Math.sin(t * 3 + i);
        ctx.beginPath();
        ctx.arc(ex, ey, r, 0, Math.PI * 2);
        ctx.fill();
      }
    } else if (preset === 'chrono_ripples') {
      ctx.strokeStyle = primaryColor;
      for (let ring = 1; ring <= 4; ring++) {
        ctx.globalAlpha = 0.18;
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(
          width / 2,
          height * 0.45,
          45 * ring + beatPulse * 12,
          t * 0.4 * (ring % 2 === 0 ? 1 : -1),
          t * 0.4 * (ring % 2 === 0 ? 1 : -1) + Math.PI * 1.35
        );
        ctx.stroke();
      }
    } else if (preset === 'cyber_grid_flight') {
      ctx.strokeStyle = secondaryColor;
      ctx.globalAlpha = 0.2;
      ctx.lineWidth = 1;
      const horizonY = height * 0.62;
      for (let i = -6; i <= 6; i++) {
        ctx.beginPath();
        ctx.moveTo(width / 2 + i * 25, horizonY);
        ctx.lineTo(width / 2 + i * 140, height);
        ctx.stroke();
      }
    } else {
      const auroraGrad = ctx.createRadialGradient(
        width * 0.5 + Math.sin(t * 0.8) * 60,
        height * 0.38,
        10,
        width * 0.5,
        height * 0.45,
        width * 0.45
      );
      auroraGrad.addColorStop(0, `${primaryColor}44`);
      auroraGrad.addColorStop(0.5, `${secondaryColor}22`);
      auroraGrad.addColorStop(1, 'transparent');
      ctx.fillStyle = auroraGrad;
      ctx.fillRect(0, 0, width, height);
    }
    ctx.restore();

    // 4. Vignette & Film Grain
    const vigStrength = colorGradingSettings.vignette ?? 28;
    if (vigStrength > 0) {
      ctx.save();
      const vigGrad = ctx.createRadialGradient(
        width / 2,
        height / 2,
        width * 0.28,
        width / 2,
        height / 2,
        width * 0.65
      );
      vigGrad.addColorStop(0, 'rgba(0,0,0,0)');
      vigGrad.addColorStop(1, `rgba(4, 6, 12, ${Math.min(0.85, vigStrength / 100)})`);
      ctx.fillStyle = vigGrad;
      ctx.fillRect(0, 0, width, height);
      ctx.restore();
    }

    // 5. Scene Director Narrative HUD Bar (Subtle top bar)
    const topScrim = ctx.createLinearGradient(0, 0, 0, 74);
    topScrim.addColorStop(0, 'rgba(7, 9, 15, 0.78)');
    topScrim.addColorStop(1, 'rgba(7, 9, 15, 0)');
    ctx.fillStyle = topScrim;
    ctx.fillRect(0, 0, width, 74);

    if (activeScene) {
      ctx.fillStyle = '#F8FAFC';
      ctx.font = '600 12px "Plus Jakarta Sans", sans-serif';
      ctx.fillText(
        `SCENE ${activeScene.index}: ${activeScene.section.toUpperCase()} · ${activeScene.cameraAngle.slice(0, 44)}`,
        18,
        24
      );
      ctx.fillStyle = '#94A3B8';
      ctx.font = '400 11px "JetBrains Mono", monospace';
      const narrativeLabel =
        activeScene.narrativeArcBeat ||
        activeScene.symbolismVisualMotif ||
        activeScene.title;
      ctx.fillText(`STORY BEAT: ${narrativeLabel.slice(0, 68)}`, 18, 42);
    }

    // 6. Optional Title Sequence & Outro Sequence Cards
    if (titleSequenceText && t < 3.0) {
      ctx.save();
      const alpha = t < 2.0 ? 1 : Math.max(0, 1 - (t - 2.0));
      ctx.globalAlpha = alpha;
      ctx.fillStyle = 'rgba(7, 9, 15, 0.55)';
      ctx.fillRect(0, height * 0.36, width, height * 0.24);
      ctx.textAlign = 'center';
      ctx.fillStyle = '#FFFFFF';
      ctx.font = '700 28px "Bricolage Grotesque", sans-serif';
      ctx.fillText(titleSequenceText, width / 2, height * 0.49);
      ctx.restore();
    } else if (outroSequenceText && durationSec > 5 && t > durationSec - 3.5) {
      ctx.save();
      const alpha = Math.min(1, (t - (durationSec - 3.5)) / 1.2);
      ctx.globalAlpha = alpha;
      ctx.fillStyle = 'rgba(7, 9, 15, 0.65)';
      ctx.fillRect(0, height * 0.36, width, height * 0.24);
      ctx.textAlign = 'center';
      ctx.fillStyle = '#FFFFFF';
      ctx.font = '700 24px "Bricolage Grotesque", sans-serif';
      ctx.fillText(outroSequenceText, width / 2, height * 0.49);
      ctx.restore();
    }

    // 7. Lyrics & Text Control Layer (Respects user mode — never forces lyrics when mode === 'none')
    const mode = lyricsDisplaySettings.mode;
    const shouldRenderLyrics =
      mode !== 'none' &&
      activeSubtitle &&
      (mode !== 'selected' || Boolean(activeScene?.showLyricsInScene));

    if (shouldRenderLyrics && activeSubtitle) {
      ctx.save();
      const fontSize = lyricsDisplaySettings.fontSizePx || 24;
      const fontName = lyricsDisplaySettings.fontFamily || 'Bricolage Grotesque';
      ctx.font = `700 ${fontSize}px "${fontName}", sans-serif`;
      const yPos =
        lyricsDisplaySettings.position === 'top'
          ? 96
          : lyricsDisplaySettings.position === 'center'
            ? height * 0.54
            : height - 54;

      const fullLine = activeSubtitle.words.map((w) => w.word).join(' ');
      const displayLine =
        mode === 'minimal'
          ? fullLine.split(/\s+/).slice(0, 5).join(' ')
          : fullLine;
      const metrics = ctx.measureText(displayLine);

      if (mode === 'subtitle' || mode === 'full' || mode === 'selected') {
        const padX = 16;
        ctx.fillStyle = 'rgba(7, 9, 15, 0.72)';
        ctx.fillRect(
          width / 2 - metrics.width / 2 - padX,
          yPos - fontSize,
          metrics.width + padX * 2,
          fontSize + 14
        );
      }

      if (lyricsDisplaySettings.shadowEnabled) {
        ctx.shadowColor = 'rgba(0, 0, 0, 0.85)';
        ctx.shadowBlur = 8;
      }

      if (mode === 'karaoke') {
        let cursorX = width / 2 - metrics.width / 2;
        ctx.textAlign = 'left';
        activeSubtitle.words.forEach((wObj) => {
          const isCurrentWord = t >= wObj.startSec && t <= wObj.endSec;
          const isPastWord = t > wObj.endSec;
          ctx.fillStyle = isCurrentWord
            ? '#38BDF8'
            : isPastWord
              ? lyricsDisplaySettings.textColor || '#F8FAFC'
              : '#94A3B8';
          ctx.fillText(wObj.word, cursorX, yPos);
          cursorX += ctx.measureText(wObj.word + ' ').width;
        });
      } else {
        ctx.textAlign = 'center';
        if (lyricsDisplaySettings.outlineColor) {
          ctx.strokeStyle = lyricsDisplaySettings.outlineColor;
          ctx.lineWidth = 3;
          ctx.strokeText(displayLine, width / 2, yPos);
        }
        ctx.fillStyle = lyricsDisplaySettings.textColor || '#F8FAFC';
        ctx.fillText(displayLine, width / 2, yPos);
      }
      ctx.restore();
    }

    // 8. Global Fade-In / Fade-Out Envelope
    const fadeIn = colorGradingSettings.fadeInSec ?? 0;
    const fadeOut = colorGradingSettings.fadeOutSec ?? 0;
    if (fadeIn > 0 && t < fadeIn) {
      ctx.fillStyle = `rgba(0, 0, 0, ${Math.max(0, 1 - t / fadeIn)})`;
      ctx.fillRect(0, 0, width, height);
    } else if (fadeOut > 0 && durationSec > fadeOut && t > durationSec - fadeOut) {
      ctx.fillStyle = `rgba(0, 0, 0, ${Math.min(
        1,
        (t - (durationSec - fadeOut)) / fadeOut
      )})`;
      ctx.fillRect(0, 0, width, height);
    }

    // 9. Subtle Bottom Audio-Reactive Beat Spectrum Bar
    const barCount = 48;
    const barWidth = width / barCount;
    for (let b = 0; b < barCount; b++) {
      const wave =
        Math.abs(Math.sin(b * 0.35 + t * 6)) *
        (isPlaying ? 0.4 + 0.6 * beatPulse : 0.18);
      const barH = Math.max(2, wave * 14);
      ctx.fillStyle = b % 2 === 0 ? primaryColor : secondaryColor;
      ctx.globalAlpha = 0.6;
      ctx.fillRect(b * barWidth + 1, height - barH, barWidth - 2, barH);
    }

    ctx.restore();
  }, [
    currentTimeSec,
    scenes,
    subtitles,
    lyricSymbolism,
    characters,
    bpm,
    isPlaying,
    aspectRatio,
    lyricsDisplaySettings,
    colorGradingSettings,
    titleSequenceText,
    outroSequenceText,
    durationSec,
  ]);

  const canvasDimensions =
    aspectRatio === '9:16'
      ? { width: 450, height: 800 }
      : aspectRatio === '1:1'
        ? { width: 640, height: 640 }
        : aspectRatio === '4:5'
          ? { width: 640, height: 800 }
          : { width: 800, height: 450 };

  const currentScene =
    scenes.find(
      (s) => currentTimeSec >= s.startTimeSec && currentTimeSec <= s.endTimeSec
    ) || scenes[0];

  return (
    <div
      className={`${
        isFullScreen
          ? 'fixed inset-0 z-50 bg-[#07090F] p-4 sm:p-6 overflow-y-auto flex flex-col justify-between'
          : 'bg-[#0B0F19]/95 border border-slate-800/90 rounded-2xl p-4 flex flex-col gap-3 shadow-xl'
      }`}
    >
      {/* Top Monitor Header */}
      <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-400">
        <div className="flex items-center gap-2 min-w-0">
          <Film className="w-4 h-4 text-violet-400 shrink-0" />
          <span className="font-semibold text-white truncate">
            Cinema Monitor ({aspectRatio} · {exportResolution})
          </span>
          <span aria-hidden="true">·</span>
          <span className="font-mono tabular-nums text-sky-300 truncate">
            {currentScene ? `S${currentScene.index}: ${currentScene.title}` : 'Ready'}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <span className="px-2 py-0.5 rounded-md bg-slate-900 border border-slate-800 text-[11px] font-mono text-slate-300">
            Lyrics: {lyricsDisplaySettings.mode === 'none' ? 'Clean Video (Off)' : lyricsDisplaySettings.mode}
          </span>

          {finalVideoUrl && (
            <div className="flex items-center gap-1 bg-slate-950 p-0.5 rounded-lg border border-slate-800">
              <button
                type="button"
                onClick={() => setViewMode('compositor')}
                className={`px-2 py-1 text-[11px] font-medium rounded-md cursor-pointer ${
                  viewMode === 'compositor'
                    ? 'bg-violet-600 text-white'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Live Canvas
              </button>
              <button
                type="button"
                onClick={() => {
                  onPlayStateChange(false);
                  setViewMode('mp4_player');
                }}
                className={`px-2 py-1 text-[11px] font-medium rounded-md flex items-center gap-1 cursor-pointer ${
                  viewMode === 'mp4_player'
                    ? 'bg-emerald-600 text-white'
                    : 'text-emerald-400 hover:text-emerald-200'
                }`}
              >
                <Video className="w-3 h-3" />
                Rendered MP4
              </button>
            </div>
          )}

          <button
            type="button"
            onClick={() => setIsFullScreen(!isFullScreen)}
            title={isFullScreen ? 'Exit Full Screen' : 'Full Screen Monitor'}
            className="min-h-[36px] min-w-[36px] rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 flex items-center justify-center text-slate-300 hover:text-white cursor-pointer"
          >
            {isFullScreen ? (
              <Minimize2 className="w-3.5 h-3.5" />
            ) : (
              <Maximize2 className="w-3.5 h-3.5" />
            )}
          </button>
        </div>
      </div>

      {/* Canvas or Rendered MP4 Viewport */}
      <div className="relative w-full bg-black rounded-xl overflow-hidden border border-slate-800/90 flex items-center justify-center">
        {viewMode === 'mp4_player' && finalVideoUrl ? (
          <video
            src={finalVideoUrl}
            controls
            autoPlay
            className="w-full max-h-[480px] object-contain"
          />
        ) : (
          <canvas
            ref={canvasRef}
            data-testid="cinema-compositor-canvas"
            width={canvasDimensions.width}
            height={canvasDimensions.height}
            className={`w-full max-w-full h-auto block ${
              isFullScreen ? 'max-h-[72vh] object-contain' : 'max-h-[460px] object-contain'
            }`}
          />
        )}

        {isJobRunning && masterRenderJob && (
          <div className="absolute inset-0 bg-slate-950/85 backdrop-blur-sm flex flex-col items-center justify-center gap-3 p-6 text-center">
            <Sparkles className="w-7 h-7 text-violet-400 animate-spin" />
            <div className="text-sm font-semibold text-white">
              FFmpeg Master Pipeline Rendering ({exportResolution} · {aspectRatio})...
            </div>
            <div className="w-64 h-2 bg-slate-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-violet-500 transition-all duration-200"
                style={{ width: `${masterRenderJob.progress}%` }}
              />
            </div>
            <div className="text-xs font-mono tabular-nums text-slate-300 max-w-md">
              {masterRenderJob.progress}% · {masterRenderJob.stepMessage}
            </div>
          </div>
        )}
      </div>

      {/* Timeline Scrubber & Transport Controls */}
      <div className="flex flex-col gap-2.5">
        <div className="flex items-center gap-3">
          <span className="text-xs font-mono tabular-nums text-slate-400 w-11">
            {formatTimecode(currentTimeSec)}
          </span>
          <input
            type="range"
            aria-label="Music video timeline scrubber"
            min={0}
            max={Math.max(1, durationSec)}
            step={0.25}
            value={currentTimeSec}
            onChange={(e) => {
              const nextSec = Number(e.target.value);
              studioAudioEngine.syncPlayhead(nextSec);
              onTimeUpdate(nextSec);
            }}
            className="flex-1 accent-violet-500 h-2 bg-slate-800 rounded-lg cursor-pointer"
          />
          <span className="text-xs font-mono tabular-nums text-slate-400 w-11 text-right">
            {formatTimecode(durationSec)}
          </span>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2.5 pt-1">
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => {
                setViewMode('compositor');
                onPlayStateChange(!isPlaying);
              }}
              className="min-h-[44px] px-4 py-2 bg-violet-600 hover:bg-violet-500 text-white text-xs font-semibold rounded-xl flex items-center gap-2 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              {isPlaying ? (
                <>
                  <Pause className="w-3.5 h-3.5" />
                  Pause Preview
                </>
              ) : (
                <>
                  <Play className="w-3.5 h-3.5" />
                  Play Master Preview
                </>
              )}
            </button>

            <button
              type="button"
              onClick={() => {
                onPlayStateChange(false);
                onTimeUpdate(0);
              }}
              aria-label="Restart playback from 00:00"
              className="min-h-[44px] px-3 py-2 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-200 text-xs font-medium rounded-xl flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Reset
            </button>

            <button
              type="button"
              onClick={() => setIsMuted(!isMuted)}
              aria-label={isMuted ? 'Unmute studio audio' : 'Mute studio audio'}
              className="min-h-[44px] px-3 py-2 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-200 text-xs font-medium rounded-xl flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              {isMuted ? (
                <>
                  <VolumeX className="w-3.5 h-3.5 text-rose-400" />
                  Muted
                </>
              ) : (
                <>
                  <Volume2 className="w-3.5 h-3.5 text-emerald-400" />
                  {bpm} BPM
                </>
              )}
            </button>

            <button
              type="button"
              onClick={handleDownloadThumbnail}
              className="min-h-[44px] px-3 py-2 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-200 text-xs font-medium rounded-xl flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              <Camera className="w-3.5 h-3.5 text-sky-400" />
              <span>Export Thumbnail</span>
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={onStartServerMp4Render}
              disabled={isJobRunning}
              className="min-h-[44px] px-4 py-2 bg-sky-500 hover:bg-sky-400 text-slate-950 text-xs font-bold rounded-xl flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0 cursor-pointer disabled:opacity-50"
            >
              <Video className="w-3.5 h-3.5" />
              {isJobRunning
                ? `FFmpeg Rendering ${masterRenderJob?.progress || 0}%...`
                : `Export Video MP4 (${exportResolution})`}
            </button>

            {finalDownloadUrl && (
              <a
                href={finalDownloadUrl}
                download
                className="min-h-[44px] px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-xl flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0"
              >
                <Download className="w-3.5 h-3.5" />
                Download MP4
              </a>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

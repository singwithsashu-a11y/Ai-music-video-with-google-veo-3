/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useCallback, useEffect, useState } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import {
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  query,
  serverTimestamp,
  setDoc,
  where,
} from 'firebase/firestore';
import {
  auth,
  db,
  handleFirestoreError,
  OperationType,
  signInWithGooglePopup,
  signOutStudioUser,
} from './firebase';
import {
  AudioTrackData,
  CharacterProfileItem,
  FlowAndProviderSettings,
  MusicVideoProject,
  StudioBackgroundJob,
  StudioNavTab,
} from './types/studio';
import {
  createInitialStudioProject,
  INITIAL_CHARACTERS,
  INITIAL_FLOW_SETTINGS,
  PRESET_STUDIO_TRACKS,
  STUDIO_ASSET_IMAGES,
} from './data/seedStudioData';
import { formatTimecode } from './utils/studioEngine';
import { CreateVideoWorkspace } from './components/CreateVideoWorkspace';
import { StoryboardWorkspace } from './components/StoryboardWorkspace';
import { VideoEditorWorkspace } from './components/VideoEditorWorkspace';
import { CharacterStudioWorkspace } from './components/CharacterStudioWorkspace';
import {
  AIToolsWorkspace,
  MusicLibraryWorkspace,
} from './components/MusicAndToolsWorkspace';
import {
  AdminControlPanelWorkspace,
  SubscriptionWorkspace,
} from './components/SubscriptionAndAdminWorkspace';
import {
  Clapperboard,
  Copy,
  CreditCard,
  Download,
  Film,
  FolderKanban,
  LayoutDashboard,
  LogIn,
  LogOut,
  Music,
  Plus,
  Scissors,
  Settings,
  ShieldCheck,
  Sparkles,
  Trash2,
  Users,
  Wand2,
} from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState<StudioNavTab>('dashboard');
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [authReady, setAuthReady] = useState<boolean>(false);

  const [projects, setProjects] = useState<MusicVideoProject[]>(() => [
    createInitialStudioProject(),
  ]);
  const [activeProjectId, setActiveProjectId] = useState<string>(
    'proj_midnight_neon_01'
  );
  const [characters, setCharacters] =
    useState<CharacterProfileItem[]>(INITIAL_CHARACTERS);
  const [tracks, setTracks] = useState<AudioTrackData[]>(PRESET_STUDIO_TRACKS);
  const [jobs, setJobs] = useState<StudioBackgroundJob[]>([]);
  const [flowSettings, setFlowSettings] =
    useState<FlowAndProviderSettings>(INITIAL_FLOW_SETTINGS);
  const [appCredits, setAppCredits] = useState<number>(500);
  const [currentPlan, setCurrentPlan] = useState<
    'free' | 'creator' | 'pro' | 'studio'
  >('free');
  const [renamingProjectId, setRenamingProjectId] = useState<string | null>(
    null
  );
  const [renameDraft, setRenameDraft] = useState<string>('');
  const [authErrorBanner, setAuthErrorBanner] = useState<string | null>(null);
  const [studioNotice, setStudioNotice] = useState<string | null>(null);

  const activeProject =
    projects.find((p) => p.id === activeProjectId) || projects[0];

  // Hydrate persistent state from server database (/storage/studio-db.json)
  const fetchBootstrapState = useCallback(async () => {
    try {
      const res = await fetch('/api/bootstrap');
      if (!res.ok) return;
      const data = await res.json();
      if (Array.isArray(data.projects) && data.projects.length > 0) {
        setProjects(data.projects);
      }
      if (Array.isArray(data.characters) && data.characters.length > 0) {
        setCharacters(data.characters);
      }
      if (Array.isArray(data.tracks) && data.tracks.length > 0) {
        setTracks(data.tracks);
      }
      if (Array.isArray(data.jobs)) {
        setJobs(data.jobs);
      }
      if (data.flowSettings) {
        setFlowSettings(data.flowSettings);
      }
    } catch {
      // Fallback to initial seed state if offline
    }
  }, []);

  useEffect(() => {
    void fetchBootstrapState();
  }, [fetchBootstrapState]);

  // Poll background jobs whenever any job is pending or processing
  const hasRunningJobs = jobs.some(
    (j) => j.status === 'pending' || j.status === 'processing'
  );

  useEffect(() => {
    if (!hasRunningJobs) return;
    const timer = window.setInterval(() => {
      void fetchBootstrapState();
    }, 1000);
    return () => window.clearInterval(timer);
  }, [hasRunningJobs, fetchBootstrapState]);

  // Listen to Firebase Auth state & sync user profile to backend
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      setAuthReady(true);
      if (user?.email) {
        setFlowSettings((prev) => ({
          ...prev,
          connectedGoogleEmail: user.email || prev.connectedGoogleEmail,
          flowConnected: true,
        }));
        void fetch('/api/users/sync', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            uid: user.uid,
            email: user.email,
            displayName: user.displayName || user.email.split('@')[0],
            photoURL: user.photoURL || undefined,
          }),
        });
      }
    });
    return () => unsub();
  }, []);

  // Sync user's Firestore projects when signed in
  useEffect(() => {
    if (!authReady || !currentUser) return;
    const q = query(
      collection(db, 'projects'),
      where('ownerId', '==', currentUser.uid)
    );
    const unsub = onSnapshot(
      q,
      (snap) => {
        if (snap.empty) return;
        const remoteMap = new Map<string, Record<string, unknown>>();
        snap.docs.forEach((d) => remoteMap.set(d.id, d.data()));
        setProjects((prev) =>
          prev.map((p) => {
            const remote = remoteMap.get(p.id);
            if (!remote) return p;
            return {
              ...p,
              title: String(remote.title || p.title),
              description: String(remote.description || p.description),
              status: (remote.status as MusicVideoProject['status']) || p.status,
            };
          })
        );
      },
      (error) => {
        try {
          handleFirestoreError(error, OperationType.LIST, 'projects');
        } catch {
          // Handled and logged
        }
      }
    );
    return () => unsub();
  }, [authReady, currentUser]);

  // Persist project metadata to Firestore if signed in
  const persistProjectToFirestore = async (proj: MusicVideoProject) => {
    if (!currentUser) return;
    const safeId = proj.id.replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 128);
    const projRef = doc(db, 'projects', safeId);
    try {
      await setDoc(
        projRef,
        {
          id: safeId,
          ownerId: currentUser.uid,
          title: proj.title.slice(0, 120),
          description: (proj.description || 'Cinematic AI Music Video').slice(0, 1000),
          directorStyle: proj.directorStyle.slice(0, 64),
          aspectRatio: proj.aspectRatio,
          resolution: proj.resolution,
          durationSec: Math.min(1800, Math.max(5, Math.round(proj.durationSec))),
          bpm: Math.min(260, Math.max(40, Math.round(proj.bpm))),
          musicalKey: (proj.musicalKey || 'C Minor').slice(0, 32),
          mood: (proj.mood || 'Cinematic').slice(0, 64),
          lyricsText: proj.lyricsText.slice(0, 10000),
          providerUsed: proj.providerUsed,
          status: proj.status,
          sceneCount: proj.scenes.length,
          completedScenes: proj.completedScenes,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      );
    } catch (error) {
      try {
        handleFirestoreError(error, OperationType.WRITE, `projects/${safeId}`);
      } catch {
        // Logged via handleFirestoreError
      }
    }
  };

  // Persist full project to server disk database (/storage/studio-db.json)
  const persistProjectToServer = async (proj: MusicVideoProject) => {
    try {
      await fetch(`/api/projects/${encodeURIComponent(proj.id)}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(proj),
      });
    } catch {
      // Handled optimistically
    }
  };

  const handleUpdateActiveProject = (updated: MusicVideoProject) => {
    setProjects((prev) =>
      prev.map((p) => (p.id === updated.id ? updated : p))
    );
    void persistProjectToServer(updated);
    void persistProjectToFirestore(updated);
  };

  const handleCreateNewProject = async () => {
    try {
      const res = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ownerId: currentUser?.uid || 'demo_user',
          title: `Studio Music Video #${projects.length + 1}`,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.project) {
          setProjects((prev) => [data.project, ...prev]);
          setActiveProjectId(data.project.id);
          setActiveTab('create');
          void persistProjectToFirestore(data.project);
          setStudioNotice(`Created new project "${data.project.title}" in database.`);
          return;
        }
      }
    } catch {
      // Fallback below
    }

    const base = createInitialStudioProject();
    const newId = `proj_${Date.now()}`;
    const newProj: MusicVideoProject = {
      ...base,
      id: newId,
      ownerId: currentUser?.uid || 'demo_user',
      title: `Studio Music Video #${projects.length + 1}`,
      updatedAtIso: new Date().toISOString(),
    };
    setProjects((prev) => [newProj, ...prev]);
    setActiveProjectId(newId);
    setActiveTab('create');
    void persistProjectToServer(newProj);
    void persistProjectToFirestore(newProj);
  };

  const handleDuplicateProject = async (target: MusicVideoProject) => {
    const dupId = `proj_copy_${Date.now()}`;
    const duplicated: MusicVideoProject = {
      ...target,
      id: dupId,
      title: `${target.title} (Copy)`,
      updatedAtIso: new Date().toISOString(),
    };
    setProjects((prev) => [duplicated, ...prev]);
    setActiveProjectId(dupId);
    void persistProjectToServer(duplicated);
    void persistProjectToFirestore(duplicated);
    setStudioNotice(`Duplicated project "${duplicated.title}".`);
  };

  const handleDeleteProject = async (projId: string) => {
    if (projects.length <= 1) return;
    const target = projects.find((p) => p.id === projId);
    const remaining = projects.filter((p) => p.id !== projId);
    setProjects(remaining);
    if (activeProjectId === projId) {
      setActiveProjectId(remaining[0].id);
    }
    try {
      await fetch(`/api/projects/${encodeURIComponent(projId)}`, {
        method: 'DELETE',
      });
    } catch {
      // Ignore network error
    }
    if (currentUser) {
      try {
        await deleteDoc(doc(db, 'projects', projId));
      } catch {
        // Ignore if not yet persisted remotely
      }
    }
    if (target) {
      setStudioNotice(`Deleted project "${target.title}" from database.`);
    }
  };

  const handleDeleteCharacter = async (charId: string) => {
    if (characters.length <= 1) return;
    setCharacters((prev) => prev.filter((c) => c.id !== charId));
    try {
      await fetch(`/api/characters/${encodeURIComponent(charId)}`, {
        method: 'DELETE',
      });
    } catch {
      // Ignore network error
    }
  };

  const handleGoogleSignIn = async () => {
    setAuthErrorBanner(null);
    try {
      await signInWithGooglePopup();
    } catch (err) {
      setAuthErrorBanner(
        err instanceof Error
          ? err.message
          : 'Google Sign-In popup was closed or blocked.'
      );
    }
  };

  const completedMp4Jobs = jobs.filter(
    (j) => j.status === 'completed' && (j.downloadUrl || j.outputUrl)
  );

  const navItems: {
    id: StudioNavTab;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
  }[] = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'create', label: 'Create Video', icon: Wand2 },
    { id: 'storyboard', label: 'Storyboard', icon: Film },
    { id: 'editor', label: 'Video Editor', icon: Scissors },
    { id: 'characters', label: 'Character Studio', icon: Users },
    { id: 'music', label: 'Music Library', icon: Music },
    { id: 'tools', label: 'AI Tools', icon: Sparkles },
    { id: 'projects', label: 'My Projects', icon: FolderKanban },
    { id: 'subscription', label: 'Subscription & Flow', icon: CreditCard },
    { id: 'admin', label: 'Admin Panel', icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-[#090D16] text-slate-100 flex flex-col md:flex-row">
      {/* Left Workspace Sidebar Navigation (256px on desktop) */}
      <aside className="w-full md:w-64 bg-[#0B101C] border-b md:border-b-0 md:border-r border-slate-800/90 shrink-0 flex flex-col justify-between">
        <div>
          {/* Brand Lockup */}
          <div className="px-5 py-4 border-b border-slate-800/90 flex items-center justify-between">
            <button
              type="button"
              onClick={() => setActiveTab('dashboard')}
              className="flex items-center gap-2.5 text-left cursor-pointer"
            >
              <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white shrink-0">
                <Clapperboard className="w-4 h-4" />
              </div>
              <span className="text-base font-bold tracking-tight text-white whitespace-nowrap">
                AI Music Video Studio
              </span>
            </button>
          </div>

          {/* Navigation Links */}
          <nav
            aria-label="Main Studio Navigation"
            className="p-3 flex md:flex-col gap-1 overflow-x-auto"
          >
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setActiveTab(item.id)}
                  className={`px-3 py-2.5 rounded-lg text-xs font-medium flex items-center gap-2.5 transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                    isActive
                      ? 'bg-indigo-600 text-white'
                      : 'text-slate-400 hover:text-slate-100 hover:bg-slate-900/80'
                  }`}
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Bottom Priority 1 Google Flow Status Summary */}
        <div className="hidden md:flex flex-col gap-3 p-4 m-3 bg-slate-950/90 border border-slate-800/90 rounded-xl text-xs">
          <div className="flex items-center justify-between">
            <span className="text-slate-400 font-medium">Provider Mode</span>
            <span className="text-emerald-400 font-semibold flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5" />
              Priority 1 Flow
            </span>
          </div>
          <div className="flex items-center justify-between font-mono tabular-nums">
            <span className="text-slate-400">Flow Balance</span>
            <span className="text-slate-200">
              {flowSettings.flowCreditsSelfReported} cr
            </span>
          </div>
          <div className="flex items-center justify-between font-mono tabular-nums">
            <span className="text-slate-400">Studio Balance</span>
            <span className="text-indigo-300">{appCredits} cr</span>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Bar Contract: Breadcrumb on left, Account & Primary CTA on right */}
        <header className="flex items-center justify-between gap-6 px-6 py-3.5 bg-[#0B101C]/90 border-b border-slate-800/90">
          <div className="flex items-center gap-2 text-xs text-slate-400 truncate">
            <span className="text-slate-200 font-semibold">Studio Workspace</span>
            <span aria-hidden="true">/</span>
            <span className="text-indigo-400 font-medium capitalize">
              {activeTab}
            </span>
            <span aria-hidden="true">·</span>
            <span className="truncate text-slate-300">{activeProject.title}</span>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            {currentUser ? (
              <div className="flex items-center gap-2.5 text-xs">
                {currentUser.photoURL && (
                  <img
                    src={currentUser.photoURL}
                    alt={currentUser.displayName || 'User'}
                    referrerPolicy="no-referrer"
                    className="w-6 h-6 rounded-full border border-slate-700"
                  />
                )}
                <span className="text-slate-300 hidden sm:inline">
                  {currentUser.displayName || currentUser.email}
                </span>
                <button
                  type="button"
                  onClick={signOutStudioUser}
                  className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 rounded-lg flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  Sign Out
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={handleGoogleSignIn}
                className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 text-xs font-medium rounded-lg flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              >
                <LogIn className="w-3.5 h-3.5 text-indigo-400" />
                Sign in with Google
              </button>
            )}

            <button
              type="button"
              onClick={() => void handleCreateNewProject()}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              Create New Project
            </button>
          </div>
        </header>

        {authErrorBanner && (
          <div className="mx-6 mt-4 bg-amber-950/50 border border-amber-500/40 rounded-lg px-4 py-2.5 text-xs text-amber-200 flex items-center justify-between">
            <span>{authErrorBanner}</span>
            <button
              type="button"
              onClick={() => setAuthErrorBanner(null)}
              className="text-amber-300 hover:text-white cursor-pointer"
            >
              Dismiss
            </button>
          </div>
        )}

        {studioNotice && (
          <div className="mx-6 mt-4 bg-emerald-950/50 border border-emerald-500/40 rounded-lg px-4 py-2.5 text-xs text-emerald-200 flex items-center justify-between">
            <span>{studioNotice}</span>
            <button
              type="button"
              onClick={() => setStudioNotice(null)}
              className="text-emerald-300 hover:text-white cursor-pointer"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Active View Viewport */}
        <main className="flex-1 p-6 max-w-[1440px] w-full mx-auto">
          {activeTab === 'dashboard' && (
            <div className="flex flex-col gap-6">
              {/* Hero Studio Banner */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 bg-[#0F1624] border border-slate-800 rounded-xl overflow-hidden items-stretch">
                <div className="lg:col-span-7 p-6 flex flex-col justify-between gap-5">
                  <div className="flex flex-col gap-2.5">
                    <div className="text-xs text-indigo-400 font-semibold tracking-wide">
                      AI FILM DIRECTOR · FFMPEG MP4 COMPILER · GOOGLE FLOW PRIORITY 1
                    </div>
                    <h1 className="text-2xl sm:text-3xl font-bold text-white leading-tight">
                      Transform Full-Length Songs & Lyrics into Cinematic Music Videos
                    </h1>
                    <p className="text-sm text-slate-300 leading-relaxed max-w-2xl">
                      Upload real MP3/WAV tracks, analyze song structure with Gemini AI, decode literal and metaphorical lyric imagery, edit camera optics in <strong>Director&apos;s Cut Mode</strong>, and render full-length H.264/AAC `.mp4` videos with burned-in subtitles.
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-3">
                    <button
                      type="button"
                      onClick={() => setActiveTab('create')}
                      className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-lg flex items-center gap-2 transition-colors cursor-pointer"
                    >
                      <Wand2 className="w-4 h-4" />
                      Launch Music-to-Video Generator
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveTab('storyboard')}
                      className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 text-xs font-semibold rounded-lg flex items-center gap-2 transition-colors cursor-pointer"
                    >
                      <Film className="w-4 h-4 text-indigo-400" />
                      Inspect Storyboard & Generate Clips
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveTab('editor')}
                      className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 text-xs font-semibold rounded-lg flex items-center gap-2 transition-colors cursor-pointer"
                    >
                      <Scissors className="w-4 h-4 text-cyan-400" />
                      Open Multi-Track Video Editor
                    </button>
                  </div>
                </div>

                <div className="lg:col-span-5 relative min-h-[220px]">
                  <img
                    src={STUDIO_ASSET_IMAGES.heroStudio}
                    alt="AI Music Video Studio Control Suite"
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#0F1624] via-transparent to-transparent lg:bg-gradient-to-r lg:from-[#0F1624] lg:via-transparent" />
                </div>
              </div>

              {/* 4-Column KPI Strip */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-[#0F1624] border border-slate-800 rounded-xl p-4">
                  <div className="text-xs text-slate-400">Total Studio Projects</div>
                  <div className="text-2xl font-bold font-mono tabular-nums text-white mt-1">
                    {projects.length}
                  </div>
                  <div className="text-xs text-slate-400 mt-1">
                    {activeProject.scenes.length} active scenes in timeline
                  </div>
                </div>

                <div className="bg-[#0F1624] border border-slate-800 rounded-xl p-4">
                  <div className="text-xs text-slate-400">
                    Lyric Symbolism Cues
                  </div>
                  <div className="text-2xl font-bold font-mono tabular-nums text-cyan-400 mt-1">
                    {activeProject.lyricSymbolism.length}
                  </div>
                  <div className="text-xs text-slate-400 mt-1">
                    Literal & metaphorical animations synced
                  </div>
                </div>

                <div className="bg-[#0F1624] border border-slate-800 rounded-xl p-4">
                  <div className="text-xs text-slate-400">
                    Priority 1 Flow Credits
                  </div>
                  <div className="text-2xl font-bold font-mono tabular-nums text-emerald-400 mt-1">
                    {flowSettings.flowCreditsSelfReported}
                  </div>
                  <div className="text-xs text-slate-400 mt-1">
                    Connected: {flowSettings.connectedGoogleEmail}
                  </div>
                </div>

                <div className="bg-[#0F1624] border border-slate-800 rounded-xl p-4">
                  <div className="text-xs text-slate-400">
                    Rendered MP4 Videos
                  </div>
                  <div className="text-2xl font-bold font-mono tabular-nums text-indigo-400 mt-1">
                    {completedMp4Jobs.length}
                  </div>
                  <div className="text-xs text-slate-400 mt-1">
                    FFmpeg H.264 + AAC downloadable MP4s
                  </div>
                </div>
              </div>

              {/* Recent Projects & Saved Characters */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                <div className="lg:col-span-7 bg-[#0F1624] border border-slate-800 rounded-xl p-5 flex flex-col gap-4">
                  <div className="flex items-center justify-between">
                    <h2 className="text-base font-bold text-slate-100">
                      Active Music Video Projects
                    </h2>
                    <button
                      type="button"
                      onClick={() => void handleCreateNewProject()}
                      className="text-xs text-indigo-400 hover:text-indigo-300 font-semibold cursor-pointer"
                    >
                      + New Project
                    </button>
                  </div>

                  <div className="space-y-3">
                    {projects.map((proj) => (
                      <div
                        key={proj.id}
                        className="p-3.5 bg-slate-950/80 border border-slate-800 rounded-lg flex flex-wrap items-center justify-between gap-3"
                      >
                        <div className="flex items-center gap-3">
                          <img
                            src={
                              proj.scenes[0]?.backdropImageUrl ||
                              STUDIO_ASSET_IMAGES.sceneIntro
                            }
                            alt={proj.title}
                            referrerPolicy="no-referrer"
                            className="w-14 h-10 rounded object-cover bg-slate-900 shrink-0"
                          />
                          <div>
                            <div className="text-sm font-bold text-slate-100">
                              {proj.title}
                            </div>
                            <div className="text-xs text-slate-400">
                              {proj.directorStyle} · {formatTimecode(proj.durationSec)} ·{' '}
                              {proj.scenes.length} Scenes · {proj.aspectRatio}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          {proj.renderedMasterDownloadUrl && (
                            <a
                              href={proj.renderedMasterDownloadUrl}
                              download
                              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-lg flex items-center gap-1"
                            >
                              <Download className="w-3.5 h-3.5" />
                              Download MP4
                            </a>
                          )}
                          <button
                            type="button"
                            onClick={() => {
                              setActiveProjectId(proj.id);
                              setActiveTab('editor');
                            }}
                            className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-lg cursor-pointer"
                          >
                            Open Studio
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Saved Characters Quick Card */}
                <div className="lg:col-span-5 bg-[#0F1624] border border-slate-800 rounded-xl p-5 flex flex-col gap-4">
                  <div className="flex items-center justify-between">
                    <h2 className="text-base font-bold text-slate-100">
                      Consistent Character Cast
                    </h2>
                    <button
                      type="button"
                      onClick={() => setActiveTab('characters')}
                      className="text-xs text-indigo-400 hover:text-indigo-300 font-semibold cursor-pointer"
                    >
                      Manage Character Studio
                    </button>
                  </div>

                  <div className="space-y-3">
                    {characters.map((char) => (
                      <div
                        key={char.id}
                        className="p-3 bg-slate-950/80 border border-slate-800 rounded-lg flex items-center gap-3"
                      >
                        <img
                          src={char.referenceImageUrl}
                          alt={char.name}
                          referrerPolicy="no-referrer"
                          className="w-12 h-12 rounded-lg object-cover shrink-0 bg-slate-900"
                        />
                        <div className="min-w-0 flex-1">
                          <div className="text-xs font-bold text-slate-100">
                            {char.name} ·{' '}
                            <span className="font-normal text-indigo-400">
                              {char.role}
                            </span>
                          </div>
                          <div className="text-[11px] text-slate-400 truncate mt-0.5">
                            Wardrobe Lock: {char.wardrobeLock}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'create' && (
            <CreateVideoWorkspace
              project={activeProject}
              characters={characters}
              tracks={tracks}
              flowSettings={flowSettings}
              onUpdateProject={handleUpdateActiveProject}
              onTrackUploaded={(newTrack) =>
                setTracks((prev) => [newTrack, ...prev.filter((t) => t.id !== newTrack.id)])
              }
              onUpdateFlowSettings={setFlowSettings}
              onNavigateTab={(tab) => setActiveTab(tab)}
            />
          )}

          {activeTab === 'storyboard' && (
            <StoryboardWorkspace
              project={activeProject}
              characters={characters}
              flowSettings={flowSettings}
              jobs={jobs}
              onUpdateProject={handleUpdateActiveProject}
              onRefreshJobs={() => void fetchBootstrapState()}
              onNavigateEditor={() => setActiveTab('editor')}
            />
          )}

          {activeTab === 'editor' && (
            <VideoEditorWorkspace
              project={activeProject}
              characters={characters}
              jobs={jobs}
              onUpdateProject={handleUpdateActiveProject}
              onRefreshJobs={() => void fetchBootstrapState()}
              onSaveProjectExplicitly={handleUpdateActiveProject}
            />
          )}

          {activeTab === 'characters' && (
            <CharacterStudioWorkspace
              characters={characters}
              selectedCharacterIds={activeProject.selectedCharacterIds}
              onAddCharacter={(newChar) =>
                setCharacters((prev) => [newChar, ...prev])
              }
              onDeleteCharacter={(charId) => void handleDeleteCharacter(charId)}
              onToggleProjectCharacter={(charId) => {
                const exists = activeProject.selectedCharacterIds.includes(charId);
                const nextIds = exists
                  ? activeProject.selectedCharacterIds.filter((id) => id !== charId)
                  : [...activeProject.selectedCharacterIds, charId];
                handleUpdateActiveProject({
                  ...activeProject,
                  selectedCharacterIds: nextIds,
                });
              }}
            />
          )}

          {activeTab === 'music' && (
            <MusicLibraryWorkspace
              project={activeProject}
              tracks={tracks}
              onTrackUploaded={(newTrack) =>
                setTracks((prev) => [newTrack, ...prev.filter((t) => t.id !== newTrack.id)])
              }
              onUpdateProject={handleUpdateActiveProject}
            />
          )}

          {activeTab === 'tools' && (
            <AIToolsWorkspace
              project={activeProject}
              onUpdateProject={handleUpdateActiveProject}
              onTrackUploaded={(newTrack) =>
                setTracks((prev) => [newTrack, ...prev.filter((t) => t.id !== newTrack.id)])
              }
            />
          )}

          {activeTab === 'projects' && (
            <div className="flex flex-col gap-6">
              <div className="bg-[#0F1624] border border-slate-800 rounded-xl p-5 flex flex-wrap items-center justify-between gap-4">
                <div>
                  <h2 className="text-lg font-bold text-slate-100">
                    My Music Video Projects & Export History
                  </h2>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Create, rename, duplicate, auto-save, download rendered MP4s, or delete full-length music video projects.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => void handleCreateNewProject()}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-lg flex items-center gap-1.5 cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  New Project
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {projects.map((proj) => (
                  <div
                    key={proj.id}
                    className="bg-[#0F1624] border border-slate-800 rounded-xl p-5 flex flex-col justify-between gap-4"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        {renamingProjectId === proj.id ? (
                          <div className="flex items-center gap-2">
                            <input
                              type="text"
                              aria-label="New project title"
                              value={renameDraft}
                              onChange={(e) => setRenameDraft(e.target.value)}
                              className="bg-slate-950 border border-indigo-500 rounded px-2.5 py-1 text-xs text-white"
                            />
                            <button
                              type="button"
                              onClick={() => {
                                if (renameDraft.trim()) {
                                  handleUpdateActiveProject({
                                    ...proj,
                                    title: renameDraft.trim(),
                                  });
                                }
                                setRenamingProjectId(null);
                              }}
                              className="px-2.5 py-1 bg-indigo-600 text-white text-xs rounded cursor-pointer"
                            >
                              Save
                            </button>
                          </div>
                        ) : (
                          <h3 className="text-base font-bold text-slate-100 truncate">
                            {proj.title}
                          </h3>
                        )}
                        <div className="text-xs text-slate-400 mt-1">
                          {proj.directorStyle} · {formatTimecode(proj.durationSec)} ·{' '}
                          {proj.scenes.length} Scenes · {proj.resolution}
                        </div>
                      </div>

                      <span className="text-xs font-mono text-emerald-400">
                        {proj.status.replace('_', ' ')}
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center justify-between gap-2 pt-3 border-t border-slate-800">
                      <div className="flex flex-wrap items-center gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            setActiveProjectId(proj.id);
                            setActiveTab('editor');
                          }}
                          className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-lg cursor-pointer"
                        >
                          Resume Project
                        </button>
                        {proj.renderedMasterDownloadUrl && (
                          <a
                            href={proj.renderedMasterDownloadUrl}
                            download
                            className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-lg flex items-center gap-1"
                          >
                            <Download className="w-3.5 h-3.5" />
                            Download MP4
                          </a>
                        )}
                        <button
                          type="button"
                          onClick={() => {
                            setRenamingProjectId(proj.id);
                            setRenameDraft(proj.title);
                          }}
                          className="px-2.5 py-1.5 bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 text-xs rounded-lg cursor-pointer"
                        >
                          Rename
                        </button>
                        <button
                          type="button"
                          onClick={() => void handleDuplicateProject(proj)}
                          className="px-2.5 py-1.5 bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 text-xs rounded-lg flex items-center gap-1 cursor-pointer"
                        >
                          <Copy className="w-3 h-3" />
                          Duplicate
                        </button>
                      </div>

                      {projects.length > 1 && (
                        <button
                          type="button"
                          aria-label={`Delete ${proj.title}`}
                          onClick={() => void handleDeleteProject(proj.id)}
                          className="p-1.5 text-rose-400 hover:bg-rose-950/40 rounded-lg cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'subscription' && (
            <SubscriptionWorkspace
              flowSettings={flowSettings}
              appCredits={appCredits}
              currentPlan={currentPlan}
              projects={projects}
              onUpdateFlowSettings={setFlowSettings}
              onSelectPlan={(plan, bonus) => {
                setCurrentPlan(plan);
                setAppCredits((c) => c + bonus);
              }}
            />
          )}

          {activeTab === 'admin' && (
            <AdminControlPanelWorkspace
              flowSettings={flowSettings}
              projects={projects}
              onUpdateFlowSettings={setFlowSettings}
              onDeleteProject={(id) => void handleDeleteProject(id)}
              onRefreshJobs={() => void fetchBootstrapState()}
            />
          )}
        </main>
      </div>
    </div>
  );
}

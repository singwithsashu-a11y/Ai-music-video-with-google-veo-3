/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useCallback, useEffect, useState } from 'react';
import { User } from 'firebase/auth';
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
  db,
  handleFirestoreError,
  initAuth,
  OperationType,
  signInWithGooglePopup,
  signOutStudioUser,
} from './firebase';
import {
  AudioTrackData,
  CharacterProfileItem,
  FlowAndProviderSettings,
  MusicVideoProject,
  PromptStudioItem,
  StudioBackgroundJob,
  StudioNavTab,
} from './types/studio';
import {
  createEmptyProductionProject,
  INITIAL_CHARACTERS,
  INITIAL_FLOW_SETTINGS,
  STUDIO_ASSET_IMAGES,
} from './data/seedStudioData';
import { formatTimecode } from './utils/studioEngine';
import { CreateVideoWorkspace } from './components/CreateVideoWorkspace';
import { PromptStudioWorkspace } from './components/PromptStudioWorkspace';
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
  GoogleDriveWorkspace,
  OfficialGoogleSignInButton,
} from './components/GoogleDriveWorkspace';
import {
  BookOpen,
  Clapperboard,
  Copy,
  CreditCard,
  Download,
  Film,
  FolderKanban,
  HardDrive,
  LayoutDashboard,
  LogOut,
  Menu,
  Music,
  Plus,
  Scissors,
  Settings,
  ShieldCheck,
  Sliders,
  Sparkles,
  Trash2,
  Users,
  Wand2,
  X,
} from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState<StudioNavTab>('dashboard');
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [googleAccessToken, setGoogleAccessToken] = useState<string | null>(null);
  const [needsGoogleAuth, setNeedsGoogleAuth] = useState<boolean>(true);
  const [isLoggingInGoogle, setIsLoggingInGoogle] = useState<boolean>(false);
  const [authReady, setAuthReady] = useState<boolean>(false);
  const [isDemoMode, setIsDemoMode] = useState<boolean>(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState<boolean>(false);
  const [showOnboardingGuide, setShowOnboardingGuide] = useState<boolean>(false);

  const [projects, setProjects] = useState<MusicVideoProject[]>(() => [
    createEmptyProductionProject({
      id: 'proj_init_production',
      title: 'Untitled Music Video #1',
    }),
  ]);
  const [activeProjectId, setActiveProjectId] = useState<string>(
    'proj_init_production'
  );
  const [characters, setCharacters] =
    useState<CharacterProfileItem[]>(INITIAL_CHARACTERS);
  const [tracks, setTracks] = useState<AudioTrackData[]>([]);
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

  // Hydrate persistent state from server database (/storage/studio-db.json), strictly isolated by demoMode
  const fetchBootstrapState = useCallback(
    async (demoFlag = isDemoMode) => {
      try {
        const res = await fetch(
          `/api/bootstrap?demoMode=${demoFlag ? 'true' : 'false'}`
        );
        if (!res.ok) return;
        const data = await res.json();
        if (Array.isArray(data.projects) && data.projects.length > 0) {
          setProjects(data.projects);
          setActiveProjectId((prevId) =>
            data.projects.some((p: MusicVideoProject) => p.id === prevId)
              ? prevId
              : data.projects[0].id
          );
        }
        if (Array.isArray(data.characters) && data.characters.length > 0) {
          setCharacters(data.characters);
        }
        if (Array.isArray(data.tracks)) {
          setTracks(data.tracks);
        }
        if (Array.isArray(data.jobs)) {
          setJobs(data.jobs);
        }
        if (data.flowSettings) {
          setFlowSettings(data.flowSettings);
        }
      } catch {
        // Fallback to initial empty production state if offline
      }
    },
    [isDemoMode]
  );

  useEffect(() => {
    void fetchBootstrapState(isDemoMode);
  }, [fetchBootstrapState, isDemoMode, activeTab]);

  // Poll background jobs whenever any job is QUEUED or PROCESSING
  const hasRunningJobs = jobs.some(
    (j) =>
      j.status === 'QUEUED' ||
      j.status === 'PROCESSING' ||
      j.status === 'pending' ||
      j.status === 'processing'
  );

  useEffect(() => {
    if (!hasRunningJobs) return;
    const timer = window.setInterval(() => {
      void fetchBootstrapState(isDemoMode);
    }, 900);
    return () => window.clearInterval(timer);
  }, [hasRunningJobs, fetchBootstrapState, isDemoMode]);

  // Listen to Firebase Auth state & in-memory OAuth token state
  useEffect(() => {
    const unsub = initAuth(
      (user, token) => {
        setCurrentUser(user);
        setGoogleAccessToken(token);
        setNeedsGoogleAuth(!token);
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
      },
      () => {
        setCurrentUser(null);
        setGoogleAccessToken(null);
        setNeedsGoogleAuth(true);
        setAuthReady(true);
      }
    );
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
              status:
                (remote.status as MusicVideoProject['status']) || p.status,
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
          description: (proj.description || 'Cinematic AI Music Video').slice(
            0,
            1000
          ),
          directorStyle: proj.directorStyle.slice(0, 64),
          aspectRatio: proj.aspectRatio,
          resolution: proj.resolution,
          durationSec: Math.min(
            1800,
            Math.max(5, Math.round(proj.durationSec))
          ),
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
    if (isDemoMode) {
      setIsDemoMode(false);
    }
    try {
      const res = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ownerId: currentUser?.uid || 'admin_primary',
          title: `Untitled Music Video #${projects.length + 1}`,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.project) {
          setProjects((prev) => [
            data.project,
            ...prev.filter((p) => !p.isDemoProject),
          ]);
          setActiveProjectId(data.project.id);
          setActiveTab('create');
          void persistProjectToFirestore(data.project);
          setStudioNotice(
            `Created empty isolated project "${data.project.title}" (ID: ${data.project.id}). Upload your song to begin.`
          );
          return;
        }
      }
    } catch {
      // Fallback below
    }

    const newId = `proj_${Date.now()}`;
    const newProj = createEmptyProductionProject({
      id: newId,
      ownerId: currentUser?.uid || 'admin_primary',
      title: `Untitled Music Video #${projects.length + 1}`,
    });
    setProjects((prev) => [newProj, ...prev.filter((p) => !p.isDemoProject)]);
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

  const handleSyncCharactersToAllScenes = () => {
    const activeCast = characters.filter((c) =>
      activeProject.selectedCharacterIds.includes(c.id)
    );
    if (activeCast.length === 0) {
      setStudioNotice(
        'Select at least one character in Character Studio before syncing cast consistency locks.'
      );
      return;
    }
    const castAnchorSummary = activeCast
      .map(
        (c) =>
          `${c.name} (${c.age || '25'}, ${c.appearancePrompt}, wearing ${c.wardrobeLock}, hairstyle: ${c.hairstyleLock}, expression: ${c.facialExpression || 'cinematic'})`
      )
      .join(' | ');

    const updatedScenes = activeProject.scenes.map((sc) => ({
      ...sc,
      characterAnchorPrompt: `Consistent Character Identity Lock: ${castAnchorSummary}`,
      visualPrompt: sc.visualPrompt.includes('Consistent Character Identity Lock:')
        ? sc.visualPrompt
        : `${sc.visualPrompt} Consistent Character Identity Lock: ${castAnchorSummary}.`,
    }));

    handleUpdateActiveProject({
      ...activeProject,
      scenes: updatedScenes,
      updatedAtIso: new Date().toISOString(),
    });
    setStudioNotice(
      `Injected ${activeCast.length} character identity & wardrobe lock(s) across all ${updatedScenes.length} scenes.`
    );
  };

  const handleTriggerSceneGenerationFromPromptStudio = async (
    targetScene: MusicVideoProject['scenes'][number]
  ) => {
    try {
      const res = await fetch('/api/video/generate-scene', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId: activeProject.id,
          sceneId: targetScene.id,
          sceneIndex: targetScene.index,
          title: targetScene.title,
          visualPrompt:
            targetScene.promptStudioItem?.compiledMasterPrompt ||
            targetScene.visualPrompt,
          cameraAngle: targetScene.cameraAngle,
          cameraMovement: targetScene.cameraMovement,
          lightingStyle: targetScene.lighting,
          durationSec: targetScene.durationSec,
          startTimeSec: targetScene.startTimeSec,
          endTimeSec: targetScene.endTimeSec,
          directorStyle: activeProject.directorStyle,
          aspectRatio: activeProject.aspectRatio,
          resolution: activeProject.resolution,
          lyricLine: targetScene.showLyricsInScene ? targetScene.lyricExcerpt : '',
          audioTrackUrl: activeProject.audioTrack?.audioUrl,
        }),
      });
      if (res.ok) {
        setStudioNotice(
          `Started rendering Scene #${targetScene.index} ("${targetScene.title}") with your Prompt Studio configuration.`
        );
        void fetchBootstrapState(isDemoMode);
      }
    } catch {
      setStudioNotice('Queued scene clip render in studio background worker.');
    }
  };

  const handleGoogleSignIn = async () => {
    setAuthErrorBanner(null);
    setIsLoggingInGoogle(true);
    try {
      const result = await signInWithGooglePopup();
      if (result) {
        setCurrentUser(result.user);
        setGoogleAccessToken(result.accessToken);
        setNeedsGoogleAuth(!result.accessToken);
        setStudioNotice(
          `Signed in as ${result.user.displayName || result.user.email}. Google Drive cloud sync is ready.`
        );
      }
    } catch (err) {
      setAuthErrorBanner(
        err instanceof Error
          ? err.message
          : 'Google Sign-In popup was closed or blocked.'
      );
    } finally {
      setIsLoggingInGoogle(false);
    }
  };

  const handleSignOut = async () => {
    await signOutStudioUser();
    setCurrentUser(null);
    setGoogleAccessToken(null);
    setNeedsGoogleAuth(true);
  };

  const completedMp4Jobs = jobs.filter(
    (j) =>
      (j.status === 'COMPLETED' || j.status === 'completed') &&
      (j.downloadUrl || j.outputUrl)
  );

  const navItems: {
    id: StudioNavTab;
    label: string;
    shortLabel: string;
    icon: React.ComponentType<{ className?: string }>;
  }[] = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      shortLabel: 'Home',
      icon: LayoutDashboard,
    },
    {
      id: 'create',
      label: 'Create Video',
      shortLabel: 'Create',
      icon: Wand2,
    },
    {
      id: 'prompts',
      label: 'Prompt Studio',
      shortLabel: 'Prompts',
      icon: Sliders,
    },
    {
      id: 'storyboard',
      label: 'Storyboard',
      shortLabel: 'Scenes',
      icon: Film,
    },
    {
      id: 'editor',
      label: 'Video Editor',
      shortLabel: 'Editor',
      icon: Scissors,
    },
    {
      id: 'characters',
      label: 'Character Studio',
      shortLabel: 'Cast',
      icon: Users,
    },
    {
      id: 'music',
      label: 'Music Library',
      shortLabel: 'Music',
      icon: Music,
    },
    {
      id: 'tools',
      label: 'AI Tools',
      shortLabel: 'AI Tools',
      icon: Sparkles,
    },
    {
      id: 'projects',
      label: 'Projects & Drive',
      shortLabel: 'Drive',
      icon: FolderKanban,
    },
    {
      id: 'subscription',
      label: 'Subscription & Flow',
      shortLabel: 'Flow',
      icon: CreditCard,
    },
    {
      id: 'admin',
      label: 'Admin Panel',
      shortLabel: 'Admin',
      icon: Settings,
    },
  ];

  // Primary 5 mobile bottom navigation items (<= 15% sticky viewport height)
  const mobileBottomTabs: StudioNavTab[] = [
    'dashboard',
    'create',
    'prompts',
    'storyboard',
    'editor',
  ];

  return (
    <div className="min-h-screen bg-[#07090F] text-slate-100 flex flex-col md:flex-row pb-16 md:pb-0 overflow-x-hidden">
      {/* Desktop Left Workspace Sidebar Navigation (256px on desktop) */}
      <aside className="hidden md:flex md:w-64 bg-[#0B0F19] border-r border-slate-800/80 shrink-0 flex-col justify-between">
        <div>
          {/* Brand Lockup */}
          <div className="px-5 py-4 border-b border-slate-800/80 flex items-center justify-between">
            <button
              type="button"
              onClick={() => setActiveTab('dashboard')}
              className="flex items-center gap-2.5 text-left cursor-pointer"
            >
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center text-white shrink-0 shadow-sm">
                <Clapperboard className="w-4 h-4" />
              </div>
              <div>
                <span className="text-sm font-bold tracking-tight text-white block leading-none">
                  AI Music Video Studio
                </span>
                <span className="text-[10px] font-mono text-violet-400 tracking-wider uppercase mt-0.5 block">
                  Pro Director Suite
                </span>
              </div>
            </button>
          </div>

          {/* Navigation Links */}
          <nav
            aria-label="Main Studio Navigation"
            className="p-3 flex flex-col gap-1"
          >
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setActiveTab(item.id)}
                  className={`px-3 py-2.5 rounded-xl text-xs font-medium flex items-center gap-2.5 transition-all whitespace-nowrap shrink-0 cursor-pointer ${
                    isActive
                      ? 'bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-sm'
                      : 'text-slate-400 hover:text-slate-100 hover:bg-slate-900/90'
                  }`}
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Bottom Provider Status Summary */}
        <div className="flex flex-col gap-2.5 p-4 m-3 bg-[#07090F] border border-slate-800/90 rounded-2xl text-xs">
          <div className="flex items-center justify-between">
            <span className="text-slate-400 font-medium">Active Engine</span>
            <span className="text-emerald-400 font-semibold flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5" />
              {flowSettings.preferredProvider === 'procedural_cinema_priority_3'
                ? 'Priority 3 Engine'
                : flowSettings.preferredProvider === 'google_veo_api_priority_2'
                  ? 'Priority 2 Veo'
                  : 'Priority 1 Flow'}
            </span>
          </div>
          <div className="flex items-center justify-between font-mono tabular-nums">
            <span className="text-slate-400">Google Drive</span>
            <span
              className={
                googleAccessToken && !needsGoogleAuth
                  ? 'text-emerald-400'
                  : 'text-slate-400'
              }
            >
              {googleAccessToken && !needsGoogleAuth ? 'CONNECTED' : 'READY'}
            </span>
          </div>
          <div className="flex items-center justify-between font-mono tabular-nums">
            <span className="text-slate-400">Environment</span>
            <span className={isDemoMode ? 'text-amber-300' : 'text-emerald-400'}>
              {isDemoMode ? 'DEV DEMO' : 'PRODUCTION'}
            </span>
          </div>
          <div className="flex items-center justify-between font-mono tabular-nums">
            <span className="text-slate-400">Studio Balance</span>
            <span className="text-violet-300">{appCredits} cr</span>
          </div>
        </div>
      </aside>

      {/* Mobile Collapsible Navigation Drawer */}
      {mobileMenuOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Mobile Studio Menu"
          className="md:hidden fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex"
        >
          <div className="w-72 max-w-[82vw] bg-[#0B0F19] border-r border-slate-800 h-full flex flex-col justify-between p-4 overflow-y-auto">
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-violet-600 flex items-center justify-center text-white">
                    <Clapperboard className="w-4 h-4" />
                  </div>
                  <span className="text-sm font-bold text-white">
                    AI Music Video Studio
                  </span>
                </div>
                <button
                  type="button"
                  aria-label="Close mobile menu"
                  onClick={() => setMobileMenuOpen(false)}
                  className="p-1.5 text-slate-400 hover:text-white rounded-lg"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <nav className="flex flex-col gap-1">
                {navItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = activeTab === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => {
                        setActiveTab(item.id);
                        setMobileMenuOpen(false);
                      }}
                      className={`px-3.5 py-2.5 rounded-xl text-xs font-medium flex items-center gap-2.5 text-left ${
                        isActive
                          ? 'bg-violet-600 text-white'
                          : 'text-slate-300 hover:bg-slate-900'
                      }`}
                    >
                      <Icon className="w-4 h-4 shrink-0" />
                      <span>{item.label}</span>
                    </button>
                  );
                })}
              </nav>
            </div>

            <div className="pt-4 border-t border-slate-800 space-y-2 text-xs">
              <button
                type="button"
                onClick={() => {
                  setIsDemoMode((prev) => !prev);
                  setMobileMenuOpen(false);
                }}
                className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-slate-300 font-mono text-left"
              >
                Dev Demo Mode: {isDemoMode ? 'ON' : 'OFF'}
              </button>
            </div>
          </div>
          <div
            className="flex-1"
            onClick={() => setMobileMenuOpen(false)}
          />
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Bar Contract */}
        <header className="flex items-center justify-between gap-3 px-4 sm:px-6 py-3 bg-[#0B0F19]/95 border-b border-slate-800/80 sticky top-0 z-30 backdrop-blur-md">
          <div className="flex items-center gap-2.5 min-w-0">
            <button
              type="button"
              aria-label="Open studio navigation drawer"
              onClick={() => setMobileMenuOpen(true)}
              className="md:hidden p-2 rounded-lg bg-slate-900 border border-slate-800 text-slate-200 shrink-0"
            >
              <Menu className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-2 text-xs text-slate-400 truncate">
              <span className="text-slate-200 font-semibold hidden sm:inline">
                Studio Workspace
              </span>
              <span aria-hidden="true" className="hidden sm:inline">
                /
              </span>
              <span className="text-violet-400 font-semibold capitalize">
                {activeTab === 'prompts' ? 'Prompt Studio' : activeTab}
              </span>
              <span aria-hidden="true">·</span>
              <span className="truncate text-slate-300 font-medium">
                {activeProject.title} ({formatTimecode(activeProject.durationSec)})
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => setActiveTab('projects')}
              className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 text-xs font-medium cursor-pointer transition-colors"
            >
              <HardDrive className="w-3.5 h-3.5 text-violet-400" />
              <span>Google Drive</span>
            </button>

            <button
              type="button"
              onClick={() => {
                const nextMode = !isDemoMode;
                setIsDemoMode(nextMode);
                setStudioNotice(
                  nextMode
                    ? 'Switched to isolated Development Demo Mode (Sandbox data is strictly separated from your real projects).'
                    : 'Switched to Production Mode (Real isolated user projects).'
                );
              }}
              className={`hidden sm:inline-flex px-3 py-1.5 rounded-lg text-xs font-mono border cursor-pointer transition-colors ${
                isDemoMode
                  ? 'bg-amber-950/60 border-amber-500/50 text-amber-300'
                  : 'bg-slate-900 border-slate-700 text-slate-300 hover:text-white'
              }`}
            >
              Dev Demo Mode: {isDemoMode ? 'ON' : 'OFF'}
            </button>

            {currentUser && !needsGoogleAuth ? (
              <div className="flex items-center gap-2 text-xs">
                {currentUser.photoURL && (
                  <img
                    src={currentUser.photoURL}
                    alt={currentUser.displayName || 'User'}
                    referrerPolicy="no-referrer"
                    className="w-6 h-6 rounded-full border border-slate-700 hidden sm:block"
                  />
                )}
                <span className="text-slate-300 hidden xl:inline max-w-[140px] truncate">
                  {currentUser.displayName || currentUser.email}
                </span>
                <button
                  type="button"
                  onClick={() => void handleSignOut()}
                  className="px-2.5 py-1.5 bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 rounded-lg flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Sign Out</span>
                </button>
              </div>
            ) : (
              <OfficialGoogleSignInButton
                onClick={() => void handleGoogleSignIn()}
                disabled={isLoggingInGoogle}
                label={
                  isLoggingInGoogle
                    ? 'Signing in...'
                    : currentUser && needsGoogleAuth
                      ? 'Connect Google Drive'
                      : 'Sign in with Google'
                }
              />
            )}

            <button
              data-testid="create-new-project-btn"
              type="button"
              onClick={() => void handleCreateNewProject()}
              className="px-3.5 py-2 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-all whitespace-nowrap shrink-0 cursor-pointer shadow-sm"
            >
              <Plus className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Create New Project</span>
              <span className="sm:hidden">New</span>
            </button>
          </div>
        </header>

        {authErrorBanner && (
          <div className="mx-4 sm:mx-6 mt-4 bg-amber-950/50 border border-amber-500/40 rounded-xl px-4 py-2.5 text-xs text-amber-200 flex items-center justify-between gap-2">
            <span>{authErrorBanner}</span>
            <button
              type="button"
              onClick={() => setAuthErrorBanner(null)}
              className="text-amber-300 hover:text-white cursor-pointer shrink-0"
            >
              Dismiss
            </button>
          </div>
        )}

        {studioNotice && (
          <div className="mx-4 sm:mx-6 mt-4 bg-emerald-950/50 border border-emerald-500/40 rounded-xl px-4 py-2.5 text-xs text-emerald-200 flex items-center justify-between gap-2">
            <span>{studioNotice}</span>
            <button
              type="button"
              onClick={() => setStudioNotice(null)}
              className="text-emerald-300 hover:text-white cursor-pointer shrink-0"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Active View Viewport */}
        <main className="flex-1 p-4 sm:p-6 max-w-[1440px] w-full mx-auto">
          {activeTab === 'dashboard' && (
            <div className="flex flex-col gap-6">
              {/* Hero Studio Banner */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 bg-[#0B0F19] border border-slate-800/90 rounded-2xl overflow-hidden items-stretch shadow-xl">
                <div className="lg:col-span-7 p-5 sm:p-7 flex flex-col justify-between gap-5">
                  <div className="flex flex-col gap-2.5">
                    <div className="text-[11px] font-mono text-violet-400 font-semibold tracking-wider uppercase">
                      STORY-DRIVEN AI CINEMA · ADVANCED PROMPT STUDIO · GOOGLE DRIVE CLOUD · FFMPEG MP4
                    </div>
                    <h1 className="text-2xl sm:text-3xl font-bold text-white leading-tight">
                      Professional AI Music Video Production Studio
                    </h1>
                    <p className="text-xs sm:text-sm text-slate-300 leading-relaxed max-w-2xl">
                      Upload MP3 or WAV masters, analyze real BPM and musical sections, craft story-driven visual narratives in the 13-parameter AI Prompt Studio, lock character identity across every shot, grade cinema color, sync cuts to beats, and export clean or subtitled H.264 `.mp4` videos to disk or Google Drive.
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-2.5">
                    <button
                      type="button"
                      onClick={() => setActiveTab('create')}
                      className="px-4 py-2.5 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white text-xs font-semibold rounded-xl flex items-center gap-2 transition-all cursor-pointer shadow-sm"
                    >
                      <Wand2 className="w-4 h-4" />
                      Create Music Video
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveTab('prompts')}
                      className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 border border-violet-500/40 text-violet-200 text-xs font-semibold rounded-xl flex items-center gap-2 transition-colors cursor-pointer"
                    >
                      <Sliders className="w-4 h-4 text-violet-400" />
                      Open AI Prompt Studio
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveTab('storyboard')}
                      className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 text-xs font-semibold rounded-xl flex items-center gap-2 transition-colors cursor-pointer"
                    >
                      <Film className="w-4 h-4 text-indigo-400" />
                      Storyboard ({activeProject.scenes.length})
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveTab('editor')}
                      className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 text-xs font-semibold rounded-xl flex items-center gap-2 transition-colors cursor-pointer"
                    >
                      <Scissors className="w-4 h-4 text-sky-400" />
                      Multi-Track Editor
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowOnboardingGuide((v) => !v)}
                      className="px-3.5 py-2.5 bg-slate-950 hover:bg-slate-900 border border-slate-800 text-slate-300 text-xs font-medium rounded-xl flex items-center gap-1.5 cursor-pointer"
                    >
                      <BookOpen className="w-3.5 h-3.5 text-emerald-400" />
                      {showOnboardingGuide ? 'Hide Guide' : 'Quick-Start Guide'}
                    </button>
                  </div>
                </div>

                <div className="lg:col-span-5 relative min-h-[200px]">
                  <img
                    src={STUDIO_ASSET_IMAGES.heroStudio}
                    alt="AI Music Video Studio Control Suite"
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#0B0F19] via-transparent to-transparent lg:bg-gradient-to-r lg:from-[#0B0F19] lg:via-transparent" />
                </div>
              </div>

              {/* Optional Collapsible Onboarding Workflow Guide */}
              {showOnboardingGuide && (
                <div className="bg-[#0B0F19] border border-violet-500/30 rounded-2xl p-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="p-3.5 rounded-xl bg-slate-950/90 border border-slate-800">
                    <div className="text-xs font-mono text-violet-400 font-bold">
                      STEP 1 · UPLOAD & DSP ANALYSIS
                    </div>
                    <p className="text-xs text-slate-300 mt-1">
                      Go to <strong>Create Video</strong> or <strong>Google Drive</strong> to upload an MP3/WAV song. The backend extracts exact duration, BPM, and structural sections.
                    </p>
                  </div>
                  <div className="p-3.5 rounded-xl bg-slate-950/90 border border-slate-800">
                    <div className="text-xs font-mono text-sky-400 font-bold">
                      STEP 2 · PROMPT & CAST LOCK
                    </div>
                    <p className="text-xs text-slate-300 mt-1">
                      Use <strong>Prompt Studio</strong> to customize 13 cinematic fields (camera, lens, lighting, mood) and lock protagonist wardrobe in <strong>Character Studio</strong>.
                    </p>
                  </div>
                  <div className="p-3.5 rounded-xl bg-slate-950/90 border border-slate-800">
                    <div className="text-xs font-mono text-indigo-400 font-bold">
                      STEP 3 · STORYBOARD & CLIPS
                    </div>
                    <p className="text-xs text-slate-300 mt-1">
                      Review story-driven narrative scenes in <strong>Storyboard</strong> and render audio-reactive H.264 scene clips.
                    </p>
                  </div>
                  <div className="p-3.5 rounded-xl bg-slate-950/90 border border-slate-800">
                    <div className="text-xs font-mono text-emerald-400 font-bold">
                      STEP 4 · COLOR, SYNC & EXPORT
                    </div>
                    <p className="text-xs text-slate-300 mt-1">
                      Open <strong>Video Editor</strong> to grade film color, toggle Clean Video (no lyrics), snap cuts to beats, and export `.mp4` to disk or Google Drive.
                    </p>
                  </div>
                </div>
              )}

              {/* 4-Column KPI Strip */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-[#0B0F19] border border-slate-800/90 rounded-2xl p-4">
                  <div className="text-xs text-slate-400">Studio Projects</div>
                  <div className="text-2xl font-bold font-mono tabular-nums text-white mt-1">
                    {projects.length}
                  </div>
                  <div className="text-xs text-slate-400 mt-1 truncate">
                    Active: {activeProject.title} ({formatTimecode(activeProject.durationSec)})
                  </div>
                </div>

                <div className="bg-[#0B0F19] border border-slate-800/90 rounded-2xl p-4">
                  <div className="text-xs text-slate-400">
                    Story-Driven Scenes
                  </div>
                  <div className="text-2xl font-bold font-mono tabular-nums text-sky-400 mt-1">
                    {activeProject.scenes.length} Scenes
                  </div>
                  <div className="text-xs text-slate-400 mt-1">
                    {activeProject.completedScenes} / {activeProject.scenes.length} clips rendered ·{' '}
                    {(activeProject.promptLibrary || []).length} saved prompts
                  </div>
                </div>

                <div className="bg-[#0B0F19] border border-slate-800/90 rounded-2xl p-4">
                  <div className="text-xs text-slate-400">
                    Uploaded Master Song
                  </div>
                  <div className="text-base font-bold font-mono truncate text-emerald-400 mt-1">
                    {activeProject.audioTrack?.fileName ||
                      (activeProject.durationSec > 0
                        ? activeProject.audioTrack?.title
                        : 'No Song Uploaded')}
                  </div>
                  <div className="text-xs text-slate-400 mt-1">
                    Duration: {formatTimecode(activeProject.durationSec)} · {activeProject.bpm || 0} BPM
                  </div>
                </div>

                <div className="bg-[#0B0F19] border border-slate-800/90 rounded-2xl p-4">
                  <div className="text-xs text-slate-400">
                    Exported MP4 Videos
                  </div>
                  <div className="text-2xl font-bold font-mono tabular-nums text-violet-400 mt-1">
                    {completedMp4Jobs.length}
                  </div>
                  <div className="text-xs text-slate-400 mt-1">
                    Clean or Lyric-Synced H.264 + AAC
                  </div>
                </div>
              </div>

              {/* Recent Projects & Saved Characters */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                <div className="lg:col-span-7 bg-[#0B0F19] border border-slate-800/90 rounded-2xl p-5 flex flex-col gap-4">
                  <div className="flex items-center justify-between">
                    <h2 className="text-base font-bold text-slate-100">
                      Isolated Music Video Projects ({projects.length})
                    </h2>
                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        onClick={() => setActiveTab('projects')}
                        className="text-xs text-sky-400 hover:text-sky-300 font-semibold cursor-pointer"
                      >
                        Google Drive Sync
                      </button>
                      <button
                        type="button"
                        onClick={() => void handleCreateNewProject()}
                        className="text-xs text-violet-400 hover:text-violet-300 font-semibold cursor-pointer"
                      >
                        + New Project
                      </button>
                    </div>
                  </div>

                  <div className="space-y-3">
                    {projects.map((proj) => {
                      const isCurrent = proj.id === activeProject.id;
                      return (
                        <div
                          key={proj.id}
                          data-testid={`dashboard-project-${proj.id}`}
                          className={`p-3.5 bg-[#07090F] border rounded-xl flex flex-wrap items-center justify-between gap-3 ${
                            isCurrent ? 'border-violet-500' : 'border-slate-800'
                          }`}
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="w-12 h-10 rounded-lg bg-violet-950/60 border border-violet-500/30 flex items-center justify-center text-violet-300 font-mono text-xs shrink-0">
                              {formatTimecode(proj.durationSec)}
                            </div>
                            <div className="min-w-0">
                              <div className="text-sm font-bold text-slate-100 truncate">
                                {proj.title}{' '}
                                <span className="text-[11px] font-mono font-normal text-slate-400">
                                  ({proj.id})
                                </span>
                              </div>
                              <div className="text-xs text-slate-400 truncate">
                                Song:{' '}
                                <strong className="text-slate-200">
                                  {proj.audioTrack?.fileName ||
                                    (proj.durationSec > 0
                                      ? proj.audioTrack?.title
                                      : 'No Song Uploaded')}
                                </strong>{' '}
                                · {formatTimecode(proj.durationSec)} · {proj.scenes.length} Scenes ·{' '}
                                {proj.completedScenes}/{proj.scenes.length} Clips · Status:{' '}
                                <span className="text-emerald-400">{proj.status}</span>
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 shrink-0">
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
                                setActiveTab(
                                  proj.scenes.length > 0 ? 'storyboard' : 'create'
                                );
                              }}
                              className="px-3 py-1.5 bg-violet-600 hover:bg-violet-500 text-white text-xs font-semibold rounded-lg cursor-pointer"
                            >
                              {proj.scenes.length > 0
                                ? 'Open Storyboard'
                                : 'Upload Song'}
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Saved Characters & Prompt Studio Quick Card */}
                <div className="lg:col-span-5 bg-[#0B0F19] border border-slate-800/90 rounded-2xl p-5 flex flex-col gap-4">
                  <div className="flex items-center justify-between">
                    <h2 className="text-base font-bold text-slate-100">
                      Consistent Character Cast ({characters.length})
                    </h2>
                    <button
                      type="button"
                      onClick={() => setActiveTab('characters')}
                      className="text-xs text-violet-400 hover:text-violet-300 font-semibold cursor-pointer"
                    >
                      Manage Character Studio
                    </button>
                  </div>

                  <div className="space-y-3">
                    {characters.map((char) => (
                      <div
                        key={char.id}
                        className="p-3 bg-[#07090F] border border-slate-800 rounded-xl flex items-center gap-3"
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
                            <span className="font-normal text-violet-400">
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
                setTracks((prev) => [
                  newTrack,
                  ...prev.filter((t) => t.id !== newTrack.id),
                ])
              }
              onUpdateFlowSettings={setFlowSettings}
              onNavigateTab={(tab) => setActiveTab(tab)}
            />
          )}

          {activeTab === 'prompts' && (
            <PromptStudioWorkspace
              project={activeProject}
              characters={characters}
              onUpdateProject={handleUpdateActiveProject}
              onGenerateSceneVideo={(scene) =>
                void handleTriggerSceneGenerationFromPromptStudio(scene)
              }
              onOpenEditor={() => setActiveTab('editor')}
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
                const exists =
                  activeProject.selectedCharacterIds.includes(charId);
                const nextIds = exists
                  ? activeProject.selectedCharacterIds.filter(
                      (id) => id !== charId
                    )
                  : [...activeProject.selectedCharacterIds, charId];
                handleUpdateActiveProject({
                  ...activeProject,
                  selectedCharacterIds: nextIds,
                });
              }}
              onSyncCharactersToAllScenes={handleSyncCharactersToAllScenes}
            />
          )}

          {activeTab === 'music' && (
            <MusicLibraryWorkspace
              project={activeProject}
              tracks={tracks}
              onTrackUploaded={(newTrack) =>
                setTracks((prev) => [
                  newTrack,
                  ...prev.filter((t) => t.id !== newTrack.id),
                ])
              }
              onUpdateProject={handleUpdateActiveProject}
            />
          )}

          {activeTab === 'tools' && (
            <AIToolsWorkspace
              project={activeProject}
              onUpdateProject={handleUpdateActiveProject}
              onTrackUploaded={(newTrack) =>
                setTracks((prev) => [
                  newTrack,
                  ...prev.filter((t) => t.id !== newTrack.id),
                ])
              }
            />
          )}

          {activeTab === 'projects' && (
            <div className="flex flex-col gap-6">
              {/* Google Drive Integration Workspace */}
              <GoogleDriveWorkspace
                project={activeProject}
                accessToken={googleAccessToken}
                needsAuth={needsGoogleAuth}
                isLoggingIn={isLoggingInGoogle}
                onConnectGoogleDrive={handleGoogleSignIn}
                onUpdateProject={handleUpdateActiveProject}
                onTrackUploaded={(newTrack) =>
                  setTracks((prev) => [
                    newTrack,
                    ...prev.filter((t) => t.id !== newTrack.id),
                  ])
                }
              />

              {/* Local & Firestore Projects List */}
              <div className="bg-[#0B0F19] border border-slate-800/90 rounded-2xl p-5 flex flex-wrap items-center justify-between gap-4">
                <div>
                  <h2 className="text-lg font-bold text-slate-100">
                    My Music Video Projects &amp; Export History
                  </h2>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Create, rename, duplicate, auto-save, download rendered MP4s, or delete full-length music video projects.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => void handleCreateNewProject()}
                  className="px-4 py-2 bg-violet-600 hover:bg-violet-500 text-white text-xs font-semibold rounded-xl flex items-center gap-1.5 cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  New Project
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {projects.map((proj) => (
                  <div
                    key={proj.id}
                    className="bg-[#0B0F19] border border-slate-800/90 rounded-2xl p-5 flex flex-col justify-between gap-4"
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
                              className="bg-slate-950 border border-violet-500 rounded-lg px-2.5 py-1 text-xs text-white"
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
                              className="px-2.5 py-1 bg-violet-600 text-white text-xs rounded-lg cursor-pointer"
                            >
                              Save
                            </button>
                          </div>
                        ) : (
                          <h3 className="text-base font-bold text-slate-100 truncate">
                            {proj.title}{' '}
                            <span className="text-xs font-mono font-normal text-slate-400">
                              ({proj.id})
                            </span>
                          </h3>
                        )}
                        <div className="text-xs text-slate-400 mt-1 space-y-0.5">
                          <div>
                            Uploaded Song:{' '}
                            <strong className="text-slate-200 font-mono">
                              {proj.audioTrack?.fileName ||
                                (proj.durationSec > 0
                                  ? proj.audioTrack?.title
                                  : 'No Song Uploaded')}
                            </strong>{' '}
                            · Duration:{' '}
                            <strong className="text-emerald-400 font-mono">
                              {formatTimecode(proj.durationSec)} ({proj.durationSec}s)
                            </strong>
                          </div>
                          <div>
                            {proj.directorStyle} · {proj.scenes.length} Scenes ·{' '}
                            {proj.completedScenes}/{proj.scenes.length} Clips Completed ·{' '}
                            {proj.resolution}
                          </div>
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
                            setActiveTab(
                              proj.scenes.length > 0 ? 'storyboard' : 'create'
                            );
                          }}
                          className="px-3 py-1.5 bg-violet-600 hover:bg-violet-500 text-white text-xs font-semibold rounded-lg cursor-pointer"
                        >
                          {proj.scenes.length > 0 ? 'Open Project' : 'Upload Song'}
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

      {/* Mobile Fixed Bottom Navigation Bar (56px height, <= 15% of 844px mobile viewport) */}
      <nav
        aria-label="Mobile Bottom Studio Navigation"
        className="md:hidden fixed bottom-0 left-0 right-0 z-40 h-14 bg-[#0B0F19]/95 border-t border-slate-800 backdrop-blur-md grid grid-cols-5 items-center px-1"
      >
        {mobileBottomTabs.map((tabId) => {
          const item = navItems.find((n) => n.id === tabId)!;
          const Icon = item.icon;
          const isActive = activeTab === tabId;
          return (
            <button
              key={tabId}
              type="button"
              onClick={() => setActiveTab(tabId)}
              className={`h-11 rounded-xl flex flex-col items-center justify-center gap-0.5 text-[10px] font-medium transition-colors ${
                isActive ? 'text-violet-400' : 'text-slate-400 hover:text-white'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{item.shortLabel}</span>
            </button>
          );
        })}
      </nav>
    </div>
  );
}

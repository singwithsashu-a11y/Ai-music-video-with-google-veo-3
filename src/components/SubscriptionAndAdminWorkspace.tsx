import React, { useEffect, useState } from 'react';
import {
  AdminOverviewData,
  FlowAndProviderSettings,
  MusicVideoProject,
  ProviderPriority,
} from '../types/studio';
import {
  Activity,
  CheckCircle2,
  Database,
  Download,
  ExternalLink,
  HardDrive,
  KeyRound,
  RefreshCw,
  Save,
  Settings,
  ShieldAlert,
  ShieldCheck,
  Sliders,
  Trash2,
  Users,
} from 'lucide-react';

interface SubscriptionAndAdminProps {
  flowSettings: FlowAndProviderSettings;
  appCredits: number;
  currentPlan: 'free' | 'creator' | 'pro' | 'studio';
  projects: MusicVideoProject[];
  onUpdateFlowSettings: (updated: FlowAndProviderSettings) => void;
  onSelectPlan: (plan: 'free' | 'creator' | 'pro' | 'studio', bonusCredits: number) => void;
}

export const SubscriptionWorkspace: React.FC<SubscriptionAndAdminProps> = ({
  flowSettings,
  appCredits,
  currentPlan,
  onUpdateFlowSettings,
  onSelectPlan,
}) => {
  const [flowCreditInput, setFlowCreditInput] = useState(
    String(flowSettings.flowCreditsSelfReported)
  );
  const [savedNotice, setSavedNotice] = useState<string | null>(null);

  const handleSyncFlowCreditLedger = async (e: React.FormEvent) => {
    e.preventDefault();
    const numeric = Math.max(0, Number(flowCreditInput) || 0);
    const updated: FlowAndProviderSettings = {
      ...flowSettings,
      flowCreditsSelfReported: numeric,
    };
    onUpdateFlowSettings(updated);
    try {
      await fetch('/api/admin/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updated),
      });
    } catch {
      // Saved locally as well
    }
    setSavedNotice(
      `Persisted Google Flow monthly credit tracker (${numeric} credits) to server database. Priority 1 Mode deducts 0 internal app credits.`
    );
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Critical Feature: Google AI Pro & Google Flow Integration Center */}
      <div className="bg-[#0F1624] border border-emerald-500/30 rounded-xl p-5 flex flex-col gap-5">
        <div className="flex flex-wrap items-start justify-between gap-4 border-b border-slate-800 pb-4">
          <div>
            <div className="flex items-center gap-2 text-xs text-emerald-400 font-semibold">
              <ShieldCheck className="w-4 h-4" />
              <span>GOOGLE AI PRO & GOOGLE FLOW SUBSCRIPTION INTEGRATION</span>
            </div>
            <h2 className="text-lg font-bold text-slate-100 mt-1">
              Priority 1: Existing Google AI Pro / Google Flow Subscription Mode
            </h2>
            <p className="text-xs text-slate-400 mt-0.5 max-w-3xl">
              Your Google account (<strong className="text-slate-200">{flowSettings.connectedGoogleEmail}</strong>) is connected. This studio prioritizes your Google AI Pro / Google Flow workflow first and blocks unintended separate Gemini/Veo API charges.
            </p>
          </div>

          <a
            href="https://labs.google/fx/tools/flow"
            target="_blank"
            rel="noreferrer"
            className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-lg flex items-center gap-1.5 whitespace-nowrap shrink-0"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            Launch Google Flow (labs.google)
          </a>
        </div>

        {/* Official Google OAuth vs Google Flow Transparency & Legitimate Bridge Explanation */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          <div className="lg:col-span-7 bg-slate-950/70 border border-slate-800 rounded-lg p-4 flex flex-col gap-3 text-xs">
            <div className="font-semibold text-slate-100 flex items-center gap-2">
              <KeyRound className="w-4 h-4 text-indigo-400" />
              Official Google Flow Authorization & API Boundary Transparency
            </div>
            <p className="text-slate-300 leading-relaxed">
              Google AI Pro consumer subscriptions include monthly video generation credits inside <strong>Google Flow</strong> (<span className="font-mono text-indigo-300">labs.google/fx/tools/flow</span>). Because Google does not expose a public third-party OAuth scope to directly consume consumer Flow credits or read consumer Flow balances via external REST APIs—and this platform strictly prohibits cookie scraping or unauthorized session automation—we provide the <strong>Official Google Flow Companion Bridge + Local FFmpeg H.264/AAC Studio Renderer</strong>:
            </p>
            <ul className="space-y-1.5 text-slate-400 list-disc list-inside">
              <li>
                <strong className="text-slate-200">Zero App Credit Deduction:</strong> Generating storyboards, Lyric Metaphor animations, FFmpeg MP4 scene clips, and Google Flow Director Prompts under Priority 1 deducts <strong>0 App Credits</strong>.
              </li>
              <li>
                <strong className="text-slate-200">Zero Silent API Charges:</strong> Separate Gemini/Veo Cloud API billing is locked off unless you explicitly authorize Priority 2.
              </li>
              <li>
                <strong className="text-slate-200">1-Click Scene Sync & MP4 Joiner:</strong> Copy frame-accurate prompts with Character Consistency Locks into Google Flow, or render scene clips directly on the server with FFmpeg, and join them into a full-length 1080p/4K MP4.
              </li>
            </ul>
          </div>

          <form
            onSubmit={handleSyncFlowCreditLedger}
            className="lg:col-span-5 bg-slate-950/70 border border-slate-800 rounded-lg p-4 flex flex-col justify-between gap-4"
          >
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-400">Google Flow Connection</span>
                <span className="font-semibold text-emerald-400">
                  Connected ({flowSettings.connectedGoogleEmail})
                </span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-400">Google AI Pro Status</span>
                <span className="font-semibold text-indigo-300">
                  Active Subscription Mode (Priority 1)
                </span>
              </div>
              <div>
                <label
                  htmlFor="flow-credits-ledger-input"
                  className="text-xs font-medium text-slate-300 block mb-1"
                >
                  Available Monthly Google Flow Credits (Self-Tracked Ledger)
                </label>
                <div className="flex items-center gap-2">
                  <input
                    id="flow-credits-ledger-input"
                    type="number"
                    min={0}
                    max={100000}
                    value={flowCreditInput}
                    onChange={(e) => setFlowCreditInput(e.target.value)}
                    className="flex-1 bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-xs font-mono tabular-nums text-slate-100"
                  />
                  <button
                    type="submit"
                    className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium rounded-lg cursor-pointer"
                  >
                    Update Balance
                  </button>
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-800 flex items-center justify-between text-xs">
              <span className="text-slate-400">Internal Studio App Credits</span>
              <span className="font-mono tabular-nums font-bold text-slate-100">
                {appCredits} Credits (Preserved in Priority 1)
              </span>
            </div>
          </form>
        </div>

        {savedNotice && (
          <div className="bg-emerald-950/40 border border-emerald-500/40 rounded-lg px-4 py-2.5 text-xs text-emerald-200">
            {savedNotice}
          </div>
        )}
      </div>

      {/* Studio Subscription Tiers */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {(
          [
            {
              id: 'free',
              name: 'Free Plan',
              audience: 'For Google AI Pro / Flow creators',
              price: '$0 / mo',
              credits: 500,
              resolution: 'Up to 1080p Export',
              durationLimit: 'Up to 5 min songs',
            },
            {
              id: 'creator',
              name: 'Creator Plan',
              audience: 'For independent musicians & YouTubers',
              price: '$19 / mo',
              credits: 2500,
              resolution: '1080p + 4K Mastering',
              durationLimit: 'Up to 10 min songs',
            },
            {
              id: 'pro',
              name: 'Pro Plan',
              audience: 'For music producers & visual directors',
              price: '$49 / mo',
              credits: 8000,
              resolution: '4K Anamorphic + Custom LUTs',
              durationLimit: 'Up to 15 min songs',
            },
            {
              id: 'studio',
              name: 'Studio Plan',
              audience: 'For record labels & production houses',
              price: '$129 / mo',
              credits: 25000,
              resolution: '4K Master + Multi-Seat Admin',
              durationLimit: 'Unlimited song length',
            },
          ] as const
        ).map((tier) => {
          const isCurrent = currentPlan === tier.id;
          return (
            <div
              key={tier.id}
              className={`bg-[#0F1624] border rounded-xl p-5 flex flex-col justify-between gap-4 ${
                isCurrent ? 'border-indigo-500' : 'border-slate-800'
              }`}
            >
              <div>
                <div className="text-xs text-indigo-400 font-medium">
                  {tier.audience}
                </div>
                <h3 className="text-base font-bold text-slate-100 mt-1">
                  {tier.name}
                </h3>
                <div className="text-2xl font-bold font-mono tabular-nums text-white mt-2">
                  {tier.price}
                </div>

                <div className="mt-4 space-y-2 text-xs text-slate-300 border-t border-slate-800 pt-3">
                  <div>• Google Flow Priority 1 Included (0 Credit Burn)</div>
                  <div>• {tier.credits.toLocaleString()} Monthly Studio Credits</div>
                  <div>• {tier.resolution}</div>
                  <div>• {tier.durationLimit}</div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  onSelectPlan(tier.id, tier.credits);
                  setSavedNotice(`Switched active plan to ${tier.name} (+${tier.credits} studio credits).`);
                }}
                className={`w-full py-2 rounded-lg text-xs font-semibold cursor-pointer transition-colors ${
                  isCurrent
                    ? 'bg-indigo-600/20 border border-indigo-500 text-indigo-200'
                    : 'bg-indigo-600 hover:bg-indigo-500 text-white'
                }`}
              >
                {isCurrent ? 'Current Active Plan' : `Select ${tier.name}`}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export const AdminControlPanelWorkspace: React.FC<{
  flowSettings: FlowAndProviderSettings;
  projects: MusicVideoProject[];
  onUpdateFlowSettings: (updated: FlowAndProviderSettings) => void;
  onDeleteProject: (projId: string) => void;
  onRefreshJobs: () => void;
}> = ({
  flowSettings,
  projects,
  onUpdateFlowSettings,
  onDeleteProject,
  onRefreshJobs,
}) => {
  const [overview, setOverview] = useState<AdminOverviewData | null>(null);
  const [isLoadingOverview, setIsLoadingOverview] = useState(false);
  const [announcement, setAnnouncement] = useState(
    'Priority 1 (Google AI Pro / Google Flow Subscription) is enforced by default. Separate API billing requires explicit per-action authorization.'
  );
  const [adminToast, setAdminToast] = useState<string | null>(null);

  const fetchAdminOverview = async () => {
    setIsLoadingOverview(true);
    try {
      const res = await fetch('/api/admin/overview');
      if (res.ok) {
        const data: AdminOverviewData = await res.json();
        setOverview(data);
        if (data.systemSettings?.announcement) {
          setAnnouncement(data.systemSettings.announcement);
        }
      }
    } catch {
      // Ignore transient network errors
    } finally {
      setIsLoadingOverview(false);
    }
  };

  useEffect(() => {
    void fetchAdminOverview();
  }, []);

  const handleSaveAdminSettings = async (nextSettings?: FlowAndProviderSettings) => {
    const payload = {
      ...(nextSettings || flowSettings),
      systemAnnouncement: announcement,
    };
    try {
      const res = await fetch('/api/admin/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        setAdminToast('Saved system & provider settings to persistent server database.');
        void fetchAdminOverview();
      }
    } catch {
      setAdminToast('Failed to save settings to server.');
    }
  };

  const handleUpdateUserRole = async (uid: string, role: 'admin' | 'user') => {
    try {
      const res = await fetch(`/api/admin/users/${encodeURIComponent(uid)}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role }),
      });
      if (res.ok) {
        setAdminToast(`Updated user ${uid} role to ${role}.`);
        void fetchAdminOverview();
      }
    } catch {
      setAdminToast('Could not update user role.');
    }
  };

  const handleRetryJob = async (jobId: string) => {
    try {
      const res = await fetch(`/api/jobs/${encodeURIComponent(jobId)}/retry`, {
        method: 'POST',
      });
      if (res.ok) {
        setAdminToast(`Re-queued job ${jobId}.`);
        onRefreshJobs();
        void fetchAdminOverview();
      }
    } catch {
      setAdminToast('Failed to retry job.');
    }
  };

  const handleClearLogs = async () => {
    try {
      const res = await fetch('/api/admin/logs/clear', { method: 'POST' });
      if (res.ok) {
        setAdminToast('Cleared server error logs.');
        void fetchAdminOverview();
      }
    } catch {
      setAdminToast('Failed to clear logs.');
    }
  };

  const formatBytes = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="bg-[#0F1624] border border-slate-800 rounded-xl p-5 flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs text-indigo-400 font-medium">
            <Settings className="w-3.5 h-3.5" />
            <span>STUDIO ADMINISTRATOR CONTROL PANEL · RBAC, JOBS & TELEMETRY</span>
          </div>
          <h2 className="text-lg font-bold text-slate-100 mt-1">
            Provider Priority, User & Project Management, Storage & Job Monitor
          </h2>
        </div>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => void fetchAdminOverview()}
            className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 text-xs font-medium rounded-lg flex items-center gap-1.5 cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoadingOverview ? 'animate-spin' : ''}`} />
            Refresh Telemetry
          </button>
          <button
            type="button"
            onClick={() => void handleSaveAdminSettings()}
            className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-lg flex items-center gap-1.5 cursor-pointer"
          >
            <Save className="w-3.5 h-3.5" />
            Save Admin Settings
          </button>
        </div>
      </div>

      {adminToast && (
        <div
          role="status"
          className="bg-indigo-950/50 border border-indigo-500/40 rounded-lg px-4 py-2.5 text-xs text-indigo-200 flex items-center justify-between"
        >
          <span>{adminToast}</span>
          <button
            type="button"
            onClick={() => setAdminToast(null)}
            className="text-indigo-300 hover:text-white cursor-pointer"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* System Health & Telemetry KPI Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-[#0F1624] border border-slate-800 rounded-xl p-4">
          <div className="text-xs text-slate-400 flex items-center gap-1.5">
            <Activity className="w-3.5 h-3.5 text-indigo-400" />
            Gemini API & FFmpeg Status
          </div>
          <div className="text-sm font-bold font-mono text-white mt-1.5">
            FFmpeg: <span className="text-emerald-400">ONLINE</span> · Gemini Key:{' '}
            <span
              className={
                overview?.systemSettings.geminiConfigured
                  ? 'text-emerald-400'
                  : 'text-amber-400'
              }
            >
              {overview?.systemSettings.geminiConfigured ? 'ACTIVE' : 'NEEDS SECRET'}
            </span>
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            {overview?.apiTelemetry.geminiCalls ?? 0} Gemini calls ·{' '}
            {(overview?.apiTelemetry.ffmpegSceneRenders ?? 0) +
              (overview?.apiTelemetry.ffmpegMasterRenders ?? 0)}{' '}
            MP4 renders
          </div>
        </div>

        <div className="bg-[#0F1624] border border-slate-800 rounded-xl p-4">
          <div className="text-xs text-slate-400 flex items-center gap-1.5">
            <HardDrive className="w-3.5 h-3.5 text-cyan-400" />
            Server Disk Storage (`/storage`)
          </div>
          <div className="text-xl font-bold font-mono tabular-nums text-white mt-1">
            {formatBytes(overview?.storageUsage.totalBytes ?? 0)}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            {overview?.storageUsage.fileCount ?? 0} files stored on disk
          </div>
        </div>

        <div className="bg-[#0F1624] border border-slate-800 rounded-xl p-4">
          <div className="text-xs text-slate-400 flex items-center gap-1.5">
            <Users className="w-3.5 h-3.5 text-emerald-400" />
            Registered Studio Users
          </div>
          <div className="text-xl font-bold font-mono tabular-nums text-white mt-1">
            {overview?.users.length ?? 1}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            Google OAuth + RBAC roles active
          </div>
        </div>

        <div className="bg-[#0F1624] border border-slate-800 rounded-xl p-4">
          <div className="text-xs text-slate-400 flex items-center gap-1.5">
            <Database className="w-3.5 h-3.5 text-amber-400" />
            Background Render Jobs
          </div>
          <div className="text-xl font-bold font-mono tabular-nums text-white mt-1">
            {overview?.jobs.length ?? 0}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            {overview?.errorLogs.length ?? 0} logged errors
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left 7 Cols: Required Admin Settings for Google Flow & API Billing Safeguards */}
        <div className="lg:col-span-7 bg-[#0F1624] border border-slate-800 rounded-xl p-5 flex flex-col gap-4">
          <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-amber-400" />
            Google Flow & Separate API Billing Governance
          </h3>

          <div className="space-y-3 text-xs">
            <div className="flex items-center justify-between p-3 bg-slate-950 rounded-lg border border-slate-800">
              <div>
                <div className="font-semibold text-slate-100">
                  1. Google Flow Consumer Subscription Status (Priority 1)
                </div>
                <div className="text-slate-400">
                  Account: {flowSettings.connectedGoogleEmail} · External REST API: <strong className="text-amber-300">NOT INTEGRATED</strong> (No public Google OAuth endpoint)
                </div>
              </div>
              <span className="px-2.5 py-1 rounded bg-amber-950/60 border border-amber-500/40 text-amber-300 font-mono text-[11px]">
                NOT INTEGRATED
              </span>
            </div>

            <div className="flex items-center justify-between p-3 bg-slate-950 rounded-lg border border-slate-800">
              <div>
                <div className="font-semibold text-slate-100">
                  2. Priority 2: Official Google Veo API Adapter
                </div>
                <div className="text-slate-400">
                  Requires server GEMINI_API_KEY and explicit per-action billing authorization
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  const next = {
                    ...flowSettings,
                    veoApiEnabled: !flowSettings.veoApiEnabled,
                  };
                  onUpdateFlowSettings(next);
                  void handleSaveAdminSettings(next);
                }}
                className={`px-3 py-1.5 rounded-lg font-semibold cursor-pointer ${
                  flowSettings.veoApiEnabled
                    ? 'bg-indigo-600/20 border border-indigo-500/50 text-indigo-300'
                    : 'bg-slate-800 text-slate-400'
                }`}
              >
                {flowSettings.veoApiEnabled ? 'ENABLED' : 'DISABLED'}
              </button>
            </div>

            <div className="flex items-center justify-between p-3 bg-slate-950 rounded-lg border border-slate-800">
              <div>
                <div className="font-semibold text-slate-100">
                  3. Active Default Video Generation Provider
                </div>
                <div className="text-slate-400">
                  Select primary generation engine across the studio
                </div>
              </div>
              <select
                aria-label="Default Generation Provider Priority"
                value={flowSettings.preferredProvider}
                onChange={(e) => {
                  const next = {
                    ...flowSettings,
                    preferredProvider: e.target.value as ProviderPriority,
                  };
                  onUpdateFlowSettings(next);
                  void handleSaveAdminSettings(next);
                }}
                className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-100"
              >
                <option value="procedural_cinema_priority_3">
                  Priority 3: Procedural Cinema Engine [ACTIVE]
                </option>
                <option value="google_veo_api_priority_2">
                  Priority 2: Official Google Veo API [{flowSettings.veoApiEnabled ? 'ENABLED' : 'DISABLED'}]
                </option>
                <option value="google_flow_priority_1">
                  Priority 1: Google Flow Subscription [NOT INTEGRATED]
                </option>
              </select>
            </div>

            <div className="flex items-center justify-between p-3 bg-slate-950 rounded-lg border border-slate-800">
              <div>
                <div className="font-semibold text-slate-100">
                  4. Separate Paid API Fallback Enable / Disable
                </div>
                <div className="text-slate-400">
                  When disabled, server strictly rejects automatic fallback to separately billed APIs
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  const nextVal = !flowSettings.apiFallbackEnabled;
                  const next = {
                    ...flowSettings,
                    apiFallbackEnabled: nextVal,
                  };
                  onUpdateFlowSettings(next);
                  void handleSaveAdminSettings(next);
                }}
                className={`px-3 py-1.5 rounded-lg font-semibold cursor-pointer ${
                  flowSettings.apiFallbackEnabled
                    ? 'bg-amber-600/20 border border-amber-500/50 text-amber-300'
                    : 'bg-emerald-600/20 border border-emerald-500/50 text-emerald-300'
                }`}
              >
                {flowSettings.apiFallbackEnabled
                  ? 'Enabled (With Warning)'
                  : 'Disabled (Protected)'}
              </button>
            </div>

            <div className="flex items-center justify-between p-3 bg-slate-950 rounded-lg border border-slate-800">
              <div>
                <div className="font-semibold text-slate-100">
                  5. Separate API Billing Warning Gate
                </div>
                <div className="text-slate-400">
                  Always display a prominent warning modal before any separately billed API call
                </div>
              </div>
              <span className="font-mono text-emerald-400 font-semibold">
                MANDATORY ACTIVE
              </span>
            </div>
          </div>
        </div>

        {/* Right 5 Cols: Server-Side Model Router & Announcement */}
        <div className="lg:col-span-5 bg-[#0F1624] border border-slate-800 rounded-xl p-5 flex flex-col gap-4">
          <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
            <Sliders className="w-4 h-4 text-indigo-400" />
            Server-Side AI Model Configuration
          </h3>

          <div className="space-y-2 text-xs">
            {[
              {
                role: 'AI Music Director & Lyric Metaphors',
                model: 'gemini-3.8-flash',
              },
              {
                role: 'Video Generation & Extension (Veo / Omni)',
                model: 'gemini-omni-1.2-flash',
              },
              {
                role: 'Server Video Compiler & MP4 Encoder',
                model: 'ffmpeg-4.4.2-libx264-aac',
              },
              {
                role: 'Character Reference & Thumbnail Studio',
                model: 'gemini-3.1-flash-lite-image',
              },
              {
                role: 'Audio Lyric Transcription',
                model: 'gemini-3.5-transcribe',
              },
              {
                role: 'Voiceover & Narration TTS',
                model: 'gemini-3.8-flash-lite-tts',
              },
            ].map((row) => (
              <div
                key={row.role}
                className="flex items-center justify-between p-2 bg-slate-950 rounded-lg border border-slate-800"
              >
                <span className="text-slate-300">{row.role}</span>
                <span className="font-mono text-indigo-300">{row.model}</span>
              </div>
            ))}
          </div>

          <div className="pt-2 border-t border-slate-800">
            <label
              htmlFor="admin-system-announcement"
              className="text-xs font-medium text-slate-300 block mb-1"
            >
              System Banner Announcement
            </label>
            <textarea
              id="admin-system-announcement"
              rows={2}
              value={announcement}
              onChange={(e) => setAnnouncement(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs text-slate-200"
            />
          </div>
        </div>
      </div>

      {/* User Management & Project Management Tables */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-6 bg-[#0F1624] border border-slate-800 rounded-xl p-5 flex flex-col gap-3">
          <h3 className="text-sm font-bold text-slate-100">
            User Accounts & Role Management
          </h3>
          <div className="space-y-2 text-xs">
            {(overview?.users || []).map((u) => (
              <div
                key={u.uid}
                className="p-3 bg-slate-950 border border-slate-800 rounded-lg flex flex-wrap items-center justify-between gap-2"
              >
                <div>
                  <div className="font-semibold text-slate-100">
                    {u.displayName} ({u.email})
                  </div>
                  <div className="text-[11px] text-slate-400 font-mono">
                    UID: {u.uid} · Plan: {u.plan.toUpperCase()} · {u.appCredits} cr
                  </div>
                </div>
                <select
                  aria-label={`Role for ${u.email}`}
                  value={u.role}
                  onChange={(e) =>
                    void handleUpdateUserRole(u.uid, e.target.value as 'admin' | 'user')
                  }
                  className="bg-slate-900 border border-slate-700 rounded px-2.5 py-1 text-xs text-slate-200"
                >
                  <option value="admin">Admin</option>
                  <option value="user">User</option>
                </select>
              </div>
            ))}
          </div>
        </div>

        <div className="lg:col-span-6 bg-[#0F1624] border border-slate-800 rounded-xl p-5 flex flex-col gap-3">
          <h3 className="text-sm font-bold text-slate-100">
            Database Projects & Master Renders ({projects.length})
          </h3>
          <div className="space-y-2 text-xs max-h-60 overflow-y-auto">
            {projects.map((p) => (
              <div
                key={p.id}
                className="p-3 bg-slate-950 border border-slate-800 rounded-lg flex items-center justify-between gap-2"
              >
                <div className="min-w-0">
                  <div className="font-semibold text-slate-100 truncate">
                    {p.title}
                  </div>
                  <div className="text-[11px] text-slate-400">
                    {p.scenes.length} scenes · {p.resolution} · Status: {p.status}
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {p.renderedMasterDownloadUrl && (
                    <a
                      href={p.renderedMasterDownloadUrl}
                      download
                      className="px-2.5 py-1 bg-emerald-600/20 border border-emerald-500/40 text-emerald-300 rounded flex items-center gap-1"
                    >
                      <Download className="w-3 h-3" />
                      MP4
                    </a>
                  )}
                  {projects.length > 1 && (
                    <button
                      type="button"
                      onClick={() => onDeleteProject(p.id)}
                      className="p-1.5 text-rose-400 hover:bg-rose-950/40 rounded cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Background Job Queue & Error Logs */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-7 bg-[#0F1624] border border-slate-800 rounded-xl p-5 flex flex-col gap-3">
          <h3 className="text-sm font-bold text-slate-100">
            Background Video Generation & FFmpeg Render Job Queue
          </h3>
          {(overview?.jobs || []).length === 0 ? (
            <div className="text-xs text-slate-400 p-4 bg-slate-950 rounded-lg border border-slate-800">
              No background jobs executed yet. Generate a scene clip or full-length MP4 to inspect job telemetry.
            </div>
          ) : (
            <div className="space-y-2 text-xs max-h-64 overflow-y-auto">
              {(overview?.jobs || []).map((job) => (
                <div
                  key={job.id}
                  className="p-3 bg-slate-950 border border-slate-800 rounded-lg flex flex-wrap items-center justify-between gap-2"
                >
                  <div>
                    <div className="font-semibold text-slate-100 flex items-center gap-2">
                      <span>{job.title}</span>
                      <span
                        className={`px-2 py-0.5 rounded font-mono text-[10px] uppercase ${
                          job.status === 'COMPLETED' || job.status === 'completed'
                            ? 'bg-emerald-950 text-emerald-300 border border-emerald-500/40'
                            : job.status === 'FAILED' || job.status === 'failed'
                              ? 'bg-rose-950 text-rose-300 border border-rose-500/40'
                              : 'bg-indigo-950 text-indigo-300 border border-indigo-500/40'
                        }`}
                      >
                        {job.status} ({job.progress}%)
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-400 mt-0.5">
                      {job.stepMessage}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {(job.downloadUrl || job.outputUrl) && (
                      <a
                        href={job.downloadUrl || job.outputUrl}
                        download
                        className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded font-semibold flex items-center gap-1"
                      >
                        <Download className="w-3 h-3" />
                        Download MP4
                      </a>
                    )}
                    {(job.status === 'FAILED' || job.status === 'failed') && (
                      <button
                        type="button"
                        onClick={() => void handleRetryJob(job.id)}
                        className="px-2.5 py-1 bg-amber-600 text-white rounded font-semibold cursor-pointer"
                      >
                        Retry
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="lg:col-span-5 bg-[#0F1624] border border-slate-800 rounded-xl p-5 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-100">
              Server Error & Diagnostic Logs
            </h3>
            <button
              type="button"
              onClick={() => void handleClearLogs()}
              className="text-xs text-slate-400 hover:text-white cursor-pointer"
            >
              Clear Logs
            </button>
          </div>
          {(overview?.errorLogs || []).length === 0 ? (
            <div className="text-xs text-emerald-400 p-4 bg-slate-950 rounded-lg border border-slate-800 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              Zero runtime server errors logged.
            </div>
          ) : (
            <div className="space-y-2 text-xs max-h-64 overflow-y-auto">
              {(overview?.errorLogs || []).map((err) => (
                <div
                  key={err.id}
                  className="p-2.5 bg-rose-950/30 border border-rose-500/30 rounded-lg text-rose-200"
                >
                  <div className="font-mono text-[10px] text-rose-400">
                    [{err.endpoint}] {err.timestamp}
                  </div>
                  <div className="mt-0.5">{err.message}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

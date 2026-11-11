import React, { useCallback, useEffect, useState } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  Cloud,
  Download,
  ExternalLink,
  FileAudio,
  FileCode,
  FileText,
  Film,
  FolderSync,
  HardDrive,
  Loader2,
  RefreshCw,
  Search,
  Trash2,
  Upload,
} from 'lucide-react';
import { AudioTrackData, MusicVideoProject } from '../types/studio';
import { formatTimecode } from '../utils/studioEngine';
import { getAccessToken } from '../firebase';

export interface DriveFileItem {
  id: string;
  name: string;
  mimeType: string;
  size?: string;
  modifiedTime?: string;
  webViewLink?: string;
}

interface GoogleDriveWorkspaceProps {
  project: MusicVideoProject;
  accessToken: string | null;
  needsAuth: boolean;
  isLoggingIn: boolean;
  onConnectGoogleDrive: () => Promise<void>;
  onUpdateProject: (updated: MusicVideoProject) => void;
  onTrackUploaded: (newTrack: AudioTrackData) => void;
}

interface PendingConfirmAction {
  type: 'delete' | 'overwrite';
  fileId: string;
  fileName: string;
  payloadBlob?: Blob;
  mimeType?: string;
}

function buildSrtContent(project: MusicVideoProject): string {
  return project.scenes
    .map((sc, index) => {
      const formatSrtTime = (sec: number) => {
        const hrs = Math.floor(sec / 3600);
        const mins = Math.floor((sec % 3600) / 60);
        const s = Math.floor(sec % 60);
        return `${String(hrs).padStart(2, '0')}:${String(mins).padStart(2, '0')}:${String(s).padStart(2, '0')},000`;
      };
      return `${index + 1}\n${formatSrtTime(sc.startTimeSec)} --> ${formatSrtTime(sc.endTimeSec)}\n${sc.lyricExcerpt || sc.title}\n`;
    })
    .join('\n');
}

export const OfficialGoogleSignInButton: React.FC<{
  onClick: () => void;
  disabled?: boolean;
  label?: string;
}> = ({ onClick, disabled, label = 'Sign in with Google' }) => (
  <button
    type="button"
    onClick={onClick}
    disabled={disabled}
    className="gsi-material-button inline-flex items-center gap-2.5 px-3.5 py-2 rounded-lg bg-white hover:bg-slate-100 text-slate-900 border border-slate-300 text-xs font-semibold shadow-sm transition-colors cursor-pointer disabled:opacity-60"
  >
    <div className="w-4 h-4 shrink-0">
      <svg
        version="1.1"
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 48 48"
        style={{ display: 'block', width: '100%', height: '100%' }}
      >
        <path
          fill="#EA4335"
          d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"
        />
        <path
          fill="#4285F4"
          d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"
        />
        <path
          fill="#FBBC05"
          d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"
        />
        <path
          fill="#34A853"
          d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"
        />
        <path fill="none" d="M0 0h48v48H0z" />
      </svg>
    </div>
    <span className="gsi-material-button-contents">{label}</span>
  </button>
);

export const GoogleDriveWorkspace: React.FC<GoogleDriveWorkspaceProps> = ({
  project,
  accessToken,
  needsAuth,
  isLoggingIn,
  onConnectGoogleDrive,
  onUpdateProject,
  onTrackUploaded,
}) => {
  const [driveFiles, setDriveFiles] = useState<DriveFileItem[]>([]);
  const [isLoadingFiles, setIsLoadingFiles] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'audio' | 'video' | 'project'>('all');
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isBusy, setIsBusy] = useState(false);
  const [pendingConfirm, setPendingConfirm] = useState<PendingConfirmAction | null>(null);

  const fetchDriveFiles = useCallback(async () => {
    const token = accessToken || (await getAccessToken());
    if (!token) return;

    setIsLoadingFiles(true);
    setErrorMessage(null);
    try {
      const qParts = ['trashed = false'];
      if (searchQuery.trim()) {
        const escaped = searchQuery.trim().replace(/'/g, "\\'");
        qParts.push(`name contains '${escaped}'`);
      }
      if (filterType === 'audio') {
        qParts.push(`(mimeType contains 'audio/' or name contains '.mp3' or name contains '.wav')`);
      } else if (filterType === 'video') {
        qParts.push(`(mimeType contains 'video/' or name contains '.mp4')`);
      } else if (filterType === 'project') {
        qParts.push(`(name contains '.json' or name contains '.srt' or name contains '.txt')`);
      }

      const params = new URLSearchParams({
        pageSize: '30',
        orderBy: 'modifiedTime desc',
        fields: 'files(id,name,mimeType,size,modifiedTime,webViewLink)',
        q: qParts.join(' and '),
      });

      const res = await fetch(`https://www.googleapis.com/drive/v3/files?${params.toString()}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(
          errData?.error?.message || `Google Drive request failed (${res.status})`
        );
      }

      const data = await res.json();
      setDriveFiles(Array.isArray(data.files) ? data.files : []);
    } catch (err) {
      setErrorMessage(
        err instanceof Error ? err.message : 'Unable to list Google Drive files.'
      );
    } finally {
      setIsLoadingFiles(false);
    }
  }, [accessToken, searchQuery, filterType]);

  useEffect(() => {
    if (accessToken && !needsAuth) {
      void fetchDriveFiles();
    }
  }, [accessToken, needsAuth, fetchDriveFiles]);

  const uploadMultipartToDrive = async (
    fileName: string,
    mimeType: string,
    blob: Blob,
    existingFileId?: string
  ) => {
    const token = accessToken || (await getAccessToken());
    if (!token) {
      setErrorMessage('Please sign in with Google to upload files to Google Drive.');
      return;
    }

    setIsBusy(true);
    setErrorMessage(null);
    setStatusMessage(null);
    try {
      const metadata = {
        name: fileName,
        mimeType,
      };
      const form = new FormData();
      form.append(
        'metadata',
        new Blob([JSON.stringify(metadata)], { type: 'application/json' })
      );
      form.append('file', blob);

      const endpoint = existingFileId
        ? `https://www.googleapis.com/upload/drive/v3/files/${encodeURIComponent(existingFileId)}?uploadType=multipart`
        : 'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart';

      const res = await fetch(endpoint, {
        method: existingFileId ? 'PATCH' : 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: form,
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(
          errData?.error?.message || `Failed to upload "${fileName}" to Google Drive.`
        );
      }

      const saved = await res.json();
      setStatusMessage(
        existingFileId
          ? `Updated "${saved.name || fileName}" in your Google Drive.`
          : `Saved "${saved.name || fileName}" to your Google Drive.`
      );
      await fetchDriveFiles();
    } catch (err) {
      setErrorMessage(
        err instanceof Error ? err.message : 'Google Drive upload failed.'
      );
    } finally {
      setIsBusy(false);
    }
  };

  const handleSaveProjectJsonToDrive = async () => {
    const safeTitle = project.title.toLowerCase().replace(/[^a-z0-9]+/g, '_');
    const fileName = `${safeTitle}_studio_project.json`;
    const blob = new Blob([JSON.stringify(project, null, 2)], {
      type: 'application/json',
    });

    const existing = driveFiles.find((f) => f.name === fileName);
    if (existing) {
      setPendingConfirm({
        type: 'overwrite',
        fileId: existing.id,
        fileName,
        payloadBlob: blob,
        mimeType: 'application/json',
      });
      return;
    }
    await uploadMultipartToDrive(fileName, 'application/json', blob);
  };

  const handleSaveSubtitlesSrtToDrive = async () => {
    const safeTitle = project.title.toLowerCase().replace(/[^a-z0-9]+/g, '_');
    const fileName = `${safeTitle}_subtitles.srt`;
    const srtText = buildSrtContent(project);
    const blob = new Blob([srtText], { type: 'text/plain;charset=utf-8' });

    const existing = driveFiles.find((f) => f.name === fileName);
    if (existing) {
      setPendingConfirm({
        type: 'overwrite',
        fileId: existing.id,
        fileName,
        payloadBlob: blob,
        mimeType: 'text/plain',
      });
      return;
    }
    await uploadMultipartToDrive(fileName, 'text/plain', blob);
  };

  const handleSaveRenderedMp4ToDrive = async () => {
    if (!project.renderedMasterDownloadUrl) {
      setErrorMessage(
        'Render your master MP4 video first in the Storyboard or Video Editor before uploading to Google Drive.'
      );
      return;
    }
    setIsBusy(true);
    setErrorMessage(null);
    try {
      const mp4Res = await fetch(project.renderedMasterDownloadUrl);
      if (!mp4Res.ok) {
        throw new Error('Could not read rendered MP4 file from studio server.');
      }
      const mp4Blob = await mp4Res.blob();
      const safeTitle = project.title.toLowerCase().replace(/[^a-z0-9]+/g, '_');
      const fileName = `${safeTitle}_${project.resolution}.mp4`;

      const existing = driveFiles.find((f) => f.name === fileName);
      if (existing) {
        setIsBusy(false);
        setPendingConfirm({
          type: 'overwrite',
          fileId: existing.id,
          fileName,
          payloadBlob: mp4Blob,
          mimeType: 'video/mp4',
        });
        return;
      }

      await uploadMultipartToDrive(fileName, 'video/mp4', mp4Blob);
    } catch (err) {
      setErrorMessage(
        err instanceof Error ? err.message : 'Failed to upload MP4 to Google Drive.'
      );
      setIsBusy(false);
    }
  };

  const handleImportFileFromDrive = async (file: DriveFileItem) => {
    const token = accessToken || (await getAccessToken());
    if (!token) return;

    setIsBusy(true);
    setErrorMessage(null);
    setStatusMessage(null);
    try {
      const res = await fetch(
        `https://www.googleapis.com/drive/v3/files/${encodeURIComponent(file.id)}?alt=media`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (!res.ok) {
        throw new Error(`Failed to download "${file.name}" from Google Drive.`);
      }

      if (file.name.endsWith('.json') || file.mimeType === 'application/json') {
        const importedProject = (await res.json()) as Partial<MusicVideoProject>;
        if (importedProject && Array.isArray(importedProject.scenes)) {
          onUpdateProject({
            ...project,
            title: importedProject.title || project.title,
            lyricsText: importedProject.lyricsText ?? project.lyricsText,
            directorStyle: importedProject.directorStyle || project.directorStyle,
            scenes: importedProject.scenes,
            completedScenes: importedProject.scenes.filter(
              (s) => s.status === 'completed'
            ).length,
          });
          setStatusMessage(
            `Imported project storyboard & settings from "${file.name}" (${importedProject.scenes.length} scenes).`
          );
          return;
        }
      }

      if (
        file.name.endsWith('.srt') ||
        file.name.endsWith('.txt') ||
        file.mimeType.startsWith('text/')
      ) {
        const textContent = await res.text();
        onUpdateProject({
          ...project,
          lyricsText: textContent.slice(0, 10000),
        });
        setStatusMessage(`Imported lyrics/subtitles from "${file.name}" into active project.`);
        return;
      }

      if (
        file.mimeType.startsWith('audio/') ||
        file.name.toLowerCase().endsWith('.mp3') ||
        file.name.toLowerCase().endsWith('.wav')
      ) {
        const blob = await res.blob();
        const arrayBuf = await blob.arrayBuffer();
        const bytes = new Uint8Array(arrayBuf);
        let binary = '';
        for (let i = 0; i < bytes.byteLength; i++) {
          binary += String.fromCharCode(bytes[i]);
        }
        const base64Audio = btoa(binary);

        const uploadRes = await fetch('/api/audio/upload', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            projectId: project.id,
            fileName: file.name,
            mimeType: file.mimeType || 'audio/mpeg',
            fileSizeBytes: blob.size,
            audioBase64: base64Audio,
          }),
        });

        if (!uploadRes.ok) {
          throw new Error('Studio audio DSP pipeline rejected the imported Drive audio file.');
        }

        const uploadData = await uploadRes.json();
        if (uploadData.track) {
          onTrackUploaded(uploadData.track);
        }
        if (uploadData.project) {
          onUpdateProject(uploadData.project);
        }
        setStatusMessage(
          `Imported audio "${file.name}" from Google Drive and analyzed waveform (${formatTimecode(uploadData.track?.durationSec || 0)}).`
        );
        return;
      }

      setStatusMessage(
        `Downloaded "${file.name}" from Google Drive (${Math.round((Number(file.size) || 0) / 1024)} KB).`
      );
    } catch (err) {
      setErrorMessage(
        err instanceof Error ? err.message : 'Failed to import file from Google Drive.'
      );
    } finally {
      setIsBusy(false);
    }
  };

  const executeConfirmedAction = async () => {
    if (!pendingConfirm) return;
    const action = pendingConfirm;
    setPendingConfirm(null);

    if (action.type === 'overwrite' && action.payloadBlob && action.mimeType) {
      await uploadMultipartToDrive(
        action.fileName,
        action.mimeType,
        action.payloadBlob,
        action.fileId
      );
      return;
    }

    if (action.type === 'delete') {
      const token = accessToken || (await getAccessToken());
      if (!token) return;
      setIsBusy(true);
      setErrorMessage(null);
      try {
        const res = await fetch(
          `https://www.googleapis.com/drive/v3/files/${encodeURIComponent(action.fileId)}`,
          {
            method: 'DELETE',
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        if (!res.ok) {
          throw new Error(`Failed to delete "${action.fileName}" from Google Drive.`);
        }
        setStatusMessage(`Deleted "${action.fileName}" from your Google Drive.`);
        setDriveFiles((prev) => prev.filter((f) => f.id !== action.fileId));
      } catch (err) {
        setErrorMessage(
          err instanceof Error ? err.message : 'Could not delete file from Google Drive.'
        );
      } finally {
        setIsBusy(false);
      }
    }
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Header Banner */}
      <div className="bg-[#0B0F19] border border-slate-800/90 rounded-2xl p-5 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-start gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-violet-600/20 border border-violet-500/40 flex items-center justify-center text-violet-300 shrink-0">
            <HardDrive className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-white">
                Google Drive Studio Cloud Sync
              </h2>
              <span
                className={`px-2 py-0.5 rounded text-[11px] font-mono border ${
                  accessToken && !needsAuth
                    ? 'bg-emerald-950/60 border-emerald-500/40 text-emerald-300'
                    : 'bg-amber-950/60 border-amber-500/40 text-amber-300'
                }`}
              >
                {accessToken && !needsAuth ? 'DRIVE CONNECTED' : 'AUTH REQUIRED'}
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1 max-w-2xl">
              Import MP3/WAV songs, lyrics, and project JSON backups directly from your Google Drive, or back up your rendered H.264 `.mp4` music videos, `.srt` subtitles, and project storyboards to the cloud.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {needsAuth || !accessToken ? (
            <OfficialGoogleSignInButton
              onClick={() => void onConnectGoogleDrive()}
              disabled={isLoggingIn}
              label={isLoggingIn ? 'Connecting Google Drive...' : 'Sign in with Google'}
            />
          ) : (
            <button
              type="button"
              onClick={() => void fetchDriveFiles()}
              disabled={isLoadingFiles || isBusy}
              className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 text-xs font-semibold rounded-xl flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoadingFiles ? 'animate-spin' : ''}`} />
              Refresh Drive Files
            </button>
          )}
        </div>
      </div>

      {statusMessage && (
        <div className="bg-emerald-950/50 border border-emerald-500/40 rounded-xl px-4 py-3 text-xs text-emerald-200 flex items-center justify-between gap-3">
          <span className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            {statusMessage}
          </span>
          <button
            type="button"
            onClick={() => setStatusMessage(null)}
            className="text-emerald-300 hover:text-white cursor-pointer"
          >
            Dismiss
          </button>
        </div>
      )}

      {errorMessage && (
        <div className="bg-rose-950/50 border border-rose-500/40 rounded-xl px-4 py-3 text-xs text-rose-200 flex items-center justify-between gap-3">
          <span className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
            {errorMessage}
          </span>
          <button
            type="button"
            onClick={() => setErrorMessage(null)}
            className="text-rose-300 hover:text-white cursor-pointer"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Auth Gate or Connected Workspace */}
      {needsAuth || !accessToken ? (
        <div className="bg-[#0B0F19] border border-slate-800/90 rounded-2xl p-8 text-center flex flex-col items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-violet-600/15 border border-violet-500/30 flex items-center justify-center text-violet-300">
            <Cloud className="w-7 h-7" />
          </div>
          <div className="max-w-md space-y-1.5">
            <h3 className="text-base font-bold text-white">
              Connect Your Google Drive Account
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Sign in with Google to browse your Drive audio tracks, import lyrics or project backups, and export rendered MP4 music videos directly to your personal Google Drive storage.
            </p>
          </div>
          <OfficialGoogleSignInButton
            onClick={() => void onConnectGoogleDrive()}
            disabled={isLoggingIn}
            label={isLoggingIn ? 'Signing in...' : 'Sign in with Google'}
          />
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left 4 Cols: Active Project Cloud Backup Actions */}
          <div className="lg:col-span-4 bg-[#0B0F19] border border-slate-800/90 rounded-2xl p-5 flex flex-col justify-between gap-5">
            <div className="space-y-4">
              <div>
                <div className="text-[11px] font-mono uppercase tracking-wider text-violet-400">
                  Active Studio Project
                </div>
                <h3 className="text-base font-bold text-white mt-0.5 truncate">
                  {project.title}
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  {project.scenes.length} Scenes · Duration {formatTimecode(project.durationSec)} ·{' '}
                  {project.resolution}
                </p>
              </div>

              <div className="space-y-2.5 pt-2 border-t border-slate-800/80">
                <button
                  type="button"
                  disabled={isBusy}
                  onClick={() => void handleSaveProjectJsonToDrive()}
                  className="w-full px-4 py-3 bg-violet-600 hover:bg-violet-500 disabled:opacity-50 text-white text-xs font-semibold rounded-xl flex items-center justify-between gap-2 transition-colors cursor-pointer"
                >
                  <span className="flex items-center gap-2">
                    <FileCode className="w-4 h-4" />
                    Save Project Backup (.json) to Drive
                  </span>
                  <Upload className="w-3.5 h-3.5" />
                </button>

                <button
                  type="button"
                  disabled={isBusy}
                  onClick={() => void handleSaveSubtitlesSrtToDrive()}
                  className="w-full px-4 py-3 bg-slate-900 hover:bg-slate-800 disabled:opacity-50 border border-slate-700 text-slate-200 text-xs font-semibold rounded-xl flex items-center justify-between gap-2 transition-colors cursor-pointer"
                >
                  <span className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-cyan-400" />
                    Save Synchronized Subtitles (.srt)
                  </span>
                  <Upload className="w-3.5 h-3.5 text-slate-400" />
                </button>

                <button
                  type="button"
                  disabled={isBusy || !project.renderedMasterDownloadUrl}
                  onClick={() => void handleSaveRenderedMp4ToDrive()}
                  className="w-full px-4 py-3 bg-emerald-600/90 hover:bg-emerald-500 disabled:opacity-40 text-white text-xs font-semibold rounded-xl flex items-center justify-between gap-2 transition-colors cursor-pointer"
                >
                  <span className="flex items-center gap-2">
                    <Film className="w-4 h-4" />
                    Upload Rendered Master MP4 to Drive
                  </span>
                  <Upload className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-950/90 border border-slate-800/80 text-[11px] text-slate-400 space-y-1">
              <div className="font-semibold text-slate-200 flex items-center gap-1.5">
                <FolderSync className="w-3.5 h-3.5 text-violet-400" />
                Protected Cloud Operations
              </div>
              <p>
                Overwriting or deleting any existing file in your Google Drive always prompts for explicit confirmation before modifying cloud data.
              </p>
            </div>
          </div>

          {/* Right 8 Cols: Google Drive File Browser */}
          <div className="lg:col-span-8 bg-[#0B0F19] border border-slate-800/90 rounded-2xl p-5 flex flex-col gap-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="relative flex-1 min-w-[200px]">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  aria-label="Search Google Drive files"
                  placeholder="Search files in your Google Drive..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') void fetchDriveFiles();
                  }}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-violet-500"
                />
              </div>

              <div className="flex items-center gap-1.5">
                {(
                  [
                    { id: 'all', label: 'All Files' },
                    { id: 'audio', label: 'Audio (MP3/WAV)' },
                    { id: 'video', label: 'Video (MP4)' },
                    { id: 'project', label: 'Project / Lyrics' },
                  ] as const
                ).map((tab) => (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setFilterType(tab.id)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium cursor-pointer transition-colors ${
                      filterType === tab.id
                        ? 'bg-violet-600 text-white'
                        : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>

            {isLoadingFiles ? (
              <div className="py-12 flex flex-col items-center justify-center gap-2 text-slate-400 text-xs">
                <Loader2 className="w-5 h-5 animate-spin text-violet-400" />
                <span>Loading your Google Drive files...</span>
              </div>
            ) : driveFiles.length === 0 ? (
              <div className="py-12 text-center text-xs text-slate-400 border border-dashed border-slate-800 rounded-xl">
                No matching files found in your Google Drive. Use the buttons on the left to save your active project backup or subtitles.
              </div>
            ) : (
              <div className="divide-y divide-slate-800/80 max-h-[420px] overflow-y-auto pr-1">
                {driveFiles.map((file) => {
                  const isAudio =
                    file.mimeType.startsWith('audio/') ||
                    file.name.endsWith('.mp3') ||
                    file.name.endsWith('.wav');
                  const isVideo =
                    file.mimeType.startsWith('video/') || file.name.endsWith('.mp4');

                  return (
                    <div
                      key={file.id}
                      className="py-3 flex flex-wrap items-center justify-between gap-3"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-8 h-8 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-center shrink-0">
                          {isAudio ? (
                            <FileAudio className="w-4 h-4 text-emerald-400" />
                          ) : isVideo ? (
                            <Film className="w-4 h-4 text-violet-400" />
                          ) : (
                            <FileText className="w-4 h-4 text-cyan-400" />
                          )}
                        </div>
                        <div className="min-w-0">
                          <div className="text-xs font-semibold text-slate-100 truncate">
                            {file.name}
                          </div>
                          <div className="text-[11px] text-slate-400 flex items-center gap-2">
                            <span>{file.mimeType}</span>
                            {file.size && (
                              <span>· {Math.max(1, Math.round(Number(file.size) / 1024))} KB</span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          type="button"
                          disabled={isBusy}
                          onClick={() => void handleImportFileFromDrive(file)}
                          className="px-2.5 py-1.5 bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 text-xs font-medium rounded-lg flex items-center gap-1 cursor-pointer disabled:opacity-50"
                        >
                          <Download className="w-3.5 h-3.5 text-violet-400" />
                          Import to Studio
                        </button>

                        {file.webViewLink && (
                          <a
                            href={file.webViewLink}
                            target="_blank"
                            rel="noreferrer"
                            aria-label={`Open ${file.name} in Google Drive`}
                            className="p-1.5 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 rounded-lg"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </a>
                        )}

                        <button
                          type="button"
                          disabled={isBusy}
                          aria-label={`Delete ${file.name} from Google Drive`}
                          onClick={() =>
                            setPendingConfirm({
                              type: 'delete',
                              fileId: file.id,
                              fileName: file.name,
                            })
                          }
                          className="p-1.5 text-rose-400 hover:bg-rose-950/40 rounded-lg cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Mandatory Destructive/Mutating Action Confirmation Modal */}
      {pendingConfirm && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="drive-confirm-title"
          className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4"
        >
          <div className="bg-[#0B0F19] border border-slate-700 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/15 border border-amber-500/40 flex items-center justify-center text-amber-400 shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h3 id="drive-confirm-title" className="text-base font-bold text-white">
                  {pendingConfirm.type === 'delete'
                    ? 'Delete File from Google Drive?'
                    : 'Overwrite Existing File in Google Drive?'}
                </h3>
                <p className="text-xs text-slate-400">
                  Explicit confirmation is required before modifying your Google Drive files.
                </p>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-200 leading-relaxed">
              {pendingConfirm.type === 'delete' ? (
                <>
                  Are you sure you want to permanently delete{' '}
                  <strong className="text-white font-mono">{pendingConfirm.fileName}</strong>{' '}
                  from your Google Drive? This action cannot be undone.
                </>
              ) : (
                <>
                  A file named{' '}
                  <strong className="text-white font-mono">{pendingConfirm.fileName}</strong>{' '}
                  already exists in your Google Drive. Do you want to overwrite its contents with the current studio export?
                </>
              )}
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setPendingConfirm(null)}
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 text-xs font-semibold rounded-xl cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => void executeConfirmedAction()}
                className={`px-4 py-2 text-white text-xs font-semibold rounded-xl cursor-pointer ${
                  pendingConfirm.type === 'delete'
                    ? 'bg-rose-600 hover:bg-rose-500'
                    : 'bg-violet-600 hover:bg-violet-500'
                }`}
              >
                {pendingConfirm.type === 'delete' ? 'Confirm Delete' : 'Confirm Overwrite'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

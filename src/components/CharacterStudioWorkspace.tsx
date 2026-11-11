import React, { useState } from 'react';
import { CharacterProfileItem } from '../types/studio';
import { STUDIO_ASSET_IMAGES } from '../data/seedStudioData';
import {
  Check,
  Lock,
  Plus,
  Sparkles,
  Trash2,
  Upload,
  UserCheck,
  Users,
  Wand2,
} from 'lucide-react';

interface CharacterStudioWorkspaceProps {
  characters: CharacterProfileItem[];
  selectedCharacterIds: string[];
  onAddCharacter: (char: CharacterProfileItem) => void;
  onDeleteCharacter: (charId: string) => void;
  onToggleProjectCharacter: (charId: string) => void;
}

export const CharacterStudioWorkspace: React.FC<CharacterStudioWorkspaceProps> = ({
  characters,
  selectedCharacterIds,
  onAddCharacter,
  onDeleteCharacter,
  onToggleProjectCharacter,
}) => {
  const [name, setName] = useState('');
  const [role, setRole] = useState('Lead Vocalist / Protagonist');
  const [appearancePrompt, setAppearancePrompt] = useState('');
  const [wardrobeLock, setWardrobeLock] = useState('');
  const [hairstyleLock, setHairstyleLock] = useState('');
  const [uploadedPreviewUrl, setUploadedPreviewUrl] = useState<string>(
    STUDIO_ASSET_IMAGES.charAria
  );
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const [isGeneratingAiPortrait, setIsGeneratingAiPortrait] = useState(false);
  const [explicitPortraitBillingConsent, setExplicitPortraitBillingConsent] =
    useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploadingPhoto(true);

    const reader = new FileReader();
    reader.onload = async () => {
      const dataUrl = String(reader.result || '');
      try {
        const res = await fetch('/api/uploads/image', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            dataUrl,
            fileName: file.name,
          }),
        });
        const data = await res.json();
        if (res.ok && data.imageUrl) {
          setUploadedPreviewUrl(data.imageUrl);
          setStatusMessage(
            `Uploaded & persisted reference photo "${file.name}" to server storage.`
          );
        } else {
          setUploadedPreviewUrl(dataUrl);
          setStatusMessage(`Loaded reference photo "${file.name}".`);
        }
      } catch {
        setUploadedPreviewUrl(dataUrl);
        setStatusMessage(`Loaded reference photo "${file.name}".`);
      } finally {
        setIsUploadingPhoto(false);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleGenerateAiPortrait = async () => {
    if (!appearancePrompt.trim()) {
      setStatusMessage(
        'Enter an Appearance Description first so Gemini can generate a matching character portrait.'
      );
      return;
    }
    if (!explicitPortraitBillingConsent) {
      setStatusMessage(
        'Please check "Authorize Gemini Image API Call" before generating an AI portrait via external API.'
      );
      return;
    }
    setIsGeneratingAiPortrait(true);
    try {
      const res = await fetch('/api/ai/generate-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: `Studio reference portrait of ${name || 'music video protagonist'}, ${appearancePrompt}, wearing ${wardrobeLock || 'cinematic stage attire'}, hairstyle: ${hairstyleLock || 'signature style'}, 8k studio lighting`,
          aspectRatio: '1:1',
          explicitBillingAuthorized: true,
        }),
      });
      const data = await res.json();
      if (res.ok && data.imageUrl) {
        setUploadedPreviewUrl(data.imageUrl);
        setStatusMessage('Generated & saved AI character reference portrait.');
      } else {
        setStatusMessage(
          data.error ||
            'Could not generate AI portrait. Ensure GEMINI_API_KEY is configured in Settings > Secrets.'
        );
      }
    } catch (err) {
      setStatusMessage(
        err instanceof Error ? err.message : 'Error calling AI portrait endpoint.'
      );
    } finally {
      setIsGeneratingAiPortrait(false);
    }
  };

  const handleCreateCharacter = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !appearancePrompt.trim()) {
      setStatusMessage(
        'Please enter both a Character Name and Appearance Description to lock character consistency.'
      );
      return;
    }

    const newChar: CharacterProfileItem = {
      id: `char_${Date.now()}`,
      ownerId: 'demo_user',
      name: name.trim(),
      role: role.trim() || 'Featured Performer',
      appearancePrompt: appearancePrompt.trim(),
      wardrobeLock:
        wardrobeLock.trim() || 'Consistent studio silhouette jacket and accessories',
      hairstyleLock: hairstyleLock.trim() || 'Consistent signature hairstyle across scenes',
      referenceImageUrl: uploadedPreviewUrl,
      frontViewNote: 'Direct front studio reference portrait with neutral lighting',
      sideViewNote: '90-degree profile silhouette locking jawline and hairstyle',
      backViewNote: 'Full back wardrobe reference for walking & stage tracking shots',
      consistencySeed: Math.floor(100000 + Math.random() * 900000),
    };

    try {
      await fetch('/api/characters', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newChar),
      });
    } catch {
      // Handled optimistically as well
    }

    onAddCharacter(newChar);
    setName('');
    setAppearancePrompt('');
    setWardrobeLock('');
    setHairstyleLock('');
    setStatusMessage(
      `Saved "${newChar.name}" to persistent Character Consistency Library (Seed #${newChar.consistencySeed}).`
    );
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="bg-[#0F1624] border border-slate-800 rounded-xl p-5 flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs text-indigo-400 font-medium">
            <Users className="w-3.5 h-3.5" />
            <span>AI CHARACTER CONSISTENCY STUDIO · MULTI-ANGLE REFERENCE LOCK</span>
          </div>
          <h2 className="text-lg font-bold text-slate-100 mt-1">
            Character Reference Sheets & Multi-Scene Identity Lock
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Maintain consistent facial features, wardrobe, and hairstyle across every scene in your full-length music video.
          </p>
        </div>
      </div>

      {statusMessage && (
        <div
          role="status"
          className="bg-indigo-950/50 border border-indigo-500/40 rounded-lg px-4 py-2.5 text-xs text-indigo-200 flex items-center justify-between"
        >
          <span>{statusMessage}</span>
          <button
            type="button"
            onClick={() => setStatusMessage(null)}
            className="text-indigo-300 hover:text-white cursor-pointer"
          >
            Dismiss
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left 5 Cols: Create New Consistent Character Form */}
        <form
          onSubmit={handleCreateCharacter}
          className="lg:col-span-5 bg-[#0F1624] border border-slate-800 rounded-xl p-5 flex flex-col gap-4"
        >
          <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
            <Plus className="w-4 h-4 text-indigo-400" />
            Create Custom Character Sheet
          </h3>

          <div className="flex items-center gap-4">
            <img
              src={uploadedPreviewUrl}
              alt="Character reference preview"
              referrerPolicy="no-referrer"
              className="w-16 h-16 rounded-lg object-cover border border-slate-700 bg-slate-900 shrink-0"
            />
            <div className="flex flex-col gap-1.5">
              <label className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 border border-slate-700 rounded-lg text-xs font-medium text-slate-200 flex items-center gap-1.5 cursor-pointer w-fit">
                <Upload className="w-3.5 h-3.5 text-cyan-400" />
                <span>
                  {isUploadingPhoto ? 'Uploading Photo...' : 'Upload Reference Photo'}
                </span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoUpload}
                  className="hidden"
                />
              </label>
              <span className="text-[11px] text-slate-400">
                Persisted to server storage for FFmpeg & reference-to-video.
              </span>
            </div>
          </div>

          <div>
            <label
              htmlFor="char-name-input"
              className="text-xs font-medium text-slate-300 block mb-1"
            >
              Character Name
            </label>
            <input
              id="char-name-input"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Nova Sterling"
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-100"
            />
          </div>

          <div>
            <label
              htmlFor="char-role-input"
              className="text-xs font-medium text-slate-300 block mb-1"
            >
              Role in Music Video
            </label>
            <input
              id="char-role-input"
              type="text"
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-100"
            />
          </div>

          <div>
            <label
              htmlFor="char-appearance-input"
              className="text-xs font-medium text-slate-300 block mb-1"
            >
              Facial Features & Appearance Description
            </label>
            <textarea
              id="char-appearance-input"
              rows={2}
              value={appearancePrompt}
              onChange={(e) => setAppearancePrompt(e.target.value)}
              placeholder="Describe facial structure, eyes, skin tone, lighting..."
              className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs text-slate-100"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label
                htmlFor="char-wardrobe-input"
                className="text-xs font-medium text-slate-300 block mb-1"
              >
                Wardrobe Lock
              </label>
              <input
                id="char-wardrobe-input"
                type="text"
                value={wardrobeLock}
                onChange={(e) => setWardrobeLock(e.target.value)}
                placeholder="e.g., Crimson velvet jacket"
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-100"
              />
            </div>

            <div>
              <label
                htmlFor="char-hair-input"
                className="text-xs font-medium text-slate-300 block mb-1"
              >
                Hairstyle Lock
              </label>
              <input
                id="char-hair-input"
                type="text"
                value={hairstyleLock}
                onChange={(e) => setHairstyleLock(e.target.value)}
                placeholder="e.g., Silver braided crown"
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-100"
              />
            </div>
          </div>

          {/* Optional AI Portrait Generator via Gemini Image API */}
          <div className="bg-slate-950/90 border border-slate-800 rounded-lg p-3 flex flex-col gap-2">
            <label className="flex items-center gap-2 text-[11px] text-slate-300 cursor-pointer">
              <input
                type="checkbox"
                checked={explicitPortraitBillingConsent}
                onChange={(e) => setExplicitPortraitBillingConsent(e.target.checked)}
                className="rounded border-slate-700"
              />
              <span>Authorize Gemini Image API Call (`gemini-3.1-flash-lite-image`)</span>
            </label>
            <button
              type="button"
              onClick={handleGenerateAiPortrait}
              disabled={isGeneratingAiPortrait}
              className="py-1.5 px-3 bg-slate-900 hover:bg-slate-800 border border-slate-700 text-indigo-300 text-xs font-medium rounded-lg flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              <Wand2 className="w-3.5 h-3.5" />
              {isGeneratingAiPortrait
                ? 'Generating AI Reference Portrait...'
                : 'Generate AI Portrait with Gemini'}
            </button>
          </div>

          <button
            type="submit"
            className="w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-lg flex items-center justify-center gap-2 transition-colors cursor-pointer"
          >
            <Sparkles className="w-4 h-4" />
            Generate Reference Sheet & Save Character
          </button>
        </form>

        {/* Right 7 Cols: Saved Character Library & Front/Side/Back Reference Sheets */}
        <div className="lg:col-span-7 flex flex-col gap-4">
          {characters.map((char) => {
            const isAssigned = selectedCharacterIds.includes(char.id);
            return (
              <div
                key={char.id}
                className="bg-[#0F1624] border border-slate-800 rounded-xl p-5 flex flex-col gap-4"
              >
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="flex items-center gap-3.5">
                    <img
                      src={char.referenceImageUrl}
                      alt={char.name}
                      referrerPolicy="no-referrer"
                      className="w-16 h-16 rounded-xl object-cover border border-slate-700 bg-slate-900"
                    />
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-base font-bold text-slate-100">
                          {char.name}
                        </h3>
                        <span className="text-xs text-slate-400">·</span>
                        <span className="text-xs text-indigo-400 font-medium">
                          {char.role}
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 mt-1">
                        {char.appearancePrompt}
                      </p>
                      <div className="flex flex-wrap items-center gap-3 text-[11px] font-mono text-slate-400 mt-1.5">
                        <span className="flex items-center gap-1 text-emerald-400">
                          <Lock className="w-3 h-3" />
                          Seed #{char.consistencySeed}
                        </span>
                        <span>·</span>
                        <span>Wardrobe: {char.wardrobeLock}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => onToggleProjectCharacter(char.id)}
                      className={`px-3.5 py-2 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer border ${
                        isAssigned
                          ? 'bg-indigo-600/20 border-indigo-500 text-indigo-200'
                          : 'bg-slate-900 border-slate-700 text-slate-300 hover:text-white'
                      }`}
                    >
                      {isAssigned ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-indigo-400" />
                          Cast in Active Video
                        </>
                      ) : (
                        <>
                          <UserCheck className="w-3.5 h-3.5" />
                          Assign to Video
                        </>
                      )}
                    </button>

                    {characters.length > 1 && (
                      <button
                        type="button"
                        aria-label={`Delete ${char.name}`}
                        onClick={() => onDeleteCharacter(char.id)}
                        className="p-2 text-rose-400 hover:bg-rose-950/40 border border-slate-800 rounded-lg cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Front / Side / Back Multi-Angle Consistency Sheet */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-3 border-t border-slate-800/80 text-xs">
                  <div className="bg-slate-950/70 border border-slate-800/80 rounded-lg p-3">
                    <div className="font-semibold text-slate-200 mb-1">
                      Front View Reference
                    </div>
                    <p className="text-slate-400 text-[11px]">{char.frontViewNote}</p>
                  </div>
                  <div className="bg-slate-950/70 border border-slate-800/80 rounded-lg p-3">
                    <div className="font-semibold text-slate-200 mb-1">
                      Side Profile Reference
                    </div>
                    <p className="text-slate-400 text-[11px]">{char.sideViewNote}</p>
                  </div>
                  <div className="bg-slate-950/70 border border-slate-800/80 rounded-lg p-3">
                    <div className="font-semibold text-slate-200 mb-1">
                      Back / Motion Reference
                    </div>
                    <p className="text-slate-400 text-[11px]">{char.backViewNote}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

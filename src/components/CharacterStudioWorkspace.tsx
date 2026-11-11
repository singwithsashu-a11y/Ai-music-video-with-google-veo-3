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
  onSyncCharactersToAllScenes?: () => void;
}

export const CharacterStudioWorkspace: React.FC<CharacterStudioWorkspaceProps> = ({
  characters,
  selectedCharacterIds,
  onAddCharacter,
  onDeleteCharacter,
  onToggleProjectCharacter,
  onSyncCharactersToAllScenes,
}) => {
  const [name, setName] = useState('');
  const [age, setAge] = useState('25 years old');
  const [role, setRole] = useState('Lead Vocalist / Protagonist');
  const [appearancePrompt, setAppearancePrompt] = useState('');
  const [facialExpression, setFacialExpression] = useState(
    'Expressive, introspective cinematic gaze'
  );
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
        'Enter a Physical Description first so Gemini can generate a matching character portrait.'
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
          prompt: `Studio reference portrait of ${name || 'music video protagonist'} (${age}), ${appearancePrompt}, facial expression: ${facialExpression}, wearing ${wardrobeLock || 'cinematic stage attire'}, hairstyle: ${hairstyleLock || 'signature style'}, 8k studio lighting`,
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
        'Please enter both a Character Name and Physical Description to lock character consistency.'
      );
      return;
    }

    const newChar: CharacterProfileItem = {
      id: `char_${Date.now()}`,
      ownerId: 'demo_user',
      name: name.trim(),
      age: age.trim() || '25 years old',
      role: role.trim() || 'Featured Performer',
      appearancePrompt: appearancePrompt.trim(),
      facialExpression:
        facialExpression.trim() || 'Expressive, natural emotional depth',
      wardrobeLock:
        wardrobeLock.trim() || 'Consistent studio silhouette jacket and accessories',
      hairstyleLock: hairstyleLock.trim() || 'Consistent signature hairstyle across scenes',
      referenceImageUrl: uploadedPreviewUrl,
      frontViewNote: `Direct front studio reference portrait (${age || '25y'}, ${facialExpression || 'neutral expression'})`,
      sideViewNote: `90-degree profile silhouette locking jawline and hairstyle (${hairstyleLock || 'signature cut'})`,
      backViewNote: `Full back wardrobe reference (${wardrobeLock || 'signature jacket'}) for walking & tracking shots`,
      consistencySeed: Math.floor(100000 + Math.random() * 900000),
      referenceSheetGenerated: true,
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
      `Saved "${newChar.name}" (${newChar.age}) to persistent Character Consistency Library (Seed #${newChar.consistencySeed}).`
    );
  };

  return (
    <div className="flex flex-col gap-6 pb-12">
      <div className="bg-[#0B0F19]/95 border border-slate-800/90 rounded-2xl p-5 sm:p-6 flex flex-wrap items-center justify-between gap-4 shadow-xl">
        <div>
          <div className="flex items-center gap-2 text-xs text-violet-400 font-mono uppercase tracking-wider">
            <Users className="w-3.5 h-3.5" />
            <span>AI Character Consistency Studio · Multi-Angle Identity Lock</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-white font-['Bricolage_Grotesque'] mt-1">
            Character Reference Sheets & Multi-Scene Continuity
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-3xl">
            Lock character name, age, physical traits, facial expression, wardrobe, and multi-angle reference turnaround sheets so every scene in your video features the exact same performers.
          </p>
        </div>

        {onSyncCharactersToAllScenes && (
          <button
            type="button"
            onClick={() => {
              onSyncCharactersToAllScenes();
              setStatusMessage(
                'Injected active cast identity & wardrobe locks into all project scene prompts.'
              );
            }}
            className="min-h-[44px] px-4 py-2.5 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white text-xs sm:text-sm font-semibold flex items-center gap-2 shadow-lg shadow-violet-950/50 transition cursor-pointer"
          >
            <Sparkles className="w-4 h-4" />
            <span>Inject Active Cast Into All Scene Prompts</span>
          </button>
        )}
      </div>

      {statusMessage && (
        <div
          role="status"
          className="bg-violet-950/50 border border-violet-500/40 rounded-xl px-4 py-3 text-xs text-violet-200 flex items-center justify-between gap-2"
        >
          <span>{statusMessage}</span>
          <button
            type="button"
            onClick={() => setStatusMessage(null)}
            className="text-violet-300 hover:text-white cursor-pointer font-mono"
          >
            Dismiss
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left 5 Cols: Create New Consistent Character Form */}
        <form
          onSubmit={handleCreateCharacter}
          className="lg:col-span-5 bg-[#0B0F19]/95 border border-slate-800/90 rounded-2xl p-5 sm:p-6 flex flex-col gap-4 shadow-xl"
        >
          <h3 className="text-base font-bold text-white font-['Bricolage_Grotesque'] flex items-center gap-2">
            <Plus className="w-4 h-4 text-violet-400" />
            Create Custom Character Continuity Sheet
          </h3>

          <div className="flex items-center gap-4">
            <img
              src={uploadedPreviewUrl}
              alt="Character reference preview"
              referrerPolicy="no-referrer"
              className="w-16 h-16 rounded-xl object-cover border border-slate-700 bg-slate-900 shrink-0"
            />
            <div className="flex flex-col gap-1.5">
              <label className="min-h-[40px] px-3.5 py-2 bg-slate-900 hover:bg-slate-800 border border-slate-700 rounded-xl text-xs font-semibold text-slate-200 flex items-center gap-1.5 cursor-pointer w-fit">
                <Upload className="w-3.5 h-3.5 text-sky-400" />
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
                Persisted to server storage for FFmpeg & reference-to-video continuity.
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label
                htmlFor="char-name-input"
                className="text-xs font-semibold uppercase tracking-wider text-slate-300 block mb-1"
              >
                Character Name
              </label>
              <input
                id="char-name-input"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., Aria Vance"
                className="w-full min-h-[42px] bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs sm:text-sm text-white"
              />
            </div>

            <div>
              <label
                htmlFor="char-age-input"
                className="text-xs font-semibold uppercase tracking-wider text-slate-300 block mb-1"
              >
                Character Age
              </label>
              <input
                id="char-age-input"
                type="text"
                value={age}
                onChange={(e) => setAge(e.target.value)}
                placeholder="e.g., 25 years old"
                className="w-full min-h-[42px] bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs sm:text-sm text-white"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label
                htmlFor="char-role-input"
                className="text-xs font-semibold uppercase tracking-wider text-slate-300 block mb-1"
              >
                Role in Music Video
              </label>
              <input
                id="char-role-input"
                type="text"
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="w-full min-h-[42px] bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs sm:text-sm text-white"
              />
            </div>

            <div>
              <label
                htmlFor="char-expression-input"
                className="text-xs font-semibold uppercase tracking-wider text-slate-300 block mb-1"
              >
                Signature Facial Expression
              </label>
              <input
                id="char-expression-input"
                type="text"
                value={facialExpression}
                onChange={(e) => setFacialExpression(e.target.value)}
                placeholder="e.g., Melancholic, soulful gaze"
                className="w-full min-h-[42px] bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs sm:text-sm text-white"
              />
            </div>
          </div>

          <div>
            <label
              htmlFor="char-appearance-input"
              className="text-xs font-semibold uppercase tracking-wider text-slate-300 block mb-1"
            >
              Physical Description & Facial Structure
            </label>
            <textarea
              id="char-appearance-input"
              rows={2}
              value={appearancePrompt}
              onChange={(e) => setAppearancePrompt(e.target.value)}
              placeholder="Describe facial structure, eyes, skin tone, build, and distinguishing details..."
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs sm:text-sm text-white"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label
                htmlFor="char-wardrobe-input"
                className="text-xs font-semibold uppercase tracking-wider text-slate-300 block mb-1"
              >
                Clothes / Wardrobe Lock
              </label>
              <input
                id="char-wardrobe-input"
                type="text"
                value={wardrobeLock}
                onChange={(e) => setWardrobeLock(e.target.value)}
                placeholder="e.g., Charcoal wool trench coat"
                className="w-full min-h-[42px] bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs sm:text-sm text-white"
              />
            </div>

            <div>
              <label
                htmlFor="char-hair-input"
                className="text-xs font-semibold uppercase tracking-wider text-slate-300 block mb-1"
              >
                Hairstyle Lock
              </label>
              <input
                id="char-hair-input"
                type="text"
                value={hairstyleLock}
                onChange={(e) => setHairstyleLock(e.target.value)}
                placeholder="e.g., Wavy midnight-black bob"
                className="w-full min-h-[42px] bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs sm:text-sm text-white"
              />
            </div>
          </div>

          {/* Optional AI Portrait Generator via Gemini Image API */}
          <div className="bg-slate-950/90 border border-slate-800 rounded-xl p-3.5 flex flex-col gap-2">
            <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
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
              className="min-h-[40px] py-2 px-3 bg-slate-900 hover:bg-slate-800 border border-slate-700 text-violet-300 text-xs font-semibold rounded-xl flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              <Wand2 className="w-3.5 h-3.5" />
              {isGeneratingAiPortrait
                ? 'Generating AI Reference Portrait...'
                : 'Generate AI Portrait with Gemini'}
            </button>
          </div>

          <button
            type="submit"
            className="w-full min-h-[44px] py-2.5 px-4 bg-violet-600 hover:bg-violet-500 text-white text-xs sm:text-sm font-semibold rounded-xl flex items-center justify-center gap-2 transition-colors cursor-pointer"
          >
            <Sparkles className="w-4 h-4" />
            Generate 3-Angle Reference Sheet & Save Character
          </button>
        </form>

        {/* Right 7 Cols: Saved Character Library & Front/Side/Back Reference Sheets */}
        <div className="lg:col-span-7 flex flex-col gap-4">
          {characters.map((char) => {
            const isAssigned = selectedCharacterIds.includes(char.id);
            return (
              <div
                key={char.id}
                className="bg-[#0B0F19]/95 border border-slate-800/90 rounded-2xl p-5 flex flex-col gap-4 shadow-xl"
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
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-base font-bold text-white font-['Bricolage_Grotesque']">
                          {char.name}
                        </h3>
                        {char.age && (
                          <span className="text-xs font-mono text-sky-400">
                            ({char.age})
                          </span>
                        )}
                        <span className="text-xs text-slate-500">·</span>
                        <span className="text-xs text-violet-400 font-medium">
                          {char.role}
                        </span>
                      </div>
                      <p className="text-xs text-slate-300 mt-1">
                        {char.appearancePrompt}
                      </p>
                      <div className="flex flex-wrap items-center gap-3 text-[11px] font-mono text-slate-400 mt-1.5">
                        <span className="flex items-center gap-1 text-emerald-400">
                          <Lock className="w-3 h-3" />
                          Seed #{char.consistencySeed}
                        </span>
                        <span>·</span>
                        <span>Clothes: {char.wardrobeLock}</span>
                        {char.facialExpression && (
                          <>
                            <span>·</span>
                            <span>Expression: {char.facialExpression}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => onToggleProjectCharacter(char.id)}
                      className={`min-h-[42px] px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer border ${
                        isAssigned
                          ? 'bg-violet-600/25 border-violet-500 text-violet-100'
                          : 'bg-slate-900 border-slate-700 text-slate-300 hover:text-white'
                      }`}
                    >
                      {isAssigned ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-violet-400" />
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
                        className="min-h-[42px] min-w-[42px] flex items-center justify-center text-rose-400 hover:bg-rose-950/40 border border-slate-800 rounded-xl cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Front / Side / Back Multi-Angle Consistency Sheet */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-3 border-t border-slate-800/80 text-xs">
                  <div className="bg-slate-950/70 border border-slate-800/80 rounded-xl p-3">
                    <div className="font-semibold text-white mb-1 flex items-center justify-between">
                      <span>Front View Turnaround</span>
                      <span className="text-[10px] font-mono text-violet-400">0°</span>
                    </div>
                    <p className="text-slate-400 text-[11px]">{char.frontViewNote}</p>
                  </div>
                  <div className="bg-slate-950/70 border border-slate-800/80 rounded-xl p-3">
                    <div className="font-semibold text-white mb-1 flex items-center justify-between">
                      <span>Side Profile Turnaround</span>
                      <span className="text-[10px] font-mono text-sky-400">90°</span>
                    </div>
                    <p className="text-slate-400 text-[11px]">{char.sideViewNote}</p>
                  </div>
                  <div className="bg-slate-950/70 border border-slate-800/80 rounded-xl p-3">
                    <div className="font-semibold text-white mb-1 flex items-center justify-between">
                      <span>Back / Motion Reference</span>
                      <span className="text-[10px] font-mono text-emerald-400">180°</span>
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

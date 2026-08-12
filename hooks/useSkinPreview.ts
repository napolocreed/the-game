import { useCallback, useState } from 'react';
import { Skin } from '../types';
import { SKIN_BY_ID } from '../utils/skinCatalog';
import { livingStage } from '../utils/patina';

/**
 * A workshop for looking at skins you have not earned.
 *
 * Forty-seven skins spread over five years is a lot of work nobody can see,
 * so this exists to look at all of it — but only to LOOK. The preview lives in
 * sessionStorage and is never written into the save: it cannot grant a skin,
 * cannot mark one as seen, and is gone the moment the tab closes. The worst it
 * can do is show you the wrong colours until you press stop.
 *
 * The unlock flag itself is persisted, because re-entering the gesture on every
 * cold start would make the thing useless on a phone. It changes nothing on its
 * own — it only reveals the panel.
 */

const FLAG_KEY = 'devMode';
const SKIN_KEY = 'previewSkin';
const AGE_KEY = 'previewAgeDays';

/** Storage can be unavailable (private mode, blocked cookies) — never throw. */
const read = (store: Storage, key: string): string | null => {
  try { return store.getItem(key); } catch { return null; }
};
const write = (store: Storage, key: string, value: string | null): void => {
  try { value === null ? store.removeItem(key) : store.setItem(key, value); } catch { /* ignore */ }
};

export interface SkinPreview {
  devMode: boolean;
  enableDevMode: () => void;
  disableDevMode: () => void;
  /** The skin being previewed, or null when showing the real one. */
  previewSkinId: string | null;
  setPreviewSkinId: (id: string | null) => void;
  /** Account age to pretend, for watching a living skin grow. Null = the truth. */
  previewAgeDays: number | null;
  setPreviewAgeDays: (days: number | null) => void;
}

export const useSkinPreview = (): SkinPreview => {
  const [devMode, setDevMode] = useState(() => read(localStorage, FLAG_KEY) === '1');
  const [previewSkinId, setSkin] = useState<string | null>(() => read(sessionStorage, SKIN_KEY));
  const [previewAgeDays, setAge] = useState<number | null>(() => {
    const raw = read(sessionStorage, AGE_KEY);
    return raw === null ? null : Number(raw);
  });

  const setPreviewSkinId = useCallback((id: string | null) => {
    setSkin(id);
    write(sessionStorage, SKIN_KEY, id);
  }, []);

  const setPreviewAgeDays = useCallback((days: number | null) => {
    setAge(days);
    write(sessionStorage, AGE_KEY, days === null ? null : String(days));
  }, []);

  const enableDevMode = useCallback(() => {
    setDevMode(true);
    write(localStorage, FLAG_KEY, '1');
  }, []);

  const disableDevMode = useCallback(() => {
    setDevMode(false);
    write(localStorage, FLAG_KEY, null);
    setPreviewSkinId(null);
    setPreviewAgeDays(null);
  }, [setPreviewSkinId, setPreviewAgeDays]);

  return {
    devMode, enableDevMode, disableDevMode,
    previewSkinId, setPreviewSkinId,
    previewAgeDays, setPreviewAgeDays,
  };
};

/**
 * Which skin to paint, and how old to paint it.
 *
 * A preview overrides both. Age applies to any living skin, so one slider
 * answers "what does this look like after two years?" for all of them without
 * the tester having to know each one's unlock threshold.
 */
export const resolveShownSkin = (
  active: Skin, preview: SkinPreview, realSeniorityDays: number,
): { skin: Skin; stage: number } => {
  const skin = (preview.previewSkinId && SKIN_BY_ID.get(preview.previewSkinId)) || active;
  const days = preview.previewAgeDays ?? realSeniorityDays;
  const stage = skin.unlock.kind === 'seniority' ? livingStage(days, skin.unlock.days) : 0;
  return { skin, stage };
};

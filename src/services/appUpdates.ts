import { Alert, Linking, Platform } from 'react-native';
import Constants from 'expo-constants';
import * as SecureStore from 'expo-secure-store';
import { API_BASE_URL } from './api';

export type AppPlatform = 'android' | 'ios';
export type UpdateMode = 'optional' | 'force';

export type AppUpdateDecision = {
  platform: AppPlatform;
  currentVersion: string;
  currentBuild: number;
  updateRequired: boolean;
  forceUpdate: boolean;
  latestVersion: string | null;
  minimumVersion: string | null;
  buildNumber: number | null;
  minimumBuildNumber: number | null;
  updateMode: UpdateMode | null;
  storeUrl: string | null;
  title: string | null;
  message: string | null;
  releaseNotes: string | null;
  releasedAt: string | null;
};

const CACHE_KEY = 'ultim.appUpdate.release.v1';
const REQUEST_TIMEOUT_MS = 3500;

export const APP_VERSION = Constants.expoConfig?.version ?? '1.0.0';
export const APP_BUILD = Number(Constants.nativeBuildVersion ?? 0) || 0;

export const currentPlatform = (): AppPlatform | null => {
  if (Platform.OS === 'ios') return 'ios';
  if (Platform.OS === 'android') return 'android';
  return null;
};

const parseVersion = (value: string): number[] | null => {
  const core = String(value ?? '')
    .trim()
    .replace(/^v/i, '')
    .split('+')[0]
    ?.split('-')[0] ?? '';
  if (!/^\d+(\.\d+){0,3}$/.test(core)) return null;
  return core.split('.').map((part) => Number(part));
};

/** Compare dotted versions; missing segments count as zero. */
export const compareVersions = (a: string, b: string): number => {
  const left = parseVersion(a);
  const right = parseVersion(b);
  if (!left || !right) return 0;

  const length = Math.max(left.length, right.length);
  for (let index = 0; index < length; index += 1) {
    const leftPart = left[index] ?? 0;
    const rightPart = right[index] ?? 0;
    if (leftPart !== rightPart) return leftPart > rightPart ? 1 : -1;
  }
  return 0;
};

/**
 * Re-evaluate a cached server response against the version currently running.
 * This keeps a stale cached release from forcing an update after the member
 * has already installed the new build.
 */
export const evaluateForCurrentApp = (decision: AppUpdateDecision): AppUpdateDecision => {
  if (!decision.latestVersion) {
    return { ...decision, updateRequired: false, forceUpdate: false };
  }

  const belowLatest = compareVersions(APP_VERSION, decision.latestVersion) < 0;
  const belowMinimum = decision.minimumVersion
    ? compareVersions(APP_VERSION, decision.minimumVersion) < 0
    : false;

  const sameAsLatest = compareVersions(APP_VERSION, decision.latestVersion) === 0;
  const belowLatestBuild =
    sameAsLatest &&
    !!decision.buildNumber &&
    decision.buildNumber > 0 &&
    APP_BUILD > 0 &&
    APP_BUILD < decision.buildNumber;
  const belowMinimumBuild =
    sameAsLatest &&
    !!decision.minimumBuildNumber &&
    decision.minimumBuildNumber > 0 &&
    APP_BUILD > 0 &&
    APP_BUILD < decision.minimumBuildNumber;

  const updateRequired = belowLatest || belowMinimum || belowLatestBuild || belowMinimumBuild;
  const forceUpdate =
    belowMinimum ||
    belowMinimumBuild ||
    (decision.updateMode === 'force' && updateRequired);

  return {
    ...decision,
    currentVersion: APP_VERSION,
    currentBuild: APP_BUILD,
    updateRequired,
    forceUpdate,
  };
};

const readCache = async (): Promise<AppUpdateDecision | null> => {
  try {
    let raw: string | null = null;

    if (Platform.OS === 'web') {
      raw = (globalThis as any).localStorage?.getItem(CACHE_KEY) ?? null;
    } else {
      raw = await SecureStore.getItemAsync(CACHE_KEY);
    }

    if (!raw) return null;
    const parsed = JSON.parse(raw) as AppUpdateDecision;
    if (typeof parsed?.updateRequired !== 'boolean') return null;
    if (parsed.platform && parsed.platform !== currentPlatform()) return null;
    return evaluateForCurrentApp(parsed);
  } catch {
    return null;
  }
};

const writeCache = async (decision: AppUpdateDecision) => {
  try {
    const raw = JSON.stringify(decision);
    if (Platform.OS === 'web') {
      (globalThis as any).localStorage?.setItem(CACHE_KEY, raw);
    } else {
      await SecureStore.setItemAsync(CACHE_KEY, raw);
    }
  } catch {
    // Cache is an offline nicety — never block boot on storage failures.
  }
};

/**
 * Fetch the published release for this platform. Falls back to the last
 * cached release when the network is slow or unavailable, so an offline
 * member can still be told that a mandatory update exists.
 */
export const checkForAppUpdate = async (): Promise<AppUpdateDecision | null> => {
  const platform = currentPlatform();
  if (!platform) return null;

  const url =
    `${API_BASE_URL}/app-releases/latest` +
    `?platform=${encodeURIComponent(platform)}` +
    `&version=${encodeURIComponent(APP_VERSION)}` +
    `&build=${encodeURIComponent(String(APP_BUILD))}`;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: { Accept: 'application/json' },
      signal: controller.signal,
    });

    if (!response.ok) throw new Error(`Update check failed (${response.status})`);

    const data = (await response.json()) as AppUpdateDecision;
    if (!data || typeof data.updateRequired !== 'boolean') {
      throw new Error('Update check returned an unexpected payload');
    }

    const decision = evaluateForCurrentApp({ ...data, platform });
    await writeCache(decision);
    return decision;
  } catch {
    return readCache();
  } finally {
    clearTimeout(timer);
  }
};

export const openStoreListing = async (storeUrl?: string | null) => {
  const fallback =
    Platform.OS === 'ios'
      ? 'https://apps.apple.com/'
      : 'https://play.google.com/store/apps/details?id=com.ultim.app';

  const target = storeUrl?.trim() || fallback;

  try {
    await Linking.openURL(target);
  } catch {
    Alert.alert(
      'Could not open the store',
      'Please update ULTIM from the App Store or Play Store, then reopen the app.',
    );
    Linking.openURL(fallback).catch(() => {});
  }
};

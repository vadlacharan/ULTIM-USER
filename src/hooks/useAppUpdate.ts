import { useCallback, useEffect, useRef, useState } from 'react';
import { AppState } from 'react-native';
import { checkForAppUpdate, type AppUpdateDecision } from '../services/appUpdates';

/** Don't hammer the release endpoint when the member backgrounds the app. */
const RECHECK_INTERVAL_MS = 5 * 60 * 1000;

export type AppUpdateState = {
  /** Decision to render — null when there is nothing to show or it was dismissed. */
  decision: AppUpdateDecision | null;
  /** True while a network check is in flight. */
  checking: boolean;
  /** True until the first check settles; the boot gate waits for this. */
  initializing: boolean;
  dismiss: () => void;
  recheck: () => Promise<void>;
};

export function useAppUpdate(): AppUpdateState {
  const [decision, setDecision] = useState<AppUpdateDecision | null>(null);
  const [checking, setChecking] = useState(true);
  const [initialized, setInitialized] = useState(false);
  const [dismissedVersion, setDismissedVersion] = useState<string | null>(null);

  const lastCheckRef = useRef(0);
  const inFlightRef = useRef<Promise<void> | null>(null);

  const run = useCallback((force = false): Promise<void> => {
    if (inFlightRef.current) return inFlightRef.current;
    if (!force && Date.now() - lastCheckRef.current < RECHECK_INTERVAL_MS) {
      return Promise.resolve();
    }

    setChecking(true);

    const task = checkForAppUpdate()
      .then((result) => {
        setDecision(result?.updateRequired ? result : null);
        if (!result?.updateRequired) setDismissedVersion(null);
      })
      .catch(() => {
        // Offline with no cache: boot normally. The next foreground check
        // will try again.
      })
      .finally(() => {
        setChecking(false);
        setInitialized(true);
        lastCheckRef.current = Date.now();
        inFlightRef.current = null;
      });

    inFlightRef.current = task;
    return task;
  }, []);

  // Boot check — runs before the navigator mounts.
  useEffect(() => {
    void run(true);
  }, [run]);

  // Returning from the store or background: pick up a newly published force
  // release without making the member cold-start the app.
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') void run();
    });

    return () => subscription.remove();
  }, [run]);

  const dismiss = useCallback(() => {
    if (decision?.latestVersion) setDismissedVersion(decision.latestVersion);
  }, [decision?.latestVersion]);

  const recheck = useCallback(() => run(true), [run]);

  const visibleDecision =
    decision && (decision.forceUpdate || dismissedVersion !== decision.latestVersion)
      ? decision
      : null;

  return {
    decision: visibleDecision,
    checking,
    initializing: !initialized,
    dismiss,
    recheck,
  };
}

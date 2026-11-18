import { useCallback, useEffect, useState } from "react";
import {
    DEFAULT_DASHBOARD_PREFERENCES,
    loadDashboardPreferences,
    normalizeDashboardPreferences,
    saveDashboardPreferences,
    type DashboardPreferences,
} from "./preferences";

type Updater =
    | DashboardPreferences
    | ((current: DashboardPreferences) => DashboardPreferences);

export const useDashboardPreferences = (userId?: string) => {
    const [preferences, setPreferences] = useState<DashboardPreferences>(() =>
        loadDashboardPreferences(userId)
    );

    useEffect(() => {
        setPreferences(loadDashboardPreferences(userId));
    }, [userId]);

    const updatePreferences = useCallback(
        (next: Updater) => {
            setPreferences((current) => {
                const value =
                    typeof next === "function"
                        ? next(current)
                        : next;
                const normalized = normalizeDashboardPreferences(value);
                saveDashboardPreferences(userId, normalized);
                return normalized;
            });
        },
        [userId]
    );

    const resetPreferences = useCallback(() => {
        const next = normalizeDashboardPreferences(DEFAULT_DASHBOARD_PREFERENCES);
        saveDashboardPreferences(userId, next);
        setPreferences(next);
    }, [userId]);

    return {
        preferences,
        updatePreferences,
        resetPreferences,
    };
};

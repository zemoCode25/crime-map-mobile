import * as Location from "expo-location";
import { useCallback, useEffect, useRef, useState } from "react";

export type LocationCoords = {
  longitude: number;
  latitude: number;
  accuracy: number | null;
  heading: number | null;
};

export type LocationState = {
  coords: LocationCoords | null;
  isLoading: boolean;
  error: string | null;
  permissionStatus: Location.PermissionStatus | null;
};

type UseLocationOptions = {
  enableHighAccuracy?: boolean;
  watchPosition?: boolean;
  distanceInterval?: number;
};

const DEFAULT_OPTIONS: UseLocationOptions = {
  enableHighAccuracy: true,
  watchPosition: false,
  distanceInterval: 10,
};

export function useLocation(options: UseLocationOptions = {}) {
  const { enableHighAccuracy, watchPosition, distanceInterval } = {
    ...DEFAULT_OPTIONS,
    ...options,
  };

  const [state, setState] = useState<LocationState>({
    coords: null,
    isLoading: true,
    error: null,
    permissionStatus: null,
  });

  const watchSubscription = useRef<Location.LocationSubscription | null>(null);
  const isMounted = useRef(true);

  // Request permission and get initial location
  const initializeLocation = useCallback(async () => {
    try {
      setState((prev) => ({ ...prev, isLoading: true, error: null }));

      // Request foreground permission
      const { status } = await Location.requestForegroundPermissionsAsync();

      if (!isMounted.current) return;

      setState((prev) => ({ ...prev, permissionStatus: status }));

      if (status !== Location.PermissionStatus.GRANTED) {
        setState((prev) => ({
          ...prev,
          isLoading: false,
          error: "Location permission denied",
        }));
        return;
      }

      // Get current position
      const location = await Location.getCurrentPositionAsync({
        accuracy: enableHighAccuracy
          ? Location.Accuracy.High
          : Location.Accuracy.Balanced,
      });

      if (!isMounted.current) return;

      const coords: LocationCoords = {
        longitude: location.coords.longitude,
        latitude: location.coords.latitude,
        accuracy: location.coords.accuracy,
        heading: location.coords.heading,
      };

      setState((prev) => ({
        ...prev,
        coords,
        isLoading: false,
      }));

      // Start watching if enabled
      if (watchPosition) {
        startWatching();
      }
    } catch (error) {
      if (!isMounted.current) return;

      const message =
        error instanceof Error ? error.message : "Failed to get location";
      setState((prev) => ({
        ...prev,
        isLoading: false,
        error: message,
      }));
    }
  }, [enableHighAccuracy, watchPosition]);

  // Start watching location
  const startWatching = useCallback(async () => {
    if (watchSubscription.current) {
      watchSubscription.current.remove();
    }

    watchSubscription.current = await Location.watchPositionAsync(
      {
        accuracy: enableHighAccuracy
          ? Location.Accuracy.High
          : Location.Accuracy.Balanced,
        distanceInterval: distanceInterval,
      },
      (location) => {
        if (!isMounted.current) return;

        const coords: LocationCoords = {
          longitude: location.coords.longitude,
          latitude: location.coords.latitude,
          accuracy: location.coords.accuracy,
          heading: location.coords.heading,
        };

        setState((prev) => ({
          ...prev,
          coords,
        }));
      }
    );
  }, [enableHighAccuracy, distanceInterval]);

  // Stop watching location
  const stopWatching = useCallback(() => {
    if (watchSubscription.current) {
      watchSubscription.current.remove();
      watchSubscription.current = null;
    }
  }, []);

  // Refresh location (get fresh position)
  const refreshLocation = useCallback(async () => {
    if (state.permissionStatus !== Location.PermissionStatus.GRANTED) {
      return null;
    }

    try {
      const location = await Location.getCurrentPositionAsync({
        accuracy: enableHighAccuracy
          ? Location.Accuracy.High
          : Location.Accuracy.Balanced,
      });

      const coords: LocationCoords = {
        longitude: location.coords.longitude,
        latitude: location.coords.latitude,
        accuracy: location.coords.accuracy,
        heading: location.coords.heading,
      };

      if (isMounted.current) {
        setState((prev) => ({
          ...prev,
          coords,
        }));
      }

      return coords;
    } catch {
      return null;
    }
  }, [state.permissionStatus, enableHighAccuracy]);

  // Initialize on mount
  useEffect(() => {
    isMounted.current = true;
    initializeLocation();

    return () => {
      isMounted.current = false;
      stopWatching();
    };
  }, []);

  return {
    ...state,
    refreshLocation,
    startWatching,
    stopWatching,
  };
}

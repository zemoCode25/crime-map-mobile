import { CrimeMapView, DraggableMarker } from "@/src/features/map";
import {
  SearchBar,
  SuggestionsList,
  useSearchSuggestions,
  type SearchSuggestion,
} from "@/src/features/search";
import { useLocation } from "@/src/hooks";
import { supabase } from "@/src/lib/supabase";
import { useAppTheme } from "@/src/lib/theme";
import { LocateFixed } from "lucide-react-native";
import { router } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Keyboard,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import type { User as SupabaseUser } from "@supabase/supabase-js";

// Default position: Muntinlupa City center [longitude, latitude]
const DEFAULT_POSITION: [number, number] = [121.0244, 14.4166];

export default function MapScreen() {
  const insets = useSafeAreaInsets();
  const { colors, theme } = useAppTheme();

  // Location from expo-location
  const { coords, isLoading: isLoadingLocation, refreshLocation } = useLocation({
    enableHighAccuracy: true,
  });

  // Search suggestions
  const {
    query,
    setQuery,
    isOpen: isSearchOpen,
    suggestions,
    isLoading: isSearchLoading,
    error: searchError,
    openDropdown,
    closeDropdown,
    selectSuggestion,
    clearSearch,
  } = useSearchSuggestions();

  // Avatar state
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [avatarInitial, setAvatarInitial] = useState("U");

  // Map state
  const [isFollowing, setIsFollowing] = useState(true);
  const [markerPosition, setMarkerPosition] = useState<[number, number] | null>(null);

  // Set marker position when location is available
  useEffect(() => {
    if (coords && !markerPosition) {
      setMarkerPosition([coords.longitude, coords.latitude]);
    }
  }, [coords, markerPosition]);

  // Avatar helpers
  const setAvatarFromUser = (user?: SupabaseUser | null) => {
    const metadata = user?.user_metadata ?? {};
    const urlCandidate =
      (typeof metadata.avatar_url === "string" && metadata.avatar_url) ||
      (typeof metadata.picture === "string" && metadata.picture) ||
      (typeof metadata.avatar === "string" && metadata.avatar) ||
      null;
    const nameCandidate =
      (typeof metadata.full_name === "string" && metadata.full_name) ||
      (typeof metadata.name === "string" && metadata.name) ||
      user?.email ||
      "User";
    const initial = nameCandidate.trim().charAt(0).toUpperCase() || "U";

    setAvatarUrl(urlCandidate);
    setAvatarInitial(initial);
  };

  // Load user avatar
  useEffect(() => {
    let isActive = true;

    const loadUser = async () => {
      const { data } = await supabase.auth.getUser();
      if (!isActive) return;
      setAvatarFromUser(data.user);
    };

    loadUser();

    const { data: authListener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setAvatarFromUser(session?.user ?? null);
      }
    );

    return () => {
      isActive = false;
      authListener.subscription.unsubscribe();
    };
  }, []);

  const handleProfilePress = () => {
    router.push("/(tabs)/profile");
  };

  const mapStyleURL = useMemo(
    () =>
      theme === "dark"
        ? "mapbox://styles/mapbox/dark-v11"
        : "mapbox://styles/mapbox/outdoors-v12",
    [theme]
  );

  // Layout calculations
  const compassTop = insets.top + 120;
  const scaleBarBottom = 64 + insets.bottom;
  const geolocateBottom = scaleBarBottom + 52;

  // When marker is dragged, stop following and update position
  const handleMarkerDragEnd = (newPosition: [number, number]) => {
    setMarkerPosition(newPosition);
    setIsFollowing(false);
  };

  // Recenter to current location
  const handleRecenter = async () => {
    const newCoords = await refreshLocation();
    if (newCoords) {
      setMarkerPosition([newCoords.longitude, newCoords.latitude]);
      setIsFollowing(true);
    }
  };

  // Handle search suggestion selection
  const handleSelectSuggestion = async (suggestion: SearchSuggestion) => {
    Keyboard.dismiss();
    const coordinates = await selectSuggestion(suggestion);
    if (coordinates) {
      setMarkerPosition(coordinates);
      setIsFollowing(false);
    }
  };

  const handleSearchSubmit = async () => {
    if (suggestions.length === 0) {
      closeDropdown();
      Keyboard.dismiss();
      return;
    }

    const preferred =
      query.length > 0
        ? suggestions.find((item) => item.type === "search_result")
        : suggestions[0];

    if (preferred) {
      await handleSelectSuggestion(preferred);
    }
  };

  // Handle search focus
  const handleSearchFocus = () => {
    openDropdown();
  };

  // Handle clearing search
  const handleClearSearch = () => {
    clearSearch();
    Keyboard.dismiss();
  };

  // Determine map center - use marker position, then coords, then default
  const centerCoordinate = markerPosition ??
    (coords ? [coords.longitude, coords.latitude] as [number, number] : DEFAULT_POSITION);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <CrimeMapView
        styleURL={mapStyleURL}
        centerCoordinate={centerCoordinate}
        followUserLocation={isFollowing}
        followZoomLevel={16}
        compassPosition={{ top: compassTop, right: 16 }}
        scaleBarPosition={{ bottom: scaleBarBottom, right: 16 }}
      >
        {markerPosition && (
          <DraggableMarker
            id="user-marker"
            coordinate={markerPosition}
            onDragEnd={handleMarkerDragEnd}
          />
        )}
      </CrimeMapView>

      {/* Loading overlay while getting location */}
      {isLoadingLocation && (
        <View
          style={[
            styles.loadingOverlay,
            { backgroundColor: colors.background + "E6" },
          ]}
        >
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.text }]}>
            Getting your location...
          </Text>
        </View>
      )}

      {/* Top search bar with suggestions */}
      <View
        pointerEvents="box-none"
        style={[styles.topBar, { paddingTop: insets.top + 12 }]}
      >
        <SearchBar
          value={query}
          onChangeText={setQuery}
          onFocus={handleSearchFocus}
          onSubmitEditing={handleSearchSubmit}
          onClear={handleClearSearch}
          avatarUrl={avatarUrl}
          avatarInitial={avatarInitial}
          onAvatarPress={handleProfilePress}
        />
        <SuggestionsList
          suggestions={suggestions}
          isLoading={isSearchLoading}
          error={searchError}
          onSelect={handleSelectSuggestion}
          isVisible={isSearchOpen && (suggestions.length > 0 || isSearchLoading || query.length > 0)}
          style={styles.suggestionsList}
        />
      </View>

      {/* Dismiss search overlay when tapping map */}
      {isSearchOpen && (
        <Pressable
          style={StyleSheet.absoluteFill}
          onPress={() => {
            closeDropdown();
            Keyboard.dismiss();
          }}
        />
      )}

      {/* Recenter button */}
      <Pressable
        onPress={handleRecenter}
        style={[
          styles.geoButton,
          {
            bottom: geolocateBottom,
            backgroundColor: isFollowing ? colors.primary : colors.surface,
            shadowColor: colors.shadow,
          },
        ]}
      >
        <LocateFixed
          size={20}
          color={isFollowing ? "#FFFFFF" : colors.text}
        />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 50,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    fontFamily: "Inter_500Medium",
  },
  topBar: {
    position: "absolute",
    left: 0,
    right: 0,
    top: 0,
    paddingHorizontal: 16,
    zIndex: 10,
  },
  suggestionsList: {
    marginTop: 8,
  },
  geoButton: {
    position: "absolute",
    right: 16,
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.18,
    shadowRadius: 16,
    elevation: 8,
  },
});

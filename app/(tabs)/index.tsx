import {
  CrimeMapView,
  DraggableMarker,
  CrimeMarkersLayer,
  CrimeDetailsDrawer,
} from "@/src/features/map";
import {
  SearchBar,
  SuggestionsList,
  useSearchSuggestions,
  type SearchSuggestion,
} from "@/src/features/search";
import {
  CrimeFiltersButton,
  CrimeFiltersPanel,
  useCrimeFilters,
  useCrimeCases,
  useCrimeTypes,
  type CrimeCaseWithRelations,
} from "@/src/features/crime";
import { BARANGAYS } from "@/constants/barangays";
import { useLocation } from "@/src/hooks";
import { supabase } from "@/src/lib/supabase";
import { useAppTheme } from "@/src/lib/theme";
import { LocateFixed } from "lucide-react-native";
import { router } from "expo-router";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Keyboard,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import type { User as SupabaseUser } from "@supabase/supabase-js";

// Default position: Muntinlupa City center [longitude, latitude]
const DEFAULT_POSITION: [number, number] = [121.0244, 14.4166];
const PIN_CAMERA_ANIMATION_DURATION_MS = 900;
const SEARCH_BAR_HEIGHT = 56;

export default function MapScreen() {
  const insets = useSafeAreaInsets();
  const tabBarHeight = useBottomTabBarHeight();
  const { colors, theme } = useAppTheme();
  const [searchBarHeight, setSearchBarHeight] = useState(SEARCH_BAR_HEIGHT);
  const [containerHeight, setContainerHeight] = useState(0);
  const [topBarLayoutY, setTopBarLayoutY] = useState(0);
  const [searchBarLayoutY, setSearchBarLayoutY] = useState(0);
  const containerRef = useRef<View>(null);

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

  // Crime filters
  const {
    filters,
    isOpen: isFiltersOpen,
    toggleOpen: toggleFilters,
    closeFilters,
    setCrimeTypes,
    setBarangays,
    setStatuses,
    setTimeRange,
    clearFilters,
    hasActiveFilters,
    activeFilterCount,
  } = useCrimeFilters();

  // Crime data
  const { data: crimeCases } = useCrimeCases();
  const { data: crimeTypes } = useCrimeTypes();

  // Filter crime cases based on selected filters
  const filteredCrimes = useMemo(() => {
    if (!crimeCases) return [];

    return crimeCases.filter((crime) => {
      // Filter by crime type
      if (filters.crimeTypes.length > 0) {
        if (!crime.crime_type || !filters.crimeTypes.includes(crime.crime_type)) {
          return false;
        }
      }

      // Filter by barangay - need to map barangay number to name
      if (filters.barangays.length > 0) {
        const barangayIndex = crime.location?.barangay;
        if (barangayIndex == null) return false;
        // Barangay is stored as index (1-based), map to value
        const barangay = BARANGAYS[barangayIndex - 1];
        if (!barangay || !filters.barangays.includes(barangay.value)) {
          return false;
        }
      }

      // Filter by status
      if (filters.statuses.length > 0) {
        if (!crime.case_status || !filters.statuses.includes(crime.case_status)) {
          return false;
        }
      }

      // Filter by time range
      if (filters.timeRange) {
        const incidentDate = crime.incident_datetime
          ? new Date(crime.incident_datetime)
          : null;
        if (!incidentDate) return false;

        const now = new Date();
        const daysMap: Record<string, number> = {
          "7d": 7,
          "30d": 30,
          "90d": 90,
          "365d": 365,
        };
        const days = daysMap[filters.timeRange];
        const cutoffDate = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);

        if (incidentDate < cutoffDate) {
          return false;
        }
      }

      return true;
    });
  }, [crimeCases, filters]);

  // Avatar state
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [avatarInitial, setAvatarInitial] = useState("U");
  const [selectedCrime, setSelectedCrime] = useState<CrimeCaseWithRelations | null>(null);

  // Map state
  const [isFollowing, setIsFollowing] = useState(true);
  const [markerPosition, setMarkerPosition] = useState<[number, number] | null>(null);
  const [pinCameraAnimationActive, setPinCameraAnimationActive] = useState(false);
  const pinCameraAnimationTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

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

  useEffect(() => {
    return () => {
      if (pinCameraAnimationTimer.current) {
        clearTimeout(pinCameraAnimationTimer.current);
      }
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
  const topBarPaddingTop = insets.top + 12;
  const searchBarBottom = useMemo(() => {
    if (searchBarHeight <= 0) {
      return topBarPaddingTop;
    }
    if (searchBarLayoutY <= 1) {
      return topBarLayoutY + topBarPaddingTop + searchBarHeight;
    }
    return topBarLayoutY + searchBarLayoutY + searchBarHeight;
  }, [searchBarHeight, searchBarLayoutY, topBarLayoutY, topBarPaddingTop]);

  // When marker is dragged, stop following and update position
  const handleMarkerDragEnd = (newPosition: [number, number]) => {
    if (pinCameraAnimationTimer.current) {
      clearTimeout(pinCameraAnimationTimer.current);
    }
    setPinCameraAnimationActive(true);
    setMarkerPosition(newPosition);
    setIsFollowing(false);
    pinCameraAnimationTimer.current = setTimeout(() => {
      setPinCameraAnimationActive(false);
      pinCameraAnimationTimer.current = null;
    }, PIN_CAMERA_ANIMATION_DURATION_MS);
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

  useEffect(() => {
    if (!__DEV__) return;
    console.log("[DrawerMetrics]", {
      containerHeight,
      topBarLayoutY,
      searchBarLayoutY,
      searchBarHeight,
      topBarPaddingTop,
      insetsTop: insets.top,
      tabBarHeight,
      searchBarBottom,
    });
  }, [
    containerHeight,
    insets.top,
    searchBarBottom,
    searchBarHeight,
    searchBarLayoutY,
    tabBarHeight,
    topBarLayoutY,
    topBarPaddingTop,
  ]);

  const handleCrimeMarkerPress = (crime: CrimeCaseWithRelations) => {
    const lat = crime.location?.lat;
    const long = crime.location?.long;
    if (lat != null && long != null) {
      setMarkerPosition([long, lat]);
      setPinCameraAnimationActive(true);
      if (pinCameraAnimationTimer.current) {
        clearTimeout(pinCameraAnimationTimer.current);
      }
      pinCameraAnimationTimer.current = setTimeout(() => {
        setPinCameraAnimationActive(false);
        pinCameraAnimationTimer.current = null;
      }, PIN_CAMERA_ANIMATION_DURATION_MS);
    }
    setIsFollowing(false);
    setSelectedCrime(crime);
  };

  // Determine map center - use marker position, then coords, then default
  const centerCoordinate = markerPosition ??
    (coords ? [coords.longitude, coords.latitude] as [number, number] : DEFAULT_POSITION);

  return (
    <View
      ref={containerRef}
      style={[styles.container, { backgroundColor: colors.background }]}
      onLayout={(event) => {
        const nextHeight = event.nativeEvent.layout.height;
        if (nextHeight > 0 && nextHeight !== containerHeight) {
          setContainerHeight(nextHeight);
        }
      }}
    >
      <CrimeMapView
        styleURL={mapStyleURL}
        centerCoordinate={centerCoordinate}
        cameraAnimationMode={pinCameraAnimationActive ? "easeTo" : undefined}
        cameraAnimationDuration={
          pinCameraAnimationActive ? PIN_CAMERA_ANIMATION_DURATION_MS : undefined
        }
        followUserLocation={isFollowing}
        followZoomLevel={16}
        compassPosition={{ top: compassTop, right: 16 }}
        scaleBarPosition={{ bottom: scaleBarBottom, right: 16 }}
      >
        {/* Crime markers layer */}
        <CrimeMarkersLayer
          crimes={filteredCrimes}
          crimeTypes={crimeTypes ?? []}
          onMarkerPress={handleCrimeMarkerPress}
        />
        {markerPosition && (
          <DraggableMarker
            id="user-marker"
            coordinate={markerPosition}
            onDragEnd={handleMarkerDragEnd}
          />
        )}
      </CrimeMapView>

      <CrimeDetailsDrawer
        crime={selectedCrime}
        bottomOffset={0}
        topOffset={searchBarBottom}
        containerHeight={containerHeight}
        onClose={() => setSelectedCrime(null)}
      />

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

      {/* Top search bar with suggestions and filters */}
      <View
        pointerEvents="box-none"
        style={[styles.topBar, { paddingTop: insets.top + 12 }]}
        onLayout={(event) => {
          setTopBarLayoutY(event.nativeEvent.layout.y);
        }}
      >
        <View
          onLayout={(event) => {
            const nextHeight = event.nativeEvent.layout.height;
            if (nextHeight > 0 && nextHeight !== searchBarHeight) {
              setSearchBarHeight(nextHeight);
            }
            setSearchBarLayoutY(event.nativeEvent.layout.y);
          }}
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
        </View>

        {/* Filter toggle button */}
        <View style={styles.filterButtonRow}>
          <CrimeFiltersButton
            isActive={isFiltersOpen}
            activeFilterCount={activeFilterCount}
            onPress={toggleFilters}
          />
        </View>

        {/* Filter panel */}
        {isFiltersOpen && (
          <CrimeFiltersPanel
            filters={filters}
            onCrimeTypesChange={setCrimeTypes}
            onBarangaysChange={setBarangays}
            onStatusesChange={setStatuses}
            onTimeRangeChange={setTimeRange}
            onClearFilters={clearFilters}
            hasActiveFilters={hasActiveFilters}
          />
        )}

        {/* Search suggestions (shown when not filtering) */}
        {!isFiltersOpen && (
          <SuggestionsList
            suggestions={suggestions}
            isLoading={isSearchLoading}
            error={searchError}
            onSelect={handleSelectSuggestion}
            isVisible={isSearchOpen && (suggestions.length > 0 || isSearchLoading || query.length > 0)}
            style={styles.suggestionsList}
          />
        )}
      </View>

      {/* Dismiss search/filters overlay when tapping map */}
      {(isSearchOpen || isFiltersOpen) && (
        <Pressable
          style={StyleSheet.absoluteFill}
          onPress={() => {
            closeDropdown();
            closeFilters();
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
  filterButtonRow: {
    marginTop: 10,
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

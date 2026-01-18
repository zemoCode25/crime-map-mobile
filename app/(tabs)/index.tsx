import { CrimeMapView, DraggableMarker } from "@/src/features/map";
import { useLocation } from "@/src/hooks";
import { supabase } from "@/src/lib/supabase";
import { useAppTheme } from "@/src/lib/theme";
import { LocateFixed } from "lucide-react-native";
import { router } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Image,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
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

      {/* Top search bar */}
      <View
        pointerEvents="box-none"
        style={[styles.topBar, { paddingTop: insets.top + 12 }]}
      >
        <View
          style={[
            styles.searchPill,
            { backgroundColor: colors.surface, shadowColor: colors.shadow },
          ]}
        >
          <Image
            source={require("../../assets/images/icon.png")}
            style={styles.logo}
          />
          <TextInput
            style={[styles.searchInput, { color: colors.text }]}
            placeholder="Search places"
            placeholderTextColor={colors.mutedText}
            autoCapitalize="none"
            autoCorrect={false}
          />
          <Pressable
            onPress={handleProfilePress}
            style={[styles.avatar, { backgroundColor: colors.avatar }]}
          >
            {avatarUrl ? (
              <Image source={{ uri: avatarUrl }} style={styles.avatarImage} />
            ) : (
              <Text style={[styles.avatarInitial, { color: colors.text }]}>
                {avatarInitial}
              </Text>
            )}
          </Pressable>
        </View>
      </View>

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
  searchPill: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 28,
    height: 56,
    paddingHorizontal: 14,
    gap: 12,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.12,
    shadowRadius: 20,
    elevation: 6,
  },
  logo: {
    width: 28,
    height: 28,
    borderRadius: 6,
  },
  searchInput: {
    flex: 1,
    fontFamily: "Inter_500Medium",
    fontSize: 15,
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarImage: {
    width: 32,
    height: 32,
    borderRadius: 16,
  },
  avatarInitial: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 14,
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

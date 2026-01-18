import { CrimeMapView, DraggableMarker } from "@/src/features/map";
import { supabase } from "@/src/lib/supabase";
import { useAppTheme } from "@/src/lib/theme";
import { router } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import {
  Image,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import type { User as SupabaseUser } from "@supabase/supabase-js";

// Default marker position: Muntinlupa City center [longitude, latitude]
const DEFAULT_MARKER_POSITION: [number, number] = [121.0244, 14.4166];

export default function MapScreen() {
  const insets = useSafeAreaInsets();
  const { colors, theme } = useAppTheme();
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [avatarInitial, setAvatarInitial] = useState("U");
  const [markerPosition, setMarkerPosition] = useState<[number, number]>(
    DEFAULT_MARKER_POSITION
  );

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
      },
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

  const handleMarkerDragEnd = (newPosition: [number, number]) => {
    setMarkerPosition(newPosition);
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <CrimeMapView styleURL={mapStyleURL}>
        <DraggableMarker
          id="user-marker"
          coordinate={markerPosition}
          onDragEnd={handleMarkerDragEnd}
        />
      </CrimeMapView>
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
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
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
});

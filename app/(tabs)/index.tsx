import { CrimeMapView } from "@/src/features/map";
import { User } from "lucide-react-native";
import { Image, StyleSheet, TextInput, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function MapScreen() {
  const insets = useSafeAreaInsets();

  return (
    <View style={styles.container}>
      <CrimeMapView />
      <View
        pointerEvents="box-none"
        style={[styles.topBar, { paddingTop: insets.top + 12 }]}
      >
        <View style={styles.searchPill}>
          <Image
            source={require("../../assets/images/icon.png")}
            style={styles.logo}
          />
          <TextInput
            style={styles.searchInput}
            placeholder="Search places"
            placeholderTextColor="#9CA3AF"
            autoCapitalize="none"
            autoCorrect={false}
          />
          <View style={styles.avatar}>
            <User size={18} color="#111827" />
          </View>
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
  },
  searchPill: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 28,
    height: 56,
    paddingHorizontal: 14,
    gap: 12,
    shadowColor: "#0F172A",
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
    color: "#111827",
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#F3F4F6",
    alignItems: "center",
    justifyContent: "center",
  },
});

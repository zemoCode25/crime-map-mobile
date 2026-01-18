import { MapPin } from "lucide-react-native";
import { StyleSheet, Text, View } from "react-native";

interface MapViewProps {
  centerCoordinate?: [number, number];
  zoomLevel?: number;
  children?: React.ReactNode;
}

// Web fallback - Mapbox doesn't work on web with Metro bundler
export function CrimeMapView({
  centerCoordinate = [121.0244, 14.4166],
}: MapViewProps) {
  return (
    <View style={styles.container}>
      <View style={styles.placeholder}>
        <MapPin size={48} color="#F97316" />
        <Text style={styles.title}>Map View</Text>
        <Text style={styles.subtitle}>
          Map is only available on mobile devices
        </Text>
        <Text style={styles.coordinates}>
          Center: {centerCoordinate[1].toFixed(4)},{" "}
          {centerCoordinate[0].toFixed(4)}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#1F2937",
  },
  placeholder: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  title: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 24,
    color: "#FFFFFF",
    marginTop: 16,
  },
  subtitle: {
    fontFamily: "Inter_400Regular",
    fontSize: 14,
    color: "#9CA3AF",
    marginTop: 8,
    textAlign: "center",
  },
  coordinates: {
    fontFamily: "Inter_400Regular",
    fontSize: 12,
    color: "#6B7280",
    marginTop: 16,
  },
});

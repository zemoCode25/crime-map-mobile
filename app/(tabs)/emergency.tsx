import { useAppTheme } from "@/src/lib/theme";
import { StyleSheet, Text, View } from "react-native";

export default function EmergencyScreen() {
  const { colors } = useAppTheme();

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Text style={[styles.title, { color: colors.text }]}>Emergency</Text>
      <Text style={[styles.subtitle, { color: colors.mutedText }]}>
        Hotlines and quick actions
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    fontSize: 32,
    fontWeight: "bold",
  },
  subtitle: {
    fontSize: 18,
    marginTop: 8,
  },
});

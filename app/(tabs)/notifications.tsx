import { useAppTheme } from "@/src/lib/theme";
import { StyleSheet, Text, View } from "react-native";

export default function NotificationsScreen() {
  const { colors } = useAppTheme();

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Text style={[styles.title, { color: colors.text }]}>
        Notifications
      </Text>
      <Text style={[styles.subtitle, { color: colors.mutedText }]}>
        Your Alerts
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

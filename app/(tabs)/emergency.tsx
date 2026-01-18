import { StyleSheet, Text, View } from "react-native";

export default function EmergencyScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Emergency</Text>
      <Text style={styles.subtitle}>Hotlines and quick actions</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFFFFF",
  },
  title: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#111827",
  },
  subtitle: {
    fontSize: 18,
    color: "#6B7280",
    marginTop: 8,
  },
});

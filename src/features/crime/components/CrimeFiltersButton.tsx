import { useAppTheme } from "@/src/lib/theme";
import { SlidersHorizontal, X } from "lucide-react-native";
import { Pressable, StyleSheet, Text, View } from "react-native";

interface CrimeFiltersButtonProps {
  isActive: boolean;
  activeFilterCount: number;
  onPress: () => void;
}

export function CrimeFiltersButton({
  isActive,
  activeFilterCount,
  onPress,
}: CrimeFiltersButtonProps) {
  const { colors } = useAppTheme();

  return (
    <Pressable
      onPress={onPress}
      style={[
        styles.button,
        {
          backgroundColor: isActive ? colors.primary : colors.surface,
          shadowColor: colors.shadow,
        },
      ]}
    >
      {isActive ? (
        <X size={16} color="#FFFFFF" />
      ) : (
        <SlidersHorizontal size={16} color={colors.text} />
      )}
      <Text
        style={[
          styles.label,
          { color: isActive ? "#FFFFFF" : colors.text },
        ]}
      >
        Filters
      </Text>
      {activeFilterCount > 0 && !isActive && (
        <View style={[styles.badge, { backgroundColor: colors.primary }]}>
          <Text style={styles.badgeText}>{activeFilterCount}</Text>
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 6,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  label: {
    fontSize: 14,
    fontFamily: "Inter_500Medium",
  },
  badge: {
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 5,
  },
  badgeText: {
    color: "#FFFFFF",
    fontSize: 11,
    fontFamily: "Inter_600SemiBold",
  },
});

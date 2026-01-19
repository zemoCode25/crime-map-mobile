import { useAppTheme } from "@/src/lib/theme";
import { X } from "lucide-react-native";
import {
  Image,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
  type TextInputProps,
  type ViewStyle,
} from "react-native";

interface SearchBarProps extends Omit<TextInputProps, "style"> {
  value: string;
  onChangeText: (text: string) => void;
  onFocus?: () => void;
  onClear: () => void;
  placeholder?: string;
  avatarUrl?: string | null;
  avatarInitial?: string;
  onAvatarPress?: () => void;
  style?: ViewStyle;
}

export function SearchBar({
  value,
  onChangeText,
  onFocus,
  onClear,
  placeholder = "Search places",
  avatarUrl,
  avatarInitial = "U",
  onAvatarPress,
  style,
  ...textInputProps
}: SearchBarProps) {
  const { colors } = useAppTheme();

  return (
    <View
      style={[
        styles.searchPill,
        { backgroundColor: colors.surface, shadowColor: colors.shadow },
        style,
      ]}
    >
      <Image
        source={require("@/assets/images/icon.png")}
        style={styles.logo}
      />
      <TextInput
        style={[styles.searchInput, { color: colors.text }]}
        placeholder={placeholder}
        placeholderTextColor={colors.mutedText}
        value={value}
        onChangeText={onChangeText}
        onFocus={onFocus}
        autoCapitalize="none"
        autoCorrect={false}
        returnKeyType="search"
        {...textInputProps}
      />
      {value.length > 0 && (
        <Pressable onPress={onClear} style={styles.clearButton}>
          <X size={18} color={colors.mutedText} />
        </Pressable>
      )}
      <Pressable
        onPress={onAvatarPress}
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
  );
}

const styles = StyleSheet.create({
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
  clearButton: {
    padding: 4,
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

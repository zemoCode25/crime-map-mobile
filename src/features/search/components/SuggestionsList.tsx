import { useAppTheme } from "@/src/lib/theme";
import { MapPin, Navigation } from "lucide-react-native";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
  type ViewStyle,
} from "react-native";
import type { SearchSuggestion } from "../types/search-types";

interface SuggestionsListProps {
  suggestions: SearchSuggestion[];
  isLoading: boolean;
  error: string | null;
  onSelect: (suggestion: SearchSuggestion) => void;
  isVisible: boolean;
  style?: ViewStyle;
}

export function SuggestionsList({
  suggestions,
  isLoading,
  error,
  onSelect,
  isVisible,
  style,
}: SuggestionsListProps) {
  const { colors } = useAppTheme();

  if (!isVisible) return null;

  // Don't show empty state if we have no query yet
  const showEmptyState = !isLoading && !error && suggestions.length === 0;

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: colors.surface,
          shadowColor: colors.shadow,
        },
        style,
      ]}
    >
      {isLoading && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="small" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.mutedText }]}>
            Searching...
          </Text>
        </View>
      )}

      {error && (
        <View style={styles.messageContainer}>
          <Text style={[styles.errorText, { color: colors.danger }]}>
            {error}
          </Text>
        </View>
      )}

      {showEmptyState && (
        <View style={styles.messageContainer}>
          <Text style={[styles.emptyText, { color: colors.mutedText }]}>
            No results found
          </Text>
        </View>
      )}

      {!isLoading && !error && suggestions.length > 0 && (
        <FlatList
          data={suggestions}
          keyExtractor={(item) => item.id}
          keyboardShouldPersistTaps="handled"
          renderItem={({ item }) => (
            <SuggestionItem
              suggestion={item}
              onPress={() => onSelect(item)}
            />
          )}
          ItemSeparatorComponent={() => (
            <View
              style={[styles.separator, { backgroundColor: colors.border }]}
            />
          )}
          style={styles.list}
        />
      )}
    </View>
  );
}

interface SuggestionItemProps {
  suggestion: SearchSuggestion;
  onPress: () => void;
}

function SuggestionItem({ suggestion, onPress }: SuggestionItemProps) {
  const { colors } = useAppTheme();
  const isCurrentLocation = suggestion.type === "current_location";

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.item,
        pressed && { backgroundColor: colors.border + "40" },
      ]}
    >
      <View
        style={[
          styles.iconContainer,
          {
            backgroundColor: isCurrentLocation
              ? colors.primary + "20"
              : colors.border,
          },
        ]}
      >
        {isCurrentLocation ? (
          <Navigation size={18} color={colors.primary} />
        ) : (
          <MapPin size={18} color={colors.mutedText} />
        )}
      </View>
      <View style={styles.textContainer}>
        <Text
          style={[
            styles.name,
            { color: colors.text },
            isCurrentLocation && { color: colors.primary },
          ]}
          numberOfLines={1}
        >
          {suggestion.name}
        </Text>
        {suggestion.description ? (
          <Text
            style={[styles.description, { color: colors.mutedText }]}
            numberOfLines={1}
          >
            {suggestion.description}
          </Text>
        ) : null}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 16,
    maxHeight: 320,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
    overflow: "hidden",
  },
  list: {
    flexGrow: 0,
  },
  item: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 16,
    gap: 12,
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  textContainer: {
    flex: 1,
  },
  name: {
    fontFamily: "Inter_500Medium",
    fontSize: 15,
  },
  description: {
    fontFamily: "Inter_400Regular",
    fontSize: 13,
    marginTop: 2,
  },
  separator: {
    height: 1,
    marginLeft: 64,
  },
  loadingContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
    gap: 8,
  },
  loadingText: {
    fontFamily: "Inter_400Regular",
    fontSize: 14,
  },
  messageContainer: {
    padding: 16,
  },
  errorText: {
    fontFamily: "Inter_400Regular",
    fontSize: 14,
    textAlign: "center",
  },
  emptyText: {
    fontFamily: "Inter_400Regular",
    fontSize: 14,
    textAlign: "center",
  },
});

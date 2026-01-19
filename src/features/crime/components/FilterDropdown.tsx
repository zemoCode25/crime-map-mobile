import { useAppTheme } from "@/src/lib/theme";
import { Check, ChevronDown, ChevronUp } from "lucide-react-native";
import { useState } from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

export interface FilterOption<T> {
  value: T;
  label: string;
  color?: string;
}

interface FilterDropdownProps<T> {
  label: string;
  placeholder: string;
  options: FilterOption<T>[];
  selectedValues: T[];
  onSelectionChange: (values: T[]) => void;
  multiSelect?: boolean;
  isLoading?: boolean;
}

export function FilterDropdown<T extends string | number>({
  label,
  placeholder,
  options,
  selectedValues,
  onSelectionChange,
  multiSelect = true,
  isLoading = false,
}: FilterDropdownProps<T>) {
  const { colors, theme } = useAppTheme();
  const [isExpanded, setIsExpanded] = useState(false);

  const toggleExpanded = () => setIsExpanded((prev) => !prev);

  const handleOptionPress = (value: T) => {
    if (multiSelect) {
      const newValues = selectedValues.includes(value)
        ? selectedValues.filter((v) => v !== value)
        : [...selectedValues, value];
      onSelectionChange(newValues);
    } else {
      // Single select - toggle off if same value, otherwise set new value
      if (selectedValues.includes(value)) {
        onSelectionChange([]);
      } else {
        onSelectionChange([value]);
      }
      setIsExpanded(false);
    }
  };

  const getDisplayText = () => {
    if (selectedValues.length === 0) return placeholder;
    if (selectedValues.length === 1) {
      const option = options.find((o) => o.value === selectedValues[0]);
      return option?.label ?? placeholder;
    }
    return `${selectedValues.length} selected`;
  };

  const ChevronIcon = isExpanded ? ChevronUp : ChevronDown;

  return (
    <View style={styles.container}>
      <Text style={[styles.label, { color: colors.mutedText }]}>{label}</Text>

      <Pressable
        onPress={toggleExpanded}
        style={[
          styles.trigger,
          {
            backgroundColor: colors.surface,
            borderColor: selectedValues.length > 0 ? colors.primary : colors.border,
          },
        ]}
      >
        <Text
          style={[
            styles.triggerText,
            {
              color: selectedValues.length > 0 ? colors.text : colors.mutedText,
            },
          ]}
          numberOfLines={1}
        >
          {isLoading ? "Loading..." : getDisplayText()}
        </Text>
        <ChevronIcon size={18} color={colors.mutedText} />
      </Pressable>

      {isExpanded && !isLoading && (
        <View
          style={[
            styles.dropdown,
            {
              backgroundColor: colors.surface,
              borderColor: colors.border,
              shadowColor: colors.shadow,
            },
          ]}
        >
          <ScrollView
            style={styles.optionsList}
            nestedScrollEnabled
            showsVerticalScrollIndicator={false}
          >
            {options.map((option) => {
              const isSelected = selectedValues.includes(option.value);
              return (
                <Pressable
                  key={String(option.value)}
                  onPress={() => handleOptionPress(option.value)}
                  style={[
                    styles.option,
                    {
                      backgroundColor: isSelected
                        ? (option.color ?? colors.primary) + "20"
                        : "transparent",
                    },
                  ]}
                >
                  {option.color && (
                    <View
                      style={[
                        styles.colorDot,
                        { backgroundColor: theme === "dark" ? option.color : option.color },
                      ]}
                    />
                  )}
                  <Text
                    style={[
                      styles.optionText,
                      {
                        color: isSelected ? colors.text : colors.mutedText,
                        fontFamily: isSelected ? "Inter_500Medium" : "Inter_400Regular",
                      },
                    ]}
                    numberOfLines={1}
                  >
                    {option.label}
                  </Text>
                  {isSelected && (
                    <Check size={16} color={option.color ?? colors.primary} />
                  )}
                </Pressable>
              );
            })}
          </ScrollView>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 12,
  },
  label: {
    fontSize: 12,
    fontFamily: "Inter_600SemiBold",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  trigger: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
  },
  triggerText: {
    flex: 1,
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    marginRight: 8,
  },
  dropdown: {
    marginTop: 4,
    borderRadius: 10,
    borderWidth: 1,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    overflow: "hidden",
  },
  optionsList: {
    maxHeight: 180,
  },
  option: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 8,
  },
  colorDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  optionText: {
    flex: 1,
    fontSize: 14,
  },
});

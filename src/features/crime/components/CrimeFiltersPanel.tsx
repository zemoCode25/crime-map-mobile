import { BARANGAYS } from "@/constants/barangays";
import { STATUSES } from "@/constants/status";
import { useAppTheme } from "@/src/lib/theme";
import { RotateCcw } from "lucide-react-native";
import { Pressable, StyleSheet, Text, View } from "react-native";
import {
  type CrimeFilters,
  type TimeRange,
  TIME_RANGE_OPTIONS,
} from "../hooks/use-crime-filters";
import { useCrimeTypes } from "../hooks/use-crime";
import { FilterDropdown, type FilterOption } from "./FilterDropdown";

interface CrimeFiltersPanelProps {
  filters: CrimeFilters;
  onCrimeTypesChange: (types: number[]) => void;
  onBarangaysChange: (barangays: CrimeFilters["barangays"]) => void;
  onStatusesChange: (statuses: string[]) => void;
  onTimeRangeChange: (timeRange: TimeRange) => void;
  onClearFilters: () => void;
  hasActiveFilters: boolean;
}

export function CrimeFiltersPanel({
  filters,
  onCrimeTypesChange,
  onBarangaysChange,
  onStatusesChange,
  onTimeRangeChange,
  onClearFilters,
  hasActiveFilters,
}: CrimeFiltersPanelProps) {
  const { colors, theme } = useAppTheme();
  const { data: crimeTypes, isLoading: isLoadingCrimeTypes } = useCrimeTypes();

  // Transform crime types to filter options
  const crimeTypeOptions: FilterOption<number>[] =
    crimeTypes?.map((type) => ({
      value: type.id,
      label: type.label ?? type.name ?? "Unknown",
      color: type.color ?? undefined,
    })) ?? [];

  // Transform barangays to filter options
  const barangayOptions: FilterOption<string>[] = BARANGAYS.map((b) => ({
    value: b.value,
    label: b.label,
  }));

  // Transform statuses to filter options
  const statusOptions: FilterOption<string>[] = STATUSES.map((s) => ({
    value: s.value,
    label: s.label,
    color: theme === "dark" ? s.dark : s.light,
  }));

  // Time range options
  const timeRangeOptions: FilterOption<string>[] = TIME_RANGE_OPTIONS.map(
    (t) => ({
      value: t.value,
      label: t.label,
    })
  );

  const handleTimeRangeChange = (values: string[]) => {
    const newValue = values.length > 0 ? (values[0] as TimeRange) : null;
    onTimeRangeChange(newValue);
  };

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: colors.background,
          borderColor: colors.border,
          shadowColor: colors.shadow,
        },
      ]}
    >
      {/* Header with clear button */}
      <View style={styles.header}>
        <Text style={[styles.headerTitle, { color: colors.text }]}>
          Filter Incidents
        </Text>
        {hasActiveFilters && (
          <Pressable onPress={onClearFilters} style={styles.clearButton}>
            <RotateCcw size={14} color={colors.primary} />
            <Text style={[styles.clearText, { color: colors.primary }]}>
              Clear all
            </Text>
          </Pressable>
        )}
      </View>

      <View style={styles.content}>
        {/* Crime Types Dropdown */}
        <FilterDropdown
          label="Crime Type"
          placeholder="Select crime types"
          options={crimeTypeOptions}
          selectedValues={filters.crimeTypes}
          onSelectionChange={onCrimeTypesChange}
          isLoading={isLoadingCrimeTypes}
          multiSelect
        />

        {/* Barangay Dropdown */}
        <FilterDropdown
          label="Barangay"
          placeholder="Select barangays"
          options={barangayOptions}
          selectedValues={filters.barangays}
          onSelectionChange={(values) =>
            onBarangaysChange(values as CrimeFilters["barangays"])
          }
          multiSelect
        />

        {/* Status Dropdown */}
        <FilterDropdown
          label="Status"
          placeholder="Select statuses"
          options={statusOptions}
          selectedValues={filters.statuses}
          onSelectionChange={onStatusesChange}
          multiSelect
        />

        {/* Time Range Dropdown */}
        <FilterDropdown
          label="Time Range"
          placeholder="Select time range"
          options={timeRangeOptions}
          selectedValues={filters.timeRange ? [filters.timeRange] : []}
          onSelectionChange={handleTimeRangeChange}
          multiSelect={false}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 16,
    borderWidth: 1,
    marginTop: 8,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
  },
  headerTitle: {
    fontSize: 16,
    fontFamily: "Inter_600SemiBold",
  },
  clearButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  clearText: {
    fontSize: 13,
    fontFamily: "Inter_500Medium",
  },
  content: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
});

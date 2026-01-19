import { BARANGAYS } from "@/constants/barangays";
import { useAppTheme } from "@/src/lib/theme";
import type { CrimeCaseWithRelations } from "@/src/features/crime";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  Animated,
  PanResponder,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Clock, MapPin, Shield, Sparkles } from "lucide-react-native";

interface CrimeDetailsDrawerProps {
  crime: CrimeCaseWithRelations | null;
  bottomOffset: number;
  topOffset: number;
  containerHeight: number;
  locationLabel?: string | null;
  locationLoading?: boolean;
  locationError?: string | null;
  coordinates?: [number, number] | null;
  onClose?: () => void;
}

const SHEET_PEEK_HEIGHT = 140;
const SHEET_HIDE_DRAG_DISTANCE_FALLBACK = 640;

const clamp = (value: number, min: number, max: number) => {
  return Math.max(min, Math.min(max, value));
};

const formatDateTime = (value?: string | null) => {
  if (!value) return "Unknown date";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Unknown date";
  return date.toLocaleString();
};

const sanitizeDetails = (value?: string | null) => {
  if (!value) return "Details hidden for privacy.";
  let text = value;
  text = text.replace(
    /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi,
    "[redacted]",
  );
  text = text.replace(/\b\d{7,}\b/g, "[redacted]");
  text = text.replace(/\b[A-Z][a-z]+ [A-Z][a-z]+\b/g, "[redacted]");
  if (text.length > 280) {
    text = `${text.slice(0, 277)}...`;
  }
  return text;
};

const formatLabel = (value: string) => {
  return value
    .split(" ")
    .map((chunk) => chunk.charAt(0).toUpperCase() + chunk.slice(1))
    .join(" ");
};

export function CrimeDetailsDrawer({
  crime,
  bottomOffset,
  topOffset,
  containerHeight,
  locationLabel,
  locationLoading,
  locationError,
  coordinates,
  onClose,
}: CrimeDetailsDrawerProps) {
  const { colors } = useAppTheme();
  const safeHeight = containerHeight > 0 ? containerHeight : SHEET_HIDE_DRAG_DISTANCE_FALLBACK;
  const maxHeight = useMemo(() => {
    const available = safeHeight - bottomOffset - topOffset;
    return Math.max(SHEET_PEEK_HEIGHT + 40, available);
  }, [bottomOffset, safeHeight, topOffset]);
  const hiddenOffset = maxHeight + safeHeight;
  const maxTranslateY = maxHeight - SHEET_PEEK_HEIGHT;

  const translateY = useRef(new Animated.Value(hiddenOffset)).current;
  const [snapState, setSnapState] = useState<"hidden" | "peek" | "expanded">(
    "peek",
  );
  const startDragValue = useRef(0);

  const animateTo = (toValue: number) => {
    Animated.spring(translateY, {
      toValue,
      tension: 120,
      friction: 20,
      useNativeDriver: true,
      overshootClamping: true,
    }).start();
  };

  const showPeek = (animated = true) => {
    setSnapState("peek");
    const config = {
      toValue: maxTranslateY,
    };
    animated
      ? animateTo(config.toValue)
      : translateY.setValue(config.toValue);
  };

  const showExpanded = () => {
    setSnapState("expanded");
    animateTo(0);
  };

  const hideSheet = () => {
    setSnapState("hidden");
    Animated.timing(translateY, {
      toValue: hiddenOffset,
      duration: 180,
      useNativeDriver: true,
    }).start(() => {
      onClose?.();
    });
  };

  useEffect(() => {
    if (crime) {
      showPeek();
      return;
    }
    if (snapState === "hidden") {
      showPeek(false);
    }
  }, [crime, snapState]);

  useEffect(() => {
    if (!__DEV__) return;
    console.log("[CrimeDetailsDrawer]", {
      containerHeight: safeHeight,
      topOffset,
      bottomOffset,
      maxHeight,
      maxTranslateY,
    });
  }, [bottomOffset, maxHeight, maxTranslateY, safeHeight, topOffset]);

  useEffect(() => {
    if (snapState === "hidden") {
      translateY.setValue(hiddenOffset);
    } else if (snapState === "expanded") {
      translateY.setValue(0);
    } else {
      translateY.setValue(maxTranslateY);
    }
  }, [hiddenOffset, maxTranslateY, snapState, translateY]);

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => false,
        onStartShouldSetPanResponderCapture: () => false,
        onMoveShouldSetPanResponder: (_event, gesture) => {
          return Math.abs(gesture.dy) > 6 && Math.abs(gesture.dy) > Math.abs(gesture.dx);
        },
        onMoveShouldSetPanResponderCapture: (_event, gesture) => {
          return Math.abs(gesture.dy) > 6 && Math.abs(gesture.dy) > Math.abs(gesture.dx);
        },
        onPanResponderTerminationRequest: () => false,
        onShouldBlockNativeResponder: () => true,
        onPanResponderGrant: () => {
          translateY.stopAnimation((value) => {
            startDragValue.current = value;
          });
        },
        onPanResponderMove: (_event, gesture) => {
          const nextValue = clamp(
            startDragValue.current + gesture.dy,
            0,
            maxTranslateY,
          );
          translateY.setValue(nextValue);
        },
        onPanResponderRelease: (_event, gesture) => {
          if (Math.abs(gesture.dy) < 4 && Math.abs(gesture.vy) < 0.15) {
            if (snapState === "expanded") {
              showPeek();
            } else {
              showExpanded();
            }
            return;
          }
          const projected = startDragValue.current + gesture.dy + gesture.vy * 120;
          if (projected <= maxTranslateY * 0.5 || gesture.vy < -0.6) {
            showExpanded();
          } else {
            showPeek();
          }
        },
      }),
    [maxTranslateY, snapState, translateY],
  );

  const crimeType =
    crime?.crime_type_info?.label ?? crime?.crime_type_info?.name ?? "Unknown";
  const status = crime?.case_status ?? "Unknown status";
  const statusLabel = formatLabel(status);
  const incidentDate = formatDateTime(crime?.incident_datetime);
  const reportDate = formatDateTime(crime?.report_datetime);
  const barangayLabel = crime?.location?.barangay
    ? BARANGAYS[crime.location.barangay - 1]?.label ?? "Unknown barangay"
    : "Unknown barangay";
  const summary = sanitizeDetails(crime?.description);
  const coordsText = coordinates
    ? `${coordinates[1].toFixed(5)}, ${coordinates[0].toFixed(5)}`
    : "Unknown coordinates";
  const locationText = locationLoading
    ? "Resolving location..."
    : locationError || locationLabel || "Location unavailable";
  const caseNumber = crime?.case_number ? `Case ${crime.case_number}` : null;

  return (
    <Animated.View
      style={[
        styles.sheet,
        {
          bottom: bottomOffset,
          height: maxHeight,
          transform: [{ translateY }],
          backgroundColor: colors.surface,
          borderColor: colors.border,
          shadowColor: colors.shadow,
        },
      ]}
      {...panResponder.panHandlers}
    >
      <View style={styles.handleArea}>
        <View style={[styles.handle, { backgroundColor: colors.border }]} />
      </View>

      {crime ? (
        <>
          <View style={styles.header}>
            <View style={styles.titleRow}>
              <Text style={[styles.title, { color: colors.text }]}>{crimeType}</Text>
              <View style={[styles.statusChip, { backgroundColor: colors.primary }]}>
                <Text style={styles.statusChipText}>{statusLabel}</Text>
              </View>
            </View>
            {caseNumber && (
              <Text style={[styles.caseNumber, { color: colors.mutedText }]}>
                {caseNumber}
              </Text>
            )}
          </View>

          <View style={styles.infoGrid}>
            <View style={styles.infoRow}>
              <MapPin size={16} color={colors.primary} />
              <Text style={[styles.infoText, { color: colors.text }]}>{barangayLabel}</Text>
            </View>
            <View style={styles.infoRow}>
              <Clock size={16} color={colors.mutedText} />
              <Text style={[styles.infoText, { color: colors.mutedText }]}>
                Incident: {incidentDate}
              </Text>
            </View>
            <View style={styles.infoRow}>
              <Clock size={16} color={colors.mutedText} />
              <Text style={[styles.infoText, { color: colors.mutedText }]}>
                Reported: {reportDate}
              </Text>
            </View>
          </View>

          <View style={[styles.sectionCard, { backgroundColor: colors.avatar }]}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Summary</Text>
            <Text style={[styles.sectionBody, { color: colors.mutedText }]}>
              {summary}
            </Text>
          </View>

          <View style={[styles.sectionCard, { backgroundColor: colors.avatar }]}>
            <View style={styles.sectionTitleRow}>
              <Sparkles size={16} color={colors.primary} />
              <Text style={[styles.sectionTitle, { color: colors.text }]}>AI Insights</Text>
            </View>
            <Text style={[styles.sectionBody, { color: colors.mutedText }]}>
              Coming soon.
            </Text>
          </View>

          <View style={[styles.sectionCard, { backgroundColor: colors.avatar }]}>
            <View style={styles.sectionTitleRow}>
              <Shield size={16} color={colors.primary} />
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Safety Tips</Text>
            </View>
            <Text style={[styles.sectionBody, { color: colors.mutedText }]}>
              Coming soon.
            </Text>
          </View>
        </>
      ) : (
        <>
          <View style={styles.header}>
            <View style={styles.titleRow}>
              <Text style={[styles.title, { color: colors.text }]}>
                Pinned Location
              </Text>
              <View style={[styles.statusChip, { backgroundColor: colors.primary }]}>
                <Text style={styles.statusChipText}>Live</Text>
              </View>
            </View>
            <Text style={[styles.subtitle, { color: colors.mutedText }]}>
              {locationText}
            </Text>
          </View>

          <View style={[styles.sectionCard, { backgroundColor: colors.avatar }]}>
            <View style={styles.infoRow}>
              <MapPin size={16} color={colors.primary} />
              <Text style={[styles.infoText, { color: colors.text }]}>
                {locationText}
              </Text>
            </View>
            <View style={styles.infoRow}>
              <Clock size={16} color={colors.mutedText} />
              <Text style={[styles.infoText, { color: colors.mutedText }]}>
                Coordinates: {coordsText}
              </Text>
            </View>
          </View>

          <View style={[styles.sectionCard, { backgroundColor: colors.avatar }]}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              Tap a marker to view details
            </Text>
            <Text style={[styles.sectionBody, { color: colors.mutedText }]}>
              Crime details, AI insights, and safety tips will appear here.
            </Text>
          </View>
        </>
      )}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  sheet: {
    position: "absolute",
    left: 12,
    right: 12,
    borderRadius: 18,
    borderWidth: 1,
    shadowOffset: { width: 0, height: -6 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 20,
    zIndex: 30,
  },
  handleArea: {
    alignItems: "center",
    paddingTop: 10,
    paddingBottom: 6,
  },
  handle: {
    width: 42,
    height: 4,
    borderRadius: 2,
  },
  header: {
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
  },
  title: {
    fontSize: 18,
    fontFamily: "Inter_600SemiBold",
  },
  subtitle: {
    marginTop: 2,
    fontSize: 13,
    fontFamily: "Inter_500Medium",
  },
  meta: {
    marginTop: 2,
    fontSize: 12,
    fontFamily: "Inter_400Regular",
  },
  caseNumber: {
    marginTop: 6,
    fontSize: 12,
    fontFamily: "Inter_500Medium",
  },
  statusChip: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
  statusChipText: {
    fontSize: 11,
    fontFamily: "Inter_600SemiBold",
    color: "#FFFFFF",
  },
  infoGrid: {
    paddingHorizontal: 16,
    paddingBottom: 6,
    gap: 8,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  infoText: {
    fontSize: 13,
    fontFamily: "Inter_500Medium",
  },
  section: {
    paddingHorizontal: 16,
    paddingTop: 10,
  },
  sectionCard: {
    marginHorizontal: 16,
    marginTop: 10,
    padding: 12,
    borderRadius: 12,
  },
  sectionTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  sectionTitle: {
    fontSize: 14,
    fontFamily: "Inter_600SemiBold",
  },
  sectionBody: {
    marginTop: 4,
    fontSize: 13,
    fontFamily: "Inter_400Regular",
  },
});

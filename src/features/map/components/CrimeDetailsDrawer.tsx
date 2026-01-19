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

interface CrimeDetailsDrawerProps {
  crime: CrimeCaseWithRelations | null;
  bottomOffset: number;
  topOffset: number;
  containerHeight: number;
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

export function CrimeDetailsDrawer({
  crime,
  bottomOffset,
  topOffset,
  containerHeight,
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
    "hidden",
  );
  const startDragValue = useRef(0);

  const showPeek = (animated = true) => {
    setSnapState("peek");
    const config = {
      toValue: maxTranslateY,
      duration: 220,
      useNativeDriver: true,
    };
    animated
      ? Animated.timing(translateY, config).start()
      : translateY.setValue(config.toValue);
  };

  const showExpanded = () => {
    setSnapState("expanded");
    Animated.timing(translateY, {
      toValue: 0,
      duration: 220,
      useNativeDriver: true,
    }).start();
  };

  const hideSheet = () => {
    setSnapState("hidden");
    Animated.timing(translateY, {
      toValue: hiddenOffset,
      duration: 200,
      useNativeDriver: true,
    }).start(() => {
      onClose?.();
    });
  };

  useEffect(() => {
    if (crime) {
      showPeek();
    } else {
      hideSheet();
    }
  }, [crime]);

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
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: (_event, gesture) => {
          return Math.abs(gesture.dy) > 4;
        },
        onMoveShouldSetPanResponderCapture: (_event, gesture) => {
          return Math.abs(gesture.dy) > 4;
        },
        onPanResponderGrant: () => {
          translateY.stopAnimation((value) => {
            startDragValue.current = value;
          });
        },
        onPanResponderMove: (_event, gesture) => {
          const nextValue = clamp(
            startDragValue.current + gesture.dy,
            0,
            hiddenOffset,
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
          if (projected <= maxTranslateY * 0.4) {
            showExpanded();
          } else {
            showPeek();
          }
        },
      }),
    [hiddenOffset, maxTranslateY, snapState, translateY],
  );

  const crimeType =
    crime?.crime_type_info?.label ?? crime?.crime_type_info?.name ?? "Unknown";
  const status = crime?.case_status ?? "Unknown status";
  const incidentDate = formatDateTime(crime?.incident_datetime);
  const reportDate = formatDateTime(crime?.report_datetime);
  const barangayLabel = crime?.location?.barangay
    ? BARANGAYS[crime.location.barangay - 1]?.label ?? "Unknown barangay"
    : "Unknown barangay";
  const summary = sanitizeDetails(crime?.description);

  if (!crime && snapState === "hidden") {
    return null;
  }

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

      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.text }]}>{crimeType}</Text>
        <Text style={[styles.subtitle, { color: colors.mutedText }]}>
          {status} • {barangayLabel}
        </Text>
        <Text style={[styles.meta, { color: colors.mutedText }]}>
          Incident: {incidentDate}
        </Text>
        <Text style={[styles.meta, { color: colors.mutedText }]}>
          Reported: {reportDate}
        </Text>
      </View>

      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Summary</Text>
        <Text style={[styles.sectionBody, { color: colors.mutedText }]}>
          {summary}
        </Text>
      </View>

      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>
          AI Insights
        </Text>
        <Text style={[styles.sectionBody, { color: colors.mutedText }]}>
          Coming soon.
        </Text>
      </View>

      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>
          Safety Tips
        </Text>
        <Text style={[styles.sectionBody, { color: colors.mutedText }]}>
          Coming soon.
        </Text>
      </View>
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
    elevation: 12,
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
  section: {
    paddingHorizontal: 16,
    paddingTop: 10,
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

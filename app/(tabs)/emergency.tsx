import { useAppTheme } from "@/src/lib/theme";
import { useHotlines, type Hotline } from "@/src/features/emergency";
import { Copy, Phone, PhoneCall } from "lucide-react-native";
import { useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  Clipboard,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Linking, PanResponder } from "react-native";

export default function EmergencyScreen() {
  const { colors } = useAppTheme();
  const insets = useSafeAreaInsets();
  const { data: hotlines, isLoading, error } = useHotlines();
  const [copiedId, setCopiedId] = useState<number | null>(null);
  const [callError, setCallError] = useState<string | null>(null);
  const [copyError, setCopyError] = useState<string | null>(null);

  const primaryHotline = useMemo(
    () => ({
      label: "National Emergency Hotline",
      number: "911",
    }),
    []
  );

  const handleCall = async (rawNumber: string) => {
    const cleaned = rawNumber.replace(/[^0-9+]/g, "");
    const url = `tel:${cleaned}`;
    try {
      await Linking.openURL(url);
      setCallError(null);
    } catch (err) {
      setCallError("Unable to open dialer.");
    }
  };

  const handleCopy = (id: number, number: string) => {
    try {
      Clipboard.setString(number);
      setCopiedId(id);
      setCopyError(null);
      setTimeout(() => setCopiedId(null), 1500);
    } catch (_error) {
      setCopyError("Unable to copy number.");
      setTimeout(() => setCopyError(null), 2000);
    }
  };

  const renderHotlineRow = (hotline: Hotline) => {
    const label = hotline.label ?? "Emergency Hotline";
    const number = hotline.number ?? "";
    const isCopied = copiedId === hotline.id;
    const hasNumber = number.length > 0;

    return (
      <View
        key={hotline.id}
        style={[
          styles.hotlineCard,
          {
            backgroundColor: colors.surface,
            borderColor: colors.border,
          },
        ]}
      >
        <View style={styles.hotlineInfo}>
          <Text style={[styles.hotlineNumber, { color: colors.text }]}>
            {number || "No number available"}
          </Text>
          <Text style={[styles.hotlineLabel, { color: colors.mutedText }]}>
            {label}
          </Text>
        </View>
        <View style={styles.hotlineActions}>
          <View style={styles.hotlineActionRow}>
            <Pressable
              accessibilityRole="button"
              disabled={!hasNumber}
              onPress={() => handleCall(number)}
              style={[
                styles.iconButton,
                { backgroundColor: colors.primary, opacity: hasNumber ? 1 : 0.4 },
              ]}
            >
              <Phone size={18} color="#FFFFFF" />
            </Pressable>
            <Pressable
              accessibilityRole="button"
              disabled={!hasNumber}
              onPress={() => handleCopy(hotline.id, number)}
              style={[
                styles.iconButton,
                { backgroundColor: colors.avatar, opacity: hasNumber ? 1 : 0.4 },
              ]}
            >
              <Copy size={18} color={colors.text} />
            </Pressable>
          </View>
          {isCopied && (
            <Text style={[styles.copiedText, { color: colors.primary }]}>
              Copied
            </Text>
          )}
        </View>
      </View>
    );
  };

  const sliderTranslate = useRef(new Animated.Value(0)).current;
  const [sliderWidth, setSliderWidth] = useState(0);
  const [thumbWidth, setThumbWidth] = useState(0);
  const [sliderActive, setSliderActive] = useState(false);

  const sliderMax = Math.max(0, sliderWidth - thumbWidth - 8);
  const sliderReady = sliderMax > 0;
  const sliderThreshold = sliderMax * 0.85;

  const slideToCall = () => {
    handleCall(primaryHotline.number);
    Animated.spring(sliderTranslate, {
      toValue: 0,
      useNativeDriver: true,
      friction: 6,
      tension: 80,
    }).start(() => {
      setSliderActive(false);
    });
  };

  const sliderResponder = useMemo(
    () =>
      PanResponder.create({
        onMoveShouldSetPanResponder: (_event, gesture) => {
          return Math.abs(gesture.dx) > 6 && Math.abs(gesture.dx) > Math.abs(gesture.dy);
        },
        onPanResponderGrant: () => {
          setSliderActive(true);
        },
        onPanResponderMove: (_event, gesture) => {
          if (!sliderReady) return;
          const nextValue = Math.max(0, Math.min(sliderMax, gesture.dx));
          sliderTranslate.setValue(nextValue);
        },
        onPanResponderRelease: (_event, gesture) => {
          if (!sliderReady) {
            sliderTranslate.setValue(0);
            return;
          }
          const projected = gesture.dx + gesture.vx * 40;
          if (projected >= sliderThreshold) {
            slideToCall();
            return;
          }
          Animated.spring(sliderTranslate, {
            toValue: 0,
            useNativeDriver: true,
            friction: 6,
            tension: 80,
          }).start(() => setSliderActive(false));
        },
      }),
    [sliderMax, sliderReady, sliderThreshold]
  );

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: colors.background,
          paddingTop: insets.top + 16,
          paddingBottom: insets.bottom + 16,
        },
      ]}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Text style={[styles.title, { color: colors.text }]}>Emergency</Text>
          <Text style={[styles.subtitle, { color: colors.mutedText }]}>
            Fast access to emergency hotlines.
          </Text>
        </View>

        <View
          style={[
            styles.heroCard,
            { backgroundColor: colors.surface, borderColor: colors.border },
          ]}
        >
          <View style={styles.heroHeader}>
            <Text style={[styles.heroTitle, { color: colors.text }]}>
              {primaryHotline.number}
            </Text>
            <Text style={[styles.heroSubtitle, { color: colors.mutedText }]}>
              {primaryHotline.label}
            </Text>
          </View>

          <View
            style={[
              styles.sliderTrack,
              {
                backgroundColor: colors.avatar,
                borderColor: sliderActive ? colors.primary : colors.border,
              },
            ]}
            onLayout={(event) => {
              setSliderWidth(event.nativeEvent.layout.width);
            }}
          >
            <Animated.View
              style={[
                styles.sliderThumb,
                {
                  backgroundColor: colors.primary,
                  transform: [{ translateX: sliderTranslate }],
                },
              ]}
              onLayout={(event) => setThumbWidth(event.nativeEvent.layout.width)}
              {...sliderResponder.panHandlers}
            >
              <PhoneCall size={18} color="#FFFFFF" />
            </Animated.View>
            <Text style={[styles.sliderLabel, { color: colors.mutedText }]}>
              Slide to call 911
            </Text>
          </View>

        {(callError || copyError) && (
          <Text style={[styles.callError, { color: colors.danger }]}>
            {callError ?? copyError}
          </Text>
        )}
        </View>

        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            Available Hotlines
          </Text>
          <Text style={[styles.sectionSubtitle, { color: colors.mutedText }]}>
            Tap the phone or copy icon for quick actions.
          </Text>
        </View>

        {isLoading && (
          <ActivityIndicator size="large" color={colors.primary} />
        )}

        {!isLoading && error && (
          <Text style={[styles.errorText, { color: colors.danger }]}>
            Unable to load hotlines. Please try again.
          </Text>
        )}

        {!isLoading && !error && (hotlines?.length ?? 0) === 0 && (
          <Text style={[styles.emptyText, { color: colors.mutedText }]}>
            No hotlines available right now.
          </Text>
        )}

        {!isLoading && !error && hotlines?.map(renderHotlineRow)}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 24,
  },
  header: {
    marginBottom: 20,
  },
  title: {
    fontSize: 28,
    fontFamily: "Inter_700Bold",
  },
  subtitle: {
    marginTop: 6,
    fontSize: 14,
    fontFamily: "Inter_400Regular",
  },
  heroCard: {
    borderRadius: 20,
    borderWidth: 1,
    paddingTop: 16,
    paddingHorizontal: 16,
    paddingBottom: 10,
    gap: 12,
  },
  heroHeader: {
    alignItems: "center",
    gap: 4,
  },
  heroTitle: {
    fontSize: 32,
    fontFamily: "Inter_700Bold",
    letterSpacing: 1,
    textAlign: "center",
  },
  heroSubtitle: {
    marginTop: 4,
    fontSize: 13,
    fontFamily: "Inter_500Medium",
    textAlign: "center",
  },
  sliderTrack: {
    borderRadius: 999,
    borderWidth: 1,
    height: 52,
    justifyContent: "center",
    overflow: "hidden",
  },
  sliderThumb: {
    position: "absolute",
    left: 4,
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 2,
  },
  sliderLabel: {
    textAlign: "center",
    fontSize: 13,
    fontFamily: "Inter_500Medium",
  },
  callError: {
    fontSize: 12,
    fontFamily: "Inter_500Medium",
  },
  sectionHeader: {
    marginTop: 24,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: "Inter_600SemiBold",
  },
  sectionSubtitle: {
    marginTop: 4,
    fontSize: 12,
    fontFamily: "Inter_400Regular",
  },
  hotlineCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 14,
    marginBottom: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  hotlineInfo: {
    flex: 1,
    marginRight: 12,
  },
  hotlineLabel: {
    marginTop: 4,
    fontSize: 12,
    fontFamily: "Inter_400Regular",
  },
  hotlineNumber: {
    fontSize: 18,
    fontFamily: "Inter_700Bold",
  },
  hotlineActions: {
    alignItems: "flex-end",
    gap: 6,
  },
  hotlineActionRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  iconButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  copiedText: {
    fontSize: 11,
    fontFamily: "Inter_600SemiBold",
  },
  errorText: {
    fontSize: 13,
    fontFamily: "Inter_500Medium",
  },
  emptyText: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
  },
});

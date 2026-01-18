import { supabase } from "@/src/lib/supabase";
import { useAppTheme } from "@/src/lib/theme";
import { LogOut, Moon, Sun } from "lucide-react-native";
import { router } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import {
  Image,
  Pressable,
  StyleSheet,
  Switch,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import type { User as SupabaseUser } from "@supabase/supabase-js";

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const { colors, theme, toggleTheme } = useAppTheme();
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [avatarInitial, setAvatarInitial] = useState("U");
  const [displayName, setDisplayName] = useState("User");
  const [email, setEmail] = useState<string | null>(null);

  const setUserInfo = (user?: SupabaseUser | null) => {
    const metadata = user?.user_metadata ?? {};
    const urlCandidate =
      (typeof metadata.avatar_url === "string" && metadata.avatar_url) ||
      (typeof metadata.picture === "string" && metadata.picture) ||
      (typeof metadata.avatar === "string" && metadata.avatar) ||
      null;
    const nameCandidate =
      (typeof metadata.full_name === "string" && metadata.full_name) ||
      (typeof metadata.name === "string" && metadata.name) ||
      user?.email ||
      "User";
    const initial = nameCandidate.trim().charAt(0).toUpperCase() || "U";

    setAvatarUrl(urlCandidate);
    setAvatarInitial(initial);
    setDisplayName(nameCandidate);
    setEmail(user?.email ?? null);
  };

  useEffect(() => {
    let isActive = true;

    const loadUser = async () => {
      const { data } = await supabase.auth.getUser();
      if (!isActive) return;
      setUserInfo(data.user);
    };

    loadUser();

    const { data: authListener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setUserInfo(session?.user ?? null);
      },
    );

    return () => {
      isActive = false;
      authListener.subscription.unsubscribe();
    };
  }, []);

  const greetingName = useMemo(() => {
    const first = displayName.trim().split(" ")[0] || "there";
    return first.includes("@") ? "there" : first;
  }, [displayName]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.replace("/(auth)/login");
  };

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: colors.background, paddingTop: insets.top + 24 },
      ]}
    >
      <View style={styles.header}>
        {email && (
          <Text style={[styles.email, { color: colors.mutedText }]}>
            {email}
          </Text>
        )}
        <View
          style={[
            styles.avatar,
            { backgroundColor: colors.avatar, borderColor: colors.border },
          ]}
        >
          {avatarUrl ? (
            <Image source={{ uri: avatarUrl }} style={styles.avatarImage} />
          ) : (
            <Text style={[styles.avatarInitial, { color: colors.text }]}>
              {avatarInitial}
            </Text>
          )}
        </View>
        <Text style={[styles.greeting, { color: colors.text }]}>
          Hi, {greetingName}
        </Text>
        <Text style={[styles.name, { color: colors.mutedText }]}>
          {displayName}
        </Text>
      </View>

      <View style={styles.actions}>
        <View
          style={[
            styles.actionRow,
            { backgroundColor: colors.surface, borderColor: colors.border },
          ]}
        >
          <View style={styles.actionLeft}>
            {theme === "dark" ? (
              <Moon size={20} color={colors.text} />
            ) : (
              <Sun size={20} color={colors.text} />
            )}
            <Text style={[styles.actionText, { color: colors.text }]}>
              Dark mode
            </Text>
          </View>
          <Switch
            value={theme === "dark"}
            onValueChange={toggleTheme}
            trackColor={{ false: colors.border, true: colors.primary }}
            thumbColor="#FFFFFF"
          />
        </View>
        <Pressable
          onPress={handleSignOut}
          style={[
            styles.actionRow,
            { backgroundColor: colors.surface, borderColor: colors.border },
          ]}
        >
          <View style={styles.actionLeft}>
            <LogOut size={20} color={colors.danger} />
            <Text style={[styles.actionTextDanger, { color: colors.danger }]}>
              Sign out
            </Text>
          </View>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    alignItems: "center",
    paddingHorizontal: 24,
    paddingBottom: 24,
  },
  avatar: {
    width: 96,
    height: 96,
    borderRadius: 48,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
  },
  avatarImage: {
    width: 96,
    height: 96,
    borderRadius: 48,
  },
  avatarInitial: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 32,
  },
  greeting: {
    fontFamily: "Inter_700Bold",
    fontSize: 24,
    marginTop: 16,
  },
  name: {
    fontFamily: "Inter_500Medium",
    fontSize: 16,
    marginTop: 6,
  },
  email: {
    fontFamily: "Inter_400Regular",
    fontSize: 14,
    marginBottom: 16,
  },
  actions: {
    paddingHorizontal: 20,
    gap: 12,
  },
  actionRow: {
    width: "100%",
    borderRadius: 16,
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  actionLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  actionText: {
    fontFamily: "Inter_500Medium",
    fontSize: 16,
  },
  actionTextDanger: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 16,
  },
});

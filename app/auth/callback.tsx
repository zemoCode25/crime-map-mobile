import { supabase } from "@/src/lib/supabase";
import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";

const FALLBACK_DELAY_MS = 8000;

export default function AuthCallback() {
  const { code, error, error_description } = useLocalSearchParams<{
    code?: string;
    error?: string;
    error_description?: string;
  }>();
  const [statusText, setStatusText] = useState("Completing sign-in...");

  useEffect(() => {
    let isActive = true;

    const redirectToLogin = () => {
      if (!isActive) return;
      router.replace("/(auth)/login");
    };

    const timeout = setTimeout(redirectToLogin, FALLBACK_DELAY_MS);

    const finish = async () => {
      if (error || error_description) {
        if (!isActive) return;
        setStatusText("Sign-in failed. Returning to login...");
        return;
      }

      const { data: existingSession } = await supabase.auth.getSession();

      if (!isActive) return;
      if (existingSession.session) {
        clearTimeout(timeout);
        router.replace("/(tabs)");
        return;
      }

      if (typeof code === "string" && code.length > 0) {
        setStatusText("Finalizing your session...");
        const { data, error: exchangeError } =
          await supabase.auth.exchangeCodeForSession(code);

        if (!isActive) return;
        if (exchangeError) {
          setStatusText("Sign-in failed. Returning to login...");
          return;
        }

        if (data.session) {
          clearTimeout(timeout);
          router.replace("/(tabs)");
          return;
        }
      }

      const { data: refreshedSession } = await supabase.auth.getSession();
      if (!isActive) return;
      if (refreshedSession.session) {
        clearTimeout(timeout);
        router.replace("/(tabs)");
      }
    };

    finish();

    const { data: authListener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        if (!isActive) return;
        if (session) {
          clearTimeout(timeout);
          router.replace("/(tabs)");
        }
      },
    );

    return () => {
      isActive = false;
      clearTimeout(timeout);
      authListener.subscription.unsubscribe();
    };
  }, [code, error, error_description]);

  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color="#F97316" />
      <Text style={styles.text}>{statusText}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 24,
  },
  text: {
    fontFamily: "Inter_500Medium",
    fontSize: 14,
    color: "#6B7280",
    marginTop: 12,
    textAlign: "center",
  },
});

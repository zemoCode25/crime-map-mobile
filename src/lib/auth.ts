import * as Linking from "expo-linking";
import * as WebBrowser from "expo-web-browser";

import { supabase } from "./supabase";

WebBrowser.maybeCompleteAuthSession();

const redirectTo = Linking.createURL("auth/callback");

const getAuthCodeFromUrl = (url: string | null) => {
  if (!url) return null;

  const parsed = Linking.parse(url);
  const codeParam = parsed.queryParams?.code;

  if (typeof codeParam === "string" && codeParam.length > 0) {
    return codeParam;
  }

  if (Array.isArray(codeParam) && codeParam.length > 0) {
    return codeParam[0];
  }

  const match = url.match(/[?&]code=([^&]+)/);
  if (match?.[1]) {
    return decodeURIComponent(match[1]);
  }

  return null;
};

type OAuthResult = {
  error?: Error;
  canceled?: boolean;
};

export async function signInWithGoogle(): Promise<OAuthResult> {
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo,
      skipBrowserRedirect: true,
    },
  });

  if (error) {
    return { error };
  }

  if (!data?.url) {
    return { error: new Error("No auth URL returned.") };
  }

  const result = await WebBrowser.openAuthSessionAsync(data.url, redirectTo);

  if (result.type === "cancel" || result.type === "dismiss") {
    return { canceled: true };
  }

  if (result.type !== "success" || !result.url) {
    return { error: new Error("Google sign-in failed.") };
  }

  const code = getAuthCodeFromUrl(result.url);

  if (!code) {
    return { error: new Error("No auth code returned.") };
  }

  const { error: exchangeError } =
    await supabase.auth.exchangeCodeForSession(code);

  if (exchangeError) {
    return { error: exchangeError };
  }

  return {};
}

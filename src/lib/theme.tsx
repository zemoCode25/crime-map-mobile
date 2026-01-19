import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider,
} from "@react-navigation/native";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import type { ReactNode } from "react";

type AppTheme = "light" | "dark";

type ThemeColors = {
  background: string;
  surface: string;
  text: string;
  mutedText: string;
  border: string;
  primary: string;
  danger: string;
  shadow: string;
  avatar: string;
};

type ThemeContextValue = {
  theme: AppTheme;
  colors: ThemeColors;
  isReady: boolean;
  setTheme: (theme: AppTheme) => void;
  toggleTheme: () => void;
};

const STORAGE_KEY = "app_theme_preference";

const lightColors: ThemeColors = {
  background: "#FFFFFF",
  surface: "#FFFFFF",
  text: "#111827",
  mutedText: "#6B7280",
  border: "#E5E7EB",
  primary: "#F97316",
  danger: "#DC2626",
  shadow: "#0F172A",
  avatar: "#F3F4F6",
};

const darkColors: ThemeColors = {
  background: "#0B1120",
  surface: "#111827",
  text: "#F9FAFB",
  mutedText: "#9CA3AF",
  border: "#1F2937",
  primary: "#F97316",
  danger: "#F87171",
  shadow: "#000000",
  avatar: "#1F2937",
};

const AppThemeContext = createContext<ThemeContextValue | undefined>(undefined);

export function AppThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<AppTheme>("light");
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const loadTheme = async () => {
      const stored = await AsyncStorage.getItem(STORAGE_KEY);
      if (isMounted && (stored === "light" || stored === "dark")) {
        setThemeState(stored);
      }
      if (isMounted) {
        setIsReady(true);
      }
    };

    loadTheme();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    if (!isReady) return;
    AsyncStorage.setItem(STORAGE_KEY, theme);
  }, [isReady, theme]);

  const setTheme = useCallback((value: AppTheme) => {
    setThemeState(value);
  }, []);

  const toggleTheme = useCallback(() => {
    setThemeState((prev) => (prev === "light" ? "dark" : "light"));
  }, []);

  const colors = theme === "dark" ? darkColors : lightColors;

  const navigationTheme = useMemo(() => {
    const baseTheme = theme === "dark" ? DarkTheme : DefaultTheme;
    return {
      ...baseTheme,
      colors: {
        ...baseTheme.colors,
        background: colors.background,
        card: colors.surface,
        text: colors.text,
        border: colors.border,
        primary: colors.primary,
      },
    };
  }, [colors, theme]);

  const value = useMemo(
    () => ({
      theme,
      colors,
      isReady,
      setTheme,
      toggleTheme,
    }),
    [colors, isReady, setTheme, theme, toggleTheme],
  );

  return (
    <AppThemeContext.Provider value={value}>
      <ThemeProvider value={navigationTheme}>{children}</ThemeProvider>
    </AppThemeContext.Provider>
  );
}

export function useAppTheme() {
  const context = useContext(AppThemeContext);
  if (!context) {
    throw new Error("useAppTheme must be used within AppThemeProvider");
  }
  return context;
}

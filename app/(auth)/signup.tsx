import { GoogleLogo } from "@/src/components/GoogleLogo";
import { zodResolver } from "@hookform/resolvers/zod";
import { Link, router } from "expo-router";
import {
  ArrowLeft,
  Check,
  Eye,
  EyeOff,
  Lock,
  Mail,
  MapPin,
  User,
  X,
} from "lucide-react-native";
import { useMemo, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { z } from "zod";

// Password requirements
const passwordRequirements = [
  { id: "length", label: "At least 8 characters", regex: /.{8,}/ },
  { id: "uppercase", label: "One uppercase letter", regex: /[A-Z]/ },
  { id: "lowercase", label: "One lowercase letter", regex: /[a-z]/ },
  { id: "number", label: "One number", regex: /\d/ },
  {
    id: "special",
    label: "One special character",
    regex: /[!@#$%^&*(),.?":{}|<>]/,
  },
];

// Validation schema
const signupSchema = z
  .object({
    fullName: z
      .string()
      .min(1, "Full name is required")
      .min(2, "Name must be at least 2 characters"),
    email: z
      .string()
      .min(1, "Email is required")
      .email("Please enter a valid email"),
    password: z
      .string()
      .min(1, "Password is required")
      .min(8, "Password must be at least 8 characters")
      .regex(/[A-Z]/, "Password must contain an uppercase letter")
      .regex(/[a-z]/, "Password must contain a lowercase letter")
      .regex(/\d/, "Password must contain a number")
      .regex(
        /[!@#$%^&*(),.?":{}|<>]/,
        "Password must contain a special character",
      ),
    confirmPassword: z.string().min(1, "Please confirm your password"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

type SignupFormData = z.infer<typeof signupSchema>;

// Password strength meter component
function PasswordStrengthMeter({ password }: { password: string }) {
  const strength = useMemo(() => {
    let score = 0;
    passwordRequirements.forEach((req) => {
      if (req.regex.test(password)) score++;
    });
    return score;
  }, [password]);

  const getStrengthLabel = () => {
    if (password.length === 0) return { label: "", color: "#E5E7EB" };
    if (strength <= 1) return { label: "Weak", color: "#EF4444" };
    if (strength <= 2) return { label: "Fair", color: "#F97316" };
    if (strength <= 3) return { label: "Good", color: "#EAB308" };
    if (strength <= 4) return { label: "Strong", color: "#22C55E" };
    return { label: "Excellent", color: "#16A34A" };
  };

  const strengthInfo = getStrengthLabel();

  return (
    <View style={strengthStyles.container}>
      {/* Strength Bar */}
      <View style={strengthStyles.barContainer}>
        {[1, 2, 3, 4, 5].map((level) => (
          <View
            key={level}
            style={[
              strengthStyles.barSegment,
              {
                backgroundColor:
                  password.length > 0 && strength >= level
                    ? strengthInfo.color
                    : "#E5E7EB",
              },
            ]}
          />
        ))}
      </View>

      {/* Strength Label */}
      {password.length > 0 && (
        <Text style={[strengthStyles.label, { color: strengthInfo.color }]}>
          {strengthInfo.label}
        </Text>
      )}

      {/* Requirements List */}
      <View style={strengthStyles.requirementsList}>
        {passwordRequirements.map((req) => {
          const isMet = req.regex.test(password);
          return (
            <View key={req.id} style={strengthStyles.requirementRow}>
              <View
                style={[
                  strengthStyles.checkCircle,
                  {
                    backgroundColor: isMet ? "#DCFCE7" : "#F3F4F6",
                    borderColor: isMet ? "#22C55E" : "#E5E7EB",
                  },
                ]}
              >
                {isMet ? (
                  <Check size={12} color="#22C55E" strokeWidth={3} />
                ) : (
                  <X size={12} color="#9CA3AF" strokeWidth={3} />
                )}
              </View>
              <Text
                style={[
                  strengthStyles.requirementText,
                  { color: isMet ? "#16A34A" : "#6B7280" },
                ]}
              >
                {req.label}
              </Text>
            </View>
          );
        })}
      </View>
    </View>
  );
}

const strengthStyles = StyleSheet.create({
  container: {
    marginTop: 12,
  },
  barContainer: {
    flexDirection: "row",
    gap: 4,
    marginBottom: 8,
  },
  barSegment: {
    flex: 1,
    height: 4,
    borderRadius: 2,
  },
  label: {
    fontFamily: "Inter_500Medium",
    fontSize: 12,
    textAlign: "right",
    marginBottom: 12,
  },
  requirementsList: {
    gap: 8,
  },
  requirementRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  checkCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
  },
  requirementText: {
    fontFamily: "Inter_400Regular",
    fontSize: 13,
  },
});

export default function SignupScreen() {
  const insets = useSafeAreaInsets();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const {
    control,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<SignupFormData>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      fullName: "",
      email: "",
      password: "",
      confirmPassword: "",
    },
  });

  const passwordValue = watch("password");

  const onSubmit = async (data: SignupFormData) => {
    setIsLoading(true);
    console.log("Signup data:", data);
    // TODO: Implement actual signup with Supabase
    setTimeout(() => {
      setIsLoading(false);
      router.replace("/(tabs)");
    }, 1000);
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingTop: insets.top + 16, paddingBottom: insets.bottom + 20 },
        ]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Back Button */}
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
          activeOpacity={0.7}
        >
          <ArrowLeft size={24} color="#374151" />
        </TouchableOpacity>

        {/* Header */}
        <View style={styles.header}>
          <View style={styles.logoContainer}>
            <View style={styles.logoCircle}>
              <MapPin size={28} color="#F97316" strokeWidth={2.5} />
            </View>
          </View>
          <Text style={styles.title}>Create account</Text>
          <Text style={styles.subtitle}>
            Join us to stay informed about safety in your community
          </Text>
        </View>

        {/* Form */}
        <View style={styles.form}>
          {/* Full Name Input */}
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Full Name</Text>
            <Controller
              control={control}
              name="fullName"
              render={({ field: { onChange, onBlur, value } }) => (
                <View
                  style={[
                    styles.inputWrapper,
                    errors.fullName && styles.inputWrapperError,
                  ]}
                >
                  <User
                    size={20}
                    color={errors.fullName ? "#EF4444" : "#9CA3AF"}
                    style={styles.inputIcon}
                  />
                  <TextInput
                    style={styles.input}
                    placeholder="Enter your full name"
                    placeholderTextColor="#9CA3AF"
                    value={value}
                    onChangeText={onChange}
                    onBlur={onBlur}
                    autoCapitalize="words"
                    autoComplete="name"
                  />
                </View>
              )}
            />
            {errors.fullName && (
              <Text style={styles.errorText}>{errors.fullName.message}</Text>
            )}
          </View>

          {/* Email Input */}
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Email</Text>
            <Controller
              control={control}
              name="email"
              render={({ field: { onChange, onBlur, value } }) => (
                <View
                  style={[
                    styles.inputWrapper,
                    errors.email && styles.inputWrapperError,
                  ]}
                >
                  <Mail
                    size={20}
                    color={errors.email ? "#EF4444" : "#9CA3AF"}
                    style={styles.inputIcon}
                  />
                  <TextInput
                    style={styles.input}
                    placeholder="Enter your email"
                    placeholderTextColor="#9CA3AF"
                    value={value}
                    onChangeText={onChange}
                    onBlur={onBlur}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoComplete="email"
                  />
                </View>
              )}
            />
            {errors.email && (
              <Text style={styles.errorText}>{errors.email.message}</Text>
            )}
          </View>

          {/* Password Input */}
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Password</Text>
            <Controller
              control={control}
              name="password"
              render={({ field: { onChange, onBlur, value } }) => (
                <>
                  <View
                    style={[
                      styles.inputWrapper,
                      errors.password && styles.inputWrapperError,
                    ]}
                  >
                    <Lock
                      size={20}
                      color={errors.password ? "#EF4444" : "#9CA3AF"}
                      style={styles.inputIcon}
                    />
                    <TextInput
                      style={styles.input}
                      placeholder="Create a password"
                      placeholderTextColor="#9CA3AF"
                      value={value}
                      onChangeText={onChange}
                      onBlur={onBlur}
                      secureTextEntry={!showPassword}
                      autoCapitalize="none"
                    />
                    <Pressable
                      onPress={() => setShowPassword(!showPassword)}
                      style={styles.eyeButton}
                    >
                      {showPassword ? (
                        <EyeOff size={20} color="#9CA3AF" />
                      ) : (
                        <Eye size={20} color="#9CA3AF" />
                      )}
                    </Pressable>
                  </View>
                  {/* Password Strength Meter */}
                  <PasswordStrengthMeter password={value} />
                </>
              )}
            />
          </View>

          {/* Confirm Password Input */}
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Confirm Password</Text>
            <Controller
              control={control}
              name="confirmPassword"
              render={({ field: { onChange, onBlur, value } }) => (
                <View
                  style={[
                    styles.inputWrapper,
                    errors.confirmPassword && styles.inputWrapperError,
                  ]}
                >
                  <Lock
                    size={20}
                    color={errors.confirmPassword ? "#EF4444" : "#9CA3AF"}
                    style={styles.inputIcon}
                  />
                  <TextInput
                    style={styles.input}
                    placeholder="Confirm your password"
                    placeholderTextColor="#9CA3AF"
                    value={value}
                    onChangeText={onChange}
                    onBlur={onBlur}
                    secureTextEntry={!showConfirmPassword}
                    autoCapitalize="none"
                  />
                  <Pressable
                    onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                    style={styles.eyeButton}
                  >
                    {showConfirmPassword ? (
                      <EyeOff size={20} color="#9CA3AF" />
                    ) : (
                      <Eye size={20} color="#9CA3AF" />
                    )}
                  </Pressable>
                </View>
              )}
            />
            {errors.confirmPassword && (
              <Text style={styles.errorText}>
                {errors.confirmPassword.message}
              </Text>
            )}
          </View>

          {/* Terms */}
          <Text style={styles.terms}>
            By signing up, you agree to our{" "}
            <Text style={styles.termsLink}>Terms of Service</Text> and{" "}
            <Text style={styles.termsLink}>Privacy Policy</Text>
          </Text>

          {/* Signup Button */}
          <TouchableOpacity
            style={[styles.button, isLoading && styles.buttonDisabled]}
            onPress={handleSubmit(onSubmit)}
            disabled={isLoading}
            activeOpacity={0.8}
          >
            <Text style={styles.buttonText}>
              {isLoading ? "Creating account..." : "Create Account"}
            </Text>
          </TouchableOpacity>

          {/* Divider */}
          <View style={styles.divider}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>or continue with</Text>
            <View style={styles.dividerLine} />
          </View>

          {/* Social Signup */}
          <TouchableOpacity style={styles.socialButton} activeOpacity={0.7}>
            <View style={styles.googleLogoContainer}>
              <GoogleLogo size={20} />
            </View>
            <Text style={styles.socialButtonText}>Continue with Google</Text>
          </TouchableOpacity>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>Already have an account? </Text>
          <Link href={"/(auth)/login" as any} asChild>
            <TouchableOpacity>
              <Text style={styles.footerLink}>Sign In</Text>
            </TouchableOpacity>
          </Link>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: "#F9FAFB",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  header: {
    alignItems: "center",
    marginBottom: 32,
  },
  logoContainer: {
    marginBottom: 20,
  },
  logoCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "#FFF7ED",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#FFEDD5",
  },
  title: {
    fontFamily: "Inter_700Bold",
    fontSize: 26,
    color: "#111827",
    marginBottom: 8,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontFamily: "Inter_400Regular",
    fontSize: 15,
    color: "#6B7280",
    textAlign: "center",
    lineHeight: 22,
    paddingHorizontal: 16,
  },
  form: {
    flex: 1,
  },
  inputContainer: {
    marginBottom: 18,
  },
  label: {
    fontFamily: "Inter_500Medium",
    fontSize: 14,
    color: "#374151",
    marginBottom: 8,
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F9FAFB",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    paddingHorizontal: 16,
    height: 52,
  },
  inputWrapperError: {
    borderColor: "#EF4444",
    backgroundColor: "#FEF2F2",
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    fontFamily: "Inter_400Regular",
    fontSize: 15,
    color: "#111827",
  },
  eyeButton: {
    padding: 4,
  },
  errorText: {
    fontFamily: "Inter_400Regular",
    fontSize: 12,
    color: "#EF4444",
    marginTop: 6,
    marginLeft: 4,
  },
  terms: {
    fontFamily: "Inter_400Regular",
    fontSize: 13,
    color: "#6B7280",
    textAlign: "center",
    lineHeight: 20,
    marginBottom: 24,
  },
  termsLink: {
    fontFamily: "Inter_500Medium",
    color: "#F97316",
  },
  button: {
    backgroundColor: "#F97316",
    borderRadius: 12,
    height: 52,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#F97316",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  buttonText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 16,
    color: "#FFFFFF",
    letterSpacing: 0.3,
  },
  divider: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 24,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: "#E5E7EB",
  },
  dividerText: {
    fontFamily: "Inter_400Regular",
    fontSize: 13,
    color: "#9CA3AF",
    marginHorizontal: 16,
  },
  socialButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    height: 52,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  googleLogoContainer: {
    marginRight: 12,
  },
  socialButtonText: {
    fontFamily: "Inter_500Medium",
    fontSize: 15,
    color: "#374151",
  },
  footer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 24,
    paddingBottom: 16,
  },
  footerText: {
    fontFamily: "Inter_400Regular",
    fontSize: 14,
    color: "#6B7280",
  },
  footerLink: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 14,
    color: "#F97316",
  },
});

import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useAuthStore } from '../../stores/authStore';
import { colors, spacing, borderRadius, fontSize, fontWeight } from '../../theme/colors';

export default function LoginScreen() {
  const [selectedRole, setSelectedRole] = useState<'SR' | 'Manager'>('SR');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);

  const { login, loginDemo, isLoading, error } = useAuthStore();

  const handleLogin = async () => {
    if (!username || !password) {
      Alert.alert('Error', 'Please enter username and password');
      return;
    }

    try {
      await login({ username, password });
    } catch (err) {
      Alert.alert('Login Failed', error || 'Please check your credentials');
    }
  };

  const handleDemoLogin = async () => {
    try {
      // Use demo accounts based on selected role
      const demoUser = selectedRole === 'SR' ? 'sales1' : 'manager';
      await loginDemo(demoUser);
    } catch (err) {
      Alert.alert('Demo Login Failed', error || 'Please try again');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        {/* App Icon */}
        <View style={styles.iconContainer}>
          <View style={styles.icon}>
            <Text style={styles.iconText}>📱</Text>
          </View>
        </View>

        {/* Title */}
        <Text style={styles.title}>SFE Mobile</Text>
        <Text style={styles.subtitle}>Sales Force Effectiveness</Text>

        {/* Role Selection Card */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>เข้าสู่ระบบ</Text>

          {/* Role Tabs */}
          <View style={styles.roleContainer}>
            <TouchableOpacity
              style={[
                styles.roleButton,
                selectedRole === 'SR' && styles.roleButtonActive,
              ]}
              onPress={() => setSelectedRole('SR')}
            >
              <Text style={styles.roleIcon}>👤</Text>
              <Text
                style={[
                  styles.roleText,
                  selectedRole === 'SR' && styles.roleTextActive,
                ]}
              >
                Sales Rep
              </Text>
              <Text style={styles.roleSubtext}>พนักงานขาย</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.roleButton,
                selectedRole === 'Manager' && styles.roleButtonActive,
              ]}
              onPress={() => setSelectedRole('Manager')}
            >
              <Text style={styles.roleIcon}>👨‍💼</Text>
              <Text
                style={[
                  styles.roleText,
                  selectedRole === 'Manager' && styles.roleTextActive,
                ]}
              >
                Manager
              </Text>
              <Text style={styles.roleSubtext}>ผู้จัดการ</Text>
            </TouchableOpacity>
          </View>

          {/* Username Input */}
          <View style={styles.inputContainer}>
            <Text style={styles.inputIcon}>👤</Text>
            <TextInput
              style={styles.input}
              placeholder="Username หรือ Email"
              placeholderTextColor={colors.textLight}
              value={username}
              onChangeText={setUsername}
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>

          {/* Password Input */}
          <View style={styles.inputContainer}>
            <Text style={styles.inputIcon}>🔒</Text>
            <TextInput
              style={styles.input}
              placeholder="Password"
              placeholderTextColor={colors.textLight}
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              autoCapitalize="none"
            />
          </View>

          {/* Remember Me & Forgot Password */}
          <View style={styles.optionsRow}>
            <TouchableOpacity
              style={styles.checkboxContainer}
              onPress={() => setRememberMe(!rememberMe)}
            >
              <View style={[styles.checkbox, rememberMe && styles.checkboxChecked]}>
                {rememberMe && <Text style={styles.checkmark}>✓</Text>}
              </View>
              <Text style={styles.checkboxLabel}>จดจำฉันไว้</Text>
            </TouchableOpacity>

            <TouchableOpacity>
              <Text style={styles.forgotText}>ลืมรหัสผ่าน?</Text>
            </TouchableOpacity>
          </View>

          {/* Login Button */}
          <TouchableOpacity
            style={[styles.loginButton, isLoading && styles.loginButtonDisabled]}
            onPress={handleLogin}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color={colors.textWhite} />
            ) : (
              <>
                <Text style={styles.loginButtonIcon}>🔑</Text>
                <Text style={styles.loginButtonText}>เข้าสู่ระบบ</Text>
              </>
            )}
          </TouchableOpacity>

          {/* Divider */}
          <Text style={styles.divider}>หรือ</Text>

          {/* SSO Button */}
          <TouchableOpacity style={styles.ssoButton}>
            <Text style={styles.ssoIcon}>🔐</Text>
            <Text style={styles.ssoButtonText}>เข้าสู่ระบบด้วย Single Sign-On</Text>
          </TouchableOpacity>

          {/* Demo Mode Banner */}
          <TouchableOpacity style={styles.demoBanner} onPress={handleDemoLogin}>
            <Text style={styles.demoTitle}>Demo Mode</Text>
            <Text style={styles.demoText}>
              กรอก Username/Password หรือคลิกที่นี่เพื่อเข้าสู่ระบบทดลองใช้งาน
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.primary,
  },
  content: {
    flex: 1,
    padding: spacing.lg,
    justifyContent: 'center',
  },
  iconContainer: {
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  icon: {
    width: 80,
    height: 80,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: borderRadius.lg,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconText: {
    fontSize: 40,
  },
  title: {
    fontSize: fontSize.xxxl,
    fontWeight: fontWeight.bold,
    color: colors.textWhite,
    textAlign: 'center',
    marginBottom: spacing.xs,
  },
  subtitle: {
    fontSize: fontSize.md,
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
    marginBottom: spacing.xl,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
  },
  cardTitle: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.semibold,
    color: colors.text,
    textAlign: 'center',
    marginBottom: spacing.lg,
  },
  roleContainer: {
    flexDirection: 'row',
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  roleButton: {
    flex: 1,
    backgroundColor: colors.background,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  roleButtonActive: {
    backgroundColor: 'rgba(99, 102, 241, 0.1)',
    borderColor: colors.primary,
  },
  roleIcon: {
    fontSize: 32,
    marginBottom: spacing.xs,
  },
  roleText: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
    color: colors.text,
  },
  roleTextActive: {
    color: colors.primary,
  },
  roleSubtext: {
    fontSize: fontSize.xs,
    color: colors.textSecondary,
    marginTop: 2,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  inputIcon: {
    fontSize: 20,
    marginRight: spacing.sm,
  },
  input: {
    flex: 1,
    height: 50,
    fontSize: fontSize.md,
    color: colors.text,
  },
  optionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: colors.border,
    marginRight: spacing.sm,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxChecked: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  checkmark: {
    color: colors.textWhite,
    fontSize: 14,
    fontWeight: fontWeight.bold,
  },
  checkboxLabel: {
    fontSize: fontSize.sm,
    color: colors.text,
  },
  forgotText: {
    fontSize: fontSize.sm,
    color: colors.primary,
  },
  loginButton: {
    backgroundColor: colors.primary,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  loginButtonDisabled: {
    opacity: 0.6,
  },
  loginButtonIcon: {
    fontSize: 20,
    marginRight: spacing.sm,
  },
  loginButtonText: {
    color: colors.textWhite,
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
  },
  divider: {
    textAlign: 'center',
    color: colors.textSecondary,
    marginVertical: spacing.md,
  },
  ssoButton: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: colors.primary,
    marginBottom: spacing.md,
  },
  ssoIcon: {
    fontSize: 20,
    marginRight: spacing.sm,
  },
  ssoButtonText: {
    color: colors.primary,
    fontSize: fontSize.md,
    fontWeight: fontWeight.medium,
  },
  demoBanner: {
    backgroundColor: '#FEF3C7',
    borderRadius: borderRadius.md,
    padding: spacing.md,
    borderLeftWidth: 4,
    borderLeftColor: colors.warning,
  },
  demoTitle: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
    color: '#92400E',
    marginBottom: spacing.xs,
  },
  demoText: {
    fontSize: fontSize.xs,
    color: '#78350F',
    lineHeight: 16,
  },
});

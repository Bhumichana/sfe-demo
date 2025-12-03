import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ScrollView,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useAuthStore } from '../../stores/authStore';
import { colors, spacing, fontSize, fontWeight } from '../../theme/colors';

interface SettingItem {
  id: string;
  icon: string;
  title: string;
  subtitle: string;
  route?: string;
  onPress?: () => void;
}

export default function SettingsScreen() {
  const navigation = useNavigation();
  const { logout } = useAuthStore();

  const settingsItems: SettingItem[] = [
    {
      id: 'company',
      icon: '🏢',
      title: 'จัดการบริษัท',
      subtitle: 'จัดการเปลี่ยนพื้นที่, จังหวัด และการกำหนดพื้นที่',
      route: 'CompanyManagement',
    },
    {
      id: 'activity-types',
      icon: '📋',
      title: 'จัดการ Activity Types',
      subtitle: 'จัดการรายการกิจกรรมที่ใช้ในการเยี่ยมลูกค้า',
      route: 'ActivityTypes',
    },
    {
      id: 'profile',
      icon: '👤',
      title: 'โปรไฟล์',
      subtitle: 'จัดการข้อมูลส่วนตัว',
      route: 'Profile',
    },
    {
      id: 'notifications',
      icon: '🔔',
      title: 'การแจ้งเตือน',
      subtitle: 'ตั้งค่าการแจ้งเตือน',
      route: 'NotificationSettings',
    },
  ];

  const handleItemPress = (item: SettingItem) => {
    if (item.onPress) {
      item.onPress();
    } else if (item.route) {
      navigation.navigate(item.route as never);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>ตั้งค่า</Text>
        <Text style={styles.headerSubtitle}>Settings</Text>
      </View>

      <ScrollView style={styles.content}>
        {settingsItems.map((item) => (
          <TouchableOpacity
            key={item.id}
            style={styles.settingItem}
            onPress={() => handleItemPress(item)}
          >
            <View style={styles.iconContainer}>
              <Text style={styles.icon}>{item.icon}</Text>
            </View>
            <View style={styles.textContainer}>
              <Text style={styles.itemTitle}>{item.title}</Text>
              <Text style={styles.itemSubtitle}>{item.subtitle}</Text>
            </View>
            <Text style={styles.arrow}>›</Text>
          </TouchableOpacity>
        ))}

        <TouchableOpacity style={styles.logoutButton} onPress={logout}>
          <Text style={styles.logoutButtonText}>ออกจากระบบ</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    padding: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerTitle: {
    fontSize: fontSize.xxxl,
    fontWeight: fontWeight.bold,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  headerSubtitle: {
    fontSize: fontSize.md,
    color: colors.textSecondary,
  },
  content: {
    flex: 1,
    padding: spacing.lg,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: spacing.lg,
    marginBottom: spacing.md,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  icon: {
    fontSize: 24,
  },
  textContainer: {
    flex: 1,
  },
  itemTitle: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  itemSubtitle: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
  },
  arrow: {
    fontSize: 32,
    color: colors.textSecondary,
    marginLeft: spacing.md,
  },
  logoutButton: {
    backgroundColor: colors.error,
    borderRadius: 8,
    padding: spacing.md,
    alignItems: 'center',
    marginTop: spacing.xl,
    marginBottom: spacing.xl,
  },
  logoutButtonText: {
    color: colors.textWhite,
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
  },
});

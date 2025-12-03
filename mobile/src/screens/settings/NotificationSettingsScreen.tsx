import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Switch,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useAuthStore } from '../../stores/authStore';
import { api } from '../../services/api';
import { colors, spacing, fontSize, fontWeight } from '../../theme/colors';

interface NotificationPreferences {
  planApproved: boolean;
  planRejected: boolean;
  planPending: boolean;
  reminder: boolean;
  coaching: boolean;
  system: boolean;
  emailNotifications: boolean;
  pushNotifications: boolean;
  soundEnabled: boolean;
  vibrationEnabled: boolean;
}

interface SettingToggle {
  id: keyof NotificationPreferences;
  title: string;
  subtitle: string;
  category: string;
}

export default function NotificationSettingsScreen() {
  const navigation = useNavigation();
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [preferences, setPreferences] = useState<NotificationPreferences>({
    planApproved: true,
    planRejected: true,
    planPending: true,
    reminder: true,
    coaching: true,
    system: true,
    emailNotifications: false,
    pushNotifications: true,
    soundEnabled: true,
    vibrationEnabled: true,
  });

  const settingToggles: SettingToggle[] = [
    // Notification Types
    {
      id: 'planApproved',
      title: 'แผนได้รับการอนุมัติ',
      subtitle: 'แจ้งเตือนเมื่อแผนการเยี่ยมลูกค้าได้รับการอนุมัติ',
      category: 'ประเภทการแจ้งเตือน',
    },
    {
      id: 'planRejected',
      title: 'แผนถูกปฏิเสธ',
      subtitle: 'แจ้งเตือนเมื่อแผนการเยี่ยมลูกค้าถูกปฏิเสธ',
      category: 'ประเภทการแจ้งเตือน',
    },
    {
      id: 'planPending',
      title: 'แผนรอการอนุมัติ',
      subtitle: 'แจ้งเตือนเมื่อมีแผนรอการอนุมัติ (สำหรับผู้จัดการ)',
      category: 'ประเภทการแจ้งเตือน',
    },
    {
      id: 'reminder',
      title: 'การเตือนความจำ',
      subtitle: 'แจ้งเตือนสำหรับนัดหมายและกิจกรรมที่กำลังจะถึง',
      category: 'ประเภทการแจ้งเตือน',
    },
    {
      id: 'coaching',
      title: 'คำแนะนำจากผู้จัดการ',
      subtitle: 'แจ้งเตือนเมื่อได้รับคำแนะนำหรือ coaching',
      category: 'ประเภทการแจ้งเตือน',
    },
    {
      id: 'system',
      title: 'การแจ้งเตือนระบบ',
      subtitle: 'ข่าวสารและการอัพเดทจากระบบ',
      category: 'ประเภทการแจ้งเตือน',
    },
    // Delivery Methods
    {
      id: 'pushNotifications',
      title: 'Push Notifications',
      subtitle: 'แจ้งเตือนผ่านแอพพลิเคชัน',
      category: 'วิธีการแจ้งเตือน',
    },
    {
      id: 'emailNotifications',
      title: 'อีเมล',
      subtitle: 'ส่งการแจ้งเตือนผ่านอีเมล',
      category: 'วิธีการแจ้งเตือน',
    },
    // Interaction
    {
      id: 'soundEnabled',
      title: 'เสียง',
      subtitle: 'เปิดเสียงเมื่อมีการแจ้งเตือน',
      category: 'การโต้ตอบ',
    },
    {
      id: 'vibrationEnabled',
      title: 'การสั่น',
      subtitle: 'เปิดการสั่นเมื่อมีการแจ้งเตือน',
      category: 'การโต้ตอบ',
    },
  ];

  useEffect(() => {
    fetchPreferences();
  }, []);

  const fetchPreferences = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/notifications/preferences/${user?.id}`);
      setPreferences(response.data);
    } catch (error) {
      console.error('Error fetching preferences:', error);
      Alert.alert('ข้อผิดพลาด', 'ไม่สามารถโหลดการตั้งค่าได้');
    } finally {
      setLoading(false);
    }
  };

  const togglePreference = async (key: keyof NotificationPreferences) => {
    const newValue = !preferences[key];

    // Update local state immediately for better UX
    setPreferences(prev => ({ ...prev, [key]: newValue }));

    try {
      setSaving(true);
      await api.put(`/notifications/preferences/${user?.id}`, {
        [key]: newValue,
      });
    } catch (error) {
      console.error('Error updating preference:', error);
      // Revert on error
      setPreferences(prev => ({ ...prev, [key]: !newValue }));
      Alert.alert('ข้อผิดพลาด', 'ไม่สามารถบันทึกการตั้งค่าได้');
    } finally {
      setSaving(false);
    }
  };

  const resetToDefaults = () => {
    Alert.alert(
      'รีเซ็ตการตั้งค่า',
      'คุณต้องการรีเซ็ตการตั้งค่าการแจ้งเตือนเป็นค่าเริ่มต้นหรือไม่?',
      [
        { text: 'ยกเลิก', style: 'cancel' },
        {
          text: 'รีเซ็ต',
          style: 'destructive',
          onPress: async () => {
            try {
              setSaving(true);
              const response = await api.post(
                `/notifications/preferences/${user?.id}/reset`
              );
              setPreferences(response.data);
              Alert.alert('สำเร็จ', 'รีเซ็ตการตั้งค่าเรียบร้อยแล้ว');
            } catch (error) {
              console.error('Error resetting preferences:', error);
              Alert.alert('ข้อผิดพลาด', 'ไม่สามารถรีเซ็ตการตั้งค่าได้');
            } finally {
              setSaving(false);
            }
          },
        },
      ]
    );
  };

  const renderCategory = (categoryName: string) => {
    const categoryItems = settingToggles.filter(
      item => item.category === categoryName
    );

    return (
      <View key={categoryName} style={styles.category}>
        <Text style={styles.categoryTitle}>{categoryName}</Text>
        {categoryItems.map(item => (
          <View key={item.id} style={styles.settingItem}>
            <View style={styles.settingTextContainer}>
              <Text style={styles.settingTitle}>{item.title}</Text>
              <Text style={styles.settingSubtitle}>{item.subtitle}</Text>
            </View>
            <Switch
              value={preferences[item.id]}
              onValueChange={() => togglePreference(item.id)}
              trackColor={{ false: colors.border, true: colors.primaryLight }}
              thumbColor={preferences[item.id] ? colors.primary : colors.textLight}
              disabled={saving}
            />
          </View>
        ))}
      </View>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>กำลังโหลด...</Text>
        </View>
      </SafeAreaView>
    );
  }

  const categories = [
    'ประเภทการแจ้งเตือน',
    'วิธีการแจ้งเตือน',
    'การโต้ตอบ',
  ];

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backButton}>‹ กลับ</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>การแจ้งเตือน</Text>
        <Text style={styles.headerSubtitle}>ตั้งค่าการแจ้งเตือน</Text>
      </View>

      <ScrollView style={styles.content}>
        {categories.map(category => renderCategory(category))}

        <TouchableOpacity
          style={styles.resetButton}
          onPress={resetToDefaults}
          disabled={saving}
        >
          <Text style={styles.resetButtonText}>
            รีเซ็ตเป็นค่าเริ่มต้น
          </Text>
        </TouchableOpacity>

        {saving && (
          <View style={styles.savingIndicator}>
            <ActivityIndicator size="small" color={colors.primary} />
            <Text style={styles.savingText}>กำลังบันทึก...</Text>
          </View>
        )}
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
  backButton: {
    fontSize: fontSize.xxl,
    color: colors.primary,
    marginBottom: spacing.sm,
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
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: spacing.md,
    fontSize: fontSize.md,
    color: colors.textSecondary,
  },
  category: {
    marginTop: spacing.lg,
  },
  categoryTitle: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
    color: colors.textSecondary,
    textTransform: 'uppercase',
    marginBottom: spacing.md,
    marginHorizontal: spacing.lg,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  settingTextContainer: {
    flex: 1,
    marginRight: spacing.md,
  },
  settingTitle: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.medium,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  settingSubtitle: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    lineHeight: 20,
  },
  resetButton: {
    backgroundColor: colors.surface,
    borderRadius: 8,
    padding: spacing.md,
    alignItems: 'center',
    margin: spacing.lg,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  resetButtonText: {
    color: colors.primary,
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
  },
  savingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.md,
  },
  savingText: {
    marginLeft: spacing.sm,
    fontSize: fontSize.sm,
    color: colors.textSecondary,
  },
});

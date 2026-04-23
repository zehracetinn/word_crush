import { useEffect } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { useAppStore } from '../src/store/app-store';
import { COLORS } from '../src/theme/colors';

export default function IndexScreen() {
  const { init, isReady, profile } = useAppStore();

  useEffect(() => {
    init();
  }, [init]);

  useEffect(() => {
    if (!isReady) return;

    if (profile) {
      router.replace('/home');
    } else {
      router.replace('/username');
    }
  }, [isReady, profile]);

  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color={COLORS.primary} />
      <Text style={styles.title}>Word Crush hazırlanıyor...</Text>
      <Text style={styles.subtitle}>İlk açılış kontrol ediliyor</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
    padding: 24,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.text,
  },
  subtitle: {
    fontSize: 14,
    color: COLORS.mutedText,
  },
});
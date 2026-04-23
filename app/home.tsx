import { Pressable, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { useAppStore } from '../src/store/app-store';
import { COLORS } from '../src/theme/colors';

export default function HomeScreen() {
  const { profile } = useAppStore();

  return (
    <View style={styles.container}>
      <View style={styles.topRow}>
        <Pressable
          style={styles.userChip}
          onPress={() => router.push('/username?mode=edit')}
        >
          <Text style={styles.userChipLabel}>Oyuncu</Text>
          <Text style={styles.userChipValue}>{profile?.username ?? '-'}</Text>
        </Pressable>

        <View style={styles.goldChip}>
          <Text style={styles.goldLabel}>Altın</Text>
          <Text style={styles.goldValue}>{profile?.gold ?? 0}</Text>
        </View>
      </View>

      <View style={styles.center}>
        <Text style={styles.title}>WORD CRUSH</Text>
        <Text style={styles.subtitle}>Kelime oluştur, puan topla, strateji kur.</Text>

        <Pressable style={styles.primaryButton} onPress={() => router.push('/game-setup')}>
          <Text style={styles.primaryButtonText}>Yeni Oyun</Text>
        </Pressable>

        <Pressable style={styles.secondaryButton} onPress={() => router.push('/scoreboard')}>
          <Text style={styles.secondaryButtonText}>Skor Tablosu</Text>
        </Pressable>

        <Pressable style={styles.secondaryButton} onPress={() => router.push('/market')}>
          <Text style={styles.secondaryButtonText}>Market</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    paddingHorizontal: 20,
    paddingTop: 70,
    paddingBottom: 30,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  userChip: {
    flex: 1,
    backgroundColor: COLORS.card,
    borderRadius: 18,
    padding: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  userChipLabel: {
    fontSize: 12,
    color: COLORS.mutedText,
    marginBottom: 4,
  },
  userChipValue: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text,
  },
  goldChip: {
    minWidth: 110,
    backgroundColor: '#FFF7E6',
    borderRadius: 18,
    padding: 14,
    borderWidth: 1,
    borderColor: '#FCD34D',
    alignItems: 'center',
    justifyContent: 'center',
  },
  goldLabel: {
    fontSize: 12,
    color: COLORS.warning,
  },
  goldValue: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.warning,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    gap: 16,
  },
  title: {
    fontSize: 34,
    fontWeight: '900',
    color: COLORS.text,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 15,
    color: COLORS.mutedText,
    textAlign: 'center',
    marginBottom: 18,
  },
  primaryButton: {
    height: 58,
    borderRadius: 18,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  primaryButtonText: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '800',
  },
  secondaryButton: {
    height: 58,
    borderRadius: 18,
    backgroundColor: COLORS.card,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  secondaryButtonText: {
    color: COLORS.text,
    fontSize: 16,
    fontWeight: '700',
  },
});
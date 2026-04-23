import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { useAppStore } from '../src/store/app-store';
import { COLORS } from '../src/theme/colors';

const jokers = [
  { name: 'Balık', cost: 100, desc: 'Gridde rastgele harfleri yok eder.' },
  { name: 'Tekerlek', cost: 200, desc: 'Seçilen harfin satır ve sütununu temizler.' },
  { name: 'Lolipop Kırıcı', cost: 75, desc: 'Seçilen tek bir harfi yok eder.' },
  { name: 'Serbest Değiştirme', cost: 125, desc: 'Komşu iki harfin yerini değiştirir.' },
  { name: 'Harf Karıştırma', cost: 300, desc: 'Tüm grid harflerini karıştırır.' },
  { name: 'Parti Güçlendiricisi', cost: 400, desc: 'Tüm gridi sıfırlar ve yeniden doldurur.' },
];

export default function MarketScreen() {
  const { profile } = useAppStore();

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Pressable style={styles.backButton} onPress={() => router.back()}>
        <Text style={styles.backButtonText}>← Geri</Text>
      </Pressable>

      <Text style={styles.title}>Market</Text>
      <Text style={styles.subtitle}>Joker sistemi bir sonraki sprintte aktif olacak.</Text>

      <View style={styles.goldCard}>
        <Text style={styles.goldLabel}>Mevcut Altın</Text>
        <Text style={styles.goldValue}>{profile?.gold ?? 0}</Text>
      </View>

      {jokers.map((joker) => (
        <View key={joker.name} style={styles.card}>
          <Text style={styles.cardTitle}>{joker.name}</Text>
          <Text style={styles.cardDesc}>{joker.desc}</Text>
          <Text style={styles.cardCost}>Maliyet: {joker.cost} altın</Text>
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 70,
    paddingBottom: 30,
  },
  backButton: {
    alignSelf: 'flex-start',
    paddingVertical: 10,
    marginBottom: 8,
  },
  backButtonText: {
    color: COLORS.primary,
    fontSize: 16,
    fontWeight: '700',
  },
  title: {
    fontSize: 30,
    fontWeight: '900',
    color: COLORS.text,
  },
  subtitle: {
    marginTop: 8,
    marginBottom: 20,
    fontSize: 15,
    color: COLORS.mutedText,
  },
  goldCard: {
    backgroundColor: '#FFF7E6',
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    borderColor: '#FCD34D',
    marginBottom: 16,
  },
  goldLabel: {
    fontSize: 13,
    color: COLORS.warning,
  },
  goldValue: {
    fontSize: 28,
    fontWeight: '900',
    color: COLORS.warning,
    marginTop: 4,
  },
  card: {
    backgroundColor: COLORS.card,
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 12,
    gap: 6,
  },
  cardTitle: {
    fontSize: 19,
    fontWeight: '800',
    color: COLORS.text,
  },
  cardDesc: {
    fontSize: 14,
    color: COLORS.mutedText,
    lineHeight: 20,
  },
  cardCost: {
    marginTop: 4,
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.primaryDark,
  },
});
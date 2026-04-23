import { Pressable, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { COLORS } from '../src/theme/colors';

export default function ScoreboardScreen() {
  return (
    <View style={styles.container}>
      <Pressable style={styles.backButton} onPress={() => router.back()}>
        <Text style={styles.backButtonText}>← Geri</Text>
      </Pressable>

      <Text style={styles.title}>Skor Tablosu</Text>
      <Text style={styles.subtitle}>
        Bu sprintte sadece iskeleti kuruyoruz. Sonraki sprintte oyun geçmişi eklenecek.
      </Text>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Genel Özet</Text>
        <Text style={styles.item}>Toplam Oyun: 0</Text>
        <Text style={styles.item}>En Yüksek Puan: 0</Text>
        <Text style={styles.item}>Ortalama Puan: 0</Text>
        <Text style={styles.item}>Toplam Kelime: 0</Text>
        <Text style={styles.item}>En Uzun Kelime: -</Text>
        <Text style={styles.item}>Toplam Süre: 0 dk</Text>
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
  card: {
    backgroundColor: COLORS.card,
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    borderColor: COLORS.border,
    gap: 10,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: COLORS.text,
    marginBottom: 4,
  },
  item: {
    fontSize: 15,
    color: COLORS.text,
  },
});
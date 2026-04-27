import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { JOKER_DEFINITIONS } from '../src/constants/joker-definitions';
import { useAppStore } from '../src/store/app-store';
import { COLORS } from '../src/theme/colors';

export default function MarketScreen() {
  const { profile, buyJoker } = useAppStore();

  const handleBuy = async (jokerId: (typeof JOKER_DEFINITIONS)[number]['id']) => {
    try {
      await buyJoker(jokerId);
      Alert.alert('Başarılı', 'Joker satın alındı.');
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Satın alma sırasında hata oluştu.';
      Alert.alert('Satın alma başarısız', message);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Pressable style={styles.backButton} onPress={() => router.back()}>
        <Text style={styles.backButtonText}>← Geri</Text>
      </Pressable>

      <Text style={styles.title}>Market</Text>
      <Text style={styles.subtitle}>Buradan joker satın alabilirsin.</Text>

      <View style={styles.goldCard}>
        <Text style={styles.goldLabel}>Mevcut Altın</Text>
        <Text style={styles.goldValue}>{profile?.gold ?? 0}</Text>
      </View>

      {JOKER_DEFINITIONS.map((joker) => {
        const owned = profile?.ownedJokers?.[joker.id] ?? 0;
        const canBuy = (profile?.gold ?? 0) >= joker.cost;

        return (
          <View key={joker.id} style={styles.card}>
            <View style={styles.cardTop}>
              <Text style={styles.cardEmoji}>{joker.shortLabel}</Text>
              <View style={styles.cardTopText}>
                <Text style={styles.cardTitle}>{joker.name}</Text>
                <Text style={styles.cardCost}>Maliyet: {joker.cost} altın</Text>
              </View>
            </View>

            <Text style={styles.cardDesc}>{joker.description}</Text>
            <Text style={styles.ownedText}>Sahip olunan: {owned}</Text>

            <Pressable
              style={[styles.buyButton, !canBuy && styles.disabledButton]}
              disabled={!canBuy}
              onPress={() => void handleBuy(joker.id)}
            >
              <Text style={styles.buyButtonText}>
                {canBuy ? 'Satın Al' : 'Altın Yetersiz'}
              </Text>
            </Pressable>
          </View>
        );
      })}
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
    gap: 8,
  },
  cardTop: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center',
  },
  cardEmoji: {
    fontSize: 28,
  },
  cardTopText: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 19,
    fontWeight: '800',
    color: COLORS.text,
  },
  cardCost: {
    fontSize: 14,
    color: COLORS.primaryDark,
    fontWeight: '700',
    marginTop: 2,
  },
  cardDesc: {
    fontSize: 14,
    color: COLORS.mutedText,
    lineHeight: 20,
  },
  ownedText: {
    fontSize: 13,
    color: COLORS.text,
    fontWeight: '700',
  },
  buyButton: {
    marginTop: 4,
    height: 48,
    borderRadius: 14,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  disabledButton: {
    opacity: 0.5,
  },
  buyButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '800',
  },
});
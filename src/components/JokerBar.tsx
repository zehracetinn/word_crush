import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { JokerId, JOKER_MAP, JOKER_DEFINITIONS } from '../constants/joker-definitions';
import { COLORS } from '../theme/colors';

interface JokerBarProps {
  ownedJokers: Record<string, number>;
  selectedJokerId?: JokerId | null;
  onSelect?: (jokerId: JokerId) => void;
}

export default function JokerBar({
  ownedJokers,
  selectedJokerId,
  onSelect,
}: JokerBarProps) {
  return (
    <View style={styles.wrapper}>
      <Text style={styles.title}>Jokerler</Text>

      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View style={styles.row}>
          {JOKER_DEFINITIONS.map((joker) => {
            const count = ownedJokers?.[joker.id] ?? 0;
            const selected = selectedJokerId === joker.id;

            return (
              <Pressable
                key={joker.id}
                style={[
                  styles.card,
                  selected && styles.selectedCard,
                  count <= 0 && styles.disabledCard,
                ]}
                onPress={() => {
                  if (count > 0) {
                    onSelect?.(joker.id);
                  }
                }}
              >
                <Text style={styles.emoji}>{JOKER_MAP[joker.id].shortLabel}</Text>
                <Text style={styles.name}>{joker.name}</Text>
                <Text style={styles.count}>Adet: {count}</Text>
              </Pressable>
            );
          })}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    marginTop: 16,
    backgroundColor: COLORS.card,
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  title: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.text,
    marginBottom: 12,
  },
  row: {
    flexDirection: 'row',
    gap: 10,
  },
  card: {
    width: 110,
    minHeight: 100,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: '#FFF',
    padding: 10,
    justifyContent: 'space-between',
  },
  selectedCard: {
    borderColor: COLORS.primary,
    backgroundColor: '#DBEAFE',
  },
  disabledCard: {
    opacity: 0.45,
  },
  emoji: {
    fontSize: 24,
  },
  name: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.text,
  },
  count: {
    fontSize: 12,
    color: COLORS.mutedText,
    fontWeight: '600',
  },
});
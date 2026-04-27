export type JokerId =
  | 'fish'
  | 'wheel'
  | 'lollipop'
  | 'swap'
  | 'shuffle'
  | 'party';

export interface JokerDefinition {
  id: JokerId;
  name: string;
  cost: number;
  description: string;
  shortLabel: string;
}

export const JOKER_DEFINITIONS: JokerDefinition[] = [
  {
    id: 'fish',
    name: 'Balık',
    cost: 100,
    description: 'Gridde rastgele harfleri yok eder.',
    shortLabel: '🐟',
  },
  {
    id: 'wheel',
    name: 'Tekerlek',
    cost: 200,
    description: 'Seçilen harfin satır ve sütununu temizler.',
    shortLabel: '🎡',
  },
  {
    id: 'lollipop',
    name: 'Lolipop Kırıcı',
    cost: 75,
    description: 'Seçilen tek bir harfi yok eder.',
    shortLabel: '🍭',
  },
  {
    id: 'swap',
    name: 'Serbest Değiştirme',
    cost: 125,
    description: 'Komşu iki harfin yerini değiştirir.',
    shortLabel: '🔁',
  },
  {
    id: 'shuffle',
    name: 'Harf Karıştırma',
    cost: 300,
    description: 'Griddeki harfleri karıştırır.',
    shortLabel: '🔀',
  },
  {
    id: 'party',
    name: 'Parti Güçlendiricisi',
    cost: 400,
    description: 'Tüm gridi sıfırlar ve yeniden doldurur.',
    shortLabel: '🎉',
  },
];

export const JOKER_MAP: Record<JokerId, JokerDefinition> = Object.fromEntries(
  JOKER_DEFINITIONS.map((joker) => [joker.id, joker])
) as Record<JokerId, JokerDefinition>;
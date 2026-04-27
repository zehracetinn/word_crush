import { Asset } from 'expo-asset';
import { Platform } from 'react-native';
import * as FileSystem from 'expo-file-system/legacy';

class DictionaryService {
  private wordSet = new Set<string>();
  private prefixSet = new Set<string>();
  private initialized = false;
  private loadingPromise: Promise<void> | null = null;

  private async readDictionaryText(): Promise<string> {
    const asset = Asset.fromModule(
      require('../../assets/dictionaries/tr_words.txt')
    );

    await asset.downloadAsync();

    const uri = asset.localUri || asset.uri;

    if (!uri) {
      throw new Error('Sözlük dosyası URI üretilemedi.');
    }

    if (Platform.OS === 'web') {
      const response = await fetch(uri);
      if (!response.ok) {
        throw new Error('Web üzerinde sözlük dosyası okunamadı.');
      }
      return await response.text();
    }

    return await FileSystem.readAsStringAsync(uri);
  }

  async init(): Promise<void> {
    if (this.initialized) return;
    if (this.loadingPromise) return this.loadingPromise;

    this.loadingPromise = (async () => {
      const raw = await this.readDictionaryText();
      const lines = raw.split(/\r?\n/);

      for (const line of lines) {
        const word = this.normalizeWord(line);

        if (!word || word.length < 3) continue;

        this.wordSet.add(word);

        for (let i = 1; i <= word.length; i++) {
          this.prefixSet.add(word.slice(0, i));
        }
      }

      this.initialized = true;
      console.log('Sözlük yüklendi. Kelime sayısı:', this.wordSet.size);
    })();

    return this.loadingPromise;
  }

  normalizeWord(word: string): string {
    return word.trim().toLocaleUpperCase('tr-TR');
  }

  isReady(): boolean {
    return this.initialized;
  }

  isValidWord(word: string): boolean {
    const normalized = this.normalizeWord(word);
    if (normalized.length < 3) return false;
    return this.wordSet.has(normalized);
  }

  hasPrefix(prefix: string): boolean {
    const normalized = this.normalizeWord(prefix);
    return this.prefixSet.has(normalized);
  }

  getWordCount(): number {
    return this.wordSet.size;
  }

  getWordsByLength(minLength: number, maxLength: number = minLength): string[] {
    return Array.from(this.wordSet).filter(
      (word) => word.length >= minLength && word.length <= maxLength
    );
  }
}

export const dictionaryService = new DictionaryService();
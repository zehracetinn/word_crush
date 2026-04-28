import { useEffect, useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useAppStore } from '../src/store/app-store';
import { COLORS } from '../src/theme/colors';

export default function UsernameScreen() {
  const { mode } = useLocalSearchParams<{ mode?: string }>();
  const isEditMode = mode === 'edit';

  const { profile, setUsername } = useAppStore();
  const [username, setUsernameValue] = useState('');

  useEffect(() => {
    if (profile?.username) {
      setUsernameValue(profile.username);
    }
  }, [profile]);

  const handleSave = async () => {
    const trimmed = username.trim();

    if (trimmed.length < 2) {
      Alert.alert('Geçersiz kullanıcı adı', 'Kullanıcı adı en az 2 karakter olmalı.');
      return;
    }

    try {
      await setUsername(trimmed);
      router.replace('/home');
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Profil açılırken bir hata oluştu.';
      Alert.alert('Profil açılamadı', message);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={styles.card}>
        <Text style={styles.title}>{isEditMode ? 'Oyuncu Değiştir' : 'Hoş Geldin'}</Text>

        <Text style={styles.subtitle}>
          {isEditMode
            ? 'Var olan bir kullanıcı adı girersen o profile geçilir. Yeni bir ad girersen yeni profil oluşturulur.'
            : 'Kullanıcı adını gir. Bu ad daha önce kullanıldıysa mevcut profile geçilir, yoksa yeni profil oluşturulur.'}
        </Text>

        <TextInput
          value={username}
          onChangeText={setUsernameValue}
          placeholder="Kullanıcı adın"
          placeholderTextColor={COLORS.mutedText}
          style={styles.input}
          autoCapitalize="none"
          autoCorrect={false}
          maxLength={20}
        />

        <Pressable style={styles.button} onPress={() => void handleSave()}>
          <Text style={styles.buttonText}>
            {isEditMode ? 'Profili Aç' : 'Devam Et'}
          </Text>
        </Pressable>

        {isEditMode && (
          <Pressable style={styles.secondaryButton} onPress={() => router.back()}>
            <Text style={styles.secondaryButtonText}>İptal</Text>
          </Pressable>
        )}
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    justifyContent: 'center',
    padding: 24,
  },
  card: {
    backgroundColor: COLORS.card,
    borderRadius: 24,
    padding: 24,
    borderWidth: 1,
    borderColor: COLORS.border,
    gap: 14,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: COLORS.text,
  },
  subtitle: {
    fontSize: 15,
    color: COLORS.mutedText,
    lineHeight: 22,
  },
  input: {
    height: 56,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 16,
    paddingHorizontal: 16,
    fontSize: 16,
    color: COLORS.text,
    backgroundColor: '#FAFAFA',
  },
  button: {
    height: 54,
    borderRadius: 16,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 6,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  secondaryButton: {
    height: 50,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  secondaryButtonText: {
    color: COLORS.text,
    fontSize: 15,
    fontWeight: '600',
  },
});

import { useMutation } from '@tanstack/react-query';
import { router } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { errorMessage } from '@/api/client';
import { api } from '@/api/endpoints';
import { Banner } from '@/components/Banner';
import { Button } from '@/components/Button';
import { Screen } from '@/components/Screen';
import { TextField } from '@/components/TextField';
import { DEFAULT_API_URL, getApiUrl, normaliseApiUrl, saveApiUrl } from '@/config/api-url';
import { spacing, typography } from '@/theme';

/** Lets one APK talk to an emulator host (10.0.2.2) or a laptop on the same Wi-Fi. */
export default function ServerSettingsScreen() {
  const [url, setUrl] = useState(getApiUrl());
  const [result, setResult] = useState<{ ok: boolean; message: string } | null>(null);

  const test = useMutation({
    mutationFn: (candidate: string) => api.health(normaliseApiUrl(candidate)),
    onSuccess: () => setResult({ ok: true, message: 'Connected. The server is reachable.' }),
    onError: (error) => setResult({ ok: false, message: errorMessage(error) }),
  });

  const close = () => (router.canGoBack() ? router.back() : router.replace('/'));

  const onSave = async () => {
    await saveApiUrl(url);
    close();
  };

  return (
    <Screen>
      <Text style={styles.title}>Server settings</Text>
      <Text style={styles.subtitle}>
        Point the app at the PadosiPro API. On the Android emulator the default {DEFAULT_API_URL} reaches your computer. On a
        real phone, use your computer's Wi-Fi address, e.g. http://192.168.1.20:4000.
      </Text>

      <TextField
        label="API address"
        value={url}
        onChangeText={(value) => {
          setUrl(value);
          setResult(null);
        }}
        autoCapitalize="none"
        autoCorrect={false}
        keyboardType="url"
        placeholder="http://10.0.2.2:4000"
      />

      {result ? <Banner tone={result.ok ? 'success' : 'error'} message={result.message} /> : null}

      <View style={styles.actions}>
        <Button title="Test connection" variant="secondary" icon="activity" onPress={() => test.mutate(url)} loading={test.isPending} />
        <Button title="Save" onPress={() => void onSave()} />
        <Button title="Reset to default" variant="ghost" onPress={() => setUrl(DEFAULT_API_URL)} />
        <Button title="Cancel" variant="ghost" onPress={close} />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: { ...typography.title, marginTop: spacing.md, marginBottom: spacing.sm },
  subtitle: { ...typography.bodyMuted, marginBottom: spacing.xl },
  actions: { gap: spacing.sm },
});

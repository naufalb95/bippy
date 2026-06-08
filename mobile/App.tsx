import { useEffect } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Scanner } from './src/Scanner';
import { clearCache } from './src/videoCache';

export default function App() {
  // Per-session video cache: wipe any on-disk leftovers from previous
  // launches so the cache is effectively memory-only for the user.
  useEffect(() => {
    clearCache().catch(() => {});
  }, []);

  return (
    <SafeAreaProvider>
      <Scanner />
    </SafeAreaProvider>
  );
}

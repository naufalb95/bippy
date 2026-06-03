import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Scanner } from './src/Scanner';

export default function App() {
  return (
    <SafeAreaProvider>
      <Scanner />
    </SafeAreaProvider>
  );
}

import { StatusBar } from 'expo-status-bar';
import HomeScreen from './src/screens/HomeScreen';

export default function App() {
  return (
    <>
      {/* 상태바(시간, 배터리) 글자색을 하얗게 만들어줘 */}
      <StatusBar style="light" />
      <HomeScreen />
    </>
  );
}
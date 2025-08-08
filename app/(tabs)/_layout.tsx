import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, componentStyles } from '../../styles/global';

export default function TabLayout() {

  return (
    <Tabs
      screenOptions={{
        tabBarStyle: { display: 'none' }, // Hide the default tab bar
        headerStyle: {
          backgroundColor: colors.background,
        },
        headerTintColor: colors.text.primary,
        headerTitleStyle: {
          ...componentStyles.textLg,
          ...componentStyles.fontSemibold,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
        }}
      />
    </Tabs>
  );
}

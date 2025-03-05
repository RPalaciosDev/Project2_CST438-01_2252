// requires auth

import { StyleSheet, Text, View } from 'react-native';

import { useAuthStore } from '../../services/auth';

export default function Index() {
  const { logout } = useAuthStore();
  return (
    <View style={styles.container}>
      <Text
        onPress={() => {
          // The `app/(app)/_layout.tsx` will redirect to the sign-in screen.
          logout();
        }}>
        Sign Out
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

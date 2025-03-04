import { useEffect, useState } from 'react';
import { Text, View, ActivityIndicator, StyleSheet, Button } from 'react-native';

export default function Index() {
  const [error, setError] = useState<string | null>(null);


  return (
    <View style={styles.container}>
      <Text>Index</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFF5F5',
    padding: 20,
  },
  errorText: {
    marginTop: 20,
    color: '#FF4B6E',
    textAlign: 'center',
  }
});
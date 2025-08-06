import React from 'react';
import { StyleSheet, Text, View, Image, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface TierListProps {
  title: string;
  author: string;
  likes: number;
  comments: number;
  imageUri: string;
  onPress?: () => void;
}

const TierList: React.FC<TierListProps> = ({
  title,
  author,
  likes,
  comments,
  imageUri,
  onPress,
}) => {
  return (
    <TouchableOpacity style={styles.container} onPress={onPress}>
      <Image source={{ uri: imageUri }} style={styles.image} resizeMode="cover" />
      <View style={styles.content}>
        <Text style={styles.title} numberOfLines={1}>
          {title}
        </Text>
        <Text style={styles.author}>by {author}</Text>
        <View style={styles.stats}>
          <View style={styles.stat}>
            <Ionicons name="heart" size={16} color="#FF4B6E" />
            <Text style={styles.statText}>{likes}</Text>
          </View>
          <View style={styles.stat}>
            <Ionicons name="chatbubble" size={16} color="#666" />
            <Text style={styles.statText}>{comments}</Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    flexDirection: 'row',
    overflow: 'hidden',
    height: 100,
  },
  image: {
    width: 100,
    height: '100%',
    backgroundColor: '#f0f0f0',
  },
  content: {
    flex: 1,
    padding: 12,
    justifyContent: 'space-between',
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  author: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  stats: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  stat: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
  },
  statText: {
    marginLeft: 4,
    fontSize: 14,
    color: '#666',
  },
});

export default TierList;

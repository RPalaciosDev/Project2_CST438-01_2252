import React, { useEffect, useState } from 'react';
import { View, Text, Image, ActivityIndicator, FlatList } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import DraggableFlatList from 'react-native-draggable-flatlist';
import { useStyle } from '../context/StyleContext';
import stylesMap from '../../styles/index';

const API_BASE_URL = "http://your-backend-url/api/images"; 

interface Tier {
  label: string;
  color: string;
}

const initialItems = [
    { id: '1', name: 'Item 1', tier: 'S' },
    { id: '2', name: 'Item 2', tier: 'A' },
    { id: '3', name: 'Item 3', tier: 'B' },
    { id: '4', name: 'Item 4', tier: 'C' },
    { id: '5', name: 'Item 5', tier: 'D' },
];

export default function TierList() {
    const { selectedStyle } = useStyle();
    const [theme, setTheme] = useState(stylesMap[selectedStyle] || stylesMap["default"]);
    const [images, setImages] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        console.log("Applying Style:", selectedStyle);
        setTheme(stylesMap[selectedStyle] || stylesMap["default"]);
    }, [selectedStyle]);

    useEffect(() => {
        fetchImages("Anime/OnePiece/StrawHatPirates");
    }, []);

    const fetchImages = async (folder: string) => {
        try {
            const response = await fetch(`${API_BASE_URL}?folder=${encodeURIComponent(folder)}`);
            const data = await response.json();
            setImages(data);
        } catch (error) {
            console.error("Error fetching images:", error);
        } finally {
            setLoading(false);
        }
    };

    const { styles, TIERS } = theme;

    return (
        <GestureHandlerRootView style={{ flex: 1 }}> 
            <View style={styles.container}>
                {TIERS.map(({ label, color }: Tier) => (
                    <View key={label} style={styles.tierRow}> 
                        <View style={[styles.tierLabelContainer, { backgroundColor: color }]}> 
                            <Text style={styles.tierLabel}>{label}</Text>
                        </View>
                        <View style={styles.tierContent}>
                            <DraggableFlatList
                                data={initialItems.filter(item => item.tier === label)}
                                renderItem={({ item }) => (
                                    <View style={styles.item}>
                                        <Text style={styles.itemText}>{item.name}</Text>
                                    </View>
                                )}
                                keyExtractor={(item) => item.id}
                                showsVerticalScrollIndicator={false}
                            />
                        </View>
                    </View>
                ))}

                <View style={{ marginTop: 20 }}>
                    <Text style={styles.tierLabel}>Images from Straw Hat Pirates</Text>
                    {loading ? (
                        <ActivityIndicator size="large" color="#0000ff" />
                    ) : (
                        <FlatList
                            data={images}
                            keyExtractor={(item) => item.id}
                            numColumns={3}
                            renderItem={({ item }) => (
                                <Image source={{ uri: item.s3Url }} style={{ width: 100, height: 100, margin: 5 }} />
                            )}
                        />
                    )}
                </View>
            </View>
        </GestureHandlerRootView> 
    );
}


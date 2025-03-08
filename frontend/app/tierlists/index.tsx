import React, { useEffect, useState } from 'react';
import { View, Text } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import DraggableFlatList from 'react-native-draggable-flatlist';
import { useStyle } from '../context/StyleContext';
import stylesMap from '../../styles/index'; 

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

    // local state to force re render when selected style updates
    const [theme, setTheme] = useState(stylesMap[selectedStyle] || stylesMap["default"]);

    useEffect(() => {
        console.log("Applying Style:", selectedStyle);
        setTheme(stylesMap[selectedStyle] || stylesMap["default"]); // update theme when selectedStyle changes
    }, [selectedStyle]);

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
            </View>
        </GestureHandlerRootView> 
    );
}

import React, { useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler'; 
import DraggableFlatList, { RenderItemParams } from 'react-native-draggable-flatlist';

const TIERS = ['S', 'A', 'B', 'C', 'D', 'E', 'F'];

const initialItems = [
    { id: '1', name: 'Item 1', tier: 'S'},
    { id: '2', name: 'Item 2', tier: 'A'},
    { id: '3', name: 'Item 3', tier: 'B'},
    { id: '4', name: 'Item 4', tier: 'C'},
    { id: '5', name: 'Item 5', tier: 'D'},
];

export default function TierList() {
    const [items, setItems] = useState(initialItems);

    const renderItem = ({ item, drag, isActive }: RenderItemParams<typeof initialItems[0]>) => {
        return (
            <View style={[styles.item, { backgroundColor: isActive ? '#ccc' : '#444' }]}>
                <Text style={styles.itemText} onLongPress={drag}>{item.name}</Text>
            </View>
        );
    };

    return (
        <GestureHandlerRootView style={{ flex: 1 }}> 
            <View style={styles.container}>
                {TIERS.map((tier) => (
                    <View key={tier} style={styles.tierRow}>
                        <Text style={styles.tierLabel}>{tier}</Text>
                        <DraggableFlatList
                            data={items.filter(item => item.tier === tier)}
                            renderItem={renderItem}
                            keyExtractor={(item) => item.id}
                            onDragEnd={({ data }) => setItems(data)}
                            showsVerticalScrollIndicator={false}
                        />
                    </View>
                ))}
            </View>
        </GestureHandlerRootView> 
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#000',
        padding: 10,
    },
    tierRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 10,
    },
    tierLabel: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#fff',
        width: 40,
        textAlign: 'center',
    },
    item: {
        padding: 15,
        marginVertical: 5,
        borderRadius: 5,
    },
    itemText: {
        color: '#fff',
        fontSize: 16,
    },
});

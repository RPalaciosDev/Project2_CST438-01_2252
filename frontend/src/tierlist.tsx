import React, { useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler'; 
import DraggableFlatList, { RenderItemParams } from 'react-native-draggable-flatlist';

const TIERS = [
    { label: 'S', color: '#FF6B6B' },
    { label: 'A', color: '#FFA94D' },
    { label: 'B', color: '#FFD43B' },
    { label: 'C', color: '#74C476' },
    { label: 'D', color: '#4D94FF' },
    { label: 'E', color: '#817EFF' },
    { label: 'F', color: '#F78CFF' },
];

const initialItems = [
    { id: '1', name: 'Item 1', tier: 'S' },
    { id: '2', name: 'Item 2', tier: 'A' },
    { id: '3', name: 'Item 3', tier: 'B' },
    { id: '4', name: 'Item 4', tier: 'C' },
    { id: '5', name: 'Item 5', tier: 'D' },
];

export default function TierList() {
    const [items, setItems] = useState(initialItems);

    const renderItem = ({ item, drag, isActive }: RenderItemParams<typeof initialItems[0]>) => {
        return (
            <View style={[styles.item, { backgroundColor: isActive ? '#333' : '#222' }]}>
                <Text style={styles.itemText} onLongPress={drag}>{item.name}</Text>
            </View>
        );
    };

    return (
        <GestureHandlerRootView style={{ flex: 1 }}> 
            <View style={styles.container}>
                {TIERS.map(({ label, color }) => (
                    <View key={label} style={styles.tierRow}> 
                        <View style={[styles.tierLabelContainer, { backgroundColor: color }]}> 
                            <Text style={styles.tierLabel}>{label}</Text>
                        </View>
                        <View style={styles.tierContent}>
                            <DraggableFlatList
                                data={items.filter(item => item.tier === label)}
                                renderItem={renderItem}
                                keyExtractor={(item) => item.id}
                                onDragEnd={({ data }) => setItems(data)}
                                showsVerticalScrollIndicator={false}
                            />
                        </View>
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
        paddingHorizontal: 5,
        paddingVertical: 10,
    },
    tierRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 2,
    },
    tierLabelContainer: {
        width: 40,
        height: 40,
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: 5,
        marginRight: 5,
    },
    tierLabel: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#fff',
    },
    tierContent: {
        flex: 1,
        backgroundColor: '#111',
        borderRadius: 5,
        paddingVertical: 5,
        minHeight: 40,
    },
    item: {
        padding: 10,
        marginVertical: 3,
        borderRadius: 5,
    },
    itemText: {
        color: '#fff',
        fontSize: 16,
    },
});

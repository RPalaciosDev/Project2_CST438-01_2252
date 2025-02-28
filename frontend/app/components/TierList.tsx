import React, { useState } from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import DraggableFlatList, { ScaleDecorator } from 'react-native-draggable-flatlist';
import { Tier, TierItem, TierListProps } from '../../types';
import { colors } from '../../styles';

const TIERS: Tier[] = [
    { label: 'S', color: colors.tier.s },
    { label: 'A', color: colors.tier.a },
    { label: 'B', color: colors.tier.b },
    { label: 'C', color: colors.tier.c },
    { label: 'D', color: colors.tier.d },
    { label: 'E', color: colors.tier.e },
    { label: 'F', color: colors.tier.f },
];

const defaultItems: TierItem[] = [
    { id: '1', name: 'Item 1', tier: 'S' },
    { id: '2', name: 'Item 2', tier: 'A' },
    { id: '3', name: 'Item 3', tier: 'B' },
    { id: '4', name: 'Item 4', tier: 'C' },
    { id: '5', name: 'Item 5', tier: 'D' },
];

export default function TierList({ items: initialItems = defaultItems, onItemsChange, readOnly = false }: TierListProps) {
    const [items, setItems] = useState<TierItem[]>(initialItems);

    const handleDragEnd = (tier: string, updatedItems: TierItem[]) => {
        const otherItems = items.filter(item => item.tier !== tier);
        const newItems = [
            ...otherItems,
            ...updatedItems.map(item => ({ ...item, tier }))
        ];
        setItems(newItems);
        onItemsChange?.(newItems);
    };

    const renderTierRow = ({ label, color }: Tier) => {
        const tierItems = items.filter(item => item.tier === label);

        const renderItem = ({ item, drag, isActive }: { item: TierItem; drag: () => void; isActive: boolean }) => (
            <ScaleDecorator>
                <View 
                    style={[
                        styles.item, 
                        { backgroundColor: isActive ? '#333' : '#222' }
                    ]}
                    onLongPress={readOnly ? undefined : drag}
                >
                    <Text style={styles.itemText}>{item.name}</Text>
                </View>
            </ScaleDecorator>
        );

        return (
            <View key={label} style={styles.tierRow}>
                <View style={[styles.tierLabel, { backgroundColor: color }]}>
                    <Text style={styles.tierLabelText}>{label}</Text>
                </View>
                <View style={styles.tierContent}>
                    <DraggableFlatList
                        horizontal
                        data={tierItems}
                        renderItem={renderItem}
                        keyExtractor={(item: TierItem) => item.id}
                        onDragEnd={({ data }) => !readOnly && handleDragEnd(label, data)}
                        containerStyle={styles.dragContainer}
                    />
                </View>
            </View>
        );
    };

    return (
        <GestureHandlerRootView style={styles.container}>
            {TIERS.map(renderTierRow)}
        </GestureHandlerRootView>
    );
}

const { width } = Dimensions.get('window');

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#000',
    },
    tierRow: {
        flexDirection: 'row',
        height: 80,
        marginVertical: 2,
        paddingHorizontal: 10,
    },
    tierLabel: {
        width: 40,
        height: 40,
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: 5,
        marginRight: 10,
    },
    tierLabelText: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#fff',
    },
    tierContent: {
        flex: 1,
        backgroundColor: '#111',
        borderRadius: 5,
        padding: 5,
    },
    dragContainer: {
        flex: 1,
    },
    item: {
        width: width * 0.25,
        height: 60,
        marginHorizontal: 5,
        backgroundColor: '#222',
        borderRadius: 5,
        justifyContent: 'center',
        alignItems: 'center',
    },
    itemText: {
        color: '#fff',
        fontSize: 16,
    },
}); 
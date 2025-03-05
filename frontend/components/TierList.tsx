import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Dimensions, Pressable, Platform, ScrollView } from 'react-native';
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

export default function TierList({ 
    items: initialItems = defaultItems, 
    onItemsChange, 
    readOnly = false 
}: TierListProps) {
    const [items, setItems] = useState<TierItem[]>(initialItems);
    
    useEffect(() => {
        setItems(initialItems);
    }, [initialItems]);

    const renderTierRow = ({ label, color }: Tier) => {
        const tierItems = items.filter(item => item.tier === label);

        return (
            <View key={label} style={styles.tierRow}>
                <View style={[styles.tierLabel, { backgroundColor: color }]}>
                    <Text style={styles.tierLabelText}>{label}</Text>
                </View>
                <View style={styles.tierContent}>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                        {tierItems.map((item) => (
                            <Pressable 
                                key={item.id}
                                style={[styles.item]}
                                disabled={readOnly}
                            >
                                <Text style={styles.itemText}>{item.name}</Text>
                            </Pressable>
                        ))}
                    </ScrollView>
                </View>
            </View>
        );
    };

    return (
        <View style={[styles.container, { flex: 1 }]}>
            {TIERS.map(renderTierRow)}
        </View>
    );
}

const { width } = Dimensions.get('window');
const itemWidth = Platform.OS === 'web' ? 150 : width * 0.25;

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
        alignSelf: 'center',
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
    item: {
        width: itemWidth,
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



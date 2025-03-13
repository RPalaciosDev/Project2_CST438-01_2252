import React, { useEffect, useState } from "react";
import { View, Text, Image, FlatList, TouchableOpacity } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { useStyle } from "../context/StyleContext";
import stylesMap from "../../styles/index";

// Local image imports
const localImages = [
    { id: "1", image: { uri: "/Brook_Portrait.webp" } },
    { id: "2", image: { uri: "/Franky_Portrait.webp" } },
    { id: "3", image: { uri: "/Jinbe_Portrait.webp" } },
    { id: "4", image: { uri: "/Monkey_D._Luffy_Portrait.webp" } },
    { id: "5", image: { uri: "/Nami_Portrait.webp" } },
    { id: "6", image: { uri: "/Nico_Robin_Post_Timeskip_Portrait.webp" } },
    { id: "7", image: { uri: "/Roronoa_Zoro_Portrait.webp" } },
    { id: "8", image: { uri: "/Sanji_Portrait.webp" } },
    { id: "9", image: { uri: "/Tony_Tony_Chopper_Portrait.webp" } },
    { id: "10", image: { uri: "/Usopp_Portrait.webp" } },
];

interface TierItem {
    id: string;
    image: any;
    tier?: string;
}

export default function TierList() {
    const { selectedStyle } = useStyle();
    const [theme, setTheme] = useState(stylesMap[selectedStyle] || stylesMap["default"]);
    const [tierItems, setTierItems] = useState<TierItem[]>([]);
    const [selectedItem, setSelectedItem] = useState<TierItem | null>(null);

    useEffect(() => {
        setTheme(stylesMap[selectedStyle] || stylesMap["default"]);
    }, [selectedStyle]);

    const handleImageSelect = (item: TierItem) => {
        setSelectedItem(item);
    };

    const handleTierSelect = (tierLabel: string) => {
        if (selectedItem) {
            // Move selected image to the chosen tier
            setTierItems((prev) => [
                ...prev.filter((item) => item.id !== selectedItem.id),
                { ...selectedItem, tier: tierLabel },
            ]);
            setSelectedItem(null);
        }
    };

    const { styles, TIERS } = theme;

    return (
        <GestureHandlerRootView style={{ flex: 1 }}>
            <View style={styles.container}>
                {TIERS.map(({ label, color }) => (
                    <TouchableOpacity key={label} onPress={() => handleTierSelect(label)}>
                        <View style={styles.tierRow}>
                            <View style={[styles.tierLabelContainer, { backgroundColor: color }]}>
                                <Text style={styles.tierLabel}>{label}</Text>
                            </View>
                            <View style={[styles.tierContent, { flexDirection: "row", flexWrap: "wrap" }]}>
                                {/* Display images in the selected tier left to right */}
                                {tierItems.filter((item) => item.tier === label).map((item) => (
                                    <Image key={item.id} source={item.image} style={{ width: 50, height: 50, margin: 5 }} />
                                ))}
                            </View>
                        </View>
                    </TouchableOpacity>
                ))}

                <View style={{ marginTop: 20 }}>
                    <Text style={styles.tierLabel}>Select an Image</Text>
                    <FlatList
                        data={localImages}
                        keyExtractor={(item) => item.id}
                        numColumns={5}
                        renderItem={({ item }) => (
                            <TouchableOpacity onPress={() => handleImageSelect(item)}>
                                <Image
                                    source={item.image}
                                    style={{
                                        width: 100,
                                        height: 100,
                                        margin: 5,
                                        borderWidth: selectedItem?.id === item.id ? 2 : 0,
                                        borderColor: selectedItem?.id === item.id ? "blue" : "transparent",
                                    }}
                                />
                            </TouchableOpacity>
                        )}
                    />
                </View>
            </View>
        </GestureHandlerRootView>
    );
}


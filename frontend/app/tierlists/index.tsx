import React, { useEffect, useState } from "react";
import { View, Text, Image, FlatList, TouchableOpacity } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { useStyle } from "../context/StyleContext";
import stylesMap from "../../styles/index";

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
    const [tierImages, setTierImages] = useState<TierItem[]>([]);  // Holds images fetched from AWS S3

    useEffect(() => {
        setTheme(stylesMap[selectedStyle] || stylesMap["default"]);
    }, [selectedStyle]);

    useEffect(() => {
        const fetchImages = async () => {
            try {
                const response = await fetch("https://imageapi-production-af11.up.railway.app/api/images?folder=Anime/OnePiece/StrawHatPirates");
                const data = await response.json();
                const formattedImages = data.map((img: any, index: number) => ({
                    id: index.toString(),
                    image: { uri: img.s3Url },
                }));
                setTierImages(formattedImages);
            } catch (error) {
                console.error("Error fetching images:", error);
            }
        };
        fetchImages();
    }, []);

    const handleImageSelect = (item: TierItem) => {
        setSelectedItem(item);
    };

    const handleTierSelect = (tierLabel: string) => {
        if (selectedItem) {
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
                        data={tierImages}  // Updated to fetch from AWS S3
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

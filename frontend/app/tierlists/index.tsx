import React, { useEffect, useState } from "react";
import { View, Text, Image, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { useStyle } from "../context/StyleContext";
import stylesMap from "../../styles/index";
import { useLocalSearchParams } from 'expo-router';
import axios from 'axios';
import { TIERLIST_API_URL } from '../../services/auth';

// Template type definition
type Template = {
    id: string;
    title: string;
    description: string;
    images: {
        id: string;
        s3Url: string;
        originalFilename: string;
    }[];
    tags: string[];
    viewCount: number;
};

// Local image imports as fallback
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
    const { templateId } = useLocalSearchParams();
    const { selectedStyle } = useStyle();
    const [theme, setTheme] = useState(stylesMap[selectedStyle] || stylesMap["default"]);
    const [tierItems, setTierItems] = useState<TierItem[]>([]);
    const [selectedItem, setSelectedItem] = useState<TierItem | null>(null);
    const [template, setTemplate] = useState<Template | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        setTheme(stylesMap[selectedStyle] || stylesMap["default"]);
    }, [selectedStyle]);

    useEffect(() => {
        // Fetch template data if templateId is provided
        if (templateId) {
            fetchTemplateData(templateId as string);
        } else {
            // If no templateId, just use local images and stop loading
            setLoading(false);
        }
    }, [templateId]);

    const fetchTemplateData = async (id: string) => {
        try {
            setLoading(true);
            const response = await axios.get(`${TIERLIST_API_URL}/api/templates/${id}/with-images`);
            setTemplate(response.data);

            // Enhanced logging for debugging
            console.log('Template data received:', JSON.stringify(response.data, null, 2));
            console.log('Template imageIds check:', response.data.imageIds ?
                `Has ${response.data.imageIds.length} imageIds` : 'No imageIds field found');
            console.log('Template images check:', response.data.images ?
                `Has ${response.data.images.length} images` : 'No images field found');

            // Convert template images to tier items
            if (response.data.images && response.data.images.length > 0) {
                const newTierItems = response.data.images.map((img: any) => ({
                    id: img.id,
                    image: { uri: img.s3Url },
                    tier: undefined
                }));
                setTierItems(newTierItems);
            }

            setLoading(false);
        } catch (err) {
            console.error('Error fetching template data:', err);
            setError('Failed to load template. Using default images.');
            setLoading(false);
        }
    };

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

    if (loading) {
        return (
            <View style={customStyles.loadingContainer}>
                <ActivityIndicator size="large" color="#FF4B6E" />
                <Text style={customStyles.loadingText}>Loading tier list...</Text>
            </View>
        );
    }

    return (
        <GestureHandlerRootView style={{ flex: 1 }}>
            <View style={styles.container}>
                {template && (
                    <View style={customStyles.templateHeader}>
                        <Text style={customStyles.templateTitle}>{template.title}</Text>
                        {template.description && (
                            <Text style={customStyles.templateDescription}>{template.description}</Text>
                        )}
                        <View style={customStyles.templateStats}>
                            <Text style={customStyles.statText}>Views: {template.viewCount}</Text>
                            {template.tags && template.tags.length > 0 && (
                                <Text style={customStyles.statText}>
                                    Tags: {template.tags.join(', ')}
                                </Text>
                            )}
                        </View>
                    </View>
                )}

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
                        data={tierItems.length > 0 ? tierItems : localImages}
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

const customStyles = StyleSheet.create({
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#FFF5F5',
    },
    loadingText: {
        marginTop: 16,
        fontSize: 16,
        color: '#333',
    },
    templateHeader: {
        marginBottom: 20,
        padding: 10,
        backgroundColor: '#FFF',
        borderRadius: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 3,
        elevation: 2,
    },
    templateTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 8,
    },
    templateDescription: {
        fontSize: 16,
        color: '#666',
        marginBottom: 10,
    },
    templateStats: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
    },
    statText: {
        fontSize: 14,
        color: '#888',
        marginTop: 5,
    },
});


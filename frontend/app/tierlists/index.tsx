import React, { useEffect, useState, useRef } from "react";
import { View, Text, Image, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator, Platform, Animated as RNAnimated, Alert } from "react-native";
import { GestureHandlerRootView, PanGestureHandler } from "react-native-gesture-handler";
import Animated, {
    useAnimatedGestureHandler,
    useAnimatedStyle,
    useSharedValue,
    withSpring,
    runOnJS
} from 'react-native-reanimated';
import { useStyle } from "../context/StyleContext";
import stylesMap from "../../styles/index";
import { useLocalSearchParams, useRouter } from 'expo-router';
import axios from 'axios';
import { TIERLIST_API_URL, useAuthStore } from '../../services/auth';

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

interface TierZone {
    label: string;
    y: number;
    height: number;
}

export default function TierList() {
    const { templateId } = useLocalSearchParams();
    const router = useRouter();
    const { selectedStyle } = useStyle();
    const [theme, setTheme] = useState(stylesMap[selectedStyle] || stylesMap["default"]);
    const [tierItems, setTierItems] = useState<TierItem[]>([]);
    const [availableItems, setAvailableItems] = useState<TierItem[]>([]);
    const [template, setTemplate] = useState<Template | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [tierZones, setTierZones] = useState<TierZone[]>([]);
    const [draggedItem, setDraggedItem] = useState<TierItem | null>(null);
    const [isDragging, setIsDragging] = useState(false);
    const [dragPosition, setDragPosition] = useState({ x: 0, y: 0 });
    const [showOverlay, setShowOverlay] = useState(true);
    const [hasChanges, setHasChanges] = useState(false);
    const [showMatchButton, setShowMatchButton] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [matchResult, setMatchResult] = useState<any>(null);

    // Ref for the container to get absolute positioning
    const containerRef = useRef<View>(null);

    // Values for the currently dragged item
    const draggedItemId = useSharedValue<string | null>(null);
    const translateX = useSharedValue(0);
    const translateY = useSharedValue(0);
    const dragItemScale = useSharedValue(1);
    const dragItemOpacity = useSharedValue(1);
    const dragStartX = useSharedValue(0);
    const dragStartY = useSharedValue(0);

    // Animation for the heart pulse
    const heartScale = useRef(new RNAnimated.Value(1)).current;

    // Animation for the match button
    const matchButtonAnim = useRef(new RNAnimated.Value(-100)).current;

    const isWeb = Platform.OS === 'web';

    useEffect(() => {
        setTheme(stylesMap[selectedStyle] || stylesMap["default"]);
    }, [selectedStyle]);

    useEffect(() => {
        // Fetch template data if templateId is provided
        if (templateId) {
            fetchTemplateData(templateId as string);
        } else {
            // If no templateId, just use local images and stop loading
            const items = localImages.map(img => ({
                id: img.id,
                image: img.image,
                tier: undefined
            }));
            setAvailableItems(items);
            setLoading(false);
        }
    }, [templateId]);

    useEffect(() => {
        // Set up the pulsing animation for the heart
        if (showOverlay) {
            // Create a repeating pulse animation
            RNAnimated.loop(
                RNAnimated.sequence([
                    RNAnimated.timing(heartScale, {
                        toValue: 0.9,
                        duration: 800,
                        useNativeDriver: true
                    }),
                    RNAnimated.timing(heartScale, {
                        toValue: 1,
                        duration: 800,
                        useNativeDriver: true
                    })
                ])
            ).start();
        }

        return () => {
            // Clean up animation when component unmounts or overlay hides
            heartScale.stopAnimation();
        };
    }, [showOverlay]);

    useEffect(() => {
        if (tierItems.length > 0) {
            setHasChanges(true);
        }
    }, [tierItems]);

    useEffect(() => {
        if (availableItems.length === 0 && !loading && !showMatchButton) {
            setShowMatchButton(true);
            // Animate button sliding up
            RNAnimated.timing(matchButtonAnim, {
                toValue: 0,
                duration: 500,
                useNativeDriver: true
            }).start();
        } else if (availableItems.length > 0 && showMatchButton) {
            setShowMatchButton(false);
            // Animate button sliding down
            RNAnimated.timing(matchButtonAnim, {
                toValue: -100,
                duration: 300,
                useNativeDriver: true
            }).start();
        }
    }, [availableItems, loading]);

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

            // Convert template images to tier items for the available section
            if (response.data.images && response.data.images.length > 0) {
                const newItems = response.data.images.map((img: any) => ({
                    id: img.id,
                    image: { uri: img.s3Url },
                    tier: undefined
                }));
                setAvailableItems(newItems);
            }

            setLoading(false);
        } catch (err) {
            console.error('Error fetching template data:', err);
            setError('Failed to load template. Using default images.');

            // Use local images as fallback
            const items = localImages.map(img => ({
                id: img.id,
                image: img.image,
                tier: undefined
            }));
            setAvailableItems(items);

            setLoading(false);
        }
    };

    // Register tier layout for drop detection
    const onTierLayout = (tierLabel: string, event: any) => {
        const layout = event.nativeEvent.layout;
        // Store the position and size of each tier for drop detection
        setTierZones(prev => {
            const existing = prev.findIndex(zone => zone.label === tierLabel);
            if (existing !== -1) {
                const updated = [...prev];
                updated[existing] = { label: tierLabel, y: layout.y, height: layout.height };
                return updated;
            } else {
                return [...prev, { label: tierLabel, y: layout.y, height: layout.height }];
            }
        });
    };

    // Handle back button press
    const handleBackPress = () => {
        if (hasChanges) {
            if (isWeb) {
                // For web platform - use a custom alert in JSX instead of relying on browser dialogs
                showDialog({
                    title: "Unsaved Changes",
                    message: "You have unsaved changes. Are you sure you want to leave?",
                    onConfirm: () => router.back(),
                    onCancel: () => { }
                });
            } else {
                // For native platforms
                Alert.alert(
                    "Unsaved Changes",
                    "You have unsaved changes. Are you sure you want to leave?",
                    [
                        { text: "Cancel", style: "cancel" },
                        { text: "Leave", onPress: () => router.back() }
                    ]
                );
            }
        } else {
            router.back();
        }
    };

    // Dialog state
    const [dialog, setDialog] = useState<{
        visible: boolean;
        title: string;
        message: string;
        onConfirm: () => void;
        onCancel: () => void;
    }>({
        visible: false,
        title: "",
        message: "",
        onConfirm: () => { },
        onCancel: () => { }
    });

    // Show a dialog for web confirmation
    const showDialog = ({
        title,
        message,
        onConfirm,
        onCancel
    }: {
        title: string;
        message: string;
        onConfirm: () => void;
        onCancel: () => void;
    }) => {
        setDialog({
            visible: true,
            title,
            message,
            onConfirm: () => {
                setDialog(prev => ({ ...prev, visible: false }));
                onConfirm();
            },
            onCancel: () => {
                setDialog(prev => ({ ...prev, visible: false }));
                onCancel();
            }
        });
    };

    // Handle item dropped on a tier
    const handleItemDropped = (itemId: string, tier: string) => {
        // Find the item
        const itemIndex = availableItems.findIndex(item => item.id === itemId);
        if (itemIndex !== -1) {
            // Get the item
            const item = availableItems[itemIndex];

            // Add to tier items
            setTierItems(prev => [...prev, { ...item, tier }]);

            // Remove from available items
            setAvailableItems(prev => prev.filter(item => item.id !== itemId));

            // Mark that changes have been made
            setHasChanges(true);
        }
    };

    // Remove item from tier and return it to available items
    const handleRemoveFromTier = (item: TierItem) => {
        // Remove from tier items
        setTierItems(prev => prev.filter(tierItem => tierItem.id !== item.id));

        // Add back to available items pool
        setAvailableItems(prev => [...prev, { ...item, tier: undefined }]);

        // Mark that changes have been made
        setHasChanges(true);
    };

    // Check which tier the item was dropped on
    const checkDropZone = (y: number, itemId: string) => {
        // Find which tier this Y coordinate falls into
        const zone = tierZones.find(zone => y >= zone.y && y <= (zone.y + zone.height));
        if (zone) {
            handleItemDropped(itemId, zone.label);
            return true;
        }
        return false;
    };

    // Gesture handler for draggable items
    const panGestureHandler = useAnimatedGestureHandler({
        onStart: (_, ctx: any) => {
            ctx.startX = translateX.value;
            ctx.startY = translateY.value;
            dragItemScale.value = withSpring(1.1);
            dragItemOpacity.value = withSpring(0.9);
        },
        onActive: (event, ctx) => {
            translateX.value = ctx.startX + event.translationX;
            translateY.value = ctx.startY + event.translationY;
        },
        onEnd: (event, ctx) => {
            const finalY = ctx.startY + event.translationY + dragStartY.value;

            if (draggedItemId.value) {
                // Use runOnJS to call JavaScript functions from the worklet
                runOnJS(checkDropZone)(finalY, draggedItemId.value);
            }

            // Reset position and appearance
            translateX.value = withSpring(0);
            translateY.value = withSpring(0);
            dragItemScale.value = withSpring(1);
            dragItemOpacity.value = withSpring(1);
            draggedItemId.value = null;
        }
    });

    // Animated style for the draggable item
    const draggedItemStyle = useAnimatedStyle(() => {
        return {
            transform: [
                { translateX: translateX.value },
                { translateY: translateY.value },
                { scale: dragItemScale.value }
            ],
            opacity: dragItemOpacity.value,
            zIndex: draggedItemId.value ? 1000 : 1,
        };
    });

    // Web-specific event handlers for drag and drop
    const handleDragStart = (item: TierItem, e: any) => {
        if (isWeb) {
            e.dataTransfer.setData('text/plain', item.id);
            setDraggedItem(item);
            setIsDragging(true);
            // Apply visual feedback styles
            e.target.style.opacity = '0.7';
            e.target.style.transform = 'scale(1.05)';
        }
    };

    const handleDragEnd = (e: any) => {
        if (isWeb) {
            setIsDragging(false);
            // Reset visual styles
            if (e.target) {
                e.target.style.opacity = '1';
                e.target.style.transform = 'scale(1)';
            }
        }
    };

    const handleDragOver = (e: any) => {
        if (isWeb) {
            // Necessary to allow drop
            e.preventDefault();
        }
    };

    const handleDrop = (tierLabel: string, e: any) => {
        if (isWeb) {
            e.preventDefault();
            const itemId = e.dataTransfer.getData('text/plain');
            if (itemId && draggedItem) {
                handleItemDropped(itemId, tierLabel);
            }
            setIsDragging(false);
        }
    };

    // Render a draggable item - with conditional rendering for web
    const renderDraggableItem = (item: TierItem, index: number) => {
        if (isWeb) {
            return (
                <div
                    key={item.id}
                    draggable
                    onDragStart={(e) => handleDragStart(item, e)}
                    onDragEnd={handleDragEnd}
                    style={{
                        margin: 5,
                        cursor: 'grab'
                    }}
                >
                    <Image
                        source={item.image}
                        style={{ width: 80, height: 80, borderRadius: 5 }}
                    />
                </div>
            );
        } else {
            return (
                <PanGestureHandler key={item.id} onGestureEvent={panGestureHandler}>
                    <Animated.View
                        onLayout={(e) => {
                            const layout = e.nativeEvent.layout;
                            dragStartX.value = layout.x;
                            dragStartY.value = layout.y;
                        }}
                        style={[draggedItemStyle, { margin: 5 }]}
                    >
                        <TouchableOpacity
                            onPressIn={() => {
                                draggedItemId.value = item.id;
                            }}
                        >
                            <Image
                                source={item.image}
                                style={{ width: 80, height: 80, borderRadius: 5 }}
                            />
                        </TouchableOpacity>
                    </Animated.View>
                </PanGestureHandler>
            );
        }
    };

    // Render tier row based on platform
    const renderTierRow = (label: string, color: string) => {
        if (isWeb) {
            return (
                <div
                    key={label}
                    onDragOver={handleDragOver}
                    onDrop={(e) => handleDrop(label, e)}
                    style={{
                        display: 'flex',
                        flexDirection: 'row',
                        marginBottom: 10,
                        borderRadius: 8,
                        overflow: 'hidden',
                        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                        backgroundColor: '#ffffff',
                        borderWidth: 1,
                        borderColor: '#E0E0E0'
                    }}
                >
                    <View style={[customStyles.tierLabelContainer, { backgroundColor: color }]}>
                        <Text style={customStyles.tierLabel}>{label}</Text>
                    </View>
                    <View style={[customStyles.tierContent, { flexDirection: "row", flexWrap: "wrap" }]}>
                        {tierItems.filter((item) => item.tier === label).map((item) => (
                            <TouchableOpacity
                                key={item.id}
                                onPress={() => handleRemoveFromTier(item)}
                                style={customStyles.tierItemContainer}
                            >
                                <Image
                                    source={item.image}
                                    style={{ width: 60, height: 60, borderRadius: 4 }}
                                />
                                {isWeb && (
                                    <div
                                        className="tier-item-overlay"
                                        style={{
                                            position: 'absolute',
                                            top: 0,
                                            left: 0,
                                            right: 0,
                                            bottom: 0,
                                            backgroundColor: 'rgba(0,0,0,0)',
                                            display: 'flex',
                                            justifyContent: 'center',
                                            alignItems: 'center',
                                            opacity: 0,
                                            transition: 'all 0.2s'
                                        }}
                                    >
                                        <Text style={customStyles.removeText}>×</Text>
                                    </div>
                                )}
                            </TouchableOpacity>
                        ))}
                    </View>
                </div>
            );
        } else {
            return (
                <View
                    key={label}
                    onLayout={(event) => onTierLayout(label, event)}
                    style={customStyles.tierRow}
                >
                    <View style={[customStyles.tierLabelContainer, { backgroundColor: color }]}>
                        <Text style={customStyles.tierLabel}>{label}</Text>
                    </View>
                    <View style={[customStyles.tierContent, { flexDirection: "row", flexWrap: "wrap" }]}>
                        {tierItems.filter((item) => item.tier === label).map((item) => (
                            <TouchableOpacity
                                key={item.id}
                                onPress={() => handleRemoveFromTier(item)}
                                style={customStyles.tierItemContainer}
                            >
                                <Image
                                    source={item.image}
                                    style={{ width: 60, height: 60, borderRadius: 4 }}
                                />
                                <View style={customStyles.tierItemOverlay}>
                                    <Text style={customStyles.removeText}>×</Text>
                                </View>
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>
            );
        }
    };

    // Handle match button press - send data to ML service
    const handleMatchPress = async () => {
        const { user } = useAuthStore();

        if (!user?.id) {
            Alert.alert("Error", "You must be logged in to match");
            return;
        }

        setIsSubmitting(true);

        try {
            // Transform tier items into the format expected by the ML service
            const tierListData: Record<string, string> = {};
            tierItems.forEach(item => {
                // Extract just the filename without extension and replace spaces with underscores
                let imageName;
                if (item.image && item.image.uri) {
                    // Extract filename from URI
                    const uriParts = item.image.uri.split('/');
                    let filename = uriParts[uriParts.length - 1];
                    // Remove file extension
                    filename = filename.split('.')[0];
                    // Format name (replace spaces with underscores)
                    imageName = filename.replace(/\s+/g, '_');
                } else {
                    // Fallback to ID if URI parsing fails
                    imageName = item.id;
                }

                // Only add if we have a tier value
                if (item.tier) {
                    tierListData[imageName] = item.tier;
                }
            });

            console.log("Submitting tier list to ML service:", {
                user_id: user.id,
                tier_list: tierListData
            });

            // Send the tier list to the ML service
            const ML_SERVICE_URL = "https://ml-matching.up.railway.app";
            const response = await axios.post(`${ML_SERVICE_URL}/submit_tier_list`, {
                user_id: user.id,
                tier_list: tierListData
            });

            console.log("ML service response:", response.data);

            // Show success message and redirect back
            Alert.alert(
                "Tier List Submitted",
                "Your tier list has been submitted successfully!",
                [{ text: "OK", onPress: () => router.back() }]
            );
        } catch (error) {
            console.error("Error submitting tier list:", error);
            Alert.alert("Error", "Failed to submit your tier list. Please try again.");
        } finally {
            setIsSubmitting(false);
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
            <View style={[styles.container, customStyles.mainContainer]} ref={containerRef}>
                {/* Back button */}
                <TouchableOpacity
                    style={customStyles.backButton}
                    onPress={handleBackPress}
                >
                    <Text style={customStyles.backButtonText}>← Back</Text>
                </TouchableOpacity>

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

                {TIERS.map(({ label, color }) => renderTierRow(label, color))}

                {/* Divider between tiers and available images */}
                <View style={customStyles.divider} />

                {/* Available Images Section */}
                <View style={customStyles.availableImagesSection}>
                    <View style={customStyles.availableImagesContainer}>
                        {availableItems.map((item, index) => renderDraggableItem(item, index))}
                    </View>
                </View>

                {/* Initial overlay with heart shape */}
                {showOverlay && (
                    <TouchableOpacity
                        style={customStyles.overlayContainer}
                        onPress={() => setShowOverlay(false)}
                        activeOpacity={1}
                    >
                        {isWeb ? (
                            <div style={{
                                display: 'flex',
                                justifyContent: 'center',
                                alignItems: 'center',
                                width: '100%',
                                height: '100%'
                            }}>
                                <div style={{
                                    width: '250px',
                                    height: '250px',
                                    display: 'flex',
                                    justifyContent: 'center',
                                    alignItems: 'center',
                                    position: 'relative'
                                }}>
                                    <div
                                        className="heart-shape"
                                        style={{
                                            width: '200px',
                                            height: '180px',
                                            position: 'relative',
                                            display: 'flex',
                                            justifyContent: 'center',
                                            alignItems: 'center',
                                            animation: 'heartbeat 1.6s infinite'
                                        }}
                                    >
                                        <style>
                                            {`
                                            .heart-shape:before,
                                            .heart-shape:after {
                                                content: "";
                                                position: absolute;
                                                top: 0;
                                                width: 100px;
                                                height: 160px;
                                                background: rgba(255,105,180,0.3);
                                                border-radius: 100px 100px 0 0;
                                                transform: rotate(-45deg);
                                                transform-origin: 0 100%;
                                                left: 100px;
                                                box-shadow: 0 0 20px rgba(255,105,180,0.3);
                                            }
                                            
                                            .heart-shape:after {
                                                left: 0;
                                                transform: rotate(45deg);
                                                transform-origin: 100% 100%;
                                                box-shadow: 0 0 20px rgba(255,105,180,0.3);
                                            }

                                            @keyframes heartbeat {
                                                0% { transform: scale(1); }
                                                50% { transform: scale(0.9); }
                                                100% { transform: scale(1); }
                                            }
                                            `}
                                        </style>
                                        <div style={{
                                            position: 'absolute',
                                            zIndex: 10,
                                            textAlign: 'center',
                                            width: '100%'
                                        }}>
                                            <Text style={{
                                                fontSize: 24,
                                                fontWeight: 'bold',
                                                color: '#D64D7A',
                                                textAlign: 'center'
                                            }}>Drag and drop</Text>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <View style={customStyles.heartOverlay}>
                                <View style={customStyles.heartContainerOuter}>
                                    <RNAnimated.View
                                        style={[
                                            customStyles.heartContainerInner,
                                            {
                                                transform: [
                                                    { scale: heartScale }
                                                ]
                                            }
                                        ]}
                                    >
                                        <View style={customStyles.heartLeft} />
                                        <View style={customStyles.heartRight} />
                                        <Text style={customStyles.overlayText}>Drag and drop</Text>
                                    </RNAnimated.View>
                                </View>
                            </View>
                        )}
                    </TouchableOpacity>
                )}

                {/* Confirmation Dialog for Web */}
                {isWeb && dialog.visible && (
                    <View style={customStyles.dialogOverlay}>
                        <View style={customStyles.dialogContainer}>
                            <Text style={customStyles.dialogTitle}>{dialog.title}</Text>
                            <Text style={customStyles.dialogMessage}>{dialog.message}</Text>
                            <View style={customStyles.dialogButtonContainer}>
                                <TouchableOpacity style={customStyles.dialogCancelButton} onPress={dialog.onCancel}>
                                    <Text style={customStyles.dialogCancelButtonText}>Cancel</Text>
                                </TouchableOpacity>
                                <TouchableOpacity style={customStyles.dialogConfirmButton} onPress={dialog.onConfirm}>
                                    <Text style={customStyles.dialogConfirmButtonText}>Leave</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    </View>
                )}

                {/* Match Button */}
                {showMatchButton && (
                    <RNAnimated.View
                        style={[
                            customStyles.matchButtonContainer,
                            {
                                transform: [{ translateY: matchButtonAnim }]
                            }
                        ]}
                    >
                        <TouchableOpacity
                            style={[
                                customStyles.matchButton,
                                isSubmitting && customStyles.matchButtonDisabled
                            ]}
                            onPress={handleMatchPress}
                            disabled={isSubmitting}
                        >
                            {isSubmitting ? (
                                <ActivityIndicator size="small" color="#FFFFFF" />
                            ) : (
                                <Text style={customStyles.matchButtonText}>Match</Text>
                            )}
                        </TouchableOpacity>
                    </RNAnimated.View>
                )}
            </View>
        </GestureHandlerRootView>
    );
}

const customStyles = StyleSheet.create({
    mainContainer: {
        backgroundColor: '#F7F7F7',
        padding: 16,
        maxWidth: 1200,
        width: '100%',
        alignSelf: 'center',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#F7F7F7',
    },
    loadingText: {
        marginTop: 16,
        fontSize: 16,
        color: '#333',
    },
    templateHeader: {
        marginBottom: 20,
        padding: 16,
        backgroundColor: '#FFFFFF',
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#E0E0E0',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
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
        color: '#555',
        marginBottom: 10,
    },
    templateStats: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        marginTop: 8,
        paddingTop: 8,
        borderTopWidth: 1,
        borderTopColor: '#F0F0F0',
    },
    statText: {
        fontSize: 14,
        color: '#777',
    },
    tierRow: {
        flexDirection: 'row',
        marginBottom: 12,
        borderRadius: 8,
        overflow: 'hidden',
        backgroundColor: '#ffffff',
        borderWidth: 1,
        borderColor: '#E0E0E0',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        elevation: 2,
    },
    tierLabelContainer: {
        width: 50,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 10,
    },
    tierLabel: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#fff',
        textShadowColor: 'rgba(0, 0, 0, 0.3)',
        textShadowOffset: { width: 0, height: 1 },
        textShadowRadius: 2,
    },
    tierContent: {
        flex: 1,
        padding: 8,
        justifyContent: 'flex-start',
        alignItems: 'flex-start',
        backgroundColor: '#ffffff',
        flexDirection: 'row',
        flexWrap: 'wrap',
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 10,
        paddingLeft: 4,
    },
    availableImagesContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'flex-start',
        padding: 16,
        backgroundColor: '#ffffff',
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#E0E0E0',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        elevation: 2,
    },
    overlayContainer: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(255,255,255,0.7)',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 1000,
    },
    heartOverlay: {
        width: 250,
        height: 250,
        justifyContent: 'center',
        alignItems: 'center',
    },
    heartContainerOuter: {
        width: 200,
        height: 180,
        justifyContent: 'center',
        alignItems: 'center',
    },
    heartContainerInner: {
        width: 200,
        height: 180,
        justifyContent: 'center',
        alignItems: 'center',
    },
    heartLeft: {
        position: 'absolute',
        top: 0,
        left: 100,
        width: 100,
        height: 160,
        backgroundColor: 'rgba(255,105,180,0.3)',
        borderTopLeftRadius: 100,
        borderTopRightRadius: 100,
        transform: [
            { rotate: '-45deg' },
            { translateX: -50 }
        ]
    },
    heartRight: {
        position: 'absolute',
        top: 0,
        left: 0,
        width: 100,
        height: 160,
        backgroundColor: 'rgba(255,105,180,0.3)',
        borderTopLeftRadius: 100,
        borderTopRightRadius: 100,
        transform: [
            { rotate: '45deg' },
            { translateX: 50 }
        ]
    },
    overlayText: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#D64D7A',
        textAlign: 'center',
        zIndex: 10,
    },
    tierItemContainer: {
        position: 'relative',
        margin: 6,
        borderRadius: 4,
        overflow: 'hidden',
    },
    tierItemOverlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0,0,0,0.0)',
        justifyContent: 'center',
        alignItems: 'center',
        opacity: 0,
    },
    removeText: {
        color: '#fff',
        fontSize: 28,
        fontWeight: 'bold',
    },
    divider: {
        height: 1,
        backgroundColor: '#E0E0E0',
        marginVertical: 20,
        width: '100%',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 1,
    },
    availableImagesSection: {
        marginTop: 5,
    },
    backButton: {
        paddingVertical: 8,
        paddingHorizontal: 16,
        backgroundColor: '#FFF',
        borderRadius: 6,
        borderWidth: 1,
        borderColor: '#E0E0E0',
        flexDirection: 'row',
        alignItems: 'center',
        alignSelf: 'flex-start',
        marginBottom: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        elevation: 1,
    },
    backButtonText: {
        fontSize: 16,
        fontWeight: '500',
        color: '#333',
    },

    // Dialog styles
    dialogOverlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 2000,
    },
    dialogContainer: {
        width: 320,
        backgroundColor: '#FFF',
        borderRadius: 10,
        padding: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
        elevation: 5,
    },
    dialogTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 10,
    },
    dialogMessage: {
        fontSize: 16,
        color: '#555',
        marginBottom: 20,
    },
    dialogButtonContainer: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
    },
    dialogCancelButton: {
        paddingVertical: 8,
        paddingHorizontal: 16,
        marginRight: 10,
    },
    dialogCancelButtonText: {
        color: '#666',
        fontSize: 14,
        fontWeight: '500',
    },
    dialogConfirmButton: {
        paddingVertical: 8,
        paddingHorizontal: 16,
        backgroundColor: '#FF4B6E',
        borderRadius: 4,
    },
    dialogConfirmButtonText: {
        color: '#FFF',
        fontSize: 14,
        fontWeight: '500',
    },
    matchButtonContainer: {
        position: 'absolute',
        bottom: 20,
        left: 0,
        right: 0,
        alignItems: 'center',
        zIndex: 100,
    },
    matchButton: {
        backgroundColor: '#FF4B6E',
        paddingVertical: 12,
        paddingHorizontal: 40,
        borderRadius: 25,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.2,
        shadowRadius: 5,
        elevation: 5,
    },
    matchButtonDisabled: {
        backgroundColor: '#FFACBC',
    },
    matchButtonText: {
        color: '#FFF',
        fontSize: 18,
        fontWeight: 'bold',
        textAlign: 'center',
    },
});


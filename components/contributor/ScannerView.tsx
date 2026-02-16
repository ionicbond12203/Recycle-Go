import { Ionicons } from "@expo/vector-icons";
import { CameraView, useCameraPermissions } from "expo-camera";
import * as ImagePicker from "expo-image-picker";
import { useKeepAwake } from "expo-keep-awake";
import React, { useEffect, useRef, useState } from "react";
import { Dimensions, Linking, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import Animated, {
    Easing,
    useAnimatedStyle,
    useSharedValue,
    withRepeat,
    withTiming
} from "react-native-reanimated";

import { useLanguage } from "../../contexts/LanguageContext";
import { useTheme } from "../../contexts/ThemeContext";

const { width, height } = Dimensions.get("window");
const SCAN_FRAME_SIZE = width * 0.7;

interface ScannerViewProps {
    onScan: (photo: any) => void;
    onClose: () => void;
}

export default function ScannerView({ onScan, onClose }: ScannerViewProps) {
    useKeepAwake();
    const { t } = useLanguage();
    const { colors } = useTheme();
    const [permission, requestPermission] = useCameraPermissions();
    const cameraRef = useRef<CameraView>(null);
    const [cameraReady, setCameraReady] = useState(false);
    const [isScanning, setIsScanning] = useState(false);

    // Animation for the scanning line
    const translateY = useSharedValue(0);

    useEffect(() => {
        translateY.value = withRepeat(
            withTiming(SCAN_FRAME_SIZE, {
                duration: 2000,
                easing: Easing.linear,
            }),
            -1, // Infinite repeat
            false // Do not reverse
        );
    }, []);

    useEffect(() => {
        if (permission && !permission.granted && permission.canAskAgain) {
            requestPermission();
        }
    }, [permission]);

    const animatedStyle = useAnimatedStyle(() => ({
        transform: [{ translateY: translateY.value }],
    }));

    const handleTakePicture = async () => {
        if (cameraRef.current && cameraReady) {
            setIsScanning(true);
            try {
                const photo = await cameraRef.current.takePictureAsync({
                    base64: true,
                    quality: 0.5,
                });
                onScan(photo);
            } catch (error) {
                console.error("Failed to take picture:", error);
                setIsScanning(false);
            }
        }
    };

    const handlePickImage = async () => {
        try {
            const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ['images'],
                allowsEditing: false,
                quality: 0.5,
                base64: true,
            });

            if (!result.canceled && result.assets[0].base64) {
                onScan(result.assets[0]);
            }
        } catch (error) {
            console.error("Error picking image:", error);
        }
    };

    if (!permission) {
        // Camera permissions are still loading
        return <View />;
    }

    if (!permission.granted) {
        // Camera permissions are not granted yet
        return (
            <View style={styles.container}>
                <TouchableOpacity onPress={onClose} style={[styles.closeButton, { position: 'absolute', top: 50, right: 20, zIndex: 10 }]}>
                    <Ionicons name="close" size={30} color="#fff" />
                </TouchableOpacity>

                <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 }}>
                    <Text style={{ color: 'white', textAlign: 'center', marginBottom: 20, fontSize: 16 }}>
                        {t('scanner.permissionRequired')}
                    </Text>

                    {permission.canAskAgain ? (
                        <TouchableOpacity onPress={requestPermission} style={[styles.permissionButton, { backgroundColor: colors.primary }]}>
                            <Text style={styles.permissionButtonText}>{t('actions.grantPermission')}</Text>
                        </TouchableOpacity>
                    ) : (
                        <TouchableOpacity onPress={() => Linking.openSettings()} style={[styles.permissionButton, { backgroundColor: colors.primary }]}>
                            <Text style={styles.permissionButtonText}>{t('actions.openSettings')}</Text>
                        </TouchableOpacity>
                    )}
                </View>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <CameraView
                style={styles.camera}
                ref={cameraRef}
                facing="back"
                onCameraReady={() => setCameraReady(true)}
                onMountError={(error) => console.error("Camera mount error:", error)}
            />

            <View style={styles.overlay}>
                {/* Top Spacer */}
                <View style={styles.maskRow} />

                {/* Middle Row: Side Spacer - Frame - Side Spacer */}
                <View style={styles.middleRow}>
                    <View style={styles.maskSide} />
                    <View style={styles.scanFrame}>
                        <View style={[styles.corner, styles.topLeft]} />
                        <View style={[styles.corner, styles.topRight]} />
                        <View style={[styles.corner, styles.bottomLeft]} />
                        <View style={[styles.corner, styles.bottomRight]} />
                        <Animated.View style={[styles.scanLine, animatedStyle]} />
                    </View>
                    <View style={styles.maskSide} />
                </View>

                {/* Bottom Spacer */}
                <View style={styles.maskRow}>
                    <Text style={styles.instructionText}>{t('scanner.pointCamera')}</Text>
                </View>
            </View>

            {/* Controls */}
            <View style={styles.controls}>
                <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                    <Ionicons name="close" size={30} color="#fff" />
                </TouchableOpacity>

                <TouchableOpacity
                    onPress={handleTakePicture}
                    style={[styles.captureButton, { opacity: cameraReady ? 1 : 0.5 }]}
                    disabled={isScanning || !cameraReady}
                >
                    <View style={styles.captureInner} />
                </TouchableOpacity>

                <TouchableOpacity onPress={handlePickImage} style={styles.galleryButton}>
                    <Ionicons name="images-outline" size={28} color="#fff" />
                </TouchableOpacity>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: 'black',
    },
    camera: {
        ...StyleSheet.absoluteFillObject,
    },
    overlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'transparent',
    },
    maskRow: {
        flex: 1,
        // backgroundColor: 'rgba(0,0,0,0.6)', // Removed as requested
        justifyContent: 'center',
        alignItems: 'center',
    },
    middleRow: {
        height: SCAN_FRAME_SIZE,
        flexDirection: 'row',
    },
    maskSide: {
        flex: 1,
        // backgroundColor: 'rgba(0,0,0,0.6)', // Removed as requested
    },
    scanFrame: {
        width: SCAN_FRAME_SIZE,
        height: SCAN_FRAME_SIZE,
        position: 'relative',
        overflow: 'hidden', // Keep scan line inside
    },
    corner: {
        position: 'absolute',
        width: 30,
        height: 30,
        borderColor: '#4CAF50',
        borderWidth: 4,
    },
    topLeft: { top: 0, left: 0, borderRightWidth: 0, borderBottomWidth: 0 },
    topRight: { top: 0, right: 0, borderLeftWidth: 0, borderBottomWidth: 0 },
    bottomLeft: { bottom: 0, left: 0, borderRightWidth: 0, borderTopWidth: 0 },
    bottomRight: { bottom: 0, right: 0, borderLeftWidth: 0, borderTopWidth: 0 },

    scanLine: {
        width: '100%',
        height: 2,
        backgroundColor: '#4CAF50', // Hardcoded green for scan line is likely desired for visibility/contrast
        shadowColor: '#4CAF50',
        shadowOpacity: 0.8,
        shadowRadius: 10,
        elevation: 5,
        position: 'absolute',
        top: 0,
    },
    instructionText: {
        color: 'white',
        fontSize: 16,
        marginTop: 20,
        fontWeight: '600',
    },
    controls: {
        position: 'absolute',
        bottom: 50,
        left: 0,
        right: 0,
        flexDirection: 'row',
        justifyContent: 'space-around',
        alignItems: 'center',
    },
    captureButton: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: 'rgba(255,255,255,0.3)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    captureInner: {
        width: 60,
        height: 60,
        borderRadius: 30,
        backgroundColor: '#fff',
    },
    closeButton: {
        width: 50,
        height: 50,
        justifyContent: 'center',
        alignItems: 'center',
    },
    galleryButton: {
        width: 50,
        height: 50,
        justifyContent: 'center',
        alignItems: 'center',
    },
    permissionButton: {
        padding: 15,
        borderRadius: 10,
        alignSelf: 'center',
    },
    permissionButtonText: {
        color: 'white',
        fontSize: 16,
        fontWeight: 'bold',
    },
});

import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import React from "react";
import { Image, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import MapView, { Marker, PROVIDER_GOOGLE } from "react-native-maps";
import MapViewDirections from "react-native-maps-directions";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { appleMapStyle } from "../../app/appleMapStyle";
import { useLanguage } from "../../contexts/LanguageContext";
import { useTheme } from "../../contexts/ThemeContext";

const GOOGLE_MAPS_API_KEY = process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY!;

interface TrackingViewProps {
    userLocation: { latitude: number; longitude: number } | null;
    collectorLocation: { latitude: number; longitude: number } | null;
    routeInfo: { distance: number; duration: number } | null;
    loading: boolean;
    onShareLocation: () => void;
    onOpenChat: () => void;
    onCallCollector: () => void;
    onBack: () => void;
    setRouteInfo: (info: { distance: number, duration: number }) => void;
    onConfirmCollection?: () => void;
    collectorName?: string;
    collectorAvatar?: string;
}

export default function TrackingView({
    userLocation,
    collectorLocation,
    routeInfo,
    loading,
    onShareLocation,
    onOpenChat,
    onCallCollector,
    onBack,
    setRouteInfo,
    onConfirmCollection,
    collectorName,
    collectorAvatar
}: TrackingViewProps) {
    const { t } = useLanguage();
    const { colors, isDark } = useTheme();
    const insets = useSafeAreaInsets();
    const mapRef = React.useRef<MapView>(null);

    // Auto-focus on user location when first loaded (before collector tracking)
    React.useEffect(() => {
        if (userLocation && !collectorLocation && mapRef.current) {
            mapRef.current.animateToRegion({
                latitude: userLocation.latitude,
                longitude: userLocation.longitude,
                latitudeDelta: 0.01,
                longitudeDelta: 0.01,
            }, 1000);
        }
    }, [userLocation]);

    // Fit to both locations when collector is tracking
    React.useEffect(() => {
        if (userLocation && collectorLocation && mapRef.current) {
            mapRef.current.fitToCoordinates([userLocation, collectorLocation], {
                edgePadding: { top: 100, right: 50, bottom: 400, left: 50 },
                animated: true
            });
        }
    }, [collectorLocation, userLocation]);

    const renderMapContent = () => (
        <>
            {collectorLocation && userLocation && (
                <MapViewDirections
                    origin={collectorLocation}
                    destination={userLocation}
                    apikey={GOOGLE_MAPS_API_KEY}
                    strokeWidth={5}
                    strokeColor={colors.trackingBlue}
                    optimizeWaypoints={true}
                    onReady={(result) => setRouteInfo({ distance: result.distance, duration: result.duration })}
                />
            )}
            {collectorLocation && (
                <Marker coordinate={collectorLocation} title="Collector">
                    <View style={[styles.truckMarker, { backgroundColor: colors.truckMarkerBg }]}>
                        <MaterialCommunityIcons name="truck-delivery" size={20} color={colors.textInverse} />
                    </View>
                </Marker>
            )}
        </>
    );

    const renderIdleSheet = () => (
        <View style={[styles.bottomSheet, { paddingBottom: insets.bottom + 20, backgroundColor: colors.card, shadowColor: colors.shadow }]}>
            <View style={[styles.dragHandle, { backgroundColor: colors.divider }]} />
            <View style={styles.sheetHeader}>
                <Text style={[styles.sheetTitle, { color: colors.text }]}>{t('tracking.confirmPickup')}</Text>
            </View>
            <Text style={[styles.confirmText, { color: colors.textSecondary }]}>
                Your location will be shared automatically when you request a pickup from the cart.
            </Text>
        </View>
    );

    const renderTrackingSheet = () => (
        <View style={[styles.bottomSheet, { paddingBottom: insets.bottom + 20, backgroundColor: colors.card, shadowColor: colors.shadow }]}>
            <View style={[styles.dragHandle, { backgroundColor: colors.divider }]} />

            <View style={styles.trackingHeader}>
                <View>
                    <Text style={[styles.etaTime, { color: colors.text }]}>
                        {routeInfo ? (routeInfo.duration < 1 ? t('tracking.lessThanMinute') : `${Math.ceil(routeInfo.duration)} ${t('tracking.mins')}`) : "..."}
                    </Text>
                    <Text style={[styles.etaStatus, { color: colors.textSecondary }]}>
                        {routeInfo && routeInfo.duration < 1 ? t('tracking.arrived') : t('tracking.onTheWay')}
                    </Text>
                </View>
                <View style={[styles.truckIconLarge, { backgroundColor: colors.trackingBlueLight }]}>
                    <MaterialCommunityIcons name="truck-fast" size={30} color={colors.trackingBlue} />
                </View>
            </View>

            <View style={[styles.progressBarBg, { backgroundColor: colors.progressBarBackground }]}>
                <View style={[styles.progressBarFill, { width: '60%', backgroundColor: colors.trackingBlue }]} />
            </View>

            {/* Confirm Collection Button */}
            {onConfirmCollection && (
                <TouchableOpacity style={[styles.mainActionButton, { marginBottom: 20, backgroundColor: colors.primary, shadowColor: colors.primary }]} onPress={onConfirmCollection}>
                    <Text style={[styles.mainActionText, { color: colors.textInverse }]}>{t('actions.confirmCollection')}</Text>
                </TouchableOpacity>
            )}

            <View style={[styles.driverRow, { backgroundColor: colors.backgroundSecondary }]}>
                <Image source={{ uri: collectorAvatar || "https://i.pravatar.cc/150?u=default" }} style={[styles.driverAvatar, { backgroundColor: colors.border }]} />
                <View style={{ flex: 1, marginLeft: 15 }}>
                    <Text style={[styles.driverName, { color: colors.text }]}>{collectorName || "Unknown Collector"}</Text>
                    <Text style={[styles.driverPlate, { color: colors.textSecondary }]}>JQV 8821 • Toyota Hilux</Text>
                </View>

                <TouchableOpacity style={[styles.callBtn, { backgroundColor: colors.background }]} onPress={onOpenChat}>
                    <Ionicons name="chatbubble" size={20} color={colors.text} />
                </TouchableOpacity>
                <TouchableOpacity style={[styles.callBtn, { marginLeft: 10, backgroundColor: colors.background }]} onPress={onCallCollector}>
                    <Ionicons name="call" size={20} color={colors.text} />
                </TouchableOpacity>
            </View>
        </View>
    );

    return (
        <View style={{ flex: 1 }}>
            <MapView
                ref={mapRef}
                style={StyleSheet.absoluteFill}
                provider={PROVIDER_GOOGLE}
                customMapStyle={appleMapStyle}
                initialRegion={{
                    latitude: userLocation?.latitude || 3.1390,
                    longitude: userLocation?.longitude || 101.6869,
                    latitudeDelta: 0.01,
                    longitudeDelta: 0.01,
                }}
                showsUserLocation={true}
            >
                {renderMapContent()}
            </MapView>

            {/* Back button removed */}

            {collectorLocation ? renderTrackingSheet() : renderIdleSheet()}
        </View>
    );
}

const styles = StyleSheet.create({
    truckMarker: { padding: 8, borderRadius: 20, borderWidth: 2, borderColor: '#fff' },
    bottomSheet: { position: 'absolute', bottom: 0, left: 0, right: 0, borderTopLeftRadius: 25, borderTopRightRadius: 25, padding: 20, shadowOpacity: 0.15, shadowRadius: 10, elevation: 20 },
    dragHandle: { width: 40, height: 4, borderRadius: 2, alignSelf: 'center', marginBottom: 20 },
    sheetHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
    sheetTitle: { fontSize: 20, fontWeight: 'bold' },
    confirmText: { marginBottom: 20 },
    mainActionButton: { paddingVertical: 16, borderRadius: 15, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', shadowOpacity: 0.3, shadowRadius: 8, elevation: 5 },
    mainActionText: { fontSize: 18, fontWeight: 'bold' },
    backButtonAbsolute: { position: 'absolute', left: 20, padding: 8, borderRadius: 12, shadowOpacity: 0.1, elevation: 2 },
    trackingHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
    etaTime: { fontSize: 28, fontWeight: '800' },
    etaStatus: { fontSize: 14, marginTop: 2 },
    truckIconLarge: { width: 60, height: 60, borderRadius: 30, justifyContent: 'center', alignItems: 'center' },
    progressBarBg: { height: 6, borderRadius: 3, marginBottom: 20, width: '100%' },
    progressBarFill: { height: 6, borderRadius: 3 },
    driverRow: { flexDirection: 'row', alignItems: 'center', padding: 15, borderRadius: 15 },
    driverAvatar: { width: 50, height: 50, borderRadius: 25 },
    driverName: { fontSize: 16, fontWeight: 'bold' },
    driverPlate: { fontSize: 12, marginTop: 2 },
    callBtn: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center' },
});

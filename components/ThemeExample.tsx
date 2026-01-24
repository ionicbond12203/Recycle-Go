import React from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Colors } from '../constants/Colors';
import { useTheme } from '../contexts/ThemeContext';

export default function ThemeExample() {
    const { colors } = useTheme();

    return (
        <ScrollView style={[styles.container, { backgroundColor: colors.background }]}>
            <View style={styles.section}>
                <Text style={[styles.header, { color: colors.text }]}>Theme Example</Text>
                <Text style={[styles.subHeader, { color: colors.textSecondary }]}>
                    Demonstrating the new Blue Color Palette
                </Text>
            </View>

            <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border, borderWidth: 1 }]}>
                <Text style={[styles.cardTitle, { color: colors.primaryDark }]}>Card Component</Text>
                <Text style={[styles.cardText, { color: colors.text }]}>
                    This is a card view using the 'card' background color (#90E0EF) and 'text' color (#03045E).
                </Text>
            </View>

            <View style={styles.section}>
                <Text style={[styles.sectionTitle, { color: colors.text }]}>Buttons</Text>

                <TouchableOpacity style={[styles.button, { backgroundColor: colors.primary }]}>
                    <Text style={[styles.buttonText, { color: colors.textInverse }]}>Primary Button (#0077B6)</Text>
                </TouchableOpacity>

                <TouchableOpacity style={[styles.button, { backgroundColor: colors.secondary, marginTop: 10 }]}>
                    <Text style={[styles.buttonText, { color: colors.primaryDark }]}>Secondary Button (#00B4D8)</Text>
                </TouchableOpacity>
            </View>

            <View style={styles.section}>
                <Text style={[styles.sectionTitle, { color: colors.text }]}>Palette Breakdown</Text>
                <PaletteItem color={Colors.light.primaryDark} name="Darkest Navy (#03045E)" usage="Primary Text, Headers" />
                <PaletteItem color={Colors.light.primary} name="Strong Blue (#0077B6)" usage="Primary Buttons, Links" />
                <PaletteItem color={Colors.light.secondary} name="Cyan Blue (#00B4D8)" usage="Secondary Buttons, Active States" />
                <PaletteItem color={Colors.light.accent} name="Pale Blue (#90E0EF)" usage="Card Backgrounds" />
                <PaletteItem color={Colors.light.background} name="Lightest Blue (#CAF0F8)" usage="Main Background" />
            </View>
        </ScrollView>
    );
}

const PaletteItem = ({ color, name, usage }: { color: string, name: string, usage: string }) => (
    <View style={styles.paletteRow}>
        <View style={[styles.colorBox, { backgroundColor: color }]} />
        <View style={styles.paletteInfo}>
            <Text style={styles.paletteName}>{name}</Text>
            <Text style={styles.paletteUsage}>{usage}</Text>
        </View>
    </View>
);

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 20,
    },
    section: {
        marginBottom: 24,
    },
    header: {
        fontSize: 28,
        fontWeight: 'bold',
        marginBottom: 8,
    },
    subHeader: {
        fontSize: 16,
        marginBottom: 16,
    },
    sectionTitle: {
        fontSize: 20,
        fontWeight: '600',
        marginBottom: 12,
    },
    card: {
        padding: 20,
        borderRadius: 12,
        marginBottom: 24,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    cardTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 8,
    },
    cardText: {
        fontSize: 14,
        lineHeight: 20,
    },
    button: {
        paddingVertical: 12,
        paddingHorizontal: 24,
        borderRadius: 8,
        alignItems: 'center',
        justifyContent: 'center',
    },
    buttonText: {
        fontSize: 16,
        fontWeight: '600',
    },
    paletteRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
    },
    colorBox: {
        width: 40,
        height: 40,
        borderRadius: 8,
        marginRight: 12,
        borderWidth: 1,
        borderColor: 'rgba(0,0,0,0.1)',
    },
    paletteInfo: {
        flex: 1,
    },
    paletteName: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#333',
    },
    paletteUsage: {
        fontSize: 12,
        color: '#666',
    },
});

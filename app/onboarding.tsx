import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useRef, useState } from "react";
import { Dimensions, FlatList, Image, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Assets } from "../constants/Assets";
import { useLanguage } from "../contexts/LanguageContext";
import { useTheme } from "../contexts/ThemeContext";

const { width, height } = Dimensions.get("window");

export default function OnboardingScreen() {
  const { colors } = useTheme();
  const { t } = useLanguage();
  const [currentIndex, setCurrentIndex] = useState(0);

  const slides = [
    {
      key: "1",
      image: { uri: Assets.ONBOARDING.SLIDE_1 },
      title: t('onboarding.slide1.title'),
      description: t('onboarding.slide1.desc'),
    },
    {
      key: "2",
      image: { uri: Assets.ONBOARDING.SLIDE_2 },
      title: t('onboarding.slide2.title'),
      description: t('onboarding.slide2.desc'),
    },
    {
      key: "3",
      image: { uri: Assets.ONBOARDING.SLIDE_3 },
      title: t('onboarding.slide3.title'),
      description: t('onboarding.slide3.desc'),
    },
  ];
  const flatListRef = useRef<FlatList>(null);
  const router = useRouter();

  const handleNext = () => {
    if (currentIndex < slides.length - 1) {
      flatListRef.current?.scrollToIndex({ index: currentIndex + 1 });
    } else {
      router.replace("/login");
    }
  };

  const handleSkip = () => {
    router.replace("/login");
  };

  const onViewRef = useRef(({ viewableItems }: any) => {
    if (viewableItems.length > 0) {
      setCurrentIndex(viewableItems[0].index);
    }
  });

  const viewConfigRef = useRef({ viewAreaCoveragePercentThreshold: 50 });

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <FlatList
        ref={flatListRef}
        data={slides}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        keyExtractor={(item) => item.key}
        renderItem={({ item }) => (
          <View style={styles.slide}>
            <View style={[styles.imageContainer, { backgroundColor: colors.background }]}>
              <Image source={item.image} style={styles.image} resizeMode="contain" />
            </View>
            <View style={[styles.textContainer, { backgroundColor: colors.onboardingAction }]}>
              <Text style={styles.title}>{item.title}</Text>
              <Text style={styles.description}>{item.description}</Text>
            </View>
          </View>
        )}
        onViewableItemsChanged={onViewRef.current}
        viewabilityConfig={viewConfigRef.current}
      />

      <View style={styles.bottomControls}>
        {currentIndex < slides.length - 1 ? (
          <>
            <TouchableOpacity onPress={handleSkip}><Text style={styles.skipText}>{t('actions.skip')}</Text></TouchableOpacity>
            <TouchableOpacity style={styles.nextButton} onPress={handleNext}>
              <Feather name="arrow-right" size={24} color="#333" />
            </TouchableOpacity>
          </>
        ) : (
          <TouchableOpacity style={[styles.nextButton, { marginLeft: 'auto' }]} onPress={handleNext}>
            <Feather name="check" size={24} color="#333" />
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.pagination}>
        {slides.map((_, index) => (
          <View
            key={index}
            style={[styles.dot, { backgroundColor: currentIndex === index ? "#fff" : "rgba(255,255,255,0.5)", width: currentIndex === index ? 16 : 8 }]}
          />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  slide: { width, height },
  imageContainer: { flex: 0.6, justifyContent: "center", alignItems: "center" },
  image: { width: width * 0.7, height: height * 0.5 },
  textContainer: { flex: 0.4, borderTopLeftRadius: 30, borderTopRightRadius: 30, padding: 24, justifyContent: "center" },
  title: { color: "#fff", fontSize: 22, fontWeight: "700", marginBottom: 12 },
  description: { color: "#fff", fontSize: 16, lineHeight: 24 },
  bottomControls: { position: "absolute", bottom: 40, width: width, flexDirection: "row", justifyContent: "space-between", paddingHorizontal: 24, alignItems: "center" },
  skipText: { color: "#fff", fontSize: 16, fontWeight: "600" },
  nextButton: { width: 56, height: 56, borderRadius: 28, backgroundColor: "#fff", justifyContent: "center", alignItems: "center" },
  pagination: { position: "absolute", bottom: height * 0.4 + 20, alignSelf: "center", flexDirection: "row" },
  dot: { height: 8, width: 8, borderRadius: 4, marginHorizontal: 4 },
});
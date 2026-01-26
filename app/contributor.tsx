import { Ionicons } from "@expo/vector-icons";
import * as Location from "expo-location";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import { Alert, BackHandler, Image, Linking, Modal, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

// Imports from your components folder
import CartView, { CartItem } from "../components/contributor/CartView";
import ChatModal from "../components/contributor/ChatModal";
import HomeView from "../components/contributor/HomeView";
import ManualItemEntryModal, { ManualItem } from "../components/contributor/ManualItemEntryModal";
import ProfileView from "../components/contributor/ProfileView";
import ScannerView from "../components/contributor/ScannerView";
import ScanResultView from "../components/contributor/ScanResultView";
import TrackingView from "../components/contributor/TrackingView";
import EcoBot from "../components/EcoBot";

import { GameMechanics } from "../constants/GameMechanics";
import { useAuth } from "../contexts/AuthContext";
import { useLanguage } from "../contexts/LanguageContext";
import { useTheme } from "../contexts/ThemeContext";
import { supabase } from "../lib/supabase";
import { ChatMessage } from "../types";


export default function ContributorPage() {
  const router = useRouter();
  const { user, isGuest, signOut } = useAuth();
  const { colors, isDark } = useTheme();
  const { t } = useLanguage();
  const insets = useSafeAreaInsets();

  // Helper function to prompt guest to sign in
  const promptGuestSignIn = () => {
    Alert.alert(
      "Sign In Required",
      "You need to sign in to request a pickup and earn rewards.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Sign In",
          onPress: async () => {
            await signOut(); // Clear guest state
            router.replace("/login"); // Navigate to login
          }
        }
      ]
    );
  };


  const pickImage = async () => {
    // Guest restriction - must sign in to scan and earn points
    if (isGuest || !user) {
      promptGuestSignIn();
      return;
    }
    setIsScanning(true);
  };

  // ... (existing state)

  const [currentScreen, setCurrentScreen] = useState<'home' | 'result' | 'cart' | 'tracking' | 'profile'>('home');
  const [deviceId, setDeviceId] = useState<string | null>(null);
  const [location, setLocation] = useState<{ latitude: number; longitude: number } | null>(null);

  // Scan & Cart State
  const [isScanning, setIsScanning] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [scannedItem, setScannedItem] = useState<any>(null);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [isManualModalOpen, setManualModalOpen] = useState(false);

  // Real User Stats
  const [globalStats, setGlobalStats] = useState({ points: 0, savedCO2: "0kg", recycled: "0" });

  // Verification State
  const [pendingTransaction, setPendingTransaction] = useState<any>(null);
  const [recentTransactions, setRecentTransactions] = useState<any[]>([]); // New State

  // Tracking & Chat State (Original Logic)
  const [collectorLocation, setCollectorLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [currentCollectorId, setCurrentCollectorId] = useState<string | null>(null);
  const [collectorPhone, setCollectorPhone] = useState<string | null>(null);
  const [collectorName, setCollectorName] = useState<string | null>(null);
  const [collectorAvatar, setCollectorAvatar] = useState<string | null>(null);
  const [routeInfo, setRouteInfo] = useState<{ distance: number, duration: number } | null>(null);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loadingUpload, setLoadingUpload] = useState(false);
  const [isEcoBotOpen, setIsEcoBotOpen] = useState(false);

  useEffect(() => {
    // Set device ID: use user.id for logged in users, or a temp guest ID
    if (user) {
      setDeviceId(user.id);
    } else if (isGuest) {
      // Guest gets a temporary session ID (not persisted)
      setDeviceId(`guest_${Date.now()}`);
    }

    // Fetch location for map display (works for both guest and logged in)
    (async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== "granted") return;
        const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
        setLocation({ latitude: loc.coords.latitude, longitude: loc.coords.longitude });
      } catch (error) { console.error(error); }
    })();
  }, [user, isGuest]);

  // Handle System Back Button
  useEffect(() => {
    const onBackPress = () => {
      // If modal/scanner is open, close it (handled by their own state usually, but screen Nav is top level)
      if (isScanning) {
        setIsScanning(false);
        return true;
      }

      if (isEcoBotOpen) {
        setIsEcoBotOpen(false);
        return true;
      }

      if (currentScreen !== 'home') {
        setCurrentScreen('home');
        return true; // Prevent default behavior (exit)
      }
      return false; // Allow default behavior (exit app or pop stack if managed by Router, but here it's main tab)
    };

    const backHandler = BackHandler.addEventListener('hardwareBackPress', onBackPress);
    return () => backHandler.remove();
  }, [currentScreen, isScanning, isEcoBotOpen]);

  // Fetch User Stats
  useEffect(() => {
    if (!user) return;
    const fetchStats = async () => {
      try {
        const { data, error } = await supabase.from('profiles').select('points, total_co2_saved, recycled_items').eq('id', user.id).single();
        if (data) {
          setGlobalStats({
            points: data.points || 0,
            savedCO2: `${data.total_co2_saved || 0}kg`,
            recycled: (data.recycled_items || 0).toString()
          });
        }
      } catch (error) {
        console.error('Error fetching stats:', error);
      }
    };
    fetchStats();
  }, [user]);

  // Track Collector Updates
  useEffect(() => {
    const channel = supabase.channel('realtime-collectors')
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'collectors' }, (payload: any) => {
        const newLoc = payload.new;
        if (newLoc.id) setCurrentCollectorId(newLoc.id);
        if (newLoc.latitude && newLoc.longitude) {
          setCollectorLocation({ latitude: newLoc.latitude, longitude: newLoc.longitude });
        }
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  // Fetch Collector Profile when ID changes
  useEffect(() => {
    if (currentCollectorId) {
      supabase.from('profiles').select('contact_number, full_name, avatar_url').eq('id', currentCollectorId).single()
        .then(({ data }) => {
          if (data?.contact_number) setCollectorPhone(data.contact_number);
          setCollectorName(data?.full_name || "Assigned Collector");
          setCollectorAvatar(data?.avatar_url || null);
        });
    }
  }, [currentCollectorId]);

  // Fetch Recent Transactions (Activity Feed)
  useEffect(() => {
    if (!user) return;
    const fetchHistory = async () => {
      const { data } = await supabase.from('transactions')
        .select('*')
        .eq('contributor_id', user.id)
        .order('created_at', { ascending: false })
        .limit(3);
      if (data) setRecentTransactions(data);
    };
    fetchHistory();
  }, [user, pendingTransaction]); // Refresh when user logs in or a transaction finishes

  // --- TRANSACTION LISTENER (Contributor) ---
  useEffect(() => {
    if (!user) return;

    // 1. Initial Check
    const checkPending = async () => {
      const { data } = await supabase.from('transactions').select('*').eq('contributor_id', user.id).eq('status', 'pending').order('created_at', { ascending: false }).limit(1).single();
      if (data) setPendingTransaction(data);
    };
    checkPending();

    // 2. Realtime Listener
    const channel = supabase.channel(`verifications-${user.id}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'transactions', filter: `contributor_id=eq.${user.id}` }, (payload) => {
        if (payload.new.status === 'pending') {
          setPendingTransaction(payload.new);
        }
      })
      .subscribe();

    // 3. Polling Fallback (Every 3s) - To ensure reliability
    const interval = setInterval(checkPending, 3000);

    return () => {
      supabase.removeChannel(channel);
      clearInterval(interval);
    };
  }, [user]);

  // Chat Updates
  useEffect(() => {
    if (!deviceId) return;

    // Fetch history (simplified to get all messages for this device)
    const fetchHistory = async () => {
      const { data } = await supabase.from('messages').select('*')
        .or(`sender_id.eq.${deviceId},receiver_id.eq.${deviceId}`)
        .order('created_at', { ascending: true });
      if (data) setMessages(data);
    };
    fetchHistory();

    const channel = supabase.channel('chat-room-contributor')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, (payload) => {
        const newMsg = payload.new as ChatMessage;

        // Check if the message is relevant to us
        const isForMe = newMsg.receiver_id === deviceId;
        const isFromMe = newMsg.sender_id === deviceId;

        if (isForMe || isFromMe) {
          setMessages(prev => {
            // Avoid duplicates
            if (prev.some(m => m.id === newMsg.id)) return prev;
            return [...prev, newMsg];
          });

          // If we received a message and don't have a collector ID yet, set it
          if (isForMe) {
            setCurrentCollectorId(newMsg.sender_id);
          }
        }
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [deviceId]);

  // --- PRIVACY & NAVIGATION HELPERS ---
  const clearTrackingState = () => {
    setCollectorLocation(null);
    setCurrentCollectorId(null);
    setCollectorPhone(null);
    setCollectorName(null);
    setCollectorAvatar(null);
    setRouteInfo(null);
    setIsChatOpen(false);
  };

  // --- JOB STATUS LISTENER (Privacy Redirect) ---
  useEffect(() => {
    if (!deviceId) return;

    const channel = supabase.channel(`status-watch-${deviceId}`)
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'contributors',
        filter: `id=eq.${deviceId}`
      }, (payload) => {
        const newStatus = payload.new.status;

        if (newStatus === 'completed') {
          clearTrackingState();
          setCart([]); // Clear cart as well
          setCurrentScreen('home');
          // No alert here to allow for the verification modal's alert to handle it if applicable,
          // but if it's a remote completion, the redirect is smooth.
        } else if (newStatus === 'active' && currentScreen === 'tracking') {
          // If collector unassigns, go back to cart/setup
          clearTrackingState();
          setCurrentScreen('cart');
          Alert.alert("Pickup Cancelled", "The collector is no longer assigned to this session.");
        }
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [deviceId, currentScreen]);

  const analyzeImage = async (base64: string, uri: string) => {
    setAnalyzing(true);
    try {
      const labels = await import("../lib/vision").then(m => m.analyzeImage(base64));
      const { mapLabelsToMaterial } = await import("../lib/materialMapper");
      const result = mapLabelsToMaterial(labels);

      setScannedItem({
        imageUri: uri,
        labels: labels,
        material: result.material,
        points: result.points,
        co2: result.co2 ? `${result.co2}kg` : '0kg', // Dynamic CO2
        co2Value: result.co2, // Raw value for calculation
        name: result.name
      });
      setCurrentScreen('result');
    } catch (error) {
      console.error("Analysis failed:", error);
      Alert.alert(t('actions.error'), t('messages.failAnalyze'));
    } finally {
      setAnalyzing(false);
    }
  };



  const handleScan = async (photo: any) => {
    setIsScanning(false);
    if (photo.base64) {
      analyzeImage(photo.base64, photo.uri);
    }
  };

  const handleAddToCart = async () => {
    if (!scannedItem) return;

    // Guest restriction - must sign in to save data
    if (isGuest || !user) {
      promptGuestSignIn();
      return;
    }

    // 1. Add to local cart
    const newItem = {
      id: Date.now().toString(),
      name: scannedItem.name,
      imageUri: scannedItem.imageUri,
      quantity: 1,
      points: scannedItem.points,
      material: scannedItem.material,
      co2: scannedItem.co2Value || 0 // Store raw CO2
    };
    setCart(prev => [...prev, newItem]);

    // 2. Save to Supabase
    if (deviceId) {
      setLoadingUpload(true); // Reuse loading state or create new one
      try {
        // A. Upload Image to Supabase Storage
        let publicImageUri = scannedItem.imageUri;

        try {
          const fileName = `${deviceId}/${Date.now()}.jpg`;

          // Use fetch + arrayBuffer() as robust fallback for modern Expo
          const response = await fetch(scannedItem.imageUri);
          const arrayBuffer = await response.arrayBuffer();

          const { data: uploadData, error: uploadError } = await supabase.storage
            .from('scanned_images')
            .upload(fileName, arrayBuffer, {
              contentType: 'image/jpeg',
              upsert: false
            });

          if (uploadError) {
            console.log("Upload error (using local URI fallback):", uploadError);
          } else {
            const { data: publicUrlData } = supabase.storage
              .from('scanned_images')
              .getPublicUrl(fileName);
            publicImageUri = publicUrlData.publicUrl;
          }
        } catch (uploadErr) {
          console.log("Image upload failed completely, using local:", uploadErr);
        }

        // B. Insert into Database with Public URL
        const { error } = await supabase.from('scanned_items').insert({
          contributor_id: deviceId,
          name: scannedItem.name,
          material: scannedItem.material,
          points: scannedItem.points,
          image_uri: publicImageUri,
          co2_saved: scannedItem.co2Value || 0
        });

        if (error) {
          console.error("Supabase insert error:", error);
          Alert.alert("Error", "Failed to save item to database.");
          return;
        }
      } catch (e) {
        console.error("Supabase error:", e);
        Alert.alert("Error", "Failed to connect to database.");
        return;
      } finally {
        setLoadingUpload(false);
      }
    }

    setShowSuccessModal(true);
  };

  const handleManualAdd = async (manualItem: ManualItem) => {
    if (isGuest || !user || !deviceId) {
      promptGuestSignIn();
      return;
    }

    setLoadingUpload(true);
    try {
      // 1. Add to local cart
      const newItem: CartItem = {
        id: Date.now().toString(),
        name: manualItem.name,
        imageUri: manualItem.imageUri,
        quantity: 1,
        points: manualItem.points,
        material: manualItem.material,
        co2: manualItem.co2
      };
      setCart(prev => [...prev, newItem]);

      // 2. Save to Supabase (without image upload for now, using placeholder)
      const { error } = await supabase.from('scanned_items').insert({
        contributor_id: deviceId,
        name: manualItem.name,
        material: manualItem.material,
        points: manualItem.points,
        image_uri: manualItem.imageUri,
        co2_saved: manualItem.co2
      });

      if (error) throw error;
      setShowSuccessModal(true);
    } catch (e) {
      console.error("Manual add error:", e);
      Alert.alert("Error", "Failed to save manual item.");
    } finally {
      setLoadingUpload(false);
    }
  };

  const handleUploadLocation = async () => {
    // Guest restriction - this feature requires login
    if (isGuest || !user) {
      promptGuestSignIn();
      return;
    }

    if (!deviceId) return;

    setLoadingUpload(true);

    // If location is not available, try to fetch it now
    let currentLocation = location;
    if (!currentLocation) {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== "granted") {
          Alert.alert(t('messages.locationNotFound'), "Please enable location permissions.");
          setLoadingUpload(false);
          return;
        }
        const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
        currentLocation = { latitude: loc.coords.latitude, longitude: loc.coords.longitude };
        setLocation(currentLocation); // Update state for future use
      } catch (error) {
        console.error("Location fetch error:", error);
        Alert.alert(t('messages.locationNotFound'), t('messages.waitLocation'));
        setLoadingUpload(false);
        return;
      }
    }

    try {
      const { error } = await supabase.from("contributors").upsert(
        [{ id: deviceId, latitude: currentLocation.latitude, longitude: currentLocation.longitude, status: 'active' }],
        { onConflict: "id" }
      );
      if (error) throw error;
      Alert.alert(`✅ ${t('actions.requestSent')}`, t('actions.waitingForCollector'));
    } catch (error: any) {
      Alert.alert(t('actions.error'), error.message);
    } finally {
      setLoadingUpload(false);
    }
  };

  const handleSendMessage = async (text: string) => {
    if (!currentCollectorId || !deviceId) return;
    await supabase.from('messages').insert({
      sender_id: deviceId,
      receiver_id: currentCollectorId,
      content: text
    });
  };

  const handleCallCollector = () => {
    if (collectorPhone) {
      Linking.openURL(`tel:${collectorPhone}`);
    } else {
      Alert.alert("No Phone Number", "The collector has not provided a contact number.");
    }
  };

  // New Verification Confirm Logic
  const handleVerifyTransaction = async () => {
    if (!user || !pendingTransaction) return;

    try {
      // 1. Calculate Commissions
      const weight = pendingTransaction.weight_kg;
      const commissionRate = GameMechanics.COMMISSION.RATE_PER_KG;
      const commission = weight * commissionRate;

      // 2. Update Transaction Status AND Commission
      const { error } = await supabase.from('transactions')
        .update({
          status: 'confirmed',
          commission_amount: commission
        })
        .eq('id', pendingTransaction.id);

      if (error) throw error;

      // 3. Credit Collector Wallet
      // Note: In a real app, use an RPC for atomic increment. Here we do read-modify-write for simplicity.
      const collectorId = pendingTransaction.collector_id;
      if (collectorId) {
        const { data: collectorData } = await supabase.from('collectors').select('wallet_balance').eq('id', collectorId).single();
        const currentBalance = Number(collectorData?.wallet_balance || 0);
        await supabase.from('collectors').update({
          wallet_balance: currentBalance + commission
        }).eq('id', collectorId);
      }

      // 4. Calculate User Stats
      // Assuming 1kg = 10 points (simplified rule for general waste/mix) or using cart data if available. 
      // Better: Use a fixed rate per KG for now since we don't know exact material mix in transaction.
      // Let's assume 10 points per KG and 0.5kg CO2 per KG for generic mixed recycling.
      // const weight = pendingTransaction.weight_kg; // Already defined above
      const earnedPoints = Math.round(weight * GameMechanics.POINTS.PER_KG);
      const earnedCO2 = weight * GameMechanics.POINTS.CO2_PER_KG;
      const totalItems = cart.length || 1; // Fallback if cart cleared

      // 3. Update Profile
      const { data: currentData } = await supabase.from('profiles').select('points, total_co2_saved, recycled_items').eq('id', user.id).single();
      const currentPoints = currentData?.points || 0;
      const currentCO2 = currentData?.total_co2_saved || 0;
      const currentRecycled = currentData?.recycled_items || 0;

      await supabase.from('profiles').update({
        points: currentPoints + earnedPoints,
        total_co2_saved: currentCO2 + earnedCO2,
        recycled_items: currentRecycled + totalItems
      }).eq('id', user.id);

      // 4. Link Scanned Items to this Transaction
      const { data: updatedItems, error: itemUpdateError } = await supabase
        .from('scanned_items')
        .update({ transaction_id: pendingTransaction.id })
        .eq('contributor_id', user.id)
        .is('transaction_id', null)
        .select();

      console.log("Linking items for user:", user.id, "Transaction:", pendingTransaction.id);
      if (itemUpdateError) {
        console.error("Failed to link items:", itemUpdateError);
        Alert.alert("Warning", "Could not link items to transaction history.");
      } else {
        console.log("Successfully linked items count:", updatedItems?.length);
      }

      // 5. Update Local State & UI
      setGlobalStats(prev => ({
        points: prev.points + earnedPoints,
        savedCO2: `${(((parseFloat(prev.savedCO2) || 0) + earnedCO2)).toFixed(2)}kg`,
        recycled: (parseInt(prev.recycled) + totalItems).toString()
      }));

      setPendingTransaction(null);
      setCart([]);

      // Clear Tracking State using helper
      clearTrackingState();

      setCurrentScreen('home');
      Alert.alert(t('actions.collectionVerified'), t('actions.youEarnedPoints').replace('{points}', earnedPoints.toString()).replace('{weight}', weight));

    } catch (e: any) {
      console.error("Verification failed:", e);
      Alert.alert(t('actions.error'), t('messages.failConfirm'));
    }
  };

  const handleDeclineTransaction = async () => {
    if (!pendingTransaction) return;
    // Optionally update status to 'rejected'
    setPendingTransaction(null);
  }

  // Legacy manual confirm (now used as fallback/simulation if needed, or removed)
  const handleConfirmCollection = async () => {
    Alert.alert("Waiting for Collector", t('messages.waitingForVerification'));
  };

  // --- THEME CONSTANTS (EcoContributor) ---
  const CONTRIBUTOR_THEME = {
    light: {
      primary: "#2D5A27", // Sophisticated Forest Green
      secondary: "#4A7043",
      background: "#F8F9F8", // Off-white/Creamy
      card: "#FFFFFF",
      text: "#1e293b", // slate-800
      textSecondary: "#64748b", // slate-500
      border: "#f1f5f9", // slate-100
    },
    dark: {
      primary: "#4ADE80", // Neon Green for Dark Mode (adjusted for visibility)
      secondary: "#2D5A27",
      background: "#121412", // Dark background
      card: "#1E201E", // Dark card
      text: "#f1f5f9", // slate-100
      textSecondary: "#94a3b8", // slate-400
      border: "#334155", // slate-700
    }
  };

  const theme = isDark ? CONTRIBUTOR_THEME.dark : CONTRIBUTOR_THEME.light;

  const renderBottomNav = () => {
    if (currentScreen === 'result' || currentScreen === 'tracking') return null;

    return (
      <>
        {/* Transparent Spacer for Content */}
        <View style={{ height: 100 }} />

        {/* Floating Nav */}
        <View style={[styles.floatingNavContainer, { paddingBottom: insets.bottom + 10 }]}>
          <View style={[styles.floatingNav, { backgroundColor: isDark ? 'rgba(30,32,30,0.95)' : 'rgba(255,255,255,0.95)', borderColor: theme.border }]}>

            {/* Left Items */}
            <TouchableOpacity onPress={() => setCurrentScreen('home')} style={styles.navItem}>
              <Ionicons name={currentScreen === 'home' ? "home" : "home-outline"} size={24} color={currentScreen === 'home' ? theme.primary : theme.textSecondary} />
              <Text style={[styles.navLabel, { color: currentScreen === 'home' ? theme.primary : theme.textSecondary }]}>{t('tabs.home')}</Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={() => setCurrentScreen('tracking')} style={styles.navItem}>
              <Ionicons name="location-outline" size={24} color={theme.textSecondary} />
              <Text style={[styles.navLabel, { color: theme.textSecondary }]}>{t('tabs.stations')}</Text>
            </TouchableOpacity>

            {/* Center Camera Button */}
            <View style={styles.centerBtnContainer}>
              <TouchableOpacity
                onPress={pickImage}
                style={[styles.cameraButton, { backgroundColor: "#2D5A27", borderColor: theme.background }]} // Always Forest Green for brand identity
              >
                <Ionicons name="camera" size={28} color="#fff" />
              </TouchableOpacity>
            </View>

            {/* Right Items */}
            <TouchableOpacity onPress={() => setCurrentScreen('cart')} style={styles.navItem}>
              <View>
                <Ionicons name={currentScreen === 'cart' ? "cart" : "cart-outline"} size={24} color={theme.textSecondary} />
                {cart.length > 0 && <View style={styles.cartBadge} />}
              </View>
              <Text style={[styles.navLabel, { color: theme.textSecondary }]}>{t('tabs.store')}</Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={() => setCurrentScreen('profile')} style={styles.navItem}>
              <Ionicons name={currentScreen === 'profile' ? "person" : "person-outline"} size={24} color={theme.textSecondary} />
              <Text style={[styles.navLabel, { color: theme.textSecondary }]}>{t('tabs.account')}</Text>
            </TouchableOpacity>

          </View>
        </View>
      </>
    );
  };

  // ... (Keep existing Success/Verification Modals but update their colors to use `theme`)

  const renderSuccessModal = () => (
    <Modal visible={showSuccessModal} transparent animationType="fade">
      <View style={styles.modalOverlay}>
        <View style={[styles.successCard, { backgroundColor: theme.card }]}>
          <View style={[styles.successImageCircle, { backgroundColor: isDark ? '#1a331a' : '#E8F5E9', borderColor: theme.card }]}>
            <Image source={{ uri: scannedItem?.imageUri }} style={styles.successImage} />
          </View>
          <Text style={[styles.successTitle, { color: theme.text }]}>{t('actions.success')}</Text>
          <TouchableOpacity
            style={[styles.primaryButton, { width: '100%', marginTop: 20, backgroundColor: theme.primary }]}
            onPress={() => {
              setShowSuccessModal(false);
              setCurrentScreen('cart');
            }}
          >
            <View style={styles.badgeBtn}>
              <View style={styles.countBadge}><Text style={styles.countText}>{cart.length}</Text></View>
              <Text style={styles.primaryButtonText}>{t('actions.viewCart')}</Text>
            </View>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );

  const renderVerificationModal = () => (
    <Modal visible={!!pendingTransaction} transparent animationType="slide">
      <View style={styles.modalOverlay}>
        <View style={[styles.successCard, { backgroundColor: theme.card }]}>
          <View style={{ backgroundColor: isDark ? '#1a331a' : '#E8F5E9', padding: 20, borderRadius: 50, marginBottom: 20 }}>
            <Text style={{ fontSize: 40 }}>⚖️</Text>
          </View>
          <Text style={[styles.successTitle, { color: theme.text }]}>{t('actions.verifyCollection')}</Text>
          <Text style={{ textAlign: 'center', color: theme.textSecondary, marginTop: 10, fontSize: 16 }}>
            {t('messages.collectorWeighed')}
          </Text>
          <Text style={{ fontSize: 48, fontWeight: 'bold', color: theme.primary, marginVertical: 20 }}>
            {pendingTransaction?.weight_kg} <Text style={{ fontSize: 24, color: '#666' }}>kg</Text>
          </Text>

          <TouchableOpacity
            style={[styles.primaryButton, { width: '100%', backgroundColor: theme.primary }]}
            onPress={handleVerifyTransaction}
          >
            <Text style={styles.primaryButtonText}>{t('actions.confirmCollectPoints')}</Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={handleDeclineTransaction} style={{ marginTop: 15, padding: 10 }}>
            <Text style={{ color: 'red', fontWeight: '600' }}>{t('actions.incorrectWeight')}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );

  return (
    <View style={[styles.container, { paddingTop: insets.top, backgroundColor: theme.background }]}>
      {currentScreen === 'home' && (
        <HomeView
          stats={globalStats}
          userLocation={location}
          avatarUrl={user?.user_metadata?.avatar_url}
          recentTransactions={recentTransactions}
          onStartScan={pickImage}
          onManualAdd={() => setManualModalOpen(true)}
          onProfilePress={() => setCurrentScreen('profile')}
        />
      )}

      {currentScreen === 'result' && scannedItem && (
        <ScanResultView
          item={scannedItem}
          onAddToCart={handleAddToCart}
          onCancel={() => { setScannedItem(null); setCurrentScreen('home'); }}
        />
      )}

      {currentScreen === 'cart' && (
        <CartView
          cart={cart}
          onUpdateQuantity={(id, delta) => {
            setCart(prev => prev.map(item => item.id === id ? { ...item, quantity: Math.max(0, item.quantity + delta) } : item).filter(i => i.quantity > 0));
          }}
          onAddMore={pickImage}
          onReviewAddress={async () => {
            // Guest restriction - must sign in to request pickup
            if (isGuest || !user) {
              promptGuestSignIn();
              return;
            }
            // Trigger location share automatically
            await handleUploadLocation();
            setCurrentScreen('tracking');
          }}
          onBack={() => setCurrentScreen('home')}
        />
      )}

      {currentScreen === 'tracking' && (
        <TrackingView
          userLocation={location}
          collectorLocation={collectorLocation}
          routeInfo={routeInfo}
          loading={loadingUpload}
          onShareLocation={handleUploadLocation}
          onOpenChat={() => setIsChatOpen(true)}
          onCallCollector={handleCallCollector}
          onBack={() => setCurrentScreen('cart')}
          setRouteInfo={setRouteInfo}
          onConfirmCollection={cart.length > 0 ? handleConfirmCollection : undefined}
          collectorName={collectorName || undefined}
          collectorAvatar={collectorAvatar || undefined}
        />
      )}


      {currentScreen === 'profile' && (
        <ProfileView
          stats={globalStats}
          user={user}
          onViewHistory={() => {
            setCurrentScreen('home');
            Alert.alert(t('common.tip'), t('messages.scrollTip'));
          }}
        />
      )}

      {renderBottomNav()}
      {renderSuccessModal()}
      {renderVerificationModal()}

      <ChatModal
        visible={isChatOpen}
        onClose={() => setIsChatOpen(false)}
        messages={messages}
        currentUserId={deviceId}
        onSendMessage={handleSendMessage}
      />

      <EcoBot visible={isEcoBotOpen} onClose={() => setIsEcoBotOpen(false)} />

      <ManualItemEntryModal
        visible={isManualModalOpen}
        onClose={() => setManualModalOpen(false)}
        onAdd={handleManualAdd}
      />

      {/* Floating Eco-Bot Button */}
      {currentScreen === 'home' && (
        <TouchableOpacity
          style={[styles.ecoFab, { backgroundColor: theme.card, borderColor: theme.border }]}
          onPress={() => setIsEcoBotOpen(true)}
        >
          <Text style={{ fontSize: 28 }}>🤖</Text>
        </TouchableOpacity>
      )}

      {isScanning && (
        <Modal visible={true} animationType="slide">
          <ScannerView
            onScan={handleScan}
            onClose={() => setIsScanning(false)}
          />
        </Modal>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  // Bottom Nav Styles
  floatingNavContainer: { position: 'absolute', bottom: 0, left: 0, right: 0, paddingHorizontal: 24 },
  floatingNav: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderRadius: 32, paddingVertical: 12, paddingHorizontal: 16, borderTopWidth: 1, shadowColor: "#000", shadowOpacity: 0.1, shadowRadius: 20, elevation: 10 },
  navItem: { alignItems: 'center', padding: 8 },
  navLabel: { fontSize: 10, fontWeight: '700', marginTop: 2 },
  centerBtnContainer: { position: 'relative', top: -25 },
  cameraButton: { width: 64, height: 64, borderRadius: 32, justifyContent: 'center', alignItems: 'center', borderWidth: 4, shadowColor: "#2D5A27", shadowOpacity: 0.3, shadowRadius: 10, elevation: 8 },

  cartBadge: { position: 'absolute', top: 0, right: 0, width: 8, height: 8, borderRadius: 4, backgroundColor: 'red' },

  // Modal & Other Styles
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', alignItems: 'center' },
  successCard: { width: '85%', borderRadius: 32, padding: 32, alignItems: 'center', elevation: 20 },
  successImageCircle: { width: 100, height: 100, borderRadius: 50, justifyContent: 'center', alignItems: 'center', marginBottom: 24, borderWidth: 6, marginTop: -70, shadowColor: "#000", shadowOpacity: 0.1, elevation: 5 },
  successImage: { width: 50, height: 80, resizeMode: 'contain' },
  successTitle: { fontSize: 24, fontWeight: '800' },
  primaryButton: { paddingVertical: 18, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  badgeBtn: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  countBadge: { backgroundColor: 'rgba(255,255,255,0.3)', width: 24, height: 24, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  countText: { color: '#fff', fontWeight: 'bold', fontSize: 12 },
  primaryButtonText: { color: '#fff', fontSize: 16, fontWeight: '700' },

  // FAB
  ecoFab: { position: 'absolute', bottom: 130, right: 24, width: 56, height: 56, borderRadius: 28, justifyContent: 'center', alignItems: 'center', shadowColor: "#000", shadowOpacity: 0.15, shadowRadius: 10, elevation: 6, borderWidth: 1 }
});



import { FontAwesome, Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Location from 'expo-location';
import { useRouter } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Alert, Dimensions, Image, Linking, Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import MapViewDirections from 'react-native-maps-directions';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import WeightVerificationModal from '../../components/collector/WeightVerificationModal';
import ChatModal from '../../components/contributor/ChatModal';
import JobDetailModal from '../../components/JobDetailModal';
import { GameMechanics } from '../../constants/GameMechanics';
import { useAuth } from '../../contexts/AuthContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { useTheme } from '../../contexts/ThemeContext';
import { getHaversineDistance, Point, RouteMetrics, solveRealTSP } from '../../lib/algorithms';
import { supabase } from '../../lib/supabase';
import { ChatMessage, CollectorAppState, Job, MapType } from '../../types';
import { appleMapStyle } from '../appleMapStyle';

// --- Configuration ---
/** Google Maps API Key from environment variables. Essential for MapView and Directions API. */
const GOOGLE_MAPS_API_KEY = process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY!;
const { width, height } = Dimensions.get('window');

// --- Navigation Config ---
/** Configuration for the map camera when in driving mode (pitch, zoom, altitude). */
const DRIVING_VIEW_CONFIG = GameMechanics.MAP.DRIVING_VIEW;

// --- Styles ---
// Removed local appleMapStyle to use imported one for consistency

/**
 * CollectorHomeScreen Component
 * 
 * This is the main operational dashboard for Collectors (Drivers).
 * It handles:
 * 1. Map visualization and navigation (Google Maps).
 * 2. Real-time job searching and routing (Multi-stop optimization).
 * 3. Collecting waste and verifying weights.
 * 4. Chatting with contributors.
 * 
 * Architecture:
 * - Uses a state machine (`appState`) to manage UI modes (idle, searching, navigating, driving, etc.).
 * - Integrates with Supabase Realtime for chat and transaction updates.
 * - Uses Expo Location for high-accuracy tracking during active trips.
 */
export default function CollectorHomeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const mapRef = useRef<MapView>(null);
  const { colors, isDark } = useTheme();
  const { t } = useLanguage();
  const { user } = useAuth();

  // --- Main Application State ---
  /**
   * Primary state machine for the collector's workflow.
   * - `idle`: Default state, waiting to search.
   * - `searching`: Finding nearby jobs.
   * - `request_received`: Jobs found, potential queue building.
   * - `navigating`: Route accepted, showing overview.
   * - `driving`: Turn-by-turn navigation active.
   * - `arrived`: At pickup location.
   * - `completed`: Job finished, showing summary.
   */
  const [appState, setAppState] = useState<CollectorAppState>('idle');

  /** Current map viewport region. Updates on user interaction or location changes. */
  const [region, setRegion] = useState({
    latitude: 3.1390,
    longitude: 101.6869,
    latitudeDelta: 0.05,
    longitudeDelta: 0.05,
  });
  const [permission, setPermission] = useState(false);

  // --- Job & Queue State ---
  /** List of fetched potential jobs nearby. */
  const [availableJobs, setAvailableJobs] = useState<Job[]>([]);
  /** The currently focused job (for navigation or details). */
  const [activeJob, setActiveJob] = useState<Job | null>(null);
  /** 
   * Queue of jobs for multi-stop routing. 
   * Users can add multiple jobs to this queue before starting the route.
   */
  const [activeQueue, setActiveQueue] = useState<Job[]>([]);
  const [showDetailModal, setShowDetailModal] = useState(false);

  /** Calculated route metrics (distance/duration) from Directions API. */
  const [routeInfo, setRouteInfo] = useState<{ distance: number, duration: number } | null>(null);
  const [mapType, setMapType] = useState<MapType>('standard');
  /** ID of the current logged-in collector (derived from Auth). */
  const [collectorId, setCollectorId] = useState<string | null>(null);

  // --- Navigation & Routing Preferences ---
  /**
   * `internal`: Use in-app turn-by-turn overlay.
   * `external`: Launch Google Maps/Waze app.
   */
  const [navigationMode, setNavigationMode] = useState<'internal' | 'external'>('internal');
  /**
   * `standard`: Fastest route.
   * `green`: Eco-friendly route optimization (if implemented).
   */
  const [algorithmMode, setAlgorithmMode] = useState<'standard' | 'green'>('standard');

  // Helper to re-optimize whenever mode or queue changes
  const reoptimizeRoute = async (mode: 'standard' | 'green') => {
    if (activeQueue.length < 2) return;

    const startPoint: Point = { id: 'start', latitude: region.latitude, longitude: region.longitude };
    try {
      const result = await solveRealTSP(startPoint, activeQueue, GOOGLE_MAPS_API_KEY, mode);
      const optimizedJobs = result.path.slice(1).map(p =>
        activeQueue.find(j => j.id === p.id)
      ).filter(Boolean) as Job[];

      setActiveQueue(optimizedJobs);
      setRouteMetrics(result.metrics);
      setActiveJob(optimizedJobs[0]);
    } catch (err) {
      console.error("Optimization failed:", err);
    }
  };

  // --- Real-time Navigation Logic ---
  /** Full list of maneuvers/steps for the current route leg. */
  const routeStepsRef = useRef<any[]>([]);
  /** Index of the current step in `routeStepsRef`. */
  const currentStepIndexRef = useRef(0);
  /** Subscription object for high-frequency location tracking. */
  const [locationSubscription, setLocationSubscription] = useState<Location.LocationSubscription | null>(null);

  // --- Driving UI State ---
  /** Stores the next navigation instruction to display to the driver. */
  const [nextTurn, setNextTurn] = useState({
    instruction: "Ready to start",
    subInstruction: "Head towards pickup",
    distance: "0 m",
    icon: "navigation" as any
  });

  // --- Chat State ---
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);

  // --- Transaction & Weight Verification State ---
  const [isWeightModalOpen, setIsWeightModalOpen] = useState(false);
  const [actualWeight, setActualWeight] = useState("");
  /** True when waiting for contributor to confirm the weight on their device. */
  const [waitingForConfirmation, setWaitingForConfirmation] = useState(false);
  /** ID of the pending transaction, used to listen for confirmation updates. */
  const [currentTransactionId, setCurrentTransactionId] = useState<string | null>(null);
  const [routeMetrics, setRouteMetrics] = useState<RouteMetrics | null>(null);

  // --- Effects ---

  useEffect(() => {
    const initializeCollectorId = async () => {
      if (user) {
        console.log("Logged-in user detected:", user.id);
        setCollectorId(user.id);
      } else {
        try {
          const storedId = await AsyncStorage.getItem('guest_collector_id');
          console.log("Checking storage for guest ID:", storedId);
          if (storedId) {
            setCollectorId(storedId);
          } else {
            const newId = `guest_${Math.random().toString(36).substring(2, 11)}`;
            console.log("Generating new guest ID:", newId);
            await AsyncStorage.setItem('guest_collector_id', newId);
            setCollectorId(newId);
          }
        } catch (e) {
          console.error("AsyncStorage error:", e);
          setCollectorId(`temp_${Math.random().toString(36).substring(2, 8)}`);
        }
      }
    };
    initializeCollectorId();
  }, [user]);


  /**
   * Effect: Location Permission & Initial Position
   * 
   * Requests foreground location permission on mount.
   * If granted, fetches current location and centers the map.
   */
  useEffect(() => {
    (async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission to access location was denied');
        return;
      }
      setPermission(true);

      try {
        let location = await Location.getCurrentPositionAsync({});
        const initialRegion = {
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
          latitudeDelta: 0.05,
          longitudeDelta: 0.05,
        };
        setRegion(initialRegion);

        if (mapRef.current) {
          mapRef.current.animateToRegion(initialRegion, 1000);
        }
      } catch (error) {
        console.log("Error getting initial location:", error);
        // Fallback to a default location or just don't crash
      }
    })();
  }, []);

  /**
   * Effect: Location Tracking Toggle
   * 
   * Monitors `appState` and `navigationMode` to decide if high-frequency tracking
   * should be enabled. Tracking is ONLY active when driving in 'internal' mode.
   */
  useEffect(() => {
    if (appState === 'driving' && navigationMode === 'internal') {
      startLocationTracking();
    } else {
      stopLocationTracking();
    }
    return () => stopLocationTracking();
  }, [appState, navigationMode]);

  // --- Chat Subscription ---
  /**
   * Effect: Real-time Chat Listener
   * 
   * Subscribes to new messages when a specific job is active.
   * - Fetches historical messages between collector and contributor.
   * - Listens for new INSERT events in the `messages` table.
   * 
   * Edge Case: Filters messages to ensure they belong to the current active job context,
   * preventing cross-talk if multiple jobs are active in background (theoretical).
   */
  useEffect(() => {
    if (!activeJob || !collectorId) return;

    console.log("Subscribing to chat. Job ID:", activeJob.id, "Collector ID:", collectorId);

    // Load history
    const fetchHistory = async () => {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .or(`and(sender_id.eq.${collectorId},receiver_id.eq.${activeJob.id}),and(sender_id.eq.${activeJob.id},receiver_id.eq.${collectorId})`)
        .order('created_at', { ascending: true });

      if (error) console.log("Error fetching chat history:", error);
      if (data) setMessages(data);
    };
    fetchHistory();

    // Subscribe to new
    const channel = supabase
      .channel(`chat-home-${collectorId}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, (payload) => {
        const newMsg = payload.new as ChatMessage;
        console.log("New message received:", newMsg);

        const isRelevant =
          (newMsg.sender_id === activeJob.id && newMsg.receiver_id === collectorId) ||
          (newMsg.sender_id === collectorId && newMsg.receiver_id === activeJob.id);

        if (isRelevant) {
          setMessages(prev => {
            // Deduplication check
            if (prev.some(m => m.id === newMsg.id)) return prev;
            return [...prev, newMsg];
          });
        }
      })
      .subscribe((status) => {
        console.log("Chat subscription status:", status);
      });

    return () => { supabase.removeChannel(channel); };
  }, [activeJob, collectorId]);

  // --- Transaction Listener ---
  /**
   * Effect: Transaction Confirmation Listener
   * 
   * Listens for updates to a generic Pending Transaction.
   * If the status changes to 'confirmed' (by Contributors app), it:
   * 1. Closes the modal.
   * 2. Alerts success.
   * 3. Triggers `handleFinishJob` to complete the workflow.
   */
  useEffect(() => {
    if (!currentTransactionId) return;
    const channel = supabase.channel(`transaction-${currentTransactionId}`)
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'transactions', filter: `id=eq.${currentTransactionId}` }, (payload) => {
        if (payload.new.status === 'confirmed') {
          setWaitingForConfirmation(false);
          setIsWeightModalOpen(false);
          setCurrentTransactionId(null);
          setActualWeight("");

          Alert.alert("Success!", "Contributor confirmed.");

          handleFinishJob(); // Auto trigger finish
        }
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [currentTransactionId]);

  // --- Helpers ---

  const stripHtml = (html: string) => html.replace(/<[^>]*>?/gm, '');

  const getIconForManeuver = (maneuver: string | undefined) => {
    if (!maneuver) return "arrow-up";
    if (maneuver.includes("left")) return "arrow-left-top";
    if (maneuver.includes("right")) return "arrow-right-top";
    if (maneuver.includes("uturn")) return "u-turn-left";
    if (maneuver.includes("roundabout")) return "rotate-right";
    if (maneuver.includes("merge")) return "call-merge";
    return "arrow-up";
  };

  // getDistance is now imported from ../../lib/algorithms

  // --- Tracking Logic ---

  /**
   * Starts high-accuracy location tracking.
   * - Used during Navigation/Driving modes.
   * - Updates the map camera to follow the user.
   * - Syncs location to Supabase for the Contributor to see.
   * - Checks progress against the active route steps.
   */
  const startLocationTracking = async () => {
    if (locationSubscription) locationSubscription.remove();
    const sub = await Location.watchPositionAsync(
      { accuracy: Location.Accuracy.High, distanceInterval: 5 },
      (newLocation) => {
        const { latitude, longitude, heading } = newLocation.coords;
        setRegion(prev => ({ ...prev, latitude, longitude }));
        if (mapRef.current) {
          mapRef.current.animateCamera({
            center: { latitude, longitude },
            heading: heading || 0,
            pitch: DRIVING_VIEW_CONFIG.pitch,
            zoom: DRIVING_VIEW_CONFIG.zoom,
            altitude: DRIVING_VIEW_CONFIG.altitude
          }, { duration: 500 });
        }
        updateSupabaseLocation(latitude, longitude);
        checkProgress(latitude, longitude);
      }
    );
    setLocationSubscription(sub);
  };

  const stopLocationTracking = () => {
    if (locationSubscription) {
      locationSubscription.remove();
      setLocationSubscription(null);
    }
  };

  const updateSupabaseLocation = async (lat: number, lng: number) => {
    if (!collectorId) return;
    const { error } = await supabase.from('collectors').upsert({
      id: collectorId,
      latitude: lat,
      longitude: lng,
      updated_at: new Date().toISOString()
    });
    if (error) console.log("Supabase Update Error:", error.message);
  };

  /**
   * Checks if the user has reached the next step in the route.
   * 
   * Algorithm:
   * 1. Get current target step end location.
   * 2. Calculate distance between user and that point.
   * 3. If < 40 meters, advance to next step.
   * 4. Update UI with new instructions.
   * 
   * @param lat Current latitude
   * @param lng Current longitude
   */
  const checkProgress = (lat: number, lng: number) => {
    const steps = routeStepsRef.current;
    const index = currentStepIndexRef.current;

    // Safety check: No route or finished
    if (steps.length === 0 || index >= steps.length) return;

    const currentStep = steps[index];
    const distToTurn = getHaversineDistance(lat, lng, currentStep.end_location.lat, currentStep.end_location.lng);

    // Threshold: 40 meters to consider "arrived" at a waypoint/turn
    if (distToTurn < 40) {
      const nextIndex = index + 1;
      if (nextIndex < steps.length) {
        currentStepIndexRef.current = nextIndex;
        const nextStep = steps[nextIndex];
        setNextTurn({
          instruction: stripHtml(nextStep.html_instructions),
          subInstruction: nextStep.distance.text,
          distance: nextStep.distance.text,
          icon: getIconForManeuver(nextStep.maneuver)
        });
      } else {
        // End of route
        setNextTurn(prev => ({ ...prev, instruction: "Arriving at destination", icon: "flag" }));
        handleArrived();
      }
    } else {
      // Just update distance text
      setNextTurn(prev => ({ ...prev, distance: `${Math.round(distToTurn)} m` }));
    }
  };

  // --- Chat Handlers ---
  const handleSendMessage = async (text: string) => {
    if (!text.trim() || !activeJob || !collectorId) return;
    await supabase.from('messages').insert({
      sender_id: collectorId,
      receiver_id: activeJob.id,
      content: text.trim()
    });
  };

  // --- Handlers ---

  /**
   * Scans for nearby pending jobs using Supabase Geospatial queries (mocked via distance check).
   * 
   * Process:
   * 1. Check current GPS location.
   * 2. Query `contributors` table for users within 50km.
   * 3. Sort by distance.
   * 4. Select closest job as `activeJob`.
   * 5. Transition state to 'request_received'.
   * 
   * Edge Cases:
   * - No GPS permission: Logs error.
   * - No jobs found: Alerts user.
   */
  const handleSearchNow = async () => {
    setAppState('searching');

    // 1. Get Current Location first
    let freshRegion = region;
    try {
      const { status } = await Location.getForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert("Permission Denied", "Location permission is required to find jobs.");
        setAppState('idle');
        return;
      }

      const location = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      freshRegion = {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        latitudeDelta: 0.05,
        longitudeDelta: 0.05
      };
      setRegion(freshRegion);
      if (mapRef.current) mapRef.current.animateToRegion(freshRegion, 1000);
    } catch (e) {
      console.log("Location Error:", e);
      Alert.alert("Location Error", "Could not determine your location.");
      setAppState('idle');
      return;
    }

    try {
      // 2. Fetch Active Contributors OR ones already assigned to this collector
      // Simplified query to avoid nested AND inside OR for better compatibility
      const { data: rawContributors, error } = await supabase
        .from('contributors')
        .select('*')
        .or(`status.eq.active,collector_id.eq.${collectorId}`)
        .limit(50);

      // Filter locally to ensure we only get 'active' OR 'assigned to ME'
      const contributors = (rawContributors || []).filter(c =>
        c.status === 'active' || (c.status === 'assigned' && c.collector_id === collectorId)
      );

      if (error) throw error;

      if (!contributors || contributors.length === 0) {
        Alert.alert("No contributors found", "There are no active contributors online right now.");
        setAppState('idle');
        return;
      }

      const processedJobs: Job[] = [];
      const MAX_DISTANCE_METERS = 10000; // 10km radius

      for (const c of contributors) {
        // Skip self if testing on same device/account (optional but good practice)
        if (c.id === collectorId) continue;

        const dist = getHaversineDistance(freshRegion.latitude, freshRegion.longitude, c.latitude, c.longitude);
        if (dist > MAX_DISTANCE_METERS) continue;

        // Fetch profile
        let phone = '';
        let contributorName = 'Contributor';
        let contributorAvatar = '';

        // Optimisation: Could allow null profile if just showing map pins, but we want details
        const { data: profile } = await supabase.from('profiles').select('contact_number, full_name, avatar_url').eq('id', c.id).single();
        if (profile) {
          phone = profile.contact_number;
          contributorName = profile.full_name || 'Contributor';
          contributorAvatar = profile.avatar_url;
        }

        processedJobs.push({
          id: c.id,
          latitude: c.latitude,
          longitude: c.longitude,
          address: "Tap to view address",
          wasteType: ['Plastic', 'Paper'], // Placeholder until we fetch real items
          status: 'pending',
          distanceLabel: dist > 1000 ? `${(dist / 1000).toFixed(1)} km` : `${Math.round(dist)} m`,
          rawDistance: dist,
          phoneNumber: phone,
          contributorName: contributorName,
          contributorAvatar: contributorAvatar
        });
      }

      // 3. Check if any jobs remain after filtering
      if (processedJobs.length === 0) {
        Alert.alert("No jobs nearby", "Access contributors found, but they are too far away (>50km).");
        setAppState('idle');
        return;
      }

      // 4. Sort and Set
      processedJobs.sort((a, b) => a.rawDistance - b.rawDistance);
      setAvailableJobs(processedJobs);

      const closest = processedJobs[0];
      resolveAddressForJob(closest);
      setActiveJob(closest);
      setRouteInfo(null);

      // 5. Transition UI (Simulate 'Finding...' delay)
      setTimeout(() => {
        setAppState('request_received');
        if (mapRef.current) {
          mapRef.current.fitToCoordinates(
            [{ latitude: freshRegion.latitude, longitude: freshRegion.longitude }, { latitude: closest.latitude, longitude: closest.longitude }],
            { edgePadding: { top: 100, right: 50, bottom: 300, left: 50 }, animated: true }
          );
        }
      }, 1500);

    } catch (err: any) {
      console.error("Search Error:", err);
      Alert.alert("Error", err.message || "Failed to search for jobs.");
      setAppState('idle');
    }
  };

  const resolveAddressForJob = async (job: Job) => {
    try {
      const reverseGeocode = await Location.reverseGeocodeAsync({ latitude: job.latitude, longitude: job.longitude });
      if (reverseGeocode.length > 0) {
        const item = reverseGeocode[0];
        const address = `${item.street || ''} ${item.name || ''}, ${item.city || ''}`.replace(/^ , /, '').replace(/, $/, '').trim();
        setAvailableJobs(prev => prev.map(j => j.id === job.id ? { ...j, address: address || "Unknown Location" } : j));
        setActiveJob(prev => (prev && prev.id === job.id) ? { ...prev, address: address || "Unknown Location" } : prev);
      }
    } catch (e) { console.log(e); }
  };

  useEffect(() => {
    if (!collectorId) return;

    const recoverSession = async () => {
      console.log("Recovery: Checking for active assigned pickups for:", collectorId);
      const { data: activePickups, error } = await supabase
        .from('contributors')
        .select('*')
        .eq('status', 'assigned')
        .eq('collector_id', collectorId)
        .limit(1);

      if (error) {
        console.log("Recovery check failed:", error.message);
        return;
      }

      if (activePickups && activePickups.length > 0) {
        const c = activePickups[0];
        console.log("Recovery: Found active pickup:", c.id);

        // Fetch profile details if possible
        const { data: profile } = await supabase
          .from('profiles')
          .select('contact_number, full_name, avatar_url')
          .eq('id', c.id)
          .single();

        const recoveredJob: Job = {
          id: c.id,
          latitude: c.latitude,
          longitude: c.longitude,
          address: "Pickup Location",
          wasteType: ['Plastic', 'Paper'],
          status: 'assigned', // Critical: reflect the actual assigned status
          distanceLabel: "Continuing...",
          rawDistance: 0,
          phoneNumber: profile?.contact_number || '',
          contributorName: profile?.full_name || 'Contributor',
          contributorAvatar: profile?.avatar_url || ''
        };

        setActiveJob(recoveredJob);
        setAppState('navigating');
        resolveAddressForJob(recoveredJob);
      }
    };
    recoverSession();
  }, [collectorId]);

  const handleMarkerPress = (job: Job) => {
    setActiveJob(job);
    setRouteInfo(null);
    if (job.address === "Tap to view address") resolveAddressForJob(job);
    setShowDetailModal(true);
  };

  const handleAddToQueue = () => {
    if (!activeJob) return;

    // Add to queue if not already there
    setActiveQueue(prev => {
      if (prev.find(j => j.id === activeJob.id)) return prev;
      return [...prev, activeJob];
    });

    // Reset view to searching/idle context but keep job selected or deselect?
    // Let's keep it selected so they see it's added.
    Alert.alert("Added to Route", "Job added to your pickup queue.");
    // Optionally: clear activeJob to allow selecting others?
    // setActiveJob(null);
  };

  /**
   * Initiates the optimized route for multiple pickups.
   * 
   * Logic:
   * 1. Collects all jobs in `activeQueue`.
   * 2. Runs TSP (Traveling Salesperson) optimization algorithm (Standard or Green).
   * 3. Reorders queue based on optimal path.
   * 4. Auto-accepts the first job in the new sequence.
   */
  const handleStartRoute = () => {
    if (activeQueue.length === 0) {
      if (activeJob) {
        // Just start single
        handleAcceptJob(activeJob);
      }
      return;
    }

    // Optimize Route using Real Google Data (Matrix + Elevation)
    const startPoint: Point = { id: 'start', latitude: region.latitude, longitude: region.longitude };

    // Set a loading state before starting async optimization
    setAppState('searching');

    solveRealTSP(startPoint, activeQueue, GOOGLE_MAPS_API_KEY, algorithmMode)
      .then(result => {
        // Map Point results back to the original Job objects to preserve all fields (address, name, etc.)
        const optimizedJobs = result.path.slice(1).map(p =>
          activeQueue.find(j => j.id === p.id)
        ).filter(Boolean) as Job[];

        setActiveQueue(optimizedJobs);
        setRouteMetrics(result.metrics); // Store for research display
        handleAcceptJob(optimizedJobs[0]);

        console.log("Real Road Results:", result.metrics);
      })
      .catch(err => {
        console.error("TSP Error:", err);
        Alert.alert("Optimization Error", "Failed to calculate real-world route.");
        setAppState('request_received');
      });
  };

  const handleAcceptJob = async (job: Job) => {
    if (!job || !collectorId) return;

    try {
      // 1. Update contributor status to 'assigned' to hide from other collectors
      console.log("Accepting job, updating status for contributor:", job.id);
      const { data, error } = await supabase
        .from('contributors')
        .update({ status: 'assigned', collector_id: collectorId })
        .eq('id', job.id)
        .select();
      if (error) {
        console.error("Failed to update status to assigned:", error);
        throw error;
      }

      console.log("Status updated to assigned. Rows affected:", data?.length);

      // 2. If it's a single accept (not via handleStartRoute), calculate metrics for research
      if (appState !== 'searching') {
        const startPoint: Point = { id: 'start', latitude: region.latitude, longitude: region.longitude };
        solveRealTSP(startPoint, [job], GOOGLE_MAPS_API_KEY, algorithmMode)
          .then(result => {
            setRouteMetrics(result.metrics);
            console.log("Single Job Real Metrics:", result.metrics);
          })
          .catch(err => console.error("Single Job Metric Error:", err));
      }

      setActiveJob(job);
      setAppState('navigating');
      setAvailableJobs([]);

      if (mapRef.current) {
        mapRef.current.fitToCoordinates(
          [{ latitude: region.latitude, longitude: region.longitude }, { latitude: job.latitude, longitude: job.longitude }],
          { edgePadding: { top: 100, right: 50, bottom: 250, left: 50 }, animated: true }
        );
      }
    } catch (err) {
      console.error("Error accepting job:", err);
      Alert.alert("Error", "Could not assign job to you.");
    }
  };

  const handleDeclineJob = () => {
    setActiveJob(null);
    setAvailableJobs([]);
    // Also remove from queue if it was there
    if (activeJob) {
      setActiveQueue(prev => prev.filter(j => j.id !== activeJob.id));
    }
    setAppState('idle');
  };

  const openMapsNavigation = () => {
    if (!activeJob) return;
    const url = `https://www.google.com/maps/dir/?api=1&destination=${activeJob.latitude},${activeJob.longitude}&travelmode=driving`;
    Linking.openURL(url).catch(err => Alert.alert("Error", "Could not open map app."));
  };

  const fetchRealRouteSteps = async () => {
    if (!activeJob) return;
    try {
      const url = `https://maps.googleapis.com/maps/api/directions/json?origin=${region.latitude},${region.longitude}&destination=${activeJob.latitude},${activeJob.longitude}&key=${GOOGLE_MAPS_API_KEY}`;
      const response = await fetch(url);
      const json = await response.json();
      if (json.routes.length > 0 && json.routes[0].legs.length > 0) {
        const steps = json.routes[0].legs[0].steps;
        routeStepsRef.current = steps;
        currentStepIndexRef.current = 0;
        if (steps.length > 0) {
          const firstStep = steps[0];
          setNextTurn({ instruction: stripHtml(firstStep.html_instructions), subInstruction: "Continue straight", distance: firstStep.distance.text, icon: getIconForManeuver(firstStep.maneuver) });
        }
      }
    } catch (error) { console.log(error); setNextTurn(prev => ({ ...prev, instruction: "Follow map route" })); }
  };

  const handleStartRide = () => {
    Alert.alert(t('collector.startNav'), t('collector.chooseNav'), [
      { text: "Open Google Maps", onPress: () => { setNavigationMode('external'); setAppState('driving'); openMapsNavigation(); if (mapRef.current) mapRef.current.animateCamera({ center: { latitude: region.latitude, longitude: region.longitude }, pitch: 0, zoom: 16 }); } },
      { text: "Use In-App Map", onPress: () => { setNavigationMode('internal'); setAppState('driving'); fetchRealRouteSteps(); if (mapRef.current) mapRef.current.animateCamera({ center: { latitude: region.latitude, longitude: region.longitude }, heading: 0, pitch: DRIVING_VIEW_CONFIG.pitch, zoom: DRIVING_VIEW_CONFIG.zoom, altitude: DRIVING_VIEW_CONFIG.altitude }, { duration: 1000 }); }, style: "default" },
      { text: t('common.cancel'), style: "cancel" }
    ]);
  };

  const handleArrived = () => {
    setAppState('arrived');
    stopLocationTracking();
    if (mapRef.current) mapRef.current.animateCamera({ pitch: 0, zoom: 18, center: { latitude: activeJob!.latitude, longitude: activeJob!.longitude } });
  };

  const handleCollected = () => {
    setIsWeightModalOpen(true);
  };

  /**
   * Submits the verified weight to the server.
   * Creates a 'pending' transaction that the Contributor must verify on their device.
   * 
   * Validation:
   * - Weight must be a valid number > 0.
   * 
   * Side Effects:
   * - Creates `transactions` record.
   * - Sets `waitingForConfirmation` to true, blocking UI.
   */
  const submitWeight = async () => {
    if (!actualWeight || isNaN(parseFloat(actualWeight)) || !activeJob || !collectorId) {
      Alert.alert("Invalid Input", "Please enter a valid weight in kg.");
      return;
    }

    setWaitingForConfirmation(true);
    try {
      const { data, error } = await supabase.from('transactions').insert({
        collector_id: collectorId,
        contributor_id: activeJob.id,
        weight_kg: parseFloat(actualWeight),
        status: 'pending'
      }).select().single();

      if (error) throw error;
      if (data) setCurrentTransactionId(data.id);

    } catch (e: any) {
      Alert.alert("Error", e.message);
      setWaitingForConfirmation(false);
    }
  };
  /**
   * Completes the current job and advances to the next one.
   * 
   * Flow:
   * 1. Remove current job from queue.
   * 2. Check for next job.
   * 3. IF next job exists -> Auto-route to it.
   * 4. ELSE -> Show completion screen ('completed' state).
   */
  const handleFinishJob = async () => {
    // 1. Update contributor status to 'completed'
    if (activeJob) {
      console.log("Finishing job, updating status for contributor:", activeJob.id);
      const { data, error } = await supabase
        .from('contributors')
        .update({ status: 'completed' })
        .eq('id', activeJob.id)
        .select();

      if (error) {
        console.error("Failed to update status to completed:", error);
      } else {
        console.log("Status updated to completed. Rows affected:", data?.length);
      }
      setActiveQueue(prev => prev.filter(j => j.id !== activeJob!.id));
    }

    // Check if more jobs exist
    const remainingQueue = activeQueue.filter(j => j.id !== activeJob?.id);

    if (remainingQueue.length > 0) {
      const nextJob = remainingQueue[0];
      Alert.alert("Job Complete", `Routing to next pickup: ${nextJob.address}...`);
      handleAcceptJob(nextJob);
    } else {
      Alert.alert("All Done!", "Route completed.");
      setAppState('completed'); // Shows the "RM 5" screen
      // delay reset
      setTimeout(() => {
        setActiveJob(null);
        setAvailableJobs([]);
        setRouteInfo(null);
        setAppState('idle');
      }, 3000);
    }
  };
  const handleMapTypeToggle = () => setMapType(prev => (prev === 'standard' ? 'satellite' : prev === 'satellite' ? 'hybrid' : 'standard'));

  // --- Render Components ---

  // Weight modal now uses extracted component

  // Chat modal now uses extracted ChatModal component

  /**
   * Renders the popup when a job request is received (activeJob selected).
   * Shows address, distance, and 'Accept'/'Decline' buttons.
   * Also allows toggling the Algorithm Mode (Standard vs Green).
   */
  const renderRequestPopup = () => (
    <View style={[styles.requestCard, { bottom: 100 + insets.bottom, backgroundColor: isDark ? 'rgba(30,30,30,0.85)' : 'rgba(255,255,255,0.9)', borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)' }]}>
      <View style={styles.requestHeader}>
        <TouchableOpacity onPress={() => setShowDetailModal(true)}>
          <Image source={{ uri: activeJob?.contributorAvatar || "https://i.pravatar.cc/150?u=default" }} style={styles.requestAvatar} />
        </TouchableOpacity>
        <View style={{ marginLeft: 15, flex: 1 }}>
          <Text style={[styles.requestAddress, { color: colors.text }]}>{activeJob?.address}</Text>
          <Text style={[styles.requestDistance, { color: colors.textSecondary }]}>
            {routeInfo ?
              `${(routeInfo.distance).toFixed(2)} km • ${(routeInfo.duration).toFixed(0)} min` :
              `${activeJob?.distanceLabel} • Estimating...`
            }
          </Text>
        </View>
        <View style={[styles.queueBadge, { backgroundColor: colors.primary + '20' }]}>
          <Text style={[styles.queueText, { color: colors.primary }]}>{activeQueue.length + 1}th Stop</Text>
        </View>
      </View>

      {/* Algorithm Toggle - Modern Pill */}
      <View style={[styles.algoTogglePill, { backgroundColor: isDark ? 'rgba(0,0,0,0.3)' : '#F1F5F9' }]}>
        <TouchableOpacity
          onPress={() => {
            setAlgorithmMode('standard');
            if (activeQueue.length > 1) reoptimizeRoute('standard');
          }}
          style={[styles.algoOption, algorithmMode === 'standard' && { backgroundColor: '#FFF', shadowOpacity: 0.1, elevation: 2 }]}>
          <Text style={[styles.algoText, { color: algorithmMode === 'standard' ? colors.primaryDark : colors.textTertiary }]}>Standard</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => {
            setAlgorithmMode('green');
            if (activeQueue.length > 1) reoptimizeRoute('green');
          }}
          style={[styles.algoOption, algorithmMode === 'green' && { backgroundColor: colors.primary, shadowOpacity: 0.2, elevation: 4 }]}>
          <Text style={[styles.algoText, { color: algorithmMode === 'green' ? '#FFF' : colors.textTertiary, fontWeight: '800' }]}>🌱 Green (Eco)</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.requestButtons}>
        <TouchableOpacity style={[styles.acceptButton, { backgroundColor: colors.secondary + '20', borderWidth: 1, borderColor: colors.secondary }]} onPress={handleAddToQueue}>
          <Text style={[styles.buttonText, { color: colors.secondary }]}>+ Queue Post</Text>
        </TouchableOpacity>

        {activeQueue.length > 0 ? (
          <TouchableOpacity style={[styles.acceptButton, { backgroundColor: colors.primary }]} onPress={handleStartRoute}>
            <Text style={styles.buttonText}>Navigate All ({activeQueue.length + 1})</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity style={[styles.acceptButton, { backgroundColor: colors.primary }]} onPress={() => handleAcceptJob(activeJob!)}>
            <Text style={styles.buttonText}>{t('actions.accept')}</Text>
          </TouchableOpacity>
        )}
      </View>
      <TouchableOpacity onPress={handleDeclineJob} style={{ alignSelf: 'center', marginTop: 15 }}>
        <Text style={{ color: colors.error, fontWeight: '700', fontSize: 13 }}>{t('common.cancel').toUpperCase()}</Text>
      </TouchableOpacity>
    </View>
  );

  /**
   * Renders the bottom panel during Navigation (non-driving view).
   * Displays job details, buttons to Call/Chat, and 'Start Ride' button.
   */
  const renderNavigationPanel = () => (
    <View style={[styles.navPanel, { paddingBottom: insets.bottom + 10, backgroundColor: isDark ? 'rgba(30,30,30,0.95)' : '#FFF' }]}>
      <View style={styles.dragHandle} />
      <View style={styles.navHeader}>
        <Image source={{ uri: activeJob?.contributorAvatar || "https://i.pravatar.cc/150?u=default" }} style={styles.navAvatar} />
        <View style={{ flex: 1, marginHorizontal: 12, justifyContent: 'center' }}>
          <Text style={[styles.navName, { color: colors.text }]} numberOfLines={2} ellipsizeMode='tail'>{activeJob?.address || "Unknown Location"}</Text>
          <Text style={[styles.navSub, { color: colors.textSecondary }]}>STOP {activeQueue.indexOf(activeJob!) + 1} OF {activeQueue.length}</Text>
        </View>
        <View style={styles.statsContainer}>
          <Text style={[styles.navTime, { color: colors.primary }]}>
            {routeMetrics ? Math.ceil(routeMetrics.duration / 60) : (routeInfo ? Math.ceil(routeInfo.duration) : 0)} min
          </Text>
          <Text style={[styles.navDist, { color: colors.textSecondary }]}>
            {routeMetrics ? (routeMetrics.distance / 1000).toFixed(2) : (routeInfo ? (routeInfo.distance).toFixed(2) : "0.00")} km
          </Text>
        </View>
      </View>

      {algorithmMode === 'green' && (
        <View style={[styles.impactHighlight, { backgroundColor: colors.primary + '15' }]}>
          <MaterialCommunityIcons name="leaf" size={16} color={colors.primary} />
          <Text style={[styles.impactHighlightText, { color: colors.primary }]}>
            Green Mode: Optimizing for zero emission
          </Text>
        </View>
      )}

      {routeMetrics && (
        <View style={[styles.optimizationStats, { backgroundColor: isDark ? 'rgba(255,255,255,0.03)' : '#F8FAFC', borderColor: colors.border }]}>
          <Text style={[styles.optTitle, { color: colors.text }]}>REAL-TIME ROUTE OPTIMIZATION</Text>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 10 }}>
            <View style={styles.optItem}>
              <Text style={styles.optLabel}>TOTAL DISTANCE</Text>
              <Text style={[styles.optValue, { color: colors.text }]}>{(routeMetrics.distance / 1000).toFixed(2)} km</Text>
            </View>
            <View style={styles.optItem}>
              <Text style={styles.optLabel}>ELEVATION GAIN</Text>
              <Text style={[styles.optValue, { color: colors.text }]}>{routeMetrics.elevationGain.toFixed(0)} m</Text>
            </View>
            <View style={styles.optItem}>
              <Text style={styles.optLabel}>ENERGY SAVED</Text>
              <Text style={[styles.optValue, { color: colors.primary }]}>{(100 - (routeMetrics.energyScore / routeMetrics.distance * 1000)).toFixed(0)}%</Text>
            </View>
          </View>
        </View>
      )}

      <View style={{ flexDirection: 'row', gap: 12, marginTop: 5 }}>
        <TouchableOpacity style={[styles.contactButton, { backgroundColor: isDark ? '#2C2C2C' : '#F1F5F9' }]} onPress={() => {
          if (activeJob?.phoneNumber) Linking.openURL(`tel:${activeJob.phoneNumber}`);
          else Alert.alert("No Phone", "Contributor hasn't provided a number");
        }}><Ionicons name="call" size={20} color={colors.text} /></TouchableOpacity>
        <TouchableOpacity style={[styles.contactButton, { backgroundColor: isDark ? '#2C2C2C' : '#F1F5F9' }]} onPress={() => setIsChatOpen(true)}><Ionicons name="chatbubble" size={20} color={colors.text} /></TouchableOpacity>
        <TouchableOpacity style={[styles.startRideButton, { backgroundColor: colors.primary }]} onPress={handleStartRide}>
          <FontAwesome name="location-arrow" size={18} color="#fff" style={{ marginRight: 10 }} />
          <Text style={styles.buttonText}>START NAVIGATION</Text>
        </TouchableOpacity>
      </View>
    </View >
  );

  // ... (Keeping internal/external navigation overlays exactly as they were)
  /**
   * Renders the custom Turn-by-Turn navigation overlay.
   * - Top banner: Next maneuver instruction.
   * - Bottom bar: Stats (time/dist) and 'Exit' button.
   * - Floating buttons: Re-center, Search.
   */
  const renderInternalDrivingOverlay = () => (
    <>
      <View style={[styles.topNavContainer, { paddingTop: insets.top }]}>
        <View style={styles.greenBanner}>
          <View style={styles.bannerMainContent}>
            <MaterialCommunityIcons name={nextTurn.icon} size={36} color="#fff" style={{ marginRight: 15 }} />
            <View style={{ flex: 1 }}>
              <Text style={styles.instructionMain} numberOfLines={2}>{nextTurn.instruction}</Text>
              <Text style={styles.instructionSub} numberOfLines={1}>{nextTurn.distance} • {nextTurn.subInstruction}</Text>
            </View>
            <TouchableOpacity style={styles.micButton}><Ionicons name="mic" size={24} color="#333" /></TouchableOpacity>
          </View>
          {routeStepsRef.current.length > currentStepIndexRef.current + 1 && (
            <View style={styles.thenBanner}><Text style={styles.thenText}>Next: {stripHtml(routeStepsRef.current[currentStepIndexRef.current + 1]?.html_instructions || "Arrive")}</Text></View>
          )}
        </View>
      </View>
      <View style={[styles.floatingRightButtons, { top: insets.top + 180 }]}>
        <TouchableOpacity style={styles.floatingCircleBtn}><MaterialCommunityIcons name="compass-outline" size={26} color="#333" /></TouchableOpacity>
        <TouchableOpacity style={styles.floatingCircleBtn} onPress={handleSearchNow}><Ionicons name="search" size={24} color="#333" /></TouchableOpacity>
      </View>
      <View style={[styles.recenterButtonPos, { bottom: 160 + insets.bottom }]}>
        <TouchableOpacity style={styles.recenterButton} onPress={() => {
          if (mapRef.current) mapRef.current.animateCamera({ center: { latitude: region.latitude, longitude: region.longitude }, heading: 0, pitch: DRIVING_VIEW_CONFIG.pitch, zoom: DRIVING_VIEW_CONFIG.zoom, altitude: DRIVING_VIEW_CONFIG.altitude }, { duration: 500 });
        }}>
          <MaterialCommunityIcons name="navigation-variant" size={20} color="#1A73E8" />
          <Text style={styles.recenterText}>Re-center</Text>
        </TouchableOpacity>
      </View>
      <View style={[styles.bottomSheetNav, { paddingBottom: insets.bottom + 10 }]}>
        <View style={styles.bottomSheetContent}>
          <TouchableOpacity style={styles.altRouteButton}><MaterialCommunityIcons name="source-branch" size={28} color="#333" /></TouchableOpacity>
          <View style={styles.bottomStats}>
            <Text style={styles.bottomTimeBig}>{routeInfo ? Math.ceil(routeInfo.duration) : 0} min</Text>
            <Text style={styles.bottomTimeSmall}>{routeInfo ? (routeInfo.distance).toFixed(1) : 0} km remaining</Text>
          </View>
          <TouchableOpacity style={styles.exitButton} onPress={handleArrived}><Ionicons name="close" size={30} color="#333" /></TouchableOpacity>
        </View>
      </View>
    </>
  );

  /**
   * Renders the panel when using External Maps (Google Maps app).
   * Shows a 'Trip in Progress' placeholder and 'I Have Arrived' button.
   */
  const renderTripInProgressPanel = () => (
    <View style={[styles.tripPanel, { paddingBottom: insets.bottom + 20 }]}>
      <View style={styles.tripHeader}>
        <View style={styles.pulsingDotContainer}>
          <View style={styles.pulsingDot} /><Text style={styles.tripStatusText}>Trip in Progress...</Text>
        </View>
        <TouchableOpacity style={styles.reopenMapsButton} onPress={openMapsNavigation}><MaterialCommunityIcons name="google-maps" size={20} color="#1A73E8" /><Text style={styles.reopenMapsText}>Open Maps</Text></TouchableOpacity>
      </View>
      <Text style={styles.tripSubText}>Navigation is active in Google Maps. Return here when you reach the location.</Text>
      <TouchableOpacity style={styles.arrivedButtonLarge} onPress={handleArrived}>
        <MaterialCommunityIcons name="map-marker-check" size={24} color="#fff" style={{ marginRight: 8 }} /><Text style={styles.buttonText}>I Have Arrived</Text>
      </TouchableOpacity>
    </View>
  );

  /**
   * Renders the panel when the Collector has arrived at the location.
   * Offers 'Call', 'Chat', and 'Collected' (trigger weight modal) options.
   */
  const renderArrivedPanel = () => (
    <View style={[styles.arrivedPanel, { bottom: 100 + insets.bottom }]}>
      <Text style={styles.arrivedTitle}>You have arrived</Text>
      <Text style={styles.arrivedSub}>at your Recycle-Go location</Text>
      <View style={{ flexDirection: 'row', gap: 10, width: '100%', marginTop: 5 }}>
        <TouchableOpacity style={styles.contactButton} onPress={() => {
          if (activeJob?.phoneNumber) Linking.openURL(`tel:${activeJob.phoneNumber}`);
          else Alert.alert("No Phone", "Contributor hasn't provided a number");
        }}><Ionicons name="call" size={20} color={colors.primary} /></TouchableOpacity>
        <TouchableOpacity style={styles.contactButton} onPress={() => setIsChatOpen(true)}><Ionicons name="chatbubble" size={20} color={colors.primary} /></TouchableOpacity>
        <TouchableOpacity style={styles.collectedButton} onPress={handleCollected}><Text style={styles.buttonText}>Collected</Text></TouchableOpacity>
      </View>
    </View>
  );

  /**
   * Renders the "Searching..." bottom sheet.
   * Shows a spinner, status text, and estimated wait time.
   */
  const renderSearchingPanel = () => (
    <View style={[styles.searchingPanel, { paddingBottom: insets.bottom + 20 }]}>
      <View style={styles.searchingRow}>
        <ActivityIndicator size="large" color="#38761D" style={{ marginRight: 20 }} />
        <View style={{ flex: 1 }}>
          <Text style={styles.searchingTitle}>Searching...</Text>
          <Text style={styles.searchingSub}>Finding contributors</Text>
        </View>
        <View style={styles.estimatedBadge}>
          <Text style={styles.estimatedLabel}>ESTIMATED</Text>
          <Text style={styles.estimatedTime}>~ 4 min</Text>
        </View>
      </View>
    </View>
  );

  /**
   * Renders the full-screen success modal after a job is finished.
   * Shows the reward earned (e.g., +RM 5).
   */
  const renderCompletedScreen = () => (
    <Modal visible={true} animationType="slide" transparent={false}>
      <SafeAreaView style={[styles.completedContainer, { backgroundColor: colors.primary }]}>
        <View style={styles.completedHeader}>
          <MaterialCommunityIcons name="check-decagram" size={80} color="#FFF" />
          <Text style={styles.completedBrand}>RECYCLE-GO IMPACT</Text>
        </View>
        <View style={[styles.rewardCard, { backgroundColor: isDark ? '#1E1E1E' : '#FFF' }]}>
          <View style={styles.coinIcon}>
            <MaterialCommunityIcons name="tree" size={60} color={colors.primary} />
          </View>
          <Text style={[styles.rewardTitle, { color: colors.text }]}>Mission Accomplished!</Text>
          <Text style={[styles.rewardAmount, { color: colors.primary }]}>+50 ECO-PTS</Text>
          <Text style={{ color: colors.textSecondary, textAlign: 'center', marginBottom: 20 }}>
            You saved ~2.5 kg of CO2 in this trip.
          </Text>
          <TouchableOpacity style={[styles.doneButton, { backgroundColor: colors.primary }]} onPress={() => setAppState('idle')}><Text style={styles.doneButtonText}>Back to Dashboard</Text></TouchableOpacity>
        </View>
      </SafeAreaView>
    </Modal>
  );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#fff' }} edges={['top']}>
      <MapView
        ref={mapRef}
        style={styles.map}
        customMapStyle={mapType === 'standard' ? appleMapStyle : undefined}
        mapType={mapType}
        provider={PROVIDER_GOOGLE}
        initialRegion={region}
        showsUserLocation={permission}
        showsCompass={false}
        showsMyLocationButton={false}
        mapPadding={{ top: appState === 'driving' && navigationMode === 'internal' ? height * 0.25 : 0, bottom: 0, left: 0, right: 0 }}
      >
        <Marker coordinate={region} title="You">
          <View style={styles.truckIconContainer}><MaterialCommunityIcons name="truck" size={24} color="#fff" /></View>
        </Marker>
        {appState === 'request_received' && availableJobs.map((job) => {
          const isSelected = activeJob?.id === job.id;
          const isInQueue = activeQueue.find(q => q.id === job.id);
          const queueIndex = activeQueue.findIndex(q => q.id === job.id) + 1;

          const markerDistanceText = (isSelected && routeInfo) ? `${(routeInfo.distance).toFixed(1)} km` : job.distanceLabel;
          return (
            <Marker key={job.id} coordinate={{ latitude: job.latitude, longitude: job.longitude }} onPress={() => handleMarkerPress(job)}>
              <View style={{ alignItems: 'center' }}>
                <View style={styles.distanceBadge}><Text style={styles.distanceText}>{markerDistanceText}</Text></View>
                <View style={[styles.jobMarker, { backgroundColor: colors.overlay }, (isSelected || isInQueue) ? { backgroundColor: isInQueue ? '#4CAF50' : '#FF5722', borderColor: '#FFF', transform: [{ scale: 1.2 }] } : {}]}>
                  {isInQueue ? (
                    <Text style={{ color: '#fff', fontWeight: 'bold' }}>{queueIndex}</Text>
                  ) : (
                    <MaterialCommunityIcons name="recycle" size={20} color="#fff" />
                  )}
                </View>
              </View>
            </Marker>
          );
        })}
        {(appState === 'navigating' || appState === 'driving' || appState === 'arrived') && activeJob && (
          <Marker coordinate={{ latitude: activeJob.latitude, longitude: activeJob.longitude }} title="Pickup">
            <View style={styles.jobMarker}><MaterialCommunityIcons name="recycle" size={20} color="#fff" /></View>
          </Marker>
        )}
        {(appState === 'request_received' || appState === 'navigating' || appState === 'driving' || appState === 'arrived') && activeJob && (
          <MapViewDirections
            origin={{ latitude: region.latitude, longitude: region.longitude }}
            destination={
              activeQueue.length > 1
                ? { latitude: activeQueue[activeQueue.length - 1].latitude, longitude: activeQueue[activeQueue.length - 1].longitude }
                : { latitude: activeJob.latitude, longitude: activeJob.longitude }
            }
            waypoints={
              activeQueue.length > 1
                ? activeQueue.slice(0, -1).map(j => ({ latitude: j.latitude, longitude: j.longitude }))
                : undefined
            }
            apikey={GOOGLE_MAPS_API_KEY || ""}
            strokeWidth={appState === 'driving' && navigationMode === 'internal' ? 8 : 5}
            strokeColor={algorithmMode === 'green' ? '#38761D' : colors.mapRoute}
            mode="DRIVING"
            onReady={(result) => { setRouteInfo({ distance: result.distance, duration: result.duration }); }}
          />
        )}
      </MapView>

      <ChatModal
        visible={isChatOpen}
        onClose={() => setIsChatOpen(false)}
        messages={messages}
        currentUserId={collectorId}
        onSendMessage={handleSendMessage}
      />
      <WeightVerificationModal
        visible={isWeightModalOpen}
        onClose={() => setIsWeightModalOpen(false)}
        actualWeight={actualWeight}
        onWeightChange={setActualWeight}
        onSubmit={submitWeight}
        onCancel={() => {
          setWaitingForConfirmation(false);
          setCurrentTransactionId(null);
        }}
        waitingForConfirmation={waitingForConfirmation}
      />

      <JobDetailModal
        visible={showDetailModal}
        job={activeJob}
        onClose={() => setShowDetailModal(false)}
        onProcess={() => setShowDetailModal(false)}
        onReject={() => {
          setShowDetailModal(false);
          handleDeclineJob();
        }}
      />

      {appState !== 'driving' && (
        <View style={[styles.topRightButtons, { top: 60 + insets.top }]}>
          <TouchableOpacity style={styles.floatingCircleBtn} onPress={handleMapTypeToggle}>
            <Ionicons name="layers" size={24} color="#333" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.floatingCircleBtn} onPress={() => {
            if (mapRef.current) {
              mapRef.current.animateToRegion(region, 500);
            }
          }}>
            <Ionicons name="navigate" size={24} color="#333" />
          </TouchableOpacity>
        </View>
      )}
      {appState === 'idle' && (
        <View style={styles.idleOverlay} pointerEvents="box-none">
          <TouchableOpacity onPress={handleSearchNow} activeOpacity={0.8}>
            <LinearGradient
              colors={useTheme().isDark ? ['#00ff88', '#008f44'] : ['#10b981', '#064e3b']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.searchButtonGradient}
            >
              <Ionicons name="search" size={20} color="#fff" style={{ marginRight: 8 }} />
              <Text style={styles.searchButtonText}>{t('collector.searchNow') || 'Find Jobs'}</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      )}
      {appState === 'searching' && renderSearchingPanel()}
      {appState === 'request_received' && activeJob && renderRequestPopup()}
      {appState === 'navigating' && renderNavigationPanel()}
      {appState === 'driving' && navigationMode === 'external' && renderTripInProgressPanel()}
      {appState === 'driving' && navigationMode === 'internal' && renderInternalDrivingOverlay()}
      {appState === 'arrived' && renderArrivedPanel()}
      {appState === 'completed' && renderCompletedScreen()}
      {appState === 'idle' && (
        <View style={[styles.bottomNav, { bottom: 20 + insets.bottom }]}>
          <TouchableOpacity><Ionicons name="home" size={24} color="#38761D" /></TouchableOpacity>
          <TouchableOpacity onPress={() => router.push("/(tabs)/earnings")}><Ionicons name="wallet-outline" size={24} color="#666" /></TouchableOpacity>
          <TouchableOpacity onPress={() => router.push("/(tabs)/inbox")}><Ionicons name="chatbubble-outline" size={24} color="#666" /></TouchableOpacity>
          <TouchableOpacity onPress={() => router.push("/(tabs)/account")}><Ionicons name="person-outline" size={24} color="#666" /></TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  // --- LAYOUT ---
  container: { flex: 1 },
  map: { ...StyleSheet.absoluteFillObject },
  loadingOverlay: { ...StyleSheet.absoluteFillObject, justifyContent: 'center', alignItems: 'center' },

  // --- PREMIUM HEADER ---
  header: { position: 'absolute', top: 0, left: 0, right: 0, paddingHorizontal: 20, paddingBottom: 20, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', zIndex: 10 },
  searchButtonGradient: { flexDirection: 'row', alignItems: 'center', paddingVertical: 16, paddingHorizontal: 32, borderRadius: 30, shadowColor: '#4ade80', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 6 },
  searchButtonText: { color: '#fff', fontSize: 18, fontWeight: 'bold' },

  // --- BOTTOM SHEET (Standard) ---
  bottomSheet: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: '#fff', borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20, shadowOpacity: 0.2, shadowRadius: 10, elevation: 20, maxHeight: '50%' },
  sheetTitle: { fontSize: 20, fontWeight: 'bold', marginBottom: 15 },

  // --- JOB CARD (List Item) ---
  jobCard: { flexDirection: 'row', backgroundColor: '#F5F5F5', padding: 15, borderRadius: 15, marginBottom: 10, alignItems: 'center' },
  jobIcon: { width: 50, height: 50, borderRadius: 25, backgroundColor: '#E0E0E0', justifyContent: 'center', alignItems: 'center', marginRight: 15 },
  jobInfo: { flex: 1 },
  jobAddress: { fontSize: 16, fontWeight: '600', color: '#333' },
  jobMeta: { flexDirection: 'row', gap: 10, marginTop: 5 },
  chip: { backgroundColor: '#fff', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8, fontSize: 12, overflow: 'hidden', color: '#444' },
  jobDistance: { fontSize: 14, fontWeight: 'bold', color: '#555' },

  // --- REQUEST POPUP ---
  requestCard: { position: 'absolute', left: 15, right: 15, borderRadius: 32, padding: 24, shadowOpacity: 0.3, shadowRadius: 20, elevation: 15, borderWidth: 1 },
  requestHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
  requestAvatar: { width: 56, height: 56, borderRadius: 28, borderWidth: 2, borderColor: '#FFF' },
  requestAddress: { fontSize: 18, fontWeight: '900', letterSpacing: -0.5 },
  requestDistance: { fontSize: 13, fontWeight: '600', marginTop: 2 },
  queueBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  queueText: { fontSize: 11, fontWeight: '900' },

  algoTogglePill: { flexDirection: 'row', borderRadius: 16, padding: 4, marginBottom: 20 },
  algoOption: { flex: 1, paddingVertical: 12, borderRadius: 12, alignItems: 'center' },
  algoText: { fontSize: 14, fontWeight: '700' },

  requestButtons: { flexDirection: 'row', gap: 12 },
  acceptButton: { flex: 1, paddingVertical: 18, borderRadius: 20, alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 10, elevation: 5 },
  buttonText: { color: '#fff', fontSize: 15, fontWeight: '900', letterSpacing: 0.5 },

  // --- NAVIGATION PANEL ---
  navPanel: { position: 'absolute', bottom: 0, left: 0, right: 0, paddingHorizontal: 24, paddingTop: 10, borderTopLeftRadius: 36, borderTopRightRadius: 36, shadowOpacity: 0.2, shadowRadius: 20, elevation: 25 },
  dragHandle: { width: 36, height: 4, backgroundColor: '#E2E8F0', borderRadius: 2, alignSelf: 'center', marginBottom: 15 },
  navHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
  navAvatar: { width: 50, height: 50, borderRadius: 25 },
  navName: { fontSize: 17, fontWeight: '800', letterSpacing: -0.5 },
  navSub: { fontSize: 11, fontWeight: '900', letterSpacing: 1, marginTop: 4 },
  statsContainer: { alignItems: 'flex-end' },
  navTime: { fontSize: 20, fontWeight: '900' },
  navDist: { fontSize: 13, fontWeight: '700' },

  impactHighlight: { flexDirection: 'row', alignItems: 'center', gap: 8, padding: 12, borderRadius: 16, marginBottom: 20 },
  impactHighlightText: { fontSize: 13, fontWeight: '800' },

  optimizationStats: { padding: 16, borderRadius: 20, marginBottom: 24, borderWidth: 1 },
  optTitle: { fontSize: 11, fontWeight: '900', letterSpacing: 1, marginBottom: 12 },
  optItem: { alignItems: 'flex-start' },
  optLabel: { fontSize: 10, fontWeight: '900', color: '#64748B', letterSpacing: 0.5 },
  optValue: { fontSize: 17, fontWeight: '900', marginTop: 2 },

  contactButton: { width: 56, height: 56, borderRadius: 18, justifyContent: 'center', alignItems: 'center' },
  startRideButton: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', borderRadius: 20, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 10, elevation: 8 },

  // --- INTERNAL NAV OVERLAY ---
  topNavContainer: { position: 'absolute', top: 50, left: 20, right: 20, zIndex: 10 },
  greenBanner: { backgroundColor: '#10B981', borderRadius: 24, padding: 20, shadowOpacity: 0.3, shadowRadius: 20, elevation: 12 },
  bannerMainContent: { flexDirection: 'row', alignItems: 'center' },
  instructionMain: { flex: 1, color: '#fff', fontSize: 24, fontWeight: '900', letterSpacing: -0.5 },
  instructionSub: { color: 'rgba(255,255,255,0.85)', fontSize: 15, fontWeight: '600', marginTop: 4 },
  micButton: { width: 44, height: 44, backgroundColor: 'rgba(255,255,255,0.9)', borderRadius: 22, justifyContent: 'center', alignItems: 'center' },
  thenBanner: { marginTop: -10, backgroundColor: '#065F46', paddingTop: 20, paddingBottom: 10, paddingHorizontal: 20, borderBottomLeftRadius: 24, borderBottomRightRadius: 24, zIndex: -1 },
  thenText: { color: '#fff', fontSize: 14, fontWeight: '700' },

  floatingRightButtons: { position: 'absolute', right: 20, gap: 16 },
  floatingCircleBtn: { width: 52, height: 52, backgroundColor: '#fff', borderRadius: 26, justifyContent: 'center', alignItems: 'center', shadowOpacity: 0.2, shadowRadius: 10, elevation: 8 },

  recenterButtonPos: { position: 'absolute', left: 20 },
  recenterButton: { flexDirection: 'row', backgroundColor: '#fff', paddingVertical: 12, paddingHorizontal: 18, borderRadius: 25, alignItems: 'center', shadowOpacity: 0.2, elevation: 8 },
  recenterText: { marginLeft: 8, fontWeight: '800', fontSize: 13, color: '#333' },

  bottomSheetNav: { position: 'absolute', bottom: 20, left: 20, right: 20, backgroundColor: '#fff', borderRadius: 28, padding: 20, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', shadowOpacity: 0.2, shadowRadius: 20, elevation: 15 },
  bottomSheetContent: { flex: 1, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  altRouteButton: { padding: 8 },
  bottomStats: { alignItems: 'center' },
  bottomTimeBig: { fontSize: 28, fontWeight: '900', color: '#10B981', letterSpacing: -1 },
  bottomTimeSmall: { fontSize: 14, fontWeight: '700', color: '#64748B' },
  exitButton: { width: 52, height: 52, backgroundColor: '#F1F5F9', borderRadius: 26, justifyContent: 'center', alignItems: 'center' },

  // --- TRIP PANELS ---
  tripPanel: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: '#fff', padding: 30, borderTopLeftRadius: 40, borderTopRightRadius: 40, shadowOpacity: 0.2, elevation: 25 },
  tripHeader: { alignItems: 'center', marginBottom: 25 },
  pulsingDotContainer: { width: 72, height: 72, backgroundColor: '#ECFDF5', borderRadius: 36, justifyContent: 'center', alignItems: 'center', marginBottom: 15 },
  pulsingDot: { width: 24, height: 24, backgroundColor: '#10B981', borderRadius: 12 },
  tripStatusText: { fontSize: 22, fontWeight: '900', color: '#0F172A', letterSpacing: -0.5 },
  tripSubText: { color: '#64748B', textAlign: 'center', fontSize: 15, lineHeight: 22 },
  reopenMapsButton: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#EFF6FF', paddingVertical: 12, paddingHorizontal: 20, borderRadius: 25, marginTop: 20 },
  reopenMapsText: { color: '#2563EB', fontWeight: '800', marginLeft: 10 },

  searchingPanel: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: '#fff', padding: 32, borderTopLeftRadius: 40, borderTopRightRadius: 40, shadowOpacity: 0.1, elevation: 20 },
  searchingRow: { flexDirection: 'row', alignItems: 'center' },
  searchingTitle: { fontSize: 26, fontWeight: '900', color: '#0F172A', letterSpacing: -0.5 },
  searchingSub: { fontSize: 16, color: '#64748B', marginTop: 4, fontWeight: '600' },
  estimatedBadge: { backgroundColor: '#F8FAFC', paddingHorizontal: 20, paddingVertical: 12, borderRadius: 16, alignItems: 'center', borderWidth: 1, borderColor: '#E2E8F0' },
  estimatedLabel: { fontSize: 10, color: '#94A3B8', fontWeight: '900', letterSpacing: 1 },
  estimatedTime: { fontSize: 18, fontWeight: '900', color: '#0F172A', marginTop: 2 },

  arrivedPanel: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: '#fff', padding: 32, borderTopLeftRadius: 40, borderTopRightRadius: 40, alignItems: 'center', shadowOpacity: 0.2, elevation: 25 },
  arrivedTitle: { fontSize: 28, fontWeight: '900', marginBottom: 8, color: '#0F172A', letterSpacing: -1 },
  arrivedSub: { fontSize: 16, color: '#64748B', marginBottom: 30, textAlign: 'center', fontWeight: '500' },
  arrivedButtonLarge: { width: '100%', paddingVertical: 18, borderRadius: 24, alignItems: 'center', shadowColor: '#10B981', shadowOpacity: 0.3, shadowRadius: 15, elevation: 10 },
  collectedButton: { flex: 1, paddingVertical: 18, borderRadius: 20, alignItems: 'center', shadowColor: '#10B981', shadowOpacity: 0.2, shadowRadius: 10, elevation: 8 },

  completedContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  completedHeader: { alignItems: 'center', marginBottom: 48 },
  completedBrand: { color: 'rgba(255,255,255,0.9)', fontSize: 12, fontWeight: '900', letterSpacing: 3, marginTop: 16 },
  rewardCard: { borderRadius: 40, padding: 40, width: '100%', alignItems: 'center', shadowOpacity: 0.4, shadowRadius: 25, elevation: 15 },
  coinIcon: { width: 100, height: 100, borderRadius: 50, backgroundColor: '#F0FDF4', justifyContent: 'center', alignItems: 'center', marginBottom: 24 },
  rewardTitle: { fontSize: 26, fontWeight: '900', marginBottom: 12, letterSpacing: -0.5 },
  rewardAmount: { fontSize: 44, fontWeight: '900', marginBottom: 16, letterSpacing: -2 },
  completedFooter: { width: '100%', marginTop: 24 },
  finishButton: { backgroundColor: 'rgba(255,255,255,0.15)', paddingVertical: 20, borderRadius: 24, alignItems: 'center', width: '100%' },
  doneButton: { paddingVertical: 18, paddingHorizontal: 48, borderRadius: 24, marginTop: 10, shadowOpacity: 0.3, shadowRadius: 10, elevation: 5 },
  doneButtonText: { color: '#fff', fontSize: 18, fontWeight: '900' },

  // --- MODALS (WEIGHT & CHAT) ---
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
  weightCard: { width: '85%', backgroundColor: '#fff', borderRadius: 20, padding: 25, alignItems: 'center', shadowOpacity: 0.25, shadowRadius: 10, elevation: 20 },
  weightTitle: { fontSize: 20, fontWeight: 'bold', marginBottom: 10 },
  weightSub: { fontSize: 14, color: '#666', textAlign: 'center', marginBottom: 20 },
  inputRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
  weightInput: { fontSize: 40, fontWeight: 'bold', color: '#333', borderBottomWidth: 2, paddingHorizontal: 10, textAlign: 'center', minWidth: 100 },
  unitText: { fontSize: 24, fontWeight: 'bold', color: '#666', marginLeft: 10 },
  confirmWeightBtn: { backgroundColor: '#38761D', paddingVertical: 15, paddingHorizontal: 40, borderRadius: 30, width: '100%', alignItems: 'center' },
  confirmWeightText: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  cancelLink: { marginTop: 15, padding: 10 },

  chatHeader: { flexDirection: 'row', alignItems: 'center', padding: 15, borderBottomWidth: 1, borderBottomColor: '#eee' },
  chatTitle: { fontSize: 18, fontWeight: 'bold', flex: 1, marginLeft: 10 },
  closeChatBtn: { padding: 5 },
  msgBubble: { padding: 12, borderRadius: 15, marginBottom: 10, maxWidth: '80%' },
  msgBubbleMe: { alignSelf: 'flex-end', backgroundColor: '#DCF8C6' },
  msgBubbleThem: { alignSelf: 'flex-start', backgroundColor: '#F0F0F0' },
  msgText: { fontSize: 16 },
  msgTime: { fontSize: 10, color: '#999', alignSelf: 'flex-end', marginTop: 4 },
  chatInputContainer: { flexDirection: 'row', padding: 10, borderTopWidth: 1, borderTopColor: '#eee' },
  chatInput: { flex: 1, backgroundColor: '#F5F5F5', borderRadius: 20, paddingHorizontal: 15, paddingVertical: 10, marginRight: 10 },
  sendBtn: { justifyContent: 'center', alignItems: 'center', paddingHorizontal: 10 },

  // --- GENERAL ---
  bottomNav: { position: 'absolute', left: 20, right: 20, bottom: 30, backgroundColor: '#fff', flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center', paddingVertical: 15, borderRadius: 30, shadowOpacity: 0.1, elevation: 5 },
  centerContent: { justifyContent: 'center', alignItems: 'center' },
  truckIconContainer: { width: 80, height: 80, backgroundColor: 'rgba(56, 118, 29, 0.3)', borderRadius: 40, justifyContent: 'center', alignItems: 'center', marginBottom: 20 },
  distanceBadge: { position: 'absolute', top: 10, right: 10, backgroundColor: 'rgba(0,0,0,0.7)', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12 },
  distanceText: { color: '#fff', fontSize: 12, fontWeight: 'bold' },
  jobMarker: { alignItems: 'center' },
  topRightButtons: { position: 'absolute', right: 20, gap: 10, alignItems: 'center' },
  idleOverlay: { ...StyleSheet.absoluteFillObject, justifyContent: 'flex-end', alignItems: 'center', paddingBottom: 110 }
});

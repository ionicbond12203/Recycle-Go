import { Redirect } from 'expo-router';

export default function AuthCallback() {
    // The AuthContext and openAuthSessionAsync handles the actual token parsing.
    // This route exists solely to satisfy the deep link redirect "applemap://auth/callback"
    // so Expo Router doesn't show "Unmatched Route".

    // We can just redirect to root, or onboarding, and let the existing Auth logic 
    // determine where to go based on the session state.
    return <Redirect href="/" />;
}

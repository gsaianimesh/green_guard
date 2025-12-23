import { auth, db } from './firebase-init.js';
import { GoogleAuthProvider, signInWithPopup } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { doc, getDoc } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const googleSignInBtn = document.getElementById('googleSignInBtn');

if (googleSignInBtn) {
    googleSignInBtn.addEventListener('click', async () => {
        const provider = new GoogleAuthProvider();
        try {
            const result = await signInWithPopup(auth, provider);
            const user = result.user;
            console.log('Google Sign-In successful:', user);

            await new Promise(resolve => setTimeout(resolve, 500));

            try {
                const userDocRef = doc(db, "users", user.uid);
                const userDocSnap = await getDoc(userDocRef);

                if (userDocSnap.exists()) {
                    console.log("Existing user found. Redirecting to homepage.");
                    alert('Welcome back, ' + user.displayName + '!');
                    window.location.href = 'index.html';
                } else {
                    console.log("New user detected. Redirecting to profile setup.");
                    alert('Welcome, ' + user.displayName + '! Please complete your profile.');
                    window.location.href = 'profile.html';
                }
            } catch (firestoreError) {
                console.error('Error checking user profile:', firestoreError);
                if (firestoreError.code === 'permission-denied') {
                    console.log("Permission denied - treating as new user");
                    alert('Welcome, ' + user.displayName + '! Please complete your profile.');
                    window.location.href = 'profile.html';
                } else {
                    throw firestoreError;
                }
            }

        } catch (error) {
            console.error('Error with Google Sign-In:', error);
            if (error.code !== 'auth/popup-closed-by-user') {
                alert('Error signing in: ' + error.message);
            }
        }
    });
}
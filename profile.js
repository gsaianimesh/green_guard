import { auth, db } from './firebase-init.js';
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { doc, setDoc, GeoPoint, Timestamp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const profileForm = document.getElementById('profileForm');
const emailInput = document.getElementById('email');
const usernameInput = document.getElementById('username');
const locationInput = document.getElementById('location');
const phoneInput = document.getElementById('phone');
const getLocationBtn = document.getElementById('getLocationBtn');
const profilePicture = document.getElementById('profilePicture');
const changePhotoBtn = document.getElementById('changePhotoBtn');
const photoInput = document.getElementById('photoInput');

let userGeoLocation = null;
let detailedAddress = null;
let userPhotoURL = null;
let newUserImageBase64 = null;

function resizeImage(file, maxWidth, maxHeight, quality) {
    return new Promise((resolve, reject) => { const reader = new FileReader(); reader.onload = (event) => { const img = new Image(); img.onload = () => { const canvas = document.createElement('canvas'); let width = img.width; let height = img.height; if (width > height) { if (width > maxWidth) { height = Math.round((height *= maxWidth / width)); width = maxWidth; } } else { if (height > maxHeight) { width = Math.round((width *= maxHeight / height)); height = maxHeight; } } canvas.width = width; canvas.height = height; const ctx = canvas.getContext('2d'); ctx.drawImage(img, 0, 0, width, height); const dataUrl = canvas.toDataURL('image/jpeg', quality); resolve(dataUrl); }; img.onerror = reject; img.src = event.target.result; }; reader.onerror = reject; reader.readAsDataURL(file); });
}

onAuthStateChanged(auth, async (user) => {
    if (user) {
        emailInput.value = user.email;
        usernameInput.value = user.displayName || '';
        userPhotoURL = user.photoURL;
        if (userPhotoURL && profilePicture) {
            profilePicture.src = userPhotoURL;
        } else if (profilePicture) {
            profilePicture.src = 'https://via.placeholder.com/100/0B1C11/FFFFFF?text=User';
        }
    } else {
        window.location.href = 'auth.html';
    }
});

changePhotoBtn.addEventListener('click', () => {
    photoInput.click();
});

photoInput.addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (file) {
        if (file.size > 5 * 1024 * 1024) { alert('Image file is too large (Max 5MB).'); return; }
        if (!['image/png', 'image/jpeg', 'image/webp'].includes(file.type)) { alert('Invalid file type. Please use PNG, JPG, or WEBP.'); return; }
        try {
            const resizedBase64 = await resizeImage(file, 200, 200, 0.8);
            profilePicture.src = resizedBase64;
            newUserImageBase64 = resizedBase64;
        } catch (error) {
            console.error('Error processing profile picture:', error);
            alert('Could not process image. Please try another.');
            newUserImageBase64 = null;
        }
    }
});

getLocationBtn.addEventListener('click', () => {
    if ("geolocation" in navigator) {
        getLocationBtn.innerHTML = '<span class="material-symbols-outlined animate-spin">progress_activity</span>';
        const onSuccess = async (position) => {
            const lat = position.coords.latitude;
            const lon = position.coords.longitude;
            userGeoLocation = { latitude: lat, longitude: lon };
            try {
                const url = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lon}`;
                const response = await fetch(url);
                if (!response.ok) {
                     console.error("Nominatim Error Status:", response.status);
                     const errorText = await response.text();
                     console.error("Nominatim Error Text:", errorText);
                     throw new Error(`Failed to fetch address (${response.status})`);
                }
                const data = await response.json();
                if (data && data.address) {
                    detailedAddress = data.address;
                    const locStr = [ data.address.road, data.address.suburb || data.address.neighbourhood, data.address.city || data.address.town, data.address.postcode ].filter(Boolean).join(', ');
                    locationInput.value = locStr;
                    getLocationBtn.innerHTML = '<span class="material-symbols-outlined text-primary">check_circle</span>';
                } else {
                    throw new Error('Could not parse address from location data');
                }
            } catch (geoError) {
                console.error("Reverse geocode error:", geoError);
                alert("Could not automatically get address details. Please type your location manually.");
                getLocationBtn.innerHTML = '<span class="material-symbols-outlined">my_location</span>';
            }
        };
        const onError = (error) => {
            console.error("Geolocation error:", error);
            alert(`Geolocation Error: ${error.message}. Please type location manually.`);
            getLocationBtn.innerHTML = '<span class="material-symbols-outlined">my_location</span>';
        };
        navigator.geolocation.getCurrentPosition(onSuccess, onError);
    } else {
        alert("Geolocation is not supported by your browser.");
        getLocationBtn.innerHTML = '<span class="material-symbols-outlined">my_location</span>';
    }
});


profileForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const user = auth.currentUser;
    const username = usernameInput.value;
    const phone = phoneInput.value;
    const locationText = locationInput.value;

    if (!user) { alert('Not logged in!'); return; }
    if (!username || !phone || !locationText) { alert('All fields marked with * are compulsory!'); return; }
    if (!userGeoLocation || !detailedAddress) { alert('Please use the location button or ensure address details were fetched.'); return; }

    const photoDataToSave = newUserImageBase64 ? newUserImageBase64 : userPhotoURL;

    const profileData = {
        username: username,
        phone: phone,
        email: user.email,
        eco_points: 0,
        photoURL: photoDataToSave || null,
        location_text: locationText,
        geo_location: new GeoPoint(userGeoLocation.latitude, userGeoLocation.longitude),
        address_components: detailedAddress,
        profile_created_at: Timestamp.now()
    };

    const saveButton = profileForm.querySelector('button[type="submit"]');
    saveButton.disabled = true;
    saveButton.innerText = 'SAVING...';

    try {
        const userDocRef = doc(db, 'users', user.uid);
        await setDoc(userDocRef, profileData);
        alert('Profile created successfully! Welcome!');
        window.location.href = 'dashboard.html';
    } catch (error) {
        console.error('Error saving profile: ', error);
        alert('Error saving profile: ' + error.message);
        saveButton.disabled = false;
        saveButton.innerText = 'Save Profile & Continue';
    }
});
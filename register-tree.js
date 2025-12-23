import { auth, db } from './firebase-init.js';
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { doc, addDoc, collection, GeoPoint, Timestamp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const treeForm = document.getElementById('treeForm');
const speciesInput = document.getElementById('species');
const plantingDateInput = document.getElementById('plantingDate');
const locationInput = document.getElementById('treeLocation');
const getLocationBtn = document.getElementById('getLocationBtn');
const uploadBox = document.getElementById('uploadBox');
const uploadPrompt = document.getElementById('uploadPrompt');
const fileInput = document.getElementById('fileInput');
const imagePreview = document.getElementById('imagePreview');
const ageInput = document.getElementById('age');
const heightInput = document.getElementById('height');
const wateringInput = document.getElementById('watering');
const notesInput = document.getElementById('notes');
const submitButton = treeForm.querySelector('button[type="submit"]');

const confirmationCard = document.getElementById('confirmationCard');
const confirmImage = document.getElementById('confirmImage');
const confirmSpecies = document.getElementById('confirmSpecies');
const confirmAge = document.getElementById('confirmAge');
const confirmPlantingDate = document.getElementById('confirmPlantingDate');
const confirmHeight = document.getElementById('confirmHeight');
const confirmLocation = document.getElementById('confirmLocation');
const confirmWatering = document.getElementById('confirmWatering');
const confirmNotes = document.getElementById('confirmNotes');
const confirmSaveBtn = document.getElementById('confirmSaveBtn');
const editBtn = document.getElementById('editBtn');

let treeGeoLocation = null;
let treeAddress = null;
let treeImageBase64 = null;
let completeTreeData = null; 
let userSelectedWatering = false;

onAuthStateChanged(auth, (user) => {
    if (!user) {
        alert('You must be logged in!');
        window.location.href = 'auth.html';
    }
});

function resizeImage(file, maxWidth, maxHeight, quality) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (event) => {
            const img = new Image();
            img.onload = () => {
                const canvas = document.createElement('canvas');
                let width = img.width; let height = img.height;
                if (width > height) {
                    if (width > maxWidth) { height = Math.round((height *= maxWidth / width)); width = maxWidth; }
                } else {
                    if (height > maxHeight) { width = Math.round((width *= maxHeight / height)); height = maxHeight; }
                }
                canvas.width = width; canvas.height = height;
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0, width, height);
                const dataUrl = canvas.toDataURL('image/jpeg', quality);
                resolve(dataUrl);
            };
            img.onerror = reject;
            img.src = event.target.result;
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
}
uploadBox.addEventListener('click', () => fileInput.click());
fileInput.addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (file) {
        if (file.size > 10 * 1024 * 1024) { alert('File is too large! (Max 10MB)'); return; }
        if (!['image/png', 'image/jpeg', 'image/webp'].includes(file.type)) { alert('Invalid file type!'); return; }
        try {
            treeImageBase64 = await resizeImage(file, 800, 800, 0.7);
            if (treeImageBase64.length > 1000 * 1024) { alert('Image too large. Please try another.'); treeImageBase64 = null; return; }
            imagePreview.src = treeImageBase64;
            imagePreview.classList.remove('hidden'); 
            uploadPrompt.classList.add('hidden'); 
        } catch (error) { console.error('Error resizing image:', error); treeImageBase64 = null; }
    }
});

getLocationBtn.addEventListener('click', () => {
    if ("geolocation" in navigator) {
        getLocationBtn.innerHTML = '<span class="material-symbols-outlined animate-spin">progress_activity</span>';
        const onSuccess = async (position) => {
            treeGeoLocation = { latitude: position.coords.latitude, longitude: position.coords.longitude };
            try {
                const url = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${treeGeoLocation.latitude}&lon=${treeGeoLocation.longitude}`;
                const response = await fetch(url);
                if (!response.ok) throw new Error('Failed to fetch address');
                const data = await response.json();
                if (data && data.display_name) {
                    treeAddress = data.address;
                    locationInput.value = data.display_name;
                    getLocationBtn.innerHTML = '<span class="material-symbols-outlined text-primary">check_circle</span>';
                } else { throw new Error('Could not parse address'); }
            } catch (geoError) {
                console.error("Reverse geocode error:", geoError);
                getLocationBtn.innerHTML = '<span class="material-symbols-outlined">my_location</span>';
            }
        };
        const onError = (error) => {
            console.error("Error getting location:", error.message);
            getLocationBtn.innerHTML = '<span class="material-symbols-outlined">my_location</span>';
        };
        navigator.geolocation.getCurrentPosition(onSuccess, onError, { enableHighAccuracy: true });
    } else { alert("Geolocation is not supported."); }
});

treeForm.addEventListener('submit', async (e) => {
    e.preventDefault(); 
    const user = auth.currentUser;

    // --- 1. Validation ---
    if (!user) { alert('You are not logged in!'); return; }
    if (!treeGeoLocation || !treeAddress) { alert('Please use the "Get Location" button.'); return; }
    if (!treeImageBase64) { alert('Please upload a photo.'); return; }
    
    userSelectedWatering = !!wateringInput.value;

    submitButton.disabled = true;
    submitButton.innerText = 'PROCESSING...';

     completeTreeData = {
        species: speciesInput.value,
        age: ageInput.value,
        planting_date: Timestamp.fromDate(new Date(plantingDateInput.value)),
        image_data_url: treeImageBase64,
        location_text: locationInput.value,
        geo_location: new GeoPoint(treeGeoLocation.latitude, treeGeoLocation.longitude),
        address_components: treeAddress,
        height: heightInput.value || null,
        watering_needs: wateringInput.value || null,
        notes: notesInput.value || null,
        registered_by_uid: user.uid,
        registered_at: Timestamp.now(),
        verification_status: "pending",
        endorsed_by: [],
        care_logs: []
    };

    confirmImage.src = completeTreeData.image_data_url;
    confirmSpecies.innerText = completeTreeData.species;
    confirmAge.innerText = completeTreeData.age;
    confirmPlantingDate.innerText = plantingDateInput.value; 
    confirmHeight.innerText = completeTreeData.height || 'N/A';
    confirmLocation.innerText = completeTreeData.location_text;
    confirmWatering.innerText = completeTreeData.watering_needs || 'N/A';
    confirmNotes.innerText = completeTreeData.notes || 'N/A';

    treeForm.style.display = 'none'; 
    confirmationCard.style.display = 'block'; 

    if (!userSelectedWatering && !completeTreeData.watering_needs) {
        if (completeTreeData.age && completeTreeData.age.includes('Sapling')) {
            completeTreeData.watering_needs = 'Every 2-3 days';
            confirmWatering.innerText = 'Every 2-3 days (Suggested for saplings)';
        } else {
            completeTreeData.watering_needs = 'Weekly';
            confirmWatering.innerText = 'Weekly (Suggested)';
        }
    }
    
    submitButton.disabled = false; 
    submitButton.innerText = 'Review Details';
});

editBtn.addEventListener('click', () => {
    confirmationCard.style.display = 'none'; 
    treeForm.style.display = 'grid'; 
    completeTreeData = null; 
    userSelectedWatering = false;
});

confirmSaveBtn.addEventListener('click', async () => {
    if (!completeTreeData) { alert('Error: Tree data is missing.'); return; }

    confirmSaveBtn.disabled = true;
    confirmSaveBtn.innerText = 'SAVING...';
    editBtn.style.display = 'none'; 

    try {
        const docRef = await addDoc(collection(db, "trees"), completeTreeData);
        alert('Tree successfully registered! It is now pending verification.');
        window.location.href = 'index.html'; 
    } catch (error) {
        console.error('Error adding document: ', error);
        alert('Error saving tree: ' + error.message);
        confirmSaveBtn.disabled = false; 
        confirmSaveBtn.innerText = 'Confirm & Save Tree';
        editBtn.style.display = 'block'; 
    }
});
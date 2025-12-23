import { auth, db } from './firebase-init.js';
import { onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { doc, getDoc, collection, query, where, getDocs, updateDoc, Timestamp, increment, orderBy } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const loadingOverlay = document.getElementById('loadingOverlay');
const contentContainer = document.getElementById('contentContainer');
const profileDisplay = document.getElementById('profileDisplay');
const usernameDisplay = document.getElementById('usernameDisplay');
const emailDisplay = document.getElementById('emailDisplay');
const ecoPointsDisplay = document.getElementById('ecoPointsDisplay');
const locationDisplay = document.getElementById('locationDisplay');
const profilePictureDisplay = document.getElementById('profilePictureDisplay');
const editProfileBtn = document.getElementById('editProfileBtn');
const profileSkeleton = document.getElementById('profileSkeleton');

const profileEdit = document.getElementById('profileEdit');
const profilePictureEdit = document.getElementById('profilePictureEdit');
const changePhotoBtn = document.getElementById('changePhotoBtn');
const photoInput = document.getElementById('photoInput');
const usernameEdit = document.getElementById('usernameEdit');
const phoneEdit = document.getElementById('phoneEdit');
const locationEdit = document.getElementById('locationEdit');
const cancelEditBtn = document.getElementById('cancelEditBtn');
const saveChangesBtn = document.getElementById('saveChangesBtn');

const myTreesList = document.getElementById('myTreesList');

const loginBtn = document.getElementById('loginBtn');
const signOutBtn = document.getElementById('signOutBtn');
const dashboardBtn = document.getElementById('dashboardBtn');
const adminBtn = document.getElementById('adminBtn');
const waterTreeBtn = document.getElementById('waterTreeBtn');
const registerTreeBtn = document.getElementById('registerTreeBtn');

const ADMIN_UID = "PASTE_YOUR_OWN_USER_UID_HERE";

let currentUser = null;
let currentUserData = null;
let newUserImageBase64 = null;

function resizeImage(file, maxWidth, maxHeight, quality) {
    return new Promise((resolve, reject) => { const reader = new FileReader(); reader.onload = (event) => { const img = new Image(); img.onload = () => { const canvas = document.createElement('canvas'); let width = img.width; let height = img.height; if (width > height) { if (width > maxWidth) { height = Math.round((height *= maxWidth / width)); width = maxWidth; } } else { if (height > maxHeight) { width = Math.round((width *= maxHeight / height)); height = maxHeight; } } canvas.width = width; canvas.height = height; const ctx = canvas.getContext('2d'); ctx.drawImage(img, 0, 0, width, height); const dataUrl = canvas.toDataURL('image/jpeg', quality); resolve(dataUrl); }; img.onerror = reject; img.src = event.target.result; }; reader.onerror = reject; reader.readAsDataURL(file); });
}

onAuthStateChanged(auth, (user) => {
    if (user) {
        currentUser = user;
        if(loginBtn) loginBtn.style.display = 'none';
        if(signOutBtn) signOutBtn.style.display = 'block';
        if(dashboardBtn) dashboardBtn.style.display = 'block';
        if(waterTreeBtn) waterTreeBtn.style.display = 'block';
        if(registerTreeBtn) registerTreeBtn.style.display = 'block';
        if (user.uid === ADMIN_UID && adminBtn) { adminBtn.style.display = 'block'; }
        else if (adminBtn) { adminBtn.style.display = 'none'; }
        loadDashboardData(user);
    } else {
        currentUser = null; currentUserData = null;
        alert("You must be logged in."); window.location.href = 'auth.html';
        if(loginBtn) loginBtn.style.display = 'block'; if(signOutBtn) signOutBtn.style.display = 'none'; if(dashboardBtn) dashboardBtn.style.display = 'none'; if(adminBtn) adminBtn.style.display = 'none'; if(waterTreeBtn) waterTreeBtn.style.display = 'none'; if(registerTreeBtn) registerTreeBtn.style.display = 'none';
    }
});

if (signOutBtn) {
    signOutBtn.addEventListener('click', () => { signOut(auth).then(() => { alert('Signed out.'); window.location.href = 'index.html'; }).catch(console.error); });
}

async function loadDashboardData(user) {
    if (profileSkeleton) profileSkeleton.style.display = 'block';
    if (profileDisplay) profileDisplay.style.display = 'none';
    if (contentContainer) contentContainer.style.display = 'block';
    if (loadingOverlay) loadingOverlay.style.display = 'none';

    try {
        const userDocRef = doc(db, "users", user.uid);
        const userDoc = await getDoc(userDocRef);

        if (!userDoc.exists()) { window.location.href = 'profile.html'; return; }
        currentUserData = userDoc.data();

        usernameDisplay.innerText = currentUserData.username || 'User';
        emailDisplay.innerText = currentUserData.email || 'No email';
        ecoPointsDisplay.innerText = currentUserData.eco_points || 0;
        locationDisplay.innerText = currentUserData.location_text || 'Location not set';
        profilePictureDisplay.src = currentUserData.photoURL || 'https://via.placeholder.com/100/0B1C11/FFFFFF?text=User';

        if (profileSkeleton) profileSkeleton.style.display = 'none';
        if (profileDisplay) profileDisplay.style.display = 'block';
        if (profileEdit) profileEdit.style.display = 'none';

        await loadMyTrees(user.uid);

    } catch (error) {
        console.error("Error loading dashboard data:", error);
        if (profileSkeleton) profileSkeleton.innerHTML = `<p class="text-red-500">Error loading profile.</p>`;
    }
}

async function loadMyTrees(userId) {
    try {
        const treesQuery = query(collection(db, "trees"), where("registered_by_uid", "==", userId), orderBy("registered_at", "desc"));
        const querySnapshot = await getDocs(treesQuery);

        myTreesList.innerHTML = '';

        if (querySnapshot.empty) {
            myTreesList.innerHTML = '<p class="text-white/60 text-center glassmorphic p-4">You haven\'t registered any trees yet.</p>';
        } else {
            querySnapshot.forEach((doc) => {
                myTreesList.appendChild(createTreeCard(doc.data(), doc.id));
            });
        }
    } catch (error) {
        console.error("Error loading trees:", error);
        myTreesList.innerHTML = '<p class="text-red-500 glassmorphic p-4">Error loading your registered trees.</p>';
    }
}

function createTreeCard(tree, treeId) {
    const card = document.createElement('div'); card.className = 'glassmorphic p-4 rounded-lg flex gap-4 items-center'; let statusHtml = ''; switch (tree.verification_status) { case 'approved': statusHtml = `<p class="text-xs font-medium text-primary">✔️ Approved</p>`; break; case 'rejected': statusHtml = `<p class="text-xs font-medium text-red-500">❌ Rejected</p>`; break; default: statusHtml = `<p class="text-xs font-medium text-yellow-400">🟡 Pending</p>`; } card.innerHTML = ` <img src="${tree.image_data_url || 'https://via.placeholder.com/80/0B1C11/FFFFFF?text=Tree'}" class="w-20 h-20 object-cover rounded-md flex-shrink-0"> <div class="grow"> <h4 class="font-bold text-white">${tree.species || 'Unknown'}</h4> <p class="text-sm text-white/70">${tree.location_text || 'Unknown'}</p> ${statusHtml} <p class="text-xs text-white/50 mt-1">Endorsements: ${tree.endorsed_by?.length || 0}</p> </div> <div class="flex-shrink-0"> <a href="view-tree.html" class="text-sm text-white/60 hover:text-white" title="View Details">&rarr;</a> </div> `; return card;
}
editProfileBtn.addEventListener('click', () => {
    if (!currentUserData) return; usernameEdit.value = currentUserData.username || ''; phoneEdit.value = currentUserData.phone || ''; locationEdit.value = currentUserData.location_text || ''; profilePictureEdit.src = profilePictureDisplay.src; newUserImageBase64 = null; profileDisplay.style.display = 'none'; profileEdit.style.display = 'block';
});

cancelEditBtn.addEventListener('click', () => {
    profileEdit.style.display = 'none'; profileDisplay.style.display = 'block'; profilePictureDisplay.src = currentUserData.photoURL || 'https://via.placeholder.com/100/0B1C11/FFFFFF?text=User';
});

changePhotoBtn.addEventListener('click', () => {
    photoInput.click();
});

photoInput.addEventListener('change', async (e) => {
    const file = e.target.files[0]; if (file) { if (file.size > 5 * 1024 * 1024) { alert('Image max 5MB.'); return; } if (!['image/png', 'image/jpeg', 'image/webp'].includes(file.type)) { alert('Invalid file type.'); return; } try { const resizedBase64 = await resizeImage(file, 200, 200, 0.8); profilePictureEdit.src = resizedBase64; newUserImageBase64 = resizedBase64; } catch (error) { console.error('Error processing profile picture:', error); newUserImageBase64 = null; } }
});

saveChangesBtn.addEventListener('click', async () => {
    if (!currentUser) return;
    const newUsername = usernameEdit.value.trim();
    const newPhone = phoneEdit.value.trim();
    const newLocationText = locationEdit.value.trim();
    
    if (!newUsername || !newPhone || !newLocationText) {
        alert('Username, Phone, and Location cannot be empty.');
        return;
    }
    
    saveChangesBtn.disabled = true;
    saveChangesBtn.innerText = 'SAVING...';
    
    const photoDataToSave = newUserImageBase64 ? newUserImageBase64 : currentUserData.photoURL;
    const updateData = {
        username: newUsername,
        phone: newPhone,
        location_text: newLocationText,
        photoURL: photoDataToSave || null
    };
    
    try {
        const userDocRef = doc(db, "users", currentUser.uid);
        await updateDoc(userDocRef, updateData);
        currentUserData = { ...currentUserData, ...updateData };
        usernameDisplay.innerText = currentUserData.username;
        locationDisplay.innerText = currentUserData.location_text;
        profilePictureDisplay.src = currentUserData.photoURL || 'https://via.placeholder.com/100/0B1C11/FFFFFF?text=User';
        alert('Profile updated!');
        profileEdit.style.display = 'none';
        profileDisplay.style.display = 'block';
    } catch (error) {
        console.error("Error updating profile:", error);
        alert(`Error updating profile: ${error.message}`);
    } finally {
        saveChangesBtn.disabled = false;
        saveChangesBtn.innerText = 'Save Changes';
    }
});
import { auth, db } from './firebase-init.js';
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { collection, getDocs, doc, updateDoc, Timestamp, query, where, addDoc, GeoPoint } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const loadingOverlay = document.getElementById('loadingOverlay');
const contentContainer = document.getElementById('contentContainer');
const treeList = document.getElementById('treeList');
const verifyPhotoInput = document.getElementById('verifyPhotoInput');
let user = null;
const NEARBY_RADIUS_METERS = 5000;
const LOCATION_TOLERANCE_METERS = 50;
const TIME_TOLERANCE_MINUTES = 15;

let pendingWateringData = null;
function calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371e3; const phi1 = lat1 * Math.PI / 180; const phi2 = lat2 * Math.PI / 180; const deltaPhi = (lat2 - lat1) * Math.PI / 180; const deltaLambda = (lon2 - lon1) * Math.PI / 180; const a = Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) + Math.cos(phi1) * Math.cos(phi2) * Math.sin(deltaLambda / 2) * Math.sin(deltaLambda / 2); const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)); return R * c;
}

function daysBetween(date1, date2) {
     const d1 = new Date(date1.getFullYear(), date1.getMonth(), date1.getDate()); const d2 = new Date(date2.getFullYear(), date2.getMonth(), date2.getDate()); const diffTime = d2 - d1; return Math.floor(diffTime / (1000 * 60 * 60 * 24));
}

function getWateringIntervalDays(needs) {
    switch (needs) { case 'Daily': return 1; case 'Every 2-3 days': return 2; case 'Weekly': return 7; default: return null; }
}

function calculateWateringStatus(tree) {
     const intervalDays = getWateringIntervalDays(tree.watering_needs); if (intervalDays === null) return null; const today = new Date(); const lastWateredTimestamp = tree.last_watered_at || tree.planting_date; if (!lastWateredTimestamp) return null; const lastWateredDate = lastWateredTimestamp.toDate(); const daysSince = daysBetween(lastWateredDate, today); return daysSince - intervalDays;
}

function calculateNextWateringDate(tree) {
     const intervalDays = getWateringIntervalDays(tree.watering_needs); const lastWateredTimestamp = tree.last_watered_at || tree.planting_date; if (intervalDays === null || !lastWateredTimestamp) return "N/A"; const lastWateredDate = lastWateredTimestamp.toDate(); const nextDate = new Date(lastWateredDate); nextDate.setDate(lastWateredDate.getDate() + intervalDays); return nextDate.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }).replace(/ /g, '-');
}

function resizeImage(file, maxWidth, maxHeight, quality) {
    return new Promise((resolve, reject) => { const reader = new FileReader(); reader.onload = (event) => { const img = new Image(); img.onload = () => { const canvas = document.createElement('canvas'); let width = img.width; let height = img.height; if (width > height) { if (width > maxWidth) { height = Math.round((height *= maxWidth / width)); width = maxWidth; } } else { if (height > maxHeight) { width = Math.round((width *= maxHeight / height)); height = maxHeight; } } canvas.width = width; canvas.height = height; const ctx = canvas.getContext('2d'); ctx.drawImage(img, 0, 0, width, height); const dataUrl = canvas.toDataURL('image/jpeg', quality); resolve(dataUrl); }; img.onerror = reject; img.src = event.target.result; }; reader.onerror = reject; reader.readAsDataURL(file); });
}

function exifGPSToDecimal(degree, minute, second, direction) {
    let decimal = degree + (minute / 60) + (second / 3600);
    if (direction == "S" || direction == "W") { decimal = decimal * -1; }
    return decimal;
}

onAuthStateChanged(auth, (loggedInUser) => {
    if (loggedInUser) { user = loggedInUser; getUserLocation(); } else { alert("You must be logged in."); window.location.href = 'auth.html'; }
});

function getUserLocation() {
    if ("geolocation" in navigator) { navigator.geolocation.getCurrentPosition( (pos) => loadTreesToWater(pos.coords.latitude, pos.coords.longitude), (err) => loadingOverlay.innerHTML = `<p class="text-red-500">Could not get location: ${err.message}</p>`); } else { loadingOverlay.innerHTML = '<p class="text-red-500">Geolocation is not supported.</p>'; }
}

async function loadTreesToWater(userLat, userLon) {
     try {
         const q = query(collection(db, "trees"), where("verification_status", "==", "approved"));
         const querySnapshot = await getDocs(q);
         const allNearbyTrees = [];
         querySnapshot.forEach((doc) => {
             const tree = doc.data(); tree.id = doc.id;
             if (tree.geo_location?.latitude) {
                 const distance = calculateDistance(userLat, userLon, tree.geo_location.latitude, tree.geo_location.longitude);
                 if (distance <= NEARBY_RADIUS_METERS) {
                     tree.distance = distance;
                     tree.wateringStatus = calculateWateringStatus(tree);
                     allNearbyTrees.push(tree);
                 }
             }
         });
         allNearbyTrees.sort((a, b) => {
             const aNeedsWater = a.wateringStatus !== null && a.wateringStatus >= 0; const bNeedsWater = b.wateringStatus !== null && b.wateringStatus >= 0; if (aNeedsWater && !bNeedsWater) return -1; if (!aNeedsWater && bNeedsWater) return 1; if (aNeedsWater && bNeedsWater) { return b.wateringStatus - a.wateringStatus; } if (a.wateringStatus !== null && b.wateringStatus !== null) { return a.wateringStatus - b.wateringStatus; } if (a.wateringStatus !== null) return -1; if (b.wateringStatus !== null) return 1; return 0;
         });
         loadingOverlay.style.display = 'none';
         contentContainer.style.display = 'block';
         if (allNearbyTrees.length === 0) {
             treeList.innerHTML = '<p class="text-white/60 text-center">No approved trees found within 5km needing water currently.</p>';
             return;
         }
         treeList.innerHTML = '';
         allNearbyTrees.forEach(tree => {
            const card = createWaterTreeCard(tree);
            card.dataset.treeData = JSON.stringify(tree);
             treeList.appendChild(card);
         });
     } catch (error) {
         console.error("Error loading trees:", error);
         loadingOverlay.innerHTML = `<p class="text-red-500">Error loading trees: ${error.message}</p>`;
     }
}

function createWaterTreeCard(tree) {
    const card = document.createElement('div');
    let borderColor = 'border-white/10';
    if (tree.wateringStatus !== null && tree.wateringStatus > 0) borderColor = 'border-red-500';
    if (tree.wateringStatus === 0) borderColor = 'border-yellow-400';
    card.className = `glassmorphic p-4 rounded-lg flex flex-col md:flex-row gap-4 items-center border ${borderColor}`;
    card.id = `tree-${tree.id}`;

    const lastWateredDateStr = tree.last_watered_at ? tree.last_watered_at.toDate().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }).replace(/ /g, '-') : "Never";
    const nextWateringDateStr = calculateNextWateringDate(tree);
    let statusText = '';
    let statusColor = 'text-white/60';
    let showWaterButton = false;
    let wateredToday = false;

    if (tree.last_watered_at && daysBetween(tree.last_watered_at.toDate(), new Date()) === 0) {
        wateredToday = true;
    }

    if (wateredToday) {
        statusText = 'Watered today!';
        statusColor = 'text-primary font-bold';
        showWaterButton = false;
    } else if (tree.wateringStatus === null) {
        statusText = 'No watering schedule';
    } else if (tree.wateringStatus > 0) {
        statusText = `Overdue by ${tree.wateringStatus} day${tree.wateringStatus > 1 ? 's' : ''}!`;
        statusColor = 'text-red-500 font-bold';
        showWaterButton = true;
    } else if (tree.wateringStatus === 0) {
        statusText = 'Needs water today!';
        statusColor = 'text-yellow-400 font-bold';
        showWaterButton = true;
    } else {
        statusText = `Water in ${Math.abs(tree.wateringStatus)} day${Math.abs(tree.wateringStatus) > 1 ? 's' : ''}`;
        statusColor = 'text-green-400';
    }

    let buttonHtml = '';
    if (showWaterButton) {
        buttonHtml = `
            <button data-id="${tree.id}" class="water-btn">
                <span class="material-symbols-outlined text-base">water_drop</span>
                Water Me!
            </button>
            <p class="text-xs text-white/50 mt-1">Photo required</p>
        `;
    } else if (wateredToday) {
        buttonHtml = `
            <button class="water-btn watered" disabled>
                <span class="material-symbols-outlined text-base">check_circle</span>
                Watered Today!
            </button>
        `;
    } else {
        buttonHtml = `<p class="text-xs text-white/60 mt-1">${tree.watering_needs || 'No Schedule'}</p>`;
    }

    card.innerHTML = `
        <img src="${tree.image_data_url || 'placeholder.png'}" class="w-full md:w-32 h-32 object-cover rounded-md">
        <div class="grow">
            <h4 class="font-bold text-white text-lg">${tree.species} (${tree.age || 'N/A'})</h4>
            <p class="text-sm text-white/70">${tree.location_text || 'Unknown Location'}</p>
            <p class="text-sm text-primary font-medium mt-1">
                ~ ${Math.round(tree.distance)} meters away
            </p>
            <p class="text-xs text-white/60 mt-2">Last Watered: ${lastWateredDateStr}</p>
            <p class="text-xs ${statusColor} mt-1">${statusText}</p>
            ${tree.wateringStatus !== null && !wateredToday ? `<p class="text-xs text-white/60">Next Scheduled: ${nextWateringDateStr}</p>` : ''}
        </div>
        <div class="flex-shrink-0 w-full md:w-48 text-center md:text-right">
            ${buttonHtml}
        </div>
    `;
    return card;
}

treeList.addEventListener('click', async (e) => {
    const button = e.target.closest('.water-btn');
    if (button && !button.disabled) {
        const treeId = button.dataset.id;
        const cardElement = document.getElementById(`tree-${treeId}`);
        if (!user || !treeId || !cardElement || !cardElement.dataset.treeData) {
            console.error("Missing user, treeId, or treeData for watering action.");
            return;
        }

        let treeData;
        try {
             treeData = JSON.parse(cardElement.dataset.treeData);
        } catch (parseError) {
             console.error("Failed to parse tree data from card:", parseError);
             alert("An error occurred trying to get tree details.");
             return;
        }

        try {
            const logsQuery = query(
                collection(db, "watering_logs"),
                where("tree_id", "==", treeId),
                where("user_uid", "==", user.uid)
            );
            const logsSnapshot = await getDocs(logsQuery);
            const now = Timestamp.now();
            const twentyFourHoursAgo = Timestamp.fromMillis(now.toMillis() - (24 * 60 * 60 * 1000));
            
            let hasRecentLog = false;
            logsSnapshot.forEach((logDoc) => {
                const logData = logDoc.data();
                if (logData.timestamp && logData.timestamp.toMillis() >= twentyFourHoursAgo.toMillis()) {
                    hasRecentLog = true;
                }
            });

            if (hasRecentLog) {
                alert(`You have already logged care for this tree in the last 24 hours.\n\nRule: Same user cannot log the same tree twice within 24 hours.\n\nThis prevents duplicate entries and ensures fair distribution of care activities.`);
                return;
            }
        } catch (validationError) {
            console.error("Error checking 24-hour limit:", validationError);
            // Continue anyway - don't block user if validation check fails
        }

        const confirmed = confirm(`Have you just watered the ${treeData.species}?\n\nYou'll be asked to take a photo for verification.\n\nNote: You can only log this tree once every 24 hours.`);
        if (!confirmed) return;

        pendingWateringData = {
            button: button,
            treeId: treeId,
            treeData: treeData,
            clickedTimestamp: Timestamp.now()
        };

        verifyPhotoInput.value = null;
        verifyPhotoInput.click();
    }
});

verifyPhotoInput.addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (!file || !pendingWateringData) return;

    const { button, treeId, treeData, clickedTimestamp } = pendingWateringData;
    pendingWateringData = null; // Clear pending data immediately

    button.disabled = true;
    button.innerHTML = '<span class="material-symbols-outlined text-base animate-spin">photo_camera</span> Verifying...';

    let locationVerified = false;
    let timeVerified = false;
    let photoLocation = null;
    let photoTimestamp = null;

    try {
        const exifData = await new Promise((resolve) => { EXIF.getData(file, function() { resolve(EXIF.getAllTags(this)); }); });
        console.log("EXIF Data:", exifData);

        if (exifData.DateTimeOriginal) {
            const parts = exifData.DateTimeOriginal.split(' ');
            const dateParts = parts[0].split(':');
            const timeParts = parts[1].split(':');
            const exifDate = new Date(Date.UTC(dateParts[0], dateParts[1] - 1, dateParts[2], timeParts[0], timeParts[1], timeParts[2]));

            if (!isNaN(exifDate)) {
                photoTimestamp = Timestamp.fromDate(exifDate);
                const minutesDiff = Math.abs(clickedTimestamp.toDate() - exifDate) / (1000 * 60);
                if (minutesDiff <= TIME_TOLERANCE_MINUTES) { timeVerified = true; console.log(`Time verified: ${minutesDiff.toFixed(1)} mins ago.`); }
                else { console.warn(`Time fail: ${minutesDiff.toFixed(1)} mins ago.`); }
            } else { console.warn("Could not parse EXIF DateTime"); }
        } else { console.warn("EXIF DateTimeOriginal tag missing."); timeVerified = true; }

        if (exifData.GPSLatitude && exifData.GPSLongitude && treeData.geo_location?.latitude && treeData.geo_location?.longitude) {
            const lat = exifGPSToDecimal(exifData.GPSLatitude[0], exifData.GPSLatitude[1], exifData.GPSLatitude[2], exifData.GPSLatitudeRef);
            const lon = exifGPSToDecimal(exifData.GPSLongitude[0], exifData.GPSLongitude[1], exifData.GPSLongitude[2], exifData.GPSLongitudeRef);

             if (!isNaN(lat) && !isNaN(lon)) {
                photoLocation = new GeoPoint(lat, lon);
                const distance = calculateDistance(lat, lon, treeData.geo_location.latitude, treeData.geo_location.longitude);

                if (distance <= LOCATION_TOLERANCE_METERS) { locationVerified = true; console.log(`Location verified: ${distance.toFixed(0)}m from tree.`); }
                else { console.warn(`Location fail: ${distance.toFixed(0)}m from tree.`); }
            } else { console.warn("Could not parse EXIF GPS."); }
        } else { console.warn("EXIF GPS tags or tree location missing/invalid."); locationVerified = true; }

        if (!locationVerified || !timeVerified) {
             let errorMsg = "Verification Failed:";
             if (!locationVerified) errorMsg += "\n- Photo location doesn't match tree.";
             if (!timeVerified) errorMsg += "\n- Photo wasn't taken recently.";
             errorMsg += "\nPlease try again.";
             throw new Error(errorMsg);
        }

        button.innerHTML = '<span class="material-symbols-outlined text-base animate-spin">aspect_ratio</span> Resizing...';
        const imageDataUrl = await resizeImage(file, 600, 600, 0.6);
        if (imageDataUrl.length > 1000 * 1024) throw new Error('Resized image too large.');

        let suspiciousFlags = [];
        try {
            const oneHourAgo = Timestamp.fromMillis(clickedTimestamp.toMillis() - (60 * 60 * 1000));
            const recentLogsQuery = query(
                collection(db, "watering_logs"),
                where("user_uid", "==", user.uid),
                where("timestamp", ">=", oneHourAgo)
            );
            const recentLogsSnapshot = await getDocs(recentLogsQuery);
            if (recentLogsSnapshot.size >= 3) {
                suspiciousFlags.push("rapid_multiple_logs");
            }

            if (photoLocation && treeData.geo_location) {
                const distance = calculateDistance(
                    photoLocation.latitude, photoLocation.longitude,
                    treeData.geo_location.latitude, treeData.geo_location.longitude
                );
                if (distance > LOCATION_TOLERANCE_METERS) {
                    suspiciousFlags.push("gps_mismatch");
                }
            }

            if (recentLogsSnapshot.size >= 2) {
                const treeIds = new Set();
                recentLogsSnapshot.forEach(logDoc => {
                    const logData = logDoc.data();
                    if (logData.tree_id) treeIds.add(logData.tree_id);
                });
                if (treeIds.size >= 3) {
                    suspiciousFlags.push("multiple_trees_rapid");
                }
            }
        } catch (suspiciousCheckError) {
            console.warn("Error checking suspicious patterns:", suspiciousCheckError);
        }

        const waterLogEntry = {
            tree_id: treeId,
            tree_species: treeData.species,
            tree_location_text: treeData.location_text,
            user_uid: user.uid,
            timestamp: clickedTimestamp,
            image_data_url: imageDataUrl,
            verification_status: suspiciousFlags.length > 0 ? "flagged" : "pending",
            photo_location: photoLocation,
            photo_timestamp: photoTimestamp,
            suspicious_flags: suspiciousFlags.length > 0 ? suspiciousFlags : null
        };

        button.innerHTML = '<span class="material-symbols-outlined text-base animate-spin">save</span> Saving...';
        await addDoc(collection(db, "watering_logs"), waterLogEntry);
        const treeDocRef = doc(db, "trees", treeId);
        await updateDoc(treeDocRef, { last_watered_at: clickedTimestamp });

        button.innerHTML = '<span class="material-symbols-outlined text-base">hourglass_top</span> Pending Verify';
        button.classList.remove('bg-blue-600', 'hover:bg-blue-500');
        button.classList.add('pending');

        const cardElement = document.getElementById(`tree-${treeId}`);
        if (cardElement) {
            const todayStr = clickedTimestamp.toDate().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }).replace(/ /g, '-');
            const paragraphs = cardElement.querySelectorAll('.grow p');
            if (paragraphs.length >= 4) {
                 paragraphs[2].textContent = `Last Watered: ${todayStr}`;
                 paragraphs[3].textContent = 'Pending Verification';
                 paragraphs[3].className = 'text-xs text-yellow-400 mt-1';
                 if(paragraphs[4]) paragraphs[4].textContent = '';
             }
             cardElement.classList.remove('border-red-500', 'border-yellow-400');
             cardElement.classList.add('border-white/10');
        }

    } catch (error) {
        console.error("Error processing verification photo:", error);
        alert(`Watering log failed: ${error.message}`);
        button.disabled = false;
        button.innerHTML = '<span class="material-symbols-outlined text-base">water_drop</span> Water Me!';
    }
});
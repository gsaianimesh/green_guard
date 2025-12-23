import { auth, db } from './firebase-init.js';
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { collection, getDocs, doc, updateDoc, arrayUnion, query, orderBy } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const loadingOverlay = document.getElementById('loadingOverlay');
const contentContainer = document.getElementById('contentContainer');
const treeList = document.getElementById('treeList');
const mapElement = document.getElementById('map');
let map = null;
let user = null;

const AREA_RADIUS_METERS = 5000;
const ENDORSE_RADIUS_METERS = 500;
const approvedIcon = L.icon({
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
    iconSize: [25, 41], iconAnchor: [12, 41], popupAnchor: [1, -34], shadowSize: [41, 41]
});
const pendingIcon = L.icon({
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-yellow.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
    iconSize: [25, 41], iconAnchor: [12, 41], popupAnchor: [1, -34],     shadowSize: [41, 41]
});

function calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371e3;
    const phi1 = lat1 * Math.PI / 180;
    const phi2 = lat2 * Math.PI / 180;
    const deltaPhi = (lat2 - lat1) * Math.PI / 180;
    const deltaLambda = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
              Math.cos(phi1) * Math.cos(phi2) *
              Math.sin(deltaLambda / 2) * Math.sin(deltaLambda / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
}

onAuthStateChanged(auth, (loggedInUser) => {
    if (loggedInUser) {
        user = loggedInUser;
        getUserLocation();
    } else {
        alert("You must be logged in to view nearby trees.");
        window.location.href = 'auth.html';
    }
});

function getUserLocation() {
    if ("geolocation" in navigator) {
        navigator.geolocation.getCurrentPosition(
            (position) => {
                const userLat = position.coords.latitude;
                const userLon = position.coords.longitude;
                initializeMap(userLat, userLon);
                fetchAllTrees(userLat, userLon);
            },
            (error) => {
                loadingOverlay.innerHTML = '<p class="text-red-500">Could not get your location. Please enable location permissions and refresh.</p>';
            }
        );
    } else {
        loadingOverlay.innerHTML = '<p class="text-red-500">Geolocation is not supported by your browser.</p>';
    }
}

function initializeMap(lat, lon, zoom = 13) {
    map = L.map('map').setView([lat, lon], zoom);
    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_nolabels/{z}/{x}/{y}{r}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
        subdomains: 'abcd',
        maxZoom: 20
    }).addTo(map);

    L.marker([lat, lon]).addTo(map)
        .bindPopup('<b>Your Location</b>')
        .openPopup();
}

async function fetchAllTrees(userLat, userLon) {
    try {
        const q = query(collection(db, "trees"), orderBy("registered_at", "desc"));
        const querySnapshot = await getDocs(q);

        let allTrees = [];
        querySnapshot.forEach((doc) => {
            const tree = doc.data();
            if (tree.geo_location && tree.geo_location.latitude) {
                const distance = calculateDistance(
                    userLat, userLon,
                    tree.geo_location.latitude,
                    tree.geo_location.longitude
                );
                allTrees.push({ ...tree, id: doc.id, distance: distance });
            }
        });

        populateTreeList(allTrees, userLat, userLon);
        populateTreeMap(allTrees, userLat, userLon);

        loadingOverlay.style.display = 'none';
        contentContainer.style.display = 'block';
        map.invalidateSize();

    } catch (error) {
        console.error("Error loading trees:", error);
        loadingOverlay.innerHTML = `<p class="text-red-500">Error loading trees: ${error.message}</p>`;
    }
}

function populateTreeList(allTrees, userLat, userLon) {
    const pendingTrees = allTrees.filter(tree => tree.verification_status === 'pending');
    const approvedTrees = allTrees.filter(tree => tree.verification_status === 'approved');

    pendingTrees.sort((a, b) => a.distance - b.distance);
    approvedTrees.sort((a, b) => a.distance - b.distance);

    treeList.innerHTML = '';

    if (pendingTrees.length > 0) {
        const pendingHeader = document.createElement('h3');
        pendingHeader.className = 'text-xl font-bold text-yellow-400 mb-4 border-b border-yellow-400/30 pb-2';
        pendingHeader.textContent = 'Pending Endorsement (Nearby)';
        treeList.appendChild(pendingHeader);

        pendingTrees.forEach(tree => {
             if (tree.distance <= AREA_RADIUS_METERS) {
                 treeList.appendChild(createTreeCard(tree, user.uid, ENDORSE_RADIUS_METERS));
             }
        });
    } else {
        treeList.innerHTML += '<p class="text-white/60 text-center mb-6">No pending trees found nearby. Great job community!</p>';
    }

     if (approvedTrees.length > 0) {
        const approvedHeader = document.createElement('h3');
        approvedHeader.className = 'text-xl font-bold text-primary mt-8 mb-4 border-b border-primary/30 pb-2';
        approvedHeader.textContent = 'Approved Trees';
        treeList.appendChild(approvedHeader);

        approvedTrees.forEach(tree => {
            treeList.appendChild(createTreeCard(tree, user.uid, ENDORSE_RADIUS_METERS));
        });
    }

     if (pendingTrees.length === 0 && approvedTrees.length === 0) {
         treeList.innerHTML = '<p class="text-white/60 text-center">No trees have been registered yet.</p>';
     }
}

function createTreeCard(tree, userId, endorseRadius) {
    const card = document.createElement('div');
    card.className = 'glassmorphic p-4 rounded-lg flex flex-col md:flex-row gap-4 items-center';

    const isApproved = tree.verification_status === 'approved';
    const canEndorse = !isApproved && tree.distance <= endorseRadius;
    const alreadyEndorsed = tree.endorsed_by && tree.endorsed_by.includes(userId);

    let statusHtml = '';
    let distanceColor = 'text-white/90';

    if (isApproved) {
        statusHtml = `<p class="text-sm font-medium text-primary">✔️ Approved</p>`;
        statusHtml += `<p class="text-xs text-white/60 mt-1">${tree.endorsed_by?.length || 0} Endorsements</p>`
    } else if (alreadyEndorsed) {
        statusHtml = `<p class="text-sm font-medium text-primary">✔️ You endorsed this!</p>`;
        statusHtml += `<p class="text-xs text-white/60 mt-1">${tree.endorsed_by?.length || 0} Endorsements</p>`
    } else if (canEndorse) {
        statusHtml = `<button data-id="${tree.id}" class="endorse-btn w-full bg-primary text-background-dark font-bold py-2 px-3 rounded-full mt-2">Endorse This Tree</button>`;
        statusHtml += `<p class="text-xs text-white/60 mt-1">${tree.endorsed_by?.length || 0} Endorsements</p>`
        distanceColor = 'text-yellow-400';
    } else {
        statusHtml = `<p class="text-xs text-white/60 mt-2"><b>Status:</b> Pending<br>(Get within ${endorseRadius}m to endorse)</p>`;
        statusHtml += `<p class="text-xs text-white/60 mt-1">${tree.endorsed_by?.length || 0} Endorsements</p>`
        distanceColor = 'text-yellow-400';
    }

    card.innerHTML = `
        <img src="${tree.image_data_url}" class="w-full md:w-32 h-32 object-cover rounded-md">
        <div class="grow">
            <h4 class="font-bold text-white text-lg">${tree.species}</h4>
            <p class="text-sm text-white/70">${tree.location_text}</p>
            <p class="text-sm ${distanceColor} font-medium mt-1">
                ~ ${Math.round(tree.distance)} meters away
            </p>
        </div>
        <div class="flex-shrink-0 w-full md:w-48 text-center md:text-right">
            ${statusHtml}
        </div>
    `;
    return card;
}

function populateTreeMap(allTrees, userLat, userLon) {
     map.eachLayer((layer) => {
         if (layer instanceof L.Marker && layer.getLatLng().lat !== userLat) {
             map.removeLayer(layer);
         }
     });

    allTrees.forEach(tree => {
        const treeLat = tree.geo_location.latitude;
        const treeLon = tree.geo_location.longitude;

        const isApproved = tree.verification_status === 'approved';
        const icon = isApproved ? approvedIcon : pendingIcon;

        let popupContent = `
            <div class_"text-white">
                <h4 class="font-bold text-lg">${tree.species}</h4>
                <p class="text-sm">${isApproved ? '<b>Status:</b> <span style="color: #06f967;">Approved</span>' : '<b>Status:</b> <span style="color: yellow;">Pending</span>'}</p>
                <p class="text-xs">${tree.location_text}</p>
                <img src="${tree.image_data_url}" class="w-full h-32 object-cover rounded-md my-2">
        `;

        const canEndorse = !isApproved && tree.distance <= ENDORSE_RADIUS_METERS;
        const alreadyEndorsed = tree.endorsed_by && tree.endorsed_by.includes(user.uid);

        if (alreadyEndorsed) {
            popupContent += '<p class="text-sm text-primary">✔️ You endorsed this tree!</p>';
        } else if (canEndorse) {
            popupContent += `<button data-id="${tree.id}" class="endorse-btn w-full bg-primary text-background-dark font-bold py-2 px-3 rounded-full mt-2">Endorse This Tree</button>`;
        }

        popupContent += '</div>';

        L.marker([treeLat, treeLon], { icon: icon })
            .addTo(map)
            .bindPopup(popupContent);
    });
}

async function handleEndorseClick(e) {
    if (!e.target.classList.contains('endorse-btn')) return;
    const button = e.target;
    const treeId = button.dataset.id;
    if (!user || !treeId) return;
    button.disabled = true;
    button.innerText = 'Endorsing...';
    try {
        const treeDocRef = doc(db, "trees", treeId);
        await updateDoc(treeDocRef, { endorsed_by: arrayUnion(user.uid) });
        button.innerText = '✔️ Endorsed!';
        if (button.closest('#treeList')) {
            button.classList.remove('bg-primary', 'text-background-dark');
            button.classList.add('text-primary');
        } else {
            button.classList.remove('bg-primary');
            button.classList.add('bg-green-600');
        }
    } catch (error) {
        console.error("Error endorsing tree:", error);
        alert("Could not endorse tree. Please try again.");
        button.disabled = false;
        button.innerText = 'Endorse This Tree';
    }
}
treeList.addEventListener('click', handleEndorseClick);
mapElement.addEventListener('click', handleEndorseClick);
import { auth, db } from './firebase-init.js';
import { onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { doc, getDoc, collection, query, orderBy, limit, where, getDocs, Timestamp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const ADMIN_UID = "PASTE_YOUR_OWN_USER_UID_HERE";
let homepageMap = null;

const CO2_ABSORBED_PER_TREE_PER_YEAR = 22.7;
const OXYGEN_GENERATED_PER_TREE_PER_YEAR = 118;
const DAYS_FOR_ACTIVE_CARE = 30;

const approvedIcon = L.icon({
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
    iconSize: [25, 41], iconAnchor: [12, 41], popupAnchor: [1, -34],     shadowSize: [41, 41]
});

function setupAuthListeners() {
    const loginBtn = document.getElementById('loginBtn');
    const signOutBtn = document.getElementById('signOutBtn');
    const dashboardBtn = document.getElementById('dashboardBtn');
    const adminBtn = document.getElementById('adminBtn');
    const waterTreeBtn = document.getElementById('waterTreeBtn');
    const registerTreeBtn = document.getElementById('registerTreeBtn');
    const joinMovementLink = document.getElementById('joinMovementLink');

    onAuthStateChanged(auth, (user) => {
        if (user) {
            if(loginBtn) loginBtn.style.display = 'none';
            if(signOutBtn) signOutBtn.style.display = 'block';
            if(dashboardBtn) dashboardBtn.style.display = 'block';
            if(waterTreeBtn) waterTreeBtn.style.display = 'block';
            if(registerTreeBtn) registerTreeBtn.style.display = 'block';
            if(joinMovementLink) { joinMovementLink.href = 'register-tree.html'; joinMovementLink.textContent = 'Register a Tree'; }
            if (user.uid === ADMIN_UID && adminBtn) { adminBtn.style.display = 'block'; }
            else if (adminBtn) { adminBtn.style.display = 'none'; }
        } else {
            if(loginBtn) loginBtn.style.display = 'block';
            if(signOutBtn) signOutBtn.style.display = 'none';
            if(dashboardBtn) dashboardBtn.style.display = 'none';
            if(adminBtn) adminBtn.style.display = 'none';
            if(waterTreeBtn) waterTreeBtn.style.display = 'none';
            if(registerTreeBtn) registerTreeBtn.style.display = 'none';
            if(joinMovementLink) { joinMovementLink.href = 'auth.html'; joinMovementLink.textContent = 'Join the Movement'; }
        }
    });

    if (signOutBtn) {
        signOutBtn.addEventListener('click', () => {
            signOut(auth).then(() => {
                alert('You have been signed out.');
                window.location.reload();
            }).catch((error) => {
                console.error('Sign out error:', error);
                alert(`Sign out failed: ${error.message}`);
            });
        });
    }
}

function animateCountUp(el) {
    if (!el) return;
    const final = parseInt(el.textContent.replace(/,/g, ''));
    if (isNaN(final) || final === 0) { el.textContent = final || '0'; return; }
    el.textContent = '0';
    let start = 0;
    const duration = 1500;
    const startTime = performance.now();

    function step(currentTime) {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const currentCount = Math.floor(progress * final);
        el.textContent = currentCount.toLocaleString();
        if (progress < 1) {
            requestAnimationFrame(step);
        } else {
            el.textContent = final.toLocaleString();
        }
    }
    requestAnimationFrame(step);
}

function setupScrollAnimations() {
    const elements = document.querySelectorAll('.animate-on-scroll');
    if (!elements.length) return;

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('is-visible');
                observer.unobserve(entry.target);
            }
        });
    }, { 
        threshold: 0.1
    });

    elements.forEach(el => observer.observe(el));
}

function showSkeletonLoaders() {
    const dedicatedMembersList = document.getElementById('dedicatedMembersList');
    const leaderboardList = document.getElementById('leaderboardList');
    const galleryGrid = document.getElementById('galleryGrid');

    // Skeleton for Dedicated Members
    if (dedicatedMembersList) {
        dedicatedMembersList.innerHTML = `
            <div class="flex-shrink-0 w-72 glassmorphic rounded-xl p-4 opacity-50 animate-pulse">
                <div class="w-full h-48 rounded-lg bg-white/10 mb-4"></div>
                <div class="h-5 w-3/4 rounded bg-white/10 mb-2"></div>
                <div class="h-4 w-1/2 rounded bg-white/10"></div>
            </div>
            <div class="flex-shrink-0 w-72 glassmorphic rounded-xl p-4 opacity-50 animate-pulse hidden md:block">
                <div class="w-full h-48 rounded-lg bg-white/10 mb-4"></div>
                <div class="h-5 w-3/4 rounded bg-white/10 mb-2"></div>
                <div class="h-4 w-1/2 rounded bg-white/10"></div>
            </div>
            <div class="flex-shrink-0 w-72 glassmorphic rounded-xl p-4 opacity-50 animate-pulse hidden lg:block">
                <div class="w-full h-48 rounded-lg bg-white/10 mb-4"></div>
                <div class="h-5 w-3/4 rounded bg-white/10 mb-2"></div>
                <div class="h-4 w-1/2 rounded bg-white/10"></div>
            </div>
        `;
    }

    // Skeleton for Leaderboard
    if (leaderboardList) {
        leaderboardList.innerHTML = `
            <div class="glassmorphic p-6 rounded-xl flex items-center gap-4 animate-pulse opacity-50">
                <div class="w-16 h-16 rounded-full bg-white/10 border-2 border-white/20"></div>
                <div class="flex-1"><div class="h-5 w-1/2 rounded bg-white/10 mb-2"></div><div class="h-4 w-1/4 rounded bg-white/10"></div></div>
            </div>
            <div class="glassmorphic p-6 rounded-xl flex items-center gap-4 animate-pulse opacity-50">
                <div class="w-16 h-16 rounded-full bg-white/10 border-2 border-white/20"></div>
                <div class="flex-1"><div class="h-5 w-1/2 rounded bg-white/10 mb-2"></div><div class="h-4 w-1/4 rounded bg-white/10"></div></div>
            </div>
            <div class="glassmorphic p-6 rounded-xl flex items-center gap-4 animate-pulse opacity-50">
                <div class="w-16 h-16 rounded-full bg-white/10 border-2 border-white/20"></div>
                <div class="flex-1"><div class="h-5 w-1/2 rounded bg-white/10 mb-2"></div><div class="h-4 w-1/4 rounded bg-white/10"></div></div>
            </div>
        `;
    }

    // Skeleton for Gallery
    if (galleryGrid) {
        galleryGrid.innerHTML = `
            <div class="glassmorphic p-2 rounded-xl animate-pulse opacity-50"><div class="gallery-img w-full bg-white/10"></div></div>
            <div class="glassmorphic p-2 rounded-xl animate-pulse opacity-50"><div class="gallery-img w-full bg-white/10"></div></div>
            <div class="glassmorphic p-2 rounded-xl animate-pulse opacity-50 hidden md:block"><div class="gallery-img w-full bg-white/10"></div></div>
            <div class="glassmorphic p-2 rounded-xl animate-pulse opacity-50 hidden lg:block"><div class="gallery-img w-full bg-white/10"></div></div>
        `;
    }
}

async function displayTreeCount() {
    const treeCountDisplay = document.getElementById('treeCountDisplay');
    if (!treeCountDisplay) return;
    treeCountDisplay.textContent = '...';
    try {
        const treesSnapshot = await getDocs(collection(db, "trees"));
        treeCountDisplay.textContent = treesSnapshot.size;
        animateCountUp(treeCountDisplay);
    } catch (error) {
        console.error("Error getting tree count:", error);
        treeCountDisplay.textContent = 'Error';
    }
}

async function displayCommunityCount() {
    const communityCountDisplay = document.getElementById('communityCountDisplay');
    if (!communityCountDisplay) return;
    communityCountDisplay.textContent = '...';
    try {
        const usersSnapshot = await getDocs(collection(db, "users"));
        const locations = new Set();
        usersSnapshot.forEach((doc) => {
            const userData = doc.data();
            if (userData.location_text) {
                 const normalizedLocation = userData.location_text.trim().toLowerCase();
                 if (normalizedLocation) { locations.add(normalizedLocation); }
            }
        });
        communityCountDisplay.textContent = locations.size;
        animateCountUp(communityCountDisplay);
    } catch (error) {
        console.error("Error fetching community count:", error);
        communityCountDisplay.textContent = 'Error';
    }
}

async function displayMemberCount() {
    const memberCountDisplay = document.getElementById('memberCountDisplay');
    if (!memberCountDisplay) return;
    memberCountDisplay.textContent = '...';
    try {
        const usersSnapshot = await getDocs(collection(db, "users"));
        memberCountDisplay.textContent = usersSnapshot.size;
        animateCountUp(memberCountDisplay);
    } catch (error) {
        console.error("Error fetching member count:", error);
        memberCountDisplay.textContent = 'Error';
    }
}

async function displayTopUsers() {
    const dedicatedMembersList = document.getElementById('dedicatedMembersList');
    const leaderboardList = document.getElementById('leaderboardList');
    if (!dedicatedMembersList || !leaderboardList) return;
    
    try {
        const q = query(collection(db, "users"), orderBy("eco_points", "desc"), limit(3));
        const querySnapshot = await getDocs(q);

        // Clear skeletons
        dedicatedMembersList.innerHTML = '';
        leaderboardList.innerHTML = '';

        if (querySnapshot.empty) {
            dedicatedMembersList.innerHTML = '<p class="text-white/60 w-full text-center">No members yet.</p>';
            leaderboardList.innerHTML = '<p class="text-white/60 md:col-span-3 text-center">No members yet.</p>';
            return;
        }
        
        const topUsers = [];
        querySnapshot.forEach((doc) => { topUsers.push({ id: doc.id, ...doc.data() }); });

        topUsers.forEach(user => {
            const memberCard = document.createElement('div');
            memberCard.className = 'flex-shrink-0 w-72 glassmorphic rounded-xl p-4 border border-primary/20 transition-all duration-300 transform hover:-translate-y-2 cursor-pointer';
            const userImage = user.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.username || 'User')}&background=06f967&color=0B0E0C&size=200&bold=true`;
            memberCard.innerHTML = `<img src="${userImage}" alt="${user.username || 'User'}" class="w-full h-48 object-cover rounded-lg mb-4 bg-white/10" onerror="this.src='https://ui-avatars.com/api/?name=${encodeURIComponent(user.username || 'User')}&background=06f967&color=0B0E0C&size=200&bold=true'"><h4 class="font-bold text-white">${user.username || 'User'}</h4><p class="text-sm text-primary font-semibold">${(user.eco_points || 0).toLocaleString()} XP</p>`;
            dedicatedMembersList.appendChild(memberCard);
        });
        
        const medals = ['🥇', '🥈', '🥉'];
        const borderColors = ['border-amber-400', 'border-slate-300', 'border-amber-700'];
        const textColors = ['text-amber-400', 'text-white', 'text-white'];
        
        topUsers.forEach((user, index) => {
            const rankCard = document.createElement('div');
            const isFirst = index === 0;
            rankCard.className = `glassmorphic p-6 rounded-xl flex items-center gap-4 ${isFirst ? 'border-2 border-amber-400 transform md:scale-110 shadow-lg' : 'border border-white/10'} transition-all duration-300 hover:shadow-glow-green hover:-translate-y-2 cursor-pointer`;
            const userImage = user.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.username || 'User')}&background=06f967&color=0B0E0C&size=128&bold=true`;
            rankCard.innerHTML = `<span class="text-4xl">${medals[index] || ''}</span><img src="${userImage}" alt="${user.username || 'User'}" class="leaderboard-img ${borderColors[index] || 'border-white/20'}" onerror="this.src='https://ui-avatars.com/api/?name=${encodeURIComponent(user.username || 'User')}&background=06f967&color=0B0E0C&size=128&bold=true'"><div><h4 class="font-bold text-lg ${textColors[index] || 'text-white'}">${user.username || 'User'}</h4><p class="text-sm text-primary/80">${(user.eco_points || 0).toLocaleString()} XP</p></div>`;
            leaderboardList.appendChild(rankCard);
        });
        
        if (leaderboardList.children.length > 0 && leaderboardList.children.length < 3) {
            leaderboardList.classList.add('md:grid-cols-3');
        }

    } catch (error) {
        console.error("Error loading top users:", error);
        if (dedicatedMembersList) dedicatedMembersList.innerHTML = '<p class="text-white/60 w-full text-center">Error loading members.</p>';
        if (leaderboardList) leaderboardList.innerHTML = '<p class="text-white/60 md:col-span-3 text-center">Error loading leaderboard.</p>';
    }
}

async function displayRecentTrees() {
     const galleryGrid = document.getElementById('galleryGrid');
     if (!galleryGrid) return; 
     
     try { 
        const q = query( collection(db, "trees"), where("verification_status", "==", "approved"), orderBy("registered_at", "desc"), limit(4) ); 
        const querySnapshot = await getDocs(q); 
        
        galleryGrid.innerHTML = ''; 
        
        if (querySnapshot.empty) { 
            galleryGrid.innerHTML = '<p class="text-white/60 md:col-span-full text-center">No approved trees yet.</p>'; 
            return; 
        } 
        
        querySnapshot.forEach((doc) => { 
            const tree = doc.data(); 
            if (tree.image_data_url) { 
                const galleryItem = document.createElement('div'); 
                galleryItem.className = 'glassmorphic p-2 rounded-xl group relative overflow-hidden'; 
                const img = document.createElement('img'); 
                img.src = tree.image_data_url; 
                img.alt = `Photo of ${tree.species || 'tree'}`; 
                img.className = 'gallery-img w-full'; 
                const overlay = document.createElement('div'); 
                overlay.className = 'absolute inset-0 bg-black/70 flex items-end p-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300'; 
                overlay.innerHTML = `<div><h5 class="font-bold text-sm text-primary">${tree.species || 'Tree'}</h5><p class="text-xs text-white/80 line-clamp-2">${tree.location_text || 'Location unknown'}</p></div>`; 
                galleryItem.appendChild(img); 
                galleryItem.appendChild(overlay); 
                galleryGrid.appendChild(galleryItem); 
            } 
        }); 
    } catch (error) { 
        console.error("Error loading recent trees:", error); 
        if (galleryGrid) galleryGrid.innerHTML = '<p class="text-white/60 md:col-span-full text-center">Error loading gallery.</p>';
    }
}

async function initializeHomepageMap() {
    const mapElement = document.getElementById('map');
    const mapLoadingElement = document.getElementById('mapLoading');
    if (!mapElement) {
        console.error("Map container element not found!");
        return;
    }

    const defaultLat = 20.5937;
    const defaultLon = 78.9629;
    const defaultZoom = 5;

    try {
        homepageMap = L.map(mapElement).setView([defaultLat, defaultLon], defaultZoom);

        L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_nolabels/{z}/{x}/{y}{r}.png', {
            attribution: '© <a href="https://www.openstreetmap.org/copyright">OSM</a> © <a href="https://carto.com/attributions">CARTO</a>',
            subdomains: 'abcd',
            maxZoom: 19
        }).addTo(homepageMap);

        if(mapLoadingElement) mapLoadingElement.style.display = 'none';

        const markers = L.markerClusterGroup({
            iconCreateFunction: function (cluster) {
                return L.divIcon({
                    html: `<div class="cluster-icon">${cluster.getChildCount()}</div>`,
                    className: 'leaflet-marker-cluster',
                    iconSize: L.point(40, 40)
                });
            },
            spiderfyOnMaxZoom: true,
            showCoverageOnHover: false,
        });

        const q = query(collection(db, "trees"), where("verification_status", "==", "approved"));
        const querySnapshot = await getDocs(q);

        querySnapshot.forEach((doc) => {
            const tree = doc.data();
            if (tree.geo_location?.latitude) {
                const treeLat = tree.geo_location.latitude;
                const treeLon = tree.geo_location.longitude;

                let popupContent = `
                    <div>
                        <h4 class="font-bold">${tree.species || 'Tree'}</h4>
                        <p class="text-xs">${tree.location_text || 'Location'}</p>
                        ${tree.image_data_url ? `<img src="${tree.image_data_url}" class="w-full h-24 object-cover rounded my-1">` : ''}
                        <a href="view-tree.html?id=${doc.id}" class="text-xs text-primary hover:underline">View Details</a>
                    </div>`;

                const marker = L.marker([treeLat, treeLon], { icon: approvedIcon })
                    .bindPopup(popupContent);
                markers.addLayer(marker);
            }
        });

        homepageMap.addLayer(markers);
        console.log(`Added ${querySnapshot.size} approved trees to the map via clustering.`);

    } catch (error) {
        console.error("Error initializing map or loading trees:", error);
         if(mapLoadingElement) mapLoadingElement.textContent = 'Error loading map data.';
         else if (mapElement) mapElement.innerHTML = '<p class="text-red-500 p-4">Error loading map data.</p>';
    }
}

async function displayImpactMetrics() {
    const co2Display = document.getElementById('co2AbsorbedDisplay');
    const oxygenDisplay = document.getElementById('oxygenGeneratedDisplay');
    const survivalRateDisplay = document.getElementById('survivalRateDisplay');
    const careLogsDisplay = document.getElementById('careLogsDisplay');
    const topCommunitiesList = document.getElementById('topCommunitiesList');
    
    if (!co2Display || !oxygenDisplay || !survivalRateDisplay) return;
    
    try {
        const treesSnapshot = await getDocs(collection(db, "trees"));
        const usersSnapshot = await getDocs(collection(db, "users"));
        const logsSnapshot = await getDocs(collection(db, "watering_logs"));
        
        const allTrees = [];
        treesSnapshot.forEach((doc) => {
            allTrees.push({ id: doc.id, ...doc.data() });
        });
        
        const allUsers = [];
        usersSnapshot.forEach((doc) => {
            allUsers.push({ id: doc.id, ...doc.data() });
        });
        
        const allLogs = [];
        logsSnapshot.forEach((doc) => {
            allLogs.push({ id: doc.id, ...doc.data() });
        });
        
        const approvedTrees = allTrees.filter(t => t.verification_status === 'approved').length;
        
        const thirtyDaysAgo = Timestamp.fromDate(new Date(Date.now() - DAYS_FOR_ACTIVE_CARE * 24 * 60 * 60 * 1000));
        const activeTrees = allTrees.filter(tree => {
            if (tree.verification_status !== 'approved') return false;
            if (!tree.last_watered_at) return false;
            return tree.last_watered_at.toMillis() >= thirtyDaysAgo.toMillis();
        }).length;
        
        const survivalRate = approvedTrees > 0 ? ((activeTrees / approvedTrees) * 100).toFixed(1) : 0;
        const co2Absorbed = (approvedTrees * CO2_ABSORBED_PER_TREE_PER_YEAR).toFixed(1);
        const oxygenGenerated = (approvedTrees * OXYGEN_GENERATED_PER_TREE_PER_YEAR).toFixed(1);
        
        if (careLogsDisplay) {
            careLogsDisplay.textContent = allLogs.length;
            animateCountUp(careLogsDisplay, allLogs.length);
        }
        
        co2Display.textContent = co2Absorbed + ' kg';
        oxygenDisplay.textContent = oxygenGenerated + ' kg';
        survivalRateDisplay.textContent = survivalRate + '%';
        
        if (topCommunitiesList) {
            const communityMap = new Map();
            allUsers.forEach(user => {
                if (user.location_text) {
                    const loc = user.location_text.trim().toLowerCase();
                    communityMap.set(loc, (communityMap.get(loc) || 0) + 1);
                }
            });
            const topCommunities = Array.from(communityMap.entries())
                .sort((a, b) => b[1] - a[1])
                .slice(0, 5)
                .map(([name, count]) => ({ name, count }));
            
            if (topCommunities.length > 0) {
                topCommunitiesList.innerHTML = topCommunities.map((comm, idx) => `
                    <div class="flex justify-between items-center text-sm py-2 border-b border-white/10 last:border-0">
                        <span class="text-white/80">${idx + 1}. ${comm.name.charAt(0).toUpperCase() + comm.name.slice(1)}</span>
                        <span class="text-primary font-semibold">${comm.count} members</span>
                    </div>
                `).join('');
            } else {
                topCommunitiesList.innerHTML = '<p class="text-white/60 text-sm text-center py-4">No communities yet.</p>';
            }
        }
        
    } catch (error) {
        console.error("Error loading impact metrics:", error);
        if (co2Display) co2Display.textContent = 'Error';
        if (oxygenDisplay) oxygenDisplay.textContent = 'Error';
        if (survivalRateDisplay) survivalRateDisplay.textContent = 'Error';
        if (careLogsDisplay) careLogsDisplay.textContent = 'Error';
        if (topCommunitiesList) topCommunitiesList.innerHTML = '<p class="text-white/60 text-sm text-center py-4">Error loading communities.</p>';
    }
}

window.addEventListener('DOMContentLoaded', () => {
    console.log("DOM fully loaded. Initializing page...");
    
    setupAuthListeners();
    setupScrollAnimations();
    
    showSkeletonLoaders();

    displayTreeCount();
    displayCommunityCount();
    displayMemberCount();
    displayTopUsers();
    displayRecentTrees();
    displayImpactMetrics();
    initializeHomepageMap();
});
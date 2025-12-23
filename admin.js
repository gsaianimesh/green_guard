import { auth, db } from './firebase-init.js';
import { onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { collection, query, where, getDocs, doc, updateDoc, deleteDoc, Timestamp, increment } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const ADMIN_UID = "FneDKEkGyUNcZ5IBWvU15dC89Ni2";
const signOutBtn = document.getElementById('signOutBtn');
const pendingTreesList = document.getElementById('pendingTreesList');
const loadingSpinnerPending = document.getElementById('loadingSpinnerPending');
const approvedTreesList = document.getElementById('approvedTreesList');
const loadingSpinnerApproved = document.getElementById('loadingSpinnerApproved');
const pendingWateringLogsList = document.getElementById('pendingWateringLogsList');
const loadingSpinnerWatering = document.getElementById('loadingSpinnerWatering');

const POINTS_FOR_WATERING = 5;

const CO2_ABSORBED_PER_TREE_PER_YEAR = 22.7;
const OXYGEN_GENERATED_PER_TREE_PER_YEAR = 118;
const DAYS_FOR_ACTIVE_CARE = 30;
onAuthStateChanged(auth, (user) => {
    if (user) {
        if (user.uid === ADMIN_UID) {
            console.log("Admin access granted.");
            loadStatisticsDashboard();
            loadPendingTrees();
            loadApprovedTrees();
            loadPendingWateringLogs();
        } else {
            console.warn("Non-admin user tried to access admin page. Redirecting.");
            alert("You do not have permission to access this page.");
            window.location.href = 'index.html';
        }
    } else {
        console.log("No user logged in. Redirecting to auth page.");
        window.location.href = 'auth.html';
    }
});

signOutBtn.addEventListener('click', () => {
    signOut(auth).then(() => {
        alert('Signed out.');
        window.location.href = 'index.html';
    }).catch(error => {
        console.error('Sign out error:', error);
        alert(`Sign out failed: ${error.message}`);
    });
});

async function loadPendingTrees() {
    loadingSpinnerPending.style.display = 'block';
    pendingTreesList.innerHTML = '';
    try {
        const q = query(collection(db, "trees"), where("verification_status", "==", "pending"));
        const querySnapshot = await getDocs(q);
        loadingSpinnerPending.style.display = 'none';

        if (querySnapshot.empty) {
            pendingTreesList.innerHTML = '<p class="text-white/60 text-center glassmorphic p-4">No trees pending approval.</p>';
            return;
        }
        querySnapshot.forEach((doc) => {
            pendingTreesList.appendChild(createAdminTreeCard(doc.data(), doc.id));
        });
    } catch (error) {
        console.error("Error loading pending trees:", error);
        loadingSpinnerPending.innerHTML = '<p class="text-red-500">Error loading pending trees.</p>';
    }
}

async function loadApprovedTrees() {
    loadingSpinnerApproved.style.display = 'block';
    approvedTreesList.innerHTML = '';
    try {
        const q = query(collection(db, "trees"), where("verification_status", "==", "approved"));
        const querySnapshot = await getDocs(q);
        loadingSpinnerApproved.style.display = 'none';

        if (querySnapshot.empty) {
            approvedTreesList.innerHTML = '<p class="text-white/60 text-center glassmorphic p-4">No approved trees found.</p>';
            return;
        }
        querySnapshot.forEach((doc) => {
            approvedTreesList.appendChild(createAdminTreeCard(doc.data(), doc.id));
        });
    } catch (error) {
        console.error("Error loading approved trees:", error);
        loadingSpinnerApproved.innerHTML = '<p class="text-red-500">Error loading approved trees.</p>';
    }
}

function createAdminTreeCard(tree, treeId) {
    const card = document.createElement('div');
    card.className = 'glassmorphic p-4 rounded-lg flex flex-col';
    card.id = `tree-card-${treeId}`;

    const isPending = tree.verification_status === 'pending';
    const plantedDateStr = tree.planting_date?.toDate().toLocaleDateString('en-GB') || 'N/A';
    const lastWateredTimestamp = tree.last_watered_at;
    const lastWateredDateForInput = lastWateredTimestamp ? lastWateredTimestamp.toDate().toISOString().split('T')[0] : '';
    const lastWateredDisplayStr = lastWateredTimestamp ? lastWateredTimestamp.toDate().toLocaleDateString('en-GB', { day:'2-digit', month:'short', year:'numeric', hour:'2-digit', minute:'2-digit'}) : 'Never';

    card.innerHTML = `
        <div class="flex flex-col md:flex-row gap-4">
            <a href="${tree.image_data_url}" target="_blank" title="View full image" class="flex-shrink-0 w-full md:w-32 h-32">
                <img src="${tree.image_data_url}" class="w-full h-full object-cover rounded-md cursor-pointer">
            </a>
            <div class="grow space-y-1 text-sm">
                <h4 class="font-bold text-white text-lg">${tree.species} (${tree.age || 'N/A'})</h4>
                <p class="text-white/70">${tree.location_text || 'Unknown Location'}</p>
                <p><span class="text-white/60">Planted:</span> ${plantedDateStr}</p>
                <p><span class="text-white/60">Last Watered:</span> <span id="last-watered-display-${treeId}">${lastWateredDisplayStr}</span></p>
                <p><span class="text-white/60">Watering Needs:</span> <span id="watering-display-${treeId}">${tree.watering_needs || 'Not Set'}</span></p>
                <p><span class="text-white/60">Endorsements:</span> ${tree.endorsed_by?.length || 0}</p>
                ${tree.notes ? `<p class="text-xs text-white/70 mt-1"><span class="text-white/60">Notes:</span> ${tree.notes}</p>` : ''}
            </div>
            <div class="flex-shrink-0 flex flex-col gap-2 items-end justify-start w-full md:w-auto">
                ${isPending ? `
                    <div class="flex gap-2">
                         <button data-id="${treeId}" data-action="approve" class="admin-action-btn bg-primary text-background-dark hover:bg-opacity-80">Approve</button>
                         <button data-id="${treeId}" data-action="reject" class="admin-action-btn bg-yellow-600 text-white hover:bg-opacity-80">Reject (Delete)</button>
                    </div>
                ` : `
                    <button data-id="${treeId}" data-action="toggle-edit" class="admin-action-btn bg-blue-600 text-white hover:bg-blue-500 mb-2 w-full md:w-auto">Edit Details</button>
                    <button data-id="${treeId}" data-action="delete" class="admin-action-btn bg-red-600 text-white hover:bg-red-500 w-full md:w-auto">Delete Tree</button>
                `}
            </div>
        </div>
        <div id="edit-fields-${treeId}" class="edit-fields hidden">
            <h5 class="text-sm font-bold mb-2 text-white/80">Edit Tree Details:</h5>
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                <div>
                    <label for="edit-species-${treeId}" class="block text-white/60 mb-1">Species</label>
                    <input type="text" id="edit-species-${treeId}" value="${tree.species || ''}" class="edit-input">
                </div>
                <div>
                    <label for="edit-age-${treeId}" class="block text-white/60 mb-1">Age</label>
                    <select id="edit-age-${treeId}" class="edit-input">
                        <option value="<1 year (Sapling)" ${tree.age === '<1 year (Sapling)' ? 'selected' : ''}><1 year (Sapling)</option>
                        <option value="1-3 years" ${tree.age === '1-3 years' ? 'selected' : ''}>1-3 years</option>
                        <option value="3-5 years" ${tree.age === '3-5 years' ? 'selected' : ''}>3-5 years</option>
                        <option value="5+ years (Mature)" ${tree.age === '5+ years (Mature)' ? 'selected' : ''}>5+ years (Mature)</option>
                    </select>
                </div>
                 <div>
                    <label for="edit-watering-${treeId}" class="block text-white/60 mb-1">Watering Needs</label>
                    <select id="edit-watering-${treeId}" class="edit-input">
                         <option value="" ${!tree.watering_needs ? 'selected' : ''}>Not Set</option>
                         <option value="Daily" ${tree.watering_needs === 'Daily' ? 'selected' : ''}>Daily</option>
                         <option value="Every 2-3 days" ${tree.watering_needs === 'Every 2-3 days' ? 'selected' : ''}>Every 2-3 days</option>
                         <option value="Weekly" ${tree.watering_needs === 'Weekly' ? 'selected' : ''}>Weekly</option>
                         <option value="Rain-fed" ${tree.watering_needs === 'Rain-fed' ? 'selected' : ''}>Rain-fed</option>
                         <option value="Only during dry spells" ${tree.watering_needs === 'Only during dry spells' ? 'selected' : ''}>Dry Spells Only</option>
                    </select>
                </div>
                <div>
                    <label for="edit-last-watered-${treeId}" class="block text-white/60 mb-1">Last Watered Date</label>
                    <input type="date" id="edit-last-watered-${treeId}" value="${lastWateredDateForInput}" class="edit-input">
                </div>
                <div class="sm:col-span-2">
                    <label for="edit-notes-${treeId}" class="block text-white/60 mb-1">Notes</label>
                    <textarea id="edit-notes-${treeId}" class="edit-input !pl-2" rows="2">${tree.notes || ''}</textarea>
                </div>
            </div>
            <div class="mt-3 flex justify-end gap-2">
                 <button data-id="${treeId}" data-action="cancel-edit" class="admin-action-btn bg-gray-500 text-white hover:bg-gray-400">Cancel</button>
                 <button data-id="${treeId}" data-action="save-changes" class="admin-action-btn bg-green-600 text-white hover:bg-green-500">Save Changes</button>
            </div>
        </div>
    `;
    return card;
}

async function loadPendingWateringLogs() {
    loadingSpinnerWatering.style.display = 'block';
    pendingWateringLogsList.innerHTML = '';
    try {
        const pendingQuery = query(collection(db, "watering_logs"), where("verification_status", "==", "pending"));
        const flaggedQuery = query(collection(db, "watering_logs"), where("verification_status", "==", "flagged"));
        const [pendingSnapshot, flaggedSnapshot] = await Promise.all([
            getDocs(pendingQuery),
            getDocs(flaggedQuery)
        ]);
        
        const allLogs = [];
        pendingSnapshot.forEach((doc) => {
            allLogs.push({ id: doc.id, data: doc.data(), isFlagged: false });
        });
        flaggedSnapshot.forEach((doc) => {
            allLogs.push({ id: doc.id, data: doc.data(), isFlagged: true });
        });
        
        loadingSpinnerWatering.style.display = 'none';

        if (allLogs.length === 0) {
            pendingWateringLogsList.innerHTML = '<p class="text-white/60 text-center glassmorphic p-4">No watering logs pending verification.</p>';
            return;
        }
        
        allLogs.sort((a, b) => {
            if (a.isFlagged !== b.isFlagged) return a.isFlagged ? -1 : 1;
            return (b.data.timestamp?.toMillis() || 0) - (a.data.timestamp?.toMillis() || 0);
        });
        
        allLogs.forEach((item) => {
            const logData = { ...item.data, verification_status: item.isFlagged ? 'flagged' : 'pending' };
            pendingWateringLogsList.appendChild(createWateringLogCard(logData, item.id));
        });
    } catch (error) {
        console.error("Error loading pending watering logs:", error);
        loadingSpinnerWatering.innerHTML = '<p class="text-red-500">Error loading logs.</p>';
    }
}

function createWateringLogCard(log, logId) {
    const card = document.createElement('div');
    const isFlagged = log.verification_status === 'flagged' || log.isFlagged;
    card.className = `glassmorphic p-4 rounded-lg flex flex-col md:flex-row gap-4 ${isFlagged ? 'border-2 border-yellow-500/50' : ''}`;
    card.id = `log-card-${logId}`;

    const wateredTime = log.timestamp?.toDate().toLocaleString('en-GB', { dateStyle: 'medium', timeStyle: 'short' }) || 'N/A';
    const photoTime = log.photo_timestamp?.toDate().toLocaleString('en-GB', { dateStyle: 'medium', timeStyle: 'short' }) || 'N/A';
    const suspiciousFlags = log.suspicious_flags || [];

    let flagBadge = '';
    if (isFlagged && suspiciousFlags.length > 0) {
        const flagMessages = {
            'rapid_multiple_logs': 'Multiple rapid logs detected',
            'gps_mismatch': 'GPS location mismatch',
            'multiple_trees_rapid': 'Multiple trees in short time'
        };
        flagBadge = `<div class="mb-2 p-2 bg-yellow-500/20 border border-yellow-500/50 rounded text-xs">
            <span class="material-symbols-outlined text-yellow-400 text-sm align-middle">warning</span>
            <span class="text-yellow-400 font-semibold">Flagged for Review:</span>
            <ul class="list-disc list-inside mt-1 text-yellow-300/80">
                ${suspiciousFlags.map(flag => `<li>${flagMessages[flag] || flag}</li>`).join('')}
            </ul>
        </div>`;
    }

    card.innerHTML = `
        <a href="${log.image_data_url}" target="_blank" title="View verification photo" class="flex-shrink-0 w-full md:w-32 h-32">
            <img src="${log.image_data_url}" class="w-full h-full object-cover rounded-md cursor-pointer">
        </a>
        <div class="grow space-y-1 text-sm">
            <div class="flex items-center gap-2">
                <h4 class="font-bold text-white text-base">${log.tree_species}</h4>
                ${isFlagged ? '<span class="px-2 py-0.5 bg-yellow-500/30 text-yellow-300 text-xs rounded-full font-semibold">⚠️ FLAGGED</span>' : ''}
            </div>
            ${flagBadge}
            <p class="text-white/70">${log.tree_location_text}</p>
            <p><span class="text-white/60">Watered At (Claimed):</span> ${wateredTime}</p>
            <p><span class="text-white/60">Photo Taken At:</span> ${photoTime}</p>
            <p><span class="text-white/60">User ID:</span> <span class="text-xs">${log.user_uid}</span></p>
        </div>
        <div class="flex-shrink-0 flex flex-col gap-2 items-end justify-center w-full md:w-auto">
             <button data-id="${logId}" data-action="approve-watering" data-userid="${log.user_uid}" class="admin-action-btn bg-primary text-background-dark hover:bg-opacity-80 w-full md:w-auto">Approve (+${POINTS_FOR_WATERING} pts)</button>
             <button data-id="${logId}" data-action="reject-watering" class="admin-action-btn bg-red-600 text-white hover:bg-red-500 w-full md:w-auto">Reject</button>
        </div>
    `;
    return card;
}

document.addEventListener('click', async (e) => {
    const button = e.target.closest('button[data-action]');
    if (!button) return;

    const action = button.dataset.action;
    const docId = button.dataset.id;

    button.disabled = true;
    const originalButtonText = button.innerHTML;
    if (!button.querySelector('.material-symbols-outlined')) { button.innerText = '...'; }
    else { button.innerHTML = '<span class="material-symbols-outlined text-sm animate-spin">progress_activity</span>'; }

    let docRef;
    let cardElement;

    try {
        switch (action) {
            case 'approve':
            case 'reject':
            case 'delete':
                docRef = doc(db, "trees", docId);
                cardElement = document.getElementById(`tree-card-${docId}`);
                if (action === 'approve') { await updateDoc(docRef, { verification_status: "approved" }); cardElement?.remove(); loadApprovedTrees(); }
                else { if (!confirm('Permanently delete tree?')) throw new Error("Cancelled."); await deleteDoc(docRef); cardElement?.remove(); }
                break;
            case 'toggle-edit':
            case 'cancel-edit':
                 cardElement = document.getElementById(`tree-card-${docId}`);
                 const editFieldsElement = document.getElementById(`edit-fields-${docId}`);
                 const toggleBtn = cardElement?.querySelector('button[data-action="toggle-edit"]');
                 if (action === 'toggle-edit') { editFieldsElement?.classList.toggle('hidden'); if(toggleBtn) toggleBtn.textContent = editFieldsElement?.classList.contains('hidden') ? 'Edit Details' : 'Hide Edit'; }
                 else { editFieldsElement?.classList.add('hidden'); if(toggleBtn) toggleBtn.textContent = 'Edit Details'; }
                 button.disabled = false; button.innerHTML = originalButtonText;
                break; // Prevent further processing for toggles
            case 'save-changes':
                docRef = doc(db, "trees", docId);
                cardElement = document.getElementById(`tree-card-${docId}`);

                const speciesValue = document.getElementById(`edit-species-${docId}`)?.value;
                const ageValue = document.getElementById(`edit-age-${docId}`)?.value;
                const wateringValue = document.getElementById(`edit-watering-${docId}`)?.value || null;
                const notesValue = document.getElementById(`edit-notes-${docId}`)?.value || null;
                const lastWateredInputValue = document.getElementById(`edit-last-watered-${docId}`)?.value;

                const updatePayload = {
                    species: speciesValue,
                    age: ageValue,
                    watering_needs: wateringValue,
                    notes: notesValue
                };

                if (lastWateredInputValue) {
                    try {
                        const dateParts = lastWateredInputValue.split('-');
                        if (dateParts.length !== 3) throw new Error("Date must be YYYY-MM-DD");
                        const year = parseInt(dateParts[0], 10); const month = parseInt(dateParts[1], 10) - 1; const day = parseInt(dateParts[2], 10);
                        if (isNaN(year) || isNaN(month) || isNaN(day)) throw new Error("Invalid date components");
                        const utcDate = new Date(Date.UTC(year, month, day, 12, 0, 0));
                        if (isNaN(utcDate.getTime())) throw new Error("Invalid date created");
                        updatePayload.last_watered_at = Timestamp.fromDate(utcDate);
                    } catch (dateError) {
                        console.error("Invalid date format:", dateError); alert(`Invalid date format: ${dateError.message}. Use YYYY-MM-DD.`); throw new Error("Invalid date format.");
                    }
                } else {
                    updatePayload.last_watered_at = null;
                }

                await updateDoc(docRef, updatePayload);

                if (cardElement) {
                    cardElement.querySelector('h4').textContent = `${speciesValue} (${ageValue})`;
                    document.getElementById(`watering-display-${docId}`).textContent = wateringValue || 'Not Set';
                    const newDisplayDate = updatePayload.last_watered_at ? updatePayload.last_watered_at.toDate().toLocaleDateString('en-GB', { day:'2-digit', month:'short', year:'numeric', hour:'2-digit', minute:'2-digit'}) : 'Never';
                    document.getElementById(`last-watered-display-${docId}`).textContent = newDisplayDate;

                     const notesElement = cardElement.querySelector('.grow p:has(span.text-white/60:contains("Notes:"))');
                     if (notesElement) {
                         if (notesValue) { notesElement.innerHTML = `<span class="text-white/60">Notes:</span> ${notesValue}`; notesElement.style.display = 'block'; }
                         else { notesElement.style.display = 'none'; }
                     } else if (notesValue && cardElement.querySelector('.grow')) {
                          const newNotesP = document.createElement('p'); newNotesP.className = 'text-xs text-white/70 mt-1'; newNotesP.innerHTML = `<span class="text-white/60">Notes:</span> ${notesValue}`; cardElement.querySelector('.grow').appendChild(newNotesP);
                     }

                    document.getElementById(`edit-fields-${docId}`)?.classList.add('hidden');
                    const toggleBtn = cardElement.querySelector('button[data-action="toggle-edit"]');
                    if (toggleBtn) toggleBtn.textContent = 'Edit Details';
                }
                alert('Tree details updated!');
                break;

            case 'approve-watering':
                docRef = doc(db, "watering_logs", docId);
                cardElement = document.getElementById(`log-card-${docId}`);
                const userId = button.dataset.userid;
                if (!userId) throw new Error("User ID missing.");
                await updateDoc(docRef, { verification_status: "approved" });
                const userDocRef = doc(db, "users", userId);
                await updateDoc(userDocRef, { eco_points: increment(POINTS_FOR_WATERING) });
                cardElement?.remove();
                alert(`Watering approved! ${POINTS_FOR_WATERING} points awarded.`);
                break;

            case 'reject-watering':
                docRef = doc(db, "watering_logs", docId);
                cardElement = document.getElementById(`log-card-${docId}`);
                if (!confirm('Reject watering log?')) throw new Error("Cancelled.");
                await updateDoc(docRef, { verification_status: "rejected" });
                cardElement?.remove();
                alert('Watering log rejected.');
                break;

            default:
                console.warn("Unknown action:", action);
        }
    } catch (error) {
        console.error(`Error performing action '${action}':`, error);
        if (error.message !== "Cancelled.") alert(`Failed: ${error.message}`);
    } finally {
        if (button && !['approve', 'reject', 'delete', 'approve-watering', 'reject-watering', 'toggle-edit', 'cancel-edit'].includes(action) || (error && error.message !== "Cancelled.")){
             button.disabled = false; button.innerHTML = originalButtonText;
        } else if (error?.message.includes("Cancelled") && button && !['toggle-edit', 'cancel-edit'].includes(action)) {
             button.disabled = false; button.innerHTML = originalButtonText;
        }
    }
});

async function loadStatisticsDashboard() {
    try {
        const treesSnapshot = await getDocs(collection(db, "trees"));
        const allTrees = [];
        treesSnapshot.forEach((doc) => {
            allTrees.push({ id: doc.id, ...doc.data() });
        });

        const usersSnapshot = await getDocs(collection(db, "users"));
        const allUsers = [];
        usersSnapshot.forEach((doc) => {
            allUsers.push({ id: doc.id, ...doc.data() });
        });

        const logsSnapshot = await getDocs(collection(db, "watering_logs"));
        const allLogs = [];
        logsSnapshot.forEach((doc) => {
            allLogs.push({ id: doc.id, ...doc.data() });
        });

        const totalTrees = allTrees.length;
        const approvedTrees = allTrees.filter(t => t.verification_status === 'approved').length;
        const totalUsers = allUsers.length;
        const totalWateringLogs = allLogs.length;

        const thirtyDaysAgo = Timestamp.fromDate(new Date(Date.now() - DAYS_FOR_ACTIVE_CARE * 24 * 60 * 60 * 1000));
        const activeTrees = allTrees.filter(tree => {
            if (tree.verification_status !== 'approved') return false;
            if (!tree.last_watered_at) return false;
            return tree.last_watered_at.toMillis() >= thirtyDaysAgo.toMillis();
        }).length;

        const survivalRate = approvedTrees > 0 ? ((activeTrees / approvedTrees) * 100).toFixed(1) : 0;

        const co2Absorbed = (approvedTrees * CO2_ABSORBED_PER_TREE_PER_YEAR).toFixed(1);
        const oxygenGenerated = (approvedTrees * OXYGEN_GENERATED_PER_TREE_PER_YEAR).toFixed(1);

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

        const careFrequency = {
            daily: allTrees.filter(t => t.watering_needs === 'Daily').length,
            every2to3: allTrees.filter(t => t.watering_needs === 'Every 2-3 days' || t.watering_needs === 'Once every 2-3 days').length,
            weekly: allTrees.filter(t => t.watering_needs === 'Weekly').length,
            rainfed: allTrees.filter(t => t.watering_needs && t.watering_needs.includes('Rain')).length
        };

        document.getElementById('totalTreesStat').textContent = totalTrees.toLocaleString();
        document.getElementById('approvedTreesStat').textContent = approvedTrees.toLocaleString();
        document.getElementById('totalUsersStat').textContent = totalUsers.toLocaleString();
        document.getElementById('totalWateringLogsStat').textContent = totalWateringLogs.toLocaleString();
        document.getElementById('co2AbsorbedStat').textContent = co2Absorbed + ' kg';
        document.getElementById('oxygenGeneratedStat').textContent = oxygenGenerated + ' kg';
        document.getElementById('survivalRateStat').textContent = survivalRate + '%';

        const topCommunitiesList = document.getElementById('topCommunitiesList');
        if (topCommunities.length > 0) {
            topCommunitiesList.innerHTML = topCommunities.map((comm, idx) => `
                <div class="flex justify-between items-center text-sm">
                    <span class="text-white/80">${idx + 1}. ${comm.name.charAt(0).toUpperCase() + comm.name.slice(1)}</span>
                    <span class="text-primary font-semibold">${comm.count} members</span>
                </div>
            `).join('');
        } else {
            topCommunitiesList.innerHTML = '<p class="text-white/60 text-sm">No communities yet.</p>';
        }

        const careFrequencyStats = document.getElementById('careFrequencyStats');
        careFrequencyStats.innerHTML = `
            <div class="flex justify-between items-center text-sm mb-2">
                <span class="text-white/80">Daily</span>
                <span class="text-primary font-semibold">${careFrequency.daily}</span>
            </div>
            <div class="flex justify-between items-center text-sm mb-2">
                <span class="text-white/80">Every 2-3 days</span>
                <span class="text-primary font-semibold">${careFrequency.every2to3}</span>
            </div>
            <div class="flex justify-between items-center text-sm mb-2">
                <span class="text-white/80">Weekly</span>
                <span class="text-primary font-semibold">${careFrequency.weekly}</span>
            </div>
            <div class="flex justify-between items-center text-sm">
                <span class="text-white/80">Rain-fed</span>
                <span class="text-primary font-semibold">${careFrequency.rainfed}</span>
            </div>
        `;

    } catch (error) {
        console.error("Error loading statistics:", error);
        document.getElementById('totalTreesStat').textContent = 'Error';
        document.getElementById('approvedTreesStat').textContent = 'Error';
        document.getElementById('totalUsersStat').textContent = 'Error';
        document.getElementById('totalWateringLogsStat').textContent = 'Error';
    }
}
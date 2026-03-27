import { post, get } from './api.js';

let hospitals = [];
let map;

document.addEventListener('DOMContentLoaded', async () => {
    // 1. Initialize Map first (Critical: do this before any API calls)
    try {
        map = L.map('map').setView([9.5624, 44.0653], 13);
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map);
    } catch (e) {
        console.error("Leaflet map failed to load:", e);
    }

    // 2. Fetch hospitals (Wrapped in try/catch so 403 doesn't break the whole page)
    try {
        // Change this to a route patients ARE allowed to see
        // If you don't have a patient-specific hospital route, use an empty array for now
        const hData = await get('/patients/hospitals').catch(() => []); 
        hospitals = hData || [];
        
        hospitals.forEach(h => {
            if (h.location) {
                const [lat, lon] = h.location.split(',').map(Number);
                L.marker([lat, lon]).addTo(map).bindPopup(h.name);
            }
        });
    } catch (err) {
        console.warn("Could not load hospital markers (403 Forbidden), but form will still work.");
    }

    // 3. Get GPS
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(pos => {
            const lat = pos.coords.latitude;
            const lon = pos.coords.longitude;
            document.getElementById('location').value = `${lat.toFixed(4)}, ${lon.toFixed(4)}`;
            if (map) {
                L.marker([lat, lon]).addTo(map).bindPopup("Your Location").openPopup();
                map.setView([lat, lon], 14);
            }
        }, err => console.warn("GPS Access Denied"));
    }
});

// 4. Submission Logic
document.getElementById('emergency-form').addEventListener('submit', async (e) => {
    e.preventDefault(); // This MUST run to stop the refresh
    
    const form = e.target;
    const submitBtn = form.querySelector('button[type="submit"]');
    
    const data = {
        name: form.name.value.trim(),
        age: form.age.value.trim(),
        location: form.location.value.trim(),
        address: form.address.value.trim(),
        emergencyType: document.getElementById('emergency-type').value,
        description: form.description.value.trim()
    };

    // UI Feedback
    submitBtn.disabled = true;
    submitBtn.textContent = "Sending...";

    try {
        const res = await post('/patients/emergency', data);
        
        if (res && res.success) {
            // Show Status Card
            const statusCard = document.getElementById('active-emergency');
            if (statusCard) {
                statusCard.style.display = 'block';
                document.getElementById('emergency-status-text').innerHTML = 
                    `🚨 <b>PENDING</b>: ${data.emergencyType} request sent to dispatch.`;
                statusCard.scrollIntoView({ behavior: 'smooth' });
            }
            
            alert("Emergency request submitted successfully!");
            form.reset();
            document.getElementById('location').value = data.location; // Keep location visible
        }
    } catch (err) {
        console.error("Submission failed:", err);
        alert("Submission failed: " + err.message);
    } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = "Send Emergency";
    }
});
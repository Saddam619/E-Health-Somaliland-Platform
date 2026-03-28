import { post, get } from './api.js';

let hospitals = [];
let map;

document.addEventListener('DOMContentLoaded', async () => {
    // 1. Initialize Map first
    try {
        map = L.map('map').setView([9.5624, 44.0653], 13);
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map);
    } catch (e) {
        console.error("Leaflet map failed to load:", e);
    }

    // 2. Fetch hospitals (Patient-allowed route)
    try {
        const hData = await get('/patients/hospitals').catch(() => []); 
        hospitals = hData || [];
        
        hospitals.forEach(h => {
            if (h.location) {
                const [lat, lon] = h.location.split(',').map(Number);
                L.marker([lat, lon]).addTo(map).bindPopup(`<b>${h.name}</b>`);
            }
        });
    } catch (err) {
        console.warn("Could not load hospital markers.");
    }

    // 3. Get GPS
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(pos => {
            const lat = pos.coords.latitude;
            const lon = pos.coords.longitude;
            const locString = `${lat.toFixed(4)}, ${lon.toFixed(4)}`;
            document.getElementById('location').value = locString;
            if (map) {
                L.marker([lat, lon]).addTo(map).bindPopup("Your Location").openPopup();
                map.setView([lat, lon], 14);
            }
        }, err => console.warn("GPS Access Denied"));
    }
});

// 4. Submission Logic
document.getElementById('emergency-form').addEventListener('submit', async (e) => {
    e.preventDefault(); 
    
    const form = e.target;
    const submitBtn = form.querySelector('button[type="submit"]');
    
    // CAPTURING PHONE NUMBER HERE
    const data = {
        name: form.name.value.trim(),
        age: form.age.value.trim(),
        phone: form.phone.value.trim(), // Added phone
        location: form.location.value.trim(),
        address: form.address.value.trim(),
        emergencyType: document.getElementById('emergency-type').value,
        description: form.description.value.trim()
    };

    // Simple Frontend Validation
    if (!data.phone) {
        alert("Please provide a phone number so we can reach you!");
        return;
    }

    submitBtn.disabled = true;
    submitBtn.textContent = "Sending...";

    try {
        const res = await post('/patients/emergency', data);
        
        if (res && res.success) {
            const statusCard = document.getElementById('active-emergency');
            if (statusCard) {
                statusCard.style.display = 'block';
                document.getElementById('emergency-status-text').innerHTML = 
                    `🚨 <b>PENDING</b>: ${data.emergencyType} request sent. We will call you at ${data.phone}.`;
                statusCard.scrollIntoView({ behavior: 'smooth' });
            }
            
            alert("Emergency request submitted successfully!");
            form.reset();
            document.getElementById('location').value = data.location; 
        }
    } catch (err) {
        alert("Submission failed: " + err.message);
    } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = "Send Emergency";
    }
});
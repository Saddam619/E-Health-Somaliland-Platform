import { get } from './api.js';
import { t, setLanguage } from './lang.js';

const user = JSON.parse(localStorage.getItem('user') || 'null');
const role = user && (user.role || '').toLowerCase();

if (!user || role !== 'patient') {
  location.href = 'auth.html';
}

const list = document.getElementById('pharmacies-list');
let map;

// Language Toggle Logic
document.getElementById('lang-toggle').onclick = () => {
  const current = localStorage.getItem('lang') || 'en';
  const next = current === 'en' ? 'so' : 'en';
  setLanguage(next);
  document.getElementById('lang-toggle').textContent = next.toUpperCase();
  // Reload pharmacies to refresh translated text if needed
  loadPharmacies(); 
};

// ✅ STATIC TRUSTED PHARMACIES DATA (SOMALILAND)
const pharmaciesData = [
  { name: "Hargeisa Pharmacy", address: "New Hargeisa, Hargeisa", location: "9.5624,44.0653", licensed: true },
  { name: "Total Pharmacy", address: "Total Area, Hargeisa", location: "9.5700,44.0600", licensed: true },
  { name: "Masalaha Pharmacy", address: "Masalaha Street, Hargeisa", location: "9.5500,44.0700", licensed: true },
  { name: "Jigjiga Yar Pharmacy", address: "Jigjiga Yar, Hargeisa", location: "9.5800,44.0800", licensed: true },
  { name: "Xero Awr Pharmacy", address: "Xero Awr, Hargeisa", location: "9.5400,44.0500", licensed: true },
  { name: "Macalin Haaruun Pharmacy", address: "Macalin Haaruun Area, Hargeisa", location: "9.5650,44.0750", licensed: true },
  { name: "Berbera Central Pharmacy", address: "Berbera City, Somaliland", location: "10.4356,45.0164", licensed: true },
  { name: "Burco Pharmacy", address: "Burco City, Somaliland", location: "9.5221,45.5336", licensed: true },
  { name: "Borama Pharmacy", address: "Borama City, Somaliland", location: "9.9361,43.1803", licensed: true },
  { name: "Gabiley Pharmacy", address: "Gabiley City, Somaliland", location: "9.5676,43.6436", licensed: true },
  { name: "Ceerigaabo Pharmacy", address: "Ceerigaabo City, Somaliland", location: "10.6162,47.3679", licensed: true },
  { name: "Laascanood Pharmacy", address: "Laascanood City, Somaliland", location: "8.4774,47.3597", licensed: true }
];

async function loadPharmacies() {
  list.innerHTML = '';

  // Prevent Leaflet "Map already initialized" error
  if (map) {
    map.remove();
    map = null;
  }

  try {
    let backendPharmacies = [];
    
    // Attempt to get data from API
    try {
      const response = await get('/patients/pharmacies');
      backendPharmacies = response || [];
    } catch (apiErr) {
      console.warn("Backend API failed, showing static pharmacies only.", apiErr);
    }

    // Combine both lists into one array
    const allPharmacies = [...pharmaciesData, ...backendPharmacies];

    // Initialize Map
    map = L.map('pharmacy-map').setView([9.5624, 44.0653], 10);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors'
    }).addTo(map);

    // Render each pharmacy
    allPharmacies.forEach(p => {
      const locationStr = p.location || '';
      const [lat, lon] = locationStr.split(',').map(v => parseFloat(v.trim()));
      
      // Support both backend (is_licensed) and static (licensed) keys
      const isLicensed = p.is_licensed ?? p.licensed;

      const item = document.createElement('div');
      item.className = 'card';
      item.innerHTML = `
        <strong>${p.name}</strong><br>
        <small>${p.address || p.location || ''}</small><br>
        <span class="badge ${isLicensed ? 'badge-success' : 'badge-danger'}">
          ${isLicensed ? (t('licensed') || 'Licensed') : (t('unlicensed') || 'Unlicensed')}
        </span>
      `;
      list.appendChild(item);

      // Add Marker to Map
      if (!isNaN(lat) && !isNaN(lon)) {
        L.marker([lat, lon])
          .addTo(map)
          .bindPopup(`<strong>${p.name}</strong><br>${p.address || ''}`);
      }
    });

  } catch (err) {
    console.error("General error in loadPharmacies:", err);
    list.innerHTML = `<p>${t('error') || 'Failed to load pharmacies.'}</p>`;
  }
}

// Initial Call
loadPharmacies();
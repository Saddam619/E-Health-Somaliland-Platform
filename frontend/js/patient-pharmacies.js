import { get } from './api.js';
import { t, setLanguage, updateUI } from './lang.js';

const user = JSON.parse(localStorage.getItem('user') || 'null');
const role = user && (user.role || '').toLowerCase();
if (!user || role !== 'patient') {
  location.href = 'auth.html';
}

const list = document.getElementById('pharmacies-list');
let map;

document.getElementById('lang-toggle').onclick = () => {
  const current = localStorage.getItem('lang') || 'en';
  const next = current === 'en' ? 'so' : 'en';
  setLanguage(next);
  updateUI();
  document.getElementById('lang-toggle').textContent = next.toUpperCase();
};

async function loadPharmacies() {
  list.innerHTML = '';
  try {
    const pharmacies = await get('/patients/pharmacies');
    if (!pharmacies || pharmacies.length === 0) {
      list.innerHTML = `<p>${t('noPharmacies') || 'No licensed pharmacies found.'}</p>`;
      return;
    }

    map = L.map('pharmacy-map').setView([9.5624, 44.0653], 10);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors'
    }).addTo(map);

    pharmacies.forEach(p => {
      const [lat, lon] = (p.location || '').split(',').map(v => parseFloat(v.trim()));
      const isLicensed = p.is_licensed;
      const item = document.createElement('div');
      item.className = 'card';
      item.innerHTML = `
        <strong>${p.name}</strong><br>
        <small>${p.location}</small><br>
        <span class="badge ${isLicensed ? 'badge-success' : 'badge-danger'}">
          ${isLicensed ? t('licensed') || 'Licensed' : t('unlicensed') || 'Unlicensed'}
        </span>
      `;
      list.appendChild(item);

      if (!isNaN(lat) && !isNaN(lon)) {
        L.marker([lat, lon]).addTo(map).bindPopup(p.name);
      }
    });
  } catch (err) {
    console.error(err);
    list.innerHTML = `<p>${t('error') || 'Failed to load pharmacies.'}</p>`;
  }
}

loadPharmacies();


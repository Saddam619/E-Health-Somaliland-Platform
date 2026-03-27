import { post, get } from './api.js';
import { t, setLanguage, } from './lang.js';

const user = JSON.parse(localStorage.getItem('user'));
const role = user && (user.role || '').toLowerCase();
if (!user || role !== 'patient') { location.href = 'auth.html'; }

let hospitals = [];
let map;
let userMarker;

document.addEventListener('DOMContentLoaded', async () => {
  hospitals = await get('/admins/hospitals');
  map = L.map('map').setView([9.5624, 44.0653], 10);
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { attribution: '&copy; OpenStreetMap contributors' }).addTo(map);
    hospitals.forEach(h => {
      const [lat, lon] = h.location.split(',').map(v => parseFloat(v.trim()));
      if (!isNaN(lat) && !isNaN(lon)) {
        L.marker([lat, lon]).addTo(map).bindPopup(h.name);
      }
    });

  // Get user location
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(position => {
      const { latitude, longitude } = position.coords;
      userMarker = L.marker([latitude, longitude]).addTo(map).bindPopup('Your Location').openPopup();
      map.setView([latitude, longitude], 12);
      document.getElementById('location').value = `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`;
    });
  }
});

document.getElementById('lang-toggle').onclick = () => {
  const current = localStorage.getItem('lang') || 'en';
  const next = current === 'en' ? 'so' : 'en';
  setLanguage(next);
  updateUI();
  document.getElementById('lang-toggle').textContent = next.toUpperCase();
};

document.getElementById('emergency-form').addEventListener('submit', async e => {
  e.preventDefault();
  const form = e.target;
  const data = {
    name: form.name.value.trim(),
    age: form.age.value.trim(),
    location: form.location.value.trim(),
    address: form.address.value.trim(),
    emergencyType: form.emergencyType.value,
    description: form.description.value.trim()
  };
  if (!data.name || !data.age || !data.location || !data.address || !data.emergencyType || !data.description) {
    alert(t('fillAllFields'));
    return;
  }
  const res = await post('/patients/emergency', data);
  if (res.success) {
    alert(t('ambulanceRequested'));
    // Find nearest hospital
    const nearest = findNearestHospital(data.location);
    if (nearest) {
      map.setView([nearest.lat, nearest.lon], 15);
      L.marker([nearest.lat, nearest.lon]).addTo(map).bindPopup(nearest.name).openPopup();
    }
  } else {
    alert(t('error'));
  }
});

function findNearestHospital(location) {
  const coords = location.split(',').map(c => parseFloat(c.trim()));
  if (coords.length === 2 && !isNaN(coords[0]) && !isNaN(coords[1])) {
    const [lat, lon] = coords;
    let nearest = null;
    let minDist = Infinity;
    hospitals.forEach(h => {
      const [hLat, hLon] = (h.location || '').split(',').map(c => parseFloat(c.trim()));
      if (isNaN(hLat) || isNaN(hLon)) return;
      const dist = Math.sqrt((hLat - lat) ** 2 + (hLon - lon) ** 2);
      if (dist < minDist) {
        minDist = dist;
        nearest = { ...h, lat: hLat, lon: hLon };
      }
    });
    return nearest || hospitals[0];
  }
  return hospitals[0];
}
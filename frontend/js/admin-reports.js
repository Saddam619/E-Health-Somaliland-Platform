import { get } from './api.js';
import { t, setLanguage, } from './lang.js';

const user = JSON.parse(localStorage.getItem('user'));
const role = user && (user.role || '').toLowerCase();
if (!user || role !== 'admin') { location.href = 'auth.html'; }

const list = document.getElementById('reports-list');

document.getElementById('lang-toggle').onclick = () => {
  const current = localStorage.getItem('lang') || 'en';
  const next = current === 'en' ? 'so' : 'en';
  setLanguage(next);
  
  document.getElementById('lang-toggle').textContent = next.toUpperCase();
};

document.getElementById('load-reports').onclick = async () => {
  const data = await get('/admins/reports');
  list.innerHTML = `<div class="card">
    <p>${t('consultations')}: ${data.consults}</p>
    <p>${t('emergencies')}: ${data.emergencies}</p>
    <p>${t('prescriptions')}: ${data.prescriptions}</p>
  </div>`;
};
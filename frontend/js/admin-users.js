import { get, patch, del } from './api.js';
import { t, setLanguage, } from './lang.js';

const user = JSON.parse(localStorage.getItem('user'));
const role = user && (user.role || '').toLowerCase();
if (!user || role !== 'admin') { location.href = 'auth.html'; }

const list = document.getElementById('users-list');

document.getElementById('lang-toggle').onclick = () => {
  const current = localStorage.getItem('lang') || 'en';
  const next = current === 'en' ? 'so' : 'en';
  setLanguage(next);
  
  document.getElementById('lang-toggle').textContent = next.toUpperCase();
};

document.getElementById('load-users').onclick = render;

async function render() {
  const users = await get('/admins/users');
  list.innerHTML = users.map(u => `
    <div class="card">
      <strong>${u.email}</strong><br>
      ${t('role')}: <select data-id="${u.id}">
        <option value="patient" ${u.role === 'patient' ? 'selected' : ''}>${t('patient')}</option>
        <option value="doctor" ${u.role === 'doctor' ? 'selected' : ''}>${t('doctor')}</option>
        <option value="pharmacist" ${u.role === 'pharmacist' ? 'selected' : ''}>${t('pharmacist')}</option>
        <option value="admin" ${u.role === 'admin' ? 'selected' : ''}>${t('admin')}</option>
      </select>
      <button class="secondary delete" data-id="${u.id}" data-i18n="delete">Delete</button>
    </div>`).join('');
}

list.addEventListener('change', async e => {
  if (e.target.tagName === 'SELECT') {
    await patch(`/admins/users/${e.target.dataset.id}/role`, { role: e.target.value });
    render();
  }
});

list.addEventListener('click', async e => {
  if (e.target.classList.contains('delete')) {
    await del(`/admins/users/${e.target.dataset.id}`);
    render();
  }
});
import { get, patch } from './api.js';
import { t } from './lang.js';

const user = JSON.parse(localStorage.getItem('user') || 'null');
if (!user) { location.href = 'auth.html'; }
const role = (user.role || '').toLowerCase();

const menu = document.getElementById('menu');

const links = {
  patient: [
    { text: t('consultation'), href: 'patient-consult.html' },
    { text: t('emergency'), href: 'patient-emergency.html' },
    { text: t('prescriptions'), href: 'patient-prescriptions.html' },
    { text: t('pharmacies'), href: 'patient-pharmacies.html' }
  ],
  doctor: [{ text: t('prescribe'), href: 'doctor-prescribe.html' }],
  pharmacist: [{ text: t('verify'), href: 'pharmacist-verify.html' }],
  admin: [
    { text: t('users'), href: 'admin-users.html' },
    { text: t('reports'), href: 'admin-reports.html' }
  ]
};

menu.innerHTML = (links[role] || []).map(l =>
  `<button class="menu-btn primary" onclick="location='${l.href}'">${l.text}</button>`
).join('');

// Role-specific loading
if (role === 'patient') {
  loadPendingConsultations();
} else if (role === 'doctor') {
  loadDoctorConsultations();
} else if (role === 'pharmacist') {
  startNotificationPolling();
}

// Patient: Pending Consultations
async function loadPendingConsultations() {
  const container = document.getElementById('pending-consultations');
  container.innerHTML = '';
  const consultations = await get('/patients/consultations');
  if (!consultations || consultations.length === 0) {
    container.innerHTML = `<p>${t('noConsultations') || 'No consultation requests yet.'}</p>`;
    return;
  }

  consultations.forEach(c => {
    const div = document.createElement('div');
    div.className = 'consult-item';
    div.innerHTML = `
      <strong>${c.name}</strong> (${c.age} ${t('yearsOld') || 'years old'})<br>
      ${t('location')}: ${c.location}<br>
      ${t('symptoms')}: ${c.symptoms}<br>
      ${t('explanation')}: ${c.explanation}<br>
      <strong>Status:</strong> ${c.status || t('pending')}
    `;
    container.appendChild(div);
  });
}

// Doctor: Pending consultations
async function loadDoctorConsultations() {
  const consultations = await get('/doctors/consultations');
  const consultList = document.getElementById('doctor-consultations');
  if (!consultList) return;
  consultList.innerHTML = '';

  consultations.forEach(c => {
    const div = document.createElement('div');
    div.className = 'consult-item';
    div.dataset.id = c.id;
    div.innerHTML = `
      <strong>${c.name}</strong> (${c.age} ${t('yearsOld')})<br>
      ${t('location')}: ${c.location}<br>
      ${t('symptoms')}: ${c.symptoms}<br>
      <button class="serve">${t('serve')}</button>
    `;
    consultList.appendChild(div);
  });

  consultList.addEventListener('click', async e => {
    const item = e.target.closest('.consult-item');
    if (!item) return;
    const id = item.dataset.id;
    if (e.target.classList.contains('serve')) {
      await patch(`/doctors/consultations/${id}/serve`, {});
      alert(t('consultation') + ' ' + t('served'));
      loadDoctorConsultations();
    }
  });
}

// Logout
document.getElementById('logout')?.addEventListener('click', () => {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  location.href = 'auth.html';
});
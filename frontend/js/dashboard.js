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

// 1. Render Menu
menu.innerHTML = (links[role] || []).map(l =>
  `<button class="menu-btn primary" onclick="location='${l.href}'">${l.text}</button>`
).join('');

// 2. Render Health Tips (New Feature)
function loadHealthTips() {
  const tipsContainer = document.getElementById('health-tips-container');
  if (!tipsContainer) return;

  // We pull these directly from your lang.js keys
  const tips = [
    { title: t('tip1Title'), content: t('tip1Content'), icon: '💧' },
    { title: t('tip2Title'), content: t('tip2Content'), icon: '🏃‍♂️' },
    { title: t('tip3Title'), content: t('tip3Content'), icon: '🍎' },
    { title: t('tip4Title'), content: t('tip4Content'), icon: '😴' },
    { title: t('tip5Title'), content: t('tip5Content'), icon: '🧼' }
  ];

  tipsContainer.innerHTML = `
    <h2 style="margin-top: 20px;">${t('healthTips')}</h2>
    <div class="tips-grid">
      ${tips.map(tip => `
        <div class="card tip-card">
          <span style="font-size: 2rem;">${tip.icon}</span>
          <h3>${tip.title}</h3>
          <p>${tip.content}</p>
        </div>
      `).join('')}
    </div>
  `;
}

// 3. Role-specific loading
if (role === 'patient') {
  loadPendingConsultations();
} else if (role === 'doctor') {
  loadDoctorConsultations();
}

// Always load tips for everyone
loadHealthTips();

// --- Patient: Pending Consultations ---
async function loadPendingConsultations() {
  const container = document.getElementById('pending-consultations');
  if (!container) return;
  
  container.innerHTML = '<p>Loading...</p>';
  try {
    const consultations = await get('/patients/consultations');
    container.innerHTML = '';
    if (!consultations || consultations.length === 0) {
      container.innerHTML = `<p>${t('noConsultations')}</p>`;
      return;
    }

    consultations.forEach(c => {
      const div = document.createElement('div');
      div.className = 'card consult-item';
      div.innerHTML = `
        <strong>${c.name}</strong> (${c.age} ${t('yearsOld')})<br>
        <small>${t('symptoms')}: ${c.symptoms}</small><br>
        <strong>Status:</strong> <span class="badge">${c.status || t('pending')}</span>
      `;
      container.appendChild(div);
    });
  } catch (err) {
    container.innerHTML = `<p>${t('error')}</p>`;
  }
}

// --- Doctor: Pending consultations ---
async function loadDoctorConsultations() {
  const consultList = document.getElementById('doctor-consultations');
  if (!consultList) return;
  
  consultList.innerHTML = '<p>Loading...</p>';
  try {
    const consultations = await get('/doctors/consultations');
    consultList.innerHTML = '';

    consultations.forEach(c => {
      const div = document.createElement('div');
      div.className = 'card consult-item';
      div.dataset.id = c.id;
      div.innerHTML = `
        <strong>${c.name}</strong> (${c.age} ${t('yearsOld')})<br>
        <small>${t('symptoms')}: ${c.symptoms}</small><br>
        <button class="serve primary" style="margin-top:10px;">${t('serve')}</button>
      `;
      consultList.appendChild(div);
    });
  } catch (err) {
    consultList.innerHTML = `<p>${t('error')}</p>`;
  }
}

// Handle Doctor Serve Button
document.addEventListener('click', async e => {
  if (e.target.classList.contains('serve')) {
    const item = e.target.closest('.consult-item');
    const id = item.dataset.id;
    try {
      await patch(`/doctors/consultations/${id}/serve`, {});
      alert(`${t('consultation')} ${t('served')}`);
      loadDoctorConsultations();
    } catch (err) {
      alert(t('error'));
    }
  }
});

// Logout
document.getElementById('logout')?.addEventListener('click', () => {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  location.href = 'auth.html';
});
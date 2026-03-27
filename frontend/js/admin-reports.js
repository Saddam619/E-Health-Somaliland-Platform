import { get, patch } from './api.js';
import { t, setLanguage, } from './lang.js';

const user = JSON.parse(localStorage.getItem('user'));
if (!user || user.role !== 'admin') { location.href = 'auth.html'; }

const list = document.getElementById('reports-list');
const statsDiv = document.getElementById('stats-summary');

// Language Toggle
document.getElementById('lang-toggle').onclick = () => {
  const current = localStorage.getItem('lang') || 'en';
  const next = current === 'en' ? 'so' : 'en';
  setLanguage(next);
  
  document.getElementById('lang-toggle').textContent = next.toUpperCase();
};

// Load Reports & Manage Emergencies
document.getElementById('load-reports').onclick = async () => {
  const data = await get('/admins/reports');
  if (!data) return;

  // 1. Show and Update Counters
  statsDiv.style.display = 'block';
  document.getElementById('count-consults').textContent = data.counts.consults;
  document.getElementById('count-emergencies').textContent = data.counts.emergencies;
  document.getElementById('count-prescriptions').textContent = data.counts.prescriptions;

  // 2. Render Emergency Items
  list.innerHTML = ''; // Clear current list
  
  if (data.emergencies.length === 0) {
      list.innerHTML = '<p>No emergency requests found.</p>';
      return;
  }

  data.emergencies.forEach(item => {
    const card = document.createElement('div');
    card.className = 'card';
    card.style.borderLeft = item.status === 'requested' ? '5px solid red' : '5px solid green';
    
    card.innerHTML = `
      <div style="display: flex; justify-content: space-between; align-items: center;">
        <div>
          <h4>${item.emergency_type.toUpperCase()} - ${item.name} (${item.age} yrs)</h4>
          <p>📍 <b>Location:</b> ${item.location}</p>
          <p>🏠 <b>Address:</b> ${item.address}</p>
          <p>📝 <b>Note:</b> ${item.description || 'No description'}</p>
          <p>🏥 <b>Assigned:</b> ${item.nearest_hospital || 'N/A'}</p>
          <p><b>Status:</b> <span class="badge">${item.status}</span></p>
        </div>
        <div>
          ${item.status === 'requested' ? 
            `<button class="danger" onclick="updateEmergencyStatus(${item.id}, 'dispatched')">Dispatch Help</button>` : 
            `<span style="color: green; font-weight: bold;">✓ Served</span>`
          }
        </div>
      </div>
    `;
    list.appendChild(card);
  });
};

// Global function to update status (called from the button)
window.updateEmergencyStatus = async (id, newStatus) => {
    if (confirm(`Change status to ${newStatus}?`)) {
        const res = await patch(`/admins/emergencies/${id}/status`, { status: newStatus });
        if (res.success) {
            alert("Status updated successfully!");
            document.getElementById('load-reports').click(); // Refresh list
        }
    }
};
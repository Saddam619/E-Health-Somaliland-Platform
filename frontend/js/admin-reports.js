import { get, patch } from './api.js';
import { t, setLanguage } from './lang.js';

const user = JSON.parse(localStorage.getItem('user'));
if (!user || user.role !== 'admin') { 
    location.href = 'auth.html'; 
}

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
    try {
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
            list.innerHTML = '<p style="text-align:center; padding:20px;">No emergency requests found.</p>';
            return;
        }

        // We use .reverse() to show the newest emergencies at the top
        data.emergencies.reverse().forEach(item => {
            const card = document.createElement('div');
            card.className = 'card';
            card.style.borderLeft = item.status === 'requested' ? '5px solid #e74c3c' : '5px solid #2ecc71';
            card.style.marginBottom = '1rem';
            
            // Create a Google Maps link from the coordinates
            const mapUrl = `https://www.google.com/maps/search/?api=1&query=${item.location}`;

            card.innerHTML = `
                <div style="display: flex; justify-content: space-between; align-items: flex-start; gap: 15px;">
                    <div style="flex: 1;">
                        <h4 style="margin: 0 0 10px 0; color: #2c3e50;">
                            ${item.emergency_type.toUpperCase()} - ${item.name} (${item.age} yrs)
                        </h4>
                        
                        <p style="margin: 5px 0;">📞 <b>Phone:</b> 
                            <a href="tel:${item.phone}" style="color: #3498db; font-weight: bold; text-decoration: none;">
                                ${item.phone || 'Not Provided'}
                            </a>
                        </p>
                        
                        <p style="margin: 5px 0;">📍 <b>Location:</b> 
                            <a href="${mapUrl}" target="_blank" style="color: #e67e22; text-decoration: underline;">
                                ${item.location} (View on Map)
                            </a>
                        </p>
                        
                        <p style="margin: 5px 0;">🏠 <b>Address:</b> ${item.address}</p>
                        <p style="margin: 5px 0;">📝 <b>Note:</b> ${item.description || 'No description'}</p>
                        <p style="margin: 5px 0;">🏥 <b>Assigned:</b> ${item.nearest_hospital || 'N/A'}</p>
                        <p style="margin: 10px 0 0 0;">
                            <b>Status:</b> <span class="badge" style="background: #f1f1f1; padding: 2px 6px; border-radius: 4px;">${item.status}</span>
                        </p>
                    </div>
                    
                    <div style="min-width: 120px; text-align: right;">
                        ${item.status === 'requested' ? 
                            `<button class="danger" style="padding: 10px 15px;" onclick="updateEmergencyStatus(${item.id}, 'dispatched')">Dispatch Help</button>` : 
                            `<span style="color: #27ae60; font-weight: bold;">✓ Served</span>`
                        }
                    </div>
                </div>
            `;
            list.appendChild(card);
        });
    } catch (err) {
        console.error("Dashboard Load Error:", err);
        alert("Error loading reports. Please check your connection.");
    }
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
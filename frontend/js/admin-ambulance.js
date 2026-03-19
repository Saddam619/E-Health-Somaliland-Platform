import { get, patch } from '../js/api.js';

const user = JSON.parse(localStorage.getItem('user'));
const role = user && (user.role || '').toLowerCase();
if (!user || role !== 'admin') { location.href = 'auth.html'; }

const list = document.getElementById('e-list');

async function render() {
  const arr = await get('/admins/emergencies');
  list.innerHTML = arr.map(e => `
    <div class="card">
      <strong>User ${e.user_id}</strong><br>
      ${e.created_at}<br>
      Status: <select data-id="${e.id}">
        <option value="requested" ${e.status === 'requested' ? 'selected' : ''}>requested</option>
        <option value="dispatched" ${e.status === 'dispatched' ? 'selected' : ''}>dispatched</option>
        <option value="completed" ${e.status === 'completed' ? 'selected' : ''}>completed</option>
      </select>
    </div>
  `).join('');
}

list.addEventListener('change', async e => {
  if (e.target.tagName === 'SELECT') {
    await patch(`/admins/emergencies/${e.target.dataset.id}/status`, { status: e.target.value });
    render();
  }
});

render();
import { requireAdmin, loadProperties, adminLogout } from './storage.js';

requireAdmin();

const grid = document.getElementById('property-grid');
const props = loadProperties();

props.forEach(p => {
  const card = document.createElement('div');
  card.className = 'bg-white rounded-lg shadow p-4 flex flex-col';
  const qrUrl = `${window.location.origin}/p.html?id=${p.id}&t=${p.token}`;
  card.innerHTML = `
    <h3 class="text-lg font-semibold mb-2">${p.name}</h3>
    <div class="mt-auto flex justify-between items-center">
      <a href="admin-property.html?id=${p.id}" class="text-primary">Ajustes</a>
      <button class="text-sm text-gray-500 copy" data-url="${qrUrl}">Copiar QR</button>
    </div>
  `;
  grid.appendChild(card);
});

grid.addEventListener('click', e => {
  if (e.target.classList.contains('copy')) {
    const url = e.target.getAttribute('data-url');
    navigator.clipboard.writeText(url).then(() => {
      alert('URL copiada');
    });
  }
});

document.getElementById('logout').addEventListener('click', () => {
  adminLogout();
  window.location.href = 'index.html';
});

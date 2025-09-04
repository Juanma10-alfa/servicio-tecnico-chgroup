import {
  requireAdmin,
  getProperty,
  ticketsByProperty,
  updateTicketStatus,
  addEvent,
  eventsByProperty,
  updateProperty,
  adminLogout
} from './storage.js';

requireAdmin();

const params = new URLSearchParams(window.location.search);
const id = params.get('id');
const property = getProperty(id);

if (!property) {
  document.body.innerHTML = '<p>Propiedad no encontrada</p>';
} else {
  document.getElementById('prop-name').textContent = property.name;
  const qr = `${window.location.origin}/p.html?id=${property.id}&t=${property.token}`;
  const qrInput = document.getElementById('qr-url');
  qrInput.value = qr;
  document.getElementById('copy-qr').addEventListener('click', () => {
    navigator.clipboard.writeText(qr);
    alert('URL copiada');
  });

  // Tickets
  const ticketList = document.getElementById('ticket-list');
  function renderTickets() {
    ticketList.innerHTML = '';
    ticketsByProperty(id).forEach(t => {
      const li = document.createElement('li');
      li.className = 'bg-white p-3 rounded shadow';
      li.innerHTML = `
        <div class="flex justify-between">
          <div>
            <p class="font-medium">${t.title}</p>
            <p class="text-sm text-gray-600">${t.notes}</p>
          </div>
          <select data-id="${t.id}" class="border rounded">
            <option value="open">Abierto</option>
            <option value="in-progress">En proceso</option>
            <option value="closed">Cerrado</option>
          </select>
        </div>`;
      li.querySelector('select').value = t.status || 'open';
      ticketList.appendChild(li);
    });
  }
  renderTickets();
  ticketList.addEventListener('change', e => {
    if (e.target.tagName === 'SELECT') {
      const tid = e.target.getAttribute('data-id');
      updateTicketStatus(tid, e.target.value);
    }
  });

  // Events
  const eventForm = document.getElementById('event-form');
  const eventList = document.getElementById('event-list');
  function renderEvents() {
    eventList.innerHTML = '';
    eventsByProperty(id)
      .sort((a, b) => new Date(a.dateISO) - new Date(b.dateISO))
      .forEach(e => {
        const li = document.createElement('li');
        li.textContent = `${e.title} - ${new Date(e.dateISO).toLocaleDateString()}`;
        eventList.appendChild(li);
      });
  }
  renderEvents();
  eventForm.addEventListener('submit', e => {
    e.preventDefault();
    const title = document.getElementById('event-title').value.trim();
    const date = document.getElementById('event-date').value;
    if (title && date) {
      addEvent({ id: Date.now().toString(), propertyId: id, title, dateISO: date });
      eventForm.reset();
      renderEvents();
    }
  });

  // Transport
  const transportForm = document.getElementById('transport-form');
  transportForm.taxi.value = property.transport?.taxi || '';
  transportForm.privateTaxi.value = property.transport?.privateTaxi || '';
  transportForm.bus.value = property.transport?.bus || '';
  transportForm.addEventListener('submit', e => {
    e.preventDefault();
    property.transport = {
      taxi: transportForm.taxi.value,
      privateTaxi: transportForm.privateTaxi.value,
      bus: transportForm.bus.value
    };
    updateProperty(property);
    alert('Transporte guardado');
  });
}

document.getElementById('logout').addEventListener('click', () => {
  adminLogout();
  window.location.href = 'index.html';
});

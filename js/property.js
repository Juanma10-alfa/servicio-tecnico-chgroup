import { getProperty, addTicket, eventsByProperty } from './storage.js';

const params = new URLSearchParams(window.location.search);
const id = params.get('id');
const token = params.get('t');
const property = getProperty(id);

if (!property || property.token !== token) {
  document.body.innerHTML = '<p class="p-4">Acceso denegado</p>';
} else {
  document.getElementById('top-bar').style.backgroundColor = property.themeColor;
  document.getElementById('logo').src = property.logoUrl;
  document.getElementById('description').textContent = property.description;
  document.getElementById('address').textContent = property.address;
  const email = document.getElementById('email');
  email.textContent = property.contactEmail;
  email.href = `mailto:${property.contactEmail}`;

  // Buttons
  document.getElementById('btn-repairs').addEventListener('click', () => showForm('repair'));
  document.getElementById('btn-cleaning').addEventListener('click', () => showForm('cleaning'));
  document.getElementById('btn-transport').addEventListener('click', showTransport);
  document.getElementById('btn-events').addEventListener('click', showEvents);

  function showForm(type) {
    document.getElementById('transport').classList.add('hidden');
    document.getElementById('events').classList.add('hidden');
    const forms = document.getElementById('forms');
    forms.innerHTML = '';
    const form = document.createElement('form');
    form.className = 'space-y-2';
    form.innerHTML = `
      <input class="w-full border rounded p-2" name="title" placeholder="Título">
      <textarea class="w-full border rounded p-2" name="notes" placeholder="Notas"></textarea>
      <button class="px-3 py-2 bg-primary text-white rounded" type="submit">Enviar</button>
    `;
    form.addEventListener('submit', e => {
      e.preventDefault();
      const data = new FormData(form);
      const ticket = {
        id: Date.now().toString(),
        propertyId: id,
        type: type === 'repair' ? 'repair' : 'cleaning',
        title: data.get('title'),
        notes: data.get('notes'),
        status: 'open'
      };
      addTicket(ticket);
      alert('Enviado');
      form.reset();
    });
    forms.appendChild(form);
  }

  function showTransport() {
    const tDiv = document.getElementById('transport');
    tDiv.classList.remove('hidden');
    document.getElementById('events').classList.add('hidden');
    document.getElementById('forms').innerHTML = '';
    tDiv.innerHTML = '';
    const cats = [
      { key: 'taxi', label: 'Taxi' },
      { key: 'privateTaxi', label: 'Private Taxi' },
      { key: 'bus', label: 'Bus' }
    ];
    cats.forEach(c => {
      const url = property.transport?.[c.key];
      const btn = document.createElement('a');
      btn.className = 'block bg-gray-200 p-4 rounded text-center';
      btn.textContent = c.label;
      btn.href = url || '#';
      if (!url) btn.addEventListener('click', e => e.preventDefault());
      tDiv.appendChild(btn);
    });
  }

  function showEvents() {
    const eDiv = document.getElementById('events');
    eDiv.classList.remove('hidden');
    document.getElementById('transport').classList.add('hidden');
    document.getElementById('forms').innerHTML = '';
    eDiv.innerHTML = '';
    eventsByProperty(id)
      .sort((a, b) => new Date(a.dateISO) - new Date(b.dateISO))
      .forEach(ev => {
        const p = document.createElement('p');
        p.textContent = `${ev.title} - ${new Date(ev.dateISO).toLocaleDateString()}`;
        eDiv.appendChild(p);
      });
  }
}

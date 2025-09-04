export const defaultProperties = [
  {
    id: '1',
    name: 'Prop1',
    logoUrl: 'https://via.placeholder.com/80',
    themeColor: '#1e3a8a',
    address: 'Calle 1, Ibiza',
    contactEmail: 'prop1@example.com',
    token: 'token1',
    description: 'Bienvenido a Prop1',
    transport: { taxi: '', privateTaxi: '', bus: '' }
  },
  {
    id: '2',
    name: 'Prop2',
    logoUrl: 'https://via.placeholder.com/80',
    themeColor: '#047857',
    address: 'Calle 2, Ibiza',
    contactEmail: 'prop2@example.com',
    token: 'token2',
    description: 'Bienvenido a Prop2',
    transport: { taxi: '', privateTaxi: '', bus: '' }
  }
];

export function loadProperties() {
  let props = JSON.parse(localStorage.getItem('properties'));
  if (!props || props.length === 0) {
    props = defaultProperties;
    localStorage.setItem('properties', JSON.stringify(props));
  }
  return props;
}

export function saveProperties(props) {
  localStorage.setItem('properties', JSON.stringify(props));
}

export function getProperty(id) {
  return loadProperties().find(p => p.id === id);
}

export function updateProperty(updated) {
  const props = loadProperties().map(p => (p.id === updated.id ? updated : p));
  saveProperties(props);
}

export function loadTickets() {
  return JSON.parse(localStorage.getItem('tickets')) || [];
}

export function saveTickets(tickets) {
  localStorage.setItem('tickets', JSON.stringify(tickets));
}

export function addTicket(ticket) {
  const arr = loadTickets();
  arr.push(ticket);
  saveTickets(arr);
}

export function updateTicketStatus(id, status) {
  const arr = loadTickets();
  const t = arr.find(t => t.id === id);
  if (t) {
    t.status = status;
    saveTickets(arr);
  }
}

export function ticketsByProperty(propId) {
  return loadTickets().filter(t => t.propertyId === propId);
}

export function loadEvents() {
  return JSON.parse(localStorage.getItem('events')) || [];
}

export function saveEvents(events) {
  localStorage.setItem('events', JSON.stringify(events));
}

export function addEvent(event) {
  const arr = loadEvents();
  arr.push(event);
  saveEvents(arr);
}

export function eventsByProperty(propId) {
  return loadEvents().filter(e => e.propertyId === propId);
}

export function requireAdmin() {
  if (localStorage.getItem('isAdmin') !== 'true') {
    window.location.href = 'index.html';
  }
}

export function adminLogin(password) {
  if (password === 'admin123') {
    localStorage.setItem('isAdmin', 'true');
    return true;
  }
  return false;
}

export function adminLogout() {
  localStorage.removeItem('isAdmin');
}

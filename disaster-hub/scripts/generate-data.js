// scripts/generate-data.js
// Generates FICTIONAL sample data for the Disaster Preparedness Hub.
// Run with: npm run generate
import { writeFileSync, mkdirSync } from 'node:fs';

// ---------- Fixed scenario clock (keeps data and tests repeatable) ----------
const SCENARIO_NOW = '2026-11-08T08:00:00.000Z';
const NOW = Date.parse(SCENARIO_NOW);
const MIN = 60 * 1000;

// ---------- Seeded random numbers (same output every run) ----------
function mulberry32(seed) {
  let a = seed;
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const rand = mulberry32(2026);
const int = (min, max) => min + Math.floor(rand() * (max - min + 1));
const pick = (arr) => arr[Math.floor(rand() * arr.length)];
const iso = (ms) => new Date(ms).toISOString();
const pad = (n, len = 3) => String(n).padStart(len, '0');

// ---------- Shared lookup lists ----------
const ZONES = [
  { id: 'A', name: 'Riverside' },
  { id: 'B', name: 'Old Market' },
  { id: 'C', name: 'Hillview' },
  { id: 'D', name: 'Northgate' },
  { id: 'E', name: 'Eastside' },
  { id: 'F', name: 'Lakeside' },
];

const VERIFIED_SOURCES = [
  'Rivermoor Emergency Office',
  'Rivermoor Weather Service',
  'Rivermoor Water Authority',
  'Rivermoor Police',
];
const UNVERIFIED_SOURCES = ['Resident report', 'Social media post', 'Community group chat'];

const LEVELS = ['info', 'advisory', 'warning', 'critical'];

// ---------- 1. ALERTS ----------
const INCIDENTS = [
  { hazard: 'Flood', severity: 'critical', title: 'River overflowing', action: 'Leave low ground now and go to the nearest open shelter.' },
  { hazard: 'Flood', severity: 'warning', title: 'River level rising', action: 'Move valuables upstairs and prepare to leave.' },
  { hazard: 'Flood', severity: 'advisory', title: 'Heavy rain expected', action: 'Clear drains near your home.' },
  { hazard: 'Flood', severity: 'warning', title: 'Underpass flooded', action: 'Do not drive through the underpass.' },
  { hazard: 'Storm', severity: 'warning', title: 'Strong winds approaching', action: 'Stay indoors and keep away from windows.' },
  { hazard: 'Storm', severity: 'advisory', title: 'Thunderstorm watch', action: 'Charge phones and power banks.' },
  { hazard: 'Storm', severity: 'info', title: 'Weather update at noon', action: 'Check the next update.' },
  { hazard: 'Earthquake', severity: 'critical', title: 'Aftershock expected', action: 'Drop, cover and hold on. Stay out of damaged buildings.' },
  { hazard: 'Earthquake', severity: 'warning', title: 'Building damage reported', action: 'Avoid damaged buildings and report gas smells.' },
  { hazard: 'Fire', severity: 'critical', title: 'Wildfire moving toward homes', action: 'Evacuate immediately along the marked route.' },
  { hazard: 'Fire', severity: 'warning', title: 'Smoke in the air', action: 'Close windows and wear a mask outdoors.' },
  { hazard: 'Fire', severity: 'advisory', title: 'Burn ban in force', action: 'Do not light open fires.' },
  { hazard: 'Heat', severity: 'warning', title: 'Extreme heat', action: 'Drink water often and avoid the midday sun.' },
  { hazard: 'Heat', severity: 'advisory', title: 'Hot weather ahead', action: 'Check on elderly neighbours.' },
  { hazard: 'Water', severity: 'warning', title: 'Drinking water unsafe', action: 'Boil water for one minute before drinking.' },
  { hazard: 'Power', severity: 'advisory', title: 'Planned power cuts', action: 'Charge devices and store water.' },
  { hazard: 'Power', severity: 'warning', title: 'Power outage in progress', action: 'Use torches, not candles. Unplug big appliances.' },
  { hazard: 'Road', severity: 'warning', title: 'Main bridge closed', action: 'Use the northern road instead.' },
  { hazard: 'Road', severity: 'info', title: 'Road works on Elm Road', action: 'Allow extra travel time.' },
  { hazard: 'Health', severity: 'advisory', title: 'Mobile clinic available', action: 'Visit the clinic if you need first aid.' },
  { hazard: 'Health', severity: 'warning', title: 'Heat illness cases rising', action: 'Rest in shade and drink water.' },
  { hazard: 'Landslide', severity: 'critical', title: 'Hillside unstable', action: 'Move away from the slope and go to a shelter.' },
  { hazard: 'Landslide', severity: 'warning', title: 'Cracks seen on hill road', action: 'Avoid the hill road.' },
  { hazard: 'Gas', severity: 'warning', title: 'Gas leak reported', action: 'No flames or sparks. Leave the area.' },
];

// Incidents that only have unverified reports (rumours)
const RUMOUR_ONLY = [3, 10, 14, 19];

const alerts = [];
INCIDENTS.forEach((inc, i) => {
  const zone = pick(ZONES);
  const incidentKey = `${inc.hazard.toLowerCase()}-${zone.id}-${pad(i + 1, 2)}`;

  const isOld = rand() < 0.25; // some incidents are already over
  const ageMin = isOld ? int(700, 1500) : int(10, 300);
  const durationMin = {
    critical: int(240, 720),
    warning: int(180, 480),
    advisory: int(120, 360),
    info: int(60, 240),
  }[inc.severity];
  const expiresAt = NOW - ageMin * MIN + durationMin * MIN;

  const reportCount = int(2, 3);
  for (let r = 0; r < reportCount; r++) {
    const rumourOnly = RUMOUR_ONLY.includes(i);
    const verified = rumourOnly ? false : r === 0 || rand() < 0.4;
    const source = verified ? pick(VERIFIED_SOURCES) : pick(UNVERIFIED_SOURCES);

    let severity = inc.severity;
    // Unverified reports sometimes exaggerate by one level
    if (!verified && rand() < 0.3) {
      severity = LEVELS[Math.min(LEVELS.indexOf(severity) + 1, LEVELS.length - 1)];
    }

    const issuedAt = NOW - Math.max(ageMin - r * int(1, 15), 1) * MIN;

    alerts.push({
      id: `AL-${pad(alerts.length + 1)}`,
      incidentKey,
      hazard: inc.hazard,
      severity,
      title: `${inc.hazard}: ${inc.title}`,
      message: `${inc.title} affecting Zone ${zone.id} (${zone.name}).`,
      action: inc.action,
      zone: zone.id,
      source,
      verified,
      issuedAt: iso(issuedAt),
      expiresAt: iso(expiresAt),
    });
  }
});

// ---------- 2. SHELTERS ----------
const SHELTER_NAMES = [
  'Rivermoor Community Hall', 'Old Market School', 'Hillview Primary School',
  'Northgate Sports Centre', 'St. Mary Church Hall', 'Eastside Library',
  'Riverside Community Room', 'Central Park Pavilion', 'Westend Youth Centre',
  'Lakeside Town Hall', 'Greenfield College Gym', 'Harbour Road Depot',
  'Southfield Clinic Annex', 'Maple Street School', 'Station Road Hall',
  'Orchard Community Centre', 'Highpoint Arena', 'Brookside Hall',
  'Cedar Lane Hall', 'Fairview Hall',
];
const STREETS = ['Elm Road', 'Oak Street', 'River Lane', 'Hill Road', 'Market Square', 'Station Road', 'Park Avenue'];

const shelters = SHELTER_NAMES.map((name, i) => {
  const capacity = int(50, 500);
  return {
    id: `SH-${pad(i + 1)}`,
    name,
    zone: pick(ZONES).id,
    address: `${int(1, 99)} ${pick(STREETS)}`,
    capacity,
    occupancy: Math.floor(capacity * rand() * 0.9),
    accessible: rand() < 0.7,
    hasMedical: rand() < 0.4,
    petsAllowed: rand() < 0.4,
    isOpen: rand() < 0.85,
    phone: `555-01${pad(int(0, 99), 2)}`,
    x: int(5, 95),
    y: int(5, 95),
  };
});

// ---------- 3. SUPPLIES ----------
// [name, category, quantity per household, unit, essential?]
const SUPPLY_ROWS = [
  ['Drinking water', 'Water & Food', 12, 'litres', true],
  ['Canned food', 'Water & Food', 10, 'cans', true],
  ['Dry snacks and biscuits', 'Water & Food', 6, 'packs', false],
  ['Powdered milk or baby food', 'Water & Food', 2, 'packs', false],
  ['Water purification tablets', 'Water & Food', 1, 'pack', true],
  ['Manual can opener', 'Water & Food', 1, 'item', false],
  ['First aid kit', 'Health', 1, 'kit', true],
  ['Prescription medicines (7 days)', 'Health', 1, 'set', true],
  ['Pain relief tablets', 'Health', 1, 'pack', false],
  ['Bandages and dressings', 'Health', 1, 'pack', true],
  ['Hand sanitiser', 'Health', 2, 'bottles', false],
  ['Face masks', 'Health', 10, 'masks', false],
  ['Torch', 'Tools', 2, 'items', true],
  ['Spare batteries', 'Tools', 8, 'items', true],
  ['Power bank', 'Tools', 1, 'item', true],
  ['Battery or hand-crank radio', 'Tools', 1, 'item', true],
  ['Whistle', 'Tools', 1, 'item', false],
  ['Multi-tool', 'Tools', 1, 'item', false],
  ['Duct tape', 'Tools', 1, 'roll', false],
  ['Matches in waterproof box', 'Tools', 1, 'box', false],
  ['ID copies in waterproof bag', 'Documents', 1, 'set', true],
  ['Printed emergency contact list', 'Documents', 1, 'sheet', true],
  ['Cash in small notes', 'Documents', 1, 'set', true],
  ['Copies of insurance and property papers', 'Documents', 1, 'set', false],
  ['Local paper map', 'Documents', 1, 'item', false],
  ['Blankets', 'Comfort', 4, 'items', true],
  ['Spare clothes', 'Comfort', 1, 'set per person', false],
  ['Sleeping mats', 'Comfort', 4, 'items', false],
  ['Toiletries', 'Comfort', 1, 'kit', false],
  ['Pet food and leash', 'Comfort', 1, 'set', false],
];
const supplies = SUPPLY_ROWS.map(([name, category, quantity, unit, essential], i) => ({
  id: `SU-${pad(i + 1)}`,
  name,
  category,
  quantity,
  unit,
  essential,
}));

// ---------- 4. CHECKLIST ----------
// [text, phase, priority]
const CHECK_ROWS = [
  ['Agree on a family meeting point near home', 'Before', 'high'],
  ['Agree on a second meeting point outside your area', 'Before', 'medium'],
  ['Save emergency numbers on every phone', 'Before', 'high'],
  ['Print the emergency contact list', 'Before', 'high'],
  ['Pack a go-bag for each person', 'Before', 'high'],
  ['Store 3 days of drinking water', 'Before', 'high'],
  ['Find your nearest shelter and two routes to it', 'Before', 'high'],
  ['Learn how to switch off gas, water and power', 'Before', 'medium'],
  ['Check on elderly or disabled neighbours', 'Before', 'medium'],
  ['Make a plan for pets', 'Before', 'low'],
  ['Check the latest verified alert', 'During', 'high'],
  ['Follow the action in the most serious alert first', 'During', 'high'],
  ['Move to higher ground or a safe room if told to', 'During', 'high'],
  ['Stay away from floodwater, wires and damaged buildings', 'During', 'high'],
  ['Keep your phone charged and save battery', 'During', 'medium'],
  ['Tell your family contact that you are safe', 'During', 'medium'],
  ['Do not spread unverified reports', 'During', 'medium'],
  ['Help people who cannot move easily', 'During', 'low'],
  ['Wait for the official all-clear before going home', 'After', 'high'],
  ['Check yourself and your family for injuries', 'After', 'high'],
  ['Boil water until it is declared safe', 'After', 'high'],
  ['Report hazards to the emergency office', 'After', 'medium'],
  ['Restock your supplies', 'After', 'medium'],
  ['Photograph damage for your records', 'After', 'low'],
  ['Update your household plan', 'After', 'low'],
];
const checklist = CHECK_ROWS.map(([text, phase, priority], i) => ({
  id: `CK-${pad(i + 1)}`,
  text,
  phase,
  priority,
}));

// ---------- Write files ----------
const meta = {
  scenarioName: 'Rivermoor multi-hazard scenario (FICTIONAL)',
  scenarioNow: SCENARIO_NOW,
  zones: ZONES,
  notice: 'All data is fictional. This is not a real emergency system.',
  counts: {
    alerts: alerts.length,
    shelters: shelters.length,
    supplies: supplies.length,
    checklist: checklist.length,
  },
};

mkdirSync('src/data', { recursive: true });
const write = (file, data) =>
  writeFileSync(`src/data/${file}`, JSON.stringify(data, null, 2) + '\n');

write('alerts.json', alerts);
write('shelters.json', shelters);
write('supplies.json', supplies);
write('checklist.json', checklist);
write('meta.json', meta);

const total = alerts.length + shelters.length + supplies.length + checklist.length;
console.log('Generated:', meta.counts, `-> total ${total} records`);
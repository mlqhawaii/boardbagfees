const AIRLINE_IATA = {
  'air-tahiti-nui':'TN','alaska-airlines':'AS','hawaiian-airlines':'HA','singapore-airlines':'SQ',
  'china-airlines':'CI','emirates':'EK','eva-air':'BR','malaysia-airlines':'MH','korean-air':'KE','ana':'NH',
  'asiana':'OZ','american-airlines':'AA','delta':'DL','qantas':'QF','air-premia':'YP','virgin-australia':'VA',
  'airasia':'AK','turkish-airlines':'TK','southwest':'WN','air-new-zealand':'NZ','cathay-pacific':'CX','united':'UA',
  'zipair':'ZG','jetstar':'JQ','mokulele':'MW','air-canada':'AC','fiji-airways':'FJ','qatar-airways':'QR',
  'vietnam-airlines':'VN','westjet':'WS','philippine-airlines':'PR','japan-airlines-jal':'JL','jetblue':'B6',
  'spirit-airlines':'NK','frontier-airlines':'F9','aeromexico':'AM','copa-airlines':'CM','avianca':'AV',
  'latam-airlines':'LA','gol':'G3','azul-brazilian-airlines':'AD','british-airways':'BA','air-france':'AF','klm':'KL',
  'lufthansa':'LH','swiss':'LX','iberia':'IB','tap-air-portugal':'TP','easyjet':'U2','ryanair':'FR','etihad-airways':'EY',
  'garuda-indonesia':'GA','batik-air-indonesia':'ID','scoot':'TR','thai-airways':'TG','srilankan-airlines':'UL',
  'china-southern-airlines':'CZ','china-eastern-airlines':'MU','starlux-airlines':'JX','air-india':'AI','royal-air-maroc':'AT','south-african-airways':'SA','airlink':'4Z','flysafair':'FA','kenya-airways':'KQ','sky-airline':'H2','jetsmart':'JA','aerolineas-argentinas':'AR','volaris':'Y4','viva-aerobus':'VB','lion-air':'JT','citilink':'QG','cebu-pacific':'5J','vueling':'VY','transavia':'HV','norwegian':'DY','condor':'DE','azores-airlines':'S4','air-europa':'UX','aircalin':'SB'
};


const LOCAL_AIRLINE_LOGOS = new Set([
  'hawaiian-airlines','united','alaska-airlines','qatar-airways',
  'delta','american-airlines','emirates','singapore-airlines'
]);

window.airlineIata = slug => AIRLINE_IATA[slug] || '';
window.airlineLogoUrl = slug => {
  if (LOCAL_AIRLINE_LOGOS.has(slug)) return `/assets/airline-logos/${slug}.jpg`;
  const code = AIRLINE_IATA[slug];
  return code ? `https://www.gstatic.com/flights/airline_logos/70px/${encodeURIComponent(code)}.png` : '';
};
window.airlineInitials = name => String(name || '').split(/\s+/).filter(Boolean).slice(0,2).map(x=>x[0]).join('').toUpperCase();
window.airlineLogoMarkup = (slug, name, extraClass='') => {
  const url = window.airlineLogoUrl(slug);
  const initials = window.airlineInitials(name);
  if (!url) return `<span class="airline-logo-frame ${extraClass}"><span class="airline-logo-fallback">${initials}</span></span>`;
  return `<span class="airline-logo-frame ${extraClass}"><img src="${url}" alt="${String(name||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/\"/g,'&quot;')} logo" loading="lazy" referrerpolicy="no-referrer" onerror="this.hidden=true;this.nextElementSibling.hidden=false"><span class="airline-logo-fallback" hidden>${initials}</span></span>`;
};

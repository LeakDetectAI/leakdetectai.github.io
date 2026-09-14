// All observations in a record describe the same edition and submission cycle.
export function resolve(venue) {
  const observations = [...(venue.observations || [])].sort((a,b) => Number(b.authority === 'official') - Number(a.authority === 'official') || String(b.checked || '').localeCompare(String(a.checked || '')));
  const chosen = observations.find(s => s.paper) || observations[0] || {};
  return {...chosen, verified: chosen.authority === 'official' && Boolean(chosen.paper && chosen.checked) && venue.workshopKind !== 'program' && venue.dateStatus !== 'time-unclear', conflict: new Set(observations.filter(s=>s.paper).map(s=>s.paper.includes('T') ? new Date(s.paper).toISOString() : s.paper)).size > 1};
}
export function formatDate(value) {
  if (!value) return 'Not recorded';
  // Preserve the source's calendar date; never shift AoE dates into the viewer's zone.
  return new Date(value.slice(0,10) + 'T12:00:00Z').toLocaleDateString('en-GB',{day:'numeric',month:'short',year:'numeric',timeZone:'UTC'});
}
export function countdown(value, now=Date.now()) {
  if(!value) return {value:'—',label:'Date not recorded'};
  if(!value.includes('T')) return {value:formatDate(value).replace(/ \d{4}$/, ''),label:'Time not recorded'};
  const diff = new Date(value).getTime()-now;
  if(diff<=0) return {value:'Closed',label:'Submission deadline passed'};
  const days=Math.floor(diff/86400000);
  return {value:days ? `${days}d` : `${Math.max(1,Math.ceil(diff/3600000))}h`,label:'until paper deadline',soon:days<30};
}

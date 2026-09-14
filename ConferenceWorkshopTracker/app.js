import { resolve, formatDate, countdown } from './logic.js';
const $ = id => document.getElementById(id);
const escape = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const safeUrl = value => { try { const u = new URL(value); return ['http:', 'https:'].includes(u.protocol) ? escape(u.href) : '#'; } catch { return '#'; } };
let venues = [], area = 'all';
function render() {
  const now = Date.now();
  const all = venues.map(v => ({...v, resolved: resolve(v)}));
  $('total').textContent = new Set(all.map(v => v.name)).size;
  $('upcoming').textContent = all.filter(v => v.resolved.paper && new Date(v.resolved.paper).getTime() > now).length;
  $('verified').textContent = all.filter(v => v.resolved.verified).length;
  $('last-refresh').textContent = new Date(now).toLocaleTimeString(undefined,{hour:'2-digit',minute:'2-digit'});
  const query = $('search').value.trim().toLowerCase();
  const ranking = $('ranking').value;
  const type = $('venue-type').value;
  const filtered = all.filter(v => (type === 'all' || v.type === type) && (ranking === 'all' || (ranking === 'unknown' ? (!v.rank?.value || ['user-supplied','secondary-source'].includes(v.rank?.verification)) : `${v.rank?.system}:${v.rank?.value}` === ranking)) && (area === 'all' || v.area === area) && (!$('verified-only').checked || v.resolved.verified) && `${v.name} ${v.fullName} ${v.area} ${v.parentVenue?.name || ''}`.toLowerCase().includes(query));
  filtered.sort((a,b) => $('sort').value === 'name' ? a.name.localeCompare(b.name) : deadlineOrder(a, now) - deadlineOrder(b, now) || a.name.localeCompare(b.name));
  const journalCount = filtered.filter(v => v.type === 'journal').length;
  const workshopCount = filtered.filter(v => v.type === 'workshop' && v.workshopKind === 'individual').length;
  const programCount = filtered.filter(v => v.workshopKind === 'program').length;
  const eventCount = filtered.length - journalCount - workshopCount - programCount;
  $('result-count').textContent = `${filtered.length} ${filtered.length === 1 ? 'tracked record' : 'tracked records'} · ${eventCount} conferences · ${workshopCount} workshops · ${programCount} workshop programs · ${journalCount} journals · ${area === 'all' ? 'All research areas' : area}`;
  $('cards').innerHTML = filtered.length ? groupedCards(filtered, type) : '<div class="empty"><h2>No matching venues</h2><p>Try another search or clear your filters.</p><button id="reset">Clear filters</button></div>';
  $('reset')?.addEventListener('click', () => { $('search').value=''; $('verified-only').checked=false; $('ranking').value='all'; $('venue-type').value='all'; setArea('all'); });
}
function deadlineOrder(v, now) { const time = Date.parse(v.resolved.paper); return Number.isFinite(time) ? (time < now ? time + 1e13 : time) : Infinity; }
function groupedCards(records, type) {
  const section = (label, items) => items.length ? `<section class="record-group"><h2>${escape(label)}</h2>${items.map(card).join('')}</section>` : '';
  const workshops = records.filter(v => v.type === 'workshop');
  const workshopGroups = ['individual', 'program'].map(kind => {
    const items = workshops.filter(v => v.workshopKind === kind);
    const hosts = [...new Set(items.map(v => v.parentVenue?.name || 'Other'))];
    return hosts.map(host => section(`${kind === 'program' ? 'Workshop programs · CFPs pending' : 'Named workshops'} · ${host}`, items.filter(v => (v.parentVenue?.name || 'Other') === host))).join('');
  }).join('');
  return section('Conferences', records.filter(v => v.type === 'conference')) + workshopGroups + section('Journals', records.filter(v => v.type === 'journal'));
}
function card(v) {
  const r = v.resolved, status = v.type === 'journal' && !r.paper ? {value:'Journal',label:'See submission policy'} : v.workshopKind === 'program' ? {value: 'Program', label: 'Check individual CFP'} : countdown(r.paper), kind = v.area === 'NLP' ? 'nlp' : v.area === 'Machine Learning' ? 'ml' : '';
  const date = (label, value) => `<div><dt>${label}</dt><dd>${escape(formatDate(value))}</dd></div>`;
  const observations = (v.observations || []).map(s => `<div class="source-row"><a href="${safeUrl(s.url)}" target="_blank" rel="noopener noreferrer">${escape(s.name)} ↗</a><span>${s.paper ? escape(formatDate(s.paper)) : 'No paper date'} · checked ${escape(s.checked || 'not recorded')}</span></div>`).join('');
  const commitmentLabel = v.type === 'workshop' ? 'ARR workshop commitment' : 'Conference commitment';
  return `<article class="venue"><div class="venue-main"><div><div class="venue-top"><h2><a href="${safeUrl(v.url)}" target="_blank" rel="noopener noreferrer">${escape(v.name)} <span class="year">${escape(v.year || '')}</span></a></h2><span class="area ${kind}">${escape(v.area)}</span>${rankBadge(v)}</div><p class="fullname">${escape(v.fullName)}</p>${v.dateStatus === 'time-unclear' ? '<p class="cycle-label">Source has conflicting weekday/time wording; see verification details.</p>' : ''}${v.cycle ? `<p class="cycle-label">${escape(v.cycle)}</p>` : ''}${v.type === 'journal' ? journalSummary(v) : ''}<span class="badge ${r.verified ? 'good' : 'pending'}">${v.workshopKind === 'program' ? 'Official program timeline · individual CFP pending' : v.dateStatus === 'time-unclear' ? 'Date checked · cutoff unclear' : r.verified ? '✓ Officially checked' : 'Needs verification'}</span></div><div class="countdown ${status.soon ? 'soon' : ''}"><strong>${escape(status.value)}</strong><small>${escape(status.label)}</small></div></div><dl class="milestones">${date('Abstract registration deadline',r.abstract)}${date(v.paperLabel || 'Paper submission deadline',r.paper)}${date('Early-reject notification',r.earlyReject)}${date('Reviews released',r.reviewsReleased)}${date('Acceptance notification',r.decision)}${date('Camera-ready deadline',r.cameraReady)}</dl><div class="date-strip"><div><span>Submission time zone</span>${r.paper?.includes('T') ? escape(v.timezone || 'See source') : 'Not recorded'}</div></div><details><summary>Dates, sources & verification</summary><div class="detail-body">${v.cycle ? `<p><strong>${escape(v.cycle)}</strong></p>` : ''}${v.note ? `<p>${escape(v.note)}</p>` : ''}${r.paper?.includes('T') ? `<p>Your local deadline: <strong>${escape(new Date(r.paper).toLocaleString(undefined,{dateStyle:'full',timeStyle:'long'}))}</strong></p>` : ''}${v.commitment ? `<p>${commitmentLabel}: ${escape(formatDate(v.commitment))}</p>` : ''}${arrSchedule(v)}${r.conflict ? '<p class="conflict">Sources disagree on the paper deadline. The official observation takes precedence when available; otherwise the most recently checked observation is shown.</p>' : ''}${observations || '<p>No deadline observation recorded yet.</p>'}<p><a href="${safeUrl(v.url)}" target="_blank" rel="noopener noreferrer">Visit venue website ↗</a></p>${rankDetails(v)}${r.checked ? `<p>Last deadline check: ${escape(r.checked)}${Date.now()-Date.parse(r.checked)>30*86400000 ? ' · More than 30 days ago; recheck the CFP.' : ''}</p>` : ''}</div></details></article>`;
}
function arrSchedule(v) {
  const s = v.arrReviewingSchedule;
  if (!s) return '';
  const row = (label, value) => `<div><dt>${label}</dt><dd>${escape(value?.includes(' to ') ? value.split(' to ').map(formatDate).join(' - ') : formatDate(value))}</dd></div>`;
  return `<section class="arr-schedule"><h3>ARR Reviewing Schedule · ${escape(s.cycle)}</h3>${s.note ? `<p>${escape(s.note)}</p>` : ''}<dl>${row('Submission', s.submission)}${row('Reviewer registration', s.reviewerRegistration)}${row('Reviews due', s.reviewsDue)}${row('Author response', s.authorResponse)}${row('Meta-reviews release date', s.metaReviewsRelease)}${row('Cycle end', s.cycleEnd)}</dl><p><a href="${safeUrl(s.source)}" target="_blank" rel="noopener noreferrer">ARR dates source ↗</a></p></section>`;
}
function journalSummary(v) {
  const rank=v.rank;
  const verification = {'indexed-snapshot':'Historical snapshot', 'secondary-source':'Secondary source · verification pending', 'user-supplied':'User supplied · verification pending'}[rank?.verification] || 'Not verified';
  return `<div class="journal-summary">${v.publisher ? `<p>Publisher: ${escape(v.publisher)}</p>` : ''}<p><strong>SJR ${escape(rank?.metricYear ?? 'year not recorded')}: ${escape(rank?.sjr ?? 'Not recorded')}</strong></p><p>${escape(verification)}</p><p>${escape(rank?.category || 'Category not recorded')}</p></div>`;
}
function rankBadge(v) {
  const rank = v.rank;
  const fallback = v.type === 'journal' ? 'https://www.scimagojr.com/' : 'https://portal.core.edu.au/conf-ranks/';
  if (v.type === 'workshop') {
    return v.parentVenue ? `<span class="rank-badge">Host: ${escape(v.parentVenue.name)}</span>` : '';
  }
  const label = v.type === 'journal' ? 'SCImago' : 'CORE';
  return `<a class="rank-badge" href="${safeUrl(rank?.url || fallback)}" target="_blank" rel="noopener noreferrer">${label} ${escape(rank?.value || 'Not verified')} <span>${escape(rank?.edition || '')}${rank?.verification === 'user-supplied' ? ' · unverified' : ''}</span></a>`;
}
function rankDetails(v) {
  if (v.type === 'workshop') return '';
  const rank = v.rank;
  if (!rank) return '<p>Ranking not verified.</p>';
  const heading = rank.system === 'SCImago' ? 'SCImago Journal & Country Rank' : v.type === 'workshop' ? 'ICORE workshop-series lookup' : 'CORE / ICORE conference ranking';
  const parent = v.parentVenue ? `<p>Parent venue: <a href="${safeUrl(v.parentVenue.url)}" target="_blank" rel="noopener noreferrer">${escape(v.parentVenue.name)}${v.parentVenue.coreRank ? ` (${escape(v.parentVenue.coreRank)})` : ' (rank not stored)'}</a>. Parent rank is not inherited by this workshop.</p>` : '';
  const verification = rank.verification === 'user-supplied' ? 'User supplied; not independently verified' : rank.verification === 'exact-workshop-series-not-found' ? 'Exact workshop series not found' : `${rank.verification === 'indexed-snapshot' ? 'Indexed source checked' : rank.verification === 'secondary-source' ? 'Secondary source checked' : 'Checked'} ${escape(rank.checked)}`;
  return `<section class="ranking-details"><h3>${heading}</h3><p><strong>${escape(rank.value || rank.status || 'Not verified')}</strong> · ${escape(rank.edition)}</p>${parent}${rank.category ? `<p>Category / scope: ${escape(rank.category)}</p>` : ''}${rank.system === 'SCImago' ? `<p>SJR score: ${escape(rank.sjr ?? 'Not recorded')} · Metric year: ${escape(rank.metricYear ?? 'Not recorded')}</p>` : ''}${rank.note ? `<p>${escape(rank.note)}</p>` : ''}${rank.officialUrl ? `<p><a href="${safeUrl(rank.officialUrl)}" target="_blank" rel="noopener noreferrer">Official SCImago record ↗</a></p>` : ''}<p><a href="${safeUrl(rank.url)}" target="_blank" rel="noopener noreferrer">Ranking source ↗</a> · ${verification}</p></section>`;
}
function setArea(value) { area=value; document.querySelectorAll('[data-area]').forEach(b=>b.setAttribute('aria-pressed', String(b.dataset.area === area)));render(); }
$('areas').addEventListener('click', e => { const b=e.target.closest('[data-area]'); if(b) setArea(b.dataset.area); });
['search','sort','verified-only','ranking','venue-type'].forEach(id => $(id).addEventListener(id==='search' ? 'input' : 'change', render));
function load() { venues = embeddedVenues; render(); }
load();setInterval(()=>{if(venues.length) render();},60000);
if (document.modelContext?.registerTool) {
  const lifecycle = new AbortController();
  try {
    Promise.resolve(document.modelContext.registerTool({
      name: 'filter_conference_deadlines',
      description: 'Filter the visible deadline catalogue by search text and research area.',
      inputSchema: {type:'object',properties:{query:{type:'string'},area:{type:'string',enum:['all','Security & Privacy','Machine Learning','NLP','Systems & IoT']}},additionalProperties:false},
      annotations: {readOnlyHint:false,untrustedContentHint:true},
      execute(input) {
        if (!input || typeof input !== 'object' || Object.keys(input).some(k=>!['query','area'].includes(k)) || (input.query !== undefined && typeof input.query !== 'string') || (input.area !== undefined && !['all','Security & Privacy','Machine Learning','NLP','Systems & IoT'].includes(input.area))) throw new Error('Invalid filter');
        if (!venues.length) throw new Error('Catalogue is not loaded');
        $('search').value=input.query || ''; $('verified-only').checked=false; $('ranking').value='all'; $('venue-type').value='all'; setArea(input.area || 'all');
        return {summary:$('result-count').textContent};
      }
    },{signal:lifecycle.signal})).catch(()=>{});
  } catch {}
  window.addEventListener('pagehide',()=>lifecycle.abort(),{once:true});
}

import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve, countdown, formatDate } from '../logic.js';
test('official CFP wins over newer discovery and reports conflict',()=>{
 const result=resolve({observations:[{authority:'discovery',paper:'2026-11-15T23:59:59-12:00',checked:'2026-09-15'},{authority:'official',paper:'2026-11-17T23:59:59-12:00',checked:'2026-09-14'}]});
 assert.equal(result.paper,'2026-11-17T23:59:59-12:00');assert.equal(result.verified,true);assert.equal(result.conflict,true);
});
test('AoE stays open into the following UTC day',()=>{
 const deadline='2026-11-17T23:59:59-12:00';
 assert.notEqual(countdown(deadline,Date.parse('2026-11-18T10:00:00Z')).value,'Closed');
 assert.equal(countdown(deadline,Date.parse('2026-11-18T12:00:00Z')).value,'Closed');
 assert.equal(formatDate(deadline),'17 Nov 2026');
});
test('date-only and unknown deadlines never invent a countdown',()=>{
 assert.equal(countdown('2026-10-12').label,'Time not recorded');assert.equal(countdown(null).value,'—');assert.equal(resolve({}).verified,false);
});
test('catalogue has unique venue IDs, valid dates, and attributable observations',()=>{
 const data=JSON.parse(readFileSync(new URL('../data/venues.json',import.meta.url)));
 assert.equal(new Set(data.map(v=>v.id)).size,data.length);
 for(const v of data){assert.ok(v.name && v.fullName && v.area);assert.ok(new URL(v.url));for(const s of v.observations){assert.ok(new URL(s.url));assert.ok(['official','discovery'].includes(s.authority));assert.ok(s.checked);if(s.paper) assert.ok(Number.isFinite(Date.parse(s.paper)));}}
});
test('source registry has valid URLs and regex hints',()=>{
 const registry=JSON.parse(readFileSync(new URL('../data/source-links.json',import.meta.url)));
 for(const section of ['discoveryFeeds','rankingSources','officialVenueSources']){
  for(const source of registry[section]){assert.ok(source.name);assert.ok(new URL(source.url || source.primaryUrl));assert.ok(source.regexHint);assert.doesNotThrow(()=>new RegExp(source.regexHint));}
 }
 for(const source of registry.officialUrlTemplates){assert.ok(source.venue);assert.ok(source.template);assert.ok(source.regexHint);assert.doesNotThrow(()=>new RegExp(source.regexHint));}
});
test('workshop programs and ambiguous cutoffs are not verified submission deadlines',()=>{
 const data=JSON.parse(readFileSync(new URL('../data/venues.json',import.meta.url)));
 for(const v of data.filter(v=>v.type==='workshop')){
  assert.equal(v.rank,undefined);
  assert.ok(['individual','program'].includes(v.workshopKind));
  assert.ok(v.parentVenue?.name);
  if(v.workshopKind==='program' || v.dateStatus==='time-unclear') assert.equal(resolve(v).verified,false);
 }
});

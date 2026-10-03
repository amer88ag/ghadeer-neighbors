/* Release gate for old-home -> live-home migration. */
'use strict';
const fs=require('fs');
const index=fs.readFileSync('index.html','utf8');
const live=fs.readFileSync('ghadeer-live-home-v5.js','utf8');
const required=['services','neighbors','market','outings','coffee','football','wardi','news','announcements','occasions','messages','lost','housing','jobs','neighborCheck','hadith','prayer','weather','developer','settings','aboutProject','more'];
if(!index.includes('id="home"'))throw new Error('Migration source home not found; do not delete blindly.');
if(!live.includes('ghLiveHome'))throw new Error('Live home root missing.');
for(const key of required)if(!live.includes(`['${key}'`))throw new Error(`Live home missing service key: ${key}`);
if(!live.includes('nextPrayer')&&!live.includes('lhNextPrayer'))throw new Error('Prayer widget missing.');
if(!live.includes('lhHadithText'))throw new Error('Hadith widget missing.');
if(!live.includes('lhMemberCount')||!live.includes('lhMessageCount'))throw new Error('Member/message metrics missing.');
console.log('LIVE_HOME_MIGRATION_AUDIT_PASS');

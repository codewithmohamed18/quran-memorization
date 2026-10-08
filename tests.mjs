import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {normalize,tokenize,alignWords,buildQueue,nextReview,locatePassage,setOrthography,canonicalQuranWord} from './engine.js';
const corpus=JSON.parse(await readFile(new URL('./quran.json',import.meta.url)));
assert.equal(corpus.length,114);let id=1;for(let s=0;s<114;s++){assert.equal(corpus[s].id,s+1);for(let n=0;n<corpus[s].verses.length;n++){const v=corpus[s].verses[n];assert.equal(v.id,id++);assert.equal(v.n,n+1);assert.ok(v.text.length);assert.ok(v.page>=1&&v.page<=604);}}assert.equal(id,6237);
assert.equal(normalize('قُلْ هُوَ ٱللَّهُ أَحَدٌ'),'قل هو الله احد');
assert.equal(alignWords('قل هو الله احد','قل هو الله احد').differences.length,0);
assert.ok(alignWords('قل هو الله احد','قل الله احد',{complete:true}).differences.some(x=>x.kind==='missing'));
assert.ok(alignWords('قل هو الله احد','قل هو الله الله احد',{complete:true}).differences.some(x=>x.kind==='extra'));
assert.ok(alignWords('قل هو الله احد','قل هو الرحمن احد',{complete:true}).differences.some(x=>x.kind==='replace'));
const unfinished=alignWords('قل هو الله احد','قل هو');assert.equal(unfinished.remaining,2);assert.equal(unfinished.differences.length,0);
assert.equal(alignWords('قل هو الله احد','').differences.length,0);
assert.deepEqual(buildQueue([1,2,3],'connect',1,1),[1,1,2,1,2,3]);
assert.deepEqual(buildQueue([1,2],'verse',2,1),[1,1,2,2]);
assert.deepEqual(buildQueue([1,2],'passage',2,1),[1,2,1,2]);
assert.equal(nextReview('practice',0,100).due,86400100);assert.equal(nextReview('forgotten',2,100).due,100);assert.equal(nextReview('strong',2,100).days,4);
assert.ok(locatePassage(corpus,'قل هو الله احد').candidates.some(x=>x.surah===112&&x.verse===1));
assert.equal(locatePassage(corpus,'قل').candidates.length,0);
console.log('PASS: 114 surahs / 6236 verse IDs; word alignment; unfinished passages; silence; repetition queues; revision scheduling; verse search.');

const spelling=JSON.parse(await readFile(new URL('./orthography.json',import.meta.url)));setOrthography(spelling);assert.equal(canonicalQuranWord(tokenize(corpus[0].verses[1].text).at(-1)), 'العالمين');assert.equal(alignWords(tokenize(corpus[0].verses[1].text).map(canonicalQuranWord),tokenize('الحمد لله رب العالمين')).differences.length,0);assert.equal(canonicalQuranWord('الرحمن'),'الرحمن');console.log('PASS Quran spelling comparison with simple-clean text.');

assert.ok(locatePassage(corpus,'الرحمن علم القران خلق الانسان').candidates.some(x=>x.surah===55&&x.verse===1));console.log('PASS passage lookup across short adjacent verses.');

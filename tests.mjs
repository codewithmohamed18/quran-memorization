import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {normalize,tokenize,alignWords,alignPractice,hasAudibleSignal,buildQueue,nextReview,locatePassage,setOrthography,canonicalQuranWord} from './engine.js';
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

const expected=['قل','هو','الله','احد'];
assert.equal(alignPractice(expected,[...expected,...expected],{repeat:true}).differences.length,0);
assert.equal(alignPractice(expected,[...expected,...expected],{repeat:false}).differences.length,4);
assert.equal(alignPractice(expected,expected.slice(0,3),{complete:true}).differences[0].kind,'missing');
assert.equal(alignPractice(expected,expected.slice(0,3),{complete:false}).remaining,1);
assert.ok(alignPractice(expected,[...expected,'قل','هو','الله','الصمد'],{repeat:true}).differences.some(x=>x.kind==='replace'));
assert.equal(alignPractice(expected,[],{complete:false}).differences.length,0);
console.log('PASS repeat practice, complete-test endings, silence and genuine mismatches preserved.');

assert.equal(hasAudibleSignal(new Float32Array(16000)),false);
assert.equal(hasAudibleSignal([NaN]),false);
assert.equal(hasAudibleSignal([.1,-.1,.2,-.2]),true);
let controlled=0;
for(const surah of corpus)for(const v of surah.verses){const words=tokenize(v.text).map(canonicalQuranWord);assert.equal(alignPractice(words,words,{complete:true}).differences.length,0);const changed=[...words];changed[Math.floor(words.length/2)]='اختبار';assert.ok(alignPractice(words,changed,{complete:true}).differences.length>0);controlled++;}
console.log(`PASS ${controlled} exact text comparisons and ${controlled} controlled changed-word comparisons. These are not microphone accuracy measurements.`);

const {trackingPosition}=await import('./engine.js');
assert.equal(trackingPosition(alignWords(['a','b','c'],['a','x','c'])),1);
assert.equal(trackingPosition(alignWords(['a','b'],['a','b'])),2);
assert.equal(trackingPosition(null),0);
assert.equal(trackingPosition(alignWords(['a','b','c'],['x','b','c'])),0);
assert.equal(trackingPosition(alignWords(['a','b','c','d','e'],['a','x','c','d','e'])),5);
const recovered=alignWords(['a','b','c','d','e'],['a','x','c','d','e']);
assert.equal(recovered.differences.length,1);
const {trackedWordIndices}=await import('./engine.js');
assert.equal(trackedWordIndices(recovered).has(1),false);
assert.equal(trackingPosition(alignWords(['a','b','c','d'],['x','x','x','x'])),0);
console.log('PASS uncertain and scattered matches cannot advance live reader.');

// Exact ayah repeats in practice; an incorrect repeat is never discarded.
const ex=['a','b','c','d','e','f'],refs=['1:1','1:1','1:1','1:2','1:2','1:2'];
const repeatAyah=alignPractice(ex,['a','b','c','a','b','c','d','e','f'],{repeat:true,verseRefs:refs});
assert.equal(repeatAyah.differences.length,0);assert.equal(repeatAyah.verseRepetitions,1);
assert(alignPractice(ex,['a','b','c','a','x','c','d','e','f'],{repeat:true,verseRefs:refs}).differences.length>0);
assert(alignPractice(ex,['a','b','c','a','b','c','d','e','f'],{repeat:false,verseRefs:refs}).differences.length>0);
const shared=alignPractice(['a','b','a','b','c'],['a','b','a','b','c'],{repeat:true,verseRefs:['1','1','2','2','2']});assert.equal(shared.verseRepetitions,0);assert.equal(shared.differences.length,0);
console.log('PASS exact verse restarts, incorrect repeats retained, shared prefixes preserved.');

setOrthography({variant:'canonical'});
assert.equal(locatePassage([{id:7,verses:[{n:1,text:'canonical b c d'}]}],'variant b c d').candidates[0].surah,7);
assert.equal(locatePassage([corpus[0]],'الحمد لله رب العالمين').candidates[0].verse,2);
assert.equal(locatePassage([corpus[0]],'الحمد لله').candidates.length,0);
console.log('PASS heard-word spelling normalization, scoped Quran lookup and minimum search evidence.');

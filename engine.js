let orthography=Object.create(null);
export function setOrthography(mapping){orthography=Object.assign(Object.create(null),mapping);}
export function canonicalQuranWord(word){return orthography[word]||word;}
// Word matching aids memorization; it cannot evaluate tajweed or pronunciation.
export function normalize(text) {
 return String(text).normalize('NFD').replace(/[\p{M}ـ]/gu,'').replace(/[أإآٱ]/g,'ا').replace(/ى/g,'ي').replace(/[^\p{L}\s]/gu,' ').trim().replace(/\s+/g,' ');
}
export function tokenize(text) { return normalize(text).split(' ').filter(Boolean); }
export function alignWords(expected, heard, {complete=false}={}) {
 const a=Array.isArray(expected)?expected:tokenize(expected), b=Array.isArray(heard)?heard:tokenize(heard);
 const n=a.length,m=b.length;
 if(n>1200||m>1400)throw new Error('Choose a shorter passage for word comparison.');
 const d=Array.from({length:n+1},()=>new Uint16Array(m+1));
 for(let i=0;i<=n;i++)d[i][0]=i;
 for(let j=0;j<=m;j++)d[0][j]=j;
 for(let i=1;i<=n;i++)for(let j=1;j<=m;j++)d[i][j]=Math.min(d[i-1][j]+1,d[i][j-1]+1,d[i-1][j-1]+(a[i-1]===b[j-1]?0:1));
 let end=n;
 if(!complete){end=0;let score=Infinity;for(let i=0;i<=n;i++){const v=d[i][m];if(v<score||v===score&&Math.abs(i-m)<Math.abs(end-m)){score=v;end=i;}}}
 let i=end,j=m;const ops=[];
 while(i>0||j>0){if(i>0&&j>0&&d[i][j]===d[i-1][j-1]+(a[i-1]===b[j-1]?0:1)){ops.push({kind:a[i-1]===b[j-1]?'match':'replace',index:i-1,heard:b[j-1],expected:a[i-1]});i--;j--;}
 else if(i>0&&d[i][j]===d[i-1][j]+1){ops.push({kind:'missing',index:i-1,expected:a[i-1]});i--;}
 else{ops.push({kind:'extra',index:Math.max(0,i-1),heard:b[j-1]});j--;}}
 ops.reverse();return {ops,position:end,compared:end,matches:ops.filter(x=>x.kind==='match').length,differences:ops.filter(x=>x.kind!=='match'),remaining:n-end,heard:m};
}
export function nextReview(confidence,prior=0,now=Date.now()) {
 const days=confidence==='forgotten'?0:confidence==='practice'?1:Math.min(30,Math.max(2,prior*2||2));
 return {days,due:now+days*86400000};
}
export function buildQueue(verses,style='verse',repeat=3,cycles=1) {
 const result=[];const reps=Math.max(1,Math.min(100,Math.floor(repeat))), rounds=Math.max(1,Math.min(20,Math.floor(cycles)));
 for(let r=0;r<rounds;r++){
  if(style==='connect')for(let n=1;n<=verses.length;n++)for(let k=0;k<reps;k++)result.push(...verses.slice(0,n));
  else if(style==='passage')for(let k=0;k<reps;k++)result.push(...verses);
  else for(const v of verses)for(let k=0;k<reps;k++)result.push(v);
 }
 if(result.length>10000)throw new Error('Use fewer repeats or a shorter passage.');
 return result;
}
export function locatePassage(surahs,heard) {
 const words=tokenize(heard).map(canonicalQuranWord);if(words.length<4)return {candidates:[],reason:'Recite at least four recognized words.'};
 const phrase=words.slice(0,Math.min(8,words.length)).join(' ');let exact=[];
 for(const s of surahs)for(let i=0;i<s.verses.length;i++){const v=s.verses[i],first=tokenize(v.text).map(canonicalQuranWord).join(' ');const joined=s.verses.slice(i,i+4).map(x=>tokenize(x.text).map(canonicalQuranWord).join(' ')).join(' ');const offset=joined.indexOf(phrase);if(offset>=0&&offset<first.length&&(offset===0||joined[offset-1]===' ')&&(offset+phrase.length===joined.length||joined[offset+phrase.length]===' ')){exact.push({surah:s.id,verse:v.n});if(exact.length>=12)return{candidates:exact,reason:'Several verses share these words.'};}}
 return {candidates:exact,reason:exact.length?'Choose the verse you meant.':'No confident match. Select your passage and try again.'};
}

// Repeat practice removes only exact complete repetitions; mismatches stay visible.
export function alignPractice(expected,heard,{complete=false,repeat=false,verseRefs=[]}={}){
 const a=Array.isArray(expected)?expected:tokenize(expected),b=Array.isArray(heard)?heard:tokenize(heard);
 let offset=0,repetitions=0;
 let inputWords=b,verseRepetitions=0;
 if(repeat&&verseRefs.length===a.length){
  const groups=[];for(let i=0;i<a.length;){let end=i+1;while(end<a.length&&verseRefs[end]===verseRefs[i])end++;groups.push(a.slice(i,end));i=end;}
  const out=[];let cursor=0;
  for(let g=0;g<groups.length;g++){
   const words=groups[g],sameAt=()=>words.every((w,i)=>b[cursor+i]===w);
   if(!sameAt()){out.push(...b.slice(cursor));cursor=b.length;break;}
   out.push(...b.slice(cursor,cursor+words.length));cursor+=words.length;
   // Shared prefixes are ambiguous: retain them rather than infer a restart.
   const next=groups[g+1],ambiguous=next&&words.every((w,i)=>next[i]===w);
   if(!ambiguous)while(cursor+words.length<=b.length&&sameAt()){cursor+=words.length;verseRepetitions++;}
  }
  out.push(...b.slice(cursor));inputWords=out;
 }

 if(repeat&&a.length){while(inputWords.length-offset>=a.length&&a.every((w,i)=>w===inputWords[offset+i])){repetitions++;offset+=a.length;}}
 const input=offset>0?(offset===inputWords.length?a:inputWords.slice(offset)):inputWords;
 return {...alignWords(a,input,{complete}),repetitions,verseRepetitions};
}
export function hasAudibleSignal(samples,threshold=.001){if(!samples?.length)return false;let sum=0;for(const x of samples){if(!Number.isFinite(x))return false;sum+=x*x;}return Math.sqrt(sum/samples.length)>=threshold;}

// Following is separate from grading: recover only on a run of at least three
// consecutive matches after an uncertain word. Earlier differences remain recorded.
export function trackingPosition(alignment){let position=0,run=[];for(const op of alignment?.ops||[]){if(op.kind!=='match'){run=[];continue;}if(op.index===position){position++;run=[];continue;}if(run.length&&op.index!==run[run.length-1]+1)run=[];run.push(op.index);if(run.length>=3)position=op.index+1;}return position;}
export function trackedWordIndices(alignment){const end=trackingPosition(alignment);return new Set((alignment?.ops||[]).filter(op=>op.kind==='match'&&op.index<end).map(op=>op.index));}

// Separate only the exact introductory formula. Never remove Al-Fatiha 1:1 or At-Tawba text.
export function splitOpening(text,surah,verse){const tokens=String(text).trim().split(/\s+/),formula=['بسم','الله','الرحمن','الرحيم'];if(surah!==1&&surah!==9&&verse===1&&tokens.length>4&&formula.every((w,i)=>normalize(tokens[i])===w))return {opening:tokens.slice(0,4).join(' '),body:tokens.slice(4).join(' ')};return {opening:'',body:text};}
// This cleanup is for passage search only. Recitation checking preserves repetitions and mistakes.
export function cleanVoiceSearch(text){const words=tokenize(text).map(canonicalQuranWord).slice(-64);let changed=true;while(changed){changed=false;for(let size=Math.min(12,Math.floor(words.length/2));size>=1&&!changed;size--)for(let i=0;i+2*size<=words.length;i++)if(words.slice(i,i+size).every((w,k)=>w===words[i+size+k])){words.splice(i,size);changed=true;break;}}return words.join(' ');}
export function mergeSearchFragments(chunks){let words=[];for(const chunk of chunks){const next=tokenize(chunk).map(canonicalQuranWord);if(!next.length)continue;let overlap=Math.min(words.length,next.length);while(overlap>0&&!words.slice(-overlap).every((w,i)=>w===next[i]))overlap--;words.push(...next.slice(overlap));}return cleanVoiceSearch(words.join(' '));}
export function locateVoicePassage(surahs,heard){const cleaned=cleanVoiceSearch(heard),words=tokenize(cleaned);if(words.length<4)return {candidates:[],reason:'Recite at least four recognized words.'};if(cleaned==='بسم الله الرحمن الرحيم')return {candidates:[],reason:'Recite words after opening Bismillah to identify the passage.'};const exact=locatePassage(surahs,cleaned);if(exact.candidates.length)return exact;for(let length=Math.min(8,words.length);length>=4;length--){const found=new Map();for(let start=0;start+length<=words.length;start++){const hit=locatePassage(surahs,words.slice(start,start+length).join(' '));for(const x of hit.candidates)found.set(x.surah+':'+x.verse,x);}if(found.size)return {candidates:[...found.values()].slice(0,12),reason:found.size===1?'One matching verse found.':'Several verses match recognized words. Choose yours.'};}return {candidates:[],reason:'No clear four-word match. Try again or edit what was heard.'};}

// Require sustained sound before allowing automatic completion; quiet starts do not submit silence.
export function advanceSpeechGate(previous,rms,now,pauseMs=4000){const state={...previous};const dt=Math.min(250,Math.max(0,now-(state.time??now)));state.time=now;if(rms>=.012){state.voiceMs=(state.voiceMs||0)+dt;state.lastVoice=now;}if((state.voiceMs||0)>=350&&state.lastVoice!==undefined&&now-state.lastVoice>=pauseMs)state.stop=true;return state;}
// Remove quiet leading/trailing frames but preserve a quarter-second of context at each end.
export function trimQuietAudio(samples,rate){const frame=Math.max(1,Math.round(rate*.02));let first=-1,last=-1;for(let i=0;i<samples.length;i+=frame){let sum=0,n=Math.min(frame,samples.length-i);for(let k=0;k<n;k++)sum+=samples[i+k]*samples[i+k];if(Math.sqrt(sum/n)>.005){if(first<0)first=i;last=i+n;}}if(first<0)return samples.slice();const pad=Math.round(rate*.25);return samples.slice(Math.max(0,first-pad),Math.min(samples.length,last+pad));}

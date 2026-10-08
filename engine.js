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
 const words=tokenize(heard);if(words.length<4)return {candidates:[],reason:'Recite at least four recognized words.'};
 const phrase=words.slice(0,Math.min(8,words.length)).join(' ');let exact=[];
 for(const s of surahs)for(let i=0;i<s.verses.length;i++){const v=s.verses[i],first=tokenize(v.text).map(canonicalQuranWord).join(' ');const joined=s.verses.slice(i,i+4).map(x=>tokenize(x.text).map(canonicalQuranWord).join(' ')).join(' ');const offset=joined.indexOf(phrase);if(offset>=0&&offset<first.length&&(offset===0||joined[offset-1]===' ')){exact.push({surah:s.id,verse:v.n});if(exact.length>=12)return{candidates:exact,reason:'Several verses share these words.'};}}
 return {candidates:exact,reason:exact.length?'Choose the verse you meant.':'No confident match. Select your passage and try again.'};
}

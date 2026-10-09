// Pinned library and converted Quran model. Audio never leaves this worker.
import {pipeline,env} from 'https://cdn.jsdelivr.net/npm/@huggingface/transformers@4.2.0';
env.allowLocalModels=false;
env.backends.onnx.wasm.numThreads=1;
let model=null;
self.onmessage=async e=>{const {id,audio}=e.data;try{if(!model)model=await pipeline('automatic-speech-recognition','Sharjeelbaig/whisper-tiny-ar-quran-onnx',{dtype:'q8',device:'wasm',revision:'cd93bdec117adc2f84d6c4ab91c10164a2e9bee9',progress_callback:p=>self.postMessage({id,progress:{status:p.status,file:p.file,percent:p.progress}})});if(!audio){self.postMessage({id,ready:true});return;}const out=await model(audio,{language:'arabic',task:'transcribe',return_timestamps:false,chunk_length_s:20,stride_length_s:3});self.postMessage({id,text:out.text});}catch(err){self.postMessage({id,error:err.message||'Local recognition failed.'});}};

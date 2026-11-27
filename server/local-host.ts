/// <reference types="node" />
import {readFileSync} from 'node:fs';
import {join} from 'node:path';
import {randomUUID} from 'node:crypto';
import {createHostClient} from '@getpaseo/client/node';
export class LocalHost {
 private pending?:Promise<ReturnType<typeof createHostClient>>;private stopped=false;
 constructor(private home:string){}
 async client(){if(!this.pending)this.pending=(async()=>{const info=JSON.parse(readFileSync(join(this.home,'paseo.pid'),'utf8'));if(typeof info.listen!=='string')throw Error('Local daemon address unavailable');const client=createHostClient(info.listen,{clientId:'folder-routing-'+randomUUID(),clientType:'cli',localCredential:()=>readFileSync(join(this.home,'local-credential'),'utf8').trim(),logger:{debug(){},info(){},warn(){},error(){}}});await client.connect();if(this.stopped){await client.close();throw Error('Plugin closed')}return client;})().catch(error=>{this.pending=undefined;throw error});return this.pending;}
 async close(){this.stopped=true;const client=await this.pending?.catch(()=>null);if(client)await client.close();}
}

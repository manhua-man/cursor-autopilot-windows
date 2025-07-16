export type Handler = (d:any)=>void;
const bus = new Map<string, Handler[]>();
export const pub = (k:string,d:any)=>bus.get(k)?.forEach(h=>h(d));
export const sub = (k:string,h:Handler)=>bus.set(k,(bus.get(k)||[]).concat(h)); 
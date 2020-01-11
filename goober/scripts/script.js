
const Materials = require('Materials');
const R = require('Reactive');
const S = require('Shaders');
const Textures = require('Textures');
const Time = require("Time");

let time = Time.ms;
time = R.mul(time, 0.0004);

function RotCS(p, c, s) {
	return R.pack2( R.mul(p.x,c).add(R.mul(p.y,s)),R.mul(-1.0,p.x).mul(s).add(R.mul(p.y,c)));
}

function hash( p )
{
	let p1 = R.pack2( R.dot(p,R.pack2(127.1,311.7)), R.dot(p,R.pack2(269.5,183.3)) );
	let h = R.add(-1.0,R.mul(2.0,R.mod(R.mul(R.sin(p1),43758.5453123), 1.0)));
	let t = R.mul(time,-0.7);
    let co = R.cos(t); 
    let si = R.sin(t);	
	h = RotCS(h,co,si);
	return h;
}


function noise( p )
{
    const K1 = 0.366025404; 
    const K2 = 0.211324865;

	let i = R.floor( R.add(p,R.add(p.x,p.y).mul(K1)));
    
    let a = R.sub(p,i).add(R.add(i.x,i.y).mul(K2));
    let o = R.add(0.5,R.mul(0.5,R.pack2(R.sign(R.sub(a.x,a.y)), R.sign(R.sub(a.y,a.x)))));
    let b = R.sub(a,o).add(K2);
    let c = R.sub(a,1.0).add(2.0*K2);
    

	let t = R.mul(time,.5);
    let co = R.cos(t); 
    let si = R.sin(t);	
	a = RotCS(a,co,si);
	b = RotCS(b,co,si);
    c = RotCS(c,co,si);

    let h = R.max( R.sub(0.5,R.pack3(R.dot(a,a), R.dot(b,b), R.dot(c,c) )), 0.0 );
    
	let n = R.mul(h,h).mul(h).mul(h).mul(R.pack3( R.dot(a,hash(R.add(i,0.0))), R.dot(b,hash(R.add(i,0.0))), R.dot(c,hash(R.add(i,0.0)))));

    return R.dot( n, R.pack3(70.0,70.0,70.0) );
	
}

function thingy2(pos)
{
    let p = R.add(pos,(R.pack2(R.mul(time,0.4), 0.0)));
	
    let n = noise(p);
    n = R.add(n, R.mul(noise(R.mul(p,2.13)),0.5));
    n = R.add(n, R.mul(noise(R.mul(p,0.333)),3.0));
    
	return n;
}

function thingy1(pos)
{
    let s = 1.5;
    let p = R.mul(pos, s);
	
	let n = thingy2(pos);
	
    let e = 0.1;
	let nx = thingy2(R.mul(pos,R.pack2(e,0.0)));
    let ny = thingy2(R.mul(pos,R.pack2(0.0,e)));
	
	return R.pack2(R.mul(-1.0,R.add(ny,n)),R.sub(nx,n)).div(e);
}


let uv = S.fragmentStage(S.vertexAttribute({'variableName': S.VertexAttribute.TEX_COORDS}));
const randomTex = Textures.get("faceTracker0").signal;

for (let i=0; i<2; i++)
{
    let new_uv = R.mul(thingy1(uv),0.00625 * 0.4);
    uv = R.add(uv,new_uv);
}
let c = S.textureSampler(randomTex, uv);
let zero = R.pack3(0.,0.,0.);
let bg = R.min(R.magnitude(c),1.0);

c = c.sub(0.5).mul(1.7).add(0.5);

let color = R.pack4(c.x,c.y,c.z,bg);
Materials.get('material0').setTexture(color, {textureSlotName: "diffuseTexture"});
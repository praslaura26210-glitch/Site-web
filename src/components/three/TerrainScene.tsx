'use client';
import { useFrame, useThree } from '@react-three/fiber';
import { useMemo, useRef } from 'react';
import * as THREE from 'three';
import { live } from '@/lib/store';

const NOISE = /* glsl */ `
vec3 mod289(vec3 x){return x-floor(x*(1./289.))*289.;}
vec2 mod289(vec2 x){return x-floor(x*(1./289.))*289.;}
vec3 permute(vec3 x){return mod289(((x*34.)+1.)*x);}
float snoise(vec2 v){
  const vec4 C=vec4(.211324865405187,.366025403784439,-.577350269189626,.024390243902439);
  vec2 i=floor(v+dot(v,C.yy)); vec2 x0=v-i+dot(i,C.xx);
  vec2 i1=(x0.x>x0.y)?vec2(1.,0.):vec2(0.,1.);
  vec4 x12=x0.xyxy+C.xxzz; x12.xy-=i1; i=mod289(i);
  vec3 p=permute(permute(i.y+vec3(0.,i1.y,1.))+i.x+vec3(0.,i1.x,1.));
  vec3 m=max(.5-vec3(dot(x0,x0),dot(x12.xy,x12.xy),dot(x12.zw,x12.zw)),0.); m=m*m; m=m*m;
  vec3 x=2.*fract(p*C.www)-1.; vec3 h=abs(x)-.5; vec3 ox=floor(x+.5); vec3 a0=x-ox;
  m*=1.79284291400159-.85373472095314*(a0*a0+h*h);
  vec3 g; g.x=a0.x*x0.x+h.x*x0.y; g.yz=a0.yz*x12.xz+h.yz*x12.yw; return 130.*dot(m,g);
}
// relief : des collines (fbm) creusées par une vallée sinueuse, comme le sillon du Rhône
float height(vec2 p){
  float h=0., a=.55, f=.32;
  for(int i=0;i<5;i++){ h+=a*snoise(p*f+vec2(3.1,7.7)); f*=2.03; a*=.48; }
  float river = p.x*0.18 + sin(p.y*0.42)*1.1 + sin(p.y*0.17+1.3)*0.8;
  float valley = 1. - exp(-river*river*1.6);
  return (h*.75+.35)*valley*1.15 - (1.-valley)*.18;
}
`;

/**
 * Terrain de l'accueil : un relief en terre crue dessiné par ses lignes de niveau
 * (une ligne maîtresse toutes les cinq, comme sur une carte). Une lumière rasante chaude
 * suit la souris et éclaire une tache plus vive là où pointe le curseur.
 */
export default function TerrainScene({ intro }: { intro: boolean }) {
  const { camera } = useThree();
  const mesh = useRef<THREE.Mesh>(null!);
  const mat = useMemo(
    () =>
      new THREE.ShaderMaterial({
        transparent: true,
        extensions: { derivatives: true } as any,
        uniforms: {
          uTime: { value: 0 },
          uFade: { value: 0 },
          uLight: { value: new THREE.Vector3(-0.6, 0.35, 0.4).normalize() },
          uMouse: { value: new THREE.Vector2(0, 0) },
          uPaper: { value: new THREE.Color('#F2ECE2') },
          uEarth: { value: new THREE.Color('#E3D3BE') },
          uInk: { value: new THREE.Color('#6B5A4E') },
          uOcre: { value: new THREE.Color('#C08A3E') },
          uCuite: { value: new THREE.Color('#A46B57') },
        },
        vertexShader: /* glsl */ `
          ${NOISE}
          varying float vH; varying vec3 vN; varying vec2 vP; varying float vDist;
          void main(){
            vec2 p = position.xy;
            float h = height(p);
            float e = .04;
            float hx = height(p+vec2(e,0.)), hy = height(p+vec2(0.,e));
            vN = normalize(vec3(-(hx-h)/e, 1., -(hy-h)/e));
            vH = h; vP = p;
            vec3 pos = vec3(p.x, h*.55, -p.y);
            vec4 mv = modelViewMatrix * vec4(pos,1.);
            vDist = length(p);
            gl_Position = projectionMatrix * mv;
          }`,
        fragmentShader: /* glsl */ `
          uniform vec3 uLight, uPaper, uEarth, uInk, uOcre, uCuite; uniform vec2 uMouse; uniform float uFade;
          varying float vH; varying vec3 vN; varying vec2 vP; varying float vDist;
          float iso(float v, float w){ float f = abs(fract(v)-.5); float d = fwidth(v); return smoothstep(.5-d*w, .5, f); }
          void main(){
            float lam = clamp(dot(normalize(vN), normalize(uLight)), 0., 1.);
            float shade = mix(.82, 1.06, pow(lam, .8));
            vec3 col = mix(uPaper, uEarth, smoothstep(-.2, .9, vH)) * shade;
            // tache de lumière sous la souris
            float m = exp(-dot(vP-uMouse, vP-uMouse)*.55);
            col = mix(col, col*1.04 + uOcre*.10, m);
            // lignes de niveau : fines tous les 0,07, maîtresses toutes les 5
            float lv = vH*14.;
            float minor = iso(lv, 1.1);
            float major = iso(lv/5., 1.6);
            vec3 ink = mix(uInk, uCuite, m*.7);
            col = mix(col, ink, minor*.38 + major*.42);
            // les bords se fondent dans le papier
            float edge = smoothstep(7.2, 3.8, vDist);
            gl_FragColor = vec4(mix(uPaper, col, edge), edge*uFade);
            #include <colorspace_fragment>
          }`,
      }),
    [],
  );

  const ray = useMemo(() => new THREE.Raycaster(), []);
  const plane = useMemo(() => new THREE.Plane(new THREE.Vector3(0, 1, 0), 0.9), []);
  const hit = useMemo(() => new THREE.Vector3(), []);
  const target = useMemo(() => new THREE.Vector3(), []);
  const rest = useMemo(() => new THREE.Vector3(0, 1.55, 4.6), []);
  const ptr = useMemo(() => new THREE.Vector2(), []);

  useFrame((state, dt) => {
    const u = mat.uniforms;
    u.uTime.value += dt;
    u.uFade.value = intro ? Math.min(1, Math.max(0, (live.intro - 0.72) / 0.22)) : Math.min(1, u.uFade.value + dt * 1.2);
    // lumière rasante : son azimut suit la souris
    const az = -0.9 + live.pointer.x * 1.1;
    const el = 0.32 + live.pointer.y * 0.12;
    target.set(Math.cos(az) * Math.cos(el), Math.sin(el), Math.sin(az) * Math.cos(el));
    (u.uLight.value as THREE.Vector3).lerp(target, 1 - Math.pow(0.04, dt));
    // point visé sur le terrain
    ptr.set(live.pointer.x, live.pointer.y);
    ray.setFromCamera(ptr, camera);
    if (ray.ray.intersectPlane(plane, hit)) {
      const mm = u.uMouse.value as THREE.Vector2;
      mm.lerp(new THREE.Vector2(hit.x, -(hit.z + 0) ), 1 - Math.pow(0.02, dt));
    }
    if (!intro) {
      // caméra : légère dérive, suit un peu la souris
      const k = 1 - Math.pow(0.08, dt);
      const tx = rest.x + live.pointer.x * 0.35;
      const ty = rest.y + live.pointer.y * 0.12;
      camera.position.x += (tx - camera.position.x) * k;
      camera.position.y += (ty - camera.position.y) * k;
      camera.position.z += (rest.z - camera.position.z) * k;
      camera.lookAt(0, -1.0, -0.6);
    }
  });

  return (
    <mesh ref={mesh} material={mat} position={[0, -1.25, 0]} frustumCulled={false}>
      <planeGeometry args={[16, 16, 280, 280]} />
    </mesh>
  );
}

import { useEffect, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { useGLTF } from '@react-three/drei'
import * as THREE from 'three'

const MODEL_URL = `${import.meta.env.BASE_URL}models/lezhi/avatar.glb`
useGLTF.preload(MODEL_URL)

// Larger, bounded gestures for short-video demos; keep the shoulders anchored.
const FOLLOW = { gain: 1.4, yaw: .52, pitch: .27, damping: 11 }

// The supplied GLB is a single unrigged mesh. Coordinates below are calibrated
// against its normalized geometry, not screen-space overlays. Keep the GLB intact.
const declarations = `
  uniform vec2 uLook;
  uniform vec2 uHead;
  uniform float uBlink;
  uniform float uSmile;
  uniform float uBreath;
  varying vec3 vPortraitRest;
  mat3 portraitRotation(float yaw, float pitch) {
    float cy=cos(yaw), sy=sin(yaw), cx=cos(pitch), sx=sin(pitch);
    return mat3(cy,0.,-sy, 0.,1.,0., sy,0.,cy) * mat3(1.,0.,0., 0.,cx,sx, 0.,-sx,cx);
  }
`

const eyePaint = `
  float roundedEye(vec2 p, vec2 halfSize, float radius) {
    vec2 q=abs(p)-halfSize+radius;
    return length(max(q,0.))+min(max(q.x,q.y),0.)-radius;
  }
  vec4 portraitEye(vec3 rest) {
    // Only the front eye sockets: do not paint through to hair, ears or hat.
    float front=smoothstep(.024,.036,rest.z)*(1.-smoothstep(.063,.075,rest.z));
    vec2 p=vec2(abs(rest.x)-.058,rest.y-.728);
    float region=1.-smoothstep(-.0006,.0012,roundedEye(p,vec2(.033,.017),.004));
    float opening=max(.00015,.0135*(1.-uBlink));
    float eye=1.-smoothstep(-.0006,.0006,roundedEye(p,vec2(.030,opening),min(.003,opening)));
    vec3 skin=vec3(.91,.46,.27);
    vec3 sclera=vec3(.88,.89,.84);
    vec2 look=uLook*vec2(.017,.006);
    // abs(x) mirrors the sockets, so mirror the horizontal gaze for the left eye.
    look.x*=sign(rest.x);
    vec2 irisPoint=(p-look)/vec2(.0105,.0125);
    float iris=1.-smoothstep(.88,1.,length(irisPoint));
    float pupil=1.-smoothstep(.43,.60,length(irisPoint));
    vec3 irisColor=mix(vec3(.025,.051,.07),vec3(.003,.006,.012),pupil);
    float glint=1.-smoothstep(.08,.22,length(irisPoint-vec2(-.25,.35)));
    irisColor=mix(irisColor,vec3(.94,.97,1.),glint*.8);
    vec3 color=mix(skin,mix(sclera,irisColor,iris),eye);
    float crease=(1.-smoothstep(.0004,.0014,abs(p.y)))*uBlink;
    color=mix(color,vec3(.27,.12,.055),crease*.65);
    return vec4(color,region*front);
  }
`

function makeMaterial(material: THREE.MeshStandardMaterial, uniforms: Record<string, { value: number | THREE.Vector2 }>) {
  const copy = material.clone()
  copy.onBeforeCompile = shader => {
    Object.assign(shader.uniforms, uniforms)
    shader.vertexShader = declarations + shader.vertexShader
    shader.vertexShader = shader.vertexShader.replace('#include <beginnormal_vertex>', `
      #include <beginnormal_vertex>
      float neckWeight=smoothstep(.40,.57,position.y);
      objectNormal=portraitRotation(uHead.x*neckWeight,uHead.y*neckWeight)*objectNormal;
    `).replace('#include <begin_vertex>', `
      #include <begin_vertex>
      vPortraitRest=position;
      float faceFront=smoothstep(.0,.04,position.z)*(1.-smoothstep(.12,.18,position.z));
      float eyebrow=exp(-pow((position.y-.766)/.015,2.))*exp(-pow((abs(position.x)-.06)/.045,4.))*faceFront;
      transformed.y+=eyebrow*uSmile*.005;
      float cheek=exp(-pow((position.y-.585)/.045,2.))*exp(-pow((abs(position.x)-.075)/.04,2.))*faceFront;
      transformed.y+=cheek*uSmile*.005;
      vec3 neck=vec3(0.,.50,-.015);
      transformed=portraitRotation(uHead.x*neckWeight,uHead.y*neckWeight)*(transformed-neck)+neck;
      transformed.y+=uBreath*smoothstep(.0,.45,position.y);
    `)
    shader.fragmentShader = declarations + eyePaint + shader.fragmentShader
    shader.fragmentShader = shader.fragmentShader.replace('#include <map_fragment>', `
      #include <map_fragment>
      vec4 animatedEye=portraitEye(vPortraitRest);
      diffuseColor.rgb=mix(diffuseColor.rgb,animatedEye.rgb,animatedEye.a);
    `).replace('#include <emissivemap_fragment>', `
      #include <emissivemap_fragment>
      totalEmissiveRadiance*=1.-animatedEye.a;
    `)
  }
  copy.customProgramCacheKey = () => 'van-gogh-portrait-v1'
  return copy
}

export default function InteractivePortrait() {
  const { scene } = useGLTF(MODEL_URL)
  const uniforms = useMemo(() => ({
    uLook: { value: new THREE.Vector2() },
    uHead: { value: new THREE.Vector2() },
    uBlink: { value: 0 }, uSmile: { value: 0 }, uBreath: { value: 0 },
  }), [])
  const model = useMemo(() => {
    scene.updateMatrixWorld(true)
    const box = new THREE.Box3().setFromObject(scene)
    const scale = 1 / box.getSize(new THREE.Vector3()).y
    const center = box.getCenter(new THREE.Vector3())
    const normalization = new THREE.Matrix4().makeScale(scale, scale, scale)
    normalization.setPosition(-center.x * scale, -box.min.y * scale, -center.z * scale)
    const group = new THREE.Group()
    scene.traverse(object => {
      if (!(object instanceof THREE.Mesh)) return
      const geometry = object.geometry.clone().applyMatrix4(object.matrixWorld).applyMatrix4(normalization)
      const materials = Array.isArray(object.material) ? object.material : [object.material]
      const animatedMaterials = materials.map(m => makeMaterial(m as THREE.MeshStandardMaterial, uniforms))
      const mesh = new THREE.Mesh(geometry, Array.isArray(object.material) ? animatedMaterials : animatedMaterials[0])
      // The portrait has no receiving shadow plane; avoid a mismatched static shadow pass.
      mesh.frustumCulled = false
      group.add(mesh)
    })
    return group
  }, [scene, uniforms])
  useEffect(() => () => {
    model.traverse(object => {
      if (!(object instanceof THREE.Mesh)) return
      object.geometry.dispose()
      const materials = Array.isArray(object.material) ? object.material : [object.material]
      materials.forEach(material => material.dispose())
    })
  }, [model])

  const motion = useRef({ pointer: new THREE.Vector2(), lastPointer: -100, enabled: true,
    nextBlink: 2.4, blinkStart: -100, reactionStart: -100, elapsed: 0 })
  useEffect(() => {
    const state = motion.current
    const preference = window.matchMedia('(prefers-reduced-motion: reduce)')
    const syncPreference = () => { state.enabled = !preference.matches }
    syncPreference()
    const move = (event: PointerEvent) => {
      state.pointer.set(event.clientX / window.innerWidth * 2 - 1, 1 - event.clientY / window.innerHeight * 2)
      state.lastPointer = state.elapsed
    }
    const leave = () => { state.lastPointer = -100 }
    const greet = () => {
      if (!state.enabled) return
      state.reactionStart = state.elapsed
      state.blinkStart = state.elapsed
      state.nextBlink = state.elapsed + 3.5
    }
    // A short tap on the visible portrait is a greeting; scrolling never triggers it.
    let down: { x: number; y: number; time: number } | null = null
    const press = (event: PointerEvent) => { down = { x: event.clientX, y: event.clientY, time: performance.now() } }
    const release = (event: PointerEvent) => {
      const start = down
      down = null
      if (!start || Math.hypot(event.clientX-start.x,event.clientY-start.y)>12 || performance.now()-start.time>600) return
      if ((event.target as HTMLElement).closest('button,a,input') || window.scrollY > window.innerHeight * .3) return
      const x=event.clientX/window.innerWidth, y=event.clientY/window.innerHeight
      if (x>.32 && x<.68 && y>.14 && y<.57) greet()
    }
    preference.addEventListener('change', syncPreference)
    window.addEventListener('pointermove', move, { passive: true })
    window.addEventListener('pointerdown', press, { passive: true })
    window.addEventListener('pointerup', release, { passive: true })
    document.documentElement.addEventListener('pointerleave', leave)
    return () => {
      preference.removeEventListener('change', syncPreference)
      window.removeEventListener('pointermove', move)
      window.removeEventListener('pointerdown', press)
      window.removeEventListener('pointerup', release)
      document.documentElement.removeEventListener('pointerleave', leave)
    }
  }, [])

  useFrame((_, delta) => {
    const state = motion.current
    // Pause the local clock in background tabs instead of jumping through a gesture.
    const dt = Math.min(delta, .05)
    if (document.hidden) return
    state.elapsed += dt
    const t = state.elapsed
    const damp = 1 - Math.exp(-FOLLOW.damping * dt)
    const active = state.enabled && window.scrollY < window.innerHeight * 5.5
    // Hold eye contact while the pointer stays on the page, including recording pauses.
    const attention = active && state.lastPointer >= 0
    const x = attention ? THREE.MathUtils.clamp(state.pointer.x * FOLLOW.gain, -1, 1) : 0
    const y = attention ? THREE.MathUtils.clamp(state.pointer.y * FOLLOW.gain, -1, 1) : 0
    if (active && t > state.nextBlink) {
      state.blinkStart = t
      state.nextBlink = t + 2.8 + Math.random() * 3.2
    }
    const blinkTime = t - state.blinkStart
    const blink = blinkTime < .075 ? THREE.MathUtils.smoothstep(blinkTime,0,.075)
      : 1-THREE.MathUtils.smoothstep(blinkTime,.075,.22)
    const reactionTime = t-state.reactionStart
    const reaction = reactionTime < 2 ? Math.sin(Math.PI * reactionTime / 2) : 0
    const nod = reaction * Math.sin(reactionTime * Math.PI * 2) * .065
    uniforms.uLook.value.x = THREE.MathUtils.lerp(uniforms.uLook.value.x,x,damp)
    uniforms.uLook.value.y = THREE.MathUtils.lerp(uniforms.uLook.value.y,y,damp)
    const yaw = active ? x*FOLLOW.yaw + Math.sin(t*.65)*.009 : 0
    const pitch = active ? -y*FOLLOW.pitch + Math.sin(t*.8)*.007 + nod : 0
    uniforms.uHead.value.x = THREE.MathUtils.lerp(uniforms.uHead.value.x,yaw,damp*.65)
    uniforms.uHead.value.y = THREE.MathUtils.lerp(uniforms.uHead.value.y,pitch,damp*.65)
    uniforms.uBlink.value = active ? blink : 0
    uniforms.uSmile.value = active ? reaction : 0
    uniforms.uBreath.value = active ? Math.sin(t*1.6)*.0015 : 0
  })
  return <primitive object={model} dispose={null} />
}

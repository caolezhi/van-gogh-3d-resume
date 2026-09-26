import { useEffect, useLayoutEffect, useMemo, useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { useTexture } from '@react-three/drei'
import { Bloom, EffectComposer, SMAA } from '@react-three/postprocessing'
import * as THREE from 'three'
import { FOCUS_POINTS } from '../data/focusPoints'
import Env from './Env'
import InteractivePortrait from './InteractivePortrait'


function Backdrop() {
  const texture = useTexture(`${import.meta.env.BASE_URL}images/lezhi/backgrounds/starry-night.png`)
  const { size } = useThree()
  useLayoutEffect(() => {
    texture.colorSpace = THREE.SRGBColorSpace
    // Cover the viewport without stretching; preserve a centered mobile crop.
    const imageAspect = texture.image.width / texture.image.height
    const viewportAspect = size.width / size.height
    const x = Math.min(1, viewportAspect / imageAspect)
    const y = Math.min(1, imageAspect / viewportAspect)
    texture.repeat.set(x, y)
    texture.offset.set((1 - x) / 2, (1 - y) / 2)
    texture.needsUpdate = true
  }, [texture, size.width, size.height])
  return <primitive object={texture} attach="background" />
}

// Each résumé entry is a camera stop, retaining the original scroll-to-focus
// interaction without depending on the original author's CameraAction rig.
const SHOTS = [
  { eye: [0.22, 0.55, 2.6], target: [0, 0.25, 0] },
  { eye: [0.65, 0.7, 1.45], target: [0.27, 0.57, 0] },
  { eye: [-0.15, 0.65, 1.4], target: [0.26, 0.56, 0] },
  { eye: [0.5, 0.48, 1.24], target: [0.27, 0.4, 0] },
  { eye: [0.13, 0.66, 1.4], target: [0.28, 0.55, 0] },
  { eye: [-0.1, 0.57, 1.65], target: [0.27, 0.42, 0] },
].map(s => ({ eye: new THREE.Vector3(...s.eye), target: new THREE.Vector3(...s.target) }))

function CameraTour() {
  const { camera, size } = useThree()
  const pointer = useRef({ x: 0, y: 0 })
  const cursor = useRef(0)
  const target = useRef(SHOTS[0].target.clone())
  const eye = useMemo(() => new THREE.Vector3(), [])
  const aim = useMemo(() => new THREE.Vector3(), [])
  const reducedMotion = useRef(window.matchMedia('(prefers-reduced-motion: reduce)').matches)
  useEffect(() => {
    const move = (e: PointerEvent) => {
      pointer.current = { x: e.clientX / window.innerWidth - 0.5, y: e.clientY / window.innerHeight - 0.5 }
    }
    window.addEventListener('pointermove', move)
    return () => window.removeEventListener('pointermove', move)
  }, [])
  useFrame((_, dt) => {
    const tops = FOCUS_POINTS.map(id => {
      const element = document.querySelector(`[data-point="${id}"]`)
      return element ? element.getBoundingClientRect().top + window.scrollY - size.height * 0.3 : Infinity
    })
    const stops = [0, ...tops]
    let progress = stops.length - 1
    for (let i = 0; i < stops.length - 1; i++) {
      if (window.scrollY < stops[i + 1]) {
        const t = THREE.MathUtils.clamp((window.scrollY - stops[i]) / Math.max(1, stops[i + 1] - stops[i]), 0, 1)
        progress = i + THREE.MathUtils.smoothstep(t, 0.15, 0.85)
        break
      }
    }
    const alpha = reducedMotion.current ? 1 : 1 - Math.exp(-4.5 * dt)
    cursor.current = THREE.MathUtils.lerp(cursor.current, progress, alpha)
    const a = Math.floor(cursor.current)
    const b = Math.min(a + 1, SHOTS.length - 1)
    eye.lerpVectors(SHOTS[a].eye, SHOTS[b].eye, cursor.current - a)
    aim.lerpVectors(SHOTS[a].target, SHOTS[b].target, cursor.current - a)
    if (size.width < 640) {
      aim.x *= 0.2
      eye.x *= 0.35
      eye.z *= 1.18
    } else if (!reducedMotion.current) {
      eye.x += pointer.current.x * 0.06
      eye.y -= pointer.current.y * 0.035
    }
    camera.position.lerp(eye, alpha)
    target.current.lerp(aim, alpha)
    camera.lookAt(target.current)
  })
  return null
}

export default function PersonalScene() {
  return (
    <>
      <Backdrop />
      <Env intensity={0.65} rotationX={0} rotationY={0} rotationZ={0}
        asBackground={false} bgIntensity={0.4} bgBlur={0} />
      <hemisphereLight args={['#e6f1ff', '#233e73', 1.5]} />
      <directionalLight position={[3, 5, 4]} intensity={2.1} color="#ffe2cd" />
      <directionalLight position={[-3, 2, -2]} intensity={1.4} color="#c3d9ff" />
      <InteractivePortrait />
      <CameraTour />
      <EffectComposer multisampling={0}>
        <Bloom intensity={0.25} luminanceThreshold={1} mipmapBlur />
        <SMAA />
      </EffectComposer>
    </>
  )
}

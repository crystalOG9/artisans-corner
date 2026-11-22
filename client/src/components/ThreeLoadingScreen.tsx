import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';

interface ThreeLoadingScreenProps {
  onComplete?: () => void;
  minDurationMs?: number;
}

export function ThreeLoadingScreen({
  onComplete,
  minDurationMs = 2400,
}: ThreeLoadingScreenProps) {
  const mountRef = useRef<HTMLDivElement>(null);
  const [progress, setProgress] = useState(0);
  const [phaseText, setPhaseText] = useState('Centering the clay...');
  const [isFadingOut, setIsFadingOut] = useState(false);
  const [isDone, setIsDone] = useState(() => {
    try {
      if (typeof window === 'undefined') return false;
      const alreadySeen = sessionStorage.getItem('artisan_loader_seen') === 'true';
      const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      return alreadySeen || prefersReduced;
    } catch {
      return false;
    }
  });

  useEffect(() => {
    if (isDone) {
      onComplete?.();
      return;
    }

    const container = mountRef.current;
    if (!container) return;

    const width = container.clientWidth || window.innerWidth || 800;
    const height = container.clientHeight || 450;

    // 1. Scene setup
    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x131110, 0.12);

    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
    camera.position.set(0, 1.8, 6.2);
    camera.lookAt(0, 1.1, 0);

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
      renderer.setSize(width, height);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      renderer.shadowMap.enabled = true;
      container.appendChild(renderer.domElement);
    } catch {
      // Graceful WebGL fallback: mark complete immediately without blocking UI
      sessionStorage.setItem('artisan_loader_seen', 'true');
      setIsDone(true);
      onComplete?.();
      return;
    }

    // 2. Lighting
    const ambientLight = new THREE.AmbientLight(0xfff5ea, 0.85);
    scene.add(ambientLight);

    const keyLight = new THREE.DirectionalLight(0xffedd5, 2.2);
    keyLight.position.set(4, 5, 4);
    scene.add(keyLight);

    const rimLight = new THREE.DirectionalLight(0xd97757, 1.5);
    rimLight.position.set(-4, 3, -3);
    scene.add(rimLight);

    const warmFill = new THREE.PointLight(0xf59e0b, 1.2, 8);
    warmFill.position.set(0, 0.3, 2);
    scene.add(warmFill);

    // 3. Artisanal Potter's Turntable Group
    const craftGroup = new THREE.Group();
    scene.add(craftGroup);

    // Turntable wheel base
    const wheelGeo = new THREE.CylinderGeometry(1.6, 1.75, 0.22, 54);
    const wheelMat = new THREE.MeshStandardMaterial({
      color: 0x24201d,
      roughness: 0.8,
      metalness: 0.2,
    });
    const wheelMesh = new THREE.Mesh(wheelGeo, wheelMat);
    wheelMesh.position.y = -0.11;
    craftGroup.add(wheelMesh);

    // Decorative brass inlay ring on wheel
    const ringGeo = new THREE.TorusGeometry(1.4, 0.02, 16, 64);
    const ringMat = new THREE.MeshStandardMaterial({
      color: 0xd4a373,
      metalness: 0.85,
      roughness: 0.25,
    });
    const ringMesh = new THREE.Mesh(ringGeo, ringMat);
    ringMesh.rotation.x = Math.PI / 2;
    ringMesh.position.y = 0.01;
    craftGroup.add(ringMesh);

    // Ceramic Stoneware Vessel Geometry (Lathe curve)
    const points: THREE.Vector2[] = [];
    points.push(new THREE.Vector2(0, 0));
    points.push(new THREE.Vector2(0.65, 0));
    points.push(new THREE.Vector2(0.9, 0.25));
    points.push(new THREE.Vector2(1.22, 0.65));
    points.push(new THREE.Vector2(1.3, 1.1));
    points.push(new THREE.Vector2(1.15, 1.5));
    points.push(new THREE.Vector2(0.72, 1.95));
    points.push(new THREE.Vector2(0.68, 2.25));
    points.push(new THREE.Vector2(0.85, 2.5));
    points.push(new THREE.Vector2(0.82, 2.58));
    points.push(new THREE.Vector2(0.7, 2.56));
    points.push(new THREE.Vector2(0.55, 2.3));
    points.push(new THREE.Vector2(0.58, 2.0));
    points.push(new THREE.Vector2(0.95, 1.4));
    points.push(new THREE.Vector2(0.98, 1.0));
    points.push(new THREE.Vector2(0.75, 0.3));
    points.push(new THREE.Vector2(0, 0.1));

    const vaseGeo = new THREE.LatheGeometry(points, 48);
    const vaseMat = new THREE.MeshStandardMaterial({
      color: 0xc86d51, // Signature terracotta
      roughness: 0.48,
      metalness: 0.08,
      bumpScale: 0.04,
    });
    const vaseMesh = new THREE.Mesh(vaseGeo, vaseMat);
    craftGroup.add(vaseMesh);

    // Clay Glaze Accent Ring
    const glazeRingGeo = new THREE.TorusGeometry(0.72, 0.03, 16, 48);
    const glazeRingMat = new THREE.MeshStandardMaterial({
      color: 0xfaf5ef,
      roughness: 0.2,
      metalness: 0.1,
    });
    const glazeRingMesh = new THREE.Mesh(glazeRingGeo, glazeRingMat);
    glazeRingMesh.rotation.x = Math.PI / 2;
    glazeRingMesh.position.y = 2.15;
    craftGroup.add(glazeRingMesh);

    // 4. Floating Warm Ember / Clay Dust Particles
    const particleCount = 140;
    const particleGeo = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    const velocities = new Float32Array(particleCount * 3);

    for (let i = 0; i < particleCount; i++) {
      const radius = 1.2 + Math.random() * 2.2;
      const angle = Math.random() * Math.PI * 2;
      const y = -0.2 + Math.random() * 3.2;

      positions[i * 3] = Math.cos(angle) * radius;
      positions[i * 3 + 1] = y;
      positions[i * 3 + 2] = Math.sin(angle) * radius;

      velocities[i * 3] = (Math.random() - 0.5) * 0.004;
      velocities[i * 3 + 1] = 0.003 + Math.random() * 0.006;
      velocities[i * 3 + 2] = (Math.random() - 0.5) * 0.004;
    }

    particleGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));

    const particleMat = new THREE.PointsMaterial({
      color: 0xe6a875,
      size: 0.045,
      transparent: true,
      opacity: 0.75,
      blending: THREE.AdditiveBlending,
    });
    const particles = new THREE.Points(particleGeo, particleMat);
    scene.add(particles);

    // 5. Mouse Parallax Reaction
    let targetRotationX = 0;
    let targetRotationY = 0;

    const handlePointerMove = (e: PointerEvent) => {
      const nx = (e.clientX / window.innerWidth) * 2 - 1;
      const ny = (e.clientY / window.innerHeight) * 2 - 1;
      targetRotationY = nx * 0.4;
      targetRotationX = ny * 0.15;
    };
    window.addEventListener('pointermove', handlePointerMove);

    // 6. Animation Loop
    let animId = 0;
    let clock = new THREE.Clock();

    const animate = () => {
      animId = requestAnimationFrame(animate);
      const delta = clock.getDelta();

      // Spin turntable and ceramic vessel smoothly
      craftGroup.rotation.y += delta * 1.35;
      craftGroup.rotation.x += (targetRotationX - craftGroup.rotation.x) * 0.05;

      // Particle float & spiral
      const posAttr = particleGeo.attributes.position as THREE.BufferAttribute;
      const posArr = posAttr.array as Float32Array;

      for (let i = 0; i < particleCount; i++) {
        posArr[i * 3 + 1] += velocities[i * 3 + 1];
        if (posArr[i * 3 + 1] > 3.6) {
          posArr[i * 3 + 1] = -0.1;
        }
      }
      posAttr.needsUpdate = true;
      particles.rotation.y += delta * 0.2;

      renderer.render(scene, camera);
    };
    animate();

    // 7. Resize handling
    const handleResize = () => {
      if (!container) return;
      const w = container.clientWidth || window.innerWidth;
      const h = container.clientHeight || window.innerHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', handleResize);

    // 8. Progress Counter & Phased Messaging
    const startTime = performance.now();
    const interval = setInterval(() => {
      const elapsed = performance.now() - startTime;
      const pct = Math.min(100, Math.floor((elapsed / minDurationMs) * 100));
      setProgress(pct);

      if (pct < 32) {
        setPhaseText('Centering the clay...');
      } else if (pct < 65) {
        setPhaseText('Wheel-throwing raw stoneware...');
      } else if (pct < 92) {
        setPhaseText('Gathering independent workshops...');
      } else {
        setPhaseText('Every object carries the human hand.');
      }

      if (pct >= 100) {
        clearInterval(interval);
        setTimeout(() => {
          setIsFadingOut(true);
          sessionStorage.setItem('artisan_loader_seen', 'true');
          setTimeout(() => {
            setIsDone(true);
            onComplete?.();
          }, 650);
        }, 250);
      }
    }, 30);

    return () => {
      clearInterval(interval);
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animId);
      if (renderer.domElement.parentElement) {
        renderer.domElement.parentElement.removeChild(renderer.domElement);
      }
      renderer.dispose();
      wheelGeo.dispose();
      wheelMat.dispose();
      ringGeo.dispose();
      ringMat.dispose();
      vaseGeo.dispose();
      vaseMat.dispose();
      glazeRingGeo.dispose();
      glazeRingMat.dispose();
      particleGeo.dispose();
      particleMat.dispose();
    };
  }, [minDurationMs, onComplete]);

  if (isDone) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      aria-label="Loading Artisan's Corner"
      className={`fixed inset-0 z-[9999] flex flex-col items-center justify-between bg-[#141210] text-[#f7f3ee] select-none transition-all duration-700 ease-out ${
        isFadingOut ? 'opacity-0 pointer-events-none scale-102' : 'opacity-100'
      }`}
    >
      {/* Top Brand Banner */}
      <div className="w-full max-w-5xl px-6 pt-8 flex items-center justify-between text-xs font-mono uppercase tracking-[0.2em] text-[#a89f91]">
        <div className="flex items-center gap-2">
          <span className="h-1.5 w-1.5 rounded-full bg-terracotta animate-pulse" />
          <span>Artisan&apos;s Corner</span>
        </div>
        <button
          type="button"
          onClick={() => {
            setIsFadingOut(true);
            sessionStorage.setItem('artisan_loader_seen', 'true');
            setTimeout(() => {
              setIsDone(true);
              onComplete?.();
            }, 300);
          }}
          className="text-[11px] text-[#8e8577] hover:text-[#f7f3ee] tracking-widest uppercase transition-colors px-2 py-1 cursor-pointer"
        >
          Skip Intro
        </button>
      </div>

      {/* 3D Three.js Pottery Canvas */}
      <div
        ref={mountRef}
        className="relative w-full h-[52vh] sm:h-[58vh] max-w-3xl flex items-center justify-center pointer-events-none"
      />

      {/* Bottom Progress & Phased Studio Tagline */}
      <div className="w-full max-w-md px-6 pb-12 flex flex-col items-center text-center">
        {/* Animated Percentage Ticker */}
        <div className="flex items-baseline gap-1 font-serif text-3xl sm:text-4xl font-light text-terracotta tracking-tight">
          <span>{progress}</span>
          <span className="text-lg text-[#8e8577] font-mono">%</span>
        </div>

        {/* Minimal Progress Bar */}
        <div className="mt-4 w-48 h-0.5 bg-[#2c2825] rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-terracotta to-[#f59e0b] transition-all duration-75 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>

        {/* Phased Craft Status */}
        <p className="mt-4 text-xs font-mono uppercase tracking-[0.18em] text-[#c4b9a9] min-h-[1.5rem]">
          {phaseText}
        </p>

        <p className="mt-1 text-[11px] font-handwriting text-terracotta/90 text-base">
          wheel-thrown • bench-built • hand-loomed
        </p>
      </div>
    </div>
  );
}

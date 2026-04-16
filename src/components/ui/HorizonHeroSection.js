import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass';
import { Link } from 'react-router-dom';
import './HorizonHeroSection.css';

gsap.registerPlugin(ScrollTrigger);

const HorizonHeroSection = ({ profileTypes = [] }) => {
  const containerRef = useRef(null);
  const canvasRef = useRef(null);
  const scrollProgressRef = useRef(null);
  const menuRef = useRef(null);

  const smoothCameraPos = useRef({ x: 0, y: 30, z: 300 });
  
  const [scrollProgress, setScrollProgress] = useState(0);
  const [currentSection, setCurrentSection] = useState(0);
  const [isReady, setIsReady] = useState(false);
  
  const sectionsCount = profileTypes.length || 3;
  
  const threeRefs = useRef({
    scene: null,
    camera: null,
    renderer: null,
    composer: null,
    stars: [],
    nebula: null,
    mountains: [],
    animationId: null,
    locations: []
  });

  // Initialize Three.js
  useEffect(() => {
    const initThree = () => {
      const { current: refs } = threeRefs;
      
      refs.scene = new THREE.Scene();
      refs.scene.fog = new THREE.FogExp2(0x000000, 0.00025);

      refs.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 2000);
      refs.camera.position.set(0, 30, 300);

      refs.renderer = new THREE.WebGLRenderer({
        canvas: canvasRef.current,
        antialias: true,
        alpha: true
      });
      refs.renderer.setSize(window.innerWidth, window.innerHeight);
      refs.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      refs.renderer.toneMapping = THREE.ACESFilmicToneMapping;
      refs.renderer.toneMappingExposure = 0.5;

      refs.composer = new EffectComposer(refs.renderer);
      refs.composer.addPass(new RenderPass(refs.scene, refs.camera));
      refs.composer.addPass(new UnrealBloomPass(new THREE.Vector2(window.innerWidth, window.innerHeight), 0.8, 0.4, 0.85));

      createStarField();
      createNebula();
      createMountains();
      createAtmosphere();
      
      animate();
      setIsReady(true);
    };

    const createStarField = () => {
      const { current: refs } = threeRefs;
      for (let i = 0; i < 3; i++) {
        const geometry = new THREE.BufferGeometry();
        const count = 5000;
        const pos = new Float32Array(count * 3);
        const cols = new Float32Array(count * 3);
        const sizes = new Float32Array(count);

        for (let j = 0; j < count; j++) {
          const r = 200 + Math.random() * 800;
          const theta = Math.random() * Math.PI * 2;
          const phi = Math.acos(Math.random() * 2 - 1);
          pos[j*3] = r * Math.sin(phi) * Math.cos(theta);
          pos[j*3+1] = r * Math.sin(phi) * Math.sin(theta);
          pos[j*3+2] = r * Math.cos(phi);
          const c = new THREE.Color().setHSL(Math.random() * 0.1 + 0.5, 0.5, 0.8);
          cols[j*3] = c.r; cols[j*3+1] = c.g; cols[j*3+2] = c.b;
          sizes[j] = Math.random() * 2 + 0.5;
        }
        geometry.setAttribute('position', new THREE.BufferAttribute(pos, 3));
        geometry.setAttribute('color', new THREE.BufferAttribute(cols, 3));
        geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));

        const mat = new THREE.ShaderMaterial({
          uniforms: { time: { value: 0 }, depth: { value: i } },
          vertexShader: `
            attribute float size; attribute vec3 color; varying vec3 vColor; uniform float time; uniform float depth;
            void main() {
              vColor = color; vec3 p = position;
              float a = time * 0.05 * (1.0 - depth * 0.3);
              mat2 r = mat2(cos(a), -sin(a), sin(a), cos(a));
              p.xy = r * p.xy;
              vec4 mvP = modelViewMatrix * vec4(p, 1.0);
              gl_PointSize = size * (300.0 / -mvP.z);
              gl_Position = projectionMatrix * mvP;
            }
          `,
          fragmentShader: `varying vec3 vColor; void main() { float d = length(gl_PointCoord - 0.5); if(d > 0.5) discard; gl_FragColor = vec4(vColor, 1.0 - smoothstep(0.0, 0.5, d)); }`,
          transparent: true, blending: THREE.AdditiveBlending, depthWrite: false
        });
        const p = new THREE.Points(geometry, mat);
        refs.scene.add(p);
        refs.stars.push(p);
      }
    };

    const createNebula = () => {
      const { current: refs } = threeRefs;
      const mat = new THREE.ShaderMaterial({
        uniforms: { time: { value: 0 }, color1: { value: new THREE.Color(0x0033ff) }, color2: { value: new THREE.Color(0xff0066) } },
        vertexShader: `varying vec2 vUv; uniform float time; void main() { vUv = uv; vec3 p = position; p.z += sin(p.x*0.01+time)*cos(p.y*0.01+time)*20.0; gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0); }`,
        fragmentShader: `uniform vec3 color1; uniform vec3 color2; uniform float time; varying vec2 vUv; void main() { float m = sin(vUv.x*10.0+time)*cos(vUv.y*10.0+time); gl_FragColor = vec4(mix(color1, color2, m*0.5+0.5), 0.3 * (1.0-length(vUv-0.5)*2.0)); }`,
        transparent: true, blending: THREE.AdditiveBlending, side: THREE.DoubleSide, depthWrite: false
      });
      refs.nebula = new THREE.Mesh(new THREE.PlaneGeometry(8000, 4000), mat);
      refs.nebula.position.z = -1050;
      refs.scene.add(refs.nebula);
    };

    const createMountains = () => {
      const { current: refs } = threeRefs;
      const layers = [
        { d: -50, h: 60, c: 0x1a1a2e }, { d: -150, h: 90, c: 0x16213e }, { d: -300, h: 120, c: 0x0f3460 }
      ];
      layers.forEach((l, i) => {
        const pts = [];
        for (let j = 0; j <= 50; j++) {
          const x = (j/50 - 0.5) * 2000;
          const y = Math.sin(j*0.2)*l.h + Math.sin(j*0.1)*l.h*0.5 + Math.random()*10 - 100;
          pts.push(new THREE.Vector2(x, y));
        }
        pts.push(new THREE.Vector2(1000, -500), new THREE.Vector2(-1000, -500));
        const m = new THREE.Mesh(new THREE.ShapeGeometry(new THREE.Shape(pts)), new THREE.MeshBasicMaterial({ color: l.c, transparent: true, opacity: 0.8 - i*0.2 }));
        m.position.z = l.d;
        m.userData = { baseZ: l.d };
        refs.scene.add(m);
        refs.mountains.push(m);
        refs.locations.push(l.d);
      });
    };

    const createAtmosphere = () => {
      const { current: refs } = threeRefs;
      const mat = new THREE.ShaderMaterial({
        vertexShader: `varying vec3 vN; void main() { vN = normalize(normalMatrix * normal); gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
        fragmentShader: `varying vec3 vN; void main() { float i = pow(0.7 - dot(vN, vec3(0.0,0.0,1.0)), 2.0); gl_FragColor = vec4(vec3(0.3,0.6,1.0)*i, i*0.2); }`,
        side: THREE.BackSide, blending: THREE.AdditiveBlending, transparent: true
      });
      refs.scene.add(new THREE.Mesh(new THREE.SphereGeometry(800, 32, 32), mat));
    };

    const animate = () => {
      const { current: refs } = threeRefs;
      refs.animationId = requestAnimationFrame(animate);
      const t = Date.now() * 0.001;
      refs.stars.forEach(s => s.material.uniforms.time.value = t);
      if(refs.nebula) refs.nebula.material.uniforms.time.value = t * 0.5;
      
      if (refs.camera && refs.targetZ !== undefined) {
        refs.camera.position.z += (refs.targetZ - refs.camera.position.z) * 0.05;
        refs.camera.position.y += (refs.targetY - refs.camera.position.y) * 0.05;
        refs.camera.lookAt(0, 10, -600);
      }

      refs.mountains.forEach((m, i) => {
        m.position.x = Math.sin(t * 0.1) * 2 * (1+i);
      });

      if (refs.composer) refs.composer.render();
    };

    initThree();
    const handleResize = () => {
      const { current: refs } = threeRefs;
      if (refs.camera && refs.renderer) {
        refs.camera.aspect = window.innerWidth / window.innerHeight;
        refs.camera.updateProjectionMatrix();
        refs.renderer.setSize(window.innerWidth, window.innerHeight);
        refs.composer.setSize(window.innerWidth, window.innerHeight);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => {
      const { current: refs } = threeRefs;
      cancelAnimationFrame(refs.animationId);
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  // Scroll handling
  useEffect(() => {
    const handleScroll = () => {
      const scrollY = window.scrollY;
      const progress = Math.min(scrollY / (document.documentElement.scrollHeight - window.innerHeight), 1);
      setScrollProgress(progress);
      
      const section = Math.min(Math.floor(progress * sectionsCount), sectionsCount - 1);
      setCurrentSection(section);

      const { current: refs } = threeRefs;
      const camPos = [
        { y: 30, z: 300 }, { y: 40, z: -100 }, { y: 60, z: -800 }
      ];
      const target = camPos[section] || camPos[0];
      refs.targetY = target.y;
      refs.targetZ = target.z;

      refs.mountains.forEach((m, i) => {
        if (progress > 0.8) m.position.z = -2000;
        else m.position.z = refs.locations[i];
      });
    };
    window.addEventListener('scroll', handleScroll);
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, [sectionsCount]);

  return (
    <div ref={containerRef} className="hero-container cosmos-style">
      <canvas ref={canvasRef} className="hero-canvas" />
      
      <div ref={menuRef} className="side-menu">
        <div className="menu-icon"><span></span><span></span><span></span></div>
        <div className="vertical-text">EXPLORE</div>
      </div>

      <div className="hero-content cosmos-content">
        {profileTypes.map((type, i) => (
          <div 
            key={type.id} 
            className={`profile-scroll-item ${currentSection === i ? 'active' : ''}`}
            style={{ 
              opacity: currentSection === i ? 1 : 0,
              display: currentSection === i ? 'flex' : 'none',
              transition: 'opacity 0.8s ease'
            }}
          >
            <div className="v2-tag">DISCOVER IDENTITY {i + 1}</div>
            <h1 className="hero-title">{type.name}</h1>
            <p className="subtitle-line">{type.desc}</p>
            <Link to={type.path} className="profile-scroll-cta" style={{ border: `1px solid ${type.color}`, color: type.color }}>
              VIEW {type.id.toUpperCase()} →
            </Link>
          </div>
        ))}
      </div>

      <div ref={scrollProgressRef} className="scroll-progress">
        <div className="scroll-text">JOURNEY THROUGH SPACE</div>
        <div className="progress-track">
          <div className="progress-fill" style={{ width: `${scrollProgress * 100}%` }} />
        </div>
        <div className="section-counter">
          {profileTypes[currentSection]?.name.toUpperCase() || 'LOADING...'}
        </div>
      </div>

      <div className="scroll-sections">
        {profileTypes.map((_, i) => <section key={i} className="content-section" />)}
      </div>
    </div>
  );
};

export default HorizonHeroSection;

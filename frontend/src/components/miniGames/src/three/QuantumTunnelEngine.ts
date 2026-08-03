import * as THREE from 'three';

// ─── An infinite archive of physical artwork — elegant, not sci-fi ────────────
//
// The camera glides forward through a warmly-lit gallery corridor whose walls
// slowly bend and breathe like an impossible museum. Hundreds of framed
// paintings, sketches and photographs surround it at every angle, along with
// drifting scraps of aged paper. Artwork appears suddenly, fades away like a
// fading memory, or folds shut and reopens as a different piece — like a page
// turning in a massive storybook. The corridor itself stays black — a dark,
// neutral void that lets the framed artwork provide all the color — with
// only a very slow, subtle drift between near-black tones, no flashes, no
// punches, just a graceful environmental change.

const TUBE_RADIUS  = 1500;
const TUBE_LENGTH  = 22000; // must comfortably exceed 2×Z_FAR so the open-ended tube never reveals the clear color ahead
const Z_NEAR       = 70;
const Z_FAR        = 8200;
const N_ARTWORKS   = 320;
const N_FRAGMENTS  = 70;
const N_ARTWORKS_AMBIENT  = 0; // ambient background: bare corridor only, no floating artwork
const N_FRAGMENTS_AMBIENT = 0;
const AMBIENT_SPEED = 95; // gentle constant drift, no launch/hyperdrive ramp
const BASE_FOV     = 52;
const TWIST_RATE   = 0.018; // rad/s — the corridor slowly corkscrews, dreamlike not dizzying
const ENV_INTERVAL = 10_000; // ms between slow "new archive wing" material drifts

const FRAME_COLORS = [0x2c2016, 0x1c1c1c, 0xd8cdb0, 0xb08d57, 0x5c4a3a, 0x6e6355];

// All near-black / neutral grey — the corridor must never read as brown.
const PALETTES: Array<[number, number]> = [
  [0x000000, 0x242424],
  [0x000000, 0x1c1c1f],
  [0x000000, 0x232326],
  [0x000000, 0x1a1a1a],
  [0x000000, 0x202022],
];

interface SpriteState {
  mesh: THREE.Mesh;
  material: THREE.MeshBasicMaterial;
  frameMesh: THREE.Mesh | null;
  frameMaterial: THREE.MeshStandardMaterial | null;
  isFragment: boolean;
  radius: number;
  angle: number;
  driftSpeed: number;
  z: number;
  base: number;
  aspect: number;
  texIdx: number;
  state: 'spawning' | 'alive' | 'dissolving' | 'folding';
  stateT: number;
  spawnDur: number;
  foldSwapped: boolean;
}

function backOut(t: number): number {
  const c = 1.6;
  const p = t - 1;
  return 1 + (c + 1) * p * p * p + c * p * p;
}

function fogOpacity(relZ: number): number {
  let o = 1;
  const nearFadeEnd = 320;
  if (relZ < nearFadeEnd) o = Math.max(0, (relZ - Z_NEAR) / (nearFadeEnd - Z_NEAR));
  const farStart = Z_FAR * 0.62;
  if (relZ > farStart) o = Math.min(o, Math.max(0.08, 1 - (relZ - farStart) / (Z_FAR - farStart)));
  return o;
}

function pickTier(rand: number): 'small' | 'medium' | 'large' {
  return rand < 0.22 ? 'small' : rand < 0.55 ? 'medium' : 'large';
}

function tierSize(tier: 'small' | 'medium' | 'large'): { size: number; rMin: number; rMax: number } {
  switch (tier) {
    case 'small':  return { size: 90  + Math.random() * 90,  rMin: 0.12, rMax: 0.5 };
    case 'medium': return { size: 190 + Math.random() * 160, rMin: 0.22, rMax: 0.8 };
    default:       return { size: 340 + Math.random() * 260, rMin: 0.12, rMax: 0.98 };
  }
}

export interface EngineOptions {
  canvas: HTMLCanvasElement;
  urls: string[];
  totalMs?: number;
  launchAtMs?: number;
  reducedMotion: boolean;
  /** Lightweight, indefinitely-looping mode for use as a background (no launch ramp). */
  ambient?: boolean;
}

export class QuantumTunnelEngine {
  private canvas: HTMLCanvasElement;
  private urls: string[];
  private totalMs: number;
  private launchAtMs: number;
  private ambient: boolean;
  private nArtworks: number;
  private nFragments: number;

  private renderer: THREE.WebGLRenderer;
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private worldGroup: THREE.Group;
  private tube: THREE.Mesh;
  private tubeUniforms: Record<string, THREE.IUniform>;
  private keyLight: THREE.PointLight;
  private sprites: SpriteState[] = [];
  private textures: (THREE.Texture | null)[] = [];
  private aspects: number[] = [];
  private placeholderTex: THREE.Texture;
  private paperTex: THREE.Texture;

  private ro: ResizeObserver | null = null;
  private rafId = 0;
  private started = false;
  private disposed = false;
  private startT = 0;
  private lastT = 0;
  private camZ = 0;

  private colorA = new THREE.Color(PALETTES[0][0]);
  private colorB = new THREE.Color(PALETTES[0][1]);
  private paletteIdx = 0;
  private lastEnvAt = 0;

  constructor(opts: EngineOptions) {
    this.canvas     = opts.canvas;
    this.urls       = opts.urls;
    this.ambient    = !!opts.ambient;
    this.totalMs    = opts.totalMs ?? 1;
    this.launchAtMs = opts.launchAtMs ?? 0;
    this.nArtworks  = this.ambient ? N_ARTWORKS_AMBIENT : N_ARTWORKS;
    this.nFragments = this.ambient ? N_FRAGMENTS_AMBIENT : N_FRAGMENTS;

    this.renderer = new THREE.WebGLRenderer({
      canvas: this.canvas,
      antialias: true,
      alpha: false,
      powerPreference: 'high-performance',
    });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    this.renderer.setClearColor(0x000000, 1);

    this.scene  = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(BASE_FOV, 1, 1, Z_FAR + 3000);

    this.worldGroup = new THREE.Group();
    this.scene.add(this.worldGroup);

    // Warm, soft gallery lighting — travels with the camera
    const hemi = new THREE.HemisphereLight(0xffedd2, 0x1c1710, 0.85);
    this.scene.add(hemi);
    this.keyLight = new THREE.PointLight(0xffd9a8, 1.6, 4200, 2);
    this.scene.add(this.keyLight);

    this.placeholderTex = this.makePlaceholderTexture();
    this.paperTex = this.makePaperTexture();

    const built = this.buildTube();
    this.tube = built.mesh;
    this.tubeUniforms = built.uniforms;
    this.worldGroup.add(this.tube);

    this.buildSprites();
    this.loadTextures();
    this.resize();
  }

  // ── Setup ────────────────────────────────────────────────────────────────

  private makePlaceholderTexture(): THREE.Texture {
    const c = document.createElement('canvas');
    c.width = c.height = 8;
    const ctx = c.getContext('2d')!;
    ctx.fillStyle = '#2a2620';
    ctx.fillRect(0, 0, 8, 8);
    const tex = new THREE.Texture(c);
    tex.needsUpdate = true;
    return tex;
  }

  private makePaperTexture(): THREE.Texture {
    const size = 128;
    const c = document.createElement('canvas');
    c.width = c.height = size;
    const ctx = c.getContext('2d')!;
    ctx.fillStyle = '#e8dcc0';
    ctx.fillRect(0, 0, size, size);
    const img = ctx.getImageData(0, 0, size, size);
    for (let i = 0; i < img.data.length; i += 4) {
      const n = (Math.random() - 0.5) * 22;
      img.data[i]     = Math.min(255, Math.max(0, img.data[i] + n));
      img.data[i + 1] = Math.min(255, Math.max(0, img.data[i + 1] + n * 0.9));
      img.data[i + 2] = Math.min(255, Math.max(0, img.data[i + 2] + n * 0.7));
    }
    ctx.putImageData(img, 0, 0);
    const grad = ctx.createRadialGradient(size / 2, size / 2, 20, size / 2, size / 2, size * 0.7);
    grad.addColorStop(0, 'rgba(0,0,0,0)');
    grad.addColorStop(1, 'rgba(55,42,24,0.4)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, size, size);
    const tex = new THREE.Texture(c);
    tex.needsUpdate = true;
    return tex;
  }

  private buildTube(): { mesh: THREE.Mesh; uniforms: Record<string, THREE.IUniform> } {
    const geom = new THREE.CylinderGeometry(TUBE_RADIUS, TUBE_RADIUS, TUBE_LENGTH, 28, 300, true);
    geom.rotateX(Math.PI / 2); // axis -> local Z

    const uniforms: Record<string, THREE.IUniform> = {
      uTime:   { value: 0 },
      uCamZ:   { value: 0 },
      uColorA: { value: this.colorA.clone() },
      uColorB: { value: this.colorB.clone() },
    };

    const material = new THREE.ShaderMaterial({
      uniforms,
      transparent: false,
      depthWrite: true,
      side: THREE.BackSide,
      vertexShader: `
        uniform float uTime;
        uniform float uCamZ;
        varying vec2 vUv;
        varying float vNoise;
        varying float vRadialY;
        void main() {
          vUv = uv;
          vec3 pos = position;
          float z = pos.z + uCamZ;
          float angle = atan(pos.y, pos.x);
          float breathe = sin(uTime * 0.12) * 0.5 + 0.5;
          float base = sin(z * 0.0022 + uTime * 0.35) * 40.0
                     + sin(angle * 3.0 + z * 0.0013 - uTime * 0.22) * 26.0;
          float fold = sin(z * 0.0007 - uTime * 0.5) * (0.5 + breathe * 0.5) * 55.0;
          float r = 1.0 + (base + fold) / 1000.0;
          pos.x *= r;
          pos.y *= r;
          vNoise = base + fold;
          vRadialY = pos.y / ${TUBE_RADIUS.toFixed(1)};
          gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
        }
      `,
      fragmentShader: `
        uniform vec3 uColorA;
        uniform vec3 uColorB;
        varying vec2 vUv;
        varying float vNoise;
        varying float vRadialY;
        void main() {
          float mixT = clamp(vNoise / 90.0 + 0.5, 0.0, 1.0);
          vec3 color = mix(uColorA, uColorB, mixT);
          float grooves = pow(abs(sin(vUv.x * 26.0 * 3.14159265)), 10.0);
          color *= (1.0 - grooves * 0.14);
          float topLight = 0.82 + 0.28 * clamp(vRadialY, -1.0, 1.0);
          color *= topLight;
          gl_FragColor = vec4(color, 1.0);
        }
      `,
    });

    return { mesh: new THREE.Mesh(geom, material), uniforms };
  }

  private buildSprites(): void {
    const planeGeom = new THREE.PlaneGeometry(1, 1);

    for (let i = 0; i < this.nArtworks; i++) {
      const material = new THREE.MeshBasicMaterial({
        map: this.placeholderTex, transparent: true, side: THREE.DoubleSide,
        depthWrite: false, opacity: 0,
      });
      const mesh = new THREE.Mesh(planeGeom, material);
      const frameMaterial = new THREE.MeshStandardMaterial({
        color: FRAME_COLORS[Math.floor(Math.random() * FRAME_COLORS.length)],
        roughness: 0.85, metalness: 0.05, transparent: true, opacity: 0,
      });
      const frameMesh = new THREE.Mesh(planeGeom, frameMaterial);
      this.worldGroup.add(mesh, frameMesh);
      this.sprites.push(this.freshSprite(mesh, material, frameMesh, frameMaterial, false, 0, true));
    }

    for (let i = 0; i < this.nFragments; i++) {
      const material = new THREE.MeshBasicMaterial({
        map: this.paperTex,
        color: [0xe8dcc0, 0xd9c9a8, 0xc9bca0, 0xefe6cf][Math.floor(Math.random() * 4)],
        transparent: true, side: THREE.DoubleSide, depthWrite: false, opacity: 0,
      });
      const mesh = new THREE.Mesh(planeGeom, material);
      this.worldGroup.add(mesh);
      this.sprites.push(this.freshSprite(mesh, material, null, null, true, 0, true));
    }
  }

  private freshSprite(
    mesh: THREE.Mesh, material: THREE.MeshBasicMaterial,
    frameMesh: THREE.Mesh | null, frameMaterial: THREE.MeshStandardMaterial | null,
    isFragment: boolean, camZ: number, scattered: boolean,
  ): SpriteState {
    const texIdx = Math.floor(Math.random() * Math.max(1, this.urls.length));
    let size: number, rMin: number, rMax: number;
    if (isFragment) {
      size = 34 + Math.random() * 55; rMin = 0.2; rMax = 0.85;
    } else {
      const tier = pickTier(Math.random());
      ({ size, rMin, rMax } = tierSize(tier));
    }
    const edgeBias = isFragment ? 0.9 : (size < 130 ? 1 : size < 260 ? 0.7 : 0.4);
    const radius = (rMin + Math.pow(Math.random(), edgeBias) * (rMax - rMin)) * TUBE_RADIUS;

    if (frameMaterial) {
      frameMaterial.color.setHex(FRAME_COLORS[Math.floor(Math.random() * FRAME_COLORS.length)]);
    }

    return {
      mesh, material, frameMesh, frameMaterial, isFragment,
      radius,
      angle: Math.random() * Math.PI * 2,
      driftSpeed: (Math.random() - 0.5) * (isFragment ? 0.5 : 0.22),
      z: camZ + Z_NEAR + (scattered
          ? Math.random() * Z_FAR
          : Z_FAR * 0.5 + Math.random() * Z_FAR * 0.5), // spread respawns across a wide depth band for multiple close-in layers, not one distant shell
      base: size,
      aspect: isFragment ? (0.7 + Math.random() * 0.5) : (this.aspects[texIdx] ?? 0.72),
      texIdx,
      state: 'spawning',
      stateT: 0,
      spawnDur: 0.5 + Math.random() * 0.4,
      foldSwapped: false,
    };
  }

  private loadTextures(): void {
    this.textures = new Array(this.urls.length).fill(null);
    this.aspects  = new Array(this.urls.length).fill(0.72);

    const onOneReady = () => this.startInternal();

    this.urls.forEach((url, i) => {
      const img = new Image();
      img.onload = () => {
        const tex = new THREE.Texture(img);
        tex.colorSpace = THREE.SRGBColorSpace;
        tex.generateMipmaps = false;
        tex.minFilter = THREE.LinearFilter;
        tex.magFilter = THREE.LinearFilter;
        tex.needsUpdate = true;
        this.textures[i] = tex;
        this.aspects[i]  = img.naturalWidth > 0 ? img.naturalHeight / img.naturalWidth : 0.72;
        onOneReady();
      };
      img.onerror = onOneReady;
      img.src = url;
    });

    setTimeout(() => this.startInternal(), 350);
  }

  // ── Lifecycle ────────────────────────────────────────────────────────────

  start(): void {
    this.startInternal();
  }

  private startInternal(): void {
    if (this.started || this.disposed) return;
    this.started = true;
    this.startT = performance.now();
    this.lastT  = this.startT;
    this.lastEnvAt = this.startT;

    this.ro = new ResizeObserver(() => this.resize());
    this.ro.observe(this.canvas);

    this.rafId = requestAnimationFrame(this.tick);
  }

  private resize(): void {
    const rect = this.canvas.getBoundingClientRect();
    const w = Math.max(1, rect.width);
    const h = Math.max(1, rect.height);
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(w, h, false);
  }

  dispose(): void {
    this.disposed = true;
    cancelAnimationFrame(this.rafId);
    this.ro?.disconnect();

    this.sprites.forEach(s => {
      s.material.dispose();
      s.frameMaterial?.dispose();
    });
    (this.tube.geometry as THREE.BufferGeometry).dispose();
    (this.tube.material as THREE.Material).dispose();
    this.textures.forEach(t => t?.dispose());
    this.placeholderTex.dispose();
    this.paperTex.dispose();
    this.renderer.dispose();
  }

  // ── Frame loop ───────────────────────────────────────────────────────────

  private tick = (now: number): void => {
    if (this.disposed) return;
    const dt = Math.min((now - this.lastT) / 1000, 0.05);
    this.lastT = now;
    const elapsedS = (now - this.startT) / 1000;

    // Camera speed: a gentle constant drift when ambient; purposeful from the
    // start with a surge in the final stretch during the full transition.
    let speed: number;
    if (this.ambient) {
      speed = AMBIENT_SPEED;
    } else {
      const ph2t = Math.max(0, now - this.startT - this.launchAtMs) / (this.totalMs - this.launchAtMs);
      const SPEED_PH1 = 900, SPEED_PH2 = 5000;
      speed = SPEED_PH1 + (SPEED_PH2 - SPEED_PH1) * Math.min(1, ph2t * ph2t);
    }
    this.camZ += speed * dt;

    // Wandering flight path — walking/flying through the archive, not a straight hallway
    const camX = Math.sin(this.camZ * 0.00035) * 260 + Math.sin(this.camZ * 0.0009 + 1.7) * 90;
    const camY = Math.cos(this.camZ * 0.00028) * 170 + Math.sin(this.camZ * 0.0011 + 0.4) * 60;
    this.camera.position.set(camX, camY, this.camZ);
    const lookAhead = 900;
    const lx = Math.sin((this.camZ + lookAhead) * 0.00035) * 260 + Math.sin((this.camZ + lookAhead) * 0.0009 + 1.7) * 90;
    const ly = Math.cos((this.camZ + lookAhead) * 0.00028) * 170 + Math.sin((this.camZ + lookAhead) * 0.0011 + 0.4) * 60;
    this.camera.lookAt(lx, ly, this.camZ + lookAhead);
    this.camera.rotateZ(Math.sin(elapsedS * 0.12) * 0.035);

    // The corridor slowly corkscrews — an impossible, dreamlike space
    this.worldGroup.rotation.z = elapsedS * TWIST_RATE;

    // Warm light travels just ahead of the camera, like gallery spotlighting
    this.keyLight.position.set(camX, camY + 260, this.camZ + 500);

    // ── Slow environmental drift — the archive quietly changes wings ─────────
    if (now - this.lastEnvAt > ENV_INTERVAL) {
      this.lastEnvAt = now;
      this.paletteIdx = (this.paletteIdx + 1) % PALETTES.length;
    }
    const target = PALETTES[this.paletteIdx];
    const tubeColorA = (this.tubeUniforms.uColorA.value as THREE.Color);
    const tubeColorB = (this.tubeUniforms.uColorB.value as THREE.Color);
    tubeColorA.lerp(new THREE.Color(target[0]), dt * 0.35);
    tubeColorB.lerp(new THREE.Color(target[1]), dt * 0.35);
    this.tubeUniforms.uTime.value = elapsedS;
    this.tubeUniforms.uCamZ.value = this.camZ;

    this.tube.position.z = this.camZ;

    // ── Artwork & paper-fragment field ───────────────────────────────────────
    for (const sp of this.sprites) {
      const relZ = sp.z - this.camZ;
      if (relZ < Z_NEAR) {
        Object.assign(sp, this.freshSprite(sp.mesh, sp.material, sp.frameMesh, sp.frameMaterial, sp.isFragment, this.camZ, false));
      }
    }

    const parentInv = this.worldGroup.quaternion.clone().invert();

    for (const sp of this.sprites) {
      sp.angle += sp.driftSpeed * dt;
      const x = Math.cos(sp.angle) * sp.radius;
      const y = Math.sin(sp.angle) * sp.radius;
      sp.mesh.position.set(x, y, sp.z);
      sp.mesh.quaternion.copy(parentInv).multiply(this.camera.quaternion);
      if (sp.frameMesh) {
        sp.frameMesh.position.set(x, y, sp.z);
        sp.frameMesh.quaternion.copy(sp.mesh.quaternion);
        sp.frameMesh.translateZ(-5);
      }

      const relZ = sp.z - this.camZ;
      const fog = fogOpacity(relZ);
      const aspect = sp.aspect;

      if (!sp.isFragment) {
        const tex = this.textures[sp.texIdx];
        if (sp.material.map !== tex && tex) {
          sp.material.map = tex;
          sp.material.needsUpdate = true;
        }
      }

      const framePad = 1.14;
      const applyScale = (factor: number) => {
        sp.mesh.scale.set(sp.base * factor, sp.base * aspect * factor, 1);
        if (sp.frameMesh) sp.frameMesh.scale.set(sp.base * framePad * factor, sp.base * aspect * framePad * factor, 1);
      };
      const applyOpacity = (o: number) => {
        sp.material.opacity = o;
        if (sp.frameMaterial) sp.frameMaterial.opacity = Math.min(1, o * 1.05);
      };

      if (sp.state === 'spawning') {
        sp.stateT += dt;
        const t = Math.min(sp.stateT / sp.spawnDur, 1);
        const ease = backOut(t);
        applyOpacity(fog * Math.min(1, t * 1.4) * 0.96);
        applyScale(ease);
        if (t >= 1) sp.state = 'alive';
      } else if (sp.state === 'alive') {
        applyOpacity(fog * 0.96);
        applyScale(1);
        if (relZ < 340) {
          if (sp.isFragment) {
            sp.state = 'dissolving';
          } else {
            sp.state = Math.random() < 0.55 ? 'dissolving' : 'folding';
          }
          sp.stateT = 0;
          sp.foldSwapped = false;
        }
      } else if (sp.state === 'dissolving') {
        sp.stateT += dt;
        const t = Math.min(sp.stateT / 0.7, 1);
        applyOpacity(fog * (1 - t) * 0.96);
        applyScale(1 - 0.3 * t);
        if (t >= 1) Object.assign(sp, this.freshSprite(sp.mesh, sp.material, sp.frameMesh, sp.frameMaterial, sp.isFragment, this.camZ, false));
      } else if (sp.state === 'folding') {
        sp.stateT += dt;
        const t = Math.min(sp.stateT / 0.75, 1);
        const flip = t * Math.PI;
        const scaleX = Math.max(Math.abs(Math.cos(flip)), 0.02);
        sp.mesh.scale.set(sp.base * scaleX, sp.base * aspect, 1);
        if (sp.frameMesh) sp.frameMesh.scale.set(sp.base * framePad * scaleX, sp.base * aspect * framePad, 1);
        applyOpacity(fog * 0.96);
        if (!sp.foldSwapped && t >= 0.5) {
          sp.texIdx = Math.floor(Math.random() * Math.max(1, this.urls.length));
          sp.aspect = this.aspects[sp.texIdx] ?? 0.72;
          if (sp.frameMaterial) sp.frameMaterial.color.setHex(FRAME_COLORS[Math.floor(Math.random() * FRAME_COLORS.length)]);
          sp.foldSwapped = true;
        }
        if (t >= 1) {
          sp.state = 'alive';
          sp.z += 2600;
          applyScale(1);
        }
      }
    }

    this.renderer.render(this.scene, this.camera);
    this.rafId = requestAnimationFrame(this.tick);
  };
}

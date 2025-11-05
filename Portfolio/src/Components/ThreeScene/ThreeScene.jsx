import { useEffect, useRef } from "react";
import * as THREE from "three";
import { createPoufLamp } from "./PoufLamp.js";
import { createPortfolioBook } from "./PortfolioBook.js";
import { createChair } from "./Chair.js";
import { loadAirpodsMax } from "./AirpodsMaxStand.js";
import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer.js";
import { RenderPass } from "three/examples/jsm/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "three/examples/jsm/postprocessing/UnrealBloomPass.js";
import { ShaderPass } from "three/examples/jsm/postprocessing/ShaderPass.js";
import { FilmPass } from "three/examples/jsm/postprocessing/FilmPass.js";
import { VignetteShader } from "three/examples/jsm/shaders/VignetteShader.js";
import { RGBELoader } from "three/examples/jsm/loaders/RGBELoader.js";
import { EXRLoader } from "three/examples/jsm/loaders/EXRLoader.js";

export default function ThreeRoom() {
  const mountRef = useRef(null);

  /* -------------------- Tapis bicolore rouge & beige -------------------- */
  function makeBlobRugTexture() {
    const canvas = document.createElement("canvas");
    canvas.width = 1024;
    canvas.height = 512;
    const ctx = canvas.getContext("2d");

    ctx.fillStyle = "#E8D9C9";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    for (let i = 0; i < 12000; i++) {
      const x = Math.random() * canvas.width;
      const y = Math.random() * canvas.height;
      const alpha = 0.02 + Math.random() * 0.03;
      ctx.fillStyle = `rgba(160, 140, 120, ${alpha})`;
      ctx.fillRect(x, y, 1, 1);
    }

    ctx.fillStyle = "#B53A2C";
    ctx.beginPath();
    ctx.moveTo(120, 300);
    ctx.bezierCurveTo(220, 120, 420, 100, 560, 240);
    ctx.bezierCurveTo(700, 400, 880, 360, 950, 250);
    ctx.bezierCurveTo(950, 400, 700, 460, 520, 420);
    ctx.bezierCurveTo(360, 390, 200, 460, 120, 300);
    ctx.closePath();
    ctx.fill();

    const colorTex = new THREE.CanvasTexture(canvas);
    colorTex.anisotropy = 8;
    colorTex.colorSpace = THREE.SRGBColorSpace;

    const normalCanvas = document.createElement("canvas");
    normalCanvas.width = canvas.width;
    normalCanvas.height = canvas.height;
    const nctx = normalCanvas.getContext("2d");
    nctx.drawImage(canvas, 0, 0);
    const imgData = nctx.getImageData(0, 0, canvas.width, canvas.height);
    const d = imgData.data;

    for (let i = 0; i < d.length; i += 4) {
      const avg = (d[i] + d[i + 1] + d[i + 2]) / 3;
      const v = avg / 255;
      d[i] = 128 + (v - 0.5) * 55;
      d[i + 1] = 128 + (v - 0.5) * 55;
      d[i + 2] = 255;
    }
    nctx.putImageData(imgData, 0, 0);
    const normalTex = new THREE.CanvasTexture(normalCanvas);
    normalTex.anisotropy = 8;

    return { colorTex, normalTex };
  }

  useEffect(() => {
    const width = window.innerWidth;
    const height = window.innerHeight;

    /* -------------------- SCÈNE -------------------- */
    const scene = new THREE.Scene();

    // 🌅 HDRI pour reflets métalliques (important pour le casque)
    new RGBELoader().load(
      "https://dl.polyhaven.org/file/ph-assets/HDRIs/hdr/1k/studio_small_09_1k.hdr",
      (hdrEquirect) => {
        hdrEquirect.mapping = THREE.EquirectangularReflectionMapping;
        scene.environment = hdrEquirect;
        scene.background = null;
      }
    );

    /* -------------------- CAMÉRA -------------------- */
    const camera = new THREE.PerspectiveCamera(50, width / height, 0.1, 1000);
    camera.position.set(3, 4, 3.5);
    camera.lookAt(0, 1, -4.5);

    /* -------------------- RENDERER -------------------- */
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(width, height);
    renderer.setClearColor(0xf2f0ec);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.outputColorSpace = THREE.SRGBColorSpace;

    if (mountRef.current.children.length > 0)
      mountRef.current.removeChild(mountRef.current.children[0]);
    mountRef.current.appendChild(renderer.domElement);

    /* -------------------- SOL (oak veneer 4K stable + ajusté) -------------------- */
    const texLoader = new THREE.TextureLoader();

    // Chargement des textures principales
    const floorColor = texLoader.load(
      "/assets/textures/sol/oak_veneer_01_diff_4k.jpg"
    );
    const floorAO = texLoader.load(
      "/assets/textures/sol/oak_veneer_01_ao_4k.jpg"
    );
    const floorDisplacement = texLoader.load(
      "/assets/textures/sol/oak_veneer_01_disp_4k.png"
    );

    // Réglage des répétitions et encodage
    [floorColor, floorAO, floorDisplacement].forEach((t) => {
      t.wrapS = t.wrapT = THREE.RepeatWrapping;
      t.repeat.set(2, 2);
      t.colorSpace = THREE.SRGBColorSpace;
    });

    // Matériau du sol (effet bois naturel et équilibré)
    const floorMaterial = new THREE.MeshStandardMaterial({
      map: floorColor,
      aoMap: floorAO,
      displacementMap: floorDisplacement,
      displacementScale: 0.03,
      roughness: 0.6,
      metalness: 0.05,
      color: 0xffffff,
    });

    // Création et placement du mesh
    const floor = new THREE.Mesh(
      new THREE.PlaneGeometry(15, 12, 128, 128),
      floorMaterial
    );
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = -0.03; // ✅ ajuste la hauteur pour corriger l'enfoncement de la chaise
    floor.receiveShadow = true;

    scene.add(floor);

    /* -------------------- MURS -------------------- */
    const WALL_H = 6;
    const HALF_W = 15 / 2;
    const HALF_D = 12 / 2;
    const EPS = 0.0005;

    const wallMat = new THREE.MeshStandardMaterial({
      color: 0x888888,
      roughness: 0.8,
      metalness: 0.05,
      side: THREE.DoubleSide,
    });

    const backWall = new THREE.Mesh(
      new THREE.PlaneGeometry(15, WALL_H),
      wallMat
    );
    backWall.position.set(0, WALL_H / 2, -HALF_D - EPS);
    scene.add(backWall);

    const leftWall = new THREE.Mesh(
      new THREE.PlaneGeometry(12, WALL_H),
      wallMat
    );
    leftWall.position.set(-HALF_W - EPS, WALL_H / 2, 0);
    leftWall.rotation.y = Math.PI / 2;
    scene.add(leftWall);

    /* -------------------- FENÊTRE -------------------- */
    const W = 5.0;
    const H = 3.0;
    const BAR = 0.1;
    const leftWallX = -HALF_W;
    const lampTopY = 1.85;
    const windowBottomY = lampTopY - 0.05;
    const windowCenterY = windowBottomY + H / 2;
    const windowZ = -2.3;

    const windowGroup = new THREE.Group();
    windowGroup.position.set(leftWallX + 0.02, windowCenterY, windowZ - 0.1);
    windowGroup.rotation.y = Math.PI / 2;

    const frameMat = new THREE.MeshStandardMaterial({
      color: 0xf0f0f0,
      roughness: 0.4,
      metalness: 0.1,
    });
    const glassMat = new THREE.MeshPhysicalMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.1,
      transmission: 1,
      thickness: 0.03,
      roughness: 0.15,
      side: THREE.DoubleSide,
    });

    const addBar = (geo, pos) => {
      const m = new THREE.Mesh(geo, frameMat);
      m.position.set(...pos);
      m.renderOrder = 2;
      m.material.depthTest = false;
      windowGroup.add(m);
    };

    addBar(new THREE.BoxGeometry(W, BAR, BAR), [0, H / 2 - BAR / 2, 0]);
    addBar(new THREE.BoxGeometry(W, BAR, BAR), [0, -H / 2 + BAR / 2, 0]);
    addBar(new THREE.BoxGeometry(BAR, H, BAR), [-W / 2 + BAR / 2, 0, 0]);
    addBar(new THREE.BoxGeometry(BAR, H, BAR), [W / 2 - BAR / 2, 0, 0]);
    addBar(new THREE.BoxGeometry(W - BAR * 2, BAR, BAR), [0, 0, 0]);

    const glass = new THREE.Mesh(
      new THREE.PlaneGeometry(W - BAR * 2, H - BAR * 2),
      glassMat
    );
    glass.position.set(0, 0, -BAR / 2);
    glass.renderOrder = 1;
    glass.material.depthTest = false;
    windowGroup.add(glass);

    const outsideTex = texLoader.load(
      "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1600&q=80"
    );
    outsideTex.encoding = THREE.SRGBEncoding;
    outsideTex.anisotropy = 8;

    const outside = new THREE.Mesh(
      new THREE.PlaneGeometry(W - 0.02, H - 0.02),
      new THREE.MeshBasicMaterial({ map: outsideTex, side: THREE.DoubleSide })
    );
    outside.position.set(0, 0, -0.1);
    outside.renderOrder = 0;
    outside.material.depthTest = false;
    windowGroup.add(outside);
    scene.add(windowGroup);

    /* -------------------- TABLE (chêne clair naturel + éclaircissement stable) -------------------- */
    const deskTexLoader = new THREE.TextureLoader();
    const deskColor = deskTexLoader.load(
      "/assets/textures/desk/plywood_diff_4k.jpg"
    );
    const deskNormal = deskTexLoader.load(
      "/assets/textures/desk/plywood_nor_gl_4k.exr"
    );
    const deskRough = deskTexLoader.load(
      "/assets/textures/desk/plywood_rough_4k.exr"
    );

    [deskColor, deskNormal, deskRough].forEach((t) => {
      t.wrapS = t.wrapT = THREE.RepeatWrapping;
      t.repeat.set(1.5, 1.5);
      t.colorSpace = THREE.SRGBColorSpace;
      t.anisotropy = 8;
    });

    // 🪵 Matériau bois clair (éclairci via la propriété `color`)
    const deskMaterial = new THREE.MeshStandardMaterial({
      map: deskColor,
      normalMap: deskNormal,
      roughnessMap: deskRough,
      roughness: 0.68,
      metalness: 0.05,
      color: new THREE.Color(1.25, 1.2, 1.1), // ↗︎ rend la texture plus lumineuse sans shader
    });

    // 🪵 Plateau
    const scale = 1.5;
    const desk = new THREE.Mesh(
      new THREE.BoxGeometry(3 * scale, 0.1, 1.5 * scale),
      deskMaterial
    );
    desk.position.set(0, 1.25, -4.25);
    desk.castShadow = true;
    scene.add(desk);

    // 🦵 Pieds du bureau
    const legsMat = new THREE.MeshStandardMaterial({
      color: 0x1e1e1e,
      roughness: 0.8,
      metalness: 0.2,
    });
    const legGeo = new THREE.BoxGeometry(0.1, 1.25, 0.1);
    const offsetX = 1.5 * scale - 0.1;
    const offsetZ = 0.75 * scale - 0.1;
    const centerZ = -4.25;

    [
      [-offsetX, 0.6, centerZ + offsetZ],
      [offsetX, 0.6, centerZ + offsetZ],
      [-offsetX, 0.6, centerZ - offsetZ],
      [offsetX, 0.6, centerZ - offsetZ],
    ].forEach(([x, y, z]) => {
      const leg = new THREE.Mesh(legGeo, legsMat);
      leg.position.set(x, y, z);
      leg.castShadow = true;
      scene.add(leg);
    });

    /* -------------------- TAPIS -------------------- */
    const { colorTex, normalTex } = makeBlobRugTexture();
    const rug = new THREE.Mesh(
      new THREE.PlaneGeometry(6.2, 3.5, 64, 64),
      new THREE.MeshStandardMaterial({
        map: colorTex,
        normalMap: normalTex,
        roughness: 0.98,
        metalness: 0.0,
      })
    );
    rug.rotation.x = -Math.PI / 2;
    rug.position.set(0, 0.004, -4.4);
    rug.receiveShadow = true;
    scene.add(rug);

    /* -------------------- LAMPE + LIVRE -------------------- */
    const lamp = createPoufLamp({ height: 0.8, color: "#FF7A00" });
    lamp.position.set(1.4, 1.3, -4.9);
    scene.add(lamp);

    const book = createPortfolioBook({
      width: 0.8,
      height: 0.09,
      depth: 1,
      color: "#39E136",
      title: "MATTEO LIVROZET —",
      subtitle: "PORTFOLIO VOL.01",
    });
    book.position.set(0, 1.315, -4.25);
    scene.add(book);

    /* -------------------- AFFICHES -------------------- */
    const postersData = [
      { url: "/assets/751195_poster.jpg", w: 0.8, h: 1.0, x: -2.17, y: 3.2 },
      { url: "/assets/poster2.jpg", w: 0.7, h: 0.9, x: -1.2, y: 3.27 },
      { url: "/assets/poster3.jpg", w: 0.9, h: 1.2, x: 0, y: 3.37 },
      { url: "/assets/poster4.jpg", w: 0.8, h: 1.0, x: 1.4, y: 3.17 },
      { url: "/assets/poster5.jpg", w: 0.7, h: 0.9, x: 2.5, y: 3.27 },
    ];

    postersData.forEach((p) => {
      const tex = texLoader.load(p.url);
      tex.colorSpace = THREE.SRGBColorSpace;
      const mat = new THREE.MeshStandardMaterial({
        map: tex,
        roughness: 0.5,
        metalness: 0.1,
      });
      const frame = new THREE.Mesh(
        new THREE.PlaneGeometry(p.w + 0.05, p.h + 0.05),
        new THREE.MeshStandardMaterial({ color: 0xe0d8c5, roughness: 0.8 })
      );
      const poster = new THREE.Mesh(new THREE.PlaneGeometry(p.w, p.h), mat);
      poster.position.z = 0.01;
      frame.add(poster);
      frame.position.set(p.x, p.y, -6.0);
      scene.add(frame);
    });

    /* -------------------- CHAISE -------------------- */
    const chair = createChair({
      seatColor: "#D26A2E",
      metalColor: "#D9D9D9",
      groundY: 0.004,
      forkDrop: 0.06,
      wheelRadius: 0.044,
      wheelWidth: 0.022,
    });
    chair.position.set(-1.35, 0, -2.2);
    chair.rotation.y = Math.PI / 4;
    scene.add(chair);

    /* -------------------- 🎧 AIRPODS MAX — casque dark + stand alu -------------------- */

    const STAND_NODE_NAMES = [
      "Node6",
      "Node7",
      "Node8",
      "Node9",
      "Node10",
      "Node11",
      "Node12",
    ];

    (async () => {
      const airpods = await loadAirpodsMax("/assets/models/model.glb", {
        scale: 0.077,
        variant: "spacegray",
      });

      // (optionnel) debug :
      console.log("Meshes AirPods Max :");
      airpods.traverse((child) => {
        if (child.isMesh) console.log(child.name);
      });

      const standNames = new Set(STAND_NODE_NAMES);

      // 🎧 Casque dark / space gray
      const headphoneMat = new THREE.MeshStandardMaterial({
        color: 0x151515, // noir/gris très foncé
        roughness: 0.6, // plutôt mat
        metalness: 0.25, // un peu métallique, mais discret
        envMapIntensity: 0.4,
      });

      // 🪫 Stand aluminium brossé clair
      const standMat = new THREE.MeshStandardMaterial({
        color: 0xd8d8d8, // gris alu clair
        roughness: 0.38, // pas miroir
        metalness: 0.9, // bien métallique
        envMapIntensity: 0.2,
      });

      airpods.traverse((child) => {
        if (!child.isMesh) return;

        if (standNames.has(child.name)) {
          // 👉 parties du stand = alu
          child.material = standMat;
        } else {
          // 👉 tout le reste = casque dark
          child.material = headphoneMat;
        }

        child.castShadow = true;
        child.receiveShadow = true;
      });

      airpods.position.set(-2, 1.3, -4.75);
      airpods.rotation.y = -Math.PI / 4;

      scene.add(airpods);
    })();

    /* -------------------- LUMIÈRES — Ambiance claire & naturelle avec lampe allumée -------------------- */

    // 💡 Lumière d’ambiance principale — chaude et douce
    const ambient = new THREE.AmbientLight(0xfff3e0, 1.1);
    scene.add(ambient);

    // ☀️ Directional light simulant la lumière naturelle du soir
    const sunsetLight = new THREE.DirectionalLight(0xffdfb1, 1.4);
    sunsetLight.position.set(-6, 5, -2);
    sunsetLight.castShadow = true;
    sunsetLight.shadow.mapSize.set(2048, 2048);
    scene.add(sunsetLight);

    // 🌇 Lumière froide secondaire venant de la fenêtre (équilibre des tons)
    const windowFill = new THREE.DirectionalLight(0xe1eeff, 0.65);
    windowFill.position.set(-8, 3, 1);
    scene.add(windowFill);

    // 🔥 Lampe de bureau — lumière douce et contrôlée
    const lampLight = new THREE.PointLight(0xff944d, 0.32, 1.9, 2);
    lampLight.position.set(1.5, 1.45, -4.7);
    lampLight.castShadow = false;
    scene.add(lampLight);

    // 🌟 Glow interne de la lampe — effet chaud dans le globe sans halo au sol
    const lampGlow = new THREE.PointLight(0xffb36b, 0.12, 2.4, 1.5);
    lampGlow.position.set(1.5, 1.55, -4.7);
    lampGlow.castShadow = false;
    scene.add(lampGlow);

    // ☀️ Renforcement doux du volume global
    const fillBounce = new THREE.PointLight(0xffe9c4, 0.15, 6);
    fillBounce.position.set(0, 2.5, -4.5);
    scene.add(fillBounce);

    /* -------------------- SUSPENSION DOUCE AU-DESSUS DU BUREAU -------------------- */

    // Suspension invisible : éclaire toute la surface du bureau
    const overheadLight = new THREE.RectAreaLight(0xfff6e8, 3.2, 3.5, 1.2);
    overheadLight.position.set(0, 3.5, -4.25);
    overheadLight.rotation.x = -Math.PI / 2.15;
    scene.add(overheadLight);

    // Légère lumière diffuse pour déboucher les ombres (surtout le casque)
    const overheadFill = new THREE.PointLight(0xffffff, 0.4, 4.5);
    overheadFill.position.set(-1.5, 2.4, -4.3);
    scene.add(overheadFill);

    /* -------------------- LOOP + POST-PROCESS — rendu doux et propre -------------------- */

    const composer = new EffectComposer(renderer);
    composer.addPass(new RenderPass(scene, camera));

    // 🌟 Bloom ultra léger (juste pour la lampe)
    const bloomPass = new UnrealBloomPass(
      new THREE.Vector2(window.innerWidth, window.innerHeight),
      0.15,
      0.25,
      0.9
    );
    composer.addPass(bloomPass);

    // 🎞️ Grain cinéma léger
    const filmPass = new FilmPass(0.01, false);
    composer.addPass(filmPass);

    // 🌆 Vignette subtile
    const vignettePass = new ShaderPass(VignetteShader);
    vignettePass.uniforms["offset"].value = 1.02;
    vignettePass.uniforms["darkness"].value = 0.75;
    composer.addPass(vignettePass);

    // ⚙️ Tonemapping équilibré
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.75;

    // 🔁 Boucle d’animation
    const animate = () => {
      requestAnimationFrame(animate);
      composer.render();
    };
    animate();

    window.addEventListener("resize", () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    });
  }, []);

  return <div ref={mountRef} style={{ width: "100%", height: "100vh" }} />;
}

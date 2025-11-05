// src/Components/ThreeScene/Chair.js
import * as THREE from "three";

/**
 * EA 208/218 – version stylisée, stable
 * - Accoudoirs: boucle chrome large, ancrée aux flancs de l’assise (pas de pad cuir)
 * - Dossier: panneau unique rectangulaire à coins arrondis, look “vrai dossier”
 * - Assise: pad rectangulaire arrondi
 * - Sling chrome sous l’assise
 * - Base 5 branches chrome + roulettes sphériques posées sur groundY
 */
export function createChair({
  leatherColor = "#D26A2E",
  chromeColor  = "#E8E8E8",
  tireColor    = "#121212",
  plasticBlack = "#1c1c1c",

  groundY      = 0.004,

  wheelRadius  = 0.048,
  forkDrop     = 0.060,
  baseRadius   = 0.40,

  seatTopY     = 0.95,
  seatWidth    = 0.96,
  seatDepth    = 0.82,

  envMapIntensity = 1.2,
} = {}) {
  const chair = new THREE.Group();

  /* ───────── matériaux ───────── */
  const matLeather = new THREE.MeshStandardMaterial({
    color: leatherColor, roughness: 0.55, metalness: 0.12,
  });
  const matChrome = new THREE.MeshPhysicalMaterial({
    color: chromeColor, metalness: 1, roughness: 0.08, reflectivity: 1,
    envMapIntensity,
  });
  const matBlack = new THREE.MeshStandardMaterial({
    color: plasticBlack, roughness: 0.45, metalness: 0.55,
  });
  const matTire = new THREE.MeshStandardMaterial({
    color: tireColor, roughness: 0.5, metalness: 0.2,
  });

  /* ───────── helpers ───────── */
  function makeRectPad({ w, h, t, r = 0.10 }) {
    const s = new THREE.Shape();
    const hw = w / 2, hh = h / 2, rr = Math.min(r, hw, hh);

    s.moveTo(-hw + rr, -hh);
    s.lineTo(hw - rr, -hh);
    s.quadraticCurveTo(hw, -hh, hw, -hh + rr);
    s.lineTo(hw, hh - rr);
    s.quadraticCurveTo(hw, hh, hw - rr, hh);
    s.lineTo(-hw + rr, hh);
    s.quadraticCurveTo(-hw, hh, -hw, hh - rr);
    s.lineTo(-hw, -hh + rr);
    s.quadraticCurveTo(-hw, -hh, -hw + rr, -hh);

    const geo = new THREE.ExtrudeGeometry(s, {
      depth: t,
      bevelEnabled: true,
      bevelThickness: Math.min(0.035, t * 0.55),
      bevelSize: Math.min(0.028, r * 0.55),
      bevelSegments: 4,
      curveSegments: 16,
    });
    geo.rotateX(-Math.PI / 2);
    geo.translate(0, -t / 2, 0);

    const m = new THREE.Mesh(geo, matLeather);
    m.castShadow = true;
    return m;
  }

  /* ───────── base + sol ───────── */
  const hubY = groundY + forkDrop + wheelRadius;

  const gasLiftH = Math.max(0.12, seatTopY - hubY);
  const gasLift  = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, gasLiftH, 28), matBlack);
  gasLift.position.set(0, hubY + gasLiftH / 2, 0);
  chair.add(gasLift);

  const collar = new THREE.Mesh(new THREE.TorusGeometry(0.094, 0.012, 16, 42), matChrome);
  collar.rotation.x = Math.PI / 2;
  collar.position.set(0, hubY + 0.008, 0);
  chair.add(collar);

  // Pied étoile
  const legCount = 5;
  const armLen   = 0.38;
  const armThick = 0.036;
  const armGeo   = new THREE.BoxGeometry(armLen, armThick, armThick);
  const forkGeo  = new THREE.CylinderGeometry(0.013, 0.013, forkDrop, 16);

  for (let i = 0; i < legCount; i++) {
    const angle = (i / legCount) * Math.PI * 2;
    const leg = new THREE.Group();
    leg.position.set(0, hubY, 0);
    leg.rotation.y = angle;

    const arm = new THREE.Mesh(armGeo, matChrome);
    arm.position.set(armLen / 2, 0, 0);
    arm.scale.z = 0.9;
    leg.add(arm);

    const fork = new THREE.Mesh(forkGeo, matChrome);
    fork.position.set(armLen, -forkDrop / 2, 0);
    leg.add(fork);

    const yForkBottom = -forkDrop;
    const yoke = new THREE.Mesh(new THREE.BoxGeometry(0.052, 0.014, 0.030), matChrome);
    yoke.position.set(baseRadius, yForkBottom - 0.007, 0);
    leg.add(yoke);

    const axle = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.04, 16), matChrome);
    axle.rotation.x = Math.PI / 2;
    axle.position.set(baseRadius, yForkBottom - 0.014, 0);
    leg.add(axle);

    const wheel = new THREE.Mesh(new THREE.SphereGeometry(wheelRadius, 24, 16), matTire);
    wheel.position.set(baseRadius, yForkBottom - 0.014, 0);
    wheel.castShadow = true;
    leg.add(wheel);

    chair.add(leg);
  }

  /* ───────── partie haute ───────── */
  const upper = new THREE.Group();
  upper.position.set(0, seatTopY, 0);
  chair.add(upper);

  /* Sling chrome sous l’assise */
  const slingR = 0.016;
  const slingY = -0.058;
  const slingZBack  = -seatDepth * 0.42;
  const slingZFront =  seatDepth * 0.46;
  const slingCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(-seatWidth * 0.45, slingY, slingZBack),
    new THREE.Vector3(-seatWidth * 0.40, slingY - 0.02,  0.00),
    new THREE.Vector3(-seatWidth * 0.45, slingY, slingZFront),
    new THREE.Vector3( seatWidth * 0.45, slingY, slingZFront),
    new THREE.Vector3( seatWidth * 0.40, slingY - 0.02, 0.00),
    new THREE.Vector3( seatWidth * 0.45, slingY, slingZBack),
  ]);
  const slingMesh = new THREE.Mesh(new THREE.TubeGeometry(slingCurve, 90, slingR, 18, false), matChrome);
  slingMesh.castShadow = true;
  upper.add(slingMesh);

  /* Assise */
  const seatThickness = 0.095;
  const seatPad = makeRectPad({
    w: seatWidth * 0.92,
    h: seatDepth * 0.78,
    t: seatThickness,
    r: 0.11,
  });
  seatPad.position.set(0, -0.004, 0.012);
  seatPad.rotation.x = Math.PI / 80;
  upper.add(seatPad);

  /* ───────── Dossier vertical, plus long ───────── */
// (remplace tout l'ancien bloc du dossier)

const backW = seatWidth * 1;  // un peu plus large que l’assise visuelle
const backH = 0.7;              // hauteur du coussin
const backT = 0.10;              // épaisseur
const backR = 0.12;              // rayon des coins

const backPad = makeRectPad({
  w: backW,
  h: backH,
  t: backT,
  r: backR,
});

// makeRectPad fabrique un "pad" à plat (horizontal).
// On le met VERTICAL comme un vrai dossier :
backPad.rotation.x = Math.PI / 2;

// Placement : un peu au-dessus de l’assise et reculé
// (le - backT*0.50 compense le petit décalage créé par la rotation)
backPad.position.set(
  0,
  0.5,                              // monte/descend le dossier ici si besoin
  -seatDepth * 0.44 - backT * 0.50
);

backPad.castShadow = true;
upper.add(backPad);


 /* ─────────────────── Accoudoirs EA – rectangle propre ─────────────────── */
{
  const railR = 0.016; // épaisseur du tube chrome

  function addEAArmRect(side /* 'L' | 'R' */) {
    const s = side === "L" ? -1 : 1;

    // géométrie de la boucle
    const xInner = s * (seatWidth * 0.50);  // flanc de l’assise
    const xOuter = s * (seatWidth * 0.62);  // bord extérieur (visible)
    const zRear  = -seatDepth * 0.28;
    const zFront =  seatDepth * 0.22;
    const yTop   =  0.22;                   // hauteur du dessus d’accoudoir
    const yBot   =  0.02;                   // pied qui redescend (vers le flanc)

    // coins arrondis : on insère des points “tampons” proches des coins
    const rZ = 0.04; // rayon d’arrondi en Z
    const rX = 0.02; // micro-rayon en X pour éviter tout décroché

    const P = [
      // segment haut arrière -> vers extérieur
      new THREE.Vector3(xInner, yTop, zRear),
      new THREE.Vector3(xInner + s * rX, yTop, zRear),          // tampon
      new THREE.Vector3(xOuter - s * rX, yTop, zRear),          // tampon
      new THREE.Vector3(xOuter, yTop, zRear + (zFront - zRear) * 0.15),

      // segment haut milieu -> avant
      new THREE.Vector3(xOuter, yTop, -rZ),
      new THREE.Vector3(xOuter, yTop, 0),
      new THREE.Vector3(xOuter, yTop, rZ),

      // segment haut avant -> vers flanc
      new THREE.Vector3(xOuter, yTop, zFront - (zFront - zRear) * 0.15),
      new THREE.Vector3(xOuter - s * rX, yTop, zFront),         // tampon
      new THREE.Vector3(xInner + s * rX, yTop, zFront),         // tampon
      new THREE.Vector3(xInner, yTop, zFront),

      // descente verticale côté flanc
      new THREE.Vector3(xInner, (yTop + yBot) * 0.6, zFront),
      new THREE.Vector3(xInner, yBot, zFront - rZ),

      // bas avant -> bas arrière (bien horizontal, collé au flanc)
      new THREE.Vector3(xInner, yBot, 0),
      new THREE.Vector3(xInner, yBot, -rZ),

      // fin : remonte vers arrière pour fermer proprement
      new THREE.Vector3(xInner, (yTop + yBot) * 0.6, zRear),
    ];

    const curve = new THREE.CatmullRomCurve3(P, true, "centripetal", 0.0);
    const rail  = new THREE.Mesh(
      new THREE.TubeGeometry(curve, 140, railR, 24, true),
      matChrome
    );
    rail.castShadow = true;
    upper.add(rail);

    // deux petits montants d’ancrage au flanc (propres et discrets)
    const postR = 0.012, postH = 0.06;
    const postA = new THREE.Mesh(new THREE.CylinderGeometry(postR, postR, postH, 12), matChrome);
    const postB = postA.clone();
    postA.position.set(xInner, yTop - postH / 2 + 0.005, zRear  * 0.65);
    postB.position.set(xInner, yTop - postH / 2 + 0.005, zFront * 0.65);
    upper.add(postA, postB);

    // --- Pad cuir sur le dessus de l’accoudoir (entre le montant interne et le coude externe)
const padT      = 0.05;                          // épaisseur du pad
const padDepth  = 0.35;                          // profondeur (avant ↔ arrière)
const padLen    = Math.abs(xOuter - xInner) - 0.02; // longueur (flanc → proche coude)

// bloc arrondi simple (tu peux remplacer par ta fonction roundedRectExtrude si tu l’as)
const padGeo = new THREE.BoxGeometry(padLen, padT, padDepth);
const padTop = new THREE.Mesh(padGeo, matLeather);
padTop.castShadow = true;

// positionné au milieu en X, posé juste au-dessus du rail, centré en Z
padTop.position.set(
  (xInner + xOuter) * 0.5,
  yTop + padT * 0.01 + 0.004,
  0
);

upper.add(padTop);

  }


  // remplace les anciens appels
  addEAArmRect("L");
  addEAArmRect("R");
}
    return chair;
}

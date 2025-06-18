// import "./style.css";
import * as THREE from "three";
import gsap from "gsap";
import GUI from "lil-gui";
import Stats from "three/addons/libs/stats.module.js";

import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { RGBELoader } from "three/examples/jsm/loaders/RGBELoader.js";
import * as SkeletonUtils from "three/addons/utils/SkeletonUtils.js";
import { RectAreaLightHelper } from "three/examples/jsm/helpers/RectAreaLightHelper.js";
import { render } from "vue";

//GUI and Stats
const gui = new GUI();
document.body.appendChild(gui.domElement);
const stats = new Stats();
document.body.appendChild(stats.dom);

// Canvas & Mouse
const canvas = document.querySelector("canvas.webgl");
const sizes = {
  width: window.innerWidth,
  height: window.innerHeight,
};
const raycaster = new THREE.Raycaster();
let INTERSECTED = null;
const mouse = { x: 0, y: 0 };
window.addEventListener("mousemove", (event) => {
  mouse.x = (event.clientX / sizes.width) * 2 - 1;
  mouse.y = -(event.clientY / sizes.height) * 2 + 1;
  // console.log(mouse);
});

// Scene
const scene = new THREE.Scene();

// AxesHelper
const axesHelper = new THREE.AxesHelper(20); //size
axesHelper.position.y = -12;
scene.add(axesHelper);

// Load Environment Map
const rgbeLoader = new RGBELoader();
rgbeLoader.load("/environmentMaps/field.hdr", (environmentMap) => {
  environmentMap.mapping = THREE.EquirectangularReflectionMapping;
  // scene.background = environmentMap;
  scene.environment = environmentMap;
});

// Load Wall Textures (to change with)
const textureLoader = new THREE.TextureLoader();
let wallMesh = null;
let currentTextureIndex = 0;
const TOTAL_BOOKS = 10;
const textureCache = [];

for (let i = 0; i < TOTAL_BOOKS; i++) {
  textureCache.push(
    textureLoader.load(`/models/textures/wall/wall${i}.png`, (tex) => {
      tex.flipY = false;
      tex.wrapS = THREE.RepeatWrapping;
      tex.wrapT = THREE.RepeatWrapping;
      tex.colorSpace = THREE.SRGBColorSpace;
    })
  );
}

// Load GLTF
const gltfLoader = new GLTFLoader();
gltfLoader.load(
  "/models/proj_0617.gltf",
  (gltf) => {
    // console.log("success");
    gltf.scene.rotateX(-0.08);
    scene.add(gltf.scene);
    // console.log(gltf.scene.children);
    gltf.scene.children[1].visible = false;
    // console.log(gltf.scene.children);

    scene.traverse(function (child) {
      if (child.isMesh && child.name === "Wallback") {
        wallMesh = child;
        wallMesh.material.metalness = 1;
        wallMesh.material.roughness = 1;
        wallMesh.material.normalScale.set(5, 5); //Strength
        // GUI
        const wallFolder = gui.addFolder("Wall Material");
        wallFolder.add(wallMesh.material, "metalness", 0, 1, 0.01);
        wallFolder.add(wallMesh.material, "roughness", 0, 1, 0.01);
        wallFolder
          .add(wallMesh.material.normalScale, "x", 0, 5, 0.1)
          .name("normal strength")
          .onChange((v) => wallMesh.material.normalScale.set(v, v));
      }
      if (child.isMesh && child.name === "Wallwood") {
        child.material.metalness = 0.8;
        child.material.roughness = 1;
        child.material.normalScale.set(3, 3);

        const woodFolder = gui.addFolder("Wood Material");
        woodFolder.add(child.material, "metalness", 0, 1, 0.01);
        woodFolder.add(child.material, "roughness", 0, 1, 0.01);
        woodFolder
          .add(child.material.normalScale, "x", 0, 5, 0.1)
          .name("normal strength")
          .onChange((v) => child.material.normalScale.set(v, v));
      }

      if (child.isMesh && child.name === "WallLamp_2") {
        child.material.emissive.set("#f0e3b2");
        // gui.addColor({ color: "#f0e3b2" }, "color").onChange((c) => {
        //   child.material.emissive.set(c);
        // });
      }
      if (child.isMesh && child.name === "LampEmmisive") {
        child.material.emissive.set("#f0e3b2");
      }
      if (child.isMesh && child.name === "LampGold") {
        child.material.color.set("#fbbf6a");
        gui
          .addColor(
            { color: `#${child.material.color.getHexString()}` },
            "color"
          )
          .name("Gold color")
          .onChange((c) => {
            child.material.color.set(c);
          });
      }
    });
  },
  (progress) => {
    console.log("progress");
    console.log(progress);
  },
  (error) => {
    console.log("error");
    console.log(error);
  }
);

let mixer = null;
let BOOK_START_POS = { x: -8.86, y: -6.6, z: -0.2 };

let bookSideMesh = null;
const bookFrontCache = [];
const bookSideCache = [];

for (let i = 0; i < TOTAL_BOOKS; i++) {
  bookFrontCache.push(
    textureLoader.load(`/models/textures/book/front${i}.png`, (tex) => {
      tex.flipY = false;
      tex.colorSpace = THREE.SRGBColorSpace;
    })
  );
  bookSideCache.push(
    textureLoader.load(`/models/textures/book/side${i}.png`, (tex) => {
      tex.flipY = false;
      tex.colorSpace = THREE.SRGBColorSpace;
    })
  );
}

gltfLoader.load(
  "/models/book2.gltf",
  (gltf) => {
    // console.log("success");
    // gltf.scene.children[0].scale.y = 1.7;
    const baseBook = gltf.scene;
    baseBook.rotateX(Math.PI / 2 - 0.3);
    baseBook.scale.z = 0.9;
    // baseBook.rotateZ(-0.1);

    // baseBook.rotateZ(-Math.PI / 2);
    baseBook.position.set(-8.86, -6.6, -0.2);

    baseBook.traverse(function (child) {
      if (child.name === "pageFront") child.visible = false;
      if (child.name === "pageBack") child.visible = false;
    });
    // scene.add(baseBook);

    for (let i = 0; i < 4; i++) {
      const book = SkeletonUtils.clone(baseBook);
      book.position.set(-8.4 + 4.2 * i, -7.4, -3);
      book.traverse((child) => {
        if (child.isMesh) {
          if (child.isMesh && child.name === "bookCover_1") {
            //bookSideMat
            child.material = child.material.clone();
            child.material.map = bookSideCache[i % TOTAL_BOOKS];
            child.material.needsUpdate = true;
          }
          if (child.isMesh && child.name === "bookCover_3") {
            //bookFrontMat
            child.material = child.material.clone();
            child.material.map = bookFrontCache[i % TOTAL_BOOKS];
            child.material.needsUpdate = true;
          }
        }
      });
      scene.add(book);
    }
    for (let i = 0; i < 4; i++) {
      const book = SkeletonUtils.clone(baseBook);
      book.position.set(-8.4 + 4.2 * i, -14.9, -1.4);
      book.traverse((child) => {
        if (child.isMesh) {
          if (child.isMesh && child.name === "bookCover_1") {
            //bookSideMat
            child.material = child.material.clone();
            child.material.map = bookSideCache[(i + 4) % TOTAL_BOOKS];
            child.material.needsUpdate = true;
          }
          if (child.isMesh && child.name === "bookCover_3") {
            //bookFrontMat
            child.material = child.material.clone();
            child.material.map = bookFrontCache[(i + 4) % TOTAL_BOOKS];
            child.material.needsUpdate = true;
          }
        }
      });
      scene.add(book);
    }

    // const bookCoverGroup =

    // GUI
    const bookFolder = gui.addFolder("Book");
    // bookFolder.add(baseBook.position, "x", -12, -3, 0.01);
    // bookFolder.add(baseBook.position, "y", -20, -12, 0.01);
    // bookFolder.add(gltf.scene.position, "z", -2, 4, 0.01);
    // bookFolder.add(baseBook.scale, "y", 1, 3, 0.1).name("thickness");

    // console.log(baseBook.children); // 1,1,1

    // bookFolder
    //   .add(baseBook.material, "metalness", 0, 1, 0.01)
    //   .onChange((v) => {
    //     scene.traverse(function (child) {
    //       if (child.isMesh && child.name === "bookCover_3") {
    //     child.material.metalness = v;}
    //   });
    // bookFolder
    //   .add(child.material, "roughness", 0, 1, 0.01)
    //   .onChange((v) => {
    //     bookSideMesh.material.roughness = v;
    //   });
    // bookFolder
    //   .add(child.material.normalScale, "x", 0, 8, 0.1)
    //   .name("normal strength")
    //   .onChange((v) => {
    //     child.material.normalScale.set(v, v);
    //     bookSideMesh.material.normalScale.set(v, v);
    //   });
    //   }
    // });
    // BookOpenAnimation
    mixer = new THREE.AnimationMixer(gltf.scene);
    const action = mixer.clipAction(gltf.animations[0]);
    // action.play();
  },
  (progress) => {
    console.log("progress");
    console.log(progress);
  },
  (error) => {
    console.log("error");
    console.log(error);
  }
);

// Change Wall Texture on Event
function wallChangeEvent(event) {
  // console.log(wallMesh);
  if (!wallMesh) return;
  currentTextureIndex = (currentTextureIndex + 1) % (TOTAL_BOOKS + 1);
  wallMesh.material.map = textureCache[currentTextureIndex];
  wallMesh.material.needsUpdate = true;
  console.log(`Switched to: wall${currentTextureIndex}.png`);
}
window.addEventListener("keydown", wallChangeEvent);

// Camera
const camera = new THREE.PerspectiveCamera(50, sizes.width / sizes.height);
camera.position.z = 37.7;
camera.position.y = -8.4;
// camera.lookAt(new THREE.Vector3(0, 0, 0));
// camera.lookAt(mesh.position);
scene.add(camera);

// Lights
// color , intensity, width , height
const rectAreaLight = new THREE.RectAreaLight(0xffc900, 6, 12, 12);
rectAreaLight.position.set(0, -3, 30);
rectAreaLight.lookAt(new THREE.Vector3(0, -10, 30));
// rectAreaLight.rotation.x = -0.4;
// scene.add(rectAreaLight);
const rectAreaLightHelper = new RectAreaLightHelper(rectAreaLight);
// scene.add(rectAreaLightHelper);

//Color, Intensity, Distancnpme, decay
const pointLight1 = new THREE.PointLight(0xff9000, 15, 0, 0.5);
pointLight1.position.set(9.6, -9.4, 2.6);
pointLight1.scale.setY(8);
scene.add(pointLight1);
const pointLightHelper1 = new THREE.PointLightHelper(pointLight1, 0.8);
scene.add(pointLightHelper1);

const pointLight2 = new THREE.PointLight(0xff9000, 15, 0, 0.5);
pointLight2.position.set(-9.6, -9.4, 2.6);
pointLight2.scale.setY(8);
scene.add(pointLight2);
const pointLightHelper2 = new THREE.PointLightHelper(pointLight2, 0.8);
scene.add(pointLightHelper2);

const pointFolder = gui.addFolder("Point Lights (Lamp)");
pointFolder
  .add(pointLight1.position, "y", -10, 4, 0.1)
  .onChange((val) => (pointLight2.position.y = val));
pointFolder.add(pointLight1, "intensity", 5, 25, 1).onChange((val) => {
  pointLight2.intensity = val;
});
pointFolder.add(pointLight1, "decay", 0, 2, 0.05).onChange((val) => {
  pointLight2.decay = val;
});
pointFolder
  .addColor({ color: `#${pointLight1.color.getHexString()}` }, "color")
  .onChange((c) => {
    pointLight1.color.set(c);
    pointLight2.color.set(c);
  });

// Renderer
const renderer = new THREE.WebGLRenderer({
  canvas: canvas,
  antialias: true,
});
renderer.setSize(sizes.width, sizes.height);

const controls = new OrbitControls(camera, canvas);
controls.target.y = -12;
controls.enableDamping = true;

// Animation
const clock = new THREE.Clock();
let previousTime = 0;

// ---- GSAP
// gsap.to(mesh.position, { duration: 1, delay: 1, x: 2 });
// gsap.to(mesh.position, { duration: 1, delay: 2, x: 0 });

const tick = () => {
  const elapsedTime = clock.getElapsedTime();
  const deltaTime = elapsedTime - previousTime;
  previousTime = elapsedTime;

  // Model animtaion
  if (mixer) {
    mixer.update(deltaTime);
  }

  // Raycaster
  raycaster.setFromCamera(mouse, camera);
  // const objectsToTest = [object1, object2, object3];
  // const intersects = raycaster.intersectObjects(objectsToTest);

  // for (const intersect of intersects) {
  //   intersect.object.material.color.set("#0000ff");
  // }

  // for (const object of objectsToTest) {
  //   if (!intersects.find((intersect) => intersect.object === object)) {
  //     object.material.color.set("#ff0000");
  //   }
  // }

  // camera.position.y = Math.sin(elapsedTime);
  // camera.lookAt(mesh.position);
  // camera.lookAt(new THREE.Vector3(0, -12, 0));

  // console.log("tick");
  // Update controls
  controls.update();
  // Render
  renderer.render(scene, camera);
  // JS will call it on the next frame
  window.requestAnimationFrame(tick);
  stats.update();
};
tick();

// Resize Window Event
window.addEventListener("resize", () => {
  // Update sizes
  sizes.width = window.innerWidth;
  sizes.height = window.innerHeight;
  // Update camera
  camera.aspect = sizes.width / sizes.height;
  camera.updateProjectionMatrix();
  // Update renderer
  renderer.setSize(sizes.width, sizes.height);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
});

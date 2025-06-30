// import "./style.css";
import * as THREE from "three";
import gsap from "gsap";
import GUI from "lil-gui";
import Stats from "three/addons/libs/stats.module.js";

import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { EXRLoader } from "three/addons/loaders/EXRLoader.js";

//GUI and Stats
const gui = new GUI();
gui.close();
document.body.appendChild(gui.domElement);
const stats = new Stats();
document.body.appendChild(stats.dom);

// Canvas & Mouse
const canvas = document.querySelector("canvas.webgl");
const sizes = {
  width: window.innerWidth,
  height: window.innerHeight,
};

const mouse = { x: 0, y: 0 };
window.addEventListener("mousemove", (event) => {
  mouse.x = (event.clientX / sizes.width) * 2 - 1;
  mouse.y = -(event.clientY / sizes.height) * 2 + 1;
  // console.log(mouse);
});

// Scene
const scene = new THREE.Scene();
scene.background = new THREE.Color(0xffffff);
// AxesHelper
const axesHelper = new THREE.AxesHelper(30); //size
scene.add(axesHelper);

// Load Environment Map
new EXRLoader().load("environmentMaps/interior.exr", function (texture) {
  texture.mapping = THREE.EquirectangularReflectionMapping;
  scene.environment = texture;
  scene.environmentIntensity = 0.644;
  scene.environmentRotation.y = 4.8;
  const envFolder = gui.addFolder("Environment");
  envFolder.add(scene, "environmentIntensity", 0, 1, 0.001).name("Intensity");
  envFolder.add(scene.environmentRotation, "y", 4, 6.5, 0.001).name("Rotation");
});

// Load Book Model and Textures
const gltfLoader = new GLTFLoader();
const textureLoader = new THREE.TextureLoader();

const TOTAL_BOOKS = 10;
const NUM_BOOKS = 40;
const BOOK_GAP_X = 1.2;
let bookCoverMat = null;
let objectsToTest = [];

// Load GLTF
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
  "/models/book_NoBone2.gltf",
  (gltf) => {
    // console.log("success");
    const baseBook = gltf.scene;
    baseBook.rotateX(Math.PI / 2);
    baseBook.rotateZ(-Math.PI / 2);
    baseBook.position.set(-7, 0, 0);

    baseBook.traverse(function (child) {
      if (child.isMesh && child.name === "bookFront") {
        child.material.metalness = 0.36;
        child.material.roughness = 0.61;
        child.material.normalScale.set(2.2, 2.2);
      }
      if (child.isMesh && child.name === "bookSide") {
        child.material.metalness = 0.36;
        child.material.roughness = 0.61;
        child.material.normalScale.set(2.2, 2.2);

        //GUI
        bookCoverMat = child.material;
        // const bookFolder = gui.addFolder("Book");
        // bookFolder.add(bookCoverMat, "metalness", 0, 1, 0.001).onChange((v) => {
        //   scene.traverse(function (child) {
        //     if (child.isMesh && child.name === "bookFront") {
        //       child.material.metalness = v;
        //     }
        //     if (child.isMesh && child.name === "bookSide") {
        //       child.material.metalness = v;
        //     }
        //   });
        // });
        // bookFolder.add(bookCoverMat, "roughness", 0, 1, 0.001).onChange((v) => {
        //   scene.traverse(function (child) {
        //     if (child.isMesh && child.name === "bookFront") {
        //       child.material.roughness = v;
        //     }
        //     if (child.isMesh && child.name === "bookSide") {
        //       child.material.roughness = v;
        //     }
        //   });
        // });
        // bookFolder
        //   .add(bookCoverMat.normalScale, "x", 0, 8, 0.01)
        //   .name("normal strength")
        //   .onChange((v) => {
        //     scene.traverse(function (child) {
        //       if (child.isMesh && child.name === "bookFront") {
        //         child.material.normalScale.set(v, v);
        //       }
        //       if (child.isMesh && child.name === "bookSide") {
        //         child.material.normalScale.set(v, v);
        //       }
        //     });
        //   });
      }
    });
    // scene.add(baseBook);

    for (let i = 0; i < NUM_BOOKS; i++) {
      const book = baseBook.clone(true);
      book.position.set(0.1 + BOOK_GAP_X * i, 0, 0);
      book.traverse((child) => {
        if (child.isMesh) {
          if (child.isMesh && child.name === "bookSide") {
            //bookSideMat
            child.material = child.material.clone();
            child.material.map = bookSideCache[i % TOTAL_BOOKS];
            child.material.needsUpdate = true;
            objectsToTest.push(child);
          }
          if (child.isMesh && child.name === "bookFront") {
            //bookFrontMat
            child.material = child.material.clone();
            child.material.map = bookFrontCache[i % TOTAL_BOOKS];
            child.material.needsUpdate = true;
          }
        }
      });
      scene.add(book);
    }
    // const offsetFolder = gui.addFolder("Target Offset");
    // offsetFolder
    //   .add(objectsToTest[2].parent.parent.position, "x", -0.6, 3, 0.001)
    //   .name("Offset X");
    // offsetFolder
    //   .add(objectsToTest[2].parent.parent.position, "z", -2, 0, 0.001)
    //   .name("Offset Y");
  },
  (progress) => {
    console.log("progress", progress);
  },
  (error) => {
    console.log("error", error);
  }
);

// Camera & Controls
const camera = new THREE.PerspectiveCamera(45, sizes.width / sizes.height);
camera.position.z = 11;
camera.position.y = 1;

// const controls = new OrbitControls(camera, canvas);
// controls.target.y = camera.position.y;
// controls.enableDamping = true;
// controls.enableZoom = false;
// controls.enablePan = false;
// controls.minPolarAngle = Math.PI / 2;
// controls.maxPolarAngle = Math.PI / 2;
// controls.enabled = false;
// controls.update();

// gui.add(camera.position, "y", 0, 1, 0.01).onChange((v) => {
//   controls.target.y = v;
// });
// camera.rotateY(Math.PI / 2);
// camera.lookAt(new THREE.Vector3(0, 0, 0));
// camera.lookAt(mesh.position);
scene.add(camera);
// gui.add(camera.position, "z", 0, 30, 0.5);

// Lights
// const ambLight = new THREE.AmbientLight(0x404040, 100); // soft white light
// scene.add(ambLight);

// Renderer
const renderer = new THREE.WebGLRenderer({
  canvas: canvas,
  antialias: true,
});
renderer.setSize(sizes.width, sizes.height);

// Animation
const clock = new THREE.Clock();
let previousTime = 0;

// Raycaster
const raycaster = new THREE.Raycaster();
let currentIntersect = null;

let prevIndex = null;
const BOOK_SHIFT_DURATION = 0.7;
const BOOK_SHIFT_X = 4;
const BOOK_TARGET_OFFSET_X = 0.6;
const BOOK_TARGET_OFFSET_Z = -0.2;
const BOOK_EMPTY_X = 1.9173; //1.9172899723052979

const BOOK_ENTER_DURATION = 2;

// Events

let targetBook;
let isMouseOnTarget = false;
let isInfoPageActive = false;

window.addEventListener("click", () => {
  if (isMouseOnTarget) {
    // const fovRad = (45 * Math.PI) / 180;
    // const visibleHeight = 2 * Math.tan(fovRad / 2) * 11; //9.11269837220809
    const visibleWidth = 9.11 * (canvas.width / canvas.height);
    const bookWidthPx = canvas.height * 0.45 * 0.5;
    const bookWorldWidth = (bookWidthPx / canvas.width) * visibleWidth;
    const infoScreenHTML = document.getElementById("book-info-screen");

    if (!isInfoPageActive) {
      console.log("✅ Clicked on target book");
      // enter Book Detail Page
      // 모바일 일 시 :         x: targetBook.position.x + bookWorldWidth,
      gsap.to(camera.position, {
        duration: BOOK_ENTER_DURATION,
        x: targetBook.position.x + bookWorldWidth + visibleWidth / 4,
        y: -11,
      });
      gsap.to(
        targetBook.position,
        {
          duration: BOOK_ENTER_DURATION,
          y: -11,
        },
        "<"
      );
      gsap.to(
        targetBook.children[0].rotation,
        {
          duration: BOOK_ENTER_DURATION,
          z: Math.PI * 2,
          // ease: "power2.out",
        },
        "<"
      );
      // controls.target.x = targetBook.position.x + bookWorldWidth + visibleWidth / 4;
      // controls.target.y = -11;

      // controls.enabled = true;
      isInfoPageActive = true;

      setTimeout(() => {
        infoScreenHTML.style.animation = `fadeIn ${BOOK_ENTER_DURATION}s ease forwards`;
      }, 400);
    } else {
      infoScreenHTML.style.animation = `fadeOut 1s ease forwards`;

      gsap.to(camera.position, {
        duration: BOOK_ENTER_DURATION,
        x: targetBook.position.x + bookWorldWidth,
        y: 1,
      });
      gsap.to(
        targetBook.position,
        {
          duration: BOOK_ENTER_DURATION,
          y: 0,
        },
        "<"
      );
      gsap.to(
        targetBook.children[0].rotation,
        {
          duration: BOOK_ENTER_DURATION,
          z: 0,
          onStart: function () {
            console.log("DISABLE raycaster");
            raycaster.layers.disableAll();
          },
          onComplete: function () {
            setTimeout(() => {
              console.log("ENABLE raycaster");
              raycaster.layers.enableAll();
            }, 400);
          },
        },
        "<"
      );
      isInfoPageActive = false;
      // controls.enabled = false;
    }
    //
  }
});

const scrollIndicator = document.getElementById("scroll-indicator");
const clickIndicator = document.getElementById("click-indicator");
let idleTimeout;

function showAndHideIndicator(a, b) {
  a.style.animation = "fadeOut 0.6s ease forwards";
  setTimeout(() => {
    a.style.display = "none";
    b.style.display = "block";
    b.style.animation = "fadeIn 2s ease forwards";
    // setTimeout(() => {
    //   // fadeIn 완료 후 blink 재시작
    //   b.style.animation = "blinkOpacity 3s ease-in-out infinite";
    // }, 2000); // fadeIn duration
  }, 1000);
}

addEventListener("wheel", (event) => {
  // console.log(event.deltaX, event.deltaY);
  if (!isInfoPageActive) {
    camera.position.x += event.deltaY * 0.01;
    // console.log(camera.position.x);
    const title = document.getElementById("main-title");
    title.style.left = `${20 - (camera.position.x / 7.25) * 850}px`;
    if (camera.position.x > 7.25) {
      title.style.display = "none";
    } else {
      title.style.display = "flex";
    }

    scrollIndicator.style.animation = "fadeOut 0.6s ease forwards";

    clearTimeout(idleTimeout);
    idleTimeout = setTimeout(() => {
      scrollIndicator.style.animation = "fadeIn 2s ease forwards";
      setTimeout(() => {
        // fadeIn 완료 후 blink 재시작
        scrollIndicator.style.animation =
          "blinkOpacity 3s ease-in-out infinite";
      }, 2000); // fadeIn duration
    }, 1000);
  }
  // if (event.deltaY > 2) {
  //   indicator.style.opacity = "0";
  //   indicator.style.transform = "translateY(10px)";
  // }
  // } else {
  //   indicator.style.opacity = "0.8";
  //   indicator.style.transform = "translateY(0)";
  // }
});

const tick = () => {
  const elapsedTime = clock.getElapsedTime();
  const deltaTime = elapsedTime - previousTime;
  previousTime = elapsedTime;

  // Raycaster
  raycaster.setFromCamera(mouse, camera);
  const intersects = raycaster.intersectObjects(objectsToTest);
  if (targetBook) {
    // targetBook.children[2] //bookfront mesh
    // console.log(targetBook);
    targetBook.traverse(function (child) {
      if (child.isMesh && child.name === "bookFront") {
        isMouseOnTarget = raycaster.intersectObject(child).length > 0;
      }
    });
    // isMouseOnTarget =
    //   raycaster.intersectObject(targetBook.children[0].children[2]).length > 0;
    // console.log(isMouseOnTarget);

    if (isMouseOnTarget) {
      document.body.style.cursor = "pointer";
    } else {
      document.body.style.cursor = "default";
    }
  } else {
    // clickIndicator.style.animation = "fadeOut 0.3s ease forwards";
    // setTimeout(() => {
    //   clickIndicator.style.display = "none";
    //   scrollIndicator.style.display = "block";
    //   scrollIndicator.style.animation = "fadeIn 0.3s ease forwards";
    // }, 300);
  }

  if (intersects.length) {
    // console.log("mouse enter");
    let newIndex = objectsToTest.indexOf(intersects[0].object);
    // scrollIndicator.style.animation = "fadeOut 0.3s ease forwards";
    // setTimeout(() => {
    //   scrollIndicator.style.display = "none";
    //   clickIndicator.style.display = "block";
    //   clickIndicator.style.animation = "fadeIn 0.3s ease forwards";
    // }, 350);

    if (!currentIntersect && prevIndex !== newIndex) {
      // Target book Front cover animation (transform position and rotation)
      targetBook = intersects[0].object.parent.parent;

      // console.log(targetBook.parent);

      gsap.to(targetBook.position, {
        duration: BOOK_SHIFT_DURATION,
        // x: targetBook.position.x + BOOK_TARGET_OFFSET_X,
        z: BOOK_TARGET_OFFSET_Z,
        onStart: function () {
          console.log("DISABLE raycaster");
          raycaster.layers.disableAll();
        },
      });
      // console.log(targetBook.children[0].position.x);
      gsap.to(
        targetBook.children[0].position,
        {
          duration: BOOK_SHIFT_DURATION,
          x: BOOK_EMPTY_X + BOOK_TARGET_OFFSET_X,
        },
        "<"
      );

      gsap.to(
        targetBook.rotation,
        {
          duration: BOOK_SHIFT_DURATION,
          z: 0,
          onStart: function () {
            // Reset last target's transform to original (position and rotation)
            if (prevIndex !== null) {
              let lastTargetBook = objectsToTest[prevIndex].parent.parent;

              gsap.to(
                lastTargetBook.rotation,
                {
                  duration: BOOK_SHIFT_DURATION,
                  z: -Math.PI / 2,
                },
                "<"
              );
              gsap.to(
                lastTargetBook.position,
                {
                  duration: BOOK_SHIFT_DURATION,
                  z: 0,
                },
                "<"
              );
              gsap.to(
                lastTargetBook.children[0].position,
                {
                  duration: BOOK_SHIFT_DURATION,
                  x: BOOK_EMPTY_X,
                },
                "<"
              );
            }
            // Shift books
            if (prevIndex === null) {
              // No previous target exists
              for (let i = newIndex + 1; i < NUM_BOOKS; i++) {
                gsap.to(objectsToTest[i].parent.parent.position, {
                  duration: BOOK_SHIFT_DURATION,
                  x: objectsToTest[i].parent.parent.position.x + BOOK_SHIFT_X,
                });
              }
            } else {
              // New target is from left-hand side of last target
              if (newIndex < prevIndex) {
                for (let i = newIndex + 1; i < prevIndex + 1; i++) {
                  gsap.to(objectsToTest[i].parent.parent.position, {
                    duration: BOOK_SHIFT_DURATION,
                    x: objectsToTest[i].parent.parent.position.x + BOOK_SHIFT_X,
                  });
                }
              }
              // New target is from right-hand side of last target
              if (newIndex > prevIndex) {
                for (let i = prevIndex + 1; i < newIndex + 1; i++) {
                  gsap.to(objectsToTest[i].parent.parent.position, {
                    duration: BOOK_SHIFT_DURATION,
                    x: objectsToTest[i].parent.parent.position.x - BOOK_SHIFT_X,
                  });
                }
              }
            }
            prevIndex = newIndex;
            // To be deleted (just for unselected book color reset)
            // for (const object of objectsToTest) {
            //   if (
            //     !intersects.find((intersect) => intersect.object === object)
            //   ) {
            //     object.material.color.set("#ffffff");
            //   }
            // }
          },
          onComplete: function () {
            console.log("ENABLE raycaster");
            raycaster.layers.enableAll();
          },
        },
        "<"
      );
    }
    currentIntersect = intersects[0];
  } else {
    if (currentIntersect) {
      console.log("mouse leave");
      clickIndicator.style.animation = "fadeOut 0.3s ease forwards";
      setTimeout(() => {
        clickIndicator.style.display = "none";
        scrollIndicator.style.display = "block";
        scrollIndicator.style.animation = "fadeIn 0.3s ease forwards";
      }, 300);
    }
    currentIntersect = null;
  }

  // To be deleted (just for selected book coloring red)
  // for (const intersect of intersects) {
  //   intersect.object.material.color.set("#ff0000");
  // }

  // console.log("tick");

  // Update controls
  // if (isInfoPageActive) controls.update();

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
  if (isInfoPageActive) {
    const visibleWidth = 9.11 * (canvas.width / canvas.height);
    const bookWidthPx = canvas.height * 0.45 * 0.5;
    const bookWorldWidth = (bookWidthPx / canvas.width) * visibleWidth;
    camera.position.x =
      targetBook.position.x + bookWorldWidth + visibleWidth / 4;
  }
  camera.aspect = sizes.width / sizes.height;
  camera.updateProjectionMatrix();
  // Update renderer
  renderer.setSize(sizes.width, sizes.height);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
});

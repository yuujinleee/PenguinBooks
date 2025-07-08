// ObjectControls.js
import * as THREE from "three";

export class ObjectControls {
  constructor({
    object,
    camera,
    domElement,
    orbitControl = null,
    dampingFactor = 0.1,
    maxRotationX = Math.PI / 2,
    minRotationX = -Math.PI / 2,
    enableXRotation = true,
    enableYRotation = true,
  }) {
    this.object = object;
    this.camera = camera;
    this.domElement = domElement;
    this.orbitControl = orbitControl;

    this.dampingFactor = dampingFactor;
    this.maxRotationX = maxRotationX;
    this.minRotationX = minRotationX;
    this.enableXRotation = enableXRotation;
    this.enableYRotation = enableYRotation;

    this.isRotating = false;
    this.initialTouch = { x: 0, y: 0 };
    this.startRotation = new THREE.Euler();
    this.targetRotation = new THREE.Euler();

    this.pointer = new THREE.Vector2();
    this.raycaster = new THREE.Raycaster();

    this.addListeners();
  }

  isPointerOnObject(x, y) {
    const rect = this.domElement.getBoundingClientRect();
    this.pointer.x = ((x - rect.left) / rect.width) * 2 - 1;
    this.pointer.y = -((y - rect.top) / rect.height) * 2 + 1;

    this.raycaster.setFromCamera(this.pointer, this.camera);
    const intersects = this.raycaster.intersectObject(this.object, true);
    return intersects.length > 0;
  }

  handleStart(x, y) {
    if (!this.isPointerOnObject(x, y)) return;

    this.isRotating = true;
    this.initialTouch = { x, y };
    this.startRotation.copy(this.object.rotation);

    if (this.orbitControl) this.orbitControl.enabled = false;
    this.domElement.style.cursor = "grabbing";
  }

  handleMove(x, y) {
    if (!this.isRotating) return;

    const dx = x - this.initialTouch.x;
    const dy = y - this.initialTouch.y;

    const newX = this.enableXRotation
      ? this.startRotation.x + dy * 0.01
      : this.object.rotation.x;
    const newY = this.enableYRotation
      ? this.startRotation.y + dx * 0.01
      : this.object.rotation.y;

    this.targetRotation.set(newX, newY, 0);
  }

  handleEnd() {
    this.isRotating = false;
    if (this.orbitControl) this.orbitControl.enabled = true;
    this.domElement.style.cursor = "default";
  }

  update() {
    if (!this.object) return;

    const current = this.object.rotation;
    const target = this.targetRotation;

    const clampedX = THREE.MathUtils.clamp(
      target.x,
      this.minRotationX,
      this.maxRotationX
    );

    if (this.enableXRotation) {
      current.x = THREE.MathUtils.lerp(current.x, clampedX, this.dampingFactor);
    }
    if (this.enableYRotation) {
      current.y = THREE.MathUtils.lerp(current.y, target.y, this.dampingFactor);
    }
  }

  addListeners() {
    this.domElement.addEventListener("mousedown", (e) =>
      this.handleStart(e.clientX, e.clientY)
    );
    this.domElement.addEventListener("mousemove", (e) =>
      this.handleMove(e.clientX, e.clientY)
    );
    this.domElement.addEventListener("mouseup", () => this.handleEnd());

    this.domElement.addEventListener(
      "touchstart",
      (e) => {
        if (e.touches.length === 1) {
          e.preventDefault();
          this.handleStart(e.touches[0].clientX, e.touches[0].clientY);
        }
      },
      { passive: false }
    );
    this.domElement.addEventListener(
      "touchmove",
      (e) => {
        if (e.touches.length === 1) {
          e.preventDefault();
          this.handleMove(e.touches[0].clientX, e.touches[0].clientY);
        }
      },
      { passive: false }
    );
    this.domElement.addEventListener("touchend", () => this.handleEnd());
  }
}

import { Component } from "sevejs";
import { gsap } from "gsap";
import * as THREE from "three";
import { DRACOLoader } from "three/examples/jsm/loaders/DRACOLoader.js";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";

type SceneAction = "init" | "pending" | "action" | "none";
const Webgl = class extends Component {
  constructor(opts: any) {
    super(opts);
    this.scene = null;
    this.camera = null;
  }

  init() {
    //TODO: GZIP ThreeJS
    //TODO: parallax fx mousemove

    // automatically called at start
    console.log("Webgl component init");

    /**
     * Scene
     */
    // Sizes
    const sizes = {
      width: window.innerWidth,
      height: window.innerHeight,
    };
    // Canvas
    this.DOM.canvas = this.DOM.el.querySelector("#webgl-bg");
    const scene = new THREE.Scene();

    // Start of the code
    THREE.ColorManagement.enabled = false;

    /**
     * Camera
     */
    // Base camera
    this.camera = new THREE.PerspectiveCamera(50, sizes.width / sizes.height, 0.1, 100);
    this.camera.position.z = 4.2;
    this.camera.position.y = 1.1;
    scene.add(this.camera);

    /**
     * Renderer
     */
    this.renderer = new THREE.WebGLRenderer({
      canvas: this.DOM.canvas,
      alpha: true,
    });
    this.renderer.outputColorSpace = THREE.LinearSRGBColorSpace;
    this.renderer.setSize(sizes.width, sizes.height);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    /**
     * Models
     */
    const dracoLoader = new DRACOLoader();
    dracoLoader.setDecoderPath("/models/dracos/");
    const gltfLoader = new GLTFLoader();
    gltfLoader.setDRACOLoader(dracoLoader);
    gltfLoader.load("/models/gnochess-7.gltf", (gltf) => {
      this.model = gltf.scene;

      this.model.scale.set(0.4, 0.4, 0.4);
      this.model.position.set(1.15, -0.4, 0);
      this.model.rotation.y = Math.PI * 1.63;

      this.king = this.model.children.find((child: { name: string }) => child.name === "King_light");
      this.queen = this.model.children.find((child: { name: string }) => child.name === "Queen_light");
      this.rook = this.model.children.find((child: { name: string }) => child.name === "Rook_light_1");
      this.knight = this.model.children.find((child: { name: string }) => child.name === "Knight_light_2");
      this.bishop = this.model.children.find((child: { name: string }) => child.name === "Bishop_light_2");

      this.king.position.set(this.king.position.x + 3.5, this.king.position.y + 2.5, this.king.position.z + 2.9);
      this.king.rotation.x = Math.PI * 0.35;
      this.king.rotation.z = Math.PI * -0.1;

      this.queen.position.set(this.queen.position.x + 6.2, this.queen.position.y + 2.6, this.queen.position.z + 2.4);
      this.queen.rotation.x = Math.PI * 0.1;
      this.queen.rotation.z = Math.PI * -0.2;

      this.rook.position.set(this.rook.position.x + 2, this.rook.position.y + 3, this.rook.position.z);
      this.rook.rotation.x = Math.PI * 0;
      this.rook.rotation.z = Math.PI * 0.2;

      this.knight.position.set(this.knight.position.x + 4, this.knight.position.y + 5, this.knight.position.z + 1.55);
      this.knight.rotation.x = Math.PI * -0.1;
      this.knight.rotation.z = Math.PI * 0.3;

      this.bishop.position.set(this.bishop.position.x + 4, this.bishop.position.y + 4, this.bishop.position.z + 2);
      this.bishop.rotation.x = Math.PI * -0.05;
      this.bishop.rotation.z = Math.PI * -0.1;

      scene.add(this.model);

      this.move1TL = gsap
        .timeline({ paused: true })
        .to(this.model.rotation, { y: this.model.rotation.y + 1 })
        .to(this.model.position, { x: -1.5 }, 0);

      this.move2TL = gsap
        .timeline({ paused: true })
        .to(this.queen.position, { x: this.queen.position.x - 6.2, y: this.queen.position.y - 2.6, z: this.queen.position.z - 2.4, duration: 1.2 })
        .to(this.queen.rotation, { x: 0, y: 0, z: 0, duration: 1.2 }, "<")
        .to(this.king.position, { x: this.king.position.x - 3.5, y: this.king.position.y - 2.5, z: this.king.position.z - 2.9, duration: 1.4 }, "<")
        .to(this.king.rotation, { x: 0, y: 0, z: 0, duration: 1.4 }, "<")
        .to(this.knight.position, { x: this.knight.position.x - 4, y: this.knight.position.y - 5, z: this.knight.position.z - 1.55, duration: 1.1 }, "<")
        .to(this.knight.rotation, { x: 0, y: 0, z: 0, duration: 1.1 }, "<")
        .to(this.bishop.position, { x: this.bishop.position.x - 4, y: this.bishop.position.y - 4, z: this.bishop.position.z - 2, duration: 1.5 }, "<")
        .to(this.bishop.rotation, { x: 0, y: 0, z: 0, duration: 1.5 }, "<")
        .to(this.rook.position, { x: this.rook.position.x - 2, y: this.rook.position.y - 3, duration: 1 }, "<")
        .to(this.rook.rotation, { x: 0, y: 0, z: 0, duration: 1 }, "<");

      this.move3TL = gsap.timeline({ paused: true }).to(this.model.rotation, { y: this.model.rotation.y + 1.4 });

      if (this.status !== "none") {
        this.appear();
        this.moveScene();
      }
    });

    /**
     * Lights
     */
    const ambientLight = new THREE.AmbientLight(0xffffff, 3);
    scene.add(ambientLight);
    const directionalLight = new THREE.DirectionalLight(0xffffff, 1.8);
    directionalLight.castShadow = true;
    directionalLight.shadow.mapSize.set(1024, 1024);
    directionalLight.shadow.camera.far = 15;
    directionalLight.shadow.camera.left = -7;
    directionalLight.shadow.camera.top = 7;
    directionalLight.shadow.camera.right = 7;
    directionalLight.shadow.camera.bottom = -7;
    directionalLight.position.set(-3, 6, 0);
    scene.add(directionalLight);

    /**
     * Animate
     */
    const tick = () => {
      this.renderer.render(scene, this.camera);

      window.requestAnimationFrame(tick);
    };
    tick();
  }

  changeStatus(status: SceneAction) {
    this.status = status;
  }

  moveScene() {
    if (this.model) {
      if (this.status === "init") {
        this.move1TL.reverse();
        this.move2TL.timeScale(2);
        this.move2TL.reverse();
      } else if (this.status === "pending") {
        this.move1TL.play();
      } else if (this.status === "action") {
        this.move2TL.timeScale(1);
        this.move2TL.play();
      } else if (this.status === "none") {
        return;
      }
    }
  }

  appear() {
    gsap.to(this.DOM.canvas, { autoAlpha: 1 });
    this.move1TL.reverse();
  }
  disappear(immediate = false) {
    if (this.model && !immediate) this.move3TL.play();
    return gsap.to(this.DOM.canvas, { autoAlpha: 0 });
  }

  resize() {
    const sizes = {
      width: window.innerWidth,
      height: window.innerHeight,
    };

    this.camera.aspect = sizes.width / sizes.height;
    this.camera.updateProjectionMatrix();

    this.renderer.setSize(sizes.width, sizes.height);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  }

  destroy() {
    //TODO: dispose scene / materials / geometries
    //TODO: stop animation
    //TODO: remove objects
  }
};

export { Webgl };

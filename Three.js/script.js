import { OrbitControls } from "./OrbitControls.js";
import { GLTFLoader } from "https://cdn.jsdelivr.net/npm/three@0.121.1/examples/jsm/loaders/GLTFLoader.js";

//**Vector */

class Vector {
  constructor(x, y, z) {
    this.x = x;
    this.y = y;
    this.z = z;
  }
  add(other_vector) {
    return new Vector(
      this.x + other_vector.x,
      this.y + other_vector.y,
      this.z + other_vector.z
    );
  }
  scaler(sc) {
    return new Vector(this.x * sc, this.y * sc, this.z * sc);
  }
  normal() {
    return Math.sqrt(this.x * this.x + this.y * this.y + this.z * this.z);
  }
}

/**Physics */
class Rocket {
  constructor(
    position,
    velocity = new Vector(0, 0, 0),
    acc = new Vector(0, 0, 0),
    rocket_mass = 1,
    gravity = 1,
    thrust = 1,
    drag_coefficient = 0.5,
    total_force = new Vector(0, 0, 0),
    rho = 1.2,
    fuel_mass = 1,
    fuel_loss_rate = 1,
    total_mass = rocket_mass + fuel_mass,
    radius = 1
  ) {
    this.position = position;
    this.velocity = velocity;
    this.acc = acc;
    this.rocket_mass = rocket_mass;
    this.gravity = gravity;
    this.thrust = thrust;
    this.drag_coefficient = drag_coefficient;
    this.rho = rho;
    this.total_force = total_force;
    this.fuel_mass = fuel_mass;
    this.fuel_loss_rate = fuel_loss_rate;
    this.total_mass = total_mass;
    this.radius = radius;
  }

  update(deltaTime) {
    let velocity = 1;
    if (this.fuel_mass > 0) {
      this.total_force = this.total_force.add(new Vector(0, this.thrust, 0));
      this.fuel_mass -= this.fuel_loss_rate / 60;
    }
    if (this.fuel_mass > 0) {
      this.total_mass = this.rocket_mass + this.fuel_mass;
    } else {
      this.total_mass = this.rocket_mass;
    }

    this.total_force = this.total_force.add(
      new Vector(0, -this.total_mass * this.gravity, 0)
    );
    let drag =
      (-1 / 2) *
      this.drag_coefficient *
      this.rho *
      this.radius *
      this.radius *
      Math.PI *
      velocity *
      velocity;

    this.total_force = this.total_force.add(new Vector(0, drag, 0));

    this.acc = this.total_force.scaler(1 / this.total_mass);

    this.position.x += (this.velocity.x * deltaTime * 1) / 60;
    this.position.y += (this.velocity.y * deltaTime * 1) / 60;
    this.position.z += (this.velocity.z * deltaTime * 1) / 60;

    this.velocity.x += this.acc.x * deltaTime;
    this.velocity.y += this.acc.y * deltaTime;
    this.velocity.z += this.acc.z * deltaTime;
  }
}
/**Texturers */
const textureLoader = new THREE.TextureLoader();
const texture = textureLoader.load("./9.png");
const moontexture = textureLoader.load("./6.png");

//**Debug UI */

const gui = new dat.GUI({ width: 300 });

const parameters = {
  rest: () => {
    location.reload();
  },
  launchRocket: false,
  color: 0x373948,
};
gui.addColor(parameters, "color").onChange(() => {
  material.color.set(parameters.color);
});

/**Cursor */

const cursor = {
  x: 0,
  y: 0,
};
window.addEventListener("mousemove", (event) => {
  cursor.x = event.clientX / sizes.width - 0.5;
  cursor.y = -(event.clientY / sizes.height - 0.5);
});

/**Canvas */
const canvas = document.querySelector("canvas.webgl");

/**Sizes */
const sizes = {
  width: window.innerWidth,
  height: window.innerHeight,
};

window.addEventListener("resize", () => {
  //Update Sizes
  sizes.width = window.innerWidth;
  sizes.height = window.innerHeight;

  //Update Camera
  camera.aspect = sizes.width / sizes.height;
  camera.updateProjectionMatrix();

  //Update Renderer
  renderer.setSize(sizes.width, sizes.height);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
});

window.addEventListener("dblclick", () => {
  if (!document.fullscreenElement) {
    canvas.requestFullscreen();
  } else {
    document.exitFullscreen();
  }
});

/**Scene */
const scene = new THREE.Scene();

//Model

// const gltfLoader = new GLTFLoader();
// console.log(gltfLoader);

// let mixer = null;
// let model = null;

// gltfLoader.load("CesiumMilkTruck.gltf", (gltf) => {
//   console.log(gltf);

//   model = gltf;
//   mixer = new THREE.AnimationMixer(model.scene);
//   const action = mixer.clipAction(model.animations[0]);

//   action.play();

//   model.scene.position.set(0, 0, -15);
//   scene.add(model.scene);
// });

/**Moon */

const moonGeometry = new THREE.CircleBufferGeometry(4, 1000);
const moonMaterial = new THREE.MeshBasicMaterial({
  transparent: true,
  alphaMap: moontexture,
});

const moon = new THREE.Mesh(moonGeometry, moonMaterial);
moon.position.y = 20;
moon.position.z = -50;
moon.rotation.z = -Math.PI * 0.4;
scene.add(moon);

/**Stars */

const particlesGeometry = new THREE.BufferGeometry();
const count = 2000;
const position = new Float32Array(count * 3);
const colors = new Float32Array(count * 3);
for (let i = 1; i < count * 3; i++) {
  position[i] = (Math.random() - 0.5) * 2000;
  colors[i] = Math.random();
}

particlesGeometry.setAttribute(
  "position",
  new THREE.BufferAttribute(position, 3)
);

particlesGeometry.setAttribute("color", new THREE.BufferAttribute(colors, 3));

const particlesMaterial = new THREE.PointsMaterial();
particlesMaterial.size = 7;
particlesMaterial.sizeAttenuation = true;
particlesMaterial.transparent = true;
particlesMaterial.alphaMap = texture;
particlesMaterial.depthWrite = false;
particlesMaterial.vertexColors = true;

const particles = new THREE.Points(particlesGeometry, particlesMaterial);
scene.add(particles);

/**Rocket Group */

const group = new THREE.Group();
scene.add(group);

const group1 = new THREE.Group();
scene.add(group1);

const cylinder = new THREE.Mesh(
  new THREE.CylinderBufferGeometry(0.5, 0.5, 2.5),
  new THREE.MeshStandardMaterial({ color: "brown" })
);
cylinder.position.y = 1.4;
cylinder.material.metalness = 0.5;
cylinder.material.roughness = 0.5;
cylinder.castShadow = true;
group.add(cylinder);

const cone = new THREE.Mesh(
  new THREE.ConeBufferGeometry(0.5, 1),
  new THREE.MeshStandardMaterial({ color: "#564981" })
);
cone.position.y = 3.15;
cone.material.metalness = 0.4;
cone.material.roughness = 0.4;
cone.castShadow = true;
group.add(cone);

const nozzle = new THREE.Mesh(
  new THREE.ConeBufferGeometry(0.4, 1, 8, 1, true),
  new THREE.MeshStandardMaterial({ color: "#444444" })
);
nozzle.position.y = 0.5;
nozzle.position.x = 0;
nozzle.position.z = 0;
nozzle.material.side = THREE.DoubleSide;
nozzle.material.metalness = 0.5;
nozzle.material.roughness = 0.5;
nozzle.castShadow = true;
group.add(nozzle);

const circle = new THREE.Mesh(
  new THREE.CircleGeometry(0.15, 6),
  new THREE.MeshBasicMaterial({ color: 0xcccccc })
);
circle.position.y = 2.2;
circle.material.side = THREE.DoubleSide;
circle.material.metalness = 0.9;
circle.material.roughness = 0.2;
circle.position.z = 0.5;
group.add(circle);

const circle1 = new THREE.Mesh(
  new THREE.CircleGeometry(0.4, 8),
  new THREE.MeshBasicMaterial({ color: 0x444444 })
);
circle1.rotation.x = Math.PI * 0.5;
circle1.material.side = THREE.DoubleSide;
group.add(circle1);

const wing = new THREE.Mesh(
  new THREE.BoxBufferGeometry(0.4, 0.9, 0.1),
  new THREE.MeshStandardMaterial({ color: "#9988ee" })
);
wing.position.x = 0.4;
wing.position.y = 0.7;
wing.rotation.z = 0.3;
wing.material.metalness = 0.5;
wing.castShadow = true;
wing.material.roughness = 0.5;
group.add(wing);

const wing1 = new THREE.Mesh(
  new THREE.BoxBufferGeometry(0.4, 0.9, 0.1),
  new THREE.MeshStandardMaterial({ color: "#9988ee" })
);
wing1.position.x = -0.4;
wing1.position.y = 0.7;
wing1.rotation.z = -0.3;
wing1.material.metalness = 0.5;
wing1.material.roughness = 0.5;
wing1.castShadow = true;
group.add(wing1);

const window1 = new THREE.Mesh(
  new THREE.TorusBufferGeometry(0.15, 0.02),
  new THREE.MeshStandardMaterial({ color: "#bbbbbb" })
);
window1.position.x = 0;
window1.position.z = 0.5;
window1.position.y = 2.2;
window1.material.metalness = 0.5;
window1.material.roughness = 0.5;
group.add(window1);

const rect1 = new THREE.Mesh(
  new THREE.BoxBufferGeometry(0.2, 1.3, 0.2),
  new THREE.MeshStandardMaterial({ color: "gray" })
);
rect1.position.x = 0.6;
rect1.position.y = 0.6;
rect1.rotation.z = 0.3;
rect1.material.metalness = 0.4;
rect1.castShadow = true;
rect1.material.roughness = 0.4;

group1.add(rect1);

const rect2 = new THREE.Mesh(
  new THREE.BoxBufferGeometry(0.2, 1.3, 0.2),
  new THREE.MeshStandardMaterial({ color: "gray" })
);
rect2.position.x = -0.6;
rect2.position.y = 0.6;
rect2.rotation.z = -0.3;
rect2.material.metalness = 0.4;
rect2.material.roughness = 0.4;
rect2.castShadow = true;

group1.add(rect2);

const rect3 = new THREE.Mesh(
  new THREE.BoxBufferGeometry(0.2, 1.3, 0.2),
  new THREE.MeshStandardMaterial({ color: "gray" })
);
rect3.position.z = -0.6;
rect3.position.y = 0.6;
rect3.rotation.x = 0.3;
rect3.material.metalness = 0.4;
rect3.castShadow = true;
rect3.material.roughness = 0.4;
group1.add(rect3);

const rect4 = new THREE.Mesh(
  new THREE.BoxBufferGeometry(0.2, 1.3, 0.2),
  new THREE.MeshStandardMaterial({ color: "gray" })
);
rect4.position.z = 0.6;
rect4.position.y = 0.6;
rect4.rotation.x = -0.3;
rect4.material.metalness = 0.4;
rect4.material.roughness = 0.4;
rect4.castShadow = true;
group1.add(rect4);
group1.position.y = 0.3;

const cylinder2 = new THREE.Mesh(
  new THREE.CylinderBufferGeometry(1.5, 1.5, 0.2),
  new THREE.MeshStandardMaterial({ color: "grey" })
);
cylinder2.material.metalness = 0.4;
cylinder2.material.roughness = 0.4;
cylinder2.position.y = 0.3;
cylinder2.receiveShadow = true;
scene.add(cylinder2);

/**3D Objects Plane */

const material = new THREE.MeshStandardMaterial({ color: "#373948" });

const plane = new THREE.Mesh(new THREE.PlaneBufferGeometry(15, 15), material);
plane.rotation.x = -Math.PI * 0.5;
plane.position.y = 0.2;
plane.receiveShadow = true;
scene.add(plane);

group.position.y = 0.4;
group.rotation.y = Math.PI * 0.3;

/**Light */
const ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
scene.add(ambientLight);

const pointLight = new THREE.PointLight(0xffffff, 0.4);
pointLight.position.x = 2;
pointLight.position.y = 3;
pointLight.position.z = 4;
scene.add(pointLight);

const moonpointLight = new THREE.PointLight(0xffffff, 0.4);
moonpointLight.position.y = 20;
moonpointLight.position.x = 2;
moonpointLight.position.z = -50;
moonpointLight.castShadow = true;
moonpointLight.shadow.mapSize.width = 1024;
moonpointLight.shadow.mapSize.height = 1024;
scene.add(moonpointLight);

const directionalLight = new THREE.DirectionalLight(0xffffff, 0.4);
directionalLight.position.set(0, 2, 3);
scene.add(directionalLight);
directionalLight.shadow.mapSize.width = 1024;
directionalLight.shadow.mapSize.height = 1024;

/**Camera */

const camera = new THREE.PerspectiveCamera(75, sizes.width / sizes.height);
camera.position.x = 2;
camera.position.y = 1;
camera.position.z = 6;
scene.add(camera);

/**Renderer */
const renderer = new THREE.WebGLRenderer({
  canvas: canvas,
});
renderer.setSize(sizes.width, sizes.height);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.shadowMap.enabled = true;

/**Controls */

const controls = new OrbitControls(camera, canvas);
controls.enableDamping = true;

/**Clock */
const clock = new THREE.Clock();

let oldElapsedTime = 0;

/**Create an Object */
const rocket = new Rocket(group.position);

/**Debug */

gui.add(parameters, "launchRocket").name("Launch");
gui.add(parameters, "rest").name("Restart");
gui
  .add(rocket, "rocket_mass")
  .min(0)
  .max(1000000)
  .step(0.01)
  .name("Rocket_Mass");
gui.add(rocket, "gravity").min(0).max(10).step(0.01).name("Gravity");
gui.add(rocket, "thrust").min(0).max(10000000).step(0.01).name("Thrust");
gui.add(rocket, "fuel_mass").min(0).max(10000000).step(0.01).name("Fuel_Mass");
gui
  .add(rocket, "fuel_loss_rate")
  .min(0)
  .max(10000000)
  .step(0.01)
  .name("Fuel_Loss_Rate");
gui.add(rocket, "radius").min(0).max(1000).step(0.01).name("Radius");

let zz = -15;

const tick = () => {
  const elapsedTime = clock.getElapsedTime();

  const deltaTime = elapsedTime - oldElapsedTime;

  if (mixer !== null) {
    mixer.update(deltaTime);
    model.scene.position.set(0, 0, zz);
  }
  zz = zz + 0.1;
  if (parameters.launchRocket) {
    rocket.update(deltaTime);
    if (group.position.y < 0.4) {
      group.position.y = 0.4;
      rocket.velocity.y = 0;
      rocket.acc.y = 0;
      parameters.launchRocket = false;
    }
    //             if (rocket.fuel_mass < 0) {
    // group.rotation.z += 0.001
    // group.position.x -= 0.001 }
  }

  group.position.x = rocket.position.x;
  group.position.y = rocket.position.y;
  group.position.z = rocket.position.z;

  oldElapsedTime = elapsedTime;

  // console.log("Rocket Position:" + rocket.position.y)
  // console.log("Rocket Velocity:" + rocket.velocity.y)
  // console.log("Rocket Acc:" + rocket.acc.y)

  //Update Controls
  //   camera.position.y = group.position.y;

  //Renderer
  renderer.render(scene, camera);

  //Call tick again on the next frame
  window.requestAnimationFrame(tick);
};
tick();

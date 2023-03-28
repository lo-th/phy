function _applyBoxUV(geom, transformMatrix, bbox, bbox_max_size) {

  let coords = [];
  coords.length = 2 * geom.attributes.position.array.length / 3;

  // geom.removeAttribute('uv');
  if (geom.attributes.uv === undefined) {
    geom.addAttribute('uv', new THREE.Float32BufferAttribute(coords, 2));
  }
  
  //maps 3 verts of 1 face on the better side of the cube
  //side of the cube can be XY, XZ or YZ
  let makeUVs = function(v0, v1, v2) {

    //pre-rotate the model so that cube sides match world axis
    v0.applyMatrix4(transformMatrix);
    v1.applyMatrix4(transformMatrix);
    v2.applyMatrix4(transformMatrix);

    //get normal of the face, to know into which cube side it maps better
    let n = new THREE.Vector3();
    n.crossVectors(v1.clone().sub(v0), v1.clone().sub(v2)).normalize();

    n.x = Math.abs(n.x);
    n.y = Math.abs(n.y);
    n.z = Math.abs(n.z);

    let uv0 = new THREE.Vector2();
    let uv1 = new THREE.Vector2();
    let uv2 = new THREE.Vector2();
    // xz mapping
    if (n.y > n.x && n.y > n.z) {
      uv0.x = (v0.x - bbox.min.x) / bbox_max_size;
      uv0.y = (bbox.max.z - v0.z) / bbox_max_size;

      uv1.x = (v1.x - bbox.min.x) / bbox_max_size;
      uv1.y = (bbox.max.z - v1.z) / bbox_max_size;

      uv2.x = (v2.x - bbox.min.x) / bbox_max_size;
      uv2.y = (bbox.max.z - v2.z) / bbox_max_size;
    } else
    if (n.x > n.y && n.x > n.z) {
      uv0.x = (v0.z - bbox.min.z) / bbox_max_size;
      uv0.y = (v0.y - bbox.min.y) / bbox_max_size;

      uv1.x = (v1.z - bbox.min.z) / bbox_max_size;
      uv1.y = (v1.y - bbox.min.y) / bbox_max_size;

      uv2.x = (v2.z - bbox.min.z) / bbox_max_size;
      uv2.y = (v2.y - bbox.min.y) / bbox_max_size;
    } else
    if (n.z > n.y && n.z > n.x) {
      uv0.x = (v0.x - bbox.min.x) / bbox_max_size;
      uv0.y = (v0.y - bbox.min.y) / bbox_max_size;

      uv1.x = (v1.x - bbox.min.x) / bbox_max_size;
      uv1.y = (v1.y - bbox.min.y) / bbox_max_size;

      uv2.x = (v2.x - bbox.min.x) / bbox_max_size;
      uv2.y = (v2.y - bbox.min.y) / bbox_max_size;
    }

    return {
      uv0: uv0,
      uv1: uv1,
      uv2: uv2
    };
  };

  if (geom.index) { // is it indexed buffer geometry?
    for (let vi = 0; vi < geom.index.array.length; vi += 3) {
      let idx0 = geom.index.array[vi];
      let idx1 = geom.index.array[vi + 1];
      let idx2 = geom.index.array[vi + 2];

      let vx0 = geom.attributes.position.array[3 * idx0];
      let vy0 = geom.attributes.position.array[3 * idx0 + 1];
      let vz0 = geom.attributes.position.array[3 * idx0 + 2];

      let vx1 = geom.attributes.position.array[3 * idx1];
      let vy1 = geom.attributes.position.array[3 * idx1 + 1];
      let vz1 = geom.attributes.position.array[3 * idx1 + 2];

      let vx2 = geom.attributes.position.array[3 * idx2];
      let vy2 = geom.attributes.position.array[3 * idx2 + 1];
      let vz2 = geom.attributes.position.array[3 * idx2 + 2];

      let v0 = new THREE.Vector3(vx0, vy0, vz0);
      let v1 = new THREE.Vector3(vx1, vy1, vz1);
      let v2 = new THREE.Vector3(vx2, vy2, vz2);

      let uvs = makeUVs(v0, v1, v2, coords);

      coords[2 * idx0] = uvs.uv0.x;
      coords[2 * idx0 + 1] = uvs.uv0.y;

      coords[2 * idx1] = uvs.uv1.x;
      coords[2 * idx1 + 1] = uvs.uv1.y;

      coords[2 * idx2] = uvs.uv2.x;
      coords[2 * idx2 + 1] = uvs.uv2.y;
    }
  } else {
    for (let vi = 0; vi < geom.attributes.position.array.length; vi += 9) {
      let vx0 = geom.attributes.position.array[vi];
      let vy0 = geom.attributes.position.array[vi + 1];
      let vz0 = geom.attributes.position.array[vi + 2];

      let vx1 = geom.attributes.position.array[vi + 3];
      let vy1 = geom.attributes.position.array[vi + 4];
      let vz1 = geom.attributes.position.array[vi + 5];

      let vx2 = geom.attributes.position.array[vi + 6];
      let vy2 = geom.attributes.position.array[vi + 7];
      let vz2 = geom.attributes.position.array[vi + 8];

      let v0 = new THREE.Vector3(vx0, vy0, vz0);
      let v1 = new THREE.Vector3(vx1, vy1, vz1);
      let v2 = new THREE.Vector3(vx2, vy2, vz2);

      let uvs = makeUVs(v0, v1, v2, coords);

      let idx0 = vi / 3;
      let idx1 = idx0 + 1;
      let idx2 = idx0 + 2;

      coords[2 * idx0] = uvs.uv0.x;
      coords[2 * idx0 + 1] = uvs.uv0.y;

      coords[2 * idx1] = uvs.uv1.x;
      coords[2 * idx1 + 1] = uvs.uv1.y;

      coords[2 * idx2] = uvs.uv2.x;
      coords[2 * idx2 + 1] = uvs.uv2.y;
    }
  }

  geom.attributes.uv.array = new Float32Array(coords);
}

function applyBoxUV(bufferGeometry, transformMatrix, boxSize) {

  if (transformMatrix === undefined) {
    transformMatrix = new THREE.Matrix4();
  }

  if (boxSize === undefined) {
    let geom = bufferGeometry;
    geom.computeBoundingBox();
    let bbox = geom.boundingBox;

    let bbox_size_x = bbox.max.x - bbox.min.x;
    let bbox_size_z = bbox.max.z - bbox.min.z;
    let bbox_size_y = bbox.max.y - bbox.min.y;

    boxSize = Math.max(bbox_size_x, bbox_size_y, bbox_size_z);
  }

  let uvBbox = new THREE.Box3(new THREE.Vector3(-boxSize / 2, -boxSize / 2, -boxSize / 2), new THREE.Vector3(boxSize / 2, boxSize / 2, boxSize / 2));

  _applyBoxUV(bufferGeometry, transformMatrix, uvBbox, boxSize);

}

// Example starts here

let renderer;
let camera;
let controls;

let scene = new THREE.Scene();
camera = new THREE.PerspectiveCamera(54, window.innerWidth / window.innerHeight, 0.1, 1000);

renderer = new THREE.WebGLRenderer({
  antialias: true
});
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(2);
renderer.setClearColor(new THREE.Color(0xfefefe));
document.body.appendChild(renderer.domElement);

camera.position.x = 10;
camera.position.y = 0.5;
camera.position.z = 0.5;
camera.lookAt(0, 0, 0);

controls = new THREE.OrbitControls(camera, renderer.domElement);

// white spotlight shining from the side, casting a shadow
let spotLight = new THREE.SpotLight(0xffffff, 2.5, 25, Math.PI / 6);
spotLight.position.set(9, 10, 1);
scene.add(spotLight);

let gridHelper = new THREE.GridHelper(4, 4);
scene.add(gridHelper);

var bufferGeometry = new THREE.BufferGeometry().fromGeometry( new THREE.DodecahedronGeometry(2.5, 0) );
let material = new THREE.MeshPhongMaterial({
  color: 0x10f0f0,
  map: new THREE.TextureLoader().load( 'https://i.ibb.co/5sP6r6N/checker-2048.png' ),
  transparent: true,
  opacity: 0.5
});

bufferGeometry.computeBoundingBox();
let bboxSize = bufferGeometry.boundingBox.getSize();
let uvMapSize = Math.min(bboxSize.x, bboxSize.y, bboxSize.z);

material.map.wrapS = THREE.RepeatWrapping;
material.map.wrapT = THREE.RepeatWrapping;

let dMaterial = material.clone();
dMaterial.opacity = 1;
let dodecahedron = new THREE.Mesh(bufferGeometry, dMaterial);
scene.add(dodecahedron);

let boxGeometry = new THREE.BoxBufferGeometry(uvMapSize, uvMapSize, uvMapSize);
let cube = new THREE.Mesh(boxGeometry, material);
scene.add(cube);

let textureAngle = 0.0;
let animate = function() {
  requestAnimationFrame(animate);
  
  cube.rotation.x += 0.001;
  
  applyBoxUV(bufferGeometry, new THREE.Matrix4().getInverse(cube.matrix), uvMapSize);
  bufferGeometry.attributes.uv.needsUpdate = true;
  
  controls.update();
  renderer.render(scene, camera);
};

animate();
<template>
</template>

<script lang="ts" setup>
import {
  Scene, Group, AmbientLight, DirectionalLight, PerspectiveCamera, Mesh, ExtrudeGeometry, WebGLRenderer, AxesHelper,
  MeshLambertMaterial, Color, Shape, Vector3
} from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { data } from "@/assets/map/china";
import { throttle } from "@/utils/dpm";
import {onMounted} from "vue";

const scene:any = new Scene();
const box:any = new Group();
scene.add(box);
scene.background = new Color( 0x111111 );
let camera:any = null;
let renderer:any = null;
let controls:any = null;

// 鼠标控制器
const initControls = () => {
  controls = new OrbitControls(camera, renderer.domElement);
  controls.update();
  controls.target = new Vector3(100,0,0);
  controls.addEventListener('change',throttle(() => {
    console.log(333);
  }, 300))
};

const init = () => {
  camera = new PerspectiveCamera(75, window.innerWidth / window.innerHeight, 1, 500);
  camera.position.set(110, 45, 10);
  const light = new DirectionalLight( 0xffffff);
  light.position.set( 0, 0, 1 );
  light.castShadow = true;
  scene.add(new AmbientLight( 0xdddddd ), light);
  scene.add(new AxesHelper(5000));

  renderer = new WebGLRenderer({ alpha: true, antialias:true });
  renderer.shadowMap.enabled = true;
  renderer.setSize(window.innerWidth, window.innerHeight);
  let canvas = document.getElementsByTagName('canvas');
  if (canvas.length) document.body.removeChild(canvas[0]);
  document.body.appendChild(renderer.domElement);
}

const randomColor = () => {
  const str = '0123456789abcdef';
  let col = '#';
  for (var i = 0; i < 6; i++){
    const index = Math.floor(Math.random() * 15);
    col += str[index];
  }
  return col;
}

const drawMap = () => {
  data.features.forEach(it => {
    if (it.properties.name) {
      const array = it.geometry.coordinates[0][0];
      var shape = new Shape();
      shape.autoClose = true;
      array.forEach((t, i) => {
        if (!i) {
          shape.moveTo(t[0],t[1]);
        } else {
          shape.lineTo(t[0],t[1]);
        }
      })
      const geometry = new ExtrudeGeometry(shape, {depth: 0.3, bevelEnabled: false});
      var material = new MeshLambertMaterial({color: randomColor()});
      const mesh = new Mesh(geometry,material);
      box.add(mesh);
    }
  })

}

const animate = () => {
  requestAnimationFrame(animate);
  camera.updateProjectionMatrix();
  controls.update();
  renderer.render(scene, camera);
}

onMounted(() => {
  init();
  initControls();
  drawMap();
  animate();
})
</script>

<style lang="stylus" scoped>

</style>

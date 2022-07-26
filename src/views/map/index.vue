<template>
  <Tips :tips="tips" ref="tipsRef" />
</template>

<script lang="ts" setup>
import {
  Scene, Group, AmbientLight, DirectionalLight, PerspectiveCamera, Mesh, ExtrudeGeometry, WebGLRenderer, AxesHelper,
  MeshLambertMaterial, Color, Shape, Vector3, Box3, Raycaster, Vector2
} from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { data as cq_land } from "@/assets/map/cq.js";
import { data as cq_build } from "@/assets/map/cq_build";
import { data as cq_river } from "@/assets/map/cq_river";
import { data as cq_road } from "@/assets/map/cq_road";
import { throttle, randomColor, drawLine, createText } from "@/utils/dpm";
import {onMounted, ref, reactive} from "vue";
import Tips from '@/components/Tips.vue';

const scene:any = new Scene();
const group:any = new Group();
const mapGroup:any = new Group();
const buildGroup:any = new Group();
const riverGroup:any = new Group();
const roadGroup:any = new Group();
group.add(mapGroup, buildGroup, riverGroup, roadGroup);
scene.add(group);
scene.background = new Color( 0x111111 );
let camera:any = null;
let renderer:any = null;
let controls:any = null;
let raycaster:any = null;
let mouse:any = null;
let interSected:any = null;
let tipsRef:any = ref()
let tips:any = ref();
let mousePosition:any = reactive({x: 0, y: 0});

// 鼠标控制器
const initControls = () => {
  controls = new OrbitControls(camera, renderer.domElement);
  controls.update();
  controls.target = new Vector3(0,0,0);
  controls.addEventListener('change',throttle(() => {
    console.log(camera.position);
  }, 300))
};

const init = () => {
  // 相机
  camera = new PerspectiveCamera(75, window.innerWidth / window.innerHeight, 1, 5000);
  camera.position.set(0, 0, 200);
  // 灯光
  const light = new DirectionalLight( 0xffffff);
  light.position.set( 0, 0, 1 );
  light.castShadow = true;
  scene.add(new AmbientLight( 0xdddddd ), light);
  scene.add(new AxesHelper(5000));
  // 渲染器
  renderer = new WebGLRenderer({ alpha: true, antialias:true });
  renderer.shadowMap.enabled = true;
  renderer.setSize(window.innerWidth, window.innerHeight);
  let canvas = document.getElementsByTagName('canvas');
  if (canvas.length) document.body.removeChild(canvas[0]);
  document.body.appendChild(renderer.domElement);
}


// 绘制建筑物
const drawBuild = (data, color) => {
  data.features.forEach(it => {
    const array = it.geometry.coordinates[0][0];
    const shape = new Shape();
    shape.autoClose = true;
    array.forEach((t, i) => {
      if (!i) {
        shape.moveTo(t[0] * 1000,t[1] * 1000);
      } else {
        shape.lineTo(t[0] * 1000,t[1] * 1000);
      }
    })
    const depth = Number(Math.random().toFixed(2));
    const geometry = new ExtrudeGeometry(shape, {depth, bevelEnabled: false});
    const material = new MeshLambertMaterial({color});
    const mesh = new Mesh(geometry,material);
    mesh.userData = it.properties;
    buildGroup.add(mesh)
  })
}

// 绘制地图
const drawMap = (data, color) => {
  data.features.forEach(it => {
    if (!it.properties.name) return;
    const array = it.geometry.coordinates[0][0];
    const shape = new Shape();
    shape.autoClose = true;
    array.forEach((t, i) => {
      if (!i) {
        shape.moveTo(t[0] * 1000,t[1] * 1000);
      } else {
        shape.lineTo(t[0] * 1000,t[1] * 1000);
      }
    })
    const depth = Number(Math.random().toFixed(2));
    const geometry = new ExtrudeGeometry(shape, {depth: 0.0001, bevelEnabled: false});
    const material = new MeshLambertMaterial({color});
    const mesh = new Mesh(geometry,material);
    mesh.userData = it.properties;
    mapGroup.add(mesh);
  })
}

// 绘制河流湖泊
const drawRiver = (data, color) => {
  data.features.forEach((it, i) => {
    const array = it.geometry.coordinates[0][0];
    const shape = new Shape();
    shape.autoClose = true;
    array.forEach((t, i) => {
      if (!i) {
        shape.moveTo(t[0] * 1000,t[1] * 1000);
      } else {
        shape.lineTo(t[0] * 1000,t[1] * 1000);
      }
    })
    // if (it.properties.name) {
    //   createText({
    //     font: it.properties.name,
    //     size: 2,
    //     height: 0.3,
    //     x: array[0][0] * 1000,
    //     y: array[0][1] * 1000,
    //     z: 0.1,
    //     color: '#ff0000',
    //   }, (text) => {
    //     riverGroup.add(text);
    //   })
    // }
    const depth = Number(Math.random().toFixed(2));
    const geometry = new ExtrudeGeometry(shape, {depth: 0.01, bevelEnabled: false});
    const material = new MeshLambertMaterial({color});
    const mesh = new Mesh(geometry,material);
    mesh.userData = it.properties;
    riverGroup.add(mesh);
  })
}

// 绘制地图轮廓线
const drawMapLine = (data, color) => {
  data.features.forEach(it => {
    if (!it.properties.name) return;
    const arrayList = it.geometry.coordinates[0][0];
    const array:number[] = [];
    arrayList.forEach((t, i) => {
      array.push(t[0] * 1000, t[1] *1000, 0.02)
    })
    array.push(arrayList[0][0] * 1000,arrayList[0][1] * 1000,0.02)
    const mesh = drawLine(array, color);
    mesh.userData = it.properties;
    mapGroup.add(mesh)
  })
}

// 绘制道路
const drawRoad = (data, color) => {
  data.features.forEach(it => {
    // if (!it.properties.name) return;
    const arrayList = it.geometry.coordinates[0];
    console.log(arrayList);
    const array:number[] = [];
    arrayList.forEach((t, i) => {
      array.push(t[0] * 1000, t[1] *1000, 0.02)
    })
    const mesh = drawLine(array, color);
    mesh.userData = it.properties;
    roadGroup.add(mesh)
  })
}

// 移入、点击事件
const initEvent = () => {
  raycaster = new Raycaster();
  mouse = new Vector2();
  const onDocumnetMouseMove = (event) => {
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
    mousePosition = {x: event.clientX, y:event.clientY}
  }
  document.addEventListener('mousemove', onDocumnetMouseMove, false)
};

const animate = (event?) => {
  requestAnimationFrame(animate);
  camera.updateProjectionMatrix();
  controls.update();
  renderer.render(scene, camera);
  raycaster.setFromCamera(mouse, camera);
  let intersects = raycaster.intersectObject(group);
  const tipsEl = tipsRef.value ? tipsRef.value.$el : null
  if (intersects.length) {
    if(interSected){
      if(interSected != intersects[0].object){
        // 原选择物颜色恢复
        interSected.material.color.setHex(interSected.currentHex);
        // 重新定义选择物
        interSected = intersects[0].object;
        const {name} = interSected.userData;
        tips.value = name;
        interSected.currentHex = interSected.material.color.getHex();
        interSected.material.color.set('#00c4ff');
      } else {
        const {name} = interSected.userData;
        if (name && tipsEl) {
          tipsEl.style.left = mousePosition.x + 12 + 'px';
          tipsEl.style.top = mousePosition.y + 12 + 'px';
        } else {
          if (tipsEl) tipsEl.style.display = 'none'
        }
      }
    } else {
      interSected = intersects[0].object;
      const {name} = interSected.userData;
      if (name && tipsEl) {
        tipsEl.style.display = 'block'
        tipsEl.style.left = mousePosition.x + 12 + 'px';
        tipsEl.style.top = mousePosition.y + 12 + 'px';
        tips.value = name
      }
      interSected.currentHex = interSected.material.color.getHex();
      interSected.material.color.set('#00c4ff');
    }
  } else {
    if(interSected){
      interSected.material.color.set(interSected.currentHex);
    }
    if (tipsEl) tipsEl.style.display = 'none'
    interSected = null;
  }
}

onMounted(() => {
  init();
  initControls();
  initEvent();
  // 绘制平面地图
  drawMap(cq_land, '#6c6c6c');
  drawRiver(cq_river, '#075272');
  // 绘制地图轮廓线
  drawMapLine(cq_land, '#777777');
  // 绘制建筑物
  drawBuild(cq_build, '#666666');
  // 绘制建筑物
  drawRoad(cq_road, '#ffffff');
  // 将物体移动到中标中心
  let boxInfo = new Box3().setFromObject(group);
  // group.rotateX(-Math.PI / 2);
  group.translateX(-(boxInfo.min.x + boxInfo.max.x) / 2);
  group.translateY(-(boxInfo.min.y + boxInfo.max.y) / 2);

  animate();
})
</script>

<style lang="stylus" scoped>

</style>

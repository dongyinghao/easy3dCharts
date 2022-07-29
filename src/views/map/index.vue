<template>
  <Tips :tips="tips" ref="tipsRef" />
</template>

<script lang="ts" setup>
import {
  Scene, Group, AmbientLight, DirectionalLight, PerspectiveCamera, Mesh, ExtrudeGeometry, WebGLRenderer, AxesHelper,
  MeshStandardMaterial, MeshLambertMaterial, Color, Shape, Vector3, Box3, Raycaster, Vector2, SpotLight, SpotLightHelper,
  Object3D, DoubleSide, PlaneGeometry, PCFSoftShadowMap, PointLight, BoxGeometry
} from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { data as cq_land } from "@/assets/map/cq.js";
import { data as cq_build } from "@/assets/map/cq_build";
import { data as cq_river } from "@/assets/map/cq_river";
import { data as cq_road } from "@/assets/map/cq_road";
import { throttle, randomColor, drawLine, createText } from "@/utils/dpm";
import {onMounted, ref, reactive} from "vue";
import Tips from '@/components/Tips.vue';
import {createSpotLight, ZoomToZ, ZtoZoom} from "@/utils/tools";

const scene:any = new Scene();
const group:any = new Group();
const mapGroup:any = new Group();
mapGroup.receiveShaow = true;
const mapLineGroup:any = new Group();
mapLineGroup.visible = false;
const buildGroup:any = new Group();
buildGroup.visible = false;
buildGroup.castShadow = true;
const riverGroup:any = new Group();
riverGroup.visible = false;
const roadGroup:any = new Group();
group.add(mapGroup, buildGroup, riverGroup, roadGroup, mapLineGroup);
scene.add(group);
scene.background = new Color( 0x111111 );
let camera:any = null;
let renderer:any = null;
let controls:any = null;
let raycaster:any = null;
let mouse:any = null;
let interSected:any = null;
let zoom:number = 2.5;
let animateFlag:boolean = false;
let tipsRef:any = ref();
let tips = ref<string>('');
let mousePosition:any = {x: 0, y: 0};

// 鼠标控制器
const initControls = () => {
  controls = new OrbitControls(camera, renderer.domElement);
  controls.update();
  controls.target = new Vector3(-1200,-620,0);
  controls.addEventListener('change',throttle(() => {
    zoom = ZoomToZ(camera.position.z);
    if (!animateFlag){
      mapLineGroup.visible = zoom < 12;
      buildGroup.visible = zoom < 8;
      riverGroup.visible = zoom < 6;
    }
  }, 300))
};

// 相机
const initCamera = () => {
  camera = new PerspectiveCamera(90, window.innerWidth / window.innerHeight, 1, 5000);
  camera.position.set(-1200, -620, 500);
  // scene.add(new AxesHelper(5000));
}

// 渲染器
const initRenderer = () => {
  renderer = new WebGLRenderer({ alpha: true, antialias:true });
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = PCFSoftShadowMap
  renderer.setSize(window.innerWidth, window.innerHeight);
  let canvas = document.getElementsByTagName('canvas');
  if (canvas.length) document.body.removeChild(canvas[0]);
  document.body.appendChild(renderer.domElement);
}

// 初始化灯光
const initLight = () => {
  // const light = new DirectionalLight( 0xffffff);
  // light.position.set( 0, 1, 1 );
  // light.castShadow = true;
  // scene.add(light);


  // 聚光灯
  const light = createSpotLight({x:-1600, y:630, z:600},{x:-1600, y:-630, z:0})
  scene.add(light, light.target, new SpotLightHelper(light));
  // 环境光
  scene.add(new PointLight(0xffffff), new AmbientLight(0Xdddddd));
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
    mesh.receiveShadow = true;
    mesh.userData = it.properties;
    mapGroup.add(mesh);
  })
}

// 绘制地图轮廓线
const drawMapLine = (data, color) => {
  data.features.forEach(it => {
    if (!it.properties.name) return;
    const arrayList = it.geometry.coordinates[0][0];
    const array:number[] = [];
    arrayList.forEach((t, i) => {
      array.push(t[0] * 1000, t[1] *1000, 0.1)
    })
    array.push(arrayList[0][0] * 1000,arrayList[0][1] * 1000,0.1)
    const mesh = drawLine(array, color);
    mesh.userData = it.properties;
    mapLineGroup.add(mesh)
  })
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
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    mesh.userData = it.properties;
    buildGroup.add(mesh)
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
      // createText({
      //   font: it.properties.name,
      //   size: 0.2,
      //   height: 0.01,
      //   x: array[0][0] * 1000,
      //   y: array[0][1] * 1000,
      //   z: 0.1,
      //   color: '#4701d2',
      // }, (text) => {
      //   riverGroup.add(text);
      // })
    // }
    const depth = Number(Math.random().toFixed(2));
    const geometry = new ExtrudeGeometry(shape, {depth: 0.01, bevelEnabled: false});
    const material = new MeshLambertMaterial({color});
    const mesh = new Mesh(geometry,material);
    mesh.userData = it.properties;
    riverGroup.add(mesh);
  })
}

// 绘制道路
const drawRoad = (data, color) => {
  data.features.forEach(it => {
    const arrayList = it.geometry.coordinates[0];
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
  const onDocumnetMouseMove = (event:MouseEvent) => {
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
    mousePosition = {x: event.clientX, y:event.clientY}
  }
  document.addEventListener('mousemove', onDocumnetMouseMove, false)
};

// 选中元素的处理
const selectedProcess = (intersects) => {
  const tipsEl = tipsRef.value ? tipsRef.value.$el : null
  if (intersects.length) {
    if (intersects[0].object.userData.adcode) {
      if(interSected) interSected.material.color.setHex(interSected.currentHex);
      return;
    }
    if(interSected){
      if(interSected != intersects[0].object){
        // 原选择物颜色恢复
        interSected.material.color.setHex(interSected.currentHex);
        // 重新定义选择物
        interSected = intersects[0].object;
        const {name} = interSected.userData;
        tips.value = name || '';
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

const animate = (event?) => {
  requestAnimationFrame(animate);
  camera.updateProjectionMatrix();
  controls.update();
  renderer.render(scene, camera);
  const z = ZtoZoom(2.5);
  // 地图动画
  if (animateFlag) {
    if (camera.position.z - z > 3) {
      camera.position.z -= (camera.position.z - z) / 30;
    } else if (camera.position.z > z) {
      camera.position.z -= 0.5;
    } else {
      animateFlag = false;
      if (zoom < 12 ) {
        mapLineGroup.visible = true;
        if (!mapLineGroup.children.length) drawMapLine(cq_land, '#666666');
      }
      if (zoom < 8 ) {
        buildGroup.visible = true;
        if (!buildGroup.children.length) if (!buildGroup.children.length) drawBuild(cq_build, '#666666');
      }
    }
  }
  // 初始化时，不应该触发选中效果
  if (mouse.x === 0 && mouse.y === 0) return;
  raycaster.setFromCamera(mouse, camera);
  let intersects = raycaster.intersectObject(group);
  selectedProcess(intersects);
}

const drawPlan = () => {
  const geometry = new PlaneGeometry( 10000, 10000 );
  const material = new MeshStandardMaterial();
  const plane = new Mesh( geometry, material );
  // plane.rotateX(-Math.PI / 2);
  plane.position.z = 5;
  plane.position.x = -1000;
  plane.position.y = -500;
  plane.castShadow = true;
  plane.receiveShadow = true;
  scene.add( plane );
}
drawPlan();

onMounted(() => {
  initCamera();
  initRenderer();
  initLight();
  initControls();
  initEvent();
  // 绘制平面地图
  drawMap(cq_land, 0xffffff);
  // drawRiver(cq_river, '#075272');
  // 绘制地图轮廓线
  // drawMapLine(cq_land, '#777777');
  // 绘制建筑物
  // drawBuild(cq_build, '#666666');
  // 绘制建筑物
  // drawRoad(cq_road, '#ffffff');
  // 将物体移动到中标中心
  let boxInfo = new Box3().setFromObject(group);
  // group.rotateX(-Math.PI / 2);
  group.translateX(-(boxInfo.min.x + boxInfo.max.x) / 2);
  group.translateY(-(boxInfo.min.y + boxInfo.max.y) / 2);
  animate();
})
</script>

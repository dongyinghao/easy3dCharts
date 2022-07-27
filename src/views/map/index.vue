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
const mapLineGroup:any = new Group();
const buildGroup:any = new Group();
const riverGroup:any = new Group();
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
let animateFlag:boolean = true;
let tipsRef:any = ref()
let tips = ref<string>('');
let mousePosition:any = {x: 0, y: 0};
const zoomMap:any = {'3': 1, '5': 2, '10': 3, '30': 4, '50': 5, '100': 6, '150': 7, '300': 8, '500': 9, '1000': 10, '1500': 11, '2000': 12, '2500': 13};

// 根据相机高度获取当前的缩放因子
const getZoomByZ = (n:number):number => {
  let prev = 1;
  for(let key in zoomMap) {
    let zoom = Number(key);
    if (n <= zoom) {
      const step = zoom - prev;
      const diff = n - prev;
      return zoomMap[zoom] + Number((diff / step).toFixed(1));
    }
    prev = zoom;
  }
  return 14
}

// 根据缩放因子获取相机高度
const getZbyZoom = (n:number):number => {
  let prev = 1;
  for(let key in zoomMap) {
    let zoom = zoomMap[key];
    if (n <= zoom) {
      const step = zoom - n;
      const diff = Number(key) - prev;
      return Number(key) - Number((diff * step).toFixed(1));
    }
    prev = Number(key);
  }
  return 14
}

// 鼠标控制器
const initControls = () => {
  controls = new OrbitControls(camera, renderer.domElement);
  controls.update();
  controls.target = new Vector3(-1470,-620,0);
  controls.addEventListener('change',throttle(() => {
    zoom = getZoomByZ(camera.position.z);
    if (zoom < 12 ) {
      mapLineGroup.visible = true;
      if (!mapLineGroup.children.length) drawMapLine(cq_land, '#666666');
    } else {
      mapLineGroup.visible = false;
    }
    if (zoom < 8 ) {
      buildGroup.visible = true;
      if (!buildGroup.children.length) if (!buildGroup.children.length) drawBuild(cq_build, '#666666');
    } else {
      buildGroup.visible = false;
    }
    console.log(camera.position);
  }, 300))
};

const init = () => {
  // 相机
  camera = new PerspectiveCamera(75, window.innerWidth / window.innerHeight, 1, 5000);
  camera.position.set(-1470, -620, 2500);
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
  const z = getZbyZoom(2.5);
  // 地图动画
  // if (animateFlag) {
  //   if (camera.position.z - z > 100) {
  //     camera.position.z -= 50
  //   } else if (camera.position.z - z > 50) {
  //     camera.position.z -= 20;
  //     if (!mapLineGroup.children.length) drawMapLine(cq_land, '#666666')
  //   } else if (camera.position.z - z > 10) {
  //     camera.position.z -= 2;
  //   } else if (camera.position.z >= z) {
  //     camera.position.z -= 1;
  //     if (!buildGroup.children.length) drawBuild(cq_build, '#666666')
  //   } else {
  //     animateFlag = false;
  //     console.log(222);
  //   }
  // }
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

onMounted(() => {
  init();
  initControls();
  initEvent();
  // 绘制平面地图
  drawMap(cq_land, '#818080');
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

<template>
  <div class="container" ref="containerRef"></div>
  <div class="tips" ref="tipsRef" v-html="tips"></div>
</template>

<script lang="ts" setup>
import { ref, onMounted } from 'vue'
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { FontLoader } from 'three/examples/jsm/loaders/FontLoader.js';
import { TextGeometry } from 'three/examples/jsm/geometries/TextGeometry.js';

interface Text {
  font: string,
  size: number,
  height: number,
  color?: string,
  y: number,
  x: number,
  z?: number,
  rotate?: number,
}
// 图表数据
const data = [
  {
    value: 12,
    label: '小明'
  },
  {
    value: 27,
    label: '小李'
  },
  {
    value: 5,
    label: '小张莫阿紫'
  },
  {
    value: 39,
    label: '小兰'
  },
  {
    value: 49,
    label: '小毛子'
  }
];
const options = {
  series: [
    {
      name: '陈紫烟',
      type: 'bar',
      data: [
        {
          value: 62,
          label: '语文'
        },
        {
          value: 97,
          label: '数学'
        },
        {
          value: 45,
          label: '英语'
        },
        {
          value: 79,
          label: '物理'
        },
        {
          value: 84,
          label: '化学'
        }
      ]
    },
    {
      name: '李阿铭',
      type: 'bar',
      data: [
        {
          value: 87,
          label: '语文'
        },
        {
          value: 81,
          label: '数学'
        },
        {
          value: 95,
          label: '英语'
        },
        {
          value: 65,
          label: '物理'
        },
        {
          value: 77,
          label: '化学'
        }
      ]
    },
  ]
}
// 鼠标相交的物体
let interSected:any = null;
// 提示框
let tipsRef:any = ref()
// 表格框
let containerRef:any = ref()
// 提示文案
let tips = ref<string>('')
// 配置信息
const barPaddingX = 5; // 单柱X方向两边空隙
const barPaddingZ = 5; // 单柱Z方向两边空隙
const barWidth = 4; // 柱子X轴长度
const barDepth = 4; // 柱子Z轴长度
const axisLengthY = 50;
// 全局变量
let scene:any = null;
let charts:any = new THREE.Group();
let camera:any = null;
let renderer:any = null;
let controls:any = null;
let raycaster:any = null;
let mouse:any = null;

// 场景
const initScene = () => {
  scene = new THREE.Scene();
  scene.background = new THREE.Color( 0x111111 );
};

// 相机
const initCamera = () => {
  camera = new THREE.PerspectiveCamera(75, containerRef.value.clientWidth / containerRef.value.clientHeight, 1, 500);
  camera.position.set(40, 20, 60);
};

// 坐标辅助线
const axisHelper = () => {
  scene.add(new THREE.AxesHelper(5000));
};

// 灯光
const initLight = () => {
  const light = new THREE.DirectionalLight( 0xffffff);
  light.position.set( 0, 0, 1 );
  // light.angle = Math.PI / 4;
  light.castShadow = true;
  scene.add(new THREE.AmbientLight( 0xdddddd ), light);
};

// 渲染器
const initRenderer = () => {
  renderer = new THREE.WebGLRenderer({ alpha: true, antialias:true });
  renderer.shadowMap.enabled = true;
  renderer.setSize(containerRef.value.clientWidth, containerRef.value.clientHeight);
  let canvas = containerRef.value.getElementsByTagName('canvas');
  if (canvas.length) containerRef.value.removeChild(canvas[0]);
  containerRef.value.appendChild(renderer.domElement);
};

// 鼠标控制器
const initControls = () => {
  controls = new OrbitControls(camera, renderer.domElement);
  controls.target = new THREE.Vector3(40,20,0);
  controls.update();
  controls.autoRotate = false;
  controls.addEventListener('change',() => {
    renderer.render(scene, camera);
  })
};

// 移入、点击事件
const initEvent = () => {
  raycaster = new THREE.Raycaster();
  mouse = new THREE.Vector2();
  const info = containerRef.value.getBoundingClientRect();
  document.addEventListener('mousemove', onDocumnetMouseMove, false)
  function onDocumnetMouseMove(event:any){
    mouse.x = ((event.clientX - info.x) / containerRef.value.clientWidth) * 2 - 1;
    mouse.y = -((event.clientY - info.y) / containerRef.value.clientHeight) * 2 + 1;
    animate(event);
  }
};

// 文字创建
const createText = (data:Text) => {
  const loader = new FontLoader();
  loader.load( '/fonts/FangSong_Regular.json', fonts => {
    const {font, size, height, x, y, z=0, rotate=0, color='#ffffff'} = data;
    const textGeo:any = new TextGeometry( font, {
      font: fonts,
      size,
      height,
      curveSegments: 1,
      bevelThickness: 1,
    } );
    textGeo.computeBoundingBox();
    const textMaterial = new THREE.MeshLambertMaterial({ color });
    const mesh = new THREE.Mesh( textGeo, textMaterial );
    mesh.position.x = x;
    mesh.position.y = y;
    mesh.position.z = z;
    mesh.rotateX(rotate);
    // 获取字体的外轮廓，从而得到字体的长度
    let box= new THREE.Box3().setFromObject(mesh);
    // 字体对齐方式默认为左对齐，此处设为中心对齐
    mesh.translateX(-(box.max.x - box.min.x) / 2);
    charts.add( mesh );
    renderer.render(scene, camera);
  });
}

// 绘制柱子
const initBar = (data:any) => {
  let cube:any = null;
  data.forEach((it:any, i:number) => {
    const material = new THREE.MeshLambertMaterial({ color: '#1495a1' });
    const geometry = new THREE.BoxGeometry(barWidth, it.value, barDepth);
    cube = new THREE.Mesh(geometry, material);
    cube.castShadow = true;
    cube.position.x = (barPaddingX * 2 + barWidth) * i + barPaddingX + barWidth / 2;
    cube.position.z = (barPaddingZ * 2 + barWidth) * 0 + barPaddingZ + barWidth / 2;
    cube.translateY(it.value / 2);
    cube.userData.name = it.label;
    cube.userData.type = 'bar';
    cube.userData.data = it;
    charts.add(cube);
    //  X轴文字
    createText({
      font: it.label,
      size: 1.5,
      height: 0.1,
      x: cube.position.x,
      y: 0,
      z: (barPaddingZ + barWidth / 2) * 2 + 3,
      color: '#ffffff',
      rotate: -Math.PI / 2
    })
    //  柱顶文字
    createText({
      font: it.value.toString(),
      size: 2,
      height: 0.3,
      x: cube.position.x,
      y: it.value + 1,
      z: cube.position.z,
      color: '#ff0000',
    })
  });
};

// 绘制Y轴网格
const initGridY = (step:number) => {
  const len = Math.floor(axisLengthY / step);
  const material = new THREE.LineBasicMaterial( { color: 0xffffff } );
  for(let i = 1;i <= len;i++) {
    const geometry = new THREE.BufferGeometry();
    const y = step * i;
    const vertice = new Float32Array( [0,y,barPaddingZ * 2 + barWidth,0,y,0, (barWidth + 2 * barPaddingX) * data.length,y,0] );
    geometry.setAttribute( 'position', new THREE.BufferAttribute( vertice, 3 ) );
    const line = new THREE.Line( geometry, material );
    line.userData.type = 'lineY'

    charts.add(line);
    // 绘制y轴坐标值
    createText({
      font: (step * i).toString(),
      size: 2,
      height: 0.3,
      x: -2,
      y: step * i - 1,
      z: barPaddingZ * 2 + barWidth + 1,
    })
  }
}

// 绘制X轴网格
const initGridX = (data:any) => {
  const material = new THREE.LineBasicMaterial( {color: 0xffffff} );
  for(let i = 0; i<=data.length; i++) {
    const geometry = new THREE.BufferGeometry();
    const x = (2 * barPaddingZ + barWidth) * i;
    const vertice = new Float32Array( [x, 0, 2 * barPaddingZ + barWidth, x, 0, 0, x, axisLengthY, 0] );
    geometry.setAttribute( 'position', new THREE.BufferAttribute( vertice, 3 ) );
    const line = new THREE.Line( geometry, material );
    line.computeLineDistances();
    line.userData.type = 'lineX'
    charts.add(line);
  }
}

// 绘制Z轴网格
const initGridZ = (data:any) => {
  const material = new THREE.LineBasicMaterial( {color: 0xffffff} );
  for(let i = 0; i < 3; i++) {
    const geometry = new THREE.BufferGeometry();
    const z = (barPaddingZ + barWidth / 2) * i;
    const vertice = new Float32Array( [0, axisLengthY, z, 0, 0, z, (barWidth + 2 * barPaddingX) * data.length, 0, z] );
    geometry.setAttribute( 'position', new THREE.BufferAttribute( vertice, 3 ) );
    const line = new THREE.Line( geometry, material );
    line.computeLineDistances();
    line.userData.type = 'lineX'
    charts.add(line);
  }
}

// 找到最大值和最小值
const findRange = (data:any) => {
  let min = data[0].value;
  let max = data[0].value;
  data.forEach((it:any) => {
    if (it.value > max) max = it.value;
    if (it.value < min) min = it.value;
  })
  return {max, min}
}

// 找到合适的纵轴步距
const findStepY = (data:any) => {
  const { min, max } = data;
  const diff = Math.ceil(max - min);
  let step = 1;
  if (diff > 100) {
    step = 100;
  } else if (diff > 10) {
    step = 10;
  } else if (diff % 5 === 0) {
    step = 5;
  } else if (diff % 3 === 0) {
    step = 3;
  } else if (diff % 2 === 0) {
    step = 2;
  }
  return step
}

// 绘制图表标题
const initTitle = (title:string) => {
  createText({
    font: title,
    size: 4,
    height: 1,
    x: (barWidth + barPaddingX *2) * data.length / 2,
    y: axisLengthY + 2,
    color: '#00a6ff',
  })
}

const animate = (event?:any) => {
  // requestAnimationFrame(animate);
  // camera.updateProjectionMatrix();
  renderer.render(scene, camera);
  raycaster.setFromCamera(mouse, camera);
  let intersects = raycaster.intersectObject(charts);
  if(intersects.length > 0){
    // 此处使用some是因为选中状态的元素只允许有一个
    intersects.some((it:any) => {
      if (it.object.userData.type === 'bar') {
        // 已经有选中的物体(当在已选中的物体上移动鼠标，会持续触发该方法)
        if(interSected){
          if(interSected != it.object){
            tipsRef.value.style.display = 'none'
            interSected.material.color.setHex(interSected.currentHex);
          } else {
            tipsRef.value.style.left = event.clientX + 12 + 'px';
            tipsRef.value.style.top = event.clientY + 12 + 'px';
          }
        } else {
          tipsRef.value.style.display = 'block'
          tipsRef.value.style.left = event.clientX + 12 + 'px';
          tipsRef.value.style.top = event.clientY + 12 + 'px';
          interSected = it.object;
          tips.value = '分数' + '<br>' + interSected.userData.data.label + ':' + interSected.userData.data.value
          interSected.currentHex = interSected.material.color.getHex();
          interSected.material.color.set(0xff0000);

        }
      } else {
        if (interSected) {
          tipsRef.value.style.display = 'none'
          interSected.material.color.setHex(interSected.currentHex);
          interSected = null;
        }
      }
      return it.object.userData.type === 'bar';
    })
  }else{
    tipsRef.value.style.display = 'none'
    if(interSected){
      interSected.material.color.set(interSected.currentHex);
    }
    interSected = null;
  }
}

// 初始化
const init = () => {
  initScene();
  initRenderer();
  initLight();
  initCamera();
  initEvent();
  initControls();
  // axisHelper();
  // initAxisX();
  // initAxisY();
  initBar(options.series);
  initTitle('一年级一班成绩表');
  const step = findStepY(findRange(data));
  initGridZ(data);
  initGridY(step);
  initGridX(data);
  renderer.render(scene, camera);
  scene.add(charts);
};
onMounted(() => {
  init();
})
</script>

<style lang="less">
.container {
  height: 800px;
  width: 1500px;
  margin: 70px auto;
}
.tips {
  left: 0;
  top: 0;
  position: absolute;
  background-color: #fff;
  border-radius: 6px;
  overflow: hidden;
  padding: 5px 10px;
  display: none;
}
</style>

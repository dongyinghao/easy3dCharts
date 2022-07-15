<template>
  <div class="container" ref="containerRef"></div>
  <div class="tips" ref="tipsRef" v-html="tips"></div>
</template>

<script lang="ts" setup>
import { ref, onMounted } from 'vue'
import {
  BufferGeometry, Group, Scene, Color, PerspectiveCamera, AxesHelper, Raycaster, MeshLambertMaterial, Line, Mesh,
  LineBasicMaterial, DirectionalLight, AmbientLight, WebGLRenderer, Vector3, Vector2, BoxGeometry, BufferAttribute
} from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { createText, findStepY, findRange, initLabelZ } from '@/utils/dpm.js';


const options = {
  title: '初三2班期末考试成绩表',
  titleColor: '#ff44555',
  titleSize: 5,
  titlePosition: 'center',
  cellPaddingX: 10, // 单元X方向两边空隙
  cellPaddingZ: 10, // 单元Z方向两边空隙
  cellWidth: 5, // 柱子X轴长度
  cellDepth: 5, // 柱子Z轴长度
  series: [
    {
      name: '陈紫烟',
      type: 'bar',
      cellColor: '#7b00ff',
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
          value: 40,
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
      cellColor: '#1495a1',
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
    {
      name: '马冬梅',
      type: 'bar',
      cellColor: '#66ff00',
      data: [
        {
          value: 54,
          label: '语文'
        },
        {
          value: 67,
          label: '数学'
        },
        {
          value: 45,
          label: '英语'
        },
        {
          value: 61,
          label: '物理'
        },
        {
          value: 37,
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

let axisLengthY = 0;
// 全局变量
let scene:any = null;
let charts:any = new Group();
let camera:any = null;
let renderer:any = null;
let controls:any = null;
let raycaster:any = null;
let mouse:any = null;

// 场景
const initScene = () => {
  scene = new Scene();
  scene.background = new Color( 0x111111 );
};

// 相机
const initCamera = () => {
  camera = new PerspectiveCamera(75, containerRef.value.clientWidth / containerRef.value.clientHeight, 1, 500);
  camera.position.set(40, 50, 100);
};

// 坐标辅助线
const axisHelper = () => {
  scene.add(new AxesHelper(5000));
};

// 灯光
const initLight = () => {
  const light = new DirectionalLight( 0xffffff);
  light.position.set( 0, 0, 1 );
  // light.angle = Math.PI / 4;
  light.castShadow = true;
  scene.add(new AmbientLight( 0xdddddd ), light);
};

// 渲染器
const initRenderer = () => {
  renderer = new WebGLRenderer({ alpha: true, antialias:true });
  renderer.shadowMap.enabled = true;
  renderer.setSize(containerRef.value.clientWidth, containerRef.value.clientHeight);
  let canvas = containerRef.value.getElementsByTagName('canvas');
  if (canvas.length) containerRef.value.removeChild(canvas[0]);
  containerRef.value.appendChild(renderer.domElement);
};

// 鼠标控制器
const initControls = () => {
  controls = new OrbitControls(camera, renderer.domElement);
  controls.target = new Vector3(40,45,0);
  controls.update();
  controls.autoRotate = false;
  controls.addEventListener('change',() => {
    renderer.render(scene, camera);
  })
};

// 移入、点击事件
const initEvent = () => {
  raycaster = new Raycaster();
  mouse = new Vector2();
  const info = containerRef.value.getBoundingClientRect();
  document.addEventListener('mousemove', onDocumnetMouseMove, false)
  function onDocumnetMouseMove(event:any){
    if (containerRef.value) {
      mouse.x = ((event.clientX - info.x) / containerRef.value.clientWidth) * 2 - 1;
      mouse.y = -((event.clientY - info.y) / containerRef.value.clientHeight) * 2 + 1;
      animate(event);
    }
  }
};

// 绘制柱子
const initBar = (data:any) => {
  let mesh:any = null;
  const {cellPaddingZ = 10, cellPaddingX = 10, series, cellDepth = 5, cellWidth = 5} = data;
  series.forEach((item:any, idx:number) => {
    item.data.forEach((it:any, i:number) =>{
      const material = new MeshLambertMaterial({ color: item.cellColor });
      const geometry = new BoxGeometry(cellWidth, it.value, cellDepth);
      mesh = new Mesh(geometry, material);
      mesh.castShadow = true;
      mesh.position.x = (cellPaddingX + cellWidth) * i + cellPaddingX + cellWidth / 2;
      mesh.position.z = (cellPaddingZ + cellDepth) * idx + cellPaddingZ + cellDepth / 2;
      mesh.translateY(it.value / 2);
      mesh.userData.name = it.label;
      mesh.userData.type = 'bar';
      mesh.userData.data = it;
      charts.add(mesh);
      //  柱顶文字
      createText({
        font: it.value.toString(),
        size: 2,
        height: 0.3,
        x: mesh.position.x,
        y: it.value + 1,
        z: mesh.position.z,
        color: '#ff0000',
      }, charts);
    })
  });
};

// 绘制X轴网格
const initGridX = (data:any) => {
  const material = new LineBasicMaterial( {color: 0xffffff} );
  const {cellPaddingZ = 10, cellPaddingX = 10, cellDepth = 5, series, cellWidth = 5} = data;
  for(let i = 0; i<=series[0].data.length + 1; i++) {
    const geometry = new BufferGeometry();
    let x = 0;
    switch (i) {
      case 0:
        x = 0;
        break;
      case series[0].data.length + 1:
        x = (cellPaddingX + cellWidth) * (i - 1) + cellPaddingX;
        break;
      default:
        x = (cellPaddingX + cellWidth) * (i - 1) + cellPaddingX + cellWidth / 2
    }
    const z = (cellPaddingZ + cellDepth) * series.length + cellPaddingZ;
    const vertice = new Float32Array( [x, 0, z, x, 0, 0, x, axisLengthY, 0] );
    geometry.setAttribute( 'position', new BufferAttribute( vertice, 3 ) );
    const line = new Line( geometry, material );
    line.userData.type = 'lineX'
    charts.add(line);
  }
}

// 绘制Y轴网格,顺时针绘制
const initGridY = (data:any) => {
  const {cellPaddingZ = 10, cellPaddingX = 10, series, cellDepth = 5, cellWidth = 5} = data;
  const step = findStepY(findRange(options.series));
  const len = Math.floor(axisLengthY / step);
  const material = new LineBasicMaterial( { color: 0xffffff } );
  for(let i = 0;i <= len;i++) {
    const geometry = new BufferGeometry();
    const x = (cellWidth + cellPaddingX) * (series[0].data.length) + cellPaddingX;
    const y = step * i;
    const z = (cellPaddingZ + cellDepth) * series.length + cellPaddingZ;
    const vertice = new Float32Array( [0,y,z,0,y,0, x,y,0] );
    geometry.setAttribute( 'position', new BufferAttribute( vertice, 3 ) );
    const line = new Line( geometry, material );
    line.userData.type = 'lineY'
    charts.add(line);
    // 绘制y轴坐标值
    createText({
      font: (step * i).toString(),
      size: 2,
      height: 0.3,
      color: '#1495a1',
      x: -2,
      y: step * i - 1,
      z: (cellPaddingZ + cellDepth) * series.length + cellPaddingZ + 1,
    }, charts)
  }
}

// 绘制Z轴网格
const initGridZ = (data:any) => {
  const {cellPaddingZ = 10, cellPaddingX = 10, series, cellDepth = 5, cellWidth = 5} = data;
  const material = new LineBasicMaterial( {color: 0xffffff} );
  for(let i = 0; i <= series.length + 1; i++) {
    const geometry = new BufferGeometry();
    let z = 0;
    switch (i) {
      case 0:
        z = 0;
        break;
      case series.length + 1:
        z = (cellPaddingZ + cellDepth) * (i - 1) + cellPaddingZ;
        break;
      default:
        z = (cellPaddingZ + cellDepth) * (i - 1) + cellPaddingZ + cellDepth / 2
    }
    const x = (cellWidth + cellPaddingX) * series[0].data.length + cellPaddingX;
    const vertice = new Float32Array( [0, axisLengthY, z, 0, 0, z, x, 0, z] );
    geometry.setAttribute( 'position', new BufferAttribute( vertice, 3 ) );
    const line = new Line( geometry, material );
    line.userData.type = 'lineZ'
    charts.add(line);
  }
}

// 绘制图表标题
const initTitle = (data:any) => {
  const {cellPaddingX = 10, cellWidth = 5} = data;
  createText({
    font: data.title,
    size: 4,
    height: 1,
    x: ((cellWidth + cellPaddingX) * (data.series[0].data.length) + cellPaddingX) / 2,
    y: axisLengthY + 6,
    color: '#00a6ff',
  }, charts)
}

// 绘制X轴标签
const initLabelX = (data:any) => {
  const {cellPaddingZ = 10, cellPaddingX = 10, series, cellDepth = 5, cellWidth = 5} = data;
  const itemData = series[0].data
  itemData.forEach((it:any, i:number) => {
    let x = (cellPaddingX + cellWidth) * i + cellPaddingX + cellWidth / 2;
    createText({
      font: it.label,
      size: 3,
      height: 0.3,
      x,
      z: (cellPaddingZ + cellDepth) * series.length + cellPaddingZ + 5,
      color: '#1495a1',
      rotate: -Math.PI / 2
    }, charts)
  })
}

const animate = (event?:any) => {
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
  initBar(options);
  initTitle(options);
  initGridX(options);
  initGridY(options);
  initGridZ(options);
  initLabelX(options);
  initLabelZ(options, charts);
  renderer.render(scene, camera);
  scene.add(charts);
};

onMounted(() => {
  let data = findRange(options.series);
  let step = findStepY(data);
  for(let i = 0; i * step <= data.max; i++) {
    axisLengthY = i * step + step;
  }
  init();
})
</script>

<style lang="less">
.container {
  height: 500px;
  width: 1000px;
  margin: 90px auto;
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

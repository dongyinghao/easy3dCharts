<template>
  <div class="container" ref="containerRef"></div>
  <Tips :tips="tips" ref="tipsRef" />
</template>

<script lang="ts" setup>
import { ref, onMounted } from 'vue'
import {
  Group, Scene, Color, PerspectiveCamera, AxesHelper, Raycaster, MeshLambertMaterial, Mesh, Box3, DirectionalLight,
  AmbientLight, WebGLRenderer, Vector3, Vector2, BoxGeometry
} from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { createText, findStepY, findRange, initLabelZ, drawLine, initLabelX } from '@/utils/dpm';
import { ChartConfig } from '@/utils/type';
import Tips from '@/components/Tips.vue';


const options = {
  title: '初三2班期末考试成绩表',
  titleColor: '#ff44555',
  titleSize: 5,
  titlePosition: 'center',
  cellPaddingX: 10, // 单元X方向两边空隙
  cellPaddingZ: 6, // 单元Z方向两边空隙
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
// X轴显示位置
let sideFlagX = ref<boolean>(false);
// Y轴显示位置
let sideFlagY = ref<boolean>(false);
// Z轴显示位置
let sideFlagZ = ref<boolean>(false);

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
      mesh.userData.type = 'bar';
      mesh.userData.data = {...it, name: item.name};
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
      }, (text:any) => {
        charts.add(text);
      });
    })
  });
};

// 绘制X轴网格,顺时针绘制
const initGridX = (data:any) => {
  const {cellPaddingZ = 10, cellPaddingX = 10, series, cellDepth = 5, cellWidth = 5} = data;
  const step = findStepY(findRange(options.series));
  const len = Math.floor(axisLengthY / step);
  const x = (cellWidth + cellPaddingX) * (series[0].data.length) + cellPaddingX;
  const gridX_left = new Group();
  gridX_left.name = 'gridX_left';
  const gridX_right = new Group();
  gridX_right.name = 'gridX_right';
  charts.add(gridX_left, gridX_right)
  for(let i = 0;i <= len;i++) {
    const y = step * i;
    const z = (cellPaddingZ + cellDepth) * series.length + cellPaddingZ;
    const lineHX_left = drawLine([0,y,z, 0,y,0]);
    const lineHX_right = drawLine([x,y,z, x,y,0]);
    lineHX_left.userData.type = 'lineHX'
    lineHX_right.userData.type = 'lineHX'
    gridX_left.add(lineHX_left);
    gridX_right.add(lineHX_right);
    // 绘制y轴坐标值
    createText({
      font: (step * i).toString(),
      size: 2,
      height: 0.3,
      color: '#1495a1',
      x: -2,
      y: step * i - 1,
      z: (cellPaddingZ + cellDepth) * series.length + cellPaddingZ + 1,
    },(mesh:any) => {
      charts.add(mesh);
    });
  }
  for(let i = 0; i <= series.length + 1; i++) {
    let z = 0;
    if (i === 0) {
      z = 0;
    } else if (i === series.length + 1) {
      z = (cellPaddingZ + cellDepth) * (i - 1) + cellPaddingZ;
    } else {
      z = (cellPaddingZ + cellDepth) * (i - 1) + cellPaddingZ + cellDepth / 2
    }
    const lineVX_left = drawLine([0, axisLengthY, z, 0, 0, z]);
    const lineVX_right = drawLine([x, axisLengthY, z, x, 0, z]);
    lineVX_left.userData.type = 'lineVX'
    lineVX_right.userData.type = 'lineVX'
    gridX_left.add(lineVX_left);
    gridX_right.add(lineVX_right);
  }
  gridX_right.visible = false;
}

// 绘制Y轴网格
const initGridY = (data:any) => {
  const {cellPaddingZ = 10, cellPaddingX = 10, series, cellDepth = 5, cellWidth = 5} = data;
  const gridY_bottom = new Group();
  gridY_bottom.name = 'gridY_bottom';
  const gridY_top = new Group();
  gridY_top.name = 'gridY_top';
  gridY_top.visible = false;
  charts.add(gridY_bottom, gridY_top)
  for(let i = 0; i <= series.length + 1; i++) {
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
    const lineVY_bottom = drawLine([0, 0, z, x, 0, z]);
    const lineVY_top = drawLine([0, axisLengthY, z, x, axisLengthY, z]);
    lineVY_bottom.userData.type = 'lineVY'
    lineVY_top.userData.type = 'lineVY'
    gridY_bottom.add(lineVY_bottom);
    gridY_top.add(lineVY_top);
  }
  for(let i = 0; i<=series[0].data.length + 1; i++) {
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
    const lineHY_bottom = drawLine([x, 0, z, x, 0, 0]);
    lineHY_bottom.userData.type = 'lineHY'
    gridY_bottom.add(lineHY_bottom);
    const lineHY_top = drawLine([x, axisLengthY, z, x, axisLengthY, 0]);
    lineHY_top.userData.type = 'lineHY'
    gridY_top.add(lineHY_top);
  }
}

// 绘制Z轴网格
const initGridZ = (data:any) => {
  const {cellPaddingZ = 10, cellPaddingX = 10, cellDepth = 5, series, cellWidth = 5} = data;
  const gridZ_front = new Group();
  gridZ_front.name = 'gridZ_front';
  gridZ_front.visible = false;
  const gridZ_back = new Group();
  gridZ_back.name = 'gridZ_back';
  charts.add(gridZ_front, gridZ_back)
  const z = (cellPaddingZ + cellDepth) * series.length + cellPaddingZ;
  for(let i = 0; i<=series[0].data.length + 1; i++) {
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
    const lineVZ_front = drawLine([x, 0, z, x, axisLengthY, z]);
    lineVZ_front.userData.type = 'lineVZ'
    gridZ_front.add(lineVZ_front);

    const lineVZ_back = drawLine([x, 0, 0, x, axisLengthY, 0]);
    lineVZ_back.userData.type = 'lineVZ'
    gridZ_back.add(lineVZ_back);
  }

  const step = findStepY(findRange(options.series));
  const len = Math.floor(axisLengthY / step);
  for(let i = 0;i <= len;i++) {
    const x = (cellWidth + cellPaddingX) * (series[0].data.length) + cellPaddingX;
    const y = step * i;
    const lineHZ_back = drawLine([0,y,0, x,y,0]);
    lineHZ_back.userData.type = 'lineHZ'
    gridZ_back.add(lineHZ_back);
    const lineHZ_front = drawLine([0,y,z, x,y,z]);
    lineHZ_front.userData.type = 'lineHZ'
    gridZ_front.add(lineHZ_front);
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
  }, (mesh:any) => {
    charts.add(mesh);
  })
}

const animate = (event?:any) => {
  renderer.render(scene, camera);
  raycaster.setFromCamera(mouse, camera);
  let intersects = raycaster.intersectObject(charts);
  const tipsEl = tipsRef.value.$el
  if(intersects.length > 0){
    // 此处使用some是因为选中状态的元素只允许有一个
    intersects.some((it:any) => {
      if (it.object.userData.type === 'bar') {
        // 已经有选中的物体(当在已选中的物体上移动鼠标，会持续触发该方法)
        if(interSected){
          if(interSected != it.object){
            // 原选择物颜色恢复
            interSected.material.color.setHex(interSected.currentHex);
            // 重新定义选择物
            interSected = it.object;
            const {label, name, value} = interSected.userData.data;
            tips.value = name + '<br>' + label + ':' + value
            interSected.currentHex = interSected.material.color.getHex();
            interSected.material.color.set(0xff0000);
          } else {
            tipsEl.style.left = event.clientX + 12 + 'px';
            tipsEl.style.top = event.clientY + 12 + 'px';
          }
        } else {
          tipsEl.style.display = 'block'
          tipsEl.style.left = event.clientX + 12 + 'px';
          tipsEl.style.top = event.clientY + 12 + 'px';
          interSected = it.object;
          const {label, name, value} = interSected.userData.data;
          tips.value = name + '<br>' + label + ':' + value
          interSected.currentHex = interSected.material.color.getHex();
          interSected.material.color.set(0xff0000);
        }
      } else {
        if (interSected) {
          tipsEl.style.display = 'none'
          interSected.material.color.setHex(interSected.currentHex);
          interSected = null;
        }
      }
      return it.object.userData.type === 'bar';
    })
  } else {
    tipsEl.style.display = 'none'
    if(interSected){
      interSected.material.color.set(interSected.currentHex);
    }
    interSected = null;
  }
}

// 鼠标控制器
const initControls = () => {
  controls = new OrbitControls(camera, renderer.domElement);
  controls.target = new Vector3(40,45,0);
  controls.update();
  controls.autoRotate = false;
  controls.addEventListener('change',() => {
    let box = new Box3().setFromObject(charts);
    if (sideFlagX.value !== camera.position.x < box.min.x + 20) {
      charts.children.forEach((it:any) => {
        if (it.name === 'gridX_right') it.visible = !sideFlagX.value
        if (it.name === 'gridX_left') it.visible = sideFlagX.value
      })
    }
    sideFlagX.value = camera.position.x < box.min.x + 20;

    if (sideFlagY.value !== camera.position.y < box.min.y + 20) {
      charts.children.forEach((it:any) => {
        if (it.name === 'gridY_top') it.visible = !sideFlagY.value
        if (it.name === 'gridY_bottom') it.visible = sideFlagY.value
      })
    }
    sideFlagY.value = camera.position.y < box.min.y + 20;

    if (sideFlagZ.value !== camera.position.z < box.min.z + 20) {
      charts.children.forEach((it:any) => {
        if (it.name === 'gridZ_front') it.visible = !sideFlagZ.value
        if (it.name === 'gridZ_back') it.visible = sideFlagZ.value
      })
    }
    sideFlagZ.value = camera.position.z < box.min.z + 20;
    renderer.render(scene, camera);
  })
};

// 绘图
const drawChart = (options:ChartConfig) => {
  initBar(options);
  initTitle(options);
  initGridX(options);
  initGridY(options);
  initGridZ(options);
  initLabelX(options, charts);
  initLabelZ(options, charts);
};

// 初始化
const init = () => {
  // 初始化场景
  initScene();
  initRenderer();
  initLight();
  initCamera();
  initEvent();
  initControls();
  // axisHelper();

  // drawGridBySize('0xffffff',options.series[0].data.length * (options.cellPaddingX + options.cellWidth) + options.cellPaddingX, 100, 7, 10, options.cellPaddingX + options.cellWidth / 2, 0);
  drawChart(options)
  scene.add(charts);
  renderer.render(scene, camera);
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
</style>

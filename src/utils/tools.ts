import {
  Object3D, SpotLight, MeshLambertMaterial, TextureLoader, Vector3, Mesh, Path, Shape, ExtrudeGeometry,
  ShapeGeometry, Group, PerspectiveCamera, Box3, BufferAttribute, BufferGeometry, Line, LineBasicMaterial, LineDashedMaterial
} from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { Coordinate, LineOpt, Text } from './type.d';
import { offset } from "@/utils/dpm";
import { FontLoader } from 'three/examples/jsm/loaders/FontLoader.js';
import { TextGeometry } from 'three/examples/jsm/geometries/TextGeometry.js';
import {GLTFLoader} from "_three@0.142.0@three/examples/jsm/loaders/GLTFLoader";

// 文字创建
export const createText = (data:Text, callback:any) => {
  const loader = new FontLoader();
  loader.load( '/fonts/XinGothicGB.json', fonts => {
    const {font, size=3, height=0.5, x=0, y=0, z=0, rotate=0, color='#ffffff'} = data;
    const textGeo:any = new TextGeometry( font, {
      font: fonts,
      size,
      height,
      curveSegments: 1,
      bevelThickness: 1,
    } );
    textGeo.computeBoundingBox();
    const textMaterial = new MeshLambertMaterial({ color });
    const mesh = new Mesh( textGeo, textMaterial );
    mesh.position.x = x;
    mesh.position.y = y;
    mesh.position.z = z;
    mesh.rotateX(rotate);
    // 获取字体的外轮廓，从而得到字体的长度
    let box= new Box3().setFromObject(mesh);
    // 字体对齐方式默认为左对齐，此处设为中心对齐
    mesh.translateX(-(box.max.x - box.min.x) / 2);
    mesh.translateY(-(box.max.y - box.min.y) / 2);
    mesh.translateZ(-(box.max.z - box.min.z) / 2);
    callback(mesh);
  });
}

// 绘制一条直线
export const drawLine = (array, opt?:LineOpt) => {
  let material;
  if (opt?.type === 'dashed') {
    material = new LineDashedMaterial({color: opt ? opt.color : '#ffffff', dashSize: 1, gapSize: 2});
  } else {
    material = new LineBasicMaterial( {color: opt ? opt.color : '#ffffff'} );
  }
  const geometry = new BufferGeometry();
  const vertice = new Float32Array( array );
  geometry.setAttribute( 'position', new BufferAttribute( vertice, 3 ) );
  const mesh = new Line( geometry, material );
  mesh.computeLineDistances();
  return mesh
}

// 创建聚光灯
// @originPoint: 灯光位置， @targetPoint: 照射位置
export const createSpotLight = (originPoint:Coordinate, targetPoint:Coordinate, angle?:number, color?:number):any => {
  const {x, y, z} = originPoint;
  const light = new SpotLight( color || 0xffffff);
  light.position.set( x, y, z as number );
  light.castShadow = true;
  light.angle = angle || Math.PI / 4;
  // 聚光灯照射点
  const p = new Object3D();
  p.position.set(targetPoint.x, targetPoint.y, targetPoint.z as number);
  light.target = p;
  return light;
}

// 皮肤加载
export const loadTexture = (url:string):MeshLambertMaterial => {
  const load = new TextureLoader();
  const texture = load.load(url);
  return new MeshLambertMaterial({
    map: texture,
  });
}

// 模型加载器
export const loadGlb = async (url:string) => {
  return await new Promise((resolve, reject) => {
    const loader = new GLTFLoader();
    loader.load( url, ( gltf ) => {
      resolve(gltf);
    });
  })
}

// 根据鼠标位置缩放场景
export const zoomByMouse = (camera:PerspectiveCamera, controls:OrbitControls) => {
  document.body.addEventListener('mousewheel',  (event:any) =>{
    const factor = camera.position.z / 20;
    const x = ( event.clientX / window.innerWidth ) * 2 - 1;
    const y = - ( event.clientY / window.innerHeight ) * 2 + 1;
    // 这里定义深度值为0.5，深度值越大，意味着精度越高
    var vector = new Vector3(x, y, 0.5 );
    // 转换为3D空间坐标
    vector.unproject(camera);
    // 获得从相机指向鼠标所对应的3D空间点的射线
    vector.sub( camera.position ).normalize();
    camera.position.x += vector.x * factor * (event.deltaY / -100);
    camera.position.y += vector.y * factor * (event.deltaY / -100);
    controls.target.x += vector.x * factor * (event.deltaY / -100);
    controls.target.y += vector.y * factor * (event.deltaY / -100);
    controls.update();
  });
}

// 绘制道路
export const drawRoadPlane = (data, color:string|number, group?:Group):Group => {
  const myGroup = new Group();
  data.features.forEach(it => {
    const arrayList = it.geometry.coordinates[0];
    const leftArray:number[][] = [];
    const rightArray:number[][] = [];
    let prevPoint:number[] = [];
    arrayList.forEach(it => {
      if (prevPoint.length) {
        const p1 = offset( prevPoint, it, 0.00005, 1);
        const p2 = offset( prevPoint, it, 0.00005, 0);
        leftArray.push(p1[0], p1[1]);
        rightArray.push(p2[0], p2[1]);
      }
      prevPoint = it;
    });
    rightArray.reverse();
    rightArray.forEach(it => {
      leftArray.push(it);
    })
    const shape = new Shape();
    shape.autoClose = true;
    leftArray.forEach((t, i) => {
      if (!i) {
        shape.moveTo(t[0] * 1000,t[1] * 1000);
      } else {
        shape.lineTo(t[0] * 1000,t[1] * 1000);
      }
    })
    const geometry = new ShapeGeometry(shape);
    const material = new MeshLambertMaterial({color});
    if (group) group.add(new Mesh(geometry,material));
    myGroup.add(new Mesh(geometry,material));
  })
  return myGroup;
}

// 绘制道路中线
export const drawRoadLine = (data, color:string|number, group?:Group):Group => {
  const myGroup = new Group();
  data.features.forEach(it => {
    const arrayList = it.geometry.coordinates[0];
    const array:number[] = [];
    arrayList.forEach(t => {
      array.push(t[0] * 1000, t[1] *1000, 0)
    })
    const mesh = drawLine(array, {color});
    mesh.userData = it.properties;
    if (group) group.add(mesh)
    myGroup.add(mesh)
  });
  return myGroup;
}

// 绘制河流湖泊
export const drawRiver = (data, color:string|number, group?:Group):Group => {
  const myGroup = new Group();
  data.features.forEach(it => {
    const shape = new Shape();
    shape.autoClose = true;
    it.geometry.coordinates[0].forEach((item, idx) => {
      if (!idx) {
        item.forEach((t, i) => {
          if (!i) {
            shape.moveTo(t[0] * 1000,t[1] * 1000);
          } else {
            shape.lineTo(t[0] * 1000,t[1] * 1000);
          }
        })
      } else { // 内轮廓
        const hole = new Path();
        item.forEach((t, i) => {
          if (!i) {
            hole.moveTo(t[0] * 1000,t[1] * 1000);
          } else {
            hole.lineTo(t[0] * 1000,t[1] * 1000);
          }
        })
        shape.holes.push(hole);
      }
    })
    const geometry = new ShapeGeometry(shape);
    const material = new MeshLambertMaterial({color});
    const mesh = new Mesh(geometry,material);
    mesh.userData = it.properties;
    if (group) group.add(mesh);
    myGroup.add(mesh);
  })
  return myGroup;
}

// 建筑模型
const builds = {
  house0: loadGlb('/models/house0.glb'),
  house1: loadGlb('/models/house1.glb'),
  house2: loadGlb('/models/house2.glb'),
  house3: loadGlb('/models/house3.glb'),
  house4: loadGlb('/models/house4.glb'),
  house5: loadGlb('/models/house5.glb'),
}
const addBuild = async (data, coord:number[], group) => {
  const i = Math.floor(Math.random() * 6);
  const obj = await builds['house' + i];
  const mesh = obj.scene.clone();
  mesh.position.x = coord[0];
  mesh.position.y = coord[1];
  if (i === 0) {
    mesh.scale.set(3, 3, 3);
  } else if (i === 1) {
    mesh.scale.set(0.6, 0.6, 0.6);
  } else if (i === 2) {
    mesh.scale.set(0.15, 0.15, 0.15);
  } else if (i === 3) {
    mesh.scale.set(0.08, 0.08, 0.08);
  } else if (i === 4) {
    mesh.scale.set(0.02, 0.02, 0.02);
  } else if (i === 5){
    mesh.scale.set(0.07, 0.07, 0.07);
  }
  mesh.rotateX(Math.PI / 2);
  group.add(mesh);
}

// 绘制建筑物
export const drawBuild = (data, color:string|number, group?:Group):Group => {
  const myGroup = new Group();
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
    const depth = Math.max(0.3,Number(Math.random().toFixed(2)));
    const geometry = new ExtrudeGeometry(shape, {depth, bevelEnabled: false});
    const material = new MeshLambertMaterial({color});
    const mesh = new Mesh(geometry,material);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    mesh.userData = it.properties;
    if (group) group.add(mesh);
    myGroup.add(mesh);
    // if(it.properties.name) {
    //   let boxInfo = new Box3().setFromObject(mesh);
    //   addBuild(it,[(boxInfo.min.x + boxInfo.max.x) / 2, (boxInfo.min.y + boxInfo.max.y) / 2], myGroup);
    // } else {
    //   mesh.castShadow = true;
    //   mesh.receiveShadow = true;
    //   mesh.userData = it.properties;
    //   if (group) group.add(mesh);
    //   myGroup.add(mesh);
    // }
  })
  return myGroup;
}

// 绘制地图轮廓线
export const drawMapLine = (data, color:string|number, group?:Group):Group => {
  const myGroup = new Group();
  data.features.forEach(it => {
    if (!it.properties.name) return;
    const arrayList = it.geometry.coordinates[0][0];
    const array:number[] = [];
    arrayList.forEach(t => {
      array.push(t[0] * 1000, t[1] *1000, 0.1)
    })
    array.push(arrayList[0][0] * 1000,arrayList[0][1] * 1000, 0.1)
    const mesh = drawLine(array, {color, type: 'dashed'});
    mesh.userData = it.properties;
    if (group) group.add(mesh);
    myGroup.add(mesh);
  })
  return myGroup
}

// 绘制地图
export const drawMapPlane = (data, color:string|number, depth?:number, group?:Group):Group => {
  const myGroup = new Group();
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
    const geometry = new ExtrudeGeometry(shape, {depth: depth || 0, bevelEnabled: false});
    const material = new MeshLambertMaterial({color});
    const mesh = new Mesh(geometry,material);
    mesh.receiveShadow = true;
    mesh.userData = it.properties;
    if (group) group.add(mesh);
    myGroup.add(mesh);
  })
  return myGroup
}

// 绘制地图区域名称
export const drawAreaName = (data, fontSize:number, color?:string|number|undefined, group?:Group):Group => {
  const myGroup = new Group();
  data.features.forEach(it => {
    if (!it.properties.name) return;
    createText({
      font: it.properties.name,
      size: fontSize,
      height: 0.3,
      x: it.properties.centroid[0] * 1000,
      y: it.properties.centroid[1] * 1000,
      z: 0.2,
      color,
    }, text => {
      if (group) group.add(text);
      myGroup.add(text);
    });
  })
  return myGroup;
}
import { Object3D, SpotLight, MeshLambertMaterial, TextureLoader, Vector3, Mesh, Path, Shape, ExtrudeGeometry,
  ShapeGeometry, Group } from 'three';
import { Coordinate } from './type.d';
import {createText, drawLine, offset} from "@/utils/dpm";

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

// 根据相机高度获取当前的缩放因子
export const ZtoZoom = (n:number):number => {
  const zoomMap = {3: 1, 5: 2, 10: 3, 30: 4, 50: 5, 100: 6, 150: 7, 300: 8, 500: 9, 1000: 10, 1500: 11, 2000: 12, 2500: 13};
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
export const ZoomToZ = (n:number):number => {
  const zoomMap = {3: 1, 5: 2, 10: 3, 30: 4, 50: 5, 100: 6, 150: 7, 300: 8, 500: 9, 1000: 10, 1500: 11, 2000: 12, 2500: 13};
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

// 皮肤加载
export const loadTexture = (url) => {
  const load = new TextureLoader();
  const texture = load.load(url);
  return new MeshLambertMaterial({
    map: texture,
  });
}

// 根据鼠标位置缩放场景
export const zoomByMouse = (camera, controls) => {
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
export const drawRoadPlane = (data, color, group?) => {
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
export const drawRoadLine = (data, color, group?) => {
  const myGroup = new Group();
  data.features.forEach(it => {
    const arrayList = it.geometry.coordinates[0];
    const array:number[] = [];
    arrayList.forEach(t => {
      array.push(t[0] * 1000, t[1] *1000, 0.02)
    })
    const mesh = drawLine(array, {color});
    mesh.userData = it.properties;
    if (group) group.add(mesh)
    myGroup.add(mesh)
  });
  return myGroup;
}

// 绘制河流湖泊
export const drawRiver = (data, color, group?) => {
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

// 绘制建筑物
export const drawBuild = (data, color, group?) => {
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
    // const material = new MeshLambertMaterial({color,map: texture});
    const material = new MeshLambertMaterial({color});
    const mesh = new Mesh(geometry,material);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    mesh.userData = it.properties;
    if (group) group.add(mesh);
    myGroup.add(mesh);
  })
  return myGroup;
}

// 绘制地图轮廓线
export const drawMapLine = (data, color, group?) => {
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
    // if (it.properties.name) {
    //   createText({
    //     font: it.properties.name,
    //     size: 12,
    //     height: 0.3,
    //     x: it.properties.centroid[0] * 1000,
    //     y: it.properties.centroid[1] * 1000,
    //     z: landDepth + 0.2,
    //     color: '#2d2d2d',
    //   }, text => {
    //     areaNameGroup.add(text);
    //   });
    // }
    if (group) group.add(mesh);
    myGroup.add(mesh);
  })
  return myGroup
}

// 绘制地图
export const drawMapPlane = (data, color, depth?, group?) => {
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
export const drawAreaName = (data, fs, color?, group?) => {
  const myGroup = new Group();
  data.features.forEach(it => {
    if (!it.properties.name) return;
    createText({
      font: it.properties.name,
      size: fs,
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
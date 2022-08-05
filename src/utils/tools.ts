import { Object3D, SpotLight, MeshLambertMaterial, TextureLoader } from 'three';
import { Coordinate } from './type.d';

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
export const ZoomToZ = (n:number):number => {
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
export const ZtoZoom = (n:number):number => {
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
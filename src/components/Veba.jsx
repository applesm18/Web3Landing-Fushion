import React, { useEffect } from "react";
import * as THREE from "three";

let scene,
  renderer,
  camera,
  mesh,
  geometry,
  lights = [];

var wireframe = true,
  material;

var virtex_w = 75;
var virtex_h = 30;
var virtex_p = 0.015;

var createIndexedPlaneGeometryFlag = function (width, length) {
  var geom = new THREE.BufferGeometry();
  var vertices = [];
  var indices = [];
  var uvs = [];
  var width1 = width + 1;
  var length1 = length + 1;
  for (var i = 0; i < width1; i++) {
    for (var j = 0; j < length1; j++) {
      vertices.push(i / width, j / length, 0);
      uvs.push(i / width, j / length);
    }
  }

  for (var i = 0; i < width; i++) {
    for (var j = 0; j < length; j++) {
      var a = i * length1 + j;
      var b = i * length1 + j + 1;
      var c = (i + 1) * length1 + j;
      var d = (i + 1) * length1 + j + 1;

      indices.push(a, c, b);
      indices.push(b, c, d);
    }
  }

  var positions = new Float32Array(vertices);
  var index = new Uint32Array(indices);
  uvs = new Float32Array(uvs);

  geom.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  geom.setAttribute("uv", new THREE.BufferAttribute(uvs, 2));
  geom.setIndex(new THREE.BufferAttribute(index, 1));
  return geom;
};


var mainflag = function (geom, width, height) {
  var pos = geom.attributes.position.array;

  // var left = 0;//(width/2.0) * virtex_p;
  var left = (width * virtex_p) / 1.2;
  var top = -0.5;

  for(var w = 0; w < width + 1; w++)
  {
    for(var h = 0; h < height + 1; h++)
    {
      if( w > 0)
      {
        pos[(w * (height+1) +  h) * 3] += w * virtex_p - left; 
      }
      else
      {
        pos[(w * (height+1) +  h) * 3] -= left; 
      }

      pos[(w * (height+1) +  h) * 3 + 1] += h * virtex_p/2.5 + top; 
    }
  }

  geom.setAttribute("base_position", geom.attributes.position.clone());
  geom.computeVertexNormals();
};


const initScene = function () {
  scene = new THREE.Scene();
  // Renderer
  renderer = new THREE.WebGLRenderer({
    antialias: true,
    alpha: false,
  });
  const isMobile = window.innerWidth < 768;
  renderer.setClearColor(0xffffff, 1.0);
  renderer.autoClearColor = false;
  renderer.setSize(window.innerWidth/(isMobile ? 1 : 2), window.innerHeight/(isMobile ? 2 : 2));
  document.getElementById("canvas").appendChild(renderer.domElement);

  // My Light
  lights[0] = new THREE.PointLight(0x353535, 1, 0);
  lights[0].position.set(0, 400, 400);

  scene.add(lights[0]);
  // My Camera
  camera = new THREE.PerspectiveCamera(
    isMobile ? 30 : 30,
    window.innerWidth * (isMobile ? 2 : 1)/ window.innerHeight,
    0.1,
    1000
  );
  camera.position.set(0, 0, 550);
};


var init = function () {
  initScene();
  mesh = new THREE.Object3D();
  mesh.scale.set(250, 180, 100);
  geometry = createIndexedPlaneGeometryFlag(virtex_w, virtex_h);

  mainflag(geometry, virtex_w, virtex_h);
  var textureloader = new THREE.TextureLoader();
    textureloader.load('/images/flag.png',function(tx){
    material = new THREE.MeshBasicMaterial({
        map: tx,
      wireframe: false
    });

    mesh.add(new THREE.Mesh(geometry, material));

    scene.add(mesh);

  });

  
  animate();
};

window.onmousemove = function (e) {};

var time = 0.0;
var deltatime = 0.1;

var modifyGeometryflag = function () {
  var pos = geometry.attributes.position.array;
  var tp = 0.1;
  var wh = 0.004;
  var ww = 0.001;

  for( var w = 1; w < virtex_w+1; w++)
  {
    for(var h = 0; h < virtex_h+1; h++)
    {
      var p;

      p = pos[(w * (virtex_h+1) +  h) * 3 + 2];
      p = p * Math.sin(time + tp * w);
      pos[(w * (virtex_h+1) +  h) * 3 + 2] = Math.sin(w * 0.1 + h * 0.05 + time) * wh * Math.sqrt(Math.sqrt(w));

      p = pos[(w * (virtex_h+1) +  h) * 3 + 1];
      p = p * Math.sin(time + tp * w);
      pos[(w * (virtex_h+1) +  h) * 3 + 1] += Math.sin(w * 0.1 + h * 0.05 + time) * ww * Math.sqrt(Math.sqrt(Math.sqrt(w)));
      
    }
  }
    
  geometry.attributes.position.needsUpdate = true;
  geometry.computeVertexNormals();
};

var animate = function () {
  time += deltatime;
  scene.requestFrame = requestAnimationFrame(animate);
  modifyGeometryflag();

  renderer.render(scene, camera);
};


const Veba = () => {
  useEffect(() => {
    const container = document.getElementById("canvas");
    if (container.innerHTML !== "") {
      return;
    }
    init();
  }, []);
  return <div id="canvas" className="service-canvas " />;
};

export default Veba;

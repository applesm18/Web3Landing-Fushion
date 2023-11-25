import * as THREE from 'three';
import { FontLoader } from 'three/examples/jsm/loaders/FontLoader.js';
import { TextGeometry } from 'three/examples/jsm/geometries/TextGeometry.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';

import { useEffect, useState } from "react";
const Nova = () => {
  useEffect(() => {
    let isMobile = false;
    if(window.innerWidth < 768) isMobile = true;
    const len = document.querySelectorAll("canvas[data-engine]")?.length;
    if (len > 0) return;
    let scene = new THREE.Scene();
    scene.background = new THREE.Color(0xf7f7f7);
    let camera = new THREE.PerspectiveCamera(
      55,
      window.innerWidth / window.innerHeight,
      1,
      50
    );
    camera.position.set(0, 0, 30);

    let renderer = new THREE.WebGLRenderer();
    if(isMobile) renderer.setSize(window.innerWidth, window.innerHeight);
    else renderer.setSize(window.innerWidth, window.innerHeight);
    const novaDiv = document.getElementById("nova");
    novaDiv.appendChild(renderer.domElement);
    window.addEventListener("resize", (event) => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      if(isMobile) renderer.setSize(window.innerWidth, window.innerHeight);
      else renderer.setSize(window.innerWidth, window.innerHeight);
    });

    let controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.enablePan = false;
    controls.enableZoom = false;
    let gu = {
      time: { value: 0 },
    };

    let sizes = [];
    let shift = [];
    let pushShift = () => {
      shift.push(
        Math.random() * Math.PI,
        Math.random() * Math.PI * 2,
        (Math.random() * 0.9 + 0.1) * Math.PI * 0.1,
        Math.random() * 0.9 + 0.1
      );
    };
    let pts = new Array(isMobile ? 1000 : 3000).fill().map((p) => {
      sizes.push(Math.random() * 1.5 + 0.5);
      pushShift();
      return new THREE.Vector3()
        .randomDirection()
        .multiplyScalar(Math.random() * 0.5 + 7.5);
    });
    for (let i = 0; i < 1000; i++) {
      sizes.push(Math.random() * 1.5 + 0.5);
      pushShift();
    }

    let g = new THREE.BufferGeometry().setFromPoints(pts);
    g.setAttribute("sizes", new THREE.Float32BufferAttribute(sizes, 1));
    g.setAttribute("shift", new THREE.Float32BufferAttribute(shift, 4));
    let m = new THREE.PointsMaterial({
      size: 0.125,
      transparent: true,
      depthTest: false,
      onBeforeCompile: (shader) => {
        shader.uniforms.time = gu.time;
        shader.vertexShader = `
        uniform float time;
        attribute float sizes;
        attribute vec4 shift;
        varying vec3 vColor;
        ${shader.vertexShader}
      `
          .replace(`gl_PointSize = size;`, `gl_PointSize = size * sizes;`)
          .replace(
            `#include <color_vertex>`,
            `#include <color_vertex>
          float d = length(abs(position) / vec3(40., 10., 40));
          d = clamp(d, 0., 1.);
          vColor = mix(vec3(0.7, 0.3, 0.5*sin(time*2.0)), vec3(.9, .5, .3*sin(time*3.0)), d);
        `
          )
          .replace(
            `#include <begin_vertex>`,
            `#include <begin_vertex>
          float t = time;
          //float moveT = mod(shift.x + shift.z * t, PI2);
          //float moveS = mod(shift.y + shift.z * t, PI2);
          //transformed += vec3(cos(moveS) * sin(moveT), cos(moveT), sin(moveS) * sin(moveT)) * shift.w;
        `
          );
        //console.log(shader.vertexShader);
        shader.fragmentShader = `
        varying vec3 vColor;
        ${shader.fragmentShader}
      `
          .replace(
            `#include <clipping_planes_fragment>`,
            `#include <clipping_planes_fragment>
          float d = length(gl_PointCoord.xy - 0.5);
          //if (d > 0.5) discard;
        `
          )
          .replace(
            `vec4 diffuseColor = vec4( diffuse, opacity );`,
            `vec4 diffuseColor = vec4( vColor, smoothstep(0.5, 0.1, d)/* * 0.5 + 0.5*/ );`
          );
        //console.log(shader.fragmentShader);
      },
    });
    let p = new THREE.Points(g, m);
    p.rotation.order = "ZYX";
    p.rotation.z = 0.2;
    scene.add(p);

    let clock = new THREE.Clock();

  var txtMaterial = [];
  var time = clock.getElapsedTime() * 0.5;
  var fontloader = new FontLoader();
  var textTitle = [];
  let AddText = (scene, font , fontsize, position, text) =>
  {
    let vTxShader=`
    varying vec3 vWorldPosition;
    varying vec4 fragCoord;
    varying vec2 vUv;
    uniform vec3 iResolution;
    uniform float iTime;
    varying vec4 fragColor;
    uniform float iFontsize;
    uniform vec3  iPosition;
  
    #define PI 3.14159265358979
    #define P2 6.28318530717959
  
    float Pow5 (float x)
    {
        return x*x * x*x * x;
    }
  
    float saturate(float x)
    {
      return max(0., min(1., x));
    }
  
    vec3 F_Schlick1(float u, vec3 f0, float f90) {
      return f0 + (vec3(f90) - f0) * pow(1.0 - u, 5.0);
    }
  
    float F_Schlick2(float u, float f0) {
      float f = pow(1.0 - u, 5.0);
      return f + f0 * (1.0 - f);
    }
  
    vec3 F_Schlick(vec3 f0, float f90, float u) {
      return f0 + (f90 - f0) * exp2((-5.55473f * u - 6.98316f) * u);  //native_powr(1.f - u, 5.f);
    }
  
    float Fr_DisneyDiffuse(float NdotV, float NdotL, float LdotH, float linearRoughness) {
      float energyBias = mix(0., 0.5, linearRoughness);
      float energyFactor = mix(1.0, 1.0 / 1.51, linearRoughness);
      float fd90 = energyBias + 2.0 * LdotH*LdotH * linearRoughness;
      vec3 f0 = vec3(1.0f, 1.0f, 1.0f);
      float lightScatter = F_Schlick(f0, fd90, NdotL).r;
      float viewScatter = F_Schlick(f0, fd90, NdotV).r;
      
      return lightScatter * viewScatter * energyFactor;
    }
  
    float DisneyDiffuse(float NdotV, float NdotL, float LdotH, float perceptualRoughness)
    {
        float fd90 = 0.5 + 2. * LdotH * LdotH * perceptualRoughness;
        // Two schlick fresnel term
        float lightScatter   = (1. + (fd90 - 1.) * Pow5(1. - NdotL));
        float viewScatter    = (1. + (fd90 - 1.) * Pow5(1. - NdotV));
  
        return lightScatter * viewScatter;
    }
  
  
    float ggxNormalDistribution( float NdotH, float roughness )
    {
      float a2 = roughness * roughness;
      float d = ((NdotH * a2 - NdotH) * NdotH + 1.);
      return a2 / (d * d * PI);
    }
  
    float ggxSchlickMaskingTerm(float NdotL, float NdotV, float roughness)
    {
      float GGXV = NdotL * sqrt(NdotV * NdotV * (1.0 - roughness) + roughness);
      float GGXL = NdotV * sqrt(NdotL * NdotL * (1.0 - roughness) + roughness);
      float G = 0.5/(GGXV + GGXL);
      return G;
    }
  
    vec3 schlickFresnel(vec3 f0, float lDotH)
    {
      return f0 + (vec3(1.0f, 1.0f, 1.0f) - f0) * pow(1.0f - lDotH, 5.0f);
    }
  
    float D_GGX(float NoH, float roughness) {
      float a = NoH * roughness;
      float k = roughness / (1.0 - NoH * NoH + a * a);
      return k * k * (1.0 / PI);
    }
  
    float V_Kelemen(float LoH) {
      return 0.25 / (LoH * LoH);
    }
  
    float Fd_Lambert() {
      return 1.0 / PI;
    }
  
    float V_SmithGGXCorrelated(float NoV, float NoL, float roughness) {
      float a2 = roughness * roughness;
      float GGXV = NoL * sqrt(NoV * NoV * (1.0 - a2) + a2);
      float GGXL = NoV * sqrt(NoL * NoL * (1.0 - a2) + a2);
      return 0.5 / (GGXV + GGXL);
    }
  
  
    float roughnessValue = 1.1;
    vec3 WorldSpaceCameraPos = vec3(0.1, 0.8, 0.8);
    vec3 lightpos = vec3(0., 4., -8.);
    vec3 baseColor = vec3(0.9, .45, .1);
    float lightColor = 3.5;
    float clearCoat = 0.5;
    float transparent = .8;
  
    void main() {
    vUv = uv;
    vec4 worldPosition = modelMatrix * vec4(position, 1.0);
    vWorldPosition = vec3(-worldPosition.z, worldPosition.y, -worldPosition.x);
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  
    vec3 origin = (vec4(iPosition,1.0) * modelMatrix).xyz + vec3(iFontsize/2.5, 5.0, 2.0);
    WorldSpaceCameraPos += origin;
    lightpos += origin;
  
    float linearRoughness = roughnessValue * roughnessValue;
    vec3 normalDirection = normalize(worldPosition.xyz);
    vec3 viewDirection = normalize(WorldSpaceCameraPos-worldPosition.xyz);
    vec3 lightDirection = normalize(lightpos-worldPosition.xyz);
    vec3 halfDirection = normalize(lightDirection + viewDirection );
  
  
    float NdotL = saturate(dot(normalDirection, lightDirection));
    float NdotV = saturate(dot(normalDirection, viewDirection));
    float VdotH = saturate(dot(viewDirection, halfDirection));
    float NdotH = saturate(dot(normalDirection, halfDirection));
    float LdotH = saturate(dot(lightDirection, halfDirection));
  
    float diffuse = Fr_DisneyDiffuse(NdotV, NdotL, LdotH, linearRoughness);
    vec3 diffuseColor = baseColor * diffuse/PI;
  
    vec3 F = schlickFresnel(baseColor, LdotH);	
    float  D = ggxNormalDistribution(NdotH, linearRoughness);
    float  G = ggxSchlickMaskingTerm(NdotL, NdotV, linearRoughness);
      
    vec3 specularReflection = lightColor * baseColor * (F * D * G);

    float clearCoatPerceptualRoughness = clamp(roughnessValue, 0.089, 1.0);
    float clearCoatRoughness = clearCoatPerceptualRoughness * clearCoatPerceptualRoughness;
  
    float f0 = 0.04;
    float  Dc = D_GGX(NdotH, clearCoatRoughness);
    float  Vc = V_Kelemen(LdotH);
    float  Fc = F_Schlick2(f0, LdotH) * clearCoat; // clear coat strength
    float Frc = (Dc * Vc) * Fc;
    vec3 Fd = diffuseColor * Fd_Lambert();
    float V = V_SmithGGXCorrelated(NdotV, NdotL, clearCoatRoughness);
    vec3 Fr = (Dc * V) * F;
    vec3 CoatColor =  baseColor * ((Fd + Fr * (1.0 - Fc)) * (1.0 - Fc) + Frc);
  
    float alpha = transparent;//baseColor.a;
    vec3 specularColor = specularReflection;    
    vec4 glassColor =  vec4(diffuseColor + specularColor, alpha);
  
  
    fragColor = vec4(diffuseColor, 1.0);
    fragColor = vec4(specularReflection, 1.0);
    fragColor = glassColor;
  
    fragCoord = gl_Position;
    }
    `;
    let fTxShader=`
    varying vec4 fragColor;
  
    void main(void)
    {
      gl_FragColor = fragColor;
    }
    `;

    txtMaterial.push(new THREE.ShaderMaterial({
      side: THREE.DoubleSide,
      uniforms: {
        iResolution: {
          value: new THREE.Vector3(window.innerWidth , window.innerHeight, 1)
        },
        iTime: {
          value: time
        },
        iFontsize: {
          value: fontsize
        },
        iPosition: {
          value: position
        }
      },
      vertexShader: vTxShader,
      fragmentShader: fTxShader
    })
    );


    const textGeometry = new TextGeometry( text, {
      font: font,
      size: fontsize,
      height: fontsize,
      curveSegments: 20,
      bevelEnabled: true,
      bevelThickness: fontsize*.5,
      bevelSize: fontsize/10.0,
      bevelOffset: 0.0,
      bevelSegments: 20
    } );
    
    var textmesh = new THREE.Mesh( textGeometry, [txtMaterial[txtMaterial.length-1],txtMaterial[txtMaterial.length-1]]);
    textmesh.position.set(position.x, position.y, position.z);
    scene.add( textmesh );

    textTitle.push(textmesh);
    return textmesh;
  }


  fontloader.load( '/fonts/helvetiker_bold.typeface.json', function ( font ) {
   
    var sx = -20.0;
    var sy = -8.0;
    var sz = -20.0;
    var fsize = 4.8;
    var margin = 0.4;
    AddText(scene, font, fsize, new THREE.Vector3(sx, sy, sz), "F"); sx += fsize + margin;
    AddText(scene, font, fsize, new THREE.Vector3(sx, sy, sz), "u"); sx += fsize + margin;
    AddText(scene, font, fsize, new THREE.Vector3(sx, sy, sz), "s"); sx += fsize;
    AddText(scene, font, fsize, new THREE.Vector3(sx, sy, sz), "i"); sx += (fsize)/2.;
    AddText(scene, font, fsize, new THREE.Vector3(sx, sy, sz), "o"); sx += fsize;
    AddText(scene, font, fsize, new THREE.Vector3(sx, sy, sz), "n"); sx += fsize;
    AddText(scene, font, fsize, new THREE.Vector3(sx, sy, sz), "-"); sx += fsize + margin;
    AddText(scene, font, fsize, new THREE.Vector3(sx, sy, sz), "M"); sx += fsize + margin;
    AddText(scene, font, fsize, new THREE.Vector3(sx, sy, sz), "e"); sx += fsize;
    AddText(scene, font, fsize, new THREE.Vector3(sx, sy, sz), "d"); sx += fsize;
    AddText(scene, font, fsize, new THREE.Vector3(sx, sy, sz), "i"); sx += (fsize)/2.;
    AddText(scene, font, fsize, new THREE.Vector3(sx, sy, sz), "a"); sx += fsize;
  });
 
  var time_title = 0.0;
  renderer.setAnimationLoop(() => {

      let titleInitAnim = () =>{
        time_title = 0.0;
        textTitle.forEach(element => {
          let curs = 0.001;
          element.scale.set(curs, curs, curs);
        });
      }
    
      let titleAnimation = () => {
        textTitle.forEach(element => {
          let speed = 1.5;
          let t = clock.getElapsedTime() * speed;
          let curs = 1.0  + 0.03 * Math.sin(t%Math.PI);
          element.scale.set(curs, curs, curs);
        });
      }

      let titleStartup = () =>{
        if(time_title == 0.0) time_title = clock.getElapsedTime();
        textTitle.forEach(element => {
          let speed = 1.5;
          let t = (clock.getElapsedTime() - time_title) * speed;
          t = t > Math.PI/2 ? Math.PI/2 : t;
          let curs = 0.1  + 1.0 * Math.sin(t);
          element.scale.set(curs, curs, curs);
        });
      }

      let pointMaterialAnimationStartup = (t) =>{
        // t => Math.PI * 2.0
        var material = p.material;
        material.size = 0.3 + 1.8 * Math.abs(Math.sin(t));
      }

      let pointMaterialAnimation = (t) =>{
        // t => Math.PI * 2.0 ~ Math.PI * 6.0
        let size = 0.3 + 0.3 * t* t;
        size = size > 5.0 ? 5.0 : size;
        var material = p.material;
        material.size = size;
      }

      let scaling = (t, speed, max, min) => {
      
        let curs;
        let tt = (t*speed) % (Math.PI * 6.0);
        if(tt > Math.PI * 2.0)
        {
          curs = 10.0 * Math.sin(t*speed);
          if(tt > Math.PI * 2.5)
          {
            curs = 10.0;
            titleAnimation();
          }
          else{
            titleStartup();
          }

          pointMaterialAnimation(tt);
        }
        else{
          curs = max * Math.sin(t*speed);
          titleInitAnim();
          pointMaterialAnimationStartup(tt);
        }
        
        return curs;
      }

      let pointsAnimation = () => {
        let scale_speed = 5.5;
        let scale_max = 2.0;
        let scale_min = 0.1;

        let t = clock.getElapsedTime() * 0.5;
        gu.time.value = t;
        p.rotation.y = t * 0.5;

        let curs = scaling(t, scale_speed, scale_max, scale_min);

        p.scale.set(curs, curs, curs);
        
      }

      pointsAnimation();
            
      renderer.render(scene, camera);

    });
  }, []);

  return <div id="nova" className="nova"></div>;
};
export default Nova;
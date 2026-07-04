/**
 * [INPUT]: @remotion/three ThreeCanvas, three ShaderMaterial, remotion useCurrentFrame/useVideoConfig
 * [OUTPUT]: ShaderPlane — GPU fragment shader 全屏质感层, 3 预设: liquidWarp(域扭曲流体) / silkNoise(丝绸光泽) / lensFlow(透镜流光)
 * [POS]: scaffold 组件库的 shader 层; 还"CSS/SVG 够不着 GPU 质感"的债 (对标 hyperframes gravitational-lens / domain-warp / liquid 系)
 * [PROTOCOL]: 变更时更新此头部，然后检查 AGENTS.md
 *
 * 确定性: uTime = frame/fps — 同帧同像素, 可 resume 可分布式渲染。
 * 用法 (品牌双色从 theme 注入, 作 Act 背景底或全屏时刻):
 *   <ShaderPlane preset="liquidWarp" colorA={theme.color.primary} colorB="#16114F" opacity={0.5} />
 * 依赖: three + @remotion/three (scaffold package.json 已带)。
 */
import React, { useMemo } from "react";
import { AbsoluteFill, useCurrentFrame, useVideoConfig } from "remotion";
import { ThreeCanvas } from "@remotion/three";
import * as THREE from "three";

const VERT = /* glsl */ `
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

// 共享噪声头 — hash 基 value noise + fbm (无纹理依赖, 全平台一致)
const NOISE = /* glsl */ `
float hash(vec2 p) {
  p = fract(p * vec2(123.34, 456.21));
  p += dot(p, p + 45.32);
  return fract(p.x * p.y);
}
float vnoise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), u.x),
             mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x), u.y);
}
float fbm(vec2 p) {
  float v = 0.0;
  float a = 0.5;
  for (int i = 0; i < 5; i++) {
    v += a * vnoise(p);
    p = p * 2.03 + vec2(11.7, 7.3);
    a *= 0.5;
  }
  return v;
}
`;

const FRAGS: Record<string, string> = {
  // 域扭曲流体 — 深色底上两层品牌色互相渗流 (对标 domain-warp / liquid 系)
  liquidWarp: /* glsl */ `
varying vec2 vUv;
uniform float uTime;
uniform vec3 uColorA;
uniform vec3 uColorB;
${NOISE}
void main() {
  vec2 p = vUv * vec2(2.4, 1.35);
  float t = uTime * 0.09;
  vec2 q = vec2(fbm(p + t), fbm(p + vec2(5.2, 1.3) - t));
  vec2 r = vec2(fbm(p + 3.2 * q + vec2(1.7, 9.2) + t * 0.7),
                fbm(p + 2.8 * q + vec2(8.3, 2.8) - t * 0.5));
  float f = fbm(p + 3.5 * r);
  vec3 col = mix(vec3(0.02, 0.025, 0.02), uColorA, smoothstep(0.32, 0.95, f) * 0.6);
  col = mix(col, uColorB, smoothstep(0.55, 1.0, length(q)) * 0.45);
  col *= 0.85 + 0.15 * f;
  gl_FragColor = vec4(col, 1.0);
}
`,
  // 丝绸光泽 — 定向褶皱高光缓慢流动 (对标 silk / chrome-sweep 的面料版)
  silkNoise: /* glsl */ `
varying vec2 vUv;
uniform float uTime;
uniform vec3 uColorA;
uniform vec3 uColorB;
${NOISE}
void main() {
  vec2 p = vUv * vec2(3.0, 6.0);
  float t = uTime * 0.12;
  float bands = fbm(vec2(p.x * 0.7 + t, p.y * 0.22 - t * 0.4));
  float sheen = pow(smoothstep(0.35, 0.75, bands), 3.0);
  float base = fbm(p * 0.5 + t * 0.2);
  vec3 col = mix(vec3(0.015, 0.02, 0.015), uColorB * 0.35, base);
  col += uColorA * sheen * 0.55;
  gl_FragColor = vec4(col, 1.0);
}
`,
  // 透镜流光 — 移动折射团把底色拉出色散边 (对标 gravitational-lens 的克制版)
  lensFlow: /* glsl */ `
varying vec2 vUv;
uniform float uTime;
uniform vec3 uColorA;
uniform vec3 uColorB;
${NOISE}
void main() {
  vec2 uv = vUv;
  float t = uTime * 0.07;
  vec2 c = vec2(0.5 + 0.28 * sin(t * 2.1), 0.5 + 0.22 * cos(t * 1.7));
  vec2 d = uv - c;
  float dist = length(d);
  float lens = exp(-dist * dist * 9.0);
  vec2 warped = uv - d * lens * 0.35;
  float f = fbm(warped * 3.2 + t);
  float rim = smoothstep(0.32, 0.0, abs(dist - 0.24)) * lens;
  vec3 col = mix(vec3(0.02, 0.024, 0.02), uColorB * 0.5, f);
  col += uColorA * (lens * 0.35 + rim * 0.5);
  gl_FragColor = vec4(col, 1.0);
}
`,
};

export type ShaderPreset = keyof typeof FRAGS;

const hex2vec = (hex: string): THREE.Vector3 => {
  const c = new THREE.Color(hex);
  return new THREE.Vector3(c.r, c.g, c.b);
};

export const ShaderPlane: React.FC<{
  preset: ShaderPreset;
  colorA: string;
  colorB: string;
  /** 整层透明度 — 当氛围底时压低 (0.35-0.6), 当全屏时刻可拉满 */
  opacity?: number;
  /** 时间偏移 (秒) — 多实例去同步 */
  phase?: number;
}> = ({ preset, colorA, colorB, opacity = 1, phase = 0 }) => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();

  const material = useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader: VERT,
        fragmentShader: FRAGS[preset],
        uniforms: {
          uTime: { value: 0 },
          uColorA: { value: hex2vec(colorA) },
          uColorB: { value: hex2vec(colorB) },
        },
      }),
    [preset, colorA, colorB],
  );
  material.uniforms.uTime.value = frame / fps + phase;

  return (
    <AbsoluteFill style={{ opacity }}>
      <ThreeCanvas
        width={width}
        height={height}
        orthographic
        camera={{ position: [0, 0, 5], zoom: 1 }}
        style={{ width: "100%", height: "100%" }}
      >
        <mesh material={material}>
          {/* r3f 正交视口单位 = 像素 (zoom 1) — plane 直接用全尺寸铺满 */}
          <planeGeometry args={[width, height]} />
        </mesh>
      </ThreeCanvas>
    </AbsoluteFill>
  );
};

export const SHADER_PRESETS = Object.keys(FRAGS) as ShaderPreset[];

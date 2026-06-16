import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { TransformControls } from 'three/addons/controls/TransformControls.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

// --- 全域變數定義 ---
let container, scene, camera, renderer;
let orbitControls, transformControls;
let robotModel = null;

// 骨骼節點映射表
const joints = {
    mixamorigRightArm: null,
    mixamorigRightForeArm: null,
    mixamorigRightHand: null,
    mixamorigLeftArm: null,
    mixamorigLeftForeArm: null,
    mixamorigLeftHand: null
};

// --- 初始化呼叫 ---
init();

function init() {
    container = document.getElementById('canvas-container');

    // 1. 場景建立
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0a0a0f);
    scene.fog = new THREE.FogExp2(0x0a0a0f, 0.15);

    // 2. 相機設定 (針對雙臂入鏡微調初始距離)
    camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 100);
    resetCamera('front');

    // 3. 渲染器設定
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    container.appendChild(renderer.domElement);

    // 4. 光影設計
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);

    const dirLight1 = new THREE.DirectionalLight(0x6366f1, 1.2); // 帶點科技藍的主光
    dirLight1.position.set(5, 8, 5);
    dirLight1.castShadow = true;
    dirLight1.shadow.mapSize.width = 2048;
    dirLight1.shadow.mapSize.height = 2048;
    scene.add(dirLight1);

    const dirLight2 = new THREE.DirectionalLight(0xff007f, 0.5); // 側邊補桃紅霓虹光
    dirLight2.position.set(-5, 3, -2);
    scene.add(dirLight2);

    const floorGrid = new THREE.GridHelper(20, 20, 0x6366f1, 0x222233);
    floorGrid.position.y = 0;
    scene.add(floorGrid);

    // 5. 視角控制器 (OrbitControls)
    orbitControls = new OrbitControls(camera, renderer.domElement);
    orbitControls.enableDamping = true;
    orbitControls.dampingFactor = 0.05;
    orbitControls.target.set(0, 1.2, 0); // 聚焦在機器人胸腔/肩膀中心高度
    orbitControls.update();

    // 6. 骨骼旋轉控制器 (TransformControls)
    transformControls = new TransformControls(camera, renderer.domElement);
    transformControls.setMode('rotate'); // Tutting 核心為旋轉控制
    transformControls.setSpace('local'); // 嚴格限制在局部坐標系
    transformControls.setSize(0.8);     // 調整控制軸大小避免擋住模型
    scene.add(transformControls);

    // 互斥邏輯：拖曳 Transform 控制軸時暫停 OrbitControls
    transformControls.addEventListener('dragging-changed', (event) => {
        orbitControls.enabled = !event.value;
    });

    // 7. 載入 Xbot 模型
    const loader = new GLTFLoader();
    loader.load(
        'https://threejs.org/examples/models/gltf/Xbot.glb',
        (gltf) => {
            robotModel = gltf.scene;
            
            // 開啟陰影投射
            robotModel.traverse((child) => {
                if (child.isMesh) {
                    child.castShadow = true;
                    child.receiveShadow = true;
                    // 優化材質科技感
                    if(child.material) {
                        child.material.roughness = 0.4;
                        child.material.metalness = 0.2;
                    }
                }
                
                // 擷取指定的 Mixamo 雙臂 6 個關鍵骨骼節點
                if (child.isBone && joints.hasOwnProperty(child.name)) {
                    joints[child.name] = child;
                }
            });

            scene.add(robotModel);
            
            // T-Pose 初始微調：讓雙臂平舉更適合 Tutting 起手式
            initTuttingPose();

            // 關閉 Loading 遮罩
            const loaderOverlay = document.getElementById('loading-overlay');
            if (loaderOverlay) {
                loaderOverlay.style.opacity = '0';
                setTimeout(() => loaderOverlay.remove(), 500);
            }
        },
        (xhr) => {
            if (xhr.total > 0) {
                const percent = Math.round((xhr.loaded / xhr.total) * 100);
                const loadingText = document.getElementById('loading-text');
                if (loadingText) loadingText.innerText = `正在載入 3D 機器人模型... ${percent}%`;
            }
        },
        (error) => {
            console.error('模型載入失敗:', error);
            const loadingText = document.getElementById('loading-text');
            if (loadingText) loadingText.innerText = '載入失敗，請重新整理網頁';
        }
    );

    // 8. UI 事件監聽綁定
    setupUIEventListeners();

    // 9. 視窗縮放適應
    window.addEventListener('resize', onWindowResize);

    // 10. 開始渲染迴圈
    animate();
}

// 初始姿勢調整 (讓雙臂呈標準水平以利幾何變換)
function initTuttingPose() {
    // 使用 Quaternion 進行安全的基礎角度賦值
    if (joints.mixamorigRightArm) {
        joints.mixamorigRightArm.quaternion.setFromAxisAngle(new THREE.Vector3(0, 0, 1), -Math.PI / 2.3);
    }
    if (joints.mixamorigLeftArm) {
        joints.mixamorigLeftArm.quaternion.setFromAxisAngle(new THREE.Vector3(0, 0, 1), Math.PI / 2.3);
    }
}

// UI 互動事件設定
function setupUIEventListeners() {
    const jointSelect = document.getElementById('joint-select');
    
    // 下拉選單切換控制節點
    jointSelect.addEventListener('change', (e) => {
        const selectedJointName = e.target.value;
        if (selectedJointName !== 'none' && joints[selectedJointName]) {
            // 將 TransformControls 附著到該骨骼物件上
            transformControls.attach(joints[selectedJointName]);
        } else {
            transformControls.detach();
        }
    });

    // 視角切換按鈕事件
    document.getElementById('btn-front').addEventListener('click', () => resetCamera('front'));
    document.getElementById('btn-side').addEventListener('click', () => resetCamera('side'));
    document.getElementById('btn-top').addEventListener('click', () => resetCamera('top'));
}

// 精準視角切換控制 (含雙臂完整入鏡微調)
function resetCamera(view) {
    const targetY = 1.2; // 聚焦在肩膀與胸口高度
    
    if (orbitControls) {
        orbitControls.target.set(0, targetY, 0);
    }

    switch (view) {
        case 'front':
            camera.position.set(0, targetY, 2.2); // 正面：拉近距離凸顯手部幾何
            break;
        case 'side':
            camera.position.set(2.2, targetY, 0); // 絕對右側面
            break;
        case 'top':
            camera.position.set(0, targetY + 2.0, 0.01); // 俯視：微調 Z 軸防萬向鎖
            break;
    }
    
    if (orbitControls) {
        orbitControls.update();
    }
}

// 視窗尺寸改變
function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

// 渲染與更新迴圈
function animate() {
    requestAnimationFrame(animate);

    // 更新相機軌道控制器
    if (orbitControls) orbitControls.update();

    // 渲染場景
    if (renderer && scene && camera) renderer.render(scene, camera);
}

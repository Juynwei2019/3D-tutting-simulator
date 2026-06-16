# 3D Tutting Simulator MVP

一個基於網頁原生技術（Vanilla JS & Three.js）開發的 **3D 埃及手（Tutting）舞蹈幾何模擬器**。本專案為輕量化 MVP（最小可行性產品）版本，旨在提供舞者、編舞家與多媒體開發者一個直觀、無痛的 3D 雙臂正向運動學（Forward Kinematics, FK）骨骼控制工具，用以實驗與記錄人體幾何線條。

![Three.js](https://img.shields.io/badge/3D_Engine-Three.js_r160-blue?style=flat-square&logo=three.js)
![JavaScript](https://img.shields.io/badge/Language-Vanilla_JS-F7DF1E?style=flat-square&logo=javascript&logoColor=black)
![License](https://img.shields.io/badge/License-MIT-green?style=flat-square)

---

## 🚀 核心特色

* **零建置成本 (Zero Setup)**：純 HTML5、CSS3 與 Vanilla JS 打造，單一檔案即開即用，**無需**安裝 Node.js、Webpack 或 Vite 等打包工具。
* **精準局部空間控制 (Local Space FK)**：旋轉控制軸嚴格綁定於骨骼的**局部坐標系**。當肩膀旋轉時，下階層的手肘、手腕會完美連動；單獨調整手肘時，會依循上臂的延伸方向折疊，完美重現 Tutting 舞蹈的 90 度幾何邏輯。
* **四元數 (Quaternion) 驅動**：底層骨骼旋轉完全基於四元數數學模型，徹底杜絕 3D 歐拉角旋轉常見的「萬向鎖（Gimbal Lock）」問題。
* **流暢的 UI/UX 互斥邏輯**：當使用者拖曳 3D 旋轉軸控制骨骼時，系統會自動暫停背景的鏡頭軌道控制（OrbitControls），放開時自動恢復，操作絕不打架。
* **賽博龐克視覺風格**：介面採用現代半透明深色玻璃擬態（Glassmorphism），場景配置靛藍與霓虹桃紅雙色對比光源，完美勾勒出機械結構的幾何陰影。

---

## 🛠️ 技術棧

* **核心引擎**：Three.js (r160) via CDN Import Map
* **3D 模型**：標準 Mixamo 骨骼架構 Xbot 機器人模型 (`.glb`)
* **控制組件**：`OrbitControls` (視角導覽) + `TransformControls` (骨骼旋轉)
* **模組管理**：原生 ES Module (`type="module"`) 搭配 `es-module-shims`

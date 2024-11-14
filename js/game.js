import { UFO } from './entities/ufo.js';
import { Base } from './entities/base.js';
import { ZombieManager } from './managers/zombieManager.js';
import { TowerManager } from './managers/towerManager.js';
import { ResourceManager } from './managers/resourceManager.js';
import { UpgradeManager } from './managers/upgradeManager.js';
import { Joystick } from './joystick.js';

export class Game {
    constructor() {
        this.setupScene();
        this.setupGame();
        this.paused = false;
        this.gameIsOver = false;
    }

    setupScene() {
        // Initialize Three.js scene
        this.scene = new THREE.Scene();
        
        // Set up camera with 9:16 aspect ratio
        const aspectRatio = 9 / 16;
        const width = window.innerHeight * aspectRatio;
        const height = window.innerHeight;
        this.camera = new THREE.PerspectiveCamera(75, aspectRatio, 0.1, 1000);
        
        this.renderer = new THREE.WebGLRenderer({
            canvas: document.getElementById('gameCanvas'),
            antialias: true
        });
        
        // Configure renderer
        this.renderer.setSize(width, height);
        this.renderer.setPixelRatio(window.devicePixelRatio);
        this.renderer.shadowMap.enabled = true;

        // Set up camera
        this.camera.position.set(0, 30, 20);
        this.camera.lookAt(0, 0, 0);

        // Add lights
        this.setupLights();

        // Create ground
        this.createGround();
    }

    setupLights() {
        // Ambient light
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
        this.scene.add(ambientLight);

        // Directional light with shadows
        const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
        directionalLight.position.set(10, 20, 10);
        directionalLight.castShadow = true;
        
        // Configure shadow properties
        directionalLight.shadow.mapSize.width = 2048;
        directionalLight.shadow.mapSize.height = 2048;
        directionalLight.shadow.camera.near = 0.5;
        directionalLight.shadow.camera.far = 50;
        directionalLight.shadow.camera.left = -30;
        directionalLight.shadow.camera.right = 30;
        directionalLight.shadow.camera.top = 30;
        directionalLight.shadow.camera.bottom = -30;

        this.scene.add(directionalLight);
    }

    createGround() {
        // Create textured ground
        const groundGeometry = new THREE.PlaneGeometry(100, 100, 20, 20);
        const groundMaterial = new THREE.MeshStandardMaterial({
            color: 0x1a472a,
            roughness: 0.8,
            metalness: 0.2
        });
        
        this.ground = new THREE.Mesh(groundGeometry, groundMaterial);
        this.ground.rotation.x = -Math.PI / 2;
        this.ground.receiveShadow = true;
        
        // Add some height variation
        const vertices = groundGeometry.attributes.position.array;
        for (let i = 0; i < vertices.length; i += 3) {
            if (i !== 0 && i !== vertices.length - 3) { // Keep edges flat
                vertices[i + 1] = Math.random() * 0.5;
            }
        }
        groundGeometry.computeVertexNormals();
        
        this.scene.add(this.ground);
    }

    setupGame() {
        // Initialize game state
        this.resources = 100;
        this.level = 1;
        this.wave = 1;
        
        // Initialize managers
        this.resourceManager = new ResourceManager(this);
        this.zombieManager = new ZombieManager(this);
        this.towerManager = new TowerManager(this);
        this.upgradeManager = new UpgradeManager(this);
        
        // Initialize entities
        this.base = new Base(this);
        this.ufo = new UFO(this);

        // Initialize joystick
        this.joystick = new Joystick();
        
        // Update UI
        this.updateUI();
    }

    start() {
        this.zombieManager.startWave();
        this.animate();
    }

    animate() {
        if (this.gameIsOver) return;

        requestAnimationFrame(() => this.animate());

        if (!this.paused) {
            this.update();
        }

        this.renderer.render(this.scene, this.camera);
    }

    updateCamera() {
        if (!this.ufo) return;

        // Calculate camera target position
        const targetCameraPos = new THREE.Vector3(
            this.ufo.position.x,
            30, // Keep height constant
            this.ufo.position.z + 20 // Keep same distance behind UFO
        );

        // Smoothly interpolate camera position
        this.camera.position.lerp(targetCameraPos, 0.1);

        // Look at UFO position
        const lookAtPos = new THREE.Vector3(
            this.ufo.position.x,
            0, // Look at ground level
            this.ufo.position.z
        );
        this.camera.lookAt(lookAtPos);
    }

    update() {
        // Get joystick input and update UFO movement
        if (this.ufo && this.joystick) {
            this.ufo.updateMovement(this.joystick.getInput());
        }

        // Update camera to follow UFO
        this.updateCamera();

        // Update entities
        if (this.ufo) this.ufo.update();
        if (this.base) this.base.update();

        // Update managers
        this.zombieManager.update();
        this.towerManager.update();
        this.resourceManager.update();
    }

    updateUI() {
        document.getElementById('resource-count').textContent = this.resources;
        document.getElementById('level-count').textContent = this.level;
        document.getElementById('wave-count').textContent = this.wave;
    }

    togglePause() {
        this.paused = !this.paused;
        const pauseMenu = document.getElementById('pause-menu');
        if (pauseMenu) {
            pauseMenu.classList.toggle('hidden', !this.paused);
        }
    }

    gameOver() {
        this.gameIsOver = true;
        
        const overlay = document.createElement('div');
        overlay.style.position = 'fixed';
        overlay.style.top = '0';
        overlay.style.left = '0';
        overlay.style.width = '100%';
        overlay.style.height = '100%';
        overlay.style.backgroundColor = 'rgba(0, 0, 0, 0.8)';
        overlay.style.display = 'flex';
        overlay.style.flexDirection = 'column';
        overlay.style.justifyContent = 'center';
        overlay.style.alignItems = 'center';
        overlay.style.color = 'white';
        overlay.style.fontSize = '2em';
        overlay.style.zIndex = '1000';

        overlay.innerHTML = `
            <h1>Game Over</h1>
            <p>You survived ${this.wave} waves!</p>
            <button onclick="location.reload()" style="
                padding: 10px 20px;
                font-size: 0.8em;
                margin-top: 20px;
                background: #4CAF50;
                border: none;
                color: white;
                cursor: pointer;
                border-radius: 5px;
            ">Try Again</button>
        `;

        document.body.appendChild(overlay);
    }

    isValidPosition(position) {
        const distanceFromBase = position.length();
        if (distanceFromBase < 7) return false;

        for (const tower of this.towerManager.towers) {
            const distanceFromTower = position.distanceTo(tower.position);
            if (distanceFromTower < 3) return false;
        }

        return true;
    }
}

export class TowerManager {
    constructor(game) {
        this.game = game;
        this.scene = game.scene;
        this.towers = [];
        this.towerTypes = {
            turret: {
                name: 'Turret',
                cost: 100,
                damage: 20,
                range: 15,
                fireRate: 1000, // ms between shots
                color: 0x666666,
                projectileColor: 0xff0000
            },
            mortar: {
                name: 'Mortar',
                cost: 200,
                damage: 50,
                range: 25,
                fireRate: 2000,
                color: 0x444444,
                projectileColor: 0xff6600
            },
            flamethrower: {
                name: 'Flamethrower',
                cost: 150,
                damage: 10,
                range: 10,
                fireRate: 100,
                color: 0x993300,
                projectileColor: 0xff3300
            }
        };

        this.setupEventListeners();
    }

    setupEventListeners() {
        // Add tower placement mode
        document.addEventListener('keydown', (e) => {
            if (e.key >= '1' && e.key <= '3') {
                const towerTypes = Object.values(this.towerTypes);
                const selectedType = towerTypes[e.key - 1];
                if (selectedType && this.game.resources >= selectedType.cost) {
                    this.enterPlacementMode(selectedType);
                }
            }
        });

        // Handle tower placement
        document.addEventListener('click', (e) => {
            if (this.placementMode) {
                const raycaster = new THREE.Raycaster();
                const mouse = new THREE.Vector2(
                    (e.clientX / window.innerWidth) * 2 - 1,
                    -(e.clientY / window.innerHeight) * 2 + 1
                );

                raycaster.setFromCamera(mouse, this.game.camera);
                const intersects = raycaster.intersectObjects([this.game.ground]);

                if (intersects.length > 0) {
                    const position = intersects[0].point;
                    this.placeTower(position);
                }
            }
        });
    }

    enterPlacementMode(towerType) {
        this.placementMode = true;
        this.selectedTowerType = towerType;
        
        // Create preview tower
        if (this.previewTower) {
            this.scene.remove(this.previewTower);
        }
        
        this.previewTower = this.createTowerMesh(towerType);
        this.previewTower.material.opacity = 0.5;
        this.previewTower.material.transparent = true;
        this.scene.add(this.previewTower);

        // Update preview position on mouse move
        this.previewMouseMove = (e) => {
            const raycaster = new THREE.Raycaster();
            const mouse = new THREE.Vector2(
                (e.clientX / window.innerWidth) * 2 - 1,
                -(e.clientY / window.innerHeight) * 2 + 1
            );

            raycaster.setFromCamera(mouse, this.game.camera);
            const intersects = raycaster.intersectObjects([this.game.ground]);

            if (intersects.length > 0) {
                this.previewTower.position.copy(intersects[0].point);
                this.previewTower.position.y = 1;
            }
        };

        document.addEventListener('mousemove', this.previewMouseMove);
    }

    exitPlacementMode() {
        this.placementMode = false;
        this.selectedTowerType = null;
        
        if (this.previewTower) {
            this.scene.remove(this.previewTower);
            this.previewTower = null;
        }
        
        if (this.previewMouseMove) {
            document.removeEventListener('mousemove', this.previewMouseMove);
            this.previewMouseMove = null;
        }
    }

    createTowerMesh(towerType) {
        const baseGeometry = new THREE.CylinderGeometry(1, 1.2, 2, 8);
        const turretGeometry = new THREE.BoxGeometry(0.8, 0.8, 2);
        
        const material = new THREE.MeshPhongMaterial({
            color: towerType.color
        });

        const base = new THREE.Mesh(baseGeometry, material);
        const turret = new THREE.Mesh(turretGeometry, material);
        turret.position.y = 1;
        turret.position.z = 0.5;

        const tower = new THREE.Group();
        tower.add(base);
        tower.add(turret);
        
        return tower;
    }

    placeTower(position) {
        if (this.game.resources >= this.selectedTowerType.cost) {
            const tower = new Tower(this.game, this.selectedTowerType, position);
            this.towers.push(tower);
            this.game.resources -= this.selectedTowerType.cost;
            this.game.updateUI();
            this.exitPlacementMode();
        }
    }

    update() {
        this.towers.forEach(tower => tower.update());
    }
}

class Tower {
    constructor(game, type, position) {
        this.game = game;
        this.scene = game.scene;
        this.type = type;
        this.position = position;
        this.lastFireTime = 0;
        this.projectiles = [];
        
        this.createTowerModel();
    }

    createTowerModel() {
        this.model = this.game.towerManager.createTowerMesh(this.type);
        this.model.position.copy(this.position);
        this.model.position.y = 1;
        this.scene.add(this.model);
    }

    update() {
        // Update tower rotation and targeting
        const target = this.findTarget();
        if (target) {
            // Rotate turret towards target
            const turret = this.model.children[1];
            turret.lookAt(target.model.position);

            // Fire if cooldown is complete
            const now = Date.now();
            if (now - this.lastFireTime >= this.type.fireRate) {
                this.fire(target);
                this.lastFireTime = now;
            }
        }

        // Update projectiles
        for (let i = this.projectiles.length - 1; i >= 0; i--) {
            const projectile = this.projectiles[i];
            projectile.update();
            
            if (projectile.hasHit || projectile.position.distanceTo(this.position) > this.type.range) {
                this.scene.remove(projectile.model);
                this.projectiles.splice(i, 1);
            }
        }
    }

    findTarget() {
        let nearestZombie = null;
        let nearestDistance = this.type.range;

        this.game.zombieManager.zombies.forEach(zombie => {
            const distance = zombie.model.position.distanceTo(this.position);
            if (distance < nearestDistance) {
                nearestZombie = zombie;
                nearestDistance = distance;
            }
        });

        return nearestZombie;
    }

    fire(target) {
        const projectile = new Projectile(this, target);
        this.projectiles.push(projectile);
    }
}

class Projectile {
    constructor(tower, target) {
        this.tower = tower;
        this.target = target;
        this.position = tower.model.position.clone();
        this.speed = 0.5;
        this.hasHit = false;
        
        this.createProjectileModel();
    }

    createProjectileModel() {
        const geometry = new THREE.SphereGeometry(0.2, 8, 8);
        const material = new THREE.MeshPhongMaterial({
            color: this.tower.type.projectileColor,
            emissive: this.tower.type.projectileColor,
            emissiveIntensity: 0.5
        });
        
        this.model = new THREE.Mesh(geometry, material);
        this.model.position.copy(this.position);
        this.tower.scene.add(this.model);
    }

    update() {
        if (!this.hasHit) {
            // Move towards target
            const direction = this.target.model.position.clone()
                .sub(this.model.position)
                .normalize();
            
            this.model.position.add(direction.multiplyScalar(this.speed));
            
            // Check for collision
            if (this.model.position.distanceTo(this.target.model.position) < 0.5) {
                this.hit();
            }
        }
    }

    hit() {
        this.hasHit = true;
        this.target.takeDamage(this.tower.type.damage);
    }
}

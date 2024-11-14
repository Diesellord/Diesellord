export class ZombieManager {
    constructor(game) {
        this.game = game;
        this.scene = game.scene;
        this.zombies = [];
        this.waveNumber = 1;
        this.spawnPoints = this.createSpawnPoints();
        this.zombieTypes = [
            {
                type: 'normal',
                health: 100,
                speed: 0.005, // Further reduced speed
                damage: 10,
                scale: 1,
                color: 0x00ff00
            },
            {
                type: 'fast',
                health: 50,
                speed: 0.01, // Further reduced speed
                damage: 5,
                scale: 0.8,
                color: 0xff0000
            },
            {
                type: 'tank',
                health: 200,
                speed: 0.003, // Further reduced speed
                damage: 20,
                scale: 1.5,
                color: 0x0000ff
            }
        ];
    }

    createSpawnPoints() {
        const points = [];
        const spawnRadius = 40;
        
        for (let angle = 0; angle < Math.PI * 2; angle += Math.PI / 16) {
            const randomRadius = spawnRadius + (Math.random() * 10 - 5);
            const randomAngle = angle + (Math.random() * 0.2 - 0.1);
            
            points.push(new THREE.Vector3(
                Math.cos(randomAngle) * randomRadius,
                0,
                Math.sin(randomAngle) * randomRadius
            ));
        }
        return points;
    }

    startWave() {
        const zombieCount = Math.floor(5 * Math.pow(1.2, this.waveNumber));
        this.spawnWave(zombieCount);
        this.waveNumber++;
        this.game.wave = this.waveNumber;
        this.game.updateUI();
    }

    spawnWave(count) {
        let spawned = 0;
        const baseInterval = 2000;
        
        const spawnNext = () => {
            if (spawned >= count) return;

            this.spawnZombie();
            spawned++;

            const randomDelay = baseInterval + Math.random() * 2000;
            setTimeout(spawnNext, randomDelay);
        };

        setTimeout(spawnNext, Math.random() * 1000);
    }

    spawnZombie() {
        const zombieType = this.selectZombieType();
        const spawnPoint = this.getRandomSpawnPoint();
        const zombie = new Zombie(this.game, zombieType, spawnPoint);
        this.zombies.push(zombie);
    }

    getRandomSpawnPoint() {
        const basePoint = this.spawnPoints[Math.floor(Math.random() * this.spawnPoints.length)];
        const randomOffset = new THREE.Vector3(
            (Math.random() * 10 - 5),
            0,
            (Math.random() * 10 - 5)
        );
        return basePoint.clone().add(randomOffset);
    }

    selectZombieType() {
        let types = [...this.zombieTypes];
        if (this.waveNumber < 3) {
            types = [this.zombieTypes[0]];
        } else if (this.waveNumber < 5) {
            types = this.zombieTypes.slice(0, 2);
        }
        return types[Math.floor(Math.random() * types.length)];
    }

    update() {
        for (let i = this.zombies.length - 1; i >= 0; i--) {
            const zombie = this.zombies[i];
            zombie.update();

            // Check if zombie is caught in UFO's tractor beam
            if (this.game.ufo && this.game.ufo.tractorBeam.visible) {
                const zombiePos = zombie.model.position;
                const ufoPos = this.game.ufo.position;
                const distanceToUFO = zombiePos.distanceTo(ufoPos);
                
                // Calculate if zombie is within the conical beam
                const heightDiff = ufoPos.y - zombiePos.y;
                const beamRadius = (heightDiff / 8) * 2; // Cone expands from 0.5 to 2 units radius
                const horizontalDist = Math.sqrt(
                    Math.pow(zombiePos.x - ufoPos.x, 2) + 
                    Math.pow(zombiePos.z - ufoPos.z, 2)
                );

                if (horizontalDist < beamRadius && heightDiff > 0) {
                    // Pull zombie towards UFO
                    const pullDirection = new THREE.Vector3()
                        .subVectors(ufoPos, zombiePos)
                        .normalize();
                    zombie.model.position.add(pullDirection.multiplyScalar(0.2));

                    // If zombie is close enough to UFO, destroy it
                    if (distanceToUFO < 2) {
                        this.removeZombie(i);
                        continue;
                    }
                }
            }

            if (zombie.health <= 0) {
                this.removeZombie(i);
            }
        }

        if (this.zombies.length === 0) {
            this.startWave();
        }
    }

    removeZombie(index) {
        const zombie = this.zombies[index];
        this.scene.remove(zombie.model);
        this.zombies.splice(index, 1);
        this.game.resourceManager.spawnResource(zombie.model.position);
    }
}

class Zombie {
    constructor(game, type, spawnPoint) {
        this.game = game;
        this.scene = game.scene;
        this.type = type;
        this.health = type.health;
        this.speed = type.speed;
        this.damage = type.damage;
        
        this.position = spawnPoint.clone();
        this.createZombieModel();
    }

    createZombieModel() {
        const bodyGeometry = new THREE.BoxGeometry(1, 2, 1);
        const bodyMaterial = new THREE.MeshPhongMaterial({ color: this.type.color });
        this.model = new THREE.Mesh(bodyGeometry, bodyMaterial);
        this.model.position.copy(this.position);
        this.model.scale.multiplyScalar(this.type.scale);
        this.scene.add(this.model);
    }

    update() {
        const randomOffset = new THREE.Vector3(
            (Math.random() - 0.5) * 0.1,
            0,
            (Math.random() - 0.5) * 0.1
        );

        const direction = new THREE.Vector3(0, 0, 0)
            .sub(this.model.position)
            .normalize()
            .add(randomOffset)
            .normalize();
        
        this.model.position.add(direction.multiplyScalar(this.speed));
        this.model.lookAt(0, 0, 0);

        if (this.model.position.length() < 5) {
            this.attackBase();
        }
    }

    attackBase() {
        if (this.game.base) {
            this.game.base.takeDamage(this.damage);
        }
    }

    takeDamage(amount) {
        this.health -= amount;
        if (this.health <= 0) {
            this.die();
        }
    }

    die() {
        this.health = 0;
    }
}

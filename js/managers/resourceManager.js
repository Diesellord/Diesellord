export class ResourceManager {
    constructor(game) {
        this.game = game;
        this.scene = game.scene;
        this.resources = [];
    }

    spawnResource(position) {
        const resource = new Resource(this.game, position);
        this.resources.push(resource);
    }

    update() {
        // Update and collect resources
        for (let i = this.resources.length - 1; i >= 0; i--) {
            const resource = this.resources[i];
            resource.update();

            // Check if resource is collected by UFO tractor beam
            if (this.game.ufo && this.game.ufo.tractorBeam.visible) {
                const distance = resource.model.position.distanceTo(this.game.ufo.position);
                if (distance < 3) {
                    this.collectResource(i);
                }
            }
        }
    }

    collectResource(index) {
        const resource = this.resources[index];
        this.game.resources += resource.value;
        this.game.ufo.addExperience(10);
        this.game.updateUI();

        // Remove resource
        this.scene.remove(resource.model);
        this.resources.splice(index, 1);
    }
}

class Resource {
    constructor(game, position) {
        this.game = game;
        this.scene = game.scene;
        this.position = position.clone();
        this.value = 10;
        this.createResourceModel();
    }

    createResourceModel() {
        const geometry = new THREE.BoxGeometry(0.5, 0.5, 0.5);
        const material = new THREE.MeshPhongMaterial({
            color: 0x00ffff,
            emissive: 0x00ffff,
            emissiveIntensity: 0.5
        });

        this.model = new THREE.Mesh(geometry, material);
        this.model.position.copy(this.position);
        this.model.position.y = 1;

        this.scene.add(this.model);
    }

    update() {
        // Floating animation
        this.model.position.y = this.position.y + Math.sin(Date.now() * 0.003) * 0.2;
        this.model.rotation.y += 0.02;

        // If UFO tractor beam is active and nearby, move towards it
        if (this.game.ufo && this.game.ufo.tractorBeam.visible) {
            const distance = this.model.position.distanceTo(this.game.ufo.position);
            if (distance < 5) {
                const direction = this.game.ufo.position.clone()
                    .sub(this.model.position)
                    .normalize();
                this.model.position.add(direction.multiplyScalar(0.2));
            }
        }
    }
}

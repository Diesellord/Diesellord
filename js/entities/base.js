export class Base {
    constructor(game) {
        this.game = game;
        this.scene = game.scene;
        this.maxHealth = 1000;
        this.health = this.maxHealth;
        this.regenerationRate = 0;
        this.lastRegenerationTime = 0;
        
        this.createBaseModel();
        this.createHealthBar();
    }

    createBaseModel() {
        // Create main base structure
        const baseGeometry = new THREE.CylinderGeometry(5, 6, 4, 8);
        const baseMaterial = new THREE.MeshPhongMaterial({
            color: 0x444444,
            metalness: 0.8,
            roughness: 0.2
        });
        this.baseStructure = new THREE.Mesh(baseGeometry, baseMaterial);

        // Create dome
        const domeGeometry = new THREE.SphereGeometry(5, 32, 32, 0, Math.PI * 2, 0, Math.PI / 2);
        const domeMaterial = new THREE.MeshPhongMaterial({
            color: 0x666666,
            metalness: 0.6,
            roughness: 0.4
        });
        this.dome = new THREE.Mesh(domeGeometry, domeMaterial);
        this.dome.position.y = 2;

        // Create energy core
        const coreGeometry = new THREE.SphereGeometry(1, 16, 16);
        const coreMaterial = new THREE.MeshPhongMaterial({
            color: 0x00ff88,
            emissive: 0x00ff88,
            emissiveIntensity: 0.5
        });
        this.core = new THREE.Mesh(coreGeometry, coreMaterial);
        this.core.position.y = 3;

        // Create base group
        this.model = new THREE.Group();
        this.model.add(this.baseStructure);
        this.model.add(this.dome);
        this.model.add(this.core);

        // Add to scene
        this.scene.add(this.model);
    }

    createHealthBar() {
        // Create health bar container
        const containerGeometry = new THREE.BoxGeometry(12, 0.5, 0.1);
        const containerMaterial = new THREE.MeshBasicMaterial({ color: 0x333333 });
        this.healthBarContainer = new THREE.Mesh(containerGeometry, containerMaterial);
        this.healthBarContainer.position.y = 8;

        // Create health bar
        const healthGeometry = new THREE.BoxGeometry(12, 0.5, 0.2);
        const healthMaterial = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
        this.healthBar = new THREE.Mesh(healthGeometry, healthMaterial);

        // Add to scene
        this.healthBarContainer.add(this.healthBar);
        this.model.add(this.healthBarContainer);

        // Make health bar always face camera
        this.game.scene.add(this.healthBarContainer);
    }

    update() {
        // Update health bar scale and color based on health
        const healthPercent = this.health / this.maxHealth;
        this.healthBar.scale.x = healthPercent;
        this.healthBar.position.x = -6 * (1 - healthPercent);

        // Update health bar color
        const hue = healthPercent * 0.3; // Goes from red (0) to green (0.3)
        this.healthBar.material.color.setHSL(hue, 1, 0.5);

        // Make health bar face camera
        this.healthBarContainer.lookAt(this.game.camera.position);

        // Pulse core based on health
        const pulseScale = 0.9 + 0.2 * Math.sin(Date.now() * 0.003) * healthPercent;
        this.core.scale.set(pulseScale, pulseScale, pulseScale);
        this.core.material.emissiveIntensity = 0.5 * healthPercent;

        // Handle health regeneration
        if (this.regenerationRate > 0) {
            const now = Date.now();
            if (now - this.lastRegenerationTime >= 1000) { // Regenerate every second
                this.heal(this.regenerationRate);
                this.lastRegenerationTime = now;
            }
        }
    }

    takeDamage(amount) {
        this.health = Math.max(0, this.health - amount);
        
        // Create damage effect
        this.showDamageEffect();

        // Check for game over
        if (this.health <= 0) {
            this.game.gameOver();
        }
    }

    heal(amount) {
        this.health = Math.min(this.maxHealth, this.health + amount);
    }

    showDamageEffect() {
        // Flash the base red
        const originalColor = this.baseStructure.material.color.clone();
        this.baseStructure.material.color.setHex(0xff0000);
        this.dome.material.color.setHex(0xff0000);

        setTimeout(() => {
            this.baseStructure.material.color.copy(originalColor);
            this.dome.material.color.copy(originalColor);
        }, 100);

        // Create explosion particles
        const particleCount = 10;
        const particles = new THREE.Group();
        
        for (let i = 0; i < particleCount; i++) {
            const geometry = new THREE.SphereGeometry(0.2, 4, 4);
            const material = new THREE.MeshBasicMaterial({
                color: 0xff0000,
                transparent: true
            });
            
            const particle = new THREE.Mesh(geometry, material);
            const angle = Math.random() * Math.PI * 2;
            const radius = Math.random() * 2 + 3;
            particle.position.set(
                Math.cos(angle) * radius,
                Math.random() * 4,
                Math.sin(angle) * radius
            );
            
            particles.add(particle);
        }

        this.scene.add(particles);

        // Animate particles
        let frame = 0;
        const animateParticles = setInterval(() => {
            frame++;
            particles.children.forEach(particle => {
                particle.position.y += 0.1;
                particle.material.opacity = 1 - frame / 20;
            });

            if (frame >= 20) {
                clearInterval(animateParticles);
                this.scene.remove(particles);
            }
        }, 50);
    }
}

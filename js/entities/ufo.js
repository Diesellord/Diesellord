export class UFO {
    constructor(game) {
        this.game = game;
        this.scene = game.scene;
        this.position = new THREE.Vector3(0, 10, 0);
        this.targetPosition = new THREE.Vector3(0, 10, 0);
        this.level = 1;
        this.experience = 0;
        this.abilities = [];
        this.moveSpeed = 0.3;
        
        this.createUFOModel();
    }

    createUFOModel() {
        // Create UFO body
        const bodyGeometry = new THREE.CylinderGeometry(0, 2, 1, 32);
        const bodyMaterial = new THREE.MeshPhongMaterial({ 
            color: 0x666666,
            metalness: 0.8,
            roughness: 0.2
        });
        this.body = new THREE.Mesh(bodyGeometry, bodyMaterial);
        this.body.position.copy(this.position);

        // Create UFO dome
        const domeGeometry = new THREE.SphereGeometry(1.5, 32, 32, 0, Math.PI * 2, 0, Math.PI / 2);
        const domeMaterial = new THREE.MeshPhongMaterial({ 
            color: 0x44ff44,
            transparent: true,
            opacity: 0.6
        });
        this.dome = new THREE.Mesh(domeGeometry, domeMaterial);
        this.dome.position.y = 0.5;

        // Create tractor beam
        this.tractorBeam = this.createTractorBeam();
        this.tractorBeam.visible = true; // Always visible now

        // Create UFO group
        this.model = new THREE.Group();
        this.model.add(this.body);
        this.model.add(this.dome);
        this.model.add(this.tractorBeam);
        
        this.scene.add(this.model);
    }

    createTractorBeam() {
        // Create conical beam geometry
        const beamGeometry = new THREE.CylinderGeometry(2, 0.5, 8, 32, 8, true);
        const beamMaterial = new THREE.MeshPhongMaterial({
            color: 0x44ff44,
            transparent: true,
            opacity: 0.3,
            side: THREE.DoubleSide,
            depthWrite: false // Prevents z-fighting
        });
        
        // Create main beam
        const beam = new THREE.Mesh(beamGeometry, beamMaterial);
        beam.position.y = -4;

        // Add inner glow
        const innerBeamGeometry = new THREE.CylinderGeometry(1.5, 0.3, 8, 32, 8, true);
        const innerBeamMaterial = new THREE.MeshPhongMaterial({
            color: 0x88ff88,
            transparent: true,
            opacity: 0.2,
            side: THREE.DoubleSide,
            depthWrite: false
        });
        const innerBeam = new THREE.Mesh(innerBeamGeometry, innerBeamMaterial);
        beam.add(innerBeam);

        // Add beam particles
        const particleGeometry = new THREE.BufferGeometry();
        const particleCount = 100;
        const positions = new Float32Array(particleCount * 3);
        const particleMaterial = new THREE.PointsMaterial({
            color: 0x44ff44,
            size: 0.1,
            transparent: true,
            opacity: 0.5
        });

        for (let i = 0; i < particleCount; i++) {
            const angle = Math.random() * Math.PI * 2;
            const radius = Math.random() * 1.5;
            const height = Math.random() * 8;
            
            positions[i * 3] = Math.cos(angle) * radius;
            positions[i * 3 + 1] = -height;
            positions[i * 3 + 2] = Math.sin(angle) * radius;
        }

        particleGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        const particles = new THREE.Points(particleGeometry, particleMaterial);
        beam.add(particles);

        return beam;
    }

    updateMovement(joystickInput) {
        if (!joystickInput) return;

        // Calculate new position based on joystick input
        const newX = this.position.x + joystickInput.x * this.moveSpeed;
        const newZ = this.position.z + joystickInput.y * this.moveSpeed;

        // Limit movement within bounds
        const maxDistance = 40;
        const distance = Math.sqrt(newX * newX + newZ * newZ);
        
        if (distance < maxDistance) {
            this.position.x = newX;
            this.position.z = newZ;
        }
    }

    update() {
        // Update position
        this.model.position.copy(this.position);

        // Rotate UFO and dome
        this.model.rotation.y += 0.01;
        this.dome.rotation.y -= 0.02;

        // Rotate tractor beam particles
        if (this.tractorBeam.children[2]) { // Particles are the third child
            const particles = this.tractorBeam.children[2];
            const positions = particles.geometry.attributes.position.array;
            
            for (let i = 0; i < positions.length; i += 3) {
                const x = positions[i];
                const z = positions[i + 2];
                const angle = Math.atan2(z, x) + 0.02;
                const radius = Math.sqrt(x * x + z * z);
                
                positions[i] = Math.cos(angle) * radius;
                positions[i + 2] = Math.sin(angle) * radius;
            }
            
            particles.geometry.attributes.position.needsUpdate = true;
        }

        // Rotate beam effect
        this.tractorBeam.rotation.y += 0.01;
    }

    addExperience(amount) {
        this.experience += amount;
        if (this.experience >= this.getNextLevelThreshold()) {
            this.levelUp();
        }
    }

    getNextLevelThreshold() {
        return Math.floor(100 * Math.pow(1.5, this.level - 1));
    }

    levelUp() {
        this.level++;
        this.experience = 0;
        this.game.upgradeManager.showUpgradeOptions();
    }

    addAbility(ability) {
        this.abilities.push(ability);
    }

    useAbility(index) {
        if (this.abilities[index]) {
            this.abilities[index].activate();
        }
    }
}

export class UpgradeManager {
    constructor(game) {
        this.game = game;
        this.upgradeMenu = document.getElementById('upgrade-menu');
        this.upgradeOptions = document.getElementById('upgrade-options');
        
        this.availableUpgrades = [
            {
                name: 'Meteor Ring',
                description: 'Summon orbiting meteors that damage nearby zombies',
                type: 'ability',
                class: 'MeteorRingAbility'
            },
            {
                name: 'Enhanced Tractor Beam',
                description: 'Increase tractor beam range and damage',
                type: 'passive',
                effect: (ufo) => {
                    const beam = ufo.tractorBeam;
                    beam.scale.set(1.5, 1.5, 1.5);
                }
            },
            {
                name: 'Resource Magnet',
                description: 'Automatically attract nearby resources',
                type: 'passive',
                effect: (ufo) => {
                    ufo.resourceAttractionRange = 8;
                }
            },
            {
                name: 'Speed Boost',
                description: 'Increase UFO movement speed',
                type: 'passive',
                effect: (ufo) => {
                    ufo.speed *= 1.3;
                }
            },
            {
                name: 'Health Regeneration',
                description: 'Slowly regenerate base health',
                type: 'passive',
                effect: (base) => {
                    base.regenerationRate = 1;
                }
            }
        ];
    }

    showUpgradeOptions() {
        // Pause the game
        this.game.paused = true;

        // Clear previous options
        this.upgradeOptions.innerHTML = '';

        // Get three random unique upgrades
        const upgrades = this.getRandomUpgrades(3);

        // Create upgrade options
        upgrades.forEach(upgrade => {
            const option = document.createElement('div');
            option.className = 'upgrade-option';
            option.innerHTML = `
                <h3>${upgrade.name}</h3>
                <p>${upgrade.description}</p>
            `;

            option.addEventListener('click', () => {
                this.applyUpgrade(upgrade);
                this.hideUpgradeMenu();
            });

            this.upgradeOptions.appendChild(option);
        });

        // Show the menu
        this.upgradeMenu.classList.remove('hidden');
    }

    hideUpgradeMenu() {
        this.upgradeMenu.classList.add('hidden');
        this.game.paused = false;
    }

    getRandomUpgrades(count) {
        const upgrades = [...this.availableUpgrades];
        const selected = [];

        // Filter out upgrades that have already been applied
        const availableUpgrades = upgrades.filter(upgrade => {
            if (upgrade.type === 'ability') {
                return !this.game.ufo.abilities.some(a => a.constructor.name === upgrade.class);
            }
            return true;
        });

        // Randomly select upgrades
        for (let i = 0; i < count && availableUpgrades.length > 0; i++) {
            const index = Math.floor(Math.random() * availableUpgrades.length);
            selected.push(availableUpgrades.splice(index, 1)[0]);
        }

        return selected;
    }

    applyUpgrade(upgrade) {
        if (upgrade.type === 'ability') {
            // Import and create new ability
            import('../entities/ufo.js').then(module => {
                const AbilityClass = module[upgrade.class];
                const ability = new AbilityClass(this.game.ufo);
                this.game.ufo.addAbility(ability);
            });
        } else if (upgrade.type === 'passive') {
            // Apply passive effect
            if (upgrade.effect) {
                if (upgrade.name.includes('Base')) {
                    upgrade.effect(this.game.base);
                } else {
                    upgrade.effect(this.game.ufo);
                }
            }
        }

        // Visual feedback
        this.showUpgradeEffect();
    }

    showUpgradeEffect() {
        // Create a flash effect on the UFO
        const flash = new THREE.PointLight(0x00ff00, 2, 10);
        flash.position.copy(this.game.ufo.position);
        this.game.scene.add(flash);

        // Animate the flash
        let intensity = 2;
        const fadeOut = setInterval(() => {
            intensity -= 0.1;
            flash.intensity = intensity;

            if (intensity <= 0) {
                clearInterval(fadeOut);
                this.game.scene.remove(flash);
            }
        }, 50);

        // Particle effect
        const particleCount = 20;
        const particles = new THREE.Group();
        
        for (let i = 0; i < particleCount; i++) {
            const geometry = new THREE.SphereGeometry(0.1, 4, 4);
            const material = new THREE.MeshBasicMaterial({
                color: 0x00ff00,
                transparent: true
            });
            
            const particle = new THREE.Mesh(geometry, material);
            const angle = (i / particleCount) * Math.PI * 2;
            particle.position.set(
                Math.cos(angle) * 2,
                0,
                Math.sin(angle) * 2
            );
            
            particles.add(particle);
        }

        particles.position.copy(this.game.ufo.position);
        this.game.scene.add(particles);

        // Animate particles
        let scale = 1;
        const expandParticles = setInterval(() => {
            scale += 0.1;
            particles.scale.set(scale, scale, scale);
            particles.children.forEach(particle => {
                particle.material.opacity = 1 - (scale - 1) / 2;
            });

            if (scale >= 3) {
                clearInterval(expandParticles);
                this.game.scene.remove(particles);
            }
        }, 50);
    }
}

import { Game } from './game.js';

// Initialize game when window loads
window.addEventListener('load', () => {
    // Create game instance
    const game = new Game();

    // Add mouse controls
    document.addEventListener('mousemove', (e) => {
        if (game.ufo) {
            const worldPos = game.screenToWorld(e.clientX, e.clientY);
            if (worldPos) {
                game.ufo.setTargetPosition(worldPos.x, worldPos.z);
            }
        }
    });

    // Mouse click for tractor beam
    document.addEventListener('click', (e) => {
        if (game.ufo) {
            if (game.ufo.isCollecting) {
                game.ufo.stopCollecting();
            } else {
                game.ufo.startCollecting();
            }
        }
    });

    // Add keyboard controls
    document.addEventListener('keydown', (e) => {
        switch(e.key.toLowerCase()) {
            case ' ': // Space bar - Toggle tractor beam
                if (game.ufo) {
                    if (game.ufo.isCollecting) {
                        game.ufo.stopCollecting();
                    } else {
                        game.ufo.startCollecting();
                    }
                }
                break;
            case 'q': // Q - Use ability 1
                if (game.ufo) {
                    game.ufo.useAbility(0);
                }
                break;
            case 'w': // W - Use ability 2
                if (game.ufo) {
                    game.ufo.useAbility(1);
                }
                break;
            case 'e': // E - Use ability 3
                if (game.ufo) {
                    game.ufo.useAbility(2);
                }
                break;
            case 'p': // P - Pause game
                game.togglePause();
                break;
        }
    });

    // Add touch controls for mobile
    let touchStartX = 0;
    let touchStartY = 0;

    document.addEventListener('touchstart', (e) => {
        touchStartX = e.touches[0].clientX;
        touchStartY = e.touches[0].clientY;
    });

    document.addEventListener('touchmove', (e) => {
        if (game.ufo) {
            const worldPos = game.screenToWorld(e.touches[0].clientX, e.touches[0].clientY);
            if (worldPos) {
                game.ufo.setTargetPosition(worldPos.x, worldPos.z);
            }
        }
    });

    // Double tap for tractor beam
    let lastTap = 0;
    document.addEventListener('touchend', (e) => {
        const currentTime = new Date().getTime();
        const tapLength = currentTime - lastTap;
        
        if (tapLength < 500 && tapLength > 0) {
            // Double tap detected
            if (game.ufo) {
                if (game.ufo.isCollecting) {
                    game.ufo.stopCollecting();
                } else {
                    game.ufo.startCollecting();
                }
            }
        }
        lastTap = currentTime;
    });

    // Handle window resize
    window.addEventListener('resize', () => {
        if (game.camera && game.renderer) {
            const aspectRatio = 9 / 16;
            const width = window.innerHeight * aspectRatio;
            const height = window.innerHeight;
            
            // Maintain aspect ratio while fitting in window
            if (width > window.innerWidth) {
                const newWidth = window.innerWidth;
                const newHeight = newWidth / aspectRatio;
                game.renderer.setSize(newWidth, newHeight);
            } else {
                game.renderer.setSize(width, height);
            }
            
            game.camera.aspect = aspectRatio;
            game.camera.updateProjectionMatrix();
        }
    });

    // Start the game
    game.start();
});

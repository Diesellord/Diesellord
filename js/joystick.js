export class Joystick {
    constructor() {
        this.createJoystick();
        this.position = { x: 0, y: 0 };
        this.active = false;
        this.basePosition = { x: 0, y: 0 };
        this.maxDistance = 50; // Maximum distance the stick can move from center
    }

    createJoystick() {
        // Create joystick container
        this.container = document.createElement('div');
        this.container.className = 'joystick-container';
        
        // Create joystick base
        this.base = document.createElement('div');
        this.base.className = 'joystick-base';
        
        // Create joystick stick
        this.stick = document.createElement('div');
        this.stick.className = 'joystick-stick';
        
        // Assemble joystick
        this.base.appendChild(this.stick);
        this.container.appendChild(this.base);
        document.body.appendChild(this.container);

        // Add event listeners
        this.setupEventListeners();
    }

    setupEventListeners() {
        const startEvent = (e) => {
            this.active = true;
            const touch = e.type === 'mousedown' ? e : e.touches[0];
            this.basePosition.x = touch.clientX - this.position.x;
            this.basePosition.y = touch.clientY - this.position.y;
            e.preventDefault();
        };

        const moveEvent = (e) => {
            if (!this.active) return;
            
            const touch = e.type === 'mousemove' ? e : e.touches[0];
            const deltaX = touch.clientX - this.basePosition.x;
            const deltaY = touch.clientY - this.basePosition.y;
            
            // Calculate distance from center
            const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
            
            // Normalize if distance is greater than maxDistance
            if (distance > this.maxDistance) {
                this.position.x = deltaX * (this.maxDistance / distance);
                this.position.y = deltaY * (this.maxDistance / distance);
            } else {
                this.position.x = deltaX;
                this.position.y = deltaY;
            }
            
            // Update stick position
            this.stick.style.transform = `translate(${this.position.x}px, ${this.position.y}px)`;
        };

        const endEvent = () => {
            this.active = false;
            this.position = { x: 0, y: 0 };
            this.stick.style.transform = `translate(0px, 0px)`;
        };

        // Mouse events
        this.container.addEventListener('mousedown', startEvent);
        document.addEventListener('mousemove', moveEvent);
        document.addEventListener('mouseup', endEvent);

        // Touch events
        this.container.addEventListener('touchstart', startEvent);
        document.addEventListener('touchmove', moveEvent);
        document.addEventListener('touchend', endEvent);
    }

    getInput() {
        // Return normalized input values (-1 to 1)
        return {
            x: this.position.x / this.maxDistance,
            y: this.position.y / this.maxDistance
        };
    }
}

// Matter.js Aliases
const Engine = Matter.Engine,
    Render = Matter.Render,
    Runner = Matter.Runner,
    MouseConstraint = Matter.MouseConstraint,
    Mouse = Matter.Mouse,
    World = Matter.World,
    Bodies = Matter.Bodies,
    Body = Matter.Body,
    Events = Matter.Events,
    Composite = Matter.Composite;

// App Global Object
const app = {
    engine: null,
    render: null,
    runner: null,
    mouseConstraint: null,
    currentView: 'home',
    selectedBody: null,
    gravity: 1,
    isPaused: false,

    // Config
    width: window.innerWidth,
    height: window.innerHeight,

    init: function () {
        console.log("App initializing...");
        this.setupNavigation();

        // Handle window resize
        window.addEventListener('resize', () => {
            this.width = window.innerWidth;
            this.height = window.innerHeight;
            if (this.render) {
                this.render.canvas.width = this.width;
                this.render.canvas.height = this.height;
                // Re-setup boundaries if we are in a sim
                if (this.currentView !== 'home') {
                    this.setupBoundaries();
                }
            }
        });

        // Initialize default view
        this.navigateTo('home');
    },

    /* ================= NAVIGATION ================= */
    setupNavigation: function () {
        window.navigateTo = (viewId) => this.navigateTo(viewId);
    },

    navigateTo: function (viewId) {
        console.log("Navigating to:", viewId);

        // Update View Classes
        document.querySelectorAll('.view').forEach(el => el.classList.remove('active'));
        document.getElementById(`view-${viewId}`).classList.add('active');

        // Update Nav Buttons
        document.querySelectorAll('.nav-btn').forEach(el => el.classList.remove('active'));
        const btn = document.getElementById(`btn-${viewId}`);
        if (btn) btn.classList.add('active');

        // Cleanup previous scene
        this.cleanupScene();

        this.currentView = viewId;

        // Setup new scene
        if (viewId === 'playground') {
            setTimeout(() => this.setupPlayground(), 50); // Small delay to ensuring DOM
        } else if (viewId === 'collision') {
            setTimeout(() => this.setupCollision(), 50);
        }
    },

    /* ================= ENGINE MANAGEMENT ================= */
    initEngine: function (containerId) {
        const container = document.getElementById(containerId);
        if (!container) return;

        // Create Engine
        this.engine = Engine.create();
        this.engine.world.gravity.y = this.gravity;

        // Create Render
        this.render = Render.create({
            element: container,
            engine: this.engine,
            options: {
                width: this.width,
                height: this.height,
                background: 'transparent', // Use body bg
                wireframes: false,
                showAngleIndicator: false
            }
        });

        // Mouse Control
        const mouse = Mouse.create(this.render.canvas);
        this.mouseConstraint = MouseConstraint.create(this.engine, {
            mouse: mouse,
            constraint: {
                stiffness: 0.2,
                render: { visible: false }
            }
        });
        World.add(this.engine.world, this.mouseConstraint);
        this.render.mouse = mouse; // Sync interactions

        // Event for selection
        Events.on(this.mouseConstraint, 'mousedown', (event) => {
            const bodies = Matter.Query.point(this.engine.world.bodies, event.mouse.position);
            const clickedBody = bodies.find(b => b.label !== 'Wall');
            this.setSelected(clickedBody || null);
        });

        // Run
        Render.run(this.render);
        this.runner = Runner.create();
        Runner.run(this.runner, this.engine);

        this.setupBoundaries();
    },

    cleanupScene: function () {
        if (this.render) {
            Render.stop(this.render);
            this.render.canvas.remove();
            this.render.canvas = null;
            this.render.context = null;
            this.render.textures = {};
        }
        if (this.runner) {
            Runner.stop(this.runner);
        }
        if (this.engine) {
            World.clear(this.engine.world);
            Engine.clear(this.engine);
        }
        this.engine = null;
        this.render = null;
        this.runner = null;
        this.selectedBody = null;
        this.setSelected(null); // Reset UI
    },

    setupBoundaries: function () {
        if (!this.engine) return;

        // Remove existing walls
        const composite = this.engine.world;
        const bodies = Composite.allBodies(composite);
        const walls = bodies.filter(b => b.label === 'Wall');
        World.remove(composite, walls);

        const width = this.width;
        const height = this.height;
        const wallThickness = 60;
        const options = {
            isStatic: true,
            label: 'Wall',
            render: { fillStyle: '#222' }
        };

        World.add(composite, [
            Bodies.rectangle(width / 2, height + wallThickness / 2 - 10, width, wallThickness, options), // Ground
            Bodies.rectangle(width / 2, -wallThickness / 2, width, wallThickness, options), // Ceiling
            Bodies.rectangle(0 - wallThickness / 2, height / 2, wallThickness, height, options), // Left
            Bodies.rectangle(width + wallThickness / 2, height / 2, wallThickness, height, options) // Right
        ]);
    },

    /* ================= SCENES ================= */
    setupPlayground: function () {
        this.initEngine('scene-playground');
        this.setPaused(false);
    },

    setupCollision: function () {
        this.initEngine('scene-collision');

        const width = this.width;
        const height = this.height;

        // Stack
        for (let i = 0; i < 6; i++) {
            for (let j = 0; j < 3; j++) {
                const rect = Bodies.rectangle(width - 300 + j * 60, height - 100 - i * 60, 50, 50, {
                    render: { fillStyle: '#ff64d8' },
                    restitution: 0.5
                });
                World.add(this.engine.world, rect);
            }
        }

        // Wrecking Ball
        const ball = Bodies.circle(400, 200, 40, {
            render: { fillStyle: '#646cff' },
            density: 0.08,
            restitution: 0.8,
            label: 'Wrecking Ball'
        });

        const anchor = { x: 400, y: 100 };
        const chain = Matter.Constraint.create({
            pointA: anchor,
            bodyB: ball,
            stiffness: 0.8,
            length: 300,
            render: {
                visible: true,
                lineWidth: 5,
                strokeStyle: '#555'
            }
        });

        World.add(this.engine.world, [ball, chain]);
        Body.setVelocity(ball, { x: 20, y: -10 });
    },

    reloadCollision: function () {
        this.cleanupScene();
        this.setupCollision();
    },

 
    addShape: function (type) {
        if (!this.engine) return;

        const x = this.width / 2 + (Math.random() - 0.5) * 100;
        const y = 100;
        const color = '#' + Math.floor(Math.random() * 16777215).toString(16);
        const options = {
            render: { fillStyle: color },
            restitution: 0.9
        };

        let body;
        if (type === 'rectangle') {
            body = Bodies.rectangle(x, y, 80, 80, options);
        } else if (type === 'circle') {
            body = Bodies.circle(x, y, 40, options);
        } else if (type === 'triangle') {
            body = Bodies.polygon(x, y, 3, 50, options);
        }

        if (body) {
            World.add(this.engine.world, body);
        }
    },

    clearAll: function () {
        if (!this.engine) return;
        World.clear(this.engine.world);
        Engine.clear(this.engine); 
        this.setSelected(null);
        this.setupBoundaries(); 
    },

    togglePause: function () {
        this.setPaused(!this.isPaused);
    },

    setPaused: function (paused) {
        this.isPaused = paused;
        if (this.runner) {
            this.runner.enabled = !paused;
        }

        
        const playIcon = this.currentView === 'playground' ? document.getElementById('icon-play') : document.getElementById('icon-play-col');
        const pauseIcon = this.currentView === 'playground' ? document.getElementById('icon-pause') : document.getElementById('icon-pause-col');

        if (playIcon && pauseIcon) {
            playIcon.style.display = paused ? 'block' : 'none';
            pauseIcon.style.display = paused ? 'none' : 'block';
        }
    },

    setGravity: function (val) {
        this.gravity = parseFloat(val);
        document.getElementById('val-gravity').textContent = this.gravity;
        if (this.engine) {
            this.engine.world.gravity.y = this.gravity;
        }
    },

    
    setSelected: function (body) {
        this.selectedBody = body;
        const panel = document.getElementById('properties-panel');
        const noSel = document.getElementById('no-selection-msg');

        if (body) {
            panel.style.display = 'block';
            noSel.style.display = 'none';

            
            document.getElementById('input-color').value = body.render.fillStyle;
            document.getElementById('input-restitution').value = body.restitution;
            document.getElementById('val-restitution').textContent = body.restitution;
            document.getElementById('input-static').checked = body.isStatic;

        } else {
            panel.style.display = 'none';
            noSel.style.display = 'block';
        }
    },

    updateSelected: function (updates) {
        if (!this.selectedBody) return;

        if (updates.color) {
            this.selectedBody.render.fillStyle = updates.color;
        }
        if (updates.restitution !== undefined) {
            this.selectedBody.restitution = updates.restitution;
            document.getElementById('val-restitution').textContent = updates.restitution;
        }
        if (updates.isStatic !== undefined) {
            Body.setStatic(this.selectedBody, updates.isStatic);
        }
    }
};


window.app = app; 
app.init();

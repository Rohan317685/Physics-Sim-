
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


const app = {
    engine: null,
    render: null,
    runner: null,
    mouseConstraint: null,
    currentView: 'home',
    selectedBody: null,
    gravity: 1,
    isPaused: false,


    width: window.innerWidth,
    height: window.innerHeight,

    init: function () {
        console.log("App initializing...");
        this.setupNavigation();

 
        window.addEventListener('resize', () => {
            this.width = window.innerWidth;
            this.height = window.innerHeight;
            if (this.render) {
                this.render.canvas.width = this.width;
                this.render.canvas.height = this.height;
             
                if (this.currentView !== 'home') {
                    this.setupBoundaries();
                }
            }
        });

        // Initialize default view
        this.navigateTo('home');
    },

 
    setupNavigation: function () {
        window.navigateTo = (viewId) => this.navigateTo(viewId);
    },

    navigateTo: function (viewId) {
        console.log("Navigating to:", viewId);

       
        document.querySelectorAll('.view').forEach(el => el.classList.remove('active'));
        document.getElementById(`view-${viewId}`).classList.add('active');

        
        document.querySelectorAll('.nav-btn').forEach(el => el.classList.remove('active'));
        const btn = document.getElementById(`btn-${viewId}`);
        if (btn) btn.classList.add('active');

        
        this.cleanupScene();




window.app = app; 
app.init();


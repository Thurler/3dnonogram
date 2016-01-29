//Code for final project of Computer Graphics class - Web 3D Nonogram
//Authors: Guilherme Thurler
//         Vinicius Campos

//----- Global Variables
var scene, camera, renderer; //Three.js variables
var width, height, aspect; //Window variables

var selected = -1;

var cube_objects = [] //Stores instances of all cube objects in scene
var cubes = []; //Stores cubes in scene
var planes_x = []; //Stores planes in x axis
var planes_y = []; //Stores planes in y axis
var planes_z = []; //Stores planes in z axis
var mousepos = new THREE.Vector2(); //Stores mouse position in normalized coords
var raycaster = new THREE.Raycaster(); //Raycaster for picking
var selectedMode = "none"; //Stores the current control mode - breaking, marking, etc
var cubeDictionary = {}; //Associates cube mesh id with instance of Cube class

//----- Global Functions

function createCube(x, y, z){
    //Creates a cube centered at [x,y,z]
    var cube_geometry = new THREE.BoxGeometry(1, 1, 1);
    var cube_material = new THREE.MeshBasicMaterial({color: 0x9ADBF3, visible:true});

    var obj = new Cube();

    //Actual cube object
    var cube = new THREE.Mesh(cube_geometry, cube_material);
    cube.position.set(x,y,z);
    cubes.push(cube);
    
    //Cube wireframe
    cube_geometry = new THREE.BoxGeometry(1.005, 1.005, 1.005);
    cube_material = new THREE.MeshBasicMaterial();
    var mesh = new THREE.Mesh(cube_geometry, cube_material);
    mesh.visible = false;
    mesh.position.set(x,y,z);
    var wireframe = new THREE.BoxHelper(mesh);
    wireframe.material.color.set("black");
    wireframe.position.set(x,y,z);
    
    //Add things to scene
    scene.add(cube);
    scene.add(mesh);
    scene.add(wireframe);
    
    //Store cube in memory
    obj.init(cube,[x,y,z],mesh,wireframe);
    cubeDictionary[cube.id] = obj;
    cube_objects.push(obj)
}

function centralizeGrid(dim){
    //This function is called whenever we need to center the cubes on screen so that
    //the grid's center matches the coordinate system's center.

    //The function accepts as argument an array containing how many cubes are
    //present in each coordinate axis
    offset = [];
    for (i=0; i<dim.length; i++){
        if (dim[i]%2) offset.push(-parseInt(dim[i]/2));
        else offset.push(-parseInt(dim[i]/2) - 0.5);
    }
    for (i=0; i<cube_objects.length; i++) cube_objects[i].moveCube(offset);
}

//----- Main class that stores cube information

function Cube(){
    this.cube = null; //Stores cube mesh
    this.center = null; //Stores cube center
    this.wireframe_cube = null; //Stores wireframe cube mesh
    this.wireframe = null; //Stores cube wireframe
}

Cube.prototype.init = function(cube, center, wfcube, wireframe){
    //Receives a cube mesh, a 3-coordinate vector, an intermediate cube mesh for the boxhelper and a boxhelper mesh
    this.cube = cube;
    this.center = center;
    this.wireframe_cube = wfcube;
    this.wireframe = wireframe;
}

Cube.prototype.deleteCube = function(){
    //Remove cube from data structures
    var index = cubes.indexOf(this.cube);
    cube_objects.splice(index, 1);
    cubes.splice(index, 1);
    
    //Remove cube and lines from scene
    scene.remove(this.cube);
    scene.remove(this.wireframe_cube);
    scene.remove(this.wireframe);
}

Cube.prototype.moveCube = function(offset){
    //Translates cube by adding the offset to the current position
    this.cube.translateX(offset[0]);
    this.wireframe_cube.translateX(offset[0]);
    this.cube.translateY(offset[1]);
    this.wireframe_cube.translateY(offset[1]);
    this.cube.translateZ(offset[2]);
    this.wireframe_cube.translateZ(offset[2]);
}

//----- Main function calls

init();
animate();

function init(){

    //Create scene and set size
    scene = new THREE.Scene();
    
    width = window.innerWidth;
    height = window.innerHeight;
    aspect = width/height;
    
    // Create a renderer and add it to the DOM.
    renderer = new THREE.WebGLRenderer({antialias:true});
    renderer.setSize(width, height);
    document.body.appendChild(renderer.domElement);
    
    //Set background color to light gray
    renderer.setClearColor(0xf1f1f1, 1);
    
    //Initializes camera
    camera = new THREE.PerspectiveCamera(45, aspect, 1, 10000);
    camera.position.z = 15;
    
    controls = new THREE.TrackballControls(camera);
    controls.rotateSpeed = 20;
    controls.noZoom = false;
    controls.noPan = false;
    controls.staticMoving = true;
    controls.dynamicDampingFactor = 0.2;
    
    //Create the translation plane wherever
    plane = new THREE.Mesh(
        new THREE.PlaneBufferGeometry(10000,10000,8,8),
        new THREE.MeshBasicMaterial({visible:false})
        );
    scene.add(plane);
    plane.lookAt(camera.position); //Set plane to camera position
    
    //Add event listeners
    window.addEventListener('resize', onWindowResize, false);
    renderer.domElement.addEventListener('mousemove', onMouseMove, false);
    renderer.domElement.addEventListener('mousedown', onMouseDown, false);
    renderer.domElement.addEventListener('mouseup', onMouseUp, false);
    window.addEventListener('keydown', onKeyDown, false);
    window.addEventListener('keyup', onKeyUp, false);
    
    //Draw 3x3x3 grid and centralize
    for (i=0; i<7; i++){
        for (j=0; j<7; j++){
            for (k=0; k<7; k++){
                if (i || j || k) createCube(i,j,k);
                else createCube(i, j, k);
            }
        }
    }
    centralizeGrid([7,7,7]);
}

function animate() {
    requestAnimationFrame(animate);
    render();
}

function render() {
    controls.update()
    renderer.render(scene, camera)
}

//----- Event listeners

function onWindowResize() {
    //Resizes window accordingly
    width = window.innerWidth;
    height = window.innerHeight;
    aspect = width/height;
    
    camera.aspect = aspect;
    camera.updateProjectionMatrix();
    renderer.setSize(width, height);
}

function onMouseMove(event) {
    //Stores mouse position in each cycle and checks for intersections
    //If intersects an object, change color to darker blue

    event.preventDefault();

    mousepos.x = (event.clientX / width) * 2 - 1;
    mousepos.y = - (event.clientY / height) * 2 + 1;
    raycaster.setFromCamera(mousepos, camera);
    
    //Highlight nearest cube of ray casting
    var intersections = raycaster.intersectObjects(cubes);
    for (i = 0; i < cubes.length; i++){
        if (i === selected) continue;
        cubes[i].material.color.setHex(0x9ADBF3);
    }
    if (intersections.length > 0){
        //Only the first intersection matters
        intersections[0].object.material.color.setHex(0x779EAC);
    }
}

function onMouseDown(event) {
    //Changes cube properties depending on current select mode. Clicks that don't intersect cubes do nothing.
    
    event.preventDefault();
    
    raycaster.setFromCamera(mousepos, camera);
    var intersections = raycaster.intersectObjects(cubes);
    
    switch (event.button){
        case 0: //left click
            if (intersections.length > 0){
                //Store intersected cube
                var cube = intersections[0].object;
                var obj = cubeDictionary[cube.id];
                if (selectedMode == "breaking"){
                    obj.deleteCube();
                    delete cubeDictionary[cube.id];
                }
            }
            break;

        case 2: //right click        
    }
}

function onMouseUp(event){
    //Mouse up event

    event.preventDefault();
}

function onKeyDown(event){
    //Key down event
    //Pressing down W or up arrow enables break mode
    //Pressing down D or right arrow enables marking mode
    //Pressing down A or left arrow enables creating mode    
    
    event.preventDefault();
    if(event.keyCode == 119 || event.keyCode == 87 || event.keyCode == 38){
        //'w' or 'W' or 'up arrow'
        if (selectedMode === "none"){
            selectedMode = "breaking";
            controls.enabled = false;
        }
    }
    else if(event.keyCode == 100 || event.keyCode == 68 || event.keyCode == 39){
        //'d' or 'D' or 'right arrow'
        if (selectedMode === "none"){
            selectedMode = "marking"
            controls.enabled = false;
        }
    }
    else if(event.keyCode == 97|| event.keyCode == 65 || event.keyCode == 37){
        //'a' or 'A' or 'left arrow'
        if (selectedMode === "none"){
            selectedMode = "creating"
            controls.enabled = false;
        }
    }
}

function onKeyUp(event){
    //Kep up event
    //Releasing the key that matches the current mode disables it
    //Releasing anything else does not change current mode

    event.preventDefault();
    
    if ((event.keyCode == 119 || event.keyCode == 87 || event.keyCode == 38) && selectedMode == "breaking"){
        //'w' or 'W' or 'up arrow'
        selectedMode = "none";
        controls.enabled = true;
    }
    if ((event.keyCode == 100 || event.keyCode == 68 || event.keyCode == 39) && selectedMode == "marking"){
        //'d' or 'D' or 'right arrow'
        selectedMode = "none";
        controls.enabled = true;
    }
    if ((event.keyCode == 97|| event.keyCode == 65 || event.keyCode == 37) && selectedMode == "creating"){
        //'a' or 'A' or 'left arrow'
        selectedMode = "none";
        controls.enabled = true;
    }
}

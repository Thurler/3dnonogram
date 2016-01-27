//Code for assignment 2 of Computer Graphics class

//----- Global Variables
var scene, camera, renderer; //Three.js variables
var width, height, aspect; //Window variables

var selected = -1; //Stores which cube is currently selected

var cube_objects = [] //Stores instances of all cube objects in scene
var cubes = []; //Stores cubes in scene
var planes_x = []; //Stores planes in x axis
var planes_y = []; //Stores planes in y axis
var planes_z = []; //Stores planes in z axis
var mousepos = new THREE.Vector2(); //Stores mouse position in normalized coords
var raycaster = new THREE.Raycaster();

//----- Global Functions

function createCube(x, y, z){
	//Creates a cube centered at [x,y,z]
	var cube_geometry = new THREE.BoxGeometry(1, 1, 1);
	var cube_material = new THREE.MeshBasicMaterial({color: 0x9ADBF3, visible:true});
	var line_material = new THREE.LineBasicMaterial({color: 0x7c7c7c});

	var object = new Cube();

	//Actual cube object
	var cube = new THREE.Mesh(cube_geometry, cube_material);
	cube.position.set(x,y,z);
	cubes.push(cube);
	
	//Cube wireframe
	var wireframe = new THREE.BoxHelper(cube);
	wireframe.material.color.set("black");
	
	//Add things to scene
	scene.add(cube);
	scene.add(wireframe);
	
	//Store cube in memory
	object.init(cube,[x,y,z],wireframe);
	cube_objects.push(object)
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
	this.wireframe = null; //Stores cube wireframe
}

Cube.prototype.init = function(cube, center, wireframe){
	//Receives a cube mesh, a 3-coordinate vector and a boxhelper mesh
	this.cube = cube;
	this.center = center;
	this.wireframe = wireframe;
}

Cube.prototype.deleteCube = function(){
	//Remove cube from data structures
	cube_objects.splice(selected, 1);
	cubes.splice(selected, 1);
	
	//Remove cube and lines from scene
	scene.remove(scene.getObjectById(this.cube.id));
	scene.remove(scene.getObjectById(this.wireframe.id));
	
	//Reset selected cube to none
	selected = -1;
}

Cube.prototype.moveCube = function(offset){
	//Translates cube by adding the offset to the current position
	this.cube.translateX(offset[0]);
	this.wireframe.translateX(offset[0]);
	this.cube.translateY(offset[1]);
	this.wireframe.translateY(offset[1]);
	this.cube.translateZ(offset[2]);
	this.wireframe.translateZ(offset[2]);
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
    window.addEventListener('keydown', onKeyPress, false);
	
	//Draw 3x3x3 grid and centralize
	for (i=0; i<7; i++){
		for (j=0; j<7; j++){
			for (k=0; k<7; k++){
				if (i || j || k) createCube(i,j,k);
				else createCube(i+0.0001, j+0.0001, k+0.0001);
				//Offset for BoxHelper overlapping issue
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
	//Checks if left click was on top of an existing cube - select it if so
	
	event.preventDefault();
	raycaster.setFromCamera(mousepos, camera);
	var intersections = raycaster.intersectObjects(cubes);
	
	switch (event.button){
		case 0: //left click
			if (intersections.length > 0){
				//Store intersected cube
				var tmp = intersections[0].object;
				//Check which cube was intersected among all in the array
				for (i = 0; i < cubes.length; i++){
					if (cubes[i] === tmp){
						//Unselect it if it was previously selected
						if (selected === i){
							selected = -1;
							tmp.material.color.setHex(0x9ADBF3);
							break;
						}
						//Unselect previous selection
						if (selected+1) cubes[selected].material.color.setHex(0x9ADBF3);
						selected = i;
					}
				}
			}
			else selected = -1;
			break;

		case 2: //right click
			
	}
}

function onMouseUp(event){
	//Mouse up event

	event.preventDefault();
}

function onKeyPress(event){
	//Key press event

	event.preventDefault();
}

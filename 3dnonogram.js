//Code for assignment 2 of Computer Graphics class

//----- Global Variables and Functions
var scene, camera, renderer; //Three.js variables
var width, height, aspect; //Window variables

var selected = -1; //Stores which cube is currently selected

var objects = [] //Stores instances of all cube objects in scene
var cubes = []; //Stores cubes in scene
var planes_x = []; //Stores planes in x axis
var planes_y = []; //Stores planes in y axis
var planes_z = []; //Stores planes in z axis
var mousepos = new THREE.Vector2(); //Stores mouse position in normalized coords
var raycaster = new THREE.Raycaster();

function createCube(x, y, z){
	//Creates a cube centered at [x,y,z]
	var cube_geometry = new THREE.BoxGeometry(1, 1, 1);
	var cube_material = new THREE.MeshBasicMaterial({color: 0x9ADBF3, visible:true});
	var line_material = new THREE.LineBasicMaterial({color: 0x7c7c7c});

	var object = new Cube();
	
	var cube = new THREE.Mesh(cube_geometry, cube_material);
	cube.position.set(x,y,z);
	cubes.push(cube);
	
	var wireframe = new THREE.BoxHelper(cube);
	wireframe.material.color.set("black");
	
	//Add things to scene
	scene.add(cube);
	scene.add(wireframe);
	
	//Store cube in memory
	object.init(cube,[x,y,z],wireframe);
	objects.push(object)
}

function centralizeGrid(dim){
	offset = [];
	for (i=0; i<dim.length; i++){
		if (dim[i]%2) offset.push(parseInt(dim[i]/2));
		else offset.push(parseInt(dim[i]/2) + 0.5);
	}
	for (i=0; i<objects.length; i++) objects[i].moveCube(offset);
}

//----- Main class that stores cube information

function Cube(){
	this.cube = null; //Stores cube mesh
	this.center = null; //Stores cube center
	this.wireframe = null; //Stores cube wireframe
}

Cube.prototype.init = function(cube, center, wireframe){
	//Receives a cube mesh, a 3-coordinate vector and an array of line meshes
	this.cube = cube;
	this.center = center;
	this.wireframe = wireframe;
}

Cube.prototype.deleteCube = function(){
	//Remove cube from data structures
	objects.splice(selected, 1);
	cubes.splice(selected, 1);
	
	//Remove cube and lines from scene
	scene.remove(scene.getObjectById(this.cube.id));
	scene.remove(scene.getObjectById(this.wireframe.id));
	
	//Reset selected cube to none
	selected = -1;
}

Cube.prototype.moveCube = function(point){
	console.log(this.cube.position.x);
	this.cube.translateX(-point[0]);
	this.wireframe.translateX(-point[0]);
	this.cube.translateY(-point[1]);
	this.wireframe.translateY(-point[1]);
	this.cube.translateZ(-point[2]);
	this.wireframe.translateZ(-point[2]);
	console.log(this.cube.position.x);
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
	for (i=0; i<3; i++){
		for (j=0; j<3; j++){
			for (k=0; k<3; k++){
				createCube(i,j,k);
			}
		}
	}
	cubes[0].material.color.setHex(0xFF0000);
	centralizeGrid([3,3,3]);
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
	mousepos.x = (event.clientX / width) * 2 - 1;
	mousepos.y = - (event.clientY / height) * 2 + 1;
	raycaster.setFromCamera(mousepos, camera);
	
	if(translating){
		//Update object coordinates based on plane and ray casting
		var intersects = raycaster.intersectObject(plane);
		if (intersects.length > 0){
			objects[selected].moveCube(intersects[0].point);
		}
		return;
	}
	
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
	//Creates a new cube on right click - if intersects with a cube, put in front
	
	event.preventDefault();
	raycaster.setFromCamera(mousepos, camera);
	var intersections = raycaster.intersectObjects(cubes);
	
	switch (event.button){
		case 0: //left click
			if (intersections.length > 0){
				//Store intersected cube
				var tmp = intersections[0].object;
				//Check which cub was intersected among all in the array
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
						//Enable translation, disable camera controls
						translating = true;
						controls.enabled = false;
						plane.lookAt(camera.position); //Set plane to camera position
					}
				}
			}
			else selected = -1;
			break;

		case 2: //right click
			//We will always insert a new cube in the plane z=0, so we find the
			//world coordinates for the mouse click on that plane
			
			var vector = new THREE.Vector3();
			vector.set(mousepos.x, mousepos.y, 1);
			vector.unproject(camera);
			
			var dir = vector.sub(camera.position).normalize();
			var distance = -camera.position.z / dir.z;
			
			var pos = camera.position.clone().add(dir.multiplyScalar(distance));
			
			createCube(pos.x,pos.y,pos.z);
			
			break;
	}
}

function onMouseUp(event){
	//Stops translation and enables camera controls
	translating = false; //No longer translating
	controls.enabled = true;
	plane.position.copy(cubes[selected].position);
}

function onKeyPress(event){
	//Handles keydown events for deleting the selected cube
	//Does so if pressed DEL or BACKSPACE
	
	if (!(selected+1)) return; //If nothing selected (selected is -1) do nothing

	if (event.which === 46 || event.which === 8){
		//Delete selected cube
		objects[selected].deleteCube();
	}
}

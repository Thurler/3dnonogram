//Code for final project of Computer Graphics class - Web 3D Nonogram
//Authors: Guilherme Thurler
//         Vinicius Campos

//----- Global Variables
var scene, camera, renderer; //Three.js variables
var width, height, aspect; //Window variables

var mouse; //Stores whether mouse is pressed
var mousepos = new THREE.Vector2(); //Stores mouse position in normalized coords
var raycaster = new THREE.Raycaster(); //Raycaster for picking

var gameMode = "main menu"; //Stores current game state
var fileContent = ""; //Stores uplaoded file content
var customLevel = false; //Stores whether you are playing a custom level or not
var tutorial = -1;

//----- Global Variables for Gameplay
var filename = "sample.txt"; //Stores the level's filename
var pressCoord = new THREE.Vector3(); //Stores clicked cube's coordinate
var pressAxis = ""; //Stores multiple cube operations' axis
var lastPress = null; //Stores last cube that was clicked on
var marking = null; //Stores whether the first cube was marked or unmarked
var selectedAxis = null; //Stores which axis is being moved when moving axis
var selectedMode = "none"; //Stores the current control mode - breaking, marking, etc
var markColor = 0; //Stores color to mark cubes with

var cube_objects = []; //Stores instances of all cube objects in scene
var cubes = []; //Stores cubes in scene for raycasting
var cubeDictionary = {}; //Associates cube mesh id with instance of Cube class
var axis_objects = []; //Stores instances of all axismover objects in scene
var axis = []; //Stores axismover meshes for raycasting
var axisDictionary = {}; //Associates axismover mesh id with instace of AxisMover class
var num_textures = []; //Array for storing number textures for cube's side as a hint

var solution = []; //Stores solution matrixe
var dimensions = []; //Stores grid dimensions
var offset = []; //Stores grid offset
var hints_x = []; //Array for storing hints for x axis, in yz coordinates
var hints_y = []; //Array for storing hints for y axis, in xz coordinates
var hints_z = []; //Array for storing hints for z axis, in xy coordinates

var errorCounter = 0; //Counts number of errors
var cubeCounter = 0; //Counts number of cubes on screen
var solutionCubes = 0; //Stores number of cubes in solution
var maxErrors = 5; //Stores max number of errors

var planeX = null; //Stores plane that allows movement in X axis
var planeY = null; //Stores plane that allows movement in Y axis
var planeZ = null; //Stores plane that allows movement in Z axis

//----- Global Functions

function createCube(x, y, z){
    //Creates a cube centered at [x,y,z]
    var cube_geometry = new THREE.BoxGeometry(1, 1, 1);
    
    var hint_x;
    var hint_y;
    var hint_z;
	
	if (gameMode == "playing"){
	    hint_x = hints_x[y][z]; //Read x axis hint
	    hint_y = hints_y[x][z]; //Read y axis hint
	    hint_z = hints_z[x][y]; //Read z axis hint
	}
	else{
	    hint_x = null;
	    hint_y = null;
	    hint_z = null;
	}
    
	//Set one material for each face, with according number texture
	var cubeColor;
	if (gameMode == "playing") cubeColor = 0x9ADBF3;
	else cubeColor = solution[x][y][z] - 1;
    var materials = [
        new THREE.MeshBasicMaterial({
            color: cubeColor
        }),
        new THREE.MeshBasicMaterial({
            color: cubeColor
        }),
        new THREE.MeshBasicMaterial({
            color: cubeColor
        }),
        new THREE.MeshBasicMaterial({
            color: cubeColor
        }),
        new THREE.MeshBasicMaterial({
            color: cubeColor
        }),
        new THREE.MeshBasicMaterial({
            color: cubeColor
        }),
    ];
    
    var circles = [];
    var squares = [];
    var geo;
    var mat;
    var mesh;
    
    if (hint_x !== null){
        materials[0].map = num_textures[hint_x.value].texture;
        materials[1].map = num_textures[hint_x.value].texture;
    }
    
    if (hint_y !== null){
        materials[2].map = num_textures[hint_y.value].texture;
        materials[3].map = num_textures[hint_y.value].texture;
    }
    
    if (hint_z !== null){
        materials[4].map = num_textures[hint_z.value].texture;
        materials[5].map = num_textures[hint_z.value].texture;
    }
    
    var obj = new Cube();

    //Actual cube object
    var cube = new THREE.Mesh(cube_geometry, new THREE.MeshFaceMaterial(materials));
    cube.position.set(x+offset[0],y+offset[1],z+offset[2]);
    cubes.push(cube);
    
    //Cube wireframe
    cube_geometry = new THREE.BoxGeometry(1.005, 1.005, 1.005);
    cube_material = new THREE.MeshBasicMaterial();
    mesh = new THREE.Mesh(cube_geometry, new THREE.MeshFaceMaterial(materials));
    mesh.visible = false;
    mesh.position.set(x+offset[0],y+offset[1],z+offset[2]);
    var wireframe = new THREE.BoxHelper(mesh);
    wireframe.material.color.set("black");
    wireframe.position.set(x+offset[0],y+offset[1],z+offset[2]);
    
    //Add things to scene
    scene.add(cube);
    scene.add(mesh);
    scene.add(wireframe);
    
    if (hint_x !== null){
        if (hint_x.type === 1){
            //Draw a circle
            geo = new THREE.RingGeometry(0.4,0.45,32);
            mat = new THREE.MeshBasicMaterial({color: 0x000000});
            mesh = new THREE.Mesh(geo,mat);
            mesh.position.set(x+0.51+offset[0],y+offset[1],z+offset[2]);
            mesh.rotation.y = Math.PI/2;
            circles.push(mesh);
            scene.add(mesh);
            mesh = new THREE.Mesh(geo,mat);
            mesh.position.set(x-0.51+offset[0],y+offset[1],z+offset[2]);
            mesh.rotation.y = -Math.PI/2;
            circles.push(mesh);
            scene.add(mesh);
        }
        else if (hint_x.type === 2){
            //Draw a square
            geo = new THREE.RingGeometry(0.4,0.45,4);
            mat = new THREE.MeshBasicMaterial({color: 0x000000});
            mesh = new THREE.Mesh(geo,mat);
            mesh.position.set(x+0.51+offset[0],y+offset[1],z+offset[2]);
            mesh.rotation.y = Math.PI/2;
            squares.push(mesh);
            scene.add(mesh);
            mesh = new THREE.Mesh(geo,mat);
            mesh.position.set(x-0.51+offset[0],y+offset[1],z+offset[2]);
            mesh.rotation.y = -Math.PI/2;
            squares.push(mesh);
            scene.add(mesh);
        }
    }
    
    if (hint_y !== null){
        if (hint_y.type === 1){
            //Draw a circle
            geo = new THREE.RingGeometry(0.4,0.45,32);
            mat = new THREE.MeshBasicMaterial({color: 0x000000});
            mesh = new THREE.Mesh(geo,mat);
            mesh.position.set(x+offset[0],y+0.51+offset[1],z+offset[2]);
            mesh.rotation.x = -Math.PI/2;
            circles.push(mesh);
            scene.add(mesh);
            mesh = new THREE.Mesh(geo,mat);
            mesh.position.set(x+offset[0],y-0.51+offset[1],z+offset[2]);
            mesh.rotation.x = Math.PI/2;
            circles.push(mesh);
            scene.add(mesh);
        }
        else if (hint_y.type === 2){
            //Draw a square
            geo = new THREE.RingGeometry(0.4,0.45,4);
            mat = new THREE.MeshBasicMaterial({color: 0x000000});
            mesh = new THREE.Mesh(geo,mat);
            mesh.position.set(x+offset[0],y+0.51+offset[1],z+offset[2]);
            mesh.rotation.x = -Math.PI/2;
            squares.push(mesh);
            scene.add(mesh);
            mesh = new THREE.Mesh(geo,mat);
            mesh.position.set(x+offset[0],y-0.51+offset[1],z+offset[2]);
            mesh.rotation.x = Math.PI/2;
            squares.push(mesh);
            scene.add(mesh);
        }
    }
    
    if (hint_z !== null){
        if (hint_z.type === 1){
            //Draw a circle
            geo = new THREE.RingGeometry(0.4,0.45,32);
            mat = new THREE.MeshBasicMaterial({color: 0x000000});
            mesh = new THREE.Mesh(geo,mat);
            mesh.position.set(x+offset[0],y+offset[1],z+0.51+offset[2]);
            circles.push(mesh);
            scene.add(mesh);
            mesh = new THREE.Mesh(geo,mat);
            mesh.position.set(x+offset[0],y+offset[1],z-0.51+offset[2]);
            mesh.rotation.x = Math.PI;
            circles.push(mesh);
            scene.add(mesh);
        }
        else if (hint_z.type === 2){
            //Draw a square
            geo = new THREE.RingGeometry(0.4,0.45,4);
            mat = new THREE.MeshBasicMaterial({color: 0x000000});
            mesh = new THREE.Mesh(geo,mat);
            mesh.position.set(x+offset[0],y+offset[1],z+0.51+offset[2]);
            squares.push(mesh);
            scene.add(mesh);
            mesh = new THREE.Mesh(geo,mat);
            mesh.position.set(x+offset[0],y+offset[1],z-0.51+offset[2]);
            mesh.rotation.x = Math.PI;
            squares.push(mesh);
            scene.add(mesh);
        }
    }
    
    //Store cube in memory
    obj.init(cube,[x,y,z],mesh,wireframe,circles,squares);
    cubeDictionary[cube.id] = obj;
    cube_objects.push(obj);
}

function createAxisMover(axis_n){
    //This creates an instance of the AxisMover class and positions it accordingly in
    //the scene, depending on which axis it moves.

    var axis_obj = new AxisMover();
    
    //Set geometry and proper scale
    var geometry = new THREE.CylinderGeometry(1, 3, 3, 4);
    var transformation = new THREE.Matrix4().makeScale(0.1, 0.1, 0.1);
    geometry.applyMatrix(transformation);
    
    //Set material for object and wireframe
    var obj_material;
    if (axis_n == "x") obj_material = new THREE.MeshBasicMaterial({color: 0xff0000});
    else if (axis_n == "y") obj_material = new THREE.MeshBasicMaterial({color: 0x00ff00});
    else if (axis_n == "z") obj_material = new THREE.MeshBasicMaterial({color: 0x0000ff});
    var wire_material = new THREE.MeshBasicMaterial({color: 0x00000, wireframe: true});
    
    //Create meshes
    var upperMesh = new THREE.Mesh(geometry, obj_material);
    var lowerMesh = new THREE.Mesh(geometry, obj_material);
    var upperWire = new THREE.Mesh(geometry, wire_material);
    var lowerWire = new THREE.Mesh(geometry, wire_material);
    
    //Position meshes according to axis
    var t = 0;
    if (axis_n == "x"){
        //Translate to location
        t = (dimensions[0]/2) + 0.5;
        upperMesh.translateX(-t);
        upperWire.translateX(-t);
        lowerMesh.translateX(-t);
        lowerWire.translateX(-t);
        t = (dimensions[1]/2) + 0.5;
        upperMesh.translateY(t);
        upperWire.translateY(t);
        lowerMesh.translateY(t);
        lowerWire.translateY(t);
        t = (dimensions[2]/2) + 0.5;
        upperMesh.translateZ(-t);
        upperWire.translateZ(-t);
        lowerMesh.translateZ(-t);
        lowerWire.translateZ(-t);
        
        //Rotate entire object for axis alignment
        upperMesh.rotation.z = Math.PI/2;
        lowerMesh.rotation.z = Math.PI/2;
        upperWire.rotation.z = Math.PI/2;
        lowerWire.rotation.z = Math.PI/2;
        
        //Rotate lower half
        lowerMesh.rotation.y = Math.PI;
        lowerWire.rotation.y = Math.PI;
        lowerMesh.translateY(0.3);
        lowerWire.translateY(0.3);
    }
    
    else if (axis_n == "y"){
        //Translate to location
        t = (dimensions[0]/2) + 0.5;
        upperMesh.translateX(t);
        upperWire.translateX(t);
        lowerMesh.translateX(t);
        lowerWire.translateX(t);
        t = (dimensions[1]/2) + 0.5;
        upperMesh.translateY(t);
        upperWire.translateY(t);
        lowerMesh.translateY(t);
        lowerWire.translateY(t);
        t = (dimensions[2]/2) + 0.5;
        upperMesh.translateZ(-t);
        upperWire.translateZ(-t);
        lowerMesh.translateZ(-t);
        lowerWire.translateZ(-t);
        
        //Rotate lower half
        lowerMesh.rotation.x = Math.PI;
        lowerWire.rotation.x = Math.PI;
        lowerMesh.translateY(0.3);
        lowerWire.translateY(0.3);
    }
    
    else if (axis_n == "z"){
        //Translate to location
        t = (dimensions[0]/2) + 0.5;
        upperMesh.translateX(t);
        lowerMesh.translateX(t);
        upperWire.translateX(t);
        lowerWire.translateX(t);
        t = (dimensions[1]/2) + 0.5;
        upperMesh.translateY(t);
        upperWire.translateY(t);
        lowerMesh.translateY(t);
        lowerWire.translateY(t);
        t = (dimensions[2]/2) + 0.5;
        upperMesh.translateZ(t);
        upperWire.translateZ(t);
        lowerMesh.translateZ(t);
        lowerWire.translateZ(t);
        
        //Rotate entire object for axis alignment
        upperMesh.rotation.x = Math.PI/2;
        lowerMesh.rotation.x = Math.PI/2;
        upperWire.rotation.x = Math.PI/2;
        lowerWire.rotation.x = Math.PI/2;
        
        //Rotate lower half
        lowerMesh.rotation.z = Math.PI;
        lowerWire.rotation.z = Math.PI;
        lowerMesh.translateY(0.3);
        lowerWire.translateY(0.3);
    }
    
    //Initiate AxisMover instance
    axis_obj.init(upperMesh,lowerMesh,upperWire,lowerWire,axis_n);
    
    //Add meshes to array
    axis.push(upperMesh);
    axis.push(lowerMesh);
    
    //Add instance of class to array of instances
    axis_objects.push(axis_obj);
    
    //Associate mesh ids to the created class instance
    axisDictionary[upperMesh.id] = axis_obj;
    axisDictionary[lowerMesh.id] = axis_obj;
    
    //Add things to scene
    scene.add(upperMesh);
    scene.add(lowerMesh);
    scene.add(upperWire);
    scene.add(lowerWire);
}

function destroy(obj,cube){
    //This function destroys a cube and the object associated with it
    if (obj.errorMark) return;
    
    if(gameMode == "creating" || !obj.marked){
        delete cubeDictionary[cube.id];
        obj.deleteCube();
        cubeCounter--;
    }
}

function mark(obj, cube){
    //This function [un]marks a cube, depending on its current state
    if (obj.errorMark) return;
    
    if (gameMode == "creating"){
        for (i = 0; i < 6; i++){
            cube.material.materials[i].color.setHex(markColor);
        }
        solution[obj.coord.x][obj.coord.y][obj.coord.z] = markColor;
        return;
    }
    
    obj.marked = !(obj.marked);
    for (i = 0; i < 6; i++){
        if (obj.marked) cube.material.materials[i].color.setHex(markColor);
        else cube.material.materials[i].color.setHex(0x9ADBF3);
    }
}

function delMark(obj,cube){
    //This function [un]markes a cube for deletion, depending on its current state
    if (obj.errorMark) return;
    
    if(!obj.marked){
        obj.delMarked = !(obj.delMarked);
        for (i = 0; i < 6; i++){
            if (obj.delMarked) cube.material.materials[i].color.setHex(0x999999);
            else cube.material.materials[i].color.setHex(0x9ADBF3);
        }
    }
}

function genTexture(num){
    //Set texture
    var hint_texture = new THREEx.DynamicTexture(128,128);
    hint_texture.context.font = "bolder 72px Verdana";
    hint_texture.texture.anisotropy = renderer.getMaxAnisotropy();
    if (num == 6 || num == 9) hint_texture.clear('white').drawText(num.toString()+".", undefined, 85, 'black');
    else hint_texture.clear('white').drawText(num.toString(), undefined, 85, 'black');
    hint_texture.texture.needsUpdate = true;
    
    num_textures.push(hint_texture);
}

function readInfo(filenam){
    filename = filenam;
    customLevel = false;
    
    var xhr = new XMLHttpRequest();
    
    xhr.onload = function(){
    	//Split file between \n
    	var content = this.responseText;
    	loadInfo(content);
    };

    xhr.open('GET', 'levels/'+filenam);
    xhr.send();
}

function readSingleFile(e){
    var file = e.target.files[0];
    if (!file) {
        return;
    }
    var reader = new FileReader();
    reader.onload = function(e) {
        fileContent = e.target.result;
        customLevel = true;
    };
    reader.readAsText(file);
}

function loadInfo(content){
	if (content == "") return;
    var text = content.split('\n');
    	
	//Read dimensions
	var dim = text[0];
	dim = dim.split(',');
	for (i = 0; i < dim.length; i++){
		dimensions.push(parseInt(dim[i]));
	}
	cubeCounter = dimensions[0]*dimensions[1]*dimensions[2];
	
	//Adjust grid offset
    for (i=0; i<dimensions.length; i++){
        offset.push((-dimensions[i]/2)+0.5);
    }
	
	//Initialize solution matrice and hint matrices
	for (i = 0; i < dimensions[0]; i++){
		solution.push([]);
		hints_y.push([]);
		hints_z.push([]);
		for (j = 0; j < dimensions[1]; j++){
			solution[i].push([]);
			hints_x.push([]);
			hints_z[i].push(null);
			for (k = 0; k < dimensions[2]; k++){
				solution[i][j].push(false);
				hints_x[j].push(null);
				hints_y[i].push(null);
			}
		}
	}
	
	//Read solution and apply changes to matrix
	var index = 2;
	var line = null;
	for (index; text[index][0] != '#'; index++){
		line = text[index];
		line = line.split(',');
		solution[parseInt(line[0])][parseInt(line[1])][parseInt(line[2])] = parseInt(line[3])+1;
		solutionCubes++;
	}
	
	//Read hints for x axis
	index++;
	for (index; text[index][0] != '#'; index++){
		line = text[index];
		line = line.split(',');
		hints_x[parseInt(line[0])][parseInt(line[1])] = {value: parseInt(line[2]), type: parseInt(line[3])};
	}
	
    //Read hints for y axis
	index++;
	for (index; text[index][0] != '#'; index++){
		line = text[index];
		line = line.split(',');
		hints_y[parseInt(line[0])][parseInt(line[1])] = {value: parseInt(line[2]), type: parseInt(line[3])};
	}
	
	//Read hints for z axis
	index++;
	for (index; text[index][0] != '#'; index++){
		line = text[index];
		line = line.split(',');
		hints_z[parseInt(line[0])][parseInt(line[1])] = {value: parseInt(line[2]), type: parseInt(line[3])};
	}
	
	swal.close();
	init_solve();
}

function loadInfoCreate(content){
    if (content == "") return;
    var text = content.split('\n');
    	
	//Read dimensions
	var dim = text[0];
	dim = dim.split(',');
	for (i = 0; i < dim.length; i++){
		dimensions.push(parseInt(dim[i]));
	}
	cubeCounter = dimensions[0]*dimensions[1]*dimensions[2];
	
	//Adjust grid offset
    for (i=0; i<dimensions.length; i++){
        offset.push((-dimensions[i]/2)+0.5);
    }
    
    //Initialize solution matrice and hint matrices
	for (i = 0; i < dimensions[0]; i++){
		solution.push([]);
		for (j = 0; j < dimensions[1]; j++){
			solution[i].push([]);
			for (k = 0; k < dimensions[2]; k++){
				solution[i][j].push(false);
			}
		}
	}
	
	//Read solution and apply changes to matrix
	var index = 2;
	var line = null;
	for (index; text[index][0] != '#'; index++){
		line = text[index];
		line = line.split(',');
		solution[parseInt(line[0])][parseInt(line[1])][parseInt(line[2])] = parseInt(line[3])+1;
		solutionCubes++;
	}
	
	swal.close();
	init_create();
}

function victory(){
    if (gameMode == "tutorialA"){
        destroyScene();
        callT1_7();
        return;
    }
    else if (gameMode == "tutorialB"){
        destroyScene();
        callT1_9();
        return;
    }
    selectedMode = "victory";
    controls.enabled = true;
    for (i = 0; i < num_textures.length; i++){
        num_textures[i].clear('white');
    }
    cubes = [];
    axis = [];
    if (tutorial === -1){
        for (i = 0; i < 3; i++){
            axis_objects[i].remove();
        }
    }
    for (i = 0; i < cube_objects.length; i++){
        var obj = cube_objects[i];
        obj.makeVisible();
        for (j = 0; j < 6; j++){
            obj.cube.material.materials[j].color.setHex(solution[obj.coord.x][obj.coord.y][obj.coord.z]-1);
        }
        for (j = 0; j < obj.circles.length; j++){
            obj.circles[j].visible = false;
        }
        for (j = 0; j < obj.squares.length; j++){
            obj.squares[j].visible = false;
        }
    }
    if (tutorial > -1) callTutorialVictory();
    else callVictory();
}

function destroyScene(){
    var count = 0;
    var loop = cube_objects.length;
    for (p = 0; p < loop; p++){
        count++;
        //console.log(cube_objects);
        cube_objects[0].deleteCube();
    }
    
    if (tutorial === -1 || tutorial === 5){
        for (i = 0; i < 3; i++){
            axis_objects[i].remove();
        }
    }
    
    pressCoord = new THREE.Vector3(); //Stores clicked cube's coordinate
    pressAxis = ""; //Stores multiple cube operations' axis
    lastPress = null; //Stores last cube that was clicked on
    marking = null; //Stores whether the first cube was marked or unmarked
    selectedAxis = null; //Stores which axis is being moved when moving axis
    selectedMode = "none"; //Stores the current control mode - breaking, marking, etc
    
    cube_objects = []; //Stores instances of all cube objects in scene
    cubes = []; //Stores cubes in scene for raycasting
    cubeDictionary = {}; //Associates cube mesh id with instance of Cube class
    axis_objects = []; //Stores instances of all axismover objects in scene
    axis = []; //Stores axismover meshes for raycasting
    axisDictionary = {}; //Associates axismover mesh id with instace of AxisMover class
    num_textures = []; //Array for storing number textures for cube's side as a hint
    
    solution = []; //Stores solution matrix
    dimensions = []; //Stores grid dimensions
    offset = []; //Stores grid offset
    hints_x = []; //Array for storing hints for x axis, in yz coordinates
    hints_y = []; //Array for storing hints for y axis, in xz coordinates
    hints_z = []; //Array for storing hints for z axis, in xy coordinates
    
    errorCounter = 0; //Counts number of errors
    cubeCounter = 0; //Counts number of cubes on screen
    solutionCubes = 0; //Stores number of cubes in solution
    
    planeX = null; //Stores plane that allows movement in X axis
    planeY = null; //Stores plane that allows movement in Y axis
    planeZ = null; //Stores plane that allows movement in Z axis
    
    tutorial = -1;
}

function reset(){
    var tut = tutorial;
    destroyScene();
    tutorial = tut;
    if (customLevel) loadInfo(fileContent);
    else readInfo(filename);
	gameMode = "playing";
	controls.enabled = true;
	swal.close();
}

function callRestart(){
    swal({
        title: "Are you sure?",
        showConfirmButton: false,
        allowEscapeKey: false,
        allowOutsideClick: false,
        closeOnCancel: false,
        closeOnConfirm: false,
        html: true,
        text: "<h2>All progress will be lost!</h2><br><br>"+
              "<div onclick='reset();' class='btn-red'>Yes, restart!</div><br><br>"+
              "<div onclick='callPauseMenu();' class='btn-gray'>No, go back!</div><br>"
    });
}

function callPauseMenu(){
    //Pause game
	gameMode = "pause";
	controls.enabled = false;
	swal({  title: "Game Paused",
            showConfirmButton: false,
            allowEscapeKey: false,
            allowOutsideClick: false,
            closeOnCancel: false,
            closeOnConfirm: false,
            html: true,
            text: "<div onclick='swal.close();gameMode=\"playing\";controls.enabled=true;' class='btn-blue'>Resume</div><br><br>"+
				  "<div onclick='callRestart();' class='btn-green'>Restart</div><br><br>"+
				  "<div onclick='destroyScene();callLevelSelect();' class='btn-red'>Quit</div><br>"
    });
}

function callTutorialPauseMenu(){
    //Pause game
	gameMode = "pause";
	controls.enabled = false;
	swal({  title: "Game Paused",
            showConfirmButton: false,
            allowEscapeKey: false,
            allowOutsideClick: false,
            closeOnCancel: false,
            closeOnConfirm: false,
            html: true,
            text: "<div onclick='swal.close();gameMode=\"playing\";controls.enabled=true;' class='btn-blue'>Resume</div><br><br>"+
				  "<div onclick='callRestart();' class='btn-green'>Restart</div><br><br>"+
				  "<div onclick='destroyScene();callHowtoPlay();' class='btn-red'>Quit</div><br>"
    });
}

function callMainMenu(){
    //Main menu for ui
    swal({  title: "3D Nonogram - Web Version",
            showConfirmButton: false,
            allowEscapeKey: false,
            allowOutsideClick: false,
            closeOnCancel: false,
            closeOnConfirm: false,
            html: true,
            text: "<div onclick='callLevelSelect();' class='btn-big-blue'>Play</div><br><br>"+
				  "<div onclick='callCreateSelect();' class='btn-big-green'>Create</div><br><br>"+
				  "<div onclick='callHowtoPlay();' class='btn-red'>How to Play</div><br>"
    });
}

function callLevelSelect(){
    fileContent = "";
    swal({  title: "Choose which level to play!",
            showConfirmButton: false,
            allowEscapeKey: false,
            allowOutsideClick: false,
            closeOnCancel: false,
            closeOnConfirm: false,
            html: true,
            text: "<hr><h4>Upload a custom one:</h4>"+
                  "<input type='file' id='file-input' accept='.lvl' /><br>"+
                  "<div onclick='loadInfo(fileContent);' class='btn-green'>Upload and play!</div><br>"+
                  "<hr><h4>Or select one of the levels below:</h4>"+
                  "<div onclick='readInfo(\"sample.txt\");swal.close();' class='btn-blue'>Simple Level</div><br><br>"+
                  "<div onclick='readInfo(\"2d.txt\");swal.close();' class='btn-blue'>2D in 3D</div><br><br>"+
                  "<div onclick='readInfo(\"challenge.txt\");swal.close();' class='btn-blue'>Challenge</div><br><hr><br>"+
                  "<div onclick='callMainMenu();' class='btn-gray'>Back to Main Menu</div><br>"
    });
    document.getElementById('file-input').addEventListener('change', readSingleFile, false);
}

function callCreateSelect(){
    fileContent = "";
    swal({  title: "Choose what you want to make!",
            showConfirmButton: false,
            allowEscapeKey: false,
            allowOutsideClick: false,
            closeOnCancel: false,
            closeOnConfirm: false,
            html: true,
            text: "<hr><h4>Upload an existing level:</h4>"+
                  "<input type='file' id='file-input-2' accept='.lvl' /><br>"+
                  "<div onclick='loadInfoCreate(fileContent);' class='btn-green'>Upload and make!</div><br>"+
                  "<hr><h4>Or start your own one:</h4>"+
                  "<div onclick='newLevel();' class='btn-blue'>Start from Scratch!</div><br><hr><br>"+
                  "<div onclick='callMainMenu();' class='btn-gray'>Back to Main Menu</div><br>"
    });
    document.getElementById('file-input-2').addEventListener('change', readSingleFile, false);
}

function newLevel(){
    swal({  title: "Choose your object's dimensions!",
            showConfirmButton: false,
            allowEscapeKey: false,
            allowOutsideClick: false,
            closeOnCancel: false,
            closeOnConfirm: false,
            html: true,
            text: "<h4>Enter below the width, height and depth of your object:</h4>"+
                  "<h3>Width:</h3>"+
                  "<span><img src='img/arrowDown.png' onclick='downWidth();return false;'>   <font size='7' color='black' id='width-id'>3</font>   <img src='img/arrowUp.png' onclick='upWidth();return false;'></span><br>"+
                  "<h3>Height:</h3>"+
                  "<span><img src='img/arrowDown.png' onclick='downHeight();return false;'>   <font size='7' color='black' id='height-id'>3</font>   <img src='img/arrowUp.png' onclick='upHeight();return false;'></span><br>"+
                  "<h3>Depth:</h3>"+
                  "<span><img src='img/arrowDown.png' onclick='downDepth();return false;'>   <font size='7' color='black' id='depth-id'>3</font>   <img src='img/arrowUp.png' onclick='upDepth();return false;'></span><br>"+
                  "<div onclick='createNewLevel();' class='btn-red'>Create!</div><br>"+
                  "<div onclick='callCreateSelect();' class='btn-gray'>Back to Level Select</div><br>"
    });
}

function downWidth(){
    var width = parseInt(document.getElementById('width-id').innerHTML);
    if (width == 1) return;
    document.getElementById('width-id').innerHTML = (width-1).toString();
}

function upWidth(){
    var width = parseInt(document.getElementById('width-id').innerHTML);
    document.getElementById('width-id').innerHTML = (width+1).toString();
}

function downHeight(){
    var height = parseInt(document.getElementById('height-id').innerHTML);
    if (height == 1) return;
    document.getElementById('height-id').innerHTML = (height-1).toString();
}

function upHeight(){
    var height = parseInt(document.getElementById('height-id').innerHTML);
    document.getElementById('height-id').innerHTML = (height+1).toString();
}

function downDepth(){
    var depth = parseInt(document.getElementById('depth-id').innerHTML);
    if (depth == 1) return;
    document.getElementById('depth-id').innerHTML = (depth-1).toString();
}

function upDepth(){
    var depth = parseInt(document.getElementById('depth-id').innerHTML);
    document.getElementById('depth-id').innerHTML = (depth+1).toString();
}

function createNewLevel(){
    var width = parseInt(document.getElementById('width-id').innerHTML);
    var height = parseInt(document.getElementById('height-id').innerHTML);
    var depth = parseInt(document.getElementById('depth-id').innerHTML);
    
    fileContent = width.toString()+","+height.toString()+","+depth.toString()+"\n";
    fileContent += "#dimension\n";
    
    for (i = 0; i < width; i++){
        for (j = 0; j < height; j++){
            for (k = 0; k < depth; k++){
                fileContent += i.toString()+","+j.toString()+","+k.toString()+",0xaaaaaa\n";
            }
        }
    }
    fileContent += "#solution\n";
    
    swal.close();
    loadInfoCreate(fileContent);
}

function callHowtoPlay(){
    swal({  title: "Tutorial Levels",
            showConfirmButton: false,
            allowEscapeKey: false,
            allowOutsideClick: false,
            closeOnCancel: false,
            closeOnConfirm: false,
            html: true,
            text: "<div onclick='callTutorial1();' class='btn-blue'>1 - Basics</div><br><br>"+
				  "<div onclick='callTutorial2();' class='btn-blue'>2 - Basic Techniques</div><br><br>"+
				  "<div onclick='callTutorial3();' class='btn-blue'>3 - Circles</div><br><br>"+
				  "<div onclick='callTutorial4();' class='btn-blue'>4 - Other Techniques</div><br><br>"+
				  "<div onclick='callTutorial5();' class='btn-blue'>5 - Squares</div><br><br>"+
				  "<div onclick='callTutorial6();' class='btn-blue'>6 - Large Puzzles</div><br><br>"+
				  "<div onclick='callMainMenu();' class='btn-gray'>Back to Main Menu</div><br>"
    });
}

function callTutorial1(){
    swal({  title: "Tutorial - Basics",
            showConfirmButton: false,
            allowEscapeKey: false,
            allowOutsideClick: false,
            closeOnCancel: false,
            closeOnConfirm: false,
            html: true,
            text: "<h4>Welcome! 3D Nonogram Web Verison is a fun, unique and simple puzzle game where you smash the blocks to reveal secrets!</h4>"+
                  "<h4>Every level has a hidden object in it, formed by the little cubes that make up the grid, and it is YOUR job to find it!</h4>"+
                  "<div onclick='callT1_1();' class='btn-red'>Next</div><br>"
    });
}

function callT1_1(){
    swal({  title: "Tutorial - Basics",
            showConfirmButton: false,
            allowEscapeKey: false,
            allowOutsideClick: false,
            closeOnCancel: false,
            closeOnConfirm: false,
            html: true,
            text: "<h4>But how will you find out which cubes are part of the object? Simple, just use the number hints on their sides!</h4>"+
                  "<h4>You can deduce which cubes are NOT part of the hidden object by analyzing those numbers. After removing all the cubes that are not part of the solution, the object will be revealed!</h4>"+
                  "<div onclick='callT1_2();' class='btn-red'>Next</div><br>"
    });
}

function callT1_2(){
    swal({  title: "Tutorial - Basics",
            showConfirmButton: false,
            allowEscapeKey: false,
            allowOutsideClick: false,
            closeOnCancel: false,
            closeOnConfirm: false,
            html: true,
            text: "<h4>The number on the cubes show you how many consecutive cubes there should be in any given row or column.</h4>"+
                  "<h4>You can tell which row/column by seeing which side the number is at - if it's on top of a cube, it refers to the vertical column of cubes below, like so:</h4>"+
                  "<img src='img/t1-0.png'>"+
                  "<div onclick='callT1_3();' class='btn-red'>Next</div><br>"
    });
}

function callT1_3(){
    swal({  title: "Tutorial - Basics",
            showConfirmButton: false,
            allowEscapeKey: false,
            allowOutsideClick: false,
            closeOnCancel: false,
            closeOnConfirm: false,
            html: true,
            text: "<h4>In order to properly see these numbers, you'll want to move the camera around a lot, so you can see the grid from many different angles. You can use your mouse to move it, like so:</h4>"+
                  "<img src='img/t1-2.png'>"+
                  "<div onclick='callT1_4();' class='btn-red'>Next</div><br>"
    });
}

function callT1_4(){
    swal({  title: "Tutorial - Basics",
            showConfirmButton: false,
            allowEscapeKey: false,
            allowOutsideClick: false,
            closeOnCancel: false,
            closeOnConfirm: false,
            html: true,
            text: "<h4>Let's see how you can handle this camera movement... Here, try moving the camera around and getting a good look at the grid in your screen. When you're done, just hit the Esc key to bring up the next message.</h4>"+
                  "<div onclick='tutorial=0;readInfo(\"sample.txt\");' class='btn-red'>Next</div><br>"
    });
}

function callT1_5(){
    destroyScene();
    gameMode = "main menu";
    swal({  title: "Tutorial - Basics",
            showConfirmButton: false,
            allowEscapeKey: false,
            allowOutsideClick: false,
            closeOnCancel: false,
            closeOnConfirm: false,
            html: true,
            text: "<h4>Now then, let's go over the basics.</h4>"+
                  "<h4>Say you have the situation below, where a row of 3 blocks has a hint number of 1. At first, you can't figure out which cube is the right one, since any one of them could be the answer.</h4>"+
                  "<img src='img/t1-3.png'>"+
                  "<div onclick='callT1_6();' class='btn-red'>Next</div><br>"
    });
}

function callT1_6(){
    swal({  title: "Tutorial - Basics",
            showConfirmButton: false,
            allowEscapeKey: false,
            allowOutsideClick: false,
            closeOnCancel: false,
            closeOnConfirm: false,
            html: true,
            text: "<h4>However, if you're given a hint number of 0, that means all of the cubes in that row can be broken!</h4>"+
                  "<h4>In this game, you can break cubes by clicking on them while enabling break mode - you can do so by holding down either the W key or the UP arrow key on your keyboard.</h4>"+
                  "<img src='img/t1-4.png'>"+
                  "<h4>Give it a try, delete the cubes that have a hint number of 0 on them!</h4>"+
                  "<div onclick='tutorial=0.33;readInfo(\"tutorial0a.txt\");' class='btn-red'>Next</div><br>"
    });
}

function callT1_7(){
    gameMode = "main menu";
    swal({  title: "Tutorial - Basics",
            showConfirmButton: false,
            allowEscapeKey: false,
            allowOutsideClick: false,
            closeOnCancel: false,
            closeOnConfirm: false,
            html: true,
            text: "<h4>Well done! Now then, let's take a look at another situation.</h4>"+
                  "<h4>Let's say you have a row of 4 blocks, and the clue for that row is the number 4. That means all of the cubes are part of the hidden object's shape, right?</h4>"+
                  "<h4>Then we should be careful about not deleting them accidentally.</h4>"+
                  "<img src='img/t1-5.png'>"+
                  "<h4>Give it a try, delete the cubes that have a hint number of 0 on them!</h4>"+
                  "<div onclick='callT1_8();' class='btn-red'>Next</div><br>"
    });
}

function callT1_8(){
    swal({  title: "Tutorial - Basics",
            showConfirmButton: false,
            allowEscapeKey: false,
            allowOutsideClick: false,
            closeOnCancel: false,
            closeOnConfirm: false,
            html: true,
            text: "<h4>In order to not break them accidentally, we can mark them as a cube we want to keep, confirming it as part of the solution.</h4>"+
                  "<h4>You can mark a cube by clicking it while holding down the D key or the RIGHT arrow key on your keyboard. You can also unmark cubes you've previously marked.</h4>"+
                  "<img src='img/t1-6.png'>"+
                  "<h4>Give it a try, mark all the cubes that belong to the row with the hints given, and delete the rest!</h4>"+
                  "<div onclick='tutorial=0.67;readInfo(\"tutorial0b.txt\");' class='btn-red'>Next</div><br>"
    });
}

function callT1_9(){
    gameMode = "main menu";
    swal({  title: "Tutorial - Basics",
            showConfirmButton: false,
            allowEscapeKey: false,
            allowOutsideClick: false,
            closeOnCancel: false,
            closeOnConfirm: false,
            html: true,
            text: "<h4>Well done! Now you know the basics of playing around, with deleting and marking cubes.</h4>"+
                  "<h4>And just so you know, you can mark multiple cubes at once by holding down the key and moving your mouse around! If you want to delete multiple cubes though... You will need to use the S key or the DOWN arrow key on your keyboard!</h4>"+
                  "<div onclick='callT1_10();' class='btn-red'>Next</div><br>"
    });
}

function callT1_10(){
    swal({  title: "Tutorial - Basics",
            showConfirmButton: false,
            allowEscapeKey: false,
            allowOutsideClick: false,
            closeOnCancel: false,
            closeOnConfirm: false,
            html: true,
            text: "<h4>In order to delete multiple cubes, hold down the S key or the DOWN arrow key, and then proceed to mark all the cubes you would like to delete - without letting go of the key!</h4>"+
                  "<h4>Once you're satisfied with what you have, let go of the key and press it again, and all the marked cubes will be deleted!</h4>"+
                  "<img src='img/t1-7.png'>"+
                  "<div onclick='callT1_11();' class='btn-red'>Next</div><br>"
    });
}

function callT1_11(){
    swal({  title: "Tutorial - Basics",
            showConfirmButton: false,
            allowEscapeKey: false,
            allowOutsideClick: false,
            closeOnCancel: false,
            closeOnConfirm: false,
            html: true,
            text: "<h4>And that's all you need to know to get started. Visit the other tutorials to get some more in-depth information, and good luck out there!</h4>"+
                  "<h4>Also, you can't make too many mistakes, otherwise you will lose as well. Have fun!</h4>"+
                  ""+
                  "<div onclick='callHowtoPlay();' class='btn-red'>Next</div><br>"
    });
}

function callTutorial2(){
    swal({  title: "Tutorial - Techniques",
            showConfirmButton: false,
            allowEscapeKey: false,
            allowOutsideClick: false,
            closeOnCancel: false,
            closeOnConfirm: false,
            html: true,
            text: "<h4>Hey, ready to solve your first puzzle?</h4>"+
                  "<h4>Don't worry, I'll give you some help this first time around.</h4>"+
                  "<h4>Let's start by looking at two basic techniques for figuring out which cubes are part of the solution, ok?</h4>"+
                  "<h4>After that I'll get you to solve a really simple one to get you started.</h4>"+
                  "<div onclick='callT2_1();' class='btn-red'>Next</div><br>"
    });
}

function callT2_1(){
    swal({  title: "Tutorial - Techniques",
            showConfirmButton: false,
            allowEscapeKey: false,
            allowOutsideClick: false,
            closeOnCancel: false,
            closeOnConfirm: false,
            html: true,
            text: "<h4>Now then, let's assume you have the following situation: a row of 5 cubes, with a hint number of 4. Let's also assume you ahve already marked the leftmost cube, like so:</h4>"+
                  "<img src='img/t2-0.png'>"+
                  "<h4>Now, because the cubes need to be consecutive, we can easily deduce the first 4 cubes are the ones that are part of the solution, with the last one being the extra cube.</h4>"+
                  "<img src='img/t2-1.png'>"+
                  "<div onclick='callT2_2();' class='btn-red'>Next</div><br>"
    });
}

function callT2_2(){
    swal({  title: "Tutorial - Techniques",
            showConfirmButton: false,
            allowEscapeKey: false,
            allowOutsideClick: false,
            closeOnCancel: false,
            closeOnConfirm: false,
            html: true,
            text: "<h4>Another basic thing to keep in mind is the following scenario: a row of 5 cubes, with a hint number of 4, and no cubes already marked. Let's take a look at the possible scenarios here...</h4>"+
                  "<img src='img/t2-2.png'>"+
                  "<h4>Notice how the center cubes are always a part of the solution, no matter which scenario? That means you can safely mark them as part of the solution and continue solving the puzzle with that new information!</h4>"+
                  "<img src='img/t2-3.png'>"+
                  "<div onclick='callT2_3();' class='btn-red'>Next</div><br>"
    });
}

function callT2_3(){
    swal({  title: "Tutorial - Techniques",
            showConfirmButton: false,
            allowEscapeKey: false,
            allowOutsideClick: false,
            closeOnCancel: false,
            closeOnConfirm: false,
            html: true,
            text: "<h4>Now that you know all of the basic techniques, let's get you solving a puzzle!</h4>"+
                  "<div onclick='tutorial=1;readInfo(\"tutorial1.txt\");' class='btn-red'>Next</div><br>"
    });
}

function callTutorial3(){
    swal({  title: "Tutorial - Circles",
            showConfirmButton: false,
            allowEscapeKey: false,
            allowOutsideClick: false,
            closeOnCancel: false,
            closeOnConfirm: false,
            html: true,
            text: "<h4>Let's talk about circles now! Sometimes, a hint number will be circled, to indicate that the cubes in that row are NOT entirely consecutive.</h4>"+
                  "<h4>Instead, they are two groups of consecutive cubes, which are not necessarily evenly devided, meaning a circled 4 could mean two groups of 2 cubes, or a group of 3 cubes and another of 1 cube.</h4>"+
                  "<img src='img/t3-0.png'>"+
                  "<div onclick='callT3_1();' class='btn-red'>Next</div><br>"
    });
}

function callT3_1(){
    swal({  title: "Tutorial - Circles",
            showConfirmButton: false,
            allowEscapeKey: false,
            allowOutsideClick: false,
            closeOnCancel: false,
            closeOnConfirm: false,
            html: true,
            text: "<h4>So let's have an imaginary scenario to ease your understanding: 5 cubes in a row, with a hint number of circled 4, and no previous markings. The possible scenarios are:</h4>"+
                  "<img src='img/t3-1.png'>"+
                  "<h4>And so, in every scenario we notice the cubes on the edge are marked, so we can safely assume they are part of the solution. Keep this in mind!</h4>"+
                  "<div onclick='callT3_2();' class='btn-red'>Next</div><br>"
    });
}

function callT3_2(){
    swal({  title: "Tutorial - Circles",
            showConfirmButton: false,
            allowEscapeKey: false,
            allowOutsideClick: false,
            closeOnCancel: false,
            closeOnConfirm: false,
            html: true,
            text: "<h4>Now, let's get you solving a puzzle with circled hints!</h4>"+
                  "<div onclick='tutorial=2;readInfo(\"tutorial2.txt\");' class='btn-red'>Next</div><br>"
    });
}

function callTutorial4(){
    swal({  title: "Tutorial - Techniques",
            showConfirmButton: false,
            allowEscapeKey: false,
            allowOutsideClick: false,
            closeOnCancel: false,
            closeOnConfirm: false,
            html: true,
            text: "<h4>Now, let's take a look at another technique that will help you solve puzzles.</h4>"+
                  "<h4>You should always keep in mind how many consecutive cubes need to fit in a specific section of a row if the hint is a circled number.</h4>"+
                  "<h4>Since two groups of consecutive cubes need at least one space between them, accounting for where these groups fit is key.</h4>"+
                  "<div onclick='callT4_1();' class='btn-red'>Next</div><br>"
    });
}

function callT4_1(){
    swal({  title: "Tutorial - Techniques",
            showConfirmButton: false,
            allowEscapeKey: false,
            allowOutsideClick: false,
            closeOnCancel: false,
            closeOnConfirm: false,
            html: true,
            text: "<h4>For example, if you have 5 blocks, one group of 4, and another of 1, in a row which clue is a circled 4, it should be obvious the cube in the lonesome group is part of the solution.</h4>"+
                  "<h4>This is because otherwise we'd have 4 consecutive cubes - going against what a circled hint of 4 means. We can then deduce which other cubes are part of the solution by fitting the remainder 3 cubes from the hint in the 4 cube group, as such:</h4>"+
                  "<img src='img/t4-0.png'>"+
                  "<div onclick='callT4_2();' class='btn-red'>Next</div><br>"
    });
}

function callT4_2(){
    swal({  title: "Tutorial - Techniques",
            showConfirmButton: false,
            allowEscapeKey: false,
            allowOutsideClick: false,
            closeOnCancel: false,
            closeOnConfirm: false,
            html: true,
            text: "<h4>You should be pretty good at this already, so let's hook you up with a puzzle!</h4>"+
                  "<div onclick='tutorial=3;readInfo(\"tutorial3.txt\");' class='btn-red'>Next</div><br>"
    });
}

function callTutorial5(){
    swal({  title: "Tutorial - Squares",
            showConfirmButton: false,
            allowEscapeKey: false,
            allowOutsideClick: false,
            closeOnCancel: false,
            closeOnConfirm: false,
            html: true,
            text: "<h4>Okay, as if circles weren't enough, we've got squares as well.</h4>"+
                  "<h4>Squares are pretty much a more generic circle - they tell you that the cubes in that row are separated in three OR MORE groups. And you have no way to know how many, at least at first.</h4>"+
                  "<h4>For example, a hint number of a square 4 could mean there are 2 groups of 1 cube and 1 group of 2 cubes, OR 4 groups of single cubes.</h4>"+
                  "<img src='img/t5-0.png'>"+
                  "<div onclick='callT5_1();' class='btn-red'>Next</div><br>"
    });
}

function callT5_1(){
    swal({  title: "Tutorial - Squares",
            showConfirmButton: false,
            allowEscapeKey: false,
            allowOutsideClick: false,
            closeOnCancel: false,
            closeOnConfirm: false,
            html: true,
            text: "<h4>There aren't really any new techniques to apply, it's basically more of the same, so let's get you started with a puzzle using squares!</h4>"+
                  "<div onclick='tutorial=4;readInfo(\"tutorial4.txt\");' class='btn-red'>Next</div><br>"
    });
}

function callTutorial6(){
    swal({  title: "Tutorial - Axis Sliders",
            showConfirmButton: false,
            allowEscapeKey: false,
            allowOutsideClick: false,
            closeOnCancel: false,
            closeOnConfirm: false,
            html: true,
            text: "<h4>Finally, let's talk about big puzzles.</h4>"+
                  "<h4>In big puzzles, you will sometimes need to take a look at the inner part of the grid, to mark/delete cubes which you can't normally see since others are in the way.</h4>"+
                  "<h4>Thankfully, there is a way to take a look at those! You can use the axis sliders to reach them, so let's talk about them a bit.</h4>"+
                  "<div onclick='callT6_1();' class='btn-red'>Next</div><br>"
    });
}

function callT6_1(){
    swal({  title: "Tutorial - Axis Sliders",
            showConfirmButton: false,
            allowEscapeKey: false,
            allowOutsideClick: false,
            closeOnCancel: false,
            closeOnConfirm: false,
            html: true,
            text: "<h4>Axis sliders are diamond-like objects around the grid - and you can (surprise!) slide them along their axis to make some cubes invisible, letting you take a look at the inner part of the grid.</h4>"+
                  "<h4>There is one for each axis (x, y, z), and with them, you can reach anywhere inside the grid, from any angle.</h4>"+
                  "<img src='img/t6-0.png'>"+
                  "<div onclick='callT6_2();' class='btn-red'>Next</div><br>"
    });
}

function callT6_2(){
    swal({  title: "Tutorial - Axis Sliders",
            showConfirmButton: false,
            allowEscapeKey: false,
            allowOutsideClick: false,
            closeOnCancel: false,
            closeOnConfirm: false,
            html: true,
            text: "<h4>Now, let's have you solve a bigger puzzle, maybe you'll need the axis sliders to solve it, who knows! This is also the last tutorial, so you pretty much know how to play already. Have fun out there!</h4>"+
                  "<div onclick='tutorial=5;readInfo(\"tutorial5.txt\");' class='btn-red'>Next</div><br>"
    });
}

function callVictory(){
    gameMode = "pause";
	controls.enabled = false;
    swal({  title: "Victory - You Win!",
            showConfirmButton: false,
            allowEscapeKey: false,
            allowOutsideClick: false,
            closeOnCancel: false,
            closeOnConfirm: false,
            html: true,
            text: "<h3>You win! Press Resume to look at the puzzle's colored solution, or press Quit to return to the level select screen.</h3>"+
                  "<div onclick='swal.close();gameMode=\"playing\";controls.enabled=true;' class='btn-blue'>Resume</div><br><br>"+
				  "<div onclick='destroyScene();callLevelSelect();' class='btn-red'>Quit</div><br>"
    });
}

function callTutorialVictory(){
    gameMode = "pause";
	controls.enabled = false;
    swal({  title: "Victory - You Win!",
            showConfirmButton: false,
            allowEscapeKey: false,
            allowOutsideClick: false,
            closeOnCancel: false,
            closeOnConfirm: false,
            html: true,
            text: "<h3>You win! Press Resume to look at the puzzle's colored solution, or press Quit to return to the tutorial screen.</h3>"+
                  "<div onclick='swal.close();gameMode=\"playing\";controls.enabled=true;' class='btn-blue'>Resume</div><br><br>"+
				  "<div onclick='destroyScene();callHowtoPlay();' class='btn-red'>Quit</div><br>"
    });
}

function callDefeatError(){
    gameMode = "pause";
	controls.enabled = false;
	swal({  title: "Defeat - You Lost...",
            showConfirmButton: false,
            allowEscapeKey: false,
            allowOutsideClick: false,
            closeOnCancel: false,
            closeOnConfirm: false,
            html: true,
            text: "<h3>You lost... You made 5 mistakes, that's no good! Make sure you try again!</h3>"+
				  "<div onclick='reset();' class='btn-green'>Restart</div><br><br>"+
				  "<div onclick='destroyScene();callLevelSelect();' class='btn-red'>Quit</div><br>"
    });
}

function callTutorialDefeatError(){
    gameMode = "pause";
	controls.enabled = false;
	swal({  title: "Defeat - You Lost...",
            showConfirmButton: false,
            allowEscapeKey: false,
            allowOutsideClick: false,
            closeOnCancel: false,
            closeOnConfirm: false,
            html: true,
            text: "<h3>You lost... You made 5 mistakes, that's no good! Make sure you try again!</h3>"+
				  "<div onclick='reset();' class='btn-green'>Restart</div><br><br>"+
				  "<div onclick='destroyScene();callHowtoPlay();' class='btn-red'>Quit</div><br>"
    });
}

function callError(){
    gameMode = "pause";
	controls.enabled = false;
	swal({  title: "You made a mistake!",
            showConfirmButton: false,
            allowEscapeKey: false,
            allowOutsideClick: false,
            closeOnCancel: false,
            closeOnConfirm: false,
            html: true,
            text: "<h3>You made a mistake! Watch out, you can't break a cube that's part of the solution!</h3>"+
                  "<h4>You already made "+errorCounter.toString()+" mistakes! "+(5-errorCounter).toString()+" more will knock you out!</h4>"+
				  "<div onclick='swal.close();gameMode=\"playing\";controls.enabled=true;' class='btn-red'>OK</div><br>"
    });
}

function callColorChange(){
    swal({  title: "Change Marking Color",
            showConfirmButton: false,
            allowEscapeKey: false,
            allowOutsideClick: false,
            closeOnCancel: false,
            closeOnConfirm: false,
            html: true,
            text: "<h3>Use the color input below to change the marking color!</h3><br>"+
                  "<input type='color' value="+getColor()+" id='color'></input><br>"+
                  "<div onclick='changeColor();' class='btn-blue'>Done!</div><br>"
    });
}

function getColor(){
    var color = "#"+ markColor.toString(16);
    return color;
}

function changeColor(){
    var color = document.getElementById("color").value;
    color = color.substr(1,color.length-1);
    markColor = parseInt(color, 16);
    
    swal.close();
}

function callCreatePauseMenu(){
    gameMode = "pause";
    controls.enabled = false;
    swal({  title: "Game Paused",
            showConfirmButton: false,
            allowEscapeKey: false,
            allowOutsideClick: false,
            closeOnCancel: false,
            closeOnConfirm: false,
            html: true,
            text: "<div onclick='swal.close();gameMode=\"creating\";controls.enabled=true;' class='btn-blue'>Resume</div><br><br>"+
				  "<div onclick='' class='btn-green'>Save and Download</div><br><br>"+
				  "<div onclick='destroyScene();callCreateSelect();' class='btn-red'>Quit</div><br>"
    });
}

//----- Main class that stores objects information

function Cube(){
    this.cube = null; //Stores cube mesh
    this.coord = new THREE.Vector3(); //Stores cube center
    this.wireframe_cube = null; //Stores wireframe cube mesh
    this.wireframe = null; //Stores cube wireframe
    this.marked = false; //Stores whether cube is marked or not
    this.delMarked = false; //Stores whether cube is marked for deleting or not
    this.errorMark = false; //Stores whether cube was wrongly deleted
    this.visible = true; //Stores whether cube is visible or not
    this.circles = []; //Stores circle for clues
    this.squares = []; //Stores squares for clues
}

Cube.prototype.init = function(cube, center, wfcube, wireframe, circles, squares){
    //Receives a cube mesh, a 3-coordinate vector, an intermediate cube mesh for the boxhelper and a boxhelper mesh
    this.cube = cube;
    this.coord.x = center[0];
    this.coord.y = center[1];
    this.coord.z = center[2];
    this.wireframe_cube = wfcube;
    this.wireframe = wireframe;
    this.circles = circles;
    this.squares = squares;
}

Cube.prototype.deleteCube = function(){
    //Remove cube from data structures
    var index = cubes.indexOf(this.cube);
    cubes.splice(index, 1);
    index = cube_objects.indexOf(this);
    cube_objects.splice(index, 1);
    
    //Remove cube and lines from scene
    scene.remove(this.cube);
    scene.remove(this.wireframe_cube);
    scene.remove(this.wireframe);
    for (i = 0; i < this.circles.length; i++){
        scene.remove(this.circles[i]);
    }
    for (i = 0; i < this.squares.length; i++){
        scene.remove(this.squares[i]);
    }
}

Cube.prototype.makeInvisible = function(){
    //Makes cube invisible and removes it from the cubes array
    if (this.visible){
        this.visible = false;
        this.cube.visible = false;
        this.wireframe.material.transparent = true;
        this.wireframe.material.opacity = 0.1;
        for (i = 0; i < this.circles.length; i++){
            this.circles[i].visible = false;
        }
        for (i = 0; i < this.squares.length; i++){
            this.squares[i].visible = false;
        }
        var index = cubes.indexOf(this.cube);
        cubes.splice(index, 1);
    }
}

Cube.prototype.makeVisible = function(){
    //Makes cube visible and adds it back to the cubes array
    if (!this.visible){
        this.visible = true;
        this.cube.visible = true;
        this.wireframe.material.opacity = 1;
        for (i = 0; i < this.circles.length; i++){
            this.circles[i].visible = true;
        }
        for (i = 0; i < this.squares.length; i++){
            this.squares[i].visible = true;
        }
        cubes.push(this.cube);
    }
}

function AxisMover(){
    this.upperMesh = null;
    this.lowerMesh = null;
    this.upperWire = null;
    this.lowerWire = null;
    this.axis = null;
}

AxisMover.prototype.init = function(upM, lowM, upW, lowW, axi){
    //This functions sets all variables for the AxisMover class
    this.upperMesh = upM;
    this.lowerMesh = lowM;
    this.upperWire = upW;
    this.lowerWire = lowW;
    this.axis = axi;
}

AxisMover.prototype.move = function(axis_n,pos){
    //This function moves the object across its axis
    if (axis_n == "x"){
        this.upperMesh.position.x = pos;
        this.upperWire.position.x = pos;
        this.lowerWire.position.x = pos+0.3;
        this.lowerMesh.position.x = pos+0.3;
    }
    
    else if (axis_n == "y"){
        this.upperMesh.position.y = pos;
        this.upperWire.position.y = pos;
        this.lowerWire.position.y = pos-0.3;
        this.lowerMesh.position.y = pos-0.3;
    }
    
    else if (axis_n == "z"){
        this.upperMesh.position.z = pos;
        this.upperWire.position.z = pos;
        this.lowerWire.position.z = pos-0.3;
        this.lowerMesh.position.z = pos-0.3;
    }
}

AxisMover.prototype.reset = function(){
    //This function resets the object's position back to its original value
    var t = 0;
    if (this.axis == "x"){
        t = (dimensions[0]/2)+0.5
        this.upperMesh.position.setX(-t);
        this.upperWire.position.setX(-t);
        this.lowerMesh.position.setX(-t+0.3);
        this.lowerWire.position.setX(-t+0.3);
    }
    
    else if (this.axis == "y"){
        t = (dimensions[1]/2)+0.5
        this.upperMesh.position.setY(t);
        this.upperWire.position.setY(t);
        this.lowerMesh.position.setY(t-0.3);
        this.lowerWire.position.setY(t-0.3);
    }
    
    else if (this.axis == "z"){
        t = (dimensions[2]/2)+0.5
        this.upperMesh.position.setZ(t);
        this.upperWire.position.setZ(t);
        this.lowerMesh.position.setZ(t-0.3);
        this.lowerWire.position.setZ(t-0.3);
    }
}

AxisMover.prototype.remove = function(){
    //This function deletes the axis mover from the scene
    scene.remove(this.upperMesh);
    scene.remove(this.upperWire);
    scene.remove(this.lowerMesh);
    scene.remove(this.lowerWire);
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
	camera.position.z = 10;
    
    controls = new THREE.TrackballControls(camera);
    controls.rotateSpeed = 20;
    controls.noZoom = false;
    controls.noPan = false;
    controls.staticMoving = true;
    controls.dynamicDampingFactor = 0.2;
    controls.keys = [70, 71, 72];
    
    //Add event listeners
    window.addEventListener('resize', onWindowResize, false);
    renderer.domElement.addEventListener('mousemove', onMouseMove, false);
    renderer.domElement.addEventListener('mousedown', onMouseDown, false);
    renderer.domElement.addEventListener('mouseup', onMouseUp, false);
    window.addEventListener('keydown', onKeyDown, false);
    window.addEventListener('keyup', onKeyUp, false);
    
    callMainMenu();
}
    
function init_solve(){
    //Initializes camera
    camera = new THREE.PerspectiveCamera(45, aspect, 1, 10000);
	camera.position.z = 3*Math.max(...dimensions);
    
    controls = new THREE.TrackballControls(camera);
    controls.rotateSpeed = 20;
    controls.noZoom = false;
    controls.noPan = false;
    controls.staticMoving = true;
    controls.dynamicDampingFactor = 0.2;
    controls.keys = [70, 71, 72];

    //Create the translation planes wherever
    var material = new THREE.MeshBasicMaterial({visible:false, side: THREE.DoubleSide});
	
	var geometry = new THREE.PlaneBufferGeometry(dimensions[0]+1, 10000);
    planeX = new THREE.Mesh(geometry, material);
    planeX.translateZ(-(dimensions[2]/2)-0.5);
    scene.add(planeX);
	
	geometry = new THREE.PlaneBufferGeometry(dimensions[1]+1, 10000);
    planeY = new THREE.Mesh(geometry, material);
    planeY.rotation.z = Math.PI/2;
    planeY.rotation.y = Math.PI/2;
    planeY.translateZ((dimensions[0]/2)+0.5);
    scene.add(planeY);
	
	geometry = new THREE.PlaneBufferGeometry(dimensions[2]+1, 10000);
    planeZ = new THREE.Mesh(geometry, material);
    planeZ.translateY((dimensions[1]/2)+0.5);
    planeZ.rotation.x = Math.PI/2;
    planeZ.rotation.z = Math.PI/2;
    scene.add(planeZ);
    
    //Generate number textures
	var max_dim = Math.max(...dimensions);
    for (i=0; i < max_dim+1; i++){
        genTexture(i);
    }
    
    gameMode = "playing";
    
    //Draw grid
    for (i=0; i<dimensions[0]; i++){
        for (j=0; j<dimensions[1]; j++){
            for (k=0; k<dimensions[2]; k++){
				createCube(i, j, k);
            }
        }
    }
    
    if (tutorial === -1 || tutorial === 5){
        createAxisMover("x");
        createAxisMover("y");
        createAxisMover("z");
    }
    
    markColor = 0xF28B1E;
    
    if (tutorial === 0) selectedMode = "tutorial";
    else if (tutorial === 0.33) gameMode = "tutorialA";
    else if (tutorial === 0.67) gameMode = "tutorialB";
}

function init_create(){
    //Initializes camera
    camera = new THREE.PerspectiveCamera(45, aspect, 1, 10000);
	camera.position.z = 3*Math.max(...dimensions);
    
    controls = new THREE.TrackballControls(camera);
    controls.rotateSpeed = 20;
    controls.noZoom = false;
    controls.noPan = false;
    controls.staticMoving = true;
    controls.dynamicDampingFactor = 0.2;
    controls.keys = [70, 71, 72];

    //Create the translation planes wherever
    var material = new THREE.MeshBasicMaterial({visible:false, side: THREE.DoubleSide});
	
	var geometry = new THREE.PlaneBufferGeometry(dimensions[0]+1, 10000);
    planeX = new THREE.Mesh(geometry, material);
    planeX.translateZ(-(dimensions[2]/2)-0.5);
    scene.add(planeX);
	
	geometry = new THREE.PlaneBufferGeometry(dimensions[1]+1, 10000);
    planeY = new THREE.Mesh(geometry, material);
    planeY.rotation.z = Math.PI/2;
    planeY.rotation.y = Math.PI/2;
    planeY.translateZ((dimensions[0]/2)+0.5);
    scene.add(planeY);
	
	geometry = new THREE.PlaneBufferGeometry(dimensions[2]+1, 10000);
    planeZ = new THREE.Mesh(geometry, material);
    planeZ.translateY((dimensions[1]/2)+0.5);
    planeZ.rotation.x = Math.PI/2;
    planeZ.rotation.z = Math.PI/2;
    scene.add(planeZ);
    
    gameMode = "creating";
    
    //Draw grid
    for (i=0; i<dimensions[0]; i++){
        for (j=0; j<dimensions[1]; j++){
            for (k=0; k<dimensions[2]; k++){
				if (solution[i][j][k]) createCube(i, j, k);
            }
        }
    }
    
    createAxisMover("x");
    createAxisMover("y");
    createAxisMover("z");
    
    markColor = 0xF28B1E;
}

function animate() {
    requestAnimationFrame(animate);
    render();
}

function render() {
    controls.update();
    renderer.render(scene, camera);
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
    //If intersects an object, change color to darker blue / orange
    //In addition, handles mouse button hold event, which insclude deleting and
    //marking multiple cubes, as well as slicing the grid

    event.preventDefault();
    
    if (gameMode == "playing" || gameMode == "creating" || gameMode == "tutorialA" || gameMode == "tutorialB"){

        mousepos.x = (event.clientX / width) * 2 - 1;
        mousepos.y = - (event.clientY / height) * 2 + 1;
        raycaster.setFromCamera(mousepos, camera);
        
        if (selectedMode == "victory") return;
        
        if (mouse && gameMode !== "tutorialA" && gameMode !== "tutorialB"){
            //Handles mouse hold event - enters if mouse button is pressed
            if (selectedMode == "slicing"){
    			//If slicing the grid, we need to update the slicer's position
                var intersections;
                if (selectedAxis.axis == "x"){
    				//Get intersection with plane and move object there
                    intersections = raycaster.intersectObjects([planeX]);
                    if (intersections.length > 0){
                        var pos = intersections[0].point.x;
                        selectedAxis.move("x",pos);
        				//Obtain grid coordinate of said position
                        pos += dimensions[0]/2;
                        pos = Math.floor(pos);
                        pos += 0.15;
                        for (i = 0; i < cube_objects.length; i++){
        					//Make cubes visible/invisible based on grid position
                            if (cube_objects[i].coord.x < pos) cube_objects[i].makeInvisible();
                            else cube_objects[i].makeVisible();
                        }
                    }
                }
                else if (selectedAxis.axis == "y"){
    			//Get intersection with plane and move object there
                    intersections = raycaster.intersectObjects([planeY]);
                    if (intersections.length > 0){
                        var pos = intersections[0].point.y;
                        selectedAxis.move("y",pos);
        				//Obtain grid coordinate of said position
                        pos += dimensions[1]/2;
                        pos = Math.floor(pos);
                        pos += 0.15;
                        for (i = 0; i < cube_objects.length; i++){
        					//Make cubes visible/invisible based on grid position
                            if (cube_objects[i].coord.y > pos) cube_objects[i].makeInvisible();
                            else cube_objects[i].makeVisible();
                        }
                    }
                }
                else if (selectedAxis.axis == "z"){
    			//Get intersection with plane and move object there
                    intersections = raycaster.intersectObjects([planeZ]);
                    if (intersections.length > 0){
                        var pos = intersections[0].point.z;
                        selectedAxis.move("z",pos);
        				//Obtain grid coordinate of said position
                        pos += dimensions[2]/2;
                        pos = Math.floor(pos);
                        pos += 0.15;
                        for (i = 0; i < cube_objects.length; i++){
        					//Make cubes visible/invisible based on grid position
                            if (cube_objects[i].coord.z > pos) cube_objects[i].makeInvisible();
                            else cube_objects[i].makeVisible();
                        }
                    }
                }
            }
            
            var intersections = raycaster.intersectObjects(cubes);
            if (intersections.length > 0){
                var cube = intersections[0].object;
                var obj = cubeDictionary[cube.id];
                if (obj === lastPress) return; //Mouse still over the same cube
                else lastPress = obj;
                //Multiple cube operations can only happen if cubes belong to the same
                //line - if they share two coordinates
                if (pressAxis === ""){
                    //At first, we can move in any axis from the starting cube
                    if (obj.coord.x === pressCoord.x && obj.coord.y === pressCoord.y){
                        //If X and Y coordinates match, we are iterating Z
                        pressAxis = "z";
                    }
                    else if (obj.coord.x === pressCoord.x && obj.coord.z === pressCoord.z){
                        //If X and Z coordinates match, we are iterating Y
                        pressAxis = "y";
                    }
                    else if (obj.coord.z === pressCoord.z && obj.coord.y === pressCoord.y){
                        //If Y and Z coordinates match, we are iterating X
                        pressAxis = "x";
                    }
                    else return;
                    
                    //Mark cubes according to mode
                    if (selectedMode == "marking"){
                        if (gameMode == "creating" || marking !== obj.marked) mark(obj,cube);
                    }
                    else if (selectedMode == "multibreak"){
                        if (marking !== obj.delMarked) delMark(obj,cube);
                    }
                }
                else{
                    //After choosing an axis, we can only do things alongside it
                    var valid = false;
                    //Check if cube is alognside specified axis, set valid to true if so
                    if (pressAxis === "x" && obj.coord.z === pressCoord.z && obj.coord.y === pressCoord.y){
                        valid = true;
                    }
                    else if (pressAxis === "y" && obj.coord.z === pressCoord.z && obj.coord.x === pressCoord.x){
                        valid = true;
                    }
                    else if (pressAxis === "z" && obj.coord.x === pressCoord.x && obj.coord.y === pressCoord.y){
                        valid = true;
                    }
                    
                    //Mark cube according to mode
                    if (valid && selectedMode == "marking"){
                        if (gameMode == "creating" || marking !== obj.marked) mark(obj,cube);
                    }
                    else if (valid && selectedMode == "multibreak"){
                        if (marking !== obj.delMarked) delMark(obj,cube);
                    }
                }
            }
        }
    
        var intersections = raycaster.intersectObjects(cubes.concat(axis));
        
        //Highlight nearest cube of ray casting
        for (i = 0; i < cube_objects.length; i++){
            for (j = 0; j < 6; j++){
                if ((gameMode == "playing" || gameMode == "tutorialA" || gameMode == "tutorialB") && cube_objects[i].marked) cube_objects[i].cube.material.materials[j].color.setHex(markColor); //Reset to markcolor if marked
                else if (gameMode == "creating") cube_objects[i].cube.material.materials[j].color.setHex(solution[cube_objects[i].coord.x][cube_objects[i].coord.y][cube_objects[i].coord.z]); //Reset to original color
                else if (cube_objects[i].delMarked) cube_objects[i].cube.material.materials[j].color.setHex(0x999999); //Reset to gray if delmarked
                else if (cube_objects[i].errorMark) cube_objects[i].cube.material.materials[j].color.setHex(0xD46A6A); //Reset to red if error
                else if (gameMode == "playing" || gameMode == "tutorialA" || gameMode == "tutorialB") cube_objects[i].cube.material.materials[j].color.setHex(0x9ADBF3); //Reset to cyan else
            }
        }
        
        for (i = 0; i < axis_objects.length; i++){
    		//Set wireframes back to black
            axis_objects[i].upperWire.material.color.setHex(0x000000);
            axis_objects[i].lowerWire.material.color.setHex(0x000000);
        }
        
        if (intersections.length > 0){
            //Only the first intersection matters
            try{
    			//Intersects a cube
    			var cubeColor = intersections[0].object.material.materials[i].color;
    			
    			var rColor = Math.floor(cubeColor.r*255);
    			var gColor = Math.floor(cubeColor.g*255);
    			var bColor = Math.floor(cubeColor.b*255);
    			
    			rColor = Math.floor(rColor*0.75);
    			gColor = Math.floor(gColor*0.75);
    			bColor = Math.floor(bColor*0.75);
    			
    			var color = (rColor*256*256) + (gColor*256) + bColor;
    			
    			for (i = 0; i < 6; i++){
                    intersections[0].object.material.materials[i].color.setHex(color); //Darker shade of previous color
    			}
            }
            catch(e){
    			//Intersects an axis mover - set its wireframe to white
                var obj = axisDictionary[intersections[0].object.id];
                obj.upperWire.material.color.setHex(0xFFFFFF);
                obj.lowerWire.material.color.setHex(0xFFFFFF);
            }
        }
    }
}

function onMouseDown(event) {
    //Changes cube properties depending on current select mode. Clicks that don't intersect cubes do nothing.
    
    event.preventDefault();
    
    if (gameMode == "playing" || gameMode == "creating" || gameMode == "tutorialA" || gameMode == "tutorialB"){
	
        if (selectedMode == "slicing") return; //Prevent event when holding down mouse when slicing
        mouse = true;
        raycaster.setFromCamera(mousepos, camera);
        var intersections = raycaster.intersectObjects(cubes.concat(axis));
        
        switch (event.button){
            case 0: //left click
                if (intersections.length > 0){
                    try{
    					//Intersects a cube
                        var cube = intersections[0].object;
                        var obj = cubeDictionary[cube.id];
                        if ((gameMode == "playing" || gameMode == "tutorialA" || gameMode == "tutorialB") && selectedMode == "breaking" && !obj.marked && !obj.errorMark && solution[obj.coord.x][obj.coord.y][obj.coord.z]){
                            //Cube to be deleted belongs in solution - dont delete
                            for (i = 0; i < 6; i++){
                                cube.material.materials[i].color.setHex(0xD46A6A);
                            }
                            obj.errorMark = true;
                            errorCounter++;
                            if (tutorial === -1 && errorCounter >= maxErrors) callDefeatError();
                            else if (errorCounter >= maxErrors) callTutorialDefeatError();
                            else callError();
                            return;
                        }
                        lastPress = obj; //Stores object for multiple cubes operations
    					//Store cube grid coordinates
                        pressCoord.x = obj.coord.x;
                        pressCoord.y = obj.coord.y;
                        pressCoord.z = obj.coord.z;
    					//Do action  based on mode
                        if (selectedMode == "breaking"){
                            destroy(obj,cube);
                            if ((gameMode == "playing" || gameMode == "tutorialA" || gameMode == "tutorialB") && cubeCounter === solutionCubes && errorCounter < maxErrors) victory();
                        }
                        else if (selectedMode == "marking"){
                            mark(obj,cube);
                            marking = obj.marked;
                        }
                        else if (selectedMode == "multibreak"){
                            delMark(obj,cube);
                            marking = obj.delMarked;
                        }
                    }
                    catch (e){
    					//Intersects an axis mover
                        var axismover = intersections[0].object;
                        var obj = axisDictionary[axismover.id];
    					//Move back all other axis mover objects to prevent multi slicing
                        for (i = 0; i < axis_objects.length; i++){
                            if (obj === axis_objects[i]) continue;
                            axis_objects[i].reset();
                        }
                        controls.enabled = false;
                        selectedMode = "slicing";
    					//Make all cubes visible if changing axis
                        if (selectedAxis !== obj){
                            for (i = 0; i < cube_objects.length; i++){
                                cube_objects[i].makeVisible();
                            }
                        }
                        selectedAxis = obj;
    					//Unmark all break marked cubes
    					for (i = 0; i < cube_objects.length; i++){
    						if (cube_objects[i].delMarked){
    							delMark(cube_objects[i],cube_objects[i].cube);
    						}
    					}
                    }
                }
                break;
    
            case 2: //right click
        }
    }
}

function onMouseUp(event){
    //Mouse up event

    event.preventDefault();

    if (gameMode == "playing" || gameMode == "creating" || gameMode == "tutorialA" || gameMode == "tutorialB"){
        mouse = false;
        pressAxis = "";
        pressCoord.x = -1;
        pressCoord.y = -1;
        pressCoord.z = -1;
        marking = null;
        if (selectedMode == "slicing"){
            selectedMode = "none";
            controls.enabled = true;
        }
    }
}

function onKeyDown(event){
    //Key down eventce
    //Pressing down W or up arrow enables break mode
    //Pressing down D or right arrow enables marking mode
    //Pressing down A or left arrow enables creating mode  
    //Pressing down S or down arrow enables multi break mode  
    
    event.preventDefault();
    
    if (gameMode == "playing" || gameMode == "creating" || gameMode == "tutorialA" || gameMode == "tutorialB"){
        if (event.keyCode == 119 || event.keyCode == 87 || event.keyCode == 38){
            //'w' or 'W' or 'up arrow'
            if (selectedMode === "none" || selectedMode === "multibreak-done"){
                selectedMode = "breaking";
                controls.enabled = false;
                //Unmark all break marked cubes
                for (i = 0; i < cube_objects.length; i++){
                    if (cube_objects[i].delMarked){
                        delMark(cube_objects[i],cube_objects[i].cube);
                    }
                }
            }
        }
        else if (gameMode !== "tutorialA" && (event.keyCode == 100 || event.keyCode == 68 || event.keyCode == 39)){
            //'d' or 'D' or 'right arrow'
            if (selectedMode === "none" || selectedMode === "multibreak-done"){
                selectedMode = "marking"
                controls.enabled = false;
                //Unmark all break marked cubes
                for (i = 0; i < cube_objects.length; i++){
                    if (cube_objects[i].delMarked){
                        delMark(cube_objects[i],cube_objects[i].cube);
                    }
                }
            }
        }
        else if (gameMode !== "tutorialA" && gameMode !== "tutorialB" && event.keyCode == 97 || event.keyCode == 65 || event.keyCode == 37){
            //'a' or 'A' or 'left arrow'
            if (selectedMode === "none" || selectedMode === "multibreak-done"){
                selectedMode = "creating"
                controls.enabled = false;
                //Unmark all break marked cubes
                for (i = 0; i < cube_objects.length; i++){
                    if (cube_objects[i].delMarked){
                        delMark(cube_objects[i],cube_objects[i].cube);
                    }
                }
            }
        }
        else if (gameMode !== "tutorialA" && gameMode !== "tutorialB" && event.keyCode == 83 || event.keyCode == 115 || event.keyCode == 40){
            //'s' or 'S' or 'down arrow'
            if (gameMode == "playing"){
                if (selectedMode === "none"){
                    selectedMode = "multibreak";
                    controls.enabled = false;
                    return;
                }
                else if (selectedMode === "multibreak-done"){
                    //Delete all break marked cubes
                    selectedMode = "multibreak-delete";
                    for (i = 0; i < cube_objects.length; i++){
                        var obj = cube_objects[i];
                        if (obj.delMarked && solution[obj.coord.x][obj.coord.y][obj.coord.z]){
                            for (j = 0; j < 6; j++){
                                obj.cube.material.materials[j].color.setHex(0xD46A6A);
                            }
                            obj.errorMark = true;
                            errorCounter++;
                            obj.delMarked = false;
                            if (tutorial === -1 && errorCounter >= maxErrors) callDefeatError();
                            else if (errorCounter >= maxErrors) callTutorialDefeatError();
                            else callError();
                        }
                        else if (obj.delMarked){
                            destroy(cube_objects[i],cube_objects[i].cube);
                            i--;
                        }
                    }
                    if (cubeCounter === solutionCubes && errorCounter < maxErrors) victory();
                    return;
                }
            }
            else if (gameMode == "creating") callColorChange();
        }
    }
}

function onKeyUp(event){
    //Key up event
    //Releasing the key that matches the current mode disables it
    //Releasing anything else does not change current mode

    event.preventDefault();
    
    if (gameMode == "playing" || gameMode == "creating" || gameMode == "tutorialA" || gameMode =="tutorialB"){
		if (event.keyCode == 27){
		    if (selectedMode == "tutorial") callT1_5();
		    else if (selectedMode == "victory" && tutorial === -1) callVictory();
		    else if (selectedMode == "victory") callTutorialVictory();
		    else if (gameMode == "creating") callCreatePauseMenu();
		    else if (tutorial === -1) callPauseMenu();
			else callTutorialPauseMenu();
		}
        if ((event.keyCode == 119 || event.keyCode == 87 || event.keyCode == 38) && selectedMode == "breaking"){
            //'w' or 'W' or 'up arrow'
            selectedMode = "none";
            controls.enabled = true;
        }
        else if ((event.keyCode == 100 || event.keyCode == 68 || event.keyCode == 39) && selectedMode == "marking"){
            //'d' or 'D' or 'right arrow'
            selectedMode = "none";
            controls.enabled = true;
        }
        else if ((event.keyCode == 97|| event.keyCode == 65 || event.keyCode == 37) && selectedMode == "creating"){
            //'a' or 'A' or 'left arrow'
            selectedMode = "none";
            controls.enabled = true;
        }
        else if ((event.keyCode == 83|| event.keyCode == 115 || event.keyCode == 40) && selectedMode == "multibreak"){
            //'s' or 'S' or 'down arrow'
            selectedMode = "multibreak-done";
        }
        else if (selectedMode == "multibreak-delete"){
            selectedMode = "none";
            controls.enabled = true;
        }
    }
}

/***********************************************************************************/
/********************************    Edges     *************************************/
/***********************************************************************************/
/***********************************************************************************/

var Edge = function(atom1, atom2, equilibrium) {
    this.atom1 = atom1
    this.atom2 = atom2
    this.equilibrium = equilibrium
    this.visited = false
}

Edge.prototype.reset = function() {
    this.visited = false
}

Edge.prototype.getSecond = function() {
    return this.atom2
}

Edge.prototype.getVisited = function() {
    return this.visited
}

Edge.prototype.setVisited = function() {
    this.visited = true
}

Edge.prototype.resetVisited = function() {
    this.visited = false
}

/***********************************************************************************/
/********************************    Node     *************************************/
/***********************************************************************************/
/***********************************************************************************/
/** parameters should have position etc...*/

var Node = function(atom, aid, name,
    props = {
        mass: 1,
        position: new THREE.Vector3(0, 0, 0),
        velocity: new THREE.Vector3(0, 0, 0),
        acceleration: new THREE.Vector3(0, 0, 0),
        force: new THREE.Vector3(0, 0, 0)
    },
    edges = []) {
    this.atom = atom;
    this.aid = aid;
    this.position = props.position;
    this.oldposition = props.position;
    this.velocity = props.velocity;
    this.acceleration = props.acceleration;
    this.edges = edges;
    this.mass = props.mass;
    this.name = name;
    this.energy = 0; // could have this properly calculated instead of assuming equilibrium
    this.maxEnergy = 0;
    this.atom.energy = this.energy
    this.radius = props.radius

    // for reseting the system
    this.atom_ = this.atom.clone()
    this.position_ = this.position.clone()
    this.oldposition_ = this.position_.clone()
    this.acceleration_ = props.acceleration;
}

Node.prototype.reset = function() {
    this.atom = this.atom_.clone()
    this.position = this.position_.clone()
    this.oldposition = this.position_.clone()
    this.acceleration = this.acceleration_
    this.energy = 0; // same as above - could properly calculate
    this.maxEnergy = 0;
        // TODO: FM why??????
        this.edges.forEach(function(e){
        	e.reset()
        })
}

// 
Node.prototype.updateForce = function(force) {
    this.force = force
}

Node.prototype.getForce = function(network = null) {
    var newForce = new THREE.Vector3(0, 0, 0)
    var posCopy = new THREE.Vector3(this.position.x, this.position.y, this.position.z)

    this.edges.forEach(function(e, i) {
        var dist = posCopy.distanceTo(e.atom2.position)
        var forceTmp = posCopy.sub(e.atom2.position)
        forceTmp.normalize()
        forceTmp.multiplyScalar(settings.hookeConstant * (e.equilibrium - dist))
        newForce.add(forceTmp)
    })
    this.force = newForce
}

Node.prototype.updateVelocity = function(t) { // v_i = (x_i - x_{i-1})/timestep
    var posCopy = new THREE.Vector3(this.position.x, this.position.y, this.position.z);
    var oldposCopy = new THREE.Vector3(this.oldposition.x, this.oldposition.y, this.oldposition.z);
    var c = posCopy.sub(oldposCopy);
    this.velocity = c.divideScalar(t);
}


Node.prototype.updateAcceleration = function() { // acceleration from current force
    var forceCopy = new THREE.Vector3(this.force.x, this.force.y, this.force.z);
    this.acceleration = forceCopy.divideScalar(this.mass);
}

Node.prototype.updatePosition = function(t) {
    // storing the old position
    this.oldposition = new THREE.Vector3(this.position.x, this.position.y, this.position.z);
    // updating position
    var v = new THREE.Vector3(this.velocity.x, this.velocity.y, this.velocity.z);
    var a = new THREE.Vector3(this.acceleration.x, this.acceleration.y, this.acceleration.z);
    this.position.add(v.multiplyScalar(t));
    this.position.add(a.multiplyScalar(0.5 * t * t));
}

Node.prototype.setVelocity = function(velocity) {
    this.velocity = velocity
}

Node.prototype.setPosition = function(position) {
    this.position = position
}

Node.prototype.getVisited = function() {
    return this.visited
}

Node.prototype.setVisited = function() {
    this.visited = true
}

Node.prototype.setVisited = function(node) {
    this.edges.forEach(function(edge) {
        if (edge.atom2.aid == node.aid) {
            edge.setVisited()
            node.edges.forEach(function(another) {
                if (another.atom2.aid == this.aid) {
                    another.edge.setVisited()
                }
            })
        }
    })
}

Node.prototype.resetVisited = function() {
    this.visited = false
    this.edges.forEach(function(e){
        e.resetVisited()
    })
}

Node.prototype.addNeighbor = function(node, equilibrium) {
    if (this.hasThisNeighbor(node) == false) {
        this.edges.push(new Edge(this, node, equilibrium))
        node.edges.push(new Edge(node, this, equilibrium))
    }
}

Node.prototype.hasThisNeighbor = function(node) {
    this.edges.forEach(function(edge) {
        if (edge.getSecond().aid == node.aid) {
            return true
        }
    })
    return false
}

Node.prototype.getNeighbors = function() {
    var neighbors = []
    this.edges.forEach(function(edge) {
        neighbors.push(edge.getSecond())
    })
    return neighbors
}

Node.prototype.getAtomEnergy = function() {
    var energy = 0;

    var positionCopy = new THREE.Vector3(this.position.x, this.position.y, this.position.z);
    this.edges.forEach(function(e, i) {
        var dist = positionCopy.distanceTo(e.atom2.position);
        var x = e.equilibrium - dist;
        energy += 0.5 * settings.hookeConstant * x * x;
    })

    energy = energy / (settings.unitScale * settings.unitScale);
 //   console.log(energy)
    return energy
}

Node.prototype.getMomentum = function() {
    var velocityTmp = this.velocity.clone()
    velocityTmp.multiplyScalar(this.mass)
    return velocityTmp
}

Node.prototype.setAtomEnergy = function(energy) {
    this.energy = energy
}

Node.prototype.updateAtomEnergy = function() {
    var energy = 0;

    var positionCopy = new THREE.Vector3(this.position.x, this.position.y, this.position.z);
    this.edges.forEach(function(e, i) {
        var dist = positionCopy.distanceTo(e.atom2.position);
        var x = e.equilibrium - dist;
        energy += 0.5 * settings.hookeConstant * x * x;
    })

    energy = energy / (settings.unitScale * settings.unitScale);
    this.energy = energy
    this.atom.energy = energy
}

/***********************************************************************************/
/********************************    Network   *************************************/
/***********************************************************************************/
/***********************************************************************************/
var Network = function(root) {
    this.nodeList = []
    this.nodeList.push(root)
}

Network.prototype.addNode = function(node) {
    this.nodeList.forEach(function(thisNode) {
        if (thisNode.aid == node.aid) {
            return
        }
    })
    this.nodeList.push(node)
    return this
}

Network.prototype.getNodeList = function() {
    return this.nodeList
}

Network.prototype.getNode = function(aid) {
    var result
    this.nodeList.forEach(function(node) {
        if (node.aid == +aid) {
            result = node
        }
    })
    return result
}

Network.prototype.resetVisited = function() {
    this.nodeList.forEach(function(node) {
        node.resetVisited();
    })
}

Network.prototype.reset = function() {
    this.nodeList.forEach(function(node) {
        node.reset();
    })
}

Network.prototype.getEnergy = function() {
    var energy = 0;
    this.nodeList.forEach(function(node) {
        // energy += node.getAtomEnergy

        var thisCopy = new THREE.Vector3(node.position.x, node.position.y, node.position.z);
        node.edges.forEach(function(e, i) {
            var dist = thisCopy.distanceTo(e.atom2.position);
            var x = e.equilibrium - dist;
            energy += 0.5 * settings.hookeConstant * x * x;
        })
    })

    energy = energy / (settings.unitScale * settings.unitScale);

    return energy
}

Network.prototype.getForceAcc = function() {
    this.nodeList.forEach(function(n, i) {
        n.getForce()
        n.updateAcceleration()
    })
}

Network.prototype.getBoundingBox = function() {
    var box = {x1:0, y1:0, z1:0,x2:0, y2:0, z2:0}

    this.nodeList.forEach(function(n, i) {
        if(n.position.x - n.radius < box.x1)
            box.x1 = n.position.x - n.radius
        if(n.position.x + n.radius > box.x2)
            box.x2 = n.position.x  + n.radius
        if(n.position.y - n.radius < box.y1)
            box.y1 = n.position.y  - n.radius
        if(n.position.y + n.radius > box.y2)
            box.y2 = n.position.y  + n.radius
        if(n.position.z - n.radius < box.z1)
            box.z1 = n.position.z  - n.radius
        if(n.position.z + n.radius > box.z2)
            box.z2 = n.position.z  + n.radius
    })

    return box
}

Network.prototype.updateNodes = function() {
    this.nodeList.forEach(function(n, i) {
        n.updateVelocity(settings.timeStep)
        n.updatePosition(settings.timeStep)
        n.updateAtomEnergy()
    })
}

Network.prototype.updateOldPositionToCurrentPosition = function(id){
    this.nodeList.forEach(function(n, i) {
        // console.log(n.aid + "," + id)
        if(n.aid == id){
            n.oldposition = n.position.clone()
        }
    })
}

Network.prototype.updateCurrentPositionToOldPositionForAll = function(){
    this.nodeList.forEach(function(n, i) {
        n.position = n.oldposition.clone()
    })
}

Network.prototype.updateEnergyForAll = function() {
    this.nodeList.forEach(function(n,i) {
        n.energy = n.getAtomEnergy()
        n.atom.energy = n.energy
        n.maxEnergy = n.getAtomEnergy()
        // console.log(n.maxEnergy)
    })
}

/***********************************************************************************/
/******************************    Build Network   *********************************/
/***********************************************************************************/
/***********************************************************************************/

/******************************    Constants   *********************************/

// unit scale: 2000 units -> ~7 angstroms
settings = {
    unitScale: 285,
    hookeConstant: 0.3, // in amu/s^2 ---- not actually correct, doublecheck vibrational modes
    timeStep: 0.2,
    energyHistory: [],
    maxHistory: 1000,
    energyUnitScale: 20
}

parameters = {
    "H2": {
        "HH": 0.74, // equilibrium bond distance in angstroms
        "opacityThresholdScale": 2 * settings.unitScale, // update these to van der waals radii
        "momentumScale": 1
    },
    "H2O": {
        "OH": 0.96,
        "opacityThresholdScale": 2.5 * settings.unitScale,
        "momentumScale": 1
    },
    "O2": {
        "OO": 1.48,
        "opacityThresholdScale": 2 * settings.unitScale,
        "momentumScale": 1
    },
    "mass": {
        "H": 1,
        "O": 16
    },
    "radius": {
        "H": 0.25,
        "O": 0.60
    },
    // these colors are consistent with ASE system
    // may need to swicth back if we don't do any tricks on hue
    "color": {
        "H": 'hsl(180, 100%, 25%)',
        "O": 'hsl(180, 100%, 100%)',
        "bond": 'hsl(7,0%,48%)',
        "momentum": 'hsl(7,0%,48%)',
        "selected" : 0x754200,
        "axis" : 0x000000
    },
    "hsl":{
        "H": {'h':'180', 's':'100%', 'l':'25%'},
        "O": {'h':'180', 's':'100%', 'l':'100%'},
        "bond": {'h':'7', 's':'0%', 'l':'48%'},
        "momentum": {'h':'7', 's':'0%', 'l':'48%'},
    },
    "bondwidth": 10

}

/******************************     Water     *********************************/
function buildH2O() {
    var atomGeo1 = new THREE.SphereGeometry(settings.unitScale * parameters.radius.H, 100, 100);
    var atomGeo2 = new THREE.SphereGeometry(settings.unitScale * parameters.radius.H, 100, 100);
    var atomGeo3 = new THREE.SphereGeometry(settings.unitScale * parameters.radius.O, 100, 100);

    var materialH1 = new THREE.MeshLambertMaterial({
        color: parameters.color.H
    })
    var materialH2 = new THREE.MeshLambertMaterial({
        color: parameters.color.H
    })
    var materialO = new THREE.MeshLambertMaterial({
        color: parameters.color.O
    })

    var atom1 = new THREE.Mesh(atomGeo1, materialH1);
    var atom2 = new THREE.Mesh(atomGeo2, materialH2);
    var atom3 = new THREE.Mesh(atomGeo3, materialO);

    atom1.radius = settings.unitScale * parameters.radius.H
    atom2.radius = settings.unitScale * parameters.radius.H
    atom3.radius = settings.unitScale * parameters.radius.O

    var node1 = new Node(atom1, 1, "H", {
        mass: parameters.mass.H,
        position: new THREE.Vector3(150, 10, 0),
        velocity: new THREE.Vector3(0, 0, 0),
        acceleration: new THREE.Vector3(0, 0, 0),
        force: new THREE.Vector3(0, 0, 0),
        radius: settings.unitScale * parameters.radius.H
    })
    var node2 = new Node(atom2, 2, "H", {
        mass: parameters.mass.H,
        position: new THREE.Vector3(-150, 10, 0),
        velocity: new THREE.Vector3(0, 0, 0),
        acceleration: new THREE.Vector3(0, 0, 0),
        force: new THREE.Vector3(0, 0, 0),
        radius: settings.unitScale * parameters.radius.H
    })
    var node3 = new Node(atom3, 3, "O", {
        mass: parameters.mass.O,
        position: new THREE.Vector3(0, 100, 0),
        velocity: new THREE.Vector3(0, 0, 0),
        acceleration: new THREE.Vector3(0, 0, 0),
        force: new THREE.Vector3(0, 0, 0),
        radius: settings.unitScale * parameters.radius.O
    })

    node3.addNeighbor(node1, parameters.H2O.OH * settings.unitScale)
    node3.addNeighbor(node2, parameters.H2O.OH * settings.unitScale)
    var H2O = new Network(node3)
    H2O.addNode(node1)
    H2O.addNode(node2)

    return H2O
}

/******************************    Hydrogen   *********************************/
function buildH2() {
    var atomGeo1 = new THREE.SphereGeometry(settings.unitScale * parameters.radius.H, 100, 100);
    var atomGeo2 = new THREE.SphereGeometry(settings.unitScale * parameters.radius.H, 100, 100);

    var material1 = new THREE.MeshLambertMaterial({
        color: parameters.color.H
    })
    var material2 = new THREE.MeshLambertMaterial({
        color: parameters.color.H
    })

    var atom1 = new THREE.Mesh(atomGeo1, material1);
    var atom2 = new THREE.Mesh(atomGeo2, material2);
    
    atom1.radius = settings.unitScale * parameters.radius.H
    atom2.radius = settings.unitScale * parameters.radius.H

    var node1 = new Node(atom1, 1, "H", {
        mass: parameters.mass.H,
        position: new THREE.Vector3(-(parameters.H2.HH * settings.unitScale) / 2.0, 0, 0),
        velocity: new THREE.Vector3(0, 0, 0),
        acceleration: new THREE.Vector3(0, 0, 0),
        force: new THREE.Vector3(0, 0, 0),
        radius: settings.unitScale * parameters.radius.H
    })
    var node2 = new Node(atom2, 2, "H", {
        mass: parameters.mass.H,
        position: new THREE.Vector3((parameters.H2.HH * settings.unitScale) / 2.0, 0, 0),
        velocity: new THREE.Vector3(0, 0, 0),
        acceleration: new THREE.Vector3(0, 0, 0),
        force: new THREE.Vector3(0, 0, 0),
        radius: settings.unitScale * parameters.radius.H
    })

    node1.addNeighbor(node2, parameters.H2.HH * settings.unitScale)
    var H2 = new Network(node1)
    H2.addNode(node2)

    return H2
}
/******************************    Oxygen   *********************************/
function buildO2() {
    var atomGeo1 = new THREE.SphereGeometry(parameters.radius.O * settings.unitScale , 100, 100);
    var atomGeo2 = new THREE.SphereGeometry(parameters.radius.O * settings.unitScale, 100, 100);

    var materialWhite1 = new THREE.MeshLambertMaterial({
        color: parameters.color.O
    })
    var materialWhite2 = new THREE.MeshLambertMaterial({
        color: parameters.color.O
    })

    var atom1 = new THREE.Mesh(atomGeo1, materialWhite1);
    var atom2 = new THREE.Mesh(atomGeo2, materialWhite2);

    atom1.radius = settings.unitScale * parameters.radius.O
    atom2.radius = settings.unitScale * parameters.radius.O

    var node1 = new Node(atom1, 1, "O", {
        mass: parameters.mass.O,
        position: new THREE.Vector3(-(parameters.O2.OO * settings.unitScale) / 2.0, 0, 0),
        velocity: new THREE.Vector3(0, 0, 0),
        acceleration: new THREE.Vector3(0, 0, 0),
        force: new THREE.Vector3(0, 0, 0),
        radius: settings.unitScale * parameters.radius.O
    })

    var node2 = new Node(atom2, 2, "O", {
        mass: parameters.mass.O,
        position: new THREE.Vector3((parameters.O2.OO * settings.unitScale) / 2.0, 0, 0),
        velocity: new THREE.Vector3(0, 0, 0),
        acceleration: new THREE.Vector3(0, 0, 0),
        force: new THREE.Vector3(0, 0, 0),
        radius: settings.unitScale * parameters.radius.O
    })

    node1.addNeighbor(node2, parameters.O2.OO * settings.unitScale)
    O2 = new Network(node1)
    O2.addNode(node2)

    return O2
}

systems = {
    "H2O": buildH2O(),
    "H2": buildH2(),
    "O2": buildO2()
}
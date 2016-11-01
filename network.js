

/***********************************************************************************/
/********************************    Edges     *************************************/
/***********************************************************************************/
/***********************************************************************************/

var Edge = function(atom1, atom2){
	this.atom1 = atom1
	this.atom2 = atom2
	this.visited = false
}

Edge.prototype.getSecond = function(){
	return this.atom2
}

Edge.prototype.getVisited = function(){
	return this.visited
}

Edge.prototype.setVisited = function(){
	this.visited = true
}

Edge.prototype.resetVisited = function(){
    this.visited = false
}

/***********************************************************************************/
/********************************    Node     *************************************/
/***********************************************************************************/
/***********************************************************************************/
/** parameters should have position etc...*/

var Node = function(atom, aid, position, 
	mass = 1, velocity = new THREE.Vector3(0, 0, 0), force = new THREE.Vector3(0, 0, 0),  edges = []){
	this.atom = atom
	this.atom.position.x = position.x
	this.atom.position.y = position.y
	this.atom.position.z = position.z
	this.aid = aid
	this.position = position
    this.edges = edges;
    this.mass = mass;
}

Node.prototype.updateForce = function(force){
	this.force = force
}

Node.prototype.updateVelocity = function(velocity){
	this.velocity = velocity
}

Node.prototype.updatePosition = function(pos){
	this.position = position
}

Node.prototype.getVisited = function(){
	return this.visited
}

Node.prototype.setVisited = function(){
	this.visited = true
	this.edges.forEach(function(edge){
        edge.atom2.resetVisited()
    })
}

Node.prototype.resetVisited = function(){
    this.visited = false
}

Node.prototype.addNeighbor = function(node){
	if(this.hasThisNeighbor(node) == false){
        this.edges.push(new Edge(this, node))
        node.edges.push(new Edge(node, this))
    }
}

Node.prototype.hasThisNeighbor = function(node){
	 this.edges.forEach(function(edge){
        if(edge.getSecond().aid == node.aid){
        	return true
        }
    })
	 return false
}

Node.prototype.getNeighbors = function(){
    var neighbors = []
    this.edges.forEach(function(edge){
        neighbors.push(edge.getSecond())
    })
    return neighbors
}


/***********************************************************************************/
/********************************    Network   *************************************/
/***********************************************************************************/
/***********************************************************************************/
var Network = function(root){
    this.nodeList = []
	this.nodeList.push(root)
}

Network.prototype.addNode = function(node){
	this.nodeList.forEach(function(thisNode){
        if(thisNode.aid == node.aid){
        	return
        }
	})
	this.nodeList.push(node)
}

Network.prototype.getNodeList = function(){
	return this.nodeList
}

Network.prototype.resetVisited = function(){
	this.nodeList.forEach(function(node){
          node.resetVisited();
	})
}

/**********************************************************************************/
/******************************    Build Network   *********************************/
/************************************************************************************/
/***********************************************************************************/

var atomGeo1 = new THREE.SphereGeometry( 80, 300, 300 );
var atomGeo2 = new THREE.SphereGeometry( 150, 100, 100 );

var materialWhite = new THREE.MeshLambertMaterial( {color: 0xffffff} )
var materialGray = new THREE.MeshLambertMaterial( {color: 0x555555} )
var materialCyan = new THREE.MeshLambertMaterial( {color: 0x008080} )

var atom1 = new THREE.Mesh( atomGeo1, materialWhite );
var atom2 = new THREE.Mesh( atomGeo1, materialWhite );
var atom3 = new THREE.Mesh( atomGeo2, materialCyan );

var node1 = new Node(atom1, 1, {x:-250, y:100, z:0})
var node2 = new Node(atom2, 2, {x:250, y:-100, z:0})
var node3 = new Node(atom3, 3, {x:0, y:0, z:100})

node3.addNeighbor(node1)
node3.addNeighbor(node2)

network = new Network(node3);
network.addNode(node1)
network.addNode(node2)
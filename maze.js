/*
Mazen
Copyright (c) 2011 Jason Stehle

Permission is hereby granted, free of charge, to any person obtaining 
a copy of this software and associated documentation files (the 
"Software"), to deal in the Software without restriction, including 
without limitation the rights to use, copy, modify, merge, publish, 
distribute, sublicense, and/or sell copies of the Software, and to 
permit persons to whom the Software is furnished to do so, subject to 
the following conditions:

The above copyright notice and this permission notice shall be 
included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, 
EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF 
MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND 
NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE 
LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION 
OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION 
WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
*/

(function () {

function Maze(width, height) {
    this.width = width;
    this.height = height;
    this.mazeRoot = null;
    this.mazeMax = null;
}

Maze.EDGE_LEFT = 0;
Maze.EDGE_TOP = 1;
Maze.EDGE_RIGHT = 2;
Maze.EDGE_BOTTOM = 3;

function Edge(from, to) {
    this.from = from;
    this.to = to;
    this.connected = false;
}

function GridNode(x, y) {
    this.edges = [null, null, null, null];
    this.visited = false;
    this.x = x;
    this.y = y;
    this.border = false;
}

Maze.prototype.attach = function (fromNode, toNode, fromPosition, toPosition) {    
    var newEdge = new Edge(fromNode, toNode);
    
    if (fromNode) {
        fromNode.edges[fromPosition] = newEdge;
    } else {
        toNode.border = true;
    }
    
    if (toNode) {
        toNode.edges[toPosition] = newEdge;
    } else {
        fromNode.border = true;
    }
};

Maze.prototype.buildGrid = function () {
    var x, y, node, top, left, nextTop, root = null;
    nextTop = top = null;
    for (y = 0; y < this.height; y++) {
        left = null;
        top = nextTop;
        
        for (x = 0; x < this.width; x++) {
            node = new GridNode(x, y);
            
            if (!root) { root = node; }
            if (x === 0) { nextTop = node; }
            
            this.attach(node, left, Maze.EDGE_LEFT, Maze.EDGE_RIGHT);
            this.attach(node, top, Maze.EDGE_TOP, Maze.EDGE_BOTTOM);
            
            if (top) { top = top.edges[Maze.EDGE_RIGHT].from; }
            if (y === this.height - 1) { this.attach(null, node, Maze.EDGE_TOP, Maze.EDGE_BOTTOM); } //give the last row a bottom edge
            
            left = node;
        }
        
        this.attach(null, node, Maze.EDGE_LEFT, Maze.EDGE_RIGHT); //get the column row node a right edge.
    }
    return root;
};

Maze.prototype.checkEdge = function (node, edge) {
    if (edge.from === node) {
        if (edge.to && !edge.to.visited) {
            edge.connected = true;
            return edge.to;
        }
        return null;
    }
    
    if (edge.to === node) {
        if (edge.from && !edge.from.visited) {
            edge.connected = true;
            return edge.from;
        }
    }
    return null;
};

Maze.prototype.fiftyFiftySort = function () {
    return 0.5 - Math.random();
};

Maze.prototype.fiftyFifty = function () {
    return (Math.random() < 0.5);
};

Maze.prototype.connectMaze = function (node, depth, max) {
    var res, i, edges = [];
    node.visited = true;
    
    if (node.border && max.value < depth) { //track longest path to border spot
        max.node = node;
        max.value = depth;
    }
    
    edges.push.apply(edges, node.edges); //copy edges
    edges.sort(this.fiftyFiftySort); //so we can randomize them as we crawl
    
    for (i = 0; i < edges.length; i++) {
        res = this.checkEdge(node, edges[i]);
        if (res) { this.connectMaze(res, depth + 1, max); }
    }
};

Maze.prototype.setEndNode = function () {
    var x, y,
        widthMode = this.fiftyFifty(),
        max = this.widthMode ? this.width : this.height,
        spot = Math.random() * max,
        node = this.mazeRoot,
        maxX = widthMode ? spot : this.width,
        maxY = widthMode ? this.height : spot;
    
    for (x = 0; x < maxX - 1; x++) {
        node = node.edges[Maze.EDGE_RIGHT].from;
    }
    
    for (y = 0; y < maxY - 1; y++) {
        node = node.edges[Maze.EDGE_BOTTOM].from;
    }
    
    this.mazeEnd = node;
};

Maze.prototype.build = function (renderer) {
    this.mazeRoot = this.buildGrid();
    this.setEndNode(); //pick a random end point along the edge;
    this.mazeMax = {value:0, node: null};
    this.connectMaze(this.mazeEnd, 0, this.mazeMax);
    renderer.renderMaze(this);
};

Maze.prototype.solveNode = function (node, nodeStack, x2, y2) {
    var i, edge, result, childNode;
    node.visited = true;
    nodeStack.push(node); //put it on the stack in the hopes that this is part of the solution path
    
    if (node.x === x2 && node.y === y2) {
        return true;
    }
    
    for (i = 0; i < node.edges.length; i++) {
        edge = node.edges[i];
        if (edge.connected) {        
            childNode = (edge.from === node ? edge.to : edge.from);
            
            if (childNode && !childNode.visited) {
                result = this.solveNode(childNode, nodeStack, x2, y2);
                if (result) { return true; }
            }
        }
    }
    
    nodeStack.pop(); //it's a dead end
    return false;
};

Maze.prototype.solve = function (renderer, mode) {
    var nodeStack = [];
    this.solveNode(this.mazeEnd, nodeStack, this.mazeMax.node.x, this.mazeMax.node.y);
    renderer.renderSolution(this, nodeStack, mode);
};

this.Maze = Maze;

})();
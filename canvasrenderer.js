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

function CanvasRenderer(zoom, context) {
    this.zoom = zoom;
    this.context = context;
}

CanvasRenderer.prototype.drawLine = function (x1, y1, x2, y2) {
    this.context.moveTo(x1, y1);
    this.context.lineTo(x2, y2);
};

CanvasRenderer.prototype.renderFilledTriangle = function (fillStyle, x1, y1, x2, y2, x3, y3) {
    this.context.fillStyle = fillStyle;
    this.context.beginPath();
    this.context.moveTo(x1, y1);
    this.context.lineTo(x2, y2);
    this.context.lineTo(x3, y3);
    this.context.fill();
};

CanvasRenderer.prototype.paintEnd = function (maze, node) {
    var arrowSize = 9,
        arrowDepth = 5,
        offset = Math.ceil(this.zoom / 2) - (arrowSize / 2),
        xp = (node.x * this.zoom) + this.zoom,
        yp = (node.y * this.zoom) + this.zoom;
    
    if (node.x === maze.width - 1) { //exit right
        xp = this.zoom + xp + arrowDepth;
        yp += offset;
        this.renderFilledTriangle("#F00", xp, yp, xp, yp + arrowSize, xp + arrowDepth, yp + arrowDepth);
    } else if (node.y === maze.height - 1) { //exit down
        xp += offset;
        yp = this.zoom + yp + arrowDepth;
        this.renderFilledTriangle("#F00", xp, yp, xp + arrowSize, yp, xp + arrowDepth, yp + arrowDepth);
    }
};

CanvasRenderer.prototype.paintStart = function (maze, node) {
    var arrowSize = 9,
        arrowDepth = 5,
        offset = Math.floor(this.zoom/2) - (arrowSize/2),
        xp = (node.x * this.zoom) + this.zoom,
        yp = (node.y * this.zoom) + this.zoom;
    
    if (node.x === maze.width - 1) { //exit right
        xp = (this.zoom * 2) + xp;
        yp += offset;
        this.renderFilledTriangle("#00F", xp, yp, xp, yp + arrowSize, xp - arrowDepth, yp + arrowDepth);
    } else if (node.x === 0) { //exit left
        xp = xp + offset - this.zoom;
        yp += offset;
        this.renderFilledTriangle("#00F", xp, yp, xp, yp + arrowSize, xp + arrowDepth, yp + arrowDepth);
    } else if (node.y === maze.height - 1) { //exit bottom
        xp += offset;
        yp = (this.zoom * 2) + yp;
        this.renderFilledTriangle("#00F", xp, yp, xp + arrowSize, yp, xp + arrowDepth, yp - arrowDepth);
    } else if (node.y === 0) { //exit top
        xp += offset;
        yp = yp + offset - this.zoom;
        this.renderFilledTriangle("#00F", xp, yp, xp + arrowSize, yp, xp + arrowDepth, yp + arrowDepth);
    }
};

CanvasRenderer.prototype.paintNode = function (maze, node, width, height, isMaxNode, isEndNode) {
    var isExitNode = isMaxNode || isEndNode,
        xo = this.zoom + (node.x * this.zoom),
        yo = this.zoom + (node.y * this.zoom);

    if (!node.edges[Maze.EDGE_LEFT].connected) {
        if (!isExitNode || node.x !== 0) { this.drawLine(xo, yo, xo, yo + this.zoom); }
    }

    if ((node.x === width - 1) && !node.edges[Maze.EDGE_RIGHT].connected) {
        if (!isExitNode) { this.drawLine(xo + this.zoom, yo, xo + this.zoom, yo + this.zoom); }
    }

    if (!node.edges[Maze.EDGE_TOP].connected) {
        if ((!isExitNode || node.y !== 0)) { this.drawLine(xo, yo, xo + this.zoom, yo); }
    }

    if ((node.y === height - 1) && !node.edges[Maze.EDGE_BOTTOM].connected) {
        if (!isExitNode) { this.drawLine(xo, yo + this.zoom, xo + this.zoom, yo + this.zoom); }
    }
};

CanvasRenderer.prototype.renderMaze = function (maze) {
    var first, node = maze.mazeRoot;

    this.context.lineWidth = 2;
    this.context.beginPath(); //fun one: IE9 will re-render the previously drawn lines if this wasn't called.
    first = node;

    while (node) {
        node.visited = false; //reset for solver
        this.paintNode(maze, node, maze.width, maze.height, node === maze.mazeMax.node, node === maze.mazeEnd);
        node = node.edges[Maze.EDGE_RIGHT].from;
        if (!node) {
            first = node = first.edges[Maze.EDGE_BOTTOM].from;
        }
    }
    this.context.stroke();

    this.paintEnd(maze, maze.mazeEnd);
    this.paintStart(maze, maze.mazeMax.node);
};

CanvasRenderer.prototype.renderSolution = function (maze, nodeStack, show) {
    var xo, yo, xp, yp, i, 
        node = nodeStack[0],
        colorIncrement = 255/(nodeStack.length),
        r = 255,
        g = 0,
        b = 0,
        offset = Math.floor(this.zoom/2);

    if (!show) {
        this.context.strokeStyle = "#FFF";
        this.context.lineWidth = 2;
    } else {
        this.context.lineWidth = 2;
    }

    if (node.x === maze.width - 1) {
        xp = offset + ((node.x + 2) * this.zoom);
        yp = offset + ((node.y + 1) * this.zoom);
    } else if (node.y === maze.height - 1) {
        xp = offset + ((node.x + 1) * this.zoom);
        yp = offset + ((node.y + 2) * this.zoom);
    }

    for (i = 0; i < nodeStack.length; i++) {
        node = nodeStack[i];
        node.visited = false;
        xo = this.zoom + (node.x * this.zoom);
        yo = this.zoom + (node.y * this.zoom);
        if (show) {
            this.context.strokeStyle = "rgb(" + Math.floor(r) + "," + Math.floor(g) + "," + Math.floor(b) + ")";
        }
        this.context.beginPath();
        this.drawLine(xp, yp, xo + offset, yo + offset);
        this.context.stroke();
    
        xp = xo + offset;
        yp = yo + offset;
    
        r -= colorIncrement;
        b += colorIncrement;
    }

    //draw exit
    this.context.beginPath();
    if (node.x === maze.width - 1) { //exit right
        this.drawLine(xp, yp, this.zoom + xp, yp);
    } else if (node.x === 0) { //exit left
        this.drawLine(xp, yp, offset, yp);
    } else if (node.y === maze.height - 1) { //exit bottom
        this.drawLine(xp, yp, xp, this.zoom + yp);
    } else if (node.y === 0) { //exit top
        this.drawLine(xp, yp, xp, offset);
    }
    
    this.context.stroke();    
};

this.CanvasRenderer = CanvasRenderer;

})();
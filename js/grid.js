var GridMapIso = GridMapIso || {};

GridMapIso.Class = function() {
    var class_obj = {};
    var events = [];
    
    class_obj.trigger = function(event_name) {
        var _args = [];
        
        if (event_name in events) {
            for (var i=0; i<events[event_name].length; i++) {
                for (var j=1; j<arguments.length; j++) {
                    _args.push(arguments[j]);
                }
                events[event_name][i].apply(this, _args);
            }
        }
        
        return class_obj;
    };
    
    class_obj.on = function(event_name, event_function) {
        if (!(event_name in events)) {
            events[event_name] = [];
        }
        
        events[event_name].push(event_function);
        
        return class_obj;
    };
    
    return class_obj;
};

GridMapIso.Grid = function(container, x, y, z) {
    var grid = new GridMapIso.Class();
    
    var gridContainer = container,
        maxX = x,
        maxY = y,
        maxZ = z;
    
    var svg,
        mainLayer,
        canvas,
        layerSubGrid,
        layerGrid,
        layerObjects,
        layerOverlay,
        zoom;
    
    var objects = [];
    
    var objectIdPrefix = "obj",
        squareSize = 20,
        squareSizeY = Math.round(Math.sqrt(squareSize * squareSize / 5)),
        squareSizeX = squareSizeY * 2,
        gridColor = "#ccc",
        gridLineColor = "#f0f0f0",
        gridSize = [800, 800],
        gridOrigin = [0, 0];
    
    var selectionCoords = [-1, -1, 0];
    
    var idCount = 0;
    
    function init() {
        zoom = d3.zoom()
            .scaleExtent([0.25, 5])
            .on('zoom', function() {
                mainLayer.attr("transform", d3.event.transform);
            });
        
        
        
        svg = gridContainer.append('svg')
            .attr('width', gridSize[0])
            .attr('height', gridSize[1])
            .call(zoom);
            
        mainLayer = svg.append('g');
        layerSubGrid = mainLayer.append('g');
        layerGrid = mainLayer.append('g');
        canvas = layerSubGrid.append('rect')
            .attr('fill', 'white')
            .attr('width', '100%')
            .attr('height', '100%');
        layerObjects = mainLayer.append('g');
        layerOverlay = mainLayer.append('g');
        
        // draw lines
        
        gridOrigin = [400, 400];
        
        // grid lines
        for (var i = 1; i <= maxZ; i++) {
            layerGrid.append('line')
                .attr("x1", gridOrigin[0])
                .attr("y1", gridOrigin[1] - squareSize * i)
                .attr("x2", gridOrigin[0] - squareSizeX * maxX)
                .attr("y2", gridOrigin[1] + squareSizeY * maxX - squareSize * i)
                .attr("stroke", gridLineColor)
                .attr("stroke-width", 1);
            
            layerGrid.append('line')
                .attr("x1", gridOrigin[0])
                .attr("y1", gridOrigin[1] - squareSize * i)
                .attr("x2", gridOrigin[0] + squareSizeX * maxX)
                .attr("y2", gridOrigin[1] + squareSizeY * maxY - squareSize * i)
                .attr("stroke", gridLineColor)
                .attr("stroke-width", 1);
        }
        
        for (var i = 1; i <= maxX; i++) {
            layerGrid.append('line')
                .attr("x1", gridOrigin[0] - squareSizeX * i)
                .attr("y1", gridOrigin[1] + squareSizeY * i)
                .attr("x2", gridOrigin[0] - squareSizeX * i)
                .attr("y2", gridOrigin[1] + squareSizeY * i - squareSize * maxZ)
                .attr("stroke", gridLineColor)
                .attr("stroke-width", 1);
            
            layerGrid.append('line')
                .attr("x1", gridOrigin[0] - squareSizeX * i)
                .attr("y1", gridOrigin[1] + squareSizeY * i)
                .attr("x2", gridOrigin[0] - squareSizeX * i + squareSizeX * maxX)
                .attr("y2", gridOrigin[1] + squareSizeY * i + squareSizeY * maxY)
                .attr("stroke", gridLineColor)
                .attr("stroke-width", 1);
        }
        
        for (var i = 1; i <= maxY; i++) {
            layerGrid.append('line')
                .attr("x1", gridOrigin[0] + squareSizeX * i)
                .attr("y1", gridOrigin[1] + squareSizeY * i)
                .attr("x2", gridOrigin[0] + squareSizeX * i)
                .attr("y2", gridOrigin[1] + squareSizeY * i - squareSize * maxZ)
                .attr("stroke", gridLineColor)
                .attr("stroke-width", 1);
            
            layerGrid.append('line')
                .attr("x1", gridOrigin[0] + squareSizeX * i)
                .attr("y1", gridOrigin[1] + squareSizeY * i)
                .attr("x2", gridOrigin[0] + squareSizeX * i - squareSizeX * maxX)
                .attr("y2", gridOrigin[1] + squareSizeY * i + squareSizeY * maxX)
                .attr("stroke", gridLineColor)
                .attr("stroke-width", 1);
        }
        
        // x-axis
        layerGrid.append('line')
            .attr("x1", gridOrigin[0])
            .attr("y1", gridOrigin[1])
            .attr("x2", gridOrigin[0] - squareSizeX * maxX)
            .attr("y2", gridOrigin[1] + squareSizeY * maxX)
            .attr("stroke", gridColor)
            .attr("stroke-width", 1);
        
        // y-axis
        layerGrid.append('line')
            .attr("x1", gridOrigin[0])
            .attr("y1", gridOrigin[1])
            .attr("x2", gridOrigin[0] + squareSizeX * maxX)
            .attr("y2", gridOrigin[1] + squareSizeY * maxY)
            .attr("stroke", gridColor)
            .attr("stroke-width", 1);
        
        // z-axis
        layerGrid.append('line')
            .attr("x1", gridOrigin[0])
            .attr("y1", gridOrigin[1])
            .attr("x2", gridOrigin[0])
            .attr("y2", gridOrigin[1] - squareSize * maxZ)
            .attr("stroke", gridColor)
            .attr("stroke-width", 1);
    }
    
    function reorderObjects() {
        objects.sort(function(a, b) {
            if (a.location[2] > b.location[2]) return 1;
            if (a.location[2] < b.location[2]) return -1;
            
            if (a.location[1] > b.location[1]) return 1;
            if (a.location[1] < b.location[1]) return -1;
            
            if (a.location[0] > b.location[0]) return 1;
            if (a.location[0] < b.location[0]) return -1;
            
            return 0;
        });
    }
    
    function selectionXY() {
        d3.selectAll('.gridObject')
            .style('opacity', 0.5);
            
        selectionCoords = [-1, -1, 0];
        
        mainLayer.on('mousemove', function() {
            var cursor = d3.mouse(this);
            var position2d = [];
            var origin = [];

            position2d[0] = Math.floor( ( (cursor[1] - gridOrigin[1]) / squareSizeY - (cursor[0] - gridOrigin[0]) / squareSizeX ) / 2 );
            position2d[1] = Math.floor( ( (cursor[1] - gridOrigin[1]) / squareSizeY + (cursor[0] - gridOrigin[0]) / squareSizeX ) / 2 );
            
            if (selectionCoords[0] != position2d[0] || selectionCoords[1] != position2d[1]) {
                
                d3.selectAll('.gridSelection2D').remove();
                selectionCoords[0] = -1;
                selectionCoords[1] = -1;
                
                if (!(position2d[0] < 0 || position2d[0] >= maxX || position2d[1] < 0 || position2d[1] >= maxY)){
                    selectionCoords[0] = position2d[0];
                    selectionCoords[1] = position2d[1];
                    origin[0] = gridOrigin[0] - (selectionCoords[0] - selectionCoords[1]) * squareSizeX;
                    origin[1] = gridOrigin[1] + (selectionCoords[0] + selectionCoords[1]) * squareSizeY;
                    
                    layerSubGrid.append('polygon')
                        .attr('class', 'gridSelection2D')
                        .attr('fill', 'lightyellow')
                        .attr('points', (gridOrigin[0] - selectionCoords[0] * squareSizeX) + ',' + (gridOrigin[1] + selectionCoords[0] * squareSizeY) + ' ' + origin[0] + ',' + origin[1] + ' ' + (gridOrigin[0] + selectionCoords[1] * squareSizeX) + ',' + (gridOrigin[1] + selectionCoords[1] * squareSizeY) + ' ' + (gridOrigin[0] + (selectionCoords[1] + 1) * squareSizeX) + ',' + (gridOrigin[1] + (selectionCoords[1] + 1) * squareSizeY) + ' ' + (gridOrigin[0] - (selectionCoords[0] - selectionCoords[1]) * squareSizeX) + ',' + (gridOrigin[1] + (selectionCoords[0] + 1 + selectionCoords[1] + 1) * squareSizeY) + ' ' + (gridOrigin[0] - (selectionCoords[0] + 1) * squareSizeX) + ',' + (gridOrigin[1] + (selectionCoords[0] + 1) * squareSizeY));
                    
                    layerSubGrid.append('polygon')
                        .attr('class', 'gridSelection2D')
                        .attr('fill', 'yellow')
                        .attr('points', origin[0] + ',' + origin[1] + ' ' + (origin[0] + squareSizeX) + ',' + (origin[1] + squareSizeY) + ' ' + origin[0] + ',' + (origin[1] + 2 * squareSizeY) + ' ' + (origin[0] - squareSizeX) + ',' + (origin[1] + squareSizeY));
                }
            }
        })
        .on('mouseleave', function() {
            d3.selectAll('.gridSelection2D').remove();
            selectionCoords[0] = -1;
            selectionCoords[1] = -1;
        })
        .on('mousedown', function() {
            mainLayer.on('mousemove', null);
            mainLayer.on('mousedown', null);
            mainLayer.on('mouseleave', null);
                
            d3.selectAll('.gridSelection2D').remove();
            
            selectionZ();
        });
    }
    
    function selectionZ() {
        var positionZ;
        
        var origin = [];
        
        origin[0] = gridOrigin[0] - (selectionCoords[0] - selectionCoords[1]) * squareSizeX;
        origin[1] = gridOrigin[1] + (selectionCoords[0] + 1 + selectionCoords[1] + 1) * squareSizeY;
        
        /*
        layerSubGrid.append('polygon')
            .attr('class', 'gridSelectionZ')
            .attr('fill', 'lightyellow')
            .attr('points', origin[0] + ',' + origin[1] + ' ' + (origin[0] + squareSizeX) + ',' + (origin[1] - squareSizeY) + ' ' + (origin[0] + squareSizeX) + ',' + (origin[1] - squareSizeY - maxZ * squareSize) + ' ' + origin[0] + ',' + (origin[1] - 2 * squareSizeY - maxZ * squareSize) + ' ' + (origin[0] - squareSizeX) + ',' + (origin[1] - squareSizeY - maxZ * squareSize) + ' ' + (origin[0] - squareSizeX) + ',' + (origin[1] - squareSizeY));
        */
        
        function showZSelection() {
            var cursor = d3.mouse(this);
            var selectedY, originY, offsetY;
            
            selectedY = Math.floor((origin[1] - cursor[1]) / squareSize);
            originY = gridOrigin[1] + (selectionCoords[0] + selectionCoords[1]) * squareSizeY - selectedY * squareSize;
            offsetY = selectedY * squareSize;
            
            if (selectionCoords[2] != selectedY) {
                
                d3.selectAll('.gridSelectionZCell').remove();
                selectionCoords[2] = -1;
                
                if (selectedY >= 0 && selectedY < maxZ) {
                    selectionCoords[2] = selectedY;
                    
                    layerSubGrid.append('polygon')
                        .attr('class', 'gridSelectionZCell')
                        .attr('fill', 'lightyellow')
                        .attr('points', (gridOrigin[0] + (selectionCoords[1] + 1) * squareSizeX) + ',' + (gridOrigin[1] + (selectionCoords[1] + 1) * squareSizeY - offsetY) + ' ' + (gridOrigin[0] - (selectionCoords[0] - selectionCoords[1]) * squareSizeX) + ',' + (gridOrigin[1] + (selectionCoords[0] + 1 + selectionCoords[1] + 1) * squareSizeY - offsetY) + ' ' + (gridOrigin[0] - (selectionCoords[0] + 1) * squareSizeX) + ',' + (gridOrigin[1] + (selectionCoords[0] + 1) * squareSizeY - offsetY) + ' ' + gridOrigin[0] + ',' + (gridOrigin[1] - offsetY));
                    
                    layerOverlay.append('polygon')
                        .attr('fill', 'yellow')
                        .attr('class', 'gridSelectionZCell')
                        .attr('points', (origin[0] - squareSizeX) + ',' + (originY + squareSizeY - squareSize) + ' ' + origin[0] + ',' + (originY -  squareSize) + ' ' + (origin[0] + squareSizeX) + ',' + (originY + squareSizeY - squareSize) + ' ' + (origin[0] + squareSizeX) + ',' + (originY + squareSizeY) + ' ' + origin[0] + ',' + (originY + 2 * squareSizeY) + ' ' + (origin[0] - squareSizeX) + ',' + (originY + squareSizeY));
                    
                    layerOverlay.append('path')
                        .attr('fill', 'none')
                        .attr('class', 'gridSelectionZCell')
                        .attr("stroke", '#888')
                        .attr("stroke-width", 1)
                        .attr('stroke-linejoin', 'round')
                        .attr('d', 'M' + (origin[0] - squareSizeX) + ',' + (originY + squareSizeY - squareSize) + ' L' + origin[0] + ',' + (originY - squareSize) + ' L' + (origin[0] + squareSizeX) + ',' + (originY + squareSizeY - squareSize) + ' L' + origin[0] + ',' + (originY + 2 * squareSizeY - squareSize) + ' L' + (origin[0] - squareSizeX) + ',' + (originY + squareSizeY - squareSize) + ' L' + (origin[0] - squareSizeX) + ',' + (originY + squareSizeY) + ' L' + origin[0] + ',' + (originY + 2 * squareSizeY) + ' L' + origin[0] + ',' + (originY + 2 * squareSizeY - squareSize) + ' L' + origin[0] + ',' + (originY + 2 * squareSizeY) + ' L' + (origin[0] + squareSizeX) + ',' + (originY + squareSizeY) + ' L' + (origin[0] + squareSizeX) + ',' + (originY + squareSizeY - squareSize));
                }
            }
        }
        
        mainLayer
        .on('mousemove', showZSelection)
        .on('mouseleave', function() {
            d3.selectAll('.gridSelectionZCell').remove();
            selectionCoords[2] = -1;
        })
        .on('mousedown', function() {
            var node;
            
            mainLayer.on('mousemove', null);
            mainLayer.on('mousedown', null);
            mainLayer.on('mouseleave', null);
                
            d3.selectAll('.gridSelectionZ').remove();
            d3.selectAll('.gridSelectionZCell').remove();

            d3.selectAll('.gridObject')
                .style('opacity', 1);
            
            grid.trigger('selectionDone', selectionCoords);
        });
        
        mainLayer.dispatch('mousemove');
    }
    
    function drawObjects() {
        var list = layerObjects.selectAll('.gridObject')
            .data(objects, function(d) { return d.id });
            
        list.enter()
            .append('g')
            .attr('class', 'gridObject')
            .merge(list)
            .each(function(d) {
                d.draw(d3.select(this), gridOrigin, squareSize, squareSizeX, squareSizeY, maxX, maxY, maxZ);
            });
        
        list.exit()
            .remove()
            .order();
    }
    
    grid.startSelection = function() {
        selectionXY();
        
        return grid;
    };
    
    grid.stopSelection = function() {
        mainLayer.on('mousemove', null);
        mainLayer.on('mousedown', null);
        mainLayer.on('mouseleave', null);
            
        d3.selectAll('.gridSelection2D').remove();
        
        d3.selectAll('.gridSelectionZ').remove();
        d3.selectAll('.gridSelectionZCell').remove();

        d3.selectAll('.gridObject')
            .style('opacity', 1);
        
        return grid;
    };
    
    grid.size = function(size) {
        if (arguments.length == 0) {
            return gridSize;
        }
        
        gridSize = size;
        
        svg
            .attr('width', gridSize[0])
            .attr('height', gridSize[1]);
        
        return grid;
    };
    
    grid.addObject = function(obj) {
        obj.id = idCount++;
        objects.push(obj);
        reorderObjects();
        
        drawObjects();
        
        return grid;
    };
    
    grid.removeObject = function(index) {
        if (index >= 0 && index < objects.length) {
            objects.splice(index, 1);
            
            drawObjects();
        }
        
        return grid;
    };
    
    grid.numberOfObjects = function() {
        return objects.length;
    };
    
    grid.getObject = function(index) {
        if (index >= 0 && index < objects.length) {
            return objects[index];
        } else {
            return null;
        }
    };
    
    grid.indexOfObject = function(id) {
        for (var i=0; i<objects.length; i++) {
            if (objects[i].id === id) {
                return i;
            }
        }
        
        return -1;
    };
    
    grid.redrawObjects = function() {
        reorderObjects();
        drawObjects();
        
        return grid;
    };
    
    grid.redrawObject = function(index) {
        if (index >= 0 && index < objects.length) {
            objects[index].draw(layerObjects, gridOrigin, squareSize, squareSizeX, squareSizeY, maxX, maxY, maxZ);
        }
        
        return grid;
    };
    
    grid.highlightObject = function(index) {
        var origin = [];
        
        grid.removeHighlight();
        
        if (index >= 0 && index < objects.length) {
            origin[0] = gridOrigin[0] - (objects[index].location[0]- objects[index].location[1]) * squareSizeX;
            origin[1] = gridOrigin[1] + (objects[index].location[0] + 1 + objects[index].location[1] + 1) * squareSizeY;
                    
            // bottom
            layerSubGrid.append('polygon')
                .attr('class', 'gridObjectHighlight')
                .attr('fill', 'lightyellow')
                .attr('points', origin[0] + ',' + origin[1] + ' ' + (origin[0] + squareSizeX * objects[index].size[0]) + ',' + (origin[1] - squareSizeY * objects[index].size[0]) + ' ' + (origin[0] + (objects[index].size[0] - objects[index].size[1]) * squareSizeX) + ',' + (origin[1] - (objects[index].size[1] + objects[index].size[0]) * squareSizeY) + ' ' + (origin[0] - squareSizeX * objects[index].size[1]) + ',' + (origin[1] - squareSizeY * objects[index].size[1]));
                    
            // left
            layerSubGrid.append('polygon')
                .attr('class', 'gridObjectHighlight')
                .attr('fill', 'lightyellow')
                .attr('points', (origin[0] - (objects[index].location[1] + 1) * squareSizeX) + ',' + (origin[1] - (objects[index].location[1] + 1) * squareSizeY - objects[index].location[2] * squareSize) + ' ' + (origin[0] - (objects[index].location[1] + 1) * squareSizeX) + ',' + (origin[1] - (objects[index].location[1] + 1) * squareSizeY - objects[index].location[2] * squareSize - squareSize * objects[index].size[2]) + ' ' + (origin[0] - (objects[index].location[1] + 1) * squareSizeX + objects[index].size[0] * squareSizeX) + ',' + (origin[1] - (objects[index].location[1] + 1) * squareSizeY - objects[index].location[2] * squareSize - squareSize * objects[index].size[2] - objects[index].size[0] * squareSizeY)  + ' ' + (origin[0] - (objects[index].location[1] + 1) * squareSizeX + objects[index].size[0] * squareSizeX) + ',' + (origin[1] - (objects[index].location[1] + 1) * squareSizeY - objects[index].location[2] * squareSize - objects[index].size[0] * squareSizeY));
            
            // right
            layerSubGrid.append('polygon')
                .attr('class', 'gridObjectHighlight')
                .attr('fill', 'lightyellow')
                .attr('points', (origin[0] + (objects[index].location[0] + 1) * squareSizeX) + ',' + (origin[1] - (objects[index].location[0] + 1) * squareSizeY - objects[index].location[2] * squareSize) + ' ' + (origin[0] + (objects[index].location[0] + 1) * squareSizeX) + ',' + (origin[1] - (objects[index].location[0] + 1) * squareSizeY - objects[index].location[2] * squareSize - squareSize * objects[index].size[2]) + ' ' + (origin[0] + (objects[index].location[0] + 1) * squareSizeX - objects[index].size[1] * squareSizeX) + ',' + (origin[1] - (objects[index].location[0] + 1) * squareSizeY - objects[index].location[2] * squareSize - squareSize * objects[index].size[2] - objects[index].size[1] * squareSizeY) + ' ' + (origin[0] + (objects[index].location[0] + 1) * squareSizeX - objects[index].size[1] * squareSizeX) + ',' + (origin[1] - (objects[index].location[0] + 1) * squareSizeY - objects[index].location[2] * squareSize - objects[index].size[1] * squareSizeY));
        }
        
        return grid;
    };
    
    grid.removeHighlight = function() {
        d3.selectAll('.gridObjectHighlight').remove();
    };
    
    grid.load = function(data) {
        return grid;
    };
    
    grid.save = function() {
        var jsonText;
        
        
        
        return jsonText;
    };
    
    init();
    
    return grid;
};

GridMapIso.Object = function() {
    var obj = GridMapIso.Class();
    
    obj.id = -1;
    obj.location = [0, 0, 0];
    obj.size = [1, 1, 1];
    
    obj.draw = function() {
        // empty virtual function
    };
    
    obj.getDOMId = function() {
        return 'gridObject' + obj.id;
    };
    
    return obj;
};

GridMapIso.ObjectBlock = function() {
    var obj = new GridMapIso.Object();
    
    obj.color = 'blue';
    obj.lineColor = '#888';
    
    obj.draw = function(container, gridOrigin, squareSize, squareSizeX, squareSizeY, maxX, maxY, maxZ) {
        var origin = [];
        var objGroup, objShape, objOutline;
        
        objGroup = d3.select('#gridObject' + obj.id);
        if (objGroup.empty()) {
            objGroup = container.append('g')
                .attr('id', 'gridObject' + obj.id);
        } else {
            objGroup.selectAll('*').remove();
        }
        
        for (var x=obj.size[0]-1; x>=0; x--) {
            for (var y=obj.size[1]-1; y>=0; y--) {
                for (var z=0; z<obj.size[2]; z++) {
                    if (obj.location[0] - x < 0 || obj.location[1] - y < 0 || obj.location[2] + z >= maxZ) continue;
                    
                    origin[0] = gridOrigin[0] - (obj.location[0] - x - obj.location[1] + y) * squareSizeX;
                    origin[1] = gridOrigin[1] + (obj.location[0] - x + obj.location[1] - y) * squareSizeY - (obj.location[2] + z) * squareSize;
                    
                    objGroup.append('polygon')
                        .attr('fill', obj.color)
                        .attr('points', (origin[0] - squareSizeX) + ',' + (origin[1] + squareSizeY - squareSize) + ' ' + origin[0] + ',' + (origin[1] -  squareSize) + ' ' + (origin[0] + squareSizeX) + ',' + (origin[1] + squareSizeY - squareSize) + ' ' + (origin[0] + squareSizeX) + ',' + (origin[1] + squareSizeY) + ' ' + origin[0] + ',' + (origin[1] + 2 * squareSizeY) + ' ' + (origin[0] - squareSizeX) + ',' + (origin[1] + squareSizeY));
                        
                    objGroup.append('path')
                        .attr('fill', 'none')
                        .attr("stroke", obj.lineColor)
                        .attr("stroke-width", 1)
                        .attr('stroke-linejoin', 'round')
                        .attr('d', 'M' + (origin[0] - squareSizeX) + ',' + (origin[1] + squareSizeY - squareSize) + ' L' + origin[0] + ',' + (origin[1] - squareSize) + ' L' + (origin[0] + squareSizeX) + ',' + (origin[1] + squareSizeY - squareSize) + ' L' + origin[0] + ',' + (origin[1] + 2 * squareSizeY - squareSize) + ' L' + (origin[0] - squareSizeX) + ',' + (origin[1] + squareSizeY - squareSize) + ' L' + (origin[0] - squareSizeX) + ',' + (origin[1] + squareSizeY) + ' L' + origin[0] + ',' + (origin[1] + 2 * squareSizeY) + ' L' + origin[0] + ',' + (origin[1] + 2 * squareSizeY - squareSize) + ' L' + origin[0] + ',' + (origin[1] + 2 * squareSizeY) + ' L' + (origin[0] + squareSizeX) + ',' + (origin[1] + squareSizeY) + ' L' + (origin[0] + squareSizeX) + ',' + (origin[1] + squareSizeY - squareSize));
                }
            }
        }
        
        return obj;
    };
    
    return obj;
};

GridMapIso.ObjectImage = function() {
    var obj = new GridMapIso.Object();
    
    obj.image;
    
    obj.draw = function(container, gridOrigin, squareSize, squareSizeX, squareSizeY, maxX, maxY, maxZ) {
        var objGroup, objImage;
        var origin = [];
        
        objGroup = d3.select('#gridObject' + obj.id);
        if (objGroup.empty()) {
            objGroup = container.append('g')
                .attr('id', 'gridObject' + obj.id);
            objImage = objGroup.append('image');
        } else {
            objImage = objGroup.select('image');
        }
        
        origin[0] = gridOrigin[0] - (obj.location[0] - obj.location[1]) * squareSizeX;
        origin[1] = gridOrigin[1] + (obj.location[0] + obj.location[1]) * squareSizeY - obj.location[2] * squareSize;
            
        objImage.attr('xlink:href', obj.image)
            .attr('x', origin[0] - squareSizeX * obj.size[0])
            .attr('y', origin[1] - squareSize * obj.size[2] - 2 * squareSizeY * (Math.max(obj.size[0], obj.size[1]) - 1))
            .attr('width', (obj.size[0] + obj.size[1]) * squareSizeX)
            .attr('height', 2 * squareSizeY * (Math.max(obj.size[0], obj.size[1])) + squareSize * obj.size[2]);
            
        return obj;
    };
    
    return obj;
};
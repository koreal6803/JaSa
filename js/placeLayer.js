function PlaceLayer(places , map) {
    var _obj = this;

    var _overlayLayer;

    // _places is updateed by s function
    var _places = places;

    // _projection is generated by google map api
    // to conver lng and lat to x and y
    var _projection;

    // we will use _places to to build nodes and edges
    var _nodes = [];
    var _edges = [];

    // div elements of nodes and edges (visible)
    var _selectionNode;
    var _selectionEdge;

    // when drag event
    var _node_drag;

    var _onClickNode;

    // modify _places according to old place index and new places
    this.updatePlaces = function (oldPlaceIdx, newPlaces) {

        // add newPlaces[i].x and newPlaces[i].y
        convertLatLng(newPlaces);

        var newID = 0;
        for (var i = oldPlaceIdx.length -1 ; i >= 0 ; i--) {
            var removeID = oldPlaceIdx[i];
            if(newID < newPlaces.length)
                _places[removeID] = newPlaces[newID++];
            else
                _places.splice(removeID , 1);
        }
        while (newPlaces.length > newID) {
            _places.push(newPlaces[newID++]);
        }
    };

    this.onClickNode = function (callback) {
      _onClickNode = callback;
    };

    // when initial to map
    this.onAdd = function() {

        _overlayLayer = d3.select(this.getPanes().overlayMouseTarget)
                 .append("div")
                 .attr('class', 'layer')
                 .attr('id','layer');
         createNodes(_nodes);
         createEdges(_edges);

        // setting force layout
        this.force = d3.layout.force()
            .gravity(0)
            .charge(-20)
            .nodes(_nodes)
            .links(_edges)
            .size([this.getPanes().overlayLayer.scrollWidth, this.getPanes().overlayLayer.scrollHeight])
            .linkDistance(this.getPanes().overlayLayer.scrollWidth/10);

        // setup google map undraggable or draggable depending on overlayLayer event
        google.maps.event.addDomListener(_overlayLayer[0][0], 'click', function(e) {
            console.log('click');
        });
        google.maps.event.addDomListener(_overlayLayer[0][0], 'mouseup', function() {
            console.log("mouseup");
            map.set('draggable',true);
        });
        google.maps.event.addDomListener(_overlayLayer[0][0], 'mousedown', function() {
            map.set('draggable',false);
            console.log("mousedown");
        });
        google.maps.event.addDomListener(_overlayLayer[0][0], 'mouseover', function() {
            console.log("mouseover");
        });
    };

    // google map api will call this function when initial and zooming
    this.draw = function () {
        // projection is used for convert lat and lng to x and y, respectively
        _projection = this.getProjection();

        // convert lat and lng of a position to x and y using projection
        convertLatLng(_places);

        this.force.stop();
        
        // reset the link Distance because some nodes are too close when zoom out
        var zoomLevel = map.getZoom();
        console.log(zoomLevel);

        // conver each data to divs (div is an visual object)
        this.updateLayout();

        // start force direct
        this.force.start();

        // setting force layout for tick event (animation)
        var drawCnt = 0;
        this.force.on('tick', function(e) {

            // prevent overlaped nodes
            var q = d3.geom.quadtree(_nodes),
              i = 0,
              n = _nodes.length;

            for(var i = _places.length; i < _nodes.length ; i++) {
                q.visit(collide(_nodes[i]));
            }

            // redering nodes
            if(drawCnt++%3 === 0) { // reduce frame-rate
                _selectionNode.each(nodeTransition);
                _selectionEdge.each(edgeTransition);
            }
        });
    };

    // redraw the nodes and edges
    this.updateLayout = function () {
        createNodes(_nodes);
        createEdges(_edges);

        // update exist edges
        _selectionEdge = _overlayLayer
            .selectAll('.edge')
            .data(_edges)
            .attr('class', 'edge')
            .each(edgeTransition);

        // add new edges
        _selectionEdge.enter()
            .append("div")
            .attr('class', 'edge')
            .each(edgeTransition);

        // update exist nodes
        _selectionNode = _overlayLayer
            .selectAll('.node')
            .data(_nodes)
            .attr('class', 'node')
            .each(nodeInitialTransition)
            .call(this.force.drag());

        // add new nodes
        _selectionNode.enter()
            .append("div")
            .attr('class', 'node')
            .each(nodeInitialTransition)
            .call(this.force.drag())
            .on("click", function (d) {_onClickNode(d);});


        // remove redundant edges
        _selectionEdge.exit().remove();
        _selectionNode.exit().remove();
    }

    // add x and y to datas according to lng and lat
    var convertLatLng = function(datas) {
        // build _data[i].x and _data[i].y for each _data
        for(var i in datas){

            // fixed circles
            datas[i].fixed = true;
            if(datas[i].info.rating === undefined)
                datas[i].radius = 10;
            else
                datas[i].radius = (datas[i].info.rating-3) * 50 + 10;
            if(datas[i].radius < 10)
                datas[i].radius = 10;
            var p = new google.maps.LatLng(datas[i].lng, datas[i].lat);
            p = _projection.fromLatLngToDivPixel(p);
            datas[i].x = p.x;
            datas[i].y = p.y;
        }
    };

    // initial a node not only apperant but also position
    var nodeInitialTransition = function(d) {
        var div = d3.select(this)

        // div style (circle)
        div.style('width'      , (d.radius * 2) + 'px' )
           .style('height'     , (d.radius * 2) + 'px' )
           .style('margin-left', ' -' + d.radius + 'px' )
           .style('margin-top' , ' -' + d.radius + 'px' )
           .style('background' , d.color )
           .style("left", d.x + "px")
           .style("top",  d.y + "px");


        // open information
        var open;
        if(d.info.opening_hours === undefined)
            open = '開店時間未知';
        else if(d.info.opening_hours.open_now)
            open = '營業中';
        else
            open = '休息中';
//.style("text-anchor", "middle")
        // if the node is big node, then append some infomation
        if(d.fixed === false)
           div.html('<p style="text-align:center;line-height:50px;margin-top:'+(d.radius/2)+'px;padding-top:0;word-break: normal;width:'+(d.radius*2)+'px">'+ d.info.name + '</p>');
        else
            div.html('');


        if(d.fixed === false) {
            var plusx = Number(d.x) + Number(-5);
            var plusy = Number(d.y) + Number(-5);
            div.style("left" , plusx + "px")
               .style("right" , plusy + "px");
        }


        return div;
    }

    // move a node
    var nodeTransition = function (d) {
        return d3.select(this)
            .style("left", d.x + "px")
            .style("top",  d.y + "px");
    }

    // move an edge
    var edgeTransition = function (d) {
        var ax = d.source.x;
        var ay = d.source.y;
        var bx = d.target.x;
        var by = d.target.y;
        var dx = bx - ax;
        var dy = by - ay;

        var deg = (dx)? Math.atan(dy/dx)
                 :(dy > 0)? Math.PI/2 : -Math.PI/2;

        if(dx < 0)
            deg = Math.PI + deg;

        deg = deg*180/Math.PI;

        //calc = 0;
        var length=Math.sqrt((ax-bx)*(ax-bx)+(ay-by)*(ay-by));

        return d3.select(this)
                .style("width" , length + "px")
                .style("top" , ay + "px")
                .style("left" , ax + "px")
                .style("transform",     "rotate(" + deg + "deg)")
                .style("transform-origin",         "0% 0%")
                .style("-ms-transform", "rotate(" + deg + "deg)")
                .style("-moz-transform", "rotate(" + deg + "deg)")
                .style("-moz-transform-origin",    "0% 0%")
                .style("-webkit-transform", "rotate(" + deg + "deg)")
                .style("-webkit-transform-origin", "0% 0%")
                .style("-o-transform", "rotate(" + deg + "deg)")
                .style("-o-transform-origin",      "0% 0%");
    }

    // use _places to build nodes (both big and small)
    var createNodes = function (ret) {
        ret.length = 0;
        for (var i in _places) {
            ret.push(clone(_places[i]));
            ret[ret.length - 1].fixed = true;
            ret[ret.length - 1].radius = 5;
            ret[ret.length - 1].color = 'rgba(127, 63, 191, 1)';
        }
        for (var i in _places) {
            ret.push(clone(_places[i]));
            ret[ret.length - 1].fixed = false;
            ret[ret.length - 1].color = color();
        }
    }

    // use _places to build edges
    var createEdges = function (ret) {
        ret.length = 0;
        var size = _places.length;
        for (var i in _places) {
            var source = Number(i)+Number(size);
            ret.push({ "target" : Number(i) ,
                       "source" : source});
        }
    }

    // prevent overlap nodes
    function collide(node) {
      var r = node.radius + 16,
          nx1 = node.x - r,
          nx2 = node.x + r,
          ny1 = node.y - r,
          ny2 = node.y + r;
      return function(quad, x1, y1, x2, y2) {
        if (quad.point && (quad.point !== node)) {
          var x = node.x - quad.point.x,
              y = node.y - quad.point.y,
              l = Math.sqrt(x * x + y * y),
              r = node.radius + quad.point.radius;
          if (l < r) {
            l = (l - r) / l * .2;
            node.x -= x *= l;
            node.y -= y *= l;
            quad.point.x += x;
            quad.point.y += y;
          }
        }
        return x1 > nx2 || x2 < nx1 || y1 > ny2 || y2 < ny1;
      };
    }

    // instead of pointer assignment, this function can clone an object
    function clone(obj) {
        var copy;

        // Handle the 3 simple types, and null or undefined
        if (null == obj || "object" != typeof obj) return obj;

        // Handle Date
        if (obj instanceof Date) {
            copy = new Date();
            copy.setTime(obj.getTime());
            return copy;
        }

        // Handle Array
        if (obj instanceof Array) {
            copy = [];
            for (var i = 0, len = obj.length; i < len; i++) {
                copy[i] = clone(obj[i]);
            }
            return copy;
        }

        // Handle Object
        if (obj instanceof Object) {
            copy = {};
            for (var attr in obj) {
                if (obj.hasOwnProperty(attr)) copy[attr] = clone(obj[attr]);
            }
            return copy;
        }

        throw new Error("Unable to copy obj! Its type isn't supported.");
    };

    function dragstart (d, i) {
        _obj.force.stop(); // stops the force auto positioning before you start dragging
    };

    function dragmove (d, i) {
        d.px += d3.event.dx;
        d.py += d3.event.dy;
        d.x += d3.event.dx;
        d.y += d3.event.dy;
        _obj.updateLayout() // this is the key to make it work together with updating both px,py,x,y on d !
    };

    function dragend (d, i) {
        d.fixed = true; // of course set the node to fixed so the force doesn't include the node in its auto positioning stuff
        _obj.updateLayout();
        _obj.force.resume();
    }
    function color () {
        var alpha = 0.9;
        var beautifulColor = ["FF0066","E5FF00","00FF99","1900FF"];
        
        return "#"+beautifulColor[Math.floor((Math.random() * 4) + 0)];
    }
}

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

    var _popularUnit = 5;

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
            .linkDistance(this.getPanes().overlayLayer.scrollWidth/15);

        // setting force layout for tick event (animation)
        var drawCnt = 0;
        var framerate = (mobileAndTabletcheck())?10:3;
        this.force.on('tick', function(e) {

            // prevent overlaped nodes
            var q = d3.geom.quadtree(_nodes),
              i = 0,
              n = _nodes.length;

            for(var i = _places.length; i < _nodes.length ; i++) {
                q.visit(collide(_nodes[i]));
            }

            // redering nodes
            if(drawCnt++%framerate === 0) { // reduce frame-rate
                _selectionNode.each(nodeTransition);
                _selectionEdge.each(edgeTransition);
            }
        });

        // setup google map undraggable or draggable depending on overlayLayer event
        google.maps.event.addDomListener(_overlayLayer[0][0], 'click', function(e) {
            //console.log('click');
        });
        google.maps.event.addDomListener(_overlayLayer[0][0], 'mouseup', function() {
            //console.log("mouseup");
            map.set('draggable',true);
        });
        google.maps.event.addDomListener(_overlayLayer[0][0], 'mousedown', function() {
            map.set('draggable',false);
        });
        google.maps.event.addDomListener(_overlayLayer[0][0], 'mouseover', function() {
            //console.log("mouseover");
        });
    };

    // google map api will call this function when initial and zooming
    this.draw = function () {
        // projection is used for convert lat and lng to x and y, respectively
        //console.log('draw');
        _overlayLayer.style("visibility", 'hidden');
        _projection = this.getProjection();

        // convert lat and lng of a position to x and y using projection
        convertLatLng(_places);
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

        var startX,startY,absLength;
        var dragEvent = this.force.drag()
            .on("dragstart", function(d,i){
                startX=d.x;
                startY=d.y;
                //console.log("dragstart startX="+d.x);
                //console.log("dragstart startY="+d.y);                
            })
            .on("drag", function(d) {
                absLength=(Math.abs(d.x-startX)+Math.abs(d.y-startY));

                if(d.x>d3.select("#dislikeDIV").node().getBoundingClientRect().width)
                {
                    d3.select("#likeIMG").style("animation-play-state","running"); 
                    d3.select("#dislikeIMG").style("animation-play-state","paused");
                    d3.select("#likeDIV").style("opacity","1");
                    d3.select("#dislikeDIV").style("opacity","0.7");
                }
                else 
                {
                    d3.select("#likeIMG").style("animation-play-state","paused"); 
                    d3.select("#dislikeIMG").style("animation-play-state","running");
                    d3.select("#likeDIV").style("opacity","0.7");
                    d3.select("#dislikeDIV").style("opacity","1");
                }                
                if(absLength>300){
                    //console.log("drag="+d.x);
                    //console.log("drag="+d.y);  
                    d3.select("#likeDIV").style("visibility","visible");  
                    d3.select("#dislikeDIV").style("visibility","visible");

                }
                else{
                    //console.log("startX="+startX);
                    //console.log("startY="+startY);
                    //console.log("d.x="+d.x);
                    //console.log("d.x="+d.y);
                    //console.log("hidden absLength ="+absLength);
                    d3.select("#likeDIV").style("visibility","hidden");  
                    d3.select("#dislikeDIV").style("visibility","hidden");
                }

            })
            .on("dragend", function(d) {
                absLength=(Math.abs(d.x-startX)+Math.abs(d.y-startY));

                d3.select("#likeDIV").style("visibility","hidden");  
                d3.select("#dislikeDIV").style("visibility","hidden");

                var parseOperation = new ParseOperation();
                //console.log(login);
                if(absLength>300 && d.x>d3.select("#dislikeDIV").node().getBoundingClientRect().width && login === true)
                {

                    //console.log("like="+d.x);
                    //console.log("like="+d.y);
                    if (user_object.get(d.place_id) === undefined) {

                        console.log("decide to like");
                        user_object.set(d.place_id,"like");
                        user_object.save();
                        parseOperation.setPopular(d.place_id, 1);  
                        for (var i in _places ) {
                            if (d.place_id === _places[i].place_id) {
                                _places[i].radius += _popularUnit;
                                _obj.updateLayout();
                                _obj.force.start();
                                break;
                            }
                        }
                    } else if (user_object.get(d.place_id) === "dislike") {
                        console.log("decide to like from dislike");
                        user_object.set(d.place_id,"like");
                        user_object.save();
                        parseOperation.setPopular(d.place_id, 1);  
                        parseOperation.setPopular(d.place_id, 1);
                        for (var i in _places ) {
                            if (d.place_id === _places[i].place_id) {
                                _places[i].radius += _popularUnit * 2;
                                _obj.updateLayout();
                                _obj.force.start();
                                break;
                            }
                        }
                    }
                }
                else if(absLength>300 && login === true)
                {

                    //console.log(likeDIV);
                    //console.log(dislikeDIV);
                    ////console.log("dislike="+d.x);
                    console.log("dislike="+d.y);
                    if (user_object.get(d.place_id) === undefined) {
                        console.log("decide to dislike")
                        user_object.set(d.place_id,"dislike");
                        user_object.save();
                        parseOperation.setPopular(d.place_id, 2);  
                        for (var i in _places ) {
                            if (d.place_id === _places[i].place_id) {
                                _places[i].radius -= _popularUnit;
                                _obj.updateLayout();
                                _obj.force.start();
                                break;
                            }
                        }
                    } else if (user_object.get(d.place_id) === "like") {
                        console.log("decide to dislike from like")
                        user_object.set(d.place_id,"dislike");
                        user_object.save();
                        parseOperation.setPopular(d.place_id, 2);  
                        parseOperation.setPopular(d.place_id, 2);
                        for (var i in _places ) {
                            if (d.place_id === _places[i].place_id) {
                                _places[i].radius -= _popularUnit * 2;
                                _obj.updateLayout();
                                _obj.force.start();
                                break;
                            }
                        }
                    }
                }
                map.set('draggable',true);
            });

        // add new nodes

        _selectionNode.enter()
            .append("div")
            .attr('class', 'node')
            .each(nodeInitialTransition)
            .call(dragEvent)
            .on("mouseover",function(d){
                d3.select(this).transition()
                   .ease('cubic-in')
                   .style('width'      , (d.radius *3) + 'px' )
                   .style('height'     ,  (d.radius *3) + 'px' )
                   .style('margin-left', ' -' + d.radius*1.5 + 'px' )
                   .style('margin-top' , ' -' + d.radius*1.5 + 'px' )
            })
            .on("mouseout",function(d){
                d3.select(this).transition()
                   .ease('cubic-out')
                   .style('width'      , (d.radius*2) + 'px' )
                   .style('height'     , (d.radius*2) + 'px' )
                   .style('margin-left', ' -' + d.radius + 'px' )
                   .style('margin-top' , ' -' + d.radius + 'px' )
            })
            .on("click", function (d) {
                if (d3.event.defaultPrevented) return;
                
                    _onClickNode(d);
            })

            // .on("drag", function(d,i) {
            //     var t = d3.select(this);
            //     //turn {x: t.attr("x"), y: t.attr("y")};
            //     console.log(t.attr("x"));
            //     console.log(d.attr("y"));  
            // });




        // remove redundant edges
        _selectionEdge.exit().remove();
        _selectionNode.exit().remove();
    }


    // add x and y to datas according to lng and lat
    var convertLatLng = function(datas) {
        // build _data[i].x and _data[i].y for each _data
        var parseOperation = new ParseOperation();
        for(var i in datas){

            // fixed circles
            datas[i].fixed = true;
            datas[i].radius = 10;
            datas[i].color = color();

            if(datas[i].radius < 10)
                datas[i].radius = 10;
            var p = new google.maps.LatLng(datas[i].lng, datas[i].lat);
            p = _projection.fromLatLngToDivPixel(p);
            datas[i].x = p.x;
            datas[i].y = p.y;
        }
        var cnt = datas.length;
        for(var i in datas) {
            parseOperation.getPopular(datas[i] , function(popular , data) {
                if(data.info.rating)
                    data.radius = (data.info.rating-3)*50 + popular * _popularUnit + 10;
                else
                    data.radius = popular * _popularUnit + 10;

                if(mobileAndTabletcheck()) {
                    data.radius /= 2;
                }
                    
                if(data.radius < 10)
                    data.radius = 10;
                console.log(data);
                console.log("get name: " + data.info.name + "get popular: " + data.radius);

                cnt--;
                console.log("cnt "+cnt);

                if(cnt === 0) {
                    _obj.force.stop();
                    _obj.updateLayout();
                    _obj.force.start();
                    _overlayLayer.style('visibility','visible');
                }
            });
        }
    };

    // initial a node not only apperant but also position
    var nodeInitialTransition = function(d) {
        var div = d3.select(this);

        // div style (circle)
        div.style('width'      , (d.radius * 2) + 'px' )
           .style('height'     , (d.radius * 2) + 'px' )
           .style('margin-left', ' -' + d.radius + 'px' )
           .style('margin-top' , ' -' + d.radius + 'px' )
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
        div.html("");
        if(d.fixed === false){
            div.append("div")
                            .attr("class","node__inner")
                            .append("div")
                            .attr("class","node__wrapper")
                            .append("div")
                            .attr("class","node__content")
                            .html(d.info.name);
        }

        div.append("div").attr("class","node__circle")
           .style('background' , d.color );


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
            ret[ret.length - 1].color = 'rgba(0,0,0,0.6)';
        }
        for (var i in _places) {
            ret.push(clone(_places[i]));
            ret[ret.length - 1].fixed = false;
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


    function color () {
        var alpha = 0.9;
        var beautifulColor = ["rgba(11, 221, 24,0.9)","rgba(29, 98, 240 , 0.9)","rgba(255, 42, 104, 0.9)","rgba(255,205,2,0.9)"];
        
        return beautifulColor[Math.floor((Math.random() * 4) + 0)];
    }
    function mobileAndTabletcheck () {
          var check = false;
            (function(a){if(/(android|bb\d+|meego).+mobile|avantgo|bada\/|blackberry|blazer|compal|elaine|fennec|hiptop|iemobile|ip(hone|od)|iris|kindle|lge |maemo|midp|mmp|mobile.+firefox|netfront|opera m(ob|in)i|palm( os)?|phone|p(ixi|re)\/|plucker|pocket|psp|series(4|6)0|symbian|treo|up\.(browser|link)|vodafone|wap|windows ce|xda|xiino|android|ipad|playbook|silk/i.test(a)||/1207|6310|6590|3gso|4thp|50[1-6]i|770s|802s|a wa|abac|ac(er|oo|s\-)|ai(ko|rn)|al(av|ca|co)|amoi|an(ex|ny|yw)|aptu|ar(ch|go)|as(te|us)|attw|au(di|\-m|r |s )|avan|be(ck|ll|nq)|bi(lb|rd)|bl(ac|az)|br(e|v)w|bumb|bw\-(n|u)|c55\/|capi|ccwa|cdm\-|cell|chtm|cldc|cmd\-|co(mp|nd)|craw|da(it|ll|ng)|dbte|dc\-s|devi|dica|dmob|do(c|p)o|ds(12|\-d)|el(49|ai)|em(l2|ul)|er(ic|k0)|esl8|ez([4-7]0|os|wa|ze)|fetc|fly(\-|_)|g1 u|g560|gene|gf\-5|g\-mo|go(\.w|od)|gr(ad|un)|haie|hcit|hd\-(m|p|t)|hei\-|hi(pt|ta)|hp( i|ip)|hs\-c|ht(c(\-| |_|a|g|p|s|t)|tp)|hu(aw|tc)|i\-(20|go|ma)|i230|iac( |\-|\/)|ibro|idea|ig01|ikom|im1k|inno|ipaq|iris|ja(t|v)a|jbro|jemu|jigs|kddi|keji|kgt( |\/)|klon|kpt |kwc\-|kyo(c|k)|le(no|xi)|lg( g|\/(k|l|u)|50|54|\-[a-w])|libw|lynx|m1\-w|m3ga|m50\/|ma(te|ui|xo)|mc(01|21|ca)|m\-cr|me(rc|ri)|mi(o8|oa|ts)|mmef|mo(01|02|bi|de|do|t(\-| |o|v)|zz)|mt(50|p1|v )|mwbp|mywa|n10[0-2]|n20[2-3]|n30(0|2)|n50(0|2|5)|n7(0(0|1)|10)|ne((c|m)\-|on|tf|wf|wg|wt)|nok(6|i)|nzph|o2im|op(ti|wv)|oran|owg1|p800|pan(a|d|t)|pdxg|pg(13|\-([1-8]|c))|phil|pire|pl(ay|uc)|pn\-2|po(ck|rt|se)|prox|psio|pt\-g|qa\-a|qc(07|12|21|32|60|\-[2-7]|i\-)|qtek|r380|r600|raks|rim9|ro(ve|zo)|s55\/|sa(ge|ma|mm|ms|ny|va)|sc(01|h\-|oo|p\-)|sdk\/|se(c(\-|0|1)|47|mc|nd|ri)|sgh\-|shar|sie(\-|m)|sk\-0|sl(45|id)|sm(al|ar|b3|it|t5)|so(ft|ny)|sp(01|h\-|v\-|v )|sy(01|mb)|t2(18|50)|t6(00|10|18)|ta(gt|lk)|tcl\-|tdg\-|tel(i|m)|tim\-|t\-mo|to(pl|sh)|ts(70|m\-|m3|m5)|tx\-9|up(\.b|g1|si)|utst|v400|v750|veri|vi(rg|te)|vk(40|5[0-3]|\-v)|vm40|voda|vulc|vx(52|53|60|61|70|80|81|83|85|98)|w3c(\-| )|webc|whit|wi(g |nc|nw)|wmlb|wonu|x700|yas\-|your|zeto|zte\-/i.test(a.substr(0,4)))check = true})(navigator.userAgent||navigator.vendor||window.opera);
              return check;
    }
}

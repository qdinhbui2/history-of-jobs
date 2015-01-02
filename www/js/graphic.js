// global vars
var $graphic = null;
var graphicD3 = null;
var pymChild = null;
var container_width;

var ASPECT_HEIGHT = 2;
var ASPECT_WIDTH = 3;
var GRAPHIC_DATA_URL = '/assets/firstjob_d3.csv';
var GRAPHIC_DEFAULT_WIDTH = 600;
var GRAPHIC_GUTTER = 10;
var LABEL_WIDTH = 33;
var MOBILE_THRESHOLD = 500;


var color1,
    color2,
    color3,
    color4,
    color5,
    color6,
    color7,
    color8,
    color9,
    color10;


var COLOR1 = [ '#00C9B6','#35A3A2'] //teal
var COLOR2 = [ '#E27560', '#D8472B'] //red
var COLOR3 = [ '#3D7FA6', '#51AADE', '#7DBFE6'] //blue
var COLOR4 = [ '#FF5332', '#FF8332'] //orange
var COLOR5 = [ '#FF1FC6'] //pink
var COLOR6 = [ '#64BBFF'] // skyblue
var COLOR7 = [ '#BBFFC0'] //pea green
var COLOR8 = [ '#EEFFCE'] // pea yellow
var COLOR9 = [ '#FFEC41'] // lemon yellow
var COLOR10 = [ '#8330FF'] // deep purp

console.log('windowwidth',window.innerWidth)
var domain1,
    domain2,
    area,
    x,
    y,
    stack,
    layers,
    state,
    names,
    ticksY,
    ticksX,
    xaxis,
    xgrid,
    xAxisGrid,
    yAxis,    
    yAxisGrid,
    ygrid,    
    yaxis,
    height;
var graphicData = null;
var isMobile = false;
var graph_status = 'wiggle';
var yAdj = 5;

// D3 formatters
var fmtComma = d3.format(',');
var fmtYearAbbrev = d3.time.format('%y');
var formatPercent = d3.format(".0%");
var fmtYearFull = d3.time.format('%Y');

d3.selection.prototype.moveToFront = function() {
  return this.each(function(){
    this.parentNode.appendChild(this);
   });
};


var onWindowLoaded = function() {
    if (Modernizr.svg) {
        $graphic = $('#graphic');

        d3.csv(GRAPHIC_DATA_URL, function(error, data) {
            graphicData = data;
            graphicData.forEach(function(d) {
                // d['date'] = d3.time.format('%Y').parse(d['year']);
                // delete d['Year'];
            });
            
            pymChild = new pym.Child({
                renderCallback: render
            });
        });
    } else {
        pymChild = new pym.Child({ });
    }
}


function render(container_width) {
    var graphic_width;
    container_width = window.innerWidth; 
    if (!container_width) {
        container_width = GRAPHIC_DEFAULT_WIDTH;
    }

    if (container_width <= MOBILE_THRESHOLD) {
        is_mobile = true;
    } else {
        is_mobile = false;
    }
    
    // clear out existing graphics
    $graphic.empty();

    draw_graph(container_width);

    if (pymChild) {
        pymChild.sendHeightToParent();
    }
}

/*
 * DRAW THE GRAPH
 */
var draw_graph = function(graphicWidth) {

    var margin = { top: 30, right: 100, bottom: 30, left: 100 };            

    var aspectHeight;
    var aspectWidth;
    var graph = d3.select('#graphic');

    // params that depend on the container width 
    if (isMobile) {
        aspectWidth = 4;
        aspectHeight = 3;
        ticksX = 5;
        ticksY = 5;
    } else {
        aspectWidth = 16;
        aspectHeight = 9;
        ticksX = 15;
        ticksY = 10;
    }

    // define chart dimensions
    var width = graphicWidth - margin['left'] - margin['right'];
        height = Math.ceil((graphicWidth * aspectHeight) / aspectWidth) - margin['top'] - margin['bottom'];

        x = d3.time.scale()
        .range([ 0, width ])

        y = d3.scale.linear()
        .range([ height, 0 ]);

    // define axis and grid
    var xAxis = d3.svg.axis()
        .scale(x)
        .orient('bottom')
        .ticks(ticksX)
        .tickFormat(function(d,i) {
            if (isMobile) {
                return '\u2019' + fmtYearAbbrev(d);
            } else {
                return fmtYearFull(d);
            }
        });

    xAxisGrid = function() {
        return xAxis;
    }

    yAxis = d3.svg.axis()
        .orient('left')
        .scale(y)
        .ticks(ticksY);        

    yAxisGrid = function() {
        return yAxis;
    }

    stack = d3.layout.stack()
        .offset(graph_status)
        .order('default')
        .values(function(d) { return d['values']; });    

    var line = d3.svg.line()
        .interpolate("basis")
        .defined(function(d) { return d['y'] != ''; })
        .x(function(d) { return x(d['year']); })
        .y(function(d) { return y(d['y']); });

        area = d3.svg.area()
        .defined(line.defined())
        .x(function(d) { return x(d['year']); })
        .y0(function(d) { return y(d['y0']); })
        .y1(function(d) { return y(d['y0'] + d['y']); });        
    
    names = d3.keys(graphicData[0]).filter(function(key) { return key !== "year"; });

    dataTransform();

    x.domain([d3.time.format('%Y').parse('1850'), d3.time.format('%Y').parse('2013')]);

    // draw the chart
    var svg = graph.append('svg')
		.attr('width', width + margin['left'] + margin['right'])
		.attr('height', height + margin['top'] + margin['bottom'])
        .append('g')
            .attr('transform', 'translate(' + margin['left'] + ',' + margin['top'] + ')');
            
    // x-axis (bottom)
    xaxis = svg.append('g')
        .attr('class', 'x axis')
        .attr('transform', 'translate(0,' + height + ')')
        .call(xAxis);

    // y-axis (left)
    yaxis = svg.append('g')
        .attr('class', 'y axis')
        .call(yAxis); 
 
    // y-axis gridlines
    ygrid = svg.append('g')         
        .attr('class', 'y grid')
        .call(yAxisGrid()
            .tickSize(-width, 0, 0)
            .tickFormat('')
        );
    
    cloneColors();

    layers = svg.append('g')
        .attr("class", "layer-group")
        .selectAll("path")
        .data(formattedData)
      .enter().append("path")
        .attr('class', function(d) { 
            return  'layers ' + major(d.name) + ' ' + classify(d.name)})      
        .attr("d", function(d) { return area(d.values); })
        .style("fill", function(d) { return majorColor(d.name); });
   
    // x-axis gridlines
    xgrid = svg.append('g')
        .attr('class', 'x grid')
        .attr('transform', 'translate(0,' + height + ')')
        .call(xAxisGrid()
            .tickSize(-height, 0, 0)
            .tickFormat('')
        );
    

}

/*
 * HELPER FUNCTIONS
 */
function changeState() {
    graph_status = graph_status == 'wiggle' ? 'expand' : 'wiggle';
    yAdj = graph_status == 'wiggle' ? 5 : 1;

}

function dataTransform() {
    stack.offset(graph_status);
    formattedData = stack(names.map(function(name) {
        return {
            name: name,
            values: graphicData.map(function(d) {
                return {x: +d['year'], y: +d[name], year: d3.time.format('%Y').parse(d['year'])} ;
            })
        };
    }));    

    y.domain([ 0, d3.max(d3.entries(formattedData), function(c) { 
            return d3.max(c['value']['values'], function(v) { 
                var n = v['y'] + v['y0'];
                return Math.ceil(n/5)*yAdj; // round to next 5
            }); 
        })
    ]);


    // yAxis.scale(y);
    yAxis = d3.svg.axis()
    .orient('left')
    .scale(y)
    .ticks(ticksY); 


}

//wiggle or expand
function transition() {
    changeState();
    dataTransform();   

layers
    .data(formattedData)
    .transition()
      .duration(800)
    .attr("d", function(d) { return area(d.values); })
    .style("fill", function(d) { return majorColor(d.name); });

    domain1 = [0,140000000]
    domain2 = [0,1]
    // setDomains()        
        yaxis.transition().duration(700).tween("axis", function(d, i) {
        if (graph_status != 'wiggle') {
            var i = d3.interpolate(domain1, domain2);
        } else {
            var i = d3.interpolate(domain2, domain1);
        }
        return function(t) {
          y.domain(i(t));
          yaxis.call(yAxis);
        }
    })


    // .call(yAxis);
    // }
    // ygrid.call(yAxisGrid());
    
    // layers.order();

}

function cloneColors() {
    color1 = _.clone(COLOR1)
    color2 = _.clone(COLOR2)
    color3 = _.clone(COLOR3)
    color4 = _.clone(COLOR4)
    color5 = _.clone(COLOR5)
    color6 = _.clone(COLOR6)
    color7 = _.clone(COLOR7)
    color8 = _.clone(COLOR8)
    color9 = _.clone(COLOR9)
    color10 = _.clone(COLOR10)
}
var classify = function(str) { // clean up strings to use as CSS classes
    return str.replace(/\s+/g, '-').toLowerCase();
}


function major(name) {
    var jobs_array = [farmers,
        managers,
        agents,
        laborers,
        salesworkers,
        craftsmen,
        professionals,
        serviceIn,
        serviceOut,
        factory]

  for (i = 0; i < jobs_array.length; i++) {
        var list = jobs_array[i];
        if (_.contains(list, name)) {
            return list['name'];
        }
    }
}

function majorColor(name) {
    var jobs = {
        "farmers": color1,
        "managers": color2,
        "agents": color3,
        "laborers": color4,
        "salesworkers": color5,
        "craftsmen": color6,
        "professionals": color7,
        "serviceIn": color8,
        "serviceOut": color9,
        "factory": color10
    }

    var jobs_array = [farmers,
        managers,
        agents,
        laborers,
        salesworkers,
        craftsmen,
        professionals,
        serviceIn,
        serviceOut,
        factory]

    
   for (i = 0; i < jobs_array.length; i++) {
        var list = jobs_array[i];
        if (_.contains(list, name)) {
            var colorArray = jobs[list['name']];
            var colorPicked = colorArray[Math.floor(Math.random()*colorArray.length)];
            return colorPicked;
        }
    }
    
    
    return null;
}

function addHeight() {
    height = height + 1000;
}

/*
 * Initially load the graphic
 * (NB: Use window.load instead of document.ready
 * to ensure all images have loaded)
 */
$(window).load(onWindowLoaded);
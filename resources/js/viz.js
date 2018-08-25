 function init(){

var margin = {top: 20, right: 120, bottom: 20, left: 120},
  width = 960 - margin.right - margin.left,
  height = 500 - margin.top - margin.bottom;
  
var i = 0,
  duration = 750,
  root;

var tree = d3.layout.tree()
  .size([height, width]);

var diagonal = d3.svg.diagonal()
  .projection(function(d) { return [d.y, d.x]; });

var tip = d3.tip()
          .attr('class', 'd3-tip')
          .offset([60, -80])
          .html(function(d) {
            return "<strong>Frequency:</strong> <span style='color:brown'>" + "hello" + "</span>";
          });

var svg = d3.select("body").append("svg")
  .attr("width", width + margin.right + margin.left)
  .attr("height", height + margin.top + margin.bottom)
  .append("g")
  .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

svg.call(tip);

d3.json("resources/json/tree.json", function(error, obj) {

var keys = Object.keys(obj);

      var element = [];
      element.push({"name":"root","parent":null});
      var visited = [];
      var children ={};
      for(var i=0;i<keys.length;i++)
      {
        var d = obj[keys[i]];

        if(children[d[0].language]==undefined)
        {

          var items = [];
          items.push({"name":d[0].question,"parent":d[0].language,"details":d});
          children[d[0].language]=items;
          
        }
        else
        {
          children[d[0].language].push({"name":d[0].question,"parent":d[0].language,"details":d});
        }
          
        
      }

      keys = Object.keys(children);
      var childelements = [];
      for(var i=0; i<keys.length; i++)
      {
        var d = children[keys[i]];
        childelements.push({"name":keys[i],"parent":"root","children":d});
      }

      element.children = childelements;

  
  root = element;

  root.x0 = height / 2;
  root.y0 = 0;

  function collapse(d) 
  {
      if (d.children) 
      {
        d._children = d.children;
        d._children.forEach(collapse);
        d.children = null;
      }
  }

     root.children.forEach(collapse);
   
    update(root);
    });

d3.select(self.frameElement).style("height", "500px");


function update(source) {
    
  var nodes = tree.nodes(root).reverse(),
    links = tree.links(nodes);

  nodes.forEach(function(d) { d.y = d.depth * 180; });

  var node = svg.selectAll("g.node")
    .data(nodes, function(d) { return d.id || (d.id = ++i); });

  var nodeEnter = node.enter().append("g")
    .attr("class", "node")
    .attr("transform", function(d) { return "translate(" + source.y0 + "," + source.x0 + ")"; })
    .on("click", click)
    .on("mouseover",function (d) {
      if(d.details!=undefined)
      {
        var data = d.details[0];
       
        tip.html(function(d) {

              return "<strong>user:</strong> <span style='color:red'>" + data.user + "<br></span>"+"<strong>Score:</strong> <span style='color:red'>" + data.score + "<br></span>"+
              "<strong>Answers:</strong> <span style='color:red'>" + data.answers + "<br></span>"+"<strong>Views:</strong> <span style='color:red'>" + data.views + "<br></span>"+
              "<strong>Votes:</strong> <span style='color:red'>" + data.votes + "</span>";
            });

        tip.show();
      }
    })
    .on("mouseout", function () {
tip.hide();

    	// body...
    })
    ;

  nodeEnter.append("circle")
    .attr("r", 1e-6)
    .style("fill", function(d) { return d._children ? "lightsteelblue" : "#fff"; });

  nodeEnter.append("text")
    .attr("x", function(d) { return d.children || d._children ? -13 : 13; })
    .attr("dy", ".35em")
    .attr("text-anchor", function(d) { return d.children || d._children ? "end" : "start"; })
    .text(function(d) { return d.name; })
    .style("fill-opacity", 1e-6);

  var nodeUpdate = node.transition()
    .duration(duration)
    .attr("transform", function(d) { return "translate(" + d.y + "," + d.x + ")"; });

  nodeUpdate.select("circle")
    .attr("r", 10)
    .style("fill", function(d) { return d._children ? "lightsteelblue" : "#fff"; });

  nodeUpdate.select("text")
    .style("fill-opacity", 1);

  var nodeExit = node.exit().transition()
    .duration(duration)
    .attr("transform", function(d) { return "translate(" + source.y + "," + source.x + ")"; })
    .remove();

  nodeExit.select("circle")
    .attr("r", 1e-6);

  nodeExit.select("text")
    .style("fill-opacity", 1e-6);

  var link = svg.selectAll("path.link")
    .data(links, function(d) { return d.target.id; });

  link.enter().insert("path", "g")
    .attr("class", "link")
    .attr("d", function(d) {
    var o = {x: source.x0, y: source.y0};
    return diagonal({source: o, target: o});
    });

  link.transition()
    .duration(duration)
    .attr("d", diagonal);

  link.exit().transition()
    .duration(duration)
    .attr("d", function(d) {
    var o = {x: source.x, y: source.y};
    return diagonal({source: o, target: o});
    })
    .remove();

  nodes.forEach(function(d) {
  d.x0 = d.x;
  d.y0 = d.y;
  });
}

function click(d) {
  if (d.children) {
  d._children = d.children;
  d.children = null;
 
  } else {

  d.children = d._children;
  d._children = null;
  }
  update(d);
}

}

/*
National Crime Agency (c) Crown Copyright 2018

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
*/

var nodes = new vis.DataSet([]);
var edges = new vis.DataSet([]);

var container = document.getElementById('graph');
var data = {
  nodes: nodes,
  edges: edges
};
var options = {
  interaction: { multiselect: true},
  manipulation: {
    enabled: false,
    addEdge: function(data, callback) {
      data.arrows = 'to';
      data.label = $("#addEdgeLabel").val()
      callback(data)
      $("#addEdgeButton").removeClass("active");
      generateOutput();
    }
  },
  physics: {
    maxVelocity: 20
  }
};
var network = new vis.Network(container, data, options);

network.on("select", onElementSelect);

$("#addNodeLabel").on("input", function(){
  if($("#addNodeLabel").val().trim() == ""){
    $("#addNodeButton").prop("disabled", true);
  }else{
    $("#addNodeButton").prop("disabled", false);
  }
});

$("#addEdgeLabel").on("input", function(){
  if($("#addEdgeLabel").val().trim() == ""){
    $("#addEdgeButton").prop("disabled", true);
  }else{
    $("#addEdgeButton").prop("disabled", false);
  }
});

$("input[name='propertyName'], select[name='propertyType'], input[name='propertyField']").blur(function(){
  saveProperties();
  generateOutput();
});

$("#propertyMerge").on("change", function(){
  saveProperties();
  generateOutput();
});

$("#output").on("change", function(){
  if(nodes.length == 0){
    loadFromOutput();
  }else{
    $('#confirmModal').modal({backdrop:"static"});
  }
});

$("#output").trigger("change");
$("#addNodeLabel").trigger("input");
$("#addEdgeLabel").trigger("input");
onElementSelect({nodes:[], edges:[]})

var currId = 0;
var propNode = null;

function onElementSelect(params){
  clearProperties();
  if(params.nodes.length == 1){
    propNode = params.nodes[0]
    loadProperties(propNode);
    $("#propertyMerge").prop("disabled", false)
    $("#propertyAddButton").prop("disabled", false)
  }else{
    propNode = null;
    $("#propertyMerge").prop("disabled", true)
    $("#propertyAddButton").prop("disabled", true)
  }

  if(params.nodes.length == 0 && params.edges.length == 0){
    $("#removeElementsButton").prop("disabled", true);
  }else{
    $("#removeElementsButton").prop("disabled", false);
  }
}

function addNode(){
  currId++;
  nodes.add({id:currId, label: $("#addNodeLabel").val()});
  generateOutput();
}

function addEdge(){
  var button = $("#addEdgeButton");

  if(button.hasClass("active")){
    button.removeClass("active");
    network.disableEditMode()
  }else{
    button.addClass("active");
    network.addEdgeMode()
  }
}

function addProperty(){
  $("#propertyBody").append($("#propertyRow").clone(true).removeClass("d-none"));
}

function removeProperty(row){
  $(row).closest('tr').remove();
}

function loadProperties(nodeId){
  var properties = nodes.get(nodeId).properties;
  if(properties == undefined || properties == null)
    return;

  for (var key in properties) {
    var value = properties[key];

    if(Array.isArray(value)){
      value.forEach(function(item){
        var parts = splitOnce(item, '#');
        addPropertyRow(key, parts[0], parts[1]);
      });
    }else{
      var parts = splitOnce(value, '#');
      addPropertyRow(key, parts[0], parts[1]);
    }
  }

  var merge = nodes.get(nodeId).merge;
  if(merge == undefined || merge != true){
    $("#propertyMerge").prop("checked", false);
  }else{
    $("#propertyMerge").prop("checked", true);
  }
}

function addPropertyRow(name, type, field){
  var row = $("#propertyRow").clone(true).removeClass("d-none");
  $("#propertyBody").append(row);
    
  $(row).find("input[name='propertyName']").val(name);
  $(row).find("select[name='propertyType']").val(type);
  $(row).find("input[name='propertyField']").val(field)
}

function clearProperties(){
  $("#propertyBody").children("tr:not(.d-none)").remove();
  $("#propertyMerge").prop("checked", false);
}

function saveProperties(){
  if(propNode == null)
    return;

  var properties = {}

  $("#propertyBody").children("tr:not(.d-none)").each(function(index, element){
    var name = $(element).find("input[name='propertyName']").val();
    var type = $(element).find("select[name='propertyType'] option:selected").text();
    var field = $(element).find("input[name='propertyField']").val();

    if(name.trim() != "" && field != ""){
      if(name in properties){
        var existing = properties[name];
        if(Array.isArray(existing)){
          existing.push(type + "#" + field);
        }else{
          properties[name] = [existing, type + "#" + field];
        }
      }else{
        properties[name] = type + "#" + field;
      }
    }
  });

  nodes.update({
    id: propNode,
    properties: properties,
    merge: $("#propertyMerge").prop("checked"),
    shadow: $("#propertyMerge").prop("checked")
  });

  generateOutput();
}

function removeAllElements(){
  nodes.clear();
  edges.clear();
  generateOutput();
}

function removeElements(){
  network.deleteSelected();
  generateOutput();
}

function generateOutput(){
  var nodeOutput = "";
  var edgeOutput = "";

  nodes.forEach(function(node){
    var nodeStr = "- _type: " + node.label + "\n";
    nodeStr += "  _id: " + node.id + "\n";

    if(node.merge == true){
      nodeStr += "  _merge: true\n";
    }

    if(node.properties != undefined){
      for (var key in node.properties) {
        var value = node.properties[key];
        if(Array.isArray(value)){
          nodeStr += "  "+key+":\n";
          value.forEach(function(item){
            var parts = splitOnce(item, '#');
            nodeStr += "  - _"+parts[0]+"("+parts[1]+")\n";            
          });
        }else{
          var parts = splitOnce(value, '#');
          nodeStr += "  "+key+": _"+parts[0]+"("+parts[1]+")\n";
        }
      }
    }

    nodeOutput += nodeStr;
  });

  edges.forEach(function(edge){
    var edgeStr = "- _type: " + edge.label + "\n";
    edgeStr += "  _src: " + edge.from + "\n";
    edgeStr += "  _tgt: " + edge.to + "\n";

    edgeOutput += edgeStr;
  });

  var output = "";
  if(nodeOutput != "")
    output += "vertices:\n" + nodeOutput + "\n";

  if(edgeOutput != "")
    output += "edges:\n"+edgeOutput

  $("#output").val(output);
}

function loadFromOutput(){
  var output = $("#output").val();
  if(output == undefined || output == "")
    return;

  try {
    var doc = jsyaml.safeLoad(output);
    
    var newNodes = [];
    var newEdges = [];

    for (var index in doc.vertices){
      var vertex = doc.vertices[index];

      var newVertex = {label: vertex._type};

      if(vertex._id != undefined)
        newVertex.id = vertex._id;

      if(vertex._merge == true){
        newVertex.merge = true;
        newVertex.shadow = true;
      }

      var properties = {};
      for(var key in vertex){
        if(!key.startsWith("_")){
          var val = vertex[key];

          if(Array.isArray(val)){
            var prop = []
            val.forEach(function(item){
              if(item.startsWith("_")){
                var parts = splitOnce(item, "(");
                prop.push(parts[0].substring(1) + "#" + parts[1].substring(0, parts[1].length - 1));
              }else{
                prop.push("LITERAL#"+val);
              }
            });
            properties[key] = prop;
          }else{
            if(val.startsWith("_")){
              var parts = splitOnce(val, "(");
              properties[key] = parts[0].substring(1) + "#" + parts[1].substring(0, parts[1].length - 1)
            }else{
              properties[key] = "LITERAL#"+val;
            }
          }
        }
      }

      if(properties.length != 0)
        newVertex.properties = properties;

      newNodes.push(newVertex);
    }

    for (var index in doc.edges){
      var edge = doc.edges[index];

      newEdges.push({label: edge._type, from: edge._src, to: edge._tgt, arrows: 'to'});
    }

    nodes.clear();
    edges.clear();
    newNodes.forEach(function(n){nodes.add(n)});
    newEdges.forEach(function(e){edges.add(e)});

    generateOutput();
  } catch (e) {
    $('#errorModal').modal({backdrop:"static"});
    console.log(e)
  }
}

function splitOnce(string, delimiter){
  var i = string.indexOf(delimiter);
  return [string.slice(0,i), string.slice(i+1)];
}

//TODO: Special property: _except
//TODO: Filters

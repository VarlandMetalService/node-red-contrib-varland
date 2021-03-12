module.exports = function(RED) {
  const varland = require("../lib/varland");
  function VariableInfoNode(config) {
    RED.nodes.createNode(this,config);
    this.variableName = config.variableName;
    this.variableNameType = config.variableNameType;
    this.variableInfo = config.variableInfo;
    var node = this;
    node.on('input', function(msg) {
      let variableName = RED.util.evaluateNodeProperty(node.variableName,
                                                       node.variableNameType,
                                                       node,
                                                       msg);
      let typeInfo = varland.variableInfo(variableName);
      RED.util.setMessageProperty(msg, node.variableInfo, typeInfo);
      node.send(msg);
    });
  }
  RED.nodes.registerType("variable info",VariableInfoNode);
}
module.exports = function(RED) {
  const varland = require("../lib/varland");
  const GroovHistorian = varland.GroovHistorian;
  function HistorizeVariablesNode(config) {
    RED.nodes.createNode(this,config);
    var node = this;
    node.on('input', function(msg) {
      let historian = new GroovHistorian({
        apiKey: "EYsLDRNs5STr48JPNP9HoTACeUk5PSTU",
        hostname: "epiclc.varland.com"
      });
      node.send(msg);
    });
  }
  RED.nodes.registerType("historize variables",HistorizeVariablesNode);
}
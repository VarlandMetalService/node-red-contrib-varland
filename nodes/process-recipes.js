module.exports = function(RED) {
  const varland = require("../lib/varland");
  const GroovRecipeManager = varland.GroovRecipeManager;
  function ProcessRecipesNode(config) {
    RED.nodes.createNode(this,config);
    var node = this;
    node.on('input', function(msg) {
      let manager = new GroovRecipeManager({
        apiKey: "EYsLDRNs5STr48JPNP9HoTACeUk5PSTU",
        hostname: "epiclc.varland.com"
      });
      node.send(msg);
    });
  }
  RED.nodes.registerType("process recipes",ProcessRecipesNode);
}
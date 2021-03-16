module.exports = function(RED) {
  const varland = require("../lib/varland");
  const GroovHistoricLog = varland.GroovHistoricLog;
  function ProcessLogsNode(config) {
    RED.nodes.createNode(this,config);
    var node = this;
    node.on('input', function(msg) {
      GroovHistoricLog.processLogs({
        apiKey: "EYsLDRNs5STr48JPNP9HoTACeUk5PSTU",
        hostname: "epiclc.varland.com"
      })
      node.send(msg);
    });
  }
  RED.nodes.registerType("process logs",ProcessLogsNode);
}
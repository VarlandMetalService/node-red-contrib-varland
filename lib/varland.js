const { execSync } = require("child_process")
const { exec } = require("child_process")
const os = require("os")
const fs = require("fs")
const InfluxDB = require("influxdb-v2")

const CLIENT_CONFIG = {
  apiKey: "EYsLDRNs5STr48JPNP9HoTACeUk5PSTU",
  hostname: "epiclc.varland.com"
}

const INFLUX_CONFIG = {
  host: "historian.varland.com",
  protocol: "http",
  port: 8086,
  token: "YlI7QHqyvcP_hpXmULvgCo5EFFwbTRToEE1U-qCgBgXXqdBnds9nagmmEFkyWs7-ll6Z_pHP00Hwg7i7N7eskA=="
}

class GroovVariable {

  static PREFIXES = {
    "ai": "analog_input",
    "ao": "analog_output",
    "b": "int32",
    "bt": "int32_table",
    "di": "digital_input",
    "do": "digital_output",
    "dt": "down_timer",
    "f": "float",
    "ft": "float_table",
    "i": "int32",
    "it": "int32_table",
    "s": "string",
    "st": "string_table",
    "ut": "up_timer"
  }
  static RECIPE_VARIABLE_PREFIX = "r"
  static HISTORIAN_VARIABLE_PREFIX = "h"
  static VARIABLE_SEPARATOR = "_"
  static LOG_TRIGGER_REGEX = /^(r|h|rh|hr)?b_([A-Za-z0-9]+(_[A-Za-z0-9]+)*)_Log$/
  static VALID_NAME_REGEX = /^((r|h|rh|hr)?(ai|ao|b|bt|di|do|dt|f|ft|i|it|s|st|ut))(_([A-Za-z0-9]+))+$/
  static LOCAL_RECIPE_FOLDER = "/Users/toby/Desktop/recipe_data/" // "/home/dev/secured/recipe_data/"
  static FTP_RECIPE_FOLDER = "/GroovRecipes/"

  static isValidName(name) {
    return (GroovVariable.VALID_NAME_REGEX.exec(name) !== null);
  }

  constructor(name) {
    this.name = name;
    this.nameValid = GroovVariable.isValidName(name)
    this.prefix = null
    this.type = null
    this.isRecipe = false
    this.recipeDetails = null
    this.isHistorian = false
    this.isLogTrigger = false
    this.logDetails = null
    if (this.nameValid) this.parseName()
  }

  /*
  details() {
    return {
      name: this.name,
      nameValid: this.nameValid,
      prefix: this.prefix,
      type: this.type,
      isRecipe: this.isRecipe,
      recipeDetails: this.recipeDetails,
      isHistorian: this.isHistorian,
      isLogTrigger: this.isLogTrigger,
      logDetails: this.logDetails
    }
  }
  */

  parseName() {

    this.prefix = this.name.split(GroovVariable.VARIABLE_SEPARATOR)[0];

    while (this.prefix.charAt(0) === GroovVariable.RECIPE_VARIABLE_PREFIX ||
           this.prefix.charAt(0) === GroovVariable.HISTORIAN_VARIABLE_PREFIX) {
      if (this.prefix.charAt(0) === GroovVariable.RECIPE_VARIABLE_PREFIX) {
        this.isRecipe = true;
      } else {
        this.isHistorian = true;
      }
      this.prefix = this.prefix.substring(1);
    }

    if (this.prefix in GroovVariable.PREFIXES) {
      this.type = GroovVariable.PREFIXES[this.prefix];
    }
    switch (this.type) {
      case "analog_input":
      case "analog_output":
      case "digital_input":
      case "digital_output":
        this.isHistorian = true
        break
    }

    if (this.isRecipe) {
      this.recipeDetails = {
        ftpPath: `${GroovVariable.FTP_RECIPE_FOLDER + os.hostname()}/${this.name}.json`,
        localPath: `${GroovVariable.LOCAL_RECIPE_FOLDER + this.name}.json`
      };
    }

    let m;
    if ((m = GroovVariable.LOG_TRIGGER_REGEX.exec(this.name)) !== null) {
      this.isLogTrigger = true;
      this.logDetails = {
        id: m[2],
        logTypeVariable: "s_" + m[2] + "_LogType",
        variableNamesTable: "st_" + m[2] + "_Variables",
        fieldNamesTable: "st_" + m[2] + "_Fields",
      };
    }

  }

}

class GroovClient {

  constructor(config) {
    this.apiKey = config.apiKey
    this.hostname = config.hostname
  }

  curl(cmd) {
    try {
      return JSON.parse(execSync(cmd, { stdio: ['pipe', 'pipe', 'ignore']}).toString())
    } catch (error) {
      return null
    }
  }

  get(endpoint) {
    let cmd = `curl -k -X GET "https://${this.hostname}/pac${endpoint}" -H "accept: application/json" -H "apiKey: ${this.apiKey}"`
    return this.curl(cmd)
  }

  post(endpoint, data) {
    let cmd = `curl -k --data-raw '${JSON.stringify(data).replace("'", "'\\''")}' -X POST "https://${this.hostname}/pac${endpoint}" -H 'Content-Type: application/json' -H "accept: application/json" -H "apiKey: ${this.apiKey}"`
    return this.curl(cmd)
  }

  getDevice() { return this.get("/device") }
  getStrategy() { return this.get("/device/strategy") }

  getIntegers() { return this.get("/device/strategy/vars/int32s") }
  getFloats() { return this.get("/device/strategy/vars/floats") }
  getStrings() { return this.get("/device/strategy/vars/strings") }
  getAnalogInputs() { return this.get("/device/strategy/ios/analogInputs") }
  getAnalogOutputs() { return this.get("/device/strategy/ios/analogOutputs") }
  getDigitalInputs() { return this.get("/device/strategy/ios/digitalInputs") }
  getDigitalOutputs() { return this.get("/device/strategy/ios/digitalOutputs") }
  getIntegerTables() { return this.get("/device/strategy/tables/int32s") }
  getFloatTables() { return this.get("/device/strategy/tables/floats") }
  getStringTables() { return this.get("/device/strategy/tables/strings") }
  getUpTimers() { return this.get("/device/strategy/vars/upTimers") }
  getDownTimers() { return this.get("/device/strategy/vars/downTimers") }

  getInteger(name) { return this.get(`/device/strategy/vars/int32s/${name}`).value }
  getFloat(name) { return this.get(`/device/strategy/vars/floats/${name}`).value }
  getString(name) { return this.get(`/device/strategy/vars/strings/${name}`).value }
  getAnalogInput(name) { return this.get(`/device/strategy/ios/analogInputs/${name}/eu`).value }
  getAnalogOutput(name) { return this.get(`/device/strategy/ios/analogOutputs/${name}/eu`).value }
  getDigitalInput(name) { return this.get(`/device/strategy/ios/digitalInputs/${name}/state`).value }
  getDigitalOutput(name) { return this.get(`/device/strategy/ios/digitalOutputs/${name}/state`).value }
  getIntegerTable(name) { return this.get(`/device/strategy/tables/int32s/${name}`) }
  getFloatTable(name) { return this.get(`/device/strategy/tables/floats/${name}`) }
  getStringTable(name) { return this.get(`/device/strategy/tables/strings/${name}`) }
  getIntegerTableIndex(name, index) { return this.get(`/device/strategy/tables/int32s/${name}/${index}`).value }
  getFloatTableIndex(name, index) { return this.get(`/device/strategy/tables/floats/${name}/${index}`).value }
  getStringTableIndex(name, index) { return this.get(`/device/strategy/tables/strings/${name}/${index}`).value }
  getUpTimer(name) { return this.get(`/device/strategy/vars/upTimers/${name}/value`).value }
  getDownTimer(name) { return this.get(`/device/strategy/vars/downTimers/${name}/value`).value }

  setInteger(name, value) { return this.post(`/device/strategy/vars/int32s/${name}`, {"value": value}).errorCode == 0 }
  setFloat(name, value) { return this.post(`/device/strategy/vars/floats/${name}`, {"value": value}).errorCode == 0 }
  setString(name, value) { return this.post(`/device/strategy/vars/strings/${name}`, {"value": value}).errorCode == 0 }
  setAnalogOutput(name, value) { return this.post(`/device/strategy/ios/analogOutputs/${name}/eu`, {"value": value}).errorCode == 0 }
  setDigitalOutput(name, value) { return this.post(`/device/strategy/ios/digitalOutputs/${name}/state`, {"value": value}).errorCode == 0 }
  setIntegerTable(name, value, startIndex = 0) { return this.post(`/device/strategy/tables/int32s/${name}?startIndex=${startIndex}`, value).errorCode == 0 }
  setFloatTable(name, value, startIndex = 0) { return this.post(`/device/strategy/tables/floats/${name}?startIndex=${startIndex}`, value).errorCode == 0 }
  setStringTable(name, value, startIndex = 0) { return this.post(`/device/strategy/tables/strings/${name}?startIndex=${startIndex}`, value).errorCode == 0 }
  setIntegerTableIndex(name, index, value) { return this.post(`/device/strategy/tables/int32s/${name}/${index}`, {"value": value}).errorCode == 0 }
  setFloatTableIndex(name, index, value) { return this.post(`/device/strategy/tables/floats/${name}/${index}`, {"value": value}).errorCode == 0 }
  setStringTableIndex(name, index, value) { return this.post(`/device/strategy/tables/strings/${name}/${index}`, {"value": value}).errorCode == 0 }

  getVariable(name) {
    let variable = new GroovVariable(name)
    if (variable.nameValid) {
      switch (variable.type) {
        case "analog_input":
          return this.getAnalogInput(name)
        case "analog_output":
          return this.getAnalogOutput(name)
        case "digital_input":
          return this.getDigitalInput(name)
        case "digital_output":
          return this.getDigitalOutput(name)
        case "down_timer":
          return this.getDownTimer(name)
        case "float":
          return this.getFloat(name)
        case "float_table":
          return this.getFloatTable(name)
        case "int32":
          return this.getInteger(name)
        case "int32_table":
          return this.getIntegerTable(name)
        case "string":
          return this.getString(name)
        case "string_table":
          return this.getStringTable(name)
        case "up_timer":
          return this.getUpTimer(name)
        default:
          return null
      }
    } else {
      return null
    }
  }

  setVariable(name, value) {
    let variable = new GroovVariable(name)
    if (variable.nameValid) {
      switch (variable.type) {
        case "analog_output":
          return this.setAnalogOutput(name, value)
        case "digital_output":
          return this.setDigitalOutput(name, value)
        case "float":
          return this.setFloat(name, value)
        case "float_table":
          return this.setFloatTable(name, value)
        case "int32":
          return this.setInteger(name, value)
        case "int32_table":
          return this.setIntegerTable(name, value)
        case "string":
          return this.setString(name, value)
        case "string_table":
          return this.setStringTable(name, value)
        default:
          return null
      }
    } else {
      return null
    }
  }

}

class GroovHistoricLog {

  static processLogs(clientConfig) {
    let groov = new GroovClient(clientConfig)
    const integers = groov.getIntegers()
    integers.forEach(element => {
      let variable = new GroovVariable(element.name)
      if (variable.isLogTrigger && element.value != 0) {
        let log = new GroovHistoricLog(element.name, clientConfig)
      }
    })
  }

  static postLog(data) {
    let cmd = `curl --form 'log=${data}' --request POST "http://optologs.varland.com/log"`
    exec(cmd, { stdio: ['ignore', 'ignore', 'ignore']})
  }

  constructor(name, clientConfig) {
    this.groov = new GroovClient(clientConfig)
    this.variable = new GroovVariable(name)
    this.retrieveLogDetails()
  }

  retrieveLogDetails() {
    this.logType = this.groov.getString(this.variable.logDetails.logTypeVariable)
    this.variableNames = this.groov.getStringTable(this.variable.logDetails.variableNamesTable)
    this.fieldNames = this.groov.getStringTable(this.variable.logDetails.fieldNamesTable)
    this.variableValues = []
    this.variableNames.forEach(element => this.variableValues.push(this.groov.getVariable(element)))
    this.json = {
      type: this.logType,
      controller: os.hostname()
    }
    for (let i = 0, c = this.fieldNames.length; i < c; i++) {
      this.json[this.fieldNames[i]] = this.variableValues[i]
    }
    GroovHistoricLog.postLog(JSON.stringify(JSON.stringify(this.json)))
    this.groov.setInteger(this.variable.name, 0)
  }

}

class GroovRecipeManager {

  static FINISHED_VARIABLE = "b_StartupRecipes_Finished"
  static FINISHED_INTEGERS_VARIABLE = "b_StartupRecipes_FinishedIntegers"
  static FINISHED_FLOATS_VARIABLE = "b_StartupRecipes_FinishedFloats"
  static FINISHED_STRINGS_VARIABLE = "b_StartupRecipes_FinishedStrings"
  static FINISHED_INTEGER_TABLES_VARIABLE = "b_StartupRecipes_FinishedIntegerTables"
  static FINISHED_FLOAT_TABLES_VARIABLE = "b_StartupRecipes_FinishedFloatTables"
  static FINISHED_STRING_TABLES_VARIABLE = "b_StartupRecipes_FinishedStringTables"

  constructor(clientConfig) {
    this.groov = new GroovClient(clientConfig)
    this.startupFinished = (this.groov.getInteger(GroovRecipeManager.FINISHED_VARIABLE) != 0)
    if (this.startupFinished) {
      this.saveData()
    } else {
      this.restoreData()
    }
  }

  restoreData() {
    this.restoreVariables(this.groov.getIntegers(), GroovRecipeManager.FINISHED_INTEGERS_VARIABLE)
    this.restoreVariables(this.groov.getFloats(), GroovRecipeManager.FINISHED_FLOATS_VARIABLE)
    this.restoreVariables(this.groov.getStrings(), GroovRecipeManager.FINISHED_STRINGS_VARIABLE)
    this.restoreVariables(this.groov.getIntegerTables(), GroovRecipeManager.FINISHED_INTEGER_TABLES_VARIABLE)
    this.restoreVariables(this.groov.getFloatTables(), GroovRecipeManager.FINISHED_FLOAT_TABLES_VARIABLE)
    this.restoreVariables(this.groov.getStringTables(), GroovRecipeManager.FINISHED_STRING_TABLES_VARIABLE)
  }

  restoreVariables(variables, notification) {
    variables.forEach(element => {
      let variable = new GroovVariable(element.name)
      if (variable.isRecipe) {
        let stat = fs.statSync(variable.recipeDetails.localPath, {
          throwIfNoEntry: false
        })
        if (stat !== undefined) {
          let data = JSON.parse(fs.readFileSync(variable.recipeDetails.localPath).toString())
          this.groov.setVariable(element.name, data[element.name])
        }
      }
    })
    this.groov.setVariable(notification, 1)
  }

  saveData() {
    this.saveVariables(this.groov.getIntegers())
    this.saveVariables(this.groov.getFloats())
    this.saveVariables(this.groov.getStrings())
    this.saveTables(this.groov.getIntegerTables())
    this.saveTables(this.groov.getFloatTables())
    this.saveTables(this.groov.getStringTables())
  }

  saveVariables(variables) {
    variables.forEach(element => {
      let variable = new GroovVariable(element.name)
      if (variable.isRecipe) {
        let json = {}
        json[element.name] = element.value
        fs.writeFile(variable.recipeDetails.localPath, JSON.stringify(json), function() {})
      }
    })
  }

  saveTables(tables) {
    tables.forEach(element => {
      let variable = new GroovVariable(element.name)
      if (variable.isRecipe) {
        let json = {}
        json[element.name] = this.groov.getVariable(element.name)
        fs.writeFile(variable.recipeDetails.localPath, JSON.stringify(json), function() {})
      }
    })
  }

}

class GroovHistorian {

  static ORGANIZATION = "3b22129302e2a472"
  static BUCKET = "aeb240972d16e54d"

  constructor(clientConfig) {
    this.groov = new GroovClient(clientConfig)
    this.influx = new InfluxDB(INFLUX_CONFIG)
    this.points = []
    this.processVariables(this.groov.getAnalogInputs())
    this.processVariables(this.groov.getAnalogOutputs())
    this.processVariables(this.groov.getDigitalInputs())
    this.processVariables(this.groov.getDigitalOutputs())
    this.processVariables(this.groov.getIntegers())
    this.processVariables(this.groov.getFloats())
    this.processVariables(this.groov.getUpTimers())
    this.processVariables(this.groov.getDownTimers())
    this.processTables(this.groov.getIntegerTables())
    this.processTables(this.groov.getFloatTables())
    this.writePoints()
  }

  writePoints() {
    this.influx.write(
      {
        orgID: GroovHistorian.ORGANIZATION,
        bucket: GroovHistorian.BUCKET
      },
      this.points
    )
  }

  processTables(tables) {
    tables.forEach(element => {
      let variable = new GroovVariable(element.name)
      if (variable.isHistorian) {
        let data = this.groov.getVariable(element.name)
        for (let i = 0, c = data.length; i < c; i++) {
          this.addTableIndex(element.name, i, data[i])
        }
      }
    })
  }

  processVariables(variables) {
    variables.forEach(element => {
      let variable = new GroovVariable(element.name)
      if (variable.isHistorian) {
        this.addVariable(element.name, element.value)
      }
    })
  }
  
  addTableIndex(name, index, value) {
    let historianValue;
    switch (typeof value) {
      case "boolean":
        historianValue = value ? 1 : 0
        break
      default:
        historianValue = value
    }
    this.points.push(
      {
        measurement: "tables",
        tags: {
          name: name,
          controller: os.hostname()
        },
        fields: {
          index: index,
          value: historianValue
        }
      }
    )
  }
  
  addVariable(name, value) {
    let historianValue;
    switch (typeof value) {
      case "boolean":
        historianValue = value ? 1 : 0
        break
      default:
        historianValue = value
    }
    this.points.push(
      {
        measurement: "variables",
        tags: {
          name: name,
          controller: os.hostname()
        },
        fields: {
          value: historianValue
        }
      }
    )
  }

}

module.exports = {
  GroovVariable: GroovVariable,
  GroovClient: GroovClient,
  GroovHistoricLog: GroovHistoricLog,
  GroovRecipeManager: GroovRecipeManager,
  GroovHistorian: GroovHistorian
}
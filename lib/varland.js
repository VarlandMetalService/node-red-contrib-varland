module.exports = {

  // Reference OS module for determining hostname.
  os: require("os"),

  // Define variable name prefixes.
  prefixes: {
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
    "ut": "up_timer",
  },

  // Define special prefix used for recipe variables.
  recipeVariablePrefix: "r",

  // Define special prefix used for historian variables.
  historianVariablePrefix: "h",

  // Define separator character used in variable names.
  variableSeparator: "_",

  // Regex for determining if variable is a log trigger.
  logTriggerRegex: /^(r|h|rh|hr)?b_([A-Za-z0-9]+(_[A-Za-z0-9]+)*)_Log$/,

  // Regex for determining if variable name is valid.
  validVariableNameRegex: /^((r|h|rh|hr)?(ai|ao|b|bt|di|do|dt|f|ft|i|it|s|st|ut))(_([A-Za-z0-9]+))+$/,

  // Recipe folder on Groov controller.
  localRecipeFolder: "/home/dev/secured/recipe_data/",

  // Recipe folder on FTP server.
  ftpRecipeFolder: "/GroovRecipes/",

  /**
   * Returns whether a given name is a valid name according to
   * Varland naming conventions.
   * 
   * @param {string} name Variable name.
   * @returns boolean
   */
  isValidVariableName: function(name) {
    return (this.validVariableNameRegex.exec(name) !== null);
  },

  /**
   * Returns information about variable based on variable name.
   * 
   * @param {string} name Variable name.
   * @returns object
   */
  variableInfo: function(name) {

    // Initialize return object.
    let typeInfo = {
      type: null,
      isRecipe: false,
      isHistorian: false,
      isLogTrigger: false
    }

    // If name not valid, return empty result set.
    if (!this.isValidVariableName(name)) return typeInfo;

    // Determine prefix (everything before first separator).
    let prefix = name.split(this.variableSeparator)[0];

    // Determine if recipe/historian variable and remove special prefixes.
    while (prefix.charAt(0) === this.recipeVariablePrefix ||
           prefix.charAt(0) === this.historianVariablePrefix) {
      if (prefix.charAt(0) === this.recipeVariablePrefix) {
        typeInfo.isRecipe = true;
      } else {
        typeInfo.isHistorian = true;
      }
      prefix = prefix.substring(1);
    }

    // If variable is a recipe variable, store local and remote paths.
    if (typeInfo.isRecipe) {
      typeInfo.recipeDetails = {
        ftpPath: this.ftpRecipeFolder + this.os.hostname() + "/" + name + ".json",
        localPath: this.localRecipeFolder + name + ".json",
      };
    }

    // Set type if known prefix found.
    if (prefix in this.prefixes) {
      typeInfo.type = this.prefixes[prefix];
    }

    // Determine if variable is a log trigger.
    if ((m = this.logTriggerRegex.exec(name)) !== null) {
      typeInfo.isLogTrigger = true;
      typeInfo.logDetails = {
        id: m[2],
        logTypeVariable: "s_" + m[2] + "_LogType",
        variableNamesTable: "st_" + m[2] + "_VariableNames",
        fieldNamesTable: "st_" + m[2] + "_FieldNames",
      };
    }

    // Return variable info.
    return typeInfo;

  },

};
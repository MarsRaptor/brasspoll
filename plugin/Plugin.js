"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var fs_1 = require("fs");
var PluginManager = /** @class */ (function () {
    function PluginManager() {
        this._plugins = {
            array: [],
            record: {}
        };
        fs_1.writeFileSync("./views/.generated/search_configuration_mixins.pug", '// Generated file\n');
    }
    Object.defineProperty(PluginManager.prototype, "plugins", {
        get: function () {
            return this._plugins.array;
        },
        enumerable: true,
        configurable: true
    });
    PluginManager.prototype.addPlugin = function (plugin) {
        for (var _i = 0, _a = this.plugins; _i < _a.length; _i++) {
            var p = _a[_i];
            if (p.id === plugin.id) {
                return;
            }
        }
        if (!!this._plugins.record[plugin.id]) {
            return;
        }
        this._plugins.array.push(plugin);
        this._plugins.record[plugin.id] = plugin;
        fs_1.appendFileSync("./views/.generated/search_configuration_mixins.pug", plugin.appendConfigurationToTemplate().map(function (l) { return "" + "".padStart(l[1] * 4) + l[0]; }).join('\n'));
    };
    PluginManager.prototype.pluginById = function (plugin_id) {
        return this._plugins.record[plugin_id];
    };
    return PluginManager;
}());
exports.plugin_manager = new PluginManager();

"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const fs_1 = require("fs");
class PluginManager {
    constructor() {
        this._plugins = {
            array: [],
            record: {}
        };
        fs_1.writeFileSync(`./views/.generated/search_configuration_mixins.pug`, '// Generated file\n');
    }
    get plugins() {
        return this._plugins.array;
    }
    addPlugin(plugin) {
        for (const p of this.plugins) {
            if (p.id === plugin.id) {
                return;
            }
        }
        if (!!this._plugins.record[plugin.id]) {
            return;
        }
        this._plugins.array.push(plugin);
        this._plugins.record[plugin.id] = plugin;
        fs_1.appendFileSync(`./views/.generated/search_configuration_mixins.pug`, "div\n" +
            plugin.appendConfigurationToTemplate().map(l => `${"".padStart((l[1] + 1) * 4)}${l[0]}`).join('\n'));
    }
    pluginById(plugin_id) {
        return this._plugins.record[plugin_id];
    }
}
exports.plugin_manager = new PluginManager();

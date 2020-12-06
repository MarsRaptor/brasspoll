// @ts-check
/// <reference path="../@types/plugin_types.d.ts" />

class PluginManager {

    _plugins = {
        /**@type {Array<BrasspollPlugin<{},{}>>} */
        array: [],
        record: {}
    }

    get plugins() {
        return this._plugins.array;
    }

    /**
     * @template {shallow_t} T
     * @template {deep_t} U
     * @param {BrasspollPlugin<T,U>} plugin 
     */
    addPlugin(plugin) {
        for (const p of this.plugins) {
            if (p.id === plugin.id) {
                return;
            }
        }
        if (!!this._plugins.record[plugin.id]) {
            return;
        }
        this._plugins.array.push(plugin)
        this._plugins.record[plugin.id] = plugin;
    }

    /**
     * @template {shallow_t} T
     * @template {deep_t} U
     * @param {string} plugin_id 
     * @return {BrasspollPlugin<T,U> | undefined}
     */
    pluginById(plugin_id) {
        return this._plugins.record[plugin_id];
    }
}

exports.plugin_manager = new PluginManager();
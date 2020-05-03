import { Configuration } from "./PluginConfiguration";
import { writeFileSync, appendFileSync } from 'fs'

export type option_t = { label: string };
export type shallow_t = { [key: string]: number | boolean | string }
export type deep_t = { [key: string]: any }
export type retrieval_data_t<T extends shallow_t> = T & { plugin: string };
export type search_result_t<T extends shallow_t> = option_t & { img?: string; icon?: string } & retrieval_data_t<T>;
export type details_t<T extends shallow_t, U extends deep_t> = search_result_t<T> & U;

export interface Plugin<T extends shallow_t, U extends deep_t> {
    id: string;
    label: string;
    configuration: Configuration;
    details_template(locals?: deep_t): string;
    appendConfigurationToTemplate(): [string, number][];
    search(search: string): Promise<Array<search_result_t<T>>>;
    detailsUnique(retreival_data: search_result_t<T>): Promise<details_t<T, U>>;
    detailsMultiple(retreival_data: Array<search_result_t<T>>): Promise<Array<details_t<T, U>>>;
    validate(retreival_data: Array<search_result_t<T>>): Array<search_result_t<T>>;
    detailsUniqueFromDB(retrieval_data: retrieval_data_t<T>, dbData: Array<search_result_t<T>>): details_t<T, U> | undefined;
}

class PluginManager {

    constructor() {
        writeFileSync(`./views/.generated/search_configuration_mixins.pug`, '// Generated file\n');
    }

    private _plugins: { array: Array<Plugin<{}, {}>>, record: Record<string, Plugin<{}, {}>> } = {
        array: [],
        record: {}
    }

    get plugins() {
        return this._plugins.array;
    }
    addPlugin(plugin: Plugin<any, any>) {
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
        appendFileSync(
            `./views/.generated/search_configuration_mixins.pug`,
            "div\n" + 
            plugin.appendConfigurationToTemplate().map(l =>
                `${"".padStart((l[1] + 1) * 4)}${l[0]}`).join('\n')
        );
    }

    pluginById<T extends shallow_t, U extends deep_t>(plugin_id: string): Plugin<T, U> | undefined {
        return this._plugins.record[plugin_id] as Plugin<T, U> | undefined;
    }
}

export const plugin_manager = new PluginManager();
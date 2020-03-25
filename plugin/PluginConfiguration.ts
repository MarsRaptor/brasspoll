export type input = checkbox | color | date | datetime | datetime_local | email | image | month | _number | password | radio | range | search | text | time | url | week;

export type config_input = {
    label: string;
}

export class Configuration {
    private inputs: Array<input & config_input> = [];
    readonly checkboxes: { [name: string]: checkbox & config_input } = {};
    readonly colors: { [name: string]: color & config_input } = {};
    readonly dates: { [name: string]: date & config_input } = {};
    readonly datetimes: { [name: string]: datetime & config_input } = {};
    readonly datetime_locals: { [name: string]: datetime_local & config_input } = {};
    readonly emails: { [name: string]: email & config_input } = {};
    readonly images: { [name: string]: image & config_input } = {};
    readonly months: { [name: string]: month & config_input } = {};
    readonly numbers: { [name: string]: _number & config_input } = {};
    readonly passwords: { [name: string]: password & config_input } = {};
    readonly radios: { [name: string]: radio & config_input } = {};
    readonly ranges: { [name: string]: range & config_input } = {};
    readonly searches: { [name: string]: search & config_input } = {};
    readonly texts: { [name: string]: text & config_input } = {};
    readonly times: { [name: string]: time & config_input } = {};
    readonly urls: { [name: string]: url & config_input } = {};
    readonly weeks: { [name: string]: week & config_input } = {};

    create(label: string, input: input) {
        switch (input.type) {
            case "checkbox":
                this.checkboxes[input.name] = Object.assign(input as checkbox, { label: label });
                this.inputs.push(this.checkboxes[input.name]);
                break;
            case "color":
                this.colors[input.name] = Object.assign(input as color, { label: label });
                this.inputs.push(this.colors[input.name]);
                break;
            case "date":
                this.dates[input.name] = Object.assign(input as date, { label: label });
                this.inputs.push(this.dates[input.name]);
                break;
            case "datetime":
                this.datetimes[input.name] = Object.assign(input as datetime, { label: label });
                this.inputs.push(this.datetimes[input.name]);
                break;
            case "datetime-local":
                this.datetime_locals[input.name] = Object.assign(input as datetime_local, { label: label });
                this.inputs.push(this.datetime_locals[input.name]);
                break;
            case "email":
                this.emails[input.name] = Object.assign(input as email, { label: label });
                this.inputs.push(this.emails[input.name]);
                break;
            case "image":
                this.images[input.name] = Object.assign(input as image, { label: label });
                this.inputs.push(this.images[input.name]);
                break;
            case "month":
                this.months[input.name] = Object.assign(input as month, { label: label });
                this.inputs.push(this.months[input.name]);
                break;
            case "number":
                this.numbers[input.name] = Object.assign(input as _number, { label: label });
                this.inputs.push(this.numbers[input.name]);
                break;
            case "password":
                this.passwords[input.name] = Object.assign(input as password, { label: label });
                this.inputs.push(this.passwords[input.name]);
                break;
            case "radio":
                this.radios[`${input.name}[${input.value}]`] = Object.assign(input as radio, { label: label });
                this.inputs.push(this.radios[input.name]);
                break;
            case "range":
                this.ranges[input.name] = Object.assign(input as range, { label: label });
                this.inputs.push(this.ranges[input.name]);
                break;
            case "search":
                this.searches[input.name] = Object.assign(input as search, { label: label });
                this.inputs.push(this.searches[input.name]);
                break;
            case "text":
                this.texts[input.name] = Object.assign(input as text, { label: label });
                this.inputs.push(this.texts[input.name]);
                break;
            case "time":
                this.times[input.name] = Object.assign(input as time, { label: label });
                this.inputs.push(this.times[input.name]);
                break;
            case "url":
                this.urls[input.name] = Object.assign(input as url, { label: label });
                this.inputs.push(this.urls[input.name]);
                break;
            case "week":
                this.weeks[input.name] = Object.assign(input as week, { label: label });
                this.inputs.push(this.weeks[input.name]);
                break;
        }
    }

    setValue(name: string, value: number | string) {
        switch (typeof value) {
            case "number":
                if (!!this.numbers[name]) {
                    this.numbers[name].value = value;
                } else if (!!this.ranges[name]) {
                    this.ranges[name].value = value;
                } else {
                    console.warn(`Unknown property name "${name}"`)
                }
                break;
            case "string":
                let found = false;
                for (let inputIndex = 0; inputIndex < this.inputs.length; inputIndex++) {
                    if (this.inputs[inputIndex].name === name) {
                        found = true;
                        this.inputs[inputIndex].value = value;
                        break;
                    }
                }
                if (!found) {
                    console.warn(`Unknown property name "${name}"`)
                }
                break;
            default:
                console.error(`Unhandled value type "${typeof value}"`)
                break;
        }
    }

    setChecked(name: string, value: boolean) {
        if (!!this.checkboxes[name]) {
            this.checkboxes[name].checked = value;
        } else if (!!this.radios[name]) {
            this.radios[name].checked = value;
        } else {
            console.warn(`Unknown property name "${name}"`)
        }
    }

    isChecked(name: string): boolean | undefined {
        if (!!this.checkboxes[name]) {
            return this.checkboxes[name].checked;
        } else if (!!this.radios[name]) {
            return this.radios[name].checked;
        } else {
            console.warn(`Unknown property name "${name}"`)
            return undefined;
        }
    }

    number(name: string): number | undefined {
        if (!!this.numbers[name]) {
            return this.numbers[name].value;
        } else if (!!this.ranges[name]) {
            return this.ranges[name].value;
        }
        console.warn(`Unknown property name "${name}"`)
        return undefined;
    }

    str(name: string): string | undefined {
        for (let inputIndex = 0; inputIndex < this.inputs.length; inputIndex++) {
            if (this.inputs[inputIndex].name === name && typeof this.inputs[inputIndex].value === "string") {
                return this.inputs[inputIndex].value as string;
            }
        }
        console.warn(`Unknown property name "${name}"`)
        return undefined;
    }

    toTemplate(plugin:string) {
        let pugStr = "";
        for (let inputIndex = 0; inputIndex < this.inputs.length; inputIndex++) {
            pugStr += `label\n    = "${this.inputs[inputIndex].label}"\n`
            pugStr += "    input("
            for (const key in this.inputs[inputIndex]) {
                if (key !== "label") {
                    pugStr += `${key}="${(this.inputs[inputIndex] as any)[key]}" `
                }
            }
            pugStr += `data-plugin="${plugin}" onchange="updateConfigVar(this)")\n    br\n`
        }
        return pugStr;
    }

}



type checkbox = {
    checked: boolean;
    name: string;
    type: "checkbox";
    value: string;
}

type color = {
    autocomplete?: boolean;
    name: string;
    type: "color";
    value: string;
}

type date = {
    autocomplete?: boolean;
    max?: string;
    min?: string;
    name: string;
    step?: number;
    type: "date";
    value: string;
}

type datetime = {
    autocomplete?: boolean;
    max?: string;
    min?: string;
    name: string;
    step?: number;
    type: "datetime";
    value: string;
}

type datetime_local = {
    autocomplete?: boolean;
    max?: string;
    min?: string;
    name: string;
    step?: number;
    type: "datetime-local";
    value: string;
}

type email = {
    autocomplete?: boolean;
    maxLength?: number;
    name: string;
    pattern?: string;
    placeholder?: string;
    size?: number;
    type: "email";
    value: string;
}

type image = {
    alt?: string;
    height?: number;
    name: string;
    src: string;
    type: "image";
    value: string;
    width?: number;
}

type month = {
    autocomplete?: boolean;
    max?: string;
    min?: string;
    name: string;
    step?: number;
    type: "month";
    value: string;
}

type _number = {
    autocomplete?: boolean;
    max?: number;
    min?: number;
    name: string;
    placeholder?: number;
    step?: number;
    type: "number";
    value: number;
}

type password = {
    autocomplete?: boolean;
    maxLength?: number;
    name: string;
    pattern?: string;
    placeholder?: string;
    size?: number;
    type: "password";
    value: string;
}

type radio = {
    checked: boolean;
    name: string;
    type: "radio";
    value: string;
}

type range = {
    autocomplete?: boolean;
    max?: number;
    min?: number;
    name: string;
    step?: number;
    type: "range";
    value: number;
}

type search = {
    autocomplete?: boolean;
    maxLength?: number;
    name: string;
    pattern?: string;
    placeholder?: string;
    size?: number;
    type: "search";
    value: string;
}

type text = {
    autocomplete?: boolean;
    maxLength?: number;
    name: string;
    pattern?: string;
    placeholder?: string;
    size?: number;
    type: "text";
    value: string;
}

type time = {
    autocomplete?: boolean;
    max?: string;
    min?: string;
    name: string;
    step?: number;
    type: "time";
    value: string;
}

type url = {
    autocomplete?: boolean;
    maxLength?: number;
    name: string;
    pattern?: string;
    placeholder?: string;
    size?: number;
    type: "url";
    value: string;
}

type week = {
    autocomplete?: boolean;
    max?: string;
    min?: string;
    name: string;
    step?: number;
    type: "week";
    value: string;
}

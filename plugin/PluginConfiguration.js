"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class Configuration {
    constructor() {
        this.inputs = [];
        this.checkboxes = {};
        this.colors = {};
        this.dates = {};
        this.datetimes = {};
        this.datetime_locals = {};
        this.emails = {};
        this.images = {};
        this.months = {};
        this.numbers = {};
        this.passwords = {};
        this.radios = {};
        this.ranges = {};
        this.searches = {};
        this.texts = {};
        this.times = {};
        this.urls = {};
        this.weeks = {};
    }
    create(label, input) {
        switch (input.type) {
            case "checkbox":
                this.checkboxes[input.name] = Object.assign(input, { label: label });
                this.inputs.push(this.checkboxes[input.name]);
                break;
            case "color":
                this.colors[input.name] = Object.assign(input, { label: label });
                this.inputs.push(this.colors[input.name]);
                break;
            case "date":
                this.dates[input.name] = Object.assign(input, { label: label });
                this.inputs.push(this.dates[input.name]);
                break;
            case "datetime":
                this.datetimes[input.name] = Object.assign(input, { label: label });
                this.inputs.push(this.datetimes[input.name]);
                break;
            case "datetime-local":
                this.datetime_locals[input.name] = Object.assign(input, { label: label });
                this.inputs.push(this.datetime_locals[input.name]);
                break;
            case "email":
                this.emails[input.name] = Object.assign(input, { label: label });
                this.inputs.push(this.emails[input.name]);
                break;
            case "image":
                this.images[input.name] = Object.assign(input, { label: label });
                this.inputs.push(this.images[input.name]);
                break;
            case "month":
                this.months[input.name] = Object.assign(input, { label: label });
                this.inputs.push(this.months[input.name]);
                break;
            case "number":
                this.numbers[input.name] = Object.assign(input, { label: label });
                this.inputs.push(this.numbers[input.name]);
                break;
            case "password":
                this.passwords[input.name] = Object.assign(input, { label: label });
                this.inputs.push(this.passwords[input.name]);
                break;
            case "radio":
                this.radios[`${input.name}[${input.value}]`] = Object.assign(input, { label: label });
                this.inputs.push(this.radios[input.name]);
                break;
            case "range":
                this.ranges[input.name] = Object.assign(input, { label: label });
                this.inputs.push(this.ranges[input.name]);
                break;
            case "search":
                this.searches[input.name] = Object.assign(input, { label: label });
                this.inputs.push(this.searches[input.name]);
                break;
            case "text":
                this.texts[input.name] = Object.assign(input, { label: label });
                this.inputs.push(this.texts[input.name]);
                break;
            case "time":
                this.times[input.name] = Object.assign(input, { label: label });
                this.inputs.push(this.times[input.name]);
                break;
            case "url":
                this.urls[input.name] = Object.assign(input, { label: label });
                this.inputs.push(this.urls[input.name]);
                break;
            case "week":
                this.weeks[input.name] = Object.assign(input, { label: label });
                this.inputs.push(this.weeks[input.name]);
                break;
        }
    }
    setValue(name, value) {
        switch (typeof value) {
            case "number":
                if (!!this.numbers[name]) {
                    this.numbers[name].value = value;
                }
                else if (!!this.ranges[name]) {
                    this.ranges[name].value = value;
                }
                else {
                    console.warn(`Unknown property name "${name}"`);
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
                    console.warn(`Unknown property name "${name}"`);
                }
                break;
            default:
                console.error(`Unhandled value type "${typeof value}"`);
                break;
        }
    }
    setChecked(name, value) {
        if (!!this.checkboxes[name]) {
            this.checkboxes[name].checked = value;
        }
        else if (!!this.radios[name]) {
            this.radios[name].checked = value;
        }
        else {
            console.warn(`Unknown property name "${name}"`);
        }
    }
    isChecked(name) {
        if (!!this.checkboxes[name]) {
            return this.checkboxes[name].checked;
        }
        else if (!!this.radios[name]) {
            return this.radios[name].checked;
        }
        else {
            console.warn(`Unknown property name "${name}"`);
            return undefined;
        }
    }
    number(name) {
        if (!!this.numbers[name]) {
            return this.numbers[name].value;
        }
        else if (!!this.ranges[name]) {
            return this.ranges[name].value;
        }
        console.warn(`Unknown property name "${name}"`);
        return undefined;
    }
    str(name) {
        for (let inputIndex = 0; inputIndex < this.inputs.length; inputIndex++) {
            if (this.inputs[inputIndex].name === name && typeof this.inputs[inputIndex].value === "string") {
                return this.inputs[inputIndex].value;
            }
        }
        console.warn(`Unknown property name "${name}"`);
        return undefined;
    }
    toTemplate(plugin) {
        let pugStr = "";
        for (let inputIndex = 0; inputIndex < this.inputs.length; inputIndex++) {
            pugStr += `label\n    = "${this.inputs[inputIndex].label}"\n`;
            pugStr += "    input(";
            for (const key in this.inputs[inputIndex]) {
                if (key !== "label") {
                    pugStr += `${key}="${this.inputs[inputIndex][key]}" `;
                }
            }
            pugStr += `data-plugin="${plugin}" onchange="updateConfigVar(this)")\n    br\n`;
        }
        return pugStr;
    }
}
exports.Configuration = Configuration;

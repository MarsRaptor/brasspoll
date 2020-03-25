"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var socket = io();
var searchElement = document.getElementsByTagName("input").namedItem("search");
var titleElement = document.getElementsByTagName("input").namedItem("title");
var dupcheckElement = document.getElementsByTagName("select").namedItem("dupcheck");
var captchaElement = document.getElementsByTagName("input").namedItem("captcha");
var multiElement = document.getElementsByTagName("input").namedItem("multi");
var searchResultsElement = document.getElementsByTagName("table").namedItem("results").querySelector("tbody");
var selectedOptionsElement = document.getElementsByTagName("table").namedItem("selected_options").querySelector("tbody");
var createPollElement = document.getElementsByTagName("input").namedItem("create_poll");
function parseHTML(html) {
    var t = document.createElement('template');
    t.innerHTML = html;
    return t.content.cloneNode(true);
}
function search() {
    searchResultsElement.innerHTML = "";
    socket.emit('__search__', searchElement.value);
}
searchElement.addEventListener("search", search);
socket.on('__search_results__', function (msg) {
    console.log(msg);
    if (msg.search == searchElement.value) {
        var temp = parseHTML(msg.content);
        if (temp) {
            searchResultsElement.appendChild(temp);
        }
    }
});
function checkPollCreateButton() {
    var rowCount = selectedOptionsElement.querySelectorAll("tr.option_row").length;
    createPollElement.disabled = (rowCount <= 0 || rowCount > 25);
}
function option_action(cell, ev) {
    var _a;
    ev.stopPropagation();
    var id = (_a = cell.closest("table")) === null || _a === void 0 ? void 0 : _a.id;
    var row = cell.closest("tr");
    var content = row === null || row === void 0 ? void 0 : row.nextElementSibling;
    var extra_row = content === null || content === void 0 ? void 0 : content.nextElementSibling;
    if (id !== undefined && !!row && !!content && !!extra_row) {
        if (id === "results") {
            selectedOptionsElement.append(row.cloneNode(true));
            selectedOptionsElement.append(content.cloneNode(true));
            selectedOptionsElement.append(extra_row.cloneNode(true));
            searchElement.value = "";
            search();
        }
        else if (id === "selected_options") {
            row.remove();
            content.remove();
            extra_row.remove();
        }
        checkPollCreateButton();
    }
}
function create_poll() {
    return __awaiter(this, void 0, void 0, function () {
        var rows, options, rowIndex, row, pollData;
        return __generator(this, function (_a) {
            rows = selectedOptionsElement.querySelectorAll("tr.option_row");
            options = [];
            for (rowIndex = 0; rowIndex < rows.length; rowIndex++) {
                row = rows[rowIndex];
                if (!!row.dataset.json) {
                    options.push(JSON.parse(row.dataset.json));
                }
            }
            console.log("pollData", options);
            pollData = {
                title: titleElement.value,
                multi: multiElement.checked,
                captcha: captchaElement.checked,
                dupcheck: dupcheckElement.selectedOptions[0].value,
                options: options
            };
            fetch('/new/', {
                method: 'POST',
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(pollData)
            })
                .then(function (response) {
                console.log(response);
                if (response.ok && response.status === 201) {
                    response.json().then(function (json) {
                        if (json.success && !!json.poll_url) {
                            window.location.href = json.poll_url;
                        }
                    }).catch(function (reason) {
                        console.error(reason);
                    });
                }
            })
                .catch(function (err) {
                console.log(err);
            });
            return [2 /*return*/];
        });
    });
}
function updateConfigVar(input) {
    console.log("updateConfigVar", input);
    socket.emit('__update_configuration__', {
        plugin: input.dataset.plugin,
        name: input.name,
        checked: input.checked,
        value: input.value
    });
}
socket.on('__update_configuration_complete__', function (msg) {
    search();
});

"use strict";
const objectToQueryString = (obj) => Object.keys(obj)
    .map(key => `${encodeURIComponent(key)}=${encodeURIComponent(obj[key])}`)
    .join('&');
function toggleOpenResult(ev) {
    var _a;
    let row = ev.target.closest(".option_row");
    let content = row === null || row === void 0 ? void 0 : row.nextElementSibling;
    let iframe = (_a = content === null || content === void 0 ? void 0 : content.getElementsByTagName("iframe")) === null || _a === void 0 ? void 0 : _a.item(0);
    if (!!iframe) {
        if (iframe.src === "") {
            iframe.src = `/details?${objectToQueryString(JSON.parse(row.dataset.json))}`;
        }
        let opened = content.classList.toggle("open");
        if (opened) {
            iframe.style.height = window.innerHeight * 0.6 + "px";
        }
    }
}
const ErrorCodes = {
    DB_QUERY_FAILED: { level: "<i class='material-icons'>error_outline</i>", msg: "Database query failed" },
    PLUGIN_QUERY_FAILED: { level: "<i class='material-icons'>error_outline</i>", msg: "Plugin query failed" },
    STRAWPOLL_FAILED: { level: "<i class='material-icons'>error_outline</i>", msg: "Strawpoll API failed" },
    BAD_REQUEST: { level: "<i class='material-icons'>error_outline</i>", msg: "Bad request" },
    RESOURCE_NOT_FOUND: { level: "<i class='material-icons'>error_outline</i>", msg: "Resource not found" }
};
function ErrorHelper(errorCode) {
    var _a;
    if (ErrorCodes[errorCode] !== undefined) {
        let row = document.createElement("tr");
        row.innerHTML = `<td>${ErrorCodes[errorCode].level}</td><td>${ErrorCodes[errorCode].msg}</td>`;
        let deleteColumn = document.createElement("td");
        deleteColumn.innerHTML = "<i class='material-icons' style='cursor:pointer'>close</i>";
        deleteColumn.addEventListener("click", () => {
            var _a;
            (_a = deleteColumn.parentElement) === null || _a === void 0 ? void 0 : _a.remove();
        });
        row.appendChild(deleteColumn);
        (_a = document.getElementsByTagName("table").namedItem("information")) === null || _a === void 0 ? void 0 : _a.appendChild(row);
    }
}

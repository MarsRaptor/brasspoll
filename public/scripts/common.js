// @ts-check

/**
 * Convert object a query parameter URI string
 * @param {{ [x: string]: string | number | boolean; }} obj
 */
function objectToQueryString(obj) {
    return Object.keys(obj)
        .map(key => `${encodeURIComponent(key)}=${encodeURIComponent(obj[key])}`)
        .join('&');
}


/**
 * @param {{ target: { closest: (arg0: string) => HTMLTableRowElement | undefined; }; }} ev
 */
function toggleOpenResult(ev) {
    /** @type {HTMLTableRowElement | undefined} */
    let row = ev.target.closest(".option_row");
    let content = row?.nextElementSibling
    let iframe = content?.getElementsByTagName("iframe")?.item(0);
    if (!!iframe) {
        if (iframe.src === "") {
            iframe.src = `/details?${objectToQueryString(JSON.parse(row.dataset.json))}`
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


/**
 * @param {"DB_QUERY_FAILED"|"PLUGIN_QUERY_FAILED"|"STRAWPOLL_FAILED"|"BAD_REQUEST"|"RESOURCE_NOT_FOUND"| string} errorCode
 */
function ErrorHelper(errorCode) {
    if (ErrorCodes[errorCode] !== undefined) {
        let row = document.createElement("tr");
        row.innerHTML = `<td>${ErrorCodes[errorCode].level}</td><td>${ErrorCodes[errorCode].msg}</td>`;
        let deleteColumn = document.createElement("td");
        deleteColumn.innerHTML = "<i class='material-icons' style='cursor:pointer'>close</i>"
        deleteColumn.addEventListener("click", () => {
            deleteColumn.parentElement?.remove();
        })
        row.appendChild(deleteColumn);
        document.getElementsByTagName("table").namedItem("information")?.appendChild(row);
    }
}
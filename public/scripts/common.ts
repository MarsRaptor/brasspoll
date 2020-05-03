const objectToQueryString = (obj: any) =>
    Object.keys(obj)
        .map(key => `${encodeURIComponent(key)}=${encodeURIComponent(obj[key])}`)
        .join('&');

function toggleOpenResult(ev: any) {
    let row = ev.target.closest(".option_row") as HTMLTableRowElement | undefined;
    let content = row?.nextElementSibling
    let iframe = content?.getElementsByTagName("iframe")?.item(0);
    if (!!iframe) {
        if (iframe.src === "") {
            iframe.src = `/details?${objectToQueryString(JSON.parse(row!.dataset.json!))}`
        }
        let opened = content!.classList.toggle("open");
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


function ErrorHelper(errorCode: keyof typeof ErrorCodes): void
function ErrorHelper(errorCode: string): void {
    if ((ErrorCodes as any)[errorCode] !== undefined) {
        let row = document.createElement("tr");
        row.innerHTML = `<td>${(ErrorCodes as any)[errorCode].level}</td><td>${(ErrorCodes as any)[errorCode].msg}</td>`;
        let deleteColumn = document.createElement("td");
        deleteColumn.innerHTML = "<i class='material-icons' style='cursor:pointer'>close</i>"
        deleteColumn.addEventListener("click", () => {
            deleteColumn.parentElement?.remove();
        })
        row.appendChild(deleteColumn);
        document.getElementsByTagName("table").namedItem("information")?.appendChild(row);
    }
}
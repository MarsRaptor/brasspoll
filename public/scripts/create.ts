declare function io(): any;
const socket = io();

const searchElement = document.getElementsByTagName("input").namedItem("search")!;
const titleElement = document.getElementsByTagName("input").namedItem("title")!;
const dupcheckElement = document.getElementsByTagName("select").namedItem("dupcheck")!;
const captchaElement = document.getElementsByTagName("input").namedItem("captcha")!;
const multiElement = document.getElementsByTagName("input").namedItem("multi")!;
const searchResultsElement = document.getElementsByTagName("table").namedItem("results")!.querySelector("tbody")!;
const selectedOptionsElement = document.getElementsByTagName("table").namedItem("selected_options")!.querySelector("tbody")!;
const createPollElement = document.getElementsByTagName("input").namedItem("create_poll")!;


function parseHTML(html: string) {
    var t = document.createElement('template');
    t.innerHTML = html;
    return t.content.cloneNode(true);
}

function search() {
    searchResultsElement.innerHTML = "";
    socket.emit('__search__', searchElement.value);
}

socket.on('__search_results__', (msg: { search: string; content: string }) => {
    console.info(msg)
    if (msg.search == searchElement.value) {
        let temp = parseHTML(msg.content)
        if (temp) {
            searchResultsElement.appendChild(temp);
        }
    }
});

function checkPollCreateButton() {

    let rowCount = selectedOptionsElement.querySelectorAll("tr.option_row").length;
    createPollElement.disabled = (rowCount <= 0 || rowCount > 25) || !titleElement.value.trim().length;

}

function option_action(cell: HTMLTableCellElement, ev: MouseEvent) {
    ev.stopPropagation();
    let id = cell.closest("table")?.id
    let row = cell.closest("tr");
    let content = row?.nextElementSibling;
    let extra_row = content?.nextElementSibling;

    if (id !== undefined && !!row && !!content && !!extra_row) {

        if (id === "results") {

            selectedOptionsElement.append(row.cloneNode(true));
            selectedOptionsElement.append(content.cloneNode(true))
            selectedOptionsElement.append(extra_row.cloneNode(true))
            searchElement.value = "";
            search()

        } else if (id === "selected_options") {
            row.remove();
            content.remove();
            extra_row.remove();
        }

        checkPollCreateButton();

    }
}

async function create_poll() {
    let rows = selectedOptionsElement.querySelectorAll("tr.option_row") as NodeListOf<HTMLTableRowElement>;

    let options = []
    for (let rowIndex = 0; rowIndex < rows.length; rowIndex++) {
        const row = rows[rowIndex];
        if (!!row.dataset.json) {
            options.push(JSON.parse(row.dataset.json))
        }
    }

    console.debug("pollData", options)

    if (options.length > 0) {

        createPollElement.disabled = true;

        let pollData = {
            title: titleElement.value,
            multi: multiElement.checked,
            captcha: captchaElement.checked,
            dupcheck: dupcheckElement.selectedOptions[0].value,
            options: options
        }

        fetch('/new/', {
            method: 'POST',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(pollData)
        }).then(response => response.json())
            .catch(err => {
                console.error(err);                
                checkPollCreateButton();
            })
            .then(json => {
                console.debug(json);
                if (json.ok && json.status === 201 && json.success && !!json.poll_url) {
                    window.location.href = json.poll_url
                } else{
                    ErrorHelper(json.errorCode);
                    checkPollCreateButton();
                }
            })
            .catch(err => {
                console.error(err);
                checkPollCreateButton();
            })
    }

}


function updateConfigVar(input: HTMLInputElement) {
    console.debug("updateConfigVar", input);
    socket.emit('__update_configuration__', {
        plugin: input.dataset.plugin,
        name: input.name,
        checked: input.checked,
        value: input.value
    });

}

socket.on('__update_configuration_complete__', (msg: any) => {
    search();
});

searchElement.addEventListener("search", search);
titleElement.addEventListener("keyup", checkPollCreateButton);

checkPollCreateButton();

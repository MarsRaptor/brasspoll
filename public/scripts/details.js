// @ts-check

function copyStrawpollUrlToClipboard() {
    /* Get the text field */
    /** @type {HTMLInputElement | null}*/
    const copyText = document.getElementsByTagName("input").namedItem("strawpoll_url");
    if (!!copyText) {
        /* Select the text field */
        copyText.select();
        copyText.setSelectionRange(0, 99999); /*For mobile devices*/

        /* Copy the text inside the text field */
        if (document.execCommand("copy")) {
            let button = (/** @type {HTMLInputElement} */(copyText.nextElementSibling));
            button.value = "Copied to clipboard";
            setTimeout(() => {
                button.value = "Copy to clipboard";
            }, 2000);
        }
    }

}
function copyBrasspollUrlToClipboard() {
    /* Get the text field */
    /** @type {HTMLInputElement | null}*/
    const copyText = document.getElementsByTagName("input").namedItem("brasspoll_url");

    if (!!copyText) {
        /* Select the text field */
        copyText.select();
        copyText.setSelectionRange(0, 99999); /*For mobile devices*/

        /* Copy the text inside the text field */
        if (document.execCommand("copy")) {
            let button = (/** @type {HTMLInputElement} */(copyText.nextElementSibling));
            button.value = "Copied to clipboard";
            setTimeout(() => {
                button.value = "Copy to clipboard";
            }, 2000);
        }
    }
}

/**
 * @param {HTMLIFrameElement} iframe
 */
function resizeStrawpoll(iframe) {
    iframe.style.height = window.innerHeight * 0.6 + "px";
}

document.getElementsByTagName("input").namedItem("brasspoll_url").value = window.location.href;

document.onkeyup = function (evt) {
    if (evt.key.toLowerCase() == "c" && evt.altKey) {
        const holder = document.createElement("input");
        const strawpoll_url = document.getElementsByTagName("input").namedItem("strawpoll_url").value;
        const brasspoll_url = document.getElementsByTagName("input").namedItem("brasspoll_url").value;
        holder.type = "text";
        holder.value = `${strawpoll_url} ${brasspoll_url}`;
        //holder.style.display = "none";
        document.body.append(holder);

        holder.select();
        holder.setSelectionRange(0, 99999); /*For mobile devices*/
        /* Copy the text inside the text field */
        document.execCommand("copy");
        setTimeout(() => {
            holder.remove();
        }, 100);
    }
}
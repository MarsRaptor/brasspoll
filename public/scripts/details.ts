function copyStrawpollUrlToClipboard() {
    /* Get the text field */
    var copyText = document.getElementById("strawpoll_url") as HTMLInputElement | null;
    if (!!copyText) {
        /* Select the text field */
        copyText.select();
        copyText.setSelectionRange(0, 99999); /*For mobile devices*/

        /* Copy the text inside the text field */
        if (document.execCommand("copy")) {
            let button = copyText!.nextElementSibling as HTMLInputElement;
            button!.value = "Copied to clipboard";
            setTimeout(() => {
                button!.value = "Copy to clipboard";
            }, 2000);
        }
    }

}
function copyBrasspollUrlToClipboard() {
    /* Get the text field */
    var copyText = document.getElementById("brasspoll_url") as HTMLInputElement | null;

    if (!!copyText) {
        /* Select the text field */
        copyText.select();
        copyText.setSelectionRange(0, 99999); /*For mobile devices*/

        /* Copy the text inside the text field */
        if (document.execCommand("copy")) {
            let button = copyText!.nextElementSibling as HTMLInputElement;
            button!.value = "Copied to clipboard";
            setTimeout(() => {
                button!.value = "Copy to clipboard";
            }, 2000);
        }
    }
}

function resizeStrawpoll(iframe: HTMLIFrameElement) {
    iframe.style.height = window.innerHeight * 0.6 + "px";
}

document.getElementsByTagName("input").namedItem("brasspoll_url")!.value = window.location.href;

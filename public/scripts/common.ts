const objectToQueryString = (obj: any) =>
    Object.keys(obj)
        .map(key => `${encodeURIComponent(key)}=${encodeURIComponent(obj[key])}`)
        .join('&');
        
function toggleOpenResult(ev: any) {
    console.log(ev)
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
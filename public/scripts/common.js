"use strict";
var objectToQueryString = function (obj) {
    return Object.keys(obj)
        .map(function (key) { return encodeURIComponent(key) + "=" + encodeURIComponent(obj[key]); })
        .join('&');
};
function toggleOpenResult(ev) {
    var _a;
    console.log(ev);
    var row = ev.target.closest(".option_row");
    var content = row === null || row === void 0 ? void 0 : row.nextElementSibling;
    var iframe = (_a = content === null || content === void 0 ? void 0 : content.getElementsByTagName("iframe")) === null || _a === void 0 ? void 0 : _a.item(0);
    if (!!iframe) {
        if (iframe.src === "") {
            iframe.src = "/details?" + objectToQueryString(JSON.parse(row.dataset.json));
        }
        var opened = content.classList.toggle("open");
        if (opened) {
            iframe.style.height = window.innerHeight * 0.6 + "px";
        }
    }
}

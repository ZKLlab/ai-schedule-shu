// noinspection JSUnusedGlobalSymbols
/**
 * scheduleHtmlProvider入口函数
 * @return {string}
 */
function scheduleHtmlProvider() {
    if (location.host !== 'xk.autoisp.shu.edu.cn:8084') {
        throw new Error('当前不在xk.autoisp.shu.edu.cn:8084域内');
    }
    return _desensitization(_getContainerElement()).innerHTML;
}
function _getContainerElement() {
    var containerEl = document.querySelector('body > div.wrapper > div.content-wrapper > div.content > div > table > tbody > tr:nth-child(2) > td');
    if (location.pathname === '/StudentQuery/QueryCourseTable' && containerEl != null) {
        return containerEl.cloneNode(true);
    }
    return _fallbackHtmlProvider();
}
function _fallbackHtmlProvider() {
    var doc = _xhrFetchDocument('GET', '/StudentQuery/QueryCourseTable');
    var containerEl = doc.querySelector('body > div.wrapper > div.content-wrapper > div.content > div > table > tbody > tr:nth-child(2) > td');
    if (containerEl == null) {
        throw new Error('无法解析回退请求的响应');
    }
    return containerEl;
}
function _xhrFetchDocument(method, url, data) {
    var xhr = new XMLHttpRequest();
    xhr.open(method, url, false);
    if (method === 'POST') {
        xhr.setRequestHeader('Content-type', 'application/x-www-form-urlencoded');
        xhr.send(data);
    }
    else {
        xhr.send();
    }
    return new DOMParser().parseFromString(xhr.responseText, 'text/html');
}
function _desensitization(el) {
    var _a, _b;
    (_b = (_a = el.querySelector('td:only-child')) === null || _a === void 0 ? void 0 : _a.parentElement) === null || _b === void 0 ? void 0 : _b.remove();
    el.querySelectorAll('tr,th,td').forEach(function (tEl) {
        tEl.removeAttribute('style');
    });
    return el;
}

// noinspection JSUnusedGlobalSymbols
/**
 * scheduleHtmlProvider入口函数
 * @return {string}
 */
function scheduleHtmlProvider() {
    if (location.hostname !== 'cj.shu.edu.cn') {
        throw new Error('当前不在cj.shu.edu.cn域内');
    }
    return _desensitization(_getContainerElement()).innerHTML;
}
function _getContainerElement() {
    var _a, _b;
    var containerEl = document.querySelector('#divEditPostponeApply');
    if (location.pathname === '/StudentPortal/StudentSchedule' && containerEl != null) {
        var containerElCopied = containerEl.cloneNode(true);
        var termId = (_a = document.querySelector('#AcademicTermID')) === null || _a === void 0 ? void 0 : _a.value;
        if (termId != null) {
            (_b = containerElCopied.querySelector('table')) === null || _b === void 0 ? void 0 : _b.setAttribute('data-term-id', termId);
        }
        return containerElCopied;
    }
    return _fallbackHtmlProvider();
}
function _fallbackHtmlProvider() {
    var _a;
    var doc1 = _xhrFetchDocument('GET', '/StudentPortal/StudentSchedule');
    var termIdOptionEl = doc1.querySelector('#AcademicTermID option[selected]');
    if (termIdOptionEl == null) {
        throw new Error('无法解析回退请求1的响应');
    }
    var termId = termIdOptionEl.value;
    var doc2 = _xhrFetchDocument('POST', '/StudentPortal/CtrlStudentSchedule', "academicTermID=" + termId);
    var containerEl = doc2.querySelector('#divEditPostponeApply');
    if (containerEl == null) {
        throw new Error('无法解析回退请求2的响应');
    }
    (_a = containerEl.querySelector('table')) === null || _a === void 0 ? void 0 : _a.setAttribute('data-term-id', termId);
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
    (_b = (_a = el.querySelector('th:only-child')) === null || _a === void 0 ? void 0 : _a.parentElement) === null || _b === void 0 ? void 0 : _b.remove();
    el.querySelectorAll('tr,th,td').forEach(function (tEl) {
        if (tEl.style.display === 'none') {
            tEl.remove();
        }
    });
    return el;
}

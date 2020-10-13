// noinspection JSUnusedGlobalSymbols
/**
 * scheduleHtmlProvider入口函数
 * @return {string}
 */
function scheduleHtmlProvider(): string {
  if (location.hostname !== 'cj.shu.edu.cn') {
    throw new Error('当前不在cj.shu.edu.cn域内');
  }
  return _desensitization(_getContainerElement()).innerHTML;
}


function _getContainerElement(): HTMLDivElement {
  const containerEl = document.querySelector<HTMLDivElement>('#divEditPostponeApply');
  if (location.pathname === '/StudentPortal/StudentSchedule' && containerEl != null) {
    const containerElCopied = containerEl.cloneNode(true) as HTMLDivElement;
    const termId = document.querySelector<HTMLSelectElement>('#AcademicTermID')?.value;
    if (termId != null) {
      containerElCopied.querySelector('table')?.setAttribute('data-term-id', termId);
    }
    return containerElCopied;
  }
  return _fallbackHtmlProvider();
}

function _fallbackHtmlProvider(): HTMLDivElement {
  const doc1 = _xhrFetchDocument('GET', '/StudentPortal/StudentSchedule');
  const termIdOptionEl = doc1.querySelector<HTMLOptionElement>('#AcademicTermID option[selected]');
  if (termIdOptionEl == null) {
    throw new Error('无法解析回退请求1的响应');
  }
  const termId = termIdOptionEl.value;
  const doc2 = _xhrFetchDocument('POST', '/StudentPortal/CtrlStudentSchedule', `academicTermID=${termId}`);
  const containerEl = doc2.querySelector<HTMLDivElement>('#divEditPostponeApply');
  if (containerEl == null) {
    throw new Error('无法解析回退请求2的响应');
  }
  containerEl.querySelector('table')?.setAttribute('data-term-id', termId);
  return containerEl;
}

function _xhrFetchDocument(method: 'GET' | 'POST', url: string, data?: string): Document {
  const xhr = new XMLHttpRequest();
  xhr.open(method, url, false);
  if (method === 'POST') {
    xhr.setRequestHeader('Content-type', 'application/x-www-form-urlencoded');
    xhr.send(data);
  } else {
    xhr.send();
  }
  return new DOMParser().parseFromString(xhr.responseText, 'text/html');
}

function _desensitization(el: HTMLDivElement): HTMLDivElement {
  el.querySelector('th:only-child')?.parentElement?.remove();
  el.querySelectorAll<HTMLElement>('tr,th,td').forEach(tEl => {
    if (tEl.style.display === 'none') {
      tEl.remove();
    }
  });
  return el;
}

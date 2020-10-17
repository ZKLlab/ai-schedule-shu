// noinspection JSUnusedGlobalSymbols
/**
 * scheduleHtmlProvider入口函数
 * @return {string}
 */
function scheduleHtmlProvider(): string {
  if (location.host !== 'xk.autoisp.shu.edu.cn:8084') {
    throw new Error('当前不在xk.autoisp.shu.edu.cn:8084域内');
  }
  return _desensitization(_getContainerElement()).innerHTML;
}


function _getContainerElement(): HTMLDivElement {
  const containerEl = document.querySelector<HTMLTableColElement>('body > div.wrapper > div.content-wrapper > div.content > div > table > tbody > tr:nth-child(2) > td');
  if (location.pathname === '/StudentQuery/QueryCourseTable' && containerEl != null) {
    return containerEl.cloneNode(true) as HTMLDivElement;
  }
  return _fallbackHtmlProvider();
}

function _fallbackHtmlProvider(): HTMLDivElement {
  const doc = _xhrFetchDocument('GET', '/StudentQuery/QueryCourseTable');
  const containerEl = doc.querySelector<HTMLTableColElement>('body > div.wrapper > div.content-wrapper > div.content > div > table > tbody > tr:nth-child(2) > td');
  if (containerEl == null) {
    throw new Error('无法解析回退请求的响应');
  }
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
  el.querySelector('td:only-child')?.parentElement?.remove();
  el.querySelectorAll<HTMLElement>('tr,th,td').forEach(tEl => {
    tEl.removeAttribute('style');
  });
  return el;
}

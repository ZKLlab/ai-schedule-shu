import Cheerio = cheerio.Cheerio;
import Root = cheerio.Root;


declare const $: Root;

interface Section {
  section: number;
  startTime?: string;
  endTime?: string;
}

interface CourseInfo {
  name: string;
  position: string;
  teacher: string;
  weeks: number[];
  day: number;
  sections: Section[];
}

interface SectionTime {
  section: number;
  startTime: string;
  endTime: string;
}

interface ParserResult {
  courseInfos: CourseInfo[];
  sectionTimes: SectionTime[];
}

// noinspection JSUnusedGlobalSymbols
/**
 * scheduleHtmlParser入口函数
 * @return {sectionTimes: SectionTime[], courseInfos: CourseInfo[]}
 */
function scheduleHtmlParser(): ParserResult {
  const sectionTimes = _getSectionTimes();
  // const isShortTerm = ($('table').attr('data-term-id') || '').endsWith('5');
  const isShortTerm = false;
  const courseInfos: CourseInfo[] = [];
  let indexes: number[] | undefined;
  $('tr').each((_, element) => {
    if (indexes == null) {
      indexes = _tryGetIndexes($(element));
    } else {
      const colContents = _getColContentsFromRow($(element));
      if (colContents.length >= Math.max(...indexes)) {
        courseInfos.push(..._toCourseInfos(
          colContents[indexes[0]],
          colContents[indexes[1]],
          colContents[indexes[3]],
          _getPeriods(colContents[indexes[2]], indexes[4] >= 0 ? colContents[indexes[4]] : '', isShortTerm),
        ));
      }
    }
  });
  return {
    courseInfos,
    sectionTimes,
  };
}


interface _ClassPeriod {
  weekPattern: number;
  day: number;
  sections: number[];
}

function _tryGetIndexes(tr: Cheerio): number[] | undefined {
  const colContents: string[] = [];
  tr.find('th').each((_, element) => {
    if ($(element).css('display') !== 'none') {
      colContents.push($(element).text().trim());
    }
  });
  const indexes = ['课程名称', '教师姓名', '上课时间', '上课地点', '上课日期'].map(value => colContents.indexOf(value));
  if (Math.min(...indexes.slice(0, -1)) >= 0) {
    return indexes;
  }
}

function _getColContentsFromRow(tr: Cheerio): string[] {
  const result: string[] = [];
  tr.find('td').each((_, element) => {
    result.push(_sanitizeText($(element).text()));
  });
  return result;
}

function _toCourseInfos(name: string, teacher: string, position: string, periods: _ClassPeriod[]): CourseInfo[] {
  return periods.map(period => ({
    name,
    teacher,
    position,
    day: period.day,
    weeks: _toWeekArray(period.weekPattern),
    sections: period.sections.map(section => ({
      section,
    })),
  }));
}

function _getPeriods(rawTimeText: string, rawDateText: string, isShortTerm: boolean): _ClassPeriod[] {
  const periods: _ClassPeriod[] = [];
  const globalWeekPatterns = _getWeekPatternsFromDateText(rawDateText, isShortTerm ? 4 : 10);
  rawTimeText = rawTimeText.replace(/、/ig, ',');
  const weekRegExp = /\((?<week>[^(]*?\d+(?:\s*[-,]\s*\d+)?周[^(]*?)\)/ig;
  let weekRes: RegExpExecArray | null = null;
  let startIndex = 0;
  while ((weekRes = weekRegExp.exec(rawTimeText)) != null && weekRes.groups != null) {
    const { groups: { week } } = weekRes;
    const classPeriods = _getClassPeriodsFromTimeTextPart(rawTimeText.slice(startIndex, weekRegExp.lastIndex));
    const weekPattern = _getWeekPatternFromWeekText(week);
    startIndex = weekRegExp.lastIndex;
    classPeriods.forEach(classPeriod => {
      classPeriod.weekPattern &= weekPattern;
    });
    periods.push(...classPeriods);
  }
  periods.push(..._getClassPeriodsFromTimeTextPart(rawTimeText.slice(startIndex)));
  periods.forEach(period => {
    period.weekPattern &= globalWeekPatterns[period.day - 1];
  });
  return periods;
}

function _getWeekPatternsFromDateText(rawDateText: string, weeksNum: number): number[] {
  const datePattern = /(?<mFrom>\d+)月(?<dFrom>\d+)日?至(?<mTo>\d+)月(?<dTo>\d+)日?/i;
  const dateRes = datePattern.exec(rawDateText);
  if (dateRes != null && dateRes.groups != null) {
    const { groups: { mFrom, dFrom, mTo, dTo } } = dateRes;
    const [monthFrom, dateFrom, monthTo, dateTo] = [mFrom, dFrom, mTo, dTo].map(value => parseInt(value, 10));
    const from = new Date(2020, monthFrom - 1, dateFrom);
    const to = new Date(2020, monthTo - 1, dateTo);
    if (to >= from && from >= new Date(2020, 8, 7) && to < new Date(2020, 10, 30)) {
      const base = new Date(2020, 8, 7);
      const fromDays = Math.round((from.getTime() - base.getTime()) / 1000 / 3600 / 24);
      const toDays = Math.round((to.getTime() - base.getTime()) / 1000 / 3600 / 24);
      const dayStart = fromDays % 7;
      const dayEnd = toDays % 7;
      const weekStart = Math.floor(fromDays / 7);
      const weekEnd = Math.floor(toDays / 7);
      const weekPattern = (0x1 << weekEnd - weekStart) - 0x1 << weekStart;
      return [0, 1, 2, 3, 4].map(i => {
        let result = weekPattern;
        if (i < dayStart) {
          result &= ~(0x1 << weekStart);
        }
        if (i <= dayEnd) {
          result |= 0x1 << weekEnd;
        }
        return result;
      });
    }
  }
  const defaultPattern = (0x1 << weeksNum) - 1;
  return [defaultPattern, defaultPattern, defaultPattern, defaultPattern, defaultPattern];
}

function _getWeekPatternFromWeekText(weekText: string): number {
  let result = 0x0;
  const weekRegExp = /(?<num1>\d+)(?:\s*(?<connector>[-,])\s*(?<num2>\d+))?周/ig;
  let weekRes: RegExpExecArray | null;
  while ((weekRes = weekRegExp.exec(weekText)) != null && weekRes.groups != null) {
    const { groups: { num1, connector, num2 } } = weekRes;
    const from = parseInt(num1);
    const to = parseInt(num2);
    if (connector === '-') {
      if (to >= from) {
        result |= (0x1 << to - from + 1) - 0x1 << from - 1;
      }
    } else if (connector === ',') {
      result |= 0x1 << from - 1 | 0x1 << to - 1;
    } else {
      result |= 0x1 << from - 1;
    }
  }
  return result === 0x0 ? 0xffffff : result;
}

function _getClassPeriodsFromTimeTextPart(timeTextPart: string): _ClassPeriod[] {
  const periods: _ClassPeriod[] = [];
  const classTimeRxp = /(?<day>[一二三四五])(?<from>\d+)(?:-(?<to>\d+))?(?<oddEven>[单双])?/ig;
  let classTimeRes: RegExpExecArray | null = null;
  while ((classTimeRes = classTimeRxp.exec(timeTextPart)) != null && classTimeRes.groups != null) {
    const { groups: { day, from, to, oddEven } } = classTimeRes;
    periods.push({
      weekPattern: oddEven === '单' ? 0x555555 : oddEven === '双' ? 0xaaaaaa : 0xffffff,
      day: ['一', '二', '三', '四', '五'].indexOf(day) + 1,
      sections: _getRange(parseInt(from, 10), to != null ? parseInt(to, 10) : undefined),
    });
  }
  return periods;
}

function _toWeekArray(weekPattern: number) {
  const result = [];
  for (let i = 1; weekPattern > 0; i++) {
    if ((weekPattern & 0x1) === 0x1) {
      result.push(i);
    }
    weekPattern >>>= 1;
  }
  return result;
}

function _getSectionTimes(): SectionTime[] {
  return [
    ['8:00', '8:45'],
    ['8:55', '9:40'],
    ['10:00', '10:45'],
    ['10:55', '11:40'],
    ['12:10', '12:55'],
    ['13:05', '13:50'],
    ['14:10', '14:55'],
    ['15:05', '15:50'],
    ['16:00', '16:45'],
    ['16:55', '17:40'],
    ['18:00', '18:45'],
    ['18:55', '19:40'],
    ['19:50', '20:35'],
  ].map((period, index) => ({
    section: index + 1,
    startTime: period[0],
    endTime: period[1],
  }));
}

function _getRange(start: number, end?: number): number[] {
  const result = [];
  for (let i = start; i <= (end != null ? end : start); i++) {
    result.push(i);
  }
  return result;
}

function _sanitizeText(text: string): string {
  return text
    .replace(/[\uff01-\uff5e]/ig, char => String.fromCharCode(char.charCodeAt(0) - 0xfee0))
    .replace(/\s+/igm, ' ')
    .trim();
}

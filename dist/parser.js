// noinspection JSUnusedGlobalSymbols
/**
 * scheduleHtmlParser入口函数
 * @return {sectionTimes: SectionTime[], courseInfos: CourseInfo[]}
 */
function scheduleHtmlParser() {
    var sectionTimes = _getSectionTimes();
    // const isShortTerm = ($('table').attr('data-term-id') || '').endsWith('5');
    var isShortTerm = false;
    var courseInfos = [];
    var indexes;
    $('tr').each(function (_, element) {
        if (indexes == null) {
            indexes = _tryGetIndexes($(element));
        }
        else {
            var colContents = _getColContentsFromRow($(element));
            if (colContents.length >= Math.max.apply(Math, indexes)) {
                courseInfos.push.apply(courseInfos, _toCourseInfos(colContents[indexes[0]], colContents[indexes[1]], colContents[indexes[3]], _getPeriods(colContents[indexes[2]], indexes[4] >= 0 ? colContents[indexes[4]] : '', isShortTerm)));
            }
        }
    });
    return {
        courseInfos: courseInfos,
        sectionTimes: sectionTimes,
    };
}
function _tryGetIndexes(tr) {
    var colContents = [];
    tr.find('th').each(function (_, element) {
        if ($(element).css('display') !== 'none') {
            colContents.push($(element).text().trim());
        }
    });
    var indexes = ['课程名称', '教师姓名', '上课时间', '上课教室', '上课日期'].map(function (value) { return colContents.indexOf(value); });
    if (Math.min.apply(Math, indexes.slice(0, -1)) >= 0) {
        return indexes;
    }
}
function _getColContentsFromRow(tr) {
    var result = [];
    tr.find('td').each(function (_, element) {
        result.push(_sanitizeText($(element).text()));
    });
    return result;
}
function _toCourseInfos(name, teacher, position, periods) {
    return periods.map(function (period) { return ({
        name: name,
        teacher: teacher,
        position: position,
        day: period.day,
        weeks: _toWeekArray(period.weekPattern),
        sections: period.sections.map(function (section) { return ({
            section: section,
        }); }),
    }); });
}
function _getPeriods(rawTimeText, rawDateText, isShortTerm) {
    var periods = [];
    var globalWeekPatterns = _getWeekPatternsFromDateText(rawDateText, isShortTerm ? 4 : 10);
    rawTimeText = rawTimeText.replace(/、/ig, ',');
    var weekRegExp = /\((?<week>[^(]*?\d+(?:\s*[-,]\s*\d+)?周[^(]*?)\)/ig;
    var weekRes = null;
    var startIndex = 0;
    var _loop_1 = function () {
        var week = weekRes.groups.week;
        var classPeriods = _getClassPeriodsFromTimeTextPart(rawTimeText.slice(startIndex, weekRegExp.lastIndex));
        var weekPattern = _getWeekPatternFromWeekText(week);
        startIndex = weekRegExp.lastIndex;
        classPeriods.forEach(function (classPeriod) {
            classPeriod.weekPattern &= weekPattern;
        });
        periods.push.apply(periods, classPeriods);
    };
    while ((weekRes = weekRegExp.exec(rawTimeText)) != null && weekRes.groups != null) {
        _loop_1();
    }
    periods.push.apply(periods, _getClassPeriodsFromTimeTextPart(rawTimeText.slice(startIndex)));
    periods.forEach(function (period) {
        period.weekPattern &= globalWeekPatterns[period.day - 1];
    });
    return periods;
}
function _getWeekPatternsFromDateText(rawDateText, weeksNum) {
    var datePattern = /(?<mFrom>\d+)月(?<dFrom>\d+)日?至(?<mTo>\d+)月(?<dTo>\d+)日?/i;
    var dateRes = datePattern.exec(rawDateText);
    if (dateRes != null && dateRes.groups != null) {
        var _a = dateRes.groups, mFrom = _a.mFrom, dFrom = _a.dFrom, mTo = _a.mTo, dTo = _a.dTo;
        var _b = [mFrom, dFrom, mTo, dTo].map(function (value) { return parseInt(value, 10); }), monthFrom = _b[0], dateFrom = _b[1], monthTo = _b[2], dateTo = _b[3];
        var from = new Date(2020, monthFrom - 1, dateFrom);
        var to = new Date(2020, monthTo - 1, dateTo);
        if (to >= from && from >= new Date(2020, 8, 7) && to < new Date(2020, 10, 30)) {
            var base = new Date(2020, 8, 7);
            var fromDays = Math.round((from.getTime() - base.getTime()) / 1000 / 3600 / 24);
            var toDays = Math.round((to.getTime() - base.getTime()) / 1000 / 3600 / 24);
            var dayStart_1 = fromDays % 7;
            var dayEnd_1 = toDays % 7;
            var weekStart_1 = Math.floor(fromDays / 7);
            var weekEnd_1 = Math.floor(toDays / 7);
            var weekPattern_1 = (0x1 << weekEnd_1 - weekStart_1) - 0x1 << weekStart_1;
            return [0, 1, 2, 3, 4].map(function (i) {
                var result = weekPattern_1;
                if (i < dayStart_1) {
                    result &= ~(0x1 << weekStart_1);
                }
                if (i <= dayEnd_1) {
                    result |= 0x1 << weekEnd_1;
                }
                return result;
            });
        }
    }
    var defaultPattern = (0x1 << weeksNum) - 1;
    return [defaultPattern, defaultPattern, defaultPattern, defaultPattern, defaultPattern];
}
function _getWeekPatternFromWeekText(weekText) {
    var result = 0x0;
    var weekRegExp = /(?<num1>\d+)(?:\s*(?<connector>[-,])\s*(?<num2>\d+))?周/ig;
    var weekRes;
    while ((weekRes = weekRegExp.exec(weekText)) != null && weekRes.groups != null) {
        var _a = weekRes.groups, num1 = _a.num1, connector = _a.connector, num2 = _a.num2;
        var from = parseInt(num1);
        var to = parseInt(num2);
        if (connector === '-') {
            if (to >= from) {
                result |= (0x1 << to - from + 1) - 0x1 << from - 1;
            }
        }
        else if (connector === ',') {
            result |= 0x1 << from - 1 | 0x1 << to - 1;
        }
        else {
            result |= 0x1 << from - 1;
        }
    }
    return result === 0x0 ? 0xffffff : result;
}
function _getClassPeriodsFromTimeTextPart(timeTextPart) {
    var periods = [];
    var classTimeRxp = /(?<day>[一二三四五])(?<from>\d+)(?:-(?<to>\d+))?(?<oddEven>[单双])?/ig;
    var classTimeRes = null;
    while ((classTimeRes = classTimeRxp.exec(timeTextPart)) != null && classTimeRes.groups != null) {
        var _a = classTimeRes.groups, day = _a.day, from = _a.from, to = _a.to, oddEven = _a.oddEven;
        periods.push({
            weekPattern: oddEven === '单' ? 0x555555 : oddEven === '双' ? 0xaaaaaa : 0xffffff,
            day: ['一', '二', '三', '四', '五'].indexOf(day) + 1,
            sections: _getRange(parseInt(from, 10), to != null ? parseInt(to, 10) : undefined),
        });
    }
    return periods;
}
function _toWeekArray(weekPattern) {
    var result = [];
    for (var i = 1; weekPattern > 0; i++) {
        if ((weekPattern & 0x1) === 0x1) {
            result.push(i);
        }
        weekPattern >>>= 1;
    }
    return result;
}
function _getSectionTimes() {
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
    ].map(function (period, index) { return ({
        section: index + 1,
        startTime: period[0],
        endTime: period[1],
    }); });
}
function _getRange(start, end) {
    var result = [];
    for (var i = start; i <= (end != null ? end : start); i++) {
        result.push(i);
    }
    return result;
}
function _sanitizeText(text) {
    return text
        .replace(/[\uff01-\uff5e]/ig, function (char) { return String.fromCharCode(char.charCodeAt(0) - 0xfee0); })
        .replace(/\s+/igm, ' ')
        .trim();
}

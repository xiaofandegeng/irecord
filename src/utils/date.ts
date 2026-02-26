import dayjs from 'dayjs'

/**
 * 获取自定义账单月的起止时间范围 (毫秒时间戳)
 * @param date 参考所在月的一个日期 (Date对象、字符串或时间戳)
 * @param startDay 每月账单的起始日 (1-28)
 * @returns { start: number, end: number }
 */
export function getCustomBillingMonthRange(date: Date | string | number, startDay: number) {
    const d = dayjs(date)
    const currentDay = d.date()

    let startMonthDate
    if (currentDay >= startDay) {
        // Current billing month starts in the current calendar month
        startMonthDate = d.date(startDay).startOf('day')
    } else {
        // Current billing month starts in the previous calendar month
        startMonthDate = d.subtract(1, 'month').date(startDay).startOf('day')
    }

    // End date is start date + 1 month - 1 millisecond
    const endMonthDate = startMonthDate.add(1, 'month').subtract(1, 'millisecond')

    return {
        start: startMonthDate.valueOf(),
        end: endMonthDate.valueOf()
    }
}

/**
 * 判断目标日期是否在自定义账单月内
 */
export function isDateInCustomBillingMonth(
    targetDate: Date | string | number,
    referenceDate: Date | string | number,
    startDay: number
) {
    const { start, end } = getCustomBillingMonthRange(referenceDate, startDay)
    const t = dayjs(targetDate).valueOf()
    return t >= start && t <= end
}

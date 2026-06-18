declare module 'flatpickr' {
  interface Options {
    altFormat?: string;
    altInput?: boolean;
    altInputClass?: string;
    allowInput?: boolean;
    allowInvalidPreload?: boolean;
    appendTo?: HTMLElement | string;
    ariaDateFormat?: string;
    autoFillDefaultTime?: boolean;
    clickOpens?: boolean;
    closeOnSelect?: boolean;
    conjunction?: string;
    dateFormat?: string;
    defaultDate?: Date | string | Date[] | string[];
    defaultHour?: number;
    defaultMinute?: number;
    defaultSeconds?: number;
    disable?: Date[] | ((date: Date) => boolean) | any[];
    disableMobile?: boolean;
    enable?: Date[] | ((date: Date) => boolean) | any[];
    enableTime?: boolean;
    errorHandler?: (error: Error) => void;
    formatDate?: (date: Date, format: string) => string;
    getWeek?: (date: Date) => number;
    hourIncrement?: number;
    ignoredFocusElements?: HTMLElement[];
    inline?: boolean;
    locale?: Locale;
    maxDate?: Date | string;
    maxTime?: string;
    minDate?: Date | string;
    minTime?: string;
    minuteIncrement?: number;
    mode?: 'single' | 'multiple' | 'range' | 'time';
    monthSelectorType?: 'dropdown' | 'static';
    nextArrow?: string;
    noCalendar?: boolean;
    now?: Date | string;
    onChange?: (selectedDates: Date[], dateStr: string, instance: Instance) => void;
    onClose?: (selectedDates: Date[], dateStr: string, instance: Instance) => void;
    onDayCreate?: (dObj: Date, dStr: string, fp: Instance, dayElem: HTMLElement) => void;
    onKeyDown?: (e: KeyboardEvent, self: Instance, hotkey: string) => void | false;
    onMonthChange?: (selectedDates: Date[], dateStr: string, instance: Instance) => void;
    onOpen?: (selectedDates: Date[], dateStr: string, instance: Instance) => void;
    onParseConfig?: (parsedConfig: Options) => Options;
    onReady?: (selectedDates: Date[], dateStr: string, instance: Instance) => void;
    onValueUpdate?: (selectedDates: Date[], dateStr: string, instance: Instance) => void;
    onYearChange?: (selectedDates: Date[], dateStr: string, instance: Instance) => void;
    parseDate?: (date: Date | string, format: string) => Date;
    plugins?: any[];
    position?: 'auto' | 'above' | 'below';
    positionElement?: HTMLElement;
    prevArrow?: string;
    shorthandCurrentMonth?: boolean;
    showMonths?: number;
    static?: boolean;
    time_24hr?: boolean;
    weekNumbers?: boolean;
    wrap?: boolean;
  }

  interface Locale {
    firstDayOfWeek?: number;
    rangeSeparator?: string;
    [key: string]: any;
  }

  interface Instance {
    close(): void;
    destroy(): void;
    open(): void;
    redraw(): void;
    set(date: Date | string | Date[] | string[], triggerChange?: boolean): void;
    setDate(date: Date | string | Date[] | string[], triggerChange?: boolean): void;
    jumpToDate(date: Date | string): void;
    clear(triggerChange?: boolean): void;
    parseDate(date: Date | string, format: string): Date;
    formatDate(date: Date, format: string): string;
    selectedDates: Date[];
    config: Options;
    calendarContainer: HTMLElement;
    input: HTMLElement;
    altInput: HTMLElement;
    element: HTMLElement;
  }

  type flatpickrFn = (
    selector: HTMLElement | string,
    config?: Options
  ) => Instance;

  const flatpickr: flatpickrFn;
  export default flatpickr;
}

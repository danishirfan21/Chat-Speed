export const MESSAGE_TYPES = {
    GET_STATE: 'getState',
    TOGGLE: 'toggle',
    ENABLE: 'enable',
    DISABLE: 'disable',
    METRICS_UPDATE: 'METRICS_UPDATE',
    METRICS_RESET: 'METRICS_RESET',
    GET_TAB_ID: 'GET_TAB_ID',
    POPUP_OPEN: 'POPUP_OPEN',
    POPUP_CLOSE: 'POPUP_CLOSE',
    IS_POPUP_OPEN: 'IS_POPUP_OPEN',
} as const;

export const PAGE_EVENT_TYPES = {
    TOGGLE: 'chatspeed-toggle',
} as const;
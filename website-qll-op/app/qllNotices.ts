export const QLL_NOTICE_SESSION_COOKIE = "qll_notice_session";
export const QLL_NOTICE_PAGE_SIZE = 20;
export const QLL_NOTICE_MAX_BYTES = 1_024;
export const QLL_NOTICE_EVENT = "qll-notice";

export type QllNotice = {
  id: number;
  sender: string;
  body: string;
  created_at: string;
  read_at: string | null;
};

// we might want to leave this up to the server

const settings = {
  session_expire_hours: 24 * 365,
  refresh_expire_hours: 24 * 7,
  access_expire_minutes_browser: 10,
  access_expire_minutes_api: 60 * 3,
};
export default settings;

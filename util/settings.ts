// we might want to leave this up to the server

const settings = {
  session_expire_hours: 24 * 60,
  refresh_expire_hours: 24 * 3,
  access_expire_minutes: 0.3,
};
export default settings;

// at the moment 1 day seems sensible since refresh tokens are
// only kept in memory. But if we manage to implement service workers
// we might keep them active a bit longer

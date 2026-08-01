const dc = require("diagnostics_channel");
module.exports = {
  ...dc,
  channel: dc.channel ? dc.channel.bind(dc) : () => ({ hasSubscribers: false, publish: () => {} }),
  tracingChannel: (dc.tracingChannel ? dc.tracingChannel.bind(dc) : () => ({
    hasSubscribers: false,
    subscribe: () => {},
    unsubscribe: () => {},
    tracePromise: async (fn) => fn(),
    traceSync: (fn) => fn(),
  }))
};

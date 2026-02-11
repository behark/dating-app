const rtl = require('@testing-library/react-native');

const fallbackWaitFor = async (callback, options = {}) => {
  const timeout = options.timeout ?? 1000;
  const interval = options.interval ?? 20;
  const startedAt = Date.now();

  while (Date.now() - startedAt < timeout) {
    try {
      callback();
      return;
    } catch {
      await new Promise((resolve) => setTimeout(resolve, interval));
    }
  }

  callback();
};

const waitForImpl = typeof rtl.waitFor === 'function' ? rtl.waitFor : fallbackWaitFor;

const renderHook = (callback, options) => {
  const hookResult = rtl.renderHook(callback, options);

  const waitForNextUpdate = async (timeout = 1000) => {
    const previousValue = hookResult.result.current;
    await waitForImpl(
      () => {
        if (hookResult.result.current === previousValue) {
          throw new Error('Hook has not updated yet');
        }
      },
      { timeout }
    );
  };

  return {
    ...hookResult,
    waitForNextUpdate,
  };
};

module.exports = {
  ...rtl,
  act: rtl.act,
  renderHook,
};


/* WEB Factory API Transport */
window.WF_API = (() => {
  let idToken = "";
  const pending = new Map();
  const frame = document.getElementById("api-frame");
  const form = document.getElementById("api-form");

  function setToken(token) {
    idToken = token || "";
  }

  function request(action, data = {}) {
    if (!idToken) {
      return Promise.reject(
        new Error("Silakan login dengan Google terlebih dahulu.")
      );
    }

    if (!window.WF_CONFIG.API_URL ||
        window.WF_CONFIG.API_URL.includes("PASTE_")) {
      return Promise.reject(
        new Error("API_URL belum dikonfigurasi di js/config.js.")
      );
    }

    const requestId = crypto.randomUUID();

    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        pending.delete(requestId);
        reject(new Error("API timeout. Respons Apps Script tidak diterima."));
      }, 60000);

      pending.set(requestId, { resolve, reject, timer });

      form.action = window.WF_CONFIG.API_URL;

      const envelope = {
        requestId,
        action,
        idToken,
        data
      };

      form.elements.payload.value = JSON.stringify(envelope);
      form.elements.channel.value = "web-factory-v2";
      form.submit();
    });
  }

  window.addEventListener("message", event => {
    console.log("WF DEBUG:", {
  sourceMatches: event.source === frame.contentWindow,
  responseId: event.data?.requestId,
  pendingIds: [...pending.keys()]
});
    console.log("WEB FACTORY MESSAGE:", event.origin, event.data);
    if (!frame || event.source !== frame.contentWindow) return;

    const msg = event.data;

    if (
      !msg ||
      msg.channel !== "web-factory-v2" ||
      !msg.requestId
    ) return;

    const item = pending.get(msg.requestId);
    if (!item) return;

    clearTimeout(item.timer);
    pending.delete(msg.requestId);

    if (msg.ok) {
      item.resolve(msg.result);
    } else {
      item.reject(new Error(msg.error || "API request failed."));
    }
  });

  return { setToken, request };
})();

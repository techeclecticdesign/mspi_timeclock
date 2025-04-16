export default class BarcodeScanner {
  constructor({
    prefix = "",
    suffix = "",
    timeout = 50,
    shouldCapture = () => true,
    barcodeCallback
  }) {
    this.buffer = "";
    this.lastEventTime = 0;
    this.options = { prefix, suffix, timeout, shouldCapture, barcodeCallback };
    this.timer = null;

    this.handleKeydown = this.handleKeydown.bind(this);
    this.init();
  }

  init() {
    window.addEventListener("keydown", this.handleKeydown);
  }

  handleKeydown(event) {
    if (!this.options.shouldCapture()) {
      return;
    }

    if (event.key === "Tab") {
      event.preventDefault();
    }

    const now = Date.now();

    if (now - this.lastEventTime > this.options.timeout) {
      this.buffer = "";
    }
    this.lastEventTime = now;
    this.buffer += event.key;

    if (this.timer) {
      clearTimeout(this.timer);
    }

    this.timer = setTimeout(() => {
      if (this.options.prefix && !this.buffer.startsWith(this.options.prefix)) {
        this.buffer = "";
        return;
      }
      if (this.options.suffix && !this.buffer.endsWith(this.options.suffix)) {
        this.buffer = "";
        return;
      }

      this.options.barcodeCallback(this.buffer);
      this.buffer = "";
      this.timer = null;
    }, this.options.timeout);
  }

  destroy() {
    window.removeEventListener("keydown", this.handleKeydown);
    if (this.timer) {
      clearTimeout(this.timer);
    }
  }
}

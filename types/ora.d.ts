declare module 'ora' {
  type OraOptions = { text?: string; spinner?: string };
  interface Ora {
    start(text?: string): this;
    succeed(): this;
    fail(): this;
    stop(): this;
  }
  function ora(options?: OraOptions): Ora;
  export default ora;
}

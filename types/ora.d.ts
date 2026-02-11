declare module 'ora' {
  interface OraOptions {
    text?: string;
    spinner?: string;
  }
  
  interface Ora {
    start(text?: string): this;
    succeed(text?: string): this;
    fail(text?: string): this;
    stop(): this;
    text: string;
  }
  
  function ora(options?: string | OraOptions): Ora;
  export default ora;
}

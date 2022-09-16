/**
 * This is a Next.js page.
 */
import { trpc } from "../utils/trpc";

interface ProxyCallbackOptions {
  path: string[];
  args: unknown[];
}
type ProxyCallback = (opts: ProxyCallbackOptions) => unknown;

function createProxyInner(callback: ProxyCallback, ...path: string[]) {
  const proxy: unknown = new Proxy(
    () => {
      // noop
    },
    {
      get(_obj, name) {
        if (typeof name === "string") {
          return createProxyInner(callback, ...path, name);
        }

        throw new Error("Not supported");
      },
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      apply(_1, _2, args) {
        return callback({
          args,
          path
        });
      }
    }
  );

  return proxy;
}

/**
 * Creates a proxy that calls the callback with the path and arguments
 * @internal
 */
export const createProxy = (callback: ProxyCallback) =>
  createProxyInner(callback);

// const proxy = new Proxy(obj, handler);
function createTypeOnlyProxy() {
  const proxy: unknown = new Proxy(() => {}, {
    get(_obj, name, _rec) {
      return createProxy(({ path, args }) => {
        const fullPath = [name, ...path];
        return {
          name,
          path,
          args,
          fullPath,
          fullPathDot: fullPath.join(".")
        };
      });
    }
  });

  return proxy as {
    dave: () => string;
    james: {
      smith: string;
      frank: () => void;
      tweet: {
        sweet: () => string;
      };
    };
  };
}

export default function IndexPage() {
  // 💡 Tip: CMD+Click (or CTRL+Click) on `greeting` to go to the server definition
  const result = trpc.greeting.useQuery({ name: "client" });

  const proxy = createTypeOnlyProxy();

  if (!result.data) {
    return (
      <div style={styles}>
        <h1>Loading...</h1>
      </div>
    );
  }
  return (
    <div style={styles}>
      {/**
       * The type is defined and can be autocompleted
       * 💡 Tip: Hover over `data` to see the result type
       * 💡 Tip: CMD+Click (or CTRL+Click) on `text` to go to the server definition
       * 💡 Tip: Secondary click on `text` and "Rename Symbol" to rename it both on the client & server
       */}
      <h1>{result.data.text}</h1>
      <pre>{JSON.stringify(proxy.dave(), null, 2)}</pre>
    </div>
  );
}

const styles = {
  width: "100vw",
  height: "100vh"
  // display: 'flex',
  // justifyContent: 'center',
  // alignItems: 'center',
};

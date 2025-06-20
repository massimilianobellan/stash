# Stash

A small state manager built for React that allows granular selection for state updates.

## How to use

Best usage of this library is through React's contexts

```ts
type MyStash = {
    count: number;
    incrementCount: () => void;
};

const CountContext = createContext<StashApi<MyStash> | null>(null);

function CounterContext({ children }: { children: ReactNode }) {
    const [stash] = useState(() =>
        create<MyStash>((set) => ({
        count: 0,
        incrementCount: () => {
            set(({ count }) => ({ count: count + 1 }));
        },
        }))
    );
    return (
        <CountContext.Provider value={stash}>{children}</CountContext.Provider>
    );
}
```

Then use the our custom React hook

```ts
function useCount() {
  const context = useContext(CountContext);
  if (!context) throw new Error("Did not use useCount in Context");
  return useStash(context);
}
```

Or through selectors

```ts
function useCount() {
  const context = useContext(CountContext);
  if (!context) throw new Error("Did not use useCount in Context");
  return useStash(context, ({ count }) => count);
}
```

It can then be consumed by any child and will be updated through the specified selectors.

```ts
function Component1() {
    const { count, incrementCount } = useCount1();

    return (
        <>
            <div>{count}</div>
            <button onClick={incrementCount}>
                Click
            </button>
        </>
    );
}
```

## Why use Stash?

- Rerenders components when needed even on non primitive context values
- Simple to use hooks and stash creations

## Why use Stash over Zustand / Jotai / Valtio / Nanostores?

- No reason to. All those libraries allow for very similar features and API structure while also allowing for middleware, custom equality functions and other framework support.

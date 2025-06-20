# Stash

A small state manager built for React that allows granular selection for state updates.

## How to use

You can create global states to be used in any react component

```ts
type MyStash = {
  count: number;
  incrementCount: () => void;
};

const stash = create<MyStash>((set) => ({
  count: 0,
  incrementCount: () => {
    set(({ count }) => ({ count: count + 1 }));
  },
}));
```

Then use the our custom React hook to subscribe and set the stash

```ts
function Component() {
    const { count, incrementCount } = useStash(stash);

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

You can also use our custom Strict Context helper to avoid global stores and use local instead.

```ts
type MyStash = {
    count: number;
    incrementCount: () => void;
};

const [useStash, StasthContext] = createStrictStash<MyStash>((set) => ({
    count: 0,
    incrementCount: () => {
        set(({ count }) => ({ count: count + 1 }));
    }
}));

function ParentComponent() {
    return (
      <StasthContext>
         <Component />
      </StasthContext>
    );
}

function Component() {
    const { count, incrementCount } = useStash(stash);

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
- Simple to use hooks for stash creation and context usage

## Why use Stash over Zustand / Jotai / Valtio / Nanostores?

- No reason to. All those libraries allow for very similar features and API structure while also allowing for middleware, custom equality functions and other framework support.

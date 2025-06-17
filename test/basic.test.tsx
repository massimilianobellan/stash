import { test, expect } from "vitest";
import { create } from "stash";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";

test("can create a store", async () => {
  type MyStash = {
    count: number;
    incrementCount: () => void;
  };

  function Component() {
    const [useStash] = useState(() =>
      create<MyStash>((set) => ({
        count: 0,
        incrementCount: () => {
          set(({ count }) => ({ count: count + 1 }));
        },
      }))
    );
    const { count, incrementCount } = useStash();

    return (
      <>
        <div>{count}</div>
        <button onClick={incrementCount}>Click</button>
      </>
    );
  }

  render(<Component />);

  await userEvent.click(screen.getByText("Click"));

  expect(screen.getByText("1")).toBeInTheDocument();
});

test("all components rerender", async () => {
  type MyStash = {
    count: number;
    incrementCount: () => void;
  };

  function ParentComponent() {
    const [useStash] = useState(() =>
      create<MyStash>((set) => ({
        count: 0,
        incrementCount: () => {
          set(({ count }) => ({ count: count + 1 }));
        },
      }))
    );

    return (
      <>
        <Component1 useStash={useStash} />
        <Component2 useStash={useStash} />
      </>
    );
  }

  function Component1({ useStash }: { useStash: () => MyStash }) {
    const { count, incrementCount } = useStash();

    return (
      <>
        <div>{count}</div>
        <button onClick={incrementCount}>Click</button>
      </>
    );
  }

  function Component2({ useStash }: { useStash: () => MyStash }) {
    const { count } = useStash();

    return (
      <>
        <div>{count}</div>
      </>
    );
  }

  render(<ParentComponent />);

  expect(screen.getAllByText("1")).toHaveLength(0);

  await userEvent.click(screen.getByText("Click"));

  expect(screen.getAllByText("1")).toHaveLength(2);
});

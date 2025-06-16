import { test, expect } from "vitest";
import { createStash, useStash } from "stash";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

test("it works", async () => {
  const createdStash = createStash({ count: 0, setCount: () => count + 1 });
  function Component() {
    const stash = useStash(createdStash);

    return (
      <>
        <div>{stash.count}</div>
        <button>Click</button>
      </>
    );
  }

  render(<Component />);

  await userEvent.click(screen.getByText("Click"));

  expect(screen.findByText("1")).toBeInTheDocument();
});

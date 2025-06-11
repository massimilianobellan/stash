import { test, expect } from "vitest";
import { createStash, useStash } from "stash";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

test("it works", async () => {
  const createdStash = createStash({ count: 0 });
  function Component() {
    const [stash, setStash] = useStash(createdStash);

    return (
      <>
        <div>{stash.count}</div>
        <button
          onClick={() =>
            setStash((curr) => {
              return { ...curr, count: curr.count + 1 };
            })
          }
        >
          Click
        </button>
      </>
    );
  }

  render(<Component />);

  await userEvent.click(screen.getByText("Click"));

  expect(screen.findByText("1")).toBeInTheDocument();
});

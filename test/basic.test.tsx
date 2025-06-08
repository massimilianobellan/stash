import { test, expect } from "vitest";
import { createStash } from "stash";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

test("it works", async () => {
  function Component() {
    const [getStash, setStash] = createStash({ count: 0 });
    return (
      <>
        <div>{getStash().count}</div>
        <button
          onClick={() =>
            setStash((curr) => {
              return { count: curr.count + 1 };
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

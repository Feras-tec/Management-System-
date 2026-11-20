// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ReviewForm } from "./ReviewForm";

afterEach(()=>{cleanup();vi.unstubAllGlobals();});
describe("ReviewForm",()=>{it("requires a valid rating and keeps a review pending on successful submission",async()=>{const fetchMock=vi.fn().mockResolvedValue(new Response(JSON.stringify({id:"r1",status:"PENDING"}),{status:201}));vi.stubGlobal("fetch",fetchMock);render(<ReviewForm language="en"/>);const user=userEvent.setup();await user.click(screen.getByRole("button",{name:"Write a review"}));await user.type(screen.getByLabelText("Name *"),"Ada L.");await user.type(screen.getByLabelText("Review *"),"A clear and helpful booking experience.");await user.click(screen.getByRole("radio",{name:"5 stars"}));await user.click(screen.getByRole("button",{name:"Submit for moderation"}));await waitFor(()=>expect(fetchMock).toHaveBeenCalledTimes(1));expect(JSON.parse(String(fetchMock.mock.calls[0]?.[1].body))).toMatchObject({customerName:"Ada L.",rating:5});expect(screen.getByRole("status")).toHaveTextContent("pending moderation");});it("offers keyboard-accessible German rating controls",async()=>{render(<ReviewForm language="de"/>);const user=userEvent.setup();await user.click(screen.getByRole("button",{name:"Bewertung schreiben"}));const star=screen.getByRole("radio",{name:"3 Sterne"});await user.click(star);expect(star).toBeChecked();await user.keyboard("{ArrowRight}{ArrowRight}");const selected=screen.getByRole("radio",{name:"5 Sterne"});expect(selected).toBeChecked();expect(selected).toHaveFocus();});});

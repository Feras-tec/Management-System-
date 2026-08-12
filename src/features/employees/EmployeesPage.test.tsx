// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import {QueryClient,QueryClientProvider} from "@tanstack/react-query";
import {cleanup,fireEvent,render,screen,waitFor,within} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import {afterEach,beforeEach,describe,expect,it,vi} from "vitest";
import {AppPreferencesProvider} from "../../context";
import {employeeApi,type Employee} from "./api";
import {EmployeesPageView} from "./EmployeesPage";

vi.mock("framer-motion",async importOriginal=>({...await importOriginal<typeof import("framer-motion")>(),useReducedMotion:()=>true}));
afterEach(cleanup);
const token=async()=>"session";
const employee:Employee={id:"e1",employeeNumber:"EMP-A1B2C3",userId:"u1",firstName:"Ada",lastName:"Lovelace",email:"ada@example.test",phone:"01761234567",position:"Technician",salaryMinor:325050,status:"ACTIVE",hiredAt:"2026-08-01T00:00:00.000Z",notes:null,createdAt:"2026-08-11T10:00:00.000Z",updatedAt:"2026-08-11T10:00:00.000Z",linkedUser:{id:"u1",role:"EMPLOYEE",isActive:true}};

function renderPage(role:"ADMIN"|"MANAGER"|"EMPLOYEE"="ADMIN"){
  if (!localStorage.getItem("language")) localStorage.setItem("language","en");
  vi.spyOn(employeeApi,"me").mockResolvedValue({user:{role}});
  const client=new QueryClient({defaultOptions:{queries:{retry:false},mutations:{retry:false}}});
  return render(<AppPreferencesProvider><QueryClientProvider client={client}><EmployeesPageView token={token}/></QueryClientProvider></AppPreferencesProvider>);
}

beforeEach(()=>{
  vi.restoreAllMocks();
  localStorage.setItem("language","en");
  Object.defineProperties(HTMLDialogElement.prototype,{showModal:{configurable:true,value(){this.setAttribute("open","")}},close:{configurable:true,value(){this.removeAttribute("open")}}});
  vi.spyOn(employeeApi,"list").mockResolvedValue({items:[employee],total:12,page:1,limit:10});
  vi.spyOn(employeeApi,"create").mockResolvedValue(employee);
  vi.spyOn(employeeApi,"update").mockResolvedValue(employee);
  vi.spyOn(employeeApi,"deactivate").mockResolvedValue({...employee,status:"INACTIVE"});
  vi.spyOn(employeeApi,"users").mockResolvedValue([{id:"u2",role:"EMPLOYEE",isActive:true,employee:null}]);
  vi.spyOn(employeeApi,"link").mockResolvedValue(employee);
  vi.spyOn(employeeApi,"unlink").mockResolvedValue({...employee,userId:null,linkedUser:null});
  vi.spyOn(employeeApi,"role").mockResolvedValue({id:"u1",role:"MANAGER",isActive:true});
  vi.spyOn(employeeApi,"access").mockResolvedValue({id:"u1",role:"EMPLOYEE",isActive:false});


});

describe("EmployeesPage",()=>{
  it("shows loading, list data, pagination and server-side search/filter",async()=>{
    let resolveList:(v:{items:Employee[];total:number;page:number;limit:number})=>void=()=>{};
    vi.spyOn(employeeApi,"list").mockImplementationOnce(()=>new Promise(resolve=>{resolveList=resolve}));
    renderPage();
    expect(screen.getByRole("status")).toBeInTheDocument();
    resolveList({items:[employee],total:12,page:1,limit:10});
    expect(await screen.findByText("Ada Lovelace")).toBeVisible();
    expect(screen.getByText("EMP-A1B2C3")).toBeVisible();
    const user=userEvent.setup();
    await user.type(screen.getByPlaceholderText("Search name, number or position"),"ada");
    await waitFor(()=>expect(employeeApi.list).toHaveBeenLastCalledWith(token,expect.stringContaining("search=ada")));
    await user.selectOptions(screen.getByRole("combobox",{name:"Status filter"}),"ACTIVE");
    await waitFor(()=>expect(employeeApi.list).toHaveBeenLastCalledWith(token,expect.stringContaining("status=ACTIVE")));
    await user.click(screen.getByRole("button",{name:"Next"}));
    await waitFor(()=>expect(employeeApi.list).toHaveBeenLastCalledWith(token,expect.stringContaining("page=2")));
  });

  it("shows error and empty states",async()=>{
    vi.spyOn(employeeApi,"list").mockRejectedValueOnce(new Error("FAIL"));
    renderPage();
    expect(await screen.findByText("Employees could not be loaded.")).toBeVisible();
    cleanup();
    vi.spyOn(employeeApi,"list").mockResolvedValueOnce({items:[],total:0,page:1,limit:10});
    renderPage();
    expect(await screen.findByText("No employees found.")).toBeVisible();
  });

  it("validates create and converts EUR salary to minor units",async()=>{
    renderPage();
    const user=userEvent.setup();
    await screen.findByText("Ada Lovelace");
    await user.click(screen.getByRole("button",{name:"Create employee"}));
    await user.click(screen.getByRole("button",{name:"Save"}));
    expect(screen.getByText("Please check all required fields.")).toBeVisible();
    const dialog=screen.getByRole("heading",{name:"Create employee"}).parentElement!;
    const inputs=within(dialog).getAllByRole("textbox");
    await user.type(inputs[0]!,"Grace");
    await user.type(inputs[1]!,"Hopper");
    await user.type(inputs[4]!,"Manager");
    await user.type(within(dialog).getByRole("spinbutton"),"1234.56");
    await user.click(within(dialog).getByRole("button",{name:"Save"}));
    await waitFor(()=>expect(employeeApi.create).toHaveBeenCalledWith(token,expect.objectContaining({firstName:"Grace",lastName:"Hopper",position:"Manager",salaryMinor:123456})));
  });

  it("edits operational metadata and keeps employee status separate from access",async()=>{
    renderPage();
    const user=userEvent.setup();
    await screen.findByText("Ada Lovelace");
    await user.click(screen.getByRole("button",{name:"Edit"}));
    const dialog=screen.getByRole("heading",{name:"Edit employee"}).parentElement!;
    const position=within(dialog).getByDisplayValue("Technician");
    await user.clear(position);
    await user.type(position,"Lead Technician");
    await user.click(within(dialog).getByRole("button",{name:"Save"}));
    await waitFor(()=>expect(employeeApi.update).toHaveBeenCalledWith(token,"e1",expect.objectContaining({position:"Lead Technician"})));
    expect(employeeApi.access).not.toHaveBeenCalled();
  });

  it("warns that deactivation leaves linked user access active",async()=>{
    renderPage();
    const user=userEvent.setup();
    await screen.findByText("Ada Lovelace");
    await user.click(screen.getByRole("button",{name:"Deactivate"}));
    expect(screen.getByText("The system account will remain active.")).toBeVisible();
    await user.click(screen.getByRole("button",{name:"Confirm deactivation"}));
    await waitFor(()=>expect(employeeApi.deactivate).toHaveBeenCalledWith(token,"e1"));
    expect(employeeApi.access).not.toHaveBeenCalled();
  });

  it("shows link, role, access and unlink controls only to ADMIN",async()=>{
    renderPage("ADMIN");
    const user=userEvent.setup();
    await screen.findByText("Ada Lovelace");
    await user.click(screen.getByRole("button",{name:"Access"}));
    expect(screen.getByText("Role: Employee")).toBeVisible();
    await user.selectOptions(screen.getByRole("combobox",{name:"New role"}),"MANAGER");
    await user.click(screen.getByRole("button",{name:"Change role"}));
    await user.click(screen.getByRole("button",{name:"Confirm"}));
    await waitFor(()=>expect(employeeApi.role).toHaveBeenCalledWith(token,"u1","MANAGER"));
    cleanup();
    renderPage("MANAGER");
    await screen.findByText("Ada Lovelace");
    expect(screen.queryByRole("button",{name:"Access"})).not.toBeInTheDocument();
    expect(screen.queryByRole("button",{name:"Create employee"})).not.toBeInTheDocument();
  });
  it("renders a card summary and ADMIN-only EUR salary details", async () => {
    renderPage("ADMIN");
    const user = userEvent.setup();
    await screen.findByText("Ada Lovelace");
    expect(screen.getByText("EMP-A1B2C3")).toBeVisible();
    expect(screen.getByText("Technician")).toBeVisible();
    expect(screen.getByText("Employee · Access active")).toBeVisible();
    await user.click(screen.getByRole("button", { name: "Details" }));
    expect(screen.getByText("Employee number")).toBeInTheDocument();
    expect(screen.getByText("€3,250.50")).toBeInTheDocument();
  });

  it("does not render salary controls or salary details for a manager", async () => {
    renderPage("MANAGER");
    const user = userEvent.setup();
    await screen.findByText("Ada Lovelace");
    await user.click(screen.getByRole("button", { name: "Details" }));
    expect(screen.queryByText("Salary")).not.toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Close" }));
    await user.click(screen.getByRole("button", { name: "Edit" }));
    expect(screen.queryByText("Salary (EUR)")).not.toBeInTheDocument();
  });

  it("uses German card and details labels", async () => {
    localStorage.setItem("language", "de");
    renderPage("ADMIN");
    const user = userEvent.setup();
    expect(await screen.findByText("Mitarbeiter")).toBeVisible();
    await screen.findByText("Ada Lovelace");
    await user.click(screen.getByRole("button", { name: "Details ansehen" }));
    expect(screen.getByText("Mitarbeiternummer")).toBeInTheDocument();
    expect(screen.getByText("Gehalt")).toBeInTheDocument();
  });
  it("opens employee details from the Details control", async () => {
    renderPage();
    const user=userEvent.setup();
    await screen.findByText("Ada Lovelace");
    await user.click(screen.getByRole("button",{name:"Details"}));
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(within(screen.getByRole("dialog")).getByRole("heading",{name:"Ada Lovelace"})).toBeInTheDocument();
  });

  it("closes employee details with the Close button", async () => {
    renderPage();
    const user=userEvent.setup();
    await screen.findByText("Ada Lovelace");
    await user.click(screen.getByRole("button",{name:"Details"}));
    await user.click(screen.getByRole("button",{name:"Close"}));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("closes employee details when the dialog backdrop is clicked", async () => {
    renderPage();
    const user=userEvent.setup();
    await screen.findByText("Ada Lovelace");
    await user.click(screen.getByRole("button",{name:"Details"}));
    fireEvent.click(screen.getByRole("dialog"));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("closes employee details on Escape", async () => {
    renderPage();
    const user=userEvent.setup();
    await screen.findByText("Ada Lovelace");
    await user.click(screen.getByRole("button",{name:"Details"}));
    fireEvent(screen.getByRole("dialog"),new Event("cancel",{bubbles:true,cancelable:true}));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("keeps employee details open when content inside the dialog is clicked", async () => {
    renderPage();
    const user=userEvent.setup();
    await screen.findByText("Ada Lovelace");
    await user.click(screen.getByRole("button",{name:"Details"}));
    fireEvent.click(screen.getByText("Employee number"));
    expect(screen.getByRole("dialog")).toBeInTheDocument();
  });

});

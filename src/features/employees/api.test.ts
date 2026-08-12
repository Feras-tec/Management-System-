import {afterEach,describe,expect,it,vi} from "vitest";
import {employeeApi} from "./api";

afterEach(()=>vi.unstubAllGlobals());

describe("employeeApi",()=>{
  it("uses the configured backend and Clerk bearer token, never DummyJSON",async()=>{
    const fetchMock=vi.fn().mockResolvedValue(new Response(JSON.stringify({items:[],total:0,page:1,limit:10}),{status:200}));
    vi.stubGlobal("fetch",fetchMock);
    await employeeApi.list(async()=>"employee-session","page=1");
    const [request,init]=fetchMock.mock.calls[0] as [URL,RequestInit];
    expect(String(request)).toContain("/api/v1/employees?page=1");
    expect(String(request)).not.toContain("dummyjson");
    expect(init.headers).toMatchObject({Authorization:"Bearer employee-session"});
  });

  it("does not send JSON content type for bodyless deactivate and unlink requests",async()=>{
    const fetchMock=vi.fn().mockImplementation(()=>Promise.resolve(new Response(JSON.stringify({id:"employee-1"}),{status:200})));
    vi.stubGlobal("fetch",fetchMock);
    await employeeApi.deactivate(async()=>"session","employee-1");
    await employeeApi.unlink(async()=>"session","employee-1");
    expect((fetchMock.mock.calls[0]?.[1] as RequestInit).headers).not.toHaveProperty("Content-Type");
    expect((fetchMock.mock.calls[1]?.[1] as RequestInit).headers).not.toHaveProperty("Content-Type");
  });

  it("surfaces nested backend domain error codes",async()=>{
    vi.stubGlobal("fetch",vi.fn().mockResolvedValue(new Response(JSON.stringify({error:{code:"LAST_ADMIN_PROTECTED"}}),{status:409})));
    await expect(employeeApi.role(async()=>"session","user-1","MANAGER")).rejects.toThrow("LAST_ADMIN_PROTECTED");
  });
});

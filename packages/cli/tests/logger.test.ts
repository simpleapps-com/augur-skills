import { describe, it, expect, vi, beforeEach } from "vitest";
import { logger } from "../src/utils/logger.js";

describe("logger", () => {
  beforeEach(() => {
    vi.spyOn(console, "log").mockImplementation(() => {});
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  it("logs info messages", () => {
    logger.info("test message");
    expect(console.log).toHaveBeenCalledOnce();
    expect(vi.mocked(console.log).mock.calls[0][1]).toBe("test message");
  });

  it("logs success messages", () => {
    logger.success("done");
    expect(console.log).toHaveBeenCalledOnce();
    expect(vi.mocked(console.log).mock.calls[0][1]).toBe("done");
  });

  it("logs warn messages", () => {
    logger.warn("careful");
    expect(console.log).toHaveBeenCalledOnce();
    expect(vi.mocked(console.log).mock.calls[0][1]).toBe("careful");
  });

  it("logs error messages to stderr", () => {
    logger.error("fail");
    expect(console.error).toHaveBeenCalledOnce();
    expect(vi.mocked(console.error).mock.calls[0][1]).toBe("fail");
  });
});

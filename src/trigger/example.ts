import { task } from "@trigger.dev/sdk/v3";

export const helloWorldTask = task({
  id: "hello-world",
  run: async (payload: { message: string }) => {
    console.log("Hello, World!", payload.message);
    return { success: true, message: payload.message };
  },
});

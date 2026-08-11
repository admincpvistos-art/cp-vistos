import { router } from "./trpc";
import { userRouter } from "./routers/user";
import { collaboratorRouter } from "./routers/collaborator";
import { clientRouter } from "./routers/client";
import { formsRouter } from "./routers/forms";
import { notificationRouter } from "./routers/notification";
import { websiteRouter } from "./routers/website";
import { financeRouter } from "./routers/finance";
import { serviceCostRouter } from "./routers/service-cost";

export const appRouter = router({
  userRouter,
  collaboratorRouter,
  clientRouter,
  formsRouter,
  notificationRouter,
  websiteRouter,
  financeRouter,
  serviceCostRouter,
});

export type AppRouter = typeof appRouter;

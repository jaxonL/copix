import { authorize } from "@liveblocks/node";

// Replace this key with your secret key provided at
// https://liveblocks.io/dashboard/projects/{projectId}/apikeys
// eslint-disable-next-line  @typescript-eslint/no-non-null-assertion
const secret: string = process.env.NEXT_PUBLIC_LIVEBLOCKS_PRIVATE_KEY!;

export default async function auth(req: any, res: any) {
  /**
   * Implement your own security here.
   *
   * It's your responsibility to ensure that the caller of this endpoint
   * is a valid user by validating the cookies or authentication headers
   * and that it has access to the requested room.
   */
  const room = req.body.room;
  const response = await authorize({
    room,
    secret,
    // Corresponds to the UserMeta[id] type defined in liveblocks.config.ts
    userId: "123",
    groupIds: ["456"], // Optional
    userInfo: {
      // Optional, corresponds to the UserMeta[info] type defined in liveblocks.config.ts
      name: "Ada Lovelace",
      color: "red",
    },
  });
  return res.status(response.status).end(response.body);
}

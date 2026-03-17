import { Hono } from "hono";
import { redisClient } from "modules";
import { isNonNullish } from "../helpers/data.ts";

const equipmentRoute = new Hono();

type PostEquipmentBody = {
  latitude: number;
  longitude: number;
  type: string;
  hull_number: string;
  checkDist?: boolean;
};

export type RedisEquipmentRadius = {
  member: string;
  distance?: string | undefined;
  hash?: number | undefined;
  coordinates?:
    | {
        longitude: number;
        latitude: number;
      }
    | undefined;
};

equipmentRoute.get("/", async (c) => {
  const excas = await redisClient.geoRadiusWith(
    "Excavator",
    {
      longitude: 121.8117801607159,
      latitude: -3.0019732368024847,
    },
    80,
    "km",
    ["WITHCOORD", "WITHDIST"],
  );

  return c.json({
    data: excas,
  });
});

equipmentRoute.get("/data", (c) => {
  return c.json({
    message: "/data",
  });
});

equipmentRoute.post("/", async (c) => {
  const body = await c.req.json<PostEquipmentBody>();

  let res: number | Array<RedisEquipmentRadius> = 0;

  if (isNonNullish(body.checkDist) && body.checkDist) {
    res = await redisClient.geoRadiusWith(
      "Excavator",
      {
        latitude: body.latitude,
        longitude: body.longitude,
      },
      10,
      "m",
      ["WITHDIST", "WITHCOORD"],
    );
  } else {
    res = await redisClient.geoAdd(body.type, {
      latitude: body.latitude,
      longitude: body.longitude,
      member: body.hull_number,
    });
  }

  return c.json({
    data: res,
    status: res === 1,
  });
});

export default equipmentRoute;

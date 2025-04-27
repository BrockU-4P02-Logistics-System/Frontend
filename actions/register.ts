"use server";

import { connectDB } from "@/lib/mongodb";
import User from "@/models/User";
import mongoose from "mongoose";
import * as mongodb from "mongodb";
import { promisify } from "util";
import * as zlib from "zlib";

const gzip = promisify(zlib.gzip);
const gunzip = promisify(zlib.gunzip);

const { MONGODB_URI } = process.env;

// Define interfaces for the route data structure
interface RouteStep {
  instruction: string;
  distance: string;
  duration: string;
}

interface MarkerLocation {
  address: string;
  latitude: number;
  longitude: number;
  note?: string;
  arrivalTime?: string;
  departureTime?: string;
  driverId?: number;
}

interface DriverRoute {
  driverId: number;
  markers: MarkerLocation[];
  routePath: Array<{ lat: number; lng: number }>;
  straightLinePaths?: Array<{
    origin: { lat: number; lng: number };
    destination: { lat: number; lng: number };
  }>;
  directions: RouteStep[];
  totalDistance: string;
  totalDuration: string;
  color: string;
}

interface RouteData {
  timestamp: string;
  config: Record<string, unknown>;
  numDrivers: number;
  markers: MarkerLocation[];
  driverRoutes: DriverRoute[];
  routes?: { driverId: number; stops: MarkerLocation[] }[];
  totalDrivers?: number;
  route?: MarkerLocation[];
  name?: string;
}

interface RouteTuple {
  name: string;
  id: string;
}

interface RoutesResponse {
  routes: RouteTuple[];
}

// Define the User interface for TypeScript
interface UserDocument {
  email: string;
  routes: [string, string][];
  credits?: number;
  fleet?: [string, string, string][];
  username: string;
  password: string;
  org_address?: string;
  org_name?: string;
  org_phone?: string;
  org_site?: string;
  __v?: number;
  _id?: mongoose.Types.ObjectId;
}

export const register = async (values: {
  email: string;
  password: string;
  username: string;
  org_address?: string;
  org_name?: string;
  org_phone?: string;
  org_site?: string;
}): Promise<{ error?: string }> => {
  let { email, password, username, org_address, org_name, org_phone, org_site } = values;
  email = email.toLowerCase();
  const re = /^(?=.*[0-9])(?=.*[a-z])(?=.*[A-Z])(?=.*\W)(?!.* ).{8,16}$/;
  const re2 = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/;

  try {
    if (!email || !password || !username) {
      return { error: "One or more fields are empty" };
    }

    if (!re.test(password)) {
      return { error: "Invalid password" };
    }

    if (!re2.test(email)) {
      return { error: "Invalid email" };
    }

    await connectDB();

    const userFound = await User.findOne<UserDocument>({ email });
    if (userFound) {
      return { error: "Email already exists!" };
    }

    const fleet: [string, string, string][] = [["Example Car", "Driver 1", "test@gmail.com"]];
    const credits = 0;
    const routes: [string, string][] = [];

    const user = new User({
      username,
      email,
      password,
      org_address,
      org_name,
      org_phone,
      org_site,
      fleet,
      credits,
      routes,
    });

    await user.save();
    return {};
  } catch (e) {
    console.error("Error in register:", e);
    throw e;
  }
};

export const save_route = async (auth: string, data: string, name: string): Promise<boolean> => {
  const url = MONGODB_URI as string;
  const client = new mongodb.MongoClient(url);

  try {
    await client.connect();
    const db = client.db("reroute");

    let routeData: RouteData;
    try {
      routeData = JSON.parse(data) as RouteData;
      if (!routeData.timestamp) {
        routeData.timestamp = new Date().toISOString();
      }
    } catch (parseError) {
      console.error("Error parsing route data:", parseError);
      return false;
    }

    const storageObject = {
      data: routeData,
      name,
      _id: new mongodb.ObjectId(),
    };

    await db.collection("routes").insertOne(storageObject);

    const updateResult = await User.findOneAndUpdate(
      { email: auth },
      { $push: { routes: [name, storageObject._id.toString()] } }
    );

    if (!updateResult) {
      console.warn(`User with email ${auth} not found when saving route`);
      return false;
    }

    return true;
  } catch (e) {
    console.error("Error saving route:", e);
    return false;
  } finally {
    await client.close();
  }
};

export const get_routes = async (auth: string): Promise<string> => {
  const url = MONGODB_URI as string;
  const client = new mongodb.MongoClient(url);

  try {
    await client.connect();
    const db = client.db("reroute");

    const user = await User.findOne<UserDocument>({ email: auth }, { routes: 1, _id: 0 }).lean();
    if (!user || !user.routes) {
      return JSON.stringify({ routes: [] } as RoutesResponse);
    }

    const validRoutes: RouteTuple[] = [];
    for (const [name, routeId] of user.routes) {
      try {
        const routeDoc = await db.collection("routes").findOne({ _id: new mongodb.ObjectId(routeId) });
        if (routeDoc) {
          validRoutes.push({ name, id: routeId });
        } else {
          console.warn(`Route ${routeId} (name: ${name}) not found in routes collection, removing from user routes`);
          await User.findOneAndUpdate(
            { email: auth },
            { $pull: { routes: [name, routeId] } }
          );
        }
      } catch (error) {
        console.error(`Error validating route ${routeId}:`, error);
        continue;
      }
    }

    return JSON.stringify({ routes: validRoutes } as RoutesResponse);
  } catch (e) {
    console.error("Error in get_routes:", e);
    return JSON.stringify({ routes: [] } as RoutesResponse);
  } finally {
    await client.close();
  }
};

export const remove_route = async (auth: string, name: string, routeId: string): Promise<boolean> => {
  const url = MONGODB_URI as string;
  const client = new mongodb.MongoClient(url);

  try {
    await client.connect();
    const db = client.db("reroute");
    const session = client.startSession();

    let success = false;

    await session.withTransaction(async () => {
      const query = new mongodb.ObjectId(routeId);

      const routeResult = await db.collection("routes").deleteOne({ _id: query }, { session });
      if (routeResult.deletedCount === 0) {
        throw new Error("Route not found in routes collection");
      }

      const userResult = await User.findOneAndUpdate(
        { email: auth },
        { $pull: { routes: [name, routeId] } },
        { session }
      );

      if (!userResult) {
        throw new Error("User not found");
      }

      success = true;
    });

    return success;
  } catch (e) {
    console.error("Error removing route:", e);
    return false;
  } finally {
    await client.close();
  }
};

export const load_route_name = async (name: string, auth: string): Promise<string> => {
  const url = MONGODB_URI as string;
  const client = new mongodb.MongoClient(url);

  try {
    await client.connect();
    const db = client.db("reroute");

    const user = await User.findOne<UserDocument>(
      { email: auth, routes: { $elemMatch: { $elemMatch: { $eq: name } } } },
      { routes: 1 }
    ).lean();

    if (!user || !user.routes || user.routes.length === 0) {
      console.log(`No route named ${name} found for user ${auth}`);
      return "";
    }

    const routeTuple = user.routes.find((route: [string, string]) => route[0] === name);
    if (!routeTuple) {
      console.log(`No route named ${name} found in user ${auth}'s routes`);
      return "";
    }

    const routeId = routeTuple[1];
    const routeDoc = await db.collection("routes").findOne({
      _id: new mongodb.ObjectId(routeId),
    });

    if (!routeDoc) {
      console.log(`Route ${routeId} not found in routes collection`);
      await User.findOneAndUpdate(
        { email: auth },
        { $pull: { routes: [name, routeId] } }
      );
      return "";
    }

    const routeData = routeDoc.data || {};
    return typeof routeData === "string" ? routeData : JSON.stringify(routeData);
  } catch (e) {
    console.error("Error loading route by name:", e);
    return "";
  } finally {
    await client.close();
  }
};

export const load_route = async (routeId: string): Promise<string> => {
  const url = MONGODB_URI as string;
  const client = new mongodb.MongoClient(url);

  try {
    await client.connect();
    const db = client.db("reroute");

    const query = new mongodb.ObjectId(routeId);
    const routeDoc = await db.collection("routes").findOne({ _id: query });

    if (!routeDoc) {
      console.log(`Route ${routeId} not found`);
      return "";
    }

    const routeData = routeDoc.data || {};
    return typeof routeData === "string" ? routeData : JSON.stringify(routeData);
  } catch (e) {
    console.error("Error loading route:", e);
    return "";
  } finally {
    await client.close();
  }
};

export const num_routes = async (auth: string): Promise<boolean> => {
  try {
    await connectDB();

    const users = await User.find<UserDocument>({ email: auth }, { routes: 1, _id: 0 }).lean();
    
    if (!users || users.length === 0) {
      console.warn(`No user found with email: ${auth}`);
      return false;
    }

    const user = users[0];
    return user.routes.length < 6;
  } catch (e) {
    console.error("Error in num_routes:", e);
    throw e;
  }
};

export const add_credits = async (auth: string, increment: number): Promise<void> => {
  try {
    await connectDB();

    const updateResult = await User.findOneAndUpdate<UserDocument>(
      { email: auth },
      { $inc: { credits: increment } }
    );

    if (!updateResult) {
      console.warn(`User with email ${auth} not found when adding credits`);
      throw new Error("User not found");
    }

    const updatedCredits = await check_credits(auth);
    console.log(`Updated credits for ${auth}: ${updatedCredits}`);
  } catch (e) {
    console.error("Error in add_credits:", e);
    throw e;
  }
};

export const check_credits = async (auth: string): Promise<number | null> => {
  try {
    await connectDB();

    const user = await User.findOne<UserDocument>({ email: auth }, { credits: 1, _id: 0 }).lean();

    if (!user || typeof user.credits !== "number") {
      console.warn(`User with email ${auth} not found or credits not set`);
      return null;
    }

    return user.credits;
  } catch (e) {
    console.error("Error in check_credits:", e);
    return null;
  }
};

export const remove_credits = async (auth: string, increment: number): Promise<void> => {
  try {
    await connectDB();

    const updateResult = await User.findOneAndUpdate<UserDocument>(
      { email: auth },
      { $inc: { credits: increment } }
    );

    if (!updateResult) {
      console.warn(`User with email ${auth} not found when removing credits`);
      throw new Error("User not found");
    }
  } catch (e) {
    console.error("Error in remove_credits:", e);
    throw e;
  }
};

interface RegisterVehicleValues {
  auth: string;
  name: string;
  driver: string;
  email: string;
}

export const register_vehicle = async (values: RegisterVehicleValues): Promise<{ error?: string }> => {
  const { auth, name, driver, email } = values;
  const re2 = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/;

  try {
    if (!auth || !name || !driver || !email) {
      return { error: "One or more fields are empty" };
    }

    if (!re2.test(email)) {
      return { error: "Invalid email" };
    }

    await connectDB();

    const updateResult = await User.findOneAndUpdate<UserDocument>(
      { email: auth },
      { $push: { fleet: [name, driver, email] } }
    );

    if (!updateResult) {
      console.warn(`User with email ${auth} not found when registering vehicle`);
      return { error: "User not found" };
    }

    return {};
  } catch (e) {
    console.error("Error in register_vehicle:", e);
    return { error: "Failed to register vehicle" };
  }
};

export const get_fleet = async (auth: string): Promise<string> => {
  try {
    await connectDB();

    const user = await User.findOne<UserDocument>({ email: auth }, { fleet: 1, _id: 0 }).lean();

    if (!user || !user.fleet) {
      return JSON.stringify({ fleet: [] });
    }

    return JSON.stringify(user);
  } catch (e) {
    console.error("Error in get_fleet:", e);
    return JSON.stringify({ fleet: [] });
  }
};

export const remove_vehicle = async (auth: string, vehicle: [string, string, string]): Promise<void> => {
  try {
    await connectDB();

    const updateResult = await User.findOneAndUpdate<UserDocument>(
      { email: auth },
      { $pull: { fleet: vehicle } }
    );

    if (!updateResult) {
      console.warn(`User with email ${auth} not found when removing vehicle`);
      throw new Error("User not found");
    }
  } catch (e) {
    console.error("Error in remove_vehicle:", e);
    throw e;
  }
};